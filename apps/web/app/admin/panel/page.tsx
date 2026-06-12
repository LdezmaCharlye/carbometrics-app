"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Leaf, LogOut, Users, FlaskConical, FileText, Building2, BadgeCheck,
  Plus, X, ChevronDown, CheckCircle, AlertCircle,
  Pencil, ToggleLeft, ToggleRight, ArrowLeft,
} from "lucide-react";

const UNIT_LABELS: Record<string, string> = {
  LITER: "Litros", KWH: "kWh", MWH: "MWh", M3: "m³", KG: "kg",
  TON: "Ton", KM: "km", KM_PASSENGER: "km-pas", TON_KM: "ton-km",
  TON_WASTE: "ton res.", GALLON_US: "Galón US", USD: "USD",
};
const SOURCE_LABELS: Record<string, string> = {
  IPCC_AR6: "IPCC AR6", DEFRA_2023: "DEFRA 2023", EPA_2023: "EPA 2023", CUSTOM: "Personalizado",
};
const LICENSE_LABELS: Record<string, string> = {
  BASIC: "Básico", STANDARD: "Estándar", ENTERPRISE: "Empresarial",
};
const LICENSE_COLORS: Record<string, string> = {
  BASIC: "bg-gray-100 text-gray-600",
  STANDARD: "bg-blue-50 text-blue-600",
  ENTERPRISE: "bg-purple-50 text-purple-600",
};
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

type Tab = "companies" | "licenses" | "users" | "factors" | "consumption";

interface Company {
  id: string; name: string; taxId: string; industry: string; country: string;
  isActive: boolean; licenseType: string; licenseExpiresAt: string | null;
  maxUsers: number; reportingYear: number;
  _count: { users: number };
}
interface User {
  id: string; email: string; name: string; role: string;
  isActive: boolean; lastLoginAt: string | null; mustChangePassword: boolean;
  company: { name: string }; branch: { name: string } | null;
}
interface Factor {
  id: string; name: string; fuelType: string | null; unit: string;
  kgCO2: number; kgCH4: number; kgN2O: number;
  source: string; region: string; year: number; isActive: boolean;
}
interface Log {
  id: string; year: number; month: number; quantity: number;
  emissionsKgCO2eq: number; notes: string | null; isVerified: boolean;
  emissionSource: { name: string; scope: string; unit: string };
  recordedBy: { name: string; email: string };
}

export default function AdminPanelPage() {
  const router = useRouter();
  const [tab,        setTab]        = useState<Tab>("companies");
  const [companies,  setCompanies]  = useState<Company[]>([]);
  const [users,      setUsers]      = useState<User[]>([]);
  const [factors,    setFactors]    = useState<Factor[]>([]);
  const [logs,       setLogs]       = useState<Log[]>([]);
  const [selCompany, setSelCompany] = useState("");
  const [selYear,    setSelYear]    = useState(new Date().getFullYear());
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  const [showUserModal,    setShowUserModal]    = useState(false);
  const [showFactorModal,  setShowFactorModal]  = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editFactor,       setEditFactor]       = useState<Factor | null>(null);
  const [editCompany,      setEditCompany]      = useState<Company | null>(null);

  const [uForm, setUForm] = useState({ email: "", name: "", password: "", role: "MANAGER", companyId: "" });
  const [fForm, setFForm] = useState({ name: "", fuelType: "", unit: "LITER", kgCO2: "", kgCH4: "", kgN2O: "", source: "IPCC_AR6", region: "GLOBAL", year: String(new Date().getFullYear()) });
  const [cForm, setCForm] = useState({ name: "", taxId: "", industry: "", country: "BO", orgBoundaryType: "OPERATIONAL_CONTROL", baseYear: "", baseYearRecalcNote: "", licenseType: "BASIC", yearFrom: String(new Date().getFullYear() - 1), yearTo: String(new Date().getFullYear()), reportingYear: String(new Date().getFullYear()), licenseExpiresAt: "" });
const [countryFactors, setCountryFactors]         = useState<any[]>([]);
const [factorsSubTab, setFactorsSubTab]           = useState<"global" | "country">("global");
const [editCountryFactor, setEditCountryFactor]   = useState<any | null>(null);
const [showCountryFactorModal, setShowCountryFactorModal] = useState(false);
const [cfForm, setCfForm] = useState({ kgCO2perKwh: "", source: "", year: "" });
const [selCompanySources, setSelCompanySources] = useState<any | null>(null);
const [companySources, setCompanySources]       = useState<any[]>([]);
const [editSource, setEditSource]               = useState<any | null>(null);
const [showSourceModal, setShowSourceModal]     = useState(false);
const [sfForm, setSfForm]                       = useState({ uncertaintyLevel: "MEDIUM", uncertaintyNote: "", isExcluded: false, exclusionReason: "", emissionFactorId: "" });
const [showAddSourceModal, setShowAddSourceModal] = useState(false);
const [safForm, setSafForm] = useState({ name: "", description: "", scope: "SCOPE_1", category: "STATIONARY_COMBUSTION", unit: "LITER", emissionFactorId: "" });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCompanies = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => setCompanies(Array.isArray(d) ? d : d.data ?? [])).catch(() => {});
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    loadCompanies();
  }, [router, token]);
