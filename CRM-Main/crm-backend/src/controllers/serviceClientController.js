const prisma = require('../lib/prisma');
const { createLog } = require('./logController');
const { sendClientProfileEmail } = require('../utils/emailService');
const multer = require('multer');
const { makeFileFilter } = require('../utils/fileValidation');

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: makeFileFilter()
});
exports.uploadMiddleware = upload.single('pdf');

const DEFAULT_CLIENT_PREFIX = 'CLT-';
const DEFAULT_CLIENT_COUNTER = 1;

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const isManagerLikeRole = (role) => {
    const r = normalizeRole(role);
    return (
        r === 'manager' ||
        r === 'admin' ||
        r === 'administrator' ||
        r === 'owner' ||
        r === 'shop_owner' ||
        r === 'restaurant_owner' ||
        r.endsWith('_owner')
    );
};

// Generate unique client ID like CLT-1001 (uses shop settings counter)
const generateClientId = async (shopId) => {
    return prisma.$transaction(async (tx) => {
        await tx.shopSettings.upsert({
            where: { shopId },
            update: {},
            create: {
                shopId,
                stock_deduction: true,
                invoice_prefix: 'INV-',
                invoice_counter: 1,
                invoice_notes: '',
                default_tax: 0.0,
                order_prefix: 'ORD-',
                order_counter: 1,
                enable_buyback_exchange: false,
                price_column_label: "Price per unit",
                project_prefix: 'PRJ-',
                project_counter: 1,
                client_prefix: DEFAULT_CLIENT_PREFIX,
                client_counter: DEFAULT_CLIENT_COUNTER
            }
        });

        const updated = await tx.shopSettings.update({
            where: { shopId },
            data: { client_counter: { increment: 1 } },
            select: { client_prefix: true, client_counter: true }
        });

        const counterUsed = (updated.client_counter || (DEFAULT_CLIENT_COUNTER + 1)) - 1;
        const prefix = updated.client_prefix || DEFAULT_CLIENT_PREFIX;
        return `${prefix}${String(counterUsed).padStart(2, '0')}`;
    });
};

exports.getClients = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const isAdmin = isManagerLikeRole(req.user.role);
        const yearStart = new Date(new Date().getFullYear(), 0, 1);

        const where = { shopId };
        const statsWhere = { shopId, issuedDate: { gte: yearStart } };

        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.json({ success: true, clients: [], totalCollected: 0 });

            // Find clients associated with projects where user is a team member
            const assignedProjects = await prisma.serviceProject.findMany({
                where: {
                    shopId,
                    teamMembers: { array_contains: employeeId }
                },
                select: { client: true, id: true }
            });

            const clientNames = [...new Set(assignedProjects.map(p => p.client))];
            const projectIds = assignedProjects.map(p => p.id);

            where.company = { in: clientNames };
            statsWhere.projectId = { in: projectIds };
        }

        const [clients, billingStats] = await Promise.all([
            prisma.serviceClient.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.serviceInvoice.aggregate({
                where: statsWhere,
                _sum: { paid: true }
            })
        ]);

        res.json({ 
            success: true, 
            clients,
            totalCollected: billingStats._sum.paid || 0
        });
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createClient = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden: Only admins can create clients" });
        }
        const { company, contact, phone, email, gst, billing, contractStart, contractEnd, status, revenue } = req.body;
        
        const clientId = await generateClientId(shopId);

        const client = await prisma.serviceClient.create({
            data: {
                clientId,
                company,
                contact,
                phone,
                email,
                gst,
                billing: billing || 'Monthly',
                contractStart: new Date(contractStart),
                contractEnd: new Date(contractEnd),
                status: status || 'Active',
                revenue: parseFloat(revenue) || 0,
                shopId
            }
        });
        
        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_CLIENT_CREATE',
            `Created client "${client.company}" (${client.clientId})`,
            'Services',
            'Success'
        );

        res.json({ success: true, client });
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;
        const { company, contact, phone, email, gst, billing, contractStart, contractEnd, status, revenue } = req.body;

        const updateData = {};
        if (company) updateData.company = company;
        if (contact) updateData.contact = contact;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (gst !== undefined) updateData.gst = gst;
        if (billing) updateData.billing = billing;
        if (contractStart) updateData.contractStart = new Date(contractStart);
        if (contractEnd) updateData.contractEnd = new Date(contractEnd);
        if (status) updateData.status = status;
        if (revenue !== undefined) updateData.revenue = parseFloat(revenue);

        const isAdmin = isManagerLikeRole(req.user.role);
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: Only admins can update clients" });
        }

        const client = await prisma.serviceClient.updateMany({
            where: { id: parseInt(id), shopId },
            data: updateData
        });
        
        if (client.count === 0) return res.status(404).json({ success: false, message: "Client not found" });
        
        const updated = await prisma.serviceClient.findFirst({ where: { id: parseInt(id), shopId } });
        
        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_CLIENT_UPDATE',
            `Updated client "${updated.company}" (${updated.clientId})`,
            'Services',
            'Success'
        );

        res.json({ success: true, client: updated });
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;

        const existing = await prisma.serviceClient.findFirst({
            where: { id: parseInt(id), shopId },
            select: { company: true, clientId: true }
        });

        const isAdmin = isManagerLikeRole(req.user.role);
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: Only admins can delete clients" });
        }

        await prisma.serviceClient.deleteMany({
            where: { id: parseInt(id), shopId }
        });

        if (existing) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'SERVICE_CLIENT_DELETE',
                `Deleted client "${existing.company}" (${existing.clientId})`,
                'Services',
                'Success'
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.shareClientProfile = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { id } = req.params;
        const { email } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "PDF file is required" });
        }

        const numericId = parseInt(id);
        const client = await prisma.serviceClient.findFirst({
            where: {
                shopId,
                OR: [
                    { id: isNaN(numericId) ? -1 : numericId },
                    { clientId: id }
                ]
            }
        });

        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        const targetEmail = email || client.email;
        if (!targetEmail) {
            return res.status(400).json({ success: false, message: "Recipient email is required" });
        }

        const emailResult = await sendClientProfileEmail(targetEmail, client, req.file.buffer);

        if (!emailResult.success) {
            throw new Error(emailResult.error || "Failed to send email");
        }

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_CLIENT_SHARE',
            `Shared client profile for "${client.company}" to ${targetEmail}`,
            'Services',
            'Success'
        );

        res.json({ success: true, message: "Profile shared successfully" });
    } catch (error) {
        console.error("Error sharing client profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
