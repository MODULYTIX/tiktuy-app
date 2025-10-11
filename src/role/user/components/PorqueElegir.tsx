import { useEffect, useRef, useState } from 'react';
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

  // refs de cada card
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const [visible, setVisible] = useState<boolean[]>(
    () => new Array(items.length).fill(false)
  );

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = [...prev];
          entries.forEach((entry) => {
            const idxStr = (entry.target as HTMLElement).dataset.index;
            if (idxStr == null) return;
            const idx = Number(idxStr);
            if (Number.isNaN(idx)) return;
            // 🔁 Reversible: visible cuando entra, false cuando sale
            next[idx] = entry.isIntersecting;
          });
          return next;
        });
      },
      {
        // un poco más estricto para que "asienten" antes de separarse
        threshold: 0.5,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Altura del "escalón" inicial (ajusta a tu gusto)
  const STEP_PX = 120;

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
        {/* Fondo: este color se usa para el efecto "unidas" */}
        <div className=" p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ">
            {items.map((it, i) => {
              const initialY = i * STEP_PX; // escalera descendente
              const settled = visible[i];

              // Cuando NO están asentadas (scroll/entrada), el fondo de la card
              // es IGUAL al fondo del contenedor => se ven "unidas".
              // Cuando sí están asentadas => cambian de bg, tienen borde/sombra.
              const cardBase =
                'relative will-change-transform transition-[transform,opacity,background-color] duration-700 ease-out';
              const cardSkin = settled
                ? 'bg-[#1476CC] '
                : 'bg-[#0E5A9C]'; // igual que el contenedor ⇒ unión visual

              const style: React.CSSProperties = settled
                ? { transform: 'translateY(0px)' }
                : { transform: `translateY(${initialY}px)` };

              return (
                <div
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  data-index={i}
                  className={[
                    cardBase,
                    cardSkin,
                    settled ? 'opacity-100' : 'opacity-0',
                    // Espaciado interno de la card real
                    'p-6 md:p-7 min-h-[220px] flex flex-col',
                  ].join(' ')}
                  style={{
                    ...style,
                    transitionDelay: `${i * 120}ms`, // efecto escalonado
                  }}
                >
                  <div className="mb-4">{it.icon}</div>
                  <h3 className="text-white text-2xl font-semibold leading-snug">
                    {it.title}
                  </h3>
                  <p className="text-[#E6EEF6] mt-3 leading-relaxed">
                    {it.desc}
                  </p>

                  {/* Decor: una línea sutil abajo cuando están separadas */}
                  <span
                    className={[
                      'absolute left-6 right-6 bottom-0 translate-y-1',
                      settled ? 'bg-white/10' : 'bg-transparent',
                    ].join(' ')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
