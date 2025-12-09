import { useState, useEffect, useRef } from "react";
import AnimatedExcelMenu from "@/shared/components/ecommerce/AnimatedExcelMenu";
import StockFilters, { type StockFilterValue } from "@/shared/components/ecommerce/stock/StockFilters";
import StockTable from "@/shared/components/ecommerce/stock/StockTable";
import { useAuth } from "@/auth/context";
import { fetchProductosFiltrados, fetchProductosMovidos } from "@/services/ecommerce/producto/producto.api";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import ImportExcelFlow from "@/shared/components/ecommerce/excel/ImportExcelFlow";

import ProductoCrearModal from "@/shared/components/ecommerce/stock/ProductoCrearModal";
import ProductoVerModal from "@/shared/components/ecommerce/stock/ProductoVerModal";
import ProductoEditarModal from "@/shared/components/ecommerce/stock/ProductoEditarModal";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

import {
  downloadProductosTemplate,
  triggerBrowserDownload,
} from "@/services/ecommerce/exportExcel/Producto/exportProductoExcel.api";

type UiFilters = StockFilterValue & {
  order?: "new_first" | "price_asc" | "price_desc";
};

export default function StockPage() {
  const { token } = useAuth();

  // Modales
  const [openCrear, setOpenCrear] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openVer, setOpenVer] = useState(false);

  // Selección
  const [productoSel, setProductoSel] = useState<Producto | null>(null);

  const [productosAll, setProductosAll] = useState<Producto[]>([]);
  const [productosVisibles, setProductosVisibles] = useState<Producto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false); 

  const [filters, setFilters] = useState<UiFilters>({
    almacenamiento_id: "",
    categoria_id: "",
    estado: "",
    nombre: "",
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: "",
    movimientos_sedes: "",
    order: "new_first",
  });

  const debounceMs = 100;
  const debounceRef = useRef<number | null>(null);

  /** ========================
   * CARGA DE PRODUCTOS
   * ======================== */
  const cargarProductos = async (filtros = filters) => {
    if (!token) return;

    setLoadingProducts(true); // 👈 INICIA SKELETON

    try {
      // -------- PRODUCTOS MOVIDOS -------- //
      if (filtros.movimientos_sedes && Number(filtros.movimientos_sedes) > 0) {
        try {
          const movidosResp = await fetchProductosMovidos(token, {
            almacen_id: Number(filtros.movimientos_sedes),
            page: 1,
            perPage: 200,
          });

          const list = Array.isArray(movidosResp?.data)
            ? movidosResp.data
            : [];

          setProductosAll(list);
          return; // evitar carga normal
        } catch (err) {
          console.error("Error al cargar productos movidos:", err);
        }
      }

      // -------- PRODUCTOS NORMALES -------- //
      const serverData = await fetchProductosFiltrados(
        {
          ...filtros,
          movimientos_sedes: filtros.movimientos_sedes || undefined,
          order: filtros.order ?? "new_first",
        },
        token
      );

      const list = Array.isArray(serverData)
        ? serverData
        : Array.isArray(serverData?.data)
          ? serverData.data
          : [];

      setProductosAll(list);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoadingProducts(false); 
    }
  };

  /** ========================
   * DEBOUNCE FILTROS
   * ======================== */
  useEffect(() => {
    if (!token) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      cargarProductos();
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token]);

  /** ========================
   * FILTRADO + ORDEN CLIENTE
   * ======================== */
  useEffect(() => {
    const f = filters;
    const norm = (s?: string) => (s ?? "").toLowerCase().trim();

    const filtra = (p: Producto) => {
      if (f.almacenamiento_id && String(p.almacenamiento_id) !== String(f.almacenamiento_id))
        return false;

      if (f.categoria_id && String(p.categoria_id) !== String(f.categoria_id))
        return false;

      if (f.estado === "activo" && p?.estado?.nombre?.toLowerCase() !== "activo")
        return false;

      if (f.estado === "inactivo" && p?.estado?.nombre?.toLowerCase() !== "inactivo")
        return false;

      if (f.stock_bajo) {
        const stock = Number(p.stock);
        const minimo = Number(p.stock_minimo);
        if (!Number.isFinite(stock) || !Number.isFinite(minimo)) return false;
        if (!(stock < minimo)) return false;
      }

      if (f.search && f.search.trim()) {
        const q = norm(f.search);

        if (
          !norm(p.nombre_producto).includes(q) &&
          !norm(p.descripcion ?? "").includes(q) &&
          !norm(p.codigo_identificacion ?? "").includes(q)
        )
          return false;
      }

      return true;
    };

    const ordenar = (arr: Producto[]) => {
      if (f.precio_bajo) return [...arr].sort((a, b) => Number(a.precio) - Number(b.precio));
      if (f.precio_alto) return [...arr].sort((a, b) => Number(b.precio) - Number(a.precio));

      return [...arr].sort((a: any, b: any) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (at !== 0 || bt !== 0) return bt - at;
        return (b.id ?? 0) - (a.id ?? 0);
      });
    };

    setProductosVisibles(ordenar(productosAll.filter(filtra)));
  }, [productosAll, filters]);

  /** ========================
   * CRUD
   * ======================== */
  const handleProductoCreado = (producto: Producto) => {
    setProductosAll((prev) => [producto, ...prev]);
    setOpenCrear(false);
  };

  const handleProductoActualizado = (producto: Producto) => {
    setProductosAll((prev) =>
      prev.map((p) =>
        p.uuid === producto.uuid || p.id === producto.id ? producto : p
      )
    );
    setOpenEditar(false);
    setProductoSel(null);
  };

  /** ========================
   * HANDLERS
   * ======================== */
  const handleDescargarPlantilla = async () => {
    try {
      const res = await downloadProductosTemplate();
      triggerBrowserDownload(res);
    } catch (err) {
      console.error("Error al descargar plantilla:", err);
    }
  };

  const almacenamientoIdCreacion =
    filters.almacenamiento_id && !isNaN(Number(filters.almacenamiento_id))
      ? Number(filters.almacenamiento_id)
      : 0;

  /** ========================
   * RENDER
   * ======================== */
  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end">
        <Tittlex
          title="Stock de Productos"
          description="Control de Stock y Movimientos"
        />

        <div className="flex gap-2 items-end">
          <ImportExcelFlow token={token ?? ""} onImported={() => cargarProductos()}>
            {(openPicker) => (
              <AnimatedExcelMenu
                onTemplateClick={handleDescargarPlantilla}
                onImportClick={openPicker}
              />
            )}
          </ImportExcelFlow>

          <Buttonx
            label="Nuevo Producto"
            icon="tabler:cube-plus"
            variant="secondary"
            onClick={() => setOpenCrear(true)}
            className="font-light"
          />
        </div>
      </div>

      <StockFilters onFilterChange={(f) => setFilters(f)} />

      {/* TABLE */}
      <StockTable
        productos={productosVisibles}
        loading={loadingProducts}  
        filtrarInactivos={false}
        soloLectura={Boolean(filters.movimientos_sedes)}
        onVer={(p) => {
          setProductoSel(p);
          setOpenVer(true);
        }}
        onEditar={(p) => {
          setProductoSel(p);
          setOpenEditar(true);
        }}
      />

      {/* Crear */}
      <ProductoCrearModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreated={handleProductoCreado}
        almacenamientoId={almacenamientoIdCreacion}
      />

      {/* Editar */}
      <ProductoEditarModal
        open={openEditar}
        onClose={() => setOpenEditar(false)}
        initialData={productoSel}
        onUpdated={handleProductoActualizado}
      />

      {/* Ver */}
      <ProductoVerModal
        open={openVer}
        onClose={() => {
          setOpenVer(false);
          setProductoSel(null);
        }}
        data={productoSel}
      />
    </section>
  );
}
