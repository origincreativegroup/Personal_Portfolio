# PortfolioForge Technical Architecture

This is the **Single Source of Truth (SSOT)** for PortfolioForge technical architecture decisions and implementation patterns.

## Architecture Overview

PortfolioForge follows a modular, microservice-inspired architecture with clear separation between frontend, backend, and shared components.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   UI Package    │    │   Backend API   │
│   (React/Vite)  │◄───┤   (Components)  │    │   (Fastify)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Shared Libs   │
                    │  (Types/Utils)  │
                    └─────────────────┘
```

## Frontend Architecture (`/frontend/`)

### Technology Stack
- **React 18** with TypeScript for UI components
- **Vite** for build tooling and development server
- **React Router** for client-side routing
- **Tailwind CSS** for styling with design tokens
- **GrapesJS** for visual editing capabilities

### Directory Structure
```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Basic UI primitives
│   │   ├── dashboard/       # Dashboard-specific components
│   │   └── navigation/      # Navigation components
│   ├── pages/               # Page-level components
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Frontend utilities
│   └── types/               # Frontend-specific types
├── public/                  # Static assets
└── package.json            # Frontend dependencies
```

### State Management
- **React Context** for global state (theme, user)
- **useState/useReducer** for local component state
- **React Query** for server state management
- **Local Storage** for persistent client preferences

### Routing Strategy
```typescript
/                           # Dashboard
/projects                   # Project list
/projects/:id/edit          # Project editor
/projects/:id/view          # Project preview
/assets                     # Asset management
/settings                   # User settings
```

## Backend Architecture (`/backend/`)

### Technology Stack
- **Fastify** for HTTP server with TypeScript
- **Prisma** for database ORM and migrations
- **SQLite** for development, **PostgreSQL** for production
- **JSON Web Tokens** for authentication
- **Zod** for request validation

### Directory Structure
```
backend/
├── src/
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic layer
│   ├── middleware/         # Request middleware
│   ├── types/              # Backend-specific types
│   └── utils/              # Backend utilities
├── prisma/                 # Database schema and migrations
└── package.json           # Backend dependencies
```

### API Design Patterns
- **RESTful endpoints** with standard HTTP verbs
- **JSON API** responses with consistent error handling
- **Request validation** using Zod schemas
- **Response serialization** with type safety
- **Error handling** with standardized error codes

### Database Schema
```sql
-- Core entities
users          # User accounts and profiles
projects       # Portfolio projects
blocks         # Project content blocks
assets         # Uploaded files and media
templates      # Project templates
analytics      # Usage and performance data
```

## UI Package Architecture (`/src/`)

### Technology Stack
- **React** components with TypeScript
- **Theme tokens** for design consistency
- **Storybook** for component documentation
- **CSS-in-JS** using theme tokens instead of Tailwind

### Component Categories
```
src/
├── components/
│   ├── Button.tsx          # Core UI primitives
│   ├── Card.tsx            #
│   ├── DashboardCard.tsx   # Dashboard components
│   ├── EmptyState.tsx      # State management components
│   ├── Wizard.tsx          # Multi-step flows
│   ├── DevicePreview.tsx   # Editor utilities
│   └── BlockEditor.tsx     # Content editing
├── editors/
│   ├── PortfolioEditor.tsx # Portfolio-level editing
│   └── ProjectEditor.tsx   # Project-level editing
└── shared/
    ├── theme.ts            # Design tokens
    ├── utils.ts            # Utility functions
    └── tailwind-plugin.ts  # Tailwind integration
```

### Design Token System
```typescript
// Approved color palette
colors: {
  primary: "#5a3cf4",     // Royal purple
  highlight: "#cbc0ff",   // Lavender
  text: "#1a1a1a",        // Charcoal
  textMuted: "#333333",   // Light charcoal
  bg: "#ffffff",          // White
  border: "#e5e7eb"       // Light gray
}

