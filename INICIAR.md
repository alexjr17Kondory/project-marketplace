# 🚀 Guía de Inicialización - Marketplace

Esta guía te ayudará a inicializar el proyecto completo usando Docker en cualquier PC.

## 📋 Pre-requisitos

1. **Docker Desktop** instalado y ejecutándose
2. **Git** (opcional, para clonar el repositorio)

## 🐳 Inicialización con Docker

### 1. Configuración Inicial

El proyecto ya incluye toda la configuración necesaria en `docker-compose.yml`. No necesitas configurar variables de entorno para desarrollo local.

### 2. Levantar los Contenedores

```bash
# Construir e iniciar todos los servicios
docker-compose up -d
```

Esto creará y levantará 3 contenedores:
- **MariaDB** (puerto 3307) - Base de datos
- **Backend** (puerto 3001) - API Node.js/Express
- **Frontend** (puerto 5173) - React + Vite

### 3. Inicializar Base de Datos

El backend automáticamente ejecuta las migraciones al iniciar, pero si necesitas resetear:

```bash
# Generar cliente Prisma
docker exec marketplace-backend npx prisma generate

# Aplicar esquema a la base de datos
docker exec marketplace-backend npx prisma db push

# Cargar datos iniciales (seed)
docker exec marketplace-backend npx prisma db seed
```

### 4. Verificar Estado

```bash
# Ver logs del backend
docker logs marketplace-backend -f

# Ver logs del frontend
docker logs marketplace-frontend -f

# Ver estado de todos los contenedores
docker ps
```

## 🌐 Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Base de Datos**: localhost:3307

## 👥 Usuarios de Prueba

Después de ejecutar el seed, tendrás estos usuarios:

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@marketplace.com | admin123 | Administrador |
| Vendedor | vendedor@marketplace.com | vendedor123 | Vendedor |
| Cliente | cliente@marketplace.com | cliente123 | Cliente |
| Cajero | cajero@marketplace.com | cajero123 | Cajero |

## 🔄 Datos Iniciales (Seed)

El seed crea automáticamente:

### Plantillas (Templates)
1. **Suéter en U Personalizable** - Para personalización con DTF
2. **Blusa** - Prenda base para conversión
3. **Taza** - Producto para personalización

### Insumos
1. **Suéter en U** - 9 variantes (3 tallas × 3 colores)
2. **Blusa** - Prenda base
3. **DTF** - Transfer para personalización
4. **Cinta** - Material adicional
5. **Bolsas** - Empaque
6. **Etiqueta** - Etiquetado

### Productos (No Templates)
- Suéter en U (producto terminado)
- Blusa (producto terminado)
- Taza (producto terminado)

### Datos de Soporte
- 10 Tallas (XS, S, M, L, XL, XXL, XXXL, Única, 8oz, 11oz)
- 6 Colores (Negro, Blanco, Gris, Azul, Rojo, Verde)
- 4 Proveedores

## 🛠️ Comandos Útiles

### Reiniciar Todo desde Cero

```bash
# Detener y eliminar contenedores + volúmenes
docker-compose down -v

# Levantar nuevamente
docker-compose up -d

# Esperar ~30 segundos para que la DB esté lista

# Resetear base de datos con datos iniciales
docker exec marketplace-backend npx prisma db push --force-reset --accept-data-loss
docker exec marketplace-backend npx prisma db seed
```

### Reconstruir Contenedores

```bash
# Si cambias Dockerfile o dependencias
docker-compose up -d --build
```

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker logs marketplace-backend -f

# Solo frontend
docker logs marketplace-frontend -f
```

### Ejecutar Comandos en Contenedores

```bash
# Backend
docker exec -it marketplace-backend sh

# Frontend
docker exec -it marketplace-frontend sh

# Base de datos (MariaDB)
docker exec -it marketplace-db mariadb -u marketplace -pmarketplace123
```

### Detener/Reiniciar Servicios

```bash
# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker restart marketplace-backend
docker restart marketplace-frontend
docker restart marketplace-db
```

## 🐛 Solución de Problemas

### El backend no inicia correctamente

```bash
# Ver logs para identificar el error
docker logs marketplace-backend

# Regenerar cliente Prisma
docker exec marketplace-backend npx prisma generate
docker restart marketplace-backend
```

### El frontend muestra errores de módulos

```bash
# Reconstruir el contenedor frontend
docker-compose up -d --build frontend
```

### La base de datos no acepta conexiones

```bash
# Verificar que MariaDB esté saludable
docker ps

# Debe mostrar "healthy" en marketplace-db
# Si no, espera unos segundos más para que inicialice
```

### Limpiar todo y empezar de nuevo

```bash
# Eliminar contenedores, volúmenes e imágenes
docker-compose down -v --rmi all

# Reconstruir todo desde cero
docker-compose up -d --build
```

## 📦 Estructura de Contenedores

```
marketplace-network (bridge)
├── marketplace-db (MariaDB 10.11)
│   └── Puerto: 3307 → 3306
├── marketplace-backend (Node.js)
│   ├── Puerto: 3001 → 3001
│   └── Depende de: db
└── marketplace-frontend (React + Vite)
    ├── Puerto: 5173 → 5174
    └── Depende de: backend
```

## ⚙️ Configuración de Producción

Para configurar servicios externos (Cloudinary, SMTP, Wompi), crea un archivo `.env` en la raíz:

```env
# Cloudinary (Subida de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email SMTP (Notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app
EMAIL_FROM=Marketplace <noreply@marketplace.com>

# Wompi (Pasarela de pago)
WOMPI_PUBLIC_KEY=tu_public_key
WOMPI_PRIVATE_KEY=tu_private_key
WOMPI_EVENTS_SECRET=tu_events_secret
```

Luego reinicia los contenedores:
```bash
docker-compose down
docker-compose up -d
```

## 📚 Módulos Principales

1. **Inventario** - Gestión de productos, plantillas e insumos
2. **Conversiones** - Transformación de insumos en productos
3. **Compras** - Órdenes de compra a proveedores
4. **Punto de Venta (POS)** - Ventas presenciales con zonas/mesas
5. **Usuarios y Permisos** - Control de acceso por roles

## 🎯 Próximos Pasos

1. Accede a http://localhost:5173
2. Inicia sesión con admin@marketplace.com / admin123
3. Explora el panel de administración
4. Configura tus plantillas y recetas en **Plantillas > Recetas**
5. Crea conversiones de inventario desde plantillas

---

**¿Necesitas ayuda?** Revisa los logs con `docker-compose logs -f` o contacta al equipo de desarrollo.
