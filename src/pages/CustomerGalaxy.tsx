import React, { useRef, useEffect, useState, useMemo } from "react";
import { useOrbit } from "../context/OrbitContext";
import type { Customer } from "../context/OrbitContext";
import { 
  X, TrendingDown, TrendingUp, Minus, ShoppingBag, Cpu, 
  Search, SlidersHorizontal, Eye, Compass, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, ArrowUpDown, List
} from "lucide-react";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

/* ─────────────────────────────────────────────────────────────
   HELPERS & DUST GENERATOR
───────────────────────────────────────────────────────────── */
interface SpaceDust {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const generateSpaceDust = (): SpaceDust[] => {
  return Array.from({ length: 60 }).map(() => ({
    x: Math.random() * 1500 - 250,
    y: Math.random() * 1300 - 225,
    size: Math.random() * 1.5 + 0.5,
    speed: 0.04 + Math.random() * 0.08,
    opacity: 0.1 + Math.random() * 0.45
  }));
};

const generateAiSummary = (cust: Customer) => {
  const preferred = cust.preferredChannel;
  if (cust.segment === "Loyalists") {
    return `${cust.name} is a high-value Loyalist node. They exhibit extreme loyalty with ₹${cust.ltv.toLocaleString()} LTV across ${cust.purchaseCount} purchases. Risk vectors are highly stable. Recommended strategy is priority VIP access dispatched via ${preferred}.`;
  }
  if (cust.segment === "Slipping Away") {
    return `Alert: ${cust.name} belongs to the Slipping Away segment. Churn risk is currently critical at ${cust.churnRisk}%, with Churn Trend marking UP. Churn risk is high; recommend deploying an immediate re-engagement campaign via ${preferred} featuring Neural Upgrades.`;
  }
  if (cust.segment === "High-Value Inactive") {
    return `${cust.name} is classified as High-Value Inactive. They represent substantial latent revenue capacity (₹${cust.ltv.toLocaleString()} LTV) but haven't engaged recently. Risk of attrition has climbed to ${cust.churnRisk}%. Activate dormant recovery directive via ${preferred}.`;
  }
  return `${cust.name} is a newly acquired customer node. Showing exploratory affinity toward ${cust.predictedCategory} category. Churn trend is stable. Recommend sending initial onboarding values via ${preferred} to drive conversion.`;
};

/* ─────────────────────────────────────────────────────────────
   CUSTOMER GALAXY PAGE
───────────────────────────────────────────────────────────── */
export const CustomerGalaxy: React.FC = () => {
  const { theme, customers, orders } = useOrbit();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [hovered, setHovered] = useState<Customer | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);
  const [viewMode, setViewMode] = useState<"galaxy" | "list">("galaxy");
  const [showCrmFilters, setShowCrmFilters] = useState(false);

  const isLight = theme === "executive";

  // Sorting
  const [sortField, setSortField] = useState<string>("ltv");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  const segmentColorsMap: Record<Customer["segment"], string> = {
    "Loyalists": isLight ? "text-blue-600 border-blue-200 bg-blue-50/50" : "text-orbit-success border-orbit-success/30 bg-orbit-success/5",
    "Slipping Away": isLight ? "text-red-600 border-red-200 bg-red-50/50" : "text-orbit-pink border-orbit-pink/30 bg-orbit-pink/5",
    "High-Value Inactive": isLight ? "text-amber-600 border-amber-200 bg-amber-50/50" : "text-orbit-amber border-orbit-amber/30 bg-orbit-amber/5",
    "New Signups": isLight ? "text-purple-600 border-purple-200 bg-purple-50/50" : "text-orbit-blue border-orbit-blue/30 bg-orbit-blue/5",
  };

  /* Camera State */
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /* Smoothing / Spring Refs */
  const targetPan = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(0.85);
  const animRef = useRef<number | undefined>(undefined);

  /* Sonar Ping Ref */
  const sonarPing = useRef<{ x: number; y: number; r: number; active: boolean }>({
    x: 0, y: 0, r: 0, active: false
  });

  /* Background Particles */
  const [spaceDust] = useState<SpaceDust[]>(generateSpaceDust);

  /* Search & Filter States */
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<Customer["segment"][]>([
    "Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"
  ]);
  const [minLtv, setMinLtv] = useState<number>(0);
  const [maxChurnRisk, setMaxChurnRisk] = useState<number>(100);
  const [preferredChannel, setPreferredChannel] = useState<string>("All");

  const segmentColors: Record<Customer["segment"], string> = {
    "Loyalists": isLight ? "#2563EB" : "#22C55E",
    "Slipping Away": isLight ? "#EF4444" : "#EC4899",
    "High-Value Inactive": isLight ? "#F59E0B" : "#F59E0B",
    "New Signups": isLight ? "#8B5CF6" : "#3B82F6",
  };

