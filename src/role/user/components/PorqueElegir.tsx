import { HiHomeModern } from 'react-icons/hi2';
import { FiUsers } from 'react-icons/fi';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { PiGlobeHemisphereEastBold } from 'react-icons/pi';
import TittleX from '../common/TittleX';

export default function PorqueElegir() {
  const items = [
    {
      icon: <HiHomeModern className="text-white text-5xl" />,
      title: 'Centralización de Pedidos',
      desc: 'Con TIKTUY, los couriers pueden consolidar en un solo lugar todos los pedidos provenientes de distintos ecommerce, asegurando un control ordenado y eficiente de cada solicitud.',
    },
    {
      icon: <FiUsers className="text-white text-5xl" />,
      title: 'Gestión Simplificada para Couriers',
      desc: 'La plataforma brinda a los couriers herramientas prácticas para organizar su operación diaria, reduciendo tiempos administrativos y facilitando el control de envíos en curso.',
    },
    {
      icon: <HiOutlineQuestionMarkCircle className="text-white text-5xl" />,
      title: 'Soporte a Repartidores',
      desc: 'TIKTUY ofrece a los motorizados una interfaz clara para recibir y completar entregas, asegurando que su trabajo sea más eficiente y con menos fricción.',
    },
    {
      icon: <PiGlobeHemisphereEastBold className="text-white text-5xl" />,
      title: 'Expansión Nacional',
      desc: 'TIKTUY facilita la coordinación logística entre varias ciudades del país, permitiendo a los couriers escalar sus operaciones con control y transparencia en cada destino.',
    },
  ];

  return (
    <section className="w-full">
      {/* Título */}
      <div className="max-w-6xl mx-auto px-4 pt-10 text-center">
        <TittleX>
          ¿Por qué elegir TIKTUY para gestionar tu operación logística?
        </TittleX>
      </div>

      {/* Franja azul de fondo */}
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="p-2 md:p-6">
          {/* Grid sin gap para que estén unidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 bg-[#1476CC] overflow-hidden shadow-xl sticky top-4">
            {items.map((it, i) => {
              return (
                <div
                  key={i}
                  className="
                    relative 
                    p-8 
                    flex flex-col 
                    min-h-[280px]
                  "
                >
                  <div className="mb-6">
                    {it.icon}
                  </div>
                  <h3 className="text-white text-xl font-bold leading-snug mb-3">
                    {it.title}
                  </h3>
                  <p className="text-[#E6EEF6] text-sm md:text-base leading-relaxed opacity-90">
                    {it.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
