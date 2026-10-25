"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Layers,
  MapPin,
  Sparkles,
  Flame,
  Plus,
  Check,
  Star,
  Bookmark,
  Trash2,
  X,
  Info,
  ArrowRight,
  ScanLine,
  Tag,
  ExternalLink,
  Loader2,
  RefreshCw,
  DoorOpen,
  LogOut,
  Maximize2,
} from "lucide-react";

export type FloorBooth = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  projectId?: string | null;
  boothNo?: string;
  color?: string;
  scanCount?: number;
  heatIntensity?: number;
};

export type FloorWall = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness?: number;
};

export type FloorOpening = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "door" | "entrance" | "exit" | "emergency";
  label: string;
};

export type FloorPlan = {
  id: string;
  eventId: string;
  name: string;
  description: string;
  isDefault: boolean;
  status: string;
  gridWidth: number;
  gridHeight: number;
  walls: FloorWall[];
  openings: FloorOpening[];
  booths: FloorBooth[];
  heatmapStats?: {
    totalScans: number;
    maxBoothScans: number;
    activeBoothsWithScans?: number;
  };
};

type ProjectOption = {
  id: string;
  title: string;
  category: string;
  teamName: string;
  boothNo: string;
};

interface FloorPlanViewerProps {
  eventId: string;
  isAdmin?: boolean;
  onSelectProject?: (projectId: string) => void;
}

