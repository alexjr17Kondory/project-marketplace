# Roadmap de Desarrollo - Marketplace

## ESTADO GENERAL

**Fecha:** 2025-12-26
**Deploy Frontend:** https://project-marketplace.vercel.app
**Backend Local:** http://localhost:3001/api
**Progreso Total:** 98%

---

## RESUMEN DE ESTADO

| Fase | Nombre | Estado | Progreso |
|------|--------|--------|----------|
| 1 | MVP: Catalogo + Personalizador + Admin | ✅ | 100% |
| 2 | Usuarios + Autenticacion + Roles | ✅ | 100% |
| 3 | Pedidos + Pagos + Historial | ✅ | 100% |
| 4 | Facturacion + Despachos Avanzados | ⚪ | Futuro |
| 5 | Notificaciones + Emails | ⚪ | 0% |
| 6 | Configuracion General | ✅ | 100% |
| 7 | Backend + Base de Datos | ✅ | 95% |
| 8 | Punto de Venta (POS) | ✅ | 100% |
| 9 | Compras e Inventario | 🟡 | 0% |
| 10 | App Movil | ⚪ | Futuro |

---

## FASE 1: MVP - CATALOGO + PERSONALIZADOR + ADMIN ✅

**Estado:** 100% Completado

### Completado
- [x] Proyecto Vite + React + TypeScript + Tailwind
- [x] Componentes base (Layout, Header, Footer, Button, Input, Modal, Toast)
- [x] Catalogo de productos con filtros y ordenamiento
- [x] Canvas 2D con renderizado realista
- [x] 6 tipos de productos personalizables
- [x] Sistema de carrito con persistencia
- [x] Panel Admin con Dashboard
- [x] CRUD de Productos
- [x] Gestion de Catalogos (tipos, categorias, colores, tallas)

---

## FASE 2: USUARIOS + AUTENTICACION + ROLES ✅

**Estado:** 100% Completado

### Completado
- [x] Login y Registro
- [x] Recuperacion de contrasena
- [x] AuthContext con JWT
- [x] Proteccion de rutas por rol
- [x] Gestion de usuarios clientes
- [x] Gestion de administradores
- [x] Sistema de roles y permisos (27 permisos, 8 modulos)
- [x] Perfil de usuario
- [x] Direcciones guardadas

---

## FASE 3: PEDIDOS + PAGOS + HISTORIAL ✅

**Estado:** 100% Completado

### Completado
- [x] Checkout completo
- [x] Multiples metodos de pago
- [x] Integracion Wompi (pasarela Colombia)
- [x] Sistema de estados de pedido
- [x] Timeline/historial de pedidos
- [x] Panel de gestion de pedidos (admin)
- [x] Panel de gestion de pagos (admin)
- [x] Mis Pedidos (cliente)

---

## FASE 4: FACTURACION + DESPACHOS AVANZADOS

**Estado:** Futuro (No prioritario)

### Pendiente
- [ ] Generacion de facturas PDF
- [ ] Datos fiscales configurables
- [ ] Metodos de envio configurables
- [ ] Integracion con couriers
- [ ] Tracking de envios

---

## FASE 5: NOTIFICACIONES + EMAILS

**Estado:** No iniciada

### Pendiente
- [ ] Configurar servicio de email (Resend)
- [ ] Templates de email transaccionales
- [ ] Sistema de notificaciones in-app
- [ ] Configuracion de notificaciones (admin)

---

## FASE 6: CONFIGURACION GENERAL ✅

**Estado:** 100% Completado

### Completado
- [x] Pagina SettingsPage con tabs
- [x] Datos del negocio
- [x] Configuracion de envios y transportadoras
- [x] Configuracion de metodos de pago
- [x] Paginas legales editables

---

## FASE 7: BACKEND + BASE DE DATOS ✅

**Estado:** 98% Completado
**Documentacion:** [BACKEND_ROADMAP.md](./BACKEND_ROADMAP.md)

