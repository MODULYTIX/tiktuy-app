import Hero from "./Hero";
import logoTiktuy from "@/assets/logos/logo-tiktuy.webp"

export default function Header() {
  return (
    <header className="relative w-full bg-[#0A0F1F] overflow-hidden">
      {/* Navbar superior */}
      <nav className="flex items-center justify-between px-10 py-4 text-white bg-[#111827]/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src={logoTiktuy} alt="Tiktuy logo" className="h-6" />
        </div>
        <ul className="hidden md:flex gap-8 text-sm text-gray-300">
          <li className="hover:text-white transition">¿QUÉ ES TIKTUY?</li>
          <li className="hover:text-white transition">Beneficios</li>
          <li className="hover:text-white transition">Nuestros clientes</li>
          <li className="hover:text-white transition">¿Quiénes participan?</li>
          <li className="hover:text-white transition">Solicitar</li>
        </ul>
        <button className="bg-[#0070CE] hover:bg-[#005fae] text-white px-5 py-2 rounded-md text-sm transition">
          Solicitar
        </button>
      </nav>

      {/* Hero Section */}
      <Hero />
    </header>
  );
}
