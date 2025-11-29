import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldCheck, LayoutGrid, PlusCircle, FolderOpen, Trash2, 
  Globe, Building, Save, X, Copy, Pencil, DoorClosed, 
  DoorOpen, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, 
  Brain, Check, AlertTriangle, Calculator, Eye, DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- DATA FROM CSV ---
const CSV_TEMPLATES = [
  // Commercial Office
  { facility: "Commercial Office", usage: "Main Entrance", config: "Double", fire: true, name: "Office Main Entry Security Set", notes: "Access control, Auto operator" },
  { facility: "Commercial Office", usage: "Meeting Room", config: "Single", fire: false, name: "Office Privacy Set", notes: "Sound seal, Privacy lock" },
  { facility: "Commercial Office", usage: "Server / IT Room", config: "Single", fire: true, name: "Server Room Secure Set", notes: "Electronic lock, Closer, Auto-lock" },
  { facility: "Commercial Office", usage: "Restroom", config: "Single", fire: false, name: "Standard WC Set", notes: "Privacy indicator, Kick plate" },
  { facility: "Commercial Office", usage: "Fire Exit", config: "Single", fire: true, name: "Emergency Exit Panic Set", notes: "Panic bar, Closer" },
  
  // Healthcare
  { facility: "Hospital / Healthcare", usage: "Patient Room", config: "Single", fire: false, name: "Healthcare Patient Passage Set", notes: "Anti-ligature, Roller latch" },
  { facility: "Hospital / Healthcare", usage: "ICU / Recovery Room", config: "Double", fire: false, name: "Healthcare ICU Set", notes: "Push/pull plates, Hold open" },
  { facility: "Hospital / Healthcare", usage: "Operation Theatre", config: "Single", fire: true, name: "Sterile Area Sealed Set", notes: "Auto operator, Touchless" },
  { facility: "Hospital / Healthcare", usage: "Fire Exit", config: "Single", fire: true, name: "Healthcare Panic Exit Set", notes: "Panic device, Closer" },
  { facility: "Hospital / Healthcare", usage: "Staff Only / Med Storage", config: "Single", fire: true, name: "Restricted Access Set", notes: "Access control, Closer" },

  // Education
  { facility: "Education / School", usage: "Classroom", config: "Single", fire: true, name: "School Classroom Lockdown Set", notes: "Classroom function lock, Closer" },
  { facility: "Education / School", usage: "Admin Office", config: "Single", fire: false, name: "School Office Privacy Set", notes: "Lever lock, Stop" },
  { facility: "Education / School", usage: "Library", config: "Double", fire: false, name: "School Common Area Set", notes: "Pull handles, Closer" },
  { facility: "Education / School", usage: "Fire Exit", config: "Single", fire: true, name: "School Panic Exit Set", notes: "Panic bar, Closer" },
  { facility: "Education / School", usage: "Restroom", config: "Single", fire: false, name: "School WC Standard Set", notes: "Privacy indicator, Kick plate" },

  // Airport
  { facility: "Airport / Transport", usage: "Security Zone Access", config: "Single", fire: true, name: "High Security Access Control Set", notes: "Card reader, Electric strike" },
  { facility: "Airport / Transport", usage: "Baggage Handling", config: "Double", fire: true, name: "Industrial Duty Set", notes: "Heavy duty hinges, Protection plates" },
  { facility: "Airport / Transport", usage: "Passenger WC", config: "Single", fire: false, name: "Airport WC Set", notes: "Indicator, Auto operator" },
  { facility: "Airport / Transport", usage: "Fire Exit", config: "Single", fire: true, name: "Transport Panic Exit Set", notes: "Panic device, Alarm" },
  { facility: "Airport / Transport", usage: "Office / Staff Room", config: "Single", fire: false, name: "Standard Passage Set", notes: "Lever set, Stop" },

  // Hotel
  { facility: "Hospitality / Hotel", usage: "Guest Room Entry", config: "Single", fire: true, name: "Hotel Smart Lock Set", notes: "Electronic lock, Closer, Viewer" },
  { facility: "Hospitality / Hotel", usage: "Back of House", config: "Single", fire: false, name: "Hotel Service Area Set", notes: "Kick plate, Armor plate" },
  { facility: "Hospitality / Hotel", usage: "Ballroom Entrance", config: "Double", fire: true, name: "Hotel Grand Entry Set", notes: "Concealed closer, Flush bolts" },
  { facility: "Hospitality / Hotel", usage: "Fire Exit", config: "Single", fire: true, name: "Hotel Panic Exit Set", notes: "Panic bar, Closer" },
  { facility: "Hospitality / Hotel", usage: "Public Restroom", config: "Single", fire: false, name: "Hotel WC Set", notes: "Closer, Push/Pull" },

  // Residential
  { facility: "Residential", usage: "Main Entrance", config: "Single", fire: true, name: "Residential Secure Entry Set", notes: "Deadbolt, Viewer" },
  { facility: "Residential", usage: "Bedroom", config: "Single", fire: false, name: "Residential Privacy Set", notes: "Privacy lock" },
  { facility: "Residential", usage: "Bathroom", config: "Single", fire: false, name: "Residential WC Privacy Set", notes: "Privacy lock" },
  { facility: "Residential", usage: "Garage Entrance", config: "Single", fire: true, name: "Garage Duty Set", notes: "Self-closing, Deadbolt" },
  { facility: "Residential", usage: "Patio / Balcony Doors", config: "Double", fire: false, name: "Residential Patio Set", notes: "Multi-point lock" }
];

