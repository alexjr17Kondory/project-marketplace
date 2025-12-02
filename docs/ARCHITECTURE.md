# 🏗️ Arquitectura del Sistema - Marketplace de Ropa Personalizada

## VISIÓN GENERAL

Este proyecto es una aplicación de e-commerce para productos personalizables, construida con React + TypeScript + Vite. Incluye un personalizador visual de productos, sistema de pedidos, panel administrativo y pasarela de pagos.

### Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Estilos** | Tailwind CSS |
| **Routing** | React Router DOM v6 |
| **Estado Global** | Context API |
| **Tablas** | TanStack Table (React Table) |
| **Iconos** | Lucide React |
| **Persistencia** | localStorage |
| **Pagos** | Wompi (Colombia) |
| **Deploy** | Vercel |

---

## ESTRUCTURA DEL PROYECTO

```
project-marketplace/
├── web/                              # Aplicación principal
│   ├── src/
│   │   ├── App.tsx                   # Componente raíz + rutas
│   │   ├── main.tsx                  # Entry point
│   │   ├── index.css                 # Estilos globales + Tailwind
│   │   │
│   │   ├── pages/                    # Páginas de la aplicación
│   │   │   ├── HomePage.tsx
│   │   │   ├── CatalogPage.tsx
│   │   │   ├── CustomizerPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrderConfirmationPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── MyOrdersPage.tsx
│   │   │   ├── LegalPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   │
│   │   │   └── admin/                # Panel administrativo
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── ProductsPage.tsx
│   │   │       ├── OrdersPage.tsx
│   │   │       ├── OrderDetailPage.tsx
│   │   │       ├── UsersPage.tsx
│   │   │       ├── UserDetailPage.tsx
│   │   │       ├── AdminUsersPage.tsx
│   │   │       ├── AdminDetailPage.tsx
│   │   │       ├── RolesPage.tsx
│   │   │       ├── RoleFormPage.tsx
│   │   │       ├── PaymentsPage.tsx
│   │   │       ├── ShippingPage.tsx
│   │   │       ├── SettingsPage.tsx
│   │   │       │
│   │   │       ├── catalogs/         # Gestión de catálogos
│   │   │       │   ├── SizesPage.tsx
│   │   │       │   ├── ColorsPage.tsx
│   │   │       │   ├── CategoriesPage.tsx
│   │   │       │   └── ProductTypesPage.tsx
│   │   │       │
│   │   │       └── settings/         # Configuración del sistema
│   │   │           ├── SettingsGeneralPage.tsx
│   │   │           ├── SettingsAppearancePage.tsx
│   │   │           ├── SettingsHomePage.tsx
│   │   │           ├── SettingsCatalogPage.tsx
│   │   │           ├── SettingsShippingPage.tsx
│   │   │           ├── SettingsPaymentPage.tsx
│   │   │           └── SettingsLegalPage.tsx
│   │   │
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── layout/              # Layout principal
│   │   │   │   ├── Header.tsx       # Header con nav, carrito, usuario
│   │   │   │   ├── Footer.tsx       # Footer con contacto y redes
│   │   │   │   └── Layout.tsx       # Layout wrapper
│   │   │   │
│   │   │   ├── admin/               # Componentes admin
│   │   │   │   ├── AdminLayout.tsx  # Layout del panel admin
│   │   │   │   └── ProductForm.tsx  # Formulario de productos
│   │   │   │
│   │   │   ├── shared/              # Componentes compartidos
│   │   │   │   ├── Button.tsx       # Botón con variantes
│   │   │   │   ├── Input.tsx        # Input de texto
│   │   │   │   ├── Modal.tsx        # Modal genérico
│   │   │   │   ├── Loading.tsx      # Spinner de carga
│   │   │   │   ├── Toast.tsx        # Notificaciones
│   │   │   │   ├── ImageUpload.tsx  # Carga de imágenes
│   │   │   │   └── RichTextEditor.tsx
│   │   │   │
│   │   │   ├── auth/                # Autenticación
│   │   │   │   ├── LoginModal.tsx   # Modal login/register/forgot
│   │   │   │   ├── ForgotPasswordModal.tsx
│   │   │   │   ├── UserMenu.tsx     # Menú usuario desktop
│   │   │   │   └── MobileUserMenu.tsx
│   │   │   │
│   │   │   ├── products/            # Productos
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── ProductFilters.tsx
│   │   │   │   ├── ProductSort.tsx
│   │   │   │   └── FeaturedProducts.tsx
│   │   │   │
│   │   │   ├── cart/                # Carrito
│   │   │   │   ├── CartItem.tsx
│   │   │   │   ├── CartSummary.tsx
│   │   │   │   └── CustomizedCartItem.tsx
│   │   │   │
│   │   │   ├── customizer/          # Personalizador
│   │   │   │   ├── ProductSelector.tsx
│   │   │   │   ├── ColorPicker.tsx
│   │   │   │   ├── SizeSelector.tsx
│   │   │   │   ├── ZoneSelector.tsx
│   │   │   │   ├── ViewToggle.tsx
│   │   │   │   ├── DesignControls.tsx
│   │   │   │   ├── ImageUploader.tsx
│   │   │   │   └── SizeGuideModal.tsx
│   │   │   │
│   │   │   ├── payment/             # Pagos
│   │   │   │   └── WompiCheckout.tsx
│   │   │   │
│   │   │   ├── common/              # Comunes
│   │   │   │   └── WhatsAppButton.tsx
│   │   │   │
│   │   │   └── icons/               # Iconos
│   │   │       └── SocialIcons.tsx
│   │   │
│   │   ├── context/                 # Estado global (Context API)
│   │   │   ├── AuthContext.tsx      # Autenticación y permisos
│   │   │   ├── CartContext.tsx      # Carrito de compras
│   │   │   ├── ProductsContext.tsx  # Gestión de productos
│   │   │   ├── OrdersContext.tsx    # Gestión de pedidos
│   │   │   ├── UsersContext.tsx     # Gestión de usuarios
│   │   │   ├── RolesContext.tsx     # Roles y permisos
│   │   │   ├── SettingsContext.tsx  # Configuración global
│   │   │   ├── CatalogsContext.tsx  # Catálogos (tallas, colores)
│   │   │   └── ToastContext.tsx     # Notificaciones
│   │   │
│   │   ├── types/                   # Tipos TypeScript
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── cart.ts
│   │   │   ├── design.ts
│   │   │   ├── catalog.ts
│   │   │   ├── roles.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── services/                # Servicios
│   │   │   ├── canvas.service.ts    # Manipulación de canvas
│   │   │   ├── storage.service.ts   # localStorage
│   │   │   └── wompi.service.ts     # Pasarela de pagos
│   │   │
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useCurrency.ts
│   │   │   ├── useIsMobile.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── data/                    # Datos mock
│   │   │   ├── mockProducts.ts
│   │   │   ├── productTypeConfigs.ts
│   │   │   └── sizeCharts.ts
│   │   │
│   │   ├── assets/                  # Recursos estáticos
│   │   └── styles/                  # Estilos adicionales
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docs/                            # Documentación
│   ├── ROADMAP.md                   # Plan de desarrollo
│   ├── DATABASE_SCHEMA.md           # Esquema de datos
│   └── ARCHITECTURE.md              # Este archivo
│
├── vercel.json                      # Configuración Vercel
├── README.md
└── .gitignore
```

