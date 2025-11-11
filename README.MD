# Campus Marketplace

Full-stack marketplace for campus communities. React frontend and Express.js backend (MVC). Features product/business/gig listings, messaging, wallets, escrow transactions, Telegram integration and email notifications.

Repository: https://github.com/Irehh/Campus-Marketplace-Mysource.git

---

## Table of contents

- Features
- Tech stack
- Project structure
- API — main endpoints
- Environment variables
- Local setup (backend & frontend)
- Database & migrations
- Running Telegram bot & webhooks
- Tests & logging
- Deployment notes
- Contributing
- License & contact

---

## Features

- User registration, email verification, password reset
- Google OAuth login
- Product listings with images, categories and view counts
- Business listings and campus-specific marketplaces
- Gigs (services), bidding and seller workflows
- Cart, checkout, orders, order items and order history
- Wallets and transactions (escrow, fees, verified transactions)
- Push notifications and subscription management
- Messaging system between users
- Comments, favorites, search and filters
- Admin routes for moderation and management
- Telegram bot integration (polling or webhook)
- WhatsApp integration endpoints
- File uploads (multer) and image processing (sharp)
- Sitemap and robots.txt generation

---

## Tech stack

- Backend: Node.js, Express.js, Sequelize (MySQL), JWT, Nodemailer
- Frontend: React.js (plain React), Tailwind CSS, Axios
- Extras: Telegram Bot API, Multer, Sharp, zlib (sitemap compression)

---

## Project structure (important folders)

- mysource_backend/ — Express backend
  - controllers/, routes/, middleware/, models/, migrations/, utils/
  - index.js — app entry
- mysource_frontend/ — React frontend (src/)
- uploads/ — uploaded files

---

## API — main endpoints

Base: /api

Auth
- POST /api/auth/register — register
- POST /api/auth/login — login
- POST /api/auth/google-login — google oauth
- POST /api/auth/resend-verification
- GET /api/auth/verify-email/:token
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/active-users
- GET /api/auth/me (protected)
- PUT /api/auth/profile (protected)
- GET/PUT /api/auth/notification-settings (protected)

Products
- GET /api/products — list
- GET /api/products/:id — detail
- POST /api/products — create (protected)
- PUT /api/products/:id — update (protected)
- DELETE /api/products/:id — delete (protected)

Businesses
- GET /api/businesses
- GET /api/businesses/:id
- POST/PUT/DELETE (protected)

Gigs & Bids
- GET /api/gigs
- GET /api/gigs/:id
- POST /api/bids (create bid)
- GET /api/bids (seller/buyer views)

Cart & Orders
- GET /api/cart
- POST /api/cart (add)
- DELETE /api/cart/:itemId
- POST /api/orders/buy-now
- POST /api/orders (create checkout)
- GET /api/orders/:id

Wallet & Transactions
- GET /api/wallet
- POST /api/wallet/deposit
- POST /api/wallet/webhook — Paystack webhook (raw body expected)
- GET /api/transactions

Messaging & Notifications
- GET /api/messages
- POST /api/messages
- POST /api/push/subscribe

Search & Sitemap
- GET /api/search
- GET /sitemap.xml
- GET /robots.txt

Admin
- /api/admin/* — admin routes for moderation, stats and management

Telegram & WhatsApp
- /api/telegram/*
- /api/whatsapp/*

Notes: This README lists the primary endpoints. See `mysource_backend/routes/` for full route maps and controller details.

---

## Environment variables

Create `.env` in `mysource_backend/` and `mysource_frontend/` as needed. Common backend variables:

- PORT=5000
- NODE_ENV=development
- CORS_ORIGIN=https://mysource.ng
- API_BASE_URL=https://mysource.ng (used for sitemap)
- JWT_SECRET=your_jwt_secret
- JWT_EXPIRES_IN=7d
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (or DATABASE_URL)
- FRONTEND_URL=http://localhost:3000
- MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS (SMTP settings)
- UPLOAD_DIR=uploads
- ENABLE_TELEGRAM=true|false
- TELEGRAM_TOKEN=your_bot_token
- TELEGRAM_USE_POLLING=true|false
- PAYSTACK_SECRET (if using Paystack)
- SENTRY_DSN (optional)
- NODE_APP_INSTANCE or other envs per config

---

## Local setup

Prerequisites:
- Node.js >= 18, npm
- MySQL (or compatible) running
- Optional: ngrok for webhook testing

Backend
1. cd mysource_backend
2. npm install
3. Create `.env` with the values above
4. Run DB migrations:
   - npx sequelize db:migrate
   - (or run migration scripts defined in package.json)
5. Start server:
   - Development: npm run dev
   - Production: npm start
6. API available at http://localhost:5000

Frontend
1. cd mysource_frontend
2. npm install
3. Create `.env` for frontend variables (FRONTEND_URL, API_BASE_URL)
4. Start:
   - npm run dev (or npm start depending on package.json)
5. Frontend available at http://localhost:3000

---

## Database & migrations

- Migrations live in `mysource_backend/migrations/`
- Models are in `mysource_backend/models/`
- Use Sequelize CLI:
  - npx sequelize db:migrate
  - npx sequelize db:migrate:undo
- Ensure DB credentials in `.env` are correct.

---

## Telegram bot & webhooks

- To use webhooks: set ENABLE_TELEGRAM=true and TELEGRAM_USE_POLLING=false.
- Expose local server with ngrok: ngrok http 5000
- Set webhook: https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook?url=<NGROK_URL>/api/telegram/webhook

Or use polling (TELEGRAM_USE_POLLING=true) — bot starts on app boot.

---

## Tests & logging

- Logs saved to `mysource_backend/logs/`
- Add unit tests in controllers/utils and run via your test runner (not included by default)
- Use logger utilities in `utils/logger.js`

---

## Deployment notes

- Build frontend and serve via CDN or static site hosting
- Backend: use process manager (PM2) or containerize with Docker
- Ensure env vars are set in production, enable HTTPS, set CORS_ORIGIN
- Use secure storage for JWT_SECRET and mail credentials
- For high availability, run DB on managed service and configure backups

---

## Contributing

1. Fork the repo (https://github.com/Irehh/Campus-Marketplace-Mysource.git)
2. Create feature branch
3. Run tests and lint
4. Submit pull request with clear description

---

## Maintainer & contact

Repository owner: irehh  
For issues, open an issue on GitHub.

---

## License

Open source (choose a license file). Add LICENSE in repo.