# 🗺️ Roadmap de Desarrollo

## PLAN DE IMPLEMENTACIÓN POR FASES

---

## 📍 FASE 1: MVP - CATÁLOGO + PERSONALIZADOR + ADMIN BÁSICO

**Estado:** 🟢 95% Completado
**Deploy:** ✅ https://project-marketplace.vercel.app

### ✅ Completado

#### Semana 1-2: Setup + Catálogo
- [x] Proyecto Vite + React + TypeScript + Tailwind
- [x] Estructura de carpetas y rutas
- [x] Componentes base (Layout, Header, Footer, Button, Input, Modal, Toast)
- [x] Catálogo de productos con filtros y ordenamiento
- [x] ProductCard, ProductGrid, ProductFilters

#### Semana 3: Personalizador
- [x] Canvas 2D con renderizado realista (sombras, costuras, texturas)
- [x] 6 tipos de productos (camiseta, hoodie, gorra, botella, taza, almohada)
- [x] 14 zonas de impresión diferentes
- [x] Sistema de tallas con escalado visual
- [x] Guía de tallas interactiva
- [x] 8 colores base
- [x] Subida de imágenes (2MB máx, PNG/JPG)
- [x] Controles de diseño (posición en cm, tamaño, rotación, bloqueo de proporción)
- [x] Export de preview como PNG

#### Semana 4: Carrito + Panel Admin
- [x] Sistema de carrito completo con persistencia localStorage
- [x] Cálculo de impuestos (16%) y envío (gratis >$50)
- [x] Panel Admin con Dashboard y estadísticas
- [x] CRUD de Productos (tabla con búsqueda, paginación, ordenamiento)
- [x] ProductForm completo (nombre, descripción, tipo, categoría, precio, stock, imágenes, colores, tallas)
- [x] Gestión de Catálogos:
  - [x] Tipos de producto
  - [x] Categorías
  - [x] Colores
  - [x] Tallas

### ⚪ Pendiente Fase 1
- [ ] Testing y refinamiento final
- [ ] Optimización de rendimiento

---

## 📍 FASE 2: USUARIOS + AUTENTICACIÓN + ROLES

**Estado:** ✅ 100% Completado
**Objetivo:** Sistema de usuarios con roles diferenciados (Cliente, Admin, SuperAdmin)

### Módulo de Autenticación
- [x] Página de Login con credenciales de prueba visibles
- [x] Página de Registro
- [x] Recuperación de contraseña (ForgotPasswordModal + ResetPasswordPage)
- [ ] Verificación de email (opcional/futuro)
- [x] Context: `AuthContext` (login, logout, register)
- [x] Hook: `useAuth`
- [x] Protección de rutas por rol
- [x] Logout limpia correctamente localStorage

### Módulo de Usuarios (Clientes)
- [x] Página `UsersPage` en Admin (lista de clientes con tabla)
- [x] Ver perfil de usuario (`UserDetailPage`)
- [x] Historial de pedidos del usuario
- [x] Direcciones guardadas del usuario
- [x] Activar/Desactivar usuario
- [x] Filtros: estado, fecha registro
- [x] Clientes no pueden cambiar de rol (protegido)

### Módulo de Administradores
- [x] Página `AdminUsersPage` en Admin (lista de administradores)
- [x] Crear nuevo administrador con selector de rol
- [x] Asignar rol desde RolesContext (roles personalizados)
- [x] Editar rol del administrador en detalle
- [x] SuperAdmin original protegido (no puede cambiar rol)
- [x] Permisos por módulo (estructura definida)
- [ ] Log de actividad del administrador (futuro)
- [x] Solo SuperAdmin puede crear/editar otros admins

### Sistema de Roles y Permisos
- [x] Página `RolesPage` con lista de roles en cards
- [x] Página `RoleFormPage` para crear/editar roles (vista independiente)
- [x] Context: `RolesContext` (CRUD de roles)
- [x] 27 permisos organizados en 8 módulos
- [x] Roles del sistema protegidos (SuperAdmin ID:0, Usuario ID:1)
- [x] Roles personalizados (ID:2+) editables
- [x] Permisos agrupados por módulo en UI
- [x] Barra de progreso de permisos
- [x] Selector de todos los permisos / ninguno

