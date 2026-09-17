const prisma = require('../lib/prisma');

// Auto-create the role_permissions table if it doesn't exist
const ensureTable = async () => {
  // Create table
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
    )
  `);

  // Try to add unique index — silently ignore if already exists (any duplicate name error)
  try {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "rp_shop_role_module_idx"
      ON "role_permissions" ("shopId", "role", "module")
    `);
  } catch (_) {
    // Index already exists — that's fine, continue
  }
};

// 1. Get all permissions for a shop
exports.getPermissions = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Ensure table exists before querying
    await ensureTable();

    const rows = await prisma.$queryRawUnsafe(
      `SELECT role, module, "canCreate", "canRead", "canUpdate", "canDelete"
       FROM "role_permissions" WHERE "shopId" = $1`,
      shopId
    );

    // Format rows: { Admin: { PROJECT: { CREATE, READ, UPDATE, DELETE }, ... }, Employee: { ... } }
    const formatted = rows.reduce((acc, p) => {
      if (!acc[p.role]) acc[p.role] = {};
      acc[p.role][p.module] = {
        CREATE: p.canCreate,
        READ: p.canRead,
        UPDATE: p.canUpdate,
        DELETE: p.canDelete
      };
      return acc;
    }, {});

    res.json({ success: true, permissions: formatted });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Clear and update all permissions for a shop
exports.updatePermissions = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({ success: false, message: "Permissions data required" });
    }

    // Ensure table exists before writing
    await ensureTable();

    // Delete all existing permissions for this shop
    await prisma.$executeRawUnsafe(
      `DELETE FROM "role_permissions" WHERE "shopId" = $1`,
      shopId
    );

    // Insert new permissions row by row
    for (const [role, modules] of Object.entries(permissions)) {
      for (const [module, actions] of Object.entries(modules)) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "role_permissions" ("shopId", "role", "module", "canCreate", "canRead", "canUpdate", "canDelete", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          shopId,
          role,
          module,
          !!actions.CREATE,
          !!actions.READ,
          !!actions.UPDATE,
          !!actions.DELETE
        );
      }
    }


    res.json({ success: true, message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// 3. Get all unique designations from RolePermission table
exports.getDesignations = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const sId = parseInt(shopId);
    
    // 1. Get from RolePermissions (designations that are actually configured)
    const permissions = await prisma.rolePermission.findMany({
      where: { shopId: sId },
      select: { role: true },
      distinct: ['role']
    });


    const designations = [
      ...permissions.map(p => p.role)
    ].filter(Boolean);

    // Only 'Admin' is mandatory to ensure at least one role exists.
    // Core defaults are removed so user has full control to delete them.
    const combined = Array.from(new Set(["Admin", ...designations]));

    res.json({ success: true, designations: combined.sort() });
  } catch (error) {
    console.error("Error fetching designations:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete all permissions for a specific designation
exports.deleteDesignation = async (req, res) => {
  try {
    const { role } = req.body;
    const shopId = req.user.shopId;

    if (!role) {
      return res.status(400).json({ success: false, message: "Designation name is required" });
    }

    if (role === 'Admin') {
      return res.status(403).json({ success: false, message: "Cannot delete the Admin role" });
    }

    await prisma.rolePermission.deleteMany({
      where: {
        shopId: parseInt(shopId),
        role: role
      }
    });

    res.json({ success: true, message: `Designation '${role}' deleted successfully` });
  } catch (error) {
    console.error("Error deleting designation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
