import { useEffect, useRef, useState } from "react";
import { HiHomeModern } from "react-icons/hi2";
import { FiUsers } from "react-icons/fi";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi";
import { PiGlobeHemisphereEastBold } from "react-icons/pi";

export default function PorqueElegir() {
  const items = [
    {
      icon: <HiHomeModern className="text-white text-5xl" />,
      title: "Centralización de Pedidos",
      desc:
        "Con TIKTUY, los couriers pueden consolidar en un solo lugar todos los pedidos provenientes de distintos ecommerce, asegurando un control ordenado y eficiente de cada solicitud.",
    },
    {
      icon: <FiUsers className="text-white text-5xl" />,
      title: "Gestión Simplificada para Couriers",
      desc:
        "La plataforma brinda a los couriers herramientas prácticas para organizar su operación diaria, reduciendo tiempos administrativos y facilitando el control de envíos en curso.",
    },
    {
      icon: <HiOutlineQuestionMarkCircle className="text-white text-5xl" />,
      title: "Soporte a Repartidores",
      desc:
        "TIKTUY ofrece a los motorizados una interfaz clara para recibir y completar entregas, asegurando que su trabajo sea más eficiente y con menos fricción.",
    },
    {
      icon: <PiGlobeHemisphereEastBold className="text-white text-5xl" />,
      title: "Expansión Nacional",
      desc:
        "TIKTUY facilita la coordinación logística entre varias ciudades del país, permitiendo a los couriers escalar sus operaciones con control y transparencia en cada destino.",
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
        entries.forEach((entry) => {
          const idxStr = (entry.target as HTMLElement).dataset.index;
          if (idxStr == null) return;
          const idx = Number(idxStr);
          if (Number.isNaN(idx)) return;

          if (entry.isIntersecting) {
            setVisible((prev) => {
              if (prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          }
        });
      },
      { threshold: 0.25 }
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
        <h2 className="text-3xl md:text-4xl font-semibold text-[#222]">
          ¿Por qué elegir TIKTUY para gestionar tu operación logística?
        </h2>
        <span className="block h-1.5 w-14 bg-[#2F7EC5] rounded-full mx-auto mt-3" />
      </div>

      {/* Franja azul con tarjetas */}
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="bg-[#0E5A9C] p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {items.map((it, i) => {
              const initialY = i * STEP_PX; // escalera descendente
              const style: React.CSSProperties = visible[i]
                ? { transform: "translateY(0px)" }
                : { transform: `translateY(${initialY}px)` };

              return (
                <div
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  data-index={i}
                  className={[
                    "flex flex-col",
                    visible[i] ? "opacity-100" : "opacity-0",
                    "transition-all duration-700 ease-out",
                  ].join(" ")}
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
