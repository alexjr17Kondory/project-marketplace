# 🗄️ Esquema de Base de Datos - Marketplace de Ropa Personalizada

> **Nota:** Actualmente el proyecto usa localStorage para persistencia. Este documento define el esquema para la futura migración a base de datos (Fase 7).

## ESTADO ACTUAL VS FUTURO

| Aspecto | Actual (localStorage) | Futuro (PostgreSQL) |
|---------|----------------------|---------------------|
| Persistencia | localStorage del navegador | PostgreSQL + Prisma |
| Usuarios | JSON en memoria | Tabla users con hash |
| Productos | JSON mock/localStorage | Tablas normalizadas |
| Pedidos | localStorage | Tabla orders con relaciones |
| Sesiones | Context API | JWT + Redis |

---

## MODELO ENTIDAD-RELACIÓN (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DIAGRAMA COMPLETO - ESTADO ACTUAL                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│       ROLES          │         │     PERMISSIONS      │
├──────────────────────┤         ├──────────────────────┤
│ id (PK) NUMBER       │◄───┐    │ (embedded in roles)  │
│ name                 │    │    │ 27 permisos en 8     │
│ description          │    │    │ módulos diferentes   │
│ permissions[]        │    │    └──────────────────────┘
│ isSystem             │    │
│ isActive             │    │
│ createdAt            │    │
│ updatedAt            │    │
└──────────────────────┘    │
                            │
                            │
┌──────────────────────┐    │
│       USERS          │    │
├──────────────────────┤    │
│ id (PK)              │────┘
│ email (UNIQUE)       │
│ password             │
│ name                 │
│ roleId (FK)          │──────► roles.id
│ role                 │ ('user' | 'admin' | 'superadmin')
│ status               │ ('active' | 'inactive' | 'suspended')
│ phone?               │
│ cedula?              │
│ avatar?              │
│ profile              │──────► (embedded UserProfile)
│ address              │──────► (embedded UserAddress)
│ resetToken?          │
│ resetTokenExpiry?    │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
         │
         │ 1:N (embedded)
         ▼
┌──────────────────────┐
│   USER_ADDRESSES     │
│   (embedded array)   │
├──────────────────────┤
│ id                   │
│ label                │ ('casa', 'trabajo', etc)
│ address              │
│ city                 │
│ postalCode           │
│ country              │
│ isDefault            │
└──────────────────────┘


┌──────────────────────┐         ┌──────────────────────┐
│     CATEGORIES       │         │    PRODUCT_TYPES     │
├──────────────────────┤         ├──────────────────────┤
│ id (PK)              │         │ id (PK)              │
│ name                 │         │ name                 │
│ description?         │         │ description?         │
│ active               │         │ active               │
│ createdAt            │         │ createdAt            │
│ updatedAt            │         │ updatedAt            │
└──────────────────────┘         └──────────────────────┘


┌──────────────────────┐         ┌──────────────────────┐
│       COLORS         │         │       SIZES          │
├──────────────────────┤         ├──────────────────────┤
│ id (PK)              │         │ id (PK)              │
│ name                 │         │ name                 │
│ hexCode              │         │ abbreviation         │
│ active               │         │ order                │
│ createdAt            │         │ active               │
│ updatedAt            │         │ createdAt            │
└──────────────────────┘         │ updatedAt            │
                                 └──────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                      PRODUCTS                             │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ name                                                      │