### Stack
- Node.js + Express + TypeScript
- MariaDB (Docker)
- Prisma ORM
- JWT + bcrypt
- Swagger/OpenAPI

### APIs Implementadas ✅

| API | Endpoints | Estado |
|-----|-----------|--------|
| Auth | register, login, me, change-password, forgot/reset | ✅ |
| Users | CRUD + status | ✅ |
| Roles | CRUD + assign + permissions | ✅ |
| Products | CRUD + filtros | ✅ |
| Catalogs | sizes, colors, categories, product-types | ✅ |
| Orders | CRUD + status + my-orders | ✅ |
| Settings | public, admin, por key | ✅ |
| Zone Types | CRUD + filtros | ✅ |
| Input Types | CRUD + filtros | ✅ |
| Inputs | CRUD + stock + filtros | ✅ |
| Template Zones | CRUD + zone inputs | ✅ |
| Design Images | CRUD + categories + filtros | ✅ |
| Payments | CRUD + verify + refund + stats | ✅ |

### Integracion Frontend ✅

| Contexto | Conectado a API | Estado |
|----------|-----------------|--------|
| AuthContext | ✅ | Funcionando |
| ProductsContext | ✅ | Funcionando |
| CatalogsContext | ✅ | Funcionando |
| OrdersContext | ✅ | Funcionando |
| UsersContext | ✅ | Funcionando |
| RolesContext | ✅ | Funcionando |
| SettingsContext | ✅ | Funcionando |

### Pendiente
- [ ] Uploads API (Cloudinary)
- [ ] Emails transaccionales
- [ ] Webhooks (Wompi)

### Base de Datos

| Tabla | Registros |
|-------|-----------|
| Users | 3 |
| Roles | 3 |
| Products | 25 |
| Templates | 2 (Camiseta, Taza) |
| Categories | 5 |
| ProductTypes | 22 |
| Sizes | 7 |
| Colors | 15 |
| ZoneTypes | 5 |
| TemplateZones | 5 |
| InputTypes | 6 |
| Inputs | 6 |
| DesignImages | variable |
| Payments | 0 (nuevo) |
| Settings | 4 |

### Usuarios de Prueba (1 por rol)

| Email | Password | Rol | roleId |
|-------|----------|-----|--------|
| admin@marketplace.com | admin123 | SuperAdmin | 1 |
| cliente@marketplace.com | cliente123 | Cliente | 2 |
| vendedor@marketplace.com | vendedor123 | Administrador | 3 |

### Estructura de Roles

| roleId | Nombre | Tipo | Acceso Admin |
|--------|--------|------|--------------|
| 1 | SuperAdmin | Sistema (no editable) | ✅ Total |
| 2 | Cliente | Sistema (no editable) | ❌ Ninguno |
| 3+ | Personalizables | Editables | ✅ Panel Admin |

---

## FASE 8: PUNTO DE VENTA (POS) ✅

**Estado:** 100% Completado

### Completado
- [x] Sistema de Cajas Registradoras (CRUD completo)
- [x] Sesiones de Caja (apertura/cierre con conteo de efectivo)
- [x] Sistema de Variantes de Producto (SKU, código de barras, stock)
- [x] Generación de Códigos de Barras (Code128, EAN13, UPC)
- [x] Plantillas de Etiquetas Personalizables
- [x] Impresión de Etiquetas con Códigos de Barras
- [x] App POS separada con navegación propia
- [x] Dashboard POS con estadísticas de sesión
- [x] Nueva Venta con scanner de código de barras
- [x] Historial de Ventas con reimpresión de tickets
- [x] Gestión de Caja (ver sesión activa, cerrar sesión)
- [x] Componente OpenSessionPrompt reutilizable
- [x] Impresión de tickets/facturas después de venta
- [x] Permisos específicos: pos.access, pos.cash_register, pos.open_close_session

### Estructura de la App POS
```
/pos                    → POSDashboard (requiere sesión abierta)
/pos/new-sale          → Nueva Venta con scanner
/pos/history           → Historial de Ventas
/pos/cash-register     → Gestión de Caja Actual
```

