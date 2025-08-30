# Skyfuel Backend

This is a Node.js Express backend project for Skyfuel, featuring payment integration with Razorpay and other essential functionalities.

## Features

- User authentication and management
- Payment processing via Razorpay
- RESTful API endpoints
- Error handling and validation
- Modular code structure

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

```bash
git clone https://github.com/Codebrokers111/skyfuel-backend.git
cd skyfuel-backend
npm install
```

### Environment Setup

Create a `.env` file in the root directory and add:

```
PORT=3000
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
DATABASE_URL=your_database_url
```

### Running the Server

```bashs
npm start
```

## API Endpoints

| Method | Endpoint         | Description                |
|--------|-----------------|----------------------------|
| POST   | /api/auth/login | User login                 |
| POST   | /api/payments   | Initiate Razorpay payment  |
| GET    | /api/users      | List all users             |

## Payment Integration

Payments are handled using Razorpay. Refer to the `/api/payments` endpoint for initiating and verifying transactions.

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
