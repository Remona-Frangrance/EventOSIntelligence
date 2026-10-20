// Comprehensive resilient data store for the Event Intelligence Platform
// Supports all 4 roles: Admin (1), Participants (2+), Judges (4), Visitors

export type UserRole = "admin" | "participant" | "judge" | "visitor";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
  phone?: string;
  interests?: string[];
  projectId?: string;
  judgeCode?: string;
  createdAt: string;
};

export type DemoEvent = {
  id: string;
  name: string;
  slug: string;
  type: string;
  tagline: string;
  description: string;
  venue: string;
  city: string;
  startsAt: string;
  endsAt: string;
  status: string;
  bannerGradient: string;
  scoringCriteria: { key: string; label: string; max: number; weight: number }[];
  categories: string[];
  registrationOpen: boolean;
  createdAt: string;
  stats?: { projects: number; visitors: number; scores: number; scans: number };
};

export type DemoProject = {
  id: string;
  eventId: string;
  userId?: string;
  title: string;
  category: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  members: { name: string; role: string }[];
  description: string;
  techStack: string[];
  imageUrl: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl?: string;
  code: string;
  status: string;
  boothNo: string;
  views: number;
  checkins: number;
  votes: number;
  createdAt: string;
  scoreCount?: number;
};

export type DemoJudge = {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  organization: string;
  expertise: string[];
  assignedCategories: string[];
  code: string;
  avatarColor: string;
  createdAt: string;
};

export type DemoScore = {
  id: string;
  eventId: string;
  projectId: string;
  judgeId: string;
  criteriaScores: Record<string, number>;
  total: number;
  weightedTotal: number;
  comment: string;
  flagged: boolean;
  flagReason: string;
  createdAt: string;
};

export type DemoVisitor = {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  type: string;
  interests: string[];
  code: string;
  checkedIn: boolean;
  checkinAt?: string | null;
  createdAt: string;
};

export type DemoCertificate = {
  id: string;
  eventId: string;
  projectId?: string | null;
  recipientName: string;
  recipientEmail?: string;
  role: string;
  title: string;
  code: string;
  issuedAt: string;
  signatory1?: string;
  signatory2?: string;
  theme?: string;
};

export type DemoFeedback = {
  id: string;
  eventId: string;
  projectId?: string | null;
  authorName: string;
  authorRole: string;
  rating: number;
  message: string;
  sentiment: string;
  createdAt: string;
};

const now = new Date();

// PRE-SEEDED USERS ACROSS ALL 4 ROLES
export const INITIAL_USERS: DemoUser[] = [
  // 1. ADMIN - Chief Platform Organizer
  {
    id: "usr-admin-1",
    name: "Alex Vance (Chief Organizer)",
    email: "admin@nexathon.com",
    password: "admin123",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    organization: "Nexathon Grand Jury Council",
    phone: "+91 98111 00001",
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
  },
  // 2. PARTICIPANT 1 - HealthTech Team Lead
  {
    id: "usr-part-1",
    name: "Aarav Mehta",
    email: "pulse@nexathon.com",
    password: "part123",
    role: "participant",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    organization: "Team NeuralPulse",
    phone: "+91 98765 43210",
    projectId: "p-mediqueue",
    createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
  },
  // 3. PARTICIPANT 2 - AI/ML Accessibility Team Lead
  {
    id: "usr-part-2",
    name: "Kavya Iyer",
    email: "neural@nexathon.com",
    password: "part123",
    role: "participant",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    organization: "Team NeuralNest",
    phone: "+91 98765 11223",
    projectId: "p-signbridge",
    createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
  },
  // 4. JUDGE 1 - Google AI / Professor (AI/ML Track)
  {
    id: "usr-judge-1",
    name: "Dr. Anjali Rao",
    email: "anjali@nexathon.com",
    password: "judge123",
    role: "judge",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    organization: "ex-Google AI · Professor",
    judgeCode: "JUDGE-A1B2",
    createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
  },
  // 5. JUDGE 2 - Sequoia Scout / FinTech
  {
    id: "usr-judge-2",
    name: "Suresh Menon",
    email: "suresh@nexathon.com",
    password: "judge123",
    role: "judge",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    organization: "Sequoia Scout · FinTech Lead",
    judgeCode: "JUDGE-C3D4",
    createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
  },
  // 6. JUDGE 3 - Bosch IoT Lead
  {
    id: "usr-judge-3",
    name: "Fatima Khan",
    email: "fatima@nexathon.com",
    password: "judge123",
    role: "judge",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    organization: "Bosch · IoT Architecture Lead",
    judgeCode: "JUDGE-E5F6",
    createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
  },
  // 7. JUDGE 4 - Apollo Hospitals HealthTech Director
  {
    id: "usr-judge-4",
    name: "Dr. Vikram Iyer",
    email: "vikram@nexathon.com",
    password: "judge123",
    role: "judge",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    organization: "Apollo Hospitals · HealthTech Director",
    judgeCode: "JUDGE-G7H8",
    createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
  },
  // 8. VISITOR - Attendee with Declared Interests
  {
    id: "usr-visitor-1",
    name: "Devansh Patel",
    email: "visitor@nexathon.com",
    password: "visitor123",
    role: "visitor",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    organization: "Tech Angel / Tech Explorer",
    interests: ["AI/ML", "HealthTech", "Robotics"],
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
  },
];

