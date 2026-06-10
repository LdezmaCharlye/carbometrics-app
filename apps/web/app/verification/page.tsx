"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Leaf, ArrowLeft, CheckCircle, Clock, ChevronDown,
  FileImage, X, ZoomIn,
} from "lucide-react";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const SCOPE_LABEL: Record<string, string> = {
  SCOPE_1: "Alcance 1", SCOPE_2: "Alcance 2", SCOPE_3: "Alcance 3",
};
const SCOPE_COLOR: Record<string, string> = {
  SCOPE_1: "bg-blue-50 text-blue-600 border-blue-200",
  SCOPE_2: "bg-amber-50 text-amber-600 border-amber-200",
  SCOPE_3: "bg-green-50 text-green-600 border-green-200",
};
const UNIT_LABELS: Record<string, string> = {
  LITER: "L", KWH: "kWh", MWH: "MWh", M3: "m³", KG: "kg", TON: "Ton", KM: "km",
};

function getImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function formatSourceName(name: string): string {
  if (name.toLowerCase().includes("gasolina"))   return "Combustible — Gasolina";
  if (name.toLowerCase().includes("diesel") || name.toLowerCase().includes("diésel")) return "Combustible — Diésel";
  if (name.toLowerCase().includes("gas natural")) return "Combustible — Gas Natural";
  return name;
}

interface Log {
  id: string;
  year: number;
  month: number;
  quantity: number;
  emissionsKgCO2eq: number;
  notes: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  verificationNote: string | null;
  createdAt: string;
  emissionSource: { id: string; name: string; scope: string; unit: string };
  recordedBy: { id: string; name: string };
  verifiedBy: { id: string; name: string } | null;
  evidenceImages: { id: string; url: string; thumbnailUrl: string | null; fileName: string }[];
}

