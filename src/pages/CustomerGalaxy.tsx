import React, { useRef, useEffect, useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import type { Customer } from "../context/OrbitContext";
import { 
  X, TrendingDown, TrendingUp, Minus, ShoppingBag, Cpu, 
  Search, SlidersHorizontal, Eye, Compass, ZoomIn, ZoomOut 
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
  const { customers, orders } = useOrbit();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [hovered, setHovered] = useState<Customer | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

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
    "Loyalists": "#22C55E",
    "Slipping Away": "#EC4899",
    "High-Value Inactive": "#F59E0B",
    "New Signups": "#3B82F6",
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
    spaceGrad.addColorStop(0, "#0a0d24");
    spaceGrad.addColorStop(1, "#03040c");
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Background Dust Particles
    ctx.fillStyle = "#ffffff";
    spaceDust.forEach(dust => {
      ctx.globalAlpha = dust.opacity * (0.5 + 0.5 * Math.sin(tick * 0.008 + dust.x));
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
      ctx.strokeStyle = color + "20"; // very faint color

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
      ctx.fillStyle = "#ffffff";
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
      ctx.fillStyle = "#ffffff";
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
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      {/* ════════════════════════════════════════
          LEFT PANEL — GALAXY CONTROLS
      ════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-gray-800/60 bg-gray-950/45 backdrop-blur-md p-4 space-y-5 overflow-y-auto relative z-10">
        <div>
          <h2 className="font-space text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <SlidersHorizontal size={14} className="text-blue-400" />
            Galaxy Filters
          </h2>
          <p className="font-mono text-[8px] text-gray-550 uppercase">Isolate sectors of customer space</p>
        </div>

        {/* Segment Toggles */}
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block">Constellations</label>
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
                      ? "bg-gray-900/65" 
                      : "border-gray-900 bg-transparent opacity-40 hover:opacity-75"
                  }`}
                  style={{ borderColor: active ? `${color}40` : "transparent" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-gray-300 font-semibold">{seg}</span>
                  </div>
                  <span className="text-gray-500 text-[9px]">
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
            <span className="text-gray-400 uppercase tracking-wider">Min LTV Yield</span>
            <span className="text-blue-400 font-bold">₹{minLtv.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={15000}
            step={500}
            value={minLtv}
            onChange={e => setMinLtv(Number(e.target.value))}
            className="w-full accent-blue-500 bg-gray-900 h-1 rounded-full border-none cursor-pointer"
          />
        </div>

        {/* Max Churn Risk Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className="text-gray-400 uppercase tracking-wider">Max Churn Risk</span>
            <span className="text-red-400 font-bold">{maxChurnRisk}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={maxChurnRisk}
            onChange={e => setMaxChurnRisk(Number(e.target.value))}
            className="w-full accent-red-500 bg-gray-900 h-1 rounded-full border-none cursor-pointer"
          />
        </div>

        {/* Preferred Channel Dropdown */}
        <div className="space-y-1.5">
          <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block">Communication Node</label>
          <select
            value={preferredChannel}
            onChange={e => setPreferredChannel(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 font-mono text-[10px] text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="All">ALL NODES</option>
            <option value="Email">EMAIL ONLY</option>
            <option value="WhatsApp">WHATSAPP ONLY</option>
            <option value="SMS">SMS ONLY</option>
            <option value="RCS">RCS CARDS ONLY</option>
          </select>
        </div>

        {/* Constellations directory */}
        <div className="border-t border-gray-800/60 pt-4 space-y-3">
          <div>
            <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={13} className="text-orbit-purple" />
              Constellation Directory
            </h3>
            <p className="font-mono text-[8px] text-gray-550 uppercase mt-0.5">Segment profile metrics</p>
          </div>
          <div className="flex flex-col gap-2">
            {constellationStats.map(stat => (
              <div key={stat.seg} className="p-2 bg-gray-900/10 rounded-lg border border-gray-900 text-[9px] font-mono space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase" style={{ color: stat.color }}>{stat.seg}</span>
                  <span className="text-gray-550">{stat.count} stars</span>
                </div>
                <div className="flex justify-between text-gray-550 mt-1">
                  <span>Avg LTV:</span>
                  <span className="text-gray-300">₹{stat.avgLtv.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-550">
                  <span>Avg Risk:</span>
                  <span className={stat.avgRisk > 60 ? "text-red-400" : "text-gray-300"}>{stat.avgRisk}%</span>
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
        <div className="shrink-0 px-6 pt-4 bg-gray-950/20">
          <PageHeaderHUD
            title="Customer Galaxy"
            subtitle="Visualizing customer density clusters as constellations"
            onSelectAgent={setSelectedAgent}
            actions={
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900/30 border border-gray-800 font-mono text-[9px] text-gray-500">
                <Eye size={11} className="text-blue-400" />
                <span>STARS VISIBLE: {filteredCustomers.length} / {customers.length}</span>
              </div>
            }
          />
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 relative overflow-hidden bg-[#03040c]">
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
              className="w-9 h-9 rounded-xl bg-gray-950/90 border border-gray-800 text-gray-500 hover:text-gray-300 font-mono text-[8px] hover:border-gray-750 transition-all flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
            >
              RST
            </button>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          RIGHT PANEL — STAR INSPECTOR / DNA
      ════════════════════════════════════════ */}
      {selected && (
        <aside className="w-80 shrink-0 flex flex-col border-l border-[rgba(255,255,255,0.08)] bg-[#1E293B]/95 backdrop-blur-xl p-5 space-y-4 overflow-y-auto relative z-10 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
            <div>
              <h2 className="font-space text-base font-bold text-white tracking-tight leading-snug">{selected.name}</h2>
              <span className="font-mono text-[9px] text-gray-400">{selected.email}</span>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="p-1 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-gray-700 text-gray-500 hover:text-white transition-colors cursor-pointer"
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
              <div key={i} className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] rounded-xl p-3.5 shadow-sm transition-all duration-300">
                <span className="font-mono text-[8.5px] text-gray-400 uppercase tracking-wider block">{kpi.label}</span>
                <span className="font-space text-base font-bold text-white mt-1 block">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Churn Trend indicators */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-900 bg-gray-950/40 font-mono text-[10px]">
            <span className="text-gray-400 uppercase tracking-wider">Churn Risk Trend</span>
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
              <span className="font-mono text-[8px] text-gray-450 uppercase tracking-widest">Order Ledger History</span>
            </div>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {orders.filter(o => o.customerId === selected.id).length === 0 ? (
                <p className="font-mono text-[9px] text-gray-650 text-center py-3">No orders recorded in current ledger</p>
              ) : (
                orders
                  .filter(o => o.customerId === selected.id)
                  .map((order, idx) => (
                    <div key={idx} className="p-2 bg-gray-900/10 border border-gray-900 rounded-lg flex items-center justify-between text-[9px] font-mono">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{order.product}</p>
                        <span className="text-gray-600">{order.date} · via {order.channel}</span>
                      </div>
                      <span className="text-orbit-success font-semibold shrink-0 ml-2">₹{order.amount.toLocaleString()}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Predicted Next Purchase (Vega model) */}
          <div className="p-3.5 rounded-xl bg-orbit-blue/5 border border-orbit-blue/20 space-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orbit-glow-blue opacity-30 pointer-events-none" />
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-orbit-blue font-bold uppercase tracking-wider relative z-10">
              <Compass size={11} className="animate-spin-slow" />
              <span>VEGA CONVERSION PROJECTION</span>
            </div>
            <p className="font-mono text-xs font-semibold text-white relative z-10">{selected.predictedNextPurchase}</p>
            <p className="font-mono text-[9px] text-gray-500 relative z-10">Expected Product Category: <span className="text-gray-300 font-bold">{selected.predictedCategory}</span></p>
          </div>

          {/* AI Profile Summary (Wrapped) */}
          <div className="p-4 rounded-xl bg-orbit-purple/5 border border-orbit-purple/20 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orbit-glow-purple opacity-30 pointer-events-none" />
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-orbit-purple font-bold uppercase tracking-wider relative z-10">
              <Cpu size={12} className="animate-pulse" />
              <span>AI Wrapped Profile Summary</span>
            </div>
            <p className="font-mono text-[10px] text-gray-300 leading-relaxed relative z-10">
              {generateAiSummary(selected)}
            </p>
          </div>

        </aside>
      )}
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