export const INITIAL_EVENTS: DemoEvent[] = [
  {
    id: "ev-nexathon-26",
    name: "NEXATHON '26 — National Hackathon Finals",
    slug: "nexathon-26",
    type: "hackathon",
    tagline: "48 hours. 120 teams. One national champion.",
    description: "The national finale of Nexathon — 120 shortlisted teams build across AI, IoT, FinTech, HealthTech and GreenTech tracks in a 48-hour grand finale.",
    venue: "Innovation Tower, Hall A–C",
    city: "Bengaluru",
    startsAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
    endsAt: new Date(now.getTime() + 42 * 3600000).toISOString(),
    status: "live",
    bannerGradient: "from-violet-600 via-fuchsia-500 to-amber-400",
    scoringCriteria: [
      { key: "innovation", label: "Innovation & Novelty", max: 10, weight: 1.2 },
      { key: "execution", label: "Technical Execution", max: 10, weight: 1.0 },
      { key: "impact", label: "Market Impact & Scale", max: 10, weight: 1.0 },
      { key: "pitch", label: "Product Demo & Pitch", max: 10, weight: 0.8 },
    ],
    categories: ["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech", "Robotics"],
    registrationOpen: true,
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    stats: { projects: 8, visitors: 342, scores: 24, scans: 1420 },
  },
  {
    id: "ev-startup-expo-26",
    name: "Startup Expo & Tech Fest '26",
    slug: "startup-expo-26",
    type: "expo",
    tagline: "80 startup stalls · investors · 5,000 visitors",
    description: "Flagship startup exposition — 80 demo stalls, investor walkthroughs, live pitches and the Startup of the Year award decided by judges and attendees.",
    venue: "Convention Centre",
    city: "Hyderabad",
    startsAt: new Date(now.getTime() + 3 * 86400000).toISOString(),
    endsAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
    status: "upcoming",
    bannerGradient: "from-cyan-500 via-blue-600 to-violet-700",
    scoringCriteria: [
      { key: "innovation", label: "Market Viability", max: 10, weight: 1.2 },
      { key: "execution", label: "Product Traction", max: 10, weight: 1.0 },
      { key: "impact", label: "Scalability", max: 10, weight: 1.0 },
      { key: "pitch", label: "Pitch Deck", max: 10, weight: 0.8 },
    ],
    categories: ["AI/ML", "FinTech", "D2C", "AgriTech", "SpaceTech", "Robotics"],
    registrationOpen: true,
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    stats: { projects: 12, visitors: 580, scores: 0, scans: 290 },
  },
];

