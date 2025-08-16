# Codaxi Backend API

A robust Node.js/Express backend API for Codaxi - AI-powered documentation generator with TypeScript, PostgreSQL, and JWT authentication.

## 🚀 Features

### Authentication System
- **User Registration**: Create new accounts with email validation
- **Secure Login**: JWT-based authentication with bcrypt password hashing
- **Session Management**: Token blacklisting and refresh capabilities
- **Role-Based Access**: Admin, Member, and Viewer roles
- **Organization Support**: Multi-tenant organization structure

### Security
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token generation and validation
- **Rate Limiting**: Configurable rate limits for different endpoints
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers

### Database
- **PostgreSQL**: Production-ready relational database
- **Prisma ORM**: Type-safe database access with migrations
- **Audit Logging**: Track user actions and security events
- **Session Tracking**: Manage active user sessions

## 🛠 Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Custom validation with validator.js
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Morgan for HTTP request logging
- **Environment**: dotenv for configuration

## 📁 Project Structure

```
src/
├── config/           # Configuration and environment variables
├── controllers/      # Route handlers and business logic
├── middleware/       # Express middleware (auth, error handling, security)
├── routes/          # API route definitions
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (JWT, validation, database)
├── index.ts         # Main application entry point
prisma/
├── schema.prisma    # Database schema definition
├── migrations/      # Database migration files
└── seed.ts         # Database seeding script (optional)
```

## 🏗 Database Schema

### Users Table
- **id**: Unique identifier (CUID)
- **email**: Unique email address
- **name**: Full name
- **password**: Hashed password
- **company**: Optional company name
- **role**: User role (ADMIN, MEMBER, VIEWER)
- **emailVerified**: Email verification status
- **timestamps**: Created/updated dates

### Organizations Table
- **id**: Unique identifier
- **name**: Organization name
- **slug**: URL-friendly identifier
- **planType**: Subscription plan (FREE, TEAM, ENTERPRISE)
- **settings**: JSON configuration object

### Sessions Table
- **id**: Session identifier
- **token**: JWT token
- **userId**: Reference to user
- **expiresAt**: Token expiration
- **isRevoked**: Revocation status

## 🚦 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| POST | `/logout` | User logout | ✅ |
| GET | `/profile` | Get user profile | ✅ |
| POST | `/refresh` | Refresh JWT token | ✅ |

### Health Check (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Make sure PostgreSQL is running and create a database
createdb codaxi_db

# Update DATABASE_URL in .env file
# Example: postgresql://username:password@localhost:5432/codaxi_db

# Run database migrations
npm run db:push

# Optional: Seed the database
npm run db:seed
```

### 3. Environment Configuration
The `.env` file should contain:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/codaxi_db"
JWT_SECRET="your-super-secure-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 4. Development
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 5. Database Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🔐 Authentication Flow

### Registration
1. User submits registration form
2. Server validates input and checks for existing user
3. Password is hashed with bcrypt
4. User record is created in database
5. Default organization is created
6. JWT token is generated and returned

### Login
1. User submits email/password
2. Server finds user and verifies password
3. JWT token is generated with user info
4. Session record is created
5. Token is returned to client

### Authentication Middleware
1. Extract token from Authorization header
2. Verify token signature and expiration
3. Check if token is blacklisted
4. Attach user info to request object

## 🛡 Security Features

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Hashed with bcrypt (12 salt rounds)

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes
- Configurable per endpoint

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS protection through input sanitization

### Session Management
- JWT tokens with expiration
- Token blacklisting on logout
- Session tracking in database
- Token refresh capability

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use secure JWT secret (32+ characters)
- Configure proper database URL
- Set CORS origin to your frontend domain

### Security Considerations
- Use HTTPS in production
- Set secure environment variables
- Configure proper CORS origins
- Enable database SSL
- Use connection pooling
- Set up monitoring and logging

### Database
- Use connection pooling
- Set up read replicas if needed
- Configure backups
- Monitor performance

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Development Notes

### Adding New Endpoints
1. Create controller function in `src/controllers/`
2. Add route in `src/routes/`
3. Add middleware if needed
4. Update types in `src/types/`
5. Test the endpoint

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `npm run db:push` for development
3. Run `npm run db:migrate` for production
4. Update TypeScript types

## 🔗 Integration with Frontend

The backend is designed to work with the Codaxi React frontend. Update the frontend API client to point to:

```typescript
const API_BASE_URL = 'http://localhost:5000/api'
```

Replace the mock API calls with real HTTP requests to these endpoints.

## 📄 License

This project is licensed under the ISC License.

---

**Ready for production deployment and real-world usage!** 🚀
