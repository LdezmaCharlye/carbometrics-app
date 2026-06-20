"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Nav scroll shadow
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 30);
    window.addEventListener("scroll", onScroll);

    // Hamburger / mobile menu
    const hamburger = document.getElementById("hamburger");
    const mobMenu = document.getElementById("mobMenu");
    const onHamburgerClick = () => {
      hamburger?.classList.toggle("open");
      mobMenu?.classList.toggle("open");
    };
    hamburger?.addEventListener("click", onHamburgerClick);
    const mobLinks = mobMenu ? Array.from(mobMenu.querySelectorAll("a")) : [];
    const onMobLinkClick = () => {
      hamburger?.classList.remove("open");
      mobMenu?.classList.remove("open");
    };
    mobLinks.forEach((a) => a.addEventListener("click", onMobLinkClick));

    // FAQ accordion
    const faqBtns = Array.from(document.querySelectorAll(".faq-btn"));
    const onFaqClick = (e) => {
      const btn = e.currentTarget;
      const item = btn.parentElement;
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    };
    faqBtns.forEach((btn) => btn.addEventListener("click", onFaqClick));

    // Contact form submit button feedback
    const submitBtn = document.getElementById("submitBtn");
    const onSubmitClick = async function () {
      const name = document.getElementById("ctcName")?.value || "";
      const email = document.getElementById("ctcEmail")?.value || "";
      const company = document.getElementById("ctcCompany")?.value || "";
      const product = document.getElementById("ctcProduct")?.value || "";
      const plan = document.getElementById("ctcPlan")?.value || "";
      const message = document.getElementById("ctcMessage")?.value || "";
      if (!name || !email || !message) {
        alert("Por favor completa al menos nombre, email y mensaje.");
        return;
      }
      this.disabled = true;
      this.textContent = "Enviando...";
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: "6ac231df-7674-4e76-828a-c154f6873286",
            subject: `Nuevo contacto de ${name} - CarboMetrics`,
            name,
            email,
            empresa: company,
            producto_interes: product,
            plan_interes: plan,
            message,
          }),
        });
        const data = await res.json();
        if (data.success) {
          this.textContent = "\u00a1Enviado! \u2713";
          this.style.background = "#145f25";
        } else {
          this.textContent = "Error, intenta de nuevo";
        }
      } catch {
        this.textContent = "Error, intenta de nuevo";
      }
      setTimeout(() => {
        this.textContent = "Enviar mensaje \u2192";
        this.style.background = "";
        this.disabled = false;
      }, 3000);
    };
    submitBtn?.addEventListener("click", onSubmitClick);

    // Scroll reveal animations
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".rv").forEach((el) => obs.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      hamburger?.removeEventListener("click", onHamburgerClick);
      mobLinks.forEach((a) => a.removeEventListener("click", onMobLinkClick));
      faqBtns.forEach((btn) => btn.removeEventListener("click", onFaqClick));
      submitBtn?.removeEventListener("click", onSubmitClick);
      obs.disconnect();
    };
  }, []);

  const handleHydroClick = () => {
    alert("HydroMetrics estar\u00e1 disponible pr\u00f3ximamente. \u00a1Vuelve pronto para iniciar sesi\u00f3n aqu\u00ed!");
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
:root{
  --g:#2db84b;--g-dark:#1a8f35;--g-light:#e8f8ed;--g-pale:#f3fdf6;
  --b:#2589e8;--b-dark:#176bc2;--b-light:#e8f3fd;--b-pale:#f3f9fe;
  --black:#1c1c1c;--white:#fff;--gray:#f7f7f7;--muted:#6b7280;--border:#e5e7eb;
  --max:1140px;--r:8px;--sans:'Inter',system-ui,sans-serif;
}
body{font-family:var(--sans);background:var(--white);color:var(--black);overflow-x:hidden;line-height:1.6}

/* ── NAV ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);transition:box-shadow .3s}
.nav.scrolled{box-shadow:0 2px 20px rgba(0,0,0,.07)}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.logo-name{font-size:17px;font-weight:800;color:var(--black);letter-spacing:-.4px}
.logo-name span{color:var(--g)}
.nav-links{display:flex;gap:2px;list-style:none}
.nav-links a{font-size:13.5px;font-weight:500;color:var(--muted);text-decoration:none;padding:7px 13px;border-radius:6px;transition:all .18s}
.nav-links a:hover{color:var(--black);background:var(--g-pale)}
.nav-actions{display:flex;gap:8px;align-items:center}
.btn-login{font-size:13.5px;font-weight:700;color:var(--white);background:var(--g);padding:9px 22px;border-radius:var(--r);text-decoration:none;border:none;transition:background .18s;cursor:pointer;display:inline-block}
.btn-login:hover{background:var(--g-dark)}
.btn-login-blue{font-family:inherit;font-size:13.5px;font-weight:700;color:var(--white);background:var(--b);padding:9px 22px;border-radius:var(--r);text-decoration:none;border:none;transition:background .18s;cursor:pointer;display:inline-block}
.btn-login-blue:hover{background:var(--b-dark)}
.btn-trial{font-size:13.5px;font-weight:700;color:var(--white);background:var(--g-dark);padding:9px 22px;border-radius:var(--r);text-decoration:none;transition:background .18s}
.btn-trial:hover{background:#145f25}

/* hamburger */
.hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px;width:36px;height:36px;justify-content:center}
.hamburger span{display:block;height:2px;width:22px;background:var(--black);border-radius:2px;transition:all .25s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.mob-menu{display:none;position:fixed;top:64px;left:0;right:0;z-index:199;background:rgba(255,255,255,.98);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);flex-direction:column;padding:14px 5% 22px;gap:4px}
.mob-menu.open{display:flex}
.mob-menu a{font-size:15px;font-weight:500;color:var(--black);text-decoration:none;padding:11px 14px;border-radius:8px}
.mob-menu a:hover{background:var(--g-pale)}
.mob-div{height:1px;background:var(--border);margin:8px 0}
.mob-btns{display:flex;flex-direction:column;gap:8px}
.mob-btns .btn-login,.mob-btns .btn-login-blue,.mob-btns .btn-trial{text-align:center;padding:12px;display:block;border-radius:var(--r);font-size:14px}
@media(max-width:860px){.nav-links{display:none}.nav-actions{display:none}.hamburger{display:flex}}

