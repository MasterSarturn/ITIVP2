const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const port = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Digital Marketplace API',
      version: '1.0.0',
      description: 'REST API для маркетплейса цифровых товаров'
    },
    servers: [{ url: `http://localhost:${port}` }],
    tags: [
      { name: 'Auth', description: 'Регистрация, вход и управление токенами' },
      { name: 'Profile', description: 'Профиль текущего пользователя' },
      { name: 'Products', description: 'Цифровые товары' },
      { name: 'Files', description: 'Файлы товаров' },
      { name: 'Catalog', description: 'Категории и авторы' },
      { name: 'Cart', description: 'Корзина' },
      { name: 'Wishlist', description: 'Избранное' },
      { name: 'Orders', description: 'Заказы' },
      { name: 'Payments', description: 'Платежи и webhook провайдера' },
      { name: 'Downloads', description: 'Скачивание купленных файлов' },
      { name: 'Reviews', description: 'Отзывы' },
      { name: 'Seller', description: 'Кабинет продавца' },
      { name: 'Admin', description: 'Администрирование (только роль admin)' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        refreshCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'httpOnly-cookie, которую сервер ставит при /auth/login и /auth/refresh. Браузер отправляет её сам.'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Товар не найден' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
            firstName: { type: 'string', nullable: true, example: 'Иван' },
            lastName: { type: 'string', nullable: true, example: 'Иванов' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'secret123' }
          }
        },
        Tokens: {
          type: 'object',
          description: 'Refresh-токен в тело не попадает: он устанавливается в httpOnly-cookie refreshToken',
          properties: {
            accessToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'integer', description: 'Время жизни access-токена в секундах', example: 3600 }
          }
        },
        PublicUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'seller', 'admin'] },
            status: { type: 'string', enum: ['active', 'blocked', 'deleted'] },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ProfileUpdate: {
          type: 'object',
          description: 'Нужно передать хотя бы одно поле',
          properties: {
            firstName: { type: 'string', nullable: true, example: 'Пётр' },
            lastName: { type: 'string', nullable: true, example: 'Петров' }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'category', 'description', 'price'],
          properties: {
            name: { type: 'string', example: 'Clean Code' },
            category: { type: 'string', description: 'slug категории', example: 'books' },
            description: { type: 'string', example: 'Книга о чистом коде' },
            price: { type: 'number', minimum: 0, description: 'В BYN, не более двух знаков после запятой', example: 19.99 },
            authorIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              description: 'ID авторов из справочника. При PUT набор заменяется целиком'
            },
            sellerId: {
              type: 'string',
              format: 'uuid',
              description: 'Только при создании и только для администратора: продавец (seller или admin)'
            }
          }
        },
        ProductsPage: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
            totalItems: { type: 'integer', example: 45 },
            totalPages: { type: 'integer', example: 3 }
          }
        },
        ProductFile: {
          type: 'object',
          description: 'Метаданные файла. storageKey наружу не отдаётся',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            fileName: { type: 'string', example: 'clean-code.pdf' },
            fileSize: { type: 'string', description: 'BIGINT возвращается строкой', example: '1048576' },
            mimeType: { type: 'string', example: 'application/pdf' },
            version: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sellerId: { type: 'string', format: 'uuid' },
            categoryId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Clean Code' },
            description: { type: 'string', example: 'Книга о чистом коде' },
            price: { type: 'string', description: 'DECIMAL(10,2) возвращается строкой', example: '19.99' },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'Books' },
                slug: { type: 'string', example: 'books' }
              }
            },
            seller: {
              type: 'object',
              description: 'Публичная карточка продавца',
              properties: {
                id: { type: 'string', format: 'uuid' },
                firstName: { type: 'string', nullable: true },
                lastName: { type: 'string', nullable: true }
              }
            },
            authors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Robert C. Martin' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Некорректные данные запроса',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        Unauthorized: {
          description: 'Токен не передан, некорректен, истёк или отозван',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        Forbidden: {
          description: 'Недостаточно прав или запись чужая',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        Conflict: {
          description: 'Конфликт состояния (дубликат, неверный статус, связанные записи)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        NotFound: {
          description: 'Ресурс не найден',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      },
      parameters: {
        Page: {
          name: 'page',
          in: 'query',
          required: false,
          description: 'Номер страницы (по 20 записей), по умолчанию 1',
          schema: { type: 'integer', minimum: 1, default: 1 }
        },
        Id: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'UUID записи',
          schema: { type: 'string', format: 'uuid' }
        },
        ProductIdPath: {
          name: 'productId',
          in: 'path',
          required: true,
          description: 'ID товара',
          schema: { type: 'string', format: 'uuid' }
        },
        FileIdPath: {
          name: 'fileId',
          in: 'path',
          required: true,
          description: 'ID файла товара',
          schema: { type: 'string', format: 'uuid' }
        }
      }
    }
  },
  // glob в swagger-jsdoc понимает только прямые слэши, поэтому заменяем виндовые обратные
  apis: [path.join(__dirname, '..', 'routes', '*.js').replace(/\\/g, '/')]
};

module.exports = swaggerJsdoc(options);
