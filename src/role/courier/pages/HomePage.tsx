// src/pages/courier/CourierHomePage.tsx
import { useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import PanelControlRepartidor from "@/shared/components/courier/panelControl/PanelControlRepartidorTable";
import PanelControlTable from "@/shared/components/courier/panelControl/PanelControlEcommerceTable";
import PanelControlInvitacion from "@/shared/components/courier/panelControl/PanelControlInvitacion";
import PanelControlRegistroEcommerce from "@/shared/components/courier/panelControl/PanelControlRegistroEcommerce";
import PanelControlRegistroRepartidor from "@/shared/components/courier/panelControl/PanelControlRegistroRepartidor";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

export default function CourierHomePage() {
  const [activeTab, setActiveTab] = useState<"ecommerce" | "motorizado">(
    "ecommerce"
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setReloadKey((k) => k + 1);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const sectionTitle = activeTab === "ecommerce" ? "Ecommerce" : "Repartidor";
  const sectionSubtitle =
    activeTab === "ecommerce"
      ? "Asociados con nuestra empresa"
      : "Gestiona tus repartidores (invitación y registro)";

  return (
    <div className="mt-8 flex flex-col gap-y-5">
      {/* Encabezado y Tabs */}
      <div className="flex justify-between items-center pb-5 border-b border-gray30">
        <Tittlex
          title="Panel de Control"
          description="Monitoreo de convenios y repartidores"
        />

        <div className="flex gap-3">
          {/* Toggle Ecommerce */}
          <Buttonx
            label="Ecommerce"
            icon="carbon:task-complete"
            variant={activeTab === "ecommerce" ? "secondary" : "tertiary"}
            onClick={() => setActiveTab("ecommerce")}
          />

          <span aria-hidden className="w-px self-stretch bg-gray30" />

          {/* Toggle Motorizado */}
          <Buttonx
            label="Motorizado"
            icon="solar:bill-list-broken"
            variant={activeTab === "motorizado" ? "secondary" : "tertiary"}
            onClick={() => setActiveTab("motorizado")}
          />
        </div>
      </div>

      {/* Encabezado de sección + acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">{sectionTitle}</h2>
          <p className="text-gray-600 text-sm">{sectionSubtitle}</p>
        </div>

        <div className="flex gap-3">
          {/* Invitar:
              - En tab "ecommerce": invita a ecommerce (compartir/solicitar)
              - En tab "motorizado": invita a motorizado (flujo Courier -> Motorizado) */}
          <Buttonx
            label="Invitar"
            icon="mdi:share-variant-outline"
            variant="outlined"
            onClick={openModal}
          />

          {/* Registrar:
              - En tab "ecommerce": registrar ecommerce
              - En tab "motorizado": registrar repartidor */}
          <Buttonx
            icon="mdi:plus-box-outline"
            label={
              activeTab === "ecommerce"
                ? "Registrar Ecommerce"
                : "Registrar Repartidor"
            }
            variant="secondary"
            onClick={openDrawer}
          />
        </div>
      </div>

      {/* Tabla dinámica */}
      {activeTab === "ecommerce" ? (
        <PanelControlTable key={`ecom-${reloadKey}`} />
      ) : (
        // En esta vista Courier, PanelControlRepartidor se centra en invitar/gestionar motorizados.
        // No pasamos ecommerceId aquí (no es necesario para invitar motorizados).
        <PanelControlRepartidor key={`moto-${reloadKey}`} />
      )}

      {/* Modal de invitación */}
      {isModalOpen && (
        <PanelControlInvitacion onClose={closeModal} activeTab={activeTab} />
      )}

      {/* Drawer de registro */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-30 z-50 flex justify-end"
          onClick={closeDrawer}
        >
          <div
            className="w-auto bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab === "ecommerce" ? (
              <PanelControlRegistroEcommerce onClose={closeDrawer} />
            ) : (
              <PanelControlRegistroRepartidor onClose={closeDrawer} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
