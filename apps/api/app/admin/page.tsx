"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, FileText, TrendingUp, Leaf, LogOut } from "lucide-react";

interface DashboardData {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalRecords: number;
  recentCompanies: any[];
}

export default function AdminPage() {
  const router = useRouter();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<any>(null);

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const userStr  = localStorage.getItem("user");
    if (!token || !userStr) { router.push("/login"); return; }

    const userData = JSON.parse(userStr);
    if (userData.role !== "SUPERADMIN") { router.push("/login"); return; }
    setUser(userData);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-green-600">
        <Leaf className="w-6 h-6 animate-pulse" />
        <span className="font-medium">Cargando...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">CarboMetrics</h1>
              <p className="text-xs text-gray-500">Panel SuperAdmin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Empresas totales</span>
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.totalCompanies ?? 0}</p>
            <p className="text-xs text-green-600 mt-1">{data?.activeCompanies ?? 0} activas</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Usuarios</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.totalUsers ?? 0}</p>
            <p className="text-xs text-blue-600 mt-1">en todas las empresas</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Registros consumo</span>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.totalRecords ?? 0}</p>
            <p className="text-xs text-purple-600 mt-1">total plataforma</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Licencias activas</span>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.activeCompanies ?? 0}</p>
            <p className="text-xs text-amber-600 mt-1">generando ingresos</p>
          </div>
        </div>

        {/* Empresas recientes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Empresas clientes</h3>
            <button
              onClick={() => router.push("/admin/companies")}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver todas →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentCompanies?.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">
                No hay empresas registradas aún.
              </p>
            )}
            {data?.recentCompanies?.map((company: any) => (
              <div key={company.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{company.name}</p>
                  <p className="text-xs text-gray-500">{company.industry} · {company.country}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{company._count.users} usuarios</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    company.licenseType === "ENTERPRISE" ? "bg-purple-100 text-purple-700" :
                    company.licenseType === "STANDARD"   ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {company.licenseType}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${company.isActive ? "bg-green-500" : "bg-red-400"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}