---

## ARQUITECTURA DE CONTEXTOS

El estado global se maneja con Context API de React. Cada contexto es independiente pero algunos comparten datos.

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    AuthProvider                          │   │
│  │  • user, role, isAuthenticated                          │   │
│  │  • login, logout, register                              │   │
│  │  • requestPasswordReset, resetPassword                  │   │
│  │  • hasPermission, hasModuleAccess                       │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │                  RolesProvider                     │  │   │
│  │  │  • roles, getRoleById                             │  │   │
│  │  │  • createRole, updateRole, deleteRole             │  │   │
│  │  │                                                    │  │   │
│  │  │  ┌─────────────────────────────────────────────┐  │  │   │
│  │  │  │               ToastProvider                  │  │  │   │
│  │  │  │  • showToast, success, error, info           │  │  │   │
│  │  │  │                                              │  │  │   │
│  │  │  │  ┌───────────────────────────────────────┐  │  │  │   │
│  │  │  │  │           ProductsProvider            │  │  │  │   │
│  │  │  │  │  • products, filteredProducts         │  │  │  │   │
│  │  │  │  │  • addProduct, updateProduct          │  │  │  │   │
│  │  │  │  │                                       │  │  │  │   │
│  │  │  │  │  ┌─────────────────────────────────┐  │  │  │  │   │
│  │  │  │  │  │         CartProvider            │  │  │  │  │   │
│  │  │  │  │  │  • cart, totalItems             │  │  │  │  │   │
│  │  │  │  │  │  • addStandardProduct           │  │  │  │  │   │
│  │  │  │  │  │  • addCustomizedProduct         │  │  │  │  │   │
│  │  │  │  │  │                                 │  │  │  │  │   │
│  │  │  │  │  │  ┌───────────────────────────┐  │  │  │  │  │   │
│  │  │  │  │  │  │      OrdersProvider       │  │  │  │  │  │   │
│  │  │  │  │  │  │  • orders, createOrder    │  │  │  │  │  │   │
│  │  │  │  │  │  │  • changeOrderStatus      │  │  │  │  │  │   │
│  │  │  │  │  │  │                           │  │  │  │  │  │   │
│  │  │  │  │  │  │  ┌─────────────────────┐  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │   UsersProvider     │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  • users, admins    │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  • addUser, addAdmin│  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │                     │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  ┌───────────────┐  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │SettingsProvider│  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │ • settings     │  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │ • updateSetting│  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │               │  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │  ┌─────────┐  │  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │  │Catalogs │  │  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │  │Provider │  │  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  │  └─────────┘  │  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  │  └───────────────┘  │  │  │  │  │  │  │   │
│  │  │  │  │  │  │  └─────────────────────┘  │  │  │  │  │  │   │
│  │  │  │  │  │  └───────────────────────────┘  │  │  │  │  │   │
│  │  │  │  │  └─────────────────────────────────┘  │  │  │  │   │
│  │  │  │  └───────────────────────────────────────┘  │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                         <Routes />                               │
└─────────────────────────────────────────────────────────────────┘
```

### Relación entre Contextos

```
AuthContext ◄──────── UsersContext
     │                      │
     │ (comparten datos     │
     │  de usuarios)        │
     ▼                      ▼
