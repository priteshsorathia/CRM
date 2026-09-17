require('dotenv').config();

const prisma = require('./src/lib/prisma');

// Database connection check function
async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Connection details:', {
      host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'Not set',
      database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname : 'Not set'
    });
    return false;
  }
}

// Start server after checking database
async function startServer() {
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    console.error('Server starting without database connection. Some features may not work.');
  }

  const app = require('./src/app');
  const PORT = process.env.PORT || 8001;

 app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://192.168.1.27:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (isConnected) {
    console.log('Server is ready to handle requests');
  } else {
    console.log('Server is running but database is not connected');
  }
});
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  console.log('Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  console.log('Database connection closed');
  process.exit(0);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
