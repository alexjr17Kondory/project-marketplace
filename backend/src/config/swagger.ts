import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Marketplace API',
      version: '1.0.0',
      description: 'API REST para el Marketplace - Documentación completa de endpoints',
      contact: {
        name: 'Soporte',
        email: 'soporte@marketplace.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT',
        },
      },
      schemas: {
        // Usuario
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123...' },
            email: { type: 'string', format: 'email', example: 'usuario@email.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            phone: { type: 'string', nullable: true, example: '+57 300 123 4567' },
            avatar: { type: 'string', nullable: true },
            roleId: { type: 'integer', example: 2 },
            role: { type: 'string', example: 'Usuario' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['products.view', 'orders.view'],
            },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], example: 'ACTIVE' },
          },
        },
        // Auth Response
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Inicio de sesión exitoso' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
              },
            },
          },
        },
        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error de validación' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
              example: { email: ['Email inválido'] },
            },
          },
        },
        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
          },
        },
        // Address
        Address: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123...' },
            label: { type: 'string', example: 'Casa' },
            address: { type: 'string', example: 'Calle 123 # 45-67' },
            city: { type: 'string', example: 'Medellín' },
            department: { type: 'string', nullable: true, example: 'Antioquia' },
            postalCode: { type: 'string', nullable: true, example: '050001' },
            country: { type: 'string', example: 'Colombia' },
            isDefault: { type: 'boolean', example: true },
          },
        },
        // Product
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123...' },
            name: { type: 'string', example: 'Camiseta Personalizada' },
            description: { type: 'string', example: 'Camiseta 100% algodón' },
            type: { type: 'string', example: 'Camiseta' },
            category: { type: 'string', example: 'Ropa' },
            basePrice: { type: 'number', example: 45000 },
            stock: { type: 'integer', example: 100 },
            featured: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            images: {
              type: 'array',
              items: { type: 'string' },
              example: ['https://example.com/img1.jpg'],
            },
            colors: {
              type: 'array',
              items: { type: 'string' },
              example: ['Negro', 'Blanco'],
            },
            sizes: {
              type: 'array',
              items: { type: 'string' },
              example: ['S', 'M', 'L', 'XL'],
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['personalizado', 'algodón'],
            },
            rating: { type: 'number', nullable: true, example: 4.5 },
            reviewsCount: { type: 'integer', nullable: true, example: 25 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Order
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123...' },
            orderNumber: { type: 'string', example: 'ORD-241130-0001' },
            userId: { type: 'string' },
            userName: { type: 'string', example: 'Juan Pérez' },
            userEmail: { type: 'string', example: 'juan@email.com' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            subtotal: { type: 'number', example: 80000 },
            shippingCost: { type: 'number', example: 12000 },
            discount: { type: 'number', example: 0 },
            tax: { type: 'number', example: 15200 },
            total: { type: 'number', example: 107200 },
            status: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING',
            },
            statusLabel: { type: 'string', example: 'Pendiente' },
            paymentMethod: { type: 'string', example: 'transfer' },
            paymentRef: { type: 'string', nullable: true },
            shipping: { type: 'object' },
            trackingNumber: { type: 'string', nullable: true },
            trackingUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // OrderItem
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            productName: { type: 'string', example: 'Camiseta Básica' },
            productImage: { type: 'string' },
            size: { type: 'string', example: 'M' },
            color: { type: 'string', example: 'Negro' },
            quantity: { type: 'integer', example: 2 },
            unitPrice: { type: 'number', example: 35000 },
            subtotal: { type: 'number', example: 70000 },
            customization: { type: 'object', nullable: true },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Estado del servidor' },
      { name: 'Auth', description: 'Autenticación y autorización' },
      { name: 'Users', description: 'Gestión de usuarios' },
      { name: 'Products', description: 'Gestión de productos' },
      { name: 'Orders', description: 'Gestión de pedidos' },
      { name: 'Roles', description: 'Gestión de roles y permisos' },
      { name: 'Catalogs', description: 'Catálogos (tallas, colores, categorías)' },
      { name: 'Settings', description: 'Configuración del sistema' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
