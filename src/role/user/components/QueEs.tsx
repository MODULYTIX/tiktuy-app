import queEsImg from '@/assets/images/quees.webp';
import TittleX from '../common/TittleX';

export default function QueEs() {
  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 px-6">
        {/* 🟦 Texto Izquierda */}
        <div className="flex-1 max-w-xl">
          <h2 className=" mb-12">
            <TittleX>¿QUÉ ES TIKTUY?</TittleX>
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            Nuestra plataforma ha sido diseñada especialmente para couriers,
            ecommerce y repartidores, permitiendo gestionar pedidos, asignar
            envíos y supervisar la operación en un solo lugar. Con TIKTUY,
            tienes control total de tu logística en una herramienta moderna,
            escalable y fácil de usar.
          </p>
        </div>

        <div className="flex-1 relative flex justify-center items-center">
          {/* círculo decorativo */}
          <div className="absolute w-[220px] h-[220px] bg-[#0057A3] rounded-full top-[-50px] right-[-50px] z-0"></div>

          <img
            src={queEsImg}
            alt="Qué es TIKTUY"
            className="relative z-10 w-[600px] max-w-full rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
