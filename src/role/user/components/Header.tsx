import Hero from "./Hero";
import logoTiktuy from "@/assets/logos/LOGO-TIKTUY.svg";
import heroBg from "@/assets/images/hbg.png";
import React from "react";
import { Link } from 'react-router';

const linkStyle =
  "transition duration-300 hover:text-white hover:[text-shadow:0_0_6px_#ffffff,0_0_12px_#ffffff,0_0_24px_#ffffff]";

// SIN offset: se alinea al tope del viewport
function goTo(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY; // ← sin restar nada
    window.scrollTo({ top, behavior: "smooth" });
  };
}

export default function Header() {
  return (
    <>
      <header
        id="inicio"
        className="relative min-h-screen w-full overflow-hidden overflow-x-clip text-white flex flex-col"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Degradado vertical */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_100%)] z-0" />

        {/* Navbar */}
        <nav className="w-full relative z-10 flex items-center justify-between px-6 py-6 md:px-10 md:py-10 backdrop-blur-md">
          <div className="flex items-center w-auto">
            <img src={logoTiktuy} alt="Tiktuy logo" className="h-6 md:h-8" />
          </div>

          <ul className="hidden md:flex gap-10 text-lg text-gray-400">
            <li><a href="#que-es" onClick={goTo("que-es")} className={linkStyle}>¿Qué es tiktuy?</a></li>
            <li><a href="#beneficios" onClick={goTo("beneficios")} className={linkStyle}>Beneficios</a></li>
            <li><a href="#clientes" onClick={goTo("clientes")} className={linkStyle}>Nuestros clientes</a></li>
            <li><a href="#quienes" onClick={goTo("quienes")} className={linkStyle}>¿Quiénes participan?</a></li>
            <li><a href="#solicitar" onClick={goTo("solicitar")} className={linkStyle}>Solicitar</a></li>
          </ul>

          <div className="flex items-center justify-end gap-4 w-auto">
            <Link
              to="/login"
              className="bg-[#0070CE] hover:bg-[#005fae] text-white px-5 py-2 md:px-10 rounded-md text-sm md:text-lg transition"
            >
              Iniciar sesión
            </Link>
          </div>
        </nav>

        {/* Hero ocupa el resto del alto */}
        <Hero />
      </header>
    </>
  );
}
