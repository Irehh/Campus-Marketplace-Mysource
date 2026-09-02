# Campus Marketplace

Full-stack marketplace for campus communities. React frontend and Express.js backend (MVC). Features product/business/gig listings, messaging, wallets, escrow transactions, Telegram integration and email notifications.

Repository: https://github.com/Irehh/Campus-Marketplace-Mysource.git

---

## Table of contents

* Features
* Tech stack
* Project structure
* API — main endpoints
* Environment variables
* Local setup
* Docker setup
* Database & migrations
* Running Telegram bot & webhooks
* Tests & logging
* Deployment notes
* Contributing
* License & contact

---

## Features

* User registration, email verification, password reset
* Google OAuth login
* Product listings with images, categories and view counts
* Business listings and campus-specific marketplaces
* Gigs (services), bidding and seller workflows
* Cart, checkout, orders, order items and order history
* Wallets and transactions (escrow, fees, verified transactions)
* Push notifications and subscription management
* Messaging system between users
* Comments, favorites, search and filters
* Admin routes for moderation and management
* Telegram bot integration (polling or webhook)
* WhatsApp integration endpoints
* File uploads (multer) and image processing (sharp)
* Sitemap and robots.txt generation

---

## Tech stack

### Backend

* Node.js
* Express.js
* Sequelize
* MySQL
* JWT
* Nodemailer

### Frontend

* React.js
* Tailwind CSS
* Axios

### Integrations

* Telegram Bot API
* WhatsApp
* Google OAuth
* Paystack
* OpenAI
* Multer
* Sharp

---

## Project structure

