"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, ArrowLeft, Download, Loader2, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const MONTHS_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const ORG_BOUNDARY_LABELS: Record<string, string> = {
  OPERATIONAL_CONTROL: "Control operacional",
  FINANCIAL_CONTROL:   "Control financiero",
  EQUITY_SHARE:        "Participación accionaria",
};

const UNCERTAINTY_LABELS: Record<string, { label: string; color: string }> = {
  LOW:    { label: "Baja",  color: "text-green-700 bg-green-100" },
  MEDIUM: { label: "Media", color: "text-yellow-700 bg-yellow-100" },
  HIGH:   { label: "Alta",  color: "text-red-700 bg-red-100" },
};

const DATA_QUALITY_LABELS: Record<string, string> = {
  DIGITAL_INVOICE:  "Factura digital",
  PHYSICAL_INVOICE: "Factura física",
  MEASURED:         "Medido directamente",
  CALCULATED:       "Calculado",
  ESTIMATED:        "Estimado",
};

interface YearSummary {
  year: number;
  totalTCO2eq: number;
  totalRecords: number;
  byMonth: { month: number; scope: string; total_kg: number }[];
}

interface EmissionSource {
  id: string; name: string; scope: string; category: string;
  uncertaintyLevel: string; uncertaintyNote: string | null;
  isExcluded: boolean; exclusionReason: string | null;
}

interface CompanyProfile {
  id: string; name: string; taxId: string; industry: string; country: string;
  orgBoundaryType: string; baseYear: number | null; baseYearRecalcNote: string | null;
  yearFrom: number; yearTo: number; licenseType: string;
  emissionSources: EmissionSource[];
}

interface ConsumptionLog {
  id: string; year: number; month: number; quantity: number;
  emissionsKgCO2eq: number; notes: string | null;
  dataQuality: string | null;
  isVerified: boolean; verifiedAt: string | null;
  emissionSource: { name: string; scope: string; unit: string };
  recordedBy: { name: string };
  verifiedBy: { name: string } | null;
}

function getScopeTotal(byMonth: YearSummary["byMonth"], scope: string) {
  return (byMonth ?? []).filter((r) => r.scope === scope).reduce((acc, r) => acc + Number(r.total_kg), 0) / 1000;
}

const UNIT_LABELS: Record<string, string> = {
  LITER: "L", KWH: "kWh", MWH: "MWh", M3: "m³", KG: "kg",
  TON: "ton", KM: "km", KM_PASSENGER: "km-pax", TON_KM: "ton-km",
  TON_WASTE: "ton res.", GALLON_US: "gal", USD: "USD",
};