// Extract unique usages for dropdowns
const GET_USAGES_FOR_FACILITY = (facility) => {
  return CSV_TEMPLATES.filter(t => t.facility === facility).map(t => t.usage);
};

const PRODUCT_SUBTYPES = {
  "Hinges": [
    { name: "Butt Hinge", spec: "4.5x4.5 Ball Bearing, Stainless Steel", price: 15 },
    { name: "Concealed Hinge", spec: "3D Adjustable, Satin Chrome", price: 45 },
    { name: "Pivot Set", spec: "Heavy Duty Floor Pivot, Double Action", price: 250 },
    { name: "Geared Hinge", spec: "Continuous Geared, Full Mortise", price: 120 }
  ],
  "Locks": [
    { name: "Mortise Lock", spec: "Sashlock case, Cylinder operation", price: 85 },
    { name: "Deadbolt", spec: "Heavy Duty Deadbolt, Thumbturn", price: 40 },
    { name: "Electronic Lock", spec: "Card Reader / Keypad Access", price: 450 },
    { name: "Bathroom Lock", spec: "Privacy function, coin release", price: 55 },
    { name: "Panic Bar", spec: "Rim Exit Device, Fire Rated", price: 280 }
  ],
  "Closers": [
    { name: "Overhead Closer", spec: "Surface mounted, Size 2-5, Backcheck", price: 110 },
    { name: "Cam Action Closer", spec: "Slide arm, High efficiency", price: 160 },
    { name: "Concealed Closer", spec: "Integrated in door leaf", price: 220 },
    { name: "Floor Spring", spec: "Floor mounted, Double action", price: 300 },
    { name: "Auto Operator", spec: "Low energy swing operator", price: 1200 }
  ],
  "Handles": [
    { name: "Lever Handle", spec: "Return to door safety lever, SS", price: 35 },
    { name: "Pull Handle", spec: "D-Handle, 300mm ctc", price: 45 },
    { name: "Push Plate", spec: "Stainless steel push plate", price: 15 },
    { name: "Flush Pull", spec: "Recessed flush pull", price: 25 }
  ],
  "Stops": [
    { name: "Door Stop", spec: "Floor mounted half-dome", price: 8 },
    { name: "Wall Stop", spec: "Wall mounted projection", price: 8 },
    { name: "Overhead Stop", spec: "Concealed overhead holder", price: 65 }
  ],
  "Cylinders": [
    { name: "Cylinder", spec: "Euro Profile, Key/Turn", price: 30 },
    { name: "Master Key Cylinder", spec: "GMK System Restricted", price: 55 }
  ],
  "Accessories": [
    { name: "Flush Bolt", spec: "Lever action flush bolt", price: 25 },
    { name: "Kick Plate", spec: "SS 150mm x Door Width", price: 40 },
    { name: "Signage", spec: "Fire Door Keep Shut", price: 12 },
    { name: "Viewer", spec: "Door Viewer 180 deg", price: 15 }
  ],
  "Seals": [
    { name: "Intumescent Seal", spec: "Fire & Smoke Seal", price: 5 },
    { name: "Drop Seal", spec: "Automatic drop down", price: 45 }
  ]
};