const fetchCompanySources = async (companyId: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/sources`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) setCompanySources(await res.json());

  if (factors.length === 0) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emission-factors`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then(setFactors).catch(() => {});
  }
};

  const fetchCountryFactors = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/country-factors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) setCountryFactors(await res.json());
};
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    if (tab === "companies" || tab === "licenses") {
      loadCompanies();
      setLoading(false);
    } else if (tab === "users") {
      const url = selCompany
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?companyId=${selCompany}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`;
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : d.data ?? [])).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === "factors") {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emission-factors`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json()).then(setFactors).catch(() => {}).finally(() => setLoading(false));
      fetchCountryFactors();
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/consumption?year=${selYear}${selCompany ? `&companyId=${selCompany}` : ""}`;
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then(setLogs).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab, selCompany, selYear, token]);

  // Crear empresa
  const saveCompany = async () => {
    if (!cForm.name || !cForm.taxId || !cForm.industry) { showToast("Completa los campos obligatorios", false); return; }
    const body: any = {
  name: cForm.name, taxId: cForm.taxId, industry: cForm.industry,
  country: cForm.country, orgBoundaryType: cForm.orgBoundaryType, licenseType: cForm.licenseType,
  yearFrom: parseInt(cForm.yearFrom), yearTo: parseInt(cForm.yearTo),
  reportingYear: parseInt(cForm.reportingYear),
  ...(cForm.baseYear ? { baseYear: parseInt(cForm.baseYear) } : {}),
  ...(cForm.baseYearRecalcNote ? { baseYearRecalcNote: cForm.baseYearRecalcNote } : {}),
};
    if (cForm.licenseExpiresAt) body.licenseExpiresAt = new Date(cForm.licenseExpiresAt).toISOString();

    const url = editCompany
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${editCompany.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies`;
    const res = await fetch(url, {
      method: editCompany ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json(); showToast(d.error ?? "Error al guardar", false); return; }
    showToast(editCompany ? "Empresa actualizada" : "Empresa creada");
    setShowCompanyModal(false); setEditCompany(null);
    setCForm({ name: "", taxId: "", industry: "", country: "BO", orgBoundaryType: "", baseYear: "", baseYearRecalcNote: "", licenseType: "BASIC", yearFrom: "", yearTo: "", reportingYear: String(new Date().getFullYear()), licenseExpiresAt: "" });
    loadCompanies();
  };

  const openEditCompany = (c: Company) => {
    setEditCompany(c);
    setCForm({
    name: c.name, taxId: c.taxId, industry: c.industry, country: c.country,
    licenseType: c.licenseType,
    orgBoundaryType: c.orgBoundaryType ?? "OPERATIONAL_CONTROL",
    yearFrom: String(c.yearFrom ?? new Date().getFullYear() - 1),
    yearTo: String(c.yearTo ?? new Date().getFullYear()),
    reportingYear: String(c.reportingYear),
    licenseExpiresAt: c.licenseExpiresAt ? c.licenseExpiresAt.split("T")[0] : "",
    baseYear: c.baseYear ? String(c.baseYear) : "",
    baseYearRecalcNote: "",
  });
    setShowCompanyModal(true);
  };

  const toggleCompany = async (id: string, isActive: boolean) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
    showToast(!isActive ? "Empresa activada" : "Empresa desactivada");
  };

  // Crear usuario
  const createUser = async () => {
    if (!uForm.email || !uForm.name || !uForm.password || !uForm.companyId) { showToast("Completa todos los campos", false); return; }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...uForm }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error ?? "Error al crear usuario", false); return; }
    showToast(`Usuario creado. Contraseña temporal: ${data.temporaryPassword}`);
    setShowUserModal(false);
    setUForm({ email: "", name: "", password: "", role: "MANAGER", companyId: "" });
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then(setUsers);
  };

  const toggleUser = async (id: string, isActive: boolean) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !isActive } : u));
    showToast(!isActive ? "Usuario activado" : "Usuario desactivado");
  };

  // Factor
  const saveFactor = async () => {
    if (!fForm.name || !fForm.kgCO2) { showToast("Completa los campos obligatorios", false); return; }
    const body = {
      name: fForm.name, fuelType: fForm.fuelType || undefined, unit: fForm.unit,
      kgCO2: parseFloat(fForm.kgCO2), kgCH4: parseFloat(fForm.kgCH4) || 0,
      kgN2O: parseFloat(fForm.kgN2O) || 0, source: fForm.source,
      region: fForm.region, year: parseInt(fForm.year),
    };
    const url = editFactor
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/emission-factors/${editFactor.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/emission-factors`;
    const res = await fetch(url, {
      method: editFactor ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { showToast("Error al guardar factor", false); return; }
    showToast(editFactor ? "Factor actualizado" : "Factor creado");
    setShowFactorModal(false); setEditFactor(null);
    setFForm({ name: "", fuelType: "", unit: "LITER", kgCO2: "", kgCH4: "", kgN2O: "", source: "IPCC_AR6", region: "GLOBAL", year: String(new Date().getFullYear()) });
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emission-factors`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then(setFactors);
  };

  const openEditFactor = (f: Factor) => {
    setEditFactor(f);
    setFForm({ name: f.name, fuelType: f.fuelType ?? "", unit: f.unit, kgCO2: String(f.kgCO2), kgCH4: String(f.kgCH4), kgN2O: String(f.kgN2O), source: f.source, region: f.region, year: String(f.year) });
    setShowFactorModal(true);
  };

  const toggleFactor = async (id: string, isActive: boolean) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emission-factors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setFactors((prev) => prev.map((f) => f.id === id ? { ...f, isActive: !isActive } : f));
    showToast(!isActive ? "Factor activado" : "Factor desactivado");
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); };
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const getLicenseStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { label: "Sin vencimiento", color: "text-gray-400", days: null };
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diff < 0)  return { label: "Vencida", color: "text-red-500", days: diff };
    if (diff < 30) return { label: `Vence en ${diff} días`, color: "text-amber-500", days: diff };
    return { label: `Vence en ${diff} días`, color: "text-green-600", days: diff };
  };

  const tabs = [
    { key: "companies", label: "Empresas",            icon: Building2   },
    { key: "licenses",  label: "Licencias",           icon: BadgeCheck  },
    { key: "users",     label: "Usuarios",            icon: Users       },
    { key: "factors",   label: "Factores de emisión", icon: FlaskConical},
    { key: "consumption",label:"Registros de consumo",icon: FileText    },
  ] as { key: Tab; label: string; icon: any }[];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
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
              <p className="text-xs text-gray-400">Panel de Administración</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition">
            <LogOut className="w-4 h-4" />Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-7 space-y-5">

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === key ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          {(tab === "users" || tab === "consumption") && (
            <div className="relative">
              <select value={selCompany} onChange={(e) => setSelCompany(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                <option value="">Todas las empresas</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
          {tab === "consumption" && (
            <div className="relative">
              <select value={selYear} onChange={(e) => setSelYear(parseInt(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
          <div className="ml-auto">
            {tab === "companies" && (
              <button onClick={() => { setEditCompany(null); setShowCompanyModal(true); }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />Nueva empresa
              </button>
            )}
            {tab === "users" && (
              <button onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />Nuevo usuario
              </button>
            )}
            {tab === "factors" && (
              <button onClick={() => { setEditFactor(null); setShowFactorModal(true); }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />Nuevo factor
              </button>
            )}
          </div>
        </div>

        {/* ── EMPRESAS ─────────────────────────────────────────────────── */}
        {tab === "companies" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">NIT / Tax ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sector</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuarios</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Licencia</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No hay empresas registradas</td></tr>
                ) : companies.map((c) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition ${!c.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.country}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{c.taxId}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{c.industry}</td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-600">
                      {c._count.users} / {c.maxUsers}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LICENSE_COLORS[c.licenseType]}`}>
                        {LICENSE_LABELS[c.licenseType]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openEditCompany(c); }} title="Editar"
                          className="text-gray-400 hover:text-green-600 transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setSelCompanySources(c);
                          fetchCompanySources(c.id);
                        }} title="Ver fuentes" className="text-gray-400 hover:text-blue-600 transition">
                          <FlaskConical className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleCompany(c.id, c.isActive); }}>
                          {c.isActive
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft  className="w-5 h-5 text-gray-300" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PANEL FUENTES DE EMPRESA ─────────────────────────────────── */}
        {selCompanySources && (
          <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-auto my-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900">Fuentes de emisión — {selCompanySources.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Incertidumbre y exclusiones por fuente (ISO 14064-1 cláusula 6.5)</p>
                </div>
                <div className="flex items-center gap-2">
                <button onClick={() => { setShowAddSourceModal(true); setSafForm({ name: "", description: "", scope: "SCOPE_1", category: "STATIONARY_COMBUSTION", unit: "LITER", emissionFactorId: "" }); }}
                  className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition">
                  <Plus className="w-3.5 h-3.5" />Nueva fuente
                </button>
                <button onClick={() => { setSelCompanySources(null); setCompanySources([]); }}
                  className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Fuente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Alcance</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Incertidumbre</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Editar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {companySources.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>
                    ) : companySources.map((s) => (
                      <tr key={s.id} className={`hover:bg-gray-50 transition ${s.isExcluded ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-800">{s.name}</p>
                          {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{s.scope.replace("SCOPE_", "Alcance ")}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.uncertaintyLevel === "LOW"    ? "bg-green-100 text-green-700" :
                            s.uncertaintyLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                                              "bg-red-100 text-red-700"
                          }`}>
                            {s.uncertaintyLevel === "LOW" ? "Baja" : s.uncertaintyLevel === "MEDIUM" ? "Media" : "Alta"}
                          </span>
                          {s.uncertaintyNote && <p className="text-xs text-gray-400 mt-0.5">{s.uncertaintyNote}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          {s.isExcluded
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Excluida</span>
                            : s.isActive
                              ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Activa</span>
                              : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Inactiva</span>}
                          {s.exclusionReason && <p className="text-xs text-gray-400 mt-0.5">{s.exclusionReason}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${selCompanySources.id}/sources/${s.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ isActive: !s.isActive }),
                            });
                            if (res.ok) {
                              setCompanySources((prev) => prev.map((src) => src.id === s.id ? { ...src, isActive: !src.isActive } : src));
                              showToast(s.isActive ? "Fuente desactivada" : "Fuente activada");
                            }
                          }} className="text-gray-400 hover:text-green-600 transition">
                            {s.isActive
                              ? <ToggleRight className="w-5 h-5 text-green-500" />
                              : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                          </button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setEditSource(s);
                            setSfForm({
                              uncertaintyLevel:  s.uncertaintyLevel,
                              uncertaintyNote:   s.uncertaintyNote ?? "",
                              isExcluded:        s.isExcluded,
                              exclusionReason:   s.exclusionReason ?? "",
                              emissionFactorId:  s.emissionFactorId ?? "",
                            });
                            setShowSourceModal(true);
                          }} className="text-gray-400 hover:text-green-600 transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            if (!selCompanySources) return;
                            if (!confirm(`¿Eliminar la fuente "${s.name}"? Esta acción no se puede deshacer.`)) return;
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${selCompanySources.id}/sources/${s.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                              setCompanySources((prev) => prev.filter((src) => src.id !== s.id));
                              showToast("Fuente eliminada correctamente");
                            } else {
                              showToast("Error al eliminar la fuente", false);
                            }
                          }} className="text-gray-400 hover:text-red-500 transition">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal nueva fuente */}
        {showAddSourceModal && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto my-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Nueva fuente — {selCompanySources?.name}</h3>
                <button onClick={() => setShowAddSourceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input type="text" value={safForm.name} onChange={(e) => setSafForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Flota de vehículos diésel"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <input type="text" value={safForm.description} onChange={(e) => setSafForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alcance *</label>
                  <select value={safForm.scope} onChange={(e) => setSafForm((p) => ({ ...p, scope: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="SCOPE_1">Alcance 1 — Emisiones directas</option>
                    <option value="SCOPE_2">Alcance 2 — Electricidad comprada</option>
                    <option value="SCOPE_3">Alcance 3 — Cadena de valor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría *</label>
                  <select value={safForm.category} onChange={(e) => setSafForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="STATIONARY_COMBUSTION">Combustión estacionaria</option>
                    <option value="MOBILE_COMBUSTION">Combustión móvil</option>
                    <option value="PROCESS_EMISSIONS">Emisiones de proceso</option>
                    <option value="FUGITIVE_EMISSIONS">Emisiones fugitivas</option>
                    <option value="PURCHASED_ELECTRICITY">Electricidad comprada</option>
                    <option value="PURCHASED_HEAT">Calor comprado</option>
                    <option value="BUSINESS_TRAVEL">Viajes de negocio</option>
                    <option value="EMPLOYEE_COMMUTING">Transporte empleados</option>
                    <option value="WASTE_DISPOSAL">Disposición de residuos</option>
                    <option value="PURCHASED_GOODS">Bienes y servicios comprados</option>
                    <option value="UPSTREAM_TRANSPORT">Transporte aguas arriba</option>
                    <option value="DOWNSTREAM_TRANSPORT">Transporte aguas abajo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unidad *</label>
                  <select value={safForm.unit} onChange={(e) => setSafForm((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Factor de emisión</label>
                  <select value={safForm.emissionFactorId} onChange={(e) => setSafForm((p) => ({ ...p, emissionFactorId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="">— Sin factor asignado —</option>
                    {factors.filter(f => f.isActive).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.kgCO2} kgCO₂/{UNIT_LABELS[f.unit] ?? f.unit} ({SOURCE_LABELS[f.source] ?? f.source})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">El factor determina el cálculo de emisiones al registrar consumo.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowAddSourceModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={async () => {
                  if (!safForm.name) { showToast("El nombre es obligatorio", false); return; }
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${selCompanySources.id}/sources`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(safForm),
                  });
                  if (res.ok) {
                    setShowAddSourceModal(false);
                    fetchCompanySources(selCompanySources.id);
                    showToast("Fuente creada correctamente");
                  } else {
                    const err = await res.json();
                    showToast(err.error ?? "Error al crear fuente", false);
                  }
                }} className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">Crear fuente</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal editar fuente */}
        {showSourceModal && editSource && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto my-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Editar — {editSource.name}</h3>
                <button onClick={() => setShowSourceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Factor de emisión</label>
                  <select value={sfForm.emissionFactorId} onChange={(e) => setSfForm((p) => ({ ...p, emissionFactorId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="">— Sin factor asignado —</option>
                    {factors.filter(f => f.isActive).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.kgCO2} kgCO₂/{UNIT_LABELS[f.unit] ?? f.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nivel de incertidumbre del FE</label>
                  <select value={sfForm.uncertaintyLevel} onChange={(e) => setSfForm((p) => ({ ...p, uncertaintyLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="LOW">Baja — dato medido directamente</option>
                    <option value="MEDIUM">Media — dato calculado con supuestos</option>
                    <option value="HIGH">Alta — dato estimado o genérico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nota de incertidumbre</label>
                  <textarea value={sfForm.uncertaintyNote}
                    onChange={(e) => setSfForm((p) => ({ ...p, uncertaintyNote: e.target.value }))}
                    placeholder="Ej: Factor tomado de IPCC AR6 tabla 2.2, aplica a combustión estacionaria..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                  <input type="checkbox" id="isExcluded" checked={sfForm.isExcluded}
                    onChange={(e) => setSfForm((p) => ({ ...p, isExcluded: e.target.checked }))}
                    className="w-4 h-4 accent-red-500" />
                  <label htmlFor="isExcluded" className="text-sm text-gray-700">Excluir esta fuente del inventario</label>
                </div>
                {sfForm.isExcluded && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Razón de exclusión *</label>
                    <textarea value={sfForm.exclusionReason}
                      onChange={(e) => setSfForm((p) => ({ ...p, exclusionReason: e.target.value }))}
                      placeholder="Ej: Fuente insignificante — representa menos del 1% de emisiones totales..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowSourceModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button onClick={async () => {
                  if (sfForm.isExcluded && !sfForm.exclusionReason) {
                    setToast({ ok: false, msg: "Debe ingresar una razón de exclusión" }); return;
                  }
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${selCompanySources.id}/sources/${editSource.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      uncertaintyLevel:  sfForm.uncertaintyLevel,
                      uncertaintyNote:   sfForm.uncertaintyNote || undefined,
                      isExcluded:        sfForm.isExcluded,
                      exclusionReason:   sfForm.exclusionReason || undefined,
                      emissionFactorId:  sfForm.emissionFactorId || undefined,
                    }),
                  });
                  if (res.ok) {
                    setShowSourceModal(false);
                    fetchCompanySources(selCompanySources.id);
                    setToast({ ok: true, msg: "Fuente actualizada correctamente" });
                  } else {
                    const err = await res.json();
                    setToast({ ok: false, msg: err.error ?? "Error al guardar" });
                  }
                }} className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── LICENCIAS ─────────────────────────────────────────────────── */}
        {tab === "licenses" && (
          <div className="space-y-3">
            {companies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 text-sm">No hay empresas registradas</div>
            ) : companies.map((c) => {
              const status = getLicenseStatus(c.licenseExpiresAt);
              const expired = status.days !== null && status.days < 0;
              const warning = status.days !== null && status.days >= 0 && status.days < 30;
              return (
                <div key={c.id} className={`bg-white rounded-2xl border p-5 flex items-center justify-between gap-4 ${
                  expired ? "border-red-200 bg-red-50/30" : warning ? "border-amber-200 bg-amber-50/30" : "border-gray-200"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      expired ? "bg-red-100" : warning ? "bg-amber-100" : "bg-green-100"
                    }`}>
                      <BadgeCheck className={`w-5 h-5 ${expired ? "text-red-500" : warning ? "text-amber-500" : "text-green-600"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.industry} · {c.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Tipo de licencia</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LICENSE_COLORS[c.licenseType]}`}>
                        {LICENSE_LABELS[c.licenseType]}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Usuarios</p>
                      <p className="text-sm font-semibold text-gray-700">{c._count.users} / {c.maxUsers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Vencimiento</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {c.licenseExpiresAt
                          ? new Date(c.licenseExpiresAt).toLocaleDateString("es-ES")
                          : "—"}
                      </p>
                    </div>
                    <div className="text-center min-w-32">
                      <p className="text-xs text-gray-400 mb-0.5">Estado</p>
                      <p className={`text-sm font-semibold ${status.color}`}>{status.label}</p>
                    </div>
                    <button onClick={() => openEditCompany(c)}
                      className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-500 px-3 py-1.5 rounded-lg transition">
                      <Pencil className="w-3.5 h-3.5" />Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── USUARIOS ─────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Último acceso</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No hay usuarios</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                      {u.mustChangePassword && <span className="text-xs text-amber-500">Debe cambiar contraseña</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{u.company?.name}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "MANAGER" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("es-ES") : "Nunca"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => toggleUser(u.id, u.isActive)}>
                        {u.isActive
                          ? <ToggleRight className="w-6 h-6 text-green-500 mx-auto" />
                          : <ToggleLeft  className="w-6 h-6 text-gray-300 mx-auto" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── FACTORES ─────────────────────────────────────────────────── */}
        {tab === "factors" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setFactorsSubTab("global")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${factorsSubTab === "global" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                Factores globales
              </button>
              <button onClick={() => { setFactorsSubTab("country"); fetchCountryFactors(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${factorsSubTab === "country" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                Electricidad por país
              </button>
            </div>

            {factorsSubTab === "global" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Factor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Unidad</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">kgCO₂</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">kgCH₄</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">kgN₂O</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fuente</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Año</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>
                    ) : factors.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No hay factores</td></tr>
                    ) : factors.map((f) => (
                      <tr key={f.id} className={`hover:bg-gray-50 transition ${!f.isActive ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-800">{f.name}</p>
                          {f.fuelType && <p className="text-xs text-gray-400">{f.fuelType}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{UNIT_LABELS[f.unit] ?? f.unit}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">{f.kgCO2.toFixed(5)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">{f.kgCH4.toFixed(5)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">{f.kgN2O.toFixed(5)}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{SOURCE_LABELS[f.source] ?? f.source} · {f.region}</td>
                        <td className="px-4 py-3.5 text-center text-xs text-gray-500">{f.year}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditFactor(f)} className="text-gray-400 hover:text-green-600 transition">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => toggleFactor(f.id, f.isActive)}>
                              {f.isActive
                                ? <ToggleRight className="w-5 h-5 text-green-500" />
                                : <ToggleLeft  className="w-5 h-5 text-gray-300" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {factorsSubTab === "country" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">País</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">kgCO₂/kWh</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fuente</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Año</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {countryFactors.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>
                    ) : countryFactors.map((cf) => (
                      <tr key={cf.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{cf.countryName}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{cf.countryCode}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-green-700">{cf.kgCO2perKwh.toFixed(4)}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{cf.source}</td>
                        <td className="px-4 py-3.5 text-center text-xs text-gray-500">{cf.year}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button onClick={() => {
                            setEditCountryFactor(cf);
                            setCfForm({ kgCO2perKwh: String(cf.kgCO2perKwh), source: cf.source, year: String(cf.year) });
                            setShowCountryFactorModal(true);
                          }} className="text-gray-400 hover:text-green-600 transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal editar FE por país */}
        {showCountryFactorModal && editCountryFactor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Editar FE — {editCountryFactor.countryName}</h3>
                <button onClick={() => setShowCountryFactorModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">kgCO₂ por kWh *</label>
                  <input type="number" step="0.0001" value={cfForm.kgCO2perKwh}
                    onChange={(e) => setCfForm((p) => ({ ...p, kgCO2perKwh: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fuente</label>
                  <input type="text" value={cfForm.source}
                    onChange={(e) => setCfForm((p) => ({ ...p, source: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Año del dato</label>
                  <input type="number" value={cfForm.year}
                    onChange={(e) => setCfForm((p) => ({ ...p, year: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                  ⚠️ Este cambio afecta solo los valores de referencia. Las fuentes ya asignadas a empresas deben actualizarse manualmente.
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowCountryFactorModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button onClick={async () => {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/country-factors/${editCountryFactor.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      kgCO2perKwh: parseFloat(cfForm.kgCO2perKwh),
                      source: cfForm.source,
                      year: parseInt(cfForm.year),
                    }),
                  });
                  if (res.ok) {
                    setShowCountryFactorModal(false);
                    fetchCountryFactors();
                    setToast({ ok: true, msg: "Factor actualizado correctamente" });
                  }
                }} className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONSUMO ──────────────────────────────────────────────────── */}
        {tab === "consumption" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fuente</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cantidad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">tCO₂eq</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrado por</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Notas</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Verificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No hay registros para {selYear}</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-xs font-medium text-gray-700">{MONTHS[log.month - 1]} {log.year}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-700">{log.emissionSource.name}</p>
                      <p className="text-xs text-gray-400">{log.emissionSource.scope.replace("SCOPE_", "Alc. ")}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-gray-600">
                      {log.quantity.toFixed(2)} {UNIT_LABELS[log.emissionSource.unit] ?? log.emissionSource.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-green-700">
                      {(log.emissionsKgCO2eq / 1000).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.recordedBy.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{log.notes ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {log.isVerified
                        ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── MODAL EMPRESA ─────────────────────────────────────────────── */}
      {showCompanyModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto my-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900">{editCompany ? "Editar empresa" : "Nueva empresa"}</h3>
        <button onClick={() => { setShowCompanyModal(false); setEditCompany(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Selector de plan */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { key: "BASIC",      label: "Básico",      users: 2,   years: 5   },
          { key: "STANDARD",   label: "Estándar",    users: 5,   years: 10  },
          { key: "ENTERPRISE", label: "Empresarial", users: "∞", years: "∞" },
        ].map((p) => (
          <button key={p.key} onClick={() => setCForm((prev) => ({ ...prev, licenseType: p.key }))}
            className={`rounded-xl border p-3 text-left transition ${cForm.licenseType === p.key ? "border-green-500 bg-green-50 ring-2 ring-green-500" : "border-gray-100 bg-white hover:bg-gray-50"}`}>
            <p className="text-xs font-bold text-gray-700">{p.label}</p>
            <p className="text-xs text-gray-500 mt-1">👤 máx. {p.users} usuarios</p>
            <p className="text-xs text-gray-500">📅 máx. {p.years} años</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la empresa *</label>
          <input type="text" placeholder="Ej: Industrias Cochabamba S.A." value={cForm.name}
            onChange={(e) => setCForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">NIT / Tax ID *</label>
          <input type="text" placeholder="Ej: 1234567890" value={cForm.taxId}
            onChange={(e) => setCForm((p) => ({ ...p, taxId: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sector / Industria *</label>
          <input type="text" placeholder="Ej: Manufactura" value={cForm.industry}
            onChange={(e) => setCForm((p) => ({ ...p, industry: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
          <select value={cForm.country} onChange={(e) => setCForm((p) => ({ ...p, country: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="BO">🇧🇴 Bolivia — 0.557 kgCO₂/kWh</option>
            <option value="PE">🇵🇪 Perú — 0.310 kgCO₂/kWh</option>
            <option value="AR">🇦🇷 Argentina — 0.390 kgCO₂/kWh</option>
            <option value="CL">🇨🇱 Chile — 0.402 kgCO₂/kWh</option>
            <option value="CO">🇨🇴 Colombia — 0.176 kgCO₂/kWh</option>
            <option value="BR">🇧🇷 Brasil — 0.076 kgCO₂/kWh</option>
            <option value="MX">🇲🇽 México — 0.458 kgCO₂/kWh</option>
            <option value="EC">🇪🇨 Ecuador — 0.385 kgCO₂/kWh</option>
            <option value="PY">🇵🇾 Paraguay — 0.025 kgCO₂/kWh</option>
            <option value="UY">🇺🇾 Uruguay — 0.087 kgCO₂/kWh</option>
            <option value="VE">🇻🇪 Venezuela — 0.230 kgCO₂/kWh</option>
            <option value="US">🇺🇸 Estados Unidos — 0.386 kgCO₂/kWh</option>
            <option value="ES">🇪🇸 España — 0.180 kgCO₂/kWh</option>
            <option value="GLOBAL">🌍 Otro país — 0.493 kgCO₂/kWh (global)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">El factor de emisión de electricidad se asignará automáticamente según el país.</p>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Límite organizacional (ISO 14064-1)</label>
          <select value={cForm.orgBoundaryType} onChange={(e) => setCForm((p) => ({ ...p, orgBoundaryType: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="OPERATIONAL_CONTROL">Control operacional</option>
            <option value="FINANCIAL_CONTROL">Control financiero</option>
            <option value="EQUITY_SHARE">Participación accionaria</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Define qué operaciones se incluyen en el inventario GHG.</p>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Año base del inventario</label>
          <input type="number" min="2000" max="2100" placeholder={cForm.yearFrom || "Ej: 2020"} value={cForm.baseYear}
            onChange={(e) => setCForm((p) => ({ ...p, baseYear: e.target.value, baseYearRecalcNote: "" }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <p className="text-xs text-gray-400 mt-1">Si se deja vacío se usará el año de inicio como año base.</p>
        </div>

        {editCompany && editCompany.baseYear && cForm.baseYear && cForm.baseYear !== String(editCompany.baseYear) && (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Justificación del recálculo *</label>
            <textarea value={cForm.baseYearRecalcNote}
              onChange={(e) => setCForm((p) => ({ ...p, baseYearRecalcNote: e.target.value }))}
              placeholder="Explique por qué se cambia el año base (requerido por ISO 14064-1)..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-orange-300 bg-orange-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Año inicio inventario *</label>
          <input type="number" min="2000" max="2100" placeholder="2020" value={cForm.yearFrom}
            onChange={(e) => setCForm((p) => ({ ...p, yearFrom: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Año fin inventario *</label>
          <input type="number" min="2000" max="2100" placeholder="2025" value={cForm.yearTo}
            onChange={(e) => setCForm((p) => ({ ...p, yearTo: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        {/* Validación visual del rango */}
        {cForm.yearFrom && cForm.yearTo && (() => {
          const range = parseInt(cForm.yearTo) - parseInt(cForm.yearFrom) + 1;
          const maxRange = cForm.licenseType === "BASIC" ? 5 : cForm.licenseType === "STANDARD" ? 10 : 999;
          const ok = range >= 1 && range <= maxRange;
          const planLabel = cForm.licenseType === "BASIC" ? "Básico" : cForm.licenseType === "STANDARD" ? "Estándar" : "Empresarial";
          return (
            <div className={`col-span-2 rounded-xl p-3 text-xs font-medium flex items-center gap-2 ${ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {ok ? "✅" : "⚠️"}
              {ok
                ? `Rango válido: ${range} año(s) de inventario (máx. ${maxRange} para plan ${planLabel})`
                : `El plan ${planLabel} permite máximo ${maxRange} años. Rango actual: ${range} años.`}
            </div>
          );
        })()}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Año de reporte principal</label>
          <input type="number" value={cForm.reportingYear}
            onChange={(e) => setCForm((p) => ({ ...p, reportingYear: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label>
          <input type="date" value={cForm.licenseExpiresAt}
            onChange={(e) => setCForm((p) => ({ ...p, licenseExpiresAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button onClick={() => { setShowCompanyModal(false); setEditCompany(null); }}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button onClick={saveCompany}
          className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">
          {editCompany ? "Actualizar" : "Crear empresa"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── MODAL USUARIO ─────────────────────────────────────────────── */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Nuevo usuario</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Nombre", key: "name", type: "text", ph: "Nombre completo" },
                { label: "Email",  key: "email", type: "email", ph: "correo@empresa.com" },
                { label: "Contraseña temporal", key: "password", type: "text", ph: "Mínimo 8 caracteres" },
              ].map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} placeholder={ph} value={(uForm as any)[key]}
                    onChange={(e) => setUForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                <select value={uForm.companyId} onChange={(e) => setUForm((p) => ({ ...p, companyId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— Seleccionar empresa —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select value={uForm.role} onChange={(e) => setUForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="MANAGER">Manager (puede registrar)</option>
                  <option value="VIEWER">Viewer (solo lectura)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={createUser}
                className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">Crear usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FACTOR ──────────────────────────────────────────────── */}
      {showFactorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{editFactor ? "Editar factor" : "Nuevo factor de emisión"}</h3>
              <button onClick={() => { setShowFactorModal(false); setEditFactor(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input type="text" placeholder="Ej: Diésel — combustión móvil" value={fForm.name}
                  onChange={(e) => setFForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de combustible</label>
                <input type="text" placeholder="Diesel, Gasolina..." value={fForm.fuelType}
                  onChange={(e) => setFForm((p) => ({ ...p, fuelType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unidad *</label>
                <select value={fForm.unit} onChange={(e) => setFForm((p) => ({ ...p, unit: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">kgCO₂ por unidad *</label>
                <input type="number" step="0.00001" min="0" placeholder="0.00000" value={fForm.kgCO2}
                  onChange={(e) => setFForm((p) => ({ ...p, kgCO2: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">kgCH₄ por unidad</label>
                <input type="number" step="0.00001" min="0" placeholder="0.00000" value={fForm.kgCH4}
                  onChange={(e) => setFForm((p) => ({ ...p, kgCH4: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">kgN₂O por unidad</label>
                <input type="number" step="0.00001" min="0" placeholder="0.00000" value={fForm.kgN2O}
                  onChange={(e) => setFForm((p) => ({ ...p, kgN2O: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fuente</label>
                <select value={fForm.source} onChange={(e) => setFForm((p) => ({ ...p, source: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Región</label>
                <input type="text" placeholder="GLOBAL, BO..." value={fForm.region}
                  onChange={(e) => setFForm((p) => ({ ...p, region: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Año del factor</label>
                <input type="number" min="2000" max="2100" value={fForm.year}
                  onChange={(e) => setFForm((p) => ({ ...p, year: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <strong>Nota:</strong> Los factores deben obtenerse de fuentes oficiales (IPCC AR6, DEFRA, EPA). Verifique los valores antes de guardar.
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowFactorModal(false); setEditFactor(null); }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={saveFactor}
                className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">
                {editFactor ? "Actualizar" : "Crear factor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}