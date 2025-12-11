import { useAuth } from "./auth/AuthContext";
import BetaAuthModal from "./components/BetaAuthModal";
import BetaAdminPanel from "./components/BetaAdminPanel";
import BetaFeedbackModal from "./components/BetaFeedbackModal";
import FeedbackModal from "./components/FeedbackModal";
import { isAdminEmail, getDownloadUsage, incrementDownloadCount } from "./auth/betaAccess";
import { loadProjectsForUser, saveProjectForUser, deleteProjectForUser } from "./auth/projectStore";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  LayoutGrid, PlusCircle, FolderOpen, Trash2, 
  Globe, Building, Save, X, Copy, Pencil, DoorClosed, 
  DoorOpen, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, 
  Brain, Check, AlertTriangle, TreeDeciduous, RectangleHorizontal, 
  Menu, ChevronDown, Search, Info, Flame, Wind, Accessibility, RotateCcw,
  Eye, Layers, UserCircle, History, Box, Download, Library, MoveHorizontal,
  Lock, Settings, MousePointer, Power, Printer, FileText, Volume2, Scale,
  BookOpen, UploadCloud, Wand2, ShieldCheck, Wrench, RefreshCw, Zap, MessageSquare
} from 'lucide-react';

// --- UTILS ---

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

const formatDate = (date) => new Date(date).toLocaleString();

const generateUniqueMark = (doors = [], base = "D-001") => {
  const existing = new Set(doors.map((d) => d.mark));
  if (!existing.has(base)) return base;
  let idx = 2;
  let candidate = `${base}-${String(idx).padStart(2, '0')}`;
  while (existing.has(candidate)) {
    idx += 1;
    candidate = `${base}-${String(idx).padStart(2, '0')}`;
  }
  return candidate;
};

// --- CONSTANTS & DATA ---