```text
Campus-Marketplace-Mysource/
│
├── mysource_backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── migrations/
│   ├── utils/
│   ├── uploads/
│   ├── logs/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
│
├── mysource_frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## API — main endpoints

Base: `/api`

### Auth

* `POST /api/auth/register` — register
* `POST /api/auth/login` — login
* `POST /api/auth/google-login` — Google OAuth
* `POST /api/auth/resend-verification`
* `GET /api/auth/verify-email/:token`
* `POST /api/auth/forgot-password`
* `POST /api/auth/reset-password`
* `GET /api/auth/active-users`
* `GET /api/auth/me` — protected
* `PUT /api/auth/profile` — protected
* `GET/PUT /api/auth/notification-settings` — protected

### Products

* `GET /api/products` — list
* `GET /api/products/:id` — detail
* `POST /api/products` — create
* `PUT /api/products/:id` — update
* `DELETE /api/products/:id` — delete

### Businesses

* `GET /api/businesses`
* `GET /api/businesses/:id`
* `POST/PUT/DELETE` — protected

### Gigs & Bids

* `GET /api/gigs`
* `GET /api/gigs/:id`
* `POST /api/bids` — create bid
* `GET /api/bids` — seller/buyer views

### Cart & Orders

* `GET /api/cart`
* `POST /api/cart`
* `DELETE /api/cart/:itemId`
* `POST /api/orders/buy-now`
* `POST /api/orders`
* `GET /api/orders/:id`

### Wallet & Transactions

* `GET /api/wallet`
* `POST /api/wallet/deposit`
* `POST /api/wallet/webhook` — Paystack webhook
* `GET /api/transactions`

### Messaging & Notifications

* `GET /api/messages`
* `POST /api/messages`
* `POST /api/push/subscribe`

### Search & Sitemap

* `GET /api/search`
* `GET /sitemap.xml`
* `GET /robots.txt`

### Admin

* `/api/admin/*` — admin routes for moderation, statistics and management

### Telegram & WhatsApp

* `/api/telegram/*`
* `/api/whatsapp/*`

> This README lists the primary endpoints. See `mysource_backend/routes/` for the complete route map and controller details.

---

# Environment variables

The project supports both traditional local development and Docker-based development.

## Backend environment variables

Create an environment file for the backend containing the variables required by the application.

Common variables include:

```env
PORT=5000
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:5000

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=3306
DB_USER=campus_user
DB_PASSWORD=your_database_password
DB_NAME=campus_marketplace

FRONTEND_URL=http://localhost:3000

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=

UPLOAD_DIR=uploads

ENABLE_TELEGRAM=false
TELEGRAM_TOKEN=
TELEGRAM_USE_POLLING=false

PAYSTACK_SECRET=

OPENAI_API_KEY=

SENTRY_DSN=

NODE_APP_INSTANCE=
```

Do not commit real credentials or API keys to Git.

Use `.env.example` to document required variables without exposing secrets.

---

# Local setup

This method runs Node.js, React and MySQL directly on your computer.

## Prerequisites

* Node.js >= 18
* npm
* MySQL
* Optional: ngrok for webhook testing

## Backend

```bash
cd mysource_backend
npm install
```

Create the backend `.env` file and configure the required environment variables.

Run migrations:

```bash
npx sequelize db:migrate
```

Start the backend in development mode:

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

## Frontend

```bash
cd mysource_frontend
npm install
npm start
```

Frontend:

```text
http://localhost:3000
```

---

# Docker setup

Docker provides a consistent development environment without requiring Node.js or MySQL to be installed and configured manually for the project.

The Docker setup runs the following services:

```text
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌─────────────┐  ┌─────────────┐           │
│  │   Frontend  │  │   Backend   │           │
│  │ React/Nginx │  │ Node/Express│           │
│  │    :3000    │  │    :5000    │           │
│  └─────────────┘  └──────┬──────┘           │
│                           │                  │
│                           ▼                  │
│                    ┌─────────────┐           │
│                    │    MySQL    │           │
│                    │    :3306    │           │
│                    └─────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

Docker Compose automatically creates the internal network required for communication between the services.

---

## Docker prerequisites

Install:

* Docker Desktop
* Docker Compose

Verify installation:

```bash
docker --version
docker compose version
```

---

## Docker project configuration

The project contains:

```text
Campus-Marketplace-Mysource/
│
├── docker-compose.yml
│
├── .env
│
├── mysource_backend/
│   ├── Dockerfile
│   └── .env.docker
│
└── mysource_frontend/
    └── Dockerfile
```

### Root `.env`

The root `.env` contains variables used by Docker Compose to initialize MySQL.

Example:

```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=campus_marketplace
MYSQL_USER=campus_user
MYSQL_PASSWORD=your_database_password
```

### Backend `.env.docker`

The backend Docker environment contains application configuration.

Example:

```env
PORT=5000
NODE_ENV=development

DB_HOST=mysql
DB_PORT=3306
DB_USER=campus_user
DB_PASSWORD=your_database_password
DB_NAME=campus_marketplace

FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=your_openai_key
```

The important difference from local development is:

```env
DB_HOST=mysql
```

instead of:

```env
DB_HOST=localhost
```

`mysql` is the Docker Compose service name and is resolvable from the backend container.

---

# Dockerfiles

## Backend Dockerfile

Located at:

```text
mysource_backend/Dockerfile
```

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
```

## Frontend Dockerfile

Located at:

```text
mysource_frontend/Dockerfile
```

```dockerfile
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

# Docker Compose

The root `docker-compose.yml` defines the complete application.

Example:

```yaml
services:

  mysql:
    image: mysql:8.4
    container_name: campus-mysql
    restart: unless-stopped

    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}

    volumes:
      - mysql_data:/var/lib/mysql

    ports:
      - "3306:3306"


  backend:
    build:
      context: ./mysource_backend

    container_name: campus-backend
    restart: unless-stopped

    env_file:
      - ./mysource_backend/.env.docker

    ports:
      - "5000:5000"

    depends_on:
      - mysql


  frontend:
    build:
      context: ./mysource_frontend

    container_name: campus-frontend
    restart: unless-stopped

    ports:
      - "3000:80"

    depends_on:
      - backend


volumes:
  mysql_data:
```

---

# Starting the application with Docker

From the project root:

```bash
docker compose up --build
```

This will:

1. Build the backend image.
2. Build the frontend image.
3. Download the MySQL image if necessary.
4. Create the Docker network.
5. Create the MySQL persistent volume.
6. Start MySQL.
7. Start the backend.
8. Start the frontend.

Once running:

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:5000
```

MySQL:

```text
localhost:3306
```

---

# Running Docker in the background

Use:

```bash
docker compose up -d
```

Check running services:

```bash
docker compose ps
```

---

# Viewing logs

View all logs:

```bash
docker compose logs
```

Backend only:

```bash
docker compose logs backend
```

MySQL only:

```bash
docker compose logs mysql
```

Follow backend logs:

```bash
docker compose logs -f backend
```

Follow MySQL logs:

```bash
docker compose logs -f mysql
```

---

# Stopping Docker

Stop the application:

```bash
docker compose down
```

This removes the containers but keeps the MySQL data volume.

To remove the containers and database volume:

```bash
docker compose down -v
```

> Warning: `docker compose down -v` deletes the Compose-managed MySQL volume and therefore deletes the database data stored in that volume.

---

# Handling code changes

Docker images contain the application code that existed when the image was built.

If you change application code and the project is using the production-style Docker configuration, rebuild the affected image:

```bash
docker compose up --build
```

For development, bind mounts and development servers such as Nodemon/React development server can be used so that source-code changes are reflected without rebuilding the image every time.

---

# Handling environment changes

Environment variables are injected when a container is created.

If you modify `.env` or `.env.docker`, recreate the affected service:

```bash
docker compose up -d
```

If necessary, force recreation:

```bash
docker compose up -d --force-recreate backend
```

Environment changes normally do not require rebuilding the Docker image.

---

# Docker networking

Docker Compose creates an internal network for the application.

Containers communicate using their Compose service names.

For example:

```text
Backend → MySQL

mysql:3306
```

The backend should therefore use:

```env
DB_HOST=mysql
DB_PORT=3306
```

The browser, however, accesses the published host ports:

```text
Frontend → http://localhost:3000
Backend  → http://localhost:5000
```

Do not use `http://backend:5000` in browser-side React code because `backend` is a Docker-internal hostname and is not normally resolvable by the user's browser.

---

# Docker database persistence

MySQL uses the named Docker volume:

```text
mysql_data
```

mounted at:

```text
/var/lib/mysql
```

This means the database survives:

```bash
docker compose down
```

and container recreation.

The database volume should only be removed intentionally with:

```bash
docker compose down -v
```

---

# Database & migrations

Migrations are located in:

```text
mysource_backend/migrations/
```

Models are located in:

```text
mysource_backend/models/
```

For local development:

```bash
npx sequelize db:migrate
```

When running the backend inside Docker, migrations should be executed against the MySQL container.

For example:

```bash
docker compose exec backend npx sequelize db:migrate
```

This runs Sequelize CLI inside the backend container.

To undo the latest migration:

```bash
docker compose exec backend npx sequelize db:migrate:undo
```

---

# Telegram bot & webhooks

To use webhooks:

```env
ENABLE_TELEGRAM=true
TELEGRAM_USE_POLLING=false
```

Expose the local backend:

```bash
ngrok http 5000
```

Then configure the Telegram webhook using the generated HTTPS URL.

For polling:

```env
ENABLE_TELEGRAM=true
TELEGRAM_USE_POLLING=true
```

The bot can then start with the backend application.

---

# Tests & logging

Logs are saved to:

```text
mysource_backend/logs/
```

Logger utilities are located in:

```text
mysource_backend/utils/logger.js
```

Run the project's configured tests using the appropriate npm test command.

---

# Deployment notes

For production:

* Use production-specific environment variables.
* Never commit secrets to Git.
* Enable HTTPS.
* Configure `CORS_ORIGIN` appropriately.
* Use secure storage for JWT secrets, API keys and mail credentials.
* Use a managed MySQL database or a properly backed-up production database.
* Use persistent storage for uploaded files.
* Build and deploy immutable Docker images.
* Do not use development bind mounts in production.
* Use a reverse proxy such as Nginx where appropriate.
* Configure health checks and restart policies.
* Back up the production database regularly.

---

# Contributing

1. Fork the repository.
2. Create a feature branch.
3. Install dependencies or start the project with Docker.
4. Run tests.
5. Make your changes.
6. Submit a pull request with a clear description.

Repository:

https://github.com/Irehh/Campus-Marketplace-Mysource.git

---

# Maintainer & contact

Repository owner: irehh

For issues, open an issue on GitHub.

---

# License

Open source (choose a license file).

Add a `LICENSE` file to the repository when the project's license is finalized.
