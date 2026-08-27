# GoSmoothie — Complete Project Documentation

> A full-stack smoothie e-commerce application built with Node.js, Express, MongoDB, and vanilla HTML5/JavaScript.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Configuration](#environment-configuration)
5. [Database Models](#database-models)
6. [API Reference](#api-reference)
7. [Authentication & Authorization](#authentication--authorization)
8. [Payment Integration](#payment-integration)
9. [Image Storage System](#image-storage-system)
10. [Frontend Architecture](#frontend-architecture)
11. [Admin Dashboard](#admin-dashboard)
12. [CI/CD & Deployment](#cicd--deployment)
13. [Scripts & Utilities](#scripts--utilities)
14. [Security Practices](#security-practices)

---

## Project Overview

GoSmoothie is a production-ready smoothie shop e-commerce platform featuring:

- User registration, login, and profile management
- Product catalog with categories, nutrition metadata, and image management
- Shopping cart (supports both anonymous guests and authenticated users)
- Multi-step checkout with delivery/pickup modes
- Multiple payment options (Stripe, UPI, Cash on Delivery)
- Order tracking and history
- Full admin dashboard with database explorer
- Responsive design for mobile and desktop

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Runtime          | Node.js (18.x / 20.x)                    |
| Framework        | Express.js 4.18                          |
| Database         | MongoDB (Mongoose 7.5 ODM)               |
| Authentication   | JSON Web Tokens (jsonwebtoken 9.x)       |
| Password Hashing | bcrypt 5.1                               |
| File Upload      | Multer 1.4.5 (memory storage)            |
| Image Processing | Sharp 0.35                               |
| Payments         | Stripe 11.x (optional)                   |
| Frontend         | Vanilla HTML5/JS, Tailwind CSS 3.4 (CDN) |
| Icons            | Remix Icon 4.5, Bootstrap Icons 1.13     |
| Fonts            | Google Fonts (Poppins, Pacifico)         |
| Dev Server       | Nodemon 2.x                              |
| CI/CD            | GitHub Actions → Vercel auto-deploy      |

### Dependencies (package.json)

```json
{
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.5.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.35.3",
    "stripe": "^11.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### NPM Scripts

| Script         | Command                               | Description                 |
| -------------- | ------------------------------------- | --------------------------- |
| `start`        | `node server.js`                      | Production start            |
| `dev`          | `nodemon server.js`                   | Development with hot-reload |
| `create-admin` | `node server/scripts/create_admin.js` | Bootstrap admin account     |

---

## Project Structure

```
GoSmoothie/
├── server.js                          # Express app entry point
├── package.json                       # Dependencies & scripts
├── .env                               # Environment variables (gitignored)
├── .env.example                       # Template for env vars
├── .gitignore                         # Git exclusions
├── README.md                          # Quick-start readme
├── DOCUMENTATION.md                   # This file
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI pipeline
│
├── server/
│   ├── config/
│   │   └── payments.js                # COD configuration reader
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT auth middleware + requireAdmin
│   │   └── validateProduct.js         # Product input validation
│   │
│   ├── models/
│   │   ├── Admin.js                   # Admin account schema
│   │   ├── Address.js                 # User delivery addresses
│   │   ├── Cart.js                    # Shopping cart
│   │   ├── Order.js                   # Order history
│   │   ├── Payment.js                 # Payment ledger
│   │   ├── Product.js                 # Product catalog
│   │   ├── ProductImage.js            # Binary image storage
│   │   ├── User.js                    # User account schema
│   │   └── UserPayment.js             # Per-user payment records
│   │
│   ├── routes/
│   │   ├── auth.js                    # Registration & login
│   │   ├── admins.js                  # Admin auth, dashboard, DB CRUD
│   │   ├── products.js                # Product catalog CRUD + images
│   │   ├── cart.js                    # Shopping cart operations
│   │   ├── orders.js                  # Order creation & management
│   │   ├── addresses.js               # Address CRUD
│   │   ├── users.js                   # User profile management
│   │   └── payments.js                # Stripe & COD checkout
│   │
│   ├── services/
│   │   └── imageStore.js              # Image save/get/remove (DB + disk)
│   │
│   ├── utils/
│   │   ├── idGenerator.js             # Unique numeric ID generation
│   │   ├── imageValidator.js          # Magic-byte image validation
│   │   └── requestUser.js             # Token→User resolution helpers
│   │
│   └── scripts/
│       └── create_admin.js            # Admin account seeding script
│
└── frontend/
    ├── main.html                      # Homepage
    ├── menu.html                      # Product catalog
    ├── cart.html                       # Cart page
    ├── payment.html                   # Checkout page
    ├── order-confirmation.html        # Order success page
    ├── login.html                     # User login
    ├── register.html                  # User registration
    ├── reset-password.html            # Password reset
    ├── profile.html                   # User profile
    ├── about-us.html                  # Company info
    ├── admin-login.html               # Admin login
    ├── admin-dashboard.html           # Admin console
    │
    ├── js/
    │   ├── config.js                  # Runtime API URL config
    │   ├── api-client.js              # Fetch proxy for API routing
    │   ├── session.js                 # Central session management
    │   ├── toast.js                   # Toast notifications
    │   ├── main.js                    # Homepage logic
    │   ├── menu.js                    # Catalog page logic
    │   ├── cart.js                    # Cart page logic
    │   ├── payment.js                 # Checkout logic
    │   ├── payment-brands.js          # Payment brand logos
    │   ├── order-confirmation.js      # Post-order page logic
    │   ├── login.js                   # Login form logic
    │   ├── register.js                # Registration form logic
    │   ├── reset-password.js          # Password reset logic
    │   ├── profile.js                 # Profile page logic
    │   ├── about-us.js                # About page logic
    │   ├── admin-login.js             # Admin login form
    │   └── admin-dashboard.js         # Admin dashboard logic
    │
    ├── css/
    │   ├── main.css                   # Homepage styles
    │   ├── menu.css                   # Catalog styles
    │   ├── cart.css                   # Cart styles
    │   ├── payment.css                # Checkout styles
    │   ├── order-confirmation.css     # Order confirm styles
    │   ├── login.css                  # Login styles
    │   ├── register.css               # Register styles
    │   ├── reset-password.css         # Reset password styles
    │   ├── profile.css                # Profile styles
    │   ├── about-us.css               # About page styles
    │   ├── admin-login.css            # Admin login styles
    │   ├── admin-dashboard.css        # Admin dashboard styles
    │   ├── responsive.css             # Responsive breakpoints
    │   └── toast.css                  # Toast notification styles
    │
    └── assets/
        ├── favicon.svg                # Browser favicon
        ├── brands/                    # Payment brand SVG logos (22 files)
        │   ├── visa.svg, mastercard.svg, rupay.svg, amex.svg
        │   ├── google-pay.svg, phonepe.svg, paytm.svg, bhim.svg
        │   ├── amazon-pay.svg, hdfc.svg, icici.svg, sbi.svg
        │   ├── axis.svg, canara.svg, federal-bank.svg, pnb.svg
        │   ├── union-bank.svg, yes-bank.svg, indusind.svg
        │   ├── idfc-first.svg, airtel-payments-bank.svg
        │   └── SOURCES.md
        └── images/
            └── generated-menu/        # 60 product images (.jpg)
```

---

## Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

| Variable         | Required | Default                                | Description                                                    |
| ---------------- | -------- | -------------------------------------- | -------------------------------------------------------------- |
| `MONGODB_URI`    | Yes      | `mongodb://127.0.0.1:27017/gosmoothie` | MongoDB connection string                                      |
| `PORT`           | No       | `3000`                                 | Server port                                                    |
| `JWT_SECRET`     | Yes      | _(none — must be set)_                 | JWT signing secret (use a strong random string)                |
| `STRIPE_SECRET`  | No       | _(disabled)_                           | Stripe secret key (from Stripe dashboard)                      |
| `COD_ENABLED`    | No       | `true`                                 | Enable Cash on Delivery                                        |
| `COD_MAX_TOTAL`  | No       | `2000`                                 | Max order total (INR) for COD                                  |
| `NODE_ENV`       | No       | `development`                          | Environment mode                                               |
| `ADMIN_NAME`     | No       | `Admin`                                | Default admin name (for create-admin script)                   |
| `ADMIN_EMAIL`    | No       | _(set your own)_                       | Admin email for create-admin script                            |
| `ADMIN_PASSWORD` | No       | _(set your own)_                       | Admin password for create-admin script (use a strong password) |

---

## Database Models

### 1. User

| Field          | Type             | Notes                                                               |
| -------------- | ---------------- | ------------------------------------------------------------------- |
| `userId`       | String (8-digit) | Auto-generated, unique                                              |
| `name`         | String           | Required                                                            |
| `email`        | String           | Required, unique, indexed                                           |
| `passwordHash` | String           | bcrypt hashed                                                       |
| `phoneNumber`  | String           | Optional                                                            |
| `phone`        | String           | Optional (alternate)                                                |
| `isAnonymous`  | Boolean          | Default: false                                                      |
| `clientToken`  | String           | Indexed, for anonymous carts                                        |
| `isActive`     | Boolean          | Default: true                                                       |
| `addresses`    | Array            | Embedded AddressSchema (label, street, city, zip, notes, isDefault) |
| `createdAt`    | Date             | Auto-set                                                            |

**Methods:** `verifyPassword(password)` — compares with bcrypt hash.

### 2. Admin

| Field                     | Type              | Notes                     |
| ------------------------- | ----------------- | ------------------------- |
| `adminId`                 | String (12-digit) | Auto-generated, unique    |
| `name`                    | String            | Required                  |
| `email`                   | String            | Required, unique, indexed |
| `passwordHash`            | String            | bcrypt hashed             |
| `phoneNumber`             | String            | Optional                  |
| `role`                    | String            | Default: "admin"          |
| `isActive`                | Boolean           | Default: true             |
| `_createdBy`              | Mixed             | Audit trail               |
| `_lastUpdatedBy`          | Mixed             | Audit trail               |
| `createdAt` / `updatedAt` | Date              | Auto-set                  |

**Methods:** `verifyPassword(password)`

### 3. Product

| Field              | Type              | Notes                                                        |
| ------------------ | ----------------- | ------------------------------------------------------------ |
| `productId`        | String (12-digit) | Auto-generated, unique                                       |
| `productCode`      | String            | Auto-generated (PROD1, PROD2, ...)                           |
| `name`             | String            | Required, max 120 chars                                      |
| `description`      | String            | Max 2000 chars                                               |
| `category`         | String            | e.g., "Smoothies", "Juices", "Bowls"                         |
| `type`             | String            | "Vegetarian" \| "Vegan" \| "Non-Vegetarian"                  |
| `price`            | Number            | Required, 0.01–999999.99                                     |
| `image`            | String            | URL or `/api/products/:id/image`                             |
| `featuredImage`    | String            | External URL for featured display                            |
| `meta`             | Object            | { calories, protein, carbs, fat, fiber, sugar, ingredients } |
| `isFeatured`       | Boolean           | Homepage featured flag                                       |
| `featuredOrder`    | Number            | Sort order for featured (0–9999)                             |
| `isArchived`       | Boolean           | Soft-delete flag                                             |
| `isOutOfStock`     | Boolean           | Stock availability                                           |
| `archivedAt`       | Date              | When archived                                                |
| `imageStoragePath` | String            | Disk fallback path                                           |
| `imageContentType` | String            | MIME for disk image                                          |
| `imageSize`        | Number            | Bytes for disk image                                         |

### 4. ProductImage

| Field                     | Type   | Notes              |
| ------------------------- | ------ | ------------------ |
| `productId`               | String | Unique, indexed    |
| `productName`             | String | Denormalized name  |
| `data`                    | Buffer | Raw image bytes    |
| `contentType`             | String | MIME type          |
| `size`                    | Number | File size in bytes |
| `checksum`                | String | SHA-256 hex digest |
| `createdAt` / `updatedAt` | Date   |                    |

### 5. Cart

| Field                     | Type   | Notes                                                 |
| ------------------------- | ------ | ----------------------------------------------------- |
| `userId`                  | String | Unique, indexed (user's userId OR anonymous clientId) |
| `carts`                   | Array  | Embedded CartItems                                    |
| `createdAt` / `updatedAt` | Date   |                                                       |

**CartItem sub-document:**

- `cartId` (String, 12-digit) — unique line identifier
- `productId`, `productName`, `quantity`, `unitPrice`, `subtotal`, `imageUrl`

### 6. Order

| Field                     | Type   | Notes                   |
| ------------------------- | ------ | ----------------------- |
| `userId`                  | String | Unique, indexed         |
| `orders`                  | Array  | Embedded OrderSubSchema |
| `createdAt` / `updatedAt` | Date   |                         |

**Order sub-document:**

- `orderId` (String, 12-digit: userId + 4 random digits)
- `paymentId`, `items[]`, `addressSnapshot`
- `subtotal`, `tax` (10%), `deliveryFee`, `totalAmount`
- `orderStatus`: "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled"
- `paymentStatus`: "paid" | "cash due" | "unpaid"
- `paymentMethod`: display label (e.g., "UPI QR", "Netbanking · HDFC Bank")
- `paymentMode`: "online" | "cod"

### 7. Payment

| Field      | Type   | Notes                     |
| ---------- | ------ | ------------------------- |
| `userId`   | String | Unique, indexed           |
| `payments` | Array  | Embedded PaymentSubSchema |

**Payment sub-document:**

- `paymentId`, `userName`, `userEmail`, `userPhone`
- `paymentMethod`, `amountPaid`, `transactionId`
- `paymentStatus`: "pending" | "paid" | "cash due"
- `orderId`, `createdAt`

### 8. Address

| Field       | Type   | Notes                     |
| ----------- | ------ | ------------------------- |
| `userId`    | String | Unique, indexed           |
| `addresses` | Array  | Embedded AddressSubSchema |

**Address sub-document:**

- `addressId` (12-digit), `fullName`, `phoneNumber`
- `addressLine1`, `addressLine2`, `city`, `state`, `country`, `pincode`, `landmark`
- `addressType`: "home" | "work" | "other"
- `isDefault`, `createdAt`, `updatedAt`

### 9. UserPayment

Separate collection tracking user payment history with structure identical to Payment model.

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint    | Body                        | Response          | Auth |
| ------ | ----------- | --------------------------- | ----------------- | ---- |
| POST   | `/register` | `{ name, email, password }` | `{ token, user }` | None |
| POST   | `/login`    | `{ email, password }`       | `{ token, user }` | None |

### Products (`/api/products`)

| Method | Endpoint                | Description                                              | Auth                        |
| ------ | ----------------------- | -------------------------------------------------------- | --------------------------- |
| GET    | `/`                     | List products (query: `featured`, `includeArchived`)     | None (archived needs admin) |
| POST   | `/`                     | Create product (multipart: fields + optional image file) | Admin                       |
| PUT    | `/:productId`           | Update product (multipart)                               | Admin                       |
| PUT    | `/:productId/archive`   | Archive product                                          | Admin                       |
| PUT    | `/:productId/restore`   | Restore archived product                                 | Admin                       |
| PUT    | `/:productId/stock`     | Toggle isOutOfStock                                      | Admin                       |
| GET    | `/:productId/image`     | Serve product image binary                               | None                        |
| HEAD   | `/:productId/image`     | Image metadata only                                      | None                        |
| DELETE | `/:productId/image`     | Remove product image                                     | Admin                       |
| DELETE | `/:productId/permanent` | Permanently delete product + image                       | Admin                       |
| DELETE | `/:productId`           | Archive product (legacy)                                 | Admin                       |
| GET    | `/images/gallery`       | All product images metadata                              | Admin                       |

### Cart (`/api/cart`)

| Method | Endpoint   | Description                         | Auth              |
| ------ | ---------- | ----------------------------------- | ----------------- |
| GET    | `/`        | Get user's cart (query: `clientId`) | Token or clientId |
| POST   | `/`        | Add item to cart                    | Token or clientId |
| PUT    | `/:cartId` | Update item quantity                | Token or clientId |
| DELETE | `/:cartId` | Remove item from cart               | Token or clientId |
| DELETE | `/`        | Clear entire cart                   | Token or clientId |
| POST   | `/merge`   | Merge anonymous cart into user cart | Token required    |

### Orders (`/api/orders`)

| Method | Endpoint    | Description                        | Auth               |
| ------ | ----------- | ---------------------------------- | ------------------ |
| GET    | `/`         | List all orders (admin, paginated) | None (route-level) |
| GET    | `/my`       | Current user's orders              | Token              |
| GET    | `/:orderId` | Single order details               | None               |
| POST   | `/`         | Create order from cart             | Token or clientId  |
| PUT    | `/:orderId` | Update order/payment status        | None               |
| DELETE | `/:orderId` | Delete order                       | None               |

**POST `/` body:**

```json
{
  "clientId": "optional_for_anonymous",
  "addressId": "optional_address_id",
  "paymentMode": "online|cod",
  "paymentMethod": "UPI QR",
  "mode": "delivery|pickup",
  "fulfillment": { "deliveryOption": "standard|express" }
}
```

### Addresses (`/api/addresses`)

| Method | Endpoint      | Description                                               | Auth              |
| ------ | ------------- | --------------------------------------------------------- | ----------------- |
| GET    | `/`           | List addresses (query: `userId`, `search`, `addressType`) | Token or clientId |
| GET    | `/:addressId` | Get single address                                        | None              |
| POST   | `/`           | Create address                                            | Token or clientId |
| PUT    | `/:addressId` | Update address                                            | None              |
| DELETE | `/:addressId` | Delete address                                            | None              |

### Users (`/api/users`)

| Method | Endpoint           | Description                                    | Auth  |
| ------ | ------------------ | ---------------------------------------------- | ----- |
| GET    | `/me`              | Get current user profile                       | Token |
| PUT    | `/me`              | Update profile (name, email, phone, addresses) | Token |
| POST   | `/change-password` | Change password                                | Token |
| DELETE | `/me`              | Delete account + all data                      | Token |

### Payments (`/api/payments`)

| Method | Endpoint          | Description                              | Auth              |
| ------ | ----------------- | ---------------------------------------- | ----------------- |
| GET    | `/options`        | Get payment configuration (COD settings) | None              |
| POST   | `/create-session` | Create Stripe checkout session           | Token or clientId |

### Admin (`/api/admins`)

| Method | Endpoint                                | Description                         | Auth  |
| ------ | --------------------------------------- | ----------------------------------- | ----- |
| POST   | `/login`                                | Admin login                         | None  |
| GET    | `/dashboard`                            | Full dashboard stats                | Admin |
| GET    | `/`                                     | List admins (paginated, searchable) | Admin |
| GET    | `/:adminId`                             | Get admin details                   | Admin |
| POST   | `/`                                     | Create new admin                    | Admin |
| PUT    | `/:adminId`                             | Update admin                        | Admin |
| DELETE | `/:adminId`                             | Delete admin                        | Admin |
| GET    | `/database/details`                     | Full DB collection details          | Admin |
| GET    | `/database/generate-id/:collection`     | Generate unique ID                  | Admin |
| GET    | `/database/schemas`                     | All model schemas                   | Admin |
| POST   | `/database/document/:collection`        | Create document                     | Admin |
| PUT    | `/database/document/:collection/:docId` | Update document                     | Admin |
| DELETE | `/database/document/:collection/:docId` | Delete document                     | Admin |
| DELETE | `/database/collection/:collection`      | Drop collection                     | Admin |
| PUT    | `/database/user/:userId`                | Update user                         | Admin |
| DELETE | `/database/user/:userId`                | Delete user                         | Admin |

---

## Authentication & Authorization

### Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Authentication Flow                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User registers/logs in → receives JWT                           │
│  2. JWT payload: { id, userId, name, email, [role] }                │
│  3. Token expires in 7 days                                         │
│  4. Token stored in: localStorage + cookie (cross-port bridging)    │
│  5. Every request: auth middleware decodes token (non-blocking)     │
│  6. Protected routes check req.user manually                        │
│  7. Admin routes use requireAdmin middleware                        │
│  8. SESSION_INVALID → browser auto-clears token + reloads           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Middleware (`server/middleware/auth.js`)

- **`authMiddleware`** — Runs on ALL requests. Extracts `Bearer <token>` from Authorization header, verifies JWT, and sets `req.user`. Non-blocking (invalid/missing tokens are silently ignored).
- **`requireAdmin`** — Route-level guard. Returns 401 if no valid session, 403 if `req.user.role !== 'admin'`.
- **`buildToken(payload, expiresIn)`** — Creates a signed JWT.

### Anonymous Cart Support

Unauthenticated users receive a browser-generated `clientId` (format: `c_<timestamp><random>`). This ID is passed as a query parameter or body field to identify the anonymous cart. On login, `POST /api/cart/merge` transfers anonymous cart items to the authenticated user's cart.

### Session Management (Frontend)

`session.js` provides `window.GoSmoothieSession` with:

- `getToken()`, `getUser()`, `isLoggedIn()`
- `setSession(token, user)`, `clearSession()`
- `getClientId()` — persistent anonymous ID
- `authHeaders()`, `jsonHeaders()` — request helpers
- `apiUrl(path)` — appends clientId for anonymous requests
- `handleInvalidSession()` — clears dead sessions on 401 + SESSION_INVALID
- `renderAuthHeader()` — updates nav UI for signed-in state

---

## Payment Integration

### Stripe (Optional)

- Configured via `STRIPE_SECRET` environment variable
- Key validated at startup using regex: `^sk_(test|live)_[A-Za-z0-9]+$`
- If invalid or missing, Stripe is disabled (other payment options remain)
- Creates a Stripe Checkout Session with line items from the cart
- Currency: INR
- Supports card payment method type

### Cash on Delivery (COD)

- Configured via `COD_ENABLED` and `COD_MAX_TOTAL` env vars
- Default: enabled with ₹2000 max order total
- When selected, order is created with `paymentStatus: "cash due"` and `paymentMode: "cod"`
- Configuration exposed at `GET /api/payments/options`

### Frontend Payment Modal

The checkout page (`payment.html`) displays a payment method selector supporting:

- UPI (QR code, VPA)
- Debit/Credit Cards (Visa, Mastercard, RuPay, Amex)
- Net Banking (HDFC, ICICI, SBI, Axis, and more)
- Wallets (Paytm, PhonePe, Amazon Pay)
- Cash on Delivery

Only the payment method **label** is stored (e.g., "UPI QR", "Netbanking · HDFC Bank"). No card numbers, CVVs, or UPI credentials are ever stored in the database.

---

## Image Storage System

### Architecture

```
Upload Request → Multer (memory) → Image Validator → Image Store → MongoDB (primary) / Disk (fallback)
```

### Image Validator (`server/utils/imageValidator.js`)

- Allowed types: JPEG, PNG, WebP, GIF, HEIC, HEIF, AVIF, SVG, TIFF, BMP, MP4, MOV, WebM
- Max size: 50 MiB
- Magic byte verification for JPEG, PNG, WebP, GIF
- Types without practical magic byte checks (SVG, HEIC, etc.) trust the declared content type

### Image Store (`server/services/imageStore.js`)

| Method                                 | Description                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `save(productId, buffer, contentType)` | Store image in MongoDB (ProductImage collection); disk fallback on DB failure |
| `get(productId)`                       | Retrieve with SHA-256 checksum verification                                   |
| `getFast(productId)`                   | Retrieve WITHOUT checksum verification (for serving)                          |
| `getMetadata(productId)`               | Metadata only (no buffer loaded)                                              |
| `remove(productId)`                    | Delete from DB + disk                                                         |

### Serving Strategy

- Images served at `GET /api/products/:productId/image`
- ETag-based caching (`"<sha256-checksum>"`)
- Cache-Control: `public, max-age=31536000, immutable`
- Conditional GET (304 Not Modified) via `If-None-Match` header
- On MongoDB connect: auto-imports local `/assets/images/generated-menu/` into ProductImage collection

---

## Frontend Architecture

### Page Load Order (Every Page)

```html
<script src="/js/config.js"></script>
<!-- API URL configuration -->
<script src="/js/api-client.js"></script>
<!-- Fetch proxy -->
<script src="/js/session.js"></script>
<!-- Session management -->
<!-- Page-specific CSS/JS -->
```

### API Client (`js/api-client.js`)

Intercepts `window.fetch` calls to `/api/*` paths:

- **Production (split deployment)**: Routes to `window.__GO_SMOOTHIE_API_URL`
- **Monolith mode** (empty URL): Same-origin requests
- **Local dev** (Live Server on port ≠ 3000): Proxies to `localhost:3000`

### Pages

| Page               | URL                        | Features                                                                                                        |
| ------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Homepage           | `/main.html`               | Hero section, featured products carousel, smoothie builder (base → fruits → boosters → size), newsletter signup |
| Menu               | `/menu.html`               | Full product grid, category filters, search, nutrition info, add-to-cart                                        |
| Cart               | `/cart.html`               | Cart items, quantity adjustment, remove items, order summary, proceed to checkout                               |
| Checkout           | `/payment.html`            | Delivery/pickup toggle, geolocation, address management, payment method selection, order placement              |
| Order Confirmation | `/order-confirmation.html` | Order success message, order details, navigation options                                                        |
| Login              | `/login.html`              | Email/password login, password strength indicator, redirect to intended page                                    |
| Register           | `/register.html`           | Name/email/password registration, password strength checker                                                     |
| Reset Password     | `/reset-password.html`     | Password reset flow                                                                                             |
| Profile            | `/profile.html`            | View/edit name, email, phone; manage addresses; order history; change password; delete account                  |
| About Us           | `/about-us.html`           | Company story, team section, values, contact form                                                               |
| Admin Login        | `/admin-login.html`        | Admin email/password authentication                                                                             |
| Admin Dashboard    | `/admin-dashboard.html`    | Full admin panel (see Admin Dashboard section)                                                                  |

### Toast Notifications

Global toast system (`js/toast.js` + `css/toast.css`) providing success, error, info, and warning messages throughout the application.

---

## Admin Dashboard

The admin dashboard (`admin-dashboard.html` + `js/admin-dashboard.js`) is a comprehensive management console.

### Dashboard Tabs

1. **Overview** — Revenue stats, total orders/users/payments, order fulfillment pulse, payment status breakdown, top-selling products
2. **Orders** — Full order list, status filters, order detail view, status updates
3. **Payments** — Payment ledger, filter by status, transaction details
4. **Catalog** — Product management: create/edit/archive/restore/stock toggle, image upload, nutrition editor
5. **Database Editor** — Raw collection explorer: view/create/update/delete documents in any collection
6. **Image Gallery** — All product images with metadata, preview, storage info

### Admin Authentication

- Separate login endpoint (`POST /api/admins/login`)
- Admin tokens contain `role: "admin"` in the JWT payload
- All admin routes (except login) protected by `requireAdmin` middleware
- Admin session stored separately from user session

### Audit Trails

Admin actions record `_createdBy` and `_lastUpdatedBy` fields:

```json
{
  "adminId": "123456789012",
  "name": "Admin",
  "at": "2024-01-15T10:30:00.000Z"
}
```

---

## CI/CD & Deployment

### GitHub Actions (`.github/workflows/ci.yml`)

**Triggers:** Push to `main` or `develop`, PRs to `main`

**Build & Test Job:**

- Matrix: Node.js 18.x and 20.x
- Steps:
  1. Checkout code
  2. Setup Node.js with npm cache
  3. `npm ci` (clean install)
  4. `npm audit --audit-level=high` (non-blocking)
  5. Syntax check: `node -c server.js`
  6. Syntax check: all files in `server/routes/`, `server/middleware/`, `server/models/`

**Deploy Job:**

- Runs after build-and-test passes
- Only on push to `main` branch
- Vercel auto-deploys from GitHub (no manual deploy step)

### Vercel Deployment

- Auto-deploys on push to `main`
- Serves both frontend (static) and backend (serverless/Node.js) from same project
- Environment variables configured in Vercel dashboard
- Frontend config (`js/config.js`) sets `window.__GO_SMOOTHIE_API_URL` for split deployments

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# 3. Create admin account
npm run create-admin

# 4. Start development server
npm run dev

# 5. Visit http://localhost:3000/main.html
```

---

## Scripts & Utilities

### Admin Creation (`server/scripts/create_admin.js`)

Creates or updates the admin account. Safe to run repeatedly (idempotent).

```bash
npm run create-admin

# Custom credentials via env:
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=YourStrongPassword npm run create-admin
```

### ID Generator (`server/utils/idGenerator.js`)

| Function                                        | Description                                |
| ----------------------------------------------- | ------------------------------------------ |
| `generate8DigitId()`                            | Random 8-digit numeric string              |
| `generate12DigitId()`                           | Random 12-digit numeric string             |
| `generateUniqueNumericId(model, field, length)` | DB-checked unique ID (up to 1000 attempts) |
| `generateOrderId(userId, existingIds)`          | userId (8 digits) + 4 random digits        |
| `generateNextProductCode(ProductModel)`         | Sequential PROD1, PROD2, ...               |
| `peekNextProductCode(ProductModel)`             | Preview next code without increment        |
| `isExactNumericId(value, length)`               | Validates format                           |

### Request User (`server/utils/requestUser.js`)

| Function                     | Description                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `resolveTokenUser(req)`      | Resolves JWT → User document (handles legacy tokens, case-insensitive email) |
| `hasStaleSession(req, user)` | True when token is valid but account is deleted                              |
| `sendSessionInvalid(res)`    | Standard 401 response with `code: "SESSION_INVALID"`                         |

---

## Security Practices

### Secrets Management

- All secrets stored in `.env` file (gitignored)
- `.env` has **never** been committed to git
- `.env.example` contains only placeholder values
- `.gitignore` excludes: `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`
- Server code loads secrets via `process.env` with safe local-only fallbacks

### Password Security

- Passwords hashed with bcrypt (cost factor 10)
- `passwordHash` field excluded from API responses (`select("-passwordHash")`, `delete safeUser.passwordHash`)
- Password strength indicators on login/register forms
- Minimum requirements enforced on frontend

### JWT Security

- Secret loaded from environment variable
- 7-day token expiry
- Dead sessions detected and cleared automatically
- Invalid tokens silently ignored (no information leakage)

### Input Validation

- Product validation middleware checks: name length, description length, price range/decimals, category, type enum, meta numeric ranges, image URL format (no `data:`, `javascript:`, `file:` schemes)
- Image upload: magic byte verification, size limits, allowed MIME type whitelist
- Path traversal prevention: image paths reject `..` segments and backslashes
- MongoDB injection prevention via Mongoose schema typing

### Admin Security

- Separate authentication flow and model
- `requireAdmin` middleware on all admin routes
- Deactivated admin accounts cannot log in (403 response)
- Audit trails on admin actions

### Frontend Security

- No secrets in frontend code (no API keys, no Stripe publishable keys hardcoded)
- Token stored in localStorage + HttpOnly-equivalent cookies (SameSite=Lax)
- Automatic session invalidation on account deletion/deactivation
- Fetch proxy prevents accidental credential leakage to wrong origins

### CI/CD Security

- No secrets in CI workflow file
- `npm audit` checks for dependency vulnerabilities
- Vercel manages production secrets via dashboard environment variables
