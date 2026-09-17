const prisma = require('../lib/prisma');

async function connectDB() {
  try {
    await prisma.$connect();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkDBHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  prisma,
  connectDB,
  checkDBHealth,
};
