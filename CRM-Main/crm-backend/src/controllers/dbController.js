const { connectDB, checkDBHealth, prisma } = require('../config/database');

// Test database connection
const testConnection = async (req, res) => {
  try {
    console.log('🔌 Testing database connection...');
    
    const connectionResult = await connectDB();
    
    if (connectionResult.success) {
      res.json({
        success: true,
        message: 'Database connection test successful',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: connectionResult.error
      });
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    });
  }
};

// Check database health
const getDBHealth = async (req, res) => {
  try {
    console.log('🏥 Checking database health...');
    
    const healthResult = await checkDBHealth();
    
    if (healthResult.success) {
      res.json(healthResult);
    } else {
      res.status(500).json(healthResult);
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
};

// Get database stats
const getDBStats = async (req, res) => {
  try {
    console.log('📊 Getting database statistics...');
    
    const shopCount = await prisma.shop.count();
    const userCount = await prisma.user.count();
    
    // Get latest shops and users
    const latestShops = await prisma.shop.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    const latestUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      message: 'Database statistics retrieved',
      data: {
        counts: {
          totalShops: shopCount,
          totalUsers: userCount
        },
        latestShops,
        latestUsers,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Database stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics',
      details: error.message
    });
  }
};

// Reset database (for development only)
const resetDatabase = async (req, res) => {
  try {
    console.log('🔄 Resetting database...');
    
    // WARNING: This will delete all data!
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Database reset not allowed in production'
      });
    }
    
    // Delete all data (be careful with order due to foreign keys)
    await prisma.user.deleteMany();
    await prisma.shop.deleteMany();
    
    console.log('✅ Database reset completed');
    
    res.json({
      success: true,
      message: 'Database reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Database reset failed',
      details: error.message
    });
  }
};

module.exports = {
  testConnection,
  getDBHealth,
  getDBStats,
  resetDatabase
};