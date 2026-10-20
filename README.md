# Digital Marketplace API

REST API маркетплейса цифровых товаров: Express + Sequelize (PostgreSQL) + MongoDB (mongoose) для хранения токенов.

## Запуск

```bash
npm install
cp .env.example .env      # при необходимости поменяйте секреты
npm run db:up             # postgres + mongo в Docker
npm run db:migrate        # таблицы схемы из db_structure.md
npm run db:seed           # администратор (ADMIN_EMAIL / ADMIN_PASSWORD из .env), категории и демо-товары
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
| `STORAGE_DIR` | каталог локального хранилища файлов товаров (по умолчанию `./storage`) |
| `MAX_UPLOAD_SIZE` | максимальный размер загружаемого файла в байтах (по умолчанию 50 МБ) |
| `PAYMENT_WEBHOOK_SECRET` | секрет подписи webhook платёжного провайдера (HMAC-SHA256). В production обязателен |
| `DOWNLOAD_TTL_SECONDS` | время, в течение которого после `POST /api/downloads` можно забрать файл (по умолчанию 300) |

## Эндпоинты

### Как обращаться

- Базовый URL: `http://localhost:3000` (порт задаётся `PORT`).
- Тело запросов и ответов — JSON, заголовок `Content-Type: application/json`.
- Защищённые маршруты требуют заголовок `Authorization: Bearer <accessToken>`. Токен выдаёт `POST /auth/login` (после `POST /auth/register`).
- Refresh-токен в теле ответа не возвращается: он приходит в cookie `refreshToken` (`HttpOnly`, `SameSite=Strict`, `Path=/auth`; `Secure` при `NODE_ENV=production`) и читается из неё же в `/auth/refresh` и `/auth/logout`. Клиенту нужно отправлять запросы с cookie (в браузере — `credentials: 'include'`).
- Роли: `user`, `seller`, `admin` (роль лежит в JWT и выдаётся только администратором, при смене роли токены пользователя отзываются). Полная матрица прав и правила по каждому эндпоинту — в [access_matrix.md](access_matrix.md). Коды: **403** — не хватает роли или запись чужая и видимая, **404** — записи нет или она скрыта от пользователя, **409** — конфликт состояния.
- Все списки постраничные (`?page=`, по 20 записей). Деньги и размеры файлов в ответах — строки (`DECIMAL`, `BIGINT`).
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
| GET | `/api/products/mine` | seller, admin | 200 | собственные товары во всех статусах |
| POST | `/api/products` | seller, admin | 201 | создание товара (всегда `draft`) |
| PUT | `/api/products/:id` | владелец, admin | 200 | полное обновление товара |
| PATCH | `/api/products/:id/status` | владелец, admin | 200 | публикация и снятие с публикации |
| DELETE | `/api/products/:id` | владелец, admin | 204 | архивация товара (`status = archived`) |
| GET, POST | `/api/products/:productId/files` | Bearer | 200, 201 | список файлов (владелец, admin, покупатель) и загрузка (`multipart/form-data`) |
| PUT, DELETE | `/api/products/:productId/files/:fileId` | владелец, admin | 201, 204 | замена новой версией и мягкое удаление файла |
| GET, POST | `/api/products/:id/reviews` | —, Bearer | 200, 201 | отзывы товара, отзыв на купленный товар |
| PATCH, DELETE | `/api/reviews/:id` | Bearer | 200, 204 | свой отзыв (удалять чужой может admin) |
| PATCH | `/profile/password`, `/profile/email` | Bearer | 200 | смена пароля и email, выдаётся новая пара токенов |
| GET | `/api/categories`, `/api/authors`, `/api/authors/:id` | — | 200 | справочники |
| POST, PATCH, DELETE | `/api/categories`, `/api/authors` | admin (авторов создаёт и seller) | 201, 200, 204 | управление справочниками |
| GET, POST, DELETE | `/api/cart`, `/api/cart/items`, `/api/cart/items/:productId` | Bearer | 200, 201, 204 | корзина |
| GET, POST, DELETE | `/api/wishlist`, `/api/wishlist/:productId` | Bearer | 200, 201, 204 | избранное |
| POST, GET | `/api/orders`, `/api/orders/:id` | Bearer | 201, 200 | оформление заказа из корзины и просмотр |
| POST | `/api/orders/:id/cancel` | владелец, admin | 200 | отмена заказа в статусе `pending` |
| POST, GET | `/api/orders/:id/payments` | Bearer | 201, 200 | платёжная операция по заказу и список платежей |
| POST | `/api/payments/webhook` | подпись HMAC | 200 | результат платежа от провайдера, единственный способ перевести заказ в `paid` |
| POST | `/api/dev/payments/:id/simulate` | Bearer | 200 | имитация ответа провайдера (только при `NODE_ENV` не `production`) |
| POST, GET | `/api/downloads`, `/api/downloads/:id/content` | Bearer | 201, 200 | запрос скачивания купленного файла и получение файла в пределах TTL |
| GET | `/api/seller/sales` | seller, admin | 200 | оплаченные позиции по своим товарам |
| GET, PATCH, DELETE | `/api/admin/users...` | admin | 200, 204 | пользователи: список, профиль, статус, роль, удаление |
| GET, POST | `/api/admin/products`, `orders`, `payments`, `downloads`, `orders/:id/refund` | admin | 200 | списки всех данных и возврат оплаченного заказа |

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

Параметры `:id`, `:productId`, `:fileId` — UUID, иначе **400**. Гость и обычный пользователь видят только опубликованные товары активных продавцов; владелец и администратор — любой статус; для остальных скрытый товар — **404**. Подробные схемы тел запросов и ответов всех эндпоинтов — в Swagger.

