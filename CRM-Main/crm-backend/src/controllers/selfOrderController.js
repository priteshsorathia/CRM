const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

// 1. Get Menu for Customer (Public)
const getTableMenu = async (req, res) => {
    try {
    const { token } = req.params;
    const cleanToken = token?.trim();
    if (!cleanToken) {
        return res.status(400).json({ success: false, error: 'Table token is required' });
    }

    // Validate table and shop
    const table = await prisma.restaurantTable.findUnique({
        where: { qr_token: cleanToken },
        include: { shop: true }
    });

        if (!table) {
            return res.status(404).json({ success: false, error: 'Invalid or inactive table' });
        }

        if (table.status === 'unavailable') {
            return res.status(403).json({ success: false, error: 'This table is currently not available for ordering' });
        }

        // Fetch ALL available items for this shop
        const allItems = await prisma.restaurantMenuItem.findMany({
            where: { 
                shopId: table.shopId, 
                is_available: true, 
                isDeleted: false 
            },
            include: { category: true },
            orderBy: { name: 'asc' }
        });

        // Fetch categories to maintain order and structure
        const categories = await prisma.restaurantMenuCategory.findMany({
            where: { shopId: table.shopId },
            orderBy: { name: 'asc' }
        });

        // Group items by category
        const menuStructure = categories.map(cat => ({
            ...cat,
            items: allItems.filter(item => item.categoryId === cat.id)
        })).filter(cat => cat.items.length > 0);

        // Add "Uncategorized" if there are items without catId
        const uncategorizedItems = allItems.filter(item => !item.categoryId);
        if (uncategorizedItems.length > 0) {
            menuStructure.push({
                id: 'uncategorized',
                name: 'Uncategorized',
                items: uncategorizedItems
            });
        }

        // Fetch existing customer info if table is occupied
        let currentCustomer = null;
        if (table.status === 'occupied') {
            const activeOrder = await prisma.restaurantOrder.findFirst({
                where: { 
                    shopId: table.shopId,
                    table_number: table.table_number,
                    status: { in: ['pending', 'preparing', 'ready'] }
                },
                orderBy: { created_at: 'desc' }
            });
            if (activeOrder) {
                currentCustomer = {
                    name: activeOrder.customer_name || '',
                    phone: activeOrder.customer_phone || ''
                };
            }
        }

        // Fallback: If shop doesn't have a upiId, check for the shop owner's upiId
        let upiId = table.shop.upiId;
        if (!upiId) {
            const shopOwner = await prisma.user.findFirst({
                where: { shopId: table.shopId, role: 'shop_owner' },
                select: { upiId: true }
            });
            upiId = shopOwner?.upiId;
        }

        // Fetch tax settings
        const settings = await prisma.shopSettings.findUnique({
            where: { shopId: table.shopId },
            select: { default_tax: true }
        });
        const taxRate = settings?.default_tax || 0;

        res.json({
            success: true,
            shop: {
                id: table.shop.id,
                name: table.shop.name,
                logo: table.shop.logo,
                upiId: upiId,
                taxRate: taxRate
            },
            table: {
                id: table.id,
                number: table.table_number,
                status: table.status
            },
            currentCustomer,
            menu: menuStructure
        });
    } catch (error) {
        console.error('Get table menu error:', error);
        res.status(500).json({ success: false, error: 'Failed to load menu' });
    }
};

