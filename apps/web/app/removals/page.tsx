"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Wind, Plus, Trash2, Pencil, ArrowLeft, X, Check } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "REFORESTATION",       label: "Reforestación" },
  { value: "AFFORESTATION",       label: "Aforestación" },
  { value: "SOIL_CARBON",         label: "Carbono en suelos" },
  { value: "BIOCHAR",             label: "Biocarbón" },
  { value: "DIRECT_AIR_CAPTURE",  label: "Captura directa de aire" },
  { value: "ENHANCED_WEATHERING", label: "Meteorización mejorada" },
  { value: "BLUE_CARBON",         label: "Carbono azul" },
  { value: "OTHER",               label: "Otro" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Activo",    color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completado", color: "bg-blue-100 text-blue-700" },
  SUSPENDED: { label: "Suspendido", color: "bg-gray-100 text-gray-500" },
};

const EMPTY_FORM = {
  name: "", description: "", type: "REFORESTATION", methodology: "",
  startYear: new Date().getFullYear(), endYear: "", tCO2eRemovedPerYear: "",
  verificationBody: "", notes: "", status: "ACTIVE",
};

export default function RemovalsPage() {
  const router  = useRouter();
  const token   = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const [removals, setRemovals] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<any | null>(null);
  const [form,     setForm]     = useState<any>(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error,    setError]    = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchRemovals = () => {
    setLoading(true);
    fetch(`${API}/api/consumption/removals-by-company`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setRemovals(d.data ?? []))
      .catch(() => setRemovals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchRemovals();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      name: r.name, description: r.description ?? "", type: r.type,
      methodology: r.methodology ?? "", startYear: r.startYear,
      endYear: r.endYear ?? "", tCO2eRemovedPerYear: r.tCO2eRemovedPerYear,
      verificationBody: r.verificationBody ?? "", notes: r.notes ?? "",
      status: r.status,
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.type || !form.startYear || !form.tCO2eRemovedPerYear) {
      setError("Completa los campos obligatorios: nombre, tipo, año inicio y tCO₂eq/año.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url    = editing
        ? `${API}/api/consumption/removals/${editing.id}`
        : `${API}/api/consumption/removals`;
      const method = editing ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Error al guardar"); return; }
      setShowForm(false);
      fetchRemovals();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta remoción? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/consumption/removals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRemovals();
    } finally {
      setDeleting(null);
    }
  };

  const totalRemovals = removals.reduce((acc, r) => acc + Number(r.tCO2eRemovedPerYear ?? r.tco2eremovedperyear ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
              <Wind className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Remociones y Sumideros</p>
              <p className="text-xs text-gray-400 leading-tight">ISO 14064-1 · Cláusula 5.3</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
            <Plus className="w-3.5 h-3.5" />Nueva remoción
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-7 space-y-6">

        {/* Resumen */}
        {removals.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Proyectos registrados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{removals.length}</p>
              <p className="text-xs text-gray-400 mt-1">proyectos activos</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total removido/año</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalRemovals.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">tCO₂eq removidas por año</p>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Proyectos de remoción</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Bosques, suelos y otras remociones de GEI verificadas
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-xs text-gray-400">
              <Wind className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-pulse" />
              Cargando remociones...
            </div>
          ) : removals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Wind className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">Sin remociones registradas</p>
              <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
                La organización no tiene remociones ni sumideros identificados en el período de inventario.
              </p>
              <button onClick={openNew}
                className="mt-4 inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />Registrar primera remoción
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {removals.map((r) => {
                const typeLabel = TYPE_OPTIONS.find((t) => t.value === r.type)?.label ?? r.type;
                const status    = STATUS_LABELS[r.status] ?? STATUS_LABELS.ACTIVE;
                return (
                  <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {typeLabel} · {r.startYear}{r.endYear ? `–${r.endYear}` : " en adelante"}
                        {r.verificationBody ? ` · Verificado por ${r.verificationBody}` : ""}
                      </p>
                      {r.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-base font-bold text-green-600">
                          −{Number(r.tCO2eRemovedPerYear).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">tCO₂eq/año</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(r)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-sm font-bold text-gray-900">
                {editing ? "Editar remoción" : "Nueva remoción"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del proyecto <span className="text-red-500">*</span>
                </label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Reforestación Zona Norte"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tipo de remoción <span className="text-red-500">*</span>
                </label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Años */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Año inicio <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={form.startYear}
                    onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Año fin <span className="text-xs text-gray-400">(opcional)</span>
                  </label>
                  <input type="number" value={form.endYear}
                    onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                    placeholder="En adelante"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              {/* tCO2 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  tCO₂eq removidas por año <span className="text-red-500">*</span>
                </label>
                <input type="number" step="0.001" value={form.tCO2eRemovedPerYear}
                  onChange={(e) => setForm({ ...form, tCO2eRemovedPerYear: e.target.value })}
                  placeholder="Ej: 25.5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} placeholder="Descripción del proyecto..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>

              {/* Metodología */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Metodología</label>
                <input value={form.methodology}
                  onChange={(e) => setForm({ ...form, methodology: e.target.value })}
                  placeholder="Ej: VCS VM0007, Gold Standard..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Cuerpo verificador */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cuerpo verificador</label>
                <input value={form.verificationBody}
                  onChange={(e) => setForm({ ...form, verificationBody: e.target.value })}
                  placeholder="Ej: Bureau Veritas, SGS..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Estado (solo al editar) */}
              {editing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="ACTIVE">Activo</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notas adicionales</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} placeholder="Notas internas..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                <Check className="w-3.5 h-3.5" />
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear remoción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}