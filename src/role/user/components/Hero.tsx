import heroImg from "@/assets/images/tiktuy-hero.png";

export default function Hero() {
  return (
    // 👇 overflow-x-clip para cortar cualquier desborde lateral del contenido/sombras
    <section className="relative z-10 flex-1 flex flex-col gap-10 text-center pt-5 overflow-x-clip">
      {/* Título y descripción (sin cambios de tamaño) */}
      <div className="max-w-5xl mx-auto h-full px-4 pt-6">
        <h1 className="text-6xl font-extrabold mb-4 leading-snug">
          TIKTUY: LA PLATAFORMA QUE POTENCIA TU LOGÍSTICA
        </h1>
        <p className="font-roboto font-light text-gray-200 text-3xl">
          Un software todo en uno diseñado para ecommerce, couriers y repartidores.
        </p>
      </div>

      {/* Mockup pegado abajo, ancho completo y ratio constante */}
      <div className="mt-auto w-full">
        {/* 👇 sin padding lateral para no sumar ancho; centra con mx-auto */}
        <div className="mx-auto w-full max-w-screen-2xl border border-white/40 shadow-[0_0_25px_4px_rgba(255,255,255,0.6)] rounded-t-2xl">
          <div className="relative w-full overflow-hidden rounded-lg shadow-2xl aspect-[32/9]">
            <img
              src={heroImg}
              alt="Panel de control TIKTUY"
              className="absolute inset-0 w-full h-auto object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