/* ── HERO ── */
.hero{padding:96px 5% 64px;min-height:100vh;display:flex;align-items:center;background:var(--white)}
.hero-inner{max-width:var(--max);margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;width:100%}
.hero-chip{display:inline-flex;align-items:center;gap:8px;background:var(--g-light);border:1px solid rgba(45,184,75,.3);border-radius:100px;padding:6px 14px 6px 8px;margin-bottom:22px}
.chip-dot{width:20px;height:20px;background:var(--g);border-radius:50%;display:flex;align-items:center;justify-content:center}
.chip-dot svg{width:10px;height:10px}
.hero-chip span{font-size:11px;font-weight:700;color:var(--g-dark);letter-spacing:.05em;text-transform:uppercase}
.hero h1{font-size:clamp(32px,4vw,54px);font-weight:800;color:var(--black);line-height:1.1;letter-spacing:-1.5px;margin-bottom:10px}
.hero h2{font-size:clamp(20px,2.5vw,30px);font-weight:700;color:var(--g);margin-bottom:18px;letter-spacing:-.5px}
.hero-desc{font-size:15px;color:var(--muted);line-height:1.75;max-width:460px;margin-bottom:32px}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px}
.btn-primary{display:inline-flex;align-items:center;font-size:14px;font-weight:700;color:var(--white);background:var(--g);padding:14px 28px;border-radius:var(--r);text-decoration:none;transition:all .2s;border:none;cursor:pointer}
.btn-primary:hover{background:var(--g-dark);transform:translateY(-1px)}
.hero-badges{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.badge-label{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}
.badge{font-size:11px;color:var(--muted);border:1px solid var(--border);border-radius:4px;padding:3px 9px}
.hero-img-wrap{display:flex;align-items:center;justify-content:center}
.hero-img{width:100%;max-width:440px;animation:float 5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@media(max-width:860px){.hero-inner{grid-template-columns:1fr}.hero-img-wrap{display:none}.hero{min-height:auto;padding:90px 5% 56px}}

/* ── SHARED ── */
.section{padding:80px 5%}
.inner{max-width:var(--max);margin:0 auto}
.center{text-align:center}
.sec-tag{font-size:11px;font-weight:700;color:var(--g);letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px;display:block}
.sec-title{font-size:clamp(24px,3vw,38px);font-weight:800;color:var(--black);line-height:1.15;margin-bottom:12px;letter-spacing:-.6px}
.sec-title em{font-style:normal;color:var(--g)}
.sec-sub{font-size:14px;color:var(--muted);max-width:500px;line-height:1.75;margin-bottom:44px}

/* ── NOSOTROS ── */
.pillars-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:44px}
@media(max-width:700px){.pillars-grid{grid-template-columns:1fr}}
.pillar{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:28px 22px;text-align:center;transition:all .22s}
.pillar:hover{transform:translateY(-4px);box-shadow:0 12px 36px rgba(45,184,75,.1);border-color:rgba(45,184,75,.3)}
.pillar-icon{width:52px;height:52px;margin:0 auto 14px;background:var(--g-pale);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--g-light)}
.pillar-icon svg{width:24px;height:24px;stroke:var(--g);fill:none;stroke-width:1.8}
.pillar-title{font-size:15px;font-weight:700;color:var(--black);margin-bottom:8px}
.pillar-desc{font-size:13px;color:var(--muted);line-height:1.7}

