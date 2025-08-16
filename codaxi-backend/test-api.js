// Quick test to verify backend is working
const API_BASE_URL = 'http://localhost:5000/api'

async function testAPI() {
  console.log('🧪 Testing Codaxi Backend API...\n')
  
  try {
    // Test health check
    console.log('1. Testing health check...')
    const response = await fetch(`${API_BASE_URL}/health`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ Health check passed:', data.status)
    console.log('📊 Environment:', data.environment)
    console.log('🕐 Timestamp:', data.timestamp)
    
    console.log('\n🎉 Backend is running successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Start frontend: cd ../codaxi-app && npm run dev')
    console.log('   2. Open http://localhost:3000')
    console.log('   3. Test user registration and login')
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message)
    console.log('\n🔧 To fix:')
    console.log('   1. Make sure backend is running: npm run dev')
    console.log('   2. Check that PostgreSQL is running')
    console.log('   3. Verify .env configuration')
  }
}

testAPI()
