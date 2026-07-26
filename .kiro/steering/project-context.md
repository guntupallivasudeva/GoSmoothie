# GoSmoothie - Project Context

## Overview

GoSmoothie is a full-stack e-commerce web application for a smoothie and healthy food shop. It features a Node.js/Express backend with MongoDB (Mongoose ODM) and a multi-page HTML frontend using TailwindCSS.

## Technology Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Frontend    | HTML5, TailwindCSS (CDN v3.4.16), Vanilla JS       |
| Backend     | Node.js, Express.js v4.18                          |
| Database    | MongoDB with Mongoose v7.5                         |
| Auth        | JWT (jsonwebtoken v9), bcrypt v5                   |
| Payments    | Stripe v11 (optional, skips if key not configured) |
| Dev Tools   | nodemon for hot reload                             |
| Icons       | RemixIcon (CDN), Bootstrap Icons (npm)             |
| Fonts       | Poppins (body), Pacifico (brand logo)              |

## Project Structure

```
GoSmoothie/
├── server.js                    # Express entry point (port 3000)
├── package.json                 # Dependencies & npm scripts
├── .env / .env.example          # Environment config
├── server/
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js             # 8-digit userId, bcrypt password
│   │   ├── Admin.js            # 12-digit adminId, role-based
│   │   ├── Product.js          # 12-digit productId, productCode PROD#
│   │   ├── Cart.js             # Per-user cart with items array
│   │   ├── Order.js            # Per-user orders array
│   │   ├── Payment.js          # Payment records per user
│   │   ├── UserPayment.js      # Alternate payment tracking
│   │   └── Address.js          # Per-user addresses array
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/register, /login
│   │   ├── products.js         # GET/POST/PUT/DELETE /api/products
│   │   ├── cart.js             # CRUD /api/cart + /merge
│   │   ├── orders.js           # CRUD /api/orders
│   │   ├── addresses.js        # CRUD /api/addresses
│   │   ├── users.js            # /api/users/me, change-password, delete
│   │   ├── payments.js         # POST /api/payments/create-session
│   │   └── admins.js           # /api/admins (login, dashboard, CRUD)
│   ├── middleware/
│   │   └── auth.js             # JWT verify, buildToken, requireAdmin
│   ├── utils/
│   │   ├── idGenerator.js      # Numeric ID generation utilities
│   │   └── productCatalog.js   # Ensures snapshot products in DB
│   ├── data/
│   │   └── productSnapshot.js  # 60 products across 6 categories
│   ├── scripts/                # DB maintenance scripts
│   └── seed.js                 # Seeds demo data
├── main.html                    # Homepage (hero, featured, builder, order)
├── menu.html                    # Full menu (60 items, filter, nutrition)
├── cart.html                    # Shopping cart
├── payment.html                 # Checkout page
├── order-confirmation.html      # Order success
├── login.html                   # User login
├── register.html                # User registration
├── profile.html                 # User profile management
├── reset-password.html          # Password reset
├── admin-dashboard.html         # Admin console (analytics, CRUD)
├── admin-login.html             # Admin login
└── about-us.html                # About page
```

## Key Architecture Decisions

- **Per-user document pattern**: Cart, Orders, Payments, Addresses each store a single document per userId containing an array of sub-documents (not one document per item/order).
- **Anonymous user support**: Unauthenticated users get a `clientToken` (format: `c_<timestamp><random>`). On login, anonymous carts merge into the authenticated user's cart via `/api/cart/merge`.
- **Soft-delete for products**: Products are archived (`isArchived: true`) rather than deleted.
- **Auto-seeding**: The products route calls `ensureSnapshotProducts()` on first GET to populate the catalog from `productSnapshot.js`.
- **Static file serving**: Frontend HTML files are served directly from the project root via Express static middleware.
- **No SPA framework**: Each page is a standalone HTML file with inline `<script>` blocks. State is managed via localStorage.

## Authentication Flow

1. User registers/logs in -> receives JWT token (7-day expiry)
2. Token stored in `localStorage` as `gs_token`, user object as `gs_user`
3. All API requests include `Authorization: Bearer <token>` header
4. Anonymous users identified by `gs_clientId` in localStorage
5. Admin tokens include `role: 'admin'` in JWT payload; guarded by `requireAdmin` middleware

## API Routes Summary

