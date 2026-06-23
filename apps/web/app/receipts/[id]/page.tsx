"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const PLAN_LABELS: Record<string,string> = {
  BASIC:"Plan Básico", STANDARD:"Plan Standard", ENTERPRISE:"Plan Corporativo",
};
const METHOD_LABELS: Record<string,string> = {
  TRANSFER:"Transferencia bancaria", QR_BOLIVIA:"QR Bolivia (BCB)",
  STRIPE:"Stripe (tarjeta)", CASH:"Efectivo",
};
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [sale,    setSale]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [saleId,  setSaleId]  = useState("");

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() ?? "";
    setSaleId(id);
    const token = localStorage.getItem("token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setSale(d); })
      .catch(() => setError("No se pudo cargar el recibo"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",color:"#6b7280",fontSize:"14px"}}>
      Cargando recibo...
    </div>
  );
  if (error || !sale) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",color:"#dc2626",fontSize:"14px"}}>
      Recibo no encontrado
    </div>
  );

  const receiptUrl = `https://carbometrics.site/receipts/${sale.id}`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          @page { size: letter; margin: 1.5cm; }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      <div className="no-print" style={{background:"#f9fafb",padding:"12px 24px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={() => window.history.back()}
          style={{fontSize:"13px",color:"#6b7280",background:"white",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"7px 14px",cursor:"pointer"}}>
          ← Volver al panel
        </button>
        <button onClick={() => window.print()}
          style={{fontSize:"13px",fontWeight:600,color:"white",background:"#16a34a",border:"none",borderRadius:"8px",padding:"7px 16px",cursor:"pointer"}}>
          ⬇ Descargar / Imprimir PDF
        </button>
      </div>

      <div style={{background:"#f3f4f6",minHeight:"calc(100vh - 49px)",padding:"32px 16px",display:"flex",justifyContent:"center"}}>
        <div style={{background:"white",borderRadius:"16px",border:"1px solid #e5e7eb",width:"100%",maxWidth:"700px",padding:"44px 52px"}}>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"28px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
                <rect width="60" height="60" rx="13" fill="#22c55e"/>
                <path d="M30 48C22 44 14 37 14 27C14 19 21 13 30 13C39 13 46 19 46 27C46 35 40 40 36 43" fill="none"/>
                <path d="M38 15C38 15 44 21 42 31C40 39 33 44 28 47C24 44 18 40 16 33C14 26 17 19 22 16C22 16 26 24 30 27C34 30 38 15 38 15Z" fill="white"/>
                <path d="M30 27C30 27 28 33 26 37C24 41 22 44 22 44C22 44 20 39 21 34C22 29 26 25 30 27Z" fill="#16a34a" opacity="0.5"/>
              </svg>
              <div>
                <div style={{fontSize:"26px",fontWeight:300,color:"#3d3d3d",letterSpacing:"-0.3px"}}>CarboMétrica</div>
                <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"1px",fontStyle:"italic"}}>Expertos en medición de Huella de Carbono.</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"22px",fontWeight:700,color:"#111827"}}>Recibo de pago</div>
              <div style={{fontSize:"14px",color:"#6b7280",marginTop:"2px"}}>Nº {sale.number}</div>
              <div style={{
                display:"inline-block",marginTop:"6px",fontSize:"12px",fontWeight:600,padding:"3px 14px",borderRadius:"999px",
                background: sale.status==="PAID" ? "#dcfce7" : sale.status==="OVERDUE" ? "#fee2e2" : "#fef9c3",
                color:      sale.status==="PAID" ? "#166534" : sale.status==="OVERDUE" ? "#991b1b" : "#854d0e",
              }}>
                {sale.status==="PAID" ? "Pagado" : sale.status==="OVERDUE" ? "Vencido" : "Pendiente"}
              </div>
            </div>
          </div>

          <hr style={{border:"none",borderTop:"1px solid #f3f4f6",marginBottom:"24px"}} />

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"40px",marginBottom:"24px"}}>
            <div>
              <div style={{fontSize:"12px",color:"#9ca3af",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Emisor</div>
              <div style={{fontSize:"15px",fontWeight:700,color:"#111827"}}>CarboMétrica</div>
              <div style={{fontSize:"13px",color:"#6b7280",marginTop:"3px"}}>NIT 4502198023</div>
              <div style={{fontSize:"13px",color:"#6b7280"}}>Cochabamba, Bolivia</div>
              <div style={{fontSize:"13px",color:"#16a34a",marginTop:"3px"}}>carbometrica@gmail.com</div>
            </div>
            <div>
              <div style={{fontSize:"12px",color:"#9ca3af",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Cliente</div>
              <div style={{fontSize:"15px",fontWeight:700,color:"#111827"}}>{sale.companyName}</div>
              <div style={{fontSize:"13px",color:"#6b7280",marginTop:"3px"}}>NIT {sale.companyTaxId}</div>
              <div style={{fontSize:"13px",color:"#6b7280"}}>{PLAN_LABELS[sale.plan] ?? sale.plan}</div>
              {sale.clientEmail && <div style={{fontSize:"13px",color:"#16a34a",marginTop:"3px"}}>{sale.clientEmail}</div>}
            </div>
          </div>

          <hr style={{border:"none",borderTop:"1px solid #f3f4f6",marginBottom:"16px"}} />

          <div style={{fontSize:"14px",color:"#374151",marginBottom:"16px",display:"flex",gap:"24px"}}>
            <span>Fecha de emisión <strong>{new Date(sale.createdAt).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"})}</strong></span>
            {sale.dueDate && <span style={{color:"#9ca3af",fontSize:"13px"}}>Vence {new Date(sale.dueDate).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"})}</span>}
          </div>

          <hr style={{border:"none",borderTop:"1px solid #f3f4f6",marginBottom:"0"}} />

          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"32px"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #f3f4f6"}}>
                <th style={{textAlign:"left",padding:"12px 0",fontSize:"13px",fontWeight:500,color:"#9ca3af"}}>Concepto</th>
                <th style={{textAlign:"right",padding:"12px 8px",fontSize:"13px",fontWeight:500,color:"#9ca3af",width:"60px"}}>Cant.</th>
                <th style={{textAlign:"right",padding:"12px 8px",fontSize:"13px",fontWeight:500,color:"#9ca3af",width:"80px"}}>Precio</th>
                <th style={{textAlign:"right",padding:"12px 0",fontSize:"13px",fontWeight:500,color:"#9ca3af",width:"80px"}}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:"1px solid #f9fafb"}}>
                <td style={{padding:"14px 0"}}>
                  <div style={{fontSize:"14px",fontWeight:600,color:"#111827"}}>
                    {PLAN_LABELS[sale.plan]} — licencia {MONTHS[sale.periodMonth-1]} {sale.periodYear}
                  </div>
                  <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"2px"}}>
                    {sale.plan==="BASIC" && "1 usuario · 1 instalación · 2 fuentes"}
                    {sale.plan==="STANDARD" && "5 usuarios · 5 instalaciones · 5 fuentes"}
                    {sale.plan==="ENTERPRISE" && "10 usuarios · 10 instalaciones · 7 fuentes"}
                  </div>
                </td>
                <td style={{textAlign:"right",padding:"14px 8px",fontSize:"14px",color:"#374151"}}>1</td>
                <td style={{textAlign:"right",padding:"14px 8px",fontSize:"14px",color:"#374151"}}>{sale.baseAmountUSD.toFixed(2)}</td>
                <td style={{textAlign:"right",padding:"14px 0",fontSize:"14px",fontWeight:600,color:"#111827"}}>{sale.baseAmountUSD.toFixed(2)}</td>
              </tr>
              {sale.extraUsers > 0 && (
                <tr style={{borderBottom:"1px solid #f9fafb"}}>
                  <td style={{padding:"12px 0",fontSize:"14px",color:"#374151"}}>Adicional — usuario extra</td>
                  <td style={{textAlign:"right",padding:"12px 8px",fontSize:"14px",color:"#374151"}}>{sale.extraUsers}</td>
                  <td style={{textAlign:"right",padding:"12px 8px",fontSize:"14px",color:"#374151"}}>15.00</td>
                  <td style={{textAlign:"right",padding:"12px 0",fontSize:"14px",fontWeight:600,color:"#111827"}}>{(sale.extraUsers*15).toFixed(2)}</td>
                </tr>
              )}
              {sale.extraYears > 0 && (
                <tr style={{borderBottom:"1px solid #f9fafb"}}>
                  <td style={{padding:"12px 0",fontSize:"14px",color:"#374151"}}>Adicional — años extra de histórico</td>
                  <td style={{textAlign:"right",padding:"12px 8px",fontSize:"14px",color:"#374151"}}>{sale.extraYears}</td>
                  <td style={{textAlign:"right",padding:"12px 8px",fontSize:"14px",color:"#374151"}}>20.00</td>
                  <td style={{textAlign:"right",padding:"12px 0",fontSize:"14px",fontWeight:600,color:"#111827"}}>{(sale.extraYears*20).toFixed(2)}</td>
                </tr>
              )}
              {sale.extraSources > 0 && (
                <tr style={{borderBottom:"1px solid #f9fafb"}}>
                  <td style={{padding:"12px 0",fontSize:"14px",color:"#374151"}}>Adicional — fuente de emisión extra</td>
                  <td style={{textAlign:"right",padding:"12px 8px",fontSize:"14px",color:"#374151"}}>{sale.extraSources}</td>
                  <td style={{textAlign:"right",padding:"12px 8px",fontSize:"14px",color:"#374151"}}>15.00</td>
                  <td style={{textAlign:"right",padding:"12px 0",fontSize:"14px",fontWeight:600,color:"#111827"}}>{(sale.extraSources*15).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"40px",alignItems:"flex-end"}}>
            <div style={{textAlign:"center"}}>
              <QRCodeSVG value={receiptUrl} size={120} />
              <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"6px"}}>Recibo electrónico</div>
            </div>
            <div style={{marginLeft:"auto",minWidth:"220px"}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:"13px",color:"#6b7280"}}>
                <span>Subtotal</span><span>$ {sale.subtotalUSD.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:"13px",color:"#6b7280",borderBottom:"1px solid #f3f4f6"}}>
                <span>IVA ({sale.ivaPercent}%)</span><span>$ {sale.ivaUSD.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0",fontSize:"22px",fontWeight:700,color:"#111827"}}>
                <span>Total</span><span>$ {sale.totalUSD.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{background:"#f9fafb",borderRadius:"10px",padding:"12px 16px",margin:"24px 0 20px",fontSize:"13px",color:"#6b7280"}}>
            <strong style={{color:"#374151"}}>Método de pago: </strong>{METHOD_LABELS[sale.method] ?? sale.method}
            {sale.method === "TRANSFER" && (
              <div style={{marginTop:"4px",fontSize:"12px"}}>
                Banco BNB · Cuenta: 1000234567 · A nombre de: Carbométrica · <strong>Ref: {sale.number}</strong>
              </div>
            )}
          </div>

          <hr style={{border:"none",borderTop:"1px solid #f3f4f6",marginBottom:"16px"}} />

          <div style={{textAlign:"center",fontSize:"12px",color:"#9ca3af"}}>
            Este recibo es un comprobante interno de pago emitido por Carbométrica.<br/>
            carbometrica@gmail.com · Cochabamba, Bolivia
          </div>

        </div>
      </div>
    </>
  );
}