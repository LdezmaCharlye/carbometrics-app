"use client";
import { Suspense } from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Leaf, ArrowLeft, Plus, Trash2, Upload,
  Loader2, ChevronRight, Car, ShieldCheck,
} from "lucide-react";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const SCOPES = [
  { id: "SCOPE_1", label: "Alcance 1", desc: "Emisiones directas (combustión, procesos)", color: "border-red-300 bg-red-50 text-red-700" },
  { id: "SCOPE_2", label: "Alcance 2", desc: "Energía indirecta (electricidad comprada)", color: "border-amber-300 bg-amber-50 text-amber-700" },
  { id: "SCOPE_3", label: "Alcance 3", desc: "Otras emisiones indirectas (cadena de valor)", color: "border-blue-300 bg-blue-50 text-blue-700" },
];
const UNIT_LABELS: Record<string, string> = {
  LITER: "Litros", KWH: "kWh", MWH: "MWh", M3: "m³", KG: "kg",
  TON: "Ton", KM: "km", KM_PASSENGER: "km-pas", TON_KM: "ton-km", TON_WASTE: "ton res.", GALLON_US: "Galón",
};

interface Source { id: string; name: string; unit: string; scope: string; kgCO2: number; kgCH4: number; kgN2O: number; }
interface Branch { id: string; name: string; isActive: boolean; }
interface SavedLog {
  id: string; quantity: number; notes: string | null; dataQuality: string;
  isVerified: boolean; emissionsKgCO2eq: number;
  invoiceNumber: string; plateNumber: string;
  editQuantity: string; editInvoice: string; editPlate: string; editQuality: string;
  evidenceImages: { id: string; url: string; thumbnailUrl: string }[];
}
interface DraftRow {
  id: string; invoiceNumber: string; plateNumber: string;
  quantity: string; dataQuality: string; saving: boolean; imageFile: File | null;
}

function newDraft(): DraftRow {
  return { id: crypto.randomUUID(), invoiceNumber: "", plateNumber: "", quantity: "", dataQuality: "DIGITAL_INVOICE", saving: false, imageFile: null };
}

// ─── Recortador con corrección de perspectiva ─────────────────────────────────
interface Point { x: number; y: number; }

function perspectiveTransform(img: HTMLImageElement, pts: Point[]): HTMLCanvasElement {
  const [tl, tr, br, bl] = pts;
  const W = Math.round(Math.max(Math.hypot(tr.x - tl.x, tr.y - tl.y), Math.hypot(br.x - bl.x, br.y - bl.y)));
  const H = Math.round(Math.max(Math.hypot(bl.x - tl.x, bl.y - tl.y), Math.hypot(br.x - tr.x, br.y - tr.y)));
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const ctx = out.getContext("2d")!;

  // Por cada fila del output, calcular la línea correspondiente en el source
  for (let row = 0; row < H; row++) {
    const t = row / H;
    // Punto izquierdo y derecho de esta fila en coords del source
    const lx = tl.x + (bl.x - tl.x) * t;
    const ly = tl.y + (bl.y - tl.y) * t;
    const rx = tr.x + (br.x - tr.x) * t;
    const ry = tr.y + (br.y - tr.y) * t;
    const rowW = Math.hypot(rx - lx, ry - ly);
    if (rowW < 0.5) continue;
    const angle = Math.atan2(ry - ly, rx - lx);
    const scaleX = W / rowW;
    const scaleY = 1;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, row, W, 1); ctx.clip();
    ctx.setTransform(
      Math.cos(angle) * scaleX,
      Math.sin(angle) * scaleX,
      -Math.sin(angle) * scaleY,
      Math.cos(angle) * scaleY,
      -lx * Math.cos(angle) * scaleX - ly * Math.sin(angle) * scaleX,
      row - lx * (-Math.sin(angle)) * scaleY - ly * Math.cos(angle) * scaleY
    );
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  return out;
}

