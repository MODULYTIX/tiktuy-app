// src/role/courier/pages/StockProducto.tsx
import { useEffect, useMemo, useState } from "react";
import { getCourierProductos } from "@/services/courier/producto/productoCourier.api";
import type { Producto } from "@/services/courier/producto/productoCourier.type";

import StockPedidoFilterCourier from "@/shared/components/courier/pedido/SockPedidoCourierFilter";
import ProductoDetalleModal from "@/shared/components/courier/stockProducto/ProductoCourierDetalleModal";
import TableStockProductoCourier from "@/shared/components/courier/stockProducto/TableStockProductoCourier";
import Tittlex from "@/shared/common/Tittlex";

export type StockFilters = {
  ecommerceOrigenId: string;
  categoriaId: string;
  estado: string;
  stockBajo: boolean;
  precioOrden: "" | "asc" | "desc";
  q: string;
};


export default function StockPage() {
  const [raw, setRaw] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<StockFilters>({
    ecommerceOrigenId: "",
    categoriaId: "",
    estado: "",
    stockBajo: false,
    precioOrden: "",
    q: "",
  });

  // modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Producto | null>(null);

  // ============================
  // CARGA DE STOCK (POR SEDE)
  // ============================
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token") || "";
        if (!token) {
          setError("Sesión no válida.");
          setRaw([]);
          return;
        }

        const data = await getCourierProductos(token);
        if (active) setRaw(data);
      } catch (e: any) {
        if (active) setError(e?.message || "No se pudo cargar el stock");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ============================
  // OPCIONES DE FILTRO
  // SOLO SEDES DEL COURIER
  // ============================

const options = useMemo(() => {
  const ecommerceMap = new Map<string, string>();

  raw.forEach((p) => {
    if (p.ecommerce_origen_id && p.ecommerce_origen_nombre) {
      ecommerceMap.set(
        String(p.ecommerce_origen_id),
        p.ecommerce_origen_nombre
      );
    }
  });

  const almacenes = Array.from(ecommerceMap.entries()).map(
    ([value, label]) => ({ value, label })
  );

  const categorias = Array.from(
    new Map(
      raw
        .filter((p) => p.categoria)
        .map((p) => [
          String(p.categoria!.id),
          p.categoria!.nombre ||
            p.categoria!.descripcion ||
            "Sin nombre",
        ])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const estados = [
    { value: "Activo", label: "Activo" },
    { value: "Descontinuado", label: "Descontinuado" },
  ];

  return {
    almacenes,
    categorias,
    estados,
  };
}, [raw]);


  // ============================
  // HANDLERS
  // ============================
  const handleView = (p: Producto) => {
    setSelected(p);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };

  // ============================
  // RENDER
  // ============================
  return (
    <section className="mt-8">
      <Tittlex
        title="Stock por sede"
        description="Control de stock físico por almacén del courier"
      />

      <div className="my-8">
        <StockPedidoFilterCourier
          filters={filters}
          onChange={setFilters}
          options={options}
          loading={loading}
        />
      </div>

      <TableStockProductoCourier
        data={raw}
        filters={filters}
        error={error}
        loading={loading}
        onView={handleView}
      />

      <ProductoDetalleModal
        isOpen={viewOpen}
        onClose={closeView}
        producto={selected}
      />
    </section>
  );
}
