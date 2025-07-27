export default function UnauthorizedPage() {
    return (
      <div className="flex items-center justify-center h-screen text-center">
        <div>
          <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-700">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }
  