function ImageCropper({ src, onConfirm, onCancel, loading }: {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imgRef      = useRef<HTMLImageElement | null>(null);
  const cornersRef  = useRef<Point[]>([]);
  const draggingIdx = useRef<number | null>(null);
  const HANDLE = 22;

  const getMidpoints = (corners: Point[]): Point[] => {
    const [tl, tr, br, bl] = corners;
    return [
      { x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2 },
      { x: (tr.x + br.x) / 2, y: (tr.y + br.y) / 2 },
      { x: (br.x + bl.x) / 2, y: (br.y + bl.y) / 2 },
      { x: (bl.x + tl.x) / 2, y: (bl.y + tl.y) / 2 },
    ];
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || cornersRef.current.length < 4) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const [tl, tr, br, bl] = cornersRef.current;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.strokeStyle = "#00e676"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y);
    ctx.closePath(); ctx.stroke();
    cornersRef.current.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, HANDLE / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#00e676"; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
    });
    getMidpoints(cornersRef.current).forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,230,118,0.75)"; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }, []);

  const resetToFull = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = 4;
    cornersRef.current = [
      { x: pad,                y: pad },
      { x: canvas.width - pad, y: pad },
      { x: canvas.width - pad, y: canvas.height - pad },
      { x: pad,                y: canvas.height - pad },
    ];
    draw();
  }, [draw]);

  useEffect(() => {
    // Corregir rotación EXIF antes de cargar en canvas
    const correctOrientation = (src: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // Leer EXIF orientation desde los bytes raw
          const xhr = new XMLHttpRequest();
          xhr.open("GET", src, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = () => {
            let orientation = 1;
            try {
              const view = new DataView(xhr.response);
              if (view.getUint16(0, false) === 0xFFD8) {
                let offset = 2;
                while (offset < view.byteLength) {
                  const marker = view.getUint16(offset, false);
                  offset += 2;
                  if (marker === 0xFFE1) {
                    if (view.getUint32(offset += 2, false) === 0x45786966) {
                      const little = view.getUint16(offset += 6, false) === 0x4949;
                      offset += view.getUint32(offset + 4, little);
                      const tags = view.getUint16(offset, little);
                      offset += 2;
                      for (let i = 0; i < tags; i++) {
                        if (view.getUint16(offset + i * 12, little) === 0x0112) {
                          orientation = view.getUint16(offset + i * 12 + 8, little);
                        }
                      }
                    }
                    break;
                  } else if ((marker & 0xFF00) !== 0xFF00) break;
                  else offset += view.getUint16(offset, false);
                }
              }
            } catch {}

            const tmp = document.createElement("canvas");
            const ctx = tmp.getContext("2d")!;
            if (orientation > 4) {
              tmp.width = img.naturalHeight;
              tmp.height = img.naturalWidth;
            } else {
              tmp.width = img.naturalWidth;
              tmp.height = img.naturalHeight;
            }
            switch (orientation) {
              case 2: ctx.transform(-1, 0, 0, 1, tmp.width, 0); break;
              case 3: ctx.transform(-1, 0, 0, -1, tmp.width, tmp.height); break;
              case 4: ctx.transform(1, 0, 0, -1, 0, tmp.height); break;
              case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
              case 6: ctx.transform(0, 1, -1, 0, tmp.height, 0); break;
              case 7: ctx.transform(0, -1, -1, 0, tmp.height, tmp.width); break;
              case 8: ctx.transform(0, -1, 1, 0, 0, tmp.width); break;
            }
            ctx.drawImage(img, 0, 0);
            resolve(tmp.toDataURL("image/jpeg", 0.95));
          };
          xhr.onerror = () => resolve(src);
          xhr.send();
        };
        img.src = src;
      });
    };

    correctOrientation(src).then((correctedSrc) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current!;
        const maxW = Math.min(window.innerWidth - 8, 500);
        const maxH = window.innerHeight - 110;
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
        canvas.width  = Math.floor(img.naturalWidth  * scale);
        canvas.height = Math.floor(img.naturalHeight * scale);
        resetToFull();
      };
      img.src = correctedSrc;
    });
  }, [src, resetToFull]);

  const getCanvasPos = (e: React.TouchEvent | React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = "touches" in e ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top)  * scaleY,
    };
  };

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const p = getCanvasPos(e);
    const allPoints = [...cornersRef.current, ...getMidpoints(cornersRef.current)];
    let minDist = 70; let idx: number | null = null;
    allPoints.forEach((c, i) => {
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < minDist) { minDist = d; idx = i; }
    });
    draggingIdx.current = idx;
  };

  const onMove = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (draggingIdx.current === null) return;
    const canvas = canvasRef.current!;
    const p = getCanvasPos(e);
    const px = Math.max(0, Math.min(canvas.width,  p.x));
    const py = Math.max(0, Math.min(canvas.height, p.y));
    const idx = draggingIdx.current;
    const [tl, tr, br, bl] = cornersRef.current;
    if (idx < 4) {
      cornersRef.current[idx] = { x: px, y: py };
    } else if (idx === 4) {
      const dy = py - (tl.y + tr.y) / 2;
      cornersRef.current[0] = { x: tl.x, y: tl.y + dy };
      cornersRef.current[1] = { x: tr.x, y: tr.y + dy };
    } else if (idx === 5) {
      const dx = px - (tr.x + br.x) / 2;
      cornersRef.current[1] = { x: tr.x + dx, y: tr.y };
      cornersRef.current[2] = { x: br.x + dx, y: br.y };
    } else if (idx === 6) {
      const dy = py - (br.y + bl.y) / 2;
      cornersRef.current[2] = { x: br.x, y: br.y + dy };
      cornersRef.current[3] = { x: bl.x, y: bl.y + dy };
    } else if (idx === 7) {
      const dx = px - (bl.x + tl.x) / 2;
      cornersRef.current[0] = { x: tl.x + dx, y: tl.y };
      cornersRef.current[3] = { x: bl.x + dx, y: bl.y };
    }
    draw();
  };

  const onEnd = () => { draggingIdx.current = null; };

  const confirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const scaleX = img.naturalWidth  / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;
    const srcPts = cornersRef.current.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
    const out = perspectiveTransform(img, srcPts);
    out.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[999998] bg-black flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 bg-black/90 flex-shrink-0 gap-2">
        <button onClick={onCancel}
          className="text-white text-xs px-3 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition">
          Cancelar
        </button>
        <button onClick={resetToFull}
          className="text-white/80 text-xs px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition">
          ⛶ Completa
        </button>
        <button onClick={confirm} disabled={loading}
          className="bg-green-500 hover:bg-green-400 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✓ Guardar"}
        </button>
      </div>
      <p className="text-center text-white/40 text-xs py-1">Arrastra las esquinas para ajustar</p>
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100vw", maxHeight: "calc(100vh - 80px)", touchAction: "none", display: "block" }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        />
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get("step");
  const scopeParam = searchParams.get("scope") ?? "";
  const [step,           setStep]          = useState<"scope"|"month"|"table">(stepParam === "table" && scopeParam ? "table" : stepParam === "month" && scopeParam ? "month" : "scope");
  const [selectedYear,   setSelectedYear]  = useState(searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear());
  const [selectedScope,  setSelectedScope] = useState(scopeParam);
  const [selectedMonth,  setSelectedMonth] = useState<number|null>(searchParams.get("month") ? parseInt(searchParams.get("month")!) : null);
  const [selectedSource, setSelectedSource] = useState<Source|null>(null);
  const [sources,        setSources]       = useState<Source[]>([]);
  const [branches,         setBranches]         = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [drafts,         setDrafts]        = useState<DraftRow[]>([newDraft()]);
  const [saved,          setSaved]         = useState<SavedLog[]>([]);
  const [loadingSaved,   setLoadingSaved]  = useState(false);
  const [verifying,      setVerifying]     = useState<string|null>(null);
  const [deleting,       setDeleting]      = useState<string|null>(null);

  const [cropSrc,            setCropSrc]            = useState<string|null>(null);
  const [pendingUploadLogId, setPendingUploadLogId] = useState<string|null>(null);
  const [pendingDraft,       setPendingDraft]       = useState<DraftRow|null>(null);
  const [cropLoading,        setCropLoading]        = useState(false);

  const [zoomImage,      setZoomImage]      = useState<string|null>(null);
  const dragging        = useRef(false);
  const lastPos         = useRef({ x: 0, y: 0 });
  const imgRef          = useRef<HTMLImageElement>(null);
  const posRef          = useRef({ x: 0, y: 0 });
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const scaleRef        = useRef(1);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const [yearFrom, setYearFrom] = useState(new Date().getFullYear() - 9);
  const [yearTo,   setYearTo]   = useState(new Date().getFullYear());

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/company-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((company) => {
      if (company?.yearFrom) setYearFrom(company.yearFrom);
      if (company?.yearTo)   setYearTo(company.yearTo);
    }).catch(() => {});
  }, [token]);

  const updateURL = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
      else if (v === "") url.searchParams.delete(k);
    });
    window.history.replaceState({}, "", url.toString());
  };
  const isScope1 = selectedScope === "SCOPE_1";

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sources/factors`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : [];
      setSources(list);
      const sourceId = new URLSearchParams(window.location.search).get("sourceId");
      if (sourceId) {
        const found = list.find((s: Source) => s.id === sourceId);
        if (found) setSelectedSource(found);
      }
    }).catch(() => {});
  }, [router, token]);

  const scopeSources = sources.filter((s) => s.scope === selectedScope);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => {
      const list = (Array.isArray(d) ? d : []).filter((b: Branch) => b.isActive);
      setBranches(list);
      const branchId = new URLSearchParams(window.location.search).get("branchId");
      if (branchId && list.some((b: Branch) => b.id === branchId)) setSelectedBranchId(branchId);
    }).catch(() => {});
  }, [token]);

  const loadSaved = useCallback(async () => {
    if (!selectedSource || selectedMonth === null) return;
    setLoadingSaved(true);
    try {
      const branchQS = selectedBranchId ? `&branchId=${selectedBranchId}` : "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/consumption/list?year=${selectedYear}&month=${selectedMonth}&emissionSourceId=${selectedSource.id}${branchQS}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSaved((Array.isArray(data) ? data : []).map((l: any) => ({
        id: l.id, quantity: l.quantity, notes: l.notes,
        dataQuality: l.dataQuality, isVerified: l.isVerified,
        emissionsKgCO2eq: l.emissionsKgCO2eq,
        invoiceNumber: l.notes?.match(/Factura: ([^\s|]+)/)?.[1] ?? "",
        plateNumber:   l.notes?.match(/Placa: ([^\s|]+)/)?.[1]   ?? "",
        editQuantity: String(l.quantity),
        editInvoice:  l.notes?.match(/Factura: ([^\s|]+)/)?.[1] ?? "",
        editPlate:    l.notes?.match(/Placa: ([^\s|]+)/)?.[1]   ?? "",
        editQuality:  l.dataQuality,
        evidenceImages: (l.evidenceImages ?? []).map((img: any) => ({
          ...img,
          url:          img.url?.startsWith("http")          ? img.url          : `${process.env.NEXT_PUBLIC_API_URL}${img.url}`,
          thumbnailUrl: img.thumbnailUrl?.startsWith("http") ? img.thumbnailUrl : `${process.env.NEXT_PUBLIC_API_URL}${img.thumbnailUrl ?? img.url}`,
        })),
      })));
    } catch {}
    setLoadingSaved(false);
  }, [selectedSource, selectedMonth, selectedYear, selectedBranchId, token]);

  useEffect(() => { if (step === "table") loadSaved(); }, [step, loadSaved]);

  useEffect(() => {
    const container = zoomContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scaleRef.current = Math.min(10, Math.max(0.5, scaleRef.current * (e.deltaY < 0 ? 1.15 : 0.87)));
      if (imgRef.current) imgRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) scale(${scaleRef.current})`;
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoomImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setZoomImage(null); posRef.current = { x: 0, y: 0 }; scaleRef.current = 1; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openCropper = (file: File, logId?: string, draft?: DraftRow) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      if (logId) setPendingUploadLogId(logId);
      if (draft) setPendingDraft(draft);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropLoading(true);
    try {
      if (pendingUploadLogId) {
        const fd = new FormData();
        fd.append("images", blob, "factura.jpg");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/evidence/${pendingUploadLogId}`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          const images = data.files ?? (Array.isArray(data) ? data : [data]);
          const newImage = images[0];
          if (newImage?.url) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
            const toAbs = (u: string) => u.startsWith("http") ? u : `${baseUrl}${u}`;
            setSaved((prev) => prev.map((l) => l.id === pendingUploadLogId ? {
              ...l, evidenceImages: [...l.evidenceImages, {
                id: newImage.id ?? crypto.randomUUID(),
                url: toAbs(newImage.url),
                thumbnailUrl: toAbs(newImage.thumbnailUrl ?? newImage.url),
              }]
            } : l));
          }
        }
      } else if (pendingDraft) {
        const file = new File([blob], "factura.jpg", { type: "image/jpeg" });
        await autoSave({ ...pendingDraft, imageFile: file });
      }
    } catch (err) { console.error(err); }
    setCropLoading(false);
    setCropSrc(null);
    setPendingUploadLogId(null);
    setPendingDraft(null);
  };

  const autoSave = async (draft: DraftRow) => {
    if (!draft.quantity || parseFloat(draft.quantity) <= 0 || !selectedSource || selectedMonth === null) return;
    setDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, saving: true } : d));
    const notesParts: string[] = [];
    if (draft.invoiceNumber) notesParts.push(`Factura: ${draft.invoiceNumber}`);
    if (isScope1 && draft.plateNumber) notesParts.push(`Placa: ${draft.plateNumber}`);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/from-factor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          emissionSourceId: selectedSource.id,
          year: selectedYear, month: selectedMonth,
          quantity: parseFloat(draft.quantity),
          notes: notesParts.length ? notesParts.join(" | ") : undefined,
          dataQuality: draft.dataQuality,
          branchId: selectedBranchId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        let evidenceImages: { id: string; url: string; thumbnailUrl: string }[] = [];
        if (draft.imageFile) {
          const fd = new FormData();
          fd.append("images", draft.imageFile);
          const imgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/evidence/${data.id}`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const images = imgData.files ?? (Array.isArray(imgData) ? imgData : [imgData]);
            const newImage = images[0];
            if (newImage?.url) {
              const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
              const toAbs = (u: string) => u.startsWith("http") ? u : `${baseUrl}${u}`;
              evidenceImages = [{ id: newImage.id ?? crypto.randomUUID(), url: toAbs(newImage.url), thumbnailUrl: toAbs(newImage.thumbnailUrl ?? newImage.url) }];
            }
          }
        }
        setDrafts((prev) => {
          const remaining = prev.filter((d) => d.id !== draft.id);
          return remaining.length === 0 ? [newDraft()] : remaining;
        });
        setSaved((prev) => [...prev, {
          id: data.id, quantity: data.quantity, notes: data.notes,
          dataQuality: data.dataQuality, isVerified: false,
          emissionsKgCO2eq: data.emissionsKgCO2eq,
          invoiceNumber: draft.invoiceNumber, plateNumber: draft.plateNumber,
          editQuantity: String(data.quantity), editInvoice: draft.invoiceNumber,
          editPlate: draft.plateNumber, editQuality: data.dataQuality, evidenceImages,
        }]);
      }
    } catch {}
    setDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, saving: false } : d));
  };

  const updateDraft = (id: string, field: keyof DraftRow, value: any) =>
    setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));

  const updateSaved = (id: string, field: keyof SavedLog, value: any) => {
    setSaved((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
    clearTimeout((window as any)[`save_${id}`]);
    (window as any)[`save_${id}`] = setTimeout(() => {
      setSaved((prev) => {
        const log = prev.find((l) => l.id === id);
        if (!log) return prev;
        const notesParts: string[] = [];
        if (log.editInvoice) notesParts.push(`Factura: ${log.editInvoice}`);
        if (isScope1 && log.editPlate) notesParts.push(`Placa: ${log.editPlate}`);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            quantity: parseFloat(log.editQuantity) || log.quantity,
            dataQuality: log.editQuality,
            notes: notesParts.join(" | ") || log.notes,
          }),
        });
        return prev;
      });
    }, 800);
  };

  const verifyLog = async (id: string) => {
    setVerifying(id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/${id}/verify`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({}),
      });
      setSaved((prev) => prev.map((l) => l.id === id ? { ...l, isVerified: !l.isVerified } : l));
    } catch {}
    setVerifying(null);
  };

  const deleteLog = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSaved((prev) => prev.filter((l) => l.id !== id));
    } catch {}
    setDeleting(null);
  };

  const totalEmissions = saved.reduce((a, l) => a + l.emissionsKgCO2eq, 0) / 1000;
  const verifiedCount  = saved.filter((l) => l.isVerified).length;

  const UploadButtons = ({ onFile }: { onFile: (file: File) => void }) => (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer text-gray-400 hover:text-green-600 text-base transition" title="Cámara">
        📷
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </label>
      <label className="cursor-pointer text-gray-400 hover:text-green-600 text-base transition" title="Galería">
        🖼
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {zoomImage && (
        <div
          ref={zoomContainerRef}
          className="fixed inset-0 z-[999997] bg-black/80 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onClick={(e) => { if (e.target === e.currentTarget) { setZoomImage(null); posRef.current = { x: 0, y: 0 }; scaleRef.current = 1; } }}
          onMouseDown={(e) => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
          onMouseMove={(e) => {
            if (!dragging.current || !imgRef.current) return;
            posRef.current = { x: posRef.current.x + e.clientX - lastPos.current.x, y: posRef.current.y + e.clientY - lastPos.current.y };
            lastPos.current = { x: e.clientX, y: e.clientY };
            imgRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) scale(${scaleRef.current})`;
          }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
          onContextMenu={(e) => { e.preventDefault(); setZoomImage(null); posRef.current = { x: 0, y: 0 }; scaleRef.current = 1; }}
        >
          <button onClick={() => { setZoomImage(null); posRef.current = { x: 0, y: 0 }; scaleRef.current = 1; }}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black/80 z-10">
            ✕
          </button>
          <img
            ref={imgRef}
            src={zoomImage}
            alt="evidencia"
            style={{ transform: `translate(0px, 0px) scale(1)`, maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", userSelect: "none", pointerEvents: "none" }}
          />
        </div>
      )}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          loading={cropLoading}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); setPendingUploadLogId(null); setPendingDraft(null); }}
        />
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 group transition">
          <div className="w-8 h-8 bg-green-600 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition">
            <Leaf className="w-4 h-4 text-white" />
          </div>
        </button>
        <div>
          <button onClick={() => router.push("/dashboard")} className="group transition">
            <h1 className="font-bold text-gray-900 group-hover:text-gray-500 group-hover:underline transition leading-tight">CarboMetrics</h1>
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span onClick={() => setStep("scope")} className={`cursor-pointer hover:underline hover:text-gray-500 transition ${step === "scope" ? "text-green-600 font-medium" : ""}`}>Alcance</span>
            <ChevronRight className="w-3 h-3" />
            <span onClick={() => { if (selectedScope) setStep("month"); }} className={`cursor-pointer hover:underline hover:text-gray-500 transition ${step === "month" ? "text-green-600 font-medium" : ""}`}>Mes</span>
            <ChevronRight className="w-3 h-3" />
            <span className={`${step === "table" ? "text-green-600 font-medium" : "text-gray-400"}`}>Datos</span>
          </div>
        </div>
      </div>
      <main className={`px-4 py-6 space-y-4 ${step === "scope" ? "w-1/3" : step === "month" ? "max-w-xs" : "max-w-4xl mx-auto"}`}>

        {step === "scope" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué tipo de emisión vas a registrar?</h2>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
              <select value={selectedYear}
                onChange={(e) => { const y = parseInt(e.target.value); setSelectedYear(y); updateURL({ year: String(y) }); }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                {Array.from({ length: yearTo - yearFrom + 1 }, (_, i) => yearTo - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              {SCOPES.map((scope) => {
                const count = sources.filter((s) => s.scope === scope.id).length;
                return (
                  <button key={scope.id} onClick={() => { setSelectedScope(scope.id); setStep("month"); updateURL({ scope: scope.id, step: "month", sourceId: "" }); }}
                    disabled={count === 0}
                    className={`flex flex-col px-3 py-2.5 rounded-lg border-2 text-left transition hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${scope.color}`}>
                    <p className="font-bold text-sm">{scope.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{scope.desc}</p>
                    <p className="text-xs opacity-50 mt-1">{count} fuente(s)</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "month" && sources.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Selecciona el mes a registrar</h2>
              <p className="text-gray-500 text-sm mt-1">{selectedYear} · {SCOPES.find((s) => s.id === selectedScope)?.label}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuente de emisión</label>
              <select value={selectedSource?.id ?? ""}
                onChange={(e) => { const s = sources.find((s) => s.id === e.target.value) ?? null; setSelectedSource(s); if (s) updateURL({ sourceId: s.id }); }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Seleccionar fuente —</option>
                {scopeSources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({UNIT_LABELS[s.unit] ?? s.unit})</option>
                ))}
              </select>
            </div>
            {branches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instalación (opcional)</label>
                <select value={selectedBranchId}
                  onChange={(e) => { setSelectedBranchId(e.target.value); updateURL({ branchId: e.target.value }); }}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— Toda la empresa —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {!selectedBranchId && branches.length > 0 && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                    <span className="text-base leading-none mt-0.5">⚠️</span>
                    <span>Tenés <strong>{branches.length} instalación(es)</strong> creadas. Si ya registraste consumo por instalación, evitá usar "Toda la empresa" para no duplicar datos. Seleccioná una instalación específica para mayor precisión.</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Mes de registro</label>
              <div className="flex flex-col gap-2">
                {MONTHS.map((m, i) => (
                  <button key={i} onClick={() => {
                    if (!selectedSource) { alert("Selecciona una fuente primero"); return; }
                    setSelectedMonth(i + 1); setDrafts([newDraft()]); setSaved([]);
                    setStep("table"); updateURL({ step: "table", month: String(i + 1) });
                  }} className="py-2 px-2 rounded-lg border border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 text-xs font-medium text-gray-700 transition hover:shadow-sm">
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "table" && selectedSource && selectedMonth !== null && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedYear} — {MONTHS[selectedMonth - 1]}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {SCOPES.find((s) => s.id === selectedScope)?.label} · {selectedSource.name} · ({UNIT_LABELS[selectedSource.unit] ?? selectedSource.unit})
              </p>
            </div>

            {isScope1 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-xs font-medium">
                <Car className="w-4 h-4 flex-shrink-0" />
                Alcance 1 — Completa la placa del vehículo en cada fila
              </div>
            )}

            {loadingSaved ? (
              <div className="text-center py-6 text-xs text-gray-400">Cargando registros...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {saved.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">{saved.length} factura(s)</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span><strong className="text-green-700">{verifiedCount}</strong>/{saved.length} verificados</span>
                      <span>Total: <strong className="text-green-700">{totalEmissions.toFixed(4)} tCO₂eq</strong></span>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="text-sm mx-auto" style={{width:"fit-content"}}>
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-8">#</th>
                        <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-28">N° Factura</th>
                        {isScope1 && <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-24">Placa</th>}
                        <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-32">Cantidad ({UNIT_LABELS[selectedSource.unit] ?? selectedSource.unit})</th>
                        <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-36">Tipo de factura</th>
                        <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-20">Imagen</th>
                        <th className="text-center px-2 py-2 text-xs text-gray-400 font-semibold w-24">Verificar</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {saved.map((log, idx) => (
                        <tr key={log.id} className={`${log.isVerified ? "bg-green-50/40" : "hover:bg-gray-50"} transition`}>
                          <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input value={log.editInvoice} onChange={(e) => updateSaved(log.id, "editInvoice", e.target.value)} disabled={log.isVerified}
                              className="w-28 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400" />
                          </td>
                          {isScope1 && (
                            <td className="px-3 py-2">
                              <input value={log.editPlate} onChange={(e) => updateSaved(log.id, "editPlate", e.target.value.toUpperCase())} disabled={log.isVerified}
                                className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-300 disabled:bg-gray-50 disabled:text-gray-400" />
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <input type="number" step="0.001" value={log.editQuantity} onChange={(e) => updateSaved(log.id, "editQuantity", e.target.value)} disabled={log.isVerified}
                              className="w-28 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400" />
                          </td>
                          <td className="px-3 py-2">
                            <select value={log.editQuality} onChange={(e) => updateSaved(log.id, "editQuality", e.target.value)} disabled={log.isVerified}
                              className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400">
                              <option value="DIGITAL_INVOICE">Factura digital</option>
                              <option value="PHYSICAL_INVOICE">Factura física</option>
                              <option value="MEASURED">Medido</option>
                              <option value="CALCULATED">Calculado</option>
                              <option value="ESTIMATED">Estimado</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {log.evidenceImages.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <img src={log.evidenceImages[0].url} alt="evidencia"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  onClick={() => setZoomImage(log.evidenceImages[0].url)}
                                  className="w-9 h-9 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-80 transition flex-shrink-0" />
                                <button onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("¿Eliminar esta imagen? Esta acción no se puede deshacer.")) return;
                                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/evidence/image/${log.evidenceImages[0].id}`, {
                                    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
                                  });
                                  if (res.ok) setSaved((prev) => prev.map((l) => l.id === log.id ? { ...l, evidenceImages: [] } : l));
                                }} className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold transition">
                                  ✕
                                </button>
                              </div>
                            ) : !log.isVerified ? (
                              <UploadButtons onFile={(file) => openCropper(file, log.id)} />
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => verifyLog(log.id)} disabled={verifying === log.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${log.isVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"}`}>
                              {verifying === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                              {log.isVerified ? "Verificado" : "Verificar"}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => { if (!confirm("¿Eliminar esta fila y todos sus datos?")) return; deleteLog(log.id); }} disabled={deleting === log.id}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition">
                              {deleting === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {drafts.map((draft, i) => (
                        <tr key={draft.id} className="hover:bg-gray-50 bg-green-50/20">
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{saved.length + i + 1}</td>
                          <td className="px-3 py-2.5">
                            <input value={draft.invoiceNumber} onChange={(e) => updateDraft(draft.id, "invoiceNumber", e.target.value)} placeholder="F-001234"
                              className="w-28 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                          </td>
                          {isScope1 && (
                            <td className="px-3 py-2.5">
                              <input value={draft.plateNumber} onChange={(e) => updateDraft(draft.id, "plateNumber", e.target.value.toUpperCase())} placeholder="ABC-123" maxLength={10}
                                className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-300" />
                            </td>
                          )}
                          <td className="px-3 py-2.5">
                            <div className="relative">
                              <input type="number" step="0.001" min="0" value={draft.quantity}
                                onChange={(e) => updateDraft(draft.id, "quantity", e.target.value)}
                                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === "Tab") && e.currentTarget.value && parseFloat(e.currentTarget.value) > 0) autoSave(draft); }}
                                placeholder="0.000"
                                className="w-28 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                              {draft.saving && <Loader2 className="w-3 h-3 animate-spin text-green-500 absolute right-2 top-2.5" />}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <select value={draft.dataQuality} onChange={(e) => updateDraft(draft.id, "dataQuality", e.target.value)}
                              className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400">
                              <option value="DIGITAL_INVOICE">Factura digital</option>
                              <option value="PHYSICAL_INVOICE">Factura física</option>
                              <option value="MEASURED">Medido</option>
                              <option value="CALCULATED">Calculado</option>
                              <option value="ESTIMATED">Estimado</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <UploadButtons onFile={(file) => {
                              if (!draft.quantity || parseFloat(draft.quantity) <= 0) {
                                alert("Ingresa la cantidad primero y presiona Enter para guardar el registro antes de subir la imagen.");
                                return;
                              }
                              openCropper(file, undefined, draft);
                            }} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-300">
                              <ShieldCheck className="w-3 h-3" />Verificar
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {drafts.length > 1 && (
                              <button onClick={() => setDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <button onClick={() => setDrafts((prev) => [...prev, newDraft()])}
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition">
                    <Plus className="w-4 h-4" />Agregar fila
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setStep("month")}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              ← Cambiar mes
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InventoryPage />
    </Suspense>
  );
}