  /* Initial Camera Centering */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const initialPan = {
        x: canvas.width / 2 - 500 * 0.75,
        y: canvas.height / 2 - 500 * 0.75
      };
      setPan(initialPan);
      targetPan.current = initialPan;
      setZoom(0.75);
      targetZoom.current = 0.75;
    }
  }, []);

  /* Filter calculations */
  const filteredCustomers = customers.filter(c => {
    if (!selectedSegments.includes(c.segment)) return false;
    if (c.ltv < minLtv) return false;
    if (c.churnRisk > maxChurnRisk) return false;
    if (preferredChannel !== "All" && c.preferredChannel !== preferredChannel) return false;
    return true;
  });

  const filteredOutIds = new Set(customers.filter(c => !filteredCustomers.includes(c)).map(c => c.id));

  // Sort calculation
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let valA: any = a[sortField as keyof Customer];
      let valB: any = b[sortField as keyof Customer];
      
      if (typeof valA === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc"
          ? (valA || 0) - (valB || 0)
          : (valB || 0) - (valA || 0);
      }
    });
  }, [filteredCustomers, sortField, sortDirection]);

  // Search filter for list table
  const searchedCustomers = useMemo(() => {
    if (!searchQuery.trim()) return sortedCustomers;
    const q = searchQuery.toLowerCase();
    return sortedCustomers.filter(c => 
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [sortedCustomers, searchQuery]);

  // Paginated calculation
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchedCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [searchedCustomers, currentPage]);

  const totalPages = Math.ceil(searchedCustomers.length / itemsPerPage);

  // Sync pagination reset when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSegments, minLtv, maxChurnRisk, preferredChannel, searchQuery]);

  /* Search Auto-Focus */
  const handleSelectCustomer = (cust: Customer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const zoomLvl = 1.6;
    targetZoom.current = zoomLvl;
    targetPan.current = {
      x: canvas.width / 2 - cust.x * zoomLvl,
      y: canvas.height / 2 - cust.y * zoomLvl
    };
    setSelected(cust);
    setSearchQuery("");
    setShowSuggestions(false);
    
    // Trigger Sonar Pulse
    sonarPing.current = {
      x: cust.x,
      y: cust.y,
      r: 0,
      active: true
    };
  };

  /* Draw Loop */
  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, tick: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep space background gradient
    const spaceGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 10, canvas.width / 2, canvas.height / 2, canvas.width);
    if (isLight) {
      spaceGrad.addColorStop(0, "#FFFFFF");
      spaceGrad.addColorStop(1, "#F8FAFC");
    } else {
      spaceGrad.addColorStop(0, "#0a0d24");
      spaceGrad.addColorStop(1, "#03040c");
    }
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Background Dust Particles
    ctx.fillStyle = isLight ? "#94A3B8" : "#ffffff";
    spaceDust.forEach(dust => {
      ctx.globalAlpha = dust.opacity * (isLight ? 0.35 : (0.5 + 0.5 * Math.sin(tick * 0.008 + dust.x)));
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
      ctx.fill();
      dust.x += dust.speed;
      if (dust.x > 1200) dust.x = -200;
    });
    ctx.globalAlpha = 1.0;

    // Draw cluster radial gradients (nebula cores)
    const clusters = [
      { x: 500, y: 500, color: "rgba(59,130,246,0.05)", r: 210 },
      { x: 280, y: 280, color: "rgba(239,68,68,0.05)", r: 180 },
      { x: 720, y: 720, color: "rgba(245,158,11,0.05)", r: 180 },
      { x: 720, y: 280, color: "rgba(139,92,246,0.05)", r: 170 },
    ];
    clusters.forEach(cl => {
      const g = ctx.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.r);
      g.addColorStop(0, cl.color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw constellation lines (connect near stars of same segment)
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 5]);
    for (let i = 0; i < customers.length; i++) {
      const c1 = customers[i];
      if (filteredOutIds.has(c1.id)) continue;
      const color = segmentColors[c1.segment];
      ctx.strokeStyle = isLight ? "#CBD5E1" : color + "20"; // very faint color

      for (let j = i + 1; j < customers.length; j++) {
        const c2 = customers[j];
        if (c1.segment !== c2.segment || filteredOutIds.has(c2.id)) continue;

        const dist = Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]); // Reset

    // Draw constellation names (HUD labels)
    const clusterLabels = [
      { x: 500, y: 340, label: "LOYALIST CONSTELLATION", color: "#3B82F6" },
      { x: 280, y: 150, label: "SLIPPING NEBULA", color: "#EF4444" },
      { x: 720, y: 590, label: "HV-INACTIVE SECTOR", color: "#F59E0B" },
      { x: 720, y: 150, label: "NEW SIGNUP HORIZON", color: "#8B5CF6" },
    ];
    clusterLabels.forEach(cl => {
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = cl.color + "77";
      ctx.textAlign = "center";
      ctx.letterSpacing = "3px";
      ctx.fillText(cl.label, cl.x, cl.y);
    });

    // Draw stars
    customers.forEach((cust, i) => {
      const isFilteredOut = filteredOutIds.has(cust.id);
      if (isFilteredOut) {
        // Render filtered stars as faint gray dust points
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#4b5563";
        ctx.beginPath();
        ctx.arc(cust.x, cust.y, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        return;
      }

      const color = segmentColors[cust.segment];
      // Size proportional to LTV
      const size = 3 + (cust.ltv / 4000) * 5;
      const twinkle = 0.6 + 0.4 * Math.sin(tick * 0.035 + i * 0.7);

      // Star Outer Glow
      const glow = ctx.createRadialGradient(cust.x, cust.y, 0, cust.x, cust.y, size * 2.8);
      glow.addColorStop(0, color + "3a");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cust.x, cust.y, size * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Star Core
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = isLight ? "#1E293B" : "#ffffff";
      ctx.beginPath();
      ctx.arc(cust.x, cust.y, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cust.x, cust.y, size, size * 0.4, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Orbit lines around High Value stars (LTV > ₹2000)
      if (cust.ltv > 2000) {
        ctx.strokeStyle = color + "22";
        ctx.lineWidth = 0.6;
        ctx.save();
        ctx.translate(cust.x, cust.y);
        ctx.rotate(tick * 0.015 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 2.2, size * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiting satellite dot (moon)
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(size * 2.2, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Red hazard ring around high churn risk customers
      if (cust.churnRisk > 75) {
        ctx.strokeStyle = "rgba(239,68,68,0.4)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([1, 3]);
        ctx.beginPath();
        ctx.arc(cust.x, cust.y, size + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Hover Crosshairs
    if (hovered && !filteredOutIds.has(hovered.id)) {
      const color = segmentColors[hovered.segment];
      // Draw reticle
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hovered.x, hovered.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair ticks
      ctx.beginPath();
      ctx.moveTo(hovered.x - 12, hovered.y);
      ctx.lineTo(hovered.x - 6, hovered.y);
      ctx.moveTo(hovered.x + 6, hovered.y);
      ctx.lineTo(hovered.x + 12, hovered.y);
      ctx.moveTo(hovered.x, hovered.y - 12);
      ctx.lineTo(hovered.x, hovered.y - 6);
      ctx.moveTo(hovered.x, hovered.y + 6);
      ctx.lineTo(hovered.x, hovered.y + 12);
      ctx.stroke();

      // Faint lines to neighbors of same segment
      ctx.strokeStyle = color + "35";
      ctx.lineWidth = 0.4;
      customers.forEach(other => {
        if (other.id === hovered.id || other.segment !== hovered.segment || filteredOutIds.has(other.id)) return;
        const dist = Math.sqrt((hovered.x - other.x) ** 2 + (hovered.y - other.y) ** 2);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(hovered.x, hovered.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      });

      // Monospace star name tooltip
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = isLight ? "#1E293B" : "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(hovered.name.toUpperCase(), hovered.x, hovered.y - 15);
    }

    // Sonar Ping Animation
    if (sonarPing.current.active) {
      ctx.strokeStyle = "rgba(59,130,246,0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sonarPing.current.x, sonarPing.current.y, sonarPing.current.r, 0, Math.PI * 2);
      ctx.stroke();

      if (sonarPing.current.r > 25) {
        ctx.strokeStyle = "rgba(139,92,246,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sonarPing.current.x, sonarPing.current.y, sonarPing.current.r - 25, 0, Math.PI * 2);
        ctx.stroke();
      }

      sonarPing.current.r += 2.8;
      if (sonarPing.current.r > 120) {
        sonarPing.current.active = false;
      }
    }

    ctx.restore();
  };

  /* Canvas Loop Manager */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tick = 0;

    const loop = () => {
      // Damping Pan and Zoom interpolation for smooth visual slide effects
      setPan(current => {
        const dx = targetPan.current.x - current.x;
        const dy = targetPan.current.y - current.y;
        if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) return current;
        return {
          x: current.x + dx * 0.1,
          y: current.y + dy * 0.1
        };
      });

      setZoom(current => {
        const dz = targetZoom.current - current;
        if (Math.abs(dz) < 0.001) return current;
        return current + dz * 0.1;
      });

      draw(ctx, canvas, tick++);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [customers, filteredCustomers]);

  /* Drag Handlers */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - targetPan.current.x, y: e.clientY - targetPan.current.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = ((e.clientX - rect.left) * scaleX - pan.x) / zoom;
    const clickY = ((e.clientY - rect.top) * scaleY - pan.y) / zoom;

    if (isDragging) {
      const nextPan = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      targetPan.current = nextPan;
      setPan(nextPan);
    } else {
      // Hover checks
      let found: Customer | null = null;
      let minDist = 18;
      customers.forEach(cust => {
        if (filteredOutIds.has(cust.id)) return;
        const dist = Math.sqrt((cust.x - clickX) ** 2 + (cust.y - clickY) ** 2);
        if (dist < minDist) { minDist = dist; found = cust; }
      });
      setHovered(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = ((e.clientX - rect.left) * scaleX - pan.x) / zoom;
    const clickY = ((e.clientY - rect.top) * scaleY - pan.y) / zoom;

    let found: Customer | null = null;
    let minDist = 20;
    customers.forEach(cust => {
      if (filteredOutIds.has(cust.id)) return;
      const dist = Math.sqrt((cust.x - clickX) ** 2 + (cust.y - clickY) ** 2);
      if (dist < minDist) { minDist = dist; found = cust; }
    });

    if (found) {
      handleSelectCustomer(found);
    } else {
      setSelected(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.4, targetZoom.current * delta), 3.0);
    targetZoom.current = newZoom;
  };

  /* Search Query Autocomplete */
  const matchingSuggestions = searchQuery.trim()
    ? customers.filter(c => 
        !filteredOutIds.has(c.id) && 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSegmentToggle = (seg: Customer["segment"]) => {
    setSelectedSegments(prev => 
      prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
    );
  };

  /* Constellation Directory Stats */
  const constellationStats = (["Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"] as const).map(seg => {
    const members = customers.filter(c => c.segment === seg);
    const avgLtv = Math.round(members.reduce((s, c) => s + c.ltv, 0) / (members.length || 1));
    const avgRisk = Math.round(members.reduce((s, c) => s + c.churnRisk, 0) / (members.length || 1));
    return { seg, count: members.length, avgLtv, avgRisk, color: segmentColors[seg] };
  });

  return (
    <div className={`flex-1 flex overflow-hidden relative ${isLight ? "bg-gray-50 text-gray-900" : "bg-[#050816] text-white"}`}>
      {/* Background Matrix overlays */}
      <div className={`pointer-events-none absolute inset-0 space-grid opacity-35 z-0 ${isLight ? "hidden" : ""}`} />
      <div className={`pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0 ${isLight ? "hidden" : ""}`} />

      {/* ════════════════════════════════════════
          LEFT PANEL — GALAXY CONTROLS
      ════════════════════════════════════════ */}
      <aside className={`w-64 shrink-0 flex flex-col border-r p-4 space-y-5 overflow-y-auto relative z-30 transition-all duration-300
        ${showCrmFilters ? "fixed inset-y-0 left-0 w-64 h-full border-r flex" : "hidden lg:flex"}
        ${isLight ? "border-gray-200 bg-white" : "border-gray-800/60 bg-[#050816]/95 lg:bg-gray-950/45 backdrop-blur-md"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-space text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>
              <SlidersHorizontal size={14} className={isLight ? "text-blue-600" : "text-blue-400"} />
              Galaxy Filters
            </h2>
            <p className={`font-mono text-[8px] uppercase ${isLight ? "text-gray-500" : "text-gray-555"}`}>Isolate sectors of customer space</p>
          </div>
          <button 
            onClick={() => setShowCrmFilters(false)}
            className={`lg:hidden p-1 rounded-lg border transition-colors cursor-pointer ${
              isLight ? "border-gray-200 text-gray-500 hover:text-gray-900" : "border-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Segment Toggles */}
        <div className="space-y-2">
          <label className={`font-mono text-[9px] uppercase tracking-wider block ${isLight ? "text-gray-500" : "text-gray-400"}`}>Constellations</label>
          <div className="flex flex-col gap-1.5">
            {(["Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"] as const).map(seg => {
              const active = selectedSegments.includes(seg);
              const color = segmentColors[seg];
              return (
                <button
                  key={seg}
                  onClick={() => handleSegmentToggle(seg)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-left font-mono text-[10px] cursor-pointer transition-all ${
                    active 
                      ? isLight ? "bg-gray-50" : "bg-gray-900/65" 
                      : isLight ? "border-gray-200 bg-transparent opacity-40 hover:opacity-75" : "border-gray-800 bg-transparent opacity-40 hover:opacity-75"
                  }`}
                  style={{ borderColor: active ? `${color}40` : undefined }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className={`font-semibold ${isLight ? "text-gray-800" : "text-gray-300"}`}>{seg}</span>
                  </div>
                  <span className={`text-[9px] ${isLight ? "text-gray-400" : "text-gray-550"}`}>
                    {customers.filter(c => c.segment === seg).length}*
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LTV Threshold Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className={isLight ? "text-gray-500 uppercase tracking-wider" : "text-gray-400 uppercase tracking-wider"}>Min LTV Yield</span>
            <span className="text-blue-500 font-bold">₹{minLtv.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={15000}
            step={500}
            value={minLtv}
            onChange={e => setMinLtv(Number(e.target.value))}
            className={`w-full accent-blue-500 h-1 rounded-full border-none cursor-pointer ${isLight ? "bg-gray-200" : "bg-gray-900"}`}
          />
        </div>

        {/* Max Churn Risk Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className={isLight ? "text-gray-500 uppercase tracking-wider" : "text-gray-400 uppercase tracking-wider"}>Max Churn Risk</span>
            <span className="text-red-500 font-bold">{maxChurnRisk}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={maxChurnRisk}
            onChange={e => setMaxChurnRisk(Number(e.target.value))}
            className={`w-full accent-red-500 h-1 rounded-full border-none cursor-pointer ${isLight ? "bg-gray-200" : "bg-gray-900"}`}
          />
        </div>

        {/* Preferred Channel Dropdown */}
        <div className="space-y-1.5">
          <label className={`font-mono text-[9px] uppercase tracking-wider block ${isLight ? "text-gray-500" : "text-gray-400"}`}>Communication Node</label>
          <select
            value={preferredChannel}
            onChange={e => setPreferredChannel(e.target.value)}
            className={`w-full rounded-lg p-2 font-mono text-[10px] focus:outline-none focus:border-blue-500/50 ${
              isLight ? "bg-white border-gray-200 text-gray-800" : "bg-gray-900 border border-gray-800 text-white"
            }`}
          >
            <option value="All">ALL NODES</option>
            <option value="Email">EMAIL ONLY</option>
            <option value="WhatsApp">WHATSAPP ONLY</option>
            <option value="SMS">SMS ONLY</option>
            <option value="RCS">RCS CARDS ONLY</option>
          </select>
        </div>

        {/* Constellations directory */}
        <div className={`border-t pt-4 space-y-3 ${isLight ? "border-gray-150" : "border-gray-800/60"}`}>
          <div>
            <h3 className={`font-space text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-gray-900" : "text-white"}`}>
              <Compass size={13} className="text-orbit-purple" />
              Constellation Directory
            </h3>
            <p className={`font-mono text-[8px] uppercase mt-0.5 ${isLight ? "text-gray-400" : "text-gray-550"}`}>Segment profile metrics</p>
          </div>
          <div className="flex flex-col gap-2">
            {constellationStats.map(stat => (
              <div key={stat.seg} className={`p-2 rounded-lg border text-[9px] font-mono space-y-1 ${
                isLight ? "bg-slate-50/50 border-gray-200" : "bg-gray-900/10 border border-gray-900"
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase" style={{ color: stat.color }}>{stat.seg}</span>
                  <span className={isLight ? "text-gray-500" : "text-gray-555"}>{stat.count} stars</span>
                </div>
                <div className={`flex justify-between mt-1 ${isLight ? "text-gray-500" : "text-gray-555"}`}>
                  <span>Avg LTV:</span>
                  <span className={isLight ? "text-slate-800" : "text-gray-300"}>₹{stat.avgLtv.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between ${isLight ? "text-gray-500" : "text-gray-555"}`}>
                  <span>Avg Risk:</span>
                  <span className={stat.avgRisk > 60 ? "text-red-500 font-bold" : (isLight ? "text-slate-800" : "text-gray-300")}>{stat.avgRisk}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          CENTER PANEL — THE CUSTOMER GALAXY
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Page title header */}
        <div className={`shrink-0 px-6 pt-4 ${isLight ? "bg-white/40 border-b border-gray-200" : "bg-gray-950/20"}`}>
          <PageHeaderHUD
            title="Customer Galaxy"
            subtitle="Visualizing customer density clusters as constellations"
            onSelectAgent={setSelectedAgent}
            actions={
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowCrmFilters(true)}
                  className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors ${
                    isLight ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50" : "bg-gray-900/50 border border-gray-800 text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <SlidersHorizontal size={12} className="text-blue-400" />
                  <span>Filters</span>
                </button>

                {/* View Switcher Toggle */}
                <div className={`flex items-center rounded-lg p-0.5 border font-mono text-[9px] ${
                  isLight ? "bg-gray-100 border-gray-200" : "bg-gray-950 border-gray-900"
                }`}>
                  <button
                    onClick={() => setViewMode("galaxy")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "galaxy"
                        ? "bg-blue-600 text-white font-bold"
                        : isLight ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Compass size={11} />
                    <span>Galaxy</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white font-bold"
                        : isLight ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <List size={11} />
                    <span>List</span>
                  </button>
                </div>

                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[9px] ${
                  isLight ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-gray-900/30 border-gray-800 text-gray-500"
                }`}>
                  <Eye size={11} className={isLight ? "text-blue-600" : "text-blue-400"} />
                  <span>STARS VISIBLE: {filteredCustomers.length} / {customers.length}</span>
                </div>
              </div>
            }
          />
        </div>

        {viewMode === "galaxy" ? (
          /* Canvas Workspace */
          <div className={`flex-1 relative overflow-hidden ${isLight ? "bg-gray-50" : "bg-[#03040c]"}`}>
            <canvas
              ref={canvasRef}
              width={1000}
              height={850}
              className="w-full h-full block"
              onClick={handleCanvasClick}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? "grabbing" : "crosshair" }}
            />

            {/* Floating HUD Search overlay */}
            <div className="absolute top-4 left-4 w-64">
              <div className="relative">
                <div className="flex items-center gap-2 bg-gray-950/90 border border-gray-800 rounded-xl px-3 py-2 text-white focus-within:border-blue-500/50 shadow-2xl backdrop-blur-md">
                  <Search size={13} className="text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search customer star..."
                    className="flex-1 bg-transparent text-xs font-mono text-white placeholder-gray-600 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-500 hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Autocomplete suggestions */}
                {showSuggestions && matchingSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 border border-gray-800 bg-gray-950/95 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md divide-y divide-gray-900 font-mono text-xs">
                    {matchingSuggestions.map(sug => {
                      const color = segmentColors[sug.segment];
                      return (
                        <button
                          key={sug.id}
                          onClick={() => handleSelectCustomer(sug)}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-500/5 hover:text-white text-gray-300 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold">{sug.name}</p>
                            <span className="text-[9px] text-gray-550 uppercase">{sug.segment}</span>
                          </div>
                          <span className="text-[9px] font-bold text-gray-400" style={{ color }}>
                            ₹{sug.ltv.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Canvas guidance hint */}
            <div className="absolute top-4 right-4 pointer-events-none font-mono text-[8px] text-gray-500 bg-gray-950/80 px-2.5 py-1.5 rounded-lg border border-gray-850 shadow-md">
              [ WHEEL TO ZOOM · DRAG TO NAVIGATE · CLICK STAR TO INSPECT ]
            </div>

            {/* Zoom & Pan Camera controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
              <button
                onClick={() => {
                  targetZoom.current = Math.min(3.0, targetZoom.current * 1.35);
                }}
                title="Zoom In"
                className="w-9 h-9 rounded-xl bg-gray-950/90 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => {
                  targetZoom.current = Math.max(0.4, targetZoom.current * 0.75);
                }}
                title="Zoom Out"
                className="w-9 h-9 rounded-xl bg-gray-950/90 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={() => {
                  targetZoom.current = 0.85;
                  const canvas = canvasRef.current;
                  if (canvas) {
                    targetPan.current = {
                      x: canvas.width / 2 - 500 * 0.85,
                      y: canvas.height / 2 - 500 * 0.85
                    };
                  }
                }}
                title="Recenter Galaxy"
                className="w-9 h-9 rounded-xl bg-gray-950/90 border border-gray-800 text-gray-550 hover:text-gray-300 font-mono text-[8px] hover:border-gray-750 transition-all flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
              >
                RST
              </button>
            </div>
          </div>
        ) : (
          /* List Workspace - Tabular Database */
          <div className={`flex-1 flex flex-col min-h-0 p-4 sm:p-6 overflow-hidden ${isLight ? "bg-[#F8FAFC]" : "bg-[#050816]"}`}>
            {/* Search and Filters Strip */}
            <div className="shrink-0 flex items-center gap-3 mb-4">
              <div className="flex-1 max-w-md relative">
                <div className="flex items-center gap-2 bg-gray-950/90 border border-gray-800 rounded-xl px-3 py-2 text-white focus-within:border-blue-500/50 shadow-2xl backdrop-blur-md">
                  <Search size={13} className="text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search customer by ID, Name, Email, Phone..."
                    className="flex-1 bg-transparent text-xs font-mono text-white placeholder-gray-600 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-500 hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table wrapper with vertical scroll */}
            <div className="flex-1 overflow-auto border border-gray-800/60 rounded-xl bg-gray-950/20 backdrop-blur-md">
              <table className="w-full text-left border-collapse font-mono text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/30 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                    <th 
                      onClick={() => {
                        setSortField("id");
                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                      }}
                      className="p-3.5 cursor-pointer hover:bg-gray-900/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ID</span>
                        <ArrowUpDown size={10} className="text-gray-500" />
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        setSortField("name");
                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                      }}
                      className="p-3.5 cursor-pointer hover:bg-gray-900/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Name</span>
                        <ArrowUpDown size={10} className="text-gray-500" />
                      </div>
                    </th>
                    <th className="p-3.5 hidden md:table-cell">Email</th>
                    <th className="p-3.5 hidden md:table-cell">Phone</th>
                    <th className="p-3.5">Segment</th>
                    <th className="p-3.5 hidden lg:table-cell">Persona</th>
                    <th 
                      onClick={() => {
                        setSortField("ltv");
                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                      }}
                      className="p-3.5 cursor-pointer hover:bg-gray-900/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>LTV</span>
                        <ArrowUpDown size={10} className="text-gray-500" />
                      </div>
                    </th>
                    <th className="p-3.5 hidden sm:table-cell">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/60">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 font-mono">
                        No customer nodes matched the active filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((cust) => {
                      const isSelected = selected?.id === cust.id;
                      const badgeClass = segmentColorsMap[cust.segment] || "";
                      return (
                        <tr 
                          key={cust.id}
                          onClick={() => setSelected(cust)}
                          className={`hover:bg-gray-900/35 transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-950/20 border-l-2 border-l-blue-500" : ""
                          }`}
                        >
                          <td className="p-3.5 text-[10px] text-gray-500 font-bold">{cust.id}</td>
                          <td className="p-3.5 text-white font-space font-semibold">{cust.name}</td>
                          <td className="p-3.5 text-gray-400 hidden md:table-cell">{cust.email || "—"}</td>
                          <td className="p-3.5 text-gray-400 hidden md:table-cell">{cust.phone || "—"}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${badgeClass}`}>
                              {cust.segment}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-400 hidden lg:table-cell truncate max-w-[120px]">
                            {cust.dna[0] || "—"}
                          </td>
                          <td className="p-3.5 font-bold text-white">₹{cust.ltv.toLocaleString()}</td>
                          <td className="p-3.5 text-gray-400 hidden sm:table-cell">
                            {cust.predictedNextPurchase ? "Vega Projected" : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1 font-mono text-[10px] text-gray-500">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, searchedCustomers.length)} of {searchedCustomers.length} nodes
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-gray-800 bg-gray-950 hover:text-white disabled:opacity-40 disabled:hover:text-gray-550 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-gray-300">
                    Page <span className="font-bold text-blue-400">{currentPage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-gray-800 bg-gray-950 hover:text-white disabled:opacity-40 disabled:hover:text-gray-550 transition-all cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════
          RIGHT PANEL — STAR INSPECTOR / DNA
      ════════════════════════════════════════ */}
      {selected && (
        <aside className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 sm:relative sm:shrink-0 sm:inset-y-0 sm:z-10 flex flex-col border-l p-5 space-y-4 overflow-y-auto h-full sm:h-auto animate-fade-in-up ${
          isLight ? "bg-white border-slate-200" : "border-[rgba(255,255,255,0.08)] bg-[#1E293B]/95 backdrop-blur-xl"
        }`}>
          <div className={`flex items-start justify-between border-b pb-3 ${
            isLight ? "border-slate-100" : "border-[rgba(255,255,255,0.08)]"
          }`}>
            <div>
              <h2 className={`font-space text-base font-bold tracking-tight leading-snug ${
                isLight ? "text-slate-800" : "text-white"
              }`}>{selected.name}</h2>
              <span className={`font-mono text-[9px] ${isLight ? "text-slate-500" : "text-gray-400"}`}>{selected.email}</span>
            </div>
            <button
              onClick={() => setSelected(null)}
              className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                isLight ? "border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800" : "border-[rgba(255,255,255,0.08)] hover:border-gray-700 text-gray-500 hover:text-white"
              }`}
            >
              <X size={13} />
            </button>
          </div>

          {/* Segment Badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl border animate-shimmer"
               style={{ backgroundColor: `${segmentColors[selected.segment]}12`, borderColor: `${segmentColors[selected.segment]}25` }}>
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: segmentColors[selected.segment] }} />
            <span className="font-mono text-xs font-bold uppercase animate-pulse" style={{ color: segmentColors[selected.segment] }}>
              {selected.segment}
            </span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Lifetime Value", value: `₹${selected.ltv.toLocaleString()}` },
              { label: "Purchase Count", value: `${selected.purchaseCount} orders` },
              { label: "Churn Risk Score", value: `${selected.churnRisk}%` },
              { label: "Preferred Node", value: selected.preferredChannel },
            ].map((kpi, i) => (
              <div key={i} className={`rounded-xl p-3.5 shadow-sm transition-all duration-300 border ${
                isLight 
                  ? "bg-slate-50 border-slate-200 hover:border-slate-350" 
                  : "bg-[#0F172A] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
              }`}>
                <span className={`font-mono text-[8.5px] uppercase tracking-wider block ${
                  isLight ? "text-slate-500" : "text-gray-400"
                }`}>{kpi.label}</span>
                <span className={`font-space text-base font-bold mt-1 block ${
                  isLight ? "text-slate-800" : "text-white"
                }`}>{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Churn Trend indicators */}
          <div className={`flex items-center justify-between p-2.5 rounded-xl border font-mono text-[10px] ${
            isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-gray-900 bg-gray-950/40"
          }`}>
            <span className={isLight ? "text-slate-500 uppercase tracking-wider" : "text-gray-400 uppercase tracking-wider"}>Churn Risk Trend</span>
            <div className="flex items-center gap-1.5 font-bold">
              {selected.churnTrend === "up" ? (
                <span className="text-red-400 flex items-center gap-1">
                  <TrendingUp size={12} /> ESCALATING
                </span>
              ) : selected.churnTrend === "down" ? (
                <span className="text-orbit-success flex items-center gap-1">
                  <TrendingDown size={12} /> DECLINING
                </span>
              ) : (
                <span className="text-gray-400 flex items-center gap-1">
                  <Minus size={12} /> STABLE
                </span>
              )}
            </div>
          </div>

          {/* DNA Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="text-orbit-purple" />
              <span className="font-mono text-[8px] text-gray-450 uppercase tracking-widest">Customer DNA Markers</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.dna.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded border border-orbit-purple/20 bg-orbit-purple/10 text-orbit-purple font-mono text-[9px] tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Purchase History */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ShoppingBag size={12} className="text-orbit-blue" />
              <span className={`font-mono text-[8px] uppercase tracking-widest ${isLight ? "text-gray-500" : "text-gray-450"}`}>Order Ledger History</span>
            </div>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {orders.filter(o => o.customerId === selected.id).length === 0 ? (
                <p className={`font-mono text-[9px] text-center py-3 ${isLight ? "text-gray-500" : "text-gray-650"}`}>No orders recorded in current ledger</p>
              ) : (
                orders
                  .filter(o => o.customerId === selected.id)
                  .map((order, idx) => (
                    <div key={idx} className={`p-2 rounded-lg border flex items-center justify-between text-[9px] font-mono ${
                      isLight ? "bg-slate-50 border-slate-200" : "bg-gray-900/10 border-gray-900"
                    }`}>
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold truncate ${isLight ? "text-slate-800" : "text-white"}`}>{order.product}</p>
                        <span className={`text-[8.5px] ${isLight ? "text-gray-500" : "text-gray-600"}`}>{order.date} · via {order.channel}</span>
                      </div>
                      <span className="text-orbit-success font-semibold shrink-0 ml-2">₹{order.amount.toLocaleString()}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Predicted Next Purchase (Vega model) */}
          <div className={`p-3.5 rounded-xl border space-y-1.5 relative overflow-hidden ${
            isLight ? "bg-blue-50/30 border-blue-200" : "bg-orbit-blue/5 border-orbit-blue/20"
          }`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-orbit-glow-blue opacity-30 pointer-events-none" />
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-orbit-blue font-bold uppercase tracking-wider relative z-10">
              <Compass size={11} className="animate-spin-slow" />
              <span>VEGA CONVERSION PROJECTION</span>
            </div>
            <p className={`font-mono text-xs font-semibold relative z-10 ${isLight ? "text-slate-800" : "text-white"}`}>{selected.predictedNextPurchase}</p>
            <p className="font-mono text-[9px] text-gray-500 relative z-10">Expected Product Category: <span className={isLight ? "text-slate-800 font-bold" : "text-gray-300 font-bold"}>{selected.predictedCategory}</span></p>
          </div>

          {/* AI Profile Summary (Wrapped) */}
          <div className={`p-4 rounded-xl border space-y-2 relative overflow-hidden ${
            isLight ? "bg-purple-50/30 border-purple-200" : "bg-orbit-purple/5 border-orbit-purple/20"
          }`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-orbit-glow-purple opacity-30 pointer-events-none" />
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-orbit-purple font-bold uppercase tracking-wider relative z-10">
              <Cpu size={12} className="animate-pulse" />
              <span>AI Wrapped Profile Summary</span>
            </div>
            <p className={`font-mono text-[10px] leading-relaxed relative z-10 ${isLight ? "text-slate-700" : "text-gray-300"}`}>
              {generateAiSummary(selected)}
            </p>
          </div>

        </aside>
      )}
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
