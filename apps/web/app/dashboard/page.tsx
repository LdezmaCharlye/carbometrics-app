"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../../lib/LanguageContext";
import { translate } from "../../lib/i18n";
import {
  Leaf, LogOut, Plus, BarChart3, Factory, Zap, Truck,
  TrendingUp, TrendingDown, ChevronDown, CheckCircle, FileText, Wind, Building2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Summary {
  totalTCO2eq: number;
  totalRecords: number;
  byMonth: { month: number; scope: string; total_kg: number }[];
}

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTHS_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const getScopeCfg = (T: (k: string) => string) => ({
  SCOPE_1: { label: T("dashboard.scope1"), sublabel: T("dashboard.directEmissions"),   bar: "#ef4444", icon: Factory },
  SCOPE_2: { label: T("dashboard.scope2"), sublabel: T("dashboard.indirectEmissions"), bar: "#f59e0b", icon: Zap     },
  SCOPE_3: { label: T("dashboard.scope3"), sublabel: T("dashboard.otherIndirect"),     bar: "#3b82f6", icon: Truck   },
});

function getTotalByMonth(byMonth: Summary["byMonth"], monthNum: number) {
  return (byMonth ?? [])
    .filter((r) => r.month === monthNum)
    .reduce((acc, r) => acc + Number(r.total_kg), 0) / 1000;
}

function getScopeTotal(byMonth: Summary["byMonth"], scope: string) {
  return (byMonth ?? [])
    .filter((r) => r.scope === scope)
    .reduce((acc, r) => acc + Number(r.total_kg), 0) / 1000;
}

function CustomTooltip({ active, payload, label, baseYear, viewYear, isBaseYear }: any) {
  if (!active || !payload?.length) return null;
  const current  = payload.find((p: any) => p.dataKey === "current")?.value  ?? 0;
  const baseline = payload.find((p: any) => p.dataKey === "baseline")?.value ?? 0;
  const diffTCO2 = !isBaseYear && baseline > 0 ? current - baseline : null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-48">
      <p className="font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block bg-green-500" />
            Gestión {viewYear}
          </span>
          <span className="font-semibold text-gray-800">{current.toFixed(3)} tCO₂eq</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-2 h-2 rounded-sm inline-block bg-gray-400" />
            {isBaseYear ? "Año base (ref.)" : `Año base ${baseYear}`}
          </span>
          <span className="font-medium text-gray-500">{baseline.toFixed(3)} tCO₂eq</span>
        </div>
        {diffTCO2 !== null && (
          <div className="flex justify-between gap-6 pt-1.5 border-t border-gray-100 font-semibold text-blue-500">
            <span>Diferencia</span>
            <span>{diffTCO2 > 0 ? "+" : ""}{diffTCO2.toFixed(3)} tCO₂eq</span>
          </div>
        )}
        {isBaseYear && (
          <p className="text-gray-400 pt-1 border-t border-gray-100">Año base — sin variación</p>
        )}
      </div>
    </div>
  );
}

