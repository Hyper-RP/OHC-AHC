# OHC-AHC React Frontend

React 18+ frontend application for the Occupational Health Center (OHC) and Affiliate Hospital Care (AHC) system.

## Tech Stack

- **React 18+** with TypeScript
- **Vite** for build tooling
- **React Router v6** for routing
- **Axios** for API communication
- **CSS Modules** for component styling

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── layout/       # Layout components (Sidebar, Header, etc.)
│   │   └── pages/        # Page components
│   ├── contexts/         # React contexts (Auth, Snackbar)
│   ├── services/         # API services (auth, ohc, ahc, payments, reports)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and constants
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── vite.config.ts       # Vite configuration
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The development server runs on `http://localhost:5173` with proxy to the Django backend at `http://localhost:8000`.

## Build

```bash
npm run build
```

The build output will be in `../myproject/static/react/` for Django to serve.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Features Implemented

### Authentication
- Login page with username/password
- JWT token management with auto-refresh
- Protected routes with role-based access
- Authentication context for global state

### Layout Components
- Sidebar with navigation (role-based)
- Header with breadcrumbs and stats
- Portal layout wrapper
- Mobile-responsive design

### Pages
- **Public**: Home, How It Works
- **OHC**: Visit Form, Diagnosis Entry, Complete Intake
- **AHC**: Referrals, Hospital Selection
- **Payments**: Invoice management, payment processing
- **Reports**: Medical reports, employee history, disease trends, department stats

### UI Components
- Button (multiple variants)
- Card
- FormInput (text, textarea, select)
- StatCard
- Alert
- Loading
- Snackbar notifications

### Services
- API client with Axios and interceptors
- Authentication service (login, refresh, logout)
- OHC service (visits, diagnosis, prescriptions)
- AHC service (hospitals, referrals)
- Payments service (invoices, payments)
- Reports service (health history, trends, stats)
- Vitals service (aggregation, validation, BMI calculation)

### Utilities
- Navigation configuration
- Constants (visit types, priorities, etc.)
- Helper functions (date formatting, validation, etc.)

## API Integration

The frontend integrates with the Django REST API documented in `docs/design/api-contract.md`.

All API requests use JWT authentication with automatic token refresh on 401 errors.

## Styling

The application uses CSS Modules for component-scoped styling with a design system that preserves the original Django template styling.

Color scheme:
- Primary brand: #0a5f78
- Secondary: #4aa0b4
- Success: #2c875f
- Danger: #c45d5d
- Text: #11313d
- Muted: #5f7380

## Role-Based Access

The application supports multiple user roles:
- Admin
- Nurse
- EHS (Environment Health & Safety)
- HR (Human Resources)
- KAM (Key Account Manager)
- Doctor
- Employee

Navigation items are filtered based on user roles.

## Testing

Testing is set up with Vitest and React Testing Library. Test files should be co-located with components using the `.test.tsx` extension.

## Deployment

1. Build the React app: `npm run build`
2. The build output goes to `../myproject/static/react/`
3. Django serves the static files through its static file serving mechanism
4. Configure Django to redirect all non-API routes to `index.html`

## Environment Variables

Create a `.env` file in the project root:

```
VITE_API_BASE_URL=/api
VITE_API_URL=http://localhost:8000/api
```

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES6+ support.

## License

Proprietary - All rights reserved.
