# PortfolioForge System Architecture

This is the **Single Source of Truth (SSOT)** for PortfolioForge system design decisions.

## Overview

PortfolioForge is a portfolio creation platform with visual editing capabilities, built as a modular system with clear separation of concerns.

## System Components

### 1. Frontend Application (`/frontend/`)
- **Technology**: React + Vite + TypeScript
- **Purpose**: User interface for portfolio management and editing
- **Key Features**:
  - Dashboard with project overview
  - Visual project editor with GrapesJS integration
  - Asset management system
  - Responsive design with dark/light mode

### 2. Backend API (`/backend/`)
- **Technology**: Fastify + Prisma + TypeScript
- **Purpose**: RESTful API and business logic
- **Key Features**:
  - Project CRUD operations
  - File upload and processing
  - AI-powered content analysis
  - Database management with SQLite/PostgreSQL

### 3. UI Package (`/src/`)
- **Technology**: React components with TypeScript
- **Purpose**: Reusable UI components and design system
- **Key Features**:
  - Theme token system
  - Visual editor components
  - Storybook documentation
  - Design system compliance

### 4. Shared Libraries (`/shared/`)
- **Purpose**: Common utilities, types, and schemas
- **Contents**:
  - TypeScript type definitions
  - Validation schemas
  - Utility functions
  - Theme tokens

## Architecture Principles

### Design Constraints
- **Flat Design**: No gradients, no shadows, minimal visual effects
- **Brand Colors**: Royal purple (#5a3cf4) and lavender (#cbc0ff) only
- **Typography**: Poppins font family throughout
- **Accessibility**: WCAG 2.1 AA compliance

### Development Principles
- **Component-First**: Reusable, composable UI components
- **Type Safety**: Full TypeScript coverage
- **Design Tokens**: Centralized theme management
- **Testing**: Unit and integration test coverage
- **Documentation**: Comprehensive Storybook and API docs

## Data Flow

```
Frontend (React) → Backend API (Fastify) → Database (Prisma + SQLite/PostgreSQL)
                ↑
            UI Package (Components)
                ↑
            Shared (Types, Utils)
```

## Integration Points

### AI Services
- OpenAI/Anthropic API integration for content analysis
- AI-powered project summaries and suggestions
- Content optimization recommendations

### File Management
- Local file storage for development
- Cloud storage (R2/S3) for production
- Image processing and optimization

### Visual Editor
- GrapesJS integration for drag-and-drop editing
- Block-based content system
- Real-time preview capabilities

## Deployment Architecture

### Development
- Local SQLite database
- File system storage
- Hot reload development servers

### Production
- PostgreSQL database
- Cloud file storage
- Docker containerization
- CI/CD pipeline

## Security Considerations

- API authentication and authorization
- File upload validation and sanitization
- XSS and CSRF protection
- Secure file storage with signed URLs
- Input validation on all endpoints

## Performance Requirements

- Page load times < 2 seconds
- API response times < 500ms
- Real-time editing with < 100ms latency
- Mobile-responsive across all devices
- Progressive loading for large projects

---

**Last Updated**: 2024-09-21
**Version**: 1.0
**Owner**: Development Team