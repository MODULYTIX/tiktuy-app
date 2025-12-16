import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "@/auth/context/useAuth";
import {
  FaSignOutAlt,
  FaUsersCog,
  FaCashRegister,
  FaBoxes,
} from "react-icons/fa";
import { MdDashboard, MdSettings } from "react-icons/md";
import { RiMoneyDollarCircleLine, RiFileChartLine } from "react-icons/ri";
import { useEffect, useState } from "react";

import LOGOTIKTUY from "@/assets/logos/LOGO-TIKTUY-SIDEBAR.svg";
import type { JSX } from "react";
import Buttonx from "../common/Buttonx";

interface Props {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ Modal logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!isLogoutModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLogoutModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLogoutModalOpen]);

  const linksByRole: Record<
    string,
    Array<{
      to: string;
      label: string;
      icon: JSX.Element;
      modulo?: string;
    }>
  > = {
    admin: [
      { to: "/", label: "Panel de Control", icon: <MdDashboard /> },
      { to: "/usuarios", label: "Ventas", icon: <FaCashRegister /> },
      { to: "/reportes", label: "Stock / Sede", icon: <FaBoxes /> },
      {
        to: "/saldos",
        label: "Cuadre de Saldos",
        icon: <RiMoneyDollarCircleLine />,
      },
      { to: "/perfiles", label: "Perfiles", icon: <FaUsersCog /> },
      { to: "/reportes", label: "Reportes", icon: <RiFileChartLine /> },
      { to: "/configuracion", label: "Configuración", icon: <MdSettings /> },
    ],
    ecommerce: [
      {
        to: "/",
        label: "Panel de Control",
        icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" />,
      },
      {
        to: "/almacen",
        label: "Sede",
        icon: <Icon icon="hugeicons:warehouse" width="24" height="24" />,
        modulo: "stock",
      },
      {
        to: "/stock",
        label: "Stock de Productos",
        icon: <Icon icon="vaadin:stock" width="24" height="24" />,
        modulo: "stock",
      },
      {
        to: "/movimientos",
        label: "Movimientos",
        icon: (
          <Icon
            icon="icon-park-outline:cycle-movement"
            width="24"
            height="24"
          />
        ),
        modulo: "movimiento",
      },
      {
        to: "/pedidos",
        label: "Gestión de Pedidos",
        icon: (
          <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" />
        ),
        modulo: "pedidos",
      },
      {
        to: "/saldos",
        label: "Cuadre de Saldos",
        icon: <Icon icon="prime:wallet" width="24" height="24" />,
      },
      {
        to: "/perfiles",
        label: "Perfiles",
        icon: <Icon icon="hugeicons:access" width="24" height="24" />,
      },
      {
        to: "/reportes",
        label: "Reportes",
        icon: <Icon icon="carbon:report-data" width="24" height="24" />,
      },
    ],
    courier: [
      {
        to: "/",
        label: "Panel de Control",
        icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" />,
      },
      {
        to: "/almacen",
        label: "Sede",
        icon: <Icon icon="hugeicons:warehouse" width="24" height="24" />,
        modulo: "pedidos",
      },
      {
        to: "/stock",
        label: "Stock de Productos",
        icon: <Icon icon="vaadin:stock" width="24" height="24" />,
        modulo: "stock",
      },
      {
        to: "/movimientos",
        label: "Movimientos",
        icon: (
          <Icon
            icon="icon-park-outline:cycle-movement"
            width="24"
            height="24"
          />
        ),
      },
      {
        to: "/pedidos",
        label: "Gestión de Pedidos",
        icon: (
          <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" />
        ),
      },
      {
        to: "/zonas",
        label: "Zonas / Tarifas",
        icon: <Icon icon="solar:point-on-map-broken" width="24" height="24" />,
      },
      {
        to: "/cuadresaldo",
        label: "Cuadre de Saldos",
        icon: <Icon icon="prime:wallet" width="24" height="24" />,
      },
      {
        to: "/perfiles",
        label: "Perfiles",
        icon: <Icon icon="hugeicons:access" width="24" height="24" />,
      },
      {
        to: "/reportes",
        label: "Reportes",
        icon: <Icon icon="carbon:report-data" width="24" height="24" />,
      },
    ],
    motorizado: [
      {
        to: "/",
        label: "Panel de Control",
        icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" />,
      },
      {
        to: "/pedidos",
        label: "Gestión de Pedidos",
        icon: (
          <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" />
        ),
      },
      {
        to: "/cuadreSaldo",
        label: "Cuadre de Saldos",
        icon: <Icon icon="prime:wallet" width="24" height="24" />,
      },
      {
        to: "/reportes",
        label: "Reporte",
        icon: <Icon icon="carbon:report-data" width="24" height="24" />,
      },
    ],
  };

  const roleName = String(user?.rol?.nombre || "").toLowerCase();
  const isRepEcom = roleName === "representante_ecommerce";
  const isRepCour = roleName === "representante_courier";

  const basePath = isRepEcom
    ? "/ecommerce"
    : isRepCour
    ? "/courier"
    : roleName
    ? `/${roleName}`
    : "";

  let links: (typeof linksByRole)[keyof typeof linksByRole] = [];

  if (roleName === "trabajador") {
    links = [
      {
        to: "/panel",
        label: "Panel de Control",
        icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" />,
      },
      {
        to: "/almacen",
        label: "Sede",
        icon: <Icon icon="hugeicons:warehouse" width="24" height="24" />,
        modulo: "stock",
      },
      {
        to: "/stock",
        label: "Stock de productos",
        icon: <Icon icon="vaadin:stock" width="24" height="24" />,
        modulo: "stock",
      },
      {
        to: "/movimientos",
        label: "Movimientos",
        icon: (
          <Icon
            icon="icon-park-outline:cycle-movement"
            width="24"
            height="24"
          />
        ),
        modulo: "movimiento",
      },
      {
        to: "/pedidos",
        label: "Gestión de Pedidos",
        icon: (
          <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" />
        ),
        modulo: "pedidos",
      },
      {
        to: "/saldos",
        label: "Cuadre de Saldos",
        icon: <Icon icon="prime:wallet" width="24" height="24" />,
        modulo: "saldos",
      },
      {
        to: "/perfiles",
        label: "Perfiles",
        icon: <Icon icon="hugeicons:access" width="24" height="24" />,
        modulo: "perfiles",
      },
      {
        to: "/reportes",
        label: "Reportes",
        icon: <Icon icon="carbon:report-data" width="24" height="24" />,
        modulo: "reportes",
      },
    ];

    const modulosAsignados = user?.perfil_trabajador?.modulo_asignado
      ?.split(",")
      .map((m) => m.trim());
    links = modulosAsignados
      ? links.filter((l) => modulosAsignados.includes(l.modulo ?? ""))
      : [];
  } else if (isRepEcom) {
    links = (linksByRole["ecommerce"] || []).filter(
      (l) => l.to !== "/almacen" && l.label.toLowerCase() !== "sede"
    );
  } else if (isRepCour) {
    links = (linksByRole["courier"] || []).filter(
      (l) => l.to !== "/almacen" && l.label.toLowerCase() !== "sede"
    );
  } else if (roleName && roleName in linksByRole) {
    links = linksByRole[roleName];
  } else {
    links = [];
  }

  links = links.map((link) => ({ ...link, to: `${basePath}${link.to}` }));

  const ease = "ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <>
      <aside
        className={[
          "h-screen fixed top-0 left-0 z-40",
          "bg-white",
          "border-r border-gray-200/70",
          "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
          "overflow-x-hidden",
          // ✅ contenedor suave
          "transition-[width] duration-500 motion-reduce:transition-none",
          ease,
          "will-change-[width]",
          isOpen ? "w-64" : "w-[84px]",
        ].join(" ")}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={[
              "h-16 flex items-center",
              isOpen ? "justify-between px-3" : "justify-start px-2",
            ].join(" ")}
          >
            {isOpen && (
              <img
                src={LOGOTIKTUY}
                alt="logo tiktuy"
                className="h-6 w-auto object-contain select-none"
                draggable={false}
              />
            )}

            <button
              onClick={toggle}
              aria-label={isOpen ? "Contraer sidebar" : "Expandir sidebar"}
              aria-expanded={isOpen}
              className={[
                "grid place-items-center",
                "text-primary",
                "hover:bg-gray-100/80 active:bg-gray-100",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25",
                isOpen ? "h-10 w-10 rounded-xl" : "h-9 w-9 rounded-lg ml-2.5",
              ].join(" ")}
            >
              <span
                className={[
                  "transition-transform duration-500",
                  ease,
                  isOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
              >
                <Icon icon="octicon:sidebar-expand-24" width="22" height="22" />
              </span>
            </button>
          </div>

          {/* Enlaces */}
          <nav className="flex flex-col flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
            <div className="space-y-1">
              {links.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to.endsWith("/") || to.endsWith("/panel")}
                  title={!isOpen ? label : undefined}
                  style={{
                    gridTemplateColumns: isOpen ? "36px 1fr" : "36px 0fr",
                  }}
                  className={({ isActive }) =>
                    [
                      "group relative grid items-center",
                      "h-11 rounded-xl px-2.5",
                      // ✅ transición suave SIN saltos: solo grid cols + colores
                      "transition-[grid-template-columns] duration-500 motion-reduce:transition-none",
                      ease,
                      "transition-colors",
                      "text-primary",
                      isActive ? "bg-[#EEF4FF]" : "hover:bg-gray-100/70",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Barra activa */}
                      <span
                        className={[
                          "absolute left-0 top-1/2 -translate-y-1/2",
                          "h-6 w-1 rounded-r-full bg-[#1E3A8A]",
                          "transition-opacity duration-200",
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-30",
                        ].join(" ")}
                      />

                      {/* Icon chip */}
                      <span
                        className={[
                          "grid place-items-center h-9 w-9 rounded-lg",
                          "transition-colors duration-200",
                          isActive
                            ? "bg-[#1E3A8A]/10"
                            : "group-hover:bg-[#1E3A8A]/8",
                        ].join(" ")}
                      >
                        <span className="text-[20px] leading-none flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
                          {icon}
                        </span>
                      </span>

                      {/* Label (siempre montado, sin w-0/ml brusco) */}
                      <span className="pl-2 min-w-0 overflow-hidden">
                        <span
                          className={[
                            "block truncate whitespace-nowrap",
                            "text-[13px] font-medium",
                            "transition-opacity duration-200",
                            isOpen ? "opacity-100" : "opacity-0",
                          ].join(" ")}
                        >
                          {label}
                        </span>
                      </span>

                      {/* Tooltip colapsado */}
                      {!isOpen && (
                        <span
                          className={[
                            "pointer-events-none absolute left-full ml-3",
                            "top-1/2 -translate-y-1/2",
                            "whitespace-nowrap",
                            "rounded-lg bg-gray-900 text-white",
                            "text-xs px-2.5 py-1.5",
                            "opacity-0 shadow-lg",
                            "transition-opacity duration-150",
                            "group-hover:opacity-100",
                          ].join(" ")}
                        >
                          {label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Footer (✅ sin saltos: reservamos espacio del texto versión) */}
          <div className="px-2 py-3 border-t border-gray-200/70">
            <p
              className={[
                "px-2 text-xs text-gray-400 mb-2 h-4", // ✅ reserva altura
                "transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0",
              ].join(" ")}
            >
              Versión 1.0
            </p>

            {/* Logout menos protagonista */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              title={!isOpen ? "Cerrar sesión" : undefined}
              style={{
                gridTemplateColumns: isOpen ? "36px 1fr" : "36px 0fr",
              }}
              className={[
                "group relative w-full grid items-center",
                "h-11 rounded-xl px-2.5",
                "transition-[grid-template-columns] duration-500",
                ease,
                "transition-colors duration-200",
                "text-gray-600 hover:text-red-600",
                "hover:bg-gray-100/70",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20",
              ].join(" ")}
            >
              <span
                className={[
                  "grid place-items-center h-9 w-9 rounded-lg",
                  "bg-gray-100 group-hover:bg-red-50",
                  "transition-colors duration-200",
                ].join(" ")}
              >
                <span className="text-[18px] leading-none flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
                  <FaSignOutAlt />
                </span>
              </span>

              <span className="min-w-0 overflow-hidden">
                <span
                  className={[
                    "block truncate whitespace-nowrap text-[13px] font-semibold",
                    "transition-opacity duration-200",
                    isOpen ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                >
                  Cerrar sesión
                </span>
              </span>

              {!isOpen && (
                <span
                  className={[
                    "pointer-events-none absolute left-full ml-3",
                    "top-1/2 -translate-y-1/2",
                    "whitespace-nowrap",
                    "rounded-lg bg-gray-900 text-white",
                    "text-xs px-2.5 py-1.5",
                    "opacity-0 shadow-lg",
                    "transition-opacity duration-150",
                    "group-hover:opacity-100",
                  ].join(" ")}
                >
                  Cerrar sesión
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Modal confirmación logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          {/* Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-desc"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_25px_70px_rgba(0,0,0,0.18)]"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-[#F7F8FA] border-b border-gray-200">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 grid place-items-center">
                  <Icon icon="solar:logout-2-linear" width="26" height="26" />
                </div>

                <h3
                  id="logout-title"
                  className="text-[16px] font-semibold text-gray-900"
                >
                  Confirmar cierre de sesión
                </h3>

                <p
                  id="logout-desc"
                  className="text-[13px] text-gray-500 max-w-[280px]"
                >
                  ¿Seguro que deseas salir? Tendrás que iniciar sesión
                  nuevamente.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-5">
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
                <Buttonx
                  label="Cancelar"
                  variant="tertiary"
                  onClick={() => setIsLogoutModalOpen(false)}
                />

                <Buttonx
                  label="Cerrar sesión"
                  variant="quartery"
                  icon="solar:logout-2-linear"
                  onClick={confirmLogout}
                  // ✅ “danger” suave (sin ser el centro de atención)
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