export const INITIAL_PROJECTS: DemoProject[] = [
  {
    id: "p-mediqueue",
    eventId: "ev-nexathon-26",
    userId: "usr-part-1",
    title: "MediQueue AI — Autonomous Emergency Triage",
    category: "HealthTech",
    teamName: "PulseCoders",
    leaderName: "Aarav Mehta",
    leaderEmail: "pulse@nexathon.com",
    leaderPhone: "+91 98765 43210",
    members: [
      { name: "Aarav Mehta", role: "AI & Lead" },
      { name: "Sanya Iyer", role: "Fullstack" },
      { name: "Kavya Reddy", role: "UX & Clinical Flow" },
    ],
    description: "AI triage that slashes hospital OPD wait times by 63% using edge computer vision, symptom-to-department routing, and live bed telemetry.",
    techStack: ["Next.js", "Python", "FastAPI", "YOLOv8", "PostgreSQL"],
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80",
    demoUrl: "https://mediqueue-demo.vercel.app",
    repoUrl: "https://github.com/pulse-coders/mediqueue-ai",
    videoUrl: "https://youtube.com/watch?v=demo-mediqueue",
    code: "PRJ-AX7K2Q",
    status: "approved",
    boothNo: "B-1",
    views: 890,
    checkins: 142,
    votes: 94,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-signbridge",
    eventId: "ev-nexathon-26",
    userId: "usr-part-2",
    title: "SignBridge — On-Device Sign Language to Speech",
    category: "AI/ML",
    teamName: "NeuralNest",
    leaderName: "Kavya Iyer",
    leaderEmail: "neural@nexathon.com",
    leaderPhone: "+91 98765 11223",
    members: [
      { name: "Kavya Iyer", role: "ML Engineer" },
      { name: "Vikram Das", role: "Mobile Dev" },
      { name: "Meera Nair", role: "Data Scientist" },
    ],
    description: "Real-time sign-language to natural speech translator running fully on edge devices at 28fps. Supports 3 regional sign dialects without internet.",
    techStack: ["PyTorch", "MediaPipe", "Flutter", "WebRTC"],
    imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    demoUrl: "https://signbridge.app",
    repoUrl: "https://github.com/neuralnest/signbridge",
    videoUrl: "https://youtube.com/watch?v=demo-signbridge",
    code: "PRJ-DQ93FZ",
    status: "approved",
    boothNo: "B-2",
    views: 1120,
    checkins: 204,
    votes: 168,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-agrosense",
    eventId: "ev-nexathon-26",
    title: "AgroSense Mesh — LoRa Soil Intelligence",
    category: "IoT",
    teamName: "FieldBytes",
    leaderName: "Rohan Patel",
    leaderEmail: "rohan@fieldbytes.dev",
    leaderPhone: "+91 98765 99887",
    members: [
      { name: "Rohan Patel", role: "Hardware" },
      { name: "Ananya Das", role: "Firmware" },
    ],
    description: "Solar mesh network of soil sensors giving smallholder farmers hyperlocal irrigation alerts over standard SMS — no smartphone required.",
    techStack: ["ESP32", "LoRa", "Next.js", "C++", "MQTT"],
    imageUrl: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80",
    demoUrl: "https://agrosense.fieldbytes.dev",
    repoUrl: "https://github.com/fieldbytes/agrosense-mesh",
    code: "PRJ-BM9P41",
    status: "approved",
    boothNo: "B-3",
    views: 640,
    checkins: 92,
    votes: 75,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-credscore",
    eventId: "ev-nexathon-26",
    title: "CredScore Campus — Alternative Student Underwriting",
    category: "FinTech",
    teamName: "LedgerLabs",
    leaderName: "Aditya Gupta",
    leaderEmail: "aditya@ledgerlabs.io",
    leaderPhone: "+91 98765 66778",
    members: [
      { name: "Aditya Gupta", role: "FinTech Lead" },
      { name: "Priya Menon", role: "Risk Modeler" },
    ],
    description: "Alternative credit scoring algorithm for university students using rent, gig income, and campus-merchant payment history.",
    techStack: ["Node.js", "PostgreSQL", "Plaid", "React"],
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
    demoUrl: "https://credscore.ledgerlabs.io",
    repoUrl: "https://github.com/ledgerlabs/credscore",
    code: "PRJ-CX21D8",
    status: "approved",
    boothNo: "B-4",
    views: 530,
    checkins: 67,
    votes: 61,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-carbonledger",
    eventId: "ev-nexathon-26",
    title: "CarbonLedger — Decentralized Offset Verification",
    category: "GreenTech",
    teamName: "TerraForm",
    leaderName: "Meera Krishnan",
    leaderEmail: "meera@terraform.eco",
    leaderPhone: "+91 98765 55443",
    members: [{ name: "Meera Krishnan", role: "Climate Lead" }],
    description: "Verifiable carbon credits for campuses — every tree, solar roof, and electric shuttle ride minted as an auditable digital offset.",
    techStack: ["Solidity", "IPFS", "Next.js", "Python"],
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
    demoUrl: "https://carbonledger.eco",
    repoUrl: "https://github.com/terraform/carbonledger",
    code: "PRJ-ER44LM",
    status: "approved",
    boothNo: "B-5",
    views: 710,
    checkins: 115,
    votes: 89,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_JUDGES: DemoJudge[] = [
  {
    id: "jd-01",
    eventId: "ev-nexathon-26",
    userId: "usr-judge-1",
    name: "Dr. Anjali Rao",
    email: "anjali@nexathon.com",
    organization: "ex-Google AI · Professor",
    expertise: ["AI/ML", "NLP", "Computer Vision"],
    assignedCategories: ["AI/ML", "HealthTech"],
    code: "JUDGE-A1B2",
    avatarColor: "from-violet-500 to-fuchsia-500",
    createdAt: new Date().toISOString(),
  },
  {
    id: "jd-02",
    eventId: "ev-nexathon-26",
    userId: "usr-judge-2",
    name: "Suresh Menon",
    email: "suresh@nexathon.com",
    organization: "Sequoia Scout · FinTech Lead",
    expertise: ["FinTech", "Startups", "Venture Scalability"],
    assignedCategories: ["FinTech", "GreenTech"],
    code: "JUDGE-C3D4",
    avatarColor: "from-cyan-500 to-blue-600",
    createdAt: new Date().toISOString(),
  },
  {
    id: "jd-03",
    eventId: "ev-nexathon-26",
    userId: "usr-judge-3",
    name: "Fatima Khan",
    email: "fatima@nexathon.com",
    organization: "Bosch · IoT Architecture Lead",
    expertise: ["IoT", "Embedded", "Robotics", "Hardware"],
    assignedCategories: ["IoT", "Robotics"],
    code: "JUDGE-E5F6",
    avatarColor: "from-amber-400 to-orange-600",
    createdAt: new Date().toISOString(),
  },
  {
    id: "jd-04",
    eventId: "ev-nexathon-26",
    userId: "usr-judge-4",
    name: "Dr. Vikram Iyer",
    email: "vikram@nexathon.com",
    organization: "Apollo Hospitals · HealthTech Director",
    expertise: ["HealthTech", "AI/ML", "Clinical Informatics"],
    assignedCategories: ["HealthTech", "AI/ML"],
    code: "JUDGE-G7H8",
    avatarColor: "from-emerald-400 to-teal-600",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_SCORES: DemoScore[] = [
  // Judge 1 (Dr. Anjali Rao) scoring MediQueue
  {
    id: "sc-01",
    eventId: "ev-nexathon-26",
    projectId: "p-mediqueue",
    judgeId: "jd-01",
    criteriaScores: { innovation: 9, execution: 9, impact: 10, pitch: 8 },
    total: 36,
    weightedTotal: 362,
    comment: "Extremely impressive hospital workflow understanding. The edge latency numbers are genuine.",
    flagged: false,
    flagReason: "",
    createdAt: new Date(now.getTime() - 7200000).toISOString(),
  },
  // Judge 4 (Dr. Vikram Iyer) scoring MediQueue
  {
    id: "sc-02",
    eventId: "ev-nexathon-26",
    projectId: "p-mediqueue",
    judgeId: "jd-04",
    criteriaScores: { innovation: 9, execution: 8, impact: 9, pitch: 9 },
    total: 35,
    weightedTotal: 350,
    comment: "Directly solves our emergency room admission bottleneck. Would love to pilot at Apollo.",
    flagged: false,
    flagReason: "",
    createdAt: new Date(now.getTime() - 5400000).toISOString(),
  },
  // Judge 1 scoring SignBridge
  {
    id: "sc-03",
    eventId: "ev-nexathon-26",
    projectId: "p-signbridge",
    judgeId: "jd-01",
    criteriaScores: { innovation: 10, execution: 10, impact: 9, pitch: 9 },
    total: 38,
    weightedTotal: 382,
    comment: "Running fully on-device without cloud dependency is phenomenal engineering work.",
    flagged: false,
    flagReason: "",
    createdAt: new Date(now.getTime() - 3600000).toISOString(),
  },
  // Judge 3 (Fatima Khan) scoring AgroSense Mesh
  {
    id: "sc-04",
    eventId: "ev-nexathon-26",
    projectId: "p-agrosense",
    judgeId: "jd-03",
    criteriaScores: { innovation: 8, execution: 9, impact: 9, pitch: 8 },
    total: 34,
    weightedTotal: 340,
    comment: "Robust antenna mesh choice. Solar sleep mode works very well.",
    flagged: false,
    flagReason: "",
    createdAt: new Date(now.getTime() - 1800000).toISOString(),
  },
];

export const INITIAL_VISITORS: DemoVisitor[] = [
  {
    id: "vis-01",
    eventId: "ev-nexathon-26",
    userId: "usr-visitor-1",
    name: "Devansh Patel",
    email: "visitor@nexathon.com",
    phone: "+91 99000 12345",
    type: "visitor",
    interests: ["AI/ML", "HealthTech", "Robotics"],
    code: "VIS-10042",
    checkedIn: true,
    checkinAt: new Date(now.getTime() - 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CERTIFICATES: DemoCertificate[] = [
  {
    id: "cert-01",
    eventId: "ev-nexathon-26",
    projectId: "p-mediqueue",
    recipientName: "Aarav Mehta & Team PulseCoders",
    recipientEmail: "pulse@nexathon.com",
    role: "winner",
    title: "1st Place Grand National Champion — Nexathon '26",
    code: "CERT-NX9421",
    issuedAt: new Date().toISOString(),
    signatory1: "Dr. Elena Vance (Head Jury)",
    signatory2: "Vikram Malhotra (Director)",
    theme: "gold",
  },
  {
    id: "cert-02",
    eventId: "ev-nexathon-26",
    projectId: "p-signbridge",
    recipientName: "Kavya Iyer & Team NeuralNest",
    recipientEmail: "neural@nexathon.com",
    role: "runner_up",
    title: "National Finalist & Best AI Social Impact Award",
    code: "CERT-NX8832",
    issuedAt: new Date().toISOString(),
    signatory1: "Dr. Elena Vance (Head Jury)",
    signatory2: "Vikram Malhotra (Director)",
    theme: "cyber",
  },
];

export const INITIAL_FEEDBACKS: DemoFeedback[] = [
  {
    id: "fb-01",
    eventId: "ev-nexathon-26",
    projectId: "p-mediqueue",
    authorName: "Devansh Patel",
    authorRole: "visitor",
    rating: 5,
    message: "MediQueue AI blew my mind! The triage response time is virtually instantaneous.",
    sentiment: "positive",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-02",
    eventId: "ev-nexathon-26",
    projectId: "p-signbridge",
    authorName: "Pooja Sharma",
    authorRole: "visitor",
    rating: 5,
    message: "SignBridge demo in Hall A was the standout project of the day.",
    sentiment: "positive",
    createdAt: new Date().toISOString(),
  },
];

// In-memory mutation cache ensuring smooth state synchronization
const memoryUsers = [...INITIAL_USERS];
const memoryEvents = [...INITIAL_EVENTS];
const memoryProjects = [...INITIAL_PROJECTS];
const memoryJudges = [...INITIAL_JUDGES];
const memoryScores = [...INITIAL_SCORES];
const memoryVisitors = [...INITIAL_VISITORS];
const memoryCertificates = [...INITIAL_CERTIFICATES];
const memoryFeedbacks = [...INITIAL_FEEDBACKS];

export const memoryStore = {
  // Users
  getUsers: () => memoryUsers,
  getUserByEmail: (email: string) => memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  getUserById: (id: string) => memoryUsers.find((u) => u.id === id),
  addUser: (u: DemoUser) => {
    memoryUsers.unshift(u);
    return u;
  },
  updateUser: (id: string, updates: Partial<DemoUser>) => {
    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx >= 0) {
      memoryUsers[idx] = { ...memoryUsers[idx], ...updates };
      return memoryUsers[idx];
    }
    return null;
  },

  // Events
  getEvents: () => memoryEvents,
  getEventById: (id: string) => memoryEvents.find((e) => e.id === id || e.slug === id),
  addEvent: (ev: DemoEvent) => {
    memoryEvents.unshift(ev);
    return ev;
  },

  // Projects
  getProjects: (eventId?: string) => {
    return eventId ? memoryProjects.filter((p) => p.eventId === eventId) : memoryProjects;
  },
  getProjectById: (id: string) => memoryProjects.find((p) => p.id === id),
  getProjectByCode: (code: string) => memoryProjects.find((p) => p.code.toUpperCase() === code.toUpperCase()),
  getProjectByUserId: (userId: string) => memoryProjects.find((p) => p.userId === userId),
  addProject: (p: DemoProject) => {
    memoryProjects.unshift(p);
    return p;
  },
  updateProject: (id: string, updates: Partial<DemoProject>) => {
    const idx = memoryProjects.findIndex((p) => p.id === id);
    if (idx >= 0) {
      memoryProjects[idx] = { ...memoryProjects[idx], ...updates };
      return memoryProjects[idx];
    }
    return null;
  },

  // Judges
  getJudges: (eventId?: string) => {
    return eventId ? memoryJudges.filter((j) => j.eventId === eventId) : memoryJudges;
  },
  getJudgeByCode: (code: string) => memoryJudges.find((j) => j.code.toUpperCase() === code.toUpperCase()),
  getJudgeByEmail: (email: string) => memoryJudges.find((j) => j.email.toLowerCase() === email.toLowerCase()),
  addJudge: (j: DemoJudge) => {
    memoryJudges.unshift(j);
    return j;
  },

  // Scores
  getScores: (params?: { eventId?: string; projectId?: string; judgeId?: string }) => {
    return memoryScores.filter((s) => {
      if (params?.eventId && s.eventId !== params.eventId) return false;
      if (params?.projectId && s.projectId !== params.projectId) return false;
      if (params?.judgeId && s.judgeId !== params.judgeId) return false;
      return true;
    });
  },
  addScore: (score: DemoScore) => {
    const existingIdx = memoryScores.findIndex(
      (s) => s.projectId === score.projectId && s.judgeId === score.judgeId
    );
    if (existingIdx >= 0) {
      memoryScores[existingIdx] = { ...memoryScores[existingIdx], ...score };
      return memoryScores[existingIdx];
    }
    memoryScores.unshift(score);
    return score;
  },

  // Visitors
  getVisitors: (eventId?: string) => {
    return eventId ? memoryVisitors.filter((v) => v.eventId === eventId) : memoryVisitors;
  },
  getVisitorByCode: (code: string) => memoryVisitors.find((v) => v.code.toUpperCase() === code.toUpperCase()),
  getVisitorByUserId: (userId: string) => memoryVisitors.find((v) => v.userId === userId),
  addVisitor: (v: DemoVisitor) => {
    memoryVisitors.unshift(v);
    return v;
  },
  updateVisitor: (id: string, updates: Partial<DemoVisitor>) => {
    const idx = memoryVisitors.findIndex((v) => v.id === id);
    if (idx >= 0) {
      memoryVisitors[idx] = { ...memoryVisitors[idx], ...updates };
      return memoryVisitors[idx];
    }
    return null;
  },

  // Certificates
  getCertificates: (eventId?: string, code?: string) => {
    if (code) return memoryCertificates.find((c) => c.code.toUpperCase() === code.toUpperCase());
    return eventId ? memoryCertificates.filter((c) => c.eventId === eventId) : memoryCertificates;
  },
  addCertificate: (cert: DemoCertificate) => {
    memoryCertificates.unshift(cert);
    return cert;
  },

  // Feedback
  getFeedbacks: (eventId?: string, projectId?: string) => {
    return memoryFeedbacks.filter((f) => {
      if (eventId && f.eventId !== eventId) return false;
      if (projectId && f.projectId !== projectId) return false;
      return true;
    });
  },
  addFeedback: (fb: DemoFeedback) => {
    memoryFeedbacks.unshift(fb);
    return fb;
  },
};
