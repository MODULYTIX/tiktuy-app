export default function StockPedidoFilterCourier() {
  return (
    <div className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
      {/* Almacén */}
      <div>
        <label className="block mb-1 font-medium">Almacén</label>
        <select className="w-full border rounded px-3 py-2">
          <option value="">Seleccionar almacén</option>
          <option value="1">Almacén A</option>
          <option value="2">Almacén B</option>
        </select>
      </div>

      {/* Categoría */}
      <div>
        <label className="block mb-1 font-medium">Categoría</label>
        <select className="w-full border rounded px-3 py-2">
          <option value="">Seleccionar categoría</option>
          <option value="1">Categoría 1</option>
          <option value="2">Categoría 2</option>
        </select>
      </div>

      {/* Estado */}
      <div>
        <label className="block mb-1 font-medium">Estado</label>
        <select className="w-full border rounded px-3 py-2">
          <option value="">Seleccionar estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* Checkboxes */}
      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span className="text-xs">Stock bajo</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span className="text-xs">Precios bajos</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span className="text-xs">Precios altos</span>
        </label>
      </div>

      {/* Buscador y botón */}
      <div className="col-span-full flex items-center gap-2">
        <input
          type="text"
          placeholder="Buscar productos por nombre, descripción ó código."
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="button"
          className="border px-3 py-2 rounded hover:bg-gray-100 text-sm w-32">
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
