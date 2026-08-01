# GoSmoothie 🥤

A complete full-stack smoothie e-commerce application with Node.js backend, MongoDB database, and responsive HTML5 frontend.

## 📚 Documentation

All documentation has been organized in the **`docs/`** folder. 

**Quick Links:**
- 📖 [Getting Started](docs/QUICKSTART.md) - 5-minute setup guide
- 📘 [Full Documentation](docs/README.md) - Complete reference
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- 🛠️ [Contributing](docs/CONTRIBUTING.md) - Development guidelines
- 📋 [API Reference](docs/API.md) - API endpoints
- ✅ [Status Report](docs/FINAL_STATUS.md) - Project completion details

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Seed database with products
npm run seed

# Start development server
npm run dev
```

Visit: **http://localhost:3000/main.html**

## 🧪 Testing

```bash
# Run tests
npm test

# Verify setup
npm run verify
```

## 📁 Project Structure

```
GoSmoothie/
├── docs/                    # 📚 All documentation
│   ├── README.md           # Full documentation
│   ├── QUICKSTART.md       # Quick setup guide
│   ├── API.md              # API reference
│   ├── DEPLOYMENT.md       # Deploy guide
│   ├── CONTRIBUTING.md     # Dev guidelines
│   └── ...                 # More guides
│
├── server/                 # Backend
│   ├── models/            # Database schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & validation
│   ├── seed.js            # Database seeding
│   └── test.js            # Tests
│
├── *.html                 # Frontend pages
├── server.js              # Express app
└── package.json           # Dependencies
```

## ✨ Features

- ✅ User registration & login (JWT)
- ✅ Product catalog from MongoDB
- ✅ Shopping cart (anonymous + authenticated)
- ✅ Order checkout and creation
- ✅ User profile management
- ✅ Responsive design with Tailwind CSS

## 🗄️ Database

- **Provider**: MongoDB Atlas
- **Database**: GoSmoothie
- **Accounts**: users are created through registration and read from MongoDB (no built-in demo users)
- **Admin**: run `npm run create-admin` to create the dashboard admin (`admin@local` / `Admin@123`, name `Admin`)

## 📖 See Also

For detailed information, visit the [docs folder](docs/) where you'll find:
- Complete feature documentation
- API endpoint reference
- Deployment instructions
- Contributing guidelines

---

**For full documentation, please see the [docs](docs/) folder.**
