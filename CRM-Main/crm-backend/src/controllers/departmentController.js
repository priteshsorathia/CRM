const prisma = require('../lib/prisma');

// Get all departments for a shop
const getDepartments = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const departments = await prisma.department.findMany({
      where: { shopId },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const department = await prisma.department.create({
      data: {
        name,
        shopId
      }
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Department already exists' });
    }
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const department = await prisma.department.update({
      where: { 
        id: parseInt(id),
        shopId // Ensure ownership
      },
      data: { name }
    });

    res.json({ success: true, data: department });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Department name already exists' });
    }
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { id } = req.params;

    await prisma.department.deleteMany({
      where: { 
        id: parseInt(id),
        shopId // Ensure ownership
      }
    });

    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