// ── Modal imagen con zoom y drag ─────────────────────────────────────────────
function ImageModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos,   setPos]   = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last     = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(8, Math.max(0.5, s - e.deltaY * 0.001)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPos((p) => ({ x: p.x + e.clientX - last.current.x, y: p.y + e.clientY - last.current.y }));
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => { dragging.current = false; };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-3 bg-black/40 z-10 pointer-events-none">
        <span className="text-white/80 text-sm truncate max-w-xs">{name}</span>
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-white/60 text-xs">{Math.round(scale * 100)}%</span>
          <button onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }}
            className="text-white/70 hover:text-white text-xs border border-white/30 rounded px-2 py-0.5 transition">
            Restablecer
          </button>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ width: "90vw", height: "90vh", cursor: dragging.current ? "grabbing" : scale > 1 ? "grab" : "default" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      >
        <img src={url} alt={name} draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: "center center",
            maxWidth: "88vw", maxHeight: "88vh",
            userSelect: "none", pointerEvents: "none",
          }} />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none whitespace-nowrap">
        Rueda para zoom · Arrastra para mover · Esc o clic derecho para cerrar
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function VerificationPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [logs,        setLogs]        = useState<Log[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [viewYear,    setViewYear]    = useState(currentYear);
  const [viewMonth,   setViewMonth]   = useState<number | "all">("all");
  const [filterVerif, setFilterVerif] = useState<"all" | "pending" | "verified">("all");
  const [filterScope, setFilterScope] = useState<"all" | "SCOPE_1" | "SCOPE_2" | "SCOPE_3">("all");
  const [verifying,      setVerifying]      = useState<string | null>(null);
  const [modalImg,       setModalImg]       = useState<{ url: string; name: string } | null>(null);
  const [verifyNote,     setVerifyNote]     = useState("");
  const [verifyingModal, setVerifyingModal] = useState<Log | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/consumption/list?year=${viewYear}${viewMonth !== "all" ? `&month=${viewMonth}` : ""}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, [router, token, viewYear, viewMonth]);

  const toggleVerify = async (id: string, note?: string) => {
    setVerifying(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ verificationNote: note ?? null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLogs((prev) => prev.map((l) => l.id === id ? {
          ...l,
          isVerified: updated.isVerified,
          verifiedAt: updated.verifiedAt,
          verifiedBy: updated.verifiedBy,
          verificationNote: updated.verificationNote,
        } : l));
      }
    } catch {}
    setVerifying(null);
    setVerifyingModal(null);
    setVerifyNote("");
  };

  const filtered = logs.filter((l) => {
    if (filterVerif === "pending"  && l.isVerified)  return false;
    if (filterVerif === "verified" && !l.isVerified) return false;
    if (filterScope !== "all" && l.emissionSource.scope !== filterScope) return false;
    return true;
  });

  const totalPending  = logs.filter((l) => !l.isVerified).length;
  const totalVerified = logs.filter((l) => l.isVerified).length;
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const scopeFilters: { key: "all" | "SCOPE_1" | "SCOPE_2" | "SCOPE_3"; label: string }[] = [
    { key: "all",     label: "Todos"   },
    { key: "SCOPE_1", label: "Alc. 1" },
    { key: "SCOPE_2", label: "Alc. 2" },
    { key: "SCOPE_3", label: "Alc. 3" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {modalImg && <ImageModal url={modalImg.url} name={modalImg.name} onClose={() => setModalImg(null)} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Verificación de registros</p>
              <p className="text-xs text-gray-400">CarboMetrics · ISO 14064-1</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span><strong>{totalPending}</strong> pendientes</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span><strong>{totalVerified}</strong> verificados</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-7 space-y-5">

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={viewMonth} onChange={(e) => setViewMonth(e.target.value === "all" ? "all" : parseInt(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
              <option value="all">Todos los meses</option>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {scopeFilters.map((f) => (
              <button key={f.key} onClick={() => setFilterScope(f.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  filterScope === f.key
                    ? f.key === "SCOPE_1" ? "bg-blue-500 text-white"
                    : f.key === "SCOPE_2" ? "bg-amber-500 text-white"
                    : f.key === "SCOPE_3" ? "bg-green-600 text-white"
                    : "bg-gray-700 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {(["all","pending","verified"] as const).map((f) => (
              <button key={f} onClick={() => setFilterVerif(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  filterVerif === f ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-700"
                }`}>
                {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : "Verificados"}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 ml-auto">{filtered.length} registro(s)</span>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Leaf className="w-5 h-5 animate-pulse mr-2" />Cargando registros...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">No hay registros para mostrar</p>
            <p className="text-xs text-gray-300 mt-1">Cambia los filtros o registra nuevos consumos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id}
                className={`bg-white rounded-2xl border transition ${
                  log.isVerified ? "border-green-200 bg-green-50/30" : "border-gray-200"
                }`}>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Mes */}
                    <div className="text-center bg-gray-50 rounded-xl px-3 py-2 min-w-14 flex-shrink-0">
                      <p className="text-xs text-gray-400 font-medium">{MONTHS[log.month - 1].slice(0,3)}</p>
                      <p className="text-sm font-bold text-gray-700">{log.year}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {formatSourceName(log.emissionSource.name)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SCOPE_COLOR[log.emissionSource.scope]}`}>
                          {SCOPE_LABEL[log.emissionSource.scope]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>
                          <strong className="text-gray-600">{log.quantity.toFixed(2)}</strong>{" "}
                          {UNIT_LABELS[log.emissionSource.unit] ?? log.emissionSource.unit}
                        </span>
                        <span>·</span>
                        <span>{log.recordedBy.name}</span>
                        {log.evidenceImages.length > 0 && (
                          <>
                            <span>·</span>
                            <button
                              onClick={() => setModalImg({ url: getImageUrl(log.evidenceImages[0].url), name: log.evidenceImages[0].fileName })}
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-600 transition">
                              <FileImage className="w-3 h-3" />
                              {log.evidenceImages.length} imagen(es)
                            </button>
                          </>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-gray-400 truncate max-w-sm">{log.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Botón verificar directo */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <button
                      onClick={() => log.isVerified ? toggleVerify(log.id) : setVerifyingModal(log)}
                      disabled={verifying === log.id}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                        log.isVerified
                          ? "bg-green-50 text-green-600 border-green-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-green-600 hover:text-white hover:border-green-600"
                      }`}>
                      {verifying === log.id
                        ? <span className="animate-pulse">...</span>
                        : log.isVerified
                          ? <><CheckCircle className="w-3.5 h-3.5" />Verificado</>
                          : <><Clock className="w-3.5 h-3.5" />Verificar</>
                      }
                    </button>
                    {log.isVerified && log.verifiedBy && (
                      <p className="text-xs text-gray-400">
                        {log.verifiedBy.name} · {log.verifiedAt ? new Date(log.verifiedAt).toLocaleDateString("es-ES") : ""}
                      </p>
                    )}
                    {log.isVerified && log.verificationNote && (
                      <p className="text-xs text-green-600 max-w-32 text-right truncate" title={log.verificationNote}>
                        "{log.verificationNote}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    {/* Modal verificación con nota */}
      {verifyingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 mb-1">Verificar registro</h3>
            <p className="text-xs text-gray-400 mb-4">
              {formatSourceName(verifyingModal.emissionSource.name)} · {MONTHS[verifyingModal.month - 1]} {verifyingModal.year}
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nota de verificación <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="Ej: Verificado contra factura #1234, datos consistentes con medición directa..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="text-xs text-gray-400 mt-1">Esta nota quedará registrada como trazabilidad ISO 14064-1.</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setVerifyingModal(null); setVerifyNote(""); }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={() => toggleVerify(verifyingModal.id, verifyNote)}
                className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">
                Confirmar verificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}