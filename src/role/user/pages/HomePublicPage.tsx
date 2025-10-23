import  { useEffect } from "react";
import Header from "../components/Header";
import NuestrosClientes from "../components/NuestrosClientes";
import PorqueElegir from "../components/PorqueElegir";
import QueEs from "../components/QueEs";
import QuienesParticipan from "../components/QuienesParticipan";
import Solicitud from "../components/Solicitud";

export default function HomePublicPage() {
  // Reveal suave al entrar cada sección (sin blur para evitar desbordes)
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            const delay = el.dataset.revealDelay || "0";
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("opacity-100", "translate-y-0", "scale-100");
            el.classList.remove("opacity-0", "translate-y-6", "scale-[0.98]");
            io.unobserve(el); // se revela una vez
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const baseReveal =
    "opacity-0 translate-y-6 scale-[0.98] transition-all duration-700 ease-out [will-change:transform,opacity] overflow-x-clip";

  return (
    // Wrapper seguro sin barras horizontales visibles
    <div className="scroll-smooth w-full overflow-x-clip">
      <Header />

      <section id="que-es" data-reveal className={`flex justify-center ${baseReveal}`}>
        <QueEs />
      </section>

      <section id="beneficios" data-reveal className={`flex justify-center ${baseReveal}`}>
        <PorqueElegir />
      </section>

      <section id="clientes" data-reveal className={`flex justify-center ${baseReveal}`}>
        <NuestrosClientes />
      </section>

      <section id="quienes" data-reveal className={`flex justify-center w-full ${baseReveal}`}>
        <QuienesParticipan />
      </section>

      <section id="solicitar" data-reveal className={`flex justify-center w-full ${baseReveal}`}>
        <Solicitud />
      </section>
    </div>
  );
}