/* ── PRODUCTOS ── */
.products-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-top:44px}
@media(max-width:700px){.products-grid{grid-template-columns:1fr}}
.product-card{background:var(--white);border:1px solid var(--border);border-radius:14px;padding:32px 28px;transition:all .22s;border-top:4px solid var(--border)}
.product-card.is-carbon{border-top-color:var(--g)}
.product-card.is-water{border-top-color:var(--b)}
.product-card:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(0,0,0,.08)}
.product-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.product-card.is-carbon .product-icon{background:var(--g-pale);border:2px solid var(--g-light)}
.product-card.is-water .product-icon{background:var(--b-pale);border:2px solid var(--b-light)}
.product-icon svg{width:26px;height:26px;fill:none;stroke-width:1.8}
.product-card.is-carbon .product-icon svg{stroke:var(--g)}
.product-card.is-water .product-icon svg{stroke:var(--b)}
.product-name{font-size:20px;font-weight:800;letter-spacing:-.4px;margin-bottom:4px}
.product-card.is-carbon .product-name span{color:var(--g)}
.product-card.is-water .product-name span{color:var(--b)}
.product-tag{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;display:block}
.product-desc{font-size:13.5px;color:var(--muted);line-height:1.75;margin-bottom:18px}
.product-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
.product-badge{font-size:11px;border-radius:4px;padding:4px 10px;font-weight:600}
.product-card.is-carbon .product-badge{background:var(--g-pale);color:var(--g-dark)}
.product-card.is-water .product-badge{background:var(--b-pale);color:var(--b-dark)}
.btn-product{font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;font-size:13.5px;font-weight:700;color:var(--white);padding:11px 22px;border-radius:var(--r);text-decoration:none;transition:all .2s;border:none}
.product-card.is-carbon .btn-product{background:var(--g)}
.product-card.is-carbon .btn-product:hover{background:var(--g-dark)}
.product-card.is-water .btn-product{background:var(--b)}
.product-card.is-water .btn-product:hover{background:var(--b-dark)}
.login-note{text-align:center;font-size:12.5px;color:var(--muted);margin-top:28px}
.login-note a{color:var(--black);font-weight:600;text-decoration:underline}

