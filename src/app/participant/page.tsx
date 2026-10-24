"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import QrCode from "@/components/QrCode";
import ImageUploader from "@/components/ImageUploader";
import VideoUploader from "@/components/VideoUploader";
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
  User,
  Film,
  Loader2,
  Lock,
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
  const [eventData, setEventData] = useState<any>(null);
  const [certData, setCertData] = useState<any>(null);

  // Editable form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI/ML");
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
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
          if (res.ok) p = await res.json();
        }

        if (!p && user?.email) {
          const res = await fetch(`/api/projects?leaderEmail=${encodeURIComponent(user.email)}`);
          if (res.ok) p = await res.json();
        }

        if (!p && user?.projectId) {
          const res = await fetch(`/api/projects`);
          const all = await res.json();
          p = all.find((item: any) => item.id === user.projectId);
        }

        if (!p && user) {
          p = {
            id: user.projectId || "p-user-" + Math.random().toString(36).substring(2, 8),
            eventId: "9e33a337-5ba7-4c39-9265-426931e481af",
            title: `${user.name || "Participant"}'s Project`,
            category: "AI/ML",
            teamName: `Team ${user.name || "Innovators"}`,
            leaderName: user.name || "Participant",
            leaderEmail: user.email || "",
            leaderPhone: user.phone || "",
            description: "Provide an executive summary and problem statement for your hackathon submission.",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
            demoUrl: "",
            repoUrl: "",
            videoUrl: "",
            techStack: ["Next.js", "TypeScript", "AI/ML"],
            members: [{ name: user.name || "Participant", role: "Team Lead" }],
            boothNo: "B-" + Math.floor(Math.random() * 50 + 1),
            code: "PRJ-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
            views: 1,
            checkins: 0,
            votes: 0,
          };
        } else if (!p) {
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
          setLeaderName(p.leaderName || user?.name || "");
          setLeaderEmail(p.leaderEmail || user?.email || "");
          setLeaderPhone(p.leaderPhone || user?.phone || "");
          setDescription(p.description || "");
          setImageUrl(p.imageUrl || "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80");
          setDemoUrl(p.demoUrl || "");
          setRepoUrl(p.repoUrl || "");
          setVideoUrl(p.videoUrl || "");
          setTechStackInput(Array.isArray(p.techStack) ? p.techStack.join(", ") : "");
          setMembers(Array.isArray(p.members) ? p.members : []);

          if (p.id) {
            const [scoreData, judgeData, fbData, evData, certificateRes] = await Promise.all([
              fetch(`/api/scores?projectId=${p.id}`).then((r) => r.json()).catch(() => []),
              fetch(`/api/judges?eventId=${p.eventId}`).then((r) => r.json()).catch(() => []),
              fetch(`/api/feedback?projectId=${p.id}`).then((r) => r.json()).catch(() => []),
              p.eventId ? fetch(`/api/events/${p.eventId}`).then((r) => r.json()).catch(() => null) : Promise.resolve(null),
              fetch(`/api/certificates?projectId=${p.id}`).then((r) => r.json()).catch(() => null),
            ]);
            setScores(Array.isArray(scoreData) ? scoreData : []);
            setJudges(Array.isArray(judgeData) ? judgeData : []);
            setFeedbacks(Array.isArray(fbData) ? fbData : []);
            if (evData && !evData.error) setEventData(evData);
            if (certificateRes && !certificateRes.error) setCertData(certificateRes);
          }
        }
      } catch {
        // Fallback
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
    setNewMemberRole("Developer");
  }

  function removeMember(idx: number) {
    setMembers(members.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!project?.id) return;
    setSaving(true);
    setVideoError("");

    try {
      const techArray = techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          title,
          category,
          teamName,
          leaderName,
          leaderEmail,
          leaderPhone,
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
        setProject({ ...project, ...updated, leaderName, leaderEmail, leaderPhone, techStack: techArray, members });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-600 shadow-xs animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Loading participant studio…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 pb-28 pt-28">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                🚀 Participant Studio
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Booth {project?.boothNo || "B-1"}
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-mono text-slate-700">
                Code: {project?.code}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {project?.title || "My Project Dashboard"}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Team: <span className="font-semibold text-slate-900">{teamName || project?.teamName}</span> · Lead:{" "}
              <span className="font-medium text-indigo-700">{leaderName || user?.name || "Participant"}</span> ({user?.email || leaderEmail})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/p/${project?.code}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition"
            >
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span>Public Booth Pass</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
            <Link
              href="/certificates"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition"
            >
              <Award className="h-3.5 w-3.5" />
              <span>My Certificates</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Eye className="h-4 w-4 text-indigo-600" />
              <span>Total Stall Views</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {project?.views ?? 890}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <ScanLine className="h-4 w-4 text-emerald-600" />
              <span>Visitor QR Scans</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {project?.checkins ?? 142}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Heart className="h-4 w-4 text-rose-500" />
              <span>Attendee Votes</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {project?.votes ?? 94}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Gavel className="h-4 w-4 text-amber-500" />
              <span>Jury Evaluated</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
              {judges.length > 0 ? `${scores.length} / ${judges.length}` : `${scores.length} Scored`}
            </div>
          </div>
        </div>

        {/* 2-Column: Edit Form (Left) vs Live Showcase & Ratings (Right) */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Project Details &amp; Pitch Assets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update your demo video, repository, and showcase description for the judging panel.
                  </p>
                </div>
                {saveSuccess && (
                  <span className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
                  </span>
                )}
              </div>

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Track Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                    >
                      <option value="AI/ML">AI / Machine Learning</option>
                      <option value="HealthTech">HealthTech</option>
                      <option value="IoT">IoT &amp; Hardware</option>
                      <option value="FinTech">FinTech</option>
                      <option value="GreenTech">GreenTech &amp; Climate</option>
                      <option value="EdTech">EdTech</option>
                      <option value="Robotics">Robotics &amp; Drones</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Team Leader Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={leaderEmail}
                      onChange={(e) => setLeaderEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Abstract / Executive Summary *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition leading-relaxed resize-none"
                  />
                </div>

                {/* Media Links */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Project Media &amp; Repositories
                  </div>

                  <div>
                    <VideoUploader
                      value={videoUrl}
                      onChange={(v) => {
                        setVideoUrl(v);
                        setVideoError("");
                      }}
                      required={false}
                      label="Pitch / Demo Video URL"
                    />
                    {videoError && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{videoError}</p>
                    )}
                  </div>

                  <div>
                    <ImageUploader
                      value={imageUrl}
                      onChange={setImageUrl}
                      label="Project Showcase Banner Image"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Live Demo URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://yourdemo.app"
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Source Code Repository
                      </label>
                      <div className="relative">
                        <Code2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://github.com/team/repo"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tech Stack (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    placeholder="Next.js, PyTorch, ROS2, FastAPI, PostgreSQL"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white font-mono"
                  />
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Team Members ({members.length})
                  </label>
                  <div className="space-y-1.5">
                    {members.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">{m.role}</span>
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={addMember}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving Changes…" : "Save Project & Media Details"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Showcase Card & Ratings (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Certificate Status Card (Locked until Admin marks event ended) */}
            {eventData?.status === "ended" || eventData?.status === "completed" ? (
              <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Certificate Unlocked &amp; Verified! 🎓</h4>
                      <p className="text-xs text-emerald-800 font-medium">Official Ceremony Concluded by Admin</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[11px] font-bold text-emerald-900">
                    Unlocked
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-700 leading-relaxed">
                  Congratulations! <b>{teamName || project?.teamName}</b> has officially completed <b>{eventData?.name || "the event"}</b>. Your tamper-proof cryptographically signed certificate is ready to view and share!
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-emerald-200">
                  <Link
                    href={certData?.code ? `/verify/${certData.code}` : `/certificates`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>View &amp; Print Certificate</span>
                  </Link>
                  {certData?.code && (
                    <span className="font-mono text-xs text-slate-600 px-2 font-medium">
                      PASS: {certData.code}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Certificate Status: Locked 🔒</h4>
                      <p className="text-xs text-amber-800 font-medium">Event Currently In Progress</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[11px] font-bold text-amber-900">
                    Ceremony Pending
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-700 leading-relaxed">
                  Participation certificates remain securely locked while the event is ongoing. <b>Once the Admin concludes the event ceremony from the Admin Console</b>, your official tamper-proof certificate will automatically unlock here.
                </p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-amber-200 text-xs text-slate-600">
                  <span>Event: <b className="text-slate-900">{eventData?.name || "Active Event"}</b></span>
                  <span className="font-mono text-[11px] font-semibold text-amber-800 uppercase">
                    Status: {eventData?.status || "LIVE"}
                  </span>
                </div>
              </div>
            )}

            {/* Live Card Preview */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              <div className="relative h-44 w-full bg-slate-100">
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-400 text-xs">
                    No banner image provided
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-slate-900">
                      {category}
                    </span>
                    <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium">
                      Booth {project?.boothNo || "B-1"}
                    </span>
                  </div>
                  <h4 className="mt-1 text-lg font-semibold text-white drop-shadow-xs">
                    {title || "Untitled Project"}
                  </h4>
                  <p className="text-xs text-slate-200">
                    by {teamName || project?.teamName} · Lead: {leaderName || user?.name || "Participant"}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {description || "No description provided."}
                </p>

                {/* Direct Links */}
                <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                  {demoUrl && (
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-semibold text-indigo-600 shadow-xs transition"
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
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-semibold text-slate-700 shadow-xs transition"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>Repository</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Booth QR Pass */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 text-center shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Booth Digital Pass &amp; QR
              </div>
              <div className="mx-auto mt-3 flex justify-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                  <QrCode
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/p/${project?.code}`
                        : `https://eventos.live/p/${project?.code}`
                    }
                    size={160}
                  />
                </div>
              </div>
              <p className="mt-2 font-mono text-xs font-semibold text-indigo-600">CODE: {project?.code}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Visitors and judges scan this to log booth visits and submit ratings.
              </p>
            </div>

            {/* Judges Evaluation Status */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Jury Evaluations</h4>
                  <p className="text-xs text-slate-500">Official jury scoring for your project</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600">
                  {scores.length} / {judges.length} Evaluated
                </span>
              </div>

              <div className="space-y-2.5">
                {judges.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    No judges onboarded to this event yet.
                  </div>
                ) : (
                  judges.map((j, i) => {
                    const sc = scores.find((s) => s.judgeId === j.id);
                    return (
                      <div
                        key={j.id || i}
                        className={`rounded-2xl border p-3 text-xs space-y-2 transition ${
                          sc
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900">{j.name || `Judge #${i + 1}`}</span>
                            {j.organization && <span className="text-[10px] text-slate-500 block">{j.organization}</span>}
                          </div>
                          {sc ? (
                            <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[11px] font-bold">
                              ★ {sc.total} / 40
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                        </div>

                        {sc?.criteriaScores && (
                          <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-600 bg-slate-100/70 p-2 rounded-xl text-center">
                            <div>Innov: <b>{sc.criteriaScores.innovation ?? "-"}</b></div>
                            <div>Exec: <b>{sc.criteriaScores.execution ?? "-"}</b></div>
                            <div>Impact: <b>{sc.criteriaScores.impact ?? "-"}</b></div>
                            <div>Pitch: <b>{sc.criteriaScores.pitch ?? "-"}</b></div>
                          </div>
                        )}

                        {sc?.comment && (
                          <p className="rounded-lg bg-white border border-slate-200 p-2 text-[11px] italic text-slate-700">
                            &ldquo;{sc.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Attendee Reviews */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Visitor Feedback</h4>
                  <p className="text-xs text-slate-500">Attendee feedback left at your booth</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600">
                  {feedbacks.length} Reviews
                </span>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {feedbacks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    No attendee reviews yet.
                  </div>
                ) : (
                  feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{fb.authorName || "Visitor"}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= (fb.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{fb.message}</p>
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
