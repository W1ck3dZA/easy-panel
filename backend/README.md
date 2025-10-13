# FOP Panel Backend Service

Node.js/Express backend service for the FOP Panel company directory application. Provides authentication, directory management, and XML phonebook generation.

## Features

- JWT-based authentication with external API integration
- Protected API endpoints
- Directory data fetching and processing
- XML phonebook generation for Yealink phones
- CORS support
- TypeScript for type safety
- Environment-based configuration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: jsonwebtoken
- **HTTP Client**: Axios
- **XML Generation**: xml2js
- **Environment**: dotenv
- **CORS**: cors middleware

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts          # Configuration management
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   └── directory.ts       # Directory routes
│   ├── services/
│   │   ├── authService.ts     # Authentication logic
│   │   └── directoryService.ts # Directory logic
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── index.ts               # Application entry point
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# External API Configuration
API_BASE_URL=https://im01.mobileuc.co.za:9443/api/v2/
LOGIN_ENDPOINT=config/login
LIST_USERS_ENDPOINT=config/users
ACCOUNT_ID=your-account-id

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user with external API and return JWT token.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123",
  "domain": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "user@example.com",
    "domain": "admin"
  }
}
```

### Directory

#### GET /api/directory
Get directory data (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "contacts": [
    {
      "name": "John Doe",
      "extension": "1001",
      "email": "john@example.com",
      "tags": ["Sales", "Manager"],
      "isAgent": true
    }
  ],
  "total": 1
}
```

#### GET /api/directory/phonebook.xml
Generate XML phonebook for Yealink phones (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<YealinkIPPhoneDirectory>
  <DirectoryEntry>
    <Name>John Doe</Name>
    <Telephone>1001</Telephone>
  </DirectoryEntry>
</YealinkIPPhoneDirectory>
```

### Health

#### GET /api/health
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "message": "FOP Panel Backend Service is running",
  "timestamp": "2025-09-30T16:58:00.000Z"
}
```

## Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests (if configured)
npm test
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and use in `src/index.ts`
3. Add authentication middleware if needed

Example:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  // Your logic here
});

export default router;
```

### Adding New Services

1. Create service file in `src/services/`
2. Export service class or functions
3. Import and use in routes

Example:
```typescript
export class MyService {
  async doSomething() {
    // Your logic here
  }
}

export const myService = new MyService();
```

## Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Backend authenticates with external API
3. On success, backend generates JWT containing external API token
4. JWT is returned to client
5. Client includes JWT in Authorization header for protected routes
6. Backend validates JWT and extracts external API token
7. Backend uses external API token to make requests

## Security

- JWT tokens expire after configured time (default 24h)
- External API tokens are encrypted within JWT
- CORS restricted to configured origin
- No credentials stored in code
- Environment variables for sensitive data
- Input validation on all endpoints

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (expired token)
- `500` - Internal Server Error

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Set all environment variables in hosting platform
2. Ensure `NODE_ENV=production`
3. Use strong `JWT_SECRET`
4. Configure `CORS_ORIGIN` to production frontend URL
5. Enable HTTPS

### Recommended Hosting

- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Heroku

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### CORS Errors
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3000
```

### External API Connection Issues
- Verify API_BASE_URL is correct
- Check network connectivity
- Verify account credentials
- Check API rate limits

## License

[Your License Here]