const STANDARD_FINISHES = {
  "ANSI": ["SSS (US32D)", "PSS (US32)", "SCP (US26D)", "PVD Brass (US3)", "Oil Rubbed Bronze (US10B)", "Matte Black (US19)"],
  "EN": ["SSS (Satin Stainless)", "PSS (Polished Stainless)", "SAA (Satin Anodized Alum)", "PVD (Brass Effect)", "RAL Powdercoat", "Matte Black"]
};

// --- COMPONENTS ---

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
        className="w-full p-2.5 border border-gray-300 rounded-md bg-white flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
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
                className="w-full pl-8 p-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-primary"
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
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${value === opt ? 'bg-indigo-50 text-primary font-medium' : 'text-gray-700'}`}
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
                className="px-4 py-2 text-sm text-primary cursor-pointer hover:bg-indigo-50 font-medium border-t border-gray-100"
                onClick={() => {
                  onChange(filter);
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

const DoorVisualizer = ({ config, items }) => {
  const isDouble = config === "Double";
  const hasCloser = items.some(i => i.type.includes("Closer"));
  const hasPanic = items.some(i => i.type.includes("Panic"));
  const hasKick = items.some(i => i.type.includes("Kick"));
  const hasVision = items.some(i => i.type.includes("Vision") || i.type.includes("Viewer"));

  return (
    <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        {hasCloser && <div className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-200">Closer</div>}
        {hasPanic && <div className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded border border-red-200">Panic</div>}
      </div>
      
      <div className={`relative h-40 border-4 border-gray-400 bg-white shadow-sm flex ${isDouble ? 'w-56' : 'w-28'}`}>
        {/* Door Leaf 1 */}
        <div className="flex-1 border-r border-gray-200 relative">
          {hasCloser && <div className="absolute top-2 right-2 w-8 h-2 bg-gray-300 rounded -rotate-12 origin-right"></div>}
          {hasPanic ? (
            <div className="absolute top-1/2 left-2 right-2 h-3 bg-gray-300 rounded border border-gray-400"></div>
          ) : (
            <div className="absolute top-1/2 right-2 w-2 h-4 bg-gray-400 rounded-sm"></div> // Handle
          )}
          {hasVision && <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-12 border border-gray-300 bg-blue-50"></div>}
          {hasKick && <div className="absolute bottom-2 left-2 right-2 h-6 bg-gray-200 border border-gray-300"></div>}
        </div>
        
        {/* Door Leaf 2 (If Double) */}
        {isDouble && (
          <div className="flex-1 relative">
             {hasCloser && <div className="absolute top-2 left-2 w-8 h-2 bg-gray-300 rounded rotate-12 origin-left"></div>}
             {hasPanic ? (
                <div className="absolute top-1/2 left-2 right-2 h-3 bg-gray-300 rounded border border-gray-400"></div>
              ) : (
                <div className="absolute top-1/2 left-2 w-2 h-4 bg-gray-400 rounded-sm"></div>
              )}
             {hasKick && <div className="absolute bottom-2 left-2 right-2 h-6 bg-gray-200 border border-gray-300"></div>}
          </div>
        )}
      </div>
      <div className="absolute bottom-2 text-xs text-gray-400 uppercase tracking-widest">{isDouble ? "Pair" : "Single"}</div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState('landing');
  const [step, setStep] = useState(0);
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [isDoorModalOpen, setIsDoorModalOpen] = useState(false);
  const [doorForm, setDoorForm] = useState({ id: '', mark: '', location: '', qty: 1, width: 900, height: 2100, weight: 45, fire: 0, use: '', material: 'Timber', config: 'Single' });
  const [doorErrors, setDoorErrors] = useState({});
  const [doorHint, setDoorHint] = useState('');
  const [complianceNote, setComplianceNote] = useState(null);
  const [addItemModal, setAddItemModal] = useState({ isOpen: false, setId: null });

  useEffect(() => {
    const saved = localStorage.getItem('specSmartDB');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.projects) setProjects(data.projects);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0 || view !== 'landing') {
      localStorage.setItem('specSmartDB', JSON.stringify({ projects }));
    }
  }, [projects]);

  useEffect(() => {
    if (isDoorModalOpen) checkCompliance();
  }, [doorForm.fire, doorForm.use, doorForm.width, doorForm.location]);

  const getProj = () => projects.find(p => p.id === currentId);

  const createProject = () => {
    const id = crypto.randomUUID();
    const newProj = { id, name: "New Project", type: "Commercial Office", standard: "ANSI", doors: [], sets: [] };
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
    if(confirm("Delete project?")) setProjects(projects.filter(p => p.id !== id));
  };

  const saveProjectDetails = (name, type, standard) => {
    const updatedProjects = projects.map(p => p.id === currentId ? { ...p, name, type, standard } : p);
    setProjects(updatedProjects);
    setStep(1);
  };

  const saveDoor = () => {
    if (Object.keys(doorErrors).length > 0) return;
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newDoors = [...p.doors];
        const doorId = doorForm.id || crypto.randomUUID();
        const doorData = { ...doorForm, id: doorId };
        const idx = newDoors.findIndex(d => d.id === doorForm.id);
        if (idx >= 0) newDoors[idx] = doorData;
        else newDoors.push(doorData);
        return { ...p, doors: newDoors };
      }
      return p;
    });
    setProjects(updatedProjects);
    setIsDoorModalOpen(false);
  };

  const deleteDoor = (doorId) => {
    setProjects(projects.map(p => p.id === currentId ? { ...p, doors: p.doors.filter(d => d.id !== doorId) } : p));
  };

  const duplicateDoor = (doorId) => {
    const proj = getProj();
    const original = proj.doors.find(d => d.id === doorId);
    const copy = { ...original, id: crypto.randomUUID(), mark: original.mark + "-COPY" };
    setProjects(projects.map(p => p.id === currentId ? { ...p, doors: [...p.doors, copy] } : p));
  };

  const checkCompliance = () => {
    let note = null;
    const useLower = doorForm.use.toLowerCase();
    const isFireRated = doorForm.fire > 0;
    
    // Check against CSV Template Requirements
    const template = CSV_TEMPLATES.find(t => t.facility === getProj().type && t.usage === doorForm.use);
    
    if (template) {
      if (template.fire && !isFireRated) {
        note = { type: 'warning', msg: `Code Alert: Standard for "${doorForm.use}" requires a Fire Rating.` };
      }
    }

    if (!note && (useLower.includes('stair') || useLower.includes('exit')) && !isFireRated) {
      note = { type: 'warning', msg: "Stairwell/Exit doors typically require a Fire Rating." };
    }
    
    if (doorForm.width < 850 && (useLower.includes('patient') || useLower.includes('accessible'))) {
      note = { type: 'info', msg: "Accessibility: Clear width might be too narrow (<850mm)." };
    }

    setComplianceNote(note);
  };

  const validatePhysics = (field, value) => {
    const errors = { ...doorErrors };
    let hint = '';
    if (field === 'width' || field === 'all') {
      const val = field === 'all' ? doorForm.width : value;
      if (val < 600 || val > 1300) errors.width = "Width 600-1300mm";
      else delete errors.width;
      if (val > 1100) hint = "Wide door (>1100mm). HD Closers advised.";
    }
    setDoorErrors(errors);
    setDoorHint(hint);
  };

  const openDoorModal = (door = null) => {
    const proj = getProj();
    const facilityUsages = GET_USAGES_FOR_FACILITY(proj.type);
    
    if (door) {
      setDoorForm({ ...door });
    } else {
      setDoorForm({
        id: '', mark: `D-${(proj.doors.length + 1).toString().padStart(3, '0')}`,
        location: '', qty: 1, width: 900, height: 2100, weight: 45, fire: 0, 
        use: facilityUsages[0] || "", material: 'Timber', config: 'Single'
      });
    }
    setDoorErrors({});
    setDoorHint('');
    setComplianceNote(null);
    setIsDoorModalOpen(true);
  };

  // --- SMART HARDWARE GENERATION ---
  const generateHardwareSets = () => {
    const proj = getProj();
    const defaultFinish = proj.standard === "ANSI" ? "SSS (US32D)" : "SSS (Satin Stainless)";
    const groups = {};

    proj.doors.forEach(d => {
      const key = `${d.use}|${d.fire}|${d.config}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    const newSets = Object.entries(groups).map(([key, doors], idx) => {
      const [use, fireStr, config] = key.split('|');
      const fire = parseInt(fireStr);
      const rep = doors.reduce((a, b) => a.weight > b.weight ? a : b);
      const setID = `HW-${String(idx + 1).padStart(2, '0')}`;
      const items = [];
      
      const addItem = (cat, ref, type, spec, qty, price) => 
        items.push({ category: cat, ref, type, spec, qty, finish: defaultFinish, price: price || 0 });

      // 1. Try to find a CSV Template Match
      const template = CSV_TEMPLATES.find(t => t.facility === proj.type && t.usage === use && t.config === config);
      const setName = template ? template.name : `${use} Door - ${fire > 0 ? fire + 'min' : 'NFR'}`;
      const notes = template ? template.notes.toLowerCase() : "";

      // 2. Build Items based on Rules & Notes
      
      // Hinges
      if (rep.weight > 150) {
        addItem("Hinges", "P01", "Pivot Set", `Heavy Duty Pivot, ${rep.weight}kg`, "1 Set", 250);
      } else {
        const hType = proj.standard === "ANSI" ? "4.5x4.5 Ball Bearing" : "102x76x3 Ball Bearing";
        addItem("Hinges", "H01", "Butt Hinge", hType, "3", 15);
      }

      // Locks via Notes or Usage
      if (notes.includes("electronic") || notes.includes("access control")) {
        addItem("Locks", "L01", "Mortise Lock", "Sashlock for Access Control", "1", 120);
        addItem("Locks", "E01", "Electronic Lock", "Card Reader / Keypad", "1", 450);
      } else if (notes.includes("panic")) {
        addItem("Locks", "L01", "Panic Bar", "Rim Exit Device", "1", 280);
      } else if (notes.includes("privacy")) {
        addItem("Locks", "L01", "Bathroom Lock", "Privacy function", "1", 55);
      } else {
        addItem("Locks", "L01", "Mortise Lock", "Sashlock case", "1", 85);
        addItem("Cylinders", "C01", "Cylinder", "Euro Profile", "1", 30);
        addItem("Handles", "H02", "Lever Handle", "Safety lever", "1 Pr", 35);
      }

      // Closers
      if (notes.includes("auto operator")) {
        addItem("Closers", "D01", "Auto Operator", "Low energy swing", "1", 1200);
      } else if (fire > 0 || notes.includes("closer")) {
        addItem("Closers", "D01", "Overhead Closer", "Surface mounted, Backcheck", "1", 110);
      }

      // Accessories
      addItem("Stops", "S01", "Door Stop", "Floor mounted", "1", 8);
      if (fire > 0) addItem("Seals", "GS01", "Intumescent Seal", "Fire & Smoke", "1 Set", 15);
      if (notes.includes("kick plate")) addItem("Accessories", "K01", "Kick Plate", "SS 150mm", "1", 40);

      return {
        id: setID,
        name: setName,
        doors: doors.map(d => d.id),
        items,
        operation: "Door is self-closing and latching. Free egress at all times."
      };
    });

    const updatedProjects = projects.map(p => p.id === currentId ? { ...p, sets: newSets } : p);
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
            if (field === 'type') {
              const cat = newItems[idx].category || "Hinges";
              const sub = PRODUCT_SUBTYPES[cat]?.find(x => x.name === val);
              if (sub) {
                newItems[idx].spec = sub.spec;
                newItems[idx].price = sub.price;
              }
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

  const handleAddItemClick = (setId) => setAddItemModal({ isOpen: true, setId });

  const addNewItem = (category, type) => {
    const proj = getProj();
    const defaultFinish = proj.standard === "ANSI" ? "SSS (US32D)" : "SSS (Satin Stainless)";
    const subtype = PRODUCT_SUBTYPES[category]?.find(s => s.name === type);
    const spec = subtype ? subtype.spec : "";
    const price = subtype ? subtype.price : 0;
    
    let refPrefix = category.charAt(0);
    const count = proj.sets.find(s => s.id === addItemModal.setId).items.filter(i => i.category === category).length;
    const ref = `${refPrefix}0${count + 2}`;

    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === addItemModal.setId) {
            return {
              ...s,
              items: [...s.items, { category, ref, type, spec, qty: "1", finish: defaultFinish, price }]
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

  const exportExcel = () => {
    const p = getProj();
    const wb = XLSX.utils.book_new();
    const doorData = p.doors.map(d => ({
      "Mark": d.mark, "Location": d.location, "Qty": d.qty, 
      "Width": d.width, "Height": d.height, "Fire": d.fire, "Use": d.use
    }));
    const wsDoors = XLSX.utils.json_to_sheet(doorData);
    XLSX.utils.book_append_sheet(wb, wsDoors, "Door Schedule");
    
    const itemData = [];
    p.sets.forEach(s => {
      s.items.forEach(i => {
        itemData.push({ "Set": s.id, "Set Name": s.name, "Ref": i.ref, "Type": i.type, "Spec": i.spec, "Qty": i.qty, "Price": i.price });
      });
    });
    const wsItems = XLSX.utils.json_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, wsItems, "Hardware Specs");
    XLSX.writeFile(wb, `${p.name}_Spec.xlsx`);
  };

  if (view === 'landing') return <LandingPage onStart={() => setView(projects.length > 0 ? 'dashboard' : 'dashboard')} hasProjects={projects.length > 0} />;

  // --- HELPER FOR COST ---
  const calculateSetCost = (items) => items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-gray-900">
          <ShieldCheck className="text-primary" /> <span>SpecSmart</span>
        </div>
        <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
          <LayoutGrid size={18} /> Dashboard
        </button>
      </header>

      {view === 'wizard' && getProj() && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between sticky top-16 z-30 shadow-sm">
          <div className="flex gap-4 items-center">
            <span className="font-bold">{getProj().name}</span>
            <span className="px-2 py-0.5 border rounded text-xs bg-white text-gray-500">{getProj().type}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => saveProjectDetails(getProj().name, getProj().type, getProj().standard)} className="px-3 py-1 bg-white border rounded text-sm flex items-center gap-2"><Save size={14}/> Save</button>
            <button onClick={() => setView('dashboard')} className="px-3 py-1 bg-white border rounded text-sm"><X size={14}/></button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {view === 'dashboard' && (
          <div className="animate-slideUp">
            <div className="flex justify-between mb-8">
              <h1 className="text-2xl font-bold">Projects</h1>
              <button onClick={createProject} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"><PlusCircle size={18}/> New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id} onClick={() => loadProject(p.id)} className="bg-white p-6 rounded-xl border hover:shadow-md cursor-pointer relative group">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.type} &bull; {p.doors.length} Doors</p>
                  <button onClick={(e) => deleteProject(p.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'wizard' && getProj() && (
          <div>
            <div className="flex justify-center mb-6 overflow-x-auto pb-2">
              <div className="flex gap-8 min-w-max px-4">
                {['Setup', 'Schedule', 'Hardware', 'Review'].map((label, idx) => (
                  <div key={idx} onClick={() => setStep(idx)} className={`flex flex-col items-center gap-2 cursor-pointer ${step === idx ? 'text-primary' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === idx ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300'}`}>{idx+1}</div>
                    <span className="text-xs font-bold uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {step === 0 && (
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold mb-4">Project Details</h2>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase">Name</label>
                    <input type="text" value={getProj().name} onChange={(e) => { const u = projects.map(p => p.id === currentId ? {...p, name: e.target.value} : p); setProjects(u); }} className="p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase">Type</label>
                      <select value={getProj().type} onChange={(e) => { const u = projects.map(p => p.id === currentId ? {...p, type: e.target.value} : p); setProjects(u); }} className="p-2 border rounded bg-white">
                        {Object.keys(FACILITY_DATA).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase">Standard</label>
                      <select value={getProj().standard} onChange={(e) => { const u = projects.map(p => p.id === currentId ? {...p, standard: e.target.value} : p); setProjects(u); }} className="p-2 border rounded bg-white">
                        <option value="ANSI">ANSI (US)</option><option value="EN">EN (EU)</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="w-full mt-4 px-6 py-2 bg-primary text-white rounded font-bold">Continue</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Door Schedule</h2>
                  <button onClick={() => openDoorModal()} className="px-4 py-2 bg-primary text-white rounded flex items-center gap-2"><PlusCircle size={18}/> Add</button>
                </div>
                {getProj().doors.length === 0 ? <p className="text-center py-10 text-gray-500">No doors yet.</p> : (
                  <div className="overflow-x-auto border rounded"><table className="w-full table-clean"><thead><tr><th>Mark</th><th>Loc</th><th>Qty</th><th>WxH</th><th>Fire</th><th>Use</th><th>Action</th></tr></thead><tbody>{getProj().doors.map(d => (
                    <tr key={d.id}><td>{d.mark}</td><td>{d.location}</td><td>{d.qty}</td><td>{d.width}x{d.height}</td><td>{d.fire}m</td><td>{d.use}</td><td><div className="flex gap-2"><button onClick={() => openDoorModal(d)}><Pencil size={16}/></button><button onClick={() => deleteDoor(d.id)} className="text-red-500"><Trash2 size={16}/></button></div></td></tr>
                  ))}</tbody></table></div>
                )}
                <div className="flex justify-end mt-4"><button onClick={generateHardwareSets} className="px-6 py-2 bg-primary text-white rounded">Generate Hardware</button></div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
                <div className="w-full lg:w-72 bg-white border rounded overflow-hidden flex flex-col shrink-0">
                  <div className="bg-gray-50 p-4 font-bold border-b">Sets</div>
                  <div className="overflow-y-auto flex-1">
                    {getProj().sets.map(s => (
                      <div key={s.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                        <div className="font-bold">{s.id}</div><div className="text-sm truncate">{s.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-white border rounded flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6">
                    {getProj().sets.map(s => (
                      <div key={s.id} className="mb-12">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2 className="text-xl font-bold">{s.id}: {s.name}</h2>
                            <p className="text-sm text-gray-500">{getProj().doors.filter(d => s.doors.includes(d.id)).length} Doors</p>
                          </div>
                          
                          {/* VISUAL PREVIEW */}
                          {(() => {
                            const repDoor = getProj().doors.find(d => s.doors.includes(d.id));
                            return repDoor ? <DoorVisualizer config={repDoor.config} items={s.items} /> : null;
                          })()}
                        </div>

                        <div className="border rounded overflow-hidden mb-4 overflow-x-auto">
                          <div className="min-w-[800px]">
                            <div className="grid grid-cols-[60px_180px_120px_1fr_60px_80px_40px] bg-gray-50 border-b p-2 text-xs font-bold uppercase">
                              <div>Ref</div><div>Type</div><div>Finish</div><div>Spec</div><div>Qty</div><div>Cost</div><div></div>
                            </div>
                            {s.items.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-[60px_180px_120px_1fr_60px_80px_40px] border-b p-2 items-center hover:bg-gray-50">
                                <input type="text" value={item.ref} onChange={(e) => updateSetItem(s.id, idx, 'ref', e.target.value)} className="w-full p-1 border rounded text-sm"/>
                                <select value={item.type} onChange={(e) => updateSetItem(s.id, idx, 'type', e.target.value)} className="w-full p-1 border rounded text-sm bg-white">
                                  {PRODUCT_SUBTYPES[item.category || "Hinges"]?.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                                </select>
                                <select value={item.finish} onChange={(e) => updateSetItem(s.id, idx, 'finish', e.target.value)} className="w-full p-1 border rounded text-sm bg-white">
                                  {STANDARD_FINISHES[getProj().standard].map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <input type="text" value={item.spec} onChange={(e) => updateSetItem(s.id, idx, 'spec', e.target.value)} className="w-full p-1 border rounded text-sm"/>
                                <input type="text" value={item.qty} onChange={(e) => updateSetItem(s.id, idx, 'qty', e.target.value)} className="w-full p-1 border rounded text-sm"/>
                                <div className="text-sm font-mono text-gray-600">${item.price}</div>
                                <button onClick={() => deleteSetItem(s.id, idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                              </div>
                            ))}
                            <div className="p-2 bg-gray-50 flex justify-end font-bold text-sm border-t">
                              Set Total: ${calculateSetCost(s.items)}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleAddItemClick(s.id)} className="text-sm text-primary hover:underline flex gap-1 mb-4"><PlusCircle size={14}/> Add Item</button>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t flex justify-between">
                    <button onClick={() => setStep(1)} className="px-4 py-2 border rounded">Back</button>
                    <button onClick={() => setStep(3)} className="px-6 py-2 bg-primary text-white rounded">Finish</button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Review & Export</h2>
                  <button onClick={exportExcel} className="px-6 py-2 bg-green-600 text-white rounded flex items-center gap-2"><FileSpreadsheet size={18}/> Export Excel</button>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded">
                    <div className="text-xs font-bold text-gray-500 uppercase">Hardware Sets</div>
                    <div className="text-3xl font-bold text-primary">{getProj().sets.length}</div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded">
                    <div className="text-xs font-bold text-gray-500 uppercase">Estimated Budget</div>
                    <div className="text-3xl font-bold text-green-600">
                      ${getProj().sets.reduce((acc, s) => {
                        const doorCount = getProj().doors.filter(d => s.doors.includes(d.id)).length;
                        return acc + (calculateSetCost(s.items) * doorCount);
                      }, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="border rounded overflow-hidden">
                  <table className="w-full table-clean"><thead><tr><th>Set</th><th>Name</th><th>Doors</th><th>Items</th><th>Cost/Set</th></tr></thead><tbody>
                    {getProj().sets.map(s => (
                      <tr key={s.id}>
                        <td className="font-bold">{s.id}</td><td>{s.name}</td>
                        <td>{getProj().doors.filter(d => s.doors.includes(d.id)).length}</td>
                        <td>{s.items.length}</td>
                        <td className="font-mono text-green-700">${calculateSetCost(s.items)}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {isDoorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Door</h3>
              <button onClick={() => setIsDoorModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Mark</label>
                  <input type="text" value={doorForm.mark} onChange={e => setDoorForm({...doorForm, mark: e.target.value})} className="p-2 border rounded"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Location</label>
                  <SearchableDropdown options={FACILITY_DATA[getProj().type]?.locations || []} value={doorForm.location} onChange={(val) => setDoorForm({...doorForm, location: val})} placeholder="Select..."/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Qty</label>
                  <input type="number" value={doorForm.qty} onChange={e => setDoorForm({...doorForm, qty: parseInt(e.target.value)})} className="p-2 border rounded"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Usage</label>
                  <select value={doorForm.use} onChange={e => setDoorForm({...doorForm, use: e.target.value})} className="p-2 border rounded bg-white">
                    {GET_USAGES_FOR_FACILITY(getProj().type).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Fire</label>
                  <select value={doorForm.fire} onChange={e => setDoorForm({...doorForm, fire: parseInt(e.target.value)})} className="p-2 border rounded bg-white">
                    <option value="0">None</option><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option>
                  </select>
                </div>
              </div>
              {complianceNote && <div className={`p-3 rounded text-sm flex gap-2 ${complianceNote.type==='warning'?'bg-orange-50 text-orange-800':'bg-blue-50 text-blue-800'}`}><Info size={16}/>{complianceNote.msg}</div>}
              <button onClick={saveDoor} className="w-full py-2 bg-primary text-white rounded font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {addItemModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold">Add Item</h3>
              <button onClick={() => setAddItemModal({isOpen: false, setId: null})}><X/></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {Object.entries(PRODUCT_SUBTYPES).map(([cat, items]) => (
                <div key={cat} className="mb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">{cat}</div>
                  {items.map(i => (
                    <button key={i.name} onClick={() => addNewItem(cat, i.name)} className="block w-full text-left p-2 hover:bg-indigo-50 border rounded mb-1 text-sm">{i.name}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