| Method | Route                        | Auth     | Purpose                        |
| ------ | ---------------------------- | -------- | ------------------------------ |
| POST   | /api/auth/register           | None     | Register new user              |
| POST   | /api/auth/login              | None     | Login                          |
| GET    | /api/products                | None     | List products (+ filters)      |
| POST   | /api/products                | Admin    | Create product                 |
| PUT    | /api/products/:id            | Admin    | Update product                 |
| DELETE | /api/products/:id            | Admin    | Archive product                |
| GET    | /api/cart                    | User/Anon| Get cart                       |
| POST   | /api/cart                    | User/Anon| Add to cart                    |
| PUT    | /api/cart/:cartId            | User/Anon| Update quantity                |
| DELETE | /api/cart/:cartId            | User/Anon| Remove item                    |
| POST   | /api/cart/merge              | User     | Merge anonymous cart           |
| GET    | /api/orders                  | Any      | List orders (admin/user query) |
| POST   | /api/orders                  | User/Anon| Create order from cart         |
| PUT    | /api/orders/:orderId         | Any      | Update order status            |
| DELETE | /api/orders/:orderId         | Any      | Delete order                   |
| GET    | /api/addresses               | Any      | List addresses                 |
| POST   | /api/addresses               | User/Anon| Add address                    |
| PUT    | /api/addresses/:id           | Any      | Update address                 |
| DELETE | /api/addresses/:id           | Any      | Delete address                 |
| GET    | /api/users/me                | User     | Get profile                    |
| PUT    | /api/users/me                | User     | Update profile                 |
| POST   | /api/users/change-password   | User     | Change password                |
| DELETE | /api/users/me                | User     | Delete account                 |
| POST   | /api/payments/create-session | User/Anon| Create Stripe checkout         |
| POST   | /api/admins/login            | None     | Admin login                    |
| GET    | /api/admins/dashboard        | Admin    | Dashboard analytics            |
| CRUD   | /api/admins                  | Admin    | Manage admin accounts          |

## Product Categories (60 items total)

1. **Smoothies** (10 items) - Rs 220-300
2. **Salads** (10 items) - Rs 180-300
3. **Ice Creams** (10 items) - Rs 120-180
4. **Seasonal Fruit Juices / Smoothies** (10 items) - Rs 95-185
5. **Protein Rice Bowls** (10 items) - Rs 190-300
6. **Healthy Snacks** (10 items) - Rs 80-180

## Environment Variables

| Variable     | Purpose                          | Default                               |
| ------------ | -------------------------------- | ------------------------------------- |
| MONGODB_URI  | MongoDB connection string        | mongodb://127.0.0.1:27017/gosmoothie  |
| PORT         | Server port                      | 3000                                  |
| JWT_SECRET   | Token signing secret             | dev_secret_change_me                  |
| STRIPE_SECRET| Stripe API key (optional)        | (empty = Stripe disabled)             |
| NODE_ENV     | Environment                      | development                           |

## NPM Scripts

| Script       | Command                                          | Purpose              |
| ------------ | ------------------------------------------------ | -------------------- |
| start        | node server.js                                   | Production start     |
| dev          | nodemon server.js                                | Development (reload) |
| test         | node server/test.js                              | Run tests            |
| seed         | node server/seed.js                              | Seed demo data       |
| reset-db     | node server/scripts/reset_database_with_snapshot.js | Reset database    |

## Frontend Conventions

- **Colors**: Primary `#4ade80` (green), Secondary `#f97316` (orange)
- **Tailwind config**: Extended with custom colors and border-radius tokens
- **Brand font**: Pacifico for logo/headings
- **Body font**: Poppins (weights 300-700)
- **Layout**: Responsive grid with container mx-auto, max-w-6xl
- **Components**: Cards with rounded-2xl, shadow-md, hover:-translate-y-2
- **Toast notifications**: Fixed bottom-right, 3s timeout
- **Modals**: Centered overlay with backdrop, Promise-based confirm/cancel
- **Dark mode**: Supported on login.html and main.html via `html.dark` class toggle

## Demo Credentials

- **User**: demo@local / password123
- **Admin**: (created via seed or API)

## Key User Flows

1. **Browse -> Cart -> Checkout**: Browse menu -> Add items -> View cart -> Payment -> Order confirmation
2. **Anonymous -> Registered**: Browse as anonymous (clientId) -> Register -> Cart auto-merges
3. **Admin**: Login at /api/admins/login -> Access dashboard with orders, payments, products, users analytics