function RemovalsSection({ token, sectionNumber, companyName }: { token: string; sectionNumber: number; companyName: string }) {
  const [removals, setRemovals] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

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

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/removals-by-company`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setRemovals(d.data ?? []))
      .catch(() => setRemovals([]))
      .finally(() => setLoading(false));
  }, [token]);

  const totalRemovals = removals.reduce((acc, r) => acc + Number(r.tCO2eRemovedPerYear), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 page-break">
      <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">
        {sectionNumber}. Remociones y Sumideros de GEI
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Conforme a la cláusula 5.3 de la norma ISO 14064-1:2018, se declaran a continuación las remociones de GEI identificadas por <strong>{companyName}</strong> durante el período del inventario.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">Cargando remociones...</p>
      ) : removals.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Declaración sobre remociones y sumideros</p>
          <p>La organización no tiene remociones ni sumideros de GEI identificados en el período de inventario. No se han implementado proyectos de captura, secuestro o almacenamiento de carbono durante el período reportado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Proyectos registrados</p>
              <p className="text-2xl font-bold text-teal-700 mt-1">{removals.length}</p>
              <p className="text-xs text-teal-500">proyectos de remoción</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Total removido/año</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{totalRemovals.toFixed(2)}</p>
              <p className="text-xs text-green-500">tCO₂eq removidas por año</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-gray-400 font-semibold">Proyecto</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-semibold">Período</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-semibold">Metodología</th>
                  <th className="text-right px-4 py-2 text-gray-400 font-semibold">tCO₂eq/año</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {removals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-medium text-gray-700">{r.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{TYPE_LABELS[r.type] ?? r.type}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {r.startYear}{r.endYear ? `–${r.endYear}` : " en adelante"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{r.methodology ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-teal-600">
                      {Number(r.tCO2eRemovedPerYear).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total remociones
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-teal-700">
                    {totalRemovals.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500">
            <strong>Nota metodológica:</strong> Las remociones declaradas han sido cuantificadas conforme a metodologías reconocidas internacionalmente. La verificación de tercera parte de los proyectos de remoción deberá realizarse conforme a ISO 14064-2 o estándares equivalentes (VCS, Gold Standard).
          </div>
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [years,      setYears]      = useState<number[]>([]);
  const [summaries,  setSummaries]  = useState<YearSummary[]>([]);
  const [company,    setCompany]    = useState<CompanyProfile | null>(null);
  const [logs,       setLogs]       = useState<ConsumptionLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportId,   setReportId]   = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    setReportId(`CM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/company-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/all-years`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
    .then(async ([companyData, yearsData]) => {
      setCompany(companyData);
      const allYears: number[] = yearsData.years ?? [];
      const yearFrom = companyData?.yearFrom ?? 0;
      const yearTo   = companyData?.yearTo   ?? 9999;
      const ys = allYears.filter((y) => y >= yearFrom && y <= yearTo);
      setYears(ys);

      const results = await Promise.all(
        ys.map((y) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/summary?year=${y}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()).then((s) => ({ ...s, year: y }))
        )
      );
      setSummaries(results);

      const allLogs = await Promise.all(
        ys.map((y) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/list?year=${y}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json())
        )
      );
      setLogs(allLogs.flat());
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [router, token]);

  const baseYear = company?.baseYear ?? years[0] ?? null;

  useEffect(() => {
    const handleAfterPrint = () => { window.location.reload(); };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const generatePDF = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    window.print();
    setGenerating(false);
  };

  if (loading || !company) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-green-600">
        <Leaf className="w-5 h-5 animate-pulse" />
        <span className="text-sm text-gray-500">Cargando reporte...</span>
      </div>
    </div>
  );

  const preparedDate = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  const activeSources   = (company?.emissionSources ?? []).filter((s) => !s.isExcluded);
  const excludedSources = (company?.emissionSources ?? []).filter((s) => s.isExcluded);

  const qualityCounts = logs.reduce((acc, l) => {
    const q = l.dataQuality ?? "ESTIMATED";
    acc[q] = (acc[q] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const verifiedLogs   = logs.filter((l) => l.isVerified);
  const unverifiedLogs = logs.filter((l) => !l.isVerified);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-family: Arial, sans-serif; background: white; }
          @page { size: letter portrait; margin: 12mm; }
          main { max-width: 100% !important; padding: 0 !important; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
          .bg-green-600 { background-color: white !important; color: black !important; border: 2px solid #16a34a !important; }
          .bg-green-50 { background-color: white !important; }
          .bg-gray-50 { background-color: white !important; }
          .text-white { color: black !important; }
          .text-green-200 { color: #166534 !important; }
          .print-section { page-break-inside: avoid; }
        }
      .print-section { page-break-before: always; page-break-inside: avoid; }
          .avoid-break { page-break-inside: avoid; }
      `}</style>

      <header className="no-print bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Reporte de Emisiones GEI</p>
              <p className="text-xs text-gray-400">ISO 14064-1:2018 · {company?.name}</p>
            </div>
          </div>
          <button onClick={generatePDF} disabled={generating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
            {generating
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando...</>
              : <><Download className="w-3.5 h-3.5" />Descargar PDF</>}
          </button>
        </div>
      </header>

      <div className="bg-gray-100 min-h-screen py-2">
        <main id="report-content" className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {/* PORTADA */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-green-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="CarboMetrics" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">CarboMetrics</p>
                  <p className="text-green-200 text-xs">Sistema de Gestión de Emisiones GEI</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-200 text-xs">N° de reporte</p>
                <p className="text-white font-mono font-bold text-sm">{reportId}</p>
              </div>
            </div>
            <div className="px-8 py-8 text-center">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">Inventario de Gases de Efecto Invernadero</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">REPORTE DE EMISIONES GEI</h1>
              <p className="text-xl text-gray-500 mb-4">
                {years.length > 1 ? `${years[0]} — ${years[years.length - 1]}` : years[0] ?? "—"}
              </p>
              <div className="inline-block bg-gray-50 rounded-2xl px-8 py-4 border border-gray-200">
                <p className="text-2xl font-bold text-green-700">{company?.name}</p>
                <p className="text-sm text-gray-500 mt-1">{company?.industry} · {company?.country}</p>
                <p className="text-xs text-gray-400 mt-0.5">NIT / Tax ID: {company?.taxId}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
                <span>Norma: <strong className="text-gray-600">ISO 14064-1:2018</strong></span>
                <span>·</span>
                <span>Protocolo: <strong className="text-gray-600">GHG Protocol Corporate Standard</strong></span>
                <span>·</span>
                <span>Fecha: <strong className="text-gray-600">{preparedDate}</strong></span>
              </div>
            </div>
          </div>

          {/* 1. PRESENTACIÓN */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">1. Presentación</h2>
            <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
              <p>El presente informe expone el inventario de gases de efecto invernadero (GEI) de <strong>{company?.name}</strong>, elaborado conforme a los requisitos de la norma <strong>ISO 14064-1:2018</strong> y el <strong>GHG Protocol Corporate Standard</strong>.</p>
              <p>El inventario cubre {years.length > 1 ? `las gestiones ${years.join(", ")}` : `la gestión ${years[0]}`}, con año base <strong>{baseYear ?? "no definido"}</strong>. La verificación de tercera parte deberá ser realizada por un verificador acreditado conforme a la norma ISO 14064-3.</p>
              <p>Este documento ha sido generado digitalmente por el sistema CarboMetrics el <strong>{preparedDate}</strong>, con número de referencia <strong>{reportId}</strong>.</p>
            </div>
          </div>

          {/* 2. ORGANIZACIÓN */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">2. Descripción de la Organización</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Razón social", company?.name ?? "—"],
                ["NIT / Tax ID", company?.taxId ?? "—"],
                ["Sector / Industria", company?.industry ?? "—"],
                ["País de operación", company?.country ?? "—"],
                ["Norma aplicada", "ISO 14064-1:2018"],
                ["Protocolo", "GHG Protocol Corporate Standard"],
                ["Período del inventario", years.length > 1 ? `${years[0]} – ${years[years.length - 1]}` : String(years[0] ?? "—")],
                ["Año base", String(baseYear ?? "Primer año con datos")],
                ["Tipo de licencia", company?.licenseType ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. LÍMITES */}
          {/* page-break antes del punto 3 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">3. Límites de la Organización</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enfoque de límites: <strong>{ORG_BOUNDARY_LABELS[company?.orgBoundaryType ?? "OPERATIONAL_CONTROL"]}</strong>. Bajo este enfoque, la organización contabiliza el 100% de las emisiones de las operaciones sobre las que ejerce {company?.orgBoundaryType === "FINANCIAL_CONTROL" ? "control financiero" : company?.orgBoundaryType === "EQUITY_SHARE" ? "participación accionaria" : "control operacional"}.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Alcance 1", sub: "Emisiones directas", desc: "Combustión estacionaria, móvil, procesos y emisiones fugitivas bajo control directo.", color: "border-red-200 bg-red-50 text-red-700" },
                { label: "Alcance 2", sub: "Emisiones indirectas por energía", desc: "Electricidad, calor o vapor adquirido y consumido por la organización.", color: "border-amber-200 bg-amber-50 text-amber-700" },
                { label: "Alcance 3", sub: "Otras emisiones indirectas", desc: "Viajes de negocio, cadena de suministro y otras actividades de valor (si aplica).", color: "border-blue-200 bg-blue-50 text-blue-700" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                  <p className="font-bold text-sm">{s.label}</p>
                  <p className="text-xs font-semibold opacity-80 mb-1">{s.sub}</p>
                  <p className="text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 mb-4">
              <strong>GEI contabilizados:</strong> CO₂, CH₄, N₂O (Alcances 1–3) · HFCs, PFCs, SF₆ (emisiones fugitivas, Alcance 1) — conforme al Protocolo de Kioto e ISO 14064-1.
            </div>
            {activeSources.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fuentes de emisión incluidas en el inventario</p>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Fuente</th>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Alcance</th>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeSources.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2 font-medium text-gray-700">{s.name}</td>
                          <td className="px-4 py-2 text-gray-500">{s.scope.replace("SCOPE_", "Alcance ")}</td>
                          <td className="px-4 py-2 text-gray-400">{({
                            STATIONARY_COMBUSTION: "Combustión estacionaria",
                            MOBILE_COMBUSTION: "Combustión móvil",
                            PROCESS_EMISSIONS: "Emisiones de proceso",
                            FUGITIVE_EMISSIONS: "Emisiones fugitivas",
                            PURCHASED_ELECTRICITY: "Electricidad comprada",
                            PURCHASED_HEAT: "Calor comprado",
                            PURCHASED_COOLING: "Enfriamiento comprado",
                            BUSINESS_TRAVEL: "Viajes de negocio",
                            EMPLOYEE_COMMUTING: "Transporte empleados",
                            WASTE_DISPOSAL: "Disposición de residuos",
                            PURCHASED_GOODS: "Bienes y servicios",
                            UPSTREAM_TRANSPORT: "Transporte aguas arriba",
                            DOWNSTREAM_TRANSPORT: "Transporte aguas abajo",
                            USE_OF_SOLD_PRODUCTS: "Uso de productos vendidos",
                            END_OF_LIFE_TREATMENT: "Tratamiento fin de vida",
                          } as Record<string,string>)[s.category] ?? s.category.replace(/_/g, " ").toLowerCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 4. AÑO BASE */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">4. Selección del Año Base</h2>
            <p className="text-sm text-gray-600 mb-1">
              Año base establecido: <strong>{baseYear ?? "No definido"}</strong> —
              {company?.baseYear ? " año base definido explícitamente por la organización." : " primer año con datos de actividad registrados en el sistema, conforme al Protocolo GHG."}
            </p>
            {company?.baseYearRecalcNote && (
              <div className="mt-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                <strong>Justificación de recálculo del año base:</strong> {company.baseYearRecalcNote}
              </div>
            )}
            {summaries.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Gestión</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-red-400 uppercase">Alcance 1</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-amber-400 uppercase">Alcance 2</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-blue-400 uppercase">Alcance 3</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total tCO₂eq</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Registros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summaries.map((s) => {
                      const s1 = getScopeTotal(s.byMonth, "SCOPE_1");
                      const s2 = getScopeTotal(s.byMonth, "SCOPE_2");
                      const s3 = getScopeTotal(s.byMonth, "SCOPE_3");
                      return (
                        <tr key={s.year} className={s.year === baseYear ? "bg-green-50/60" : "hover:bg-gray-50"}>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {s.year}
                            {s.year === baseYear && <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">año base</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s1.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s2.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s3.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">{s.totalTCO2eq.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-400 text-xs">{s.totalRecords}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. METODOLOGÍA */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 page-break">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">5. Metodología de Cuantificación</h2>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
              <p className="text-sm font-semibold text-gray-800">Emisiones (tCO₂eq) = Dato de actividad × Factor de emisión</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">tCO₂eq = cantidad × (kgCO₂ + kgCH₄ × 27.9 + kgN₂O × 273) / 1000</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Factores de emisión:</strong> IPCC AR6, DEFRA 2023, EPA 2023, y factores nacionales de electricidad por país (IEA/CNDC).</p>
              <p><strong>Potenciales de calentamiento global (GWP):</strong> CH₄ = 27.9, N₂O = 273 — valores AR6 del IPCC (horizonte 100 años).</p>
              <p><strong>Calidad del dato de actividad:</strong> clasificada por tipo de evidencia en cada registro.</p>
            </div>
            {logs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(DATA_QUALITY_LABELS).map(([key, label]) => {
                  const count = qualityCounts[key] ?? 0;
                  if (count === 0) return null;
                  const pct = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl px-4 py-2 text-center border border-gray-100">
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-xs text-gray-400">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6+. DETALLE POR AÑO */}
          {summaries.map((s, idx) => {
            const s1 = getScopeTotal(s.byMonth, "SCOPE_1");
            const s2 = getScopeTotal(s.byMonth, "SCOPE_2");
            const s3 = getScopeTotal(s.byMonth, "SCOPE_3");
            const baseTotal = summaries[0]?.totalTCO2eq ?? 0;
            const diffTCO2  = s.year !== baseYear && baseTotal > 0 ? s.totalTCO2eq - baseTotal : null;
            const diffPct   = s.year !== baseYear && baseTotal > 0 ? ((s.totalTCO2eq - baseTotal) / baseTotal) * 100 : null;

            const chartData = MONTHS_S.map((m, i) => {
              const val = (s.byMonth ?? []).filter((r) => r.month === i + 1).reduce((a, r) => a + Number(r.total_kg), 0) / 1000;
              return { month: m, value: val };
            });

            const yearLogs = logs.filter((l) => l.year === s.year);

            return (
              <div key={s.year} className={`bg-white rounded-2xl border border-gray-200 p-3 space-y-2 ${idx === 0 ? "page-break" : "mt-3"}`}>
                <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">
                  {idx + 6}. Emisiones GEI — Gestión {s.year}
                  {s.year === baseYear && <span className="ml-2 text-green-600 normal-case font-normal">(Año base)</span>}
                </h2>

                <div className="flex items-center justify-between bg-green-600 rounded-xl px-5 py-4 text-white">
                  <div>
                    <p className="text-xs text-green-200 font-medium uppercase tracking-wider">Total {s.year}</p>
                    <p className="text-3xl font-bold mt-0.5">{s.totalTCO2eq.toFixed(2)} <span className="text-sm font-normal text-green-200">tCO₂eq</span></p>
                    <p className="text-green-200 text-xs mt-0.5">{s.totalRecords} registros ingresados</p>
                  </div>
                  {diffTCO2 !== null && diffPct !== null && (
                    <div className="text-right px-4 py-2 rounded-lg bg-white/20">
                      <p className="text-xs text-green-200">Respecto al año base {baseYear}</p>
                      <p className="text-xl font-bold mt-0.5">
                        {diffTCO2 > 0 ? "▲" : "▼"} {Math.abs(diffTCO2).toFixed(2)} tCO₂eq
                      </p>
                      <p className="text-xs text-green-200 mt-0.5">{diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}%</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Alcance 1", sub: "Emisiones directas",    val: s1, color: "border-red-200 bg-red-50 text-red-700" },
                    { label: "Alcance 2", sub: "Emisiones indirectas",  val: s2, color: "border-amber-200 bg-amber-50 text-amber-700" },
                    { label: "Alcance 3", sub: "Otras indirectas",      val: s3, color: "border-blue-200 bg-blue-50 text-blue-700" },
                  ].map((sc) => (
                    <div key={sc.label} className={`rounded-xl border p-4 flex items-center justify-between ${sc.color}`}>
                      <div>
                        <p className="text-xs font-bold">{sc.label}</p>
                        <p className="text-xs opacity-70">{sc.sub}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{sc.val.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">tCO₂eq</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Emisiones mensuales — {s.year}</p>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={chartData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40}
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(1)} />
                      <Tooltip
                        formatter={(v: number) => [`${v.toFixed(2)} tCO₂eq`, "Emisiones"]}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                      <Bar dataKey="value" radius={[3,3,0,0]} maxBarSize={28}>
                        {chartData.map((_, i) => <Cell key={i} fill="#22c55e" />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

          {/* 8. REMOCIONES Y SUMIDEROS */}
          <RemovalsSection
            token={token ?? ""}
            sectionNumber={summaries.length + 6}
            companyName={company?.name ?? ""}
          />

          {/* INCERTIDUMBRE */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 page-break">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">
              {summaries.length + 7}. Incertidumbre
            </h2>
            <p className="text-sm text-gray-600 mb-4">La incertidumbre del inventario se evalúa a nivel de fuente, considerando la calidad del dato de actividad y la precisión del factor de emisión utilizado.</p>
            {activeSources.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-gray-400 font-semibold">Fuente de emisión</th>
                      <th className="text-left px-4 py-2 text-gray-400 font-semibold">Alcance</th>
                      <th className="text-left px-4 py-2 text-gray-400 font-semibold">Nivel</th>
                      <th className="text-left px-4 py-2 text-gray-400 font-semibold">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeSources.map((s) => {
                      const ui = UNCERTAINTY_LABELS[s.uncertaintyLevel] ?? { label: s.uncertaintyLevel, color: "text-gray-600 bg-gray-100" };
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-2.5 font-medium text-gray-700">{s.name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{s.scope.replace("SCOPE_", "Alcance ")}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ui.color}`}>{ui.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400">{s.uncertaintyNote ?? "Factor de fuente reconocida (IPCC AR6 / DEFRA / EPA)."}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No hay fuentes activas configuradas.</p>
            )}
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500">
              <strong>Trazabilidad:</strong> {verifiedLogs.length} de {logs.length} registros verificados ({logs.length > 0 ? Math.round((verifiedLogs.length / logs.length) * 100) : 0}%). {unverifiedLogs.length > 0 ? `${unverifiedLogs.length} registros pendientes.` : "Todos verificados."}
            </div>
          </div>

          {/* EXCLUSIONES */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">
              {summaries.length + 8}. Exclusiones
            </h2>
            {excludedSources.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                ✅ No se han excluido fuentes del inventario. Todas las fuentes configuradas están incluidas en la cuantificación.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">Las siguientes fuentes han sido excluidas con justificación documentada, conforme a la cláusula 5.2 de ISO 14064-1:</p>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Fuente excluida</th>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Alcance</th>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Razón de exclusión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {excludedSources.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2.5 font-medium text-gray-700">{s.name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{s.scope.replace("SCOPE_", "Alcance ")}</td>
                          <td className="px-4 py-2.5 text-gray-500">{s.exclusionReason ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* CONCLUSIONES */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">
              {summaries.length + 9}. Conclusiones
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              {summaries.length > 1 && (() => {
                const first = summaries[0];
                const last  = summaries[summaries.length - 1];
                const diff  = first.totalTCO2eq > 0
                  ? ((last.totalTCO2eq - first.totalTCO2eq) / first.totalTCO2eq) * 100
                  : null;
                const s1f = getScopeTotal(first.byMonth, "SCOPE_1");
                const s2f = getScopeTotal(first.byMonth, "SCOPE_2");
                const s3f = getScopeTotal(first.byMonth, "SCOPE_3");
                const maxScope = s1f >= s2f && s1f >= s3f ? "Alcance 1 (emisiones directas)"
                  : s2f >= s3f ? "Alcance 2 (electricidad)" : "Alcance 3 (cadena de valor)";
                return (
                  <>
                    {diff !== null && (
                      <p>• Las emisiones de <strong>{first.year}</strong> a <strong>{last.year}</strong> han <strong>{diff > 0 ? "aumentado" : "disminuido"}</strong> un <strong>{Math.abs(diff).toFixed(1)}%</strong>, de <strong>{first.totalTCO2eq.toFixed(2)}</strong> a <strong>{last.totalTCO2eq.toFixed(2)}</strong> tCO₂eq.</p>
                    )}
                    <p>• Mayor contribución: <strong>{maxScope}</strong>.</p>
                    <p>• <strong>{verifiedLogs.length}</strong> de <strong>{logs.length}</strong> registros verificados ({logs.length > 0 ? Math.round((verifiedLogs.length / logs.length) * 100) : 0}% de trazabilidad).</p>
                    <p>• El <strong>{Math.round(((qualityCounts["DIGITAL_INVOICE"] ?? 0) + (qualityCounts["PHYSICAL_INVOICE"] ?? 0)) / Math.max(logs.length, 1) * 100)}%</strong> de los datos están respaldados por factura (digital o física).</p>
                    <p>• Se recomienda establecer metas de reducción y continuar el seguimiento periódico del inventario.</p>
                    <p>• La verificación de tercera parte deberá realizarla un verificador acreditado conforme a ISO 14064-3.</p>
                  </>
                );
              })()}
              {summaries.length === 1 && (
                <>
                  <p>• Inventario de <strong>{summaries[0].year}</strong> elaborado conforme a ISO 14064-1:2018 con <strong>{summaries[0].totalRecords}</strong> registros.</p>
                  <p>• Se recomienda continuar registrando datos para establecer tendencias multianuales.</p>
                  <p>• Verificación por verificador acreditado conforme a ISO 14064-3.</p>
                </>
              )}
              {summaries.length === 0 && (
                <p>• No hay datos suficientes. Registre consumos para obtener un inventario completo.</p>
              )}
            </div>
          </div>

          {/* 11. MEDIDAS DE REDUCCIÓN */}
          {(() => {
            const medidas: { titulo: string; descripcion: string }[] = [];

            const s1Total = summaries.reduce((a, s) => a + getScopeTotal(s.byMonth, "SCOPE_1"), 0);
            const s2Total = summaries.reduce((a, s) => a + getScopeTotal(s.byMonth, "SCOPE_2"), 0);
            const s3Total = summaries.reduce((a, s) => a + getScopeTotal(s.byMonth, "SCOPE_3"), 0);
            const totalAll = s1Total + s2Total + s3Total;

            const hasHFCs = activeSources.some((s) => s.name.toLowerCase().includes("hfc") || s.name.toLowerCase().includes("refriger"));
            const hasPFCs = activeSources.some((s) => s.name.toLowerCase().includes("pfc") || s.name.toLowerCase().includes("fluorad"));
            const hasSF6  = activeSources.some((s) => s.name.toLowerCase().includes("sf6") || s.name.toLowerCase().includes("hexaflu"));
            const estimatedPct = logs.length > 0 ? Math.round(((qualityCounts["ESTIMATED"] ?? 0) / logs.length) * 100) : 0;
            const verifiedPct  = logs.length > 0 ? Math.round((verifiedLogs.length / logs.length) * 100) : 0;

            if (s1Total > 0 && (s1Total / Math.max(totalAll, 1)) > 0.3) {
              medidas.push({
                titulo: "Sustitución de combustibles fósiles",
                descripcion: "Las emisiones directas (Alcance 1) representan una parte significativa del inventario. Se recomienda evaluar la transición a vehículos eléctricos o híbridos, el uso de biocombustibles certificados y la optimización de rutas de transporte para reducir el consumo de combustible.",
              });
              medidas.push({
                titulo: "Eficiencia en combustión estacionaria",
                descripcion: "Implementar mantenimiento preventivo en generadores y equipos de combustión para optimizar la eficiencia térmica. Considerar la sustitución de generadores diésel por sistemas de energía renovable (solar, eólica) donde sea técnicamente viable.",
              });
            }

            if (s2Total > 0 && (s2Total / Math.max(totalAll, 1)) > 0.1) {
              medidas.push({
                titulo: "Eficiencia energética y energías renovables",
                descripcion: "Las emisiones indirectas por electricidad (Alcance 2) pueden reducirse mediante auditorías energéticas, reemplazo de iluminación por tecnología LED, instalación de sistemas de generación solar fotovoltaica y contratación de energía eléctrica de fuentes renovables certificadas.",
              });
            }

            if (s3Total > 0) {
              medidas.push({
                titulo: "Gestión de viajes y cadena de valor",
                descripcion: "Reducir emisiones de Alcance 3 mediante políticas de viajes corporativos (preferencia por videoconferencias), selección de proveedores con compromisos climáticos verificables y optimización logística para reducir el transporte de mercancías.",
              });
            }

            if (hasHFCs || hasPFCs || hasSF6) {
              medidas.push({
                titulo: "Control de emisiones fugitivas de gases fluorados",
                descripcion: "Los gases refrigerantes (HFCs, PFCs) y el hexafluoruro de azufre (SF₆) tienen potenciales de calentamiento global extremadamente altos. Se recomienda implementar programas de mantenimiento preventivo de equipos de refrigeración y aire acondicionado, registro de recargas y sustitución progresiva por refrigerantes de bajo GWP.",
              });
            }

            if (estimatedPct > 50) {
              medidas.push({
                titulo: "Mejora en la calidad del dato de actividad",
                descripcion: `El ${estimatedPct}% de los registros están basados en estimaciones. Se recomienda implementar sistemas de medición directa (medidores de consumo, odómetros, contadores de energía) y exigir facturas digitales como respaldo documental para mejorar la precisión del inventario.`,
              });
            }

            if (verifiedPct < 50) {
              medidas.push({
                titulo: "Fortalecimiento de la trazabilidad y verificación",
                descripcion: `Solo el ${verifiedPct}% de los registros han sido verificados internamente. Se recomienda establecer un proceso formal de verificación periódica de los datos de actividad, designar un responsable del inventario GEI y considerar la verificación externa por un organismo acreditado conforme a ISO 14064-3.`,
              });
            }

            medidas.push({
              titulo: "Establecimiento de metas de reducción",
              descripcion: "Conforme a la ISO 14064-1 y el GHG Protocol, se recomienda establecer metas cuantificadas de reducción de emisiones alineadas con los Acuerdos de París (reducción del 45% al 2030 respecto al año base), con seguimiento anual mediante este inventario.",
            });

            return (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 page-break">
                <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">
                  {summaries.length + 10}. Medidas de Reducción de Emisiones
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Las siguientes medidas han sido identificadas en base al perfil de emisiones de <strong>{company?.name}</strong> para el período {years[0]}–{years[years.length - 1]}, conforme a las mejores prácticas del GHG Protocol e ISO 14064-1.
                </p>
                <div className="space-y-3">
                  {medidas.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-xs font-bold text-green-700 mb-1">{i + 1}. {m.titulo}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{m.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* DECLARACIÓN + SELLO */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden page-break">
            <div className="p-6">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">Declaración de Conformidad</h2>
              <p className="text-sm text-gray-600 mb-6">
                El presente inventario ha sido elaborado conforme a los principios y requisitos de la norma <strong>ISO 14064-1:2018</strong> y el <strong>GHG Protocol Corporate Standard</strong>, aplicando los principios de relevancia, integridad, consistencia, transparencia y exactitud.
              </p>
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div className="text-center">
                  <div className="border-t-2 border-gray-300 pt-4 mt-16">
                    <p className="text-sm font-bold text-gray-800">Responsable del Inventario</p>
                    <p className="text-xs text-gray-500 mt-1">{company?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{preparedDate}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-gray-300 pt-4 mt-16">
                    <p className="text-sm font-bold text-gray-800">Verificador Acreditado</p>
                    <p className="text-xs text-gray-500 mt-1">Pendiente de designación</p>
                    <p className="text-xs text-gray-400 mt-0.5">Conforme a ISO 14064-3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sello digital */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src="/logo.png" alt="CarboMetrics" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">CarboMetrics</p>
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-xs font-semibold">Procesado digitalmente</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Sistema de Gestión de Emisiones GEI · ISO 14064-1:2018</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generado el {preparedDate} · Ref: <span className="font-mono font-semibold">{reportId}</span>
                    </p>
                  </div>
                </div>
                {/* QR decorativo */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-xl p-1.5 grid grid-cols-7 gap-px">
                    {Array.from({ length: 49 }).map((_, i) => {
                      const corner = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48].includes(i);
                      const center = [16,17,18,22,24,30,31,32].includes(i);
                      const data   = [8,10,15,19,23,25,29,33,37,38,40].includes(i);
                      return (
                        <div key={i} className={`rounded-sm ${corner || center || data ? "bg-gray-800" : "bg-transparent"}`} />
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{reportId}</p>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}