RolesContext ────────► Permisos verificados en AuthContext

SettingsContext ────► Usado por Header, Footer, HomePage, Checkout
                      (colores, logo, textos, métodos de pago)

ProductsContext ────► CartContext (productos al carrito)
                      OrdersContext (items del pedido)

CartContext ─────────► OrdersContext (crear pedido desde carrito)
```

---

## SISTEMA DE RUTAS

### Rutas Públicas (con Layout)

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | HomePage | Página de inicio |
| `/catalog` | CatalogPage | Catálogo de productos |
| `/customize` | CustomizerPage | Personalizador |
| `/cart` | CartPage | Carrito de compras |
| `/checkout` | CheckoutPage | Checkout y pago |
| `/order-confirmation` | OrderConfirmationPage | Confirmación de pedido |
| `/profile` | ProfilePage | Perfil del usuario |
| `/my-orders` | MyOrdersPage | Mis pedidos |
| `/legal/:page` | LegalPage | Páginas legales |

### Rutas sin Layout

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/reset-password` | ResetPasswordPage | Restablecer contraseña |

### Rutas Admin (protegidas)

| Ruta | Componente | Permiso requerido |
|------|------------|-------------------|
| `/admin-panel` | DashboardPage | dashboard.view |
| `/admin-panel/products` | ProductsPage | products.view |
| `/admin-panel/orders` | OrdersPage | orders.view |
| `/admin-panel/orders/:id` | OrderDetailPage | orders.view |
| `/admin-panel/users` | UsersPage | users.view |
| `/admin-panel/users/:id` | UserDetailPage | users.view |
| `/admin-panel/admins` | AdminUsersPage | admins.view |
| `/admin-panel/admins/:id` | AdminDetailPage | admins.view |
| `/admin-panel/roles` | RolesPage | roles.view |
| `/admin-panel/roles/new` | RoleFormPage | roles.create |
| `/admin-panel/roles/:id` | RoleFormPage | roles.edit |
| `/admin-panel/payments` | PaymentsPage | orders.view |
| `/admin-panel/shipping` | ShippingPage | settings.shipping |
| `/admin-panel/catalogs/*` | CatalogsPages | catalogs.view |
| `/admin-panel/settings/*` | SettingsPages | settings.* |