### Perfil de Usuario (Frontend público)
- [x] Página `ProfilePage`
- [x] Editar datos personales
- [x] Cambiar contraseña
- [x] Mis direcciones (CRUD)
- [x] Auto-llenado de datos en checkout

### Unificación de Contextos
- [x] `UsersContext` y `AuthContext` comparten misma fuente de datos
- [x] Usuarios creados en admin pueden iniciar sesión
- [x] Usuarios registrados en frontend aparecen en admin
- [x] Contraseñas genéricas: `admin123` (admins), `cliente123` (clientes)

### Entregables Fase 2
- [x] Sistema de autenticación completo
- [x] Gestión de usuarios clientes
- [x] Gestión de administradores con roles
- [x] Sistema de roles y permisos personalizable
- [x] Perfiles de usuario en frontend
- [x] Contextos unificados para sincronización

---

## 📍 FASE 3: PEDIDOS + HISTORIAL DE ESTADOS + PAGOS

**Estado:** ✅ 100% Completado
**Objetivo:** Sistema simple de pedidos con registro de cambio de estados (sin pagos reales)

### Flujo del Pedido (Estados)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PENDIENTE  │───►│ CONFIRMADO  │───►│ EN PROCESO  │───►│  COMPLETADO │
│   (Nuevo)   │    │   (Pago OK) │    │ (Producción)│    │  (Listo)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│  CANCELADO  │
└─────────────┘
```

### Estados del Pedido
| Estado | Descripción | Acción Admin |
|--------|-------------|--------------|
| `pending` | Pedido creado, esperando confirmación | Confirmar / Cancelar |
| `confirmed` | Pago verificado manualmente | Pasar a producción |
| `processing` | En producción (estampado) | Marcar completado |
| `completed` | Pedido listo/entregado | - |
| `cancelled` | Cancelado | - |

### Modelo de Datos

**Pedido (Order)**
```
- id
- orderNumber (ej: ORD-001)
- customerName
- customerEmail
- customerPhone
- items[] (productos del carrito)
- subtotal
- total
- status (pending, confirmed, processing, completed, cancelled)
- notes (notas del admin)
- createdAt
- updatedAt
```

**Timeline del Pedido (OrderTimeline)**
```
- id
- orderId
- status (estado al que cambió)
- changedBy (quién hizo el cambio)
- notes (comentario opcional)
- createdAt
```

### Checkout (Frontend - Simple)
- [x] Página `CheckoutPage` básica:
  - [x] Resumen del carrito
  - [x] Formulario de datos del cliente (nombre, email, teléfono)
  - [x] Dirección de entrega (texto libre)
  - [x] Selección de método de pago
  - [x] Botón "Confirmar Pedido"
- [x] Página `OrderConfirmationPage` (número de pedido generado)

### Módulo de Pedidos (Admin)
- [x] Página `OrdersPage` - Lista de pedidos con tabla
- [x] Tabla: #Orden, Cliente, Fecha, Total, Estado, Acciones
- [x] Filtros por estado
- [x] Búsqueda por número de orden o cliente
- [x] Página `OrderDetailPage`:
  - [x] Datos del cliente
  - [x] Productos del pedido (con preview)
  - [x] Timeline del pedido (historial de cambios de estado)
  - [x] Totales
- [x] Botones de cambio de estado con flujo completo
- [x] Campo de notas al cambiar estado
- [x] Subir evidencias de pago
- [x] Descargar diseños para producción (PNG)

### Mis Pedidos (Cliente)
- [x] Página `MyOrdersPage` - Ver mis pedidos por email
- [x] Ver estado actual y timeline

### Módulo de Pagos (Admin)
- [x] Página `PaymentsPage` - Panel de gestión de pagos
- [x] Estadísticas de pagos (total, pendientes, confirmados, cancelados)
- [x] Resumen por método de pago
- [x] Tabla de transacciones con filtros
- [x] Filtros por método, estado y rango de fechas

### Entregables Fase 3
- [x] Checkout con múltiples métodos de pago
- [x] Integración Wompi (pasarela de pagos Colombia)
- [x] Pago en punto físico (pickup)
- [x] Sistema de pedidos con cambio de estados
- [x] Timeline/historial de cada pedido
- [x] Panel de gestión de pedidos para admin
- [x] Panel de gestión de pagos para admin
- [x] Mis Pedidos para clientes

---

## 📍 FASE 4: FACTURACIÓN + DESPACHOS AVANZADOS

**Estado:** 🔮 Futuro (No prioritario)
**Objetivo:** Facturación electrónica y sistema de despachos avanzado

> ⚠️ **Nota:** Pagos ya integrados en Fase 3. Esta fase es para facturación y despachos avanzados.

### Integración de Pagos ✅ (Completado en Fase 3)
- [x] Pasarela de pagos Wompi (Colombia)
- [x] Pago con tarjeta en checkout
- [x] Múltiples métodos de pago (PSE, transferencia, efectivo, punto físico)
- [ ] Webhooks de confirmación automática

### Facturación (Futuro)
- [ ] Generación de facturas PDF
- [ ] Datos fiscales configurables
- [ ] Envío de factura por email

### Sistema de Despachos (Futuro)
- [ ] Métodos de envío configurables
- [ ] Cálculo de costos de envío
- [ ] Integración con couriers
- [ ] Tracking de envíos

---

## 📍 FASE 5: NOTIFICACIONES + EMAILS

**Estado:** ⚪ No iniciada
**Objetivo:** Sistema de notificaciones y emails transaccionales

### Emails Transaccionales
- [ ] Configurar servicio de email (SendGrid / Resend / AWS SES)
- [ ] Templates de email:
  - [ ] Bienvenida (registro)
  - [ ] Confirmación de pedido
  - [ ] Pago recibido
  - [ ] Pedido en producción
  - [ ] Pedido enviado (con tracking)
  - [ ] Pedido entregado
  - [ ] Pedido cancelado
  - [ ] Recuperación de contraseña
- [ ] Diseño responsive de emails
- [ ] Variables dinámicas (nombre, #orden, productos, etc.)

### Notificaciones en App
- [ ] Sistema de notificaciones internas
- [ ] Icono de campana en header con badge
- [ ] Lista de notificaciones
- [ ] Marcar como leída
- [ ] Tipos de notificación:
  - [ ] Nuevo pedido (admin)
  - [ ] Cambio de estado de pedido (cliente)
  - [ ] Stock bajo (admin)

### Configuración de Notificaciones (Admin)
- [ ] Página `NotificationConfigPage`
- [ ] Activar/desactivar emails por tipo
- [ ] Personalizar textos de email
- [ ] Email de prueba

### Entregables Fase 5
- Emails transaccionales automáticos
- Sistema de notificaciones in-app
- Configuración de notificaciones

---

## 📍 FASE 6: CONFIGURACIÓN GENERAL

**Estado:** ✅ 100% Completado
**Objetivo:** Configuración centralizada del sistema

### Configuración del Negocio
- [x] Página `SettingsPage` en Admin (con tabs)
- [x] Datos del negocio:
  - [x] Nombre de la tienda
  - [x] Logo
  - [x] Dirección
  - [x] Teléfono
  - [x] Email de contacto
  - [x] Redes sociales (Facebook, Instagram, WhatsApp)
- [ ] Datos fiscales (para facturas)
- [ ] Horario de atención

### Configuración de Envíos
- [x] Origen de envío (dirección de salida de paquetes)
- [x] Zonas geográficas
- [x] Transportadoras con tarifas por zona
- [x] Factor volumétrico por transportadora
- [x] Tiempo de preparación
- [x] Configuración de paquetes por defecto

### Configuración de Pagos
- [x] Métodos de pago (Transferencia, PSE, Efectivo, Tarjeta, Wompi, Punto Físico)
- [x] Configuración de Wompi (llaves de integración)
- [x] Configuración de punto físico (dirección, horarios, teléfono)
- [x] Información bancaria para transferencias
- [x] Impuestos (IVA %)
- [x] Moneda configurable

### Términos y Políticas
- [x] Página de Términos y Condiciones
- [x] Página de Política de Privacidad
- [x] Página de Política de Devoluciones
- [x] Editor de contenido para cada página
- [x] Links en Footer

### Entregables Fase 6
- [x] Configuración centralizada del negocio
- [x] Configuración de envíos y transportadoras
- [x] Configuración de métodos de pago
- [x] Páginas legales editables

---

## 📍 FASE 7: BACKEND + BASE DE DATOS (Cuando sea necesario)

**Estado:** ⚪ No iniciada
**Objetivo:** Migrar de localStorage a persistencia real

### Setup Backend
- [ ] Proyecto Node.js + Express + TypeScript
- [ ] PostgreSQL (Supabase / Railway / PlanetScale)
- [ ] Prisma ORM
- [ ] Esquema de base de datos
- [ ] Seeders con datos iniciales

### API REST
- [ ] Endpoints de productos
- [ ] Endpoints de usuarios
- [ ] Endpoints de pedidos
- [ ] Endpoints de autenticación
- [ ] Documentación Swagger

### Migración
- [ ] Migrar productos de localStorage → DB
- [ ] Migrar usuarios de localStorage → DB
- [ ] Migrar pedidos de localStorage → DB
- [ ] Actualizar servicios del frontend

### Storage de Imágenes
- [ ] Cloudinary / AWS S3
- [ ] Subida de imágenes de productos
- [ ] Subida de diseños personalizados
- [ ] Optimización de imágenes

---

## 📍 FASE 8: APP MÓVIL (Opcional)

**Estado:** ⚪ No iniciada
**Objetivo:** App móvil con React Native + WebView

### Contenido
- [ ] Expo + React Native
- [ ] WebView del sitio web
- [ ] Subida de imágenes desde cámara/galería
- [ ] Notificaciones push
- [ ] Publicación en stores

---

## 📊 RESUMEN DE ESTADO

| Fase | Nombre | Estado | Progreso |
|------|--------|--------|----------|
| 1 | MVP: Catálogo + Personalizador + Admin | 🟢 | 95% |
| 2 | Usuarios + Autenticación + Roles | ✅ | 100% |
| 3 | Pedidos + Pagos + Historial | ✅ | 100% |
| 4 | Facturación + Despachos Avanzados | 🔮 | Futuro |
| 5 | Notificaciones + Emails | ⚪ | 0% |
| 6 | Configuración General | ✅ | 100% |
| 7 | Backend + Base de Datos | ⚪ | 0% |
| 8 | App Móvil | 🔮 | Futuro |

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Pendientes prioritarios:
1. **Notificaciones** - Emails transaccionales básicos
2. **Testing y refinamiento** - Optimización de rendimiento

### Nota sobre localStorage vs Backend:
Por ahora todo funciona con localStorage. Cuando el volumen de datos lo requiera, se implementará la Fase 7 (Backend + Base de datos).

---

## 📝 CHANGELOG RECIENTE

### v4.2 (2025-11-29)
- ✅ Sistema de recuperación de contraseña completo
- ✅ ForgotPasswordModal para solicitar reset
- ✅ ResetPasswordPage para establecer nueva contraseña
- ✅ Tokens de reset con expiración (1 hora)
- ✅ Validación de contraseña (mínimo 6 caracteres)
- ✅ Enlace de recuperación en consola (modo desarrollo)

### v4.1 (2025-11-29)
- ✅ Sistema de roles y permisos completo
- ✅ Página independiente para crear/editar roles
- ✅ 27 permisos en 8 módulos
- ✅ Asignación de rol a administradores
- ✅ Unificación de UsersContext y AuthContext
- ✅ Credenciales de prueba visibles en login
- ✅ Contraseñas genéricas (admin123/cliente123)

---

**Última actualización:** 2025-11-29
**Versión:** 4.2