// No gradients, no shadows, flat design only
```

## Shared Libraries (`/shared/`)

### Purpose
- **Type definitions** shared between frontend and backend
- **Validation schemas** for API contracts
- **Utility functions** used across the codebase
- **Constants** and configuration values

### Key Modules
```typescript
// Types for data models
export interface Project {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  blocks: Block[];
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
export const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});

// Utility functions
export function formatDate(date: Date): string;
export function validateEmail(email: string): boolean;
```

## Data Flow Architecture

### Request Flow
```
1. User interaction in Frontend
2. API call via fetch/axios
3. Backend route handler
4. Service layer processing
5. Database operation via Prisma
6. Response serialization
7. Frontend state update
8. UI re-render
```

### File Upload Flow
```
1. File selection in Frontend
2. Client-side validation (size, type)
3. Upload to Backend endpoint
4. Server-side validation and processing
5. File storage (local or cloud)
6. Database record creation
7. Response with file metadata
8. Frontend asset list update
```

### Real-time Editing Flow
```
1. User edits in GrapesJS editor
2. Change event captured
3. Debounced save operation
4. API call to update project
5. Database persistence
6. Success/error feedback
7. UI state synchronization
```

## Security Architecture

### Authentication
- **JWT tokens** for stateless authentication
- **Refresh tokens** for session management
- **Password hashing** with bcrypt
- **Rate limiting** for API endpoints

### Authorization
- **Role-based access control** (RBAC)
- **Resource ownership** validation
- **API key** authentication for external integrations
- **CORS** configuration for cross-origin requests

### Data Protection
- **Input validation** on all endpoints
- **SQL injection** prevention via Prisma
- **XSS protection** with Content Security Policy
- **File upload** validation and sanitization

## Performance Architecture

### Frontend Optimization
- **Code splitting** with React.lazy
- **Asset optimization** with Vite
- **Image lazy loading** for portfolio content
- **Service worker** for offline functionality

### Backend Optimization
- **Database indexing** for frequent queries
- **Connection pooling** for database efficiency
- **Response caching** for static data
- **Compression** for API responses

### Caching Strategy
```
- Browser cache: Static assets (24h)
- CDN cache: Images and media (7d)
- API cache: User profiles (5m)
- Database cache: Query results (1m)
```

## Deployment Architecture

### Development Environment
```
Local machine:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: SQLite file
- File storage: Local filesystem
```

### Production Environment
```
Cloud infrastructure:
- Frontend: CDN (Vercel/Netlify)
- Backend: Container (Docker)
- Database: PostgreSQL (Neon/Supabase)
- File storage: S3/R2
- Monitoring: DataDog/Sentry
```

## Integration Architecture

### External Services
- **AI Services**: OpenAI/Anthropic for content generation
- **Image Processing**: Sharp for optimization
- **Email Service**: SendGrid for notifications
- **Analytics**: PostHog for user behavior
- **Error Tracking**: Sentry for error monitoring

### API Integrations
```typescript
// Third-party service integration pattern
interface ExternalService {
  authenticate(): Promise<string>;
  process(data: unknown): Promise<ServiceResponse>;
  handleError(error: Error): ServiceError;
}
```

## Testing Architecture

### Frontend Testing
- **Unit tests**: Jest + React Testing Library
- **Component tests**: Storybook interactions
- **E2E tests**: Playwright for user flows
- **Visual regression**: Chromatic for UI changes

### Backend Testing
- **Unit tests**: Jest for service logic
- **Integration tests**: Supertest for API endpoints
- **Database tests**: Test database with Prisma
- **Performance tests**: Artillery for load testing

### Test Environment
```
- CI/CD: GitHub Actions
- Test database: SQLite in-memory
- Mock services: MSW for API mocking
- Coverage: 80% minimum threshold
```

---

**Last Updated**: 2024-09-21
**Version**: 1.0
**Owner**: Engineering Team