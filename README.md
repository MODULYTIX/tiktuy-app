# Tiktuy Web

Plataforma integral de logística y comercio electrónico diseñada para optimizar la gestión de pedidos, entregas y control de stock. La aplicación conecta ecommerces, couriers y motorizados en un ecosistema unificado.

## Tecnologías

El proyecto está construido con un stack moderno enfocado en rendimiento y experiencia de desarrollador:

*   **Core**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
*   **Enrutamiento**: [React Router](https://reactrouter.com/)
*   **Iconos**: [Iconify](https://iconify.design/) + [React Icons](https://react-icons.github.io/react-icons/)
*   **Comunicación en Tiempo Real**: [Socket.io Client](https://socket.io/)
*   **Gráficos**: [Recharts](https://recharts.org/)

## Estructura del Proyecto

La arquitectura del proyecto está organizada por dominios y roles para facilitar la escalabilidad:

*   **`src/auth`**: Manejo de sesión, contextos de autenticación y protección de rutas.
*   **`src/role`**: Vistas y lógica específica para cada tipo de usuario:
    *   `courier`: Gestión de almacenes, movimientos y despachos.
    *   `ecommerce`: Creación de pedidos, catálogo de productos e importación masiva.
    *   `motorizado`: Interfaz para la gestión de entregas en campo.
    *   `admin`: Panel de administración general.
*   **`src/services`**: Capa de comunicación con el backend (API Fetch/Axios) y definiciones de tipos TypeScript (`.types.ts`).
*   **`src/shared`**: Biblioteca de componentes reutilizables:
    *   `components`: Componentes de negocio compartidos.
    *   `common`: UI Kit base (Botones, Inputs, Modales, Tablas).
    *   `layout`: Estructuras de página (Sidebar, Navbar).
*   **`src/router`**: Definición de rutas y navegación.

## Instalación y Uso

Sigue estos pasos para desplegar el proyecto localmente:

1.  **Instalar dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```

2.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173` (o el puerto que asigne Vite).

3.  **Construir para producción:**
    Genera los archivos estáticos optimizados en la carpeta `dist`.
    ```bash
    npm run build
    ```

4.  **Linting:**
    Revisar calidad de código y errores de tipo.
    ```bash
    npm run lint
    ```

## Funcionalidades Principales

### Ecommerce
*   Dashboard con métricas de ventas.
*   Gestión de inventario y productos.
*   Carga masiva de pedidos vía Excel.
*   Seguimiento de pedidos en tiempo real.

### Courier
*   Control de múltiples sedes/almacenes.
*   Asignación inteligente de pedidos a motorizados.
*   Gestión de tarifas y zonas de cobertura.
*   Cuadre de saldos y caja.

### Motorizado
*   Lista de entregas priorizada.
*   Gestión de estados de entrega (Entregado, No entregado, Reprogramado).
*   Historial de movimientos y pagos.

## Scripts

*   `dev`: Inicia el entorno de desarrollo con HMR.
*   `build`: Compila TypeScript y construye la aplicación para producción.
*   `lint`: Ejecuta ESLint para asegurar la calidad del código.
*   `preview`: Previsualiza la build de producción localmente.