const FACILITY_DATA = {
  "Commercial Office": {
    usages: ["Office / Passage", "Meeting Room", "Director Cabin", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Storage / Service", "Server / IT", "Main Entrance", "Fire Door (Cross-Corridor)", "Prayer / Quiet Room"]
  },
  "Hospital / Healthcare": {
    usages: ["Patient Room", "Operating Theatre", "Consultation / Exam", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Clean / Dirty Utility", "Main Entrance", "Radiation Protection", "Prayer / Quiet Room"]
  },
  "Education / School": {
    usages: ["Classroom", "Assembly / Hall", "Staff Office", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Storage / Service", "Main Entrance", "Gymnasium", "Music Room"]
  },
  "Airport / Transport": {
    usages: ["Terminal Entry", "Security / Checkpoint", "Boarding Gate", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Staff Only / Service", "Baggage / Logistics", "Prayer / Quiet Room"]
  },
  "Hospitality / Hotel": {
    usages: ["Guest Room Entry", "Connecting Door", "Ballroom / Assembly", "Kitchen / Service", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Back of House", "Main Entrance"]
  },
  "Residential": {
    usages: ["Unit Entrance (Fire Rated)", "Bedroom / Internal", "Bathroom / Privacy", "Kitchen", "Balcony / External", "Common Corridor", "Stairwell / Exit", "Service / Utility"]
  }
};

const ACOUSTIC_RECOMMENDATIONS = {
    "Meeting Room": 40, "Director Cabin": 40, "Conference Room": 45, "Patient Room": 35,
    "Consultation / Exam": 40, "Classroom": 35, "Music Room": 50, "Prayer / Quiet Room": 45,
    "Server / IT": 40, "Guest Room Entry": 42, "Unit Entrance (Fire Rated)": 35, "Restroom": 30
};

const DOOR_MATERIALS = ["Timber", "Metal", "Glass", "Aluminum"];
const DOOR_CONFIGS = ["Single", "Double"];
const HANDING_OPTIONS = ["LH", "RH", "LHR", "RHR"];
const UNIQUE_DOOR_USES = Array.from(
  new Set(
    Object.values(FACILITY_DATA).flatMap((facility) => facility.usages)
  )
);
const POSSIBLE_DOOR_SET_COMBINATIONS =
  UNIQUE_DOOR_USES.length *
  DOOR_MATERIALS.length *
  DOOR_CONFIGS.length *
  HANDING_OPTIONS.length;
const HERO_STATS = [
  {
    id: "profiles",
    value: 1216,
    metric: "Doorset Profiles",
    subtext: "Ready-to-configure templates for fast project setup.",
    icon: Layers
  },
  {
    id: "scenarios",
    value: UNIQUE_DOOR_USES.length,
    metric: "Use Case Scenarios",
    subtext: "Preset rules based on building function.",
    icon: Brain
  },
  {
    id: "facilities",
    value: Object.keys(FACILITY_DATA).length,
    metric: "Facility Types",
    subtext: "Office, Healthcare, Education, Airport, Hotel, Residential.",
    icon: Building
  },
  {
    id: "materials",
    value: DOOR_MATERIALS.length,
    metric: "Door Materials",
    subtext: "Timber, Metal, Glass, Aluminum.",
    icon: Box
  },
  {
    id: "exports",
    value: 3,
    metric: "Export Formats",
    subtext: "BIM, PDF, XLSX deliverables in one click.",
    icon: FileSpreadsheet
  },
  {
    id: "standards",
    value: 2,
    metric: "Global Standards",
    subtext: "EN and ANSI compliance support.",
    icon: Globe
  },
  {
    id: "dashboard",
    value: 1,
    metric: "Project Dashboard",
    subtext: "All projects in one clean, central view.",
    icon: LayoutGrid
  }
];

const INSIGHT_CARDS = [
  {
    label: "Live Insights",
    title: "Compliance Pulse",
    body: "Provides real-time checks against commonly referenced safety and accessibility criteria. Specify with confidence."
  },
  {
    label: "Adaptive Visuals",
    title: "Material Intelligence",
    body: "Switch between door materials from Timber → Glass → Aluminum and see hardware visuals transform in real-time."
  }
];

const WORKFLOW_STEPS_CONTENT = [
  { title: "Project Setup", body: "Define facility, fire-rating, and jurisdiction rules -- the rule engine tunes itself instantly." },
  { title: "Door Schedule", body: "Capture dimensions, STC, ADA, and access logic. Additional locations auto-adjust quantity." },
  { title: "Hardware Sets", body: "Door Hardware Layout Preview shows hinges, closers, maglocks, and panic trim before specification." },
  { title: "Validation & Review", body: "Compliance Pulse verifies life-safety, then exports BIM, PDF, and Excel packages in one click." }
];
const WIZARD_STEPS = ["Project Setup", "Door Schedule", "Hardware Sets", "Validation & Review"];
const WIZARD_SHORT_LABELS = ["SETUP", "SCHEDULE", "PREVIEW", "GENERATE"];
const WHY_INSTASPEC_CARDS = [
  {
    title: "Compliance Support",
    body: "Helps align hardware with common safety standards.",
    icon: ShieldCheck
  },
  {
    title: "Hardware Library",
    body: "Central library of locks, hinges, closers, and access devices.",
    icon: Wrench
  },
  {
    title: "Team Alignment",
    body: "Keeps door, hardware, and export data in sync.",
    icon: RefreshCw
  }
];
const REVIEW_NOTICE =
  "Notice: All auto-generated door hardware content must be reviewed and approved by a qualified subject-matter expert before it is shared or issued. Proceed only if you acknowledge this requirement.";
const MAIN_ENTRANCE_NOTE =
  "Code Check: Main entrance fire rating must be verified per local code based on building height and occupancy.";

const RESIDENTIAL_UNIT_TYPES = ["1BHK", "2BHK", "3BHK"];
const RESIDENTIAL_DEFAULT_MIX = { "1BHK": 0, "2BHK": 4, "3BHK": 0 };
const RESIDENTIAL_UNIT_PLANS = {
  "1BHK": { bedrooms: 1, bathrooms: 1 },
  "2BHK": { bedrooms: 2, bathrooms: 2 },
  "3BHK": { bedrooms: 3, bathrooms: 3 }
};

const isMainEntranceUsage = (value = "") =>
  String(value).toLowerCase().includes("main entrance");

const MainEntranceReminder = ({ doors = [] }) => {
  const needsWarning = doors.some(
    (door) => isMainEntranceUsage(door.use) && Number(door.fire) === 0
  );
  if (!needsWarning) return null;
  return (
    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-3">
      <DoorOpen size={16} />
      <span>{MAIN_ENTRANCE_NOTE}</span>
    </div>
  );
};
const DEFAULT_INSTANT_INPUTS = {
  Residential: {
    floors: 4,
    unitsPerFloor: 4,
    unitMix: { ...RESIDENTIAL_DEFAULT_MIX }
  },
  "Education / School": {
    floors: 3,
    classroomsPerFloor: 6,
    toiletsPerFloor: 2,
    hasAdminLabs: true
  },
  "Commercial Office": {
    floors: 6,
    openLayout: true,
    meetingRooms: 4,
    hasServiceAreas: true
  },
  "Airport / Transport": {
    floors: 2,
    concourses: 1,
    gatesPerConcourse: 6,
    securityZones: 2,
    hasInternationalZone: true
  },
  "Hospital / Healthcare": {
    floors: 5,
    patientRoomsPerFloor: 12,
    operatingRooms: 4,
    icuRoomsPerFloor: 2,
    hasEmergencyDept: true
  },
  "Hospitality / Hotel": {
    floors: 10,
    roomsPerFloor: 18,
    suitesPerFloor: 2,
    hasBallroom: true,
    hasServiceZones: true
  }
};

const cloneInstantInputs = () => JSON.parse(JSON.stringify(DEFAULT_INSTANT_INPUTS));
const getInstantInputsForProject = (project, facilityType) => {
  const defaults = cloneInstantInputs();
  const projectInputs = project?.instantInputs || {};
  return {
    ...defaults[facilityType],
    ...(projectInputs[facilityType] || {})
  };
};

// BHMA Categorization Helper
const BHMA_CATEGORIES = {
    "Hanging": ["Hinges"],
    "Securing": ["Locks", "Cylinders", "Electrified"],
    "Controlling": ["Closers", "Stops", "Handles"],
    "Protecting": ["Seals", "Accessories", "Protecting"]
};

const HISTORY_LIMIT = 30;

const deepClone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    return value;
  }
};

const LAYMAN_HARDWARE_GROUPS = [
  {
    id: "Hanging",
    label: "Hanging",
    description: "Hinges, pivots and fittings",
    categories: BHMA_CATEGORIES.Hanging,
    accent: "from-amber-500 to-orange-500",
    hint: "Edge & hinge zone"
  },
  {
    id: "Securing",
    label: "Securing",
    description: "Locks, bolts and electrified hardware",
    categories: BHMA_CATEGORIES.Securing,
    accent: "from-sky-500 to-indigo-500",
    hint: "Center lockface"
  },
  {
    id: "Controlling",
    label: "Controlling",
    description: "Closers, holders and motion control hardware",
    categories: BHMA_CATEGORIES.Controlling,
    accent: "from-emerald-500 to-emerald-700",
    hint: "Top frame / closer"
  },
  {
    id: "Protecting",
    label: "Protecting",
    description: "Kick plates, seals and protective accessories",
    categories: BHMA_CATEGORIES.Protecting,
    accent: "from-slate-500 to-slate-700",
    hint: "Bottom/kick zone"
  }
];

const getProductItemsForCategories = (categories = []) => {
  return categories.reduce((acc, category) => {
    const catalog = PRODUCT_CATALOG[category];
    if (!catalog?.types?.length) return acc;
    const augmented = catalog.types.map((type) => ({
      ...type,
      category,
      csi: catalog.csi || "",
      description: (type.styles || []).slice(0, 2).join(", ")
    }));
    return acc.concat(augmented);
  }, []);
};

const getBHMACategory = (cat) => {
    if (["Hinges"].includes(cat)) return "Hanging the Door";
    if (["Locks", "Cylinders", "Electrified"].includes(cat)) return "Securing the Door";
    if (["Closers", "Stops", "Handles", "Auto Operator"].includes(cat)) return "Controlling the Door";
    if (["Seals", "Accessories", "Protecting", "Kick Plate", "Threshold"].includes(cat)) return "Protecting the Door";
    return "Other Hardware";
};

// Expanded Product Catalog with CSI Codes and Styles
const PRODUCT_CATALOG = {
  "Hinges": {
    csi: "08 71 10",
    types: [
      { name: "Butt Hinge", styles: ["Ball Bearing", "Plain Bearing", "Concealed Bearing", "Spring Hinge"] },
      { name: "Concealed Hinge", styles: ["3D Adjustable", "Spring Concealed"] },
      { name: "Pivot Set", styles: ["Offset Pivot", "Center Hung", "Intermediate Pivot"] },
      { name: "Continuous Hinge", styles: ["Geared Aluminum", "Pin & Barrel Stainless"] },
      { name: "Patch Fitting", styles: ["Top Patch", "Bottom Patch", "Overpanel Patch"] }
    ]
  },
  "Locks": {
    csi: "08 71 50",
    types: [
      { name: "Mortise Lock", styles: ["Sashlock", "Deadlock", "Latch", "Bathroom Lock", "Nightlatch"] },
      { name: "Cylindrical Lock", styles: ["Leverset", "Knobset", "Interconnected"] },
      { name: "Hotel Lock", styles: ["RFID Mortise", "Mobile Key"] },
      { name: "Panic Bar", styles: ["Rim Type", "Surface Vertical Rod", "Concealed Vertical Rod", "Mortise Type"] },
      { name: "Electric Strike", styles: ["Fail Safe", "Fail Secure"] },
      { name: "Magnetic Lock", styles: ["Surface Mount", "Shear Lock", "Recessed"] },
      { name: "Patch Lock", styles: ["Corner Patch Lock", "Center Patch Lock"] }
    ]
  },
  "Closers": {
    csi: "08 71 60",
    types: [
      { name: "Overhead Closer", styles: ["Rack & Pinion", "Cam Action", "Slide Arm"] },
      { name: "Concealed Closer", styles: ["Overhead Concealed", "Chain Concealed"] },
      { name: "Floor Spring", styles: ["Double Action", "Single Action"] },
      { name: "Auto Operator", styles: ["Electro-Mechanical", "Electro-Hydraulic"] }
    ]
  },
  "Handles": {
    csi: "08 71 70",
    types: [
      { name: "Lever Handle", styles: ["Return to Door", "Straight", "Flat Bar", "Anti-Ligature"] },
      { name: "Pull Handle", styles: ["D-Pull", "T-Bar", "Offset Pull", "Flush Pull"] },
      { name: "Push Plate", styles: ["Square Corner", "Radius Corner"] },
      { name: "Panic Push Pull Handle", styles: ["L-Shaped", "Tube Pull"] }
    ]
  },
  "Stops": {
    csi: "08 71 80",
    types: [
      { name: "Door Stop", styles: ["Floor Mounted Dome", "Wall Mounted Projection", "Skirting Mounted"] },
      { name: "Overhead Stop", styles: ["Surface Mounted", "Concealed"] }
    ]
  },
  "Seals": {
    csi: "08 71 90",
    types: [
      { name: "Drop Seal", styles: ["Mortised", "Surface Mounted"] },
      { name: "Perimeter Seal", styles: ["Batwing", "Bulb", "Brush"] },
      { name: "Acoustic Perimeter Seal", styles: ["STC-40 Compression", "STC-45 Magnetic"] },
      { name: "Automatic Door Bottom", styles: ["Acoustic Drop", "Medium Duty"] },
      { name: "Vision/Louver Gasket", styles: ["High Density", "Intumescent Acoustic"] },
      { name: "Threshold", styles: ["Low Profile (ADA)", "Saddle", "Panic Type"] }
    ]
  },
  "Cylinders": {
    csi: "08 71 50",
    types: [
        { name: "Cylinder", styles: ["Euro Profile", "Oval Profile", "Rim Cylinder", "Mortise Cylinder"] }
    ]
  },
  "Accessories": {
      csi: "08 71 00",
      types: [
          { name: "Kick Plate", styles: ["Satin Stainless", "Polished Stainless", "Brass"] },
          { name: "Flush Bolt", styles: ["Lever Action", "Slide Action"] },
          { name: "Door Viewer", styles: ["Wide Angle", "Electronic"] }
      ]
  },
  "Protecting": {
      csi: "08 79 00",
      types: [
          { name: "Signage", styles: ["Disc", "Rectangular"] }
      ]
  },
  "Electrified": {
      csi: "08 74 00",
      types: [
          { name: "Magnetic Lock", styles: ["Fail-Safe", "Fail-Secure"], requiresRelease: true },
          { name: "Electric Strike", styles: ["Fail-Safe", "Fail-Secure"], requiresTrim: true },
          { name: "Electromechanical Mortise", styles: ["Fail-Safe", "Fail-Secure"], requiresTrim: true },
          { name: "Door Contact", styles: ["Surface", "Recessed"] },
          { name: "Push Button", styles: ["Request-to-Exit", "Emergency"] },
          { name: "Power Supply", styles: ["12/24V Auto", "Dedicated"] },
          { name: "Card Reader", styles: ["Surface Mount", "Flush Mount"] }
      ]
  }
};

const HARDWARE_GROUP_COLUMNS = LAYMAN_HARDWARE_GROUPS.map((group) => ({
  ...group,
  items: getProductItemsForCategories(group.categories)
}));

const LOCK_TYPE_RULES = {
  Timber: ["Mortise Lock", "Cylindrical Lock", "Hotel Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"],
  Metal: ["Mortise Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"],
  Aluminum: ["Mortise Lock", "Electric Strike", "Magnetic Lock"],
  Glass: ["Patch Lock", "Panic Bar", "Magnetic Lock"],
  default: ["Mortise Lock", "Cylindrical Lock", "Hotel Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"]
};

const getAllowedLockTypesForMaterials = (materials = []) => {
  if (!materials.length) return LOCK_TYPE_RULES.default;
  let allowed = null;
  materials.forEach((mat) => {
    const rules = LOCK_TYPE_RULES[mat] || LOCK_TYPE_RULES.default;
    if (allowed === null) allowed = new Set(rules);
    else allowed = new Set([...allowed].filter((type) => rules.includes(type)));
  });
  if (!allowed || allowed.size === 0) return LOCK_TYPE_RULES.default;
  return Array.from(allowed);
};

const ELECTRIFIED_TYPE_RULES = {
  Timber: ["Magnetic Lock", "Electric Strike", "Card Reader"],
  Metal: ["Magnetic Lock", "Electric Strike", "Electromechanical Mortise", "Card Reader"],
  Aluminum: ["Magnetic Lock", "Electric Strike", "Card Reader"],
  Glass: ["Magnetic Lock", "Card Reader"],
  default: ["Magnetic Lock", "Electric Strike", "Card Reader"]
};

const getAllowedElectrifiedTypesForMaterials = (materials = []) => {
  if (!materials.length) return ELECTRIFIED_TYPE_RULES.default;
  let allowed = null;
  materials.forEach((mat) => {
    const rules = ELECTRIFIED_TYPE_RULES[mat] || ELECTRIFIED_TYPE_RULES.default;
    if (allowed === null) allowed = new Set(rules);
    else allowed = new Set([...allowed].filter((type) => rules.includes(type)));
  });
  if (!allowed || allowed.size === 0) return ELECTRIFIED_TYPE_RULES.default;
  return Array.from(allowed);
};

const ESCAPE_ROUTE_KEYWORDS = ["stair", "exit", "corridor", "assembly", "classroom", "retail", "auditorium", "public", "egress"];
const PANIC_REQUIRED_KEYWORDS = ["stair", "exit", "assembly", "auditorium", "arena", "stadium", "retail", "public"];
const ELECTRIFIED_USE_HINTS = [
  "main entrance",
  "security",
  "server",
  "it",
  "data",
  "lab",
  "lobby",
  "reception",
  "turnstile",
  "access",
  "checkpoint",
  "guest room",
  "guestroom",
  "hotel"
];

const HARDWARE_PACKAGE_OPTIONS = [
  { id: "Mechanical", label: "Mechanical Package", desc: "Mortise/cylindrical locks, manual key control, free-egress lever trim." },
  { id: "Electromechanical", label: "Electromechanical Package", desc: "Electric strikes or maglocks with power, REX, and monitoring accessories." }
];

const getRecommendedHardwareIntent = (door = {}) => {
  const use = (door.use || "").toLowerCase();
  const notes = (door.notes || "").toLowerCase();
  const hasKeyword = ELECTRIFIED_USE_HINTS.some((kw) => use.includes(kw));
  const hasNote = ["card", "access", "controlled", "turnstile"].some((kw) => notes.includes(kw));
  return hasKeyword || hasNote ? "Electromechanical" : "Mechanical";
};

const normalizeDoor = (door) => {
  const additional = (door.additionalLocations || []).map((loc) => ({
    zone: loc?.zone || door.zone || "",
    level: loc?.level || door.level || "",
    roomName: loc?.roomName || door.roomName || ""
  }));
  const qtyComputed = 1 + additional.length;
  return {
    ...door,
    use: door.use || door.roomName || "",
    hardwareIntent: door.hardwareIntent || getRecommendedHardwareIntent(door),
    additionalLocations: additional,
    qty: qtyComputed,
    thicknessAuto: door.thicknessAuto !== false,
    weightAuto: door.weightAuto !== false,
    ada: door.ada === true
  };
};

const normalizeResidentialMix = (source = {}) => {
  const mix = {};
  let total = 0;
  RESIDENTIAL_UNIT_TYPES.forEach((type) => {
    const value = Math.max(0, parseInt(source?.[type], 10) || 0);
    mix[type] = value;
    total += value;
  });
  if (total > 0) return mix;
  return { ...RESIDENTIAL_DEFAULT_MIX };
};

const buildResidentialProfiles = (inputs, floors) => {
  const mix = normalizeResidentialMix(inputs.unitMix);
  const unitsFromMix = Object.values(mix).reduce((sum, item) => sum + item, 0);
  const fallbackUnits = Math.max(1, inputs.unitsPerFloor || unitsFromMix || 1);
  return [
    {
      id: "default",
      label: "Typical Floor",
      floors,
      unitsPerFloor: Math.max(unitsFromMix, fallbackUnits),
      unitMix: mix
    }
  ];
};

const INSTANT_SCHEDULE_RULES = {
  Residential: (inputs = {}) => {
    const floors = Math.max(1, parseInt(inputs.floors, 10) || 1);
    const profiles = buildResidentialProfiles(inputs, floors);
    const doors = [];
    const profile = profiles[0];
    const profileMix = profile.unitMix || {};
    const profileLabel = (profile.label || "").trim();
    const prefix =
      profileLabel && profileLabel.toLowerCase() !== "typical floor"
        ? `${profileLabel} - `
        : "";
    Object.entries(profileMix)
      .filter(([, qtyPerFloor]) => qtyPerFloor > 0)
      .forEach(([type, qtyPerFloor]) => {
        const plan = RESIDENTIAL_UNIT_PLANS[type] || RESIDENTIAL_UNIT_PLANS["2BHK"];
        const units = qtyPerFloor * profile.floors;
        if (units <= 0) return;
        const notes = `Auto-generated residential ${profileLabel || type}`;
        doors.push({
          roomName: `${prefix}${type} Entry`,
          use: "Unit Entrance (Fire Rated)",
          qty: units,
          width: 950,
          height: 2150,
          material: "Timber",
          fire: 60,
          notes
        });
        doors.push({
          roomName: `${prefix}${type} Bedroom`,
          use: "Bedroom / Internal",
          qty: units * plan.bedrooms,
          width: 900,
          height: 2100,
          notes
        });
        doors.push({
          roomName: `${prefix}${type} Bathroom`,
          use: "Bathroom / Privacy",
          qty: units * plan.bathrooms,
          width: 800,
          height: 2100,
          material: "Timber",
          notes: `Privacy lockset recommended for ${type}`
        });
      });

    if (doors.length === 0) return [];

    const corridorQty = Math.max(1, floors * 2);
    const serviceQty = Math.max(1, floors);
    doors.push({
      roomName: "Corridor Core",
      use: "Corridor / Circulation",
      qty: corridorQty,
      width: 1000,
      height: 2150,
      fire: 0,
      ada: true,
      notes: "Auto-generated corridor door"
    });
    doors.push({
      roomName: "Restroom Core",
      use: "Restroom",
      qty: corridorQty,
      width: 900,
      height: 2100,
      ada: true,
      notes: "Auto-generated restroom core"
    });
    doors.push({
      roomName: "Stair / Exit",
      use: "Stairwell / Exit",
      qty: corridorQty,
      width: 1000,
      height: 2150,
      material: "Metal",
      fire: 60,
      notes: "Stair door (code guidance)"
    });
    doors.push({
      roomName: "Service / Utility",
      use: "Service / Utility",
      qty: serviceQty,
      width: 900,
      height: 2100,
      material: "Metal",
      fire: 30,
      notes: "Service doors on each floor stack"
    });

    return doors;
  },
  "Education / School": (inputs = {}) => {
    const floors = Math.max(1, parseInt(inputs.floors, 10) || 1);
    const classroomsPerFloor = Math.max(0, parseInt(inputs.classroomsPerFloor, 10) || 0);
    const toiletsPerFloor = Math.max(0, parseInt(inputs.toiletsPerFloor, 10) || 0);
    const hasAdminLabs = Boolean(inputs.hasAdminLabs);
    const doors = [];
    if (classroomsPerFloor > 0) {
      doors.push({
        roomName: "Classroom",
        use: "Classroom",
        qty: floors * classroomsPerFloor,
        width: 950,
        height: 2150,
        material: "Timber"
      });
    }
    if (toiletsPerFloor > 0) {
      doors.push({
        roomName: "Restroom",
        use: "Restroom",
        qty: floors * toiletsPerFloor,
        width: 900,
        height: 2100,
        material: "Timber",
        notes: "Privacy indicator set"
      });
    }
    if (hasAdminLabs) {
      doors.push({
        roomName: "Admin / Lab",
        use: "Admin / Lab",
        qty: floors * 2,
        width: 950,
        height: 2150,
        material: "Metal",
        fire: 30
      });
    }
    doors.push({
      roomName: "Stair / Exit",
      use: "Stairwell / Exit",
      qty: Math.max(1, floors) * 2,
      width: 1000,
      height: 2150,
      material: "Metal",
      fire: 60
    });
    return doors;
  },
  "Commercial Office": (inputs = {}) => {
    const floors = Math.max(1, parseInt(inputs.floors, 10) || 1);
    const meetingRooms = Math.max(0, parseInt(inputs.meetingRooms, 10) || 0);
    const openLayout = Boolean(inputs.openLayout);
    const hasServiceAreas = Boolean(inputs.hasServiceAreas);
    const doors = [];
    doors.push({
      roomName: "Main Lobby",
      use: "Main Entrance",
      qty: 2,
      width: 1100,
      height: 2400,
      material: "Glass",
      notes: "Paired glass entry"
    });
    doors.push({
      roomName: "Open Office",
      use: "Office / Passage",
      qty: floors * (openLayout ? 2 : 4),
      width: 950,
      height: 2150
    });
    if (meetingRooms > 0) {
      doors.push({
        roomName: "Meeting Room",
        use: "Meeting Room",
        qty: floors * meetingRooms,
        width: 1000,
        height: 2150,
        stc: 40,
        notes: "Acoustic seals recommended"
      });
    }
    doors.push({
      roomName: "Restroom",
      use: "Restroom",
      qty: floors * 2,
      width: 900,
      height: 2100
    });
    if (hasServiceAreas) {
      doors.push({
        roomName: "Service / BOH",
        use: "Service / Utility",
        qty: floors,
        width: 950,
        height: 2150,
        material: "Metal",
        fire: 30
      });
    }
    return doors;
  },
  "Hospital / Healthcare": (inputs = {}) => {
    const floors = Math.max(1, parseInt(inputs.floors, 10) || 1);
    const patientRooms = Math.max(0, parseInt(inputs.patientRoomsPerFloor, 10) || 0);
    const icuRooms = Math.max(0, parseInt(inputs.icuRoomsPerFloor, 10) || 0);
    const operatingRooms = Math.max(0, parseInt(inputs.operatingRooms, 10) || 0);
    const hasEmergency = Boolean(inputs.hasEmergencyDept);
    const doors = [];
    if (patientRooms > 0) {
      doors.push({
        roomName: "Patient Room",
        use: "Patient Room",
        qty: floors * patientRooms,
        width: 950,
        height: 2150,
        material: "Timber",
        notes: "Auto-generated for patient rooms"
      });
    }
    if (icuRooms > 0) {
      doors.push({
        roomName: "ICU / Isolation",
        use: "Patient Room",
        qty: floors * icuRooms,
        width: 1000,
        height: 2150,
        material: "Metal",
        notes: "Isolation-ready leaf with seals",
        stc: 40
      });
    }
    if (operatingRooms > 0) {
      doors.push({
        roomName: "Operating Theatre",
        use: "Operating Theatre",
        qty: Math.max(1, operatingRooms),
        width: 1200,
        height: 2400,
        material: "Metal",
        fire: 60,
        hardwareIntent: "Electromechanical",
        notes: "Pairs with automatic operator"
      });
    }
    doors.push({
      roomName: "Consult / Exam",
      use: "Consultation / Exam",
      qty: floors * 2,
      width: 1000,
      height: 2150
    });
    doors.push({
      roomName: "Clean Utility",
      use: "Clean / Dirty Utility",
      qty: floors,
      width: 950,
      height: 2150,
      material: "Metal",
      fire: 30
    });
    doors.push({
      roomName: "Restroom",
      use: "Restroom",
      qty: floors * 2,
      width: 900,
      height: 2100
    });
    doors.push({
      roomName: "Stair / Exit",
      use: "Stairwell / Exit",
      qty: floors * 2,
      width: 1000,
      height: 2150,
      material: "Metal",
      fire: 90
    });
    if (hasEmergency) {
      doors.push({
        roomName: "Emergency Entry",
        use: "Main Entrance",
        qty: 2,
        width: 1200,
        height: 2400,
        material: "Glass",
        hardwareIntent: "Electromechanical",
        notes: "Dedicated emergency access"
      });
    }
    return doors;
  },
  "Airport / Transport": (inputs = {}) => {
    const floors = Math.max(1, parseInt(inputs.floors, 10) || 1);
    const concourses = Math.max(1, parseInt(inputs.concourses, 10) || 1);
    const gatesPerConcourse = Math.max(1, parseInt(inputs.gatesPerConcourse, 10) || 1);
    const securityZones = Math.max(1, parseInt(inputs.securityZones, 10) || 1);
    const hasInternational = Boolean(inputs.hasInternationalZone);
    const totalGates = concourses * gatesPerConcourse;
    const doors = [];
    doors.push({
      roomName: "Terminal Entry",
      use: "Terminal Entry",
      qty: Math.max(2, concourses * 2),
      width: 1200,
      height: 2600,
      material: "Glass",
      notes: "Airside / landside entry pairs"
    });
    doors.push({
      roomName: "Security Checkpoint",
      use: "Security / Checkpoint",
      qty: securityZones * concourses,
      width: 1100,
      height: 2400,
      material: "Metal",
      hardwareIntent: "Electromechanical",
      notes: "Controlled access openings"
    });
    doors.push({
      roomName: "Boarding Gate",
      use: "Boarding Gate",
      qty: totalGates,
      width: 1100,
      height: 2400,
      material: "Glass"
    });
    doors.push({
      roomName: "Restroom",
      use: "Restroom",
      qty: floors * 4,
      width: 900,
      height: 2100
    });
    doors.push({
      roomName: "Staff / Service",
      use: "Staff Only / Service",
      qty: concourses * 2,
      width: 1000,
      height: 2150,
      material: "Metal",
      fire: 30
    });
    doors.push({
      roomName: "Baggage / Logistics",
      use: "Baggage / Logistics",
      qty: concourses,
      width: 1100,
      height: 2400,
      material: "Metal",
      fire: 60
    });
    doors.push({
      roomName: "Stair / Exit",
      use: "Stairwell / Exit",
      qty: floors * 2,
      width: 1000,
      height: 2150,
      material: "Metal",
      fire: 90
    });
    if (hasInternational) {
      doors.push({
        roomName: "International Zone",
        use: "Corridor / Circulation",
        qty: concourses,
        width: 1100,
        height: 2400,
        hardwareIntent: "Electromechanical",
        notes: "Immigration / customs separation"
      });
    }
    return doors;
  },
  "Hospitality / Hotel": (inputs = {}) => {
    const floors = Math.max(1, parseInt(inputs.floors, 10) || 1);
    const roomsPerFloor = Math.max(0, parseInt(inputs.roomsPerFloor, 10) || 0);
    const suitesPerFloor = Math.max(0, parseInt(inputs.suitesPerFloor, 10) || 0);
    const hasBallroom = Boolean(inputs.hasBallroom);
    const hasServiceZones = Boolean(inputs.hasServiceZones);
    const doors = [];
    if (roomsPerFloor > 0) {
      doors.push({
        roomName: "Guest Room Entry",
        use: "Guest Room Entry",
        qty: floors * roomsPerFloor,
        width: 950,
        height: 2150,
        material: "Timber",
        fire: 30,
        ada: true,
        hardwareIntent: "Electromechanical",
        stc: 42,
        notes: "Smart-lock ready leaf"
      });
    }
    if (suitesPerFloor > 0) {
      doors.push({
        roomName: "Suite Connector",
        use: "Connecting Door",
        qty: floors * suitesPerFloor,
        width: 900,
        height: 2150,
        material: "Timber",
        notes: "Privacy bolt + closer"
      });
    }
    doors.push({
      roomName: "Corridor",
      use: "Corridor / Circulation",
      qty: floors * 2,
      width: 1000,
      height: 2150,
      fire: 60,
      ada: true
    });
    doors.push({
      roomName: "Restroom Core",
      use: "Restroom",
      qty: floors * 2,
      width: 900,
      height: 2100,
      ada: true
    });
    doors.push({
      roomName: "Stair / Exit",
      use: "Stairwell / Exit",
      qty: floors * 2,
      width: 1000,
      height: 2150,
      material: "Metal",
      fire: 60
    });
    if (hasBallroom) {
      doors.push({
        roomName: "Ballroom",
        use: "Ballroom / Assembly",
        qty: 4,
        width: 1200,
        height: 2600,
        config: "Double",
        notes: "Paired entry with panic hardware"
      });
    }
    if (hasServiceZones) {
      doors.push({
        roomName: "Back of House",
        use: "Back of House",
        qty: floors,
        width: 1000,
        height: 2150,
        material: "Metal",
        fire: 30
      });
    }
    return doors;
  }
};

const generateInstantDoorSchedule = (project, existingDoors = project?.doors || []) => {
  if (!project) return [];
  const handler = INSTANT_SCHEDULE_RULES[project.type];
  if (!handler) return [];
  const defaults = cloneInstantInputs();
  const projectInputs = project.instantInputs || defaults;
  const answers = projectInputs[project.type] || defaults[project.type] || {};
  const specs = handler(answers, project).filter((spec) => spec && spec.qty > 0);
  let tempDoors = [...existingDoors];
  const newDoors = [];
  specs.forEach((spec, idx) => {
    const markBase = spec.markBase || `D-${String(tempDoors.length + idx + 1).padStart(3, "0")}`;
    const mark = generateUniqueMark(tempDoors, markBase);
    const qty = Math.max(1, spec.qty || 1);
    const additionalLocations = Array.from({ length: qty - 1 }, (_, addIdx) => ({
      zone: spec.zone || "Tower A",
      level: spec.level || String(((idx + addIdx) % 10) + 1).padStart(2, "0"),
      roomName: `${spec.roomName || spec.use || "Door"} #${addIdx + 2}`
    }));
    const baseDoor = {
      id: generateId(),
      mark,
      zone: spec.zone || "Tower A",
      level: spec.level || String((idx % 10) + 1).padStart(2, "0"),
      roomName: spec.roomName || spec.use || `Generated Door ${idx + 1}`,
      width: spec.width || 900,
      height: spec.height || 2100,
      thickness: spec.thickness || 45,
      weight: spec.weight || 45,
      fire: spec.fire || 0,
      use: spec.use || spec.roomName || "",
      material: spec.material || "Timber",
      config: spec.config || "Single",
      handing: spec.handing || "RH",
      stc: spec.stc || 35,
      ada: spec.ada || false,
      notes: spec.notes || "",
      hardwareIntent: spec.hardwareIntent || getRecommendedHardwareIntent(spec),
      additionalLocations
    };
    const door = normalizeDoor(baseDoor);
    newDoors.push(door);
    tempDoors = [...tempDoors, door];
  });
  return newDoors;
};

const classifyDoor = (door) => {
  const use = (door.use || "").toLowerCase();
  const material = door.material || "Timber";
  const isEscapeRoute = ESCAPE_ROUTE_KEYWORDS.some((kw) => use.includes(kw));
  const requiresPanic = PANIC_REQUIRED_KEYWORDS.some((kw) => use.includes(kw));
  const isFireRated = parseInt(door.fire, 10) > 0;
  const hardwareIntent = door.hardwareIntent || getRecommendedHardwareIntent(door);
  return {
    material,
    isEscapeRoute,
    requiresPanic,
    isFireRated,
    requiresFailSafe: isEscapeRoute || isFireRated,
    hardwareIntent
  };
};

const buildSetProfile = (doors = []) => {
  if (!doors.length) return { materials: ["Timber"], isEscapeRoute: false, requiresPanic: false, isFireRated: false, requiresFailSafe: false, requiresADA: false };
  const profiles = doors.map(classifyDoor);
  const hardwareIntents = Array.from(new Set(profiles.map((p) => p.hardwareIntent || "Mechanical")));
  return {
    materials: Array.from(new Set(profiles.map((p) => p.material))),
    isEscapeRoute: profiles.some((p) => p.isEscapeRoute),
    requiresPanic: profiles.some((p) => p.requiresPanic),
    isFireRated: profiles.some((p) => p.isFireRated),
    requiresFailSafe: profiles.some((p) => p.requiresFailSafe),
    requiresADA: doors.some((d) => d.ada),
    packageIntent: hardwareIntents.includes("Electromechanical") ? "Electromechanical" : "Mechanical"
  };
};

const createPreviewDoorFromSet = (set, profile) => {
  const useLabel = set.name || "Preview Door";
  const material = profile.materials[0] || "Timber";
  const isFireRated = profile.isFireRated;
  return {
    id: `preview-${set.id}`,
    mark: set.id,
    zone: "Preview",
    level: "00",
    roomName: useLabel,
    qty: 1,
    width: 900,
    height: 2100,
    weight: 50,
    fire: isFireRated ? 60 : 0,
    use: useLabel,
    material,
    config: "Single",
    thickness: 45,
    thicknessAuto: true,
    visionPanel: false,
    handing: "RH",
    stc: 35,
    ada: profile.requiresADA,
    hardwareIntent: profile.packageIntent,
    additionalLocations: []
  };
};

const getSetWarnings = (set, profile) => {
  const warnings = [];
  const locks = set.items.filter((i) => i.category === "Locks");
  const electrified = set.items.filter((i) => i.category === "Electrified");
  const handles = set.items.filter((i) => i.category === "Handles");
  const panicDevices = locks.filter((i) => (i.type || "").toLowerCase().includes("panic"));
  const magLocks = [...locks, ...electrified].filter((i) => (i.type || "").toLowerCase().includes("magnetic"));
  const electricStrikes = [...locks, ...electrified].filter((i) => (i.type || "").toLowerCase().includes("electric strike"));
  const hasHotelLock = locks.some((i) => (i.type || "").toLowerCase().includes("hotel lock"));
  const hasTrueElectrified = hasHotelLock || magLocks.length > 0 || electrified.some((i) => !MAGLOCK_SUPPORT_TYPES.includes(i.type));

  if (profile.requiresPanic && panicDevices.length === 0) {
    warnings.push("Panic hardware is required for this escape route door (EN 1125 / NFPA 101).");
  }
  if (panicDevices.length > 0 && handles.length > 0) {
    warnings.push("Remove lever/pull trim on the egress side when panic hardware is used to maintain single-motion exit.");
  }
  if (panicDevices.length > 0 && locks.some((i) => !i.type.toLowerCase().includes("panic"))) {
    warnings.push("Panic hardware should be the sole locking mechanism on the egress side.");
  }
  if (magLocks.length > 0) {
    const missingComponents = MAGLOCK_SUPPORT_TYPES.filter(
      (supportType) => !electrified.some((i) => (i.type || "").toLowerCase() === supportType.toLowerCase())
    );
    const hasCardReader = electrified.some(
      (item) => item.autoTag === "card-reader-kit" || (item.type || "").toLowerCase() === "card reader"
    );
    const relevantMissing = hasCardReader
      ? missingComponents.filter((supportType) => supportType.toLowerCase() !== "push button")
      : missingComponents;
    if (relevantMissing.length > 0) {
      warnings.push(
        `Magnetic locks require a release package (REX sensor, emergency button, fire alarm interface). Missing: ${relevantMissing.join(", ")}.`
      );
    }
    const hasFailSecureMag = magLocks.some((i) => (i.style || "").toLowerCase().includes("fail-secure"));
    if (profile.requiresFailSafe && hasFailSecureMag) warnings.push("Escape route doors must use fail-safe magnetic locks.");
  }
  if (
    electricStrikes.length > 0 &&
    !locks.some((l) => {
      const descriptor = (l.type || "").toLowerCase();
      return descriptor.includes("mortise") || descriptor.includes("cylindrical") || descriptor.includes("panic");
    })
  ) {
    warnings.push("Electric strikes must pair with a mortise/cylindrical latch or panic device that provides the latch bolt.");
  }
  if (profile.packageIntent === "Electromechanical" && !hasTrueElectrified) {
    warnings.push("Door was scheduled as an electrified package but no electrified locking has been added.");
  }
  if (profile.packageIntent === "Mechanical" && hasTrueElectrified) {
    warnings.push("Door was scheduled as a mechanical package; confirm electrified hardware is intentional.");
  }
  if (profile.requiresADA) {
    const hasAccessibleTrim = panicDevices.length > 0 || handles.some((h) => (h.type || "").toLowerCase().includes("lever"));
    if (!hasAccessibleTrim) {
      warnings.push("ADA-labeled doors require lever hardware or panic devices that allow single-hand operation.");
    }
  }
  if (profile.materials.includes("Glass")) {
    const glassHasLever = handles.some((h) => (h.type || "").toLowerCase().includes("lever"));
    if (glassHasLever) {
      const hasCenterPatch = locks.some(
        (l) =>
          (l.type || "").toLowerCase() === "patch lock" &&
          (l.style || "").toLowerCase().includes("center")
      );
      if (!hasCenterPatch) {
        warnings.push("Glass doors with lever handles must pair with a center patch lock that supports lever trim.");
      }
    }
    if (profile.requiresPanic) {
      const hasGlassPanicHandle = handles.some((h) => (h.type || "").toLowerCase().includes("panic push pull"));
      if (!hasGlassPanicHandle) {
        warnings.push("Glass escape doors require an L-shaped panic push/pull handle instead of a traditional panic bar.");
      }
    }
  }
  return warnings;
};

const FINISHES = {
  "ANSI": ["630 (Satin Stainless)", "629 (Polished Stainless)", "626 (Satin Chrome)", "605 (Polished Brass)", "613 (Oil Rubbed Bronze)", "622 (Matte Black)"],
  "EN": ["SSS (Satin Stainless)", "PSS (Polished Stainless)", "SCP (Satin Chrome Plate)", "PB (Polished Brass)", "RAL 9005 (Black)", "RAL 9016 (White)"]
};

const CATEGORY_FINISH_OPTIONS = {
  Cylinders: {
    ANSI: ["SNP (Satin Nickel Plate)", "Natural Brass", "PB (Polished Brass)", "622 (Matte Black)"],
    EN: ["SNP (Satin Nickel Plate)", "Natural Brass", "PB (Polished Brass)", "RAL 9005 (Black)"]
  }
};

const CATEGORY_REF_PREFIX = {
  Hinges: "H",
  Locks: "L",
  Closers: "D",
  Handles: "H",
  Stops: "S",
  Seals: "GS",
  Cylinders: "C",
  Accessories: "A",
  Protecting: "P",
  Electrified: "E"
};

const getCategoryFinishList = (category, standard = "ANSI") => {
  const overrides = CATEGORY_FINISH_OPTIONS[category];
  if (!overrides) return null;
  return overrides[standard] || overrides.default || null;
};

const getDefaultFinishForStandard = (standard = "ANSI") => {
  const finishSet = FINISHES[standard] || FINISHES["ANSI"];
  return finishSet?.[0] || "630 (Satin Stainless)";
};

const getDefaultFinishForCategory = (category, standard = "ANSI") => {
  const list = getCategoryFinishList(category, standard);
  if (list?.length) return list[0];
  return getDefaultFinishForStandard(standard);
};

const getTypeDefaultStyle = (category, type) => {
  const catData = PRODUCT_CATALOG[category];
  const entry = catData?.types.find((t) => t.name === type);
  return entry?.styles?.[0] || "";
};

const getNextRefForCategory = (items = [], category) => {
  const prefix = CATEGORY_REF_PREFIX[category] || "X";
  let index = 1;
  const existing = new Set(items.map((item) => item.ref));
  let candidate = `${prefix}${String(index).padStart(2, "0")}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${prefix}${String(index).padStart(2, "0")}`;
  }
  return candidate;
};

const MAGLOCK_SUPPORT_ITEMS = [
  { type: "Door Contact", style: "Surface", spec: "Status monitor contact", qty: "1", autoTag: "maglock-door-contact" },
  { type: "Push Button", style: "Request-to-Exit", spec: "Illuminated REX button", qty: "1", autoTag: "maglock-push-button" },
  { type: "Power Supply", style: "12/24V Auto", spec: "Fail-safe rated supply", qty: "1", autoTag: "maglock-power-supply" }
];

const CARD_READER_ITEM = {
  type: "Card Reader",
  style: "Surface Mount",
  spec: "Access control card reader",
  qty: "1"
};

const MAGLOCK_SUPPORT_TYPES = MAGLOCK_SUPPORT_ITEMS.map((item) => item.type);
const ACOUSTIC_THRESHOLD = 40;
const doorsInlined = (config) => (config === 'Double' ? 'double leaf' : 'single leaf');
const ADA_MIN_CLEAR_OPENING_MM = 813;
const ADA_CLEARANCE_DEDUCTION_MM = 38; // approx. 1.5" allowance for hinges/handles

const ensureElectrifiedSupportItems = (items = [], standard = "ANSI", context = {}) => {
  const finish = getDefaultFinishForStandard(standard);
  const hasMaglock = items.some((item) => (item.type || "").toLowerCase().includes("magnetic lock"));
  const hasElectricStrike = items.some((item) => (item.type || "").toLowerCase().includes("electric strike"));
  const removeAutoItems = !hasMaglock && !hasElectricStrike;
  let updatedItems = items.filter((item) => (item.type || "").toLowerCase() !== "maglock release package");
  if (removeAutoItems) {
    updatedItems = updatedItems.filter((item) => item.autoTag !== "maglock-kit" && item.autoTag !== "card-reader-kit");
  }
  const removedAutoTags = new Set(context.removedAutoTags || []);
  const cardReaderKitRow = updatedItems.find((item) => item.autoTag === "card-reader-kit");
  const cardReaderKitPresent = Boolean(cardReaderKitRow);
  const cardReaderExists = Boolean(cardReaderKitRow && cardReaderKitRow.type === CARD_READER_ITEM.type);
  const canAutoAddCardReader =
    (hasMaglock || hasElectricStrike) &&
    !removedAutoTags.has("card-reader-kit") &&
    !cardReaderKitPresent;
  const willAutoAddCardReader = canAutoAddCardReader;
  const cardReaderPlanned = cardReaderKitPresent || willAutoAddCardReader;

  if (hasMaglock) {
    MAGLOCK_SUPPORT_ITEMS.forEach((kit) => {
      const kitTag = kit.autoTag || "maglock-kit";
      if (removedAutoTags.has("maglock-kit") || removedAutoTags.has(kitTag)) return;
      if (kit.type?.toLowerCase().includes("push button") && cardReaderPlanned) return;
      const exists = updatedItems.some((item) => item.category === "Electrified" && item.type === kit.type);
      if (!exists) {
        updatedItems.push({
          category: "Electrified",
          ref: getNextRefForCategory(updatedItems, "Electrified"),
          type: kit.type,
          style: kit.style || getTypeDefaultStyle("Electrified", kit.type),
          spec: kit.spec,
          qty: kit.qty,
          finish,
          autoTag: kitTag
        });
      }
    });
  }

  if (willAutoAddCardReader) {
    updatedItems.push({
      category: "Electrified",
      ref: getNextRefForCategory(updatedItems, "Electrified"),
      type: CARD_READER_ITEM.type,
      style: CARD_READER_ITEM.style || getTypeDefaultStyle("Electrified", CARD_READER_ITEM.type),
      spec: CARD_READER_ITEM.spec,
      qty: CARD_READER_ITEM.qty,
      finish,
      autoTag: "card-reader-kit"
    });
  }

  return updatedItems;
};

const ELECTRIFIED_AUX_TYPES = [...MAGLOCK_SUPPORT_TYPES, CARD_READER_ITEM.type];
const enforceSingleHinge = (items = []) => {
  let hingeKept = false;
  return items.filter((item) => {
    if (item.category !== "Hinges") return true;
    if (!hingeKept) {
      hingeKept = true;
      return true;
    }
    return false;
  });
};

const ensureAcousticItems = (items = [], context = {}) => {
  const { needsAcoustic = false, isDouble = false, hasVision = false, hasLouver = false } = context;
  let updated = [...items];
  if (!needsAcoustic) return updated.filter((item) => item.autoTag !== "acoustic-package");
  const finish = getDefaultFinishForStandard(context.standard || "ANSI");

  const addIfMissing = (signature, payload) => {
    const exists = updated.some((item) => item.autoTag === "acoustic-package" && item.spec === signature);
    if (!exists) updated.push(payload);
  };

  addIfMissing("AP-40", {
    category: "Seals",
    ref: getNextRefForCategory(updated, "Seals"),
    type: "Acoustic Perimeter Seal",
    style: "STC-40 Compression",
    spec: "AP-40 perimeter seal set",
    qty: isDouble ? "2 Sets" : "1 Set",
    finish,
    autoTag: "acoustic-package",
    acousticContribution: "STC-rated"
  });

  addIfMissing("ADB-45", {
    category: "Seals",
    ref: getNextRefForCategory(updated, "Seals"),
    type: "Automatic Door Bottom",
    style: "Acoustic Drop",
    spec: "ADB-45 mortised automatic bottom",
    qty: isDouble ? "2" : "1",
    finish,
    autoTag: "acoustic-package",
    acousticContribution: "STC-rated"
  });

  if (hasVision || hasLouver) {
    addIfMissing("GKT-40", {
      category: "Seals",
      ref: getNextRefForCategory(updated, "Seals"),
      type: "Vision/Louver Gasket",
      style: "High Density",
      spec: "GKT-40 acoustic glazing/louver kit",
      qty: "1 Set",
      finish,
      autoTag: "acoustic-package",
      acousticContribution: "STC-rated"
    });
  }

  return updated;
};

const computeSetContext = (doors = [], items = []) => {
  const needsAcoustic = doors.some((d) => parseInt(d.stc, 10) >= ACOUSTIC_THRESHOLD);
  const isDouble = doors.some((d) => d.config === 'Double');
  const hasVision = doors.some((d) => d.visionPanel);
  const hasLouver = items.some((item) => (item.type || "").toLowerCase().includes("louver"));
  return { needsAcoustic, isDouble, hasVision, hasLouver };
};

const applyFinishOverrides = (items = [], standard = "ANSI") => {
  return items.map((item) => {
    const allowed = getCategoryFinishList(item.category, standard);
    if (allowed?.length && !allowed.includes(item.finish)) {
      return { ...item, finish: allowed[0] };
    }
    return item;
  });
};

const sanitizeHardwareItems = (items = [], standard = "ANSI", context = {}) => {
  const afterMaglock = ensureElectrifiedSupportItems(items, standard);
  const afterHinge = enforceSingleHinge(afterMaglock);
  const afterAcoustic = ensureAcousticItems(afterHinge, { ...context, standard });
  return applyFinishOverrides(afterAcoustic, standard);
};

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handler);
    else mediaQuery.addListener(handler);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", handler);
      else mediaQuery.removeListener(handler);
    };
  }, []);

  return prefersReducedMotion;
};

