# Marketplace Backend API

API REST para el marketplace, construida con Node.js, Express, TypeScript y Prisma.

## Stack Tecnológico

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | Framework web |
| TypeScript | 5.x | Tipado estático |
| Prisma | 5.x | ORM |
| MariaDB | 10.11 | Base de datos |
| JWT | - | Autenticación |
| Zod | - | Validación |

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuración (env, db, cors)
│   ├── controllers/      # Controladores de rutas
│   ├── middleware/       # Middlewares (auth, validation, error)
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   ├── utils/            # Utilidades (jwt, password, errors)
│   ├── validators/       # Esquemas de validación Zod
│   ├── app.ts            # Configuración de Express
│   └── index.ts          # Entry point
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── seed.ts           # Datos iniciales
├── .env                  # Variables de entorno
└── package.json
```

## Instalación

### Con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

### Sin Docker

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

## Variables de Entorno

```env
# Base de datos
DATABASE_URL="mysql://root:@localhost:3306/marketplace"

# JWT
JWT_SECRET="tu-secreto-seguro"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

## Endpoints API

### Health Check

```
GET /api/health
```

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | ❌ |
| POST | `/api/auth/login` | Iniciar sesión | ❌ |
| POST | `/api/auth/logout` | Cerrar sesión | ❌ |
| GET | `/api/auth/me` | Obtener usuario actual | ✅ |
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña | ❌ |
| POST | `/api/auth/reset-password` | Resetear contraseña | ❌ |
| POST | `/api/auth/change-password` | Cambiar contraseña | ✅ |

### Ejemplos de Uso

#### Registro

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "password123",
    "name": "Nombre Usuario"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "cuid...",
      "email": "usuario@email.com",
      "name": "Nombre Usuario",
      "roleId": 2,
      "role": "Usuario",
      "permissions": ["products.view", "orders.view"],
      "status": "ACTIVE"
    },
    "token": "eyJhbGc..."
  }
}
```

#### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@marketplace.com",
    "password": "admin123"
  }'
```

#### Obtener Usuario Actual

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@marketplace.com | admin123 | SuperAdmin |
| usuario@marketplace.com | cliente123 | Usuario |

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma studio          # GUI para ver datos
npx prisma db push         # Sincronizar esquema
npx prisma db seed         # Cargar datos iniciales
npx prisma migrate dev     # Crear migración

# Build
npm run build
npm start
```

## Respuestas de la API

### Éxito

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": { ... }  // Solo en errores de validación
}
```

### Códigos HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Bad Request |
| 401 | No autorizado |
| 403 | Prohibido |
| 404 | No encontrado |
| 409 | Conflicto |
| 422 | Error de validación |
| 500 | Error del servidor |

## Seguridad

- Passwords hasheados con bcrypt (cost 12)
- JWT con expiración de 7 días
- Validación de inputs con Zod
- Headers de seguridad con Helmet
- CORS configurado

## Próximos Endpoints (Por implementar)

- `/api/users` - CRUD de usuarios
- `/api/products` - CRUD de productos
- `/api/orders` - Gestión de pedidos
- `/api/roles` - Gestión de roles
- `/api/catalogs` - Catálogos (tallas, colores, categorías)
- `/api/settings` - Configuración del sistema
- `/api/uploads` - Subida de imágenes
