# Security Compliance Checker - Frontend

React frontend application for the Security Compliance Checker login system.

## Features

- Modern React application with Vite
- User authentication with AWS Cognito
- Protected routes
- Token management
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/Prod
```

Replace `your-api-gateway-url` and `region` with your actual API Gateway endpoint URL.

## Development

Run the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

Preview the production build:
```bash
npm run preview
```

## API Integration

The frontend expects a login endpoint at `/login` that:
- Accepts POST requests with `{ username, password }` in the body
- Returns `{ accessToken, idToken, refreshToken }` on success
- Returns `{ error: "message" }` on failure with status 401