---

## SISTEMA DE AUTENTICACIÓN Y PERMISOS

### Roles del Sistema

```typescript
// Rol 0 - Super Administrador (protegido, no editable)
{
  id: 0,
  name: 'Super Administrador',
  permissions: ['*'], // Acceso total
  isSystem: true
}

// Rol 1 - Usuario (sin acceso admin)
{
  id: 1,
  name: 'Usuario',
  permissions: [], // Sin permisos admin
  isSystem: true
}

// Roles 2+ - Personalizados
{
  id: 2,
  name: 'Administrador de Ventas',
  permissions: ['dashboard.view', 'orders.view', 'orders.manage'],
  isSystem: false
}
```

### Permisos Disponibles (27 total)

```typescript
// Dashboard
'dashboard.view'

// Productos (4)
'products.view'
'products.create'
'products.edit'
'products.delete'

// Catálogos (2)
'catalogs.view'
'catalogs.manage'

// Pedidos (3)
'orders.view'
'orders.manage'
'orders.delete'

// Usuarios (3)
'users.view'
'users.edit'
'users.delete'

// Administradores (4)
'admins.view'
'admins.create'
'admins.edit'
'admins.delete'

// Roles (4)
'roles.view'
'roles.create'
'roles.edit'
'roles.delete'

// Configuración (7)
'settings.general'
'settings.appearance'
'settings.home'
'settings.catalog'
'settings.shipping'
'settings.payment'
'settings.legal'
```

### Verificación de Permisos

```typescript
// En componentes
const { hasPermission, hasModuleAccess } = useAuth();

// Verificar permiso específico
if (hasPermission('products.edit')) {
  // Mostrar botón editar
}

// Verificar acceso a módulo
if (hasModuleAccess('orders')) {
  // Mostrar enlace en sidebar
}
```

### Protección de Rutas

```typescript
// AdminRoute verifica:
// 1. Usuario autenticado
// 2. Usuario con rol admin o superadmin
// 3. Permiso específico para la ruta

<AdminRoute requiredPermission="products.view">
  <ProductsPage />
</AdminRoute>
```

---

## FLUJOS PRINCIPALES

### 1. Flujo de Compra Estándar

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Catálogo │───►│ Agregar  │───►│ Carrito  │───►│ Checkout │
│          │    │ al cart  │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                                      ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Mis    │◄───│ Confirm. │◄───│  Wompi   │◄───│  Datos   │
│ Pedidos  │    │ Pedido   │    │  Pago    │    │  Envío   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 2. Flujo de Personalización

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Selec.   │───►│ Selec.   │───►│ Subir    │───►│ Ajustar  │
│ Producto │    │ Color/   │    │ Diseño   │    │ Posición │
│          │    │ Talla    │    │          │    │ Rotación │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                                      ▼
                               ┌──────────┐    ┌──────────┐
                               │ Agregar  │◄───│ Generar  │
                               │ al Cart  │    │ Preview  │
                               └──────────┘    └──────────┘
