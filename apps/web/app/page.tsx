import Link from "next/link";

export default function Home() {
  return (
    <main style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh", 
      fontFamily: "sans-serif",
      backgroundColor: "#f9fafb",
      color: "#1f2937",
      padding: "2rem",
      textAlign: "center"
    }}>
      
      {/* Tu logo o nombre */}
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#00b04f" }}>
        CarboMetrics
      </h1>
      
      {/* Tu frase de bienvenida */}
      <p style={{ fontSize: "1.25rem", color: "#4b5563", maxWidth: "600px", marginBottom: "2rem" }}>
        Te ayudamos a medir, gestionar y reportar tus emisiones de carbono y tu consumo de agua.
      </p>

      {/* El botón para que tú o tus clientes puedan entrar al login antiguo */}
      <Link href="/login" style={{
        backgroundColor: "#00b04f",
        color: "white",
        padding: "0.75rem 1.5rem",
        borderRadius: "0.375rem",
        fontWeight: "bold",
        textDecoration: "none"
      }}>
        Ingresar al Sistema
      </Link>
      
    </main>
  );
}