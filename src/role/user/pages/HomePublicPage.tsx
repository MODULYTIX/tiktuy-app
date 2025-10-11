import NuestrosClientes from '../components/NuestrosClientes';
import QuienesParticipan from '../components/QuienesParticipan';
import Solicitud from '../components/Solicitud';

export default function HomePublicPage() {
  return (
    <div>
      {/* <h1>Home</h1> */}
      <section className='flex justify-center'>
        <NuestrosClientes />
      </section>
      <section className="flex justify-center w-screen h-screen">
        <QuienesParticipan />
      </section>
      <section className="flex justify-center w-screen h-screen">
        <Solicitud />
      </section>
    </div>
  );
}
