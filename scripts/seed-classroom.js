const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add a check to ensure the database connection works
async function testConnection() {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

async function main() {
  // Test the connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Aborting seed due to connection issues');
    return;
  }

  try {
    // Rest of your code remains the same...
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@example.com' },
      update: {},
      create: {
        name: 'Test Teacher',
        email: 'teacher@example.com',
        role: 'TEACHER'
      }
    });
    
    // ...rest of your code
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();