# Skyfuel Backend

Skyfuel Backend is a modular Node.js Express API for user authentication, management, and payment integration (Razorpay). It uses PostgreSQL with Prisma ORM for data persistence and Zod for validation.

## Features

- User authentication (signup/signin, JWT-based)
- Session management
- OTP support for email verification, password reset, and login
- Payment processing via Razorpay (planned)
- RESTful API endpoints
- Centralized error handling
- Modular code structure

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm
- PostgreSQL

### Installation

```bash
git clone https://github.com/Codebrokers111/skyfuel-backend.git
cd skyfuel-backend
npm install
```

### Environment Setup

Copy `.env_example` to `.env` and fill in your values:

```
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>%23@localhost:5432/<DB_NAME>?schema=public"
JWT_SECRET="<YOUR_JWT_SECRET>"
PORT=<YOUR_PORT>
```

### Prisma Database Migration

To set up the database schema, run:

```bash
npx prisma migrate dev --name init
```

This will apply migrations from [prisma/migrations/](prisma/migrations/) and generate the Prisma client.

To generate Prisma types after schema changes:

```bash
npx prisma generate
```

### Running the Server

For development (auto-reload):

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint               | Description                |
| ------ | ---------------------- | -------------------------- |
| POST   | /v1/auth/signup        | User registration          |
| POST   | /v1/auth/signin        | User login                 |
| GET    | /v1/auth/getuser       | Getting User Details       |
| POST   | /v1/auth/verifycaptcha | Verifying Captcha          |
| POST   | /v1/auth/existuser     | check user already exist   |
| POST   | /v1/auth/glogin        | for Google Login           |
| POST   | /v1/mail/sendmail      | Send OTP on singnup        |
| ...    | ...                    | More endpoints coming soon |

## Project Structure

- [`src/app.ts`](src/app.ts): Express app setup
- [`src/server.ts`](src/server.ts): HTTP server entrypoint
- [`src/db/prisma.ts`](src/db/prisma.ts): Prisma client instance
- [`src/modules/auth/`](src/modules/auth/): Auth routes, service, validation
- [`prisma/schema.prisma`](prisma/schema.prisma): Database schema