#### `GET /api/products`

Query: `page` — номер страницы (по умолчанию 1), на странице 20 товаров, отсортированных по дате создания; фильтры `categorySlug`, `authorId`, `q` (поиск по названию и описанию).

**200** →

```json
{ "items": [ /* товары */ ], "page": 1, "pageSize": 20, "totalItems": 45, "totalPages": 3 }
```

Страница за пределами диапазона — пустой `items`; если товаров нет, `totalPages` = 0. Ошибка: **400** — `page` не положительное целое число.

#### `GET /api/products/:id`

**200** → товар:

```json
{
  "id": "uuid", "sellerId": "uuid", "categoryId": "uuid", "name": "Node.js для начинающих",
  "description": "...", "price": "799.00", "status": "published",
  "category": { "id": "uuid", "name": "Books", "slug": "books" },
  "authors": [ { "id": "uuid", "name": "Иван Иванов" } ],
  "seller": { "id": "uuid", "firstName": "Пётр", "lastName": "Петров" },
  "createdAt": "ISO-дата", "updatedAt": "ISO-дата"
}
```

`price` хранится как `DECIMAL(10,2)`, поэтому в ответе это **строка**.

#### `POST /api/products`, `PUT /api/products/:id` — seller, admin

```json
{ "name": "Node.js для начинающих", "category": "books", "description": "Книга для изучения Node.js", "price": 799, "authorIds": ["uuid"] }
```

- `name`, `description` — обязательные непустые строки;
- `category` — обязательный slug существующей категории (`books`, `music`, `software` после `db:seed`), иначе **400**;
- `price` — обязательное число ≥ 0 не более чем с двумя знаками после запятой (в запросе именно число, не строка);
- `authorIds` — необязательный массив `Author.id`; при `PUT` набор авторов заменяется целиком, если поле передано;
- `sellerId` — только при создании и только для администратора (продавец с ролью `seller` или `admin`); иначе продавцом становится автор запроса.

Товар всегда создаётся черновиком (`draft`), `status` в теле игнорируется. `PUT` заменяет товар целиком, поэтому требует те же поля, что и `POST`.
**201** (POST) / **200** (PUT) → товар. Ошибки: **400**, **401**, **403** — нет роли или чужой видимый товар, **404**.

#### `PATCH /api/products/:id/status` — владелец, admin

Тело `{ "status": "published" | "draft" }`. Публикация требует хотя бы один активный файл (иначе **409**). Из `archived` в `draft` возвращает только администратор. В `archived` товар переводит `DELETE`.

#### `DELETE /api/products/:id` — владелец, admin

Товар физически не удаляется, а переводится в `archived`; купившие сохраняют доступ к файлам. **204** без тела. Ошибки: **400**, **401**, **403**, **404**.

### Файлы, заказы и платежи

- **Файлы.** Загрузка — `multipart/form-data` с полем `file` (и необязательным `version`). Тип определяется сервером по расширению из белого списка (**415** для остальных), размер ограничен `MAX_UPLOAD_SIZE` (**413**). Удаление и замена мягкие (`deletedAt`): покупатели, оплатившие заказ до удаления, сохраняют доступ.
- **Заказ** создаётся из корзины одной транзакцией, цена фиксируется в позиции. Заказ на 0 сразу получает статус `paid`. Статусы меняются только отменой (`pending → cancelled`), возвратом администратором (`paid → refunded`) и результатом платежа.
- **Платёж.** Провайдер в проекте не задан: подключена заглушка `mock` (`services/paymentProvider.js`). Webhook подписывается HMAC-SHA256 от сырого тела с секретом `PAYMENT_WEBHOOK_SECRET` (заголовок `X-Signature`, hex), обработка идемпотентна по `(provider, externalPaymentId)`. Для разработки есть `POST /api/dev/payments/:id/simulate`.
- **Скачивание** двумя шагами: `POST /api/downloads` (проверка оплаты, запись `Download`, ответ `{ id, expiresAt }`) и `GET /api/downloads/:id/content` (поток файла, пока не истёк TTL; после возврата заказа — **403**, после TTL — **410**).
- **Хранилище** — локальный диск (`STORAGE_DIR`, в `.gitignore`) за интерфейсом `services/storageService.js`.

## Модели данных

- **User** (PostgreSQL): `id` (UUID), `firstName`, `lastName`, `createdAt`, `updatedAt`.
- **Account** (PostgreSQL): `id`, `userId` (FK → User, 1:1), `email` (уникальный), `passwordHash` (bcrypt, 10 раундов), `role` (`user | seller | admin`, по умолчанию `user`), `status` (`active | blocked | deleted`), `lastLoginAt`, `failedLoginAttempts`, `lockUntil`.
- Остальные таблицы PostgreSQL (`Categories`, `Authors`, `Products`, `ProductAuthors`, `ProductFiles`, `Carts`, `CartItems`, `Orders`, `OrderItems`, `Payments`, `Downloads`, `Reviews`, `WishlistItems`) описаны в [db_structure.md](db_structure.md); модели лежат в `server/models/`. HTTP-эндпоинтов для них, кроме `/api/products`, пока нет.
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

## Структура проекта

- `server/` — бэкенд (Express + Sequelize). Запуск: `cd server && npm install && npm run dev`.
- `client/` — фронтенд (React + Vite), пока автономный, данные хранятся в localStorage. Запуск: `cd client && npm install && npm run dev`.
