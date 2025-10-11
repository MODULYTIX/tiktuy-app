import { BiMap, BiPhone } from 'react-icons/bi';
import TittleX from '../common/TittleX';
import { AiOutlineMail } from 'react-icons/ai';
import { GiCube } from 'react-icons/gi';
import { BsSendArrowUp } from 'react-icons/bs';

export default function Solicitud() {
  return (
    <div className="flex flex-col">
      {/* Título principal con subrayado corto (usa tu TittleX) */}
      <TittleX className="text-5xl">Solicitar</TittleX>

      <div className="mt-6 flex flex-col lg:flex-row gap-8">
        {/* Columna izquierda */}
        <div className="flex-1 max-w-[600px] space-y-6">
          <div className="space-y-3">
            <h1 className="leading-tight">
              <span className="block text-5xl font-semibold">
                <span className="text-[#FF8A00]">Conéctese</span>{' '}
                <span className="text-[#0057A3]">con Nosotros</span> Hoy
              </span>
            </h1>
            <p className="text-gray-600">
              ¿Listo para llevar su logística al siguiente nivel? Contáctenos hoy mismo para
              descubrir cómo nuestras soluciones personalizadas y nuestra experiencia en el sector
              pueden transformar su cadena de suministro.
            </p>
          </div>

          {/* Cards de contacto */}
          <div className="flex flex-wrap gap-4 text-[#0057A3] mt-40">
            <div className="px-6 py-4 border rounded-xl border-[#99BCDA] min-w-[260px] flex-1">
              <div className="flex gap-2 items-center mb-2">
                <span className="p-2 rounded-full bg-[#E6EEF6]">
                  <BiPhone className="text-xl" />
                </span>
                <p className="font-semibold">Telefono</p>
              </div>
              <p className="text-gray-700">(+51) 987 654 321</p>
            </div>

            <div className="px-6 py-4 border rounded-xl border-[#99BCDA] min-w-[260px] flex-1">
              <div className="flex gap-2 items-center mb-2">
                <span className="p-2 rounded-full bg-[#E6EEF6]">
                  <AiOutlineMail className="text-xl" />
                </span>
                <p className="font-semibold">E-mail</p>
              </div>
              <p className="text-gray-700">contacto@tiktuy.lat</p>
            </div>

            <div className="px-6 py-4 border rounded-xl border-[#99BCDA] min-w-[260px] flex-[1_1_100%]">
              <div className="flex gap-2 items-center mb-2">
                <span className="p-2 rounded-full bg-[#E6EEF6]">
                  <BiMap className="text-xl" />
                </span>
                <p className="font-semibold">Dirección</p>
              </div>
              <p className="text-gray-700 uppercase">
                AV. VENEZUELA 132, CERCADO DE AREQUIPA
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="w-full lg:max-w-[640px] rounded-2xl border border-[#99BCDA] p-6 lg:p-8 shadow-sm">
          {/* Datos personales */}
          <section className="space-y-4">
            <div className="border-b border-[#99BCDA] pb-3">
              <p className="flex items-center gap-2 text-gray-800 font-semibold">
                <GiCube className="text-[#0057A3]" />
                Datos Personales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Nombres</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese sus nombres"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Apellido Paterno</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su apellido paterno"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Apellido Materno</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su apellido materno"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">E-mail</label>
                <input
                  type="email"
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su E-mail"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">DNI</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su DNI"
                />
              </div>

              {/* Teléfono con prefijo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Teléfono</label>
                <div className="h-10 rounded-md border border-[#99BCDA] flex overflow-hidden">
                  <span className="px-3 flex items-center border-r border-[#99BCDA] text-sm">🇵🇪 (+51)</span>
                  <input
                    className="flex-1 px-3 text-sm outline-none"
                    placeholder="Ingrese su teléfono"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Datos de la empresa */}
          <section className="space-y-4 mt-6">
            <div className="border-b border-[#99BCDA] pb-3">
              <p className="flex items-center gap-2 text-gray-800 font-semibold">
                <GiCube className="text-[#0057A3]" />
                Datos de la empresa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Nombre Comercial</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su nombre comercial"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">RUC</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su RUC"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Representante</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Ingrese su nombre de representante"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Departamento</label>
                <select className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none bg-white focus:ring-2 focus:ring-[#99BCDA]">
                  <option>Seleccione su departamento</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Ciudad</label>
                <select className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none bg-white focus:ring-2 focus:ring-[#99BCDA]">
                  <option>Seleccione su ciudad</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">Dirección</label>
                <input
                  className="h-10 rounded-md border border-[#99BCDA] px-3 text-sm outline-none focus:ring-2 focus:ring-[#99BCDA]"
                  placeholder="Enter your first name"
                />
              </div>
            </div>
          </section>

          {/* Botón enviar */}
          <div className="flex justify-center mt-8">
            <button
              className="
                flex items-center gap-2 bg-[#0057A3] text-white px-6 py-2 rounded-md
                font-semibold shadow-sm hover:brightness-95 active:scale-[0.99]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#99BCDA]
              "
            >
              Enviar solicitud
              <BsSendArrowUp className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
