import Header from '../components/Header';
import NuestrosClientes from '../components/NuestrosClientes';
import PorqueElegir from '../components/PorqueElegir';
import QueEs from '../components/QueEs';
import QuienesParticipan from '../components/QuienesParticipan';
import Solicitud from '../components/Solicitud';

export default function HomePublicPage() {
  return (
    <div className="scroll-smooth">
      <Header />

      <section id="que-es" className="flex justify-center scroll-mt-24">
        <QueEs />
      </section>

      <section id="beneficios" className="flex justify-center scroll-mt-24">
        <PorqueElegir />
      </section>

      <section id="clientes" className="flex justify-center scroll-mt-24">
        <NuestrosClientes />
      </section>

      <section id="quienes" className="flex justify-center w-screen scroll-mt-24">
        <QuienesParticipan />
      </section>

      <section id="solicitar" className="flex justify-center w-screen scroll-mt-24">
        <Solicitud />
      </section>
    </div>
  );
}
