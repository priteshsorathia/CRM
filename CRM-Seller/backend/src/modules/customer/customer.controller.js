const prisma = require('../../database/prisma');

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { serialId: 'desc' }
        });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Get single customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        
        if (id.startsWith('CT-') || id.startsWith('CUS-')) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        const customer = await prisma.customer.findUnique({
            where: query
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        console.error("Fetch Single Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Create new customer
exports.createCustomer = async (req, res) => {
    try {
        const {
            fullName, customerCode, phone, email,
            address, paymentMethod, paymentStatus,
            advanceTaken, totalAmount, additionalFiles
        } = req.body;

        if (!fullName || !customerCode || !phone) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        // Check unique constraints
        if (email) {
            const existingEmail = await prisma.customer.findUnique({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
        }

        const existingCode = await prisma.customer.findUnique({ where: { customerCode } });
        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Customer Code already exists' });
        }

        const newCustomer = await prisma.customer.create({
            data: {
                fullName,
                customerCode,
                phone,
                email: email || null,
                address,
                paymentMethod,
                paymentStatus: paymentStatus || 'Pending',
                advanceTaken: parseFloat(advanceTaken) || 0,
                totalAmount: parseFloat(totalAmount) || 0,
                additionalFiles,
                status: 'Pending'
            }
        });

        res.status(201).json({ success: true, data: newCustomer });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Update record
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullName, customerCode, phone, email,
            address, paymentMethod, paymentStatus,
            advanceTaken, totalAmount, additionalFiles, status
        } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (customerCode) updateData.customerCode = customerCode;
        if (phone) updateData.phone = phone;
        if (email !== undefined) updateData.email = email || null;
        if (address !== undefined) updateData.address = address;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
        if (advanceTaken !== undefined) updateData.advanceTaken = parseFloat(advanceTaken) || 0;
        if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount) || 0;
        if (additionalFiles !== undefined) updateData.additionalFiles = additionalFiles;
        if (status) updateData.status = status;

        let query = {};
        if (id && (id.startsWith('CT-') || id.startsWith('CUS-'))) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        const updated = await prisma.customer.update({
            where: query,
            data: updateData
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        let query = {};
        if (id && (id.startsWith('CT-') || id.startsWith('CUS-'))) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        const updated = await prisma.customer.update({
            where: query,
            data: { status }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        if (id && (id.startsWith('CT-') || id.startsWith('CUS-'))) {
            query = { serialId: parseInt(id.split('-')[1]) };
        } else {
            query = { id };
        }
        await prisma.customer.delete({ where: query });
        res.status(200).json({ success: true, message: 'Customer deleted.' });
    } catch (error) {
        console.error("Delete Customer Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
