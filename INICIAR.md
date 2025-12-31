# 🚀 Guía de Inicialización - Vexa Marketplace

Esta guía te ayudará a inicializar el proyecto completo usando Docker en cualquier PC.

## 📋 Pre-requisitos

1. **Docker Desktop** instalado y ejecutándose
2. **Git** (opcional, para clonar el repositorio)

## 🐳 Inicialización Rápida (Recomendado)

### Opción 1: Script Automático

Ejecuta el script `init.bat` como **Administrador**:

```
Clic derecho en init.bat → "Ejecutar como administrador"
```

Este script automáticamente:
- ✅ Configura el archivo hosts con `vexa.test`
- ✅ Construye e inicia todos los contenedores Docker
- ✅ Muestra la URL de acceso

### Opción 2: Manual

#### 1. Configurar archivo hosts

Abre `C:\Windows\System32\drivers\etc\hosts` como Administrador y agrega:

```
127.0.0.1    vexa.test
127.0.0.1    api.vexa.test
```

#### 2. Levantar los Contenedores

```bash
# Construir e iniciar todos los servicios
docker-compose up -d --build
```

## 🏗️ Arquitectura de Contenedores

Esto creará y levantará 4 contenedores:

| Contenedor | Descripción | Puerto |
|------------|-------------|--------|
| **vexa-nginx** | Proxy reverso (nginx) | 80 |
| **vexa-db** | Base de datos (MariaDB) | 3307 |
| **vexa-backend** | API Node.js/Express | 3001 |
| **vexa-frontend** | React + Vite | 5174 |

```
marketplace-network (bridge)
├── vexa-nginx (Nginx Alpine)
│   └── Puerto: 80 → Proxy a frontend y backend
├── vexa-db (MariaDB 10.11)
│   └── Puerto: 3307 → 3306
├── vexa-backend (Node.js)
│   ├── Puerto: 3001 → 3001
│   └── Depende de: db
└── vexa-frontend (React + Vite)
    ├── Puerto: 5173 → 5174
    └── Depende de: backend
```

## 🌐 Acceder a la Aplicación

| URL | Descripción |
|-----|-------------|
| **http://vexa.test** | Aplicación principal |
| **http://vexa.test/api** | API del backend |
| localhost:3307 | Base de datos (conexión directa) |

## 🔧 Inicializar Base de Datos

El backend automáticamente ejecuta las migraciones al iniciar, pero si necesitas resetear:

```bash
# Generar cliente Prisma
docker exec vexa-backend npx prisma generate

# Aplicar esquema a la base de datos
docker exec vexa-backend npx prisma db push

# Cargar datos iniciales (seed)
docker exec vexa-backend npx prisma db seed
```

## ✅ Verificar Estado

```bash
# Ver logs del backend
docker logs vexa-backend -f

# Ver logs del frontend
docker logs vexa-frontend -f

# Ver logs de nginx
docker logs vexa-nginx -f

# Ver estado de todos los contenedores
docker ps
```

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
docker-compose up -d --build

# Esperar ~30 segundos para que la DB esté lista

# Resetear base de datos con datos iniciales
docker exec vexa-backend npx prisma db push --force-reset --accept-data-loss
docker exec vexa-backend npx prisma db seed
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
docker logs vexa-backend -f

# Solo frontend
docker logs vexa-frontend -f

# Solo nginx
docker logs vexa-nginx -f
```

### Ejecutar Comandos en Contenedores

```bash
# Backend
docker exec -it vexa-backend sh

# Frontend
docker exec -it vexa-frontend sh

# Base de datos (MariaDB)
docker exec -it vexa-db mariadb -u marketplace -pmarketplace123
```

### Detener/Reiniciar Servicios

```bash
# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker restart vexa-backend
docker restart vexa-frontend
docker restart vexa-nginx
docker restart vexa-db
```

## 🐛 Solución de Problemas

### El backend no inicia correctamente

```bash
# Ver logs para identificar el error
docker logs vexa-backend

# Regenerar cliente Prisma
docker exec vexa-backend npx prisma generate
docker restart vexa-backend
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

# Debe mostrar "healthy" en vexa-db
# Si no, espera unos segundos más para que inicialice
```

### Error "Host not allowed" en el navegador

El host `vexa.test` debe estar configurado en:
1. Archivo hosts de Windows
2. `vite.config.ts` → `server.allowedHosts`

```bash
# Reiniciar frontend después de cambios
docker restart vexa-frontend
```

### Puerto 80 ocupado

Si tienes XAMPP, Laragon, IIS u otro servidor web:
```bash
# Detener el servicio que usa el puerto 80
# O cambiar el puerto en docker-compose.yml
```

### Limpiar todo y empezar de nuevo

```bash
# Eliminar contenedores, volúmenes e imágenes
docker-compose down -v --rmi all

# Reconstruir todo desde cero
docker-compose up -d --build
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

1. Accede a **http://vexa.test**
2. Inicia sesión con `admin@marketplace.com` / `admin123`
3. Explora el panel de administración
4. Configura tus plantillas y recetas en **Plantillas > Recetas**
5. Crea conversiones de inventario desde plantillas

---

**¿Necesitas ayuda?** Revisa los logs con `docker-compose logs -f` o contacta al equipo de desarrollo.
