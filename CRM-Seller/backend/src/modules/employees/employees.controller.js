const prisma = require('../../database/prisma');

// Helper: resolve EMP-XX or raw cuid to a Prisma where clause
const resolveQuery = (id) => {
    if (id && id.startsWith('EMP-')) {
        const serialNum = parseInt(id.split('-')[1]);
        return { serialId: serialNum };
    }
    return { id };
};

// Get all employees (Local DB)
exports.getAllEmployees = async (req, res) => {
    try {
        const staff = await prisma.employee.findMany({
            orderBy: { serialId: 'desc' }
        });
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        console.error("Fetch Employees Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Get single employee
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({ where: resolveQuery(id) });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        console.error("Fetch Single Employee Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Create new employee (Local DB)
exports.createEmployee = async (req, res) => {
    try {
        const { name, email, username, phone, password, role, status } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const existing = await prisma.employee.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Employee email already registered' });
        }

        if (username) {
            const existingUser = await prisma.employee.findUnique({ where: { username } });
            if (existingUser) return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const newEmployee = await prisma.employee.create({
            data: { 
                name, 
                email, 
                username, 
                phone, 
                password, 
                role: role || 'Staff', 
                status: status || 'Active' 
            }
        });

        res.status(201).json({ success: true, data: newEmployee });
    } catch (error) {
        console.error("Create Employee Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, username, phone, password, role, status } = req.body;

        const query = resolveQuery(id);
        const employee = await prisma.employee.findUnique({ where: query });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        // Email uniqueness check
        const existingEmail = await prisma.employee.findFirst({
            where: { email, NOT: { id: employee.id } }
        });
        if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered to another staff member' });

        // Username uniqueness check
        if (username) {
            const existingUser = await prisma.employee.findFirst({
                where: { username, NOT: { id: employee.id } }
            });
            if (existingUser) return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const updateData = { name, email, username, phone, role, status };
        if (password && password.trim() !== '') {
            updateData.password = password;
        }

        const updated = await prisma.employee.update({
            where: { id: employee.id },
            data: updateData
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Employee Error:", error.message);
        res.status(500).json({ success: false, message: 'Update failed. Data collision or server error.' });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const query = resolveQuery(id);
        const employee = await prisma.employee.findUnique({ where: query });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        await prisma.employee.delete({ where: { id: employee.id } });
        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error("Delete Employee Error:", error);
        res.status(500).json({ success: false, message: 'Employee not found or Error occurred' });
    }
};

