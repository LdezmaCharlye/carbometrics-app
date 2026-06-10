"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Leaf, Upload, X, Loader2, Calculator, ArrowLeft, CheckCircle } from "lucide-react";

const schema = z.object({
  emissionSourceId: z.string().min(1, "Selecciona una fuente"),
  year:   z.number().int().min(2000).max(2100),
  month:  z.number().int().min(1).max(12),
  quantity: z.number({ invalid_type_error: "Ingresa una cantidad" }).positive("Debe ser mayor a 0"),
  notes:  z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const UNIT_LABELS: Record<string, string> = {
  LITER: "Litros", KWH: "kWh", MWH: "MWh", M3: "m³",
  KG: "kg", TON: "Toneladas", KM: "km", KM_PASSENGER: "km-pasajero",
};
const SCOPE_COLORS: Record<string, string> = {
  SCOPE_1: "bg-red-100 text-red-700",
  SCOPE_2: "bg-amber-100 text-amber-700",
  SCOPE_3: "bg-blue-100 text-blue-700",
};
const SCOPE_LABELS: Record<string, string> = {
  SCOPE_1: "Alcance 1", SCOPE_2: "Alcance 2", SCOPE_3: "Alcance 3",
};

function calcEmissions(qty: number, f: { kgCO2: number; kgCH4: number; kgN2O: number }): number {
  return qty * (f.kgCO2 + f.kgCH4 * 27.9 + f.kgN2O * 273);
}

export default function NewConsumptionPage() {
  const router  = useRouter();
  const [sources,   setSources]   = useState<any[]>([]);
  const [pending,   setPending]   = useState<{ file: File; preview: string }[]>([]);
  const [uploaded,  setUploaded]  = useState<any[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedLogId, setSavedLogId] = useState<string | null>(null);
  const [estimated, setEstimated] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
  });

  const watchQty    = watch("quantity");
  const watchSource = watch("emissionSourceId");

  // Cargar fuentes de emisión
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSources)
      .catch(() => {});
  }, [router]);

  // Actualizar estimación
  useEffect(() => {
    const src = sources.find((s) => s.id === watchSource);
    setSelectedSource(src ?? null);
    if (src?.emissionFactor && watchQty > 0) {
      setEstimated(calcEmissions(watchQty, src.emissionFactor));
    } else {
      setEstimated(null);
    }
  }, [watchSource, watchQty, sources]);

  // Dropzone
  const onDrop = useCallback((files: File[]) => {
    const newFiles = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setPending((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg",".jpeg",".png",".webp"], "application/pdf": [".pdf"] },
    maxSize: 20 * 1024 * 1024,
  });

  // Subir imágenes
  const uploadImages = async (logId: string) => {
    if (!pending.length) return;
    setUploading(true);
    const token    = localStorage.getItem("token");
    const formData = new FormData();
    pending.forEach((p) => formData.append("images", p.file));
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/evidence/${logId}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (data.images) setUploaded((prev) => [...prev, ...data.images]);
      setPending([]);
    } catch {
      alert("Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  };

  // Guardar registro
  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Error al guardar"); return; }
      setSavedLogId(data.id);
      if (pending.length) await uploadImages(data.id);
      alert("✅ Registro guardado correctamente");
      router.push("/dashboard");
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-gray-900">Registrar consumo</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Fuente de emisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente de emisión <span className="text-red-500">*</span>
              </label>
              <select
                {...register("emissionSourceId")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Seleccionar fuente —</option>
                {(["SCOPE_1","SCOPE_2","SCOPE_3"] as const).map((scope) => {
                  const scopeSources = sources.filter((s) => s.scope === scope);
                  if (!scopeSources.length) return null;
                  return (
                    <optgroup key={scope} label={SCOPE_LABELS[scope]}>
                      {scopeSources.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {errors.emissionSourceId && <p className="mt-1 text-xs text-red-600">{errors.emissionSourceId.message}</p>}
              {selectedSource && (
                <span className={`mt-2 inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${SCOPE_COLORS[selectedSource.scope]}`}>
                  {SCOPE_LABELS[selectedSource.scope]}
                </span>
              )}
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                <select {...register("year", { valueAsNumber: true })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                <select {...register("month", { valueAsNumber: true })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad {selectedSource && <span className="font-normal text-gray-500">({UNIT_LABELS[selectedSource.unit] ?? selectedSource.unit})</span>}
                <span className="text-red-500"> *</span>
              </label>
              <input
                {...register("quantity", { valueAsNumber: true })}
                type="number" step="0.001" min="0" placeholder="0.000"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}

              {estimated !== null && (
                <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                  <Calculator className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Estimado: <strong>{(estimated / 1000).toFixed(4)} tCO₂eq</strong>
                    <span className="text-green-600 ml-1">({estimated.toFixed(3)} kg)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
              <textarea
                {...register("notes")}
                rows={2}
                placeholder="Factura N°, observaciones..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Upload de imágenes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Imágenes de evidencia
                </label>
                <span className="text-xs text-gray-400">{pending.length + uploaded.length} archivo(s) · Sin límite</span>
              </div>

              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
                  isDragActive ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 hover:border-green-300"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600 font-medium">
                  {isDragActive ? "Suelta aquí" : "Arrastra o haz clic para subir"}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, PDF · Máx 20MB c/u</p>
              </div>

              {/* Previews */}
              {(pending.length > 0 || uploaded.length > 0) && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {uploaded.map((img) => (
                    <div key={img.id} className="relative rounded-lg overflow-hidden border border-green-200 aspect-square bg-gray-100">
                      <img src={img.thumbnailUrl ?? img.url} alt={img.fileName} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-green-500/80 flex items-center justify-center py-0.5">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ))}
                  {pending.map((p, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100 group">
                      {p.file.type.startsWith("image/") ? (
                        <img src={p.preview} alt={p.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-1 text-center">{p.file.name}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving || uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? "Subiendo imágenes..." : "Guardando..."}</>
              ) : (
                <><Leaf className="w-4 h-4" /> Guardar registro</>
              )}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}