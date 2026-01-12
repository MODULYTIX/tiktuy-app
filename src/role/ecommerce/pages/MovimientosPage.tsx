// src/pages/ecommerce/movimientos/RegistroMovimientoPage.tsx
import { useCallback, useEffect, useState } from "react";

import type { Producto } from "@/services/ecommerce/producto/producto.types";
import MovimientoRegistroFilters, {
  type Filters,
} from "@/shared/components/ecommerce/movimientos/MovimientoRegistroFilters";
import MovimientoRegistroTable from "@/shared/components/ecommerce/movimientos/MovimientoRegistroTable";
import MovimientoValidacionTable from "@/shared/components/ecommerce/movimientos/MovimientoValidacionTable";

import CrearMovimientoModal from "@/shared/components/ecommerce/CrearMovimientoModal";
import VerMovimientoModal from "@/shared/components/ecommerce/movimientos/VerMovimientoModal";

import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

import type { MovimientoEcommerceFilters } from "@/shared/components/ecommerce/movimientos/MoviminentoValidadoFilter";
import MovimientoValidadoFilter from "@/shared/components/ecommerce/movimientos/MoviminentoValidadoFilter";

import ModalSlideRight from "@/shared/common/ModalSlideRight";

export default function RegistroMovimientoPage() {
  const { notify } = useNotification();

  const [selectedProductsMap, setSelectedProductsMap] = useState<
    Record<string, Producto>
  >({});

  const [modalOpen, setModalOpen] = useState(false);

  // Tabs
  const [modalMode, setModalMode] = useState<"registro" | "validacion">(
    "registro"
  );

  // Filtros del REGISTRO
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: "",
    categoria_id: "",
    estado: "",
    nombre: "",
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: "",
  });

  // Filtros para VALIDACIÓN
  const [filtersValidacion, setFiltersValidacion] =
    useState<MovimientoEcommerceFilters>({
      estado: "",
      fecha: "",
      q: "",
    });

  // Modal VER
  const [verOpen, setVerOpen] = useState(false);
  const [verData, setVerData] = useState<Producto | null>(null);

  // Refresh trigger (contador simple para forzar recarga)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setTimeout(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 10);
  }, []);

  const closeCrear = () => setModalOpen(false);

  const closeVer = () => {
    setVerOpen(false);
    setVerData(null);
  };

  const handleSelectProducts = useCallback(
    ({
      pageProducts,
      selectedIds,
    }: {
      pageProducts: Producto[];
      selectedIds: string[];
    }) => {
      setSelectedProductsMap((prev) => {
        const next = { ...prev };
        const selectedSet = new Set(selectedIds);

        // Quitar deseleccionados de esta página
        pageProducts.forEach((p) => {
          if (!selectedSet.has(p.uuid)) {
            delete next[p.uuid];
          }
        });

        // Agregar / mantener seleccionados
        pageProducts.forEach((p) => {
          if (selectedSet.has(p.uuid)) {
            next[p.uuid] = p;
          }
        });

        return next;
      });
    },
    []
  );

  const selectedProducts = Object.values(selectedProductsMap);

  const handleOpenModalCrear = () => {
    if (selectedProducts.length === 0) {
      notify("Selecciona al menos un producto para continuar.", "error");
      return;
    }

    const almacenes = Array.from(
      new Set(
        selectedProducts
          .map((p) =>
            p.almacenamiento_id != null ? String(p.almacenamiento_id) : ""
          )
          .filter(Boolean)
      )
    );

    if (almacenes.length > 1) {
      notify(
        "No puedes seleccionar productos de diferentes sedes para un mismo movimiento.",
        "error"
      );
      return;
    }

    setModalOpen(true);
  };

  const handleViewProduct = (producto: Producto) => {
    setVerData(producto);
    setVerOpen(true);
  };

  // Al cambiar de tab, cerrar modales
  useEffect(() => {
    closeCrear();
    closeVer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalMode]);

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <Tittlex
          title="Movimientos"
          description={
            modalMode === "registro"
              ? "Realice nuevos movimientos de productos."
              : "Visualice y valide movimientos registrados."
          }
        />

        <div className="flex gap-2 items-center">
          <Buttonx
            label="Nuevo Movimiento"
            icon="carbon:asset-movement"
            variant={modalMode === "registro" ? "secondary" : "tertiary"}
            onClick={() => setModalMode("registro")}
          />

          <span className="block w-[1px] h-8 bg-primary"></span>

          <Buttonx
            label="Ver Movimientos / Validar"
            icon="hugeicons:validation"
            variant={modalMode === "validacion" ? "secondary" : "tertiary"}
            onClick={() => setModalMode("validacion")}
          />
        </div>
      </div>

      {modalMode === "registro" ? (
        <>
          <div className="space-y-5">
            <MovimientoRegistroFilters
              onFilterChange={setFilters}
              onNuevoMovimientoClick={handleOpenModalCrear}
            />

            <MovimientoRegistroTable
              key={`registro-${refreshTrigger}`}
              filters={filters}
              onSelectProducts={handleSelectProducts}
              onViewProduct={handleViewProduct}
              refreshTrigger={refreshTrigger}
            />


          </div>

          {/* Modal CREAR */}
          <ModalSlideRight open={modalOpen} onClose={closeCrear}>
            <CrearMovimientoModal
              open={modalOpen}
              onClose={closeCrear}
              productos={selectedProducts}
              onSuccess={handleRefresh}
            />

          </ModalSlideRight>

          {/* Modal VER */}
          <ModalSlideRight open={verOpen} onClose={closeVer}>
            <VerMovimientoModal
              open={verOpen}
              onClose={closeVer}
              data={verData}
            />
          </ModalSlideRight>
        </>
      ) : (
        <>
          <MovimientoValidadoFilter
            value={filtersValidacion}
            onChange={(next) =>
              setFiltersValidacion({ ...filtersValidacion, ...next })
            }
            onClear={() =>
              setFiltersValidacion({
                estado: "",
                fecha: "",
                q: "",
              })
            }
          />

          <MovimientoValidacionTable
            key={`validacion-${refreshTrigger}`}
            filters={filtersValidacion}
            refreshTrigger={refreshTrigger}
          />
        </>
      )}
    </section>
  );
}