│ description                                               │
│ type                    (ProductType enum)                │
│ category                (ProductCategory enum)            │
│ basePrice                                                 │
│ images                  {front, back?, side?}             │
│ colors[]                [{name, hex, image?}]             │
│ sizes[]                 string[]                          │
│ featured                boolean                           │
│ stock                                                     │
│ rating?                                                   │
│ reviewsCount?                                             │
│ tags[]?                                                   │
│ createdAt                                                 │
│ updatedAt                                                 │
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                    CUSTOM_DESIGNS                         │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ productId                                                 │
│ productType             (ProductType enum)                │
│ productName                                               │
│ basePrice                                                 │
│ selectedColor                                             │
│ selectedSize                                              │
│ designs[]               ──────► Design[]                  │
│ previewImages           {front, back?}                    │
│ productionImages?       {front?, back?}                   │
│ customizationPrice                                        │
│ totalPrice                                                │
│ createdAt                                                 │
└──────────────────────────────────────────────────────────┘
         │
         │ 1:N (embedded)
         ▼
┌──────────────────────────────────────────────────────────┐
│                       DESIGNS                             │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ zoneId                  (PrintZone enum)                  │
│ imageUrl                                                  │
│ imageData?              (base64)                          │
│ originalImageData?                                        │
│ originalFileName?                                         │
│ originalFileSize?                                         │
│ position                {x, y}                            │
│ size                    {width, height}                   │
│ rotation                                                  │
│ opacity                                                   │
│ filters?                {brightness?, contrast?, grayscale?}│
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                         CART                              │
├──────────────────────────────────────────────────────────┤
│ items[]                 ──────► CartItem[] | CartItemCustomized[]
│ totalItems                                                │
│ subtotal                                                  │
│ tax                     (16% IVA)                         │
│ shipping                (gratis si subtotal > $50)        │
│ discount                                                  │
│ total                                                     │
│ updatedAt                                                 │
└──────────────────────────────────────────────────────────┘
         │
         │ 1:N (embedded)
         ▼
┌──────────────────────────────────────────────────────────┐
│                    CART_ITEMS                             │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ type                    ('standard' | 'customized')       │
│ product?                ──────► Product (si standard)     │
│ customizedProduct?      ──────► CustomizedProduct (si customized)
│ selectedColor                                             │
│ selectedSize                                              │
│ quantity                                                  │
│ price                                                     │
│ subtotal                                                  │
│ addedAt                                                   │
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                        ORDERS                             │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ orderNumber             (ej: ORD-001)                     │
│ userId                                                    │
│ userName                                                  │
│ userEmail                                                 │
│ items[]                 ──────► OrderItem[]               │
│ subtotal                                                  │
│ shippingCost                                              │
│ discount                                                  │
│ total                                                     │
│ status                  (OrderStatus enum)                │
│ paymentMethod           (PaymentMethod enum)              │
│ paymentReference?                                         │
│ shipping                ──────► ShippingInfo              │
│ trackingNumber?                                           │
│ trackingUrl?                                              │
│ notes?                                                    │
│ statusHistory[]         ──────► StatusHistoryEntry[]      │
│ createdAt                                                 │
│ updatedAt                                                 │
│ paidAt?                                                   │
│ shippedAt?                                                │
│ deliveredAt?                                              │
└──────────────────────────────────────────────────────────┘
         │
         │ 1:N (embedded)
         ▼
