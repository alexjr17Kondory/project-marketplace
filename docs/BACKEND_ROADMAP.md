# Backend Roadmap - Marketplace

## ESTADO ACTUAL

**Fecha:** 2025-12-02
**Entorno:** Docker (MariaDB + Backend + Frontend)
**Estado General:** 100% Completado

---

## STACK TECNOL GICO

| Componente | Tecnolog a | Estado |
|------------|------------|--------|
| **Runtime** | Node.js 20 LTS | ✅ |
| **Framework** | Express.js | ✅ |
| **Lenguaje** | TypeScript | ✅ |
| **ORM** | Prisma | ✅ |
| **Base de Datos** | MariaDB (Docker) | ✅ |
| **Autenticaci n** | JWT + bcrypt | ✅ |
| **Validaci n** | Zod | ✅ |
| **Documentaci n** | Swagger/OpenAPI | ✅ |
| **Storage** | Cloudinary | ✅ |
| **Email** | Nodemailer | ✅ |
| **Pagos** | Wompi Webhooks | ✅ |

---

## ARQUITECTURA DOCKER

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  marketplace-   │  │  marketplace-   │  │  marketplace-   │
│    frontend     │  │    backend      │  │       db        │
│                 │  │                 │  │                 │
│  Port: 5173     │  │  Port: 3001     │  │  Port: 3307     │
│  (Vite + React) │  │  (Express API)  │  │  (MariaDB)      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         │   HTTP/REST API    │    TCP/IP          │
         └────────────────────┴────────────────────┘
```

### URLs del Entorno

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 3001 | http://localhost:3001/api |
| MariaDB | 3307 | localhost:3307 |
| Swagger Docs | 3001 | http://localhost:3001/api-docs |

---

## ESTRUCTURA DEL PROYECTO

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express configuration
│   │
│   ├── config/
│   │   ├── database.ts          # Prisma client ✅
│   │   ├── swagger.ts           # Swagger config ✅
│   │   └── cors.ts              # CORS config ✅
│   │
│   ├── routes/
│   │   ├── index.ts                  # Router principal ✅
│   │   ├── auth.routes.ts            # /api/auth/* ✅
│   │   ├── users.routes.ts           # /api/users/* ✅
│   │   ├── products.routes.ts        # /api/products/* ✅
│   │   ├── orders.routes.ts          # /api/orders/* ✅
│   │   ├── roles.routes.ts           # /api/roles/* ✅
│   │   ├── catalogs.routes.ts        # /api/catalogs/* ✅
│   │   ├── settings.routes.ts        # /api/settings/* ✅
│   │   ├── uploads.routes.ts         # /api/uploads/* ✅
│   │   ├── webhooks.routes.ts        # /api/webhooks/* ✅
│   │   ├── zone-types.routes.ts      # /api/zone-types/* ✅
│   │   ├── input-types.routes.ts     # /api/input-types/* ✅
│   │   ├── inputs.routes.ts          # /api/inputs/* ✅
│   │   ├── input-batches.routes.ts   # /api/input-batches/* ✅
│   │   └── template-zones.routes.ts  # /api/template-zones/* ✅
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts           ✅
│   │   ├── users.controller.ts          ✅
│   │   ├── products.controller.ts       ✅
│   │   ├── orders.controller.ts         ✅
│   │   ├── roles.controller.ts          ✅
│   │   ├── catalogs.controller.ts       ✅
│   │   ├── settings.controller.ts       ✅
│   │   ├── uploads.controller.ts        ✅
│   │   ├── webhooks.controller.ts       ✅
│   │   ├── zone-types.controller.ts     ✅
│   │   ├── input-types.controller.ts    ✅
│   │   ├── inputs.controller.ts         ✅
│   │   ├── input-batches.controller.ts  ✅
│   │   └── template-zones.controller.ts ✅
│   │
│   ├── services/
│   │   ├── auth.service.ts              ✅
│   │   ├── users.service.ts             ✅
│   │   ├── products.service.ts          ✅
│   │   ├── orders.service.ts            ✅
│   │   ├── roles.service.ts             ✅
│   │   ├── catalogs.service.ts          ✅
│   │   ├── settings.service.ts          ✅
│   │   ├── storage.service.ts           ✅
│   │   ├── email.service.ts             ✅
│   │   ├── wompi.service.ts             ✅
│   │   ├── zone-types.service.ts        ✅
│   │   ├── input-types.service.ts       ✅
│   │   ├── inputs.service.ts            ✅
│   │   ├── input-batches.service.ts     ✅
│   │   └── template-zones.service.ts    ✅
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts    ✅
│   │   ├── validate.middleware.ts ✅
│   │   └── error.middleware.ts   ✅
│   │
│   ├── validators/
│   │   ├── auth.validator.ts     ✅
│   │   ├── users.validator.ts    ✅
│   │   ├── products.validator.ts ✅
│   │   ├── orders.validator.ts   ✅
│   │   ├── roles.validator.ts    ✅
│   │   ├── catalogs.validator.ts ✅
│   │   └── settings.validator.ts ✅
│   │
│   ├── types/
│   │   └── express.d.ts          ✅
│   │
│   └── utils/
│       ├── errors.ts             ✅
│       └── pagination.ts         ✅
│
├── prisma/
│   ├── schema.prisma             ✅
│   ├── migrations/               ✅
│   └── seed.ts                   ✅ (29 productos, 4 usuarios, catálogos)
│
├── Dockerfile                    ✅
├── package.json                  ✅
├── tsconfig.json                 ✅
└── .env                          ✅
```

