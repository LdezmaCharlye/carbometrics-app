export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-green-600 rounded-t-2xl px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-lg">CarboMetrics</p>
            <p className="text-green-200 text-sm">por Carbométrica</p>
          </div>
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
            Vigente desde junio 2026
          </span>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-b-2xl border border-gray-200 px-8 py-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Términos y condiciones de uso</h1>
            <p className="text-xs text-gray-400">Solo necesitas aceptarlos una vez al ingresar por primera vez.</p>
          </div>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">Bienvenido a CarboMetrics</h2>
            <p>CarboMetrics es una herramienta desarrollada por <strong>Carbométrica</strong>, empresa especialista en medición de huella de carbono. Está diseñada para que tu organización mida, registre y reporte sus emisiones de gases de efecto invernadero (GEI) de forma simple, ordenada y alineada a estándares internacionales como <strong>ISO 14064-1:2018</strong> y el <strong>GHG Protocol Corporate Standard</strong>. Nos comprometemos a ofrecerte una herramienta confiable, segura y en constante mejora.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">1. El servicio</h2>
            <p>CarboMetrics te permite registrar datos de actividad, calcular emisiones automáticamente y generar reportes GEI de referencia. Los reportes son documentos de gestión interna — cuando necesites verificación oficial de tercera parte, debe realizarla un verificador acreditado conforme a ISO 14064-3. El acceso es gestionado por Carbométrica y las credenciales son personales e intransferibles.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">2. Tus datos son tuyos</h2>
            <p>La información que ingresas en CarboMetrics es tuya. Carbométrica no la vende ni comparte con terceros. La exactitud de los reportes depende de los datos que registres — nosotros nos encargamos de los cálculos. Te recomendamos conservar copias propias de tus facturas y evidencias como respaldo independiente.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">3. Seguridad y continuidad</h2>
            <p>Implementamos acceso cifrado, autenticación segura y respaldos periódicos. Pueden ocurrir interrupciones breves por mantenimiento o causas externas. En caso de cualquier incidente, te notificamos de inmediato y trabajamos para resolverlo lo antes posible.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">4. Mejoras continuas</h2>
            <p>CarboMetrics se actualiza regularmente con nuevas funcionalidades y factores de emisión actualizados (IPCC, DEFRA, EPA). Te avisaremos con anticipación sobre cualquier cambio importante que afecte tu uso del servicio.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">5. Condiciones de uso</h2>
            <p>El acceso a CarboMetrics es exclusivo para la gestión de emisiones GEI de tu organización y no puede cederse a terceros sin autorización de Carbométrica.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">6. Pagos y planes</h2>
            <p>Los detalles de tu plan y condiciones de renovación se acuerdan directamente con Carbométrica. Ante cualquier cambio comercial, te notificaremos con al menos 30 días de anticipación.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-1">7. Aspectos legales</h2>
            <p>Carbométrica actúa como proveedor de la herramienta. Las decisiones que tu organización tome en base a los reportes son de tu responsabilidad. Estos términos se rigen por las leyes de Bolivia, con jurisdicción en Cochabamba.</p>
          </section>

          <section className="border-t border-gray-100 pt-4">
            <h2 className="font-semibold text-gray-800 mb-1">¿Tienes preguntas?</h2>
            <p>Escríbenos a <a href="mailto:carbometrica@gmail.com" className="text-green-600 hover:underline">carbometrica@gmail.com</a> — estamos para ayudarte.</p>
          </section>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          CarboMetrics © {new Date().getFullYear()} · ISO 14064-1:2018
        </p>
      </div>
    </main>
  );
}