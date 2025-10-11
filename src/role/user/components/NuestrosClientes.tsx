import logoA from '@/assets/logos/logo_desconocido.webp';
import logoShopify from '@/assets/logos/logo_shopify.webp';
import logoHycon from '@/assets/logos/logo_hycon.webp';

export default function NuestrosClientes() {
  return (
    <section className="w-full bg-[#3F3F3F] text-white py-10">
      <div className="mx-auto max-w-6xl px-4 text-center">
        {/* Título */}
        <h2 className="text-3xl font-semibold">Nuestros clientes</h2>
        <div className="w-12 h-1.5 bg-[#3B82F6] mx-auto mt-2 rounded-full" />

        {/* Logos */}
        <div className="mt-8 flex flex-wrap justify-between items-center">
          <img
            src={logoA}
            alt="Cliente 1"
            className="h-10 object-contain opacity-90 hover:opacity-100 transition"
          />
          <img
            src={logoShopify}
            alt="Shopify"
            className="h-10 object-contain opacity-90 hover:opacity-100 transition"
          />
          <img
            src={logoHycon}
            alt="Hycon"
            className="h-10 object-contain opacity-90 hover:opacity-100 transition"
          />
        </div>
      </div>
    </section>
  );
}
