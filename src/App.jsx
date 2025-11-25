import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutGrid, PlusCircle, FolderOpen, Trash2, 
  Globe, Building, Save, X, Copy, Pencil, DoorClosed, 
  DoorOpen, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, 
  Brain, Check, AlertTriangle, TreeDeciduous, RectangleHorizontal, Menu 
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- CONSTANTS & DATA ---

const ROOM_TYPES = {
  "Hospital / Healthcare": ["Patient Room", "Operating Theatre", "Nurse Station", "Clean Utility", "Dirty Utility", "Waiting Area", "Consultation Room"],
  "Education / School": ["Classroom", "Staff Room", "Library", "Auditorium", "Gymnasium", "Lab", "Cafeteria"],
  "Commercial Office": ["Open Office", "Meeting Room", "Director Cabin", "Server Room", "Reception", "Pantry", "Copy Room"],
  "Airport / Transport": ["Terminal Entry", "Check-in", "Security Check", "Boarding Gate", "Baggage Handling", "Duty Free"],
  "Hospitality / Hotel": ["Guest Room", "Ballroom", "Kitchen", "Back of House", "Lobby", "Spa"],
  "Residential": ["Entrance", "Living", "Bedroom", "Bathroom", "Kitchen", "Balcony"]
};

const PRODUCT_SUBTYPES = {
  "Hinges": [
    { name: "Butt Hinge", spec: "4.5x4.5 Ball Bearing, Stainless Steel" },
    { name: "Concealed Hinge", spec: "3D Adjustable Concealed Hinge, Satin Chrome" },
    { name: "Pivot Set", spec: "Heavy Duty Floor Pivot & Top Center, Double Action" },
    { name: "Geared Hinge", spec: "Continuous Geared Hinge, Full Mortise" }
  ],
  "Locks": [
    { name: "Mortise Lock", spec: "Sashlock case, Cylinder operation, Grade 1/3" },
    { name: "Deadbolt", spec: "Heavy Duty Deadbolt, Thumbturn internal" },
    { name: "Cylindrical Lock", spec: "Leverset with integrated cylinder" },
    { name: "Magnetic Lock", spec: "Electromagnetic Lock, 1200lbs holding force" },
    { name: "Bathroom Lock", spec: "Privacy function, coin release indicator" },
    { name: "Panic Bar", spec: "Rim Exit Device, Fire Rated" }
  ],
  "Closers": [
    { name: "Overhead Closer", spec: "Surface mounted, Size 2-5, Backcheck" },
    { name: "Cam Action Closer", spec: "Slide arm closer, High efficiency" },
    { name: "Concealed Closer", spec: "Integrated in door leaf/frame" },
    { name: "Floor Spring", spec: "Floor mounted closer, Double action" }
  ],
  "Handles": [
    { name: "Lever Handle", spec: "Return to door safety lever, 19mm dia" },
    { name: "Pull Handle", spec: "D-Handle, 300mm ctc, Bolt through" },
    { name: "Push Plate", spec: "Stainless steel push plate 300x75mm" }
  ],
  "Stops": [
    { name: "Door Stop", spec: "Floor mounted half-dome with rubber buffer" },
    { name: "Wall Stop", spec: "Wall mounted projection stop" }
  ],
  "Cylinders": [
    { name: "Cylinder", spec: "Euro Profile, Key/Key or Key/Turn" }
  ]
};

const STANDARD_FINISHES = {
  "ANSI": ["SSS (US32D)", "PSS (US32)", "SCP (US26D)", "PVD Brass (US3)", "Oil Rubbed Bronze (US10B)"],
  "EN": ["SSS (Satin Stainless)", "PSS (Polished Stainless)", "SAA (Satin Anodized Alum)", "PVD (Brass Effect)", "RAL Powdercoat"]
};

// --- COMPONENTS ---

