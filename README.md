# Multi-Tenant Service Marketplace Platform

A comprehensive service marketplace platform built with Next.js, MySQL, and TypeScript. Supports multi-tenancy, role-based access control, and multi-language interfaces (Arabic/English).

## 🚀 Features

- **Multi-Tenancy**: Complete tenant isolation with subdomain support
- **Role-Based Access Control**: 5 roles (customer, provider, provider_staff, admin, super_admin)
- **JWT Authentication**: Secure HTTP-only cookies
- **MySQL Database**: Full schema with 16 tables and audit logging
- **RESTful APIs**: 21+ endpoints for comprehensive functionality
- **Admin Dashboard**: User, provider, category, and booking management
- **Provider Dashboard**: Profile, services, bookings, and statistics
- **Security**: bcrypt hashing, RBAC middleware, SQL injection protection

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## 🛠️ Installation

1. **Clone & Install Dependencies**
   ```bash
   git clone <repository-url>
   cd project
   npm install
   ```

2. **Setup MySQL Database**
   ```bash
   mysql -u root -p
   CREATE DATABASE service_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'marketplace_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON service_marketplace.* TO 'marketplace_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   mysql -u marketplace_user -p service_marketplace < mysql\ file\ scripts/service_marketplace.sql
   ```

3. **Demo Accounts**
Super Admin:
Email: admin@demo.com
Password: demo123

Service Provider:
Email: provider@demo.com
Password: demo123

Customer:
Email: customer@demo.com
Password: demo123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Public APIs
- `GET /api/services` - List services
- `GET /api/services/:id` - Get service details
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category details
- `GET /api/home` - Homepage data
- `GET /api/search` - Search services

### Customer APIs
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List customer bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/reviews` - Create review
- `GET /api/reviews?serviceId=:id` - Get service reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:id/read` - Mark notification read
- `POST /api/notifications/read-all` - Mark all read
- `GET /api/wallet` - Get wallet balance
- `POST /api/payments` - Process payment

### Provider APIs
- `GET /api/provider/profile` - Get profile
- `PUT /api/provider/profile` - Update profile
- `GET /api/provider/services` - List services
- `POST /api/provider/services` - Create service
- `PUT /api/provider/services/:id` - Update service
- `DELETE /api/provider/services/:id` - Delete service
- `GET /api/provider/bookings` - List bookings
- `POST /api/provider/bookings/:id/status` - Update booking status
- `GET /api/provider/statistics` - Get statistics

### Admin APIs
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/providers` - List providers
- `PUT /api/admin/providers/:id` - Update provider
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/bookings` - List bookings
- `PUT /api/admin/bookings/:id` - Update booking
- `GET /api/admin/statistics` - Get statistics

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── provider/          # Provider dashboard pages
│   ├── customer/          # Customer pages
│   └── api/               # API routes
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── provider/         # Provider components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── auth/             # JWT utilities
│   ├── db/               # MySQL connection
│   ├── i18n/             # Translations
│   └── middleware/       # Auth middleware
├── models/               # Database models
├── utils/                # Helper utilities
└── mysql file scripts/   # Database scripts
```


Built with Next.js, MySQL, TypeScript

By Mohamed Abdelmahmoud