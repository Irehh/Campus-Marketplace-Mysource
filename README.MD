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

