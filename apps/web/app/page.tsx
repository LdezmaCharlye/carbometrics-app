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

  const svgScene = `<style>
    @keyframes sc-cloud1{0%,100%{transform:translateX(0)}50%{transform:translateX(40px)}}
    @keyframes sc-cloud2{0%,100%{transform:translateX(0)}50%{transform:translateX(-35px)}}
    @keyframes sc-cloud3{0%,100%{transform:translateX(0)}50%{transform:translateX(25px)}}
    @keyframes sc-cloud4{0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}}
    @keyframes sc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes sc-spinr{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
    @keyframes sc-flutter1{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-20px) rotate(5deg)}}
    @keyframes sc-flutter2{0%,100%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-15px) rotate(-3deg)}}
    @keyframes sc-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    .sc-c1{animation:sc-cloud1 12s ease-in-out infinite}
    .sc-c2{animation:sc-cloud2 16s ease-in-out infinite}
    .sc-c3{animation:sc-cloud3 10s ease-in-out infinite}
    .sc-c4{animation:sc-cloud4 18s ease-in-out infinite 3s}
    .sc-w1{transform-origin:488.8px 120.9px;animation:sc-spin 4s linear infinite}
    .sc-w2{transform-origin:594.9px 140px;animation:sc-spinr 6s linear infinite}
    .sc-w3{transform-origin:773.5px 255px;animation:sc-spin 5s linear infinite}
    .sc-w4{transform-origin:1393.8px 410px;animation:sc-spinr 3s linear infinite}
    .sc-sun{transform-origin:800px 58px;animation:sc-spin 20s linear infinite}
    .sc-bf1{transform-origin:675px 205px;animation:sc-flutter1 3s ease-in-out infinite}
    .sc-bf2{transform-origin:715px 190px;animation:sc-flutter2 2.5s ease-in-out infinite 0.7s}
    .sc-car{animation:sc-bounce 2s ease-in-out infinite}
    .sc-wl{transform-origin:1135.6px 514.5px;animation:sc-spin 1.5s linear infinite}
    .sc-wr{transform-origin:1259.7px 514.2px;animation:sc-spin 1.5s linear infinite}
  </style>
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 608" style="width:100%;display:block;">
    <!-- SUN -->
    <g class="sc-sun">
      <circle cx="800" cy="58" r="24" fill="#2FC16A" fill-opacity="0.15" stroke="#2FC16A" stroke-width="3"/>
      <circle cx="800" cy="58" r="13" fill="#2FC16A" fill-opacity="0.3"/>
      <line x1="800" y1="20" x2="800" y2="29" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="800" y1="87" x2="800" y2="96" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="762" y1="58" x2="753" y2="58" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="847" y1="58" x2="838" y2="58" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="773" y1="31" x2="767" y2="25" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="833" y1="85" x2="827" y2="91" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="827" y1="31" x2="833" y2="25" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
      <line x1="767" y1="85" x2="773" y2="91" stroke="#2FC16A" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- CLOUD 1 top center -->
    <g class="sc-c1"><path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M725.1,116.2h173c0,0-0.5-9.3-7.9-15.3c-6.9-5.6-18.5-5.1-18.5-5.1s-4.3-8.8-11.2-11.4c-6.9-2.6-16.3-1-16.3-1s-6.1-15.1-21.4-16.1s-21.6,11.4-21.6,11.4s-11.2-11.3-29.4-5.5c-12.5,4-14.7,16.3-14.7,16.3S741,85.3,730.2,97C722.8,105,725.1,116.2,725.1,116.2z"/></g>
    <!-- CLOUD 2 top left -->
    <g class="sc-c2"><path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M84.9,213.6h158.3c0,0,0-11.8-7.7-20c-7.7-8.2-18.2-4-18.2-4s-3.7-9.1-10.3-10.6c-7.2-1.7-14.3,0-14.3,0s-4.5-14.6-19.7-15.5c-15.2-0.8-18.9,10.1-18.9,10.1s-9.3-12-27.6-4.7c-12.2,4.8-13,14.8-13,14.8s-10.4-5.4-22.7,6.7C83.5,197.5,84.9,213.6,84.9,213.6z"/></g>
    <!-- CLOUD 3 small bottom left -->
    <g class="sc-c3"><path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M126.3,523.7h49.5c0,0,8.3-5.2,5.5-14.8c-2.8-9.4-14.6-8.1-14.6-8.1s-4.2-17.4-19.8-14.5c-16.1,3-11.8,18.4-11.8,18.4s-12.9-2-14,8.8C120.4,521.6,126.3,523.7,126.3,523.7z"/></g>
    <!-- CLOUD 4 top right -->
    <g class="sc-c4"><path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M1537.8,194.4h-173c0,0,0.5-9.3,7.9-15.3c6.9-5.6,18.5-5.1,18.5-5.1s4.3-8.8,11.2-11.4c6.9-2.6,16.3-1,16.3-1s6.1-15.1,21.4-16.1c15.3-1,21.6,11.4,21.6,11.4s11.2-11.3,29.4-5.5c12.5,4,14.7,16.3,14.7,16.3s16.1-4.2,26.9,7.5C1540.1,183.3,1537.8,194.4,1537.8,194.4z"/></g>
    <!-- TURBINE LEFT small cluster - gray -->
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="164" y1="398.6" x2="164" y2="494"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="128.8" y1="425.8" x2="162.9" y2="444.8"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="192.3" y1="453.8" x2="164.4" y2="483.8"/>
    <circle fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" cx="163.8" cy="385.5" r="25"/>
    <circle fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" cx="198.3" cy="447.4" r="20.3"/>
    <circle fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" cx="123.5" cy="422.4" r="17"/>
    <!-- GROUND LINE -->
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="70.5" y1="525" x2="1530" y2="525"/>
    <!-- TURBINE RIGHT large - base + pole gray -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M1380.3,525c0,0,2.3-36.3,33.9-34.6c31.3,1.6,31.3,34.6,31.3,34.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1393.8" y1="343.3" x2="1393.8" y2="496.4"/>
    <!-- TURBINE RIGHT BLADES - GREEN ANIMATED -->
    <g class="sc-w4">
      <path fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M1393.9,314.3c0,0,7.3,0.1,13.6,22.3c6.7,23.7,11,72.3,11.3,85.3s2.9,59-24.8,61s-24.1-42.1-24.4-60.8s5.7-66.2,10.8-86.5C1385,316.3,1393.9,314.3,1393.9,314.3z"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1410.5" y1="376.5" x2="1393.8" y2="393.3"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1376.8" y1="393.3" x2="1393.3" y2="409.8"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1411.1" y1="412" x2="1393.8" y2="429.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1376.8" y1="428.5" x2="1393.6" y2="445.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1410.5" y1="447.4" x2="1393.9" y2="463.9"/>
    </g>
    <!-- WAREHOUSE -->
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1157.3" y1="525" x2="1157.3" y2="392"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1157.3" y1="392" x2="1352.2" y2="392"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1352.2" y1="392" x2="1352.2" y2="525"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1157.3" y1="392" x2="1096.3" y2="351.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1096.3" y1="351.5" x2="1034.2" y2="392"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1034.2" y1="392" x2="1034.2" y2="525"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1096.3" y1="351.5" x2="1291" y2="351.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" x1="1291" y1="351.5" x2="1352.2" y2="392"/>
    <rect x="1175.7" y="411.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="65.3" height="37.5"/>
    <rect x="1268.6" y="411.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="65.4" height="37.5"/>
    <!-- SOLAR ARRAY WIRES + PANEL -->
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1315.8" y1="367.9" x2="1323.3" y2="207"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1336.3" y1="381.5" x2="1329.8" y2="207"/>
    <polygon fill="#FFFFFF" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="1217.5,261.5 1326.7,212 1434.5,261.5 1433.5,253.3 1332.6,203.7 1329.8,84.7 1324,91.3 1321.4,202.7 1219.5,255"/>
    <circle fill="#FFFFFF" stroke="#C4C4C4" stroke-width="4" cx="1327.4" cy="207" r="6.5"/>
    <!-- SMALL BUILDING RIGHT -->
    <rect x="1067" y="450.3" fill="#FFFFFF" stroke="#C4C4C4" stroke-width="4" width="57.5" height="10.7"/>
    <rect x="1056.1" y="474.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="79.5" height="50.8"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1056.1" y1="486.5" x2="1135.6" y2="486.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1056.1" y1="499.6" x2="1135.6" y2="499.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1056.1" y1="512.1" x2="1135.6" y2="512.1"/>
    <!-- LARGE BUILDING CENTER -->
    <rect x="708.3" y="321.7" fill="none" stroke="#C4C4C4" stroke-width="4" width="226.3" height="203.3"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="934.7" y1="321.7" x2="984.5" y2="370"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="984.5" y1="370" x2="984.5" y2="525"/>
    <rect x="728.3" y="356.5" fill="none" stroke="#C4C4C4" stroke-width="4" width="187.3" height="28.8"/>
    <rect x="728.3" y="409.8" fill="none" stroke="#C4C4C4" stroke-width="4" width="187.3" height="28.5"/>
    <rect x="728.3" y="461.8" fill="none" stroke="#C4C4C4" stroke-width="4" width="187.3" height="27.8"/>
    <!-- ZIGZAG WIRES -->
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1038.5" y1="145.8" x2="1081.1" y2="145.8"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1063.1" y1="157.1" x2="1101.3" y2="157.1"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="296" y1="132" x2="345.8" y2="132"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="324.9" y1="144.6" x2="379.6" y2="144.6"/>
    <!-- LARGE WIND TURBINE CENTER - 3 HUBS GREEN -->
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="959.6" y1="196.7" x2="959.6" y2="345.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1013.7" y1="299.3" x2="965.4" y2="351.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="895.3" y1="247" x2="959.6" y2="282.9"/>
    <circle fill="none" stroke="#2FC16A" stroke-width="4" cx="1024.6" cy="286.7" r="37.8"/>
    <circle fill="none" stroke="#2FC16A" stroke-width="4" cx="960" cy="169.9" r="45.6"/>
    <circle fill="none" stroke="#2FC16A" stroke-width="4" cx="883.8" cy="239.5" r="32.5"/>
    <!-- TALL BUILDING LEFT -->
    <rect x="468.7" y="224.7" fill="none" stroke="#C4C4C4" stroke-width="4" width="152.7" height="300.3"/>
    <rect x="485.7" y="254.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="29" height="242"/>
    <rect x="531" y="254.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="28" height="242"/>
    <rect x="575.7" y="254.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="28.3" height="242"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="468.7" y1="224.7" x2="422.7" y2="254.3"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="422.7" y1="254.3" x2="422.7" y2="525"/>
    <!-- MEDIUM BUILDING LEFT -->
    <rect x="258.3" y="304" fill="none" stroke="#C4C4C4" stroke-width="4" width="112.7" height="221"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="371" y1="304" x2="404.8" y2="325.7"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="404.8" y1="325.7" x2="404.8" y2="525"/>
    <rect x="273.1" y="319.3" fill="none" stroke="#C4C4C4" stroke-width="4" width="82.5" height="18.9"/>
    <rect x="273.1" y="354.5" fill="none" stroke="#C4C4C4" stroke-width="4" width="82.5" height="18.6"/>
    <rect x="273.1" y="389.7" fill="none" stroke="#C4C4C4" stroke-width="4" width="82.5" height="18"/>
    <rect x="273.1" y="422.5" fill="none" stroke="#C4C4C4" stroke-width="4" width="82.5" height="19.8"/>
    <rect x="273.1" y="457.6" fill="none" stroke="#C4C4C4" stroke-width="4" width="82.5" height="18.5"/>
    <rect x="273.1" y="491.4" fill="none" stroke="#C4C4C4" stroke-width="4" width="82.5" height="18.8"/>
    <!-- CHIMNEY TOWER -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M639.8,525v-91.8c0,0,3.3-16.8,24.8-16.8c26.3,0,29,15.3,29,15.3V525"/>
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M649.6,449.5h33.9v-8.9c0,0-0.3-14.9-16.9-14.9c-16.4,0-16.9,13.6-16.9,13.6V449.5z"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="657.8" y1="437.6" x2="666.6" y2="448.4"/>
    <!-- LIGHTNING BOLT -->
    <polygon fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" points="672,470.7 656.8,499.8 665.3,498 659.9,517.3 676.3,489.5 668.4,491.6"/>
    <!-- CHIMNEY LEFT -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M303.1,304c0,0,1.5-8.6,7.7-8.6s19.4,0,19.4,0s5.1,0,5.7,8.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="320.5" y1="273.5" x2="320.5" y2="295.4"/>
    <!-- SOLAR PANEL LEFT -->
    <polygon fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" points="269,273.5 371.3,273.5 389,205.1 286,205.1"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="298.6" y1="205.1" x2="281.8" y2="273.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="311.4" y1="205.1" x2="294.5" y2="273.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="324.1" y1="205.1" x2="307.5" y2="273.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="320.5" y1="273.5" x2="337.4" y2="205.1"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="350.6" y1="205.1" x2="332.8" y2="273.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="345.4" y1="273.5" x2="363.1" y2="205.1"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="376.1" y1="205.1" x2="358.8" y2="273.5"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="272.2" y1="260.6" x2="374.6" y2="260.4"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="275.9" y1="245.9" x2="378.4" y2="246"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="279.4" y1="231.8" x2="382.1" y2="231.8"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="282.9" y1="217.4" x2="385.7" y2="217.4"/>
    <!-- SOLAR PANEL RIGHT -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M1120.3,351.4c0,0,1.5-8.6,7.7-8.6s19.4,0,19.4,0s5.1,0,5.7,8.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1137.7" y1="320.9" x2="1137.7" y2="342.9"/>
    <polygon fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" points="1086.2,320.9 1188.4,320.9 1206.2,252.6 1103.2,252.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1115.8" y1="252.6" x2="1098.9" y2="320.9"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1128.6" y1="252.6" x2="1111.7" y2="320.9"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1141.3" y1="252.6" x2="1124.7" y2="320.9"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1137.7" y1="320.9" x2="1154.6" y2="252.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1167.8" y1="252.6" x2="1149.9" y2="320.9"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1162.6" y1="320.9" x2="1180.3" y2="252.6"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1193.3" y1="252.6" x2="1175.9" y2="320.9"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1089.4" y1="308" x2="1191.8" y2="307.9"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1093" y1="293.4" x2="1195.6" y2="293.4"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1096.6" y1="279.2" x2="1199.3" y2="279.2"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1100.1" y1="264.8" x2="1202.9" y2="264.8"/>
    <!-- SMALL CLOUDS -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M481.3,224.7h32.2c0,0,4.3-2,2.9-7.4c-1.6-6.1-8.9-4.4-8.9-4.4s1.3-12-10.1-11.8c-10.1,0.2-9.3,9.5-9.3,9.5s-9-0.5-9.7,6.4C477.9,222.3,481.3,224.7,481.3,224.7z"/>
    <!-- TURBINE 1 (x=488) GREEN ANIMATED -->
    <g class="sc-w1">
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="488.9" y1="131.5" x2="488.9" y2="206.8"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="512.4" y1="176.6" x2="489.3" y2="201.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="460.3" y1="153.7" x2="488.9" y2="169.5"/>
      <circle fill="none" stroke="#2FC16A" stroke-width="4" cx="517.4" cy="170.9" r="16.6"/>
      <circle fill="none" stroke="#2FC16A" stroke-width="4" cx="488.8" cy="120.9" r="19.8"/>
      <circle fill="none" stroke="#2FC16A" stroke-width="4" cx="455.9" cy="151" r="14.4"/>
    </g>
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M533.5,224.7h32.2c0,0,4.3-2,2.9-7.4c-1.6-6.1-8.9-4.4-8.9-4.4s1.3-12-10.1-11.8c-10.1,0.2-9.3,9.5-9.3,9.5s-9-0.5-9.7,6.4C530,222.3,533.5,224.7,533.5,224.7z"/>
    <!-- PERSON -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M993.3,496.3h29.1v12.4c0,0-0.8,12.1-14.5,12.2c-13.7,0.1-14.5-12.3-14.5-12.3V496.3z"/>
    <circle fill="none" stroke="#C4C4C4" stroke-width="4" cx="1007.8" cy="482.7" r="13.4"/>
    <circle fill="none" stroke="#C4C4C4" stroke-width="4" cx="1008" cy="459.7" r="8.6"/>
    <circle fill="none" stroke="#C4C4C4" stroke-width="4" cx="1008" cy="445.6" r="5.3"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="1018.4" y1="517.1" x2="1022.7" y2="525"/>
    <line fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" x1="997.2" y1="517.1" x2="993" y2="525"/>
    <!-- TURBINE 2 (x=594) GREEN ANIMATED -->
    <g class="sc-w2">
      <path fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" d="M561.1,212.7c0,0-1.3-7.1,5-10.7s12.5,0.9,12.5,0.9s6.1-10.8,15.8-6.2c8.4,4,5.9,12.2,5.9,12.2s6.2-2.2,9.3,3.8c3.4,6.8-1.8,12-1.8,12"/>
      <path fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" d="M594.5,182.1c0,0,10,1.8,12.6-14.5s-0.1-44.1-1.5-50.3S601,90,594.5,90c-6.3,0-10,23-10.4,27.1c-0.5,5.7-4.1,34.6-1.9,51.4C584.2,182.8,594.5,182.1,594.5,182.1z"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="594.9" y1="105.5" x2="594.9" y2="196.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="603.4" y1="124.4" x2="595.4" y2="132.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="585.9" y1="133.4" x2="594.5" y2="142.1"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="603.4" y1="143.6" x2="595.4" y2="152.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="585.4" y1="152.4" x2="594.9" y2="161.6"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="603.4" y1="162.6" x2="595.4" y2="171.8"/>
    </g>
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M547.6,201.2c0,0-3.2-6.7-10.3-5.7c-7.6,1-9.9,7.1-9.9,7.1s-5.5-4.4-11.6-1.5c-5.5,2.6-5.3,7.9-5.3,7.9l-3.4-0.7"/>
    <!-- TURBINE 3 (x=773) GREEN ANIMATED -->
    <g class="sc-w3">
      <path fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" d="M773.1,292.1c0,0,10,1.8,12.6-14.5s-0.1-44.1-1.5-50.3s-4.6-27.4-11.1-27.4c-6.3,0-10,23-10.4,27.1c-0.5,5.7-4.1,34.6-1.9,51.4C762.8,292.8,773.1,292.1,773.1,292.1z"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="773.5" y1="215.5" x2="773.5" y2="297.8"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="782" y1="234.4" x2="774" y2="242.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="764.5" y1="243.5" x2="773.1" y2="252.1"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="782" y1="253.6" x2="774" y2="262.4"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="764" y1="262.4" x2="773.5" y2="271.6"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="782" y1="272.6" x2="774" y2="281.8"/>
    </g>
    <!-- SMALL CLOUD near turbine 3 -->
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M760.5,321.7h32.2c0,0,4-4,2.6-9.3c-1.6-6.1-9.3-4.4-9.3-4.4s0.6-10.3-10.8-10.1c-10.1,0.2-8.4,12-8.4,12s-8.1-2.1-8.8,4.9C757.5,320,760.5,321.7,760.5,321.7z"/>
    <path fill="none" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M764.4,309.3c0,0,1.3-7.1-5-10.7s-12.5,0.9-12.5,0.9s-6.1-10.8-15.8-6.2c-8.4,4-5.9,12.2-5.9,12.2s-6.2-2.2-9.3,3.8c-3.4,6.8,1.8,12,1.8,12"/>
    <!-- TREE/BUSH -->
    <path fill="#FFFFFF" stroke="#C4C4C4" stroke-width="4" stroke-linecap="round" d="M394.5,525c0,0-6.1-6.8-4-14.9s8.9-9.4,8.9-9.4s-1.7-5.7,4.8-9.9c6.1-3.9,10.4-2.1,10.4-2.1s1.9-15.1,17.3-15.4s17.3,13.9,17.3,13.9s5.3-2.9,11.1-0.4c4.2,1.8,5.3,5.5,5.3,5.5s14.5-7.6,22.4,8.4c6.8,13.6-8.5,24.3-8.5,24.3H394.5z"/>
    <!-- BUTTERFLIES GREEN ANIMATED -->
    <g class="sc-bf1"><path fill="none" stroke="#2FC16A" stroke-width="5" stroke-linecap="round" d="M664.1,201.3c0,0,5.5-0.8,9.5,2.1c4,2.8,6.1,9,6.1,9s0.5-6.6,5.5-10.1c4.2-2.9,9.7-1.1,9.7-1.1"/></g>
    <g class="sc-bf2"><path fill="none" stroke="#2FC16A" stroke-width="5" stroke-linecap="round" d="M702.7,185.5c0,0,4.3-0.6,8.3,2.2s4.5,6.9,4.5,6.9s-0.1-4.3,4.8-7.8c4.2-2.9,9.1-1.1,9.1-1.1"/></g>
    <!-- CAR GREEN ANIMATED WITH SPINNING WHEELS -->
    <g class="sc-car">
      <path fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M1112.8,519.8c0,0-3.8-26.7,21.5-29c25.3-2.3,25.6,29,25.6,29h76.4c0,0-4.1-27.8,23.7-29.1c24.8-1.2,23.2,29.1,23.2,29.1h25.3l2.3-9.5l2.4-9.5c0,0,1.8-9.8-4.9-12.7c-6.7-2.8-25.7-9.7-44.2-13.3c-18.5-3.7-26.7-2.3-26.7-2.3s-21.3-22.2-56.3-24s-53.9,16-53.9,16l-38.5-0.3v6.2l3.7,4l-0.2,21.8l-3.5,4.8v13.7l11,5.2H1112.8z"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="1092.4" y1="486.9" x2="1107.9" y2="486.9"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="1107.9" y1="486.9" x2="1107.9" y2="495.3"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="1107.1" y1="495.3" x2="1093.9" y2="495.3"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="1167" y1="511.5" x2="1228.1" y2="511.5"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="1155.3" y1="490.5" x2="1167.4" y2="490.5"/>
      <line fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" x1="1187.1" y1="490.5" x2="1199.2" y2="490.5"/>
      <path fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" d="M1130.3,474.2h38.5l-1.4-15.1c0,0-11.8,1.2-20.6,4.5C1138.1,466.9,1130.3,474.2,1130.3,474.2z"/>
      <path fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" d="M1174.9,474.2h53.8c0,0-15.6-12.9-27.6-15.7c-12-2.8-28-0.8-28-0.8L1174.9,474.2z"/>
      <path fill="none" stroke="#2FC16A" stroke-width="4" stroke-linecap="round" d="M1312.9,501.9c0,0-5.6-3.8-9.8-4.6c-4.2-0.8-6.1,0.7-6.9,2.3c-0.8,1.6-1.5,5.5,0.8,6.5s14,3.4,14,3.4"/>
      <g class="sc-wl">
        <circle fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" cx="1135.6" cy="514.5" r="17.8"/>
        <circle fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" cx="1135.6" cy="514.5" r="9"/>
        <line stroke="#2FC16A" stroke-width="3" stroke-linecap="round" x1="1135.6" y1="496.7" x2="1135.6" y2="532.3"/>
        <line stroke="#2FC16A" stroke-width="3" stroke-linecap="round" x1="1117.8" y1="514.5" x2="1153.4" y2="514.5"/>
      </g>
      <g class="sc-wr">
        <circle fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" cx="1259.7" cy="514.2" r="17.8"/>
        <circle fill="#FFFFFF" stroke="#2FC16A" stroke-width="4" cx="1259.7" cy="514.2" r="9"/>
        <line stroke="#2FC16A" stroke-width="3" stroke-linecap="round" x1="1259.7" y1="496.4" x2="1259.7" y2="532"/>
        <line stroke="#2FC16A" stroke-width="3" stroke-linecap="round" x1="1242" y1="514.2" x2="1277.4" y2="514.2"/>
      </g>
    </g>
  </svg>`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
