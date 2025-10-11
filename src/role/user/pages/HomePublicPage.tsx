import Header from '../components/Header';
import NuestrosClientes from '../components/NuestrosClientes';
import PorqueElegir from '../components/PorqueElegir';
import QueEs from '../components/QueEs';
import QuienesParticipan from '../components/QuienesParticipan';
import Solicitud from '../components/Solicitud';

export default function HomePublicPage() {
  return (
    <div className="scroll-smooth max-w-[100vw] overflow-x-hidden">
      <Header />

      <section id="que-es" className="flex justify-center">
        <QueEs />
      </section>

      <section id="beneficios" className="flex justify-center">
        <PorqueElegir />
      </section>

      <section id="clientes" className="flex justify-center">
        <NuestrosClientes />
      </section>

      <section id="quienes" className="flex justify-center w-full">
        <QuienesParticipan />
      </section>

      <section id="solicitar" className="flex justify-center w-full">
        <Solicitud />
      </section>
    </div>
  );
}
