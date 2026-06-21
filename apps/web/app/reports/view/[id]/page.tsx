"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Leaf, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const MONTHS_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getScopeTotal(byMonth: any[], scope: string) {
  return (byMonth ?? []).filter((r) => r.scope === scope).reduce((acc: number, r: any) => acc + Number(r.total_kg), 0) / 1000;
}

export default function PublicReportPage() {
  const params = useParams();
  const id = params?.id as string;
  const [report,  setReport]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumption/reports/public/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(true); return; }
        setReport(d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-green-600">
        <Leaf className="w-5 h-5 animate-pulse" />
        <span className="text-sm text-gray-500">Cargando reporte...</span>
      </div>
    </div>
  );

  if (error || !report) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 text-center">
      <div>
        <p className="text-lg font-bold text-gray-800">Reporte no encontrado</p>
        <p className="text-sm text-gray-500 mt-1">Este enlace ya no es válido o el reporte fue eliminado.</p>
      </div>
    </div>
  );

  const d = report.data;
  const company    = d.company;
  const years      = d.years ?? [];
  const summaries  = d.summaries ?? [];
  const logs       = d.logs ?? [];
  const removals   = d.removals ?? [];
  const reportId   = d.reportId;
  const preparedDate = d.preparedDate;
  const branchName = report.branchName;
  const baseYear   = company?.baseYear ?? years[0] ?? null;

  const publicUrl = typeof window !== "undefined" ? window.location.href : "";

  const verifiedLogs = logs.filter((l: any) => l.isVerified);
  const totalRemovals = removals.reduce((a: number, r: any) => a + Number(r.tCO2eRemovedPerYear), 0);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { size: letter portrait; margin: 12mm; }
          main { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      <header className="no-print bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Reporte público de Emisiones GEI</p>
              <p className="text-xs text-gray-400">{company?.name}{branchName ? ` · ${branchName}` : ""}</p>
            </div>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
            <Download className="w-3.5 h-3.5" />Descargar PDF
          </button>
        </div>
      </header>

      <div className="bg-gray-100 min-h-screen py-2">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

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
                <p className="text-xs font-semibold text-green-600 mt-2">{branchName ?? "Todas las instalaciones"}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
                <span>Norma: <strong className="text-gray-600">ISO 14064-1:2018</strong></span>
                <span>·</span>
                <span>Fecha: <strong className="text-gray-600">{preparedDate}</strong></span>
              </div>
              {publicUrl && (
                <div className="mt-6 flex flex-col items-center gap-1.5">
                  <div className="bg-white border border-gray-200 rounded-xl p-2">
                    <QRCodeSVG value={publicUrl} size={80} level="M" />
                  </div>
                  <p className="text-xs text-gray-400">Este es el enlace permanente de este reporte</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">Presentación</h2>
            <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
              <p>Este informe expone el inventario de gases de efecto invernadero (GEI) de <strong>{company?.name}</strong>{branchName ? ` — instalación ${branchName}` : ""}, elaborado conforme a la norma <strong>ISO 14064-1:2018</strong> y el <strong>GHG Protocol Corporate Standard</strong>.</p>
              <p>Cubre {years.length > 1 ? `las gestiones ${years.join(", ")}` : `la gestión ${years[0]}`}, con año base <strong>{baseYear ?? "no definido"}</strong>.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">Descripción de la organización</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Razón social", company?.name ?? "—"],
                ["NIT / Tax ID", company?.taxId ?? "—"],
                ["Sector / Industria", company?.industry ?? "—"],
                ["País", company?.country ?? "—"],
                ["Instalación", branchName ?? "Todas"],
                ["Año base", String(baseYear ?? "—")],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl px-3 py-1">
                  <p className="text-xs text-gray-400 leading-tight">{k}</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {summaries.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">Resumen por gestión</h2>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Gestión</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-red-400 uppercase">Alcance 1</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-amber-400 uppercase">Alcance 2</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-blue-400 uppercase">Alcance 3</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total tCO₂eq</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summaries.map((s: any) => {
                      const s1 = getScopeTotal(s.byMonth, "SCOPE_1");
                      const s2 = getScopeTotal(s.byMonth, "SCOPE_2");
                      const s3 = getScopeTotal(s.byMonth, "SCOPE_3");
                      return (
                        <tr key={s.year} className={s.year === baseYear ? "bg-green-50/60" : ""}>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {s.year}{s.year === baseYear && <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">año base</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s1.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s2.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{s3.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">{s.totalTCO2eq.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summaries.map((s: any) => {
            const chartData = MONTHS_S.map((m, i) => {
              const val = (s.byMonth ?? []).filter((r: any) => r.month === i + 1).reduce((a: number, r: any) => a + Number(r.total_kg), 0) / 1000;
              return { month: m, value: val };
            });
            return (
              <div key={s.year} className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Emisiones mensuales — Gestión {s.year}</h2>
                <p className="text-xs text-gray-400 mb-3">{s.totalRecords} registros · {s.totalTCO2eq.toFixed(2)} tCO₂eq total</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} tCO₂eq`, "Emisiones"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="value" radius={[3,3,0,0]} maxBarSize={28}>
                      {chartData.map((_, i) => <Cell key={i} fill="#22c55e" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}

          {removals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">Remociones y sumideros</h2>
              <p className="text-sm text-gray-600 mb-3">Total removido: <strong>{totalRemovals.toFixed(2)} tCO₂eq/año</strong> en {removals.length} proyecto(s).</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider">Trazabilidad</h2>
            <p className="text-sm text-gray-600">
              <strong>{verifiedLogs.length}</strong> de <strong>{logs.length}</strong> registros verificados ({logs.length > 0 ? Math.round((verifiedLogs.length / logs.length) * 100) : 0}%).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
              <p className="text-sm font-bold text-gray-900">CarboMetrics</p>
              <p className="text-xs text-gray-400 mt-0.5">Generado el {preparedDate} · Ref: <span className="font-mono font-semibold">{reportId}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Última actualización: {new Date(report.generatedAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}