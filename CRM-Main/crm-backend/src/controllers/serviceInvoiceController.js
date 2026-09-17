const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

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

const DEFAULT_SERVICE_INVOICE_PREFIX = 'INV-';

const ensureServiceInvoiceModel = () => {
    if (!prisma?.serviceInvoice) {
        const err = new Error(
            'Prisma client is missing ServiceInvoice. Run `npm run db:dev` (prisma db push + prisma generate) and restart the backend.'
        );
        err.code = 'PRISMA_CLIENT_OUTDATED';
        throw err;
    }
};

const toDateOnly = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.toISOString().split('T')[0]);
};

const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const calcTotals = (items, discountPercent) => {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum, it) => {
        const qty = safeNumber(it?.qty, 0);
        const rate = safeNumber(it?.rate, 0);
        return sum + qty * rate;
    }, 0);

    const taxTotal = safeItems.reduce((sum, it) => {
        const qty = safeNumber(it?.qty, 0);
        const rate = safeNumber(it?.rate, 0);
        const tax = safeNumber(it?.tax, 0);
        return sum + (qty * rate) * (tax / 100);
    }, 0);

    const discPct = Math.min(100, Math.max(0, safeNumber(discountPercent, 0)));
    const discountAmount = subtotal * (discPct / 100);
    const amount = Math.max(0, subtotal + taxTotal - discountAmount);

    return { subtotal, taxTotal, discountPercent: discPct, amount };
};

const generateServiceInvoiceId = async (shopId) => {
    ensureServiceInvoiceModel();
    return prisma.$transaction(async (tx) => {
        const last = await tx.serviceInvoice.findFirst({
            where: { shopId },
            orderBy: { id: 'desc' },
            select: { invoiceId: true }
        });

        const lastNum = last?.invoiceId
            ? parseInt(String(last.invoiceId).replace(/\D/g, ''), 10)
            : NaN;

        const next = Number.isFinite(lastNum) ? lastNum + 1 : 1;
        return `${DEFAULT_SERVICE_INVOICE_PREFIX}${String(next).padStart(2, '0')}`;
    });
};