const LandingPage = ({ onStart, hasProjects }) => (
  <div className="absolute top-0 left-0 w-full min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 z-50 flex flex-col overflow-y-auto">
    <nav className="px-4 md:px-8 py-6 flex justify-between items-center">
      <div className="flex items-center gap-2 font-extrabold text-xl md:text-2xl text-gray-900">
        <ShieldCheck className="text-primary w-6 h-6 md:w-8 md:h-8" />
        <span>SpecSmart</span>
      </div>
      <div>
        <button 
          onClick={onStart} 
          className={`px-4 py-2 md:px-6 md:py-2 rounded-md font-medium text-sm md:text-base transition-colors ${hasProjects ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
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
          <button onClick={onStart} className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg shadow-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-2">
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

    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 lg:px-16 py-16 bg-white mt-auto border-t border-gray-100">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-indigo-50 text-primary rounded-xl flex items-center justify-center shrink-0"><Brain size={24} /></div>
        <div>
          <h3 className="font-bold text-lg mb-1">Smart Logic Engine</h3>
          <p className="text-gray-500 text-sm">Automatically suggests correct hinges, closers, and locks based on door weight, width, and facility type.</p>
        </div>
      </div>
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-indigo-50 text-primary rounded-xl flex items-center justify-center shrink-0"><Globe size={24} /></div>
        <div>
          <h3 className="font-bold text-lg mb-1">Global Standards</h3>
          <p className="text-gray-500 text-sm">Seamlessly switch between ANSI/BHMA (US) and EN/ISO (EU) modes with compliant terminologies.</p>
        </div>
      </div>
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-indigo-50 text-primary rounded-xl flex items-center justify-center shrink-0"><FileSpreadsheet size={24} /></div>
        <div>
          <h3 className="font-bold text-lg mb-1">Instant Documentation</h3>
          <p className="text-gray-500 text-sm">Generate professional door schedules and detailed hardware set specifications in Excel format instantly.</p>
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
  
  // Door Modal State
  const [doorForm, setDoorForm] = useState({
    id: '', mark: '', location: '', qty: 1, 
    width: 900, height: 2100, weight: 45, 
    fire: 0, use: 'Office', material: 'Timber', config: 'Single'
  });
  
  // Validation State
  const [doorErrors, setDoorErrors] = useState({});
  const [doorHint, setDoorHint] = useState('');

  // Load Data on Mount
  useEffect(() => {
    const saved = localStorage.getItem('specSmartDB');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.projects) setProjects(data.projects);
    }
  }, []);

  // Save Data on Change
  useEffect(() => {
    if (projects.length > 0 || view !== 'landing') {
      localStorage.setItem('specSmartDB', JSON.stringify({ projects }));
    }
  }, [projects]);

  const getProj = () => projects.find(p => p.id === currentId);

  // --- ACTIONS ---

  const createProject = () => {
    const id = crypto.randomUUID();
    const newProj = { 
      id, 
      name: "New Project", 
      type: "Commercial Office", 
      standard: "ANSI", 
      doors: [], 
      sets: [] 
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

  const saveProjectDetails = (name, type, standard) => {
    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, name, type, standard } : p
    );
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
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        return { ...p, doors: p.doors.filter(d => d.id !== doorId) };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const duplicateDoor = (doorId) => {
    const proj = getProj();
    const original = proj.doors.find(d => d.id === doorId);
    const copy = { ...original, id: crypto.randomUUID(), mark: original.mark + "-COPY" };
    
    const updatedProjects = projects.map(p => 
      p.id === currentId ? { ...p, doors: [...p.doors, copy] } : p
    );
    setProjects(updatedProjects);
  };

  const validatePhysics = (field, value) => {
    const errors = { ...doorErrors };
    let hint = '';

    if (field === 'width' || field === 'all') {
      const val = field === 'all' ? doorForm.width : value;
      if (val < 600 || val > 1300) errors.width = "Width must be 600-1300mm";
      else delete errors.width;
      
      if (val > 1100) hint = "Info: Wide (>1100mm). HD Closers suggested.";
    }

    if (field === 'height' || field === 'all') {
      const val = field === 'all' ? doorForm.height : value;
      if (val < 1900 || val > 3000) errors.height = "Height must be 1900-3000mm";
      else delete errors.height;
    }

    if (field === 'weight' || field === 'all') {
      const val = field === 'all' ? doorForm.weight : value;
      if (val > 150) hint = "Info: Heavy (>150kg). Pivot Sets suggested.";
    }

    setDoorErrors(errors);
    setDoorHint(hint);
  };

  const openDoorModal = (door = null) => {
    const proj = getProj();
    if (door) {
      setDoorForm({ ...door });
    } else {
      // Default new door
      setDoorForm({
        id: '', 
        mark: `D-${(proj.doors.length + 1).toString().padStart(3, '0')}`,
        location: '', 
        qty: 1, 
        width: 900, 
        height: 2100, 
        weight: 45, 
        fire: 0, 
        use: 'Office', 
        material: 'Timber', 
        config: 'Single'
      });
    }
    setDoorErrors({});
    setDoorHint('');
    setIsDoorModalOpen(true);
  };

  // Hardware Logic
  const generateHardwareSets = () => {
    const proj = getProj();
    const defaultFinish = proj.standard === "ANSI" ? "SSS (US32D)" : "SSS (Satin Stainless)";
    const groups = {};

    // Group doors
    proj.doors.forEach(d => {
      const key = `${d.use}|${d.fire}|${d.config}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    const newSets = Object.entries(groups).map(([key, doors], idx) => {
      const [use, fireStr] = key.split('|');
      const fire = parseInt(fireStr);
      // Representative door (max weight)
      const rep = doors.reduce((a, b) => a.weight > b.weight ? a : b);
      
      const setID = `HW-${String(idx + 1).padStart(2, '0')}`;
      const items = [];
      const addItem = (cat, ref, type, spec, qty) => items.push({ category: cat, ref, type, spec, qty, finish: defaultFinish });

      // Logic Engine
      if (rep.weight > 150) {
        addItem("Hinges", "P01", "Pivot Set", `Heavy Duty Pivot Set, ${rep.weight}kg Capacity`, "1 Set");
      } else {
        const hType = proj.standard === "ANSI" ? "4.5x4.5 Ball Bearing" : "102x76x3 Ball Bearing";
        addItem("Hinges", "H01", "Butt Hinge", `${hType}`, "3");
      }

      if (use === "Toilet") {
        addItem("Locks", "L01", "Bathroom Lock", "Privacy function, coin release", "1");
      } else if (use === "Stair") {
        addItem("Locks", "L01", "Panic Bar", "Rim Exit Device, Fire Rated", "1");
      } else {
        addItem("Locks", "L01", "Mortise Lock", "Sashlock case, Cylinder operation", "1");
        addItem("Cylinders", "C01", "Cylinder", "Euro Profile, Key/Turn", "1");
        addItem("Handles", "H02", "Lever Handle", "Return to door safety lever", "1 Pr");
      }

      if (use !== "Toilet" && use !== "Store") {
        const cSpec = rep.width > 1100 ? "Size 3-6 Heavy Duty" : "Size 2-4 Adjustable";
        addItem("Closers", "D01", "Overhead Closer", `Surface, ${cSpec}, Backcheck`, "1");
      }

      addItem("Stops", "S01", "Door Stop", "Floor mounted half-dome", "1");

      return {
        id: setID,
        name: `${use} Door - ${fire > 0 ? fire + 'min' : 'NFR'}`,
        doors: doors.map(d => d.id),
        items,
        operation: "Door is self-closing and latching. Free egress at all times."
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
            
            // Auto-Spec Logic
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

  const addSetItem = (setId) => {
    const proj = getProj();
    const defaultFinish = proj.standard === "ANSI" ? "SSS (US32D)" : "SSS (Satin Stainless)";
    
    const updatedProjects = projects.map(p => {
      if (p.id === currentId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            return {
              ...s,
              items: [...s.items, { category: "Hinges", ref: "New", type: "Butt Hinge", spec: "", qty: "1", finish: defaultFinish }]
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
        itemData.push({ "Set": s.id, "Set Name": s.name, "Ref": i.ref, "Type": i.type, "Finish": i.finish, "Spec": i.spec, "Qty": i.qty });
      });
    });
    const wsItems = XLSX.utils.json_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, wsItems, "Hardware Specs");

    XLSX.writeFile(wb, `${p.name.replace(/\s+/g, '_')}_Spec.xlsx`);
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
          <ShieldCheck className="text-primary" />
          <span>SpecSmart</span>
        </div>
        <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm md:text-base">
          <LayoutGrid size={18} /> <span className="hidden md:inline">Dashboard</span>
        </button>
      </header>

      {/* Project Context Bar (Only in Wizard) */}
      {view === 'wizard' && getProj() && (
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-16 z-30 shadow-sm gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span className="font-bold text-base md:text-lg">{getProj().name}</span>
            <span className="px-2 py-0.5 border rounded text-xs md:text-sm text-gray-500 bg-white whitespace-nowrap">{getProj().standard}</span>
            <span className="px-2 py-0.5 border rounded text-xs md:text-sm text-gray-500 bg-white whitespace-nowrap">{getProj().type}</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button onClick={() => { saveProjectDetails(getProj().name, getProj().type, getProj().standard); alert("Saved locally"); }} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <Save size={16} /> Save
            </button>
            <button onClick={() => setView('dashboard')} className="px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-xs md:text-sm">
              <X size={16} /> Close
            </button>
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
              <button onClick={createProject} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2 font-medium shadow-sm w-full md:w-auto justify-center">
                <PlusCircle size={18} /> New Project
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id} onClick={() => loadProject(p.id)} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer group relative">
                  <div className="w-12 h-12 bg-indigo-50 text-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              <div onClick={createProject} className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-primary hover:text-primary hover:bg-indigo-50 transition-colors cursor-pointer h-full min-h-[200px]">
                <PlusCircle size={32} className="mb-2" />
                <span className="font-medium">Create New Project</span>
              </div>
            </div>
          </div>
        )}

        {/* WIZARD VIEW */}
        {view === 'wizard' && getProj() && (
          <div>
            {/* Stepper - Scrollable on Mobile */}
            <div className="flex justify-center mb-6 md:mb-10 relative overflow-x-auto pb-2">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 hidden md:block w-full"></div>
              <div className="flex gap-8 md:gap-16 min-w-max px-4">
                {['Setup', 'Schedule', 'Hardware', 'Review'].map((label, idx) => (
                  <div key={idx} onClick={() => setStep(idx)} className="flex flex-col items-center gap-2 cursor-pointer group bg-gray-50 px-2 relative z-10">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step === idx ? 'bg-primary border-primary text-white' : step > idx ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                      {step > idx ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${step === idx ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 0: Setup */}
            {step === 0 && (
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-slideUp">
                <h2 className="text-xl font-bold mb-6">Project Details</h2>
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
                      className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-primary outline-none w-full"
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
                        className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-primary outline-none w-full bg-white"
                      >
                        {Object.keys(ROOM_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase text-gray-600">Standard Mode</label>
                      <select 
                        value={getProj().standard}
                        onChange={(e) => {
                          const updated = projects.map(p => p.id === currentId ? {...p, standard: e.target.value} : p);
                          setProjects(updated);
                        }}
                        className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-primary outline-none w-full bg-white"
                      >
                        <option value="ANSI">ANSI / BHMA (US)</option>
                        <option value="EN">EN / ISO (EU)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button onClick={() => setStep(1)} className="w-full md:w-auto px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-hover font-medium flex items-center justify-center gap-2">
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
                  <button onClick={() => openDoorModal()} className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover font-medium flex items-center justify-center gap-2">
                    <PlusCircle size={18} /> Add Door
                  </button>
                </div>

                {getProj().doors.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No doors defined yet.</p>
                    <button onClick={() => openDoorModal()} className="mt-4 text-primary font-bold hover:underline">Click to add your first door</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full table-clean min-w-[800px]">
                      <thead>
                        <tr>
                          <th>Mark</th><th>Location</th><th>Qty</th><th>WxH (mm)</th><th>Weight</th><th>Fire</th><th>Type</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getProj().doors.map(d => (
                          <tr key={d.id}>
                            <td className="font-bold text-primary">{d.mark}</td>
                            <td>{d.location}</td>
                            <td>{d.qty}</td>
                            <td>{d.width} x {d.height}</td>
                            <td>{d.weight} kg</td>
                            <td><span className={`px-2 py-0.5 rounded text-xs font-bold ${d.fire > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{d.fire} min</span></td>
                            <td className="text-sm">{d.material} / {d.config}</td>
                            <td>
                              <div className="flex gap-1">
                                <button onClick={() => duplicateDoor(d.id)} className="p-2 hover:bg-gray-100 rounded text-gray-500" title="Duplicate"><Copy size={16} /></button>
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
                  <button onClick={generateHardwareSets} className="w-full md:w-auto px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-hover font-medium flex items-center justify-center gap-2">
                    Generate Hardware Sets <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Hardware */}
            {step === 2 && (
              <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[700px] animate-slideUp">
                {/* Sidebar - Moves to top on mobile */}
                <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shrink-0 h-48 lg:h-auto">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 font-bold text-gray-500 uppercase text-xs tracking-wider">Hardware Sets</div>
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
                    {getProj().sets.map(s => (
                      <div key={s.id} className="mb-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                          <h2 className="text-xl font-bold">{s.id}: {s.name}</h2>
                          <span className="bg-indigo-50 text-primary px-3 py-1 rounded-full text-sm font-bold">{getProj().doors.filter(d => s.doors.includes(d.id)).length} Doors Assigned</span>
                        </div>

                        {/* Scrollable Table Container for Mobile */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 overflow-x-auto">
                          <div className="min-w-[800px]"> {/* Force minimum width to prevent squishing */}
                            <div className="grid grid-cols-[60px_200px_140px_1fr_60px_40px] bg-gray-50 border-b border-gray-200 p-3 text-xs font-bold text-gray-500 uppercase">
                              <div>Ref</div><div>Product Type</div><div>Finish</div><div>Specification</div><div>Qty</div><div></div>
                            </div>
                            {s.items.map((item, idx) => {
                              const usedTypes = s.items.filter(i => i.type === item.type).length;
                              const isDuplicate = usedTypes > 1;
                              const cat = item.category || "Hinges";
                              const options = PRODUCT_SUBTYPES[cat] || PRODUCT_SUBTYPES["Hinges"];
                              const finishes = STANDARD_FINISHES[getProj().standard];

                              return (
                                <div key={idx} className="grid grid-cols-[60px_200px_140px_1fr_60px_40px] border-b border-gray-100 p-2 items-center hover:bg-gray-50 relative">
                                  {isDuplicate && <AlertTriangle className="absolute left-1 text-yellow-500" size={14} />}
                                  <input 
                                    type="text" value={item.ref} 
                                    onChange={(e) => updateSetItem(s.id, idx, 'ref', e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                  />
                                  <select 
                                    value={item.type} 
                                    onChange={(e) => updateSetItem(s.id, idx, 'type', e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                                  >
                                    {options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                                  </select>
                                  <select 
                                    value={item.finish} 
                                    onChange={(e) => updateSetItem(s.id, idx, 'finish', e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                                  >
                                    {finishes.map(f => <option key={f} value={f}>{f}</option>)}
                                    <option value="N/A">N/A</option>
                                  </select>
                                  <input 
                                    type="text" value={item.spec} 
                                    onChange={(e) => updateSetItem(s.id, idx, 'spec', e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                  />
                                  <input 
                                    type="text" value={item.qty} 
                                    onChange={(e) => updateSetItem(s.id, idx, 'qty', e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                  />
                                  <button onClick={() => deleteSetItem(s.id, idx)} className="text-red-400 hover:text-red-600 flex justify-center p-2"><Trash2 size={16}/></button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <button onClick={() => addSetItem(s.id)} className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mb-4 px-2 py-1">
                          <PlusCircle size={14}/> Add Item
                        </button>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase text-gray-500">Operational Description</label>
                          <textarea 
                            value={s.operation} 
                            onChange={(e) => {
                              const updated = projects.map(p => p.id === currentId ? {...p, sets: p.sets.map(set => set.id === s.id ? {...set, operation: e.target.value} : set)} : p);
                              setProjects(updated);
                            }}
                            rows={2} 
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                    <button onClick={() => setStep(1)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-2">
                      <ArrowLeft size={16}/> Back
                    </button>
                    <button onClick={() => setStep(3)} className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover flex items-center gap-2 font-medium">
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
                  <button onClick={exportExcel} className="w-full md:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 shadow-sm">
                    <FileSpreadsheet size={20} /> Export to Excel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Doors</div>
                    <div className="text-3xl font-bold text-gray-900">{getProj().doors.length}</div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Hardware Sets</div>
                    <div className="text-3xl font-bold text-primary">{getProj().sets.length}</div>
                  </div>
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <div className="text-xs font-bold text-red-500 uppercase mb-1">Issues</div>
                    <div className="text-3xl font-bold text-red-600">{getProj().doors.filter(d => !getProj().sets.find(s => s.doors.includes(d.id))).length}</div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full table-clean min-w-[600px]">
                    <thead>
                      <tr><th>Set ID</th><th>Set Name</th><th>Doors</th><th>Items</th><th>Fire Rating</th></tr>
                    </thead>
                    <tbody>
                      {getProj().sets.map(s => {
                        const doorCount = getProj().doors.filter(d => s.doors.includes(d.id)).length;
                        const repDoor = getProj().doors.find(d => s.doors.includes(d.id));
                        const fire = repDoor ? repDoor.fire : 0;
                        return (
                          <tr key={s.id}>
                            <td className="font-bold">{s.id}</td>
                            <td>{s.name}</td>
                            <td>{doorCount}</td>
                            <td>{s.items.length}</td>
                            <td><span className={`px-2 py-0.5 rounded text-xs font-bold ${fire > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{fire} min</span></td>
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
                  <input type="text" value={doorForm.mark} onChange={e => setDoorForm({...doorForm, mark: e.target.value})} className="p-2 border rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Location</label>
                  <input list="rooms" type="text" value={doorForm.location} onChange={e => setDoorForm({...doorForm, location: e.target.value})} className="p-2 border rounded" />
                  <datalist id="rooms">{ROOM_TYPES[getProj().type]?.map(r => <option key={r} value={r}/>)}</datalist>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-gray-500">Qty</label>
                  <input type="number" value={doorForm.qty} onChange={e => setDoorForm({...doorForm, qty: parseInt(e.target.value)})} className="p-2 border rounded" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs font-bold uppercase text-gray-400 mb-4">Physical Dimensions</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Width (mm)</label>
                    <input type="number" value={doorForm.width} onChange={e => {setDoorForm({...doorForm, width: parseInt(e.target.value)}); validatePhysics('width', e.target.value);}} className={`w-full p-2 border rounded ${doorErrors.width ? 'border-red-300 bg-red-50' : ''}`} />
                    {doorErrors.width && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {doorErrors.width}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Height (mm)</label>
                    <input type="number" value={doorForm.height} onChange={e => {setDoorForm({...doorForm, height: parseInt(e.target.value)}); validatePhysics('height', e.target.value);}} className={`w-full p-2 border rounded ${doorErrors.height ? 'border-red-300 bg-red-50' : ''}`} />
                    {doorErrors.height && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {doorErrors.height}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Weight (kg)</label>
                    <input type="number" value={doorForm.weight} onChange={e => {setDoorForm({...doorForm, weight: parseInt(e.target.value)}); validatePhysics('weight', e.target.value);}} className="w-full p-2 border rounded" />
                  </div>
                </div>
                {doorHint && <div className="mt-2 text-orange-600 text-sm bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2"><AlertTriangle size={14}/> {doorHint}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Material</label>
                  <select value={doorForm.material} onChange={e => setDoorForm({...doorForm, material: e.target.value})} className="w-full p-2 border rounded bg-white">
                    <option value="Timber">Timber / Wood</option>
                    <option value="Metal">Hollow Metal</option>
                    <option value="Glass">Glass</option>
                    <option value="Aluminum">Aluminum</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Configuration</label>
                  <div className="flex gap-2">
                    <div onClick={() => setDoorForm({...doorForm, config: 'Single'})} className={`flex-1 border rounded p-2 flex flex-col items-center gap-1 cursor-pointer ${doorForm.config === 'Single' ? 'border-primary bg-indigo-50 text-primary ring-1 ring-primary' : 'hover:bg-gray-50'}`}>
                      <DoorClosed size={20}/> <span className="text-sm">Single</span>
                    </div>
                    <div onClick={() => setDoorForm({...doorForm, config: 'Double'})} className={`flex-1 border rounded p-2 flex flex-col items-center gap-1 cursor-pointer ${doorForm.config === 'Double' ? 'border-primary bg-indigo-50 text-primary ring-1 ring-primary' : 'hover:bg-gray-50'}`}>
                      <DoorOpen size={20}/> <span className="text-sm">Double</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Fire Rating</label>
                  <select value={doorForm.fire} onChange={e => setDoorForm({...doorForm, fire: parseInt(e.target.value)})} className="w-full p-2 border rounded bg-white">
                    {getProj().standard === 'ANSI' 
                      ? <><option value="0">Non-Rated</option><option value="20">20 min</option><option value="45">45 min</option><option value="90">90 min</option><option value="180">3 Hour</option></>
                      : <><option value="0">None</option><option value="30">E30</option><option value="60">E60</option><option value="90">E90</option><option value="120">E120</option></>
                    }
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Usage</label>
                  <select value={doorForm.use} onChange={e => setDoorForm({...doorForm, use: e.target.value})} className="w-full p-2 border rounded bg-white">
                    <option value="Office">Office / Passage</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Patient">Patient Room</option>
                    <option value="Toilet">Restroom</option>
                    <option value="Stair">Stairwell</option>
                    <option value="Store">Storage</option>
                    <option value="Entrance">Main Entrance</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button onClick={saveDoor} className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover font-bold">Save Door</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
