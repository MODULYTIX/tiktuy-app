import { useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import PanelControlRepartidor from "@/shared/components/courier/panelControl/PanelControlRepartidorTable";
import PanelControlTable from "@/shared/components/courier/panelControl/PanelControlEcommerceTable";
import PanelControlInvitacion from "@/shared/components/courier/panelControl/PanelControlInvitacion";
import PanelControlRegistroEcommerce from "@/shared/components/courier/panelControl/PanelControlRegistroEcommerce";
import PanelControlRegistroRepartidor from "@/shared/components/courier/panelControl/PanelControlRegistroRepartidor";

export default function CourierHomePage() {
  const [activeTab, setActiveTab] = useState<"ecommerce" | "motorizado">("ecommerce");
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
      : "Gestiona tus repartidores";

  return (
    <div className="mt-6 p-5 flex flex-col gap-y-5">
      {/* Encabezado y Tabs */}
      <div className="flex justify-between items-center pb-5 border-b border-gray30">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-[#1A237E]">Panel de Control</h1>
          <p className="text-gray-600 text-sm">Monitoreo de convenio e repartidores</p>
        </div>

        <div className="flex gap-3">
          {/* Toggle Ecommerce */}
          <button
            onClick={() => setActiveTab("ecommerce")}
            className={[
              "flex items-center gap-2 w-auto px-3 py-2.5 rounded font-bold transition",
              activeTab === "ecommerce"
                ? "bg-gray90 text-white hover:shadow-default"
                : "bg-gray20 text-gray90 hover:bg-gray30 hover:shadow-default",
            ].join(" ")}
          >
            <Icon icon="carbon:task-complete" width="20" height="20" />
            Ecommerce
          </button>

          <span aria-hidden className="w-px self-stretch bg-gray30" />

          {/* Toggle Motorizado */}
          <button
            onClick={() => setActiveTab("motorizado")}
            className={[
              "flex items-center gap-2 w-auto px-3  py-2.5 rounded font-bold transition",
              activeTab === "motorizado"
                ? "bg-gray90 text-white font-bold hover:shadow-default"
                : "bg-gray20 text-gray90 hover:bg-gray30 hover:shadow-default",
            ].join(" ")}
          >
            <Icon icon="solar:bill-list-broken" width="20" height="20" />
            Motorizado
          </button>
        </div>
      </div>

      {/* Encabezado de sección + acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">{sectionTitle}</h2>
          <p className="text-gray-600 text-sm">{sectionSubtitle}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openModal}
            className="flex items-center gap-2 border-2 font-bold border-black px-4 py-2 rounded text-sm hover:bg-gray10"
          >
            <Icon icon="mdi:share-variant-outline" />
            Invitar
          </button>

          <button
            onClick={openDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            <Icon icon="mdi:plus-box-outline" />
            {activeTab === "ecommerce" ? "Registrar Ecommerce" : "Registrar Repartidor"}
          </button>
        </div>
      </div>

      {/* Tabla dinámica */}
      {activeTab === "ecommerce" ? (
        <PanelControlTable key={`ecom-${reloadKey}`} />
      ) : (
        <PanelControlRepartidor key={`moto-${reloadKey}`} />
      )}

      {/* Modal Compartir */}
      {isModalOpen && (
        <PanelControlInvitacion onClose={closeModal} activeTab={activeTab} />
      )}

      {/* Drawer de registro */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-30 z-50 flex justify-end" onClick={closeDrawer}>
          <div className="w-[450px] bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