exports.getInvoices = async (req, res) => {
    try {
        ensureServiceInvoiceModel();
        const shopId = req.user.shopId;
        const isAdmin = isManagerLikeRole(req.user.role);

        const where = { shopId };
        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.json({ success: true, invoices: [] });
            where.project = {
                teamMembers: { array_contains: employeeId }
            };
        }

        const invoices = await prisma.serviceInvoice.findMany({
            where,
            include: {
                client: { select: { id: true, clientId: true, company: true } },
                project: { select: { id: true, projectId: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, invoices });
    } catch (error) {
        console.error('Error fetching service invoices:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        ensureServiceInvoiceModel();
        const shopId = req.user.shopId;
        const { id } = req.params;

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = Number.isFinite(Number(id))
            ? { id: parseInt(id), shopId }
            : { shopId_invoiceId: { shopId, invoiceId: String(id) } };

        if (!isAdmin) {
            const employeeId = req.user.employeeId;
            if (!employeeId) return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            where.project = {
                teamMembers: { array_contains: employeeId }
            };
        }

        const invoice = await prisma.serviceInvoice.findFirst({
            where,
            include: {
                client: { select: { id: true, clientId: true, company: true } },
                project: { select: { id: true, projectId: true, name: true } }
            }
        });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Error fetching service invoice:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        ensureServiceInvoiceModel();
        const shopId = req.user.shopId;
        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Only admins can manage billing' });
        }
        const {
            clientId,
            projectId,
            issuedDate,
            dueDate,
            terms,
            notes,
            status,
            discountPercent,
            items,
            paid,
            payments
        } = req.body || {};

        const invId = await generateServiceInvoiceId(shopId);
        const totals = calcTotals(items, discountPercent);

        const created = await prisma.serviceInvoice.create({
            data: {
                invoiceId: invId,
                clientId: clientId ? parseInt(clientId) : null,
                projectId: projectId ? parseInt(projectId) : null,
                issuedDate: toDateOnly(issuedDate) || toDateOnly(new Date()),
                dueDate: toDateOnly(dueDate),
                terms: terms || null,
                notes: notes || null,
                status: status || 'Draft',
                discountPercent: totals.discountPercent,
                subtotal: totals.subtotal,
                taxTotal: totals.taxTotal,
                amount: totals.amount,
                paid: safeNumber(paid, 0),
                items: Array.isArray(items) ? items : [],
                payments: Array.isArray(payments) ? payments : [],
                shopId
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_INVOICE_CREATE',
            `Created invoice "${created.invoiceId}" for ${created.amount}`,
            'Services',
            'Success'
        );

        if (created.status === 'Paid' && created.projectId) {
            await prisma.serviceProject.update({
                where: { id: created.projectId },
                data: { status: 'Completed' }
            });
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'SERVICE_PROJECT_UPDATE',
                `Project status automatically set to 'Completed' because invoice ${created.invoiceId} was paid.`,
                'Services',
                'Success'
            );
        }

        res.json({ success: true, invoice: created });
    } catch (error) {
        console.error('Error creating service invoice:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        ensureServiceInvoiceModel();
        const shopId = req.user.shopId;
        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Only admins can manage billing' });
        }
        const { id } = req.params;
        const invoiceId = parseInt(id);
        if (!Number.isFinite(invoiceId)) return res.status(400).json({ success: false, message: 'Invalid invoice id' });

        const existing = await prisma.serviceInvoice.findFirst({
            where: { id: invoiceId, shopId }
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found' });

        const {
            clientId,
            projectId,
            issuedDate,
            dueDate,
            terms,
            notes,
            status,
            discountPercent,
            items,
            paid,
            payments
        } = req.body || {};

        const nextItems = items !== undefined ? items : existing.items;
        const nextDiscount = discountPercent !== undefined ? discountPercent : existing.discountPercent;
        const totals = calcTotals(nextItems, nextDiscount);

        const updated = await prisma.serviceInvoice.update({
            where: { id: invoiceId },
            data: {
                clientId: clientId !== undefined ? (clientId ? parseInt(clientId) : null) : undefined,
                projectId: projectId !== undefined ? (projectId ? parseInt(projectId) : null) : undefined,
                issuedDate: issuedDate !== undefined ? (toDateOnly(issuedDate) || existing.issuedDate) : undefined,
                dueDate: dueDate !== undefined ? toDateOnly(dueDate) : undefined,
                terms: terms !== undefined ? (terms || null) : undefined,
                notes: notes !== undefined ? (notes || null) : undefined,
                status: status !== undefined ? (status || 'Draft') : undefined,
                discountPercent: totals.discountPercent,
                subtotal: totals.subtotal,
                taxTotal: totals.taxTotal,
                amount: totals.amount,
                paid: paid !== undefined ? safeNumber(paid, 0) : undefined,
                items: items !== undefined ? (Array.isArray(items) ? items : []) : undefined,
                payments: payments !== undefined ? (Array.isArray(payments) ? payments : []) : undefined
            }
        });

        await createLog(
            req,
            req.user.id,
            req.user.shopId,
            'SERVICE_INVOICE_UPDATE',
            `Updated invoice "${updated.invoiceId}" (Status: ${updated.status})`,
            'Services',
            'Success'
        );

        if (updated.status === 'Paid' && updated.projectId) {
            await prisma.serviceProject.update({
                where: { id: updated.projectId },
                data: { status: 'Completed' }
            });
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'SERVICE_PROJECT_UPDATE',
                `Project status automatically set to 'Completed' because invoice ${updated.invoiceId} was paid.`,
                'Services',
                'Success'
            );
        }

        res.json({ success: true, invoice: updated });
    } catch (error) {
        console.error('Error updating service invoice:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        ensureServiceInvoiceModel();
        const shopId = req.user.shopId;
        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Only admins can manage billing' });
        }
        const { id } = req.params;
        const invoiceId = parseInt(id);
        if (!Number.isFinite(invoiceId)) return res.status(400).json({ success: false, message: 'Invalid invoice id' });

        const existing = await prisma.serviceInvoice.findFirst({
            where: { id: invoiceId, shopId },
            select: { invoiceId: true }
        });

        await prisma.serviceInvoice.deleteMany({
            where: { id: invoiceId, shopId }
        });

        if (existing) {
            await createLog(
                req,
                req.user.id,
                req.user.shopId,
                'SERVICE_INVOICE_DELETE',
                `Deleted invoice "${existing.invoiceId}"`,
                'Services',
                'Success'
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting service invoice:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