export default function FloorPlanViewer({
  eventId,
  isAdmin = false,
  onSelectProject,
}: FloorPlanViewerProps) {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [msg, setMsg] = useState("");
  const [eventProjects, setEventProjects] = useState<ProjectOption[]>([]);

  // Modals state
  const [selectedBooth, setSelectedBooth] = useState<FloorBooth | null>(null);
  const [assigningProjectId, setAssigningProjectId] = useState<string>("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");
  const [newPlanCloneDefault, setNewPlanCloneDefault] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Load floor plans for current event
  async function loadFloorPlans(targetEventId: string) {
    if (!targetEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/floor-plans?eventId=${targetEventId}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data || []);
        if (data && data.length > 0) {
          // Select default plan or first
          const defaultPlan = data.find((p: FloorPlan) => p.isDefault) || data[0];
          setActivePlanId(defaultPlan.id);
        } else {
          setActivePlanId("");
        }
      }
    } catch {
      flash("Failed to load floor plans");
    } finally {
      setLoading(false);
    }
  }

  // Load projects belonging to this event
  async function loadEventProjects(targetEventId: string) {
    if (!targetEventId) return;
    try {
      const res = await fetch(`/api/projects?eventId=${targetEventId}`);
      if (res.ok) {
        const data = await res.json();
        setEventProjects(data || []);
      }
    } catch {}
  }

  useEffect(() => {
    if (eventId) {
      loadFloorPlans(eventId);
      loadEventProjects(eventId);
    }
  }, [eventId]);

  function flash(message: string) {
    setMsg(message);
    setTimeout(() => setMsg(""), 3500);
  }

  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === activePlanId) || plans[0] || null;
  }, [plans, activePlanId]);

  // Set default plan
  async function handleSetDefault(planId: string) {
    try {
      const res = await fetch(`/api/floor-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        flash("Marked as default floor plan for this event");
        loadFloorPlans(eventId);
      } else {
        const err = await res.json();
        flash(err.error || "Failed to update default plan");
      }
    } catch {
      flash("Error setting default floor plan");
    }
  }

  // Soft archive plan
  async function handleArchivePlan(planId: string) {
    if (!confirm("Are you sure you want to archive this floor plan?")) return;
    try {
      const res = await fetch(`/api/floor-plans/${planId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        flash("Floor plan archived successfully");
        loadFloorPlans(eventId);
      } else {
        const err = await res.json();
        flash(err.error || "Failed to archive floor plan");
      }
    } catch {
      flash("Error archiving floor plan");
    }
  }

  // Open booth assign modal
  function handleOpenBoothModal(booth: FloorBooth) {
    if (!isAdmin && onSelectProject && booth.projectId) {
      onSelectProject(booth.projectId);
      return;
    }
    if (!isAdmin) return;
    setSelectedBooth(booth);
    setAssigningProjectId(booth.projectId || "");
  }

  // Save booth project assignment
  async function handleSaveBoothAssignment() {
    if (!activePlan || !selectedBooth) return;
    setSavingAssignment(true);

    try {
      const updatedBooths = (activePlan.booths || []).map((b) => {
        if (b.id === selectedBooth.id) {
          return {
            ...b,
            projectId: assigningProjectId ? assigningProjectId : null,
          };
        }
        return b;
      });

      const res = await fetch(`/api/floor-plans/${activePlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booths: updatedBooths }),
      });

      if (res.ok) {
        flash(`Booth ${selectedBooth.label} assignment updated!`);
        setSelectedBooth(null);
        loadFloorPlans(eventId);
      } else {
        const err = await res.json();
        flash(err.error || "Failed to update booth project assignment");
      }
    } catch {
      flash("Network error updating booth assignment");
    } finally {
      setSavingAssignment(false);
    }
  }

  // Save current plan as organization template
  async function handleSaveAsTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlan || !templateName.trim()) return;
    setSavingTemplate(true);

    try {
      const res = await fetch("/api/floor-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePlanId: activePlan.id,
          name: templateName.trim(),
          description: templateDesc.trim(),
        }),
      });

      if (res.ok) {
        flash("Saved as organization template! Clean layout stored with zero project or visitor data.");
        setShowTemplateModal(false);
        setTemplateName("");
        setTemplateDesc("");
      } else {
        const err = await res.json();
        flash(err.error || "Failed to save organization template");
      }
    } catch {
      flash("Network error saving template");
    } finally {
      setSavingTemplate(false);
    }
  }

  // Create additional floor plan
  async function handleCreateFloorPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    setCreatingPlan(true);

    try {
      const defaultPlan = plans.find((p) => p.isDefault) || plans[0];
      const payload: any = {
        eventId,
        name: newPlanName.trim(),
        description: newPlanDesc.trim(),
        isDefault: plans.length === 0,
        gridWidth: defaultPlan?.gridWidth || 20,
        gridHeight: defaultPlan?.gridHeight || 15,
      };

      if (newPlanCloneDefault && defaultPlan) {
        payload.walls = defaultPlan.walls || [];
        payload.openings = defaultPlan.openings || [];
        // Copy booth positions but clear project assignments!
        payload.booths = (defaultPlan.booths || []).map((b) => ({
          ...b,
          projectId: null,
        }));
      }

      const res = await fetch("/api/floor-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        flash(`Floor plan "${created.name}" created!`);
        setShowCreatePlanModal(false);
        setNewPlanName("");
        setNewPlanDesc("");
        loadFloorPlans(eventId);
        setActivePlanId(created.id);
      } else {
        const err = await res.json();
        flash(err.error || "Failed to create floor plan");
      }
    } catch {
      flash("Network error creating floor plan");
    } finally {
      setCreatingPlan(false);
    }
  }

  // Calculate project map
  const projectMap = useMemo(() => {
    const map = new Map<string, ProjectOption>();
    for (const p of eventProjects) {
      map.set(p.id, p);
    }
    return map;
  }, [eventProjects]);

  // Set of already assigned projects in current plan
  const assignedInPlan = useMemo(() => {
    const set = new Set<string>();
    if (activePlan?.booths) {
      for (const b of activePlan.booths) {
        if (b.projectId && (!selectedBooth || b.id !== selectedBooth.id)) {
          set.add(b.projectId);
        }
      }
    }
    return set;
  }, [activePlan, selectedBooth]);

  // Grid sizing calculations
  const gridW = activePlan?.gridWidth || 20;
  const gridH = activePlan?.gridHeight || 15;
  const cellSize = 38; // px per grid unit
  const canvasWidth = gridW * cellSize;
  const canvasHeight = gridH * cellSize;

  return (
    <div className="space-y-5">
      {/* Flash message */}
      {msg && (
        <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 text-xs font-medium text-indigo-900 shadow-xs">
          <Info className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Floor Plan selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2 shrink-0">
            <Layers className="h-4 w-4 text-indigo-600" />
            Halls / Floors:
          </span>

          {plans.map((p) => {
            const isActive = p.id === activePlan?.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shrink-0 transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{p.name}</span>
                {p.isDefault && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? "bg-indigo-800 text-indigo-200" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Default
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => setShowCreatePlanModal(true)}
              className="flex items-center gap-1 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Floor / Hall</span>
            </button>
          )}
        </div>

        {/* View & action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Heatmap toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
              showHeatmap
                ? "bg-amber-500 text-white shadow-amber-200"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Flame className={`h-4 w-4 ${showHeatmap ? "text-amber-100 animate-pulse" : "text-amber-500"}`} />
            <span>Heatmap {showHeatmap ? "ON" : "OFF"}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => eventId && loadFloorPlans(eventId)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-xs transition"
            title="Refresh floor layout & scans"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Admin actions */}
          {isAdmin && activePlan && (
            <>
              {!activePlan.isDefault && (
                <button
                  onClick={() => handleSetDefault(activePlan.id)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  title="Make this floor plan the default view for this event"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span>Set as Default</span>
                </button>
              )}

              <button
                onClick={() => {
                  setTemplateName(`${activePlan.name} Template`);
                  setTemplateDesc(`Reusable layout with ${activePlan.booths?.length || 0} booths`);
                  setShowTemplateModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
                title="Save this layout at the organization level (floor_templates) to reuse in new events"
              >
                <Bookmark className="h-3.5 w-3.5 text-indigo-600" />
                <span>Save as Template</span>
              </button>

              {plans.length > 1 && (
                <button
                  onClick={() => handleArchivePlan(activePlan.id)}
                  className="rounded-xl border border-rose-200 bg-rose-50/60 p-2 text-rose-600 hover:bg-rose-100 transition shadow-xs"
                  title="Archive this floor plan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Heatmap Banner / Stats */}
      {showHeatmap && activePlan?.heatmapStats && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500 p-2 text-white">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-amber-950">
                Live Scan Density Heatmap · Scoped to this Event ({activePlan.heatmapStats.totalScans} Total Scans)
              </div>
              <div className="text-[11px] text-amber-800">
                Counts scans strictly where scans.eventId = {activePlan.name}&apos;s eventId. High density booths glow orange-red.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Intensity Legend:</span>
              <div className="flex items-center gap-1">
                <span className="h-3 w-5 rounded bg-emerald-200 border border-emerald-300" title="Low" />
                <span className="h-3 w-5 rounded bg-amber-300 border border-amber-400" title="Medium" />
                <span className="h-3 w-5 rounded bg-orange-500 border border-orange-600" title="High" />
                <span className="h-3 w-5 rounded bg-red-600 border border-red-700 animate-pulse" title="Peak" />
              </div>
            </div>

            <div className="rounded-xl bg-white/80 border border-amber-200 px-3 py-1 font-mono text-[11px] font-bold text-amber-900">
              Peak: {activePlan.heatmapStats.maxBoothScans} scans/booth
            </div>
          </div>
        </div>
      )}

      {/* Main Floor Canvas Container */}
      <div className="relative overflow-x-auto rounded-3xl border border-slate-200 bg-slate-900/95 p-6 shadow-xl backdrop-blur-md">
        {/* Floor Canvas Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-sm text-white">{activePlan?.name || "Floor Plan"}</span>
            <span className="text-xs text-slate-400">({gridW} × {gridH} grid modules)</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
              Exhibition Booths ({activePlan?.booths?.length || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Entrances &amp; Doors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-600" />
              Structural Walls
            </span>
          </div>
        </div>

        {/* 2D Interactive Canvas */}
        <div
          className="relative mx-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-inner"
          style={{ width: `${canvasWidth + 32}px`, height: `${canvasHeight + 32}px` }}
        >
          {/* Subtle Grid background */}
          <div
            className="absolute inset-4 rounded-xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
              backgroundSize: `${cellSize}px ${cellSize}px`,
            }}
          />

          {/* SVG Layer for Structural Walls and Boundary */}
          <svg
            className="absolute inset-4 pointer-events-none z-10"
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          >
            {/* Outer border */}
            <rect
              x={1}
              y={1}
              width={canvasWidth - 2}
              height={canvasHeight - 2}
              fill="none"
              stroke="#334155"
              strokeWidth={3}
              rx={8}
            />

            {/* Custom walls */}
            {(activePlan?.walls || []).map((w) => (
              <line
                key={w.id}
                x1={w.x1 * cellSize}
                y1={w.y1 * cellSize}
                x2={w.x2 * cellSize}
                y2={w.y2 * cellSize}
                stroke="#475569"
                strokeWidth={(w.thickness || 1) * 3}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Openings (Doors, Entrances, Exits) Layer */}
          {(activePlan?.openings || []).map((op) => {
            const left = 16 + op.x * cellSize;
            const top = 16 + op.y * cellSize;
            const width = Math.max(1, op.width) * cellSize;
            const height = Math.max(1, op.height) * cellSize;

            const isEntrance = op.type === "entrance";
            const isExit = op.type === "exit" || op.type === "emergency";

            return (
              <div
                key={op.id}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                className={`absolute z-20 flex flex-col items-center justify-center rounded-lg border text-[10px] font-bold tracking-wider uppercase transition shadow-sm ${
                  isEntrance
                    ? "border-emerald-500 bg-emerald-950/80 text-emerald-300"
                    : isExit
                    ? "border-rose-500 bg-rose-950/80 text-rose-300"
                    : "border-sky-500 bg-sky-950/80 text-sky-300"
                }`}
              >
                {isEntrance ? <DoorOpen className="h-3.5 w-3.5 mb-0.5" /> : <LogOut className="h-3.5 w-3.5 mb-0.5" />}
                <span className="truncate max-w-[90%] text-center leading-none">{op.label || op.type}</span>
              </div>
            );
          })}

          {/* Booths Layer */}
          {(activePlan?.booths || []).map((booth) => {
            const left = 16 + booth.x * cellSize;
            const top = 16 + booth.y * cellSize;
            const width = Math.max(1, booth.width) * cellSize;
            const height = Math.max(1, booth.height) * cellSize;

            const assignedProject = booth.projectId ? projectMap.get(booth.projectId) : null;
            const scanCount = booth.scanCount || 0;
            const heatIntensity = booth.heatIntensity || 0;

            // Heatmap styling colors
            let heatStyle = {};
            if (showHeatmap && scanCount > 0) {
              if (heatIntensity > 0.7) {
                heatStyle = {
                  backgroundColor: "rgba(239, 68, 68, 0.85)", // Red
                  borderColor: "#f87171",
                  boxShadow: "0 0 15px rgba(239, 68, 68, 0.7)",
                };
              } else if (heatIntensity > 0.4) {
                heatStyle = {
                  backgroundColor: "rgba(249, 115, 22, 0.85)", // Orange
                  borderColor: "#fb923c",
                  boxShadow: "0 0 12px rgba(249, 115, 22, 0.6)",
                };
              } else {
                heatStyle = {
                  backgroundColor: "rgba(234, 179, 8, 0.85)", // Yellow
                  borderColor: "#fde047",
                  boxShadow: "0 0 10px rgba(234, 179, 8, 0.5)",
                };
              }
            }

            return (
              <div
                key={booth.id}
                onClick={() => handleOpenBoothModal(booth)}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  ...heatStyle,
                }}
                className={`absolute z-30 flex flex-col justify-between rounded-xl border p-2 cursor-pointer transition transform hover:scale-[1.03] hover:z-40 ${
                  !showHeatmap
                    ? booth.projectId
                      ? "border-indigo-500/80 bg-indigo-950/90 text-white shadow-indigo-950/50 hover:border-indigo-400"
                      : "border-slate-700 bg-slate-900/90 text-slate-400 hover:border-indigo-500 hover:text-white"
                    : scanCount === 0
                    ? "border-slate-800 bg-slate-900/60 text-slate-500 opacity-60"
                    : "text-white"
                }`}
                title={
                  assignedProject
                    ? `Booth ${booth.label}: ${assignedProject.title} (${assignedProject.teamName})`
                    : `Booth ${booth.label}: Empty (Click to assign)`
                }
              >
                {/* Booth Label & Pill */}
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-300">
                    {booth.label}
                  </span>

                  {showHeatmap ? (
                    <span className="flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      <Flame className="h-2.5 w-2.5" />
                      {scanCount}
                    </span>
                  ) : assignedProject ? (
                    <span className="rounded bg-indigo-600/60 px-1 py-0.2 text-[9px] font-medium uppercase tracking-wider text-indigo-200">
                      {assignedProject.category}
                    </span>
                  ) : null}
                </div>

                {/* Project Title / Empty Stall Note */}
                <div className="my-auto overflow-hidden text-center">
                  {assignedProject ? (
                    <>
                      <div className="truncate text-xs font-bold text-white" title={assignedProject.title}>
                        {assignedProject.title}
                      </div>
                      <div className="truncate text-[10px] text-slate-300">
                        {assignedProject.teamName}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] italic text-slate-500">
                      {isAdmin ? "Click to Assign" : "Available Stall"}
                    </div>
                  )}
                </div>

                {/* Bottom footer status */}
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  {isAdmin && (
                    <span className="text-indigo-400 hover:underline">
                      {booth.projectId ? "Edit" : "+ Assign"}
                    </span>
                  )}
                  {assignedProject && !isAdmin && (
                    <span className="text-emerald-400 font-medium">View Project →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOOTH ASSIGNMENT MODAL (Admin Only) */}
      {selectedBooth && isAdmin && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedBooth(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Configure Booth {selectedBooth.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooth(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <div className="font-semibold text-slate-800">
                  Booth Project Assignment Rules Enforced:
                </div>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-600">
                  <li>Only projects from the same event ({eventId.slice(0, 8)}) can be assigned.</li>
                  <li>A project can be assigned to only one booth per floor plan.</li>
                </ul>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Select Project for Booth {selectedBooth.label}:
                </label>
                <select
                  value={assigningProjectId}
                  onChange={(e) => setAssigningProjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                >
                  <option value="">-- No Project (Empty Stall) --</option>
                  {eventProjects.map((p) => {
                    const isAlreadyAssigned = assignedInPlan.has(p.id);
                    return (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={isAlreadyAssigned}
                      >
                        {p.title} · {p.teamName} ({p.category})
                        {isAlreadyAssigned ? " [Assigned to Another Booth]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {selectedBooth.projectId && (
                  <button
                    type="button"
                    onClick={() => setAssigningProjectId("")}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
                  >
                    Clear Assignment
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBooth(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveBoothAssignment}
                  disabled={savingAssignment}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {savingAssignment ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVE AS TEMPLATE MODAL (Admin Only) */}
      {showTemplateModal && isAdmin && activePlan && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Save as Organization Template
                </h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="mt-4 space-y-3.5">
              <div className="rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-900 border border-indigo-100">
                <span className="font-semibold">Zero-Data Template Guarantee:</span> This saves the walls,
                openings, and booth coordinates at the organization level (`floor_templates`). All project
                assignments and visitor scans are completely stripped so it can safely be reused for new events.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Standard 12-Booth Expo Hall"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="Notes on layout capacity, entrance positioning, aisle width..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {savingTemplate ? "Saving Template…" : "Confirm & Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ADDITIONAL FLOOR PLAN MODAL */}
      {showCreatePlanModal && isAdmin && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setShowCreatePlanModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Add Hall / Floor to Event
                </h3>
              </div>
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFloorPlan} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Floor / Hall Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Hall B - Robotics & AI Arena (1st Floor)"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="e.g. Hardware demos and competitive pitch arena"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>

              {plans.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newPlanCloneDefault}
                      onChange={(e) => setNewPlanCloneDefault(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Clone walls &amp; booth layout from existing floor plan</span>
                  </label>
                  <p className="mt-1 text-[11px] text-slate-500 pl-5">
                    Booth coordinates and walls will be copied, but project assignments will start clean.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPlan}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {creatingPlan ? "Creating Plan…" : "Create Floor Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
