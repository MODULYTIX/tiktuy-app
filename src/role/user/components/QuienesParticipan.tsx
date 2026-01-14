import TittleX from '../common/TittleX';

// 🔹 Importa tus imágenes desde la carpeta de assets
import imgEcommerce from '@/assets/images/imgEcommerce.webp';
import imgCourier from '@/assets/images/imgCourier.webp';
import imgRepartidor from '@/assets/images/imgRepartidor.webp';

type Participante = {
  title: string;
  img: string;
  desc: string;
};

const PARTICIPANTES: Participante[] = [
  {
    title: 'Ecommerce',
    img: imgEcommerce,
    desc: `Son las tiendas en línea que registran sus pedidos en la plataforma.
Gracias a TIKTUY, pueden centralizar sus ventas, vender a contraentrega, enviar solicitudes de despacho y asegurar que sus productos lleguen al cliente final de manera eficiente.`,
  },
  {
    title: 'Courier',
    img: imgCourier,
    desc: `Constituyen el eje principal de la operación. 
Reciben los pedidos de los ecommerce, organizan la logística y gestionan el flujo de envíos, 
contando con un panel centralizado que facilita el control de cada etapa.`,
  },
  {
    title: 'Repartidores',
    img: imgRepartidor,
    desc: `Son los encargados de realizar las entregas físicas. Mediante la aplicación, reciben los pedidos asignados por el courier, completan la distribución 
y confirman la llegada del producto al destino final.`,
  },
];

export default function QuienesParticipan() {
  return (
    <div className="flex flex-col gap-10 items-center text-center h-auto w-screen py-25">
      {/* 🔹 Título principal */}
      <TittleX className="text-5xl mb-10">
        ¿Quiénes participan en TIKTUY?
      </TittleX>

      {/* 🔹 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-15 max-w-6xl">
        {PARTICIPANTES.map((p) => (
          <div
            key={p.title}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
          >
            {/* Imagen “superpuesta” */}
            <div className="-mb-7 relative h-64 w-full overflow-hidden rounded-t-xl z-10">
              <img
                src={p.img}
                alt={p.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Contenido */}
            <div className="p-4 text-left rounded-tr-[2rem] bg-white z-20 relative">
              <h3
                className={`font-bold text-lg mb-2 ${p.title === "Repartidores" ? "text-[#0057A3]" : "text-[#0057A3]"
                  }`}
              >
                {p.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
