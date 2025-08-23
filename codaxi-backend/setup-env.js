const fs = require('fs')
const path = require('path')

const envContent = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/codaxi_db?schema=public"

# JWT
JWT_SECRET="super-secure-jwt-secret-key-for-codaxi-development-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Email (for future implementation)
EMAIL_HOST=""
EMAIL_PORT=""
EMAIL_USER=""
EMAIL_PASS=""`

fs.writeFileSync(path.join(__dirname, '.env'), envContent)
console.log('✅ .env file created successfully!')
console.log('⚠️  Please update the DATABASE_URL with your PostgreSQL credentials')
