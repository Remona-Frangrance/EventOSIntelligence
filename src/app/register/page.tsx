"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import QrCode from "@/components/QrCode";
import ImageUploader from "@/components/ImageUploader";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
  Layers,
  Zap,
  Compass,
  Image as ImageIcon,
  Globe,
  Code2,
  Tag,
  ShieldCheck,
} from "lucide-react";

const AVAILABLE_INTERESTS = [
  "AI/ML",
  "HealthTech",
  "IoT",
  "FinTech",
  "GreenTech",
  "Robotics",
  "EdTech",
  "Cybersecurity",
  "Web3",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<"participant" | "visitor">("participant");

  // Common user fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Participant specific fields
  const [projectTitle, setProjectTitle] = useState("");
  const [category, setCategory] = useState("AI/ML");
  const [teamName, setTeamName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState("");

  // Visitor specific fields
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["AI/ML", "HealthTech"]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [doneData, setDoneData] = useState<any | null>(null);

  // Events list for selection
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          const sp = new URLSearchParams(window.location.search);
          const paramEv = sp.get("eventId") || sp.get("event");
          const found = data.find((e: any) => e.id === paramEv || e.slug === paramEv) || data.find((e: any) => e.status === "live") || data[0];
          if (found) setSelectedEventId(found.id);
        }
      })
      .catch(() => {});
  }, []);

  function addMember() {
    if (!newMember.trim()) return;
    setMembers([...members, newMember.trim()]);
    setNewMember("");
  }

  function removeMember(idx: number) {
    setMembers(members.filter((_, i) => i !== idx));
  }

  function toggleInterest(tag: string) {
    if (selectedInterests.includes(tag)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((t) => t !== tag));
      }
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      eventId: selectedEventId,
      name,
      email,
      password,
      role,
      phone,
      ...(role === "participant"
        ? {
            projectTitle,
            category,
            teamName,
            projectDescription,
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
            demoUrl,
            repoUrl,
            techStack: techStack.split(",").map((s) => s.trim()).filter(Boolean),
            members: members.map((m) => ({ name: m, role: "Member" })),
          }
        : {
            interests: selectedInterests,
          }),
    };

    const res = await register(payload);
    setSaving(false);

    if (res.success) {
      setDoneData(payload);
    } else {
      setError(res.error || "Registration failed. Try again.");
    }
  }

  if (doneData) {
    return (
      <main className="relative min-h-screen px-4 pb-24 pt-32 text-center text-white">
        <div className="mx-auto max-w-lg glass-strong rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#c8f31d] text-black shadow-[0_0_30px_rgba(200,243,29,0.5)]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h2 className="font-display mt-5 text-3xl font-extrabold">Welcome Aboard!</h2>
          <p className="mt-2 text-sm text-white/60">
            {role === "participant"
              ? "Your project is registered and assigned to an expo booth."
              : "Your visitor profile and interest feed are ready."}
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Name:</span>
              <span className="font-bold">{name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Role:</span>
              <span className="font-mono uppercase text-[#c8f31d]">{role}</span>
            </div>
            {role === "participant" && (
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Project:</span>
                <span className="font-bold text-cyan-300">{projectTitle}</span>
              </div>
            )}
            {role === "visitor" && (
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Interests:</span>
                <span className="font-mono text-fuchsia-300">{selectedInterests.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={role === "participant" ? "/participant" : "/visitor"}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#c8f31d] py-3 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-white"
            >
              <span>Open Your {role.toUpperCase()} Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 pb-28 pt-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-16 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />

      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#c8f31d]">
            <Sparkles className="h-3 w-3" /> Event Intelligence Registration
          </div>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Register as a <span className="text-[#c8f31d]">{role === "participant" ? "Participant" : "Visitor"}</span>
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
            Join Nexathon '26. Participants submit their project, media & links. Visitors get an interest-matched discovery feed.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="glass-strong inline-flex rounded-2xl border border-white/10 p-1.5">
            <button
              type="button"
              onClick={() => setRole("participant")}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition ${
                role === "participant"
                  ? "bg-cyan-400 text-black shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Participant (Submit Project)</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("visitor")}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition ${
                role === "visitor"
                  ? "bg-fuchsia-400 text-black shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Visitor (Select Interests)</span>
            </button>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="mt-8 glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Selection */}
            {events.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="block text-xs font-semibold text-white/80">
                  Select Event / Hackathon *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c8f31d]"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id} className="bg-[#0b0f1d]">
                      {ev.name} ({ev.status.toUpperCase()}) — {ev.city || ev.venue || "Expo"}
                    </option>
                  ))}
                </select>
                <p className="mt-1 font-mono text-[10px] text-white/40">
                  Your registration and project booth will be associated with this event.
                </p>
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-4">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-white/40">
                // 1. Account Credentials
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-white/70">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Mehta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c8f31d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c8f31d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-white/70">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c8f31d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c8f31d]"
                  />
                </div>
              </div>
            </div>

            {/* Role Specific Section */}
            {role === "participant" ? (
              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                  // 2. Project Details & Links
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/70">Project Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MediQueue AI"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70">Category Track</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      <option value="AI/ML">AI / Machine Learning</option>
                      <option value="HealthTech">HealthTech</option>
                      <option value="IoT">IoT & Hardware</option>
                      <option value="FinTech">FinTech</option>
                      <option value="GreenTech">GreenTech</option>
                      <option value="EdTech">EdTech</option>
                      <option value="Robotics">Robotics</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/70">Team Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PulseCoders"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70">
                      Tech Stack (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Python, Next.js, PyTorch, ROS2"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70">
                    Project Description / Pitch
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Short summary of what your project does, problem it solves, and how it was built…"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>

                {/* Media Links */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="font-mono text-[11px] text-cyan-300 font-bold uppercase">
                    // Links & Showcase Image
                  </div>

                  <ImageUploader
                    value={imageUrl}
                    onChange={setImageUrl}
                    label="Project Banner / Screenshot Image (Upload File or URL)"
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-white/70">Live Demo URL</label>
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
                      <label className="block text-xs font-semibold text-white/70">GitHub / Code URL</label>
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
                </div>

                {/* Team Members List */}
                <div>
                  <label className="block text-xs font-semibold text-white/70">
                    Additional Team Members
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Sanya Iyer (Frontend)"
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={addMember}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {members.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {members.map((m, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white"
                        >
                          {m}
                          <button type="button" onClick={() => removeMember(idx)}>
                            <Trash2 className="h-3 w-3 text-rose-400 hover:text-white" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Visitor Specific: Interests Selection */
              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                  // 2. Select Your Tech Interests
                </div>
                <p className="text-xs text-white/60">
                  Pick the tracks you want to explore. Our matching engine will highlight relevant projects at the expo.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {AVAILABLE_INTERESTS.map((tag) => {
                    const active = selectedInterests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                          active
                            ? "border border-fuchsia-400 bg-fuchsia-400/20 text-fuchsia-200 shadow-[0_0_15px_rgba(232,121,249,0.3)]"
                            : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span>{tag}</span>
                        {active && <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-extrabold uppercase tracking-wider text-black transition shadow-xl ${
                role === "participant"
                  ? "bg-cyan-400 hover:bg-white shadow-cyan-400/20"
                  : "bg-fuchsia-400 hover:bg-white shadow-fuchsia-400/20"
              }`}
            >
              <span>{saving ? "Registering Account…" : `Complete ${role.toUpperCase()} Registration`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-xs text-white/50">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#c8f31d] hover:underline">
                Sign in to your portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