```

### 3. Flujo de Pedido (Admin)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ PENDING  │───►│   PAID   │───►│PROCESSING│───►│ SHIPPED  │
│ (nuevo)  │    │ (pagado) │    │(produc.) │    │(enviado) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │                                               │
      │                                               ▼
      │                                        ┌──────────┐
      │                                        │DELIVERED │
      └───────────────────────────────────────►│(entregado)│
               (cancelado en cualquier punto)  └──────────┘
                        ▼
                 ┌──────────┐
                 │CANCELLED │
                 └──────────┘
```

---

## PERSISTENCIA DE DATOS

### LocalStorage Keys

| Clave | Contexto | Contenido |
|-------|----------|-----------|
| `marketplace_users` | UsersContext | Usuarios y admins |
| `marketplace_products` | ProductsContext | Productos del catálogo |
| `marketplace_cart` | CartContext | Estado del carrito |
| `marketplace_orders` | OrdersContext | Pedidos |
| `marketplace_roles` | RolesContext | Roles personalizados |
| `marketplace_settings` | SettingsContext | Configuración global |
| `marketplace_catalogs_sizes` | CatalogsContext | Tallas |
| `marketplace_catalogs_colors` | CatalogsContext | Colores |
| `marketplace_catalogs_categories` | CatalogsContext | Categorías |
| `marketplace_catalogs_productTypes` | CatalogsContext | Tipos de producto |

### Estructura de Datos

```typescript
// Usuarios (incluye password para demo)
interface AuthUser {
  id: string;
  email: string;
  password: string;
  name: string;
  roleId: number;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'inactive' | 'suspended';
  // ... más campos
}

// Carrito persiste entre sesiones
interface Cart {
  items: CartItemType[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  updatedAt: Date;
}
```

---

## INTEGRACIÓN DE PAGOS (WOMPI)

### Configuración

```typescript
interface WompiConfig {
  publicKey: string;      // Llave pública de Wompi
  privateKey?: string;    // Llave privada (server-side)
  integrityKey?: string;  // Para verificar transacciones
  eventSecret?: string;   // Para webhooks
  isTestMode: boolean;    // Modo sandbox
}
```

### Flujo de Pago

```
1. Usuario llega a Checkout
2. Selecciona método de pago (Wompi)
3. Se genera referencia única del pedido
4. Se crea widget de Wompi con:
   - Monto total
   - Referencia
   - Datos del comprador
5. Usuario completa pago en Wompi
6. Wompi redirige a URL de confirmación
7. Se verifica transacción
8. Se actualiza estado del pedido
```

### Métodos de Pago Soportados

- Tarjeta de crédito
- Tarjeta débito
- PSE (transferencia bancaria)
- Nequi
- Efectivo (Efecty, Baloto)
- Pago en punto físico

---

## PERSONALIZADOR DE PRODUCTOS

### Arquitectura del Canvas

```typescript
// Configuración por tipo de producto
interface ProductTypeConfig {
  type: ProductType;
  name: string;
  printZones: PrintZoneConfig[];
  availableColors: string[];
  availableSizes: string[];
}

// Zona de impresión
interface PrintZoneConfig {
  id: PrintZone;
  name: string;
  maxWidth: number;   // cm
  maxHeight: number;  // cm
  position: { x: number; y: number }; // en el canvas
}
```

### Flujo de Renderizado

```
1. Usuario selecciona producto y color
2. Se carga imagen base del producto (mockup)
3. Se definen zonas de impresión sobre el canvas
4. Usuario sube imagen para diseño
5. Se comprime imagen (máx 2MB)
6. Se posiciona en zona seleccionada
7. Usuario ajusta: posición, tamaño, rotación, opacidad
8. Se genera preview comprimido (base64)
9. Se guarda CustomizedProduct con diseños
```