### Páginas Admin Relacionadas
```
/admin-panel/variants        → Gestión de Variantes (SKU, stock)
/admin-panel/cash-registers  → Gestión de Cajas Registradoras
/admin-panel/settings/label-templates → Plantillas de Etiquetas
```

---

## FASE 9: COMPRAS E INVENTARIO

**Estado:** No iniciada (Próxima fase)

### Backend Pendiente
- [ ] **Modelo Supplier (Proveedores)**
  - id, name, ruc/nit, email, phone, address
  - contactPerson, paymentTerms, notes
  - isActive, createdAt, updatedAt

- [ ] **Modelo PurchaseOrder (Órdenes de Compra)**
  - id, supplierId, orderNumber
  - status: DRAFT, SENT, CONFIRMED, PARTIAL, RECEIVED, CANCELLED
  - subtotal, tax, discount, total
  - expectedDate, receivedDate
  - notes, createdBy, createdAt, updatedAt

- [ ] **Modelo PurchaseOrderItem (Items de OC)**
  - id, purchaseOrderId, variantId/inputId
  - quantity, unitCost, subtotal
  - quantityReceived, notes

- [ ] **Modelo InventoryMovement (Movimientos de Inventario)**
  - id, type: IN, OUT, ADJUSTMENT, TRANSFER
  - variantId/inputId, quantity
  - reason, reference, notes
  - userId, createdAt

- [ ] **API de Proveedores**
  - CRUD completo
  - Listado con filtros y paginación
  - Historial de compras por proveedor

- [ ] **API de Órdenes de Compra**
  - CRUD completo
  - Cambio de estados
  - Recepción parcial/completa
  - Afecta stock automáticamente al recibir

- [ ] **API de Movimientos de Inventario**
  - Registro manual de entradas/salidas
  - Ajustes de inventario
  - Historial con filtros

### Frontend Pendiente
- [ ] **Página de Proveedores** `/admin-panel/suppliers`
  - DataTable con CRUD
  - Vista detalle con historial de compras

- [ ] **Página de Órdenes de Compra** `/admin-panel/purchase-orders`
  - Lista de OCs con filtros por estado
  - Crear/Editar OC con items
  - Recepción de mercancía

- [ ] **Página de Movimientos** `/admin-panel/inventory-movements`
  - Historial de movimientos
  - Formulario de ajuste manual

### Integración con Módulos Existentes
- [ ] Vincular Variants con movimientos de stock
- [ ] Vincular Inputs con movimientos de stock
- [ ] Alertas de stock bajo
- [ ] Reportes de inventario

---

## FASE 10: APP MOVIL

**Estado:** Futuro

### Pendiente
- [ ] Expo + React Native
- [ ] WebView del sitio
- [ ] Notificaciones push
- [ ] Publicacion en stores

---

## PROXIMOS PASOS RECOMENDADOS

### Prioridad Alta
1. **Uploads API**
   - Configurar Cloudinary
   - Subida de imagenes de productos
   - Subida de disenos personalizados

2. **Conectar SettingsContext**
   - Adaptar estructura compleja del frontend

### Prioridad Media
3. **Emails transaccionales**
   - Configurar Resend
   - Email de bienvenida
   - Confirmacion de pedido
   - Cambio de estado

4. **Webhooks de pago**
   - Integracion Wompi webhooks
   - Actualizacion automatica de estado

### Prioridad Baja
5. **Optimizaciones**
   - Cache de productos
   - Lazy loading de imagenes
   - PWA

---

## COMANDOS DE DESARROLLO

```bash
# Iniciar todo con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener
docker-compose down

# Reiniciar backend
docker restart marketplace-backend

# Ejecutar seed
docker exec marketplace-backend npx prisma db seed

# Ver base de datos
docker exec marketplace-backend npx prisma studio
```

---

## URLS DEL PROYECTO

