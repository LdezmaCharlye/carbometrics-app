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

// ─── Recortador Canvas nativo ────────────────────────────────────────────────
interface CropBox { x: number; y: number; w: number; h: number; }

function ImageCropper({ src, onConfirm, onCancel, loading }: {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const cropRef   = useRef<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const dragging  = useRef<null | "move" | "tl" | "tr" | "bl" | "br">(null);
  const startPos  = useRef({ x: 0, y: 0 });
  const startCrop = useRef<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [zoomCorner, setZoomCorner] = useState<{ x: number; y: number; imgX: number; imgY: number } | null>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const HANDLE = 18;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const { x, y, w, h } = cropRef.current;

    // Overlay oscuro fuera del recorte
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, y);
    ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, canvas.width - x - w, h);

    // Borde del recorte
    ctx.strokeStyle = "#00e676";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Líneas de guía (regla de tercios)
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(x + w * i / 3, y); ctx.lineTo(x + w * i / 3, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h * i / 3); ctx.lineTo(x + w, y + h * i / 3); ctx.stroke();
    }

    // Esquinas
    const corners = [
      { cx: x,     cy: y     },
      { cx: x + w, cy: y     },
      { cx: x,     cy: y + h },
      { cx: x + w, cy: y + h },
    ];
    corners.forEach(({ cx, cy }) => {
      ctx.fillStyle = "#00e676";
      ctx.beginPath();
      ctx.arc(cx, cy, HANDLE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const maxW = Math.min(window.innerWidth - 32, 480);
      const scale = maxW / img.naturalWidth;
      canvas.width  = maxW;
      canvas.height = img.naturalHeight * scale;
      // Crop inicial: 85% centrado
      const pad = Math.min(canvas.width, canvas.height) * 0.075;
      cropRef.current = {
        x: pad, y: pad,
        w: canvas.width  - pad * 2,
        h: canvas.height - pad * 2,
      };
      draw();
    };
    img.src = src;
  }, [src, draw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
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

  const getHandle = (px: number, py: number): typeof dragging.current => {
    const { x, y, w, h } = cropRef.current;
    const corners: { key: typeof dragging.current; cx: number; cy: number }[] = [
      { key: "tl", cx: x,     cy: y     },
      { key: "tr", cx: x + w, cy: y     },
      { key: "bl", cx: x,     cy: y + h },
      { key: "br", cx: x + w, cy: y + h },
    ];
    for (const c of corners) {
      if (Math.hypot(px - c.cx, py - c.cy) < HANDLE) return c.key;
    }
    if (px > x && px < x + w && py > y && py < y + h) return "move";
    return null;
  };

  const updateZoom = (handle: typeof dragging.current) => {
    const canvas = canvasRef.current!;
    const img = imgRef.current!;
    const { x, y, w, h } = cropRef.current;
    const scaleX = img.naturalWidth  / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;
    const corners: Record<string, { cx: number; cy: number }> = {
      tl: { cx: x,     cy: y     },
      tr: { cx: x + w, cy: y     },
      bl: { cx: x,     cy: y + h },
      br: { cx: x + w, cy: y + h },
    };
    if (!handle || handle === "move" || !corners[handle]) { setZoomCorner(null); return; }
    const c = corners[handle];
    setZoomCorner({ x: c.cx, y: c.cy, imgX: c.cx * scaleX, imgY: c.cy * scaleY });

    // Dibujar zoom
    requestAnimationFrame(() => {
      const zc = zoomCanvasRef.current;
      if (!zc) return;
      const zctx = zc.getContext("2d")!;
      const ZS = 3;
      const ZR = 40;
      zctx.clearRect(0, 0, zc.width, zc.height);
      zctx.beginPath();
      zctx.arc(zc.width / 2, zc.height / 2, zc.width / 2, 0, Math.PI * 2);
      zctx.clip();
      zctx.drawImage(img,
        c.cx * scaleX - ZR, c.cy * scaleY - ZR, ZR * 2, ZR * 2,
        0, 0, zc.width, zc.height
      );
      // Cruz central
      zctx.strokeStyle = "#00e676";
      zctx.lineWidth = 1.5;
      zctx.beginPath(); zctx.moveTo(zc.width/2 - 8, zc.height/2); zctx.lineTo(zc.width/2 + 8, zc.height/2); zctx.stroke();
      zctx.beginPath(); zctx.moveTo(zc.width/2, zc.height/2 - 8); zctx.lineTo(zc.width/2, zc.height/2 + 8); zctx.stroke();
    });
  };

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const handle = getHandle(x, y);
    dragging.current = handle;
    startPos.current = { x, y };
    startCrop.current = { ...cropRef.current };
    updateZoom(handle);
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!dragging.current) return;
    const canvas = canvasRef.current!;
    const { x, y } = getPos(e);
    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;
    const sc = startCrop.current;
    const MIN = 40;

    let { x: cx, y: cy, w: cw, h: ch } = sc;

    if (dragging.current === "move") {
      cx = Math.max(0, Math.min(canvas.width  - cw, sc.x + dx));
      cy = Math.max(0, Math.min(canvas.height - ch, sc.y + dy));
    } else if (dragging.current === "tl") {
      const nx = Math.min(sc.x + dx, sc.x + sc.w - MIN);
      const ny = Math.min(sc.y + dy, sc.y + sc.h - MIN);
      cw = sc.w - (nx - sc.x); ch = sc.h - (ny - sc.y);
      cx = nx; cy = ny;
    } else if (dragging.current === "tr") {
      cw = Math.max(MIN, sc.w + dx);
      const ny = Math.min(sc.y + dy, sc.y + sc.h - MIN);
      ch = sc.h - (ny - sc.y); cy = ny;
    } else if (dragging.current === "bl") {
      const nx = Math.min(sc.x + dx, sc.x + sc.w - MIN);
      cw = sc.w - (nx - sc.x); cx = nx;
      ch = Math.max(MIN, sc.h + dy);
    } else if (dragging.current === "br") {
      cw = Math.max(MIN, sc.w + dx);
      ch = Math.max(MIN, sc.h + dy);
    }

    // Clamp
    cx = Math.max(0, cx); cy = Math.max(0, cy);
    cw = Math.min(cw, canvas.width  - cx);
    ch = Math.min(ch, canvas.height - cy);

    cropRef.current = { x: cx, y: cy, w: cw, h: ch };
    updateZoom(dragging.current);
    draw();
  };

  const onEnd = () => {
    dragging.current = null;
    setZoomCorner(null);
  };

  const confirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) { console.error("No canvas or img"); return; }
    const { x, y, w, h } = cropRef.current;
    if (w <= 0 || h <= 0) { console.error("Invalid crop", cropRef.current); return; }
    const scaleX = img.naturalWidth  / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;
    const out = document.createElement("canvas");
    out.width  = w * scaleX;
    out.height = h * scaleY;
    out.getContext("2d")!.drawImage(img,
      x * scaleX, y * scaleY, w * scaleX, h * scaleY,
      0, 0, out.width, out.height
    );
    out.toBlob((blob) => {
      if (blob) onConfirm(blob);
      else console.error("toBlob failed");
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[999998] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button onClick={onCancel} className="text-white text-sm px-3 py-1.5 rounded-lg border border-white/20">
          Cancelar
        </button>
        <span className="text-white text-sm font-medium">Recortar imagen</span>
        <button onClick={confirm} disabled={loading}
          className="bg-green-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓ Subir"}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-black">
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100%", maxHeight: "100%", touchAction: "none" }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        />
        {/* Lupa de esquina */}
        {zoomCorner && (
          <div style={{
            position: "absolute",
            left: Math.min(zoomCorner.x + 20, (canvasRef.current?.offsetWidth ?? 300) - 90),
            top:  Math.max(zoomCorner.y - 90, 10),
            pointerEvents: "none",
          }}>
            <canvas ref={zoomCanvasRef} width={80} height={80}
              style={{ borderRadius: "50%", border: "2px solid #00e676", display: "block" }} />
          </div>
        )}
      </div>

      <p className="text-center text-white/50 text-xs py-2">
        Arrastra las esquinas para ajustar el recorte
      </p>
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
  const [drafts,         setDrafts]        = useState<DraftRow[]>([newDraft()]);
  const [saved,          setSaved]         = useState<SavedLog[]>([]);
  const [loadingSaved,   setLoadingSaved]  = useState(false);
  const [verifying,      setVerifying]     = useState<string|null>(null);
  const [deleting,       setDeleting]      = useState<string|null>(null);

  // Recortador
  const [cropSrc,            setCropSrc]            = useState<string|null>(null);
  const [pendingUploadLogId, setPendingUploadLogId] = useState<string|null>(null);
  const [pendingDraft,       setPendingDraft]       = useState<DraftRow|null>(null);
  const [cropLoading,        setCropLoading]        = useState(false);

  // Zoom imagen
  const [zoomImage,      setZoomImage]      = useState<string|null>(null);
  const dragging        = useRef(false);
  const lastPos         = useRef({ x: 0, y: 0 });
  const imgRef          = useRef<HTMLImageElement>(null);
  const posRef          = useRef({ x: 0, y: 0 });
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const scaleRef        = useRef(1);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

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

  const loadSaved = useCallback(async () => {
    if (!selectedSource || selectedMonth === null) return;
    setLoadingSaved(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/consumption/list?year=${selectedYear}&month=${selectedMonth}&emissionSourceId=${selectedSource.id}`,
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
  }, [selectedSource, selectedMonth, selectedYear, token]);

  useEffect(() => { if (step === "table") loadSaved(); }, [step, loadSaved]);

  // Zoom handlers
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
      if (logId)  setPendingUploadLogId(logId);
      if (draft)  setPendingDraft(draft);
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Recortador */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          loading={cropLoading}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); setPendingUploadLogId(null); setPendingDraft(null); }}
        />
      )}

      {/* Zoom imagen */}
      {zoomImage && (
        <div ref={zoomContainerRef} style={{ position: "fixed", inset: 0, zIndex: 999999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", userSelect: "none" }}
          onContextMenu={(e) => { e.preventDefault(); setZoomImage(null); posRef.current = { x: 0, y: 0 }; scaleRef.current = 1; }}
          onMouseDown={(e) => { if (e.button !== 0) return; e.preventDefault(); dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).style.cursor = "grabbing"; }}
          onMouseMove={(e) => { if (!dragging.current) return; const dx = e.clientX - lastPos.current.x; const dy = e.clientY - lastPos.current.y; posRef.current = { x: posRef.current.x + dx, y: posRef.current.y + dy }; lastPos.current = { x: e.clientX, y: e.clientY }; if (imgRef.current) imgRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) scale(${scaleRef.current})`; }}
          onMouseUp={() => { dragging.current = false; if (zoomContainerRef.current) zoomContainerRef.current.style.cursor = "grab"; }}
          onClick={() => { setZoomImage(null); posRef.current = { x: 0, y: 0 }; scaleRef.current = 1; }}
        >
          <img ref={imgRef} src={zoomImage} alt="evidencia" draggable={false}
            style={{ transform: "translate(0px, 0px) scale(1)", transformOrigin: "center center", maxWidth: "90vw", maxHeight: "90vh", userSelect: "none", pointerEvents: "none" }} />
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => step === "scope" ? router.push("/dashboard") : setStep(step === "table" ? "month" : "scope")}
              className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">CarboMetrics</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className={step === "scope" ? "text-green-600 font-medium" : ""}>Alcance</span>
                <ChevronRight className="w-3 h-3" />
                <span className={step === "month" ? "text-green-600 font-medium" : ""}>Mes</span>
                <ChevronRight className="w-3 h-3" />
                <span className={step === "table" ? "text-green-600 font-medium" : ""}>Datos</span>
              </div>
            </div>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </header>

      <main className={`px-4 py-6 space-y-4 ${step === "scope" ? "w-1/3" : step === "month" ? "max-w-xs" : "max-w-4xl mx-auto"}`}>

        {/* PASO 1: Alcance */}
        {step === "scope" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué tipo de emisión vas a registrar?</h2>
            <p className="text-gray-500 text-sm mb-3">Año seleccionado: <strong>{selectedYear}</strong></p>
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

        {/* PASO 2: Mes */}
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

        {/* PASO 3: Tabla */}
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
                        <th className="text-left px-2 py-2 text-xs text-gray-400 font-semibold w-16">Imagen</th>
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
                              <img src={log.evidenceImages[0].url} alt="evidencia"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                onClick={() => setZoomImage(log.evidenceImages[0].url)}
                                className="w-8 h-8 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-80 transition" />
                            ) : !log.isVerified ? (
                              <div className="flex flex-col gap-1">
                                <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-green-600 text-xs transition">
                                  <Upload className="w-3 h-3" /><span>Galería</span>
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) openCropper(file, log.id); }} />
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-green-600 text-xs transition">
                                  <Upload className="w-3 h-3" /><span>Cámara</span>
                                  <input type="file" accept="image/*" capture="environment" className="hidden"
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) openCropper(file, log.id); }} />
                                </label>
                              </div>
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
                            <button onClick={() => deleteLog(log.id)} disabled={deleting === log.id}
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
                            <div className="flex flex-col gap-1">
                              <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-green-600 transition text-xs">
                                <Upload className="w-3 h-3" /><span>Galería</span>
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (!draft.quantity || parseFloat(draft.quantity) <= 0) {
                                      alert("Ingresa la cantidad primero y presiona Enter para guardar el registro antes de subir la imagen.");
                                      return;
                                    }
                                    openCropper(file, undefined, draft);
                                  }} />
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-green-600 transition text-xs">
                                <Upload className="w-3 h-3" /><span>Cámara</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (!draft.quantity || parseFloat(draft.quantity) <= 0) {
                                      alert("Ingresa la cantidad primero y presiona Enter para guardar el registro antes de subir la imagen.");
                                      return;
                                    }
                                    openCropper(file, undefined, draft);
                                  }} />
                              </label>
                            </div>
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