/* ── COMO FUNCIONA ── */
.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:44px}
@media(max-width:700px){.how-grid{grid-template-columns:1fr}}
.how-card{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:26px 22px;transition:all .2s}
.how-card:hover{box-shadow:0 8px 28px rgba(45,184,75,.08);border-color:rgba(45,184,75,.25)}
.how-step{font-size:11px;font-weight:700;color:var(--g);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;display:block}
.how-icon{width:42px;height:42px;background:var(--g-pale);border:1px solid var(--border);border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.how-icon svg{width:19px;height:19px;stroke:var(--g);fill:none;stroke-width:1.8}
.how-title{font-size:15px;font-weight:700;color:var(--black);margin-bottom:7px}
.how-desc{font-size:13px;color:var(--muted);line-height:1.65}

/* ── NORMAS ── */
.normas{background:var(--black);padding:72px 5%}
.normas-inner{max-width:var(--max);margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
@media(max-width:700px){.normas-inner{grid-template-columns:1fr}}
.normas .sec-tag{color:var(--g)}
.normas .sec-title{color:#fff}
.normas .sec-sub{color:rgba(255,255,255,.45);margin-bottom:28px}
.normas-badges{display:flex;gap:10px;flex-wrap:wrap}
.norma-badge{border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:10px 18px;display:flex;align-items:center;gap:8px}
.norma-badge-dot{width:8px;height:8px;background:var(--g);border-radius:50%;flex-shrink:0}
.norma-badge span{font-size:13px;font-weight:600;color:rgba(255,255,255,.7)}
.normas-right{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.norma-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:20px;transition:all .2s}
.norma-card:hover{background:rgba(255,255,255,.07);border-color:rgba(45,184,75,.3)}
.norma-card.is-water:hover{border-color:rgba(37,137,232,.4)}
.norma-num{font-size:32px;font-weight:800;color:var(--g);line-height:1;margin-bottom:8px}
.norma-title{font-size:13px;font-weight:600;color:rgba(255,255,255,.8);margin-bottom:5px}
.norma-desc{font-size:12px;color:rgba(255,255,255,.38);line-height:1.65}

/* ── PLANES ── */
.plans-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px;align-items:start}
@media(max-width:800px){.plans-grid{grid-template-columns:1fr}}
.plan{border:1.5px solid var(--border);border-radius:12px;padding:28px;background:var(--white);transition:all .2s;position:relative}
.plan:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(45,184,75,.09)}
.plan.featured{background:var(--black);border-color:var(--black)}
.plan-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--g);color:var(--white);font-size:10px;font-weight:700;padding:3px 14px;border-radius:100px;white-space:nowrap;letter-spacing:.06em;text-transform:uppercase}
.plan-name{font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}
.plan.featured .plan-name{color:rgba(255,255,255,.4)}
.plan-price{font-size:46px;font-weight:800;color:var(--black);line-height:1;margin-bottom:2px;letter-spacing:-2px}
.plan.featured .plan-price{color:var(--g)}
.plan-period{font-size:12px;color:var(--muted);margin-bottom:18px}
.plan.featured .plan-period{color:rgba(255,255,255,.3)}
.plan-line{height:1px;background:var(--border);margin:16px 0}
.plan.featured .plan-line{background:rgba(255,255,255,.08)}
.plan-features{list-style:none;margin-bottom:24px;display:flex;flex-direction:column;gap:9px}
.plan-features li{font-size:13px;color:var(--black);display:flex;align-items:flex-start;gap:8px;line-height:1.5}
.plan.featured .plan-features li{color:rgba(255,255,255,.65)}
.plan-features li::before{content:'';width:15px;height:15px;min-width:15px;border-radius:50%;background:var(--g-pale);border:1.5px solid var(--border);background-image:url("data:image/svg+xml,%3Csvg width='9' height='7' viewBox='0 0 9 7' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3.5l2.5 2.5 5-5' stroke='%232db84b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;margin-top:2px}
.plan.featured .plan-features li::before{background-color:rgba(45,184,75,.15);border-color:rgba(45,184,75,.3)}
.plan-addons{margin:-4px 0 22px;padding-top:18px;border-top:1px dashed var(--border)}
.plan.featured .plan-addons{border-top-color:rgba(255,255,255,.1)}
.plan-addons-title{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.plan.featured .plan-addons-title{color:rgba(255,255,255,.35)}
.plan-addons-list{list-style:none;display:flex;flex-direction:column;gap:7px}
.plan-addons-list li{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:12px;color:var(--muted)}
.plan.featured .plan-addons-list li{color:rgba(255,255,255,.45)}
.addon-price{font-weight:700;color:var(--g);white-space:nowrap;font-size:11.5px}
.plan.featured .addon-price{color:var(--g)}
.btn-plan{display:block;width:100%;text-align:center;text-decoration:none;padding:12px;border-radius:var(--r);font-size:14px;font-weight:700;border:1.5px solid var(--g);color:var(--g);background:transparent;cursor:pointer;transition:all .2s}
.btn-plan:hover{background:var(--g);color:var(--white)}
.plan.featured .btn-plan{background:var(--g);color:var(--white);border-color:var(--g)}
.plan.featured .btn-plan:hover{background:var(--white);color:var(--black);border-color:var(--white)}


/* ── FAQ ── */
.faq-wrap{max-width:680px;margin:40px auto 0;text-align:left}
.faq-item{border-bottom:1px solid var(--border)}
.faq-btn{width:100%;background:none;border:none;text-align:left;padding:16px 0;cursor:pointer;font-family:var(--sans);display:flex;justify-content:space-between;align-items:center;gap:14px}
.faq-q{font-size:14px;font-weight:600;color:var(--black)}
.faq-icon{width:22px;height:22px;min-width:22px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;transition:transform .25s,border-color .2s}
.faq-icon svg{width:11px;height:11px;stroke:var(--g);fill:none;stroke-width:2}
.faq-item.open .faq-icon{transform:rotate(180deg);border-color:var(--g)}
.faq-body{display:none;padding-bottom:14px;font-size:13.5px;color:var(--muted);line-height:1.75}
.faq-item.open .faq-body{display:block}

/* ── CONTACTO ── */
.contact-inner{max-width:var(--max);margin:0 auto;display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:start}
@media(max-width:800px){.contact-inner{grid-template-columns:1fr}}
.contact-items{display:flex;flex-direction:column;gap:14px;margin-top:16px}
.ci{display:flex;gap:10px;align-items:flex-start}
.ci-icon{width:34px;height:34px;min-width:34px;background:var(--g-pale);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center}
.ci-icon svg{width:15px;height:15px;stroke:var(--g);fill:none;stroke-width:1.8}
.ci strong{display:block;font-size:12px;font-weight:600;color:var(--black);margin-bottom:2px}
.ci span{font-size:12px;color:var(--muted)}
.contact-form{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:26px}
.form-group{margin-bottom:13px}
.form-group label{display:block;font-size:12px;font-weight:600;color:var(--black);margin-bottom:5px}
.form-group input,.form-group textarea,.form-group select{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--sans);font-size:13.5px;background:var(--white);color:var(--black);outline:none;transition:border-color .2s}
.form-group input:focus,.form-group textarea:focus,.form-group select:focus{border-color:var(--g)}
.form-group textarea{resize:vertical;min-height:85px}
.btn-submit{width:100%;padding:13px;background:var(--g);color:var(--white);border:none;border-radius:var(--r);font-family:var(--sans);font-size:14px;font-weight:700;cursor:pointer;transition:background .2s}
.btn-submit:hover{background:var(--g-dark)}

/* ── CTA BAND ── */
.cta-band{background:var(--g);padding:72px 5%;text-align:center}
.cta-band h2{font-size:clamp(22px,3vw,36px);font-weight:800;color:var(--white);letter-spacing:-.5px;margin-bottom:12px}
.cta-band p{font-size:15px;color:rgba(255,255,255,.8);margin-bottom:28px;max-width:440px;margin-left:auto;margin-right:auto}
.btn-white{display:inline-flex;align-items:center;font-size:14px;font-weight:700;color:var(--g);background:var(--white);padding:13px 28px;border-radius:var(--r);text-decoration:none;transition:all .2s;border:2px solid var(--white)}
.btn-white:hover{background:transparent;color:var(--white)}

/* ── FOOTER ── */
footer{background:var(--black);padding:44px 5% 26px}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;flex-wrap:wrap;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:20px}
.footer-logo{font-size:17px;font-weight:800;color:var(--white);letter-spacing:-.3px;margin-bottom:7px}
.footer-logo span{color:var(--g)}
.footer-brand p{font-size:12px;color:rgba(255,255,255,.28);max-width:210px;line-height:1.6}
.footer-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.footer-tag{font-size:10px;color:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.07);padding:3px 8px;border-radius:4px}
.footer-col h5{font-size:10px;font-weight:700;color:rgba(255,255,255,.25);letter-spacing:.12em;text-transform:uppercase;margin-bottom:11px}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:7px}
.footer-col a{font-size:13px;color:rgba(255,255,255,.32);text-decoration:none;transition:color .18s}
.footer-col a:hover{color:var(--g)}
.footer-bot{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.footer-copy{font-size:11px;color:rgba(255,255,255,.18)}

/* ── REVEAL ── */
.rv{opacity:0;transform:translateY(20px);transition:opacity .55s ease,transform .55s ease}
.rv.on{opacity:1;transform:none}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}

      `}</style>
<nav className="nav" id="nav">
  <a href="#inicio" className="nav-logo">
    <img src="/carbo-logo.png" width="32" height="32" alt="CarboMétrica" style={{borderRadius: '8px', display: 'block'}}/>
    <span className="logo-name">Carbo<span>Métrica</span></span>
  </a>
  <ul className="nav-links">
    <li><a href="#nosotros">Nosotros</a></li>
    <li><a href="#productos">Productos</a></li>
    <li><a href="#como">Cómo funciona</a></li>
    <li><a href="#normas">Normas</a></li>
    <li><a href="#planes">Planes</a></li>
    <li><a href="#contacto">Contacto</a></li>
  </ul>
  <div className="nav-actions">
    <a href="https://www.carbometrics.site/login" className="btn-login">Iniciar sesión</a>
    <button type="button" className="btn-login-blue" onClick={handleHydroClick}>Iniciar sesión</button>
  </div>
  <button className="hamburger" id="hamburger" aria-label="Menú">
    <span></span><span></span><span></span>
  </button>
</nav>


<div className="mob-menu" id="mobMenu">
  <a href="#nosotros">Nosotros</a>
  <a href="#productos">Productos</a>
  <a href="#como">Cómo funciona</a>
  <a href="#normas">Normas</a>
  <a href="#planes">Planes</a>
  <a href="#contacto">Contacto</a>
  <div className="mob-div"></div>
  <div className="mob-btns">
    <a href="https://www.carbometrics.site/login" className="btn-login">Iniciar sesión</a>
    <button type="button" className="btn-login-blue" onClick={handleHydroClick}>Iniciar sesión</button>
  </div>
</div>


<section className="hero" id="inicio">
  <div className="hero-inner">
    <div>
      <div className="hero-chip">
        <div className="chip-dot"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></div>
        <span>ISO 14064-1 · ISO 14046 · Beta</span>
      </div>
      <h1>Gestiona el impacto<br/>ambiental de tu empresa</h1>
      <h2>Huella de carbono y huella hídrica,<br/>en un solo lugar.</h2>
      <p className="hero-desc">CarboMetrics e HydroMetrics te ayudan a medir, gestionar y reportar tus emisiones de carbono y tu consumo de agua bajo normas internacionales reconocidas.</p>
      <div className="hero-btns">
        <a href="#productos" className="btn-primary">VER NUESTROS PRODUCTOS</a>
      </div>
      <div className="hero-badges">
        <span className="badge-label">BASADO EN:</span>
        <span className="badge">ISO 14064-1</span>
        <span className="badge">ISO 14046</span>
        <span className="badge">GHG Protocol</span>
        <span className="badge">Net Zero</span>
      </div>
    </div>
    <div className="hero-img-wrap">
      <img className="hero-img" src="/carbo-hero.jpg" alt="Huella de carbono hecha de hojas verdes"/>
    </div>
  </div>
</section>


<section className="section" style={{background: 'var(--gray)'}} id="nosotros">
  <div className="inner">
    <span className="sec-tag rv">Nosotros</span>
    <h2 className="sec-title rv">Cuidamos los recursos del planeta<br/>a través de cada <em>empresa comprometida.</em></h2>
    <p className="sec-sub rv">Nuestra organización promueve la innovación y la ciencia para que empresas de todo el mundo puedan medir, gestionar y reducir su huella de carbono y su huella hídrica.</p>
    <div className="pillars-grid">
      <div className="pillar rv">
        <div className="pillar-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg></div>
        <div className="pillar-title">Alcance Global</div>
        <div className="pillar-desc">Pensada para toda organización comprometida con el cuidado del clima y del agua, sin importar su tamaño o país.</div>
      </div>
      <div className="pillar rv d1">
        <div className="pillar-icon"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
        <div className="pillar-title">Innovación y Ciencia</div>
        <div className="pillar-desc">Combinamos innovación tecnológica y metodologías científicas reconocidas para garantizar resultados precisos y verificables.</div>
      </div>
      <div className="pillar rv d2">
        <div className="pillar-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
        <div className="pillar-title">Compromiso Ambiental</div>
        <div className="pillar-desc">Cada organización que usa CarboMetrics o HydroMetrics suma un paso concreto hacia la sostenibilidad y el uso responsable de los recursos.</div>
      </div>
    </div>
  </div>
</section>


<section className="section" id="productos">
  <div className="inner">
    <span className="sec-tag rv">Productos</span>
    <h2 className="sec-title rv">Dos plataformas,<br/><em>dos soluciones.</em></h2>
    <p className="sec-sub rv">Cada producto mide un recurso distinto, pero ambos viven bajo el mismo techo: administra tus emisiones de carbono y tu consumo de agua.</p>
    <div className="products-grid">

      <div className="product-card is-carbon rv">
        <div className="product-icon"><svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
        <div className="product-name">Carbo<span>Metrics</span></div>
        <span className="product-tag">Gestión de huella de carbono</span>
        <p className="product-desc">Inventario de gases de efecto invernadero por Alcances 1, 2 y 3, con reporte técnico listo para auditoría.</p>
        <div className="product-badges">
          <span className="product-badge">ISO 14064-1</span>
          <span className="product-badge">GHG Protocol</span>
        </div>
        <a href="https://www.carbometrics.site/login" className="btn-product">Iniciar sesión en CarboMetrics</a>
      </div>

      <div className="product-card is-water rv d1">
        <div className="product-icon"><svg viewBox="0 0 24 24"><path d="M12 2C12 2 5 11.5 5 16a7 7 0 0 0 14 0c0-4.5-7-14-7-14Z"/></svg></div>
        <div className="product-name">Hydro<span>Metrics</span></div>
        <span className="product-tag">Gestión de huella hídrica</span>
        <p className="product-desc">Inventario de agua Azul, Verde y Gris, con evaluación de impacto (escasez y degradación) y reporte conforme a ISO 14046.</p>
        <div className="product-badges">
          <span className="product-badge">ISO 14046:2014</span>
          <span className="product-badge">Water Footprint Network</span>
        </div>
        <button type="button" className="btn-product" onClick={handleHydroClick}>Iniciar sesión en HydroMetrics</button>
      </div>

    </div>
    <p className="login-note rv">¿Tu organización usa ambos productos? Entra al panel correspondiente según los productos habilitados para tu empresa.</p>
  </div>
</section>


<section className="section" id="como">
  <div className="inner">
    <span className="sec-tag rv">Cómo funciona</span>
    <h2 className="sec-title rv">Tu camino hacia la<br/><em>sostenibilidad ambiental</em></h2>
    <p className="sec-sub rv">Tres pasos simples para medir, gestionar y reducir tu huella de carbono y/o tu huella hídrica organizacional.</p>
    <div className="how-grid">
      <div className="how-card rv">
        <span className="how-step">Paso 01</span>
        <div className="how-icon"><svg viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
        <div className="how-title">Inventario de Datos</div>
        <div className="how-desc">Registra tus fuentes de emisión (Alcances 1, 2 y 3) o tu inventario de agua (Azul, Verde y Gris). La plataforma sugiere los factores correctos según tu sector y país.</div>
      </div>
      <div className="how-card rv d1">
        <span className="how-step">Paso 02</span>
        <div className="how-icon"><svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
        <div className="how-title">Análisis y Reducción</div>
        <div className="how-desc">Visualiza tu huella por departamento, sede o actividad. Recibe recomendaciones para reducir tu impacto con el mejor resultado.</div>
      </div>
      <div className="how-card rv d2">
        <span className="how-step">Paso 03</span>
        <div className="how-icon"><svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
        <div className="how-title">Reporte Verificable</div>
        <div className="how-desc">Genera el informe técnico ISO 14064-1 o ISO 14046 listo para auditoría. Demuestra tu compromiso ambiental de forma verificada.</div>
      </div>
    </div>
  </div>
</section>


<section className="normas" id="normas">
  <div className="normas-inner">
    <div>
      <div className="normas-badges rv">
        <div className="norma-badge"><div className="norma-badge-dot"></div><span>ISO 14064-1</span></div>
        <div className="norma-badge"><div className="norma-badge-dot"></div><span>GHG Protocol</span></div>
        <div className="norma-badge"><div className="norma-badge-dot" style={{background: 'var(--b)'}}></div><span>ISO 14046:2014</span></div>
        <div className="norma-badge"><div className="norma-badge-dot" style={{background: 'var(--b)'}}></div><span>Water Footprint Network</span></div>
      </div>
    </div>
    <div className="normas-right rv">
      <div className="norma-card">
        <div className="norma-num">I</div>
        <div className="norma-title">Emisiones Directas</div>
        <div className="norma-desc">Combustión estacionaria, móvil, procesos industriales y emisiones fugitivas de tu organización.</div>
      </div>
      <div className="norma-card">
        <div className="norma-num">II</div>
        <div className="norma-title">Emisiones Indirectas</div>
        <div className="norma-desc">Emisiones de electricidad, calor o vapor adquirido y consumido por tu organización.</div>
      </div>
      <div className="norma-card">
        <div className="norma-num">III</div>
        <div className="norma-title">Otras Emisiones Indirectas</div>
        <div className="norma-desc">Transporte, compras, residuos y viajes fuera de tus límites operativos pero dentro de tu cadena de valor.</div>
      </div>
      <div className="norma-card is-water">
        <div className="norma-num" style={{color: 'var(--b)'}}>IV</div>
        <div className="norma-title">Huella Hídrica</div>
        <div className="norma-desc">Agua Azul, Verde y Gris según ISO 14046, con evaluación de escasez y degradación de la cuenca.</div>
      </div>
    </div>
  </div>
</section>


<section className="section" id="planes">
  <div className="inner center">
    <span className="sec-tag rv">Planes · CarboMetrics</span>
    <h2 className="sec-title rv">Elige el plan adecuado<br/>para tu <em>organización.</em></h2>
    <p className="sec-sub rv" style={{margin: '0 auto 12px'}}>Sin contratos largos. Cancela cuando quieras.</p>
    <p className="sec-sub rv" style={{margin: '0 auto 44px', fontSize: '14px'}}>¿También necesitas HydroMetrics? <a href="#contacto" style={{color: 'var(--b)', fontWeight: '700', textDecoration: 'none'}}>Contáctanos</a> para un plan combinado.</p>
    <div className="plans-grid">

      <div className="plan rv">
        <div className="plan-name">Básico</div>
        <div className="plan-price">$50</div>
        <div className="plan-period">USD por mes</div>
        <div className="plan-line"></div>
        <ul className="plan-features">
          <li>Incluye 1 instalación</li>
          <li>Un solo usuario</li>
          <li>Incluye 2 fuentes de GEI</li>
          <li>2 años de inventario de GEI</li>
        </ul>
        <div className="plan-addons">
          <div className="plan-addons-title">Adicionales</div>
          <ul className="plan-addons-list">
            <li><span>1 usuario</span><span className="addon-price">+$15/mes</span></li>
            <li><span>1 año de inventario de GEI</span><span className="addon-price">+$20/mes</span></li>
            <li><span>1 fuente de GEI</span><span className="addon-price">+$15/mes</span></li>
          </ul>
        </div>
        <a href="https://www.carbometrics.site/login" className="btn-plan">Probar Básico</a>
      </div>

      <div className="plan featured rv d1">
        <div className="plan-badge">Más popular</div>
        <div className="plan-name">Standard</div>
        <div className="plan-price">$100</div>
        <div className="plan-period">USD por mes</div>
        <div className="plan-line"></div>
        <ul className="plan-features">
          <li>Hasta 5 instalaciones</li>
          <li>Hasta 5 usuarios</li>
          <li>Incluye 5 fuentes de GEI</li>
          <li>3 años de inventario de GEI</li>
        </ul>
        <div className="plan-addons">
          <div className="plan-addons-title">Adicionales</div>
          <ul className="plan-addons-list">
            <li><span>1 usuario</span><span className="addon-price">+$15/mes</span></li>
            <li><span>1 año de inventario de GEI</span><span className="addon-price">+$20/mes</span></li>
            <li><span>1 fuente de GEI</span><span className="addon-price">+$15/mes</span></li>
          </ul>
        </div>
        <a href="https://www.carbometrics.site/login" className="btn-plan">Probar Standard</a>
      </div>

      <div className="plan rv d2">
        <div className="plan-name">Corporativo</div>
        <div className="plan-price">$150</div>
        <div className="plan-period">USD por mes</div>
        <div className="plan-line"></div>
        <ul className="plan-features">
          <li>Hasta 10 instalaciones</li>
          <li>Hasta 10 usuarios</li>
          <li>Incluye 7 fuentes de GEI</li>
          <li>5 años de inventario de GEI</li>
        </ul>
        <div className="plan-addons">
          <div className="plan-addons-title">Adicionales</div>
          <ul className="plan-addons-list">
            <li><span>1 usuario</span><span className="addon-price">+$15/mes</span></li>
            <li><span>1 año de inventario de GEI</span><span className="addon-price">+$20/mes</span></li>
            <li><span>1 fuente de GEI</span><span className="addon-price">+$15/mes</span></li>
          </ul>
        </div>
        <a href="https://www.carbometrics.site/login" className="btn-plan">Probar Corporativo</a>
      </div>

    </div>
  </div>
</section>


<section className="section" id="faq">
  <div className="inner center">
    <span className="sec-tag rv">Preguntas frecuentes</span>
    <h2 className="sec-title rv">Dudas <em>comunes.</em></h2>
    <div className="faq-wrap rv">
      <div className="faq-item open">
        <button className="faq-btn">
          <span className="faq-q">¿Necesito una cuenta distinta para CarboMetrics y para HydroMetrics?</span>
          <span className="faq-icon"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
        </button>
        <div className="faq-body">No. Usas un solo inicio de sesión para ambos productos. Si tu organización tiene habilitado CarboMetrics, HydroMetrics, o ambos, el sistema te lleva directamente al panel correspondiente con esa misma cuenta.</div>
      </div>
      <div className="faq-item">
        <button className="faq-btn">
          <span className="faq-q">¿Puedo empezar con un solo producto y agregar el otro más adelante?</span>
          <span className="faq-icon"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
        </button>
        <div className="faq-body">Sí. La mayoría de nuestros clientes comienza con uno de los dos productos y activa el segundo cuando lo necesita, sin perder su historial ni tener que crear una cuenta nueva.</div>
      </div>
      <div className="faq-item">
        <button className="faq-btn">
          <span className="faq-q">¿Qué normas siguen sus reportes?</span>
          <span className="faq-icon"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
        </button>
        <div className="faq-body">CarboMetrics genera reportes alineados a ISO 14064-1 y al GHG Protocol. HydroMetrics genera reportes alineados a ISO 14046:2014, incluyendo inventario de huella hídrica y evaluación de impacto (escasez y degradación).</div>
      </div>
    </div>
  </div>
</section>


<section className="section" style={{background: 'var(--gray)'}} id="contacto">
  <div className="contact-inner">
    <div>
      <span className="sec-tag rv">Contacto</span>
      <h2 className="sec-title rv">Hablemos de tu<br/>estrategia <em>ambiental.</em></h2>
      <p className="sec-sub rv">Nuestro equipo está listo para ayudarte. Escríbenos y te respondemos a la brevedad.</p>
      <div className="contact-items rv">
        <div className="ci">
          <div className="ci-icon"><svg viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
          <div><strong>Email</strong><span>carbometrica@gmail.com</span></div>
        </div>
        <div className="ci">
          <div className="ci-icon"><svg viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
          <div><strong>Sede</strong><span>Cochabamba, Bolivia</span></div>
        </div>
        <div className="ci">
          <div className="ci-icon"><svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
          <div><strong>Estado</strong><span>Operativo — HydroMetrics en fase beta</span></div>
        </div>
      </div>
    </div>
    <div className="contact-form rv">
      <div className="form-group"><label>Nombre</label><input type="text" id="ctcName" placeholder="Tu nombre completo"/></div>
      <div className="form-group"><label>Email</label><input type="email" id="ctcEmail" placeholder="tu@empresa.com"/></div>
      <div className="form-group"><label>Empresa / Organización</label><input type="text" id="ctcCompany" placeholder="Nombre de tu organización"/></div>
      <div className="form-group">
        <label>Producto de interés</label>
        <select id="ctcProduct">
          <option>CarboMetrics — Huella de carbono</option>
          <option>HydroMetrics — Huella hídrica</option>
          <option>Ambos</option>
        </select>
      </div>
      <div className="form-group">
        <label>Plan de interés</label>
        <select id="ctcPlan">
          <option>Básico — $50/mes</option>
          <option>Standard — $100/mes</option>
          <option>Corporativo — $150/mes</option>
        </select>
      </div>
      <div className="form-group"><label>Mensaje</label><textarea id="ctcMessage" placeholder="Cuéntanos sobre tu organización y objetivos climáticos..."></textarea></div>
      <button className="btn-submit" id="submitBtn">Enviar mensaje →</button>
    </div>
  </div>
</section>


<section className="cta-band">
  <h2 className="rv">Empieza ahora. Lucha contra el Cambio Climático.</h2>
  <p className="rv">Únete a las organizaciones comprometidas con luchar contra el cambio climático.</p>
  <a href="https://www.carbometrics.site/login" className="btn-white rv">Iniciar sesión</a>
</section>


<footer>
  <div style={{maxWidth: 'var(--max)', margin: '0 auto'}}>
    <div className="footer-top">
      <div className="footer-brand">
        <div className="footer-logo">Carbo<span>Metrics</span> · Hydro<span style={{color: 'var(--b)'}}>Metrics</span></div>
        <p>Innovación y ciencia para la gestión de la huella de carbono y la huella hídrica en organizaciones comprometidas con el planeta.</p>
        <div className="footer-tags">
          <span className="footer-tag">ISO 14064-1</span>
          <span className="footer-tag">ISO 14046</span>
          <span className="footer-tag">Huella Hídrica</span>
          <span className="footer-tag">GHG Protocol</span>
          <span className="footer-tag">Net Zero</span>
          <span className="footer-tag">Beta</span>
        </div>
      </div>
      <div className="footer-col">
        <h5>Plataforma</h5>
        <ul>
          <li><a href="#nosotros">Nosotros</a></li>
          <li><a href="#productos">Productos</a></li>
          <li><a href="#como">Cómo funciona</a></li>
          <li><a href="#normas">Normativa</a></li>
          <li><a href="#planes">Planes</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h5>Legal</h5>
        <ul>
          <li><a href="#">Términos de uso</a></li>
          <li><a href="#">Privacidad</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bot">
      <span className="footer-copy">© 2026 CarboMetrics & HydroMetrics. Todos los derechos reservados. · Cochabamba, Bolivia</span>
    </div>
  </div>
</footer>


    </>
  );
}
