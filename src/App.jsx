import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, LayoutGrid, PlusCircle, FolderOpen, Trash2, 
  Globe, Building, Save, X, Copy, Pencil, DoorClosed, 
  DoorOpen, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, 
  Brain, Check, AlertTriangle, TreeDeciduous, RectangleHorizontal, 
  Menu, ChevronDown, Search, Info, Flame, Accessibility, RotateCcw,
  Eye, Layers, UserCircle, History, Box, Download, Library, MoveHorizontal,
  Lock, Settings, MousePointer, Power
} from 'lucide-react';

// --- UTILS ---

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// --- CONSTANTS & DATA ---

const FACILITY_DATA = {
  "Commercial Office": {
    locations: ["Open Office", "Meeting Room", "Director Cabin", "Server Room", "Reception", "Pantry", "Copy Room", "Corridor", "Conference Room", "Restroom", "Stairwell", "Lobby", "Electrical Cupboard", "Prayer Room"],
    usages: ["Office / Passage", "Meeting Room", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Storage / Service", "Server / IT", "Main Entrance", "Fire Door (Cross-Corridor)", "Prayer / Quiet Room"]
  },
  "Hospital / Healthcare": {
    locations: ["Patient Room", "Operating Theatre", "Nurse Station", "Clean Utility", "Dirty Utility", "Waiting Area", "Consultation Room", "Corridor", "Reception", "X-Ray Room", "Pharmacy", "Prayer Room"],
    usages: ["Patient Room", "Operating Theatre", "Consultation / Exam", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Clean / Dirty Utility", "Main Entrance", "Radiation Protection", "Prayer / Quiet Room"]
  },
  "Education / School": {
    locations: ["Classroom", "Staff Room", "Library", "Auditorium", "Gymnasium", "Lab", "Cafeteria", "Corridor", "Admin Office", "Music Room"],
    usages: ["Classroom", "Assembly / Hall", "Staff Office", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Storage / Service", "Main Entrance", "Gymnasium"]
  },
  "Airport / Transport": {
    locations: ["Terminal Entry", "Check-in", "Security Check", "Boarding Gate", "Baggage Handling", "Duty Free", "Staff Entry", "Control Room", "Prayer Room"],
    usages: ["Terminal Entry", "Security / Checkpoint", "Boarding Gate", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Staff Only / Service", "Baggage / Logistics", "Prayer / Quiet Room"]
  },
  "Hospitality / Hotel": {
    locations: ["Guest Room", "Ballroom", "Kitchen", "Back of House", "Lobby", "Spa", "Gym", "Service Entry", "Linen Room"],
    usages: ["Guest Room Entry", "Connecting Door", "Ballroom / Assembly", "Kitchen / Service", "Corridor / Circulation", "Stairwell / Exit", "Restroom", "Back of House", "Main Entrance"]
  },
  "Residential": {
    locations: ["Entrance", "Living Room", "Bedroom", "Bathroom", "Kitchen", "Balcony", "Utility Room", "Garage", "Common Corridor", "Fire Stairs"],
    usages: ["Unit Entrance (Fire Rated)", "Bedroom / Internal", "Bathroom / Privacy", "Kitchen", "Balcony / External", "Common Corridor", "Stairwell / Exit", "Service / Utility"]
  }
};

// Feature 3: Smart Usage Templates
const SMART_TEMPLATES = {
    "prayer": {
        name: "Prayer / Quiet Room",
        desc: "Aesthetic, Quiet Operation, Privacy",
        items: [
            { category: "Hinges", type: "Concealed Hinge", spec: "High Load Concealed Hinge, 3D Adjustable", qty: "3" },
            { category: "Locks", type: "Mortise Lock", spec: "Silent Latch Sashlock, Roller Bolt", qty: "1" },
            { category: "Handles", type: "Lever Handle", spec: "Return to door, Satin Nickel", qty: "1 Pr" },
            { category: "Closers", type: "Concealed Closer", spec: "Integrated Cam-Motion Closer, Cushioned Stop", qty: "1" },
            { category: "Seals", type: "Drop Seal", spec: "Automatic Drop Down Seal (42dB Acoustic)", qty: "1" },
            { category: "Stops", type: "Door Stop", spec: "Floor mounted, dome shape", qty: "1" }
        ],
        operation: "Door is self-closing with cushioned stop. Acoustic seal drops upon closing for quiet privacy."
    },
    "server": {
        name: "Server / IT Room",
        desc: "High Security, Ventilation Control",
        items: [
            { category: "Hinges", type: "Butt Hinge", spec: "4.5x4.5 Ball Bearing, Security Pin", qty: "3" },
            { category: "Locks", type: "Electric Strike", spec: "Fail Secure Monitored Strike", qty: "1" },
            { category: "Locks", type: "Mortise Lock", spec: "Nightlatch Function (Locked outside)", qty: "1" },
            { category: "Handles", type: "Lever Handle", spec: "SS Lever on Rose", qty: "1 Pr" },
            { category: "Closers", type: "Overhead Closer", spec: "Heavy Duty, Backcheck, Delayed Action", qty: "1" },
            { category: "Accessories", type: "Signage", spec: "'Restricted Access'", qty: "1" }
        ],
        operation: "Door is securely locked. Access via access control. Free egress at all times."
    }
};

const PRODUCT_SUBTYPES = {
  "Hinges": [
    { name: "Butt Hinge", spec: "4.5x4.5 Ball Bearing, Stainless Steel, ANSI/EN Grade" },
    { name: "Concealed Hinge", spec: "3D Adjustable Concealed Hinge, Satin Chrome" },
    { name: "Pivot Set", spec: "Heavy Duty Floor Pivot & Top Center, Double Action" },
    { name: "Geared Hinge", spec: "Continuous Geared Hinge, Full Mortise, Heavy Duty" },
    { name: "Patch Fitting", spec: "Top & Bottom Patch Fitting Set, SS" },
    { name: "Glass Hinge", spec: "Side mounted glass hinge, SS" }
  ],
  "Locks": [
    { name: "Mortise Lock", spec: "Sashlock case, Cylinder operation, Heavy Duty" },
    { name: "Deadbolt", spec: "Heavy Duty Deadbolt, Thumbturn internal" },
    { name: "Cylindrical Lock", spec: "Leverset with integrated cylinder" },
    { name: "Magnetic Lock", spec: "Electromagnetic Lock, 1200lbs holding force" },
    { name: "Bathroom Lock", spec: "Privacy function, coin release indicator" },
    { name: "Panic Bar", spec: "Rim Exit Device, Fire Rated to UL/EN Standards" },
    { name: "Electric Strike", spec: "Fail Safe/Fail Secure, Monitored" },
    { name: "Patch Lock", spec: "Corner Patch Lock with Euro Cylinder" },
    { name: "Glass Strike Box", spec: "Glass mounted strike box" }
  ],
  "Closers": [
    { name: "Overhead Closer", spec: "Surface mounted, Size 2-5, Backcheck" },
    { name: "Cam Action Closer", spec: "Slide arm closer, High efficiency, DDA Compliant" },
    { name: "Concealed Closer", spec: "Integrated in door leaf/frame" },
    { name: "Floor Spring", spec: "Floor mounted closer, Double action, EN 1-4" },
    { name: "Auto Operator", spec: "Low energy swing door operator" }
  ],
  "Handles": [
    { name: "Lever Handle", spec: "Return to door safety lever, 19mm dia, SS" },
    { name: "Pull Handle", spec: "D-Handle, 300mm ctc, Bolt through" },
    { name: "Push Plate", spec: "Stainless steel push plate 300x75mm" },
    { name: "Flush Pull", spec: "Recessed flush pull, satin finish" }
  ],
  "Stops": [
    { name: "Door Stop", spec: "Floor mounted half-dome with rubber buffer" },
    { name: "Wall Stop", spec: "Wall mounted projection stop" },
    { name: "Overhead Stop", spec: "Concealed overhead stop/holder" }
  ],
  "Cylinders": [
    { name: "Cylinder", spec: "Euro Profile, Key/Key or Key/Turn" },
    { name: "Master Key Cylinder", spec: "GMK System, Restricted profile" }
  ],
  "Accessories": [
    { name: "Flush Bolt", spec: "Lever action flush bolt, 300mm" },
    { name: "Dust Proof Socket", spec: "Spring loaded dust proof socket" },
    { name: "Signage", spec: "Fire Door Keep Shut / Push / Pull" },
    { name: "Kick Plate", spec: "SS Kick Plate 150mm x Door Width" }
  ],
  "Seals": [
    { name: "Intumescent Seal", spec: "Fire & Smoke Seal, 15x4mm (Required for Fire Doors)" },
    { name: "Drop Seal", spec: "Automatic drop down seal, acoustic" },
    { name: "Threshold", spec: "Low profile DDA compliant threshold" }
  ]
};

const STANDARD_FINISHES = {
  "ANSI": ["SSS (US32D)", "PSS (US32)", "SCP (US26D)", "PVD Brass (US3)", "Oil Rubbed Bronze (US10B)", "Matte Black (US19)"],
  "EN": ["SSS (Satin Stainless)", "PSS (Polished Stainless)", "SAA (Satin Anodized Alum)", "PVD (Brass Effect)", "RAL Powdercoat", "Matte Black"]
};

// --- CUSTOM UI COMPONENTS ---

const HardwareIcon = ({ category }) => {
    // Simple 2D icons for the list view
    if (category === "Hinges") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="20" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
    if (category === "Locks") return <Lock size={16}/>;
    if (category === "Closers") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="10" height="6"/><path d="M12 7h8v10"/></svg>;
    if (category === "Handles") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h10a2 2 0 0 1 2 2v6"/><circle cx="4" cy="12" r="2"/></svg>;
    if (category === "Stops") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a8 8 0 0 0 0-16 8 8 0 0 0 0 16z"/><circle cx="12" cy="14" r="3"/></svg>;
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
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 flex flex-col">
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

// Feature 2 & 4: Improved Handing Visualizer (Detailed ANSI & EN)
const HandingSelector = ({ value, onChange, standard }) => {
  const ansiOptions = [
    { id: 'LH', label: 'Left Hand (LH)', desc: 'Hinges left, opens in' },
    { id: 'RH', label: 'Right Hand (RH)', desc: 'Hinges right, opens in' },
    { id: 'LHR', label: 'Left Hand Reverse (LHR)', desc: 'Hinges left, opens out' },
    { id: 'RHR', label: 'Right Hand Reverse (RHR)', desc: 'Hinges right, opens out' }
  ];

  const enOptions = [
    { id: 'LH', label: 'ISO 5 (Left)', desc: 'Hinges Left (Pull Side)' },
    { id: 'RH', label: 'ISO 6 (Right)', desc: 'Hinges Right (Pull Side)' }
  ];

  const options = standard === 'EN' ? enOptions : ansiOptions;

  // New detailed Icon based on image_7ed4e6.png
  const AnsiIcon = ({ mode }) => {
      // Setup
      // Canvas 100x100
      // Jambs: Brackets [ ]
      // Inside: Top
      // Door: Angled, Thick
      // Key side: Red Dot
      
      const jambColor = "#000";
      const doorFill = "white";
      const doorStroke = "black";
      
      // Jamb Path Helper
      const Jamb = ({ x, side }) => {
          // side 'left' means [, side 'right' means ]
          if (side === 'left') return <path d={`M ${x+10} 40 H ${x} V 60 H ${x+10}`} fill="none" stroke={jambColor} strokeWidth="2" />;
          return <path d={`M ${x-10} 40 H ${x} V 60 H ${x-10}`} fill="none" stroke={jambColor} strokeWidth="2" />;
      };

      // Inside Text
      const InsideText = () => <text x="50" y="20" textAnchor="middle" fontSize="10" fill="#333" fontWeight="bold">INSIDE</text>;

      let door = null;
      let dot = null;

      if (mode === 'LH' || mode === 'ISO 5 (Left)') {
          // Hinge Left, Open In (Up/Right)
          // Hinge Pivot approx (10, 50)
          // Door angles Up-Right
          door = <rect x="12" y="38" width="60" height="6" transform="rotate(-15 12 41)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
          // Red dot on key side (Outside face, bottom right tip)
          // Door tip is approx (70, 25). Outside face is the bottom edge of that rect.
          dot = <circle cx="70" cy="30" r="3" fill="red" />;
      } else if (mode === 'RH' || mode === 'ISO 6 (Right)') {
          // Hinge Right, Open In (Up/Left)
          // Hinge Pivot approx (90, 50)
          // Door angles Up-Left
          door = <rect x="28" y="38" width="60" height="6" transform="rotate(15 88 41)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
          // Red dot on key side (Outside face, bottom left tip)
          dot = <circle cx="30" cy="30" r="3" fill="red" />;
      } else if (mode === 'LHR') {
          // Hinge Left, Open Out (Down/Right)
          // Hinge Pivot approx (10, 50)
          // Door angles Down-Right
          door = <rect x="12" y="56" width="60" height="6" transform="rotate(15 12 59)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
          // Red dot on key side (Outside face, top tip?) 
          // Reverse bevel -> Key side is the side you pull from.
          // In diagram LHR, dot is on the TIP of the door, furthest from hinge.
          dot = <circle cx="70" cy="78" r="3" fill="red" />;
      } else if (mode === 'RHR') {
          // Hinge Right, Open Out (Down/Left)
          // Hinge Pivot approx (90, 50)
          // Door angles Down-Left
          door = <rect x="28" y="56" width="60" height="6" transform="rotate(-15 88 59)" fill={doorFill} stroke={doorStroke} strokeWidth="2" />;
          // Red dot on tip
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

  return (
    <div className={`grid ${standard === 'EN' ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
      {options.map((opt) => (
        <div 
          key={opt.id}
          onClick={() => onChange(opt.id === 'LH' || opt.id === 'ISO 5 (Left)' ? 'LH' : opt.id === 'RH' || opt.id === 'ISO 6 (Right)' ? 'RH' : opt.id)}
          className={`border rounded p-2 flex items-center gap-2 cursor-pointer transition-colors ${value === (opt.id.includes('Left') ? 'LH' : opt.id.includes('Right') ? 'RH' : opt.id) ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'hover:bg-gray-50 border-gray-200'}`}
        >
          <svg width="50" height="50" viewBox="0 0 100 100" className="text-gray-600 shrink-0 bg-white border border-gray-100 rounded">
             <AnsiIcon mode={standard === 'EN' ? opt.label : opt.id} />
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
  
  let doorFill = '#f9f9f9'; 
  let doorStroke = '#ccc';
  let frameColor = '#64748b';
  let frameStrokeWidth = 4;

  if (isGlass) {
    doorFill = '#e0f2fe'; 
    doorStroke = '#bae6fd';
    frameColor = 'none'; 
    frameStrokeWidth = 0;
  } else if (isAluminum) {
    doorFill = '#f0f9ff'; 
    doorStroke = '#94a3b8'; 
    frameColor = '#475569'; 
  } else if (isMetal) {
    doorFill = '#fca5a5'; 
    doorStroke = '#ef4444';
    frameColor = '#7f1d1d';
  } else {
    doorFill = '#d4a373'; 
    doorStroke = '#a98467';
    frameColor = '#8a6a4b';
  }
  
  const hasPanic = hardwareSet?.items?.some(i => i.type.includes('Panic'));
  const hasKick = hardwareSet?.items?.some(i => i.type.includes('Kick'));
  const hasCloser = hardwareSet?.items?.some(i => i.type.includes('Closer') || i.type.includes('Floor Spring'));
  const hasPull = hardwareSet?.items?.some(i => i.type.includes('Pull'));
  const isFloorSpring = hardwareSet?.items?.some(i => i.type.includes('Floor Spring'));

  const handing = door.handing || 'RH';
  const hingeSide = handing.startsWith('L') ? 'left' : 'right';

  const DoorLeaf = ({ x, leafHanding }) => {
    const leafHinge = leafHanding === 'LH' ? 'left' : 'right';
    const handleX = leafHinge === 'left' ? 75 : 15;
    
    return (
      <g transform={`translate(${x}, 0)`}>
        <rect x="5" y="5" width="90" height="190" fill={doorFill} stroke={doorStroke} strokeWidth="2" />
        {isAluminum && <rect x="15" y="15" width="70" height="170" fill="#e0f2fe" stroke={doorStroke} strokeWidth="1" />}
        {hasVision && !isGlass && !isAluminum && <rect x="25" y="30" width="50" height="80" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="2" />}
        
        {isFloorSpring && (
           <>
             <rect x="5" y="192" width="20" height="6" fill="#666" />
             <rect x="5" y="2" width="20" height="6" fill="#666" />
           </>
        )}

        {/* Closer Body & Arm */}
        {hasCloser && !isFloorSpring && (
          <g transform={leafHinge === 'left' ? "translate(10, 10)" : "translate(50, 10)"}>
            <rect x="0" y="0" width="30" height="10" fill="#475569" rx="1" />
            <path d={leafHinge === 'left' ? "M 15 5 L 45 25" : "M 15 5 L -15 25"} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        <g transform={`translate(${handleX}, 100)`}>
          {hasPanic ? (
            <rect x={leafHinge === 'left' ? -5 : -65} y="-5" width="70" height="12" rx="2" fill="#d1d5db" stroke="#6b7280" />
          ) : hasPull ? (
             <rect x="-2" y="-20" width="4" height="40" rx="2" fill="#64748b" />
          ) : (
            <g>
                <circle cx="0" cy="0" r="5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1"/> 
                <rect x={leafHinge === 'left' ? -12 : 2} y="-2" width="10" height="4" fill="#64748b" rx="1"/>
            </g>
          )}
        </g>

        {hasKick && <rect x="10" y="170" width="80" height="20" fill="url(#diagonalHatch)" stroke="#9ca3af" />}
        
        {/* Helper Pattern for Kickplate */}
        <defs>
            <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#cbd5e1" strokeWidth="1" />
            </pattern>
        </defs>

        <path 
            d={leafHinge === 'left' ? "M 5 5 L 85 100 L 5 195" : "M 95 5 L 15 100 L 95 195"} 
            fill="none" 
            stroke={isGlass ? "#60a5fa" : "#000"} 
            strokeOpacity="0.1" 
            strokeWidth="1" 
            strokeDasharray="4,2"
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="240" viewBox="0 0 220 240" className="bg-white rounded-lg border border-gray-100 shadow-sm p-2">
        <rect x="0" y="0" width={isDouble ? 220 : 120} height="200" fill="none" stroke={frameColor} strokeWidth={frameStrokeWidth} />
        {isDouble ? (
            <>
                <DoorLeaf x={10} leafHanding="LH" />
                <DoorLeaf x={110} leafHanding="RH" />
            </>
        ) : (
            <DoorLeaf x={10} leafHanding={hingeSide === 'left' ? 'LH' : 'RH'} />
        )}
      </svg>
      <div className="mt-2 text-xs text-gray-500 font-medium text-center">
        {door.config} {door.material} <br/>
        <span className="text-indigo-600 font-bold">{handing}</span> {hasVision ? '+ Vision' : ''}
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
        <div className="bg-white rounded-xl shadow-2xl p-6 border border-white/80 transform-3d-card animate-float">
          <div className="flex justify-between mb-4 border-b border-slate-100 pb-2">
            <div className="font-bold text-slate-800">Door Schedule</div>
            <div className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">ANSI Mode</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-100 rounded"></div>
            <div className="h-2 bg-slate-100 rounded"></div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600"><DoorClosed size={18} /></div>
            <div className="flex-1">
              <div className="h-1.5 w-3/5 bg-slate-400 rounded mb-1"></div>
              <div className="h-1 w-2/5 bg-slate-300 rounded"></div>
            </div>
            <div className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-bold border border-orange-100">45 min</div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500"><DoorOpen size={18} /></div>
            <div className="flex-1">
              <div className="h-1.5 w-1/2 bg-slate-300 rounded mb-1"></div>
              <div className="h-1 w-1/3 bg-slate-200 rounded"></div>
            </div>
            <div className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-xs font-bold border border-gray-100">NFR</div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const App = () => {
  // State
  const [view, setView] = useState('landing'); // landing, dashboard, wizard
  const [step, setStep] = useState(0);
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [isDoorModalOpen, setIsDoorModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('Architect'); // Architect, Owner, Contractor
  const [library, setLibrary] = useState([]); // Feature 5: Hardware Library
  
  // Door Modal State
  const [doorForm, setDoorForm] = useState({
    id: '', mark: '', location: '', qty: 1, 
    width: 900, height: 2100, weight: 45, 
    fire: 0, use: '', material: 'Timber', config: 'Single',
    thickness: 45, visionPanel: false, handing: 'RH'
  });
  
  // Validation State
  const [doorErrors, setDoorErrors] = useState({});
  const [doorHint, setDoorHint] = useState('');
  const [complianceNote, setComplianceNote] = useState(null);

  // Adding Item State
  const [addItemModal, setAddItemModal] = useState({ isOpen: false, setId: null });
  const [showAuditLog, setShowAuditLog] = useState(false);

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
      localStorage.setItem('specSmartDB', JSON.stringify({ projects, library }));
    }
  }, [projects, library]);

  // Run compliance check whenever door form changes
  useEffect(() => {
    if (isDoorModalOpen) {
      checkCompliance();
      updateThickness();
      // Enforce Glass Logic: No Vision Panel
      if (doorForm.material === 'Glass' && doorForm.visionPanel) {
          setDoorForm(prev => ({ ...prev, visionPanel: false }));
      }
    }
  }, [doorForm.fire, doorForm.use, doorForm.width, doorForm.weight, doorForm.location, doorForm.material]);

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

  const saveProjectDetails = (name, type, standard) => {
    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, name, type, standard } : p
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
    
    // Feature 2: Bulk Generation Logic
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

  const updateThickness = () => {
      let newThickness = 45;
      if (doorForm.material === 'Glass') {
          newThickness = 12;
      } else {
          const fire = parseInt(doorForm.fire);
          if (fire === 0 || fire === 20 || fire === 30) newThickness = 45;
          else if (fire === 45 || fire === 60) newThickness = 54;
          else if (fire >= 90) newThickness = 64;
      }

      if (doorForm.thickness !== newThickness) {
          setDoorForm(prev => ({ ...prev, thickness: newThickness }));
      }
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
        location: '', 
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
        handing: 'RH' // Default Handing
      });
    }
    setDoorErrors({});
    setDoorHint('');
    setComplianceNote(null);
    setIsDoorModalOpen(true);
  };

  // Hardware Logic
  const generateHardwareSets = () => {
    const proj = getProj();
    const defaultFinish = proj.standard === "ANSI" ? "SSS (US32D)" : "SSS (Satin Stainless)";
    const groups = {};

    proj.doors.forEach(d => {
      const key = `${d.use}|${d.fire}|${d.config}|${d.material}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    const newSets = Object.entries(groups).map(([key, doors], idx) => {
      const [use, fireStr, config, material] = key.split('|');
      const fire = parseInt(fireStr);
      const rep = doors.reduce((a, b) => a.weight > b.weight ? a : b);
      
      const setID = `HW-${String(idx + 1).padStart(2, '0')}`;
      let items = [];
      const addItem = (cat, ref, type, spec, qty) => items.push({ category: cat, ref, type, spec, qty, finish: defaultFinish });

      // SMART TEMPLATE LOGIC
      const locationLower = rep.location?.toLowerCase() || "";
      const useLower = use.toLowerCase();
      let operationText = "Door is self-closing and latching. Free egress at all times.";

      if (locationLower.includes("prayer") || useLower.includes("prayer")) {
          // Apply Prayer Room Template
          const template = SMART_TEMPLATES["prayer"];
          items = template.items.map((it, i) => ({
              ...it, ref: `${it.category[0]}0${i+1}`, finish: defaultFinish
          }));
          operationText = template.operation;
      } else if (locationLower.includes("server") || useLower.includes("server")) {
          // Apply Server Room Template
          const template = SMART_TEMPLATES["server"];
          items = template.items.map((it, i) => ({
              ...it, ref: `${it.category[0]}0${i+1}`, finish: defaultFinish
          }));
          operationText = template.operation;
      } else {
          // DEFAULT LOGIC ENGINE
          if (material === "Glass") {
              addItem("Hinges", "P01", "Patch Fitting", "Top & Bottom Patch Fitting Set, SS", "1 Set");
              if (useLower.includes("toilet") || useLower.includes("restroom")) {
                   addItem("Locks", "L01", "Patch Lock", "Corner Patch Lock with Coin Release", "1");
                   addItem("Locks", "L02", "Glass Strike Box", "Glass mounted strike box", "1");
              } else if (useLower.includes("storage") || useLower.includes("service")) {
                   addItem("Locks", "L01", "Patch Lock", "Corner Patch Lock with Cylinder", "1");
                   addItem("Handles", "H01", "Pull Handle", "Back-to-back H-Handle, 600mm", "1 Pr");
              } else {
                   addItem("Locks", "L01", "Patch Lock", "Corner Patch Lock with Cylinder", "1");
                   addItem("Handles", "H01", "Pull Handle", "Back-to-back H-Handle, 1200mm", "1 Pr");
              }
              addItem("Closers", "D01", "Floor Spring", "Double Action Floor Spring, EN 1-4", "1");
              operationText = "Door is double acting, self-closing via floor spring.";
          } else {
              if (rep.weight > 150) {
                addItem("Hinges", "P01", "Pivot Set", `Heavy Duty Pivot Set, ${rep.weight}kg Capacity`, "1 Set");
              } else {
                const hType = proj.standard === "ANSI" ? "4.5x4.5 Ball Bearing" : "102x76x3 Ball Bearing";
                addItem("Hinges", "H01", "Butt Hinge", `${hType}`, "3");
              }
              if (useLower.includes("toilet") || useLower.includes("restroom") || useLower.includes("bathroom")) {
                addItem("Locks", "L01", "Bathroom Lock", "Privacy function, coin release", "1");
              } else if (useLower.includes("stair") || useLower.includes("exit")) {
                addItem("Locks", "L01", "Panic Bar", "Rim Exit Device, Fire Rated", "1");
              } else if (useLower.includes("storage") || useLower.includes("service")) {
                 addItem("Locks", "L01", "Deadbolt", "Deadbolt only, Cylinder/Turn", "1");
                 addItem("Handles", "H01", "Pull Handle", "D-Pull on push side", "1");
                 addItem("Handles", "H02", "Push Plate", "SS Push Plate", "1");
              } else {
                addItem("Locks", "L01", "Mortise Lock", "Sashlock case, Cylinder operation", "1");
                addItem("Cylinders", "C01", "Cylinder", "Euro Profile, Key/Turn", "1");
                addItem("Handles", "H02", "Lever Handle", "Return to door safety lever", "1 Pr");
              }
              if (!useLower.includes("toilet") && !useLower.includes("storage")) {
                const cSpec = rep.width > 1100 ? "Size 3-6 Heavy Duty" : "Size 2-4 Adjustable";
                addItem("Closers", "D01", "Overhead Closer", `Surface, ${cSpec}, Backcheck`, "1");
              }
              addItem("Stops", "S01", "Door Stop", "Floor mounted half-dome", "1");
          }
      }

      return {
        id: setID,
        name: `${use} Door (${material}) - ${fire > 0 ? fire + 'min' : 'NFR'}`,
        doors: doors.map(d => d.id),
        items,
        operation: operationText
      };
    });

    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, sets: newSets } : p
    );
    setProjects(updatedProjects);
    addToAuditLog(currentId, `Generated ${newSets.length} hardware sets`);
    setStep(2);
  };

  const updateSetItem = (setId, idx, field, val) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            const newItems = [...s.items];
            newItems[idx] = { ...newItems[idx], [field]: val };
            if (field === 'type') {
              const cat = newItems[idx].category || "Hinges";
              const sub = PRODUCT_SUBTYPES[cat]?.find(x => x.name === val);
              if (sub) newItems[idx].spec = sub.spec;
            }
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
    const defaultFinish = proj.standard === "ANSI" ? "SSS (US32D)" : "SSS (Satin Stainless)";
    const subtype = PRODUCT_SUBTYPES[category]?.find(s => s.name === type);
    const spec = subtype ? subtype.spec : "";
    
    let refPrefix = "X";
    if(category === "Hinges") refPrefix = "H";
    if(category === "Locks") refPrefix = "L";
    if(category === "Closers") refPrefix = "D";
    if(category === "Handles") refPrefix = "H";
    if(category === "Stops") refPrefix = "S";
    if(category === "Seals") refPrefix = "GS";
    
    const count = proj.sets.find(s => s.id === addItemModal.setId).items.filter(i => i.category === category).length;
    const ref = `${refPrefix}${String(count + 2).padStart(2, '0')}`;

    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === addItemModal.setId) {
            return {
              ...s,
              items: [...s.items, { category, ref, type, spec, qty: "1", finish: defaultFinish }]
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

  const exportData = () => {
    const p = getProj();
    const itemData = [];
    p.sets.forEach(s => {
      s.items.forEach(i => {
        itemData.push({ 
            "Set": s.id, "Set Name": s.name, "Ref": i.ref, 
            "Category": i.category, "Type": i.type, "Finish": i.finish, 
            "Spec": i.spec, "Qty": i.qty 
        });
      });
    });

    if (itemData.length === 0) { alert("No hardware sets to export."); return; }

    const headers = Object.keys(itemData[0]);
    const csvContent = [
      headers.join(','),
      ...itemData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadCSV(csvContent, `${p.name.replace(/\s+/g, '_')}_HardwareSpecs.csv`);
  };

  // Feature 7: BIM Export
  const exportBIMData = () => {
    const p = getProj();
    const bimRows = p.doors.map(d => ({
        "Mark": d.mark,
        "IfcDoorStyle": d.config,
        "Width": d.width,
        "Height": d.height,
        "FireRating": d.fire,
        "AcousticRating": "N/A", // Placeholder
        "HardwareSet": p.sets.find(s => s.doors.includes(d.id))?.id || "None"
    }));

    const headers = Object.keys(bimRows[0]);
    const csvContent = [
      headers.join(','),
      ...bimRows.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadCSV(csvContent, `${p.name.replace(/\s+/g, '_')}_BIM_SharedParams.csv`);
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

  // --- VIEWS ---

  if (view === 'landing') {
    return <LandingPage onStart={() => setView(projects.length > 0 ? 'dashboard' : 'dashboard')} hasProjects={projects.length > 0} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Global Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-gray-900">
          <ShieldCheck className="text-indigo-600" />
          <span>SpecSmart</span>
        </div>
        <div className="flex gap-4 items-center">
            {/* Feature 8: Role Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <UserCircle size={16} className="text-gray-500" />
                <select 
                    value={userRole} 
                    onChange={(e) => setUserRole(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                >
                    <option value="Architect">Architect View</option>
                    <option value="Owner">Owner View</option>
                    <option value="Contractor">Contractor View</option>
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
            <button onClick={() => { saveProjectDetails(getProj().name, getProj().type, getProj().standard); alert("Saved locally"); }} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <Save size={16} /> Save
            </button>
            <button onClick={() => setView('dashboard')} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <X size={16} /> Close
            </button>
          </div>
        </div>
      )}

      {/* Feature 10: Audit Log Viewer */}
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
            <div className="flex justify-center mb-6 md:mb-10 relative overflow-x-auto pb-2">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 hidden md:block w-full"></div>
              <div className="flex gap-8 md:gap-16 min-w-max px-4">
                {['Setup', 'Schedule', 'Hardware', 'Review'].map((label, idx) => (
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
                <h2 className="text-xl font-bold mb-6">Project Details</h2>
                {/* Simplified view for Owners */}
                {userRole === 'Owner' && <div className="bg-blue-50 text-blue-800 p-3 rounded mb-4 text-sm">You are viewing as Owner. Technical settings are simplified.</div>}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-gray-600">Project Name</label>
                    <input 
                      type="text" 
                      value={getProj().name} 
                      onChange={(e) => {
                        const updated = projects.map(p => p.id === currentId ? {...p, name: e.target.value} : p);
                        setProjects(updated);
                      }}
                      className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase text-gray-600">Facility Type</label>
                      <select 
                        value={getProj().type}
                        onChange={(e) => {
                          const updated = projects.map(p => p.id === currentId ? {...p, type: e.target.value} : p);
                          setProjects(updated);
                        }}
                        className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none w-full bg-white"
                      >
                        {Object.keys(FACILITY_DATA).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Hide Standard Mode for Owners to simplify UI */}
                    {userRole !== 'Owner' && (
                        <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">Standard Mode</label>
                        <select 
                            value={getProj().standard}
                            onChange={(e) => {
                            const updated = projects.map(p => p.id === currentId ? {...p, standard: e.target.value} : p);
                            setProjects(updated);
                            }}
                            className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none w-full bg-white"
                        >
                            <option value="ANSI">ANSI / BHMA (US)</option>
                            <option value="EN">EN / ISO (EU)</option>
                        </select>
                        </div>
                    )}
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
                    <table className="w-full table-clean min-w-[800px]">
                      <thead>
                        <tr>
                          <th className="text-left p-3 border-b">Mark</th>
                          <th className="text-left p-3 border-b">Location</th>
                          <th className="text-left p-3 border-b">Qty</th>
                          <th className="text-left p-3 border-b">WxH (mm)</th>
                          <th className="text-left p-3 border-b">Thk</th>
                          <th className="text-left p-3 border-b">Weight</th>
                          <th className="text-left p-3 border-b">Fire</th>
                          <th className="text-left p-3 border-b">Type</th>
                          <th className="text-left p-3 border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getProj().doors.map(d => (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="p-3 border-b font-bold text-indigo-600">{d.mark}</td>
                            <td className="p-3 border-b">{d.location}</td>
                            <td className="p-3 border-b">{d.qty}</td>
                            <td className="p-3 border-b">{d.width} x {d.height}</td>
                            <td className="p-3 border-b text-gray-500">{d.thickness}mm</td>
                            <td className="p-3 border-b">{d.weight} kg</td>
                            <td className="p-3 border-b"><span className={`px-2 py-0.5 rounded text-xs font-bold ${d.fire > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{d.fire} min</span></td>
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
                                <div className="min-w-[600px]">
                                    <div className="grid grid-cols-[30px_60px_180px_1fr_60px_40px] bg-gray-50 border-b border-gray-200 p-3 text-xs font-bold text-gray-500 uppercase">
                                    <div></div><div>Ref</div><div>Product Type</div><div>Specification</div><div>Qty</div><div></div>
                                    </div>
                                    {s.items.map((item, idx) => {
                                    const cat = item.category || "Hinges";
                                    const options = PRODUCT_SUBTYPES[cat] || PRODUCT_SUBTYPES["Hinges"];

                                    return (
                                        <div key={idx} className="grid grid-cols-[30px_60px_180px_1fr_60px_40px] border-b border-gray-100 p-2 items-center hover:bg-gray-50 relative">
                                        <div className="flex justify-center text-gray-400"><HardwareIcon category={cat} /></div>
                                        {/* Owner View: Read Only */}
                                        {userRole === 'Owner' ? (
                                            <>
                                                <div className="text-sm font-medium text-gray-900">{item.ref}</div>
                                                <div className="text-sm text-gray-600">{item.type}</div>
                                                <div className="text-sm text-gray-500">{item.spec}</div>
                                                <div className="text-sm text-gray-900">{item.qty}</div>
                                                <div></div>
                                            </>
                                        ) : (
                                            <>
                                                <input type="text" value={item.ref} onChange={(e) => updateSetItem(s.id, idx, 'ref', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                <select value={item.type} onChange={(e) => updateSetItem(s.id, idx, 'type', e.target.value)} className="w-full p-1 border rounded text-xs bg-white">
                                                    {options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                                                </select>
                                                <input type="text" value={item.spec} onChange={(e) => updateSetItem(s.id, idx, 'spec', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                <input type="text" value={item.qty} onChange={(e) => updateSetItem(s.id, idx, 'qty', e.target.value)} className="w-full p-1 border rounded text-xs" />
                                                <button onClick={() => deleteSetItem(s.id, idx)} className="text-red-400 hover:text-red-600 flex justify-center p-2"><Trash2 size={14}/></button>
                                            </>
                                        )}
                                        </div>
                                    );
                                    })}
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
                      {/* Feature 7: BIM Export */}
                      {userRole !== 'Owner' && (
                        <button onClick={exportBIMData} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                            <Box size={18} /> Export BIM Data
                        </button>
                      )}
                      <button onClick={exportData} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 shadow-sm">
                        <FileSpreadsheet size={18} /> Export Schedule
                      </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Doors</div>
                    <div className="text-3xl font-bold text-gray-900">{getProj().doors.length}</div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Hardware Sets</div>
                    <div className="text-3xl font-bold text-indigo-600">{getProj().sets.length}</div>
                  </div>
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <div className="text-xs font-bold text-red-500 uppercase mb-1">Issues</div>
                    <div className="text-3xl font-bold text-red-600">{getProj().doors.filter(d => !getProj().sets.find(s => s.doors.includes(d.id))).length}</div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full table-clean min-w-[600px]">
                    <thead>
                      <tr>
                        <th className="text-left p-3 border-b">Set ID</th>
                        <th className="text-left p-3 border-b">Set Name</th>
                        <th className="text-left p-3 border-b">Doors</th>
                        <th className="text-left p-3 border-b">Items</th>
                        <th className="text-left p-3 border-b">Fire Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProj().sets.map(s => {
                        const doorCount = getProj().doors.filter(d => s.doors.includes(d.id)).length;
                        const repDoor = getProj().doors.find(d => s.doors.includes(d.id));
                        const fire = repDoor ? repDoor.fire : 0;
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="p-3 border-b font-bold">{s.id}</td>
                            <td className="p-3 border-b">{s.name}</td>
                            <td className="p-3 border-b">{doorCount}</td>
                            <td className="p-3 border-b">{s.items.length}</td>
                            <td className="p-3 border-b"><span className={`px-2 py-0.5 rounded text-xs font-bold ${fire > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{fire} min</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Door Modal Overlay */}
      {isDoorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Door</h3>
              <button onClick={() => setIsDoorModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Mark</label>
                  <input type="text" value={doorForm.mark} onChange={e => setDoorForm({...doorForm, mark: e.target.value})} className="p-2.5 border rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Location</label>
                  <SearchableDropdown 
                    options={FACILITY_DATA[getProj().type]?.locations || []}
                    value={doorForm.location}
                    onChange={(val) => setDoorForm({...doorForm, location: val})}
                    placeholder="Select or type..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Qty</label>
                  <input type="number" value={doorForm.qty} onChange={e => setDoorForm({...doorForm, qty: parseInt(e.target.value) || 0})} className="p-2.5 border rounded" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs font-bold uppercase text-gray-400 mb-4">Physical Dimensions</div>
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
                    <label className="text-xs font-bold uppercase text-gray-500">Weight (kg)</label>
                    <input type="number" value={doorForm.weight} onChange={e => {setDoorForm({...doorForm, weight: e.target.value}); validatePhysics('weight', e.target.value);}} className="w-full p-2.5 border rounded" />
                  </div>
                </div>
                {doorHint && <div className="mt-2 text-orange-600 text-sm bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2"><AlertTriangle size={14}/> {doorHint}</div>}
              </div>

              {/* Handing Selector */}
              <div className="mt-4">
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
                      ? <><option value="0">Non-Rated</option><option value="20">20 min</option><option value="45">45 min</option><option value="90">90 min</option><option value="180">3 Hour</option></>
                      : <><option value="0">None</option><option value="30">E30</option><option value="60">E60</option><option value="90">E90</option><option value="120">E120</option></>
                    }
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Usage</label>
                  <select value={doorForm.use} onChange={e => setDoorForm({...doorForm, use: e.target.value})} className="w-full p-2.5 border rounded bg-white">
                    {FACILITY_DATA[getProj().type]?.usages.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
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
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button onClick={saveDoor} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">Save Door</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addItemModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold">Add Hardware Item</h3>
              <button onClick={() => setAddItemModal({ isOpen: false, setId: null })} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6">
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-6 flex gap-3 items-start">
                <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-orange-800 leading-relaxed">
                  <strong>Code Compliance Warning:</strong> Adding manual items may affect the fire rating.
                </p>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {Object.entries(PRODUCT_SUBTYPES).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{category}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map((item) => (
                        <button key={item.name} onClick={() => addNewItem(category, item.name)} className="text-left px-4 py-3 border border-gray-100 rounded hover:border-indigo-600 hover:bg-indigo-50 transition-colors group w-full">
                          <div className="font-medium text-gray-800 group-hover:text-indigo-600">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate">{item.spec}</div>
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
