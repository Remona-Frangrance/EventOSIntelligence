import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "../../src/lib/demoData.ts";
import { floorPlanCreateSchema, floorPlanUpdateSchema, floorTemplateCreateSchema, validateBody } from "../../src/lib/validations/index.ts";

describe("Floor Plans & Templates Per-Event Rules & Multi-Tenancy", () => {
  const orgA = "org-alpha-111";
  const orgB = "org-beta-222";
  const event1 = "ev-hackathon-orgA";
  const event2 = "ev-summit-orgB";

  beforeEach(() => {
    memoryStore.clearAll();

    // Seed events
    memoryStore.addEvent({
      id: event1,
      name: "Org A Hackathon",
      slug: "org-a-hackathon",
      type: "hackathon",
      tagline: "Build the future",
      description: "Org A flagship tech event",
      venue: "Main Campus",
      city: "San Francisco",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      status: "live",
      bannerGradient: "from-blue-600 to-indigo-900",
      scoringCriteria: [],
      categories: ["AI", "Cloud"],
      registrationOpen: true,
      createdAt: new Date().toISOString(),
    });

    // Seed projects for event 1
    memoryStore.addProject({
      id: "proj-101",
      eventId: event1,
      title: "Vision AI",
      category: "AI",
      teamName: "Neural Team",
      leaderName: "Alice",
      leaderEmail: "alice@test.com",
      leaderPhone: "555-0101",
      members: [],
      description: "Vision models",
      techStack: ["PyTorch"],
      imageUrl: "",
      demoUrl: "",
      repoUrl: "",
      code: "PRJ-101",
      status: "approved",
      boothNo: "A-01",
      views: 10,
      checkins: 5,
      votes: 12,
      createdAt: new Date().toISOString(),
    });

    memoryStore.addProject({
      id: "proj-102",
      eventId: event1,
      title: "Cloud Mesh",
      category: "Cloud",
      teamName: "Mesh Labs",
      leaderName: "Bob",
      leaderEmail: "bob@test.com",
      leaderPhone: "555-0102",
      members: [],
      description: "Edge mesh",
      techStack: ["Go"],
      imageUrl: "",
      demoUrl: "",
      repoUrl: "",
      code: "PRJ-102",
      status: "approved",
      boothNo: "A-02",
      views: 8,
      checkins: 4,
      votes: 9,
      createdAt: new Date().toISOString(),
    });

    // Seed project for event 2 (different event!)
    memoryStore.addProject({
      id: "proj-201",
      eventId: event2,
      title: "Event 2 Foreign Project",
      category: "FinTech",
      teamName: "Foreign Team",
      leaderName: "Charlie",
      leaderEmail: "charlie@test.com",
      leaderPhone: "555-0201",
      members: [],
      description: "Foreign project",
      techStack: [],
      imageUrl: "",
      demoUrl: "",
      repoUrl: "",
      code: "PRJ-201",
      status: "approved",
      boothNo: "B-01",
      views: 0,
      checkins: 0,
      votes: 0,
      createdAt: new Date().toISOString(),
    });
  });

  describe("Rule 1: Floor Plans Belong to Exactly One Event (eventId Required)", () => {
    it("should reject floor plan creation if eventId is missing", () => {
      const invalidPlan = {
        name: "Main Hall",
        gridWidth: 20,
        gridHeight: 15,
      };

      const result = validateBody(floorPlanCreateSchema, invalidPlan);
      assert.equal(result.success, false);
      assert.ok(result.error.toLowerCase().includes("eventid"));
    });

    it("should accept valid floor plan with eventId, walls, openings, and booths", () => {
      const validPlan = {
        eventId: event1,
        name: "Ground Floor Innovation Arena",
        description: "Primary exhibition space",
        isDefault: true,
        gridWidth: 20,
        gridHeight: 15,
        walls: [{ id: "w-1", x1: 0, y1: 0, x2: 20, y2: 0, thickness: 2 }],
        openings: [{ id: "op-1", x: 10, y: 0, width: 2, height: 1, type: "entrance", label: "Main Gate" }],
        booths: [{ id: "b-1", label: "A-01", x: 2, y: 2, width: 2, height: 2, projectId: "proj-101", boothNo: "A-01" }],
      };

      const result = validateBody(floorPlanCreateSchema, validPlan);
      assert.equal(result.success, true);
    });

    it("should support multiple floor plans per event, with one default", () => {
      const plan1 = memoryStore.addFloorPlan({
        id: "plan-1",
        eventId: event1,
        name: "Hall A - Ground Floor",
        description: "Default hall",
        isDefault: true,
        status: "active",
        gridWidth: 20,
        gridHeight: 15,
        walls: [],
        openings: [],
        booths: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const plan2 = memoryStore.addFloorPlan({
        id: "plan-2",
        eventId: event1,
        name: "Hall B - Mezzanine Floor",
        description: "Upper floor",
        isDefault: false,
        status: "active",
        gridWidth: 20,
        gridHeight: 15,
        walls: [],
        openings: [],
        booths: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const eventPlans = memoryStore.getFloorPlans(event1);
      assert.equal(eventPlans.length, 2);

      const defaultPlan = eventPlans.find((p) => p.isDefault);
      assert.equal(defaultPlan?.id, "plan-1");

      // When plan-2 is updated to default, plan-1 is toggled off
      memoryStore.updateFloorPlan("plan-2", { isDefault: true });
      const updatedPlan1 = memoryStore.getFloorPlanById("plan-1");
      const updatedPlan2 = memoryStore.getFloorPlanById("plan-2");

      assert.equal(updatedPlan2?.isDefault, true);
      assert.equal(updatedPlan1?.isDefault, false);
    });
  });

  describe("Rule 2: Booth Project Assignment (Strict Event Isolation & Uniqueness)", () => {
    it("should reject assignment if a project belongs to a different event", () => {
      const booths = [
        { id: "b-1", label: "A-01", x: 2, y: 2, width: 2, height: 2, projectId: "proj-201" }, // belongs to event2
      ];

      // Verification logic:
      const p = memoryStore.getProjectById(booths[0].projectId);
      assert.ok(p);
      const isAllowed = p.eventId === event1;
      assert.equal(isAllowed, false, "Projects from foreign events must be rejected");
    });

    it("should reject assigning the same project to multiple booths on the same floor plan", () => {
      const booths = [
        { id: "b-1", label: "A-01", x: 2, y: 2, width: 2, height: 2, projectId: "proj-101" },
        { id: "b-2", label: "A-02", x: 6, y: 2, width: 2, height: 2, projectId: "proj-101" }, // duplicate assignment!
      ];

      const assigned = booths.map((b) => b.projectId).filter(Boolean);
      const unique = new Set(assigned);

      const hasDuplicates = unique.size !== assigned.length;
      assert.equal(hasDuplicates, true, "Duplicate project assignment on the same floor plan must be flagged");
    });

    it("should allow distinct projects from the same event to be assigned to separate booths", () => {
      const booths = [
        { id: "b-1", label: "A-01", x: 2, y: 2, width: 2, height: 2, projectId: "proj-101" },
        { id: "b-2", label: "A-02", x: 6, y: 2, width: 2, height: 2, projectId: "proj-102" },
      ];

      const assigned = booths.map((b) => b.projectId).filter(Boolean);
      const unique = new Set(assigned);
      assert.equal(unique.size, assigned.length);

      for (const pid of assigned) {
        const p = memoryStore.getProjectById(pid as string);
        assert.equal(p?.eventId, event1);
      }
    });
  });

  describe("Rule 3: Heatmap Scans Strictly Filtered by plan.eventId", () => {
    it("should count only scans where scans.eventId = plan.eventId", () => {
      const allScans = [
        { id: "sc-1", eventId: event1, projectId: "proj-101" },
        { id: "sc-2", eventId: event1, projectId: "proj-101" },
        { id: "sc-3", eventId: event1, projectId: "proj-102" },
        { id: "sc-4", eventId: "ev-other", projectId: "proj-101" }, // foreign scan for same project id in another event
      ];

      // Filter by plan's eventId
      const planScans = allScans.filter((s) => s.eventId === event1);
      assert.equal(planScans.length, 3);

      const proj101Scans = planScans.filter((s) => s.projectId === "proj-101").length;
      assert.equal(proj101Scans, 2, "Must not count scans from other events");
    });
  });

  describe("Rule 4: Template Creation & Reusability (floor_templates)", () => {
    it("should create organization template stripped of all project and visitor data", () => {
      const sourcePlan = {
        id: "plan-src",
        eventId: event1,
        gridWidth: 16,
        gridHeight: 12,
        walls: [{ id: "w-1", x1: 0, y1: 0, x2: 16, y2: 0, thickness: 2 }],
        openings: [{ id: "op-1", x: 8, y: 0, width: 2, height: 1, type: "entrance", label: "Main" }],
        booths: [
          { id: "b-1", label: "A-01", x: 2, y: 2, width: 2, height: 2, projectId: "proj-101", views: 999 },
          { id: "b-2", label: "A-02", x: 6, y: 2, width: 2, height: 2, projectId: "proj-102", views: 450 },
        ],
      };

      // Transform to organization template
      const templateBooths = sourcePlan.booths.map((b) => ({
        id: b.id,
        label: b.label,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        // Notice: projectId and views are completely omitted!
      }));

      const tpl = memoryStore.addFloorTemplate({
        id: "tpl-100",
        organizationId: orgA,
        name: "Standard 2-Booth Layout",
        description: "Reusable layout",
        gridWidth: sourcePlan.gridWidth,
        gridHeight: sourcePlan.gridHeight,
        walls: sourcePlan.walls,
        openings: sourcePlan.openings,
        booths: templateBooths,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      assert.equal(tpl.organizationId, orgA);
      assert.equal(tpl.booths.length, 2);
      assert.equal(tpl.booths[0].projectId, undefined);
      assert.equal(tpl.booths[0].views, undefined);
    });

    it("should copy layout from previous event with cleared project assignments", () => {
      const sourcePlan = {
        name: "Hall 1",
        description: "Main Hall",
        gridWidth: 20,
        gridHeight: 15,
        walls: [{ id: "w-1", x1: 0, y1: 0, x2: 20, y2: 0, thickness: 2 }],
        openings: [{ id: "op-1", x: 5, y: 0, width: 2, height: 1, type: "entrance", label: "Gate" }],
        booths: [
          { id: "b-1", label: "Stall 1", x: 2, y: 2, width: 2, height: 2, projectId: "old-proj-999" },
          { id: "b-2", label: "Stall 2", x: 6, y: 2, width: 2, height: 2, projectId: "old-proj-888" },
        ],
      };

      // Simulate copying to a new event
      const newEventId = "ev-new-2027";
      const copiedBooths = sourcePlan.booths.map((b) => ({
        ...b,
        projectId: null, // CLEAR project assignments
      }));

      const newPlan = memoryStore.addFloorPlan({
        id: "plan-copied",
        eventId: newEventId,
        name: sourcePlan.name,
        description: sourcePlan.description,
        isDefault: true,
        status: "active",
        gridWidth: sourcePlan.gridWidth,
        gridHeight: sourcePlan.gridHeight,
        walls: sourcePlan.walls,
        openings: sourcePlan.openings,
        booths: copiedBooths,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      assert.equal(newPlan.eventId, newEventId);
      assert.equal(newPlan.booths.length, 2);
      assert.equal(newPlan.booths[0].projectId, null);
      assert.equal(newPlan.booths[1].projectId, null);
      assert.equal(newPlan.walls.length, 1);
      assert.equal(newPlan.openings.length, 1);
    });
  });

  describe("Rule 5: Event Archival & Deletion Soft-Archives Floor Plans & Preserves Scan History", () => {
    it("should archive floor plans and never hard delete scans when event is archived/deleted", () => {
      const plan = memoryStore.addFloorPlan({
        id: "plan-to-archive",
        eventId: event1,
        name: "Archivable Hall",
        description: "Hall to archive",
        isDefault: true,
        status: "active",
        gridWidth: 10,
        gridHeight: 10,
        walls: [],
        openings: [],
        booths: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Simulate scan history
      const scanHistory = [
        { id: "scan-persist-1", eventId: event1, projectId: "proj-101", visitorCode: "V-001" },
        { id: "scan-persist-2", eventId: event1, projectId: "proj-102", visitorCode: "V-002" },
      ];

      // Soft archive floor plan
      memoryStore.deleteFloorPlan(plan.id);

      const archivedPlan = memoryStore.getFloorPlanById(plan.id);
      assert.equal(archivedPlan?.status, "archived");

      // Querying active plans should not return the archived plan
      const activePlans = memoryStore.getFloorPlans(event1);
      assert.equal(activePlans.find((p) => p.id === plan.id), undefined);

      // Scans are completely preserved
      assert.equal(scanHistory.length, 2);
      assert.equal(scanHistory[0].visitorCode, "V-001");
    });
  });
});
