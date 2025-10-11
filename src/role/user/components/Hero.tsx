import heroImg from "@/assets/images/tiktuy-hero.webp";

export default function Hero() {
  return (
    <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-snug">
          TIKTUY: LA PLATAFORMA QUE POTENCIA TU LOGÍSTICA
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-lg">
          Un software todo en uno diseñado para ecommerce, couriers y repartidores.
        </p>
      </div>

      <div className="relative mt-10 w-full max-w-5xl flex justify-center">
        <img
          src={heroImg}
          alt="Panel de control TIKTUY"
          className="max-w-full h-auto object-contain rounded-lg shadow-2xl md:max-h-[52vh]"
        />
      </div>
    </section>
  );
}
