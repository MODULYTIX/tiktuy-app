import { useCallback, useState } from "react";
import { Icon } from "@iconify/react";
import PanelControlRepartidor from "@/shared/components/courier/panelControl/PanelControlRepartidorTable";
import PanelControlTable from "@/shared/components/courier/panelControl/PanelControlEcommerceTable";
import PanelControlInvitacion from "@/shared/components/courier/panelControl/PanelControlInvitacion";
import PanelControlRegistroEcommerce from "@/shared/components/courier/panelControl/PanelControlRegistroEcommerce";
import PanelControlRegistroRepartidor from "@/shared/components/courier/panelControl/PanelControlRegistroRepartidor";

export default function CourierHomePage() {
  const [activeTab, setActiveTab] = useState<"ecommerce" | "motorizado">(
    "ecommerce"
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Clave para forzar que la tabla se remonte (y haga refetch) al cerrar el drawer.
  const [reloadKey, setReloadKey] = useState(0);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // Forzamos refresco de tabla tras cerrar (por si se registró un nuevo ecommerce).
    setReloadKey((k) => k + 1);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <div className="mt-6 px-4">
      {/* Encabezado y Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-[#1A237E]">
            Panel de Control
          </h1>
          <p className="text-gray-600 text-sm">
            Administra y visualiza el estado de tus pedidos en cada etapa del
            proceso
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={`flex items-center gap-2 px-6 py-2 rounded border transition ${
              activeTab === "ecommerce"
                ? "bg-[#1A237E] text-white"
                : "bg-white text-[#1A237E] border-[#1A237E]"
            }`}
            onClick={() => setActiveTab("ecommerce")}
          >
            <Icon icon="lucide:layout-dashboard" />
            Ecommerce
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-2 rounded border transition ${
              activeTab === "motorizado"
                ? "bg-[#1A237E] text-white"
                : "bg-white text-[#1A237E] border-[#1A237E]"
            }`}
            onClick={() => setActiveTab("motorizado")}
          >
            <Icon icon="lucide:truck" />
            Motorizado
          </button>
        </div>
      </div>

      {/* Encabezado de sección + botones */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-black">
            {activeTab === "ecommerce" ? "Ecommerce" : "Motorizado"}
          </h2>
          <p className="text-gray-600 text-sm">
            {activeTab === "ecommerce"
              ? "Asociados con nuestra empresa"
              : "Repartidores registrados en la plataforma"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openModal}
            className="flex items-center gap-2 border px-4 py-2 rounded text-sm hover:bg-gray-50"
          >
            <Icon icon="mdi:share-variant-outline" />
            Invitar
          </button>
          <button
            onClick={openDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            <Icon icon="mdi:plus-box-outline" />
            {activeTab === "ecommerce"
              ? "Registrar Ecommerce"
              : "Registrar Repartidor"}
          </button>
        </div>
      </div>

      {/* Tabla dinámica */}
      {activeTab === "ecommerce" ? (
        // clave para forzar refetch al cerrar drawer
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
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-30 z-50 flex justify-end"
          onClick={closeDrawer}
        >
          <div
            className="w-[450px] bg-white p-6 overflow-y-auto"
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
