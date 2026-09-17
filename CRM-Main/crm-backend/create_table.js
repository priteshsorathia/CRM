/**
 * Creates the role_permissions table in the database.
 * Run with: node create_table.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating role_permissions table...');
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "role_permissions" (
      "id"        SERIAL PRIMARY KEY,
      "shopId"    INTEGER NOT NULL,
      "role"      TEXT NOT NULL,
      "module"    TEXT NOT NULL,
      "canCreate" BOOLEAN NOT NULL DEFAULT false,
      "canRead"   BOOLEAN NOT NULL DEFAULT false,
      "canUpdate" BOOLEAN NOT NULL DEFAULT false,
      "canDelete" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add unique constraint if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'role_permissions_shopId_role_module_key'
      ) THEN
        ALTER TABLE "role_permissions"
          ADD CONSTRAINT "role_permissions_shopId_role_module_key"
          UNIQUE ("shopId", "role", "module");
      END IF;
    END $$;
  `);

  // Add foreign key if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'role_permissions_shopId_fkey'
      ) THEN
        ALTER TABLE "role_permissions"
          ADD CONSTRAINT "role_permissions_shopId_fkey"
          FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  console.log('✅ role_permissions table created successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
