# Digital Marketplace API

REST API маркетплейса цифровых товаров: Express + Sequelize (PostgreSQL) + MongoDB (mongoose) для хранения токенов.

## Запуск

```bash
npm install
cp .env.example .env      # при необходимости поменяйте секреты
npm run db:up             # postgres + mongo в Docker
npm run db:migrate        # таблицы Products, Users, Accounts
npm run db:seed           # демо-товары и администратор (ADMIN_EMAIL / ADMIN_PASSWORD из .env)
npm run dev
```

Сервер стартует только после успешного подключения к MongoDB.

## Swagger

Документация генерируется `swagger-jsdoc` из JSDoc-комментариев `@openapi` в [routes/](routes/), общие схемы описаны в [config/swagger.js](config/swagger.js).

- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`

Для защищённых маршрутов: выполните `POST /auth/login`, скопируйте `accessToken`, нажмите **Authorize** и вставьте токен (без слова `Bearer`).

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `PORT` | порт HTTP-сервера (по умолчанию 3000) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | подключение к PostgreSQL |
| `MONGO_URI` | строка подключения к MongoDB |
| `MONGO_PORT` | внешний порт контейнера mongo (по умолчанию 27017) |
| `JWT_SECRET` | секрет для access-токенов |
| `JWT_REFRESH_SECRET` | секрет для refresh-токенов |
| `ACCESS_TOKEN_EXPIRES_IN` | срок жизни access-токена (например `1h`) |
| `REFRESH_TOKEN_EXPIRES_IN` | срок жизни refresh-токена (например `7d`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | учётные данные администратора, создаваемого сидером |

## Эндпоинты

### Как обращаться

- Базовый URL: `http://localhost:3000` (порт задаётся `PORT`).
- Тело запросов и ответов — JSON, заголовок `Content-Type: application/json`.
- Защищённые маршруты требуют заголовок `Authorization: Bearer <accessToken>`. Токен выдаёт `POST /auth/login` (после `POST /auth/register`).
- Refresh-токен в теле ответа не возвращается: он приходит в cookie `refreshToken` (`HttpOnly`, `SameSite=Strict`, `Path=/auth`; `Secure` при `NODE_ENV=production`) и читается из неё же в `/auth/refresh` и `/auth/logout`. Клиенту нужно отправлять запросы с cookie (в браузере — `credentials: 'include'`).
- Создание, изменение и удаление товаров доступны только администратору (роль `admin`), иначе **403**. Чтение товаров — без авторизации.
- Любая ошибка возвращается как `{ "error": "текст ошибки" }` с соответствующим HTTP-статусом. Для защищённых маршрутов без токена, с неверным, просроченным или отозванным токеном — **401**. Неизвестный маршрут — **404**, непредвиденная ошибка — **500**.

### Сводка

| Метод | Путь | Защита | Успех | Назначение |
|---|---|---|---|---|
| POST | `/auth/register` | — | 201 | регистрация |
| POST | `/auth/login` | — | 200 | вход, выдача пары токенов |
| POST | `/auth/refresh` | cookie | 200 | обмен refresh-токена из cookie на новую пару |
| POST | `/auth/logout` | Bearer | 204 | выход, отзыв токенов |
| GET | `/profile` | Bearer | 200 | профиль текущего пользователя |
| PATCH | `/profile` | Bearer | 200 | изменение имени/фамилии |
| DELETE | `/profile` | Bearer | 204 | удаление профиля |
| GET | `/api/products` | — | 200 | список товаров (страница по 20) |
| GET | `/api/products/:id` | — | 200 | товар по ID |
| POST | `/api/products` | admin | 201 | создание товара |
| PUT | `/api/products/:id` | admin | 200 | полное обновление товара |
| DELETE | `/api/products/:id` | admin | 204 | удаление товара |

### Аутентификация

#### `POST /auth/register`

```json
{ "email": "ivan@example.com", "password": "secret123", "firstName": "Иван", "lastName": "Иванов" }
```

- `email` — обязателен, корректный email (приводится к нижнему регистру);
- `password` — обязателен, не короче 6 символов;
- `firstName`, `lastName` — необязательны, строка или `null`.

**201** → `{ "id": "uuid", "email": "...", "firstName": "...", "lastName": "...", "createdAt": "ISO-дата" }`
Ошибки: **400** — невалидные данные, **409** — email уже занят.

#### `POST /auth/login`

```json
{ "email": "ivan@example.com", "password": "secret123" }
```

**200** →

```json
{ "accessToken": "jwt", "tokenType": "Bearer", "expiresIn": 3600 }
```

Refresh-токен устанавливается заголовком `Set-Cookie: refreshToken=...; HttpOnly; Path=/auth`.

`expiresIn` — срок жизни access-токена в секундах.
Ошибки: **400** — не переданы email/пароль, **401** — неверный email или пароль (или профиль удалён), **403** — аккаунт заблокирован администратором, **423** — временная блокировка после 5 неудачных попыток.

#### `POST /auth/refresh`

Тело не нужно: refresh-токен берётся из cookie `refreshToken`.

**200** → `{ "accessToken", "tokenType", "expiresIn" }` и новая cookie с refresh-токеном. Старый refresh-токен после этого недействителен.
Ошибки: **401** — cookie нет, токен некорректен, просрочен, уже использован или аккаунт недоступен (при ошибке cookie очищается).

#### `POST /auth/logout` — Bearer

