import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, LayoutGrid, PlusCircle, FolderOpen, Trash2, 
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

// BHMA Categorization Helper
const BHMA_CATEGORIES = {
    "Hanging": ["Hinges"],
    "Securing": ["Locks", "Cylinders", "Accessories"], // Flush bolts in accessories
    "Controlling": ["Closers", "Stops", "Handles"], // Handles control latch
    "Protecting": ["Seals", "Accessories"] // Kick plates in accessories
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
      { name: "Concealed Hinge", styles: ["3D Adjustable", "Tectus Type", "Spring Concealed"] },
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
  }
};

const FINISHES = {
  "ANSI": ["630 (Satin Stainless)", "629 (Polished Stainless)", "626 (Satin Chrome)", "605 (Polished Brass)", "613 (Oil Rubbed Bronze)", "622 (Matte Black)"],
  "EN": ["SSS (Satin Stainless)", "PSS (Polished Stainless)", "SAA (Satin Anodized)", "PB (Polished Brass)", "RAL 9005 (Black)", "RAL 9016 (White)"]
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
  const isGlass = door.material === 'Glass';
  const isAluminum = door.material === 'Aluminum';
  const isMetal = door.material === 'Metal';
  const hasVision = door.visionPanel;
  
  let doorFill = '#d4a373'; // Wood Default
  let doorStroke = '#a98467';
  let frameColor = '#8a6a4b';
  
  if (isGlass) {
    doorFill = '#e0f2fe'; 
    doorStroke = '#bae6fd';
    frameColor = '#cbd5e1'; // Minimal frame or wall
  } else if (isAluminum) {
    doorFill = '#f0f9ff'; 
    doorStroke = '#94a3b8'; 
    frameColor = '#475569'; 
  } else if (isMetal) {
    doorFill = '#fca5a5'; 
    doorStroke = '#ef4444';
    frameColor = '#7f1d1d';
  }
  
  const hasPanic = hardwareSet?.items?.some(i => i.type.includes('Panic'));
  const hasKick = hardwareSet?.items?.some(i => i.type.includes('Kick') || i.type.includes('Protection'));
  const hasCloser = hardwareSet?.items?.some(i => i.type.includes('Closer') || i.type.includes('Floor Spring'));
  const hasPull = hardwareSet?.items?.some(i => i.type.includes('Pull'));
  const isFloorSpring = hardwareSet?.items?.some(i => i.type.includes('Floor Spring'));
  const hasLouver = hardwareSet?.items?.some(i => i.type.includes('Louver')); // Not standard item but for visualization
  
  const handing = door.handing || 'RH';

  const DoorLeaf = ({ x, leafHanding, isInactive }) => {
    const leafHinge = leafHanding === 'LH' ? 'left' : 'right';
    const handleX = leafHinge === 'left' ? 75 : 15;
    
    return (
      <g transform={`translate(${x}, 0)`}>
        {/* Door Slab */}
        <rect x="5" y="5" width="90" height="190" fill={doorFill} stroke={doorStroke} strokeWidth="2" />
        
        {/* Lite Kit Frame */}
        {hasVision && !isGlass && (
             <rect x="25" y="30" width="40" height="80" fill="#e0f2fe" stroke="#333" strokeWidth="1" />
        )}
        
        {/* Louver (if implied or added) - Visual placeholder if needed, e.g. Metal doors often have louvers at bottom */}
        {isMetal && !hasVision && (
             <g transform="translate(15, 140)">
                 <rect x="0" y="0" width="60" height="30" fill="none" stroke="#666" />
                 <line x1="0" y1="5" x2="60" y2="5" stroke="#666" />
                 <line x1="0" y1="10" x2="60" y2="10" stroke="#666" />
                 <line x1="0" y1="15" x2="60" y2="15" stroke="#666" />
                 <line x1="0" y1="20" x2="60" y2="20" stroke="#666" />
                 <line x1="0" y1="25" x2="60" y2="25" stroke="#666" />
             </g>
        )}

        {/* Astragal for Double Doors (Inactive Leaf) */}
        {isInactive && isDouble && (
            <rect x={leafHinge === 'left' ? 88 : 0} y="5" width="4" height="190" fill="#666" />
        )}
        
        {/* Hinge Visuals (3 standard) */}
        <rect x={leafHinge === 'left' ? 3 : 93} y="20" width="4" height="8" fill="#999" />
        <rect x={leafHinge === 'left' ? 3 : 93} y="95" width="4" height="8" fill="#999" />
        <rect x={leafHinge === 'left' ? 3 : 93} y="170" width="4" height="8" fill="#999" />

        {/* Closer Body & Arm */}
        {hasCloser && !isFloorSpring && !isInactive && (
          <g transform={leafHinge === 'left' ? "translate(10, 10)" : "translate(50, 10)"}>
            <rect x="0" y="0" width="30" height="10" fill="#374151" rx="2" />
            <path d={leafHinge === 'left' ? "M 15 5 L 45 25" : "M 15 5 L -15 25"} stroke="#374151" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Lock/Handle Area */}
        <g transform={`translate(${handleX}, 100)`}>
          {hasPanic ? (
            <rect x={leafHinge === 'left' ? -5 : -65} y="-5" width="70" height="12" rx="1" fill="#cbd5e1" stroke="#475569" />
          ) : hasPull ? (
             <rect x="-2" y="-20" width="4" height="40" rx="2" fill="#64748b" />
          ) : (
            <g>
                {/* Rose & Lever */}
                <circle cx="0" cy="0" r="6" fill="#e2e8f0" stroke="#64748b" strokeWidth="1"/> 
                <rect x={leafHinge === 'left' ? -14 : 2} y="-3" width="12" height="6" fill="#64748b" rx="2"/>
            </g>
          )}
        </g>
        
        {/* Protection Plate */}
        {hasKick && <rect x="10" y="165" width="80" height="25" fill="#9ca3af" opacity="0.5" stroke="#4b5563" />}

        {/* Threshold/Sweep at bottom */}
        <rect x="5" y="193" width="90" height="4" fill="#333" />

      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="260" viewBox="0 0 240 260" className="bg-white rounded-lg border border-gray-100 shadow-sm p-2">
        {/* Frame Head */}
        <rect x="0" y="0" width={isDouble ? 240 : 130} height="200" fill="none" stroke={frameColor} strokeWidth="6" />
        {/* Frame Jambs are implied by stroke */}
        
        {isDouble ? (
            <>
                <DoorLeaf x={15} leafHanding="LH" isInactive={true} />
                <DoorLeaf x={115} leafHanding="RH" />
            </>
        ) : (
            <DoorLeaf x={15} leafHanding={handing.includes('L') ? 'LH' : 'RH'} />
        )}
      </svg>
      <div className="mt-2 text-xs text-gray-500 font-medium text-center">
        {door.config} {door.material} <br/>
        <span className="text-indigo-600 font-bold">{handing}</span> {hasVision ? '+ Lite Kit' : ''}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const LandingPage = ({ onStart, hasProjects }) => (
  <div className="absolute top-0 left-0 w-full min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 z-50 flex flex-col overflow-y-auto">
    <nav className="px-4 md:px-8 py-6 flex justify-between items-center">
      <div className="flex items-center gap-2 font-extrabold text-xl md:text-2xl text-gray-900">
        <ShieldCheck className="text-indigo-600 w-6 h-6 md:w-8 md:h-8" />
        <span>SpecSmart</span>
      </div>
      <div>
        <button 
          onClick={onStart} 
          className={`px-4 py-2 md:px-6 md:py-2 rounded-md font-medium text-sm md:text-base transition-colors ${hasProjects ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
        >
          {hasProjects ? 'Dashboard' : 'Get Started'}
        </button>
      </div>
    </nav>

    <section className="flex-1 flex flex-col lg:flex-row items-center justify-between px-4 md:px-8 lg:px-16 max-w-7xl mx-auto gap-8 lg:gap-16 py-8 lg:py-12">
      <div className="max-w-xl animate-slideUp text-center lg:text-left">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs md:text-sm font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 mr-2" /> Best-in-Class Specification Tool
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-700 mb-6 leading-tight">
          The Smarter Way to Specify Door Hardware.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
          Automated standards compliance (ANSI/EN), smart product recommendations, and instant Excel exports. 
          Built for Architects and Specifiers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <button onClick={onStart} className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            Start Specification Journey <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => alert('Demo Mode: Click Start Journey to begin!')} className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-lg font-bold text-lg hover:bg-gray-50 transition-all">
            Watch Demo
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative perspective-1500 w-full max-w-lg hidden md:block">
        {/* Visual Placeholder for Landing Page */}
        <div className="bg-white rounded-xl shadow-2xl p-6 border border-white/80 transform-3d-card animate-float">
            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">3D Product Preview</div>
        </div>
      </div>
    </section>
  </div>
);

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
  
  // Door Modal State (Hierarchical Location)
  const [doorForm, setDoorForm] = useState({
    id: '', mark: '', 
    zone: 'Tower A', level: '01', roomName: '', 
    qty: 1, 
    width: 900, height: 2100, weight: 45, 
    fire: 0, use: '', material: 'Timber', config: 'Single',
    thickness: 45, visionPanel: false, handing: 'RH',
    stc: 35, ada: true, notes: '' 
  });
  
  const [doorErrors, setDoorErrors] = useState({});
  const [doorHint, setDoorHint] = useState('');
  const [complianceNote, setComplianceNote] = useState(null);
  const [addItemModal, setAddItemModal] = useState({ isOpen: false, setId: null });
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');

  // Load Data on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('specSmartDB');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.projects) setProjects(data.projects);
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
      name: "New Project", 
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
        const doorData = { ...doorForm, id: doorId };
        
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
        newDoors.push({ 
            ...original, 
            id: generateId(), 
            mark: `${original.mark}-CP${i+1}` 
        });
    }
    
    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, doors: [...p.doors, ...newDoors] } : p
    );
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Bulk duplicated door ${original.mark} (${numCopies} times)`);
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

      let recStc = 30;
      for (const [key, value] of Object.entries(ACOUSTIC_RECOMMENDATIONS)) {
          if (doorForm.use.includes(key) || (doorForm.roomName && doorForm.roomName.includes(key))) {
              recStc = value;
              break;
          }
      }

      setDoorForm(prev => ({
          ...prev,
          thickness: newThickness,
          weight: newWeight,
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
      setDoorForm({ ...door });
    } else {
      setDoorForm({
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
        visionPanel: false,
        handing: 'RH',
        stc: 35, ada: true, notes: ''
      });
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
        (s.items || []).forEach(i => {
          hwData.push({
            "Set": s.id, "Set Name": s.name, "Ref": i.ref, "Category": i.category,
            "Type": i.type, "Style": i.style, "Finish": i.finish, "Spec": i.spec, "Qty": i.qty
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

  // Hardware Logic
  const generateHardwareSets = () => {
    const proj = getProj();
    const defaultFinish = proj.standard === "ANSI" ? "630 (US32D)" : "SSS";
    const groups = {};

    proj.doors.forEach(d => {
      const key = `${d.use}|${d.fire}|${d.config}|${d.material}|${d.stc}`; 
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    const newSets = Object.entries(groups).map(([key, doors], idx) => {
      const [use, fireStr, config, material, stcStr] = key.split('|');
      const fire = parseInt(fireStr);
      const stc = parseInt(stcStr);
      const rep = doors.reduce((a, b) => a.weight > b.weight ? a : b);
      
      const setID = `HW-${String(idx + 1).padStart(2, '0')}`;
      let items = [];
      const addItem = (cat, ref, type, style, spec, qty) => items.push({ category: cat, ref, type, style, spec, qty, finish: defaultFinish });

      let hingeQty = 3;
      if (rep.height > 2300) hingeQty = 4;
      if (rep.weight > 120) hingeQty = 4;
      if (rep.height > 2300 && rep.weight > 120) hingeQty = 5;

      if (material === "Glass") {
          addItem("Hinges", "P01", "Patch Fitting", "Top Patch", "SS Patch", "1");
          addItem("Hinges", "P02", "Patch Fitting", "Bottom Patch", "SS Patch", "1");
          addItem("Locks", "L01", "Patch Lock", "Corner Patch Lock", "Euro Cylinder Type", "1");
          addItem("Handles", "H01", "Pull Handle", "D-Pull", "600mm ctc", "1 Pr");
          addItem("Closers", "D01", "Floor Spring", "Double Action", "EN 1-4", "1");
      } else {
          const hingeType = proj.standard === "ANSI" ? "4.5x4.5" : "102x76x3";
          addItem("Hinges", "H01", "Butt Hinge", "Ball Bearing", `${hingeType}, SS`, hingeQty.toString());
          
          if (use.toLowerCase().includes("stair")) {
              addItem("Locks", "L01", "Panic Bar", "Rim Type", "Fire Rated Exit Device", "1");
          } else {
              addItem("Locks", "L01", "Mortise Lock", "Sashlock", "Cylinder Function", "1");
              addItem("Cylinders", "C01", "Cylinder", "Euro Profile", "Key/Turn", "1");
              addItem("Handles", "H02", "Lever Handle", "Return to Door", "19mm dia", "1 Pr");
          }
          
          addItem("Closers", "D01", "Overhead Closer", "Rack & Pinion", "EN 2-5, Backcheck", "1");
          addItem("Stops", "S01", "Door Stop", "Floor Mounted Dome", "Rubber Buffer", "1");
      }

      return {
        id: setID,
        name: `${use} Door (${material}) - ${fire > 0 ? fire + 'min' : 'NFR'}`,
        doors: doors.map(d => d.id),
        items,
        operation: "Door is self-closing and latching."
      };
    });

    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, sets: newSets } : p
    );
    setProjects(updatedProjects);
    setStep(2);
  };

  const updateSetItem = (setId, idx, field, val) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            const newItems = [...s.items];
            newItems[idx] = { ...newItems[idx], [field]: val };
            return { ...s, items: newItems };
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
      const newSet = { ...libSet, id: newSetId, doors: [] };
      
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
    
    const defaultFinish = proj.standard === "ANSI" ? "630 (US32D)" : "SSS";
    
    // Find styles
    const catData = PRODUCT_CATALOG[category];
    const typeData = catData?.types.find(t => t.name === type);
    const defaultStyle = typeData ? typeData.styles[0] : "";
    
    let refPrefix = "X";
    if(category === "Hinges") refPrefix = "H";
    if(category === "Locks") refPrefix = "L";
    if(category === "Closers") refPrefix = "D";
    if(category === "Handles") refPrefix = "H";
    if(category === "Stops") refPrefix = "S";
    if(category === "Seals") refPrefix = "GS";
    
    const targetSet = proj.sets.find(s => s.id === addItemModal.setId);
    if (!targetSet) return;

    const count = targetSet.items.filter(i => i.category === category).length;
    const ref = `${refPrefix}${String(count + 2).padStart(2, '0')}`;

    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === addItemModal.setId) {
            return {
              ...s,
              items: [...s.items, { category, ref, type, style: defaultStyle, spec: "", qty: "1", finish: defaultFinish }]
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

  const deleteSetItem = (setId, idx) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            const newItems = [...s.items];
            newItems.splice(idx, 1);
            return { ...s, items: newItems };
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
                      <h1 className="text-3xl font-bold uppercase tracking-wider">{getProj().name}</h1>
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
                              <span className="text-sm font-mono">{repDoor ? `${repDoor.fire > 0 ? `FD${repDoor.fire}` : 'NFR'} | ${repDoor.material}` : ''}</span>
                          </div>
                          <div className="mb-4 text-sm italic text-gray-700">{s.operation}</div>
                          
                          <table className="w-full text-sm border-collapse">
                              <thead>
                                  <tr className="bg-gray-100 border-b border-gray-400">
                                      <th className="text-left p-2">Category</th>
                                      <th className="text-left p-2">Item</th>
                                      <th className="text-left p-2">Description</th>
                                      <th className="text-left p-2">Finish</th>
                                      <th className="text-center p-2">Qty</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {Object.keys(BHMA_CATEGORIES).map(catGroup => {
                                      const itemsInGroup = s.items.filter(i => BHMA_CATEGORIES[catGroup].includes(i.category));
                                      if (itemsInGroup.length === 0) return null;
                                      return (
                                          <React.Fragment key={catGroup}>
                                              <tr className="bg-gray-50"><td colSpan="5" className="p-1 pl-2 font-bold text-xs uppercase text-gray-500 border-b">{catGroup}</td></tr>
                                              {itemsInGroup.map((item, i) => (
                                                  <tr key={i} className="border-b border-gray-200">
                                                      <td className="p-2 text-xs text-gray-400">{item.category}</td>
                                                      <td className="p-2 font-bold">{item.type}</td>
                                                      <td className="p-2">{item.style} - {item.spec}</td>
                                                      <td className="p-2">{item.finish}</td>
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
                  <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded shadow-lg flex items-center gap-2"><Printer size={16}/> Print PDF</button>
                  <button onClick={() => setPrintMode(false)} className="ml-2 px-4 py-2 bg-gray-200 text-black rounded shadow-lg">Close</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Global Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-gray-900">
          <ShieldCheck className="text-indigo-600" />
          <span>SpecSmart <span className="text-xs text-gray-400 font-normal ml-2">v2.0 Enterprise</span></span>
        </div>
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
            <span className="font-bold text-base md:text-lg">{getProj().name}</span>
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
                        <input type="text" value={getProj().name} onChange={(e) => { const updated = projects.map(p => p.id === currentId ? {...p, name: e.target.value} : p); setProjects(updated); }} className="p-2.5 border rounded-md" />
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
                  <button onClick={() => openDoorModal()} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2">
                    <PlusCircle size={18} /> Add Door
                  </button>
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
                            </td>
                            <td className="p-3 border-b">{d.qty}</td>
                            <td className="p-3 border-b">{d.width} x {d.height}</td>
                            <td className="p-3 border-b"><span className={`px-2 py-0.5 rounded text-xs font-bold ${d.fire > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{d.fire} min</span></td>
                            <td className="p-3 border-b text-sm text-gray-500">{d.stc ? `${d.stc} dB` : '-'}</td>
                            <td className="p-3 border-b text-sm">{d.material} / {d.config}</td>
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
                                    <div className="grid grid-cols-[30px_60px_60px_140px_140px_100px_1fr_60px_40px] bg-gray-50 border-b border-gray-200 p-3 text-xs font-bold text-gray-500 uppercase">
                                    <div></div><div>Ref</div><div>CSI</div><div>Product Type</div><div>Style</div><div>Finish</div><div>Specification</div><div>Qty</div><div></div>
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
                                                    const styles = catData?.types.find(t => t.name === item.type)?.styles || [];
                                                    const finishes = FINISHES[getProj().standard];

                                                    return (
                                                        <div key={idx} className="grid grid-cols-[30px_60px_60px_140px_140px_100px_1fr_60px_40px] border-b border-gray-100 p-2 items-center hover:bg-gray-50 relative">
                                                            <div className="flex justify-center text-gray-400"><HardwareIcon category={cat} /></div>
                                                            {/* Owner View: Read Only */}
                                                            {userRole === 'Owner' ? (
                                                                <>
                                                                    <div className="text-sm font-medium text-gray-900">{item.ref}</div>
                                                                    <div className="text-xs text-gray-400">{catData?.csi || ""}</div>
                                                                    <div className="text-sm text-gray-600">{item.type}</div>
                                                                    <div className="text-sm text-gray-600">{item.style}</div>
                                                                    <div className="text-sm text-gray-600">{item.finish}</div>
                                                                    <div className="text-sm text-gray-500">{item.spec}</div>
                                                                    <div className="text-sm text-gray-900">{item.qty}</div>
                                                                    <div></div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <input type="text" value={item.ref} onChange={(e) => updateSetItem(s.id, originalIndex, 'ref', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                                    <div className="text-xs text-gray-400">{catData?.csi || ""}</div>
                                                                    <select value={item.type} onChange={(e) => updateSetItem(s.id, originalIndex, 'type', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                                        {catData?.types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                                                    </select>
                                                                    <select value={item.style} onChange={(e) => updateSetItem(s.id, originalIndex, 'style', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                                        {styles.map(st => <option key={st} value={st}>{st}</option>)}
                                                                    </select>
                                                                    <select value={item.finish} onChange={(e) => updateSetItem(s.id, originalIndex, 'finish', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                                        {finishes.map(f => <option key={f} value={f}>{f}</option>)}
                                                                    </select>
                                                                    <input type="text" value={item.spec} onChange={(e) => updateSetItem(s.id, originalIndex, 'spec', e.target.value)} className="w-full p-1 border rounded text-xs" />
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
                                        <div key={'other-'+idx} className="grid grid-cols-[30px_60px_60px_140px_140px_100px_1fr_60px_40px] border-b border-gray-100 p-2 items-center hover:bg-gray-50 relative">
                                            <div className="flex justify-center text-gray-400"><HardwareIcon category={item.category} /></div>
                                            <input type="text" value={item.ref} className="w-full p-1 border rounded text-xs" disabled />
                                            <div className="text-xs text-gray-400"></div>
                                            <div className="text-sm text-gray-600">{item.type}</div>
                                            <div className="text-sm text-gray-600">{item.style}</div>
                                            <div className="text-sm text-gray-600">{item.finish}</div>
                                            <div className="text-sm text-gray-500">{item.spec}</div>
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
                            onChange={(val) => setDoorForm({...doorForm, roomName: val})}
                            placeholder="Select or type..."
                        />
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Door Mark / ID</label>
                  <input type="text" value={doorForm.mark} onChange={e => setDoorForm({...doorForm, mark: e.target.value})} className="p-2.5 border rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Qty</label>
                  <input type="number" value={doorForm.qty} onChange={e => setDoorForm({...doorForm, qty: parseInt(e.target.value) || 0})} className="p-2.5 border rounded" />
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
                    <input type="number" value={doorForm.thickness} onChange={e => setDoorForm({...doorForm, thickness: parseInt(e.target.value) || 0})} className="w-full p-2.5 border rounded" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Weight (kg) - Auto</label>
                    <div className="relative">
                        <input type="number" value={doorForm.weight} onChange={e => {setDoorForm({...doorForm, weight: e.target.value});}} className="w-full p-2.5 border rounded bg-gray-50" />
                        <Scale size={14} className="absolute right-3 top-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default App;
