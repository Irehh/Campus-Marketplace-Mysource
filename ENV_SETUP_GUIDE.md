# Environment Setup Guide

This guide explains all environment variables used in the Campus Marketplace project.

## Quick Start

1. **Backend Setup**
   ```bash
   cd mysource_backend
   cp .env.example .env
   # Edit .env with your actual credentials
   npm install
   npx sequelize-cli db:migrate
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd mysource_frontend
   cp .env.example .env
   # Edit .env with your actual API URL and keys
   npm install
   npm start
   ```

## Environment Variables by Category

### Database Configuration
- `DB_HOST`: MySQL host (default: localhost)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `DB_DIALECT`: Database type (mysql, postgresql, etc.)
- `DB_SSL`: Enable SSL for database connection (true/false)

### Server Configuration
- `NODE_ENV`: Environment mode (development, test, production)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend application URL
- `API_BASE_URL`: Backend API URL
- `CORS_ORIGIN`: Frontend origin allowed by CORS

### Authentication & Security
- `JWT_SECRET`: Secret key for signing JWT tokens (use a strong random string in production)
- `JWT_EXPIRES_IN`: Token expiration time (e.g., 7d, 24h)
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key for bot protection
- `DISABLE_TURNSTILE`: Disable bot protection for development (false in production)

### Email Configuration
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP port (usually 587 for TLS)
- `EMAIL_SECURE`: Use SSL (true/false)
- `EMAIL_USER`: SMTP username/email
- `EMAIL_PASS`: SMTP password (for Gmail, use app-specific password)
- `EMAIL_FROM`: Sender email address

### File Upload
- `UPLOAD_DIR`: Directory for storing uploaded files (default: uploads)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 5242880 = 5MB)

### Telegram Bot Integration
- `ENABLE_TELEGRAM`: Enable/disable Telegram features (true/false)
- `TELEGRAM_BOT_TOKEN`: Token from Telegram @BotFather
- `TELEGRAM_USE_POLLING`: Use polling instead of webhooks (true/false)

### Push Notifications
- `VAPID_PUBLIC_KEY`: Public VAPID key for push notifications
- `VAPID_PRIVATE_KEY`: Private VAPID key for push notifications

Generate VAPID keys:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Payment Processing (Paystack)
- `PAYSTACK_SECRET_KEY`: Paystack API secret key for processing payments

### WhatsApp Integration (Twilio)
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio authentication token
- `TWILIO_WHATSAPP_NUMBER`: Twilio WhatsApp sandbox number

### AI Features (OpenAI)
- `OPENAI_API_KEY`: OpenAI API key for AI-powered features

### Frontend-Specific Variables
- `REACT_APP_API_URL`: Backend API URL (must be accessible from browser)
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID
- `REACT_APP_TURNSTILE_SITE_KEY`: Cloudflare Turnstile public key
- `REACT_APP_DISABLE_TURNSTILE`: Disable bot protection in frontend
- `REACT_APP_TELEGRAM_BOT_USERNAME`: Telegram bot username (without @)
- `REACT_APP_VERSION`: Application version

## Setup Instructions for Third-Party Services

### 1. Google OAuth
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project
- Enable Google+ API
- Create OAuth 2.0 credentials (Web application)
- Add localhost URLs to authorized redirect URIs
- Copy Client ID to `REACT_APP_GOOGLE_CLIENT_ID`

### 2. Cloudflare Turnstile
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Navigate to Turnstile
- Create a site
- Copy Site Key to `REACT_APP_TURNSTILE_SITE_KEY`
- Copy Secret Key to `TURNSTILE_SECRET_KEY`

### 3. Telegram Bot
- Start chat with [@BotFather](https://t.me/BotFather)
- Create a new bot with `/newbot`
- Copy the bot token to `TELEGRAM_BOT_TOKEN`
- Get bot username (without @) for `REACT_APP_TELEGRAM_BOT_USERNAME`

### 4. Email (Gmail Example)
- Enable 2-Factor Authentication in Google Account
- Generate App Password: https://myaccount.google.com/apppasswords
- Use app password for `EMAIL_PASS`
- Set `EMAIL_USER` to your Gmail address
- Set `EMAIL_HOST` to smtp.gmail.com
- Set `EMAIL_PORT` to 587
- Set `EMAIL_SECURE` to false

### 5. Paystack
- Create account at [Paystack](https://paystack.com/)
- Navigate to Settings > API Keys & Webhooks
- Copy Secret Key to `PAYSTACK_SECRET_KEY`

### 6. Twilio WhatsApp
- Create account at [Twilio](https://www.twilio.com/)
- Set up WhatsApp Business Account
- Copy Account SID to `TWILIO_ACCOUNT_SID`
- Copy Auth Token to `TWILIO_AUTH_TOKEN`
- Get WhatsApp number for `TWILIO_WHATSAPP_NUMBER`

### 7. OpenAI
- Go to [OpenAI API](https://platform.openai.com/)
- Create API key
- Copy to `OPENAI_API_KEY`

## Security Best Practices

1. **Never commit .env files** - They contain sensitive information
2. **Use strong secrets** - For `JWT_SECRET`, use a cryptographically secure random string
3. **Rotate keys regularly** - Especially API keys and database passwords
4. **Different values per environment** - Use different credentials for development, testing, and production
5. **Restrict file permissions** - Ensure .env files are not readable by others

## Environment-Specific Examples

### Development
```
NODE_ENV=development
DISABLE_TURNSTILE=true
DB_HOST=localhost
```

### Production
```
NODE_ENV=production
DISABLE_TURNSTILE=false
DB_HOST=production-db-server.com
DB_SSL=true
```

## Troubleshooting

- **Database connection error**: Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
- **Email not sending**: Verify SMTP credentials and check Gmail app passwords
- **OAuth fails**: Ensure FRONTEND_URL matches Google OAuth redirect URIs
- **Turnstile fails**: Check TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY match
- **Telegram bot not responding**: Verify TELEGRAM_BOT_TOKEN is correct

For more help, check the project documentation or GitHub issues.