---

## ESTADO DE IMPLEMENTACION POR FASE

### FASE 1: Setup Inicial ✅ COMPLETADA

- [x] Proyecto Express + TypeScript configurado
- [x] Docker Compose con MariaDB
- [x] Prisma ORM configurado
- [x] Esquema de base de datos completo
- [x] Migraciones funcionando
- [x] Health check endpoint
- [x] Swagger documentation

### FASE 2: Autenticacion ✅ COMPLETADA

- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] GET /api/auth/me
- [x] PUT /api/auth/me (actualizar perfil)
- [x] PUT /api/auth/change-password
- [x] POST /api/auth/forgot-password
- [x] POST /api/auth/reset-password
- [x] JWT con expiracion (7 dias)
- [x] Middleware de autenticacion
- [x] Middleware requireAdmin

### FASE 3: API de Usuarios ✅ COMPLETADA

- [x] GET /api/users (lista paginada + filtros)
- [x] GET /api/users/:id
- [x] PUT /api/users/:id
- [x] DELETE /api/users/:id
- [x] PATCH /api/users/:id/status
- [x] Filtros: status, role, search
- [x] Paginacion y ordenamiento

### FASE 4: API de Roles ✅ COMPLETADA

- [x] GET /api/roles
- [x] GET /api/roles/:id
- [x] POST /api/roles
- [x] PUT /api/roles/:id
- [x] DELETE /api/roles/:id
- [x] POST /api/roles/assign
- [x] GET /api/roles/permissions
- [x] GET /api/roles/stats
- [x] 24 permisos en 8 modulos
- [x] Proteccion de roles del sistema

### FASE 5: API de Productos ✅ COMPLETADA

- [x] GET /api/products (lista publica + filtros)
- [x] GET /api/products/:id
- [x] POST /api/products (admin)
- [x] PUT /api/products/:id (admin)
- [x] DELETE /api/products/:id (admin)
- [x] Filtros: category, type, price, featured, inStock
- [x] Busqueda por nombre
- [x] Ordenamiento multiple

### FASE 6: API de Catalogos ✅ COMPLETADA

- [x] CRUD /api/catalogs/sizes
- [x] CRUD /api/catalogs/colors
- [x] CRUD /api/catalogs/categories
- [x] CRUD /api/catalogs/product-types

### FASE 6.1: API de Templates y Zonas ✅ COMPLETADA

- [x] CRUD /api/zone-types (tipos de zona globales)
- [x] CRUD /api/input-types (tipos de insumo)
- [x] CRUD /api/inputs (inventario de insumos)
- [x] CRUD /api/input-batches (lotes de inventario)
- [x] CRUD /api/template-zones (zonas por template)
- [x] POST /api/template-zones/:id/input (asignar insumo a zona)
- [x] DELETE /api/template-zones/:id/input (desasignar insumo)

### FASE 7: API de Pedidos ✅ COMPLETADA

- [x] POST /api/orders
- [x] GET /api/orders (admin)
- [x] GET /api/orders/:id
- [x] PATCH /api/orders/:id/status
- [x] GET /api/orders/my-orders
- [x] Generacion de orderNumber
- [x] Timeline de estados
- [x] Calculo de totales

### FASE 8: Configuracion ✅ COMPLETADA

- [x] GET /api/settings/public
- [x] GET /api/settings (admin)
- [x] GET /api/settings/:key
- [x] PUT /api/settings/:key (admin)
- [x] Configuraciones: general, appearance, home, shipping, payment, legal

### FASE 9: Integracion Frontend ✅ COMPLETADA

- [x] Servicios API en frontend (api.service.ts)
- [x] ProductsContext conectado a API
- [x] AuthContext conectado a API
- [x] CatalogsContext conectado a API
- [x] Variable VITE_API_URL configurada