┌──────────────────────────────────────────────────────────┐
│                     ORDER_ITEMS                           │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ productId                                                 │
│ productName                                               │
│ productImage                                              │
│ size                                                      │
│ color                                                     │
│ quantity                                                  │
│ unitPrice                                                 │
│ customization?          {designFront?, designBack?, originalFront?, originalBack?}
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                    SHIPPING_INFO                          │
├──────────────────────────────────────────────────────────┤
│ recipientName                                             │
│ phone                                                     │
│ address                                                   │
│ city                                                      │
│ postalCode                                                │
│ country                                                   │
│ notes?                                                    │
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                STATUS_HISTORY_ENTRY                       │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ fromStatus              (OrderStatus | null)              │
│ toStatus                (OrderStatus)                     │
│ changedBy                                                 │
│ changedAt                                                 │
│ note?                                                     │
│ evidences[]?            ──────► PaymentEvidence[]         │
│ trackingNumber?                                           │
│ trackingUrl?                                              │
│ cancellationReason?                                       │
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                   PAYMENT_EVIDENCE                        │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ type                    ('receipt' | 'transfer' | 'voucher' | 'other')
│ url                                                       │
│ description?                                              │
│ uploadedAt                                                │
│ uploadedBy                                                │
└──────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                       SETTINGS                            │
├──────────────────────────────────────────────────────────┤
│ general                 ──────► GeneralSettings           │
│ appearance              ──────► AppearanceSettings        │
│ shipping                ──────► ShippingSettings          │
│ payment                 ──────► PaymentSettings           │
│ legal                   ──────► LegalSettings             │
│ home                    ──────► HomeSettings              │
│ catalog                 ──────► CatalogSettings           │
│ updatedAt                                                 │
│ updatedBy                                                 │
└──────────────────────────────────────────────────────────┘
```

---

## ENUMS Y TIPOS

### OrderStatus
```typescript
type OrderStatus =
  | 'pending'     // Pedido creado, esperando pago
  | 'paid'        // Pago confirmado
  | 'processing'  // En producción
  | 'shipped'     // Enviado
  | 'delivered'   // Entregado
  | 'cancelled';  // Cancelado
```

### PaymentMethod
```typescript
type PaymentMethod =
  | 'credit_card'  // Tarjeta de crédito
  | 'debit_card'   // Tarjeta débito
  | 'pse'          // PSE (Colombia)
  | 'cash'         // Efectivo/contraentrega
  | 'transfer'     // Transferencia bancaria
  | 'wompi'        // Pasarela Wompi
  | 'pickup';      // Pago en punto físico
```

### ProductType
```typescript
type ProductType =
  | 'tshirt' | 'hoodie' | 'sweatshirt' | 'polo' | 'tanktop' | 'longsleeve'  // Ropa
  | 'cap' | 'totebag' | 'keychain' | 'mousepad' | 'phonecase' | 'lanyard'   // Accesorios
  | 'mug' | 'magicmug' | 'bottle' | 'tumbler'                               // Bebidas
  | 'aluminumframe' | 'coaster' | 'pillow' | 'blanket' | 'clock' | 'puzzle' // Hogar
  | 'notebook' | 'calendar';                                                 // Oficina
```

### ProductCategory
```typescript
type ProductCategory = 'clothing' | 'accessories' | 'drinkware' | 'home' | 'office';
```

### PrintZone
```typescript
type PrintZone =
  | 'front' | 'back'                               // Zonas básicas
  | 'front-regular' | 'front-large'                // Frente variantes
  | 'back-large' | 'back-neck' | 'back-center'     // Espalda variantes
  | 'sleeve-small' | 'sleeve-large'                // Mangas
  | 'left-sleeve' | 'right-sleeve'
  | 'chest'                                        // Pecho
  | 'around' | 'top';                              // Otros (tazas, gorras)
```

### UserRole
```typescript
type UserRole = 'user' | 'admin' | 'superadmin';
```

### UserStatus
```typescript
type UserStatus = 'active' | 'inactive' | 'suspended';
```

### Permission (27 permisos en 8 módulos)
```typescript
type Permission =
  // Dashboard
  | 'dashboard.view'
  // Productos
  | 'products.view' | 'products.create' | 'products.edit' | 'products.delete'
  // Catálogos
  | 'catalogs.view' | 'catalogs.manage'
  // Pedidos
  | 'orders.view' | 'orders.manage' | 'orders.delete'
  // Usuarios
  | 'users.view' | 'users.edit' | 'users.delete'
  // Administradores
  | 'admins.view' | 'admins.create' | 'admins.edit' | 'admins.delete'
  // Roles
  | 'roles.view' | 'roles.create' | 'roles.edit' | 'roles.delete'
  // Configuración
  | 'settings.general' | 'settings.appearance' | 'settings.home'
  | 'settings.catalog' | 'settings.shipping' | 'settings.payment' | 'settings.legal';