| Servicio | URL |
|----------|-----|
| Frontend (local) | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api-docs |
| Health Check | http://localhost:3001/api/health |
| Frontend (prod) | https://project-marketplace.vercel.app |

---

## CHANGELOG RECIENTE

### v5.8 (2025-12-26)
- ✅ **Sistema de Punto de Venta (POS) Completo**
  - App POS separada con layout y navegación propia
  - Cajas registradoras con CRUD completo
  - Sesiones de caja con apertura/cierre y conteo de efectivo
  - Sistema de variantes de producto con SKU y código de barras
  - Generación de códigos de barras (Code128, EAN13, UPC)
  - Plantillas de etiquetas personalizables
  - Impresión de etiquetas con códigos de barras
  - Nueva venta con scanner de código de barras
  - Historial de ventas con reimpresión de tickets
  - Componente OpenSessionPrompt reutilizable en todas las vistas POS
  - Permisos específicos: pos.access, pos.cash_register, pos.open_close_session
- ✅ **Estandarización de Páginas Admin**
  - CashRegistersPage con Modal, Button, Input compartidos
  - VariantsPage con DataTable y stats cards
  - AdminLayout con padding correcto en main (p-6)
  - AppSwitcher para cambiar entre Admin Panel y POS
- ✅ **Mejoras de UX**
  - Todas las páginas POS muestran OpenSessionPrompt si no hay sesión activa
  - Impresión automática de ticket después de completar venta
  - Reimpresión desde historial de ventas

### v5.7 (2025-12-25)
- ✅ **Sistema de Trazabilidad de Pagos**
  - Nueva tabla `Payment` con modelo relacional completo
  - Enum `PaymentStatus` con 9 estados (PENDING, PROCESSING, APPROVED, DECLINED, FAILED, CANCELLED, EXPIRED, REFUNDED, PARTIAL_REFUND)
  - Relación uno-a-muchos: un pedido puede tener múltiples intentos de pago
  - Campos para rastrear transacciones, métodos de pago, comprobantes y verificación manual
  - API completa de pagos con endpoints para crear, listar, verificar, reembolsar y cancelar
  - Estadísticas de pagos por estado y método
  - Soporte para verificación manual por parte de administradores
  - Sin campos JSON para optimizar consultas rápidas
  - Timestamps completos: initiatedAt, paidAt, failedAt, cancelledAt, expiredAt
  - Sistema de reembolsos parciales y completos
  - Integrado con sistema de pedidos para actualización automática de estados

### v5.6 (2025-12-13)
- ✅ **Catálogo de Imágenes de Diseño**
  - Nueva tabla `DesignImages` con thumbnailUrl (LongText base64) y fullUrl
  - API CRUD completa para gestión de imágenes prediseñadas
  - Página admin `/admin-panel/design-images` con grid, filtros y modal CRUD
  - Carrusel actualizado para cargar imágenes desde API (DesignImagesService)
  - Sistema de doble URL: thumbnail para preview, fullUrl para pedido
  - Compresión automática de imágenes a PNG (máx 300px, transparencia preservada)
  - Sin límite de tamaño de entrada (se redimensiona automáticamente)
- ✅ **Exportación de Mockups Mejorada**
  - Generación de imágenes compuestas (template + diseño) como mockups
  - Solo descarga mockups (no imágenes sueltas del diseño)
  - Colorización automática de todas las vistas al exportar
  - Canvas rendering con soporte CORS y fallback
  - Mockups en PNG de 1200px manteniendo aspect ratio
- ✅ **Limpieza de código**
  - Eliminado Fabric.js (no se usará)
  - Eliminado ImageEditor component
  - Simplificado flujo del personalizador

### v5.5 (2025-12-12)
- ✅ **Personalizador Avanzado**
  - Sistema de máscaras SVG para zonas bloqueadas
  - Colorización dinámica de templates PNG
  - Exportación ZIP de diseños personalizados
  - Transparencia PNG y toggle de zonas
  - Modo edición mejorado y estabilidad
  - Valores parametrizables en página de personalización
