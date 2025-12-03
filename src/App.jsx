import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, PlusCircle, FolderOpen, Trash2, 
  Globe, Building, Save, X, Copy, Pencil, DoorClosed, 
  DoorOpen, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, 
  Brain, Check, AlertTriangle, TreeDeciduous, RectangleHorizontal, 
  Menu, ChevronDown, Search, Info, Flame, Accessibility, RotateCcw,
  Eye, Layers, UserCircle, History, Box, Download, Library, MoveHorizontal,
  Lock, Settings, MousePointer, Power, Printer, FileText, Volume2, Scale,
  BookOpen, UploadCloud, Wand2
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
    "Server / IT": 40, "Guest Room Entry": 35, "Unit Entrance (Fire Rated)": 35, "Restroom": 30
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
  { label: "Door Set Profiles", value: POSSIBLE_DOOR_SET_COMBINATIONS.toLocaleString() },
  { label: "Modeled Use Cases", value: UNIQUE_DOOR_USES.length.toString() },
  { label: "Export Formats", value: "BIM • PDF • XLSX" },
  { label: "Door Materials", value: DOOR_MATERIALS.length.toString() },
  { label: "Handing Options", value: HANDING_OPTIONS.length.toString() },
  { label: "Facility Programs", value: Object.keys(FACILITY_DATA).length.toString() }
];
const REVIEW_NOTICE =
  "Notice: All auto-generated door hardware content must be reviewed and approved by a qualified subject-matter expert before it is shared or issued. Proceed only if you acknowledge this requirement.";

// BHMA Categorization Helper
const BHMA_CATEGORIES = {
    "Hanging": ["Hinges"],
    "Securing": ["Locks", "Cylinders", "Accessories", "Electrified"],
    "Controlling": ["Closers", "Stops", "Handles"],
    "Protecting": ["Seals", "Accessories"]
};

const getBHMACategory = (cat) => {
    if (["Hinges"].includes(cat)) return "Hanging the Door";
    if (["Locks", "Cylinders"].includes(cat)) return "Securing the Door";
    if (["Closers", "Stops", "Handles", "Auto Operator"].includes(cat)) return "Controlling the Door";
    if (["Seals", "Accessories", "Kick Plate", "Threshold"].includes(cat)) return "Protecting the Door";
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
      { name: "Push Plate", styles: ["Square Corner", "Radius Corner"] }
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
          { name: "Signage", styles: ["Disc", "Rectangular"] },
          { name: "Kick Plate", styles: ["Satin Stainless", "Polished Stainless", "Brass"] },
          { name: "Flush Bolt", styles: ["Lever Action", "Slide Action"] }
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
          { name: "Power Supply", styles: ["12/24V Auto", "Dedicated"] }
      ]
  }
};

const LOCK_TYPE_RULES = {
  Timber: ["Mortise Lock", "Cylindrical Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"],
  Metal: ["Mortise Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"],
  Aluminum: ["Mortise Lock", "Electric Strike", "Magnetic Lock"],
  Glass: ["Patch Lock", "Panic Bar", "Magnetic Lock"],
  default: ["Mortise Lock", "Cylindrical Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"]
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
  Timber: ["Magnetic Lock", "Electric Strike"],
  Metal: ["Magnetic Lock", "Electric Strike", "Electromechanical Mortise"],
  Aluminum: ["Magnetic Lock", "Electric Strike"],
  Glass: ["Magnetic Lock"],
  default: ["Magnetic Lock", "Electric Strike"]
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
const ELECTRIFIED_USE_HINTS = ["main entrance", "security", "server", "it", "data", "lab", "lobby", "reception", "turnstile", "access", "checkpoint"];

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

const getSetWarnings = (set, profile) => {
  const warnings = [];
  const locks = set.items.filter((i) => i.category === "Locks");
  const electrified = set.items.filter((i) => i.category === "Electrified");
  const handles = set.items.filter((i) => i.category === "Handles");
  const panicDevices = locks.filter((i) => (i.type || "").toLowerCase().includes("panic"));
  const magLocks = [...locks, ...electrified].filter((i) => (i.type || "").toLowerCase().includes("magnetic"));
  const electricStrikes = [...locks, ...electrified].filter((i) => (i.type || "").toLowerCase().includes("electric strike"));
  const hasTrueElectrified = magLocks.length > 0 || electrified.some((i) => !MAGLOCK_SUPPORT_TYPES.includes(i.type));

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
    if (missingComponents.length > 0) {
      warnings.push(
        `Magnetic locks require a release package (REX sensor, emergency button, fire alarm interface). Missing: ${missingComponents.join(", ")}.`
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
  return warnings;
};

const FINISHES = {
  "ANSI": ["630 (Satin Stainless)", "629 (Polished Stainless)", "626 (Satin Chrome)", "605 (Polished Brass)", "613 (Oil Rubbed Bronze)", "622 (Matte Black)"],
  "EN": ["SSS (Satin Stainless)", "PSS (Polished Stainless)", "SAA (Satin Anodized)", "PB (Polished Brass)", "RAL 9005 (Black)", "RAL 9016 (White)"]
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
  Electrified: "E"
};

const getDefaultFinishForStandard = (standard = "ANSI") => {
  const finishSet = FINISHES[standard] || FINISHES["ANSI"];
  return finishSet?.[0] || "630 (Satin Stainless)";
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
  { type: "Door Contact", style: "Surface", spec: "Status monitor contact", qty: "1" },
  { type: "Push Button", style: "Request-to-Exit", spec: "Illuminated REX button", qty: "1" },
  { type: "Power Supply", style: "12/24V Auto", spec: "Fail-safe rated supply", qty: "1" }
];

const MAGLOCK_SUPPORT_TYPES = MAGLOCK_SUPPORT_ITEMS.map((item) => item.type);
const ACOUSTIC_THRESHOLD = 40;
const doorsInlined = (config) => (config === 'Double' ? 'double leaf' : 'single leaf');
const ADA_MIN_CLEAR_OPENING_MM = 813;
const ADA_CLEARANCE_DEDUCTION_MM = 38; // approx. 1.5" allowance for hinges/handles

const ensureMaglockSupportItems = (items = [], standard = "ANSI") => {
  const finish = getDefaultFinishForStandard(standard);
  const hasMaglock = items.some((item) => (item.type || "").toLowerCase().includes("magnetic lock"));
  let updatedItems = items.filter((item) => (item.type || "").toLowerCase() !== "maglock release package");
  if (hasMaglock) {
    MAGLOCK_SUPPORT_ITEMS.forEach((kit) => {
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
          autoTag: "maglock-kit"
        });
      }
    });
  } else {
    updatedItems = updatedItems.filter((item) => item.autoTag !== "maglock-kit");
  }
  return updatedItems;
};

