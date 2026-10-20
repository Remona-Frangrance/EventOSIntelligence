"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Check, Link as LinkIcon } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = "Project Banner / Screenshot Image",
}: ImageUploaderProps) {
  const [tab, setTab] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to Base64 data URL
  function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize if larger than 1200px width
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onChange(dataUrl);
        } else {
          onChange(e.target?.result as string);
        }
        setLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-white/80">{label}</label>
        <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-bold transition ${
              tab === "upload" ? "bg-cyan-400 text-black" : "text-white/50 hover:text-white"
            }`}
          >
            <UploadCloud className="h-3 w-3" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-bold transition ${
              tab === "url" ? "bg-cyan-400 text-black" : "text-white/50 hover:text-white"
            }`}
          >
            <LinkIcon className="h-3 w-3" /> Image URL
          </button>
        </div>
      </div>

      {tab === "upload" ? (
        <div>
          {value ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/50 p-2">
              <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black">
                <img src={value} alt="Project banner preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 text-[11px] font-mono text-emerald-300 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Image attached successfully
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Change Image File
                </button>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
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
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                dragOver
                  ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  : "border-white/20 bg-black/40 hover:border-cyan-400/60 hover:bg-white/[0.03]"
              }`}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-2 text-xs font-bold text-white">
                {loading ? "Processing image…" : "Click or drag & drop project screenshot / banner"}
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">Supports PNG, JPG, WebP up to 10MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative">
          <ImageIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400"
          />
        </div>
      )}
    </div>
  );
}