### FASE 10: Storage de Imagenes ✅ COMPLETADA

- [x] Configurar Cloudinary (config/cloudinary.ts)
- [x] POST /api/uploads/image (file, base64, url)
- [x] POST /api/uploads/images (multiple)
- [x] DELETE /api/uploads/image
- [x] Carpetas: products, designs, avatars
- [x] Optimizacion automatica
- [x] Multer para multipart/form-data

### FASE 11: Emails y Webhooks ✅ COMPLETADA

- [x] Configurar Nodemailer (config/email.ts)
- [x] Templates de email HTML
  - Confirmacion de pedido
  - Actualizacion de estado
  - Recuperacion de contrasena
  - Email de bienvenida
- [x] POST /api/webhooks/wompi
- [x] GET /api/webhooks/wompi/verify/:transactionId
- [x] Validacion de firma SHA256
- [x] Procesamiento de transacciones (APPROVED, DECLINED, VOIDED)
- [x] Notificaciones automaticas por email

---

## ENDPOINTS DISPONIBLES

### Autenticacion
```
POST   /api/auth/register         # Registro publico
POST   /api/auth/login            # Login
GET    /api/auth/me               # Perfil actual
PUT    /api/auth/me               # Actualizar perfil
PUT    /api/auth/change-password  # Cambiar contrasena
POST   /api/auth/forgot-password  # Solicitar reset
POST   /api/auth/reset-password   # Resetear contrasena
```

### Usuarios (Admin)
```
GET    /api/users                 # Lista usuarios
GET    /api/users/:id             # Detalle usuario
PUT    /api/users/:id             # Actualizar usuario
DELETE /api/users/:id             # Eliminar usuario
PATCH  /api/users/:id/status      # Cambiar estado
```

### Roles (Admin)
```
GET    /api/roles                 # Lista roles
GET    /api/roles/:id             # Detalle rol
POST   /api/roles                 # Crear rol
PUT    /api/roles/:id             # Actualizar rol
DELETE /api/roles/:id             # Eliminar rol
POST   /api/roles/assign          # Asignar rol a usuario
GET    /api/roles/permissions     # Lista permisos
GET    /api/roles/stats           # Estadisticas
```

### Productos
```
GET    /api/products              # Lista (publico)
GET    /api/products/:id          # Detalle (publico)
POST   /api/products              # Crear (admin)
PUT    /api/products/:id          # Actualizar (admin)
DELETE /api/products/:id          # Eliminar (admin)
```

### Catalogos
```
GET    /api/catalogs/sizes        # Lista tallas
POST   /api/catalogs/sizes        # Crear talla (admin)
PUT    /api/catalogs/sizes/:id    # Actualizar talla (admin)
DELETE /api/catalogs/sizes/:id    # Eliminar talla (admin)

GET    /api/catalogs/colors       # Lista colores
POST   /api/catalogs/colors       # Crear color (admin)
PUT    /api/catalogs/colors/:id   # Actualizar color (admin)
DELETE /api/catalogs/colors/:id   # Eliminar color (admin)

GET    /api/catalogs/categories   # Lista categorias
POST   /api/catalogs/categories   # Crear categoria (admin)
PUT    /api/catalogs/categories/:id    # Actualizar (admin)
DELETE /api/catalogs/categories/:id    # Eliminar (admin)

GET    /api/catalogs/product-types     # Lista tipos
POST   /api/catalogs/product-types     # Crear tipo (admin)
PUT    /api/catalogs/product-types/:id # Actualizar (admin)
DELETE /api/catalogs/product-types/:id # Eliminar (admin)
```

### Tipos de Zona
```
GET    /api/zone-types            # Lista tipos de zona (público)
GET    /api/zone-types/:id        # Detalle tipo de zona (público)
POST   /api/zone-types            # Crear tipo (admin)
PUT    /api/zone-types/:id        # Actualizar tipo (admin)
DELETE /api/zone-types/:id        # Eliminar tipo (admin)
```

### Tipos de Insumo
```
GET    /api/input-types           # Lista tipos de insumo (admin)
GET    /api/input-types/:id       # Detalle tipo de insumo (admin)
POST   /api/input-types           # Crear tipo (admin)
PUT    /api/input-types/:id       # Actualizar tipo (admin)
DELETE /api/input-types/:id       # Eliminar tipo (admin)
```

### Inventario de Insumos
```
GET    /api/inputs                # Lista insumos (admin)
GET    /api/inputs/:id            # Detalle insumo (admin)
POST   /api/inputs                # Crear insumo (admin)
PUT    /api/inputs/:id            # Actualizar insumo (admin)
DELETE /api/inputs/:id            # Eliminar insumo (admin)
GET    /api/inputs/low-stock      # Insumos con stock bajo (admin)
POST   /api/inputs/:id/recalculate-stock  # Recalcular stock (admin)
```

