import Hero from "./Hero";
import logoTiktuy from "@/assets/logos/logo-tiktuy.webp";
import heroBg from "@/assets/images/hero-background.webp";

export default function Header() {
  return (
    <header
      id="inicio"
      className="relative h-screen w-screen overflow-hidden text-white flex flex-col"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1B3D8F_0%,#00163F_80%)] opacity-70 z-0" />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <nav className="relative z-10 flex items-center justify-between px-10 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src={logoTiktuy} alt="Tiktuy logo" className="h-6" />
        </div>
        <ul className="hidden md:flex gap-8 text-sm text-gray-300">
          <li><a href="#que-es" className="hover:text-white transition">¿QUÉ ES TIKTUY?</a></li>
          <li><a href="#beneficios" className="hover:text-white transition">Beneficios</a></li>
          <li><a href="#clientes" className="hover:text-white transition">Nuestros clientes</a></li>
          <li><a href="#quienes" className="hover:text-white transition">¿Quiénes participan?</a></li>
        </ul>
        <a
          href="#solicitar"
          className="bg-[#0070CE] hover:bg-[#005fae] text-white px-5 py-2 rounded-md text-sm transition"
        >
          Solicitar
        </a>
      </nav>

      <Hero />
    </header>
  );
}
