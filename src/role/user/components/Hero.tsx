import heroImg from "@/assets/images/tiktuy-hero.webp";
import heroBg from "@/assets/images/hero-background.webp"; 

export default function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-24
                 text-white overflow-hidden bg-[#00163F]"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Capa de oscurecimiento para mejor contraste del texto */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Contenido principal */}
      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-snug">
          TIKTUY: LA PLATAFORMA QUE POTENCIA TU LOGÍSTICA
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-lg">
          Un software todo en uno diseñado para ecommerce, couriers y repartidores.
        </p>
      </div>

      {/* Imagen del dashboard */}
      <div className="relative mt-10 w-full max-w-5xl flex justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Panel de control TIKTUY"
          className="max-w-full h-auto object-contain rounded-lg shadow-2xl 
                     md:max-h-[520px] transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </section>
  );
}
