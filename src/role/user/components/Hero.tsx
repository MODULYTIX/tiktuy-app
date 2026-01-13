import heroImg from "@/assets/images/tiktuy-hero.png";

export default function Hero() {
  return (
    // 👇 overflow-x-clip para cortar cualquier desborde lateral del contenido/sombras
    <section className="relative z-10 flex-1 flex flex-col gap-6 md:gap-8 lg:gap-10 text-center pt-5 overflow-x-clip">
      {/* Título y descripción (sin cambios de tamaño) */}
      <div className="max-w-5xl mx-auto h-full px-4 pt-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-snug">
          TIKTUY: LA PLATAFORMA QUE POTENCIA TU LOGÍSTICA
        </h1>
        <p className="font-roboto font-light text-gray-200 text-lg sm:text-xl md:text-2xl lg:text-3xl">
          Un software todo en uno diseñado para ecommerce, couriers y repartidores.
        </p>
      </div>

      {/* Mockup pegado abajo, ancho completo y ratio constante */}
      <div className="mt-auto w-full">
        {/*  sin padding lateral para no sumar ancho; centra con mx-auto */}
        <div className="mx-auto w-full max-w-screen-2xl border border-white/40 shadow-[0_0_25px_4px_rgba(255,255,255,0.6)] rounded-t-2xl overflow-hidden">
          <div className="relative w-full overflow-hidden shadow-2xl ">
            <img
              src={heroImg}
              alt="Panel de control TIKTUY"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
