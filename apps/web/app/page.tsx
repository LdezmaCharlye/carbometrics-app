"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        :root {
          --g: #2db84b; --g-dark: #1a8f35; --g-light: #e8f8ed; --g-pale: #f3fdf6;
          --b: #2589e8; --b-dark: #176bc2; --b-light: #e8f3fd; --b-pale: #f3f9fe;
          --black: #1c1c1c; --white: #fff; --gray: #f7f7f7; --muted: #6b7280; --border: #e5e7eb;
          --max: 1140px; --r: 8px; --sans: 'Inter', system-ui, sans-serif;
        }
        
        .landing-wrapper {
          font-family: var(--sans);
          background: var(--white);
          color: var(--black);
          overflow-x: hidden;
          line-height: 1.6;
        }

        /* ── NAV ── */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 5%; background: rgba(255,255,255,.97); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); transition: box-shadow .3s; }
        .nav.scrolled { box-shadow: 0 2px 20px rgba(0,0,0,.07); }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-name { font-size: 17px; font-weight: 800; color: var(--black); letter-spacing: -.4px; }
        .logo-name span { color: var(--g); }
        .nav-links { display: flex; gap: 2px; list-style: none; }
        .nav-links a { font-size: 13.5px; font-weight: 500; color: var(--muted); text-decoration: none; padding: 7px 13px; border-radius: 6px; transition: all .18s; }
        .nav-links a:hover { color: var(--black); background: var(--g-pale); }
        .nav-actions { display: flex; gap: 8px; align-items: center; }
        
        .btn-login { font-size: 13.5px; font-weight: 700; color: var(--white) !important; background: var(--g); padding: 9px 22px; border-radius: var(--r); text-decoration: none; border: none; transition: background .18s; cursor: pointer; display: inline-block; }
        .btn-login:hover { background: var(--g-dark); }
        .btn-login-blue { font-size: 13.5px; font-weight: 700; color: var(--white) !important; background: var(--b); padding: 9px 22px; border-radius: var(--r); text-decoration: none; border: none; transition: background .18s; cursor: pointer; display: inline-block; }
        .btn-login-blue:hover { background: var(--b-dark); }
        
        /* hamburger */
        .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; width: 36px; height: 36px; justify-content: center; }
        .hamburger span { display: block; height: 2px; width: 22px; background: var(--black); border-radius: 2px; transition: all .25s; }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        
        .mob-menu { display: none; position: fixed; top: 64px; left: 0; right: 0; z-index: 199; background: rgba(255,255,255,.98); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); flex-direction: column; padding: 14px 5% 22px; gap: 4px; }
        .mob-menu.open { display: flex; }
        .mob-menu a { font-size: 15px; font-weight: 500; color: var(--black); text-decoration: none; padding: 11px 14px; border-radius: 8px; }
        .mob-menu a:hover { background: var(--g-pale); }
        .mob-div { height: 1px; background: var(--border); margin: 8px 0; }
        .mob-btns { display: flex; flex-direction: column; gap: 8px; }
        .mob-btns .btn-login, .mob-btns .btn-login-blue { text-align: center; padding: 12px; display: block; border-radius: var(--r); font-size: 14px; }
        
        @media(max-width:860px){ .nav-links { display: none; } .nav-actions { display: none; } .hamburger { display: flex; } }

        /* ── HERO ── */
        .hero { padding: 96px 5% 64px; min-height: 100vh; display: flex; align-items: center; background: var(--white); }
        .hero-inner { max-width: var(--max); margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; width: 100%; }
        .hero-chip { display: inline-flex; align-items: center; gap: 8px; background: var(--g-light); border: 1px solid rgba(45,184,75,.3); border-radius: 100px; padding: 6px 14px 6px 8px; margin-bottom: 22px; }
        .chip-dot { width: 20px; height: 20px; background: var(--g); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .hero-chip span { font-size: 11px; font-weight: 700; color: var(--g-dark); letter-spacing: .05em; text-transform: uppercase; }
        .hero h1 { font-size: clamp(32px, 4vw, 54px); font-weight: 800; color: var(--black); line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 10px; }
        .hero h2 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 700; color: var(--g); margin-bottom: 18px; letter-spacing: -.5px; }
        .hero-desc { font-size: 15px; color: var(--muted); line-height: 1.75; max-width: 460px; margin-bottom: 32px; }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
        
        .btn-primary { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--white) !important; background: var(--g); padding: 14px 28px; border-radius: var(--r); text-decoration: none; transition: all .2s; border: none; cursor: pointer; }
        .btn-primary:hover { background: var(--g-dark); transform: translateY(-1px); }
        
        .hero-img-wrap { display: flex; align-items: center; justify-content: center; }
        .hero-img { width: 100%; max-width: 440px; font-size: 120px; text-align: center; animation: float 5s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @media(max-width:860px){ .hero-inner { grid-template-columns: 1fr; } .hero-img-wrap { display: none; } .hero { min-height: auto; padding: 90px 5% 56px; } }

        /* ── SHARED ── */
        .section { padding: 80px 5%; }
        .inner { max-width: var(--max); margin: 0 auto; }
        .center { text-align: center; }
        .sec-tag { font-size: 11px; font-weight: 700; color: var(--g); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 10px; display: block; }
        .sec-title { font-size: clamp(24px, 3vw, 38px); font-weight: 800; color: var(--black); line-height: 1.15; margin-bottom: 12px; letter-spacing: -.6px; }
        .sec-sub { font-size: 14px; color: var(--muted); max-width: 500px; line-height: 1.75; margin-bottom: 44px; margin-left: auto; margin-right: auto; }

        /* ── NOSOTROS ── */
        .pillars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 44px; }
        @media(max-width:700px){ .pillars-grid { grid-template-columns: 1fr; } }
        .pillar { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 28px 22px; text-align: center; transition: all .22s; }
        .pillar:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(45,184,75,.1); border-color: rgba(45,184,75,.3); }
        .pillar-icon { width: 52px; height: 52px; margin: 0 auto 14px; background: var(--g-pale); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--g-light); font-size: 24px; }
        .pillar-title { font-size: 15px; font-weight: 700; color: var(--black); margin-bottom: 8px; }
        .pillar-desc { font-size: 13px; color: var(--muted); line-height: 1.7; }

        /* ── PRODUCTOS ── */
        .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 44px; }
        @media(max-width:700px){ .products-grid { grid-template-columns: 1fr; } }
        .product-card { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 32px 28px; transition: all .22s; border-top: 4px solid var(--border); }
        .product-card.is-carbon { border-top-color: var(--g); }
        .product-card.is-water { border-top-color: var(--b); }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,.08); }
        .product-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; font-size: 28px; }
        .product-card.is-carbon .product-icon { background: var(--g-pale); border: 2px solid var(--g-light); }
        .product-card.is-water .product-icon { background: var(--b-pale); border: 2px solid var(--b-light); }
        .product-name { font-size: 20px; font-weight: 800; letter-spacing: -.4px; margin-bottom: 4px; }
        .product-card.is-carbon .product-name span { color: var(--g); }
        .product-card.is-water .product-name span { color: var(--b); }
        .product-tag { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; display: block; }
        .product-desc { font-size: 13.5px; color: var(--muted); line-height: 1.75; margin-bottom: 18px; }
        .product-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .product-badge { font-size: 11px; border-radius: 4px; padding: 4px 10px; font-weight: 600; }
        .product-card.is-carbon .product-badge { background: var(--g-pale); color: var(--g-dark); }
        .product-card.is-water .product-badge { background: var(--b-pale); color: var(--b-dark); }
        .btn-product { display: inline-flex; align-items: center; font-size: 13.5px; font-weight: 700; color: var(--white) !important; padding: 11px 22px; border-radius: var(--r); text-decoration: none; transition: all .2s; border: none; }
        .product-card.is-carbon .btn-product { background: var(--g); }
        .product-card.is-carbon .btn-product:hover { background: var(--g-dark); }
        .product-card.is-water .btn-product { background: var(--b); }
        .product-card.is-water .btn-product:hover { background: var(--b-dark); }

        /* ── NORMAS ── */
        .normas { background: var(--black); padding: 72px 5%; }
        .normas-inner { max-width: var(--max); margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
        @media(max-width:700px){ .normas-inner { grid-template-columns: 1fr; } }
        .normas .sec-tag { color: var(--g); }
        .normas .sec-title { color: #fff; }
        .normas .sec-sub { color: rgba(255,255,255,.45); margin-bottom: 28px; }
        .normas-right { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .norma-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 20px; transition: all .2s; }
        .norma-card:hover { background: rgba(255,255,255,.07); border-color: rgba(45,184,75,.3); }
        .norma-card.is-water:hover { border-color: rgba(37,137,232,.4); }
        .norma-num { font-size: 32px; font-weight: 800; color: var(--g); line-height: 1; margin-bottom: 8px; }
        .norma-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.8); margin-bottom: 5px; }
        .norma-desc { font-size: 12px; color: rgba(255,255,255,.38); line-height: 1.65; }

        /* ── PLANES ── */
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 44px; align-items: start; }
        @media(max-width:800px){ .plans-grid { grid-template-columns: 1fr; } }
        .plan { border: 1.5px solid var(--border); border-radius: 12px; padding: 28px; background: var(--white); transition: all .2s; position: relative; }
        .plan:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(45,184,75,.09); }
        .plan.featured { background: var(--black); border-color: var(--black); }
        .plan-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: var(--g); color: var(--white); font-size: 10px; font-weight: 700; padding: 3px 14px; border-radius: 100px; white-space: nowrap; letter-spacing: .06em; text-transform: uppercase; }
        .plan-name { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 10px; }
        .plan.featured .plan-name { color: rgba(255,255,255,.4); }
        .plan-price { font-size: 46px; font-weight: 800; color: var(--black); line-height: 1; margin-bottom: 2px; letter-spacing: -2px; }
        .plan.featured .plan-price { color: var(--g); }
        .plan-period { font-size: 12px; color: var(--muted); margin-bottom: 18px; }
        .plan.featured .plan-period { color: rgba(255,255,255,.3); }
        .plan-line { height: 1px; background: var(--border); margin: 16px 0; }
        .plan.featured .plan-line { background: rgba(255,255,255,.08); }
        .plan-features { list-style: none; margin-bottom: 24px; display: flex; flex-direction: column; gap: 9px; }
        .plan-features li { font-size: 13px; color: var(--black); display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .plan.featured .plan-features li { color: rgba(255,255,255,.65); }
        .btn-plan { display: block; width: 100%; text-align: center; text-decoration: none; padding: 12px; border-radius: var(--r); font-size: 14px; font-weight: 700; border: 1.5px solid var(--g); color: var(--g); background: transparent; cursor: pointer; transition: all .2s; }
        .btn-plan:hover { background: var(--g); color: var(--white) !important; }
        .plan.featured .btn-plan { background: var(--g); color: var(--white) !important; border-color: var(--g); }
        .plan.featured .btn-plan:hover { background: var(--white); color: var(--black) !important; border-color: var(--white); }

        /* ── CONTACTO ── */
        .contact-inner { max-width: var(--max); margin: 0 auto; display: grid; grid-template-columns: 1fr 1.1fr; gap: 56px; align-items: start; }
        @media(max-width:800px){ .contact-inner { grid-template-columns: 1fr; } }
        .contact-form { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 26px; }
        .form-group { margin-bottom: 13px; }
        .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--black); margin-bottom: 5px; }
        .form-group input, .form-group textarea { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 13.5px; background: var(--white); color: var(--black); outline: none; }
        .form-group textarea { resize: vertical; min-height: 85px; }
        .btn-submit { width: 100%; padding: 13px; background: var(--g); color: var(--white); border: none; border-radius: var(--r); font-size: 14px; font-weight: 700; cursor: pointer; transition: background .2s; }
        .btn-submit:hover { background: var(--g-dark); }

        /* ── CTA BAND ── */
        .cta-band { background: var(--g); padding: 72px 5%; text-align: center; }
        .cta-band h2 { font-size: clamp(22px, 3vw, 36px); font-weight: 800; color: var(--white); letter-spacing: -.5px; margin-bottom: 12px; }
        .cta-band p { font-size: 15px; color: rgba(255,255,255,.8); margin-bottom: 28px; max-width: 440px; margin-left: auto; margin-right: auto; }
        .btn-white { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--g); background: var(--white); padding: 13px 28px; border-radius: var(--r); text-decoration: none; transition: all .2s; border: 2px solid var(--white); }
        .btn-white:hover { background: transparent; color: var(--white) !important; }

        /* ── FOOTER ── */
        footer { background: var(--black); padding: 44px 5% 26px; border-top: 1px solid rgba(255,255,255,.06); }
        .footer-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; flex-wrap: wrap; padding-bottom: 28px; margin-bottom: 20px; }
        .footer-logo { font-size: 17px; font-weight: 800; color: var(--white); letter-spacing: -.3px; margin-bottom: 7px; }
        .footer-logo span { color: var(--g); }
        .footer-brand p { font-size: 12px; color: rgba(255,255,255,.28); max-width: 210px; line-height: 1.6; }
        .footer-bot { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .footer-copy { font-size: 11px; color: rgba(255,255,255,.18); }
      ` }} />

      <div className="landing-wrapper">
        {/* NAV */}
        <nav className={`nav ${scrolled ? "scrolled" : ""}`} id="nav">
          <a href="#inicio" className="nav-logo">
            <div className="logo-name">Carbo<span>Metrics</span></div>
          </a>
          <ul className="nav-links">
            <li><a href="#nosotros">Nosotros</a></li>
            <li><a href="#productos">Productos</a></li>
            <li><a href="#normas">Normas</a></li>
            <li><a href="#planes">Planes</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
          <div className="nav-actions">
            <Link href="/login" className="btn-login">Ingresar CarboMetrics</Link>
            <Link href="/login" className="btn-login-blue">Ingresar HydroMetrics</Link>
          </div>
          <button className={`hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>

        {/* MOBILE MENU */}
        <div className={`mob-menu ${menuOpen ? "open" : ""}`} id="mobMenu">
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</a>
          <a href="#productos" onClick={() => setMenuOpen(false)}>Productos</a>
          <a href="#normas" onClick={() => setMenuOpen(false)}>Normas</a>
          <a href="#planes" onClick={() => setMenuOpen(false)}>Planes</a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
          <div className="mob-div"></div>
          <div className="mob-btns">
            <Link href="/login" className="btn-login">Ingresar CarboMetrics</Link>
            <Link href="/login" className="btn-login-blue">Ingresar HydroMetrics</Link>
          </div>
        </div>

        {/* HERO */}
        <header className="hero" id="inicio">
          <div className="hero-inner">
            <div className="hero-left">
              <div className="hero-chip">
                <div className="chip-dot"></div>
                <span>Sostenibilidad Inteligente</span>
              </div>
              <h1>CarboMetrics &amp;<br />HydroMetrics</h1>
              <h2>Gestión de huella ambiental corporativa</h2>
              <p className="hero-desc">
                Automatiza el cálculo de tu huella de carbono e hídrica. Centraliza tus datos operativos, genera reportes de cumplimiento internacional y acelera la descarbonización de tu organización.
              </p>
              <div className="hero-btns">
                <Link href="/login" className="btn-primary">Comenzar ahora mismo →</Link>
              </div>
            </div>
            <div className="hero-img-wrap">
              <div className="hero-img">🌱</div>
            </div>
          </div>
        </header>

        {/* NOSOTROS */}
        <section className="section" id="nosotros">
          <div className="inner center">
            <span className="sec-tag">Ejes Estratégicos</span>
            <h2 className="sec-title">Nuestros Pilares</h2>
            <p className="sec-sub">Diseñados bajo metodologías rigurosas para transformar la gestión ambiental en una ventaja competitiva.</p>
            <div className="pillars-grid">
              <div className="pillar">
                <div className="pillar-icon">📊</div>
                <h3 className="pillar-title">Precisión Analítica</h3>
                <p className="pillar-desc">Cálculos exactos respaldados por algoritmos avanzados y bases de datos actualizadas con factores de emisión globales.</p>
              </div>
              <div className="pillar">
                <div className="pillar-icon">⚙️</div>
                <h3 className="pillar-title">Automatización Operativa</h3>
                <p className="pillar-desc">Reduce el trabajo manual conectando tus fuentes de datos directamente a la plataforma para un monitoreo continuo.</p>
              </div>
              <div className="pillar">
                <div className="pillar-icon">📈</div>
                <h3 className="pillar-title">Visión de Mitigación</h3>
                <p className="pillar-desc">Simula escenarios predictivos, establece metas de reducción realistas y sigue tu progreso con tableros interactivos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTOS */}
        <section className="section" id="productos">
          <div className="inner center">
            <span className="sec-tag">Módulos Especializados</span>
            <h2 className="sec-title">Ecosistema Integrado</h2>
            <p className="sec-sub">Herramientas dedicadas a los dos vectores críticos del impacto ambiental corporativo.</p>
            <div className="products-grid">
              <div className="product-card is-carbon">
                <div className="product-icon">☁️</div>
                <h3 className="product-name">Carbo<span>Metrics</span></h3>
                <span className="product-tag">Software de Huella de Carbono</span>
                <p className="product-desc">Inventarios completos de GEI estructurados por Alcance 1, 2 y 3. Convierte datos de combustible, energía y logística en toneladas de CO2 equivalente.</p>
                <div className="product-badges">
                  <span className="product-badge">Alcance 1, 2 y 3</span>
                  <span className="product-badge">Reportes GEI</span>
                </div>
                <Link href="/login" className="btn-product">Abrir CarboMetrics →</Link>
              </div>
              <div className="product-card is-water">
                <div className="product-icon">💧</div>
                <h3 className="product-name">Hydro<span>Metrics</span></h3>
                <span className="product-tag">Software de Huella Hídrica</span>
                <p className="product-desc">Mapea el consumo integral de agua en tus operaciones y cadena de suministro. Evalúa volúmenes de consumo, escasez y vertidos por plantas.</p>
                <div className="product-badges">
                  <span className="product-badge">Balance Hídrico</span>
                  <span className="product-badge">Análisis de Estrés</span>
                </div>
                <Link href="/login" className="btn-product">Abrir HydroMetrics →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* NORMAS */}
        <section className="section normas" id="normas">
          <div className="normas-inner">
            <div>
              <span className="sec-tag">Cumplimiento Global</span>
              <h2 className="sec-title">Gobernanza bajo Estándares Internacionales</h2>
              <p className="sec-sub">Nuestra suite está configurada nativamente para alinearse con los marcos de reporte y auditoría externa más exigentes del mundo.</p>
            </div>
            <div className="normas-right">
              <div className="norma-card">
                <div className="norma-num">14064</div>
                <div className="norma-title">ISO 14064-1:2018</div>
                <p className="norma-desc">Estructuración estricta de reportes de gases de efecto invernadero para simplificar tus auditorías de certificación.</p>
              </div>
              <div className="norma-card">
                <div className="norma-num">GHG</div>
                <div className="norma-title">GHG Protocol</div>
                <p className="norma-desc">Clasificación precisa de emisiones directas e indirectas alineadas con el estándar corporativo más usado.</p>
              </div>
              <div className="norma-card is-water">
                <div className="norma-num">14046</div>
                <div className="norma-title">ISO 14046</div>
                <p className="norma-desc">Metodología de ciclo de vida para evaluar impactos potenciales relacionados con el recurso hídrico.</p>
              </div>
              <div className="norma-card is-water">
                <div className="norma-num">AWS</div>
                <div className="norma-title">Alliance for Water Stewardship</div>
                <p className="norma-desc">Principios normativos para promover el uso sostenible y responsable del agua a nivel de sitio operativo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PLANES */}
        <section className="section" id="planes">
          <div className="inner center">
            <span className="sec-tag">Tarifas</span>
            <h2 className="sec-title">Planes Disponibles</h2>
            <p className="sec-sub">Selecciona el nivel de gestión ambiental que tu organización necesita hoy.</p>
            <div className="plans-grid">
              <div className="plan">
                <div className="plan-name">Básico</div>
                <div className="plan-price">$120</div>
                <div className="plan-period">por mes / facturado anualmente</div>
                <div className="plan-line"></div>
                <ul className="plan-features">
                  <li>1 Cuenta de organización</li>
                  <li>CarboMetrics (Alcance 1 y 2)</li>
                  <li>Factores de emisión estándar</li>
                  <li>Soporte por correo electrónico</li>
                </ul>
                <Link href="/login" className="btn-plan">Seleccionar Plan</Link>
              </div>
              <div className="plan featured">
                <div className="plan-badge">Recomendado</div>
                <div className="plan-name">Profesional</div>
                <div className="plan-price">$350</div>
                <div className="plan-period">por mes / facturado anualmente</div>
                <div className="plan-line"></div>
                <ul className="plan-features">
                  <li>Cuentas multi-sucursal (hasta 5)</li>
                  <li>CarboMetrics (Alcances 1, 2 y 3)</li>
                  <li>HydroMetrics integrado</li>
                  <li>Reportes listos para auditorías</li>
                  <li>Soporte prioritario 24/7</li>
                </ul>
                <Link href="/login" className="btn-plan">Seleccionar Plan</Link>
              </div>
              <div className="plan">
                <div className="plan-name">Corporativo</div>
                <div className="plan-price">Custom</div>
                <div className="plan-period">Contrato a medida</div>
                <div className="plan-line"></div>
                <ul className="plan-features">
                  <li>Sucursales e instalaciones ilimitadas</li>
                  <li>Acceso completo a la API del sistema</li>
                  <li>Factores de emisión personalizados por país</li>
                  <li>Consultor ambiental dedicado</li>
                </ul>
                <Link href="/login" className="btn-plan">Contactar Ventas</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACTO */}
        <section className="section" id="contacto">
          <div className="contact-inner">
            <div>
              <span className="sec-tag">Comunicación</span>
              <h2 className="sec-title">¿Tienes preguntas? Contáctanos</h2>
              <p className="sec-sub" style={{margin: "0 0 24px 0"}}>Estamos listos para guiarte en el proceso de implementación de CarboMetrics e HydroMetrics en tu empresa.</p>
            </div>
            <form className="contact-form" onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" placeholder="Ej. Juan Pérez" required />
              </div>
              <div className="form-group">
                <label>Correo electrónico corporativo</label>
                <input type="email" placeholder="juan@empresa.com" required />
              </div>
              <div className="form-group">
                <label>Mensaje o consulta</label>
                <textarea placeholder="Cuéntanos brevemente sobre las necesidades de tu empresa..." required></textarea>
              </div>
              <button type="submit" className="btn-submit">
                {submitted ? "¡Enviado! ✓" : "Enviar mensaje →"}
              </button>
            </form>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="cta-band">
          <h2>Automatiza tu contabilidad ambiental hoy</h2>
          <p>Únete a las empresas que lideran la transición hacia un modelo operativo sostenible y con bajas emisiones de carbono.</p>
          <Link href="/login" className="btn-white">Crear cuenta corporativa</Link>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">Carbo<span>Metrics</span></div>
              <p>Tecnología avanzada para la gestión, medición y reporte estratégico del impacto ambiental empresarial.</p>
            </div>
          </div>
          <div className="footer-bot">
            <span className="footer-copy">© 2026 CarboMetrics &amp; HydroMetrics. Todos los derechos reservados. · Cochabamba, Bolivia</span>
          </div>
        </footer>
      </div>
    </>
  );
}