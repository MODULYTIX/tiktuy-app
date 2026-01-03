import { useState, useEffect, useRef } from "react";
import AnimatedExcelMenu from "@/shared/components/ecommerce/AnimatedExcelMenu";
import StockFilters, {
  type StockFilterValue,
} from "@/shared/components/ecommerce/stock/StockFilters";
import StockTable from "@/shared/components/ecommerce/stock/StockTable";
import { useAuth } from "@/auth/context";
import {
  fetchProductosFiltrados,
  fetchProductosMovidos,
} from "@/services/ecommerce/producto/producto.api";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import ImportExcelFlow from "@/shared/components/ecommerce/excel/ImportExcelFlow";

import ProductoCrearModal from "@/shared/components/ecommerce/stock/ProductoCrearModal";
import ProductoVerModal from "@/shared/components/ecommerce/stock/ProductoVerModal";
import ProductoEditarModal from "@/shared/components/ecommerce/stock/ProductoEditarModal";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";
import ModalSlideRight from "@/shared/common/ModalSlideRight";

import {
  downloadProductosTemplate,
  triggerBrowserDownload,
} from "@/services/ecommerce/exportExcel/Producto/exportProductoExcel.api";

type UiFilters = StockFilterValue & {
  order?: "new_first" | "price_asc" | "price_desc";
};

const PER_PAGE = 5;

export default function StockPage() {
  const { token } = useAuth();

  // ---------------- PAGINACIÓN ----------------
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ---------------- MODALES ----------------
  const [openCrear, setOpenCrear] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openVer, setOpenVer] = useState(false);

  // ---------------- DATA ----------------
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [productosVisibles, setProductosVisibles] = useState<Producto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ---------------- FILTROS ----------------
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

  const debounceMs = 150;
  const debounceRef = useRef<number | null>(null);

  /* ========================
     CARGA BACKEND
  ======================== */
  const cargarProductos = async (filtros = filters, pageToLoad = page) => {
    if (!token) return;

    setLoadingProducts(true);

    try {
      // -------- PRODUCTOS MOVIDOS -------- //
      if (filtros.movimientos_sedes && Number(filtros.movimientos_sedes) > 0) {
        const resp = await fetchProductosMovidos(token, {
          almacen_id: Number(filtros.movimientos_sedes),
          page: pageToLoad,
          perPage: PER_PAGE,
        });

        setProductosVisibles(resp?.data ?? []);
        setTotalPages(resp?.pagination?.totalPages ?? 1);
        return;
      }

      // -------- PRODUCTOS NORMALES -------- //
      const resp = await fetchProductosFiltrados(
        {
          ...filtros,
          q: filtros.search,
          page: pageToLoad,
          perPage: PER_PAGE,
          order: filtros.order ?? "new_first",
        },
        token
      );

      setProductosVisibles(resp?.data ?? []);
      setTotalPages(resp?.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ========================
     DEBOUNCE FILTROS
  ======================== */
  useEffect(() => {
    if (!token) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      setPage(1);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, token]);


  /* ========================
     CAMBIO DE PÁGINA
  ======================== */
  useEffect(() => {
    cargarProductos(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);


  /* ========================
     CRUD
  ======================== */
  const handleProductoCreado = (producto: Producto) => {
    setProductosVisibles((prev) => [producto, ...prev]);
    setOpenCrear(false);
  };

  const handleProductoActualizado = (producto: Producto) => {
    setProductosVisibles((prev) =>
      prev.map((p) =>
        p.uuid === producto.uuid || p.id === producto.id ? producto : p
      )
    );
    setOpenEditar(false);
    setProductoSel(null);
  };

  /* ========================
     HANDLERS
  ======================== */
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

  const closeEditar = () => {
    setOpenEditar(false);
    setProductoSel(null);
  };

  const closeVer = () => {
    setOpenVer(false);
    setProductoSel(null);
  };


  /* ========================
     RENDER
  ======================== */
  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end">
        <Tittlex
          title="Stock de Productos"
          description="Control de Stock y Movimientos"
        />

        <div className="flex gap-2 items-end">
          <ImportExcelFlow
            token={token ?? ""}
            onImported={() => cargarProductos()}
          >
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

      <StockTable
        productos={productosVisibles}
        loading={loadingProducts}
        filtrarInactivos={false}
        soloLectura={Boolean(filters.movimientos_sedes)}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onVer={(p) => {
          setProductoSel(p);
          setOpenVer(true);
        }}
        onEditar={(p) => {
          setProductoSel(p);
          setOpenEditar(true);
        }}
      />

      {/* MODALES SLIDE RIGHT */}
      <ModalSlideRight open={openCrear} onClose={() => setOpenCrear(false)}>
        <ProductoCrearModal
          onClose={() => setOpenCrear(false)}
          onCreated={handleProductoCreado}
          almacenamientoId={almacenamientoIdCreacion}
        />
      </ModalSlideRight>

      <ModalSlideRight open={openEditar} onClose={closeEditar}>
        <ProductoEditarModal
          onClose={closeEditar}
          initialData={productoSel}
          onUpdated={handleProductoActualizado}
        />
      </ModalSlideRight>

      <ModalSlideRight open={openVer} onClose={closeVer}>
        <ProductoVerModal onClose={closeVer} data={productoSel} />
      </ModalSlideRight>
    </section>
  );
}
