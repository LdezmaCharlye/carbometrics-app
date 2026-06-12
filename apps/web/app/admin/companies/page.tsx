"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Leaf, LogOut, ArrowLeft, Search, Building2,
  ToggleLeft, ToggleRight, Pencil, ChevronLeft, ChevronRight,
} from "lucide-react";

const LICENSE_LABELS: Record<string, string> = {
  BASIC: "Básico", STANDARD: "Estándar", ENTERPRISE: "Empresarial",
};
const LICENSE_COLORS: Record<string, string> = {
  BASIC: "bg-gray-100 text-gray-600",
  STANDARD: "bg-blue-50 text-blue-600",
  ENTERPRISE: "bg-purple-50 text-purple-600",
};

interface Company {
  id: string; name: string; taxId: string; industry: string; country: string;
  isActive: boolean; licenseType: string; licenseExpiresAt: string | null;
  maxUsers: number; reportingYear: number;
  _count: { users: number };
}

const PAGE_SIZE = 20;

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered,  setFiltered]  = useState<Company[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.data ?? [];
        setCompanies(list);
        setFiltered(list);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, token]);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = companies.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.taxId.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
    setFiltered(result);
    setPage(1);
  }, [search, companies]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleCompany = async (id: string, isActive: boolean) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
    showToast(!isActive ? "Empresa activada" : "Empresa desactivada");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">CarboMetrics</p>
              <p className="text-xs text-gray-400">Todas las empresas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin/panel")} className="text-xs text-gray-500 hover:text-green-600 font-medium transition">
              Panel admin →
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition">
              <LogOut className="w-4 h-4" />Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-7 space-y-5">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Empresas clientes
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {companies.length} empresas</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT, sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 w-72"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">NIT / Tax ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">País</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuarios</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Licencia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vencimiento</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                  {search ? "No se encontraron empresas con ese criterio" : "No hay empresas registradas"}
                </td></tr>
              ) : paginated.map((c) => {
                const expires = c.licenseExpiresAt ? new Date(c.licenseExpiresAt) : null;
                const daysLeft = expires ? Math.ceil((expires.getTime() - Date.now()) / 86400000) : null;
                const expireColor = daysLeft === null ? "text-gray-400"
                  : daysLeft < 0 ? "text-red-500"
                  : daysLeft < 30 ? "text-amber-500"
                  : "text-green-600";
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition ${!c.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{c.taxId}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{c.industry}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{c.country}</td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-600">{c._count.users} / {c.maxUsers}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LICENSE_COLORS[c.licenseType]}`}>
                        {LICENSE_LABELS[c.licenseType] ?? c.licenseType}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-xs font-medium ${expireColor}`}>
                      {expires
                        ? daysLeft! < 0
                          ? `Vencida (${expires.toLocaleDateString("es-ES")})`
                          : `${expires.toLocaleDateString("es-ES")} (${daysLeft}d)`
                        : "Sin vencimiento"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${c.isActive ? "bg-green-500" : "bg-red-400"}`} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => router.push("/admin/panel")} title="Editar en panel" className="text-gray-400 hover:text-green-600 transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleCompany(c.id, c.isActive)}>
                          {c.isActive
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft  className="w-5 h-5 text-gray-300" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Página {page} de {totalPages} · {filtered.length} empresas</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="px-1 text-gray-400 text-xs">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p as number)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${page === p ? "bg-green-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}>
                        {p}
                      </button>
                    )
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}