```

---

## DESCRIPCIÓN DE ENTIDADES

### 👤 MÓDULO DE USUARIOS Y AUTENTICACIÓN

#### **users**
Almacena información de todos los usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| email | string | Email único (login) |
| password | string | Contraseña (hash en producción) |
| name | string | Nombre completo |
| roleId | number | FK a roles (0=SuperAdmin, 1=User, 2+=Custom) |
| role | UserRole | 'user' \| 'admin' \| 'superadmin' |
| status | UserStatus | Estado de la cuenta |
| phone | string? | Teléfono de contacto |
| cedula | string? | Documento de identidad |
| address | UserAddress? | Dirección principal |
| profile | UserProfile? | Datos adicionales del perfil |
| resetToken | string? | Token para recuperar contraseña |
| resetTokenExpiry | Date? | Expiración del token (1 hora) |
| createdAt | Date | Fecha de registro |

#### **roles**
Define los roles y sus permisos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | 0=SuperAdmin, 1=Usuario, 2+=Personalizados |
| name | string | Nombre del rol |
| description | string | Descripción del rol |
| permissions | Permission[] | Array de permisos asignados |
| isSystem | boolean | true para roles 0 y 1 (no editables) |
| isActive | boolean | Si el rol está activo |

**Roles del Sistema:**
- **ID 0 - Super Administrador**: Acceso total, no editable, único
- **ID 1 - Usuario**: Sin acceso admin, rol por defecto
- **ID 2+ - Personalizados**: Roles creados por admin con permisos configurables

---

### 📦 MÓDULO DE PRODUCTOS

#### **products**
Productos del catálogo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| name | string | Nombre del producto |
| description | string | Descripción detallada |
| type | ProductType | Tipo de producto (camiseta, taza, etc.) |
| category | ProductCategory | Categoría (ropa, accesorios, etc.) |
| basePrice | number | Precio base |
| images | object | {front, back?, side?} URLs de imágenes |
| colors | ProductColor[] | Colores disponibles con hex |
| sizes | string[] | Tallas disponibles |
| featured | boolean | Si es producto destacado |
| stock | number | Cantidad en stock |
| rating | number? | Calificación promedio |
| reviewsCount | number? | Número de reseñas |
| tags | string[]? | Etiquetas para búsqueda |

#### **Catálogos (sizes, colors, categories, productTypes)**
Tablas de referencia para normalizar datos.

| Entidad | Campos principales |
|---------|-------------------|
| Size | id, name, abbreviation, order, active |
| Color | id, name, hexCode, active |
| Category | id, name, description, active |
| ProductType | id, name, description, active |

---

### 🎨 MÓDULO DE PERSONALIZACIÓN

#### **customizedProduct**
Producto personalizado con diseños.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| productId | string | ID del producto base |
| productType | ProductType | Tipo de producto |
| productName | string | Nombre del producto |
| basePrice | number | Precio base |
| selectedColor | string | Color seleccionado |
| selectedSize | string | Talla seleccionada |
| designs | Design[] | Diseños aplicados |
| previewImages | object | {front, back?} Previews generados |
| customizationPrice | number | Precio adicional por personalización |
| totalPrice | number | Precio total |

#### **design**
Diseño individual aplicado a una zona.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| zoneId | PrintZone | Zona de estampado |
| imageUrl | string | URL de la imagen |
| imageData | string? | Base64 de la imagen |
| position | {x, y} | Posición en la zona |
| size | {width, height} | Dimensiones |
| rotation | number | Rotación en grados |
| opacity | number | Opacidad (0-1) |
| filters | object? | Filtros aplicados |

---

### 🛒 MÓDULO DE CARRITO

#### **cart**
Estado del carrito de compras.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| items | CartItemType[] | Items en el carrito |
| totalItems | number | Cantidad total de items |
| subtotal | number | Subtotal antes de impuestos |
| tax | number | Impuesto (16% IVA) |
| shipping | number | Costo de envío (gratis > $50) |
| discount | number | Descuento aplicado |
| total | number | Total a pagar |

#### **cartItem**
Item individual en el carrito.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| type | 'standard' \| 'customized' | Tipo de item |
| product | Product? | Producto (si standard) |
| customizedProduct | CustomizedProduct? | Producto personalizado |
| selectedColor | string | Color seleccionado |
| selectedSize | string | Talla seleccionada |
| quantity | number | Cantidad |
| price | number | Precio unitario |
| subtotal | number | Subtotal del item |

---

### 💳 MÓDULO DE PEDIDOS Y PAGOS

#### **orders**
Pedidos confirmados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| orderNumber | string | Número legible (ORD-001) |
| userId | string | ID del usuario |
| userName | string | Nombre del cliente |
| userEmail | string | Email del cliente |
| items | OrderItem[] | Productos del pedido |
| subtotal | number | Subtotal |
| shippingCost | number | Costo de envío |
| discount | number | Descuento |
| total | number | Total pagado |
| status | OrderStatus | Estado actual |
| paymentMethod | PaymentMethod | Método de pago |
| paymentReference | string? | Referencia del pago |
| shipping | ShippingInfo | Información de envío |
| trackingNumber | string? | Número de guía |
| trackingUrl | string? | URL de seguimiento |
| notes | string? | Notas del pedido |
| statusHistory | StatusHistoryEntry[] | Historial de estados |

#### **orderItem**
Item dentro de un pedido.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| productId | string | ID del producto |
| productName | string | Nombre del producto |
| productImage | string | Imagen del producto |
| size | string | Talla |
| color | string | Color |
| quantity | number | Cantidad |
| unitPrice | number | Precio unitario |
| customization | object? | Diseños personalizados (URLs) |

#### **statusHistoryEntry**
Registro de cambio de estado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | UUID único |
| fromStatus | OrderStatus? | Estado anterior |
| toStatus | OrderStatus | Estado nuevo |
| changedBy | string | Quién realizó el cambio |
| changedAt | Date | Cuándo se realizó |
| note | string? | Comentario |
| evidences | PaymentEvidence[]? | Evidencias de pago |
| trackingNumber | string? | Número de guía (si shipped) |
| cancellationReason | string? | Razón (si cancelled) |

---

### ⚙️ MÓDULO DE CONFIGURACIÓN

#### **settings**
Configuración global del sistema.

```typescript
interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    slogan?: string;
    logo?: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    city: string;
    country: string;
    currency: string;
    currencySymbol: string;
    socialLinks: { facebook?, instagram?, twitter?, whatsapp? };
  };

  appearance: {
    brandColors: { primary, secondary, accent };
    buttonColor: string;
    headerBgColor: string;
    showSlogan: boolean;
    headerStyle: 'default' | 'minimal' | 'centered';
    footerBgColor: string;
  };

  shipping: {
    origin: ShippingOrigin;
    zones: ShippingZone[];
    carriers: ShippingCarrier[];
    handlingTime: number;
    packageDefaults: PackageDefaults;
  };

  payment: {
    methods: PaymentMethodConfig[];
    taxRate: number;
    taxIncluded: boolean;
  };

  legal: {
    termsAndConditions: LegalPage;
    privacyPolicy: LegalPage;
    returnsPolicy: LegalPage;
  };

  home: {
    enableCustomizer: boolean;
    hero: HeroSettings;
    features: FeatureCard[];
    productSections: ProductSection[];
    cta: CTASettings;
    whatsappButton: WhatsAppButtonSettings;
  };
}
```

---

## RELACIONES PRINCIPALES

```
USUARIOS
├── users ──► roles (N:1 via roleId)
└── users ──► addresses (1:N embedded)