ENDOFFILE
echo "done"</parameter>
<parameter name="description">Generar el texto del cambio completo</parameter>
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
  </div>
</div>


<section className="hero" id="inicio">
  <div className="hero-inner">
    <div>
      <div className="hero-chip">
        <div className="chip-dot"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg></div>
        <span>ISO 14064-1 · GHG Protocol</span>
      </div>
      <h1>Controla el <em style={{fontStyle:'normal',color:'var(--g)'}}>impacto ambiental</em><br/>de tu organización</h1>
      <h2>Gestión de huella de carbono<br/>bajo estándares internacionales.</h2>
      <p className="hero-desc">CarboMetrics te ayuda a medir, gestionar y reportar tus emisiones de gases de efecto invernadero bajo normas internacionales reconocidas.</p>
      <div className="hero-btns">
        <a href="#productos" className="btn-primary">VER NUESTROS PRODUCTOS</a>
      </div>
      <div className="hero-badges">
        <span className="badge-label">BASADO EN:</span>
        <span className="badge">ISO 14064-1</span>
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
    <h2 className="sec-title rv">Protegemos los recursos del planeta<br/>a través de cada <em>empresa comprometida.</em></h2>
    <p className="sec-sub rv">Nuestra organización promueve la innovación y la ciencia para que empresas de todo el mundo puedan medir, gestionar y reducir su huella de carbono.</p>
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
        <div className="pillar-desc">Cada organización que usa CarboMetrics suma un paso concreto hacia la sostenibilidad y la reducción de su impacto ambiental.</div>
      </div>
    </div>
  </div>
