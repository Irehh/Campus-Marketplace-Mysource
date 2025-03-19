# Campus Marketplace

A full-stack web application using Next.js for the frontend and Express.js for the backend, following the MVC architecture. The application allows students to find businesses on campus, buy and sell items specific to their campus, with Telegram integration.

## Features

- Mobile-first, responsive design
- Campus-specific marketplaces (e.g., UNILAG marketplace, UNIBEN marketplace)
- Search functionality for products and businesses
- User authentication with email/password and Google OAuth
- Password reset via email
- Telegram bot integration for posting content and receiving notifications
- Real-time events display
- Product and business listings with images
- Messaging system between users
- User dashboard for managing listings
- View count tracking for products and businesses
- Comment system for products and businesses
- Active user count display

## Tech Stack

### Frontend
- React.js
- React Router
- Tailwind CSS
- React Hot Toast for notifications
- React Icons
- React OAuth for Google authentication
- Axios for API requests

### Backend
- Express.js
- MySQL database
- Prisma ORM
- MVC architecture
- JWT for authentication
- Node-Telegram-Bot-API for Telegram integration
- Nodemailer for email sending
- Multer for file uploads
- Sharp for image processing

## Project Structure

The project follows a modular structure with separation of concerns:

### Frontend
- `src/` - Main source directory
  - `components/` - Reusable UI components
  - `contexts/` - React context providers
  - `pages/` - Page components
  - `utils/` - Utility functions and shared logic

### Backend
- `src/` - Main source directory
  - `controllers/` - Request handlers following MVC pattern
  - `middleware/` - Custom middleware functions
  - `models/` - Database models (via Prisma)
  - `routes/` - API route definitions
  - `utils/` - Utility functions for the server
  - `prisma/` - Prisma schema and migrations

## Environment Variables

### Frontend (.env)


Thought for 7 secondsI'll implement all your requested changes and improvements. Let's tackle each task step by step:

## 1. Adding Admin Contact to Listing Details Pages

First, I'll add a button to contact the campus admin in both the product and business detail pages. We'll use the admin's website/link field.

```typescriptreact project="campus-marketplace"
...
```

## Important Notes about the Implementation

### 1. Admin Contact Button

- The admin contact button is added to both product and business detail pages
- It uses the admin's website field as the link
- It only appears if there's an admin with a website field for that campus
- The button is styled to stand out but not distract from the main UI


### 2. Dashboard Fixes

- I've improved the error handling in the user dashboard to fix the "Failed to load your listings" error
- Using `Promise.allSettled` ensures that even if one API call fails, the other can still succeed
- Added proper error messages and fallbacks


### 3. Telegram Bot Setup with ngrok

To properly connect your Telegram bot, you need to:

1. **Set up the webhook on your backend** (not frontend). The key points are:

1. Run your backend server locally
2. Use ngrok to expose your backend (`ngrok http 5000`)
3. Set the webhook using the ngrok URL + your endpoint path (`/api/telegram/webhook`)



2. **Environment Variables**:

1. Make sure `ENABLE_TELEGRAM=true` and `TELEGRAM_USE_POLLING=false` when using webhooks
2. Set your bot token and username in the .env file



3. **Testing**:

1. Users should be able to link their accounts in the profile section
2. Notifications should be sent to users via Telegram
3. Users should be able to search and post via Telegram commands





The webhook must point to your backend because that's where the Telegram controller logic is implemented. The frontend just provides the UI for users to link their accounts.