function RemovalsCard({ token, viewYear, totalEmissions }: { token: string; viewYear: number; totalEmissions: number }) {
  const router = useRouter();
  const [removals, setRemovals] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/removals-by-company?year=${viewYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setRemovals(d.data ?? []))
      .catch(() => setRemovals([]))
      .finally(() => setLoading(false));
  }, [token, viewYear]);

  const totalRemovals = removals.reduce((acc, r) => acc + Number(r.tCO2eRemovedPerYear), 0);
  const netEmissions  = totalEmissions - totalRemovals;

  const TYPE_LABELS: Record<string, string> = {
    REFORESTATION:       "Reforestación",
    AFFORESTATION:       "Aforestación",
    SOIL_CARBON:         "Carbono en suelos",
    BIOCHAR:             "Biocarbón",
    DIRECT_AIR_CAPTURE:  "Captura directa de aire",
    ENHANCED_WEATHERING: "Meteorización mejorada",
    BLUE_CARBON:         "Carbono azul",
    OTHER:               "Otro",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
            <Wind className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Remociones y Sumideros</h2>
            <p className="text-xs text-gray-400 mt-0.5">ISO 14064-1 · Cláusula 5.3</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/removals")}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" />Gestionar
        </button>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-xs text-gray-400">Cargando remociones...</div>
      ) : removals.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Wind className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">Sin remociones registradas</p>
          <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
            La organización no tiene remociones ni sumideros identificados en el período de inventario.
          </p>
          <button
            onClick={() => router.push("/removals")}
            className="mt-3 inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
            <Plus className="w-3.5 h-3.5" />Registrar remoción
          </button>
        </div>
      ) : (
        <div>
          <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-50">
            <div>
              <p className="text-xs text-gray-400">Total emisiones</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{totalEmissions.toFixed(2)}</p>
              <p className="text-xs text-gray-400">tCO₂eq</p>
            </div>
            <div>
              <p className="text-xs text-teal-600">Total remociones</p>
              <p className="text-lg font-bold text-teal-600 mt-0.5">−{totalRemovals.toFixed(2)}</p>
              <p className="text-xs text-teal-500">tCO₂eq removidas</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Emisiones netas</p>
              <p className={`text-lg font-bold mt-0.5 ${netEmissions < totalEmissions ? "text-green-600" : "text-gray-900"}`}>
                {netEmissions.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">tCO₂eq netas</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {removals.map((r) => (
              <div key={r.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[r.type] ?? r.type} · {r.startYear}{r.endYear ? `–${r.endYear}` : " en adelante"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-600">−{Number(r.tCO2eRemovedPerYear).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">tCO₂eq/año</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [viewYear,    setViewYear]    = useState(currentYear);
  const [baseYear,    setBaseYear]    = useState<number | null>(null);
  const [yearFrom,    setYearFrom]    = useState<number>(currentYear - 9);
  const [yearTo,      setYearTo]      = useState<number>(currentYear);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [baseSummary, setBaseSummary] = useState<Summary | null>(null);
  const [user,        setUser]        = useState<any>(null);
  const [branches,         setBranches]         = useState<{ id: string; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [loading,      setLoading]      = useState(true);
  const [licenseAlert, setLicenseAlert] = useState<{ type: "warning" | "expired"; days: number } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
const { lang, toggleLang } = useLang();
const T = (key: string) => translate(lang, key);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) { router.push("/login"); return; }
    const parsedUser = JSON.parse(userStr);
    setUser(parsedUser);

    // Cargar perfil de empresa para años permitidos
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/company-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((company) => {
      if (company?.yearFrom) setYearFrom(company.yearFrom);
      if (company?.yearTo)   setYearTo(company.yearTo);
    }).catch(() => {});

    // Verificar estado de licencia
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/my-license`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((company) => {
      if (company?.licenseExpiresAt) {
        const diff = Math.ceil((new Date(company.licenseExpiresAt).getTime() - Date.now()) / 86400000);
        if (diff <= 0)       setLicenseAlert({ type: "expired",  days: Math.abs(diff) });
        else if (diff < 30)  setLicenseAlert({ type: "warning",  days: diff });
      }
    }).catch(() => {});

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => setBranches(Array.isArray(d) ? d.filter((b: any) => b.isActive) : [])).catch(() => {});

    setLoading(true);
    const branchQS = selectedBranchId ? `&branchId=${selectedBranchId}` : "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/summary?year=${viewYear}${branchQS}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then(setSummary).catch(() => {}).finally(() => setLoading(false));
  }, [router, token, viewYear, selectedBranchId]);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/company-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => { if (d.baseYear) setBaseYear(d.baseYear); }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token || !baseYear || baseYear === viewYear) { setBaseSummary(null); return; }
    const branchQS = selectedBranchId ? `&branchId=${selectedBranchId}` : "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/summary?year=${baseYear}${branchQS}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then(setBaseSummary).catch(() => {});
  }, [token, baseYear, viewYear, selectedBranchId]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const SCOPE_CFG = getScopeCfg(T);
  const s1 = getScopeTotal(summary?.byMonth ?? [], "SCOPE_1");
  const s2 = getScopeTotal(summary?.byMonth ?? [], "SCOPE_2");
  const s3 = getScopeTotal(summary?.byMonth ?? [], "SCOPE_3");
  const totalCurrent  = summary?.totalTCO2eq ?? 0;
  const totalBaseline = baseSummary?.totalTCO2eq ?? 0;
  const isBaseYear    = baseYear !== null && baseYear === viewYear;
  const totalDiffTCO2 = !isBaseYear && totalBaseline > 0 ? totalCurrent - totalBaseline : null;
  const totalDiffPct  = totalBaseline > 0 ? ((totalCurrent - totalBaseline) / totalBaseline) * 100 : null;

  const chartData = MONTHS_SHORT.map((m, i) => {
    const monthNum = i + 1;
    const current  = getTotalByMonth(summary?.byMonth ?? [], monthNum);
    const baseline = isBaseYear ? current : getTotalByMonth(baseSummary?.byMonth ?? [], monthNum);
    return { month: m, current, baseline };
  });

  const tableRows = MONTHS_FULL.map((m, i) => {
    const monthNum = i + 1;
    const s1v = (summary?.byMonth ?? []).find((r) => r.month === monthNum && r.scope === "SCOPE_1");
    const s2v = (summary?.byMonth ?? []).find((r) => r.month === monthNum && r.scope === "SCOPE_2");
    const s3v = (summary?.byMonth ?? []).find((r) => r.month === monthNum && r.scope === "SCOPE_3");
    const v1 = s1v ? Number(s1v.total_kg) / 1000 : 0;
    const v2 = s2v ? Number(s2v.total_kg) / 1000 : 0;
    const v3 = s3v ? Number(s3v.total_kg) / 1000 : 0;
    const total     = v1 + v2 + v3;
    const baseTotal = isBaseYear ? total : getTotalByMonth(baseSummary?.byMonth ?? [], monthNum);
    const diffTCO2  = !isBaseYear && baseTotal > 0 ? total - baseTotal : null;
    return { month: m, v1, v2, v3, total, baseTotal, diffTCO2 };
  }).filter((r) => r.total > 0 || r.baseTotal > 0);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-green-600">
        <Leaf className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-medium text-gray-500">{T("dashboard.loading")}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">CarboMetrics</p>
              <p className="text-xs text-gray-400 leading-tight">{user?.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/consumption/new")}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              <Plus className="w-3.5 h-3.5" />{T("dashboard.registerConsumption")}
            </button>
            <button onClick={() => router.push("/removals")}
              className="flex items-center gap-1.5 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              <Leaf className="w-3.5 h-3.5" />{T("dashboard.removals")}
            </button>
            <button onClick={() => router.push("/reports")}
              className="flex items-center gap-1.5 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              <FileText className="w-3.5 h-3.5" />{T("dashboard.report")}
            </button>
            <button onClick={() => router.push("/instalaciones")}
              className="flex items-center gap-1.5 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              <Building2 className="w-3.5 h-3.5" />Instalaciones
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <button
              onClick={toggleLang}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 transition"
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <span className="text-xs text-gray-500">{user?.name}</span>
            <button onClick={logout} className="text-gray-400 hover:text-gray-600 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-7 space-y-6">

        {/* Aviso de licencia */}
        {licenseAlert && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
            licenseAlert.type === "expired"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              licenseAlert.type === "expired" ? "bg-red-100" : "bg-amber-100"
            }`}>
              {licenseAlert.type === "expired" ? "🔒" : "⚠️"}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {licenseAlert.type === "expired"
                  ? "Licencia vencida — acceso restringido"
                  : `Tu licencia vence en ${licenseAlert.days} día(s)`}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {licenseAlert.type === "expired"
                  ? "Contacta al administrador para renovar tu licencia y recuperar el acceso completo."
                  : "Contacta al administrador para renovar antes del vencimiento."}
              </p>
            </div>
          </div>
        )}

        {/* Título + selector */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {T("dashboard.title")} {viewYear}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {T("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {branches.length > 0 && (
              <div className="relative">
                <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                  <option value="">Todas las instalaciones</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            <div className="relative">
              <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                {Array.from({ length: yearTo - yearFrom + 1 }, (_, i) => yearFrom + i).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 bg-green-600 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-green-100 text-xs font-medium uppercase tracking-wider">{T("dashboard.totalEmissions")}</p>
              <TrendingUp className="w-4 h-4 text-green-300" />
            </div>
            <div className="mt-3">
              <p className="text-4xl font-bold text-white leading-none">{totalCurrent.toFixed(2)}</p>
              <p className="text-green-200 text-xs mt-1.5">tCO₂eq · {viewYear}</p>
            </div>
            {totalDiffPct !== null && !isBaseYear && (
              <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg w-fit ${
                totalDiffPct > 0 ? "bg-red-500/20 text-red-200" : "bg-white/20 text-green-100"
              }`}>
                {totalDiffPct > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {totalDiffPct > 0 ? "+" : ""}{totalDiffPct.toFixed(1)}% vs {baseYear}
              </div>
            )}
            {isBaseYear && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg w-fit bg-white/20 text-white">
                {T("dashboard.baseYear")}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-green-500">
              <p className="text-green-200 text-xs">{summary?.totalRecords ?? 0} {T("dashboard.records")}</p>
            </div>
          </div>

          {(["SCOPE_1","SCOPE_2","SCOPE_3"] as const).map((scope) => {
            const cfg      = SCOPE_CFG[scope];
            const Icon     = cfg.icon;
            const value    = scope === "SCOPE_1" ? s1 : scope === "SCOPE_2" ? s2 : s3;
            const pct      = totalCurrent > 0 ? (value / totalCurrent) * 100 : 0;
            const baseVal  = getScopeTotal(baseSummary?.byMonth ?? [], scope);
            const scopeDiffTCO2 = !isBaseYear && baseVal > 0 ? value - baseVal : null;
            return (
              <div key={scope} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-xs font-semibold">{cfg.label}</p>
                    <p className="text-gray-400 text-xs">{cfg.sublabel}</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bar + "18" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.bar }} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-gray-900">{value.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs mt-0.5">tCO₂eq</p>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{T("dashboard.ofTotal")}</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#9ca3af" }} />
                  </div>
                  {scopeDiffTCO2 !== null && (
                    <p className="text-xs font-medium text-blue-500">
                      {scopeDiffTCO2 > 0 ? "▲" : "▼"} {Math.abs(scopeDiffTCO2).toFixed(2)} tCO₂eq vs {baseYear}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráfica */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">{T("dashboard.monthlyEmissions")}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{T("dashboard.monthlySubtitle")}</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block bg-green-500" />
                <span className="text-xs text-gray-600 font-medium">{T("dashboard.management")} {viewYear}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block bg-gray-400" />
                <span className="text-xs text-gray-500">
                  {isBaseYear ? T("dashboard.baseYearRef") : `${T("dashboard.baseYearRef").replace("(ref.)", "").trim()} ${baseYear}`}
                </span>
              </div>
            </div>
          </div>

          {chartData.some((d) => d.current > 0 || d.baseline > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={5}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(v) => v === 0 ? "0" : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(1)} />
                <Tooltip content={<CustomTooltip baseYear={baseYear} viewYear={viewYear} isBaseYear={isBaseYear} />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="baseline" name={isBaseYear ? "Año base (ref.)" : `Año base ${baseYear}`} fill="#9ca3af" radius={[3,3,0,0]} maxBarSize={32} />
                <Bar dataKey="current" name={`Gestión ${viewYear}`} radius={[3,3,0,0]} maxBarSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill="#22c55e" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium">{T("dashboard.noDataYear")} {viewYear}</p>
              <p className="text-xs text-gray-300 mt-1">{T("dashboard.registerToSeeChart")}</p>
            </div>
          )}

          <div className="flex items-center gap-5 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
              {T("dashboard.management")} {viewYear}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-400 inline-block" />
              {isBaseYear ? T("dashboard.baseYearRef") : `${T("dashboard.baseYearRef").replace("(ref.)", "").trim()} ${baseYear}`}
            </span>
          </div>
        </div>

        {/* Remociones y Sumideros */}
        <RemovalsCard token={token ?? ""} viewYear={viewYear} totalEmissions={totalCurrent} />

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">{T("dashboard.detailByMonth")}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isBaseYear
                ? `Año base ${baseYear} — referencia del inventario`
                : baseYear
                  ? `Comparación ${viewYear} con el año base ${baseYear}`
                  : `Emisiones de ${viewYear}`}
            </p>
          </div>

          {tableRows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">No hay registros para {viewYear}.</p>
              <button onClick={() => router.push("/consumption/new")}
                className="mt-3 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition mx-auto">
                <Plus className="w-3.5 h-3.5" />Registrar consumo
              </button>
              <button onClick={() => router.push("/verification")}
  className="flex items-center gap-1.5 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition">
  <CheckCircle className="w-3.5 h-3.5" />
  Verificar
</button>
<button onClick={() => router.push("/reports")}
  className="flex items-center gap-1.5 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition">
  <FileText className="w-3.5 h-3.5" />
  Reportes
</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alc. 1</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alc. 2</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alc. 3</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total {viewYear}</th>
                  {!isBaseYear && baseYear && <>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Año base</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Diferencia tCO₂eq</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tableRows.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-medium text-gray-700">{row.month}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 text-xs">
                      {row.v1 > 0 ? row.v1.toFixed(2) : <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 text-xs">
                      {row.v2 > 0 ? row.v2.toFixed(2) : <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 text-xs">
                      {row.v3 > 0 ? row.v3.toFixed(2) : <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-gray-900">{row.total.toFixed(3)}</td>
                    {!isBaseYear && baseYear && <>
                      <td className="px-4 py-3.5 text-right tabular-nums text-gray-400 text-xs">
                        {row.baseTotal > 0 ? row.baseTotal.toFixed(3) : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {row.diffTCO2 !== null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                            {row.diffTCO2 > 0 ? "▲" : "▼"} {Math.abs(row.diffTCO2).toFixed(3)}
                          </span>
                        ) : <span className="text-gray-200 text-xs">—</span>}
                      </td>
                    </>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Total {viewYear}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-gray-600 text-xs">{s1.toFixed(3)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-gray-600 text-xs">{s2.toFixed(3)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-gray-600 text-xs">{s3.toFixed(3)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-gray-900">{totalCurrent.toFixed(3)}</td>
                  {!isBaseYear && baseYear && <>
                    <td className="px-4 py-3.5 text-right tabular-nums font-bold text-gray-400 text-xs">{totalBaseline.toFixed(3)}</td>
                    <td className="px-6 py-3.5 text-right">
                      {totalDiffTCO2 !== null && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                          {totalDiffTCO2 > 0 ? "▲" : "▼"} {Math.abs(totalDiffTCO2).toFixed(3)}
                        </span>
                      )}
                    </td>
                  </>}
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}