### Zonas de Impresión por Producto

| Producto | Zonas disponibles |
|----------|-------------------|
| Camiseta | front, back, chest, left-sleeve, right-sleeve |
| Hoodie | front, back, chest, back-neck |
| Gorra | front, back, top |
| Taza | around, front |
| Botella | around, front |

---

## COMPONENTES CLAVE

### Button

```typescript
interface ButtonProps {
  variant?:
    | 'primary'       // Gradiente de marca
    | 'secondary'     // Gris
    | 'outline'       // Borde
    | 'danger'        // Rojo
    | 'admin-primary' // Naranja admin
    | 'admin-secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}
```

### Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  children: ReactNode;
}
```

### Toast

```typescript
// Uso
const toast = useToast();
toast.success('Operación exitosa');
toast.error('Error en la operación');
toast.info('Información');
toast.warning('Advertencia');
```

---

## CONFIGURACIÓN DEL SISTEMA

### General

- Nombre del sitio
- Logo
- Slogan
- Datos de contacto
- Redes sociales

### Apariencia

- Colores de marca (primary, secondary, accent)
- Estilo del header
- Color del footer
- Mostrar/ocultar slogan

### Home

- Configuración del Hero
- Features cards
- Secciones de productos
- CTA
- Botón de WhatsApp

### Envíos

- Dirección de origen
- Zonas geográficas
- Transportadoras con tarifas
- Factor volumétrico
- Tiempo de preparación

### Pagos

- Métodos habilitados
- Configuración Wompi
- Configuración punto físico
- Datos bancarios
- Tasa de impuestos

### Legal

- Términos y condiciones
- Política de privacidad
- Política de devoluciones

---

## RESPONSIVE DESIGN

### Breakpoints (Tailwind)

| Breakpoint | Mínimo | Uso |
|------------|--------|-----|
| (default) | 0px | Mobile |
| `sm` | 640px | Tablet vertical |
| `md` | 768px | Tablet horizontal |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Pantallas grandes |

### Header Responsivo

```
Mobile (< 768px):
┌─────────────────────────────────────┐
│ Logo    [Search]           [Cart]   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [Home] [Cat] [Design] [Cart] [User] │  ← Bottom nav fijo
└─────────────────────────────────────┘

Desktop (≥ 768px):
┌───────────────────────────────────────────────────────────┐
│ Logo+Slogan   [Home] [Catálogo] [Personalizar]   🔍 🛒 👤 │
└───────────────────────────────────────────────────────────┘
```

---

## DEPLOY

### Vercel

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Variables de Entorno

```env
# Producción
VITE_WOMPI_PUBLIC_KEY=pub_prod_xxx
VITE_API_URL=https://api.example.com

# Desarrollo
VITE_WOMPI_PUBLIC_KEY=pub_test_xxx
VITE_API_URL=http://localhost:3001
```

### Build

```bash
cd web
npm run build    # Genera dist/
npm run preview  # Preview local del build
```

---

## PRÓXIMOS PASOS (Fase 7 - Backend)

### Stack Recomendado

- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Base de datos**: PostgreSQL (Supabase/Railway)
- **Autenticación**: JWT + bcrypt
- **Storage**: Cloudinary/AWS S3
- **Cache**: Redis (opcional)

### API Endpoints Planeados

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/products
GET    /api/products/:id
POST   /api/products        (admin)
PUT    /api/products/:id    (admin)
DELETE /api/products/:id    (admin)

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status (admin)

GET    /api/users           (admin)
GET    /api/users/:id       (admin)
PUT    /api/users/:id       (admin)

POST   /api/uploads/image
POST   /api/payments/wompi/webhook
```

---

**Última actualización:** 2025-11-29
**Versión:** 2.0
