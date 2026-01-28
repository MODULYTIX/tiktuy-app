# Tiktuy Web - Plataforma Integral de Logística y Comercio Electrónico

## Descripción General

Tiktuy Web es una solución tecnológica avanzada diseñada para orquestar la logística de última milla y la gestión de comercio electrónico. La plataforma integra múltiples actores en un ecosistema unificado: comercios (Ecommerces), empresas de mensajería (Couriers), repartidores (Motorizados) y administradores del sistema. Su objetivo principal es optimizar el flujo de pedidos, desde la creación o importación masiva hasta la entrega final y el cuadre financiero.

## Pila Tecnológica

El proyecto utiliza tecnologías de vanguardia para garantizar rendimiento, escalabilidad y una experiencia de usuario fluida:

- **Core**: React 19 (Gestión de interfaz y estado), TypeScript (Tipado estático robusto).
- **Construcción y Desarrollo**: Vite 7 (Entorno de desarrollo rápido y bundler optimizado).
- **Estilos y Diseño**: Tailwind CSS 4 (Sistema de diseño utilitario), Framer Motion (Animaciones fluidas y transiciones), clsx (Manejo condicional de clases).
- **Navegación**: React Router 7 (Enrutamiento dinámico y protección de rutas).
- **Visualización de Datos**: Recharts (Gráficos estadísticos y paneles de control).
- **Comunicación en Tiempo Real**: Socket.io Client (Actualizaciones en vivo de estados de pedidos).
- **Iconografía**: Iconify, React Icons.

## Arquitectura del Proyecto

La estructura del código sigue un patrón basado en dominios y roles, lo que permite una clara separación de responsabilidades y facilita el mantenimiento a largo plazo.

## Arquitectura del Proyecto

La estructura del código sigue un patrón modular basado en dominios. A continuación se detalla la organización principal de directorios:

```text
Tiktuy-web/
├── public/                # Archivos estáticos públicos
├── src/
│   ├── auth/              # Módulo de autenticación y seguridad
│   ├── role/              # Lógica de negocio específica por rol
│   │   ├── admin/         # Panel de administración global
│   │   ├── courier/       # Gestión logística (Operadores)
│   │   ├── ecommerce/     # Gestión de ventas (Tiendas)
│   │   ├── motorizado/    # Interfaz móvil para repartidores
│   │   └── user/          # Landing Page y vistas públicas
│   ├── router/            # Configuración de rutas (React Router)
│   ├── services/          # Servicios API y tipos TypeScript
│   └── shared/            # Código compartido y reutilizable
│       ├── common/        # Biblioteca de componentes UI base
│       ├── components/    # Componentes de negocio transversales
│       ├── hooks/         # Hooks personalizados
│       └── layout/        # Plantillas de diseño (Wrappers)
├── .env                   # Variables de entorno
├── .gitignore             # Archivos ignorados por Git
├── index.html             # Punto de entrada HTML
├── package.json           # Dependencias y scripts
├── tsconfig.json          # Configuración TypeScript
├── vite.config.ts         # Configuración de Vite
├── vercel.json            # Configuración de Vercel
└── README.md              # Documentación del proyecto
```

## Módulos y Funcionalidades Principales

Cada módulo cuenta con un sistema de reportes dedicado para el análisis de rendimiento.

### 1. Portal Público (Landing Page)
Presentación institucional de la plataforma a nuevos usuarios.
- **Secciones Informativas**: Explicación del servicio y propuesta de valor.
- **Formularios de Captación**: Solicitud de registro para nuevos socios.
- **Efectos Visuales**: Implementación de animaciones de revelado progresivo (Scroll Reveal) para una experiencia moderna.

### 2. Módulo Ecommerce
Herramientas para la gestión eficiente de ventas y despachos.
- **Gestión de Pedidos**: Creación manual y seguimiento en tiempo real.
- **Carga Masiva (Excel)**: Funcionalidad crítica para importar grandes volúmenes de pedidos de forma automática.
- **Inventario**: Control de stock en tiempo real.
- **Reportes**: Análisis detallado de ventas, entregas efectivas y devoluciones.

### 3. Módulo Courier
Centro de operaciones logísticas.
- **Gestión de Sedes**: Administración de múltiples almacenes o puntos de distribución.
- **Despacho y Asignación**: Herramientas para asignar pedidos a motorizados basándose en zonas o carga de trabajo.
- **Cuadre de Caja**: Control de ingresos, pagos a repartidores y liquidaciones.
- **Reportes**: Métricas de eficiencia operativa y tiempos de entrega.

### 4. Módulo Motorizado
Aplicación para el personal en campo.
- **Lista de Entregas**: Visualización priorizada de pedidos asignados.
- **Gestión de Estados**: Actualización en tiempo real (Entregado, Motivo de no entrega, Reprogramado).
- **Finanzas Personales**: Reportes de ganancias y pagos recibidos.

## Guía de Instalación y Despliegue

Siga estos pasos para configurar el entorno de desarrollo local.

### Requisitos Previos
- Node.js (Versión LTS recomendada).
- Gestor de paquetes npm o yarn.

### Pasos de Instalación

1.  **Clonar el repositorio**
    Obtenga una copia del código fuente en su máquina local.

2.  **Instalar dependencias**
    Ejecute el siguiente comando en la raíz del proyecto para descargar todas las librerías necesarias.
    ```bash
    npm install
    ```

3.  **Configuración de Entorno**
    Asegúrese de configurar las variables de entorno necesarias (crear archivo `.env` basado en `.env.example` si existe) para la conexión con el backend y servicios externos.

4.  **Iniciar Servidor de Desarrollo**
    Levante el entorno local con recarga en caliente (HMR).
    ```bash
    npm run dev
    ```
    La aplicación estará accesible generalmente en `http://localhost:5173`.

### Scripts Disponibles

En el archivo `package.json` se definen los siguientes comandos:

- `npm run dev`: Inicia el servidor de desarrollo con Vite.
- `npm run build`: Ejecuta la compilación de TypeScript (`tsc`) y construye la versión optimizada para producción.
- `npm run preview`: Permite visualizar localmente la versión construida (build) para verificar su comportamiento antes del despliegue.
- `npm run lint`: Ejecuta ESLint para analizar el código en busca de errores y asegurar consistencia de estilo.

## Consideraciones para Despliegue

Para llevar la aplicación a un entorno productivo:
1.  Ejecute `npm run build` para generar la carpeta `dist`.
2.  El contenido de la carpeta `dist` son archivos estáticos que pueden ser servidos por cualquier servidor web (Nginx, Apache, Vercel, Netlify).