Тело не нужно. Отзываются текущий access-токен и refresh-токен из cookie, cookie очищается.
**204** без тела. Ошибки: **401**.

### Профиль — Bearer

#### `GET /profile`

**200** →

```json
{
  "id": "uuid", "firstName": "Иван", "lastName": "Иванов", "email": "ivan@example.com",
  "status": "active", "lastLoginAt": "ISO-дата", "createdAt": "ISO-дата", "updatedAt": "ISO-дата"
}
```

Ошибки: **401**, **404** — профиль не найден или удалён.

#### `PATCH /profile`

```json
{ "firstName": "Пётр", "lastName": "Петров" }
```

Нужно хотя бы одно из полей. Значение — строка или `null`; пустая строка сохраняется как `null`.
**200** → обновлённый профиль (формат как у `GET /profile`). Ошибки: **400**, **401**, **404**.

#### `DELETE /profile`

Мягкое удаление: `status = deleted`, все токены пользователя отзываются, повторный вход невозможен.
**204** без тела. Ошибки: **401**, **404**.

### Товары

Параметр `:id` — положительное целое число, иначе **400**. Если товар не найден — **404**.

#### `GET /api/products`

Query: `page` — номер страницы (по умолчанию 1), на странице 20 товаров, отсортированных по `id`.

**200** →

```json
{ "items": [ /* товары */ ], "page": 1, "pageSize": 20, "totalItems": 45, "totalPages": 3 }
```

Страница за пределами диапазона — пустой `items`; если товаров нет, `totalPages` = 0. Ошибка: **400** — `page` не положительное целое число.

#### `GET /api/products/:id`

**200** → товар:

```json
{
  "id": 1, "name": "Node.js для начинающих", "category": "book", "description": "...",
  "price": "799.00", "author": "Иван Иванов", "downloadUrl": "https://example.com/book",
  "stockQuantity": 0, "createdAt": "ISO-дата", "updatedAt": "ISO-дата"
}
```

`price` хранится как `DECIMAL(10,2)`, поэтому в ответе это **строка**.

#### `POST /api/products`, `PUT /api/products/:id` — admin

```json
{
  "name": "Node.js для начинающих", "category": "book", "description": "Книга для изучения Node.js",
  "price": 799, "author": "Иван Иванов", "downloadUrl": "https://example.com/book", "stockQuantity": 10
}
```

- `name`, `description`, `author`, `downloadUrl` — обязательные непустые строки;
- `category` — `book`, `music` или `software`;
- `price` — обязательное число ≥ 0 (в запросе именно число, не строка);
- `stockQuantity` — необязательно, целое ≥ 0, по умолчанию 0.

`PUT` заменяет товар целиком, поэтому требует те же поля, что и `POST`.
**201** (POST) / **200** (PUT) → товар. Ошибки: **400**, **401**, **403** — не администратор, **404** (PUT).

#### `DELETE /api/products/:id` — admin

**204** без тела. Ошибки: **400**, **401**, **403**, **404**.

## Модели данных

- **User** (PostgreSQL): `id` (UUID), `firstName`, `lastName`, `createdAt`, `updatedAt`.
- **Account** (PostgreSQL): `id`, `userId` (FK → User, 1:1), `email` (уникальный), `passwordHash` (bcrypt, 10 раундов), `role` (`user | admin`, по умолчанию `user`), `status` (`active | blocked | deleted`), `lastLoginAt`, `failedLoginAttempts`, `lockUntil`.
- **Token** (MongoDB, коллекция `tokens`): `userId`, `token`, `type` (`access | refresh`), `expiresAt`, `createdAt`.

## Блокировка после неудачных попыток входа

Параметры заданы константами в `services/authService.js`:

- `MAX_FAILED_LOGIN_ATTEMPTS = 5` — после 5 неверных паролей подряд аккаунт блокируется;
- `LOCK_TIME_MS = 15 минут` — длительность блокировки.

Во время блокировки вход отклоняется со статусом **423 Locked** (даже с правильным паролем). После истечения `lockUntil` счётчик сбрасывается; успешный вход также обнуляет счётчик и обновляет `lastLoginAt`.

## Токены и TTL

- Access-токен проверяется middleware `middleware/auth.js`: подпись JWT + наличие токена в MongoDB. Поэтому после `logout` или удаления профиля токен перестаёт приниматься сразу.
- Роль пользователя записана в access-токен, поэтому смена роли вступает в силу после нового входа.
- Refresh-токен одноразовый: при `/auth/refresh` старый удаляется и выдаётся новая пара (ротация).
- В коллекции `tokens` создан TTL-индекс `{ expiresAt: 1 }, { expireAfterSeconds: 0 }`. `expiresAt` берётся из поля `exp` JWT, поэтому MongoDB сама удаляет документ после истечения токена (фоновый TTL-монитор запускается примерно раз в 60 секунд).

Проверить индекс:

```bash
docker exec -it digital-marketplace-mongo mongosh digital_marketplace --eval "db.tokens.getIndexes()"
```

## Ручные тесты

Готовые запросы — в `api-tests.http`. Откройте файл в VS Code с расширением REST Client (`humao.rest-client`) и выполняйте запросы сверху вниз кнопкой **Send Request**. Access-токены и ID товара подставляются автоматически, refresh-токен REST Client хранит в cookie сам. Для запросов администратора нужен аккаунт из `ADMIN_EMAIL` / `ADMIN_PASSWORD` (создаётся `npm run db:seed`).
