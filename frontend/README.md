# FOP Panel Frontend

Modern Next.js frontend application for the FOP Panel company directory. Built with Material-UI and TypeScript, featuring authentication, caching, and dark mode support.

## Features

- 🔐 User authentication with JWT
- 🎨 Material-UI components
- 🌓 Dark/Light theme toggle
- 🔍 Real-time search
- 🏷️ Tag-based filtering
- ⚡ Smart caching with TTL
- 🔄 Manual refresh capability
- 📱 Fully responsive design
- 📧 Email integration
- 👤 Agent status indicators

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Material-UI v5
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
- **State Management**: React Context API
- **Styling**: MUI's sx prop + theme system

## Project Structure

```
frontend/
├── app/
│   ├── directory/
│   │   └── page.tsx       # Directory page
│   ├── login/
│   │   └── page.tsx       # Login page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects)
│   └── globals.css        # Global styles
├── contexts/
│   ├── AuthContext.tsx    # Authentication context
│   └── ThemeContext.tsx   # Theme context
├── lib/
│   ├── api.ts             # API client
│   ├── cache.ts           # Cache manager
│   ├── theme.ts           # MUI theme configuration
│   └── types.ts           # TypeScript interfaces
├── .env.local             # Environment variables
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
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
   echo "NEXT_PUBLIC_CACHE_TTL=300000" >> .env.local
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to http://localhost:3000

## Environment Variables

Create a `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Cache TTL in milliseconds (default: 5 minutes)
NEXT_PUBLIC_CACHE_TTL=300000
```

## Pages

### Home Page (`/`)
- Redirects to `/login` if not authenticated
- Redirects to `/directory` if authenticated

### Login Page (`/login`)
- Username, password, and domain fields
- Form validation
- Error handling
- Auto-redirect on successful login

### Directory Page (`/directory`)
- Protected route (requires authentication)
- Search functionality
- Tag filtering
- Contact cards with:
  - Name and extension
  - Email (clickable)
  - Tags
  - Agent indicator
- Statistics display
- Manual refresh button
- Dark mode toggle
- Logout button

## Components & Features

### Authentication

The app uses JWT-based authentication:

```typescript
// Login
const { login } = useAuth();
await login({ username, password, domain });

// Logout
const { logout } = useAuth();
logout();

// Check auth status
const { isAuthenticated, user } = useAuth();
```

### Theme Management

Toggle between light and dark modes:

```typescript
const { mode, toggleTheme } = useTheme();
```

Theme preferences are persisted in localStorage.

### Caching

Smart caching system with configurable TTL:

```typescript
// Save to cache
CacheManager.saveToCache(contacts, username);

// Get from cache
const cached = CacheManager.getFromCache(username);

// Check cache validity
const isValid = CacheManager.isCacheValid(username);

// Clear cache
CacheManager.clearCache();
```

Features:
- User-specific caching
- Automatic expiration
- Manual refresh option
- Cache age display

### API Client

Centralized API communication:

```typescript
// Login
const response = await apiClient.login(credentials);

// Get directory
const response = await apiClient.getDirectory();

// Health check
const response = await apiClient.healthCheck();
```

The API client automatically:
- Adds JWT token to requests
- Handles token expiration
- Manages localStorage

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Adding New Pages

1. Create page in `app/` directory
2. Use `'use client'` directive if using hooks
3. Import and use contexts as needed

Example:
```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MyPage() {
  const { user } = useAuth();
  return <div>Hello {user?.username}</div>;
}
```

### Adding New Components

1. Create component file
2. Export component
3. Import where needed

Example:
```typescript
import { Card, CardContent } from '@mui/material';

export function MyComponent() {
  return (
    <Card>
      <CardContent>
        Content here
      </CardContent>
    </Card>
  );
}
```

### Styling with MUI

Use the `sx` prop for styling:

```typescript
<Box
  sx={{
    display: 'flex',
    gap: 2,
    p: 3,
    bgcolor: 'background.paper',
  }}
>
  Content
</Box>
```

## User Flow

1. **Initial Load**
   - Check authentication status
   - Redirect to login or directory

2. **Login**
   - Enter credentials
   - Submit form
   - Receive JWT token
   - Store token and user info
   - Redirect to directory

3. **Directory**
   - Check cache for data
   - Load from cache or fetch from API
   - Display contacts
   - Enable search and filtering
   - Show cache age
   - Allow manual refresh

4. **Logout**
   - Clear JWT token
   - Clear cached data
   - Clear user info
   - Redirect to login

## Caching Strategy

### Cache Key Structure
```
directory_cache: {
  data: Contact[],
  timestamp: number,
  username: string
}
```

### Cache Behavior
- **On Login**: Cache is cleared
- **On Directory Load**: Check cache first
- **On Refresh**: Bypass cache, fetch fresh data
- **On Logout**: Cache is cleared
- **On Expiration**: Auto-fetch fresh data

### Cache TTL
Default: 5 minutes (300,000ms)
Configurable via `NEXT_PUBLIC_CACHE_TTL`

## Responsive Design

Breakpoints:
- **xs**: 0px+ (mobile)
- **sm**: 600px+ (tablet)
- **md**: 900px+ (small desktop)
- **lg**: 1200px+ (desktop)
- **xl**: 1536px+ (large desktop)

Grid layout:
- Mobile: 1 column
- Tablet: 2 columns
- Small desktop: 3 columns
- Desktop+: 4 columns

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Adjust `NEXT_PUBLIC_CACHE_TTL` if needed
3. Ensure backend CORS allows frontend origin

### Recommended Hosting

- **Vercel** (recommended for Next.js)
- Netlify
- AWS Amplify
- DigitalOcean App Platform

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect GitHub repository to Vercel for automatic deployments.

## Troubleshooting

### API Connection Issues
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Verify NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL
```

### Authentication Issues
- Clear browser localStorage
- Check JWT token expiration
- Verify backend is accessible
- Check CORS configuration

### Cache Issues
- Clear browser localStorage
- Check cache TTL configuration
- Verify username matches

### Theme Issues
- Clear localStorage theme_mode
- Check browser console for errors

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Server-side rendering with Next.js
- Code splitting
- Lazy loading
- Optimized images
- Minimal bundle size

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode support

## License

[Your License Here]
