"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, LogOut, Plus, Building2, MapPin, Pencil, X, AlertTriangle } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  country: string;
  isActive: boolean;
}

function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default function InstalacionesPage() {
  const router = useRouter();
  const [user, setUser]       = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving]   = useState(false);
  const [name, setName]       = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity]       = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const role  = getRoleFromToken(token);
  const canManage = role === "MANAGER" || role === "SUPERADMIN";

  const loadBranches = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setBranches(Array.isArray(d) ? d : []))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) { router.push("/login"); return; }
    setUser(JSON.parse(userStr));
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, token]);

  const openCreate = () => {
    setEditing(null);
    setName(""); setAddress(""); setCity("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setName(b.name); setAddress(b.address ?? ""); setCity(b.city ?? "");
    setFormError("");
    setShowForm(true);
  };

  const submitForm = async () => {
    if (name.trim().length < 2) { setFormError("El nombre debe tener al menos 2 letras."); return; }
    setSaving(true);
    setFormError("");
    try {
      const url    = editing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/branches/${editing.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/branches`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || undefined,
          city: city.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo guardar la instalación.");
        return;
      }
      setShowForm(false);
      loadBranches();
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: Branch) => {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branches/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !b.isActive }),
    }).catch(() => {});
    loadBranches();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-green-600">
        <Leaf className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-medium text-gray-500">Cargando instalaciones...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2.5 group transition">
            <div className="w-7 h-7 bg-green-600 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-gray-500 group-hover:underline transition leading-tight">CarboMetrics</p>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 group-hover:underline leading-tight">{user?.company}</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              ← Volver al panel
            </button>
            <span className="text-xs text-gray-500">{user?.name}</span>
            <button onClick={logout} className="text-gray-400 hover:text-gray-600 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Instalaciones</h1>
            <p className="text-sm text-gray-400 mt-0.5">Instalaciones registradas de {user?.company}</p>
          </div>
          {canManage && (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              <Plus className="w-3.5 h-3.5" />Nueva instalación
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {branches.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">Sin instalaciones registradas</p>
              <p className="text-xs text-gray-300 mt-1">
                {canManage ? "Crea la primera instalación de tu empresa." : "Tu empresa todavía no tiene instalaciones registradas."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {branches.map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[b.address, b.city, b.country].filter(Boolean).join(", ") || "Sin dirección"}
                      </p>
                      {!b.isActive && (
                        <span className="inline-block mt-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Inactiva</span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-green-600 transition p-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(b)}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 transition">
                        {b.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">{editing ? "Editar instalación" : "Nueva instalación"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Planta La Paz, Oficina Central..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ciudad</label>
                <input value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:border-gray-300 transition">
                Cancelar
              </button>
              <button onClick={submitForm} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}