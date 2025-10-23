import Logo from "@/assets/logos/LOGO-TIKTUY.svg";

export default function Footer() {
  return (
    <footer className="relative text-gray-100" aria-label="TIKTUY website footer">
      {/* Fondo #1B1B1B con grid sutil + halos azulados */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: "#1B1B1B",
          backgroundImage:
            "radial-gradient(60% 50% at 100% 0%, rgba(46,123,255,0.12) 0%, rgba(46,123,255,0) 60%)," +
            "radial-gradient(60% 50% at 0% 100%, rgba(46,123,255,0.09) 0%, rgba(46,123,255,0) 60%)," +
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "cover, cover, 24px 24px, 24px 24px",
          backgroundPosition: "center, center, center, center",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Encabezado del footer: logo tipográfico + tagline */}
        <div className="border-b border-white/10 py-10">
          <img
              src={Logo}
              alt="Panel de control TIKTUY"
              className=""
            />
          <p className="mt-1 text-sm text-gray-300">
            la plataforma que potencia tu logística
          </p>
        </div>

        {/* Cuerpo: 4 columnas */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 py-10 md:grid-cols-4">
          {/* Producto (informativo, no clickeable) */}
          <section aria-labelledby="producto">
            <h3 id="producto" className="text-sm font-semibold text-white">
              Producto
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              {[
                "Panel de Control",
                "Almacén",
                "Stock de productos",
                "Movimientos",
                "Gestión de Pedidos",
                "Reportes",
              ].map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Para quiénes (informativo, no clickeable) */}
          <section aria-labelledby="para-quienes">
            <h3 id="para-quienes" className="text-sm font-semibold text-white">
              Para quiénes
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>Ecommerce</li>
              <li>Couriers</li>
              <li>Repartidores</li>
            </ul>
          </section>

          {/* Recursos (con enlaces + Iniciar sesión en nueva pestaña) */}
          <nav aria-labelledby="recursos">
            <h3 id="recursos" className="text-sm font-semibold text-white">
              Recursos
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>
                <a
                  href="#que-es"
                  className="rounded-sm transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  ¿Qué es TIKTUY?
                </a>
              </li>
              <li>
                <a
                  href="#beneficios"
                  className="rounded-sm transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Beneficios
                </a>
              </li>
              <li>
                <a
                  href="#clientes"
                  className="rounded-sm transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Nuestros clientes
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="rounded-sm transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </nav>

          {/* Contacto */}
          <section aria-labelledby="contacto">
            <h3 id="contacto" className="text-sm font-semibold text-white">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                {/* Teléfono */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="opacity-90"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 6 17a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2 2.11h3a2 2 0 0 1 2 1.72c.12.9.31 1.77.57 2.61a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.54-.23a2 2 0 0 1 2.11.45c.84.26 1.71.45 2.61.57A2 2 0 0 1 22 16.92Z" />
                </svg>
                <a href="tel:+51987654321" className="hover:text-white">
                  +51 987 654 321
                </a>
              </li>
              <li className="flex items-center gap-2">
                {/* Email */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="opacity-90"
                  aria-hidden="true"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
                <a href="mailto:contacto@tiktuy.lat" className="hover:text-white">
                  contacto@tiktuy.lat
                </a>
              </li>
              <li className="flex items-start gap-2">
                {/* Dirección */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mt-0.5 opacity-90"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <address className="not-italic">
                  Av. Venezuela 132, Cercado de Arequipa
                </address>
              </li>
            </ul>

            {/* Badges de confianza */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200/90">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="opacity-80"
                  aria-hidden="true"
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                +20 ecommerces integrados
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200/90">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="opacity-80"
                  aria-hidden="true"
                >
                  <path d="M3 7h13l5 5-5 5H3z" />
                </svg>
                +30 couriers conectados
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200/90">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="opacity-80"
                  aria-hidden="true"
                >
                  <path d="M4 17l6-6 4 4 6-6" />
                </svg>
                +50 repartidores activos
              </span>
            </div>
          </section>
        </div>

        {/* Barra inferior */}
        <div className="flex flex-col items-start gap-4 border-t border-white/10 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-400">
            © 2026 TIKTUY. Todos los derechos reservados.
          </p>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300"
            aria-label="Enlaces legales"
          >
            <a href="#terminos" className="hover:text-white">
              Términos
            </a>
            <a href="#privacidad" className="hover:text-white">
              Privacidad
            </a>
            <a href="#cookies" className="hover:text-white">
              Cookies
            </a>
            <a href="#status" className="hover:text-white">
              Estado del sistema
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="rounded-md border border-white/10 px-2.5 py-1.5 text-sm text-gray-200/90">
              ES / Peru
            </div>

            <nav
              aria-label="Redes sociales"
              className="flex items-center gap-2.5"
            >
              {/* LinkedIn */}
              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="rounded-md p-2 text-gray-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="opacity-90"
                >
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zM8 8h3.8v2.2h.1C12.7 8.9 14.3 8 16.5 8 21 8 22 10.9 22 15.1V24h-4v-7.8c0-1.9 0-4.3-2.6-4.3-2.6 0-3 2-3 4.2V24H8V8z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#facebook"
                aria-label="Facebook"
                className="rounded-md p-2 text-gray-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="opacity-90"
                >
                  <path d="M22 12.06C22 6.48 17.52 2 11.94 2 6.36 2 1.88 6.48 1.88 12.06 1.88 17.1 5.52 21.2 10.32 22v-7.04H7.9v-2.9h2.42V9.86c0-2.4 1.43-3.73 3.62-3.73 1.05 0 2.14.19 2.14.19v2.35h-1.21c-1.2 0-1.57.75-1.57 1.5v1.8h2.67l-.43 2.9h-2.24V22c4.8-.8 8.44-4.9 8.44-9.94z" />
                </svg>
              </a>
              {/* X */}
              <a
                href="#x"
                aria-label="X (Twitter)"
                className="rounded-md p-2 text-gray-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="opacity-90"
                >
                  <path d="M18.9 2H22l-8.6 9.8L22.7 22h-7.1l-5.5-6.5L3.8 22H1l9.2-10.6L1 2h7.2l5 5.9L18.9 2Z" />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
