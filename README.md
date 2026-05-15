# Wistoria Blog Platform

## Live Deployments

- Frontend (Vercel): https://frontend-eta-flax-29.vercel.app
- Backend (Render): https://wistoria-blog.onrender.com
- Backend health check: https://wistoria-blog.onrender.com/api/v1/health

Wistoria is a premium, full-stack, industry-ready blog platform built with Next.js 15, Node.js, Express, MongoDB, and Tailwind CSS. It features a modern, responsive design with dynamic animations, secure authentication, rich text editing, and an administrative dashboard.

## 🌟 Key Features

- **Premium UI/UX**: Built with Shadcn UI, Tailwind CSS, and Framer Motion for a stunning, glassmorphism-inspired aesthetic with dark mode support.
- **Secure Authentication**: JWT-based auth with HttpOnly refresh cookies, password hashing (bcrypt), and role-based access control (User, Author, Admin).
- **Rich Text Editor**: Integrated Tiptap editor for seamless content creation with inline image uploads.
- **Dynamic Content**: Full-text search, pagination, category filtering, and sorting (latest, popular, trending).
- **Interactive Engagement**: Nested comment system (replies), likes on posts and comments, and a follower/following system for users.
- **Admin Dashboard**: Centralized management for monitoring users, approving posts, managing categories, and viewing platform statistics.
- **Cloud Storage**: Integrated Cloudinary for robust image hosting.
- **Scalable Backend**: MVC architecture with robust error handling, rate limiting, and Zod data validation.

## 📂 Project Structure

The project is structured into two main directories:

- `frontend/`: Next.js 15 application using the App Router.
- `backend/`: Node.js & Express REST API.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (Atlas or local)
- Cloudinary account

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

Deployment configurations are included:
- **Backend**: `render.yaml` for Render deployment.
- **Frontend**: `vercel.json` for Vercel deployment with API proxies configured.

## 🛡️ API Endpoints Reference

- **Auth**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`
- **Users**: `/api/v1/users/:username`, `/api/v1/users/me`, `/api/v1/users/:id/follow`
- **Posts**: `/api/v1/posts`, `/api/v1/posts/:slug`, `/api/v1/posts/:id/like`
- **Comments**: `/api/v1/comments/:postId`
- **Admin**: `/api/v1/admin/stats`, `/api/v1/admin/users`, `/api/v1/admin/categories`

## 👨‍💻 Tech Stack

- **Frontend**: Next.js 15, React, Zustand, Tailwind CSS, Shadcn UI, Framer Motion, Tiptap.
- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose, Zod, Cloudinary.
