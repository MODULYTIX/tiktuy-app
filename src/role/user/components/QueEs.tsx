import queEsImg from '@/assets/images/QueEs.png';
import TittleX from '../common/TittleX';

export default function QueEs() {
  return (
    <section className="w-full py-28 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        {/* 🟦 Texto Izquierda */}
        <div className="flex-1 h-full justify-center items-center max-w-xl">
          <h2 className=" mb-12">
            <TittleX>¿Qué es Tiktuy?</TittleX>
          </h2>
          <p className="font-normal text-gray-600 leading-relaxed text-lg">
            Nuestra plataforma ha sido diseñada especialmente para couriers,
            ecommerce y repartidores, permitiendo gestionar pedidos, asignar
            envíos y supervisar la operación en un solo lugar. Con TIKTUY,
            tienes control total de tu logística en una herramienta moderna,
            escalable y fácil de usar.
          </p>
        </div>

        <img
            src={queEsImg}
            alt="Qué es TIKTUY"
            className="relative z-10 w-[760px] max-w-full rounded-t-lg"
          />
      </div>
    </section>
  );
}
