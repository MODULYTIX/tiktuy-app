import logoA from '@/assets/logos/logo_desconocido.webp';
import logoShopify from '@/assets/logos/logo_shopify.webp';
import logoHycon from '@/assets/logos/logo_hycon.webp';

export default function NuestrosClientes() {
  return (
    <section className="w-full bg-[#1B1B1B] text-white py-16">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Título */}
        <header className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight">Nuestros clientes</h2>
          <div className="w-12 h-1.5 bg-[#3B82F6] mx-auto mt-3 rounded-full" />
        </header>

        {/* Logos */}
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-10 md:gap-16 opacity-90 hover:opacity-100 transition-opacity duration-300">
          {[logoA, logoShopify, logoHycon].map((logo, i) => (
            <img
              key={i}
              src={logo}
              alt={`Logo ${i + 1}`}
              className="h-10 md:h-12 object-contain"
            />
          ))}
        </div>
      </div>
    </section>

  );
}