- ✅ **Mejoras de UI/UX**
  - Visualización mejorada de imagen en carrito
  - Ajustes en personalización de la página

### v5.4 (2025-12-03)
- ✅ **Sistema de Templates y Zonas** (completado)
  - Gestión completa de templates/modelos con páginas admin
  - Sistema de zonas de template con inventario
  - Filtrado de tallas por tipo de producto
  - Relación tipo de producto - tallas
- ✅ **Refactorización de Base de Datos**
  - Migración de colores y tallas a tablas relacionales
  - Productos con foreign keys para categorías y tipos
  - Campo images cambiado de array a estructura objeto
  - Eliminación de columnas JSON en favor de tablas relacionales
- ✅ **Frontend Adaptado**
  - Selectores de catálogo para colores y tallas en ProductForm
  - Manejo del nuevo formato objeto para colores/tallas
  - Frontend adaptado a estructura de foreign keys del backend

### v5.3 (2025-12-02)
- ✅ Sistema de Templates y Zonas Personalizables
  - API de Zone Types (tipos de zona: Frente, Espalda, Mangas, etc.)
  - API de Input Types y Inputs (gestión de inventario)
  - API de Template Zones (zonas de personalización por template)
  - Páginas de administración: ZoneTypesPage, InputTypesPage, InputsPage
  - Formularios: ZoneTypeDetailPage, InputTypeDetailPage, InputDetailPage
  - Componente TemplateZonesManager para gestionar zonas en templates
- ✅ Corrección Frontend-Backend
  - Corregido acceso a datos de API (response.data en lugar de response.data.data)
  - Interfaces TypeScript sincronizadas con backend
  - Manejo correcto de campos Decimal de Prisma (currentStock, minStock, maxStock, unitCost)
- ✅ Seed actualizado con datos de ejemplo
  - 2 templates: Camiseta Personalizable y Taza 11oz
  - 5 zonas de template configuradas
  - 5 tipos de zona globales
  - 6 tipos de insumo y 6 insumos de ejemplo

### v5.2 (2025-11-30)
- ✅ SettingsContext conectado a API
- ✅ Backend ampliado con nuevos endpoints:
  - `/settings/general/config` - Configuración general
  - `/settings/appearance/config` - Apariencia
  - `/settings/shipping/config` - Envíos completo
  - `/settings/home/config` - Página de inicio
  - `/settings/catalog/config` - Catálogo
  - `/settings/legal/config` - Páginas legales
- ✅ Servicio settings.service.ts actualizado
- ✅ Todas las configuraciones persisten en base de datos

### v5.1 (2025-11-30)
- ✅ Integracion Frontend-Backend completada
- ✅ OrdersContext conectado a API
- ✅ UsersContext conectado a API
- ✅ RolesContext conectado a API
- ✅ Estructura de roles corregida:
  - roleId 1: SuperAdmin (sistema, no editable, acceso total)
  - roleId 2: Cliente (sistema, no editable, sin acceso admin)
  - roleId 3+: Roles personalizables con acceso admin
- ✅ Servicios: orders.service, users.service, roles.service

### v5.0 (2025-11-30)
- ✅ Backend completado (85%)
- ✅ APIs: Auth, Users, Roles, Products, Orders, Catalogs, Settings
- ✅ Docker Compose funcionando
- ✅ Seed con 29 productos y catalogos completos
- ✅ Frontend conectado: AuthContext, ProductsContext, CatalogsContext
- ✅ Documentacion actualizada

### v4.3 (2025-11-29)
- ✅ Creado roadmap detallado del backend
- ✅ Esquema Prisma completo
- ✅ Plan de 10 fases para backend

### v4.2 (2025-11-29)
- ✅ Sistema de recuperacion de contrasena
- ✅ Tokens de reset con expiracion

### v4.1 (2025-11-29)
- ✅ Sistema de roles y permisos completo
- ✅ 27 permisos en 8 modulos

---

**Ultima actualizacion:** 2025-12-26
**Version:** 5.8