### Zonas de Template
```
GET    /api/template-zones/template/:templateId  # Zonas de un template
GET    /api/template-zones/:id                   # Detalle zona
POST   /api/template-zones/template/:templateId  # Crear zona (admin)
PUT    /api/template-zones/:id                   # Actualizar zona (admin)
DELETE /api/template-zones/:id                   # Eliminar zona (admin)
POST   /api/template-zones/:id/input             # Asignar insumo a zona (admin)
DELETE /api/template-zones/:id/input             # Desasignar insumo (admin)
```

### Pedidos
```
POST   /api/orders                # Crear pedido
GET    /api/orders                # Lista (admin)
GET    /api/orders/:id            # Detalle
PATCH  /api/orders/:id/status     # Cambiar estado (admin)
GET    /api/orders/my-orders      # Mis pedidos (usuario)
```

### Configuracion
```
GET    /api/settings/public       # Config publica
GET    /api/settings              # Toda la config (admin)
GET    /api/settings/:key         # Config especifica
PUT    /api/settings/:key         # Actualizar (admin)
```

### Uploads
```
POST   /api/uploads/image         # Subir imagen (file/url/base64)
POST   /api/uploads/images        # Subir multiples imagenes
DELETE /api/uploads/image         # Eliminar imagen
```

### Webhooks
```
POST   /api/webhooks/wompi        # Webhook de Wompi
GET    /api/webhooks/wompi/verify/:transactionId  # Verificar transaccion
```

### Sistema
```
GET    /api/health                # Health check
```

---

## BASE DE DATOS

### Datos Sembrados (Seed)

| Tabla | Cantidad | Descripcion |
|-------|----------|-------------|
| Users | 3 | Admin, vendedor, cliente |
| Roles | 3 | SuperAdmin, Administrador, Cliente |
| Products | 25 | Productos regulares |
| Templates | 2 | Camiseta (4 zonas), Taza (1 zona) |
| TemplateZones | 5 | Zonas personalizables |
| ZoneTypes | 5 | Frente, Espalda, Mangas, Alrededor, Superior |
| InputTypes | 6 | DTF, Vinilo, Sublimación, etc |
| Inputs | 6 | Inventario de insumos con stock |
| Categories | 5 | Ropa, Bebidas, Hogar, etc |
| ProductTypes | 22 | Camiseta, taza, gorra, etc |
| Sizes | 7 | XS a XXL + Unica |
| Colors | 15 | Blanco a Gris |
| Settings | 4 | general, shipping, payment, appearance |

### Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@marketplace.com | admin123 | SuperAdmin |
| vendedor@marketplace.com | vendedor123 | Administrador |
| cliente@marketplace.com | cliente123 | Cliente |

---

## COMANDOS UTILES

```bash
# Desarrollo con Docker
docker-compose up -d              # Iniciar todo
docker-compose logs -f backend    # Ver logs del backend
docker-compose down               # Detener todo

# Prisma
docker exec marketplace-backend npx prisma migrate dev
docker exec marketplace-backend npx prisma db seed
docker exec marketplace-backend npx prisma studio

# Testing de endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/products
curl http://localhost:3001/api/catalogs/categories
```

---

## PROXIMOS PASOS

El backend esta 100% completado. Los siguientes pasos son:

1. **Configurar credenciales** - Agregar claves de Cloudinary, SMTP y Wompi en variables de entorno
2. **Testing de integracion** - Probar uploads, emails y webhooks en produccion
3. **Frontend** - Conectar OrdersContext, UsersContext, RolesContext con la API

---

---

## CHANGELOG

### v3.1 (2025-12-02)
- ✅ Sistema de Templates y Zonas Personalizables
  - API de Zone Types (tipos de zona globales)
  - API de Input Types y Inputs (gestión de inventario)
  - API de Input Batches (lotes de inventario)
  - API de Template Zones (zonas de personalización por template)
  - Endpoints para asignar/desasignar insumos a zonas
- ✅ 5 nuevos módulos agregados (15 archivos)
- ✅ Seed actualizado con templates y zonas de ejemplo
- ✅ Manejo de stock con tipos Decimal en Prisma

### v3.0 (2025-11-30)
- ✅ Backend completado al 100%
- ✅ Todas las APIs implementadas
- ✅ Integraciones: Cloudinary, Nodemailer, Wompi
- ✅ Documentación Swagger completa

---

**Ultima actualizacion:** 2025-12-02
**Version:** 3.1