const CARD_BASE_CLASSES =
  "rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/30 text-white shadow-lg shadow-black/30 backdrop-blur-sm";

const CountUpNumber = ({ value = 0, duration = 1200, className = "" }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    let start;
    let raf;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [value, duration, prefersReducedMotion]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
};

const FadeCard = ({ children, className = "", delay = 0, ariaLabel, paddingClass = "p-5" }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const timeout = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timeout);
  }, [prefersReducedMotion, delay]);

  const motionClass = prefersReducedMotion
    ? ""
    : visible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-3";

  return (
    <div
      aria-label={ariaLabel}
      className={`${CARD_BASE_CLASSES} ${paddingClass} ${motionClass} transition-all duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_25px_60px_rgba(7,89,133,0.35)] ${className}`}
    >
      {children}
    </div>
  );
};

const WorkflowStepper = ({ steps = [] }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [lineReady, setLineReady] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setLineReady(true);
      return;
    }
    const timer = window.setTimeout(() => setLineReady(true), 120);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <div className="relative mt-2">
      <div
        className="absolute left-5 sm:left-6 top-2 bottom-2 w-px bg-white/15 origin-top rounded-full"
        style={{
          transform: lineReady ? "scaleY(1)" : "scaleY(0)",
          transition: prefersReducedMotion ? "none" : "transform 900ms ease 150ms"
        }}
        aria-hidden="true"
      />
      <div className="space-y-6">
        {steps.map((step, index) => {
          const stepNumber = step.stepNumber ?? index + 1;
          const isActive = Boolean(step.isActive);
          return (
            <div key={step.title} className="relative pl-12 sm:pl-16 group">
              <div
                className={`absolute left-5 sm:left-6 top-6 bottom-6 w-px rounded-full pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-90' : 'opacity-0 group-hover:opacity-80'}`}
                style={{ backgroundColor: "rgba(56,189,248,0.65)" }}
                aria-hidden="true"
              />
              <div className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2">
                <div
                  className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 text-sm sm:text-base font-semibold transition-all duration-300 shadow-lg ${
                    isActive
                      ? "bg-sky-400 text-slate-950 border-sky-200 shadow-sky-500/40"
                      : "bg-slate-950 text-white border-white/25 group-hover:bg-sky-300 group-hover:text-slate-950 group-hover:border-sky-200"
                  }`}
                >
                  {stepNumber}
                </div>
              </div>
              <FadeCard
                delay={index * 120}
                ariaLabel={`${stepNumber} ${step.title}`}
                className={`pl-4 sm:pl-6 overflow-visible transition-transform duration-300 group-hover:scale-[1.02] ${
                  isActive ? "ring-1 ring-sky-400/50 shadow-sky-500/40" : ""
                }`}
              >
                <div className="space-y-1" aria-current={isActive ? "step" : undefined}>
                  <div className="text-white font-semibold text-lg">{step.title}</div>
                  <p className="text-sm text-white/70 leading-relaxed">{step.body}</p>
                </div>
              </FadeCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const deriveSetIntentFromItems = (items = []) => {
  const hasElectrified = items.some(
    (item) =>
      (item.category === "Electrified" && !MAGLOCK_SUPPORT_TYPES.includes(item.type)) ||
      (item.category === "Locks" && (item.type || "").toLowerCase().includes("magnetic"))
  );
  return hasElectrified ? "Electromechanical" : "Mechanical";
};

const normalizeProject = (project) => {
  if (!project) return project;
  const normalizedDoors = (project.doors || []).map(normalizeDoor);
    const normalizedSets = (project.sets || []).map((set) => {
      const doorsForSet = normalizedDoors.filter((d) => (set.doors || []).includes(d.id));
      const baseItems = set.items || [];
      const context = {
        ...computeSetContext(doorsForSet, baseItems),
        removedAutoTags: set.removedAutoTags || []
      };
      const normalizedItems = sanitizeHardwareItems(baseItems, project.standard, context);
      return {
        ...set,
        intent: set.intent || deriveSetIntentFromItems(normalizedItems),
        items: normalizedItems,
        removedAutoTags: set.removedAutoTags || []
      };
    });
  const defaults = cloneInstantInputs();
  const mergedInstant = { ...defaults, ...(project.instantInputs || {}) };
  Object.keys(defaults).forEach((typeKey) => {
    mergedInstant[typeKey] = { ...defaults[typeKey], ...(mergedInstant[typeKey] || {}) };
  });
  return {
    ...project,
    doors: normalizedDoors,
    sets: normalizedSets,
    instantInputs: mergedInstant,
    instantSchedulingEnabled: Boolean(project.instantSchedulingEnabled)
  };
};

// --- CUSTOM UI COMPONENTS ---

const HardwareIcon = ({ category }) => {
    if (category === "Hinges") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="20" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
    if (category === "Locks") return <Lock size={16}/>;
    if (category === "Closers") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="10" height="6"/><path d="M12 7h8v10"/></svg>;
    if (category === "Handles") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h10a2 2 0 0 1 2 2v6"/><circle cx="4" cy="12" r="2"/></svg>;
    if (category === "Stops") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a8 8 0 0 0 0-16 8 8 0 0 0 0 16z"/><circle cx="12" cy="14" r="3"/></svg>;
    if (category === "Seals") return <Volume2 size={16}/>;
    if (category === "Protecting" || category === "Accessories") return <Info size={16}/>;
    return <Box size={16}/>;
};

const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full p-2.5 border border-gray-300 rounded-md bg-white flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 flex flex-col z-50">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-md">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 p-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-indigo-500"
                placeholder="Search..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${value === opt ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700'}`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setFilter('');
                  }}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div 
                className="px-4 py-2 text-sm text-indigo-600 cursor-pointer hover:bg-indigo-50 font-medium border-t border-gray-100"
                onClick={() => {
                  onChange(filter); // Allow custom value
                  setIsOpen(false);
                  setFilter('');
                }}
              >
                Use "{filter}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Handing Visualizer Components
const Jamb = ({ x, side }) => {
  const jambColor = "#000";
  if (side === 'left') return <path d={`M ${x+10} 40 H ${x} V 60 H ${x+10}`} fill="none" stroke={jambColor} strokeWidth="2" />;
  return <path d={`M ${x-10} 40 H ${x} V 60 H ${x-10}`} fill="none" stroke={jambColor} strokeWidth="2" />;
};

const InsideText = () => <text x="50" y="20" textAnchor="middle" fontSize="10" fill="#333" fontWeight="bold">INSIDE</text>;

const AnsiIcon = ({ mode }) => {
  const doorFill = "white";
  const doorStroke = "black";

  let door = null;
  let dot = null;

  if (mode === 'LH') {
      door = <rect x="12" y="38" width="60" height="6" transform="rotate(-15 12 41)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
      dot = <circle cx="70" cy="30" r="3" fill="red" />;
  } else if (mode === 'RH') {
      door = <rect x="28" y="38" width="60" height="6" transform="rotate(15 88 41)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
      dot = <circle cx="30" cy="30" r="3" fill="red" />;
  } else if (mode === 'LHR') {
      door = <rect x="12" y="56" width="60" height="6" transform="rotate(15 12 59)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
      dot = <circle cx="70" cy="78" r="3" fill="red" />;
  } else if (mode === 'RHR') {
      door = <rect x="28" y="56" width="60" height="6" transform="rotate(-15 88 59)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
      dot = <circle cx="30" cy="78" r="3" fill="red" />;
  }

  return (
      <g>
          <InsideText />
          <Jamb x={10} side="left" />
          <Jamb x={90} side="right" />
          {door}
          {dot}
      </g>
  );
};

const EnIcon = ({ mode }) => {
    // EN DIN ISO Handing Visual
    // View is from PULL SIDE (Reference side)
    // ISO 5 (Left) -> Hinges on Left, opens towards viewer (or inward if viewer is outside? No, standard is Pull Side)
    // Standard: Stand on PULL side. Hinges Left = DIN Left.
    
    const doorFill = "white";
    const doorStroke = "black";
    
    let door = null;
    let arc = null;
    let knuckle = null;

    // Wall/Frame
    const wall = <rect x="10" y="45" width="80" height="10" fill="#e2e8f0" />;

    if (mode === 'ISO 5 (Left)') {
        // Hinge Left, Pulls DOWN (towards viewer)
        knuckle = <circle cx="15" cy="50" r="4" fill="black" />; // Visible Knuckle Left
        door = <rect x="15" y="50" width="8" height="40" fill={doorFill} stroke={doorStroke} rx="1" />;
        arc = <path d="M 55 50 A 40 40 0 0 1 15 90" fill="none" stroke="blue" strokeWidth="1" strokeDasharray="2,2" />;
    } else if (mode === 'ISO 6 (Right)') {
        // Hinge Right, Pulls DOWN
        knuckle = <circle cx="85" cy="50" r="4" fill="black" />; // Visible Knuckle Right
        door = <rect x="77" y="50" width="8" height="40" fill={doorFill} stroke={doorStroke} rx="1" />;
        arc = <path d="M 45 50 A 40 40 0 0 0 85 90" fill="none" stroke="blue" strokeWidth="1" strokeDasharray="2,2" />;
    }

    return (
        <g>
            {wall}
            {door}
            {arc}
            {knuckle}
            <text x="50" y="20" textAnchor="middle" fontSize="10" fill="#666">PULL SIDE VIEW</text>
        </g>
    );
};

const HandingSelector = ({ value, onChange, standard }) => {
  const ansiOptions = [
    { id: 'LH', label: 'Left Hand (LH)', desc: 'Hinges left, opens in' },
    { id: 'RH', label: 'Right Hand (RH)', desc: 'Hinges right, opens in' },
    { id: 'LHR', label: 'Left Hand Reverse (LHR)', desc: 'Hinges left, opens out' },
    { id: 'RHR', label: 'Right Hand Reverse (RHR)', desc: 'Hinges right, opens out' }
  ];

  const enOptions = [
    { id: 'LH', label: 'ISO 5 (Left)', desc: 'Hinges on Left (Pull Side)' },
    { id: 'RH', label: 'ISO 6 (Right)', desc: 'Hinges on Right (Pull Side)' }
  ];

  const options = standard === 'EN' ? enOptions : ansiOptions;

  return (
    <div className={`grid ${standard === 'EN' ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
      {options.map((opt) => (
        <div 
          key={opt.id}
          onClick={() => onChange(opt.id === 'LH' || opt.id === 'ISO 5 (Left)' ? 'LH' : opt.id === 'RH' || opt.id === 'ISO 6 (Right)' ? 'RH' : opt.id)}
          className={`border rounded p-2 flex items-center gap-2 cursor-pointer transition-colors ${value === (opt.id.includes('Left') ? 'LH' : opt.id.includes('Right') ? 'RH' : opt.id) ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'hover:bg-gray-50 border-gray-200'}`}
        >
          <svg width="60" height="60" viewBox="0 0 100 100" className="text-gray-600 shrink-0 bg-white border border-gray-100 rounded">
             {standard === 'EN' ? <EnIcon mode={opt.label} /> : <AnsiIcon mode={opt.id} />}
          </svg>
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${value === opt.id ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</span>
            <span className="text-[10px] text-gray-500">{opt.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const DoorPreview = ({ door, hardwareSet }) => {
  const isDouble = door.config === 'Double';
  const isFireRatedDoor = parseInt(door.fire, 10) > 0;
  const requiresRebatedMeeting = isDouble && isFireRatedDoor;
  const hospitalityGuestDoor = ((door.use || door.roomName || "").toLowerCase().includes("guest room"));
  const baseMaterial = door.material || "Timber";
  const displayMaterial = hospitalityGuestDoor ? "Timber" : baseMaterial;
  const isGlass = displayMaterial === 'Glass';
  const isAluminum = displayMaterial === 'Aluminum';
  const isMetal = displayMaterial === 'Metal';
  const isTimber = displayMaterial === 'Timber';
  const hasVision = door.visionPanel;
  
  let doorFill = '#d6a15c';
  let doorStroke = '#a9744f';
  let frameColor = '#7c4f2f';
  let frameShadow = '#5b391f';
  let panelHighlight = '#f0c999';
  
  if (isGlass) {
    doorFill = 'rgba(224,242,254,0.9)';
    doorStroke = '#7dd3fc';
    frameColor = '#94a3b8';
    frameShadow = '#475569';
    panelHighlight = '#bae6fd';
  } else if (isAluminum) {
    doorFill = '#e5e7eb';
    doorStroke = '#94a3b8';
    frameColor = '#6b7280';
    frameShadow = '#475569';
    panelHighlight = '#f8fafc';
  } else if (isMetal) {
    doorFill = '#d1d5db';
    doorStroke = '#9ca3af';
    frameColor = '#4b5563';
    frameShadow = '#1f2937';
    panelHighlight = '#e5e7eb';
  }
  
  const viewPadding = 12;
  const frameWidth = isDouble ? 280 : 170;
  const frameHeight = 240;
  const frameThickness = 12;
  const clearance = 3;
  const meetingGap = isDouble ? (requiresRebatedMeeting ? 0 : 6) : 0;
  
  const viewWidth = frameWidth + viewPadding * 2;
  const viewHeight = frameHeight + 60;
  
  const frameX = viewPadding;
  const frameY = viewPadding;
  
  const innerX = frameX + frameThickness;
  const innerY = frameY + frameThickness;
  const innerWidth = frameWidth - frameThickness * 2;
  const innerHeight = frameHeight - frameThickness;
  
  const doorY = innerY + clearance;
  const doorHeight = innerHeight - clearance * 2;
  const singleLeafWidth = innerWidth - clearance * 2;
  const doubleLeafWidth = (innerWidth - clearance * 2 - meetingGap) / 2;
  const floorLineY = frameY + frameHeight + 6;
  
  const hingeColor = '#cfd6e2';
  const hingeOutline = '#94a3b8';
  const hardwareColor = '#64748b';
  const closerColor = '#cfd6e3';
  const floorCloserColor = '#d9dee7';
  const wallFill = '#f8fafc';
  
  const hardwareItems = hardwareSet?.items || [];
  const includesKeyword = (list = hardwareItems, keyword) => list.some(item => `${item.type || ''} ${item.style || ''} ${item.category || ''}`.toLowerCase().includes(keyword));
  const itemsByCategory = (category) => hardwareItems.filter(item => item.category === category);
  const handles = itemsByCategory('Handles');
  const locks = itemsByCategory('Locks');
  const electrifiedLocks = itemsByCategory('Electrified');
  const accessories = itemsByCategory('Accessories');
  const closers = itemsByCategory('Closers');
  const stops = itemsByCategory('Stops');
  const seals = itemsByCategory('Seals');
  const protectingItems = itemsByCategory('Protecting');
  const signageItems = protectingItems.filter((item) => (item.type || '').toLowerCase() === 'signage');
  const hingeItems = itemsByCategory('Hinges');
  const hingeDescriptor = hingeItems.map(i => `${i.name || ''} ${i.type || ''} ${i.style || ''}`).join(' ').toLowerCase();
  const hingesPerLeaf = (() => {
    const descriptor = hingeDescriptor;
    if (descriptor.includes('continuous')) return 0;
    const baseDefault =
      descriptor.includes('patch') || descriptor.includes('pivot') || isGlass ? 2 : 3;
    const totalQty = parseInt(hingeItems[0]?.qty, 10);
    if (!totalQty || totalQty <= 0) return baseDefault;
    const perLeaf = totalQty / (isDouble ? 2 : 1);
    return Math.max(baseDefault, Math.round(perLeaf));
  })();

  const hasPanic = includesKeyword([...handles, ...locks], 'panic');
  const hasMagLock = includesKeyword([...locks, ...electrifiedLocks], 'magnetic lock');
  const hasTrueElectrified = hasMagLock || electrifiedLocks.some((item) => !ELECTRIFIED_AUX_TYPES.includes(item.type));
  const hasPushButton = includesKeyword(electrifiedLocks, 'push button');
  const hasCardReader = includesKeyword(electrifiedLocks, 'card reader');
  const hasPullHandle = includesKeyword(handles, 'pull');
  const hasLeverHandle = includesKeyword(handles, 'lever');
  const hasPushPlate = includesKeyword(handles, 'push');
  const hasKick = includesKeyword(accessories, 'kick plate');
  const hasSurfaceCloser = closers.some(item => !(`${item.type || ''} ${item.style || ''}`.toLowerCase().includes('floor spring')));
  const hasFloorSpring = closers.some(item => (`${item.type || ''} ${item.style || ''}`.toLowerCase().includes('floor spring')));
  const hasAutoOperator = closers.some(item => `${item.name || ''} ${item.type || ''} ${item.style || ''}`.toLowerCase().includes('auto'));
  const hasLouver = includesKeyword(accessories, 'louver');
  const hasViewer = includesKeyword(accessories, 'viewer');
  const hasFlushBolt = includesKeyword(accessories.concat(locks), 'flush bolt');
  const stopItem = stops[0];
  const stopDescriptor = stopItem ? `${stopItem.type || ''} ${stopItem.style || ''}`.toLowerCase() : '';
  const stopPlacement = stopItem ? (stopDescriptor.includes('floor') ? 'floor' : stopDescriptor.includes('wall') ? 'wall' : 'general') : null;
  const hasDoorStop = Boolean(stopItem);
  const hasDropSeal = includesKeyword(seals, 'drop') || includesKeyword(seals, 'automatic bottom');
  const hasThreshold = includesKeyword(seals, 'threshold');
  
  const handing = door.handing || 'RH';

  const DoorLeaf = ({ x, width, leafHanding, isInactive }) => {
    const hingeOnLeft = leafHanding === 'LH';
    const hingeStripWidth = 6;
    const lockStripWidth = 5;
    const handleCenterX = hingeOnLeft ? x + width - 14 : x + 14;
    const handleCenterY = doorY + doorHeight * 0.55;
    const hingeEdgeX = hingeOnLeft ? x : x + width;
    const strikeEdgeX = hingeOnLeft ? x + width : x;
    const hingeOutsideX = hingeOnLeft ? hingeEdgeX - 10 : hingeEdgeX + 10;
    const strikeOnRight = hingeOnLeft;
    const computeHingePositions = (count) => {
      if (!count || count < 2) return [doorY + doorHeight / 2];
      const topOffset = 30;
      const bottomOffset = 30;
      const usableHeight = doorHeight - topOffset - bottomOffset;
      if (usableHeight <= 0) return [doorY + doorHeight / 2];
      return Array.from({ length: count }, (_, idx) =>
        doorY + topOffset + (usableHeight * idx) / (count - 1)
      );
    };
    const hingePositions = computeHingePositions(hingesPerLeaf || 3);
    const hingeBlockWidth = clearance + 6;
    const hingeBlockX = hingeOnLeft ? x - clearance : x + width - 2;
    const liteWidth = Math.min(width * 0.4, 60);
    const liteHeight = Math.min(doorHeight * 0.45, 90);
    const liteX = x + width / 2 - liteWidth / 2;
    const liteY = doorY + doorHeight * 0.2;
    const kickHeight = 26;
    const baseCloserWidth = 34;
    const baseCloserHeight = 10;
    const closerScale = hasAutoOperator ? 1.2 : 1;
    const closerBodyWidth = baseCloserWidth * closerScale;
    const closerBodyHeight = baseCloserHeight * closerScale;
    const closerBodyX = hingeOnLeft ? x + 6 : x + width - closerBodyWidth - 6;
    const closerBodyY = doorY + 4;
    const pivotX = hingeOnLeft ? closerBodyX + 4 : closerBodyX + closerBodyWidth - 4;
    const pivotY = closerBodyY + closerBodyHeight / 2;
    const headAttachY = frameY + frameThickness / 2;
    const pushButtonWidth = 12;
    const pushButtonHeight = 22;
    const pushButtonX = strikeOnRight
      ? Math.min(frameX + frameWidth + 4, viewWidth - pushButtonWidth - 2)
      : Math.max(2, frameX - pushButtonWidth - 4);
    const pushButtonY = doorY + doorHeight * 0.45 - pushButtonHeight / 2;
    const cardReaderWidth = 18;
    const cardReaderHeight = 32;
    const cardReaderX = strikeOnRight
      ? Math.min(frameX + frameWidth + 6, viewWidth - cardReaderWidth - 4)
      : Math.max(4, frameX - cardReaderWidth - 6);
    const cardReaderY = doorY + doorHeight * 0.28;
    let hingeVisual = 'butt';
    if (hingeDescriptor.includes('continuous')) hingeVisual = 'continuous';
    else if (hingeDescriptor.includes('concealed')) hingeVisual = 'concealed';
    else if (hingeDescriptor.includes('pivot')) hingeVisual = 'pivot';
    else if (hingeDescriptor.includes('patch')) hingeVisual = 'patch';
    else if (hingeDescriptor.includes('butt')) hingeVisual = 'butt';
    if (!hingeItems.length && isGlass) hingeVisual = 'patch';
    if (isGlass && hingeVisual !== 'patch') hingeVisual = 'patch';
    if (!isGlass && hingeVisual === 'patch') hingeVisual = 'butt';

    const renderHinges = () => {
      if (hingeVisual === 'continuous') {
        const stripX = hingeOnLeft ? x - 1 : x + width - 3;
        return (
          <g>
            <rect x={stripX} y={doorY + 6} width="4" height={doorHeight - 12} rx="2" fill="#cbd4de" stroke="#7b8596" strokeWidth="0.8" />
            {[doorY + 20, doorY + doorHeight / 2, doorY + doorHeight - 20].map((y, idx) => (
              <circle key={`continuous-screw-${idx}`} cx={stripX + 2} cy={y} r="1.5" fill="#7b8596" />
            ))}
          </g>
        );
      }
      if (hingeVisual === 'pivot') {
        const plateX = hingeOnLeft ? x - 4 : x + width - 4;
        const rodX = hingeOnLeft ? x - 0.5 : x + width - 1.5;
        return (
          <g>
            <rect x={plateX} y={doorY - 4} width="8" height="8" rx="1" fill="#cfd4de" stroke="#6b7280" strokeWidth="0.8" />
            <circle cx={plateX + 4} cy={doorY} r="1.5" fill="#7b8596" />
            <rect x={plateX} y={doorY + doorHeight - 4} width="8" height="8" rx="1" fill="#cfd4de" stroke="#6b7280" strokeWidth="0.8" />
            <circle cx={plateX + 4} cy={doorY + doorHeight} r="1.5" fill="#7b8596" />
            <rect x={rodX} y={doorY + 8} width="2" height={doorHeight - 16} fill="#94a3b8" />
          </g>
        );
      }

      const positions =
        hingeVisual === 'patch'
          ? [hingePositions[0], hingePositions[hingePositions.length - 1]]
          : hingePositions;
      return positions.map((pos, idx) => {
        if (hingeVisual === 'concealed') {
          const concealedX = hingeOnLeft ? x : x + width - 6;
          return (
            <rect
              key={`concealed-${idx}`}
              x={concealedX}
              y={pos - 1}
              width="6"
              height="12"
              rx="1"
              fill="#dfe3ec"
              stroke="#7b8596"
              strokeWidth="0.6"
            />
          );
        }
        if (hingeVisual === 'patch') {
          const patchX = hingeOnLeft ? x - 3 : x + width - 7;
          return (
            <rect
              key={`patch-${idx}`}
              x={patchX}
              y={pos - 4}
              width="10"
              height="16"
              rx="2"
              fill="#94a3b8"
              stroke="#475569"
              strokeWidth="0.8"
            />
          );
        }
        // Default butt hinge
        const buttX = hingeBlockX + (hingeBlockWidth - 6) / 2;
        return (
          <g key={`hinge-${idx}`}>
            <rect
              x={buttX}
              y={pos - 1.5}
              width={6}
              height="13"
              rx="2"
              fill="#cfd4de"
              stroke="#8b93a5"
              strokeWidth="0.8"
            />
            {[2.5, 6.5, 10.5].map((offset) => (
              <line
                key={`knuckle-line-${idx}-${offset}`}
                x1={buttX}
                x2={buttX + 6}
                y1={pos - 1.5 + offset}
                y2={pos - 1.5 + offset}
                stroke="#9aa5b6"
                strokeWidth="0.6"
              />
            ))}
          </g>
        );
      });
    };

    return (
      <g>
        {isAluminum ? (
          <>
            <rect
              x={x}
              y={doorY}
              width={width}
              height={doorHeight}
              rx="3"
              fill="#cbd5e1"
              stroke="#6b7280"
              strokeWidth="2"
            />
            <rect
              x={x + width * 0.1}
              y={doorY + doorHeight * 0.1}
              width={width * 0.8}
              height={doorHeight * 0.8}
              rx="2"
              fill="rgba(224,242,254,0.9)"
              stroke="#93c5fd"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <rect x={x} y={doorY} width={width} height={doorHeight} rx={isGlass ? 4 : 2} fill={doorFill} stroke={doorStroke} strokeWidth="1.5" />
        )}
        {isTimber && !isAluminum && [0.2, 0.5, 0.8].map((pct, idx) => (
          <line key={`grain-${idx}`} x1={x + width * pct} x2={x + width * pct} y1={doorY + 6} y2={doorY + doorHeight - 6} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        ))}
        {!isTimber && !isGlass && !isAluminum && (
          <rect x={x + 4} y={doorY + 6} width={width - 8} height={doorHeight - 12} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        )}
        {isGlass && (
          <>
            <rect x={x} y={doorY} width={width} height={14} fill="#cbd5e1" opacity="0.6" />
            <rect x={x} y={doorY + doorHeight - 14} width={width} height={14} fill="#cbd5e1" opacity="0.6" />
          </>
        )}
        <rect x={hingeOnLeft ? x : x + width - hingeStripWidth} y={doorY} width={hingeStripWidth} height={doorHeight} fill="rgba(0,0,0,0.08)" />
        <rect x={hingeOnLeft ? x + width - lockStripWidth : x} y={doorY} width={lockStripWidth} height={doorHeight} fill={panelHighlight} opacity="0.35" />
        {requiresRebatedMeeting && isDouble && (
          <rect
            x={hingeOnLeft ? x + width - 4 : x}
            y={doorY + 2}
            width="4"
            height={doorHeight - 4}
            fill="rgba(0,0,0,0.12)"
            opacity="0.7"
          />
        )}
        {hasVision && !isGlass && !isAluminum && (
          <rect x={liteX} y={liteY} width={liteWidth} height={liteHeight} fill="#e0f2fe" stroke="#64748b" strokeWidth="1" rx="2" />
        )}
        {hasLouver && !hasVision && (
          <g opacity="0.65">
            <rect x={x + 10} y={doorY + doorHeight - kickHeight - 12} width={width - 20} height={kickHeight} fill="none" stroke="#6b7280" />
            {[5, 11, 17, 23].map((offset) => (
              <line key={`louver-${offset}`} x1={x + 12} x2={x + width - 12} y1={doorY + doorHeight - kickHeight - 12 + offset} y2={doorY + doorHeight - kickHeight - 12 + offset} stroke="#6b7280" />
            ))}
          </g>
        )}
        {isInactive && isDouble && (
          <rect x={hingeOnLeft ? x + width - 3 : x} y={doorY} width="3" height={doorHeight} fill={hardwareColor} opacity="0.4" />
        )}
        {isDouble && hasFlushBolt && isInactive && (
          <>
            <rect x={strikeEdgeX - 2} y={doorY + 10} width="4" height="16" rx="1" fill={hingeOutline} />
            <rect x={strikeEdgeX - 2} y={doorY + doorHeight - 26} width="4" height="16" rx="1" fill={hingeOutline} />
          </>
        )}
        {!isInactive && signageItems.length > 0 && signageItems.map((item, idx) => {
          const style = (item.style || "").toLowerCase();
          const baseY = doorY + 54 + idx * 18;
          const centerX = x + width / 2;
          if (style.includes("disc")) {
            return (
              <circle
                key={`sign-disc-${idx}`}
                cx={centerX}
                cy={baseY}
                r="10.5"
                fill="#4b5563"
                stroke="#1f2937"
                strokeWidth="1"
                opacity="0.85"
              />
            );
          }
          return (
            <rect
              key={`sign-rect-${idx}`}
              x={centerX - 15}
              y={baseY - 9}
              width="30"
              height="18"
              rx="2"
              fill="#4b5563"
              stroke="#1f2937"
              strokeWidth="1"
              opacity="0.85"
            />
          );
        })}
        {hasViewer && !isGlass && !isInactive && (
          <circle cx={x + width / 2} cy={doorY + 36} r="3" fill="#dbeafe" stroke={hardwareColor} strokeWidth="0.8" />
        )}
        {renderHinges()}
        {hasSurfaceCloser && !isInactive && (
          <rect
            x={closerBodyX}
            y={closerBodyY}
            width={closerBodyWidth}
            height={closerBodyHeight}
            rx="2"
            fill={closerColor}
            stroke={hingeOutline}
            strokeWidth="1"
          />
        )}
        {hasMagLock && !isInactive && (
          <rect
            x={hingeOnLeft ? x + width - 28 : x + 4}
            y={doorY + 6}
            width="24"
            height="8"
            rx="2"
            fill="#94a3b8"
            stroke="#475569"
            strokeWidth="0.8"
          />
        )}
        {hasPushButton && !isInactive && (
          <g>
            <rect
              x={pushButtonX}
              y={pushButtonY}
              width={pushButtonWidth}
              height={pushButtonHeight}
              rx="3"
              fill="#e5e7eb"
              stroke="#4b5563"
              strokeWidth="0.8"
            />
            <circle
              cx={pushButtonX + pushButtonWidth / 2}
              cy={pushButtonY + pushButtonHeight / 2}
              r="4"
              fill="#cbd5e1"
              stroke="#334155"
              strokeWidth="0.8"
            />
          </g>
        )}
        {hasCardReader && !isInactive && (
          <g>
            <rect
              x={cardReaderX}
              y={cardReaderY}
              width={cardReaderWidth}
              height={cardReaderHeight}
              rx="3"
              fill="#0f172a"
              stroke="#1f2937"
              strokeWidth="1"
            />
            <rect
              x={cardReaderX + 3}
              y={cardReaderY + 6}
              width={cardReaderWidth - 6}
              height={14}
              rx="2"
              fill="#94a3b8"
              opacity="0.9"
            />
            <circle
              cx={cardReaderX + cardReaderWidth / 2}
              cy={cardReaderY + cardReaderHeight - 12}
              r="3"
              fill="#0ea5e9"
              stroke="#1e3a8a"
              strokeWidth="0.8"
            />
            <circle
              cx={cardReaderX + cardReaderWidth / 2}
              cy={cardReaderY + cardReaderHeight - 6}
              r="1.3"
              fill="#22c55e"
            />
          </g>
        )}
        {hasFloorSpring && !isInactive && (
          <rect
            x={hingeOnLeft ? x + 6 : x + width - 40}
            y={doorY + doorHeight - 10}
            width="34"
            height="7"
            rx="2.5"
            fill={floorCloserColor}
            stroke={hingeOutline}
            strokeWidth="1"
          />
        )}
        {hasPanic ? (
          <rect x={x + 12} y={handleCenterY - 6} width={width - 24} height="12" rx="3" fill="#cbd5e1" stroke={hardwareColor} strokeWidth="1" />
        ) : hasPullHandle ? (
          <rect x={handleCenterX - 2} y={handleCenterY - 20} width="4" height="40" rx="2" fill={hardwareColor} />
        ) : hasPushPlate ? (
          <rect
            x={handleCenterX - 10}
            y={handleCenterY - 23}
            width="20"
            height="46"
            rx="3"
            fill="#e5e7eb"
            stroke={hardwareColor}
            strokeWidth="1"
          />
        ) : (
          <g>
            <circle cx={handleCenterX} cy={handleCenterY} r="6" fill="#e2e8f0" stroke={hardwareColor} strokeWidth="1" />
            {hasLeverHandle ? (
              <rect x={hingeOnLeft ? handleCenterX - 16 : handleCenterX + 4} y={handleCenterY - 2} width="14" height="4" rx="2" fill={hardwareColor} />
            ) : (
              <circle cx={hingeOnLeft ? handleCenterX - 8 : handleCenterX + 8} cy={handleCenterY} r="2.5" fill={hardwareColor} />
            )}
          </g>
        )}
        {hasKick && (
          <rect x={x + 10} y={doorY + doorHeight - 30} width={width - 20} height="24" fill="#9ca3af" opacity="0.7" stroke={hardwareColor} strokeWidth="1" />
        )}
        {hasDropSeal && (
          <rect x={x + 6} y={doorY + doorHeight - 5} width={width - 12} height="3" rx="1.5" fill="#94a3b8" />
        )}
        {hasDoorStop && !isInactive && (
          stopPlacement === 'floor' ? (
            <g>
              <rect x={hingeOutsideX - 4} y={floorLineY - 5} width="8" height="2" fill="#6b7280" />
              <circle cx={hingeOutsideX} cy={floorLineY - 7} r="3" fill="#e2e8f0" stroke="#6b7280" strokeWidth="0.8" />
            </g>
          ) : (
            <rect
              x={hingeOutsideX - 2}
              y={handleCenterY - 6}
              width="4"
              height="12"
              rx="2"
              fill="#cbd5e1"
              stroke={hingeOutline}
              strokeWidth="0.6"
            />
          )
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        width={isDouble ? 320 : 240}
        height="320"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="bg-white rounded-lg border border-gray-100 shadow-sm p-2"
      >
        {/* Frame head and jambs */}
        <rect x={frameX} y={frameY} width={frameThickness} height={frameHeight} fill={frameColor} stroke={frameShadow} strokeWidth="1" />
        <rect x={frameX + frameWidth - frameThickness} y={frameY} width={frameThickness} height={frameHeight} fill={frameColor} stroke={frameShadow} strokeWidth="1" />
        <rect x={frameX} y={frameY} width={frameWidth} height={frameThickness} fill={frameColor} stroke={frameShadow} strokeWidth="1" />
        <rect x={innerX} y={innerY} width={innerWidth} height={innerHeight} fill={wallFill} stroke={frameShadow} strokeWidth="0.5" />
        
        {isDouble && (
          <rect x={innerX + clearance + doubleLeafWidth} y={doorY} width={meetingGap} height={doorHeight} fill={wallFill} />
        )}

    {isDouble ? (
      <>
        <DoorLeaf x={innerX + clearance} width={doubleLeafWidth} leafHanding="LH" isInactive />
        <DoorLeaf x={innerX + clearance + doubleLeafWidth + meetingGap} width={doubleLeafWidth} leafHanding="RH" />
      </>
    ) : (
      <DoorLeaf x={innerX + clearance} width={singleLeafWidth} leafHanding={handing.includes('L') ? 'LH' : 'RH'} />
    )}

        {hasThreshold && (
          <rect x={innerX + clearance / 2} y={floorLineY - 5} width={innerWidth - clearance} height="3" rx="1.5" fill="#b0bec5" />
        )}

        <line x1={frameX} y1={floorLineY} x2={frameX + frameWidth} y2={floorLineY} stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="mt-2 text-xs text-gray-500 font-medium text-center">
        {door.config} {door.material} <br/>
        <span className="text-indigo-600 font-bold">{handing}</span> {hasVision ? '+ Lite Kit' : ''}
        {isDouble && (
          <div className="text-[11px] text-gray-500 mt-1">
            {requiresRebatedMeeting ? 'Rebated meeting stile (fire-rated pair)' : 'Flush meeting stile'}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const LandingPage = ({
  onStart,
  hasProjects,
  isAdmin,
  onOpenAdmin,
  isAdminOpen,
  onCloseAdmin,
  showNotice
}) => {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleStartClick = () => {
    if (user) {
      // already logged in → go to dashboard
      onStart();
    } else {
      // not logged in → open beta login popup
      setIsAuthModalOpen(true);
    }
  };

  return (
  <div className="relative w-full min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-20 w-80 h-80 bg-indigo-600/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-sky-500/20 blur-[180px]" />
    </div>
    <nav className="relative z-20 px-6 md:px-10 lg:px-12 py-5 flex items-center justify-between">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-3 focus:outline-none w-full sm:w-auto text-left"
        >
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur flex items-center justify-center">
            <DoorClosed className="text-sky-300 w-7 h-7" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl md:text-2xl font-black tracking-tight">InstaSpec</span>
            <span className="text-[11px] md:text-sm font-semibold text-white/70 whitespace-nowrap">
              Design Faster. Build Smarter.
            </span>
          </div>
        </button>
      <div className="flex items-center gap-3">
        {user && isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="px-4 py-2 rounded-full border border-indigo-300 text-sm font-semibold text-indigo-50 hover:bg-indigo-500/20 transition"
          >
            Beta Admin
          </button>
        )}
        <button
          onClick={() => showNotice?.("Coming Soon", "Product tour coming soon.")}
          className="hidden sm:inline-flex px-4 py-2 rounded-full border border-white/10 text-sm font-semibold text-white/80 hover:bg-white/5 transition"
        >
          Product Tour
        </button>
        <button
          onClick={handleStartClick}
          className="px-4 md:px-6 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm md:text-base font-semibold shadow-lg shadow-indigo-500/40 transition"
        >
          {user ? (hasProjects ? 'Open Dashboard' : 'Start Configuring') : 'Beta Login'}
        </button>
      </div>
    </nav>

    <main className="relative z-10 flex-1 w-full flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16">
        <div className="grid gap-12 lg:gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,420px)] items-start">
            <section className="order-1 lg:col-start-1 lg:row-start-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-[10px] sm:text-xs uppercase tracking-[0.35em] text-white/70 whitespace-nowrap">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-[0.25em]">FOR ARCHITECTS</span>
                <span className="text-white/40">/</span>
                <span className="tracking-[0.25em]">CONSULTANTS</span>
                <span className="text-white/40">/</span>
                <span className="tracking-[0.25em]">SPECIFIERS</span>
              </div>
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white">
                Specify door hardware with confidence in <span className="text-sky-300">minutes</span>, not days.
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl">
                InstaSpec unifies code compliance, hardware libraries, and visual coordination into a single premium workspace.
                Build ANSI/EN ready schedules, visualize door sets, and export polished specs instantly.
              </p>
            </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartClick}
                  className="px-8 py-4 bg-sky-400 text-slate-950 font-bold rounded-xl shadow-xl shadow-sky-500/30 flex items-center justify-center gap-2 text-lg hover:bg-sky-300 transition"
                >
                  Start Configuring <ArrowRight className="w-5 h-5" />
                </button>
              <button
                onClick={() => showNotice?.("Coming Soon", "Demo replay coming soon.")}
                className="px-8 py-4 border border-white/20 rounded-xl font-semibold text-lg text-white/80 hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                View Demo
              </button>
            </div>
          </section>

          <aside className="order-2 lg:col-start-2 lg:row-span-2 space-y-10 lg:space-y-12 flex flex-col h-full">
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.4em] text-white/50">Specification Intelligence</div>
              <div className="space-y-4">
                {INSIGHT_CARDS.map((card, index) => (
                  <FadeCard
                    key={card.title}
                    delay={index * 90}
                    ariaLabel={`${card.label} - ${card.title}`}
                    className="min-h-[160px]"
                  >
                    <div className="text-xs uppercase tracking-[0.3em] text-white/60">{card.label}</div>
                    <div className="text-white font-semibold text-2xl mt-2">{card.title}</div>
                    <p className="text-sm text-white/70 leading-relaxed">{card.body}</p>
                  </FadeCard>
                ))}
              </div>
            </div>
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="text-xs uppercase tracking-[0.4em] text-white/50">Workflow Snapshot</div>
              <WorkflowStepper steps={WORKFLOW_STEPS_CONTENT} />
            </div>
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.4em] text-white/50">Why InstaSpec?</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {WHY_INSTASPEC_CARDS.map((card, index) => {
                  const Icon = card.icon || Info;
                  const responsiveClasses =
                    index === 2
                      ? "sm:col-span-2 sm:max-w-xs sm:mx-auto lg:col-span-1 lg:max-w-none lg:mx-0"
                      : "";
                  return (
                    <FadeCard
                      key={card.title}
                      delay={(index + WORKFLOW_STEPS_CONTENT.length) * 90}
                      ariaLabel={card.title}
                      paddingClass="px-4 py-4"
                      className={`min-h-[140px] flex flex-col items-start justify-start gap-3 transition-transform duration-300 overflow-visible ${responsiveClasses}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-white/10 text-sky-200 flex-shrink-0">
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="space-y-1 w-full">
                        <div className="text-lg md:text-base font-semibold leading-tight text-white whitespace-normal break-normal hyphens-none">
                          {card.title}
                        </div>
                        <p className="text-sm md:text-xs text-white/80 leading-snug whitespace-normal break-words">
                          {card.body}
                        </p>
                      </div>
                    </FadeCard>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="order-3 lg:col-start-1 lg:row-start-2 space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-white/50">Highlights</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {HERO_STATS.slice(0, 6).map((stat, index) => {
                const Icon = stat.icon || Layers;
                return (
                  <FadeCard
                    key={stat.id}
                    delay={(index + WORKFLOW_STEPS_CONTENT.length) * 70}
                    className="flex flex-col gap-4 min-h-[190px]"
                    ariaLabel={`${stat.value} ${stat.metric}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-2xl bg-white/10 text-sky-200">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <CountUpNumber value={Number(stat.value)} className="text-3xl font-black leading-none text-white" />
                        <span className="text-sm font-semibold uppercase tracking-wide text-white/70">{stat.metric}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed break-normal">{stat.subtext}</p>
                    <div className="mt-auto h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-sky-400 to-indigo-500" />
                    </div>
                  </FadeCard>
                );
              })}
            </div>
            {(() => {
              const dashboardStat = HERO_STATS[6];
              const DashboardIcon = dashboardStat.icon || LayoutGrid;
              return (
                <FadeCard
                  delay={(HERO_STATS.length + WORKFLOW_STEPS_CONTENT.length) * 70}
                  ariaLabel="1 Project Dashboard -- All projects in one clean, central view"
                  className="w-full flex flex-col gap-4 min-h-[170px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-2xl bg-white/10 text-sky-200">
                      <DashboardIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <CountUpNumber value={Number(dashboardStat.value)} className="text-3xl font-black leading-none text-white" />
                      <span className="text-sm font-semibold uppercase tracking-wide text-white/70">{dashboardStat.metric}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{dashboardStat.subtext}</p>
                  <div className="mt-auto h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-sky-400 to-indigo-500" />
                  </div>
                </FadeCard>
              );
            })()}
          </section>
        </div>
      </div>
    </main>
    <footer className="relative z-10 w-full border-t border-white/5 bg-slate-950/80 px-6 md:px-10 lg:px-12 py-6 text-center text-sm text-white/60">
      Engineered with care by{" "}
      <a
        href="https://techarix.com"
        target="_blank"
        rel="noreferrer"
        className="text-white font-semibold underline underline-offset-2 decoration-white/40 hover:text-sky-300"
      >
        Techarix
      </a>
      </footer>
          <BetaAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={onStart}
      />
      {isAdmin && (
        <BetaAdminPanel
          isOpen={isAdminOpen}
          onClose={onCloseAdmin}
        />
      )}

  </div>
);
};
const App = () => {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isReportFeedbackOpen, setIsReportFeedbackOpen] = useState(false);
  const isAdmin = user ? isAdminEmail(user.email) : false;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [remainingLabel, setRemainingLabel] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);

  // State
  const [view, setView] = useState('landing');
  const [step, setStep] = useState(0);
  const [projects, setProjects] = useState([]);
  const undoRedoRef = useRef(false);
  const [historyState, setHistoryState] = useState(() => ({
    past: [],
    present: deepClone([]),
    future: []
  }));
  const [desktopShortcutsEnabled, setDesktopShortcutsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const [currentId, setCurrentId] = useState(null);
  const [isDoorModalOpen, setIsDoorModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('Architect');
  const [library, setLibrary] = useState([]);
  const [printMode, setPrintMode] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [lockResetSignals, setLockResetSignals] = useState({});
  const lockResetTimers = useRef({});
  const [downloadWarning, setDownloadWarning] = useState("");
  const DOWNLOAD_LIMIT = 10;
  const [downloadUsage, setDownloadUsage] = useState({ count: 0, limit: DOWNLOAD_LIMIT });
  const [promptConfig, setPromptConfig] = useState(null);
  const promptResolverRef = useRef(null);
  const [isMobileDownloadOpen, setIsMobileDownloadOpen] = useState(false);
  const [blockedStep, setBlockedStep] = useState(null);
  const [reviewFinalized, setReviewFinalized] = useState(false);
  const historySyncRef = useRef(false);

  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  const undoHistory = useCallback(() => {
    setHistoryState((prev) => {
      if (!prev.past.length) return prev;
      const previous = prev.past[prev.past.length - 1];
      undoRedoRef.current = true;
      setProjects(previous);
      const nextPast = prev.past.slice(0, -1);
      const nextFuture = [prev.present, ...prev.future].slice(0, HISTORY_LIMIT);
      return { past: nextPast, present: previous, future: nextFuture };
    });
  }, [setProjects]);

  const redoHistory = useCallback(() => {
    setHistoryState((prev) => {
      if (!prev.future.length) return prev;
      const nextEntry = prev.future[0];
      undoRedoRef.current = true;
      setProjects(nextEntry);
      const nextPast = [...prev.past, prev.present].slice(-HISTORY_LIMIT);
      const nextFuture = prev.future.slice(1);
      return { past: nextPast, present: nextEntry, future: nextFuture };
    });
  }, [setProjects]);

  const openPrompt = useCallback((config = {}) => {
    return new Promise((resolve) => {
      promptResolverRef.current = resolve;
      setPromptConfig({
        title: "Please Confirm",
        message: "",
        confirmLabel: config.showCancel === false ? "OK" : "Continue",
        cancelLabel: "Cancel",
        showCancel: config.showCancel !== false,
        tone: "default",
        ...config
      });
    });
  }, []);


  const handlePromptClose = useCallback((result) => {
    if (promptResolverRef.current) {
      promptResolverRef.current(result);
      promptResolverRef.current = null;
    }
    setPromptConfig(null);
  }, []);

  const showSaveConfirmation = useCallback(() => {
    openPrompt({
      title: "Project saved locally.",
      message: "Thanks for helping us test InstaSpec!",
      showCancel: false,
      confirmLabel: "Close"
    });
  }, [openPrompt]);

  const showNotice = useCallback((title, message, confirmLabel = "Close") => {
    return openPrompt({
      title,
      message,
      showCancel: false,
      confirmLabel
    });
  }, [openPrompt]);
  const triggerLockResetSignal = useCallback((key) => {
    setLockResetSignals((prev) => ({ ...prev, [key]: true }));
    if (lockResetTimers.current[key]) {
      clearTimeout(lockResetTimers.current[key]);
    }
    lockResetTimers.current[key] = setTimeout(() => {
      setLockResetSignals((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete lockResetTimers.current[key];
    }, 4000);
  }, []);

  const promptPortal = promptConfig ? (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {promptConfig.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{promptConfig.title}</h3>
        )}
        {promptConfig.message && (
          <p className="text-sm text-gray-600 whitespace-pre-line">{promptConfig.message}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          {promptConfig.showCancel && (
            <button
              type="button"
              onClick={() => handlePromptClose(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {promptConfig.cancelLabel || "Cancel"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handlePromptClose(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              promptConfig.tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {promptConfig.confirmLabel || "OK"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
  
  // Door Modal State (Hierarchical Location)
  const [doorForm, setDoorForm] = useState({
    id: '', mark: '', 
    zone: 'Tower A', level: '01', roomName: '', 
    qty: 1, 
    width: 900, height: 2100, weight: 45, 
    fire: 0, use: '', material: 'Timber', config: 'Single',
    thickness: 45, visionPanel: false, handing: 'RH',
    stc: 35, ada: false, notes: '',
    hardwareIntent: 'Mechanical',
    additionalLocations: []
  });
  
  const [doorErrors, setDoorErrors] = useState({});
  const [doorHint, setDoorHint] = useState('');
  const [complianceNote, setComplianceNote] = useState(null);
  const [addItemModal, setAddItemModal] = useState({ isOpen: false, setId: null });
  const [compatibilityAlert, setCompatibilityAlert] = useState(null);
  const [bulkModal, setBulkModal] = useState({ isOpen: false, templateId: "", markPrefix: "", locationsText: "" });
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [instantDoorModal, setInstantDoorModal] = useState({ isOpen: false, doors: [] });
  const [activeLocationsDoorId, setActiveLocationsDoorId] = useState(null);
  const recommendedIntent = getRecommendedHardwareIntent(doorForm);
  const numericWidth = parseInt(doorForm.width, 10) || 0;
  const adaClearOpening = Math.max(0, numericWidth - ADA_CLEARANCE_DEDUCTION_MM);
  const showAdaWarning = doorForm.ada && (numericWidth < ADA_MIN_CLEAR_OPENING_MM || adaClearOpening < ADA_MIN_CLEAR_OPENING_MM);
  const adaWarningMessage = showAdaWarning
    ? `Door width ${numericWidth || 0}mm provides ${adaClearOpening}mm clear opening; ADA requires ${ADA_MIN_CLEAR_OPENING_MM}mm (32").`
    : '';
  const isBetaUser = Boolean(user && (user.plan === "beta_tester" || user.plan === "beta_admin"));
  const downloadCount =
    !user || user.plan === "beta_admin" ? null : downloadUsage.count;

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;
    const handleClick = (event) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event) => setDesktopShortcutsEnabled(event.matches);
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleKeyDown = (event) => {
      if (!desktopShortcutsEnabled) return;
      if (!event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        undoHistory();
      } else if ((key === "y" || (key === "z" && event.shiftKey)) && canRedo) {
        event.preventDefault();
        redoHistory();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [desktopShortcutsEnabled, undoHistory, redoHistory, canUndo, canRedo]);

  useEffect(() => {
    if (undoRedoRef.current) {
      undoRedoRef.current = false;
      return;
    }
    const snapshot = deepClone(projects);
    setHistoryState((prev) => ({
      past: [...prev.past, prev.present].slice(-HISTORY_LIMIT),
      present: snapshot,
      future: []
    }));
  }, [projects]);

  // Load projects when user changes (per-user storage)
  useEffect(() => {
    if (!user?.email) {
      setProjects([]);
      setCurrentId(null);
      return;
    }
    const load = async () => {
      try {
        const remoteProjects = await loadProjectsForUser(user.email);
        setProjects(remoteProjects.map(normalizeProject));
      } catch (err) {
        console.error("Failed to load projects from Firestore", err);
      }
    };
    load();
  }, [user?.email]);

  useEffect(() => {
    let active = true;
    const fetchUsage = async () => {
      if (!user || user.plan === "beta_admin") {
        if (active) setDownloadUsage({ count: 0, limit: DOWNLOAD_LIMIT });
        return;
      }
      try {
        const usage = await getDownloadUsage(user.email);
        if (active) setDownloadUsage(usage);
      } catch (err) {
        console.error("Failed to load download usage", err);
      }
    };
    fetchUsage();
    return () => {
      active = false;
    };
  }, [user?.email]);

    // Redirect to landing when auth is gone (logout / expiry)
    useEffect(() => {
    // If the user logs out or expires while not on the landing page,
    // send them back to the landing view.
    if (!user && view !== "landing") {
      setView("landing");
    }
  }, [user, view]);


  // Save projects when they change (per user)
  useEffect(() => {
    if (!user?.email) return;
    setSaveStatus('Saving...');
    const persist = async () => {
      try {
        for (const project of projects) {
          await saveProjectForUser(user.email, project);
        }
        setSaveStatus('Saved');
      } catch (err) {
        console.error("Failed to save projects", err);
        setSaveStatus('Error saving');
      }
    };
    persist();
  }, [projects, user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    window.history.replaceState({ view }, "");
    historySyncRef.current = false;

    const handlePopstate = (event) => {
      const nextView = event.state?.view || 'landing';
      historySyncRef.current = true;
      setView(nextView);
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  useEffect(() => {
    if (historySyncRef.current) {
      historySyncRef.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    window.history.pushState({ view }, "");
  }, [view]);

  useEffect(() => {
    if (isDoorModalOpen) {
      checkCompliance();
      updateDynamicProps();
      if (doorForm.material === 'Glass' && doorForm.visionPanel) {
          setDoorForm(prev => ({ ...prev, visionPanel: false }));
      }
    }
  }, [doorForm.fire, doorForm.use, doorForm.width, doorForm.height, doorForm.thickness, doorForm.location, doorForm.material]);

 useEffect(() => {
  if (!user || !user.expiresAt) {
    setRemainingLabel("");
    return;
  }

  const update = () => {
    const msLeft = user.expiresAt - Date.now();
    if (msLeft <= 0) {
      setRemainingLabel("Expired");
      return;
    }

    const totalMinutes = Math.round(msLeft / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) {
      setRemainingLabel(`Expires in ${hours}h ${mins}m`);
    } else {
      setRemainingLabel(`Expires in ${mins}m`);
    }
  };

  update();                         // set immediately
  const id = setInterval(update, 60000); // update every minute

  return () => clearInterval(id);
}, [user]);

  useEffect(() => {
    if (isAdmin) {
      setDownloadWarning("");
    }
  }, [isAdmin]);

  const getProj = () => projects.find(p => p.id === currentId);

  const isStepComplete = useCallback(
    (idx) => {
      const proj = getProj();
      if (!proj) return false;
      const hasDoors = Array.isArray(proj.doors) && proj.doors.length > 0;
      const hasSets = Array.isArray(proj.sets) && proj.sets.length > 0;
      switch (idx) {
        case 0:
          return (
            Boolean(proj.name?.trim()) &&
            Boolean(proj.type) &&
            Boolean(proj.standard) &&
            Boolean(proj.details?.jurisdiction)
          );
        case 1:
          return hasDoors;
        case 2:
          return hasDoors && hasSets;
        case 3:
          return hasDoors && hasSets && reviewFinalized;
        default:
          return false;
      }
    },
    [projects, currentId, reviewFinalized]
  );

  const canAccessStep = useCallback(
    (target) => {
      if (target == null) return true;
      if (target <= 0) return true;
      for (let i = 0; i < target; i += 1) {
        if (!isStepComplete(i)) return false;
      }
      return true;
    },
    [isStepComplete]
  );

  const handleStepChange = useCallback(
    (target) => {
      if (typeof target !== "number" || target === step) return;
      if (target > step && !canAccessStep(target)) {
        setBlockedStep(target);
        const prevLabel = WIZARD_STEPS[target - 1] || "previous step";
        const targetLabel = WIZARD_STEPS[target] || "next step";
        const title = target === 1 ? "Finish Setup to Continue" : "Finish previous step";
        showNotice(title, `Complete ${prevLabel} before moving to ${targetLabel}.`);
        return;
      }
      setBlockedStep(null);
      setStep(target);
    },
    [step, canAccessStep, showNotice]
  );

  const handleFinishReview = useCallback(() => {
    setReviewFinalized(true);
    handleStepChange(3);
  }, [handleStepChange]);

  useEffect(() => {
    if (blockedStep !== null && canAccessStep(blockedStep)) {
      setBlockedStep(null);
    }
  }, [blockedStep, canAccessStep]);

  useEffect(() => {
    setReviewFinalized(false);
  }, [currentId]);

  useEffect(() => {
    if (step < 3 && reviewFinalized) {
      setReviewFinalized(false);
    }
  }, [step, reviewFinalized]);

  // --- ACTIONS ---

  const addToAuditLog = (projId, action) => {
    const entry = {
      timestamp: new Date().toISOString(),
      user: userRole,
      action: action
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        return { ...p, auditLog: [entry, ...(p.auditLog || [])] };
      }
      return p;
    }));
  };

  const createProject = () => {
    const id = generateId();
    const newProj = {
      id,
      name: "",
      type: "Commercial Office",
      standard: "ANSI",
      details: { client: "", architect: "", jurisdiction: "IBC 2021", address: "" },
      doors: [],
      sets: [],
      auditLog: [],
      instantInputs: cloneInstantInputs(),
      instantSchedulingEnabled: false
    };
    setProjects([...projects, newProj]);
    loadProject(id);
  };

  const loadProject = (id) => {
    setCurrentId(id);
    setBlockedStep(null);
    setStep(0);
    setView('wizard');
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    const confirmed = await openPrompt({
      title: "Delete project?",
      message: "Are you sure you want to delete this project?",
      confirmLabel: "Delete",
      tone: "danger"
    });
    if (!confirmed) return;
    try {
      await deleteProjectForUser(id);
      setProjects(projects.filter(p => p.id !== id));
      if (currentId === id) {
        setCurrentId(null);
        setView("dashboard");
      }
    } catch (err) {
      console.error("Failed to delete project", err);
      await showNotice("Something went wrong", "Unable to delete project. Please try again.");
    }
  };
  
  const resetApp = async () => {
    const confirmed = await openPrompt({
      title: "Reset workspace?",
      message: "This will clear all data for this user. Are you sure?",
      confirmLabel: "Reset",
      tone: "danger"
    });
    if (!confirmed) return;
    if (!user?.email) {
      setProjects([]);
      setView("landing");
      return;
    }
    try {
      const currentProjects = await loadProjectsForUser(user.email);
      await Promise.all(currentProjects.map((proj) => deleteProjectForUser(proj.id)));
    } catch (err) {
      console.error("Failed to reset projects", err);
    }
    setProjects([]);
    setCurrentId(null);
    setBlockedStep(null);
    setStep(0);
    setView("landing");
  };

  const updateInstantInput = (field, value) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== currentId) return p;
        const defaults = cloneInstantInputs();
        const currentInstant = { ...defaults, ...(p.instantInputs || {}) };
        const facilityType = p.type;
        return {
          ...p,
          instantInputs: {
            ...currentInstant,
            [facilityType]: {
              ...currentInstant[facilityType],
              [field]: value
            }
          }
        };
      })
    );
  };

  const setInstantSchedulingEnabled = (enabled) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === currentId ? { ...p, instantSchedulingEnabled: Boolean(enabled) } : p))
    );
  };

  const handleInstantScheduleClick = async () => {
    const proj = getProj();
    if (!proj) return;
    if (!proj.instantSchedulingEnabled) {
      await showNotice("Enable Instant Scheduling", "Turn on Instant Door Scheduling in Step 1 to generate starter doors.");
      return;
    }
    const generated = generateInstantDoorSchedule(proj);
    if (!generated.length) {
      await showNotice("Need more info", "Add more Instant Door Scheduling info in Step 1 to auto-generate doors.");
      return;
    }
    if (proj.doors.length > 0) {
      const append = await openPrompt({
        title: "Append doors?",
        message: "Append generated doors to your existing schedule?",
        confirmLabel: "Append"
      });
      if (!append) return;
    }
    setInstantDoorModal({ isOpen: true, doors: generated });
  };

  const applyInstantDoorSchedule = () => {
    if (!instantDoorModal.doors.length) {
      setInstantDoorModal({ isOpen: false, doors: [] });
      return;
    }
    const proj = getProj();
    if (!proj) return;
    const updatedProjects = projects.map((p) =>
      p.id === currentId ? { ...p, doors: [...p.doors, ...instantDoorModal.doors] } : p
    );
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Auto-generated ${instantDoorModal.doors.length} doors`);
    setInstantDoorModal({ isOpen: false, doors: [] });
  };

  const saveProjectDetails = async (name, type, standard, details) => {
    const updatedProjects = projects.map((p) =>
      p.id === currentId ? { ...p, name, type, standard, details } : p
    );
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Updated project details: ${name}`);
    if (user?.email) {
      const current = updatedProjects.find((p) => p.id === currentId);
      if (current) {
        await saveProjectForUser(user.email, current);
      }
    }
  };

  const openPrintPreview = () => {
    setPrintMode(true);
  };

  const saveDoor = async () => {
    if (Object.keys(doorErrors).length > 0) return;

    const updatedProjects = projects.map((p) => {
      if (p.id === currentId) {
        const newDoors = [...p.doors];
        const doorId = doorForm.id || generateId();
        const cleanedLocations = (doorForm.additionalLocations || []).filter(
          (loc) => loc.zone || loc.level || loc.roomName
        );
        const doorData = normalizeDoor({
          ...doorForm,
          id: doorId,
          additionalLocations: cleanedLocations
        });

        const idx = newDoors.findIndex((d) => d.id === doorForm.id);
        if (idx >= 0) newDoors[idx] = doorData;
        else newDoors.push(doorData);

        return { ...p, doors: newDoors };
      }
      return p;
    });
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Saved door: ${doorForm.mark}`);
    setIsDoorModalOpen(false);

    if (user?.email) {
      const current = updatedProjects.find((p) => p.id === currentId);
      if (current) {
        await saveProjectForUser(user.email, current);
      }
    }
  };

  const deleteDoor = async (doorId) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === currentId) {
        return { ...p, doors: p.doors.filter((d) => d.id !== doorId) };
      }
      return p;
    });
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Deleted door ID: ${doorId}`);
    if (user?.email) {
      const current = updatedProjects.find((p) => p.id === currentId);
      if (current) {
        await saveProjectForUser(user.email, current);
      }
    }
  };

  const duplicateDoor = async (doorId) => {
    const proj = getProj();
    const original = proj.doors.find(d => d.id === doorId);
    const copies = prompt("How many copies do you want to create?", "1");
    const numCopies = parseInt(copies) || 1;
    
    const newDoors = [];
    for(let i=0; i < numCopies; i++) {
        newDoors.push(normalizeDoor({ 
            ...original, 
            id: generateId(), 
            mark: `${original.mark}-CP${i+1}` 
        }));
    }
    
    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, doors: [...p.doors, ...newDoors] } : p
    );
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Bulk duplicated door ${original.mark} (${numCopies} times)`);
    if (user?.email) {
      const current = updatedProjects.find((p) => p.id === currentId);
      if (current) {
        await saveProjectForUser(user.email, current);
      }
    }
  };

  const modifyDoorAdditionalLocations = (doorId, updater) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== currentId) return p;
        const updatedDoors = p.doors.map((door) => {
          if (door.id !== doorId) return door;
          const currentList = [...(door.additionalLocations || [])];
          const updatedList = updater(currentList, door) || [];
          return normalizeDoor({ ...door, additionalLocations: updatedList });
        });
        return { ...p, doors: updatedDoors };
      })
    );
  };

  const addDoorAdditionalLocation = (doorId) => {
    const door = getProj()?.doors.find((d) => d.id === doorId);
    if (!door) return;
    modifyDoorAdditionalLocations(doorId, (list) => [
      ...list,
      { zone: door.zone, level: door.level, roomName: `${door.roomName} #${list.length + 2}` }
    ]);
  };

  const updateDoorAdditionalLocation = (doorId, idx, field, value) => {
    modifyDoorAdditionalLocations(doorId, (list) => {
      const updated = [...list];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const removeDoorAdditionalLocation = (doorId, idx) => {
    modifyDoorAdditionalLocations(doorId, (list) => {
      const updated = [...list];
      updated.splice(idx, 1);
      return updated;
    });
  };

  const updateDynamicProps = () => {
      let newThickness = 45;
      if (doorForm.material === 'Glass') {
          newThickness = 12;
      } else {
          const fire = parseInt(doorForm.fire);
          if (fire === 0 || fire === 20 || fire === 30) newThickness = 45;
          else if (fire === 45 || fire === 60) newThickness = 54;
          else if (fire >= 90) newThickness = 64;
      }

      let newWeight = 45;
      const h_m = doorForm.height / 1000;
      const w_m = doorForm.width / 1000;
      const t_m = newThickness / 1000;
      const vol = h_m * w_m * t_m;
      const area = h_m * w_m;

      if (doorForm.material === 'Timber') {
          const density = parseInt(doorForm.fire) > 0 ? 800 : 600; 
          newWeight = Math.round(vol * density);
      } else if (doorForm.material === 'Glass') {
          newWeight = Math.round(vol * 2500);
      } else if (doorForm.material === 'Metal') {
          const areaDensity = parseInt(doorForm.fire) > 0 ? 45 : 35; 
          newWeight = Math.round(area * areaDensity);
      } else {
          newWeight = Math.round(area * 30);
      }
      newWeight = Math.ceil(newWeight / 5) * 5;

      let recStc = 30;
      for (const [key, value] of Object.entries(ACOUSTIC_RECOMMENDATIONS)) {
          if (doorForm.use.includes(key) || (doorForm.roomName && doorForm.roomName.includes(key))) {
              recStc = value;
              break;
          }
      }

      setDoorForm(prev => ({
          ...prev,
          thickness: prev.thicknessAuto === false ? prev.thickness : newThickness,
          thicknessAuto: prev.thicknessAuto === undefined ? true : prev.thicknessAuto,
          weight: prev.weightAuto === false ? prev.weight : newWeight,
          weightAuto: prev.weightAuto === undefined ? true : prev.weightAuto,
          stc: recStc
      }));
  };

  const checkCompliance = () => {
    let note = null;
    const useLower = doorForm.use.toLowerCase();
    const isFireRated = doorForm.fire > 0;

    if ((useLower.includes('stair') || useLower.includes('exit')) && !isFireRated) {
      note = { type: 'warning', msg: "Code Alert: Stairwell/Exit doors typically require a Fire Rating (e.g., 60min/90min per NFPA 80 / EN 1634)." };
    }
    else if ((useLower.includes('unit') || useLower.includes('guest')) && !isFireRated) {
      note = { type: 'warning', msg: "Code Alert: Unit Entry doors usually require a fire rating (e.g., FD30/20min)." };
    }
    else if (doorForm.width < 850 && (useLower.includes('patient') || useLower.includes('accessible') || useLower.includes('entrance'))) {
      note = { type: 'info', msg: "Accessibility Note: Clear opening width might be too narrow for wheelchair access (Recommend >900mm)." };
    }
    else if (useLower.includes('corridor') && !isFireRated) {
      note = { type: 'info', msg: "Cross-corridor doors often require smoke/fire control." };
    }

    setComplianceNote(note);
  };

  const validatePhysics = (field, value) => {
    const errors = { ...doorErrors };
    let hint = '';
    const numericValue = parseInt(value) || 0;

    if (field === 'width' || field === 'all') {
      const val = field === 'all' ? doorForm.width : numericValue;
      if (val > 0 && (val < 600 || val > 1300)) errors.width = "Width must be 600-1300mm";
      else delete errors.width;
      
      if (val > 1100) hint = "Info: Wide (>1100mm). HD Closers suggested.";
    }

    if (field === 'height' || field === 'all') {
      const val = field === 'all' ? doorForm.height : numericValue;
      if (val > 0 && (val < 1900 || val > 3000)) errors.height = "Height must be 1900-3000mm";
      else delete errors.height;
    }

    if (field === 'weight' || field === 'all') {
      const val = field === 'all' ? doorForm.weight : numericValue;
      if (val > 150) hint = "Info: Heavy (>150kg). Pivot Sets suggested.";
    }

    setDoorErrors(errors);
    setDoorHint(hint);
  };

  const openDoorModal = (door = null) => {
    const proj = getProj();
    const facilityUsages = FACILITY_DATA[proj.type]?.usages || FACILITY_DATA["Commercial Office"].usages;
    
    if (door) {
      setDoorForm(normalizeDoor({ ...door }));
    } else {
      setDoorForm(normalizeDoor({
        id: '', 
        mark: `D-${(proj.doors.length + 1).toString().padStart(3, '0')}`,
        zone: 'Tower A', level: '01', roomName: '', // Corrected Default
        qty: 1, 
        width: 900, 
        height: 2100, 
        weight: 45, 
        fire: 0, 
        use: facilityUsages[0], 
        material: 'Timber', 
        config: 'Single',
        thickness: 45,
        thicknessAuto: true,
        visionPanel: false,
        handing: 'RH',
        stc: 35, ada: false, notes: '',
        weightAuto: true,
        additionalLocations: []
      }));
    }
    setDoorErrors({});
    setDoorHint('');
    setComplianceNote(null);
    // Ensure exclusive modal state
    setAddItemModal({ isOpen: false, setId: null });
    setIsDoorModalOpen(true);
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportData = async () => {
    setExportStatus('Generating...');
    const acknowledged = await openPrompt({
      title: "Review Notice",
      message: REVIEW_NOTICE,
      confirmLabel: "I Understand"
    });
    if (!acknowledged) {
      setExportStatus('');
      return;
    }
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const p = getProj();
      const wb = XLSX.utils.book_new();

      const createSheetWithHeader = (data, sheetName) => {
        const headerRows = [
          [`PROJECT: ${p.name}`],
          [`CLIENT: ${p.details?.client || ''}`, `ARCHITECT: ${p.details?.architect || ''}`],
          [`FACILITY: ${p.type}`, `JURISDICTION: ${p.details?.jurisdiction || ''}`],
          [`STANDARD: ${p.standard}`, `DATE: ${new Date().toLocaleDateString()}`],
          []
        ];
        const ws = XLSX.utils.json_to_sheet(data, { origin: "A6" });
        XLSX.utils.sheet_add_aoa(ws, headerRows, { origin: "A1" });
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      const doorData = p.doors.map(d => ({
        "Mark": d.mark, "Zone": d.zone, "Level": d.level, "Room": d.roomName,
        "Qty": d.qty, "Width": d.width, "Height": d.height, "Thk": d.thickness,
        "Fire": d.fire > 0 ? `${d.fire} min` : 'NFR', "Acoustic": d.stc ? `${d.stc} dB` : 'N/A',
        "Material": d.material, "Config": d.config, "Handing": d.handing,
        "HW Set": p.sets.find(s => s.doors.includes(d.id))?.id || 'None'
      }));
      createSheetWithHeader(doorData, "Door Schedule");

      const hwData = [];
      p.sets.forEach(s => {
        const doorsInSet = p.doors.filter(d => s.doors.includes(d.id));
        const configLabel = doorsInSet.some(d => d.config === 'Double') ? 'Double' : 'Single';
        (s.items || []).forEach(i => {
          hwData.push({
            "Set": s.id, "Set Name": s.name, "Door Config": configLabel, "Ref": i.ref, "Category": i.category,
            "Type": i.type, "Style": i.style, "Finish": i.finish, "Spec": i.spec, "Qty": i.qty,
            "Acoustic Contribution": i.acousticContribution || ""
          });
        });
      });
      createSheetWithHeader(hwData, "Hardware Specs");

      const bomMap = {};
      p.sets.forEach(s => {
        const doorCount = p.doors.filter(d => s.doors.includes(d.id)).reduce((sum, d) => sum + d.qty, 0);
        (s.items || []).forEach(i => {
           const key = `${i.category}_${i.type}_${i.spec}_${i.finish}`;
           if (!bomMap[key]) {
             bomMap[key] = {
               "Category": i.category, "Type": i.type, "Style": i.style,
               "Spec": i.spec, "Finish": i.finish, "Total Qty": 0
             };
           }
           let q = parseFloat(i.qty);
           if (isNaN(q)) q = 1;
           bomMap[key]["Total Qty"] += (q * doorCount);
        });
      });
      createSheetWithHeader(Object.values(bomMap), "Bill of Materials");

      XLSX.writeFile(wb, `${p.name.replace(/\s+/g, '_')}_Schedule_v2.xlsx`);
      setExportStatus('');
      setSaveStatus('Exported!');
    } catch (error) {
      console.error("Export failed:", error);
      await showNotice("Export failed", "Failed to generate Excel file. Please check your internet connection (loading external engine).");
      setExportStatus('');
      setSaveStatus('Error');
    }
  };

  const exportBIMData = async () => {
    const acknowledged = await openPrompt({
      title: "Review Notice",
      message: REVIEW_NOTICE,
      confirmLabel: "I Understand"
    });
    if (!acknowledged) return;
    const p = getProj();
    const bimRows = p.doors.map(d => ({
        "Mark": d.mark,
        "IfcDoorStyle": d.config,
        "Width": d.width,
        "Height": d.height,
        "FireRating": d.fire,
        "AcousticRating": d.stc || "N/A", 
        "HardwareSet": p.sets.find(s => s.doors.includes(d.id))?.id || "None"
    }));

    const headers = Object.keys(bimRows[0]);
    const csvContent = [
      headers.join(','),
      ...bimRows.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadCSV(csvContent, `${p.name.replace(/\s+/g, '_')}_BIM_SharedParams.csv`);
  };

  const handlePrint = async () => {
    const acknowledged = await openPrompt({
      title: "Review Notice",
      message: REVIEW_NOTICE,
      confirmLabel: "I Understand"
    });
    if (acknowledged) {
      window.print();
    }
  };

  const handleDownloadWithLimit = async (action) => {
    if (!user) {
      await showNotice("Sign in required", "Please log in to download documents.");
      return;
    }
    if (user.plan === "beta_admin") {
      await Promise.resolve(action());
      return;
    }
    try {
      const result = await incrementDownloadCount(user.email, DOWNLOAD_LIMIT);
      if (!result.allowed) {
        const message =
          "You’ve reached the 10-download limit for this beta. Please contact your InstaSpec admin to increase your download allowance.";
        setDownloadWarning(message);
        await showNotice("Download limit", message);
        setDownloadUsage({ count: result.count, limit: result.limit });
        return;
      }
      setDownloadUsage(result);
      setDownloadWarning("");
      await Promise.resolve(action());
    } catch (err) {
      console.error("Failed to increment download usage", err);
      await showNotice("Download check failed", "Unable to verify download limit. Please try again shortly.");
    }
  };

  // Hardware Logic
  const generateHardwareSets = async () => {
    const proj = getProj();
    if (!proj) return;
    if (!proj.doors.length) {
      await showNotice(
        "Door schedule missing",
        "Finish the Door scheduling before proceeding to the next step."
      );
      return;
    }
    const groups = {};

    proj.doors.forEach(d => {
      const key = `${d.use}|${d.fire}|${d.config}|${d.material}|${d.stc}|${d.hardwareIntent || 'Mechanical'}`; 
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    const newSets = Object.entries(groups).map(([key, doors], idx) => {
      const setProfile = buildSetProfile(doors);
      const [use, fireStr, config, material, stcStr, intentKey] = key.split('|');
      const fire = parseInt(fireStr);
      const stc = parseInt(stcStr);
      const rep = doors.reduce((a, b) => a.weight > b.weight ? a : b);
      const packageIntent = intentKey === 'Electromechanical' ? 'Electromechanical' : 'Mechanical';
      const adaDoors = doors.some((door) => door.ada);
      
      const setID = `HW-${String(idx + 1).padStart(2, '0')}`;
      const isDouble = config === 'Double';
      const hospitalityQty = isDouble ? "2" : "1";
      const normalizedUse = (use || "").toLowerCase();
      const isGuestRoomEntry = normalizedUse.includes("guest room");
      let items = [];
      const addItem = (cat, ref, type, style, spec, qty) => {
        const finish = getDefaultFinishForCategory(cat, proj.standard);
        items.push({ category: cat, ref, type, style, spec, qty, finish });
      };

      let hingeQty = 3;
      if (rep.height > 2300) hingeQty = 4;
      if (rep.weight > 120) hingeQty = 4;
      if (rep.height > 2300 && rep.weight > 120) hingeQty = 5;
      const totalHingeQty = hingeQty * (isDouble ? 2 : 1);

      const activeLeafSpec = (text) => isDouble ? `${text} (Active Leaf)` : text;
      const inactiveLeafSpec = (text) => isDouble ? `${text} (Inactive Leaf)` : text;

      if (material === "Glass") {
          const patchQty = isDouble ? "2" : "1";
          addItem("Hinges", "P01", "Patch Fitting", "Top Patch", "Top/Bottom patch kit", patchQty);
          addItem("Locks", "L01", "Patch Lock", "Corner Patch Lock", activeLeafSpec("Euro Cylinder Type"), "1");
          const glassHandleType = setProfile.requiresPanic ? "Panic Push Pull Handle" : "Pull Handle";
          const glassHandleStyle = setProfile.requiresPanic ? "L-Shaped" : "D-Pull";
          const glassHandleSpec = setProfile.requiresPanic ? activeLeafSpec("L-shaped panic pull for tempered glass") : activeLeafSpec("600mm ctc");
          addItem("Handles", "H01", glassHandleType, glassHandleStyle, glassHandleSpec, "1 Pr");
          addItem("Closers", "D01", "Floor Spring", "Double Action", activeLeafSpec("EN 1-4"), "1");
          if (isDouble) addItem("Closers", "D02", "Floor Spring", "Double Action", inactiveLeafSpec("EN 1-4"), "1");
      } else {
          const hingeType = proj.standard === "ANSI" ? "4.5x4.5" : "102x76x3";
          addItem("Hinges", "H01", "Butt Hinge", "Ball Bearing", `${hingeType}, SS`, totalHingeQty.toString());
          
          if (normalizedUse.includes("stair")) {
              addItem("Locks", "L01", "Panic Bar", "Rim Type", activeLeafSpec("Fire Rated Exit Device"), "1");
          } else if (isGuestRoomEntry) {
              addItem("Locks", "L01", "Hotel Lock", "RFID Mortise", activeLeafSpec("Mobile key / RFID ready hotel lock"), "1");
              addItem("Cylinders", "C01", "Cylinder", "Mortise Cylinder", activeLeafSpec("Emergency override cylinder"), hospitalityQty);
              addItem("Handles", "H02", "Lever Handle", "Return to Door", "Interior privacy lever trim", "1 Pr");
              addItem("Accessories", "A02", "Door Viewer", "Wide Angle", "180° guest room viewer", "1");
              addItem("Accessories", "A03", "Kick Plate", "Satin Stainless", activeLeafSpec("Corridor protection plate"), hospitalityQty);
          } else {
              addItem("Locks", "L01", "Mortise Lock", "Sashlock", activeLeafSpec("Cylinder Function"), "1");
              addItem("Cylinders", "C01", "Cylinder", "Euro Profile", activeLeafSpec("Key/Turn"), "1");
              addItem("Handles", "H02", "Lever Handle", "Return to Door", activeLeafSpec("19mm dia"), "1 Pr");
          }
          
          addItem("Closers", "D01", "Overhead Closer", "Rack & Pinion", activeLeafSpec("EN 2-5, Backcheck"), "1");
          if (isDouble) addItem("Closers", "D02", "Overhead Closer", "Rack & Pinion", inactiveLeafSpec("EN 2-5, Backcheck"), "1");
          addItem("Stops", "S01", "Door Stop", "Floor Mounted Dome", "Rubber Buffer", "1");
          if (fire > 0) {
            addItem("Seals", "GS01", "Perimeter Seal", "Intumescent", "Head & jambs, 3 sides", "1 Set");
            addItem("Seals", "GS02", "Drop Seal", "Automatic", "Under door smoke seal", "1");
          }
          if (isDouble) addItem("Accessories", "A01", "Leaf Assignment", "Active/Inactive", "Inactive leaf held closed without locking hardware", "1");
      }

      if (fire > 0 && material === "Glass") {
          addItem("Seals", "GS01", "Perimeter Seal", "Intumescent", "Glass intumescent gasketing", "1 Set");
          addItem("Seals", "GS02", "Drop Seal", "Automatic", "Smoke seal at threshold", "1");
      }

      if (packageIntent === 'Electromechanical') {
          if (isGuestRoomEntry) {
              addItem("Electrified", "E02", "Door Contact", "Surface", activeLeafSpec("Online monitoring contact"), hospitalityQty);
          } else {
              addItem("Electrified", "E01", "Electric Strike", fire > 0 ? "Fail-Safe" : "Fail-Secure", activeLeafSpec("Access control interface"), "1");
          }
      }

      const operationPieces = [];
      if (fire > 0) operationPieces.push(`Fire door to ${fire}min with ${doorsInlined(config)} configuration`);
      else operationPieces.push(`${config} door, non-fire rated`);
      if (packageIntent === 'Electromechanical') {
        operationPieces.push("Electrified access control with fail-safe release");
      } else {
        operationPieces.push("Mechanical locking with free egress");
      }
      const hasProximity = items.some(i => (i.type || '').toLowerCase().includes('panic'));
      if (hasProximity) operationPieces.push("Single-motion exit via panic hardware");
      const hasSeals = items.some(i => i.category === 'Seals');
      if (hasSeals) operationPieces.push("Perimeter and bottom seals included");
      if (adaDoors) operationPieces.push("Meets ADA 813mm clear opening with accessible hardware");
      const operationText = operationPieces.join(". ") + ".";

      const context = computeSetContext(doors, items);
      const sanitizedItems = sanitizeHardwareItems(items, proj.standard, { ...context, removedAutoTags: [] });
      return {
        id: setID,
        name: `${use} Door (${material}) - ${fire > 0 ? fire + 'min' : 'NFR'}`,
        doors: doors.map(d => d.id),
        intent: packageIntent,
        items: sanitizedItems,
        operation: operationText,
        removedAutoTags: []
      };
    });

    const updatedProjects = projects.map(p =>
      p.id === currentId ? { ...p, sets: newSets } : p
    );
    setProjects(updatedProjects);
    handleStepChange(2);
    await openPrompt({
      title: "Review Notice",
      message: REVIEW_NOTICE,
      confirmLabel: "I Understand",
      showCancel: false
    });
  };

  const updateSetItem = (setId, idx, field, val) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            const newItems = [...s.items];
            newItems[idx] = { ...newItems[idx], [field]: val };
            const doorsInSet = p.doors.filter(d => s.doors.includes(d.id));
            const context = computeSetContext(doorsInSet, newItems);
            const removedAutoTags = s.removedAutoTags ? [...s.removedAutoTags] : [];
            return {
              ...s,
              items: sanitizeHardwareItems(newItems, p.standard, { ...context, removedAutoTags }),
              removedAutoTags
            };
          }
          return s;
        });
        return { ...p, sets: newSets };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  // Feature 5: Library Logic
  const saveSetToLibrary = (set) => {
      const newLibSet = { ...set, id: `LIB-${generateId()}`, name: `${set.name} (Template)` };
      setLibrary([...library, newLibSet]);
      showNotice("Library updated", "Hardware Set saved to Global Library!", "Great!");
  };

  const loadSetFromLibrary = (libSet) => {
      const proj = getProj();
      const newSetId = `HW-${String(proj.sets.length + 1).padStart(2, '0')}`;
      const baseSet = { ...libSet, id: newSetId, doors: [] };
      const loadContext = {
        ...computeSetContext([], baseSet.items || []),
        removedAutoTags: baseSet.removedAutoTags || []
      };
      const newSet = {
        ...baseSet,
        items: sanitizeHardwareItems(baseSet.items || [], proj.standard, loadContext),
        removedAutoTags: baseSet.removedAutoTags || []
      };
      
      const updatedProjects = projects.map(p => 
        p.id === currentId ? { ...p, sets: [...p.sets, newSet] } : p
      );
      setProjects(updatedProjects);
      addToAuditLog(currentId, `Loaded set ${libSet.name} from Library`);
  };

  // This now triggers the modal
  const handleAddItemClick = (setId) => {
    setAddItemModal({ isOpen: true, setId });
  };

  const addNewItem = (category, type) => {
    const proj = getProj();
    if (!proj) return;
    
    // Find styles
    const catData = PRODUCT_CATALOG[category];
    const typeData = catData?.types.find(t => t.name === type);
    const defaultStyle = typeData ? typeData.styles[0] : "";
    
    const targetSet = proj.sets.find(s => s.id === addItemModal.setId);
    if (!targetSet) return;
    if (category === "Hinges" && targetSet.items.some(i => i.category === "Hinges")) {
      showNotice("One at a time", "Only one hanging product can be specified per hardware set.");
      return;
    }
    if (category === "Locks" && targetSet.items.some(i => i.category === "Locks")) {
      showNotice("One at a time", "Only one locking product can be specified per hardware set.");
      return;
    }

    const ref = getNextRefForCategory(targetSet.items, category);

    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === addItemModal.setId) {
            const newItem = { category, ref, type, style: defaultStyle, spec: "", qty: "1", finish: getDefaultFinishForCategory(category, proj.standard) };
            const doorsInSet = p.doors.filter(d => s.doors.includes(d.id));
            const context = computeSetContext(doorsInSet, [...s.items, newItem]);
            const removedAutoTags = s.removedAutoTags || [];
            return {
              ...s,
              items: sanitizeHardwareItems([...s.items, newItem], p.standard, { ...context, removedAutoTags }),
              removedAutoTags
            };
          }
          return s;
        });
        return { ...p, sets: newSets };
      }
      return p;
    });
    setProjects(updatedProjects);
    setAddItemModal({ isOpen: false, setId: null });
  };

  const handleBulkCreate = () => {
    const proj = getProj();
    const template = proj?.doors.find(d => d.id === bulkModal.templateId);
    if (!proj || !template) {
      showNotice("Template needed", "Select a template door.");
      return;
    }
    const lines = bulkModal.locationsText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      showNotice("Locations missing", "Provide at least one location.");
      return;
    }
    const parsed = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        zone: parts[0] || template.zone || '',
        level: parts[1] || template.level || '',
        roomName: parts[2] || template.roomName || ''
      };
    });
    const [first, ...rest] = parsed;
    const markBase = bulkModal.markPrefix || template.mark || `D-${String(proj.doors.length + 1).padStart(3, '0')}`;
    const newMark = generateUniqueMark(proj.doors, markBase);
    const newDoor = normalizeDoor({
      ...template,
      id: generateId(),
      mark: newMark,
      zone: first.zone,
      level: first.level,
      roomName: first.roomName,
      additionalLocations: rest,
      qty: parsed.length
    });
    const updatedProjects = projects.map(p => p.id === currentId ? { ...p, doors: [...p.doors, newDoor] } : p);
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Bulk created door ${newMark} (${parsed.length} locations)`);
    setBulkModal({ isOpen: false, templateId: "", markPrefix: "", locationsText: "" });
  };

  const deleteSetItem = (setId, idx) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            const newItems = [...s.items];
            newItems.splice(idx, 1);
            const doorsInSet = p.doors.filter(d => s.doors.includes(d.id));
            const context = computeSetContext(doorsInSet, newItems);
            const removedAutoTags = s.removedAutoTags ? [...s.removedAutoTags] : [];
            const itemRemoved = s.items[idx];
            if (itemRemoved?.autoTag && !removedAutoTags.includes(itemRemoved.autoTag)) {
              removedAutoTags.push(itemRemoved.autoTag);
            }
            return {
              ...s,
              items: sanitizeHardwareItems(newItems, p.standard, { ...context, removedAutoTags }),
              removedAutoTags
            };
          }
          return s;
        });
        return { ...p, sets: newSets };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const getValidationIssues = () => {
      const proj = getProj();
      const issues = [];
      
      proj.sets.forEach(s => {
          const doorsInSet = proj.doors.filter(d => s.doors.includes(d.id));
          const isFireRated = doorsInSet.some(d => d.fire > 0);
          const isStair = doorsInSet.some(d => d.use.toLowerCase().includes('stair') || d.use.toLowerCase().includes('exit'));
          const isGlass = doorsInSet.some(d => d.material === 'Glass');

          // Check 1: Fire Door Missing Closer
          if (isFireRated) {
              const hasCloser = s.items.some(i => i.category === 'Closers');
              if (!hasCloser) issues.push({ set: s.id, type: 'critical', msg: `Fire Rated set ${s.id} is missing a Door Closer.` });
              const hasSeal = s.items.some(i => i.category === 'Seals');
              if (!hasSeal) issues.push({ set: s.id, type: 'critical', msg: `Fire Rated set ${s.id} requires perimeter/drop seals.` });
          }

          // Check 2: Stair/Exit Missing Panic
          if (isStair) {
              const hasPanic = s.items.some(i => i.type.includes('Panic'));
              if (!hasPanic) issues.push({ set: s.id, type: 'critical', msg: `Stair/Exit set ${s.id} is missing Panic Hardware.` });
          }

          // Check 3: Glass Door Specs
          if (isGlass) {
              const hasPatch = s.items.some(i => i.type.includes('Patch') || i.type.includes('Rail'));
              if (!hasPatch) issues.push({ set: s.id, type: 'warning', msg: `Glass door set ${s.id} might need Patch Fittings or Rails.` });
          }
      });
      return issues;
  };

  // --- VIEWS ---

  if (view === 'landing') {
     return (
    <>
      <LandingPage
        onStart={() => setView('dashboard')}
        hasProjects={projects.length > 0}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminOpen={isAdminOpen}
        onCloseAdmin={() => setIsAdminOpen(false)}
        showNotice={showNotice}
      />
      {promptPortal}
    </>
  );
  }

  // --- PRINT MODE ---
  if (printMode) {
    return (
      <div className="bg-white min-h-screen text-black p-8 font-serif">
        <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">{getProj().name?.trim() || "New Project"}</h1>
            <p className="text-sm">Architectural Door Hardware Schedule</p>
          </div>
          <div className="text-right text-sm">
            <p>
              <strong>Client:</strong> {getProj().details?.client || "N/A"}
            </p>
            <p>
              <strong>Architect:</strong> {getProj().details?.architect || "N/A"}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {getProj().sets.map((s) => {
          const repDoor = getProj().doors.find((d) => s.doors.includes(d.id));
          return (
            <div key={s.id} className="mb-10 break-inside-avoid">
              <div className="flex justify-between items-end border-b border-black mb-2 pb-1">
                <h2 className="text-xl font-bold">
                  {s.id}: {s.name}
                </h2>
                <span className="text-sm font-mono">
                  {repDoor ? `${repDoor.fire > 0 ? `FD${repDoor.fire}` : "NFR"} | ${repDoor.material} | ${repDoor.config}` : ""}
                </span>
              </div>
              <div className="mb-4 text-sm italic text-gray-700">{s.operation}</div>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400">
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Finish</th>
                    <th className="text-left p-2">Acoustic</th>
                    <th className="text-center p-2">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(BHMA_CATEGORIES).map((catGroup) => {
                    const itemsInGroup = s.items.filter((i) => BHMA_CATEGORIES[catGroup].includes(i.category));
                    if (itemsInGroup.length === 0) return null;
                    return (
                      <React.Fragment key={catGroup}>
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="p-1 pl-2 font-bold text-xs uppercase text-gray-500 border-b">
                            {catGroup}
                          </td>
                        </tr>
                        {itemsInGroup.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="p-2 text-xs text-gray-400">{item.category}</td>
                            <td className="p-2 font-bold">{item.type}</td>
                            <td className="p-2">
                              {item.style} - {item.spec}
                            </td>
                            <td className="p-2">{item.finish}</td>
                            <td className="p-2">{item.acousticContribution || ""}</td>
                            <td className="text-center p-2">{item.qty}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {s.items
                    .filter((i) => !Object.values(BHMA_CATEGORIES).flat().includes(i.category))
                    .map((item, i) => (
                      <tr key={`other-${i}`} className="border-b border-gray-200">
                        <td className="p-2 text-xs text-gray-400">{item.category}</td>
                        <td className="p-2 font-bold">{item.type}</td>
                        <td className="p-2">
                          {item.style} - {item.spec}
                        </td>
                        <td className="p-2">{item.finish}</td>
                        <td className="p-2">{item.acousticContribution || ""}</td>
                        <td className="text-center p-2">{item.qty}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-gray-500">
                <strong>Locations:</strong>{" "}
                {getProj()
                  .doors.filter((d) => s.doors.includes(d.id))
                  .map((d) => `${d.mark} (${d.roomName})`)
                  .join(", ")}
              </div>
            </div>
          );
        })}

        <div className="fixed top-4 right-4 print:hidden">
          <button
            onClick={() => handleDownloadWithLimit(handlePrint)}
            className="px-4 py-2 bg-black text-white rounded shadow-lg flex items-center gap-2"
          >
            <Printer size={16} /> Print PDF
          </button>
          <button onClick={() => setPrintMode(false)} className="ml-2 px-4 py-2 bg-gray-200 text-black rounded shadow-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Global Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 sticky top-0 z-40">
        <div className="w-full flex items-center gap-3">
          {/* LEFT: Logo + home */}
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-2 font-bold text-lg md:text-xl text-gray-900 focus:outline-none"
          >
            <DoorClosed className="text-indigo-600" />
            <span>InstaSpec</span>
            <span className="text-xs text-gray-400 font-normal ml-1">v1.4 Beta</span>
          </button>

          {/* CENTER: Role + status (desktop) */}
          {user && (
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm">
                <UserCircle size={18} className="text-indigo-500" />
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="bg-transparent border-none text-sm font-semibold focus:ring-0 cursor-pointer"
                >
                  <option value="Architect">Architect View</option>
                  <option value="Contractor" disabled>
                    Contractor View (Coming Soon)
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* RIGHT: Desktop controls */}
          {user && (
            <div className="hidden md:flex items-center gap-3 ml-4">
              {isBetaUser && (
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  Share Feedback
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-indigo-200
                             text-indigo-600 hover:bg-indigo-50"
                >
                  Beta Admin
                </button>
              )}
              {/* Reset (dashboard only) */}
              {view === 'dashboard' && projects.length > 0 && (
                <button
                  onClick={resetApp}
                  className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1"
                  title="Clear All Data"
                >
                  <RotateCcw size={16} />
                  <span className="hidden md:inline">Reset</span>
                </button>
              )}

              {/* Dashboard button */}
              <button
                onClick={() => setView('dashboard')}
                className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm md:text-base"
              >
                <LayoutGrid size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </button>

              {/* User pill + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs md:text-sm
                             flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition"
                >
                  <span className="max-w-[140px] truncate">{user.email}</span>

                  {remainingLabel && (
                    <span
                      className="text-[10px] md:text-[11px] px-2 py-0.5 rounded-full
                                 bg-indigo-500/80 border border-white/20 whitespace-nowrap"
                    >
                      {remainingLabel}
                    </span>
                  )}

                  <ChevronDown size={12} className="opacity-80" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg
                               ring-1 ring-black/5 py-1 text-sm animate-[fadeInUp_0.18s_ease-out] origin-top-right"
                  >
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700
                                 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile condensed menu */}
          {user && (
            <div
              className="ml-auto md:hidden relative"
              ref={mobileNavRef}
            >
              <button
                type="button"
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700"
              >
                <UserCircle size={16} className="text-gray-500" />
                <span>{userRole === "Architect" ? "Architect View" : "Contractor View"}</span>
                <ChevronDown size={14} className={`transition-transform ${isMobileNavOpen ? "rotate-180" : ""}`} />
              </button>
              {isMobileNavOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 py-3 z-50">
                  <div className="px-4 pb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                    {remainingLabel && (
                      <p className="text-xs text-gray-500 mt-0.5">{remainingLabel}</p>
                    )}
                  </div>
                  <div className="border-t border-gray-100 my-2" />
                  <div className="px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    View Mode
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRole("Architect");
                      setIsMobileNavOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm flex items-center justify-between text-gray-800 hover:bg-indigo-50"
                  >
                    <span>Architect View</span>
                    {userRole === "Architect" && <Check size={14} className="text-indigo-600" />}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="w-full px-4 py-2 text-sm flex items-center justify-between text-gray-400 cursor-not-allowed"
                  >
                    <span>Contractor View</span>
                    <span className="text-[10px] uppercase">Soon</span>
                  </button>
                  <div className="border-t border-gray-100 my-2" />
                  <div className="px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Actions
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setView('dashboard');
                      setIsMobileNavOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-800 hover:bg-indigo-50 flex items-center gap-2"
                  >
                    <LayoutGrid size={16} className="text-gray-400" />
                    Dashboard
                  </button>
                  {isBetaUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsFeedbackOpen(true);
                        setIsMobileNavOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-800 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <MessageSquare size={16} className="text-amber-500" />
                      Share Feedback
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminOpen(true);
                        setIsMobileNavOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-800 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <ShieldCheck size={16} className="text-indigo-500" />
                      Beta Admin
                    </button>
                  )}
                  {view === 'dashboard' && projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        resetApp();
                        setIsMobileNavOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-800 hover:bg-red-50 flex items-center gap-2"
                    >
                      <RotateCcw size={16} className="text-red-400" />
                      Reset Workspace
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-2" />
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileNavOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-800 hover:bg-indigo-50 flex items-center gap-2"
                  >
                    <Power size={16} className="text-gray-400" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Project Context Bar */}
      {view === 'wizard' && getProj() && (
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-16 z-30 shadow-sm gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span className="font-bold text-base md:text-lg">{getProj().name?.trim() || "New Project"}</span>
            <span className="px-2 py-0.5 border rounded text-xs md:text-sm text-gray-500 bg-white whitespace-nowrap">{getProj().standard}</span>
            <span className="px-2 py-0.5 border rounded text-xs md:text-sm text-gray-500 bg-white whitespace-nowrap">{getProj().type}</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end items-center">
            <button onClick={() => setShowAuditLog(!showAuditLog)} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <History size={16} /> History
            </button>
            <button onClick={() => { saveProjectDetails(getProj().name, getProj().type, getProj().standard, getProj().details); showSaveConfirmation(); }} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <Save size={16} /> Save
            </button>
            <button onClick={() => setView('dashboard')} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <X size={16} /> Close
            </button>
            <span className="text-[11px] md:text-xs text-gray-500 border border-transparent rounded-full px-2 py-0.5 bg-gray-100 whitespace-nowrap">
              {exportStatus || saveStatus}
            </span>
          </div>
        </div>
      )}
      {/* Audit Log Viewer */}
      {showAuditLog && getProj() && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div onClick={() => setShowAuditLog(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
              <div className="relative w-80 bg-white shadow-2xl h-full overflow-y-auto p-6 animate-slideLeft">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><History size={20}/> Audit Trail</h3>
                  <div className="space-y-4">
                      {getProj().auditLog?.map((log, idx) => (
                          <div key={idx} className="text-sm border-l-2 border-indigo-200 pl-3">
                              <div className="font-bold text-gray-800">{log.action}</div>
                              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                  <span>{log.user}</span>
                                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                          </div>
                      ))}
                      {(!getProj().auditLog || getProj().auditLog.length === 0) && <p className="text-gray-400 text-sm">No history yet.</p>}
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="animate-slideUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
                <p className="text-gray-500">Manage your door specifications.</p>
              </div>
              <button onClick={createProject} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm w-full md:w-auto justify-center">
                <PlusCircle size={18} /> New Project
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id} onClick={() => loadProject(p.id)} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer group relative">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FolderOpen size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                  <div className="flex gap-2 mb-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{p.type}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{p.standard}</span>
                  </div>
                  <p className="text-sm text-gray-400">{p.doors.length} Doors Defined</p>
                  <button onClick={(e) => deleteProject(p.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
          </div>
        )}

        {/* WIZARD VIEW */}
        {view === 'wizard' && getProj() && (
          <div>
            {/* Stepper */}
            <div className="mb-6 md:mb-10">
              <div className="bg-white/90 border border-gray-200 rounded-2xl px-3 py-4 shadow-sm">
                {/* Desktop horizontal flow */}
                <div className="hidden md:flex items-center gap-3">
                  {WIZARD_STEPS.map((label, idx, arr) => {
                    const isActive = step === idx;
                    const isComplete = isStepComplete(idx);
                    const isWarning = blockedStep === idx && idx > step;
                    return (
                      <React.Fragment key={`desktop-step-${label}`}>
                        <button
                          type="button"
                          onClick={() => handleStepChange(idx)}
                          className="flex flex-col items-center gap-2 min-w-[130px] text-center focus:outline-none"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                              isActive
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                                : isComplete
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : isWarning
                                ? 'bg-orange-50 border-orange-400 text-orange-500'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}
                          >
                            {isComplete ? <Check size={16} /> : idx + 1}
                          </div>
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isActive ? 'text-indigo-600' : 'text-gray-400'
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                        {idx < arr.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 rounded-full ${
                              blockedStep === idx + 1
                                ? 'bg-orange-400'
                                : isStepComplete(idx)
                                ? 'bg-emerald-400'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                {/* Mobile single line */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between gap-2">
                    {WIZARD_SHORT_LABELS.map((shortLabel, idx, arr) => {
                      const label = WIZARD_STEPS[idx];
                      const isActive = step === idx;
                      const isComplete = isStepComplete(idx);
                      const isWarning = blockedStep === idx && idx > step;
                      return (
                        <React.Fragment key={`mobile-step-${shortLabel}`}>
                          <button
                            type="button"
                            onClick={() => handleStepChange(idx)}
                            className="flex flex-col items-center gap-0.5 text-center focus:outline-none bg-transparent"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                isActive
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow"
                                  : isComplete
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : isWarning
                                  ? "bg-orange-50 border-orange-400 text-orange-500"
                                  : "bg-white border-gray-300 text-gray-400"
                              }`}
                            >
                              {isComplete ? <Check size={14} /> : idx + 1}
                            </div>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${
                                isActive ? "text-indigo-600" : "text-gray-500"
                              }`}
                            >
                              {shortLabel}
                            </span>
                            <span className="sr-only">{label}</span>
                          </button>
                          {idx < arr.length - 1 && (
                            <div className="flex-1">
                              <div
                                className={`h-0.5 rounded-full ${
                                  blockedStep === idx + 1
                                    ? "bg-orange-400"
                                    : isStepComplete(idx)
                                    ? "bg-emerald-400"
                                    : "bg-gray-200"
                                }`}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 0: Setup */}
            {step === 0 && (() => {
              const proj = getProj();
              const facilityType = proj.type;
              const facilityInputs = getInstantInputsForProject(proj, facilityType);
              const instantEnabled = Boolean(proj.instantSchedulingEnabled);
              const numberField = (label, field, min = 0) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">{label}</label>
                  <input
                    type="number"
                    min={min}
                    value={facilityInputs[field] ?? ""}
                    onChange={(e) => updateInstantInput(field, Math.max(min, parseInt(e.target.value, 10) || 0))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              );
              const booleanField = (label, field) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">{label}</label>
                  <select
                    value={facilityInputs[field] ? "yes" : "no"}
                    onChange={(e) => updateInstantInput(field, e.target.value === "yes")}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              );
              const handleResidentialUnitMixChange = (type, rawValue) => {
                const parsed = Math.max(0, parseInt(rawValue, 10) || 0);
                const currentMix = { ...(facilityInputs.unitMix || RESIDENTIAL_DEFAULT_MIX) };
                currentMix[type] = parsed;
                updateInstantInput("unitMix", currentMix);
                const totalUnits = RESIDENTIAL_UNIT_TYPES.reduce((sum, key) => sum + (currentMix[key] || 0), 0);
                updateInstantInput("unitsPerFloor", totalUnits);
              };
              const renderInstantFields = () => {
                if (facilityType === "Residential") {
                  const unitMix = facilityInputs.unitMix || RESIDENTIAL_DEFAULT_MIX;
                  const totalUnitsPerFloor = Math.max(
                    1,
                    RESIDENTIAL_UNIT_TYPES.reduce((sum, type) => sum + (unitMix[type] || 0), 0)
                  );
                  return (
                    <>
                      {numberField("Number of Floors", "floors", 1)}
                      <div className="col-span-full space-y-2">
                        <p className="text-[11px] text-gray-500">
                          How many of each unit type sit on a typical floor? This helps group the hardware intent by usage automatically.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {RESIDENTIAL_UNIT_TYPES.map((type) => (
                            <div key={type} className="flex flex-col gap-1">
                              <label className="text-xs font-bold uppercase text-gray-500">{type} units / floor</label>
                              <input
                                type="number"
                                min={0}
                                value={unitMix[type] ?? 0}
                                onChange={(e) => handleResidentialUnitMixChange(type, e.target.value)}
                                className="w-full p-2 border rounded"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Total units per floor: {totalUnitsPerFloor}
                        </div>
                      </div>
                    </>
                  );
                }
                if (facilityType === "Education / School") {
                  return (
                    <>
                      {numberField("Number of Floors", "floors", 1)}
                      {numberField("Classrooms per Floor", "classroomsPerFloor", 0)}
                      {numberField("Toilets per Floor", "toiletsPerFloor", 0)}
                      {booleanField("Admin / Lab Rooms", "hasAdminLabs")}
                    </>
                  );
                }
                if (facilityType === "Commercial Office") {
                  return (
                    <>
                      {numberField("Number of Floors", "floors", 1)}
                      {booleanField("Open Office Layout", "openLayout")}
                      {numberField("Meeting Rooms per Floor", "meetingRooms", 0)}
                      {booleanField("Service / Back-of-House Areas", "hasServiceAreas")}
                    </>
                  );
                }
                if (facilityType === "Hospital / Healthcare") {
                  return (
                    <>
                      {numberField("Number of Floors", "floors", 1)}
                      {numberField("Patient Rooms per Floor", "patientRoomsPerFloor", 1)}
                      {numberField("Operating Rooms", "operatingRooms", 0)}
                      {numberField("ICU / Isolation Rooms per Floor", "icuRoomsPerFloor", 0)}
                      {booleanField("Emergency Department", "hasEmergencyDept")}
                    </>
                  );
                }
                if (facilityType === "Airport / Transport") {
                  return (
                    <>
                      {numberField("Number of Floors", "floors", 1)}
                      {numberField("Concourses / Wings", "concourses", 1)}
                      {numberField("Gates per Concourse", "gatesPerConcourse", 1)}
                      {numberField("Security Checkpoints", "securityZones", 1)}
                      {booleanField("International / Customs Zone", "hasInternationalZone")}
                    </>
                  );
                }
                if (facilityType === "Hospitality / Hotel") {
                  return (
                    <>
                      {numberField("Number of Floors", "floors", 1)}
                      {numberField("Guest Rooms per Floor", "roomsPerFloor", 1)}
                      {numberField("Suites per Floor", "suitesPerFloor", 0)}
                      {booleanField("Ballroom / Event Spaces", "hasBallroom")}
                      {booleanField("Service / Back-of-House Areas", "hasServiceZones")}
                    </>
                  );
                }
                return (
                  <>
                    {numberField("Number of Floors", "floors", 1)}
                    {numberField("Typical Rooms per Floor", "roomsPerFloor", 0)}
                  </>
                );
              };
              return (
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-slideUp">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings size={24}/> Project Context</h2>
                  <div className="space-y-6">

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase text-gray-600">
                            Project Name <span className="text-xs text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="New Project"
                            value={proj.name}
                            onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, name: e.target.value} : p); setProjects(updated); }}
                            className="p-2.5 border rounded-md placeholder-gray-400"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-xs font-bold uppercase text-gray-600">
                             Facility Type <span className="text-xs text-red-500">*</span>
                           </label>
                          <select value={proj.type} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, type: e.target.value} : p); setProjects(updated); }} className="p-2.5 border rounded-md bg-white">
                              {Object.keys(FACILITY_DATA).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                    </div>

                    {/* Architectural Context */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">Architectural Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">
                                  Client / Owner <span className="text-[9px] text-gray-500">(optional)</span>
                                </label>
                                <input type="text" placeholder="e.g. Acme Corp" value={proj.details?.client || ""} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, details: {...p.details, client: e.target.value}} : p); setProjects(updated); }} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">
                                  Architect <span className="text-[9px] text-gray-500">(optional)</span>
                                </label>
                                <input type="text" placeholder="e.g. Design Studio" value={proj.details?.architect || ""} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, details: {...p.details, architect: e.target.value}} : p); setProjects(updated); }} className="w-full p-2 border rounded" />
                            </div>
                            {userRole !== 'Owner' && (
                              <>
                                  <div>
                                      <label className="text-xs font-bold uppercase text-gray-500">
                                        Hardware Standard <span className="text-xs text-red-500">*</span>
                                      </label>
                                      <select
                                          value={proj.standard}
                                          onChange={(e) => {
                                              const newStd = e.target.value;
                                              let newJurisdiction = proj.details?.jurisdiction;

                                              if (newStd.includes("ANSI")) {
                                                  newJurisdiction = "NFPA 101 (Life Safety Code)";
                                              } else if (newStd.includes("EN")) {
                                                  newJurisdiction = "IBC 2021 (International Building Code)";
                                              }

                                              const updated = projects.map(p =>
                                                  p.id === currentId
                                                  ? { ...p, standard: newStd, details: { ...p.details, jurisdiction: newJurisdiction } }
                                                  : p
                                              );
                                              setProjects(updated);
                                          }}
                                          className="w-full p-2 border rounded bg-white"
                                      >
                                          <option value="ANSI">ANSI / BHMA (US)</option>
                                          <option value="EN">EN / ISO (EU)</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold uppercase text-gray-500">
                                        Code Jurisdiction <span className="text-xs text-red-500">*</span>
                                      </label>
                                      <select value={proj.details?.jurisdiction || "IBC 2021"} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, details: {...p.details, jurisdiction: e.target.value}} : p); setProjects(updated); }} className="w-full p-2 border rounded bg-white">
                                          <option>IBC 2021 (International Building Code)</option>
                                          <option>NFPA 101 (Life Safety Code)</option>
                                          <option>Local / Municipal Code</option>
                                      </select>
                                  </div>
                              </>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-6">
                    <div className="flex flex-col gap-1 mb-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-800">Instant Door Scheduling (Optional)</h3>
                            <p className="text-xs text-gray-500">Would you like us to prep a starter schedule automatically?</p>
                          </div>
                          <div className="flex items-center gap-3 self-start">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                              {instantEnabled ? "Instant scheduling ON" : "Instant scheduling OFF"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={instantEnabled}
                              onClick={() => setInstantSchedulingEnabled(!instantEnabled)}
                              className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${
                                instantEnabled ? "bg-indigo-600" : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                  instantEnabled ? "translate-x-[22px]" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Toggle ON if you'd like to answer a few quick questions and auto-populate a starting door schedule.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`col-span-full text-xs font-bold uppercase tracking-wide rounded px-3 py-2 border ${
                          instantEnabled ? "text-indigo-700 bg-indigo-50 border-indigo-100" : "text-gray-500 bg-gray-50 border-gray-200"
                        }`}>
                          Facility: {facilityType}
                        </div>
                        {instantEnabled ? (
                          renderInstantFields()
                        ) : (
                          <div className="col-span-full text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-4 bg-gray-50">
                            Instant Door Scheduling is currently turned off. Flip the toggle above if you want Instaspec to generate
                            a starter list based on your building inputs.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button onClick={() => handleStepChange(1)} className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2">
                        Save & Continue <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Step 1: Door Schedule */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 animate-slideUp">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold">Door Schedule</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                    <button onClick={() => openDoorModal()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 whitespace-nowrap">
                      <PlusCircle size={18} />
                      <span>Add Door</span>
                    </button>
                    <button
                      onClick={() => {
                        const proj = getProj();
                        if (!proj?.doors.length) {
                          showNotice("Add a door first", "Add at least one door to use bulk assignment.");
                          return;
                        }
                        const firstId = proj.doors[0].id;
                        setBulkModal({ isOpen: true, templateId: firstId, markPrefix: proj.doors[0].mark, locationsText: "" });
                      }}
                      className="flex-1 px-4 py-2 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 font-medium"
                    >
                      Bulk Assign
                    </button>
                    {getProj()?.instantSchedulingEnabled && (
                      <button
                        onClick={handleInstantScheduleClick}
                        className="flex-1 px-4 py-2 border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50 font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                        title="Not sure where to begin? Generate a starter door list based on your building."
                      >
                        <Zap size={18} /> Instant Door Schedule
                      </button>
                    )}
                  </div>
                </div>

                    {getProj().doors.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No doors defined yet.</p>
                        <button onClick={() => openDoorModal()} className="mt-4 text-indigo-600 font-bold hover:underline">Click to add your first door</button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg hardware-scroll">
                        <MainEntranceReminder doors={getProj().doors} />
                        <table className="w-full table-clean min-w-[1000px]">
                      <thead>
                        <tr>
                          <th className="text-left p-3 border-b">Mark</th>
                          <th className="text-left p-3 border-b">Location (Zone - Lvl - Room)</th>
                          <th className="text-left p-3 border-b">Qty</th>
                          <th className="text-left p-3 border-b">WxH (mm)</th>
                          <th className="text-left p-3 border-b">Fire</th>
                          <th className="text-left p-3 border-b">Acoustic</th>
                          <th className="text-left p-3 border-b">Type</th>
                          <th className="text-left p-3 border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getProj().doors.map(d => (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="p-3 border-b font-bold text-indigo-600">{d.mark}</td>
                            <td className="p-3 border-b align-top">
                                <span className="font-semibold text-gray-700">{d.roomName}</span>
                                <div className="text-xs text-gray-400">{d.zone} • Lvl {d.level}</div>
                                <div className="text-[11px] text-indigo-600 font-semibold mt-1 relative">
                                  <button
                                    onClick={() => setActiveLocationsDoorId(activeLocationsDoorId === d.id ? null : d.id)}
                                    className="hover:underline"
                                  >
                                    {activeLocationsDoorId === d.id
                                      ? "Hide locations"
                                      : d.additionalLocations?.length
                                      ? `+${d.additionalLocations.length} more locations`
                                      : "Add additional locations"}
                                  </button>
                                  {activeLocationsDoorId === d.id && (
                                    <div className="mt-2 border border-indigo-200 bg-white rounded-lg shadow-xl p-3 text-xs text-gray-600 space-y-2">
                                      {d.additionalLocations?.length ? (
                                        d.additionalLocations.map((loc, idx) => (
                                          <div key={idx} className="grid grid-cols-[1fr_80px_1fr_auto] gap-2 items-center">
                                            <input
                                              type="text"
                                              value={loc.zone}
                                              onChange={(e) => updateDoorAdditionalLocation(d.id, idx, "zone", e.target.value)}
                                              className="p-1 border rounded"
                                              placeholder="Zone"
                                            />
                                            <input
                                              type="text"
                                              value={loc.level}
                                              onChange={(e) => updateDoorAdditionalLocation(d.id, idx, "level", e.target.value)}
                                              className="p-1 border rounded"
                                              placeholder="Lvl"
                                            />
                                            <input
                                              type="text"
                                              value={loc.roomName}
                                              onChange={(e) => updateDoorAdditionalLocation(d.id, idx, "roomName", e.target.value)}
                                              className="p-1 border rounded"
                                              placeholder="Room"
                                            />
                                            <button
                                              onClick={() => removeDoorAdditionalLocation(d.id, idx)}
                                              className="text-red-500 hover:text-red-700 text-[11px]"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-[11px] text-gray-500">No additional locations yet.</p>
                                      )}
                                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <button
                                          onClick={() => addDoorAdditionalLocation(d.id)}
                                          className="text-indigo-600 hover:underline text-[11px]"
                                        >
                                          + Add Location
                                        </button>
                                        <button
                                          onClick={() => setActiveLocationsDoorId(null)}
                                          className="text-gray-500 hover:text-gray-700 text-[11px]"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                            </td>
                            <td className="p-3 border-b">{d.qty}</td>
                            <td className="p-3 border-b">{d.width} x {d.height}</td>
                            <td className="p-3 border-b"><span className={`px-2 py-0.5 rounded text-xs font-bold ${d.fire > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{d.fire} min</span></td>
                            <td className="p-3 border-b text-sm text-gray-500">
                                {d.stc ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span>{d.stc} dB</span>
                                    {parseInt(d.stc, 10) >= ACOUSTIC_THRESHOLD && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">STC Package</span>
                                    )}
                                  </div>
                                ) : (
                                  '-'
                                )}
                            </td>
                            <td className="p-3 border-b text-sm">
                                <div className="flex flex-col gap-0.5">
                                  <span>{d.material} / {d.config}</span>
                                  {d.ada && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold w-fit">
                                      <Accessibility size={12}/> ADA
                                    </span>
                                  )}
                                </div>
                            </td>
                            <td className="p-3 border-b">
                              <div className="flex gap-1">
                                <button onClick={() => duplicateDoor(d.id)} className="p-2 hover:bg-gray-100 rounded text-gray-500" title="Bulk Duplicate"><Copy size={16} /></button>
                                <button onClick={() => openDoorModal(d)} className="p-2 hover:bg-gray-100 rounded text-gray-500" title="Edit"><Pencil size={16} /></button>
                                <button onClick={() => deleteDoor(d.id)} className="p-2 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => handleStepChange(0)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button onClick={generateHardwareSets} className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2">
                    Generate Hardware Sets <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Hardware */}
            {step === 2 && (
              <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[700px] animate-slideUp">
                {/* Sidebar */}
                <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shrink-0 h-48 lg:h-auto">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 font-bold text-gray-500 uppercase text-xs tracking-wider">Hardware Sets</div>
                  {/* Feature 5: Library Access in Sidebar */}
                  {library.length > 0 && userRole !== 'Owner' && (
                      <div className="p-2 bg-indigo-50 border-b border-indigo-100">
                          <div className="text-xs font-bold text-indigo-700 mb-1 px-2">Library Templates</div>
                          {library.map(l => (
                              <button key={l.id} onClick={() => loadSetFromLibrary(l)} className="w-full text-left text-xs px-2 py-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-100 rounded">
                                  + {l.name}
                              </button>
                          ))}
                      </div>
                  )}
                  <div className="overflow-y-auto flex-1">
                    {getProj().sets.map(s => (
                      <div key={s.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group">
                        <div className="font-bold text-gray-900">{s.id}</div>
                        <div className="text-sm text-gray-500 truncate">{s.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-h-[500px]">
                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {getProj().sets.map(s => {
                        const repDoor = getProj().doors.find(d => s.doors.includes(d.id));
                        const doorsInSet = getProj().doors.filter(d => s.doors.includes(d.id));
                        const isGlassOnlySet = doorsInSet.length > 0 && doorsInSet.every(d => d.material === 'Glass');
                        const setMaterials = Array.from(new Set(doorsInSet.map(d => d.material)));
                        const setProfile = buildSetProfile(doorsInSet);
                        const previewDoor = repDoor || createPreviewDoorFromSet(s, setProfile);
                        const setHandles = s.items.filter((i) => i.category === "Handles");
                        const hasGlassLeverHandle = setHandles.some((h) => (h.type || '').toLowerCase().includes('lever'));
                        const requiresGlassLeverCenter = isGlassOnlySet && hasGlassLeverHandle;
                        const requiresGlassPanicHandle = isGlassOnlySet && setProfile.requiresPanic;
                        const validationWarnings = getSetWarnings(s, setProfile);
                        return (
                      <div key={s.id} className="mb-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                          <h2 className="text-xl font-bold">{s.id}: {s.name}</h2>
                          <div className="flex gap-2">
                            {userRole !== 'Owner' && (
                                <button onClick={() => saveSetToLibrary(s)} className="text-xs flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100" title="Save to Library">
                                    <Library size={12}/> Save Template
                                </button>
                            )}
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">{getProj().doors.filter(d => s.doors.includes(d.id)).length} Doors</span>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Feature 3: Visual Preview in Hardware Set */}
                            <div className="shrink-0">
                                <DoorPreview door={previewDoor} hardwareSet={s} />
                            </div>

                            <div className="flex-1">
                                {/* Table Container */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 overflow-x-auto hardware-scroll">
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-[40px_80px_80px_160px_160px_120px_1.2fr_140px_80px_50px] bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-bold text-gray-500 uppercase gap-3">
                                    <div></div><div>Ref</div><div>CSI</div><div>Product Type</div><div>Style</div><div>Finish</div><div>Specification</div><div>Acoustic</div><div>Qty</div><div></div>
                                    </div>
                                    {/* Feature 4: Categorized Hardware List */}
                                    {Object.keys(BHMA_CATEGORIES).map(catGroup => {
                                        const groupItems = s.items.filter(i => BHMA_CATEGORIES[catGroup].includes(i.category));
                                        if (groupItems.length === 0) return null;
                                        
                                        return (
                                            <React.Fragment key={catGroup}>
                                                <div className="bg-gray-100 p-1 pl-2 font-bold text-xs text-gray-500 uppercase border-b border-gray-200 col-span-full" style={{ gridColumn: "1 / -1" }}>
                                                    {getBHMACategory(groupItems[0].category)}
                                                </div>
                                                {groupItems.map((item, idx) => {
                                                    // Find original index in s.items for update logic
                                                    const originalIndex = s.items.indexOf(item);
                                                    const cat = item.category || "Hinges";
                                                    const catData = PRODUCT_CATALOG[cat];
                                                    const baseFinishes = FINISHES[getProj().standard];
                                                    let typeOptions = catData?.types || [];
                                                    const isCardReaderRow = item.autoTag === "card-reader-kit";
                                                    const signalKey = `${s.id}-${originalIndex}`;
                                                    const warningActive = Boolean(lockResetSignals[signalKey]);
                                                    let compatibilityMessage = warningActive ? "Lock type reset: previous lock not compatible with selected material." : null;
                                                    if (cat === 'Hinges') {
                                                        if (isGlassOnlySet) typeOptions = typeOptions.filter(t => t.name === 'Patch Fitting');
                                                        else typeOptions = typeOptions.filter(t => t.name !== 'Patch Fitting');
                                                    }
                                                    let effectiveType = item.type;
                                                    if (cat === 'Hinges' && userRole !== 'Owner') {
                                                        if (isGlassOnlySet && effectiveType !== 'Patch Fitting') {
                                                            const desired = 'Patch Fitting';
                                                            if (typeOptions.some(t => t.name === desired)) {
                                                                setTimeout(() => updateSetItem(s.id, originalIndex, 'type', desired), 0);
                                                                effectiveType = desired;
                                                            }
                                                        } else if (!isGlassOnlySet && effectiveType === 'Patch Fitting') {
                                                            const fallback = typeOptions[0]?.name;
                                                                if (fallback && fallback !== effectiveType) {
                                                                    setTimeout(() => updateSetItem(s.id, originalIndex, 'type', fallback), 0);
                                                                    effectiveType = fallback;
                                                                }
                                                            }
                                                    }
                                                    if (cat === 'Locks') {
                                                        let allowed = getAllowedLockTypesForMaterials(setProfile.materials);
                                                        if (setProfile.requiresPanic) {
                                                            allowed = isGlassOnlySet ? ["Patch Lock"] : ["Panic Bar"];
                                                        } else if (setProfile.isEscapeRoute) {
                                                            allowed = allowed.filter(name => !name.toLowerCase().includes('deadbolt'));
                                                        }
                                                        if (!allowed.length) {
                                                            allowed = typeOptions.map((t) => t.name);
                                                        }
                                                        typeOptions = typeOptions.filter(t => allowed.includes(t.name));
                                                        if (!typeOptions.some(t => t.name === effectiveType) && typeOptions.length > 0) {
                                                            const fallback = typeOptions[0].name;
                                                            setTimeout(() => {
                                                                updateSetItem(s.id, originalIndex, 'type', fallback);
                                                                triggerLockResetSignal(signalKey);
                                                                setCompatibilityAlert({
                                                                  title: "Lock type reset",
                                                                  message:
                                                                    "The previously selected lock wasn't compatible with this door material, so the type was updated."
                                                                });
                                                            }, 0);
                                                            effectiveType = fallback;
                                                            compatibilityMessage = "Lock type reset: previous lock not compatible with selected material/use.";
                                                        }
                                                        if (requiresGlassLeverCenter) {
                                                            const desiredType = 'Patch Lock';
                                                            const desiredStyle = 'Center Patch Lock';
                                                            if (effectiveType !== desiredType && typeOptions.some(t => t.name === desiredType)) {
                                                                setTimeout(() => updateSetItem(s.id, originalIndex, 'type', desiredType), 0);
                                                                effectiveType = desiredType;
                                                            }
                                                            if ((item.style || '') !== desiredStyle) {
                                                                setTimeout(() => updateSetItem(s.id, originalIndex, 'style', desiredStyle), 0);
                                                            }
                                                            if (!compatibilityMessage) {
                                                                compatibilityMessage = "Glass lever handles require a center patch lock with lever prep.";
                                                            }
                                                        }
                                                    }
                                                    if (cat === 'Electrified') {
                                                        let allowedElectrified = getAllowedElectrifiedTypesForMaterials(setProfile.materials);
                                                        const allowedNames = new Set([...allowedElectrified, ...ELECTRIFIED_AUX_TYPES]);
                                                        typeOptions = typeOptions.filter((t) => allowedNames.has(t.name));
                                                        if (!typeOptions.some((t) => t.name === effectiveType) && typeOptions.length > 0) {
                                                            const fallback = typeOptions[0].name;
                                                            setTimeout(() => {
                                                                updateSetItem(s.id, originalIndex, 'type', fallback);
                                                                triggerLockResetSignal(signalKey);
                                                            }, 0);
                                                            effectiveType = fallback;
                                                            compatibilityMessage = "Electrified option reset for compliance.";
                                                        }
                                                        const existingElectrifiedTypes = new Set(
                                                            s.items
                                                                .filter((existingItem) => existingItem.category === "Electrified" && existingItem !== item)
                                                                .map((existingItem) => existingItem.type)
                                                        );
                                                        const uniqueLockTypes = new Set(["Magnetic Lock", "Electric Strike"]);
                                                        typeOptions = typeOptions.filter((t) => {
                                                            if (
                                                                uniqueLockTypes.has(t.name) &&
                                                                existingElectrifiedTypes.has(t.name) &&
                                                                t.name !== effectiveType
                                                            ) {
                                                                return false;
                                                            }
                                                            return true;
                                                        });
                                                        if (isCardReaderRow) {
                                                            const cardReaderOnly = ["Card Reader", "Push Button"];
                                                            typeOptions = typeOptions.filter((t) => cardReaderOnly.includes(t.name));
                                                        }
                                                    }
                                                    if (cat === 'Handles' && requiresGlassPanicHandle) {
                                                        const desiredHandle = 'Panic Push Pull Handle';
                                                        if (effectiveType !== desiredHandle && typeOptions.some(t => t.name === desiredHandle)) {
                                                            setTimeout(() => updateSetItem(s.id, originalIndex, 'type', desiredHandle), 0);
                                                            effectiveType = desiredHandle;
                                                        }
                                                        if (!compatibilityMessage) {
                                                            compatibilityMessage = "Glass escape routes require L-shaped panic push/pull hardware.";
                                                        }
                                                    }
                                                    const stylesAll = (catData?.types.find(t => t.name === effectiveType) || { styles: [] }).styles || [];
                                                    let styles = stylesAll;
                                                    if (cat === 'Electrified' && setProfile.requiresFailSafe) {
                                                        const filteredStyles = stylesAll.filter(st => st.toLowerCase().includes('fail-safe') || st.toLowerCase().includes('rex'));
                                                        if (filteredStyles.length > 0) styles = filteredStyles;
                                                    }

                                                    return (
                                                        <div key={idx} className="grid grid-cols-[40px_80px_80px_160px_160px_120px_1.2fr_140px_80px_50px] border-b border-gray-100 px-4 py-2 items-center gap-3 hover:bg-gray-50 relative">
                                                            <div className="flex justify-center text-gray-400"><HardwareIcon category={cat} /></div>
                                                            {/* Owner View: Read Only */}
                                                            {userRole === 'Owner' ? (
                                                                <>
                                                                    <div className="text-sm font-medium text-gray-900">{item.ref}</div>
                                                                    <div className="text-xs text-gray-400">{catData?.csi || ""}</div>
                                                                    <div className="text-sm text-gray-600">{effectiveType}</div>
                                                                    <div className="text-sm text-gray-600">{item.style}</div>
                                                                    <div className="text-sm text-gray-600">{item.finish}</div>
                                                                    <div className="text-sm text-gray-500">{item.spec}</div>
                                                                    <div className="text-xs text-gray-600">{item.acousticContribution || ""}</div>
                                                                    <div className="text-sm text-gray-900">{item.qty}</div>
                                                                    <div></div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <input type="text" value={item.ref} onChange={(e) => updateSetItem(s.id, originalIndex, 'ref', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                                    <div className="text-xs text-gray-400">{catData?.csi || ""}</div>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <select value={effectiveType} onChange={(e) => updateSetItem(s.id, originalIndex, 'type', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                                            {typeOptions.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                                                        </select>
                                                                        {(cat === 'Locks' || cat === 'Electrified') && compatibilityMessage && (
                                                                            <span className="text-[10px] text-orange-600">{compatibilityMessage}</span>
                                                                        )}
                                                                    </div>
                                                                    <select value={item.style} onChange={(e) => updateSetItem(s.id, originalIndex, 'style', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                                        {styles.map(st => <option key={st} value={st}>{st}</option>)}
                                                                    </select>
                                                                    <select value={item.finish} onChange={(e) => updateSetItem(s.id, originalIndex, 'finish', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                                        {(getCategoryFinishList(cat, getProj().standard) || baseFinishes).map(f => (
                                                                            <option key={f} value={f}>{f}</option>
                                                                        ))}
                                                                    </select>
                                                                    <input type="text" value={item.spec} onChange={(e) => updateSetItem(s.id, originalIndex, 'spec', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                                    <div className="flex justify-start">
                                                                        {item.acousticContribution ? (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">{item.acousticContribution}</span>
                                                                        ) : (
                                                                            <span className="text-gray-300 text-[10px]">-</span>
                                                                        )}
                                                                    </div>
                                                                    <input type="text" value={item.qty} onChange={(e) => updateSetItem(s.id, originalIndex, 'qty', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                                    <button onClick={() => deleteSetItem(s.id, originalIndex)} className="text-red-400 hover:text-red-600 flex justify-center p-2"><Trash2 size={14}/></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Fallback for uncategorized items */}
                                    {s.items.filter(i => !Object.keys(BHMA_CATEGORIES).some(k => BHMA_CATEGORIES[k].includes(i.category))).map((item, idx) => (
                                        <div key={'other-'+idx} className="grid grid-cols-[30px_60px_60px_140px_140px_100px_1fr_120px_60px_40px] border-b border-gray-100 p-2 items-center hover:bg-gray-50 relative">
                                            <div className="flex justify-center text-gray-400"><HardwareIcon category={item.category} /></div>
                                            <input type="text" value={item.ref} className="w-full p-1 border rounded text-xs" disabled />
                                            <div className="text-xs text-gray-400"></div>
                                            <div className="text-sm text-gray-600">{item.type}</div>
                                            <div className="text-sm text-gray-600">{item.style}</div>
                                            <div className="text-sm text-gray-600">{item.finish}</div>
                                            <div className="text-sm text-gray-500">{item.spec}</div>
                                            <div className="text-xs text-gray-600">{item.acousticContribution || ""}</div>
                                            <div className="text-sm text-gray-900">{item.qty}</div>
                                        </div>
                                    ))}
                                </div>
                                </div>
                                
                                {userRole !== 'Owner' && (
                                    <button onClick={() => handleAddItemClick(s.id)} className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1 mb-4 px-2 py-1">
                                    <PlusCircle size={14}/> Add Item
                                    </button>
                                )}

                                {validationWarnings.length > 0 && (
                                    <div className="mt-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
                                        {validationWarnings.map((w, idx) => (
                                            <div key={idx}>⚠ {w}</div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Operational Description</label>
                                <textarea 
                                    value={s.operation} 
                                    readOnly={userRole === 'Owner'}
                                    onChange={(e) => {
                                    const updated = projects.map(p => p.id === currentId ? {...p, sets: p.sets.map(set => set.id === s.id ? {...set, operation: e.target.value} : set)} : p);
                                    setProjects(updated);
                                    }}
                                    rows={2} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
                                />
                                </div>
                            </div>
                        </div>
                      </div>
                    );})}
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                    <button onClick={() => handleStepChange(1)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-2">
                      <ArrowLeft size={16}/> Back
                    </button>
                    <button onClick={handleFinishReview} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 font-medium">
                      Finish & Review <ArrowRight size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-slideUp">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <h2 className="text-2xl font-bold">Specification Review</h2>
                  <div className="w-full md:w-auto flex flex-col gap-3">
                    <div className="hidden md:flex gap-3">
                      {userRole !== "Owner" && (
                        <button
                          onClick={() => handleDownloadWithLimit(exportBIMData)}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-bold flex items-center justify-center gap-2 shadow-sm text-sm"
                        >
                          <Box size={18} /> Export BIM Data
                        </button>
                      )}
                      <button
                        onClick={openPrintPreview}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center justify-center gap-2 shadow-sm text-sm"
                      >
                        <FileText size={18} /> Print Spec Sheet
                      </button>
                      <button
                        onClick={() => handleDownloadWithLimit(exportData)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 shadow-sm"
                      >
                        <FileSpreadsheet size={18} /> Export Schedule
                      </button>
                      {user && (
                        <button
                          onClick={() => setIsReportFeedbackOpen(true)}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold flex items-center justify-center gap-2 shadow-sm text-sm"
                        >
                          <AlertCircle size={18} /> Report an Error
                        </button>
                      )}
                    </div>
                    <div className="md:hidden">
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsMobileDownloadOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-gray-700 bg-white"
                        >
                          <span>Download Files</span>
                          <ChevronDown
                            size={18}
                            className={`transition-transform ${isMobileDownloadOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isMobileDownloadOpen && (
                          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
                            {userRole !== "Owner" && (
                              <button
                                onClick={() => {
                                  handleDownloadWithLimit(exportBIMData);
                                  setIsMobileDownloadOpen(false);
                                }}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                              >
                                <Box size={16} /> Export BIM Data
                              </button>
                            )}
                            <button
                              onClick={() => {
                                openPrintPreview();
                                setIsMobileDownloadOpen(false);
                              }}
                              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                            >
                              <FileText size={16} /> Print Spec Sheet
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadWithLimit(exportData);
                                setIsMobileDownloadOpen(false);
                              }}
                              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                            >
                              <FileSpreadsheet size={16} /> Export Schedule
                            </button>
                          </div>
                        )}
                      </div>
                      {user && (
                        <button
                          onClick={() => setIsReportFeedbackOpen(true)}
                          className="w-full mt-3 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold flex items-center justify-center gap-2 shadow-sm text-sm"
                        >
                          <AlertCircle size={18} /> Report an Error
                        </button>
                      )}
                    </div>
                    {!isAdmin && user && (
                      <div className="text-xs text-gray-500">
                        Downloads used: {downloadCount ?? 0} / {DOWNLOAD_LIMIT}
                      </div>
                    )}
                    {downloadWarning && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        {downloadWarning}
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Report */}
                {getValidationIssues().length > 0 ? (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2"><AlertTriangle size={20}/> Code Compliance Warnings</h3>
                        <div className="space-y-2">
                            {getValidationIssues().map((issue, idx) => (
                                <div key={idx} className="flex gap-2 text-sm text-red-800 items-start">
                                    <span className="font-bold shrink-0">[{issue.set}]</span>
                                    <span>{issue.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800">
                        <Check size={24} />
                        <div>
                            <div className="font-bold">Code Compliance Verified</div>
                            <div className="text-sm">All fire and egress logic checks passed.</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Doors</div>
                    <div className="text-3xl font-bold text-gray-900">{getProj().doors.length}</div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Hardware Sets</div>
                    <div className="text-3xl font-bold text-indigo-600">{getProj().sets.length}</div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Jurisdiction</div>
                    <div className="text-lg font-bold text-gray-800">{getProj().details?.jurisdiction || "Standard"}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {view === 'wizard' && (
        <footer className="bg-slate-900/95 text-white px-4 md:px-8 py-8 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="w-full max-w-4xl mx-auto">
              <div className="hidden md:flex gap-3 justify-center items-stretch">
                {HERO_STATS.map((stat) => (
                  <div
                    key={`wizard-stat-desktop-${stat.id}`}
                    className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center"
                  >
                    <div className="text-lg font-extrabold tracking-tight">{Number(stat.value).toLocaleString()}</div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/60">{stat.metric}</div>
                  </div>
                ))}
              </div>
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-3">
                  {HERO_STATS.slice(0, 6).map((stat) => (
                    <div
                      key={`wizard-stat-mobile-${stat.id}`}
                      className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-h-[90px]"
                    >
                      <div className="text-xl font-extrabold tracking-tight">{Number(stat.value).toLocaleString()}</div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-white/60">{stat.metric}</div>
                    </div>
                  ))}
                </div>
                {HERO_STATS[6] && (
                  <div className="mt-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-xl font-extrabold tracking-tight">
                      {Number(HERO_STATS[6].value).toLocaleString()}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/60">
                      {HERO_STATS[6].metric}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center text-xs text-white/60">
              Engineered with care by{" "}
              <a
                href="https://techarix.com"
                target="_blank"
                rel="noreferrer"
                className="text-white font-semibold underline underline-offset-2 decoration-white/40 hover:text-sky-300"
              >
                Techarix
              </a>
            </div>
          </div>
        </footer>
      )}

      {view === 'dashboard' && (
        <footer className="bg-slate-900 text-white border-t border-gray-200 px-4 md:px-8 py-10">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <h3 className="font-bold text-white/70 uppercase text-sm mb-4 tracking-[0.3em]">Coming Soon Features</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 p-6 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/80 bg-white/5 shadow-inner">
                <UploadCloud size={24} className="mb-2 text-sky-300" />
                <span className="font-bold">Upload Floor Plan</span>
                <span className="text-xs text-white/60">AI Extraction</span>
              </div>
              <div className="flex-1 p-6 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/80 bg-white/5 shadow-inner">
                <Wand2 size={24} className="mb-2 text-indigo-300" />
                <span className="font-bold">Instant Schedule</span>
                <span className="text-xs text-white/60">One-click Generation</span>
              </div>
            </div>
            <div className="text-center text-xs text-white/60">
              Engineered with care by{" "}
              <a
                href="https://techarix.com"
                target="_blank"
                rel="noreferrer"
                className="text-white font-semibold underline underline-offset-2 decoration-white/40 hover:text-sky-300"
              >
                Techarix
              </a>
            </div>
          </div>
        </footer>
      )}

      {/* Door Modal Overlay */}
      {isDoorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">Edit Door</h3>
              <button onClick={() => setIsDoorModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={24}/></button>
            </div>
            <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Hierarchical Location */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Architectural Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Zone / Building</label>
                        <input type="text" value={doorForm.zone} onChange={e => setDoorForm({...doorForm, zone: e.target.value})} className="p-2 border rounded" placeholder="e.g. Tower A" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Level / Floor</label>
                        <input type="text" value={doorForm.level} onChange={e => setDoorForm({...doorForm, level: e.target.value})} className="p-2 border rounded" placeholder="e.g. 01" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Room Name</label>
                        <SearchableDropdown
                            options={FACILITY_DATA[getProj().type]?.usages || []}
                            value={doorForm.roomName}
                            onChange={(val) => setDoorForm({...doorForm, roomName: val, use: val || doorForm.use})}
                            placeholder="Select or type..."
                        />
                    </div>
                  </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Additional Locations</label>
                <p className="text-xs text-gray-500">
                  Manage locations directly from the door schedule by expanding the “+N more locations” dropdown.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Door Mark / ID</label>
                  <input type="text" value={doorForm.mark} onChange={e => setDoorForm({...doorForm, mark: e.target.value})} className="p-2.5 border rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Qty</label>
                  <input type="number" value={1 + (doorForm.additionalLocations?.length || 0)} readOnly className="p-2.5 border rounded bg-gray-100 text-gray-500" />
                  <span className="text-[10px] text-gray-500">Calculated from location list</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs font-bold uppercase text-gray-400 mb-4">Dimensions & Performance</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Width (mm)</label>
                    <input type="number" value={doorForm.width} onChange={e => {setDoorForm({...doorForm, width: e.target.value}); validatePhysics('width', e.target.value);}} className={`w-full p-2.5 border rounded ${doorErrors.width ? 'border-red-300 bg-red-50' : ''}`} />
                    {doorErrors.width && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {doorErrors.width}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Height (mm)</label>
                    <input type="number" value={doorForm.height} onChange={e => {setDoorForm({...doorForm, height: e.target.value}); validatePhysics('height', e.target.value);}} className={`w-full p-2.5 border rounded ${doorErrors.height ? 'border-red-300 bg-red-50' : ''}`} />
                    {doorErrors.height && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {doorErrors.height}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Thickness (mm)</label>
        <input
          type="number"
          value={doorForm.thickness}
          onChange={e => setDoorForm({...doorForm, thickness: parseInt(e.target.value) || 0, thicknessAuto: false})}
          className="w-full p-2.5 border rounded"
        />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Weight (kg) - Auto</label>
                    <div className="relative">
        <input
          type="number"
          value={doorForm.weight}
          onChange={e => {setDoorForm({...doorForm, weight: parseInt(e.target.value) || 0, weightAuto: false});}}
          className="w-full p-2.5 border rounded"
        />
                        <Scale size={14} className="absolute right-3 top-3.5 text-gray-400" />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Estimated weight; verify with manufacturer</div>
                  </div>
                </div>
                {showAdaWarning && (
                  <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <div>
                      <div className="font-semibold">ADA Clearance Warning</div>
                      <div>{adaWarningMessage}</div>
                      <div className="text-[11px] text-amber-700 mt-1">Clear opening assumes {ADA_CLEARANCE_DEDUCTION_MM}mm deduction for hinges/handles.</div>
                    </div>
                  </div>
                )}
                {doorHint && <div className="mt-2 text-orange-600 text-sm bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2"><AlertTriangle size={14}/> {doorHint}</div>}
              </div>

              {/* Acoustic & ADA Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t pt-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Acoustic Rating (STC/dB)</label>
                    <div className="flex items-center gap-2">
                        <Volume2 size={16} className="text-gray-400" />
                        <input type="number" value={doorForm.stc} onChange={e => setDoorForm({...doorForm, stc: e.target.value})} className="w-full p-2.5 border rounded" placeholder="35"/>
                    </div>
                    <div className="text-[10px] text-indigo-600 mt-1">Recommended for {doorForm.roomName || "Selected Room"}: {ACOUSTIC_RECOMMENDATIONS[doorForm.roomName] || 30} dB</div>
                  </div>
                  <div className="flex items-center pt-6">
                      <div onClick={() => setDoorForm({...doorForm, ada: !doorForm.ada})} className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-5 h-5 border rounded flex items-center justify-center ${doorForm.ada ? 'bg-blue-600 border-blue-600 text-white' : ''}`}>
                              {doorForm.ada && <Check size={14}/>}
                          </div>
                          <span className="text-sm font-bold text-blue-700 flex items-center gap-1"><Accessibility size={16}/> ADA Compliant</span>
                      </div>
                  </div>
              </div>

              {/* Handing Selector */}
              <div className="mt-4 border-t pt-4">
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Door Handing ({getProj().standard} / Standard)</label>
                  <HandingSelector 
                      value={doorForm.handing}
                      standard={getProj().standard} // Pass Standard
                      onChange={(h) => setDoorForm({...doorForm, handing: h})}
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Material</label>
                  <select value={doorForm.material} onChange={e => setDoorForm({...doorForm, material: e.target.value})} className="w-full p-2.5 border rounded bg-white">
                    <option value="Timber">Timber / Wood</option>
                    <option value="Metal">Hollow Metal</option>
                    <option value="Glass">Glass</option>
                    <option value="Aluminum">Aluminum</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Configuration</label>
                  <div className="flex gap-2">
                    <div onClick={() => setDoorForm({...doorForm, config: 'Single'})} className={`flex-1 border rounded p-2 flex flex-col items-center gap-1 cursor-pointer ${doorForm.config === 'Single' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600' : 'hover:bg-gray-50'}`}>
                      <DoorClosed size={20}/> <span className="text-sm">Single</span>
                    </div>
                    <div onClick={() => setDoorForm({...doorForm, config: 'Double'})} className={`flex-1 border rounded p-2 flex flex-col items-center gap-1 cursor-pointer ${doorForm.config === 'Double' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600' : 'hover:bg-gray-50'}`}>
                      <DoorOpen size={20}/> <span className="text-sm">Double</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vision Panel Toggle (Feature 2 & 3 Support) */}
              <div className="flex items-center gap-2 mt-2">
                 <div 
                    onClick={() => doorForm.material !== 'Glass' && setDoorForm({...doorForm, visionPanel: !doorForm.visionPanel})} 
                    className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${doorForm.visionPanel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white'} ${doorForm.material === 'Glass' ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                 >
                     {doorForm.visionPanel && <Check size={14}/>}
                 </div>
                 <label className={`text-sm font-medium cursor-pointer ${doorForm.material === 'Glass' ? 'text-gray-400' : 'text-gray-700'}`} onClick={() => doorForm.material !== 'Glass' && setDoorForm({...doorForm, visionPanel: !doorForm.visionPanel})}>
                    {doorForm.material === 'Glass' ? 'Vision Panel N/A for Glass Doors' : 'Include Vision Panel / Glazing'}
                 </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Fire Rating</label>
                  <select value={doorForm.fire} onChange={e => setDoorForm({...doorForm, fire: parseInt(e.target.value)})} className="w-full p-2.5 border rounded bg-white">
                    {getProj().standard === 'ANSI'
                      ? <><option value="0">Non-Rated</option><option value="20">20 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="180">3 Hour</option></>
                      : <><option value="0">None</option><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></>
                    }
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Usage Type</label>
                  <select value={doorForm.use} onChange={e => setDoorForm({...doorForm, use: e.target.value})} className="w-full p-2.5 border rounded bg-white">
                    {FACILITY_DATA[getProj().type]?.usages.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {isMainEntranceUsage(doorForm.use) && Number(doorForm.fire) === 0 && (
                <div className="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 flex items-center gap-2">
                  <DoorOpen size={14} />
                  {MAIN_ENTRANCE_NOTE}
                </div>
              )}

              {doorForm.config === 'Double' && (
                <div className="text-[11px] text-gray-500">
                  {doorForm.fire > 0
                    ? "Fire-rated pairs default to rebated meeting stiles per EN 1634 / ANSI UL10C."
                    : "Non-rated pairs use a flush meeting stile between leaves."}
                </div>
              )}

              {complianceNote && (
                <div className={`mt-4 p-3 rounded-lg border flex gap-3 items-start ${complianceNote.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                  {complianceNote.type === 'warning' ? (
                    <Flame size={18} className="shrink-0 mt-0.5" />
                  ) : (
                    <Wind size={18} className="shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm leading-relaxed">
                    <strong>Code Check:</strong> {complianceNote.msg}
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4 bg-white mt-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Hardware Control Strategy</label>
                    <p className="text-xs text-gray-500">
                      Based on <span className="font-semibold">{doorForm.use || doorForm.roomName || 'this use'}</span> we recommend a{" "}
                      <span className="font-semibold text-indigo-600">{recommendedIntent}</span> package.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">ANSI / EN Guidance</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {HARDWARE_PACKAGE_OPTIONS.map((opt) => {
                    const isActive = doorForm.hardwareIntent === opt.id;
                    const isRecommended = recommendedIntent === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setDoorForm({ ...doorForm, hardwareIntent: opt.id })}
                        className={`text-left border rounded-lg p-3 transition-all ${
                          isActive ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold mb-1">
                          <span className={isActive ? 'text-indigo-700' : 'text-gray-800'}>{opt.label}</span>
                          {isRecommended && (
                            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Recommended</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-3">
                  Electromechanical openings pair ANSI/BHMA A156-grade locks with electric strikes or maglocks, REX sensors, and fail-safe release per EN 1125 / NFPA 101.
                </p>
                {doorForm.hardwareIntent !== recommendedIntent && (
                  <div className="mt-2 text-[11px] text-orange-600">
                    You selected a {doorForm.hardwareIntent} package even though the usage leans {recommendedIntent}. Confirm this is intentional for the project scope.
                  </div>
                )}
              </div>

              {/* Documentation Notes */}
              <div className="mt-4">
                  <label className="text-xs font-bold uppercase text-gray-500">Spec Notes / Remarks</label>
                  <textarea 
                    value={doorForm.notes} 
                    onChange={e => setDoorForm({...doorForm, notes: e.target.value})}
                    className="w-full p-2 border rounded h-20 text-sm"
                    placeholder="Enter specific installation notes or requirements..."
                  />
              </div>

            </div>
            <div className="p-4 md:p-6 border-t border-gray-100 flex justify-end shrink-0 bg-gray-50 rounded-b-xl">
              <button onClick={saveDoor} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">Save Door</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addItemModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
              <h3 className="text-lg font-bold">Add Hardware Item</h3>
              <button
                type="button"
                onClick={() => setAddItemModal({ isOpen: false, setId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-hidden flex-1 flex flex-col">
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-6 flex gap-3 items-start">
                <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-orange-800 leading-relaxed">
                  <strong>Code Compliance Warning:</strong> Adding manual items may affect the fire rating.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-500 mb-4">
                  Choose a category below
                </p>
                <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2">
                  {HARDWARE_GROUP_COLUMNS.map((group) => (
                    <div key={group.id} className="flex flex-col h-full rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-[10px] uppercase tracking-[0.4em] text-gray-400">{group.label}</div>
                        <p className="text-sm font-semibold text-gray-900">{group.description}</p>
                      </div>
                      <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
                        {group.items.length === 0 ? (
                          <p className="text-xs text-gray-500">No entries yet.</p>
                        ) : (
                          group.items.map((item) => (
                            <button
                              key={`${item.category}-${item.name}`}
                              type="button"
                              onClick={() => addNewItem(item.category, item.name)}
                              className="w-full text-left rounded-2xl border border-gray-100 px-3 py-2 transition hover:border-indigo-200 hover:bg-indigo-50"
                            >
                              <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                              <div className="text-[11px] text-gray-500">{item.description || "Layman-friendly details"}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-1">{item.csi}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {compatibilityAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-gray-900 relative">
            <button
              type="button"
              onClick={() => setCompatibilityAlert(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h4 className="text-lg font-bold mb-2">{compatibilityAlert.title || "Notice"}</h4>
            <p className="text-sm text-gray-600 mb-4">{compatibilityAlert.message}</p>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setCompatibilityAlert(null)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold">Bulk Assign Door Specification</h3>
              <button onClick={() => setBulkModal({ isOpen: false, templateId: "", markPrefix: "", locationsText: "" })} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-gray-600">Select a template door and provide locations (zone | level | room) to replicate its specification.</p>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Template Door</label>
                <select value={bulkModal.templateId} onChange={(e) => {
                  const template = getProj().doors.find(d => d.id === e.target.value);
                  setBulkModal(prev => ({
                    ...prev,
                    templateId: e.target.value,
                    markPrefix: template?.mark || prev.markPrefix
                  }));
                }} className="w-full p-2 border rounded bg-white">
                  {getProj().doors.map(d => <option key={d.id} value={d.id}>{d.mark} - {d.roomName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Mark Prefix</label>
                <input type="text" value={bulkModal.markPrefix} onChange={(e) => setBulkModal(prev => ({ ...prev, markPrefix: e.target.value }))} className="w-full p-2 border rounded" placeholder="e.g. D-100" />
                <p className="text-[11px] text-gray-400 mt-1">Unique marks will be generated from this prefix.</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">Locations</label>
                <textarea value={bulkModal.locationsText} onChange={(e) => setBulkModal(prev => ({ ...prev, locationsText: e.target.value }))} className="w-full p-2 border rounded h-32" placeholder="Tower A | Lvl 02 | Meeting Room&#10;Tower B | Lvl 05 | Boardroom" />
                <p className="text-[11px] text-gray-500 mt-1">Provide one location per line using "Zone | Level | Room" format. Leave a part blank to reuse the template value.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setBulkModal({ isOpen: false, templateId: "", markPrefix: "", locationsText: "" })} className="px-4 py-2 text-sm border rounded">Cancel</button>
                <button
                  onClick={() => handleBulkCreate()}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create Doors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {instantDoorModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold">Instant Door Schedule Preview</h3>
                <p className="text-xs text-gray-500">Review and confirm the generated door list before inserting.</p>
              </div>
              <button onClick={() => setInstantDoorModal({ isOpen: false, doors: [] })} className="text-gray-400 hover:text-gray-600">
                <X size={20}/>
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh]">
              {instantDoorModal.doors.length === 0 ? (
                <div className="text-sm text-gray-500">No doors generated.</div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-2">Mark</th>
                      <th className="text-left p-2">Usage</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Material</th>
                      <th className="text-left p-2">Fire Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instantDoorModal.doors.map((door) => (
                      <tr key={door.id} className="border-b border-gray-100">
                        <td className="p-2 font-semibold text-indigo-600">{door.mark}</td>
                        <td className="p-2">
                          <div className="font-medium text-gray-800">{door.use}</div>
                          <div className="text-xs text-gray-500">{door.roomName}</div>
                        </td>
                        <td className="p-2">{door.qty}</td>
                        <td className="p-2">{door.material}</td>
                        <td className="p-2">{door.fire > 0 ? `${door.fire} min` : "NFR"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-gray-500 mt-4">Need to undo? Simply delete the generated doors from the schedule later.</p>
            </div>
            <div className="p-4 md:p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <button onClick={() => setInstantDoorModal({ isOpen: false, doors: [] })} className="px-4 py-2 text-sm border rounded">Cancel</button>
              <button
                onClick={applyInstantDoorSchedule}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
              >
                Confirm & Insert
              </button>
            </div>
          </div>
        </div>
      )}
      {isAdmin && (
        <BetaAdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
      <BetaFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
      <FeedbackModal
        isOpen={isReportFeedbackOpen}
        onClose={() => setIsReportFeedbackOpen(false)}
      />
      {promptPortal}
    </div>
  );
};

export default App;
