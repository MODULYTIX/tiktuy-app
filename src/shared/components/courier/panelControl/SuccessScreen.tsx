// src/shared/components/SuccessScreen.tsx
import { useNavigate } from "react-router-dom";

type Props = {
  label: string;        // "Nombre comercial" | "Nombre del Repartidor"
  name: string;         // Electrosur | Nehemias Ceb...
  description: string;  // texto debajo del titular azul
  loginPath?: string;   // ruta a login (default: /login)
};

export default function SuccessScreen({
  label,
  name,
  description,
  loginPath = "/login",
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-3xl text-center">
        {/* Icono escudo */}
        <div className="mx-auto mb-4">
          <svg width="120" height="120" viewBox="0 0 24 24" className="mx-auto">
            <path fill="#FACC15" d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z"/>
            <path fill="#FFF" d="M10.5 14.5l-2.5-2.5l1.4-1.4l1.1 1.1l4-4l1.4 1.4z"/>
          </svg>
        </div>

        {/* Título gris + nombre amarillo */}
        <p className="text-2xl text-gray-600">
          {label}:{" "}
          <span className="font-semibold text-4xl text-yellow-500 break-words">
            {name}
          </span>
        </p>

        {/* Felicitación */}
        <h2 className="mt-6 text-3xl font-extrabold text-blue-600">
          ¡Felicidades, por tu registro!
        </h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
          {description}
        </p>

        {/* Botón único: ir a login */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => navigate(loginPath)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-5 py-2.5 text-white text-sm font-medium hover:bg-black"
          >
            Ir a iniciar sesión
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="M10 17l5-5l-5-5v10zM4 4h2v16H4z"/>
            </svg>
          </button>
        </div>

        {/* Paso completado */}
        <div className="mt-8 flex items-center justify-center gap-2 text-green-600">
          <span className="text-xl">✔</span>
          <span className="text-sm">Paso 3 de 3 completados</span>
        </div>
      </div>
    </div>
  );
}