PRODUCTOS
├── products ──► colors (1:N embedded)
├── products ──► sizes (1:N embedded)
└── products ──► images (1:N embedded)

PERSONALIZACIÓN
├── customizedProduct ──► products (N:1 via productId)
└── customizedProduct ──► designs (1:N embedded)

CARRITO
├── cart ──► cartItems (1:N embedded)
├── cartItem ──► products (N:1 si standard)
└── cartItem ──► customizedProduct (N:1 si customized)

PEDIDOS
├── orders ──► users (N:1 via userId)
├── orders ──► orderItems (1:N embedded)
├── orders ──► statusHistory (1:N embedded)
└── orders ──► shippingInfo (1:1 embedded)
```

---

## CLAVES DE LOCALSTORAGE

| Clave | Contenido |
|-------|-----------|
| `marketplace_users` | Array de usuarios con passwords |
| `marketplace_products` | Array de productos |
| `marketplace_cart` | Estado del carrito |
| `marketplace_orders` | Array de pedidos |
| `marketplace_roles` | Array de roles |
| `marketplace_settings` | Configuración global |
| `marketplace_catalogs_sizes` | Tallas |
| `marketplace_catalogs_colors` | Colores |
| `marketplace_catalogs_categories` | Categorías |
| `marketplace_catalogs_productTypes` | Tipos de producto |

---

## DATOS INICIALES (SEEDS)

### Usuarios por defecto
```javascript
[
  {
    id: 'super-admin-001',
    email: 'admin@marketplace.com',
    password: 'admin123',
    name: 'Super Administrador',
    roleId: 0,
    role: 'superadmin',
    status: 'active'
  },
  {
    id: 'user-demo-001',
    email: 'user@marketplace.com',
    password: 'cliente123',
    name: 'Usuario Demo',
    roleId: 1,
    role: 'user',
    status: 'active'
  }
]
```

### Roles del sistema
```javascript
[
  {
    id: 0,
    name: 'Super Administrador',
    description: 'Acceso total al sistema',
    permissions: ['*'], // Todos los permisos
    isSystem: true,
    isActive: true
  },
  {
    id: 1,
    name: 'Usuario',
    description: 'Cliente sin acceso al panel de administración',
    permissions: [],
    isSystem: true,
    isActive: true
  }
]
```

---

## MIGRACIÓN A BACKEND (Fase 7)

### Stack recomendado
- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Base de datos**: PostgreSQL (Supabase/Railway)
- **Autenticación**: JWT + bcrypt
- **Almacenamiento**: Cloudinary/AWS S3

### Cambios necesarios
1. Hashear passwords con bcrypt
2. Normalizar tablas (colors, sizes, categories como tablas separadas)
3. Implementar relaciones con foreign keys
4. Agregar índices para queries frecuentes
5. Implementar soft delete donde aplique
6. Crear API REST con validación

### Ejemplo Prisma Schema
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  roleId        Int
  role          Role      @relation(fields: [roleId], references: [id])
  status        UserStatus @default(ACTIVE)
  phone         String?
  cedula        String?
  addresses     Address[]
  orders        Order[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Role {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  permissions String[] // Array de permisos
  isSystem    Boolean  @default(false)
  isActive    Boolean  @default(true)
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  type        String
  category    String
  basePrice   Float
  stock       Int      @default(0)
  featured    Boolean  @default(false)
  images      Json     // {front, back?, side?}
  colors      Json     // [{name, hex}]
  sizes       String[]
  rating      Float?
  reviewsCount Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
}

model Order {
  id             String   @id @default(cuid())
  orderNumber    String   @unique
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  items          OrderItem[]
  subtotal       Float
  shippingCost   Float
  discount       Float    @default(0)
  total          Float
  status         OrderStatus @default(PENDING)
  paymentMethod  String
  shipping       Json     // ShippingInfo
  statusHistory  Json     // StatusHistoryEntry[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

---

**Última actualización:** 2025-11-29
**Versión:** 2.0
