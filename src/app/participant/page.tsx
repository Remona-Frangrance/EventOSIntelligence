"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import QrCode from "@/components/QrCode";
import ImageUploader from "@/components/ImageUploader";
import {
  Sparkles,
  ExternalLink,
  Code2,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  Trophy,
  Eye,
  ScanLine,
  Heart,
  Save,
  Plus,
  Trash2,
  Award,
  Video,
  Gavel,
  Star,
  MapPin,
  Layers,
} from "lucide-react";

export default function ParticipantDashboard() {
  const router = useRouter();
  const { user, isParticipant, isAdmin } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Editable form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI/ML");
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [members, setMembers] = useState<{ name: string; role: string }[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Developer");

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      try {
        let p = null;
        if (user?.id) {
          const res = await fetch(`/api/projects?userId=${user.id}`);
          p = await res.json();
        }

        // If not found by userId or user has projectId
        if (!p && user?.projectId) {
          const res = await fetch(`/api/projects`);
          const all = await res.json();
          p = all.find((item: any) => item.id === user.projectId);
        }

        // If still not found, fallback to first project for demonstration
        if (!p) {
          const res = await fetch("/api/projects");
          const all = await res.json();
          if (Array.isArray(all) && all.length > 0) {
            p = all[0];
          }
        }

        if (p) {
          setProject(p);
          setTitle(p.title || "");
          setCategory(p.category || "AI/ML");
          setTeamName(p.teamName || "");
          setDescription(p.description || "");
          setImageUrl(p.imageUrl || "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80");
          setDemoUrl(p.demoUrl || "");
          setRepoUrl(p.repoUrl || "");
          setVideoUrl(p.videoUrl || "");
          setTechStackInput(Array.isArray(p.techStack) ? p.techStack.join(", ") : "");
          setMembers(Array.isArray(p.members) ? p.members : []);

          // Fetch scores, judges, and visitor feedbacks for this project
          const [scoreData, judgeData, fbData] = await Promise.all([
            fetch(`/api/scores?projectId=${p.id}`).then((r) => r.json()).catch(() => []),
            fetch(`/api/judges?eventId=${p.eventId}`).then((r) => r.json()).catch(() => []),
            fetch(`/api/feedback?projectId=${p.id}`).then((r) => r.json()).catch(() => []),
          ]);
          setScores(Array.isArray(scoreData) ? scoreData : []);
          setJudges(Array.isArray(judgeData) ? judgeData : []);
          setFeedbacks(Array.isArray(fbData) ? fbData : []);
        }
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [user]);

  function addMember() {
    if (!newMemberName.trim()) return;
    setMembers([...members, { name: newMemberName.trim(), role: newMemberRole.trim() }]);
    setNewMemberName("");
  }

  function removeMember(index: number) {
    setMembers(members.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    setSaveSuccess(false);

    const techArray = techStackInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          title,
          category,
          teamName,
          description,
          imageUrl,
          demoUrl,
          repoUrl,
          videoUrl,
          techStack: techArray,
          members,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProject({ ...project, ...updated, techStack: techArray, members });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 text-center">
        <div className="glass-strong rounded-3xl p-12 animate-pulse text-white/60">
          Loading participant workspace…
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 pb-28 pt-28">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/4 top-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-600/15 blur-[150px]" />
      <div className="pointer-events-none absolute right-10 top-32 h-[350px] w-[500px] rounded-full bg-[#c8f31d]/10 blur-[130px]" />

      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono rounded-lg bg-cyan-400/20 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-cyan-300">
                🚀 Participant Studio
              </span>
              <span className="font-mono rounded-lg bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70">
                Booth {project?.boothNo || "B-1"}
              </span>
              <span className="font-mono rounded-lg bg-[#c8f31d]/20 px-2.5 py-0.5 text-[11px] text-[#c8f31d]">
                Code: {project?.code}
              </span>
            </div>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              {project?.title || "My Hackathon Project"}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Team: <span className="font-semibold text-white">{project?.teamName}</span> · Logged in as{" "}
              <span className="text-cyan-300">{user?.name || "Participant"}</span> ({user?.email})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/p/${project?.code}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Public Booth</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/certificates"
              className="flex items-center gap-1.5 rounded-xl bg-[#c8f31d] px-4 py-2.5 text-xs font-extrabold text-black transition hover:bg-white shadow-[0_0_20px_rgba(200,243,29,0.3)]"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Download Certificate</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-strong rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Eye className="h-4 w-4 text-cyan-400" />
              <span>Total Booth Views</span>
            </div>
            <div className="font-display mt-2 text-2xl font-extrabold">{project?.views ?? 890}</div>
          </div>

          <div className="glass-strong rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <ScanLine className="h-4 w-4 text-[#c8f31d]" />
              <span>Visitor QR Scans</span>
            </div>
            <div className="font-display mt-2 text-2xl font-extrabold">{project?.checkins ?? 142}</div>
          </div>

          <div className="glass-strong rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Heart className="h-4 w-4 text-rose-400" />
              <span>Community Votes</span>
            </div>
            <div className="font-display mt-2 text-2xl font-extrabold">{project?.votes ?? 94}</div>
          </div>

          <div className="glass-strong rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Gavel className="h-4 w-4 text-amber-400" />
              <span>Judges Evaluated</span>
            </div>
            <div className="font-display mt-2 text-2xl font-extrabold">
              {judges.length > 0 ? `${scores.length} / ${judges.length}` : `${scores.length} Evaluated`}
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Project Edit Form (Left) vs Media Preview & Judge Ratings (Right) */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Form to Edit Project Details, Image & Links */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold">Project Details & Media Links</h3>
                  <p className="text-xs text-white/50">
                    Keep your demo URLs, code repositories, and thumbnail image updated for the judges.
                  </p>
                </div>
                {saveSuccess && (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
                  </span>
                )}
              </div>

              <form onSubmit={handleSave} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                      Category Track
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                    >
                      <option value="AI/ML">AI / Machine Learning</option>
                      <option value="HealthTech">HealthTech</option>
                      <option value="IoT">IoT & Hardware</option>
                      <option value="FinTech">FinTech</option>
                      <option value="GreenTech">GreenTech & Climate</option>
                      <option value="EdTech">EdTech</option>
                      <option value="Robotics">Robotics & Drones</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                      Team Name
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Project Description / Abstract
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>

                {/* Media Links: Image, Demo URL, GitHub URL, Video URL */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                  <div className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    // Links & Project Media
                  </div>

                  <div>
                    <ImageUploader
                      value={imageUrl}
                      onChange={setImageUrl}
                      label="Project Banner / Showcase Image (Upload File or URL)"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-white/70">
                        Live Demo URL
                      </label>
                      <div className="relative mt-1">
                        <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                          type="url"
                          placeholder="https://yourdemo.app"
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70">
                        GitHub / Source Code URL
                      </label>
                      <div className="relative mt-1">
                        <Code2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                          type="url"
                          placeholder="https://github.com/team/repo"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70">
                      Video Demo / Pitch Recording URL (Optional)
                    </label>
                    <div className="relative mt-1">
                      <Video className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Tech Stack (comma separated)
                  </label>
                  <input
                    type="text"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    placeholder="Next.js, PyTorch, ROS2, FastAPI, PostgreSQL"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Team Members ({members.length})
                  </label>
                  <div className="mt-2 space-y-2">
                    {members.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                      >
                        <span className="font-semibold">{m.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-white/40">{m.role}</span>
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="text-rose-400 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. ML, Fullstack)"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-32 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={addMember}
                      className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-white shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving Changes…" : "Save Project & Media Details"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Showcase Card & Judge Evaluations */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Card Preview */}
            <div className="glass-strong overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <div className="relative h-44 w-full bg-gradient-to-r from-violet-600 to-cyan-600">
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-white/50 text-xs font-mono">
                    No image provided
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono rounded-md bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#c8f31d]">
                      {category}
                    </span>
                    <span className="font-mono rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white/80">
                      Booth {project?.boothNo || "B-1"}
                    </span>
                  </div>
                  <h4 className="font-display mt-1 text-xl font-bold text-white drop-shadow-md">
                    {title || "Untitled Project"}
                  </h4>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {description || "No description provided."}
                </p>

                {/* Tech Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {techStackInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tech, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60 border border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                </div>

                {/* Direct Action Links */}
                <div className="mt-4 flex gap-2 pt-3 border-t border-white/10">
                  {demoUrl && (
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2 text-xs font-bold text-cyan-300 hover:bg-white/20 transition"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                  {repoUrl && (
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>Repository</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Booth QR Badge */}
            <div className="glass-strong rounded-3xl border border-white/10 p-6 text-center">
              <div className="font-mono text-xs text-white/50 uppercase tracking-wider">
                Booth Digital Pass & QR
              </div>
              <div className="mx-auto mt-3 flex justify-center">
                <div className="rounded-2xl border border-white/10 bg-white p-3 shadow-xl">
                  <QrCode
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/p/${project?.code}`
                        : `https://nexathon.live/p/${project?.code}`
                    }
                    size={160}
                  />
                </div>
              </div>
              <p className="mt-2 font-mono text-xs font-bold text-[#c8f31d]">CODE: {project?.code}</p>
              <p className="mt-0.5 text-[11px] text-white/40">
                Visitors and judges scan this to log booth check-ins and submit ratings.
              </p>
            </div>

            {/* Ratings & Feedback Received from Judges */}
            <div className="glass-strong rounded-3xl border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-base font-bold">Judges' Evaluations</h4>
                  <p className="text-xs text-white/50">Jury panel evaluation status for your project</p>
                </div>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {scores.length} / {judges.length} Evaluated
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {judges.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                    No judges have been onboarded to this event yet.
                  </div>
                ) : (
                  judges.map((j, i) => {
                    const sc = scores.find((s) => s.judgeId === j.id);
                    return (
                      <div
                        key={j.id || i}
                        className={`rounded-2xl border p-3.5 text-xs space-y-2 transition ${
                          sc
                            ? "border-amber-400/40 bg-amber-400/[0.04]"
                            : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{j.name || `Judge #${i + 1}`}</span>
                            {j.organization && <span className="text-[11px] text-white/40 block">{j.organization}</span>}
                          </div>
                          {sc ? (
                            <span className="rounded-md bg-amber-400/20 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                              ★ {sc.total} / 40
                            </span>
                          ) : (
                            <span className="rounded-md border border-dashed border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/45">
                              ⏳ Did Not Score Yet (Pending)
                            </span>
                          )}
                        </div>

                      {sc?.criteriaScores && (
                        <div className="grid grid-cols-4 gap-1 font-mono text-[10px] text-white/60 bg-black/30 p-2 rounded-xl">
                          <div>Innov: {sc.criteriaScores.innovation ?? "-"}</div>
                          <div>Exec: {sc.criteriaScores.execution ?? "-"}</div>
                          <div>Impact: {sc.criteriaScores.impact ?? "-"}</div>
                          <div>Pitch: {sc.criteriaScores.pitch ?? "-"}</div>
                        </div>
                      )}

                      {sc?.comment && (
                        <p className="rounded-lg bg-black/40 p-2 text-[11px] italic text-white/80">
                          &ldquo;{sc.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                }))}
              </div>
            </div>

            {/* Visitor Reviews & Crowd Feedback Card */}
            <div className="glass-strong rounded-3xl border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-base font-bold">Visitor Reviews & Cheers</h4>
                  <p className="text-xs text-white/50">Feedback left by expo attendees at your booth</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#c8f31d]">
                  {feedbacks.length} Reviews
                </span>
              </div>

              <div className="mt-4 max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {feedbacks.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-white/40">
                    No visitor reviews yet. Attendees scan your booth QR code to drop comments and ratings.
                  </div>
                ) : (
                  feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{fb.authorName || "Visitor"}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= (fb.rating || 5)
                                  ? "fill-amber-300 text-amber-300"
                                  : "text-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-white/70 text-[11px] leading-relaxed">{fb.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