</section>


<section className="section" id="productos">
  <div className="inner">
    <span className="sec-tag rv">Productos</span>
    <h2 className="sec-title rv">Una plataforma online,<br/><em>una solución tecnológica.</em></h2>
    <p className="sec-sub rv">Mide y gestiona tus emisiones de carbono con herramientas alineadas a estándares internacionales.</p>
    <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginTop:'32px', marginBottom:'24px'}}>
      <div className="pillar rv" style={{textAlign:'left'}}>
        <div className="pillar-icon" style={{margin:'0 0 14px'}}>
          <svg viewBox="0 0 24 24" style={{width:'24px',height:'24px',stroke:'var(--g)',fill:'none',strokeWidth:'1.8'}}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <div className="pillar-title">Inventario GEI</div>
        <div className="pillar-desc">Alcances 1, 2 y 3 con cálculo automático de emisiones por factura.</div>
      </div>
      <div className="pillar rv d1" style={{textAlign:'left'}}>
        <div className="pillar-icon" style={{margin:'0 0 14px'}}>
          <svg viewBox="0 0 24 24" style={{width:'24px',height:'24px',stroke:'var(--g)',fill:'none',strokeWidth:'1.8'}}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <div className="pillar-title">Por instalación</div>
        <div className="pillar-desc">Gestiona emisiones por sucursal o planta con desglose detallado.</div>
      </div>
      <div className="pillar rv d2" style={{textAlign:'left'}}>
        <div className="pillar-icon" style={{margin:'0 0 14px'}}>
          <svg viewBox="0 0 24 24" style={{width:'24px',height:'24px',stroke:'var(--g)',fill:'none',strokeWidth:'1.8'}}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div className="pillar-title">Reporte verificable</div>
        <div className="pillar-desc">Informe técnico con QR público, listo para auditoría externa.</div>
      </div>
    </div>

    <div className="rv" style={{background:'var(--g-pale)',border:'2px solid var(--g)',borderRadius:'16px',padding:'32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'2rem',flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
        <div style={{width:'60px',height:'60px',background:'var(--g)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg viewBox="0 0 24 24" style={{width:'30px',height:'30px',fill:'none',stroke:'white',strokeWidth:'1.8'}} strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
        </div>
        <div>
          <div style={{fontSize:'22px',fontWeight:'800',letterSpacing:'-.4px',marginBottom:'4px',color:'var(--black)'}}>Carbo<span style={{color:'var(--g)'}}>Metrics</span></div>
          <div style={{fontSize:'11px',fontWeight:'700',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--g)',marginBottom:'10px'}}>Gestión de huella de carbono</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <span style={{fontSize:'11px',background:'var(--g-light)',color:'var(--g-dark)',fontWeight:'600',padding:'4px 10px',borderRadius:'4px'}}>ISO 14064-1</span>
            <span style={{fontSize:'11px',background:'var(--g-light)',color:'var(--g-dark)',fontWeight:'600',padding:'4px 10px',borderRadius:'4px'}}>GHG Protocol</span>
            <span style={{fontSize:'11px',background:'var(--g-light)',color:'var(--g-dark)',fontWeight:'600',padding:'4px 10px',borderRadius:'4px'}}>IPCC AR6</span>
          </div>
        </div>
      </div>
      <a href="https://www.carbometrics.site/login" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'var(--g)',color:'white',fontSize:'14px',fontWeight:'700',padding:'14px 28px',borderRadius:'var(--r)',textDecoration:'none',whiteSpace:'nowrap',transition:'background .2s'}} onMouseOver={e=>(e.currentTarget.style.background='var(--g-dark)')} onMouseOut={e=>(e.currentTarget.style.background='var(--g)')}>
        Iniciar sesión →
      </a>
    </div>
    <p className="login-note rv" style={{marginTop:'16px'}}>¿Primera vez? <a href="#contacto">Contáctanos</a> para solicitar acceso.</p>
  </div>
</section>


<section className="section" id="como">
  <div className="inner">
    <span className="sec-tag rv">Cómo funciona</span>
    <h2 className="sec-title rv">Tu camino hacia la<br/><em>sostenibilidad ambiental</em></h2>
    <p className="sec-sub rv">Tres pasos simples para medir, gestionar y reducir tu huella de carbono organizacional.</p>
    <div className="how-grid">
      <div className="how-card rv">
        <span className="how-step">Paso 01</span>
        <div className="how-icon"><svg viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
        <div className="how-title">Inventario de Datos</div>
        <div className="how-desc">Registra tus fuentes de emisión por Alcances 1, 2 y 3. La plataforma sugiere los factores de emisión correctos según tu sector y país.</div>
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
        <div className="how-desc">Genera el informe técnico ISO 14064-1 listo para auditoría. Demuestra tu compromiso ambiental con un reporte verificable y con código QR público.</div>
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
        <div className="norma-badge"><div className="norma-badge-dot"></div><span>IPCC AR6</span></div>
        <div className="norma-badge"><div className="norma-badge-dot"></div><span>Net Zero</span></div>
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
      <div className="norma-card">
        <div className="norma-num">IV</div>
        <div className="norma-title">Remociones y Sumideros</div>
        <div className="norma-desc">Proyectos de remoción de carbono (reforestación, biocarbón, etc.) conforme a la cláusula 5.3 de ISO 14064-1.</div>
      </div>
    </div>
  </div>
</section>


<section className="section" id="planes">
  <div className="inner center">
    <span className="sec-tag rv">Planes · CarboMetrics</span>
    <h2 className="sec-title rv">Elige el plan adecuado<br/>para tu <em>organización.</em></h2>
    <p className="sec-sub rv" style={{margin: '0 auto 12px'}}>Sin contratos largos. Cancela cuando quieras.</p>
    <p className="sec-sub rv" style={{margin: '0 auto 44px', fontSize: '14px'}}>¿Tienes dudas sobre qué plan elegir? <a href="#contacto" style={{color: 'var(--g)', fontWeight: '700', textDecoration: 'none'}}>Contáctanos</a> y te asesoramos.</p>
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
          <span className="faq-q">¿Necesito conocimientos técnicos para usar CarboMetrics?</span>
          <span className="faq-icon"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
        </button>
        <div className="faq-body">No. CarboMetrics está diseñado para que cualquier persona pueda registrar consumos y generar reportes sin necesitar formación técnica previa. Solo necesitas tus facturas y datos de actividad.</div>
      </div>
      <div className="faq-item">
        <button className="faq-btn">
          <span className="faq-q">¿Puedo cambiar de plan más adelante?</span>
          <span className="faq-icon"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
        </button>
        <div className="faq-body">Sí. Puedes cambiar de plan en cualquier momento sin perder tu historial de datos ni tener que crear una cuenta nueva. Contacta al administrador para gestionar el cambio.</div>
      </div>
      <div className="faq-item">
        <button className="faq-btn">
          <span className="faq-q">¿Qué normas siguen los reportes de CarboMetrics?</span>
          <span className="faq-icon"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
        </button>
        <div className="faq-body">CarboMetrics genera reportes alineados a ISO 14064-1:2018 y al GHG Protocol Corporate Standard, usando factores de emisión del IPCC AR6, DEFRA 2023 y EPA 2023.</div>
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
          <div><strong>Estado</strong><span>Operativo</span></div>
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


<section style={{padding:'64px 5% 0',background:'var(--white)',overflow:'hidden'}}>
  <div style={{maxWidth:'var(--max)',margin:'0 auto',textAlign:'center'}}>
    <span style={{fontSize:'11px',fontWeight:'700',color:'var(--g)',letterSpacing:'.12em',textTransform:'uppercase',display:'block',marginBottom:'10px'}}>Ecosistema de emisiones</span>
    <h2 style={{fontSize:'clamp(22px,3vw,34px)',fontWeight:'800',color:'var(--black)',letterSpacing:'-.6px',marginBottom:'8px'}}>Cada fuente de emisión,<br/><span style={{color:'var(--g)'}}>bajo control.</span></h2>
    <p style={{fontSize:'14px',color:'var(--muted)',marginBottom:'0'}}>CarboMetrics conecta tus actividades con su huella real de carbono.</p>
  </div>
  <div style={{position:'relative',width:'100%',height:'340px',overflow:'hidden'}}>
    <style>{`
      @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      @keyframes floatUpSlow{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes spinBlade{from{transform:rotate(0deg) translateX(0)}to{transform:rotate(360deg) translateX(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes dash{0%{stroke-dashoffset:200}100%{stroke-dashoffset:0}}
      .ico-float{animation:floatUp 4s ease-in-out infinite}
      .ico-float-slow{animation:floatUpSlow 6s ease-in-out infinite}
      .blade{transform-origin:50% 50%;animation:spin 2s linear infinite}
      .blade2{transform-origin:50% 50%;animation:spin 3s linear infinite}
      .pulse-dot{animation:pulse 2s ease-in-out infinite}
      .dash-line{stroke-dasharray:200;animation:dash 3s linear infinite}
    `}</style>
    <svg viewBox="0 0 1200 320" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>

      {/* Suelo */}
      <rect x="0" y="290" width="1200" height="30" fill="#f3fdf6"/>
      <line x1="0" y1="290" x2="1200" y2="290" stroke="#2db84b" strokeWidth="2" strokeOpacity=".3"/>

      {/* Líneas de conexión animadas */}
      <line x1="200" y1="200" x2="600" y2="200" stroke="#2db84b" strokeWidth="1.5" strokeOpacity=".2" strokeDasharray="8 6" className="dash-line"/>
      <line x1="600" y1="200" x2="1000" y2="200" stroke="#2db84b" strokeWidth="1.5" strokeOpacity=".2" strokeDasharray="8 6" className="dash-line"/>

      {/* Fábrica izquierda */}
      <g className="ico-float-slow" style={{animationDelay:'0s'}}>
        <rect x="80" y="210" width="50" height="80" rx="3" fill="#e8f8ed" stroke="#2db84b" strokeWidth="1.5"/>
        <rect x="90" y="190" width="12" height="25" rx="2" fill="#2db84b" fillOpacity=".3"/>
        <rect x="108" y="180" width="12" height="35" rx="2" fill="#2db84b" fillOpacity=".5"/>
        <rect x="88" y="230" width="8" height="12" rx="1" fill="#2db84b" fillOpacity=".4"/>
        <rect x="100" y="230" width="8" height="12" rx="1" fill="#2db84b" fillOpacity=".4"/>
        <rect x="112" y="230" width="8" height="12" rx="1" fill="#2db84b" fillOpacity=".4"/>
        {/* Humo */}
        <circle cx="96" cy="172" r="8" fill="#2db84b" fillOpacity=".1" className="pulse-dot"/>
        <circle cx="114" cy="162" r="6" fill="#2db84b" fillOpacity=".08" className="pulse-dot" style={{animationDelay:'.5s'}}/>
        <text x="105" y="308" textAnchor="middle" fontSize="10" fill="#2db84b" fontWeight="700">Industria</text>
      </g>

      {/* Auto */}
      <g className="ico-float" style={{animationDelay:'.3s'}}>
        <rect x="230" y="255" width="70" height="30" rx="8" fill="#e8f8ed" stroke="#2db84b" strokeWidth="1.5"/>
        <rect x="245" y="240" width="42" height="20" rx="6" fill="#2db84b" fillOpacity=".3"/>
        <circle cx="248" cy="288" r="8" fill="#2db84b"/>
        <circle cx="282" cy="288" r="8" fill="#2db84b"/>
        <circle cx="248" cy="288" r="4" fill="white"/>
        <circle cx="282" cy="288" r="4" fill="white"/>
        <text x="265" y="308" textAnchor="middle" fontSize="10" fill="#2db84b" fontWeight="700">Transporte</text>
      </g>

      {/* Edificio oficinas */}
      <g className="ico-float-slow" style={{animationDelay:'1s'}}>
        <rect x="380" y="180" width="60" height="110" rx="3" fill="#e8f8ed" stroke="#2db84b" strokeWidth="1.5"/>
        <rect x="388" y="190" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".5"/>
        <rect x="403" y="190" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".5"/>
        <rect x="418" y="190" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".5"/>
        <rect x="388" y="210" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".3"/>
        <rect x="403" y="210" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".5"/>
        <rect x="418" y="210" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".3"/>
        <rect x="388" y="230" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".5"/>
        <rect x="403" y="230" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".3"/>
        <rect x="418" y="230" width="10" height="12" rx="1" fill="#2db84b" fillOpacity=".5"/>
        <rect x="400" y="260" width="20" height="30" rx="2" fill="#2db84b" fillOpacity=".3"/>
        <text x="410" y="308" textAnchor="middle" fontSize="10" fill="#2db84b" fontWeight="700">Electricidad</text>
      </g>

      {/* LOGO CENTRAL CarboMetrics */}
      <g className="ico-float" style={{animationDelay:'.5s'}}>
        <rect x="540" y="155" width="120" height="120" rx="16" fill="#2db84b"/>
        <circle cx="600" cy="215" r="35" fill="white" fillOpacity=".15"/>
        <path d="M590 228 C585 218 585 205 592 198 C598 192 608 191 614 196 C618 200 618 206 614 210 L608 207 C610 204 609 200 606 198 C602 196 597 198 594 202 C590 208 590 218 594 224 Z" fill="white"/>
        <path d="M580 235 C578 230 590 220 600 230 C607 237 600 245 593 240" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <text x="600" y="248" textAnchor="middle" fontSize="11" fill="white" fontWeight="800">CarboMetrics</text>
        <text x="600" y="262" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.7)">Inventario GEI</text>
      </g>

      {/* Aerogenerador */}
      <g style={{animationDelay:'0s'}}>
        <line x1="780" y1="290" x2="780" y2="180" stroke="#2db84b" strokeWidth="3" strokeOpacity=".5"/>
        <g className="blade" style={{transformOrigin:'780px 180px'}}>
          <line x1="780" y1="180" x2="780" y2="130" stroke="#2db84b" strokeWidth="3"/>
          <line x1="780" y1="180" x2="737" y2="205" stroke="#2db84b" strokeWidth="3"/>
          <line x1="780" y1="180" x2="823" y2="205" stroke="#2db84b" strokeWidth="3"/>
        </g>
        <circle cx="780" cy="180" r="6" fill="#2db84b"/>
        <text x="780" y="308" textAnchor="middle" fontSize="10" fill="#2db84b" fontWeight="700">Energía eólica</text>
      </g>

      {/* Panel solar */}
      <g className="ico-float" style={{animationDelay:'1.5s'}}>
        <rect x="900" y="220" width="80" height="50" rx="4" fill="none" stroke="#2db84b" strokeWidth="1.5"/>
        <line x1="933" y1="220" x2="933" y2="270" stroke="#2db84b" strokeWidth="1" strokeOpacity=".5"/>
        <line x1="967" y1="220" x2="967" y2="270" stroke="#2db84b" strokeWidth="1" strokeOpacity=".5"/>
        <line x1="900" y1="237" x2="980" y2="237" stroke="#2db84b" strokeWidth="1" strokeOpacity=".5"/>
        <line x1="900" y1="253" x2="980" y2="253" stroke="#2db84b" strokeWidth="1" strokeOpacity=".5"/>
        <rect x="901" y="221" width="31" height="15" rx="2" fill="#2db84b" fillOpacity=".2"/>
        <rect x="934" y="221" width="31" height="15" rx="2" fill="#2db84b" fillOpacity=".4"/>
        <rect x="901" y="238" width="31" height="15" rx="2" fill="#2db84b" fillOpacity=".4"/>
        <rect x="934" y="238" width="31" height="15" rx="2" fill="#2db84b" fillOpacity=".2"/>
        <rect x="901" y="255" width="31" height="14" rx="2" fill="#2db84b" fillOpacity=".3"/>
        <rect x="934" y="255" width="31" height="14" rx="2" fill="#2db84b" fillOpacity=".5"/>
        <text x="940" y="308" textAnchor="middle" fontSize="10" fill="#2db84b" fontWeight="700">Energía solar</text>
      </g>

      {/* Árbol / remoción */}
      <g className="ico-float-slow" style={{animationDelay:'2s'}}>
        <rect x="1070" y="250" width="10" height="40" rx="2" fill="#2db84b" fillOpacity=".5"/>
        <ellipse cx="1075" cy="230" rx="25" ry="28" fill="#e8f8ed" stroke="#2db84b" strokeWidth="1.5"/>
        <ellipse cx="1063" cy="242" rx="18" ry="20" fill="#e8f8ed" stroke="#2db84b" strokeWidth="1.5"/>
        <ellipse cx="1087" cy="242" rx="18" ry="20" fill="#e8f8ed" stroke="#2db84b" strokeWidth="1.5"/>
        <ellipse cx="1075" cy="222" rx="22" ry="24" fill="#d1f5da" stroke="#2db84b" strokeWidth="1.5"/>
        <text x="1075" y="308" textAnchor="middle" fontSize="10" fill="#2db84b" fontWeight="700">Remociones</text>
      </g>

      {/* Nubes decorativas */}
      <g fillOpacity=".06" fill="#2db84b">
        <ellipse cx="160" cy="100" rx="40" ry="18"/>
        <ellipse cx="185" cy="95" rx="30" ry="15"/>
        <ellipse cx="500" cy="80" rx="35" ry="15"/>
        <ellipse cx="525" cy="75" rx="25" ry="12"/>
        <ellipse cx="950" cy="110" rx="38" ry="16"/>
        <ellipse cx="975" cy="105" rx="28" ry="13"/>
      </g>

    </svg>
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
        <div className="footer-logo">Carbo<span>Metrics</span></div>
        <p>Innovación y ciencia para la gestión de la huella de carbono en organizaciones comprometidas con el planeta.</p>
        <div className="footer-tags">
          <span className="footer-tag">ISO 14064-1</span>
          <span className="footer-tag">GHG Protocol</span>
          <span className="footer-tag">Net Zero</span>
          <span className="footer-tag">IPCC AR6</span>
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
      <span className="footer-copy">© 2026 CarboMetrics · Carbométrica. Todos los derechos reservados. · Cochabamba, Bolivia</span>
    </div>
  </div>
</footer>


    </>
  );
}