const ELECTRIFIED_AUX_TYPES = [...MAGLOCK_SUPPORT_TYPES];
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

const sanitizeHardwareItems = (items = [], standard = "ANSI", context = {}) => {
  const afterMaglock = ensureMaglockSupportItems(items, standard);
  const afterHinge = enforceSingleHinge(afterMaglock);
  return ensureAcousticItems(afterHinge, { ...context, standard });
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
    const context = computeSetContext(doorsForSet, baseItems);
    const normalizedItems = sanitizeHardwareItems(baseItems, project.standard, context);
    return {
      ...set,
      intent: set.intent || deriveSetIntentFromItems(normalizedItems),
      items: normalizedItems
    };
  });
  return { ...project, doors: normalizedDoors, sets: normalizedSets };
};

// --- CUSTOM UI COMPONENTS ---

const HardwareIcon = ({ category }) => {
    if (category === "Hinges") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="20" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
    if (category === "Locks") return <Lock size={16}/>;
    if (category === "Closers") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="10" height="6"/><path d="M12 7h8v10"/></svg>;
    if (category === "Handles") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h10a2 2 0 0 1 2 2v6"/><circle cx="4" cy="12" r="2"/></svg>;
    if (category === "Stops") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a8 8 0 0 0 0-16 8 8 0 0 0 0 16z"/><circle cx="12" cy="14" r="3"/></svg>;
    if (category === "Seals") return <Volume2 size={16}/>;
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
  const isGlass = door.material === 'Glass';
  const isAluminum = door.material === 'Aluminum';
  const isMetal = door.material === 'Metal';
  const isTimber = door.material === 'Timber';
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

const LandingPage = ({ onStart, hasProjects }) => {

  return (
  <div className="relative w-full min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-20 w-80 h-80 bg-indigo-600/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-sky-500/20 blur-[180px]" />
    </div>
    <nav className="relative z-20 px-6 md:px-10 lg:px-12 py-5 flex items-center justify-between">
        <button onClick={() => setView('landing')} className="flex items-center gap-3 focus:outline-none">
          <div className="bg-white/10 rounded-full p-2 backdrop-blur">
            <DoorClosed className="text-sky-300 w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-lg md:text-2xl font-black tracking-tight">InstaSpec</div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-white/50">Door Hardware Intelligence</div>
          </div>
        </button>
      <div className="flex items-center gap-3">
        <button
          onClick={() => alert('Product tour coming soon.')}
          className="hidden sm:inline-flex px-4 py-2 rounded-full border border-white/10 text-sm font-semibold text-white/80 hover:bg-white/5 transition"
        >
          Product Tour
        </button>
        <button
          onClick={onStart}
          className="px-4 md:px-6 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm md:text-base font-semibold shadow-lg shadow-indigo-500/40 transition"
        >
          {hasProjects ? 'Open Dashboard' : 'Start Configuring'}
        </button>
      </div>
    </nav>

    <main className="relative z-10 flex-1 w-full flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-12">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)] gap-12 items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-xs uppercase tracking-widest text-white/70">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> For Architects • Consultants • Specifiers
            </div>
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white">
              Specify door hardware with confidence in <span className="text-sky-300">minutes</span>, not days.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/70">
              InstaSpec unifies code compliance, hardware libraries, and visual coordination into a single premium workspace.
              Build ANSI/EN ready schedules, visualize door sets, and export polished specs instantly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onStart}
              className="px-8 py-4 bg-sky-400 text-slate-950 font-bold rounded-xl shadow-xl shadow-sky-500/30 flex items-center justify-center gap-2 text-lg hover:bg-sky-300 transition"
            >
              Start Configuring <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => alert('Demo replay coming soon.')}
              className="px-8 py-4 border border-white/20 rounded-xl font-semibold text-lg text-white/80 hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              View Demo
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/80">
            {[
              { title: "Code-Compliant Hardware Logic", desc: "Supports ANSI / EN rules and life-safety requirements." },
              { title: "Door Hardware Layout Preview", desc: "See hardware placement clearly before specs are finalized." },
              { title: "Smart Door Scheduling", desc: "Includes STC, ADA, and access-control fields automatically." },
              { title: "One-Click Tender + BIM Exports", desc: "Generate PDF, Excel, and BIM-ready files instantly." },
              { title: "Application-Based Door Presets", desc: "Prefill door types based on building use like Healthcare or Education." },
              { title: "Project Dashboard Management", desc: "Manage multiple projects with complete control." }
            ].map((usp) => (
              <li key={usp.title} className="flex items-start gap-2 bg-white/5 rounded-lg p-3 border border-white/5">
                <Check className="text-emerald-400 w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">{usp.title}</div>
                  <div className="text-white/70">{usp.desc}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 border border-white/10 flex flex-col gap-3 shadow-lg shadow-black/40"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.35em] text-white/50">{stat.label}</div>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">verified</span>
                </div>
                <div className="text-3xl font-black text-white">
                  {stat.value}
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 w-full animate-pulse-slow"></div>
                </div>
              </div>
            ))}
          </div>
          </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-[30px] p-6 shadow-2xl shadow-black/50 space-y-6">
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.4em] text-white/40">Instant Insights</div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border border-white/10 shadow-lg">
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-200">Live scoring</div>
                <div className="text-white font-semibold text-xl mt-2">Compliance Pulse</div>
                <p className="text-white/70 mt-1 text-sm">
                  Every submitted door schedule is evaluated against life-safety, ADA, and fire-door logic in milliseconds.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-400/15 to-sky-600/10 border border-white/10 shadow-lg">
                <div className="text-xs uppercase tracking-[0.3em] text-sky-200">Adaptive visuals</div>
                <div className="text-white font-semibold text-xl mt-2">Material Intelligence</div>
                <p className="text-white/70 mt-1 text-sm">
                  Switch Timber → Glass → Aluminum and see hinge, lock, and seal graphics update instantly before specifying.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.4em] text-white/40">Workflow Snapshot</div>
              <div className="flex flex-col gap-4">
                {[
                  { title: "Project Setup", desc: "Define facility, fire-rating, and jurisdiction rules—the rule engine tunes itself instantly." },
                  { title: "Door Schedule", desc: "Capture dimensions, STC, ADA, and access logic. Additional locations auto-adjust quantity." },
                  { title: "Hardware Sets", desc: "Door Hardware Layout Preview shows hinges, closers, maglocks, and panic trim before specification." },
                  { title: "Validation & Review", desc: "Compliance Pulse verifies life-safety, then exports BIM, PDF, and Excel packages in one click." }
                ].map((card, idx) => (
                  <div key={card.title} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-400 text-slate-950 font-bold flex-shrink-0 flex items-center justify-center shadow-lg shadow-sky-500/40">
                      {idx + 1}
                    </div>
                    <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-white/80 flex-1 shadow">
                      <div className="text-white font-semibold mb-1">{card.title}</div>
                      <p className="text-sm text-white/65">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
  </div>
);
};

const App = () => {
  // State
  const [view, setView] = useState('landing');
  const [step, setStep] = useState(0);
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [isDoorModalOpen, setIsDoorModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('Architect');
  const [library, setLibrary] = useState([]);
  const [printMode, setPrintMode] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [lockResetSignals, setLockResetSignals] = useState({});
  
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
  const [bulkModal, setBulkModal] = useState({ isOpen: false, templateId: "", markPrefix: "", locationsText: "" });
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const recommendedIntent = getRecommendedHardwareIntent(doorForm);
  const numericWidth = parseInt(doorForm.width, 10) || 0;
  const adaClearOpening = Math.max(0, numericWidth - ADA_CLEARANCE_DEDUCTION_MM);
  const showAdaWarning = doorForm.ada && (numericWidth < ADA_MIN_CLEAR_OPENING_MM || adaClearOpening < ADA_MIN_CLEAR_OPENING_MM);
  const adaWarningMessage = showAdaWarning
    ? `Door width ${numericWidth || 0}mm provides ${adaClearOpening}mm clear opening; ADA requires ${ADA_MIN_CLEAR_OPENING_MM}mm (32").`
    : '';

  // Load Data on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('specSmartDB');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.projects) setProjects(data.projects.map(normalizeProject));
        if (data.library) setLibrary(data.library);
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  }, []);

  // Save Data on Change
  useEffect(() => {
    if (projects.length > 0 || view !== 'landing') {
      setSaveStatus('Saving...');
      localStorage.setItem('specSmartDB', JSON.stringify({ projects, library }));
      setTimeout(() => setSaveStatus('Saved'), 800);
    }
  }, [projects, library]);

  useEffect(() => {
    if (isDoorModalOpen) {
      checkCompliance();
      updateDynamicProps();
      if (doorForm.material === 'Glass' && doorForm.visionPanel) {
          setDoorForm(prev => ({ ...prev, visionPanel: false }));
      }
    }
  }, [doorForm.fire, doorForm.use, doorForm.width, doorForm.height, doorForm.thickness, doorForm.location, doorForm.material]);

  const getProj = () => projects.find(p => p.id === currentId);

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
      auditLog: [] 
    };
    setProjects([...projects, newProj]);
    loadProject(id);
  };

  const loadProject = (id) => {
    setCurrentId(id);
    setStep(0);
    setView('wizard');
  };

  const deleteProject = (id, e) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };
  
  const resetApp = () => {
    if(confirm("This will clear all data. Are you sure?")) {
      localStorage.removeItem('specSmartDB');
      setProjects([]);
      setView('landing');
    }
  }

  const saveProjectDetails = (name, type, standard, details) => {
    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, name, type, standard, details } : p
    );
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Updated project details: ${name}`);
    setStep(1);
  };

  const saveDoor = () => {
    if (Object.keys(doorErrors).length > 0) return;

    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newDoors = [...p.doors];
        const doorId = doorForm.id || generateId();
        const cleanedLocations = (doorForm.additionalLocations || []).filter((loc) => (loc.zone || loc.level || loc.roomName));
        const doorData = normalizeDoor({ ...doorForm, id: doorId, additionalLocations: cleanedLocations });
        
        const idx = newDoors.findIndex(d => d.id === doorForm.id);
        if (idx >= 0) newDoors[idx] = doorData;
        else newDoors.push(doorData);
        
        return { ...p, doors: newDoors };
      }
      return p;
    });
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Saved door: ${doorForm.mark}`);
    setIsDoorModalOpen(false);
  };

  const deleteDoor = (doorId) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        return { ...p, doors: p.doors.filter(d => d.id !== doorId) };
      }
      return p;
    });
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Deleted door ID: ${doorId}`);
  };

  const duplicateDoor = (doorId) => {
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
  };

  const addAdditionalLocation = () => {
    setDoorForm(prev => ({
      ...prev,
      additionalLocations: [...(prev.additionalLocations || []), { zone: prev.zone, level: prev.level, roomName: prev.roomName }]
    }));
  };

  const updateAdditionalLocation = (idx, field, value) => {
    setDoorForm(prev => {
      const updated = [...(prev.additionalLocations || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, additionalLocations: updated };
    });
  };

  const removeAdditionalLocation = (idx) => {
    setDoorForm(prev => {
      const updated = [...(prev.additionalLocations || [])];
      updated.splice(idx, 1);
      return { ...prev, additionalLocations: updated };
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
      note = { type: 'info', msg: "Check Code: Cross-corridor doors often require smoke/fire control." };
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
    if (!window.confirm(REVIEW_NOTICE)) {
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
      alert("Failed to generate Excel file. Please check your internet connection (loading external engine).");
      setExportStatus('');
      setSaveStatus('Error');
    }
  };

  const exportBIMData = () => {
    if (!window.confirm(REVIEW_NOTICE)) return;
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

  const handlePrint = () => {
    if (window.confirm(REVIEW_NOTICE)) {
      window.print();
    }
  };

  // Hardware Logic
  const generateHardwareSets = () => {
    const proj = getProj();
    const defaultFinish = getDefaultFinishForStandard(proj.standard);
    const groups = {};

    proj.doors.forEach(d => {
      const key = `${d.use}|${d.fire}|${d.config}|${d.material}|${d.stc}|${d.hardwareIntent || 'Mechanical'}`; 
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    const newSets = Object.entries(groups).map(([key, doors], idx) => {
      const [use, fireStr, config, material, stcStr, intentKey] = key.split('|');
      const fire = parseInt(fireStr);
      const stc = parseInt(stcStr);
      const rep = doors.reduce((a, b) => a.weight > b.weight ? a : b);
      const packageIntent = intentKey === 'Electromechanical' ? 'Electromechanical' : 'Mechanical';
      const adaDoors = doors.some((door) => door.ada);
      
      const setID = `HW-${String(idx + 1).padStart(2, '0')}`;
      const isDouble = config === 'Double';
      let items = [];
      const addItem = (cat, ref, type, style, spec, qty) => items.push({ category: cat, ref, type, style, spec, qty, finish: defaultFinish });

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
          addItem("Handles", "H01", "Pull Handle", "D-Pull", activeLeafSpec("600mm ctc"), "1 Pr");
          addItem("Closers", "D01", "Floor Spring", "Double Action", activeLeafSpec("EN 1-4"), "1");
          if (isDouble) addItem("Closers", "D02", "Floor Spring", "Double Action", inactiveLeafSpec("EN 1-4"), "1");
      } else {
          const hingeType = proj.standard === "ANSI" ? "4.5x4.5" : "102x76x3";
          addItem("Hinges", "H01", "Butt Hinge", "Ball Bearing", `${hingeType}, SS`, totalHingeQty.toString());
          
          if (use.toLowerCase().includes("stair")) {
              addItem("Locks", "L01", "Panic Bar", "Rim Type", activeLeafSpec("Fire Rated Exit Device"), "1");
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
          addItem("Electrified", "E01", "Electric Strike", fire > 0 ? "Fail-Safe" : "Fail-Secure", activeLeafSpec("Access control interface"), "1");
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
      const sanitizedItems = sanitizeHardwareItems(items, proj.standard, context);
      return {
        id: setID,
        name: `${use} Door (${material}) - ${fire > 0 ? fire + 'min' : 'NFR'}`,
        doors: doors.map(d => d.id),
        intent: packageIntent,
        items: sanitizedItems,
        operation: operationText
      };
    });

    const updatedProjects = projects.map(p =>
      p.id === currentId ? { ...p, sets: newSets } : p
    );
    setProjects(updatedProjects);
    setStep(2);
    alert(REVIEW_NOTICE);
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
            return { ...s, items: sanitizeHardwareItems(newItems, p.standard, context) };
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
      alert("Hardware Set saved to Global Library!");
  };

  const loadSetFromLibrary = (libSet) => {
      const proj = getProj();
      const newSetId = `HW-${String(proj.sets.length + 1).padStart(2, '0')}`;
      const baseSet = { ...libSet, id: newSetId, doors: [] };
      const newSet = { ...baseSet, items: sanitizeHardwareItems(baseSet.items || [], proj.standard, computeSetContext([], baseSet.items || [])) };
      
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
    
    const defaultFinish = getDefaultFinishForStandard(proj.standard);
    
    // Find styles
    const catData = PRODUCT_CATALOG[category];
    const typeData = catData?.types.find(t => t.name === type);
    const defaultStyle = typeData ? typeData.styles[0] : "";
    
    const targetSet = proj.sets.find(s => s.id === addItemModal.setId);
    if (!targetSet) return;
    if (category === "Hinges" && targetSet.items.some(i => i.category === "Hinges")) {
      alert("Only one hanging product can be specified per hardware set.");
      return;
    }

    const ref = getNextRefForCategory(targetSet.items, category);

    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === addItemModal.setId) {
            const newItem = { category, ref, type, style: defaultStyle, spec: "", qty: "1", finish: defaultFinish };
            const doorsInSet = p.doors.filter(d => s.doors.includes(d.id));
            const context = computeSetContext(doorsInSet, [...s.items, newItem]);
            return {
              ...s,
              items: sanitizeHardwareItems([...s.items, newItem], p.standard, context)
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
      alert("Select a template door.");
      return;
    }
    const lines = bulkModal.locationsText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      alert("Provide at least one location.");
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
            return { ...s, items: sanitizeHardwareItems(newItems, p.standard, context) };
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
    return <LandingPage onStart={() => setView(projects.length > 0 ? 'dashboard' : 'dashboard')} hasProjects={projects.length > 0} />;
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
                      <p><strong>Client:</strong> {getProj().details?.client || "N/A"}</p>
                      <p><strong>Architect:</strong> {getProj().details?.architect || "N/A"}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
              </div>

              {getProj().sets.map(s => {
                  const repDoor = getProj().doors.find(d => s.doors.includes(d.id));
                  return (
                      <div key={s.id} className="mb-10 break-inside-avoid">
                          <div className="flex justify-between items-end border-b border-black mb-2 pb-1">
                              <h2 className="text-xl font-bold">{s.id}: {s.name}</h2>
                              <span className="text-sm font-mono">
                                {repDoor ? `${repDoor.fire > 0 ? `FD${repDoor.fire}` : 'NFR'} | ${repDoor.material} | ${repDoor.config}` : ''}
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
                                      <th className="text-left p-2">Acoustic Contribution</th>
                                      <th className="text-center p-2">Qty</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {Object.keys(BHMA_CATEGORIES).map(catGroup => {
                                      const itemsInGroup = s.items.filter(i => BHMA_CATEGORIES[catGroup].includes(i.category));
                                      if (itemsInGroup.length === 0) return null;
                                      return (
                                          <React.Fragment key={catGroup}>
                                              <tr className="bg-gray-50"><td colSpan="6" className="p-1 pl-2 font-bold text-xs uppercase text-gray-500 border-b">{catGroup}</td></tr>
                                              {itemsInGroup.map((item, i) => (
                                                  <tr key={i} className="border-b border-gray-200">
                                                      <td className="p-2 text-xs text-gray-400">{item.category}</td>
                                                      <td className="p-2 font-bold">{item.type}</td>
                                                      <td className="p-2">{item.style} - {item.spec}</td>
                                                      <td className="p-2">{item.finish}</td>
                                                      <td className="p-2">{item.acousticContribution || ''}</td>
                                                      <td className="text-center p-2">{item.qty}</td>
                                                  </tr>
                                              ))}
                                          </React.Fragment>
                                      );
                                  })}
                                  {/* Catch-all for uncategorized */}
                                  {s.items.filter(i => !Object.values(BHMA_CATEGORIES).flat().includes(i.category)).map((item, i) => (
                                      <tr key={'other-'+i} className="border-b border-gray-200">
                                          <td className="p-2 text-xs text-gray-400">{item.category}</td>
                                          <td className="p-2 font-bold">{item.type}</td>
                                          <td className="p-2">{item.style} - {item.spec}</td>
                                          <td className="p-2">{item.finish}</td>
                                          <td className="p-2">{item.acousticContribution || ''}</td>
                                          <td className="text-center p-2">{item.qty}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          <div className="mt-2 text-xs text-gray-500">
                              <strong>Locations:</strong> {getProj().doors.filter(d => s.doors.includes(d.id)).map(d => `${d.mark} (${d.roomName})`).join(', ')}
                          </div>
                      </div>
                  );
              })}

              <div className="fixed top-4 right-4 print:hidden">
                  <button onClick={handlePrint} className="px-4 py-2 bg-black text-white rounded shadow-lg flex items-center gap-2"><Printer size={16}/> Print PDF</button>
                  <button onClick={() => setPrintMode(false)} className="ml-2 px-4 py-2 bg-gray-200 text-black rounded shadow-lg">Close</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Global Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 font-bold text-lg md:text-xl text-gray-900 focus:outline-none">
          <DoorClosed className="text-indigo-600" />
          <span>InstaSpec <span className="text-xs text-gray-400 font-normal ml-2">v1.1</span></span>
        </button>
        <div className="flex gap-4 items-center">
            {view === 'wizard' && <span className="text-xs text-gray-400">{exportStatus || saveStatus}</span>}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <UserCircle size={16} className="text-gray-500" />
                <select 
                    value={userRole} 
                    onChange={(e) => setUserRole(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                >
                    <option value="Architect">Architect View</option>
                    <option value="Contractor" disabled>Contractor View (Coming Soon)</option>
                </select>
            </div>

            {view === 'dashboard' && projects.length > 0 && (
                <button onClick={resetApp} className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1" title="Clear All Data">
                    <RotateCcw size={16} /> <span className="hidden md:inline">Reset</span>
                </button>
            )}
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm md:text-base">
                <LayoutGrid size={18} /> <span className="hidden md:inline">Dashboard</span>
            </button>
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
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button onClick={() => setShowAuditLog(!showAuditLog)} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <History size={16} /> History
            </button>
            <button onClick={() => { saveProjectDetails(getProj().name, getProj().type, getProj().standard, getProj().details); alert("Saved locally"); }} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <Save size={16} /> Save
            </button>
            <button onClick={() => setView('dashboard')} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <X size={16} /> Close
            </button>
          </div>
        </div>
      )}
      {view === 'wizard' && (
        <div className="bg-slate-900/95 text-white px-4 md:px-8 py-4 flex flex-col md:flex-row gap-3 justify-center items-stretch shadow-inner">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
              <div className="text-lg font-extrabold tracking-tight">{stat.value}</div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/60">{stat.label}</div>
            </div>
          ))}
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
            
            {/* Feature 1: Coming Soon Placeholders */}
            <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-500 uppercase text-sm mb-4">Coming Soon Features</h3>
                <div className="flex gap-4">
                    <div className="flex-1 p-6 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <UploadCloud size={24} className="mb-2"/>
                        <span className="font-bold">Upload Floor Plan</span>
                        <span className="text-xs">AI Extraction</span>
                    </div>
                    <div className="flex-1 p-6 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <Wand2 size={24} className="mb-2"/>
                        <span className="font-bold">Instant Schedule</span>
                        <span className="text-xs">One-click Generation</span>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* WIZARD VIEW */}
        {view === 'wizard' && getProj() && (
          <div>
            {/* Stepper */}
            <div className="flex justify-center mb-6 md:mb-10 relative overflow-x-auto pb-2">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 hidden md:block w-full"></div>
              <div className="flex gap-8 md:gap-16 min-w-max px-4">
                {['Project Setup', 'Door Schedule', 'Hardware Sets', 'Validation & Review'].map((label, idx) => (
                  <div key={idx} onClick={() => setStep(idx)} className="flex flex-col items-center gap-2 cursor-pointer group bg-gray-50 px-2 relative z-10">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step === idx ? 'bg-indigo-600 border-indigo-600 text-white' : step > idx ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                      {step > idx ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${step === idx ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 0: Setup */}
            {step === 0 && (
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-slideUp">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings size={24}/> Project Context</h2>
                <div className="space-y-6">
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">Project Name</label>
                        <input
                          type="text"
                          placeholder="New Project"
                          value={getProj().name}
                          onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, name: e.target.value} : p); setProjects(updated); }}
                          className="p-2.5 border rounded-md placeholder-gray-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">Facility Type</label>
                        <select value={getProj().type} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, type: e.target.value} : p); setProjects(updated); }} className="p-2.5 border rounded-md bg-white">
                            {Object.keys(FACILITY_DATA).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                  </div>

                  {/* Architectural Context */}
                  <div className="border-t pt-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">Architectural Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold uppercase text-gray-500">Client / Owner</label>
                              <input type="text" placeholder="e.g. Acme Corp" value={getProj().details?.client || ""} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, details: {...p.details, client: e.target.value}} : p); setProjects(updated); }} className="w-full p-2 border rounded" />
                          </div>
                          <div>
                              <label className="text-xs font-bold uppercase text-gray-500">Architect</label>
                              <input type="text" placeholder="e.g. Design Studio" value={getProj().details?.architect || ""} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, details: {...p.details, architect: e.target.value}} : p); setProjects(updated); }} className="w-full p-2 border rounded" />
                          </div>
                          {userRole !== 'Owner' && (
                            <>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">Hardware Standard</label>
                                    <select 
                                        value={getProj().standard} 
                                        onChange={(e) => { 
                                            const newStd = e.target.value;
                                            let newJurisdiction = getProj().details?.jurisdiction;

                                            // Auto-switch logic
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
                                    <label className="text-xs font-bold uppercase text-gray-500">Code Jurisdiction</label>
                                    <select value={getProj().details?.jurisdiction || "IBC 2021"} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, details: {...p.details, jurisdiction: e.target.value}} : p); setProjects(updated); }} className="w-full p-2 border rounded bg-white">
                                        <option>IBC 2021 (International Building Code)</option>
                                        <option>NFPA 101 (Life Safety Code)</option>
                                        <option>Local / Municipal Code</option>
                                    </select>
                                </div>
                            </>
                          )}
                      </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button onClick={() => setStep(1)} className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2">
                      Save & Continue <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Door Schedule */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 animate-slideUp">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold">Door Schedule</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => openDoorModal()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 whitespace-nowrap">
                      <PlusCircle size={18} />
                      <span>Add Door</span>
                    </button>
                    <button
                      onClick={() => {
                        const proj = getProj();
                        if (!proj?.doors.length) {
                          alert("Add at least one door to use bulk assignment.");
                          return;
                        }
                        const firstId = proj.doors[0].id;
                        setBulkModal({ isOpen: true, templateId: firstId, markPrefix: proj.doors[0].mark, locationsText: "" });
                      }}
                      className="flex-1 px-4 py-2 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 font-medium"
                    >
                      Bulk Assign
                    </button>
                  </div>
                </div>

                {getProj().doors.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No doors defined yet.</p>
                    <button onClick={() => openDoorModal()} className="mt-4 text-indigo-600 font-bold hover:underline">Click to add your first door</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                            <td className="p-3 border-b">
                                <span className="font-semibold text-gray-700">{d.roomName}</span>
                                <div className="text-xs text-gray-400">{d.zone} • Lvl {d.level}</div>
                                {d.additionalLocations?.length > 0 && (
                                  <div className="text-[11px] text-indigo-600 font-semibold mt-1">+{d.additionalLocations.length} more locations</div>
                                )}
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
                
                <div className="flex justify-end mt-6">
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
                                {repDoor && <DoorPreview door={repDoor} hardwareSet={s} />}
                            </div>

                            <div className="flex-1">
                                {/* Table Container */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 overflow-x-auto">
                                <div className="min-w-[700px]">
                                    <div className="grid grid-cols-[30px_60px_60px_140px_140px_100px_1fr_120px_60px_40px] bg-gray-50 border-b border-gray-200 p-3 text-xs font-bold text-gray-500 uppercase">
                                    <div></div><div>Ref</div><div>CSI</div><div>Product Type</div><div>Style</div><div>Finish</div><div>Specification</div><div>Acoustic Contribution</div><div>Qty</div><div></div>
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
                                                    const finishes = FINISHES[getProj().standard];
                                                    let typeOptions = catData?.types || [];
                                                    const signalKey = `${s.id}-${originalIndex}`;
                                                    const warningActive = lockResetSignals[signalKey] && (Date.now() - lockResetSignals[signalKey] < 4000);
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
                                                        const allowedLockNames = getAllowedLockTypesForMaterials(setMaterials);
                                                        if (allowedLockNames.length > 0) {
                                                            const filtered = typeOptions.filter(t => allowedLockNames.includes(t.name));
                                                            if (filtered.length > 0) typeOptions = filtered;
                                                        }
                                                        const isAllowed = typeOptions.some(t => t.name === effectiveType);
                                                        if (!isAllowed && typeOptions.length > 0) {
                                                            const fallback = typeOptions[0].name;
                                                            if (fallback && fallback !== effectiveType) {
                                                                setTimeout(() => {
                                                                    updateSetItem(s.id, originalIndex, 'type', fallback);
                                                                    setLockResetSignals(prev => ({ ...prev, [signalKey]: Date.now() }));
                                                                }, 0);
                                                                effectiveType = fallback;
                                                                compatibilityMessage = "Lock type reset: previous lock not compatible with selected material.";
                                                            }
                                                            }
                                                    }
                                                    if (cat === 'Locks') {
                                                        let allowed = getAllowedLockTypesForMaterials(setProfile.materials);
                                                        if (setProfile.requiresPanic) allowed = ["Panic Bar"];
                                                        else if (setProfile.isEscapeRoute) allowed = allowed.filter(name => !name.toLowerCase().includes('deadbolt'));
                                                        typeOptions = typeOptions.filter(t => allowed.includes(t.name));
                                                        if (!typeOptions.some(t => t.name === effectiveType) && typeOptions.length > 0) {
                                                            const fallback = typeOptions[0].name;
                                                            setTimeout(() => {
                                                                updateSetItem(s.id, originalIndex, 'type', fallback);
                                                                setLockResetSignals(prev => ({ ...prev, [signalKey]: Date.now() }));
                                                            }, 0);
                                                            effectiveType = fallback;
                                                            compatibilityMessage = "Lock type reset: previous lock not compatible with selected material/use.";
                                                        }
                                                    }
                                                    if (cat === 'Electrified') {
                                                        let allowedElectrified = getAllowedElectrifiedTypesForMaterials(setProfile.materials);
                                                        const allowedNames = new Set([...allowedElectrified, ...ELECTRIFIED_AUX_TYPES]);
                                                        typeOptions = typeOptions.filter(t => allowedNames.has(t.name));
                                                        if (!typeOptions.some(t => t.name === effectiveType) && typeOptions.length > 0) {
                                                            const fallback = typeOptions[0].name;
                                                            setTimeout(() => {
                                                                updateSetItem(s.id, originalIndex, 'type', fallback);
                                                                setLockResetSignals(prev => ({ ...prev, [signalKey]: Date.now() }));
                                                            }, 0);
                                                            effectiveType = fallback;
                                                            compatibilityMessage = "Electrified option reset for compliance.";
                                                        }
                                                    }
                                                    const stylesAll = (catData?.types.find(t => t.name === effectiveType) || { styles: [] }).styles || [];
                                                    let styles = stylesAll;
                                                    if (cat === 'Electrified' && setProfile.requiresFailSafe) {
                                                        const filteredStyles = stylesAll.filter(st => st.toLowerCase().includes('fail-safe') || st.toLowerCase().includes('rex'));
                                                        if (filteredStyles.length > 0) styles = filteredStyles;
                                                    }

                                                    return (
                                                        <div key={idx} className="grid grid-cols-[30px_60px_60px_140px_140px_100px_1fr_120px_60px_40px] border-b border-gray-100 p-2 items-center hover:bg-gray-50 relative">
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
                                                                        {finishes.map(f => <option key={f} value={f}>{f}</option>)}
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
                    <button onClick={() => setStep(1)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-2">
                      <ArrowLeft size={16}/> Back
                    </button>
                    <button onClick={() => setStep(3)} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 font-medium">
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
                  <div className="flex gap-3">
                      {userRole !== 'Owner' && (
                        <button onClick={exportBIMData} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                            <Box size={18} /> Export BIM Data
                        </button>
                      )}
                      <button onClick={() => setPrintMode(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                        <FileText size={18} /> Print Spec Sheet
                      </button>
                      <button onClick={exportData} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 shadow-sm">
                        <FileSpreadsheet size={18} /> Export Schedule
                      </button>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Additional Locations</label>
                  <button onClick={addAdditionalLocation} className="text-xs text-indigo-600 hover:underline font-semibold">+ Add Location</button>
                </div>
                {doorForm.additionalLocations?.length ? (
                  doorForm.additionalLocations.map((loc, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 mt-2 items-start">
                      <input type="text" value={loc.zone} onChange={(e) => updateAdditionalLocation(idx, 'zone', e.target.value)} className="p-2 border rounded" placeholder="Zone" />
                      <input type="text" value={loc.level} onChange={(e) => updateAdditionalLocation(idx, 'level', e.target.value)} className="p-2 border rounded" placeholder="Level" />
                      <input type="text" value={loc.roomName} onChange={(e) => updateAdditionalLocation(idx, 'roomName', e.target.value)} className="p-2 border rounded" placeholder="Room Name" />
                      <button onClick={() => removeAdditionalLocation(idx)} className="text-red-500 text-xs font-bold">Remove</button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Add more zones/levels/rooms that use this exact hardware spec.</p>
                )}
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

              {doorForm.config === 'Double' && (
                <div className="text-[11px] text-gray-500">
                  {doorForm.fire > 0
                    ? "Fire-rated pairs default to rebated meeting stiles per EN 1634 / ANSI UL10C."
                    : "Non-rated pairs use a flush meeting stile between leaves."}
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

              {complianceNote && (
                <div className={`mt-4 p-3 rounded-lg border flex gap-3 items-start ${complianceNote.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                  {complianceNote.type === 'warning' ? <Flame size={18} className="shrink-0 mt-0.5"/> : <Accessibility size={18} className="shrink-0 mt-0.5"/>}
                  <div className="text-sm leading-relaxed">
                    <strong>Code Check:</strong> {complianceNote.msg}
                  </div>
                </div>
              )}

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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
              <h3 className="text-lg font-bold">Add Hardware Item</h3>
              <button onClick={() => setAddItemModal({ isOpen: false, setId: null })} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-6 flex gap-3 items-start">
                <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-orange-800 leading-relaxed">
                  <strong>Code Compliance Warning:</strong> Adding manual items may affect the fire rating.
                </p>
              </div>
              <div className="space-y-4">
                {Object.entries(PRODUCT_CATALOG).map(([category, data]) => (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                         <h4 className="text-xs font-bold text-gray-500 uppercase">{getBHMACategory(category)} - {category}</h4>
                         <span className="text-[10px] text-gray-300 font-mono">{data.csi}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {data.types.map((type) => (
                        <button key={type.name} onClick={() => addNewItem(category, type.name)} className="text-left px-4 py-3 border border-gray-100 rounded hover:border-indigo-600 hover:bg-indigo-50 transition-colors group w-full">
                          <div className="font-medium text-gray-800 group-hover:text-indigo-600">{type.name}</div>
                          <div className="text-xs text-gray-500 truncate flex gap-2">
                              {type.styles.slice(0, 2).join(", ")}...
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
};

export default App;
