# FOP Panel - Company Directory Application

A modern company directory application built with Next.js, Material-UI, and Node.js/Express. This application provides a user-friendly interface for browsing company contacts with advanced features like search, filtering, caching, and dark mode support.

## Features

- 🔐 **User Authentication** - Secure login with external API integration
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Material-UI Components** - Modern, accessible UI components
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 🔍 **Advanced Search** - Search by name, extension, or email
- 🏷️ **Tag Filtering** - Filter contacts by tags
- ⚡ **Smart Caching** - Browser-based caching with configurable TTL
- 🔄 **Manual Refresh** - Force refresh to update cached data
- 📧 **Email Integration** - Click-to-email functionality
- 👤 **Agent Indicators** - Visual indicators for agent status
- 📊 **Statistics Display** - Real-time contact count and cache status

## Architecture

### Frontend (Next.js + Material-UI)
- **Framework**: Next.js 14+ with App Router
- **UI Library**: Material-UI v5
- **Language**: TypeScript
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Caching**: localStorage with TTL

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT tokens
- **External API Integration**: Axios
- **XML Generation**: xml2js (for Yealink phonebook)

## Project Structure

```
.
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── contexts/         # React contexts (Auth, Theme)
│   ├── lib/              # Utilities, API client, types
│   └── package.json
│
├── backend/              # Node.js backend service
│   ├── src/
│   │   ├── config/      # Configuration management
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── types/       # TypeScript interfaces
│   │   └── index.ts     # Entry point
│   └── package.json
│
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to the external API (credentials required)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Easy\ Panel
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Configuration

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
API_BASE_URL=https://im01.mobileuc.co.za:9443/api/v2/
LOGIN_ENDPOINT=config/login
LIST_USERS_ENDPOINT=config/users
ACCOUNT_ID=your-account-id
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CACHE_TTL=300000
```

## Usage

### Login
1. Navigate to the login page
2. Enter your credentials:
   - Username
   - Password
   - Domain
3. Click "Sign In"

### Directory
- **Search**: Type in the search bar to filter contacts
- **Filter by Tag**: Click on tag chips to filter by specific tags
- **Refresh**: Click the refresh button to update cached data
- **Dark Mode**: Toggle theme using the sun/moon icon
- **Email**: Click on email addresses to open your email client
- **Logout**: Click the logout icon to sign out

### Caching
- Directory data is cached in the browser for 5 minutes (configurable)
- Cache is user-specific and cleared on logout
- Manual refresh bypasses cache and fetches fresh data
- Cache age is displayed in the statistics bar

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate user

### Directory
- `GET /api/directory` - Get directory data (protected)
- `GET /api/directory/phonebook.xml` - Get XML phonebook for Yealink phones (protected)

### Health
- `GET /api/health` - Health check endpoint

## Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
```

## Deployment

### Backend
- Deploy to Railway, Render, DigitalOcean, or any Node.js hosting
- Set environment variables in hosting platform
- Ensure HTTPS is enabled in production

### Frontend
- Deploy to Vercel, Netlify, or any Next.js hosting
- Set environment variables in hosting platform
- Update `NEXT_PUBLIC_API_URL` to point to production backend

## Security Considerations

- JWT tokens with expiration
- No credentials stored in frontend
- CORS restricted to frontend origin
- Input validation on all endpoints
- httpOnly cookies recommended for production
- Rate limiting on authentication endpoint (recommended)

## Technologies Used

### Frontend
- Next.js 14+
- Material-UI v5
- TypeScript
- Axios
- date-fns
- React Context API

### Backend
- Node.js 18+
- Express.js
- TypeScript
- jsonwebtoken
- Axios
- xml2js
- dotenv
- cors

## License

[Your License Here]

## Support

For issues or questions, please contact [your-contact-info]