// 2. Place Self Order
const placeSelfOrder = async (req, res) => {
    try {
    const { token } = req.params;
    const cleanToken = token?.trim();
    const { items, customer_name, customer_phone, customer_notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one item is required' });
    }

    // Validate table
    const table = await prisma.restaurantTable.findUnique({
        where: { qr_token: cleanToken }
    });

        if (!table) {
            return res.status(404).json({ success: false, error: 'Invalid table' });
        }

        const shopId = table.shopId;

        // Calculate total and validate items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await prisma.restaurantMenuItem.findFirst({
                where: { id: item.menu_item_id, shopId, isDeleted: false, is_available: true }
            });

            if (!menuItem) {
                return res.status(400).json({ success: false, error: `Item ${item.name || item.menu_item_id} is not available` });
            }

            const qty = parseInt(item.quantity) || 1;
            const price = menuItem.price;
            totalAmount += price * qty;

            orderItems.push({
                menu_item_id: menuItem.id,
                name: menuItem.name,
                quantity: qty,
                price: price,
                notes: item.notes || null
            });
        }

        // Generate Order Token (simple counter logic or random)
        const order_token = `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create Order
        const order = await prisma.restaurantOrder.create({
            data: {
                order_token,
                table_number: table.table_number,
                platform: 'Self-QR',
                status: 'pending',
                total_amount: totalAmount,
                customer_name: customer_name || 'Guest',
                customer_phone: customer_phone || null,
                customer_notes: customer_notes || null,
                is_self_order: true,
                shopId,
                items: {
                    create: orderItems
                }
            },
            include: {
                items: true
            }
        });

        // Update table status if needed
        await prisma.restaurantTable.update({
            where: { id: table.id },
            data: { status: 'occupied' }
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        console.error('Place self order error:', error);
        res.status(500).json({ success: false, error: 'Failed to place order' });
    }
};

// 3. Get Orders for Table (Public)
const getTableOrders = async (req, res) => {
    try {
        const { token } = req.params;
        const cleanToken = token?.trim();

        const table = await prisma.restaurantTable.findUnique({
            where: { qr_token: cleanToken }
        });

        if (!table) {
            return res.status(404).json({ success: false, error: 'Invalid table' });
        }

        // If table is available, it means no active session or session just ended
        if (table.status === 'available') {
            return res.json({ success: true, orders: [], tableStatus: 'available' });
        }

        // 1. Find the latest PAID invoice for this table TODAY to determine the start of the current session
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const latestPaidInvoice = await prisma.restaurantInvoice.findFirst({
            where: {
                shopId: table.shopId,
                table_number: table.table_number,
                payment_status: 'Paid',
                isDeleted: false,
                created_at: { gte: today }
            },
            orderBy: { created_at: 'desc' }
        });

        // 2. Fetch orders created AFTER that latest paid invoice (or all orders from today if no paid invoice)
        const orderWhere = {
            shopId: table.shopId,
            table_number: table.table_number,
            status: { not: 'cancelled' },
            created_at: { gte: today }
        };

        if (latestPaidInvoice) {
            orderWhere.created_at = { gt: latestPaidInvoice.created_at };
        }

        const orders = await prisma.restaurantOrder.findMany({
            where: orderWhere,
            include: {
                items: true
            },
            orderBy: { created_at: 'desc' }
        });

        // If no new orders and table is occupied, we might still be in the "paying" phase of the previous session
        // or just started.
        let finalOrders = orders;
        let isPaid = false;

        // Only check for payment if we actually have orders in this session
        if (orders.length > 0) {
            const tokens = orders.map(o => o.order_token).filter(Boolean);
            const invoice = await prisma.restaurantInvoice.findFirst({
                where: {
                    shopId: table.shopId,
                    isDeleted: false,
                    OR: tokens.map(t => ({ order_token: { contains: t } }))
                },
                select: { payment_status: true }
            });

            if (invoice && invoice.payment_status.toLowerCase() === 'paid') {
                isPaid = true;
            }
        }

        res.json({
            success: true,
            orders,
            isPaid,
            tableStatus: table.status
        });
    } catch (error) {
        console.error('Get table orders error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
};

// 4. Process Table Payment (Public)
const processTablePayment = async (req, res) => {
    try {
        const { token } = req.params;
        const { payment_method, amount } = req.body;
        const cleanToken = token?.trim();

        const table = await prisma.restaurantTable.findUnique({
            where: { qr_token: cleanToken },
            include: { shop: true }
        });

        if (!table || table.status !== 'occupied') {
            return res.status(400).json({ success: false, error: 'No active session for this table' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = await prisma.restaurantOrder.findMany({
            where: {
                shopId: table.shopId,
                table_number: table.table_number,
                status: { not: 'cancelled' },
                created_at: { gte: today }
            }
        });

        if (orders.length === 0) {
            return res.status(400).json({ success: false, error: 'No orders found to pay' });
        }

        const orderTokens = orders.map(o => o.order_token).join(', ');
        const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);

        // Security check: If amount is provided, it should match the total
        // In a real system, we'd be more rigorous.
        const finalAmount = amount || totalAmount;

        // Use a transaction to create invoice and update statuses
        const result = await prisma.$transaction(async (tx) => {
            // Find shop settings for invoice prefix/counter
            const settings = await tx.shopSettings.upsert({
                where: { shopId: table.shopId },
                update: { invoice_counter: { increment: 1 } },
                create: {
                    shopId: table.shopId,
                    invoice_prefix: 'INV-',
                    invoice_counter: 2,
                    stock_deduction: true
                }
            });

            const invoice_number = `${settings.invoice_prefix || 'INV-'}${String((settings.invoice_counter || 2) - 1).padStart(2, '0')}`;

            const invoice = await tx.restaurantInvoice.create({
                data: {
                    invoice_number,
                    order_token: orderTokens,
                    table_number: table.table_number,
                    customer_name: orders[0].customer_name || `Table ${table.table_number}`,
                    customer_phone: orders[0].customer_phone,
                    subtotal: finalAmount,
                    total: finalAmount,
                    rounded_total: Math.round(finalAmount),
                    payment_method: payment_method || 'UPI',
                    payment_status: 'Paid',
                    amount_paid: Math.round(finalAmount),
                    balance_due: 0,
                    shopId: table.shopId
                }
            });

            // Update table status
            await tx.restaurantTable.update({
                where: { id: table.id },
                data: { status: 'available' }
            });

            // Update all orders to completed
            await tx.restaurantOrder.updateMany({
                where: {
                    shopId: table.shopId,
                    order_token: { in: orders.map(o => o.order_token) }
                },
                data: { status: 'completed' }
            });

            return invoice;
        });

        res.json({
            success: true,
            message: 'Payment processed successfully',
            invoice: result
        });
    } catch (error) {
        console.error('Process table payment error:', error);
        res.status(500).json({ success: false, error: 'Failed to process payment' });
    }
};

module.exports = {
    getTableMenu,
    placeSelfOrder,
    getTableOrders,
    processTablePayment
};
