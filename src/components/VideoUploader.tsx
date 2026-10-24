"use client";

import { useState, useRef } from "react";
import { UploadCloud, Video, X, Check, Link as LinkIcon, Film, Play, AlertCircle } from "lucide-react";

interface VideoUploaderProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

export default function VideoUploader({
  value,
  onChange,
  label = "Project Demo / Pitch Video",
  required = false,
}: VideoUploaderProps) {
  const [mode, setMode] = useState<"file" | "url">(
    value && (value.includes("youtube.com") || value.includes("youtu.be") || value.includes("vimeo.com"))
      ? "url"
      : "file"
  );
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|ogg|mkv)$/i)) {
      alert("Please upload a valid video file (MP4, WebM, MOV)");
      return;
    }

    setLoading(true);
    setFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(sizeMb + " MB");

    // Fast streaming multipart upload directly to /api/upload
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Direct upload failed, falling back to local URL:", err);
    }

    // Fallback if network or disk failed
    try {
      const localUrl = URL.createObjectURL(file);
      onChange(localUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function clearVideo() {
    onChange("");
    setFileName("");
    setFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const isYouTube = value.includes("youtube.com") || value.includes("youtu.be");
  let ytEmbedUrl = "";
  if (isYouTube) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = value.match(regExp);
    if (match && match[2].length === 11) {
      ytEmbedUrl = `https://www.youtube.com/embed/${match[2]}`;
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
          {label} {required && <span className="text-cyan-400 font-extrabold">* (Required)</span>}
        </label>
        <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              mode === "file" ? "bg-cyan-400 text-black font-bold" : "text-white/60 hover:text-white"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              mode === "url" ? "bg-cyan-400 text-black font-bold" : "text-white/60 hover:text-white"
            }`}
          >
            Video URL
          </button>
        </div>
      </div>

      {mode === "file" ? (
        <div>
          {value ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/60 p-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                {isYouTube && ytEmbedUrl ? (
                  <iframe
                    src={ytEmbedUrl}
                    title="YouTube video player"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={value}
                    controls
                    className="h-full w-full object-contain"
                    preload="metadata"
                  />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white truncate max-w-[220px]">
                    {fileName || "Demo Pitch Video"}
                  </span>
                  {fileSize && (
                    <span className="font-mono text-[10px] text-white/50">({fileSize})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition"
                  >
                    Replace Video
                  </button>
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="rounded-lg bg-rose-500/20 p-1 text-rose-300 hover:bg-rose-500/30 transition"
                    title="Remove Video"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                dragOver
                  ? "border-cyan-400 bg-cyan-400/10"
                  : required
                  ? "border-cyan-400/40 bg-black/40 hover:border-cyan-400/70"
                  : "border-white/15 bg-black/40 hover:border-white/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-white">
                {loading ? "Reading and encoding video…" : "Click or Drag & Drop to Upload Video File"}
              </div>
              <p className="mt-1 text-[11px] text-white/45 max-w-xs">
                Supports MP4, WebM, MOV pitch videos and product demonstrations.
              </p>
              <button
                type="button"
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-extrabold text-black hover:bg-white transition shadow-lg"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Upload Video File {required && "*"}</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="url"
              required={required}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/... or MP4 link"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          {value && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-white/10">
              {isYouTube && ytEmbedUrl ? (
                <iframe
                  src={ytEmbedUrl}
                  title="YouTube video player"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={value} controls className="h-full w-full object-contain" />
              )}
            </div>
          )}
        </div>
      )}

      {required && !value && (
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Pitch or demo video is required for jury evaluation.</span>
        </div>
      )}
    </div>
  );
}
