export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center h-screen text-center">
      <div>
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Acceso Denegado
        </h1>
        <p className="text-gray-700">
          No tienes permisos para acceder a esta página.
        </p>
        <p className="text-gray-700">
          Por favor, inicia sesión para continuar.
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
          <a href="/login">Iniciar Sesión</a>
        </button>
      </div>
    </div>
  );
}
