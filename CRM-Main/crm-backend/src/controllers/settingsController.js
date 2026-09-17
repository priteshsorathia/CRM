const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DEFAULT_PROJECT_PREFIX = 'PRJ-';
const DEFAULT_PROJECT_COUNTER = 1;
const DEFAULT_CLIENT_PREFIX = 'CLT-';
const DEFAULT_CLIENT_COUNTER = 1;

// ==========================================
// 1. USER SETTINGS (Admin Profile)
// ==========================================

const getSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                username: true,
                upiId: true,
                shopId: true,
                enable_expense_module: true,
                enable_combo_module: true
            }
        });

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // If user's upiId is not set, fallback to shop's upiId or owner's upiId
        if (!user.upiId && user.shopId) {
            const shop = await prisma.shop.findUnique({
                where: { id: user.shopId },
                select: { upiId: true }
            });
            if (shop?.upiId) {
                user.upiId = shop.upiId;
            } else {
                const owner = await prisma.user.findFirst({
                    where: {
                        shopId: user.shopId,
                        role: {
                            in: ["shop_owner", "admin", "owner", "administrator", "restaurant_owner"]
                        }
                    },
                    select: { upiId: true }
                });
                if (owner?.upiId) {
                    user.upiId = owner.upiId;
                }
            }
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            email,
            username,
            upiId,
            enableExpenseModule,
            enableComboModule,
            enable_expense_module,
            enable_combo_module
        } = req.body;

        const loggedInRole = String(req.user?.role || '').trim().toLowerCase();
        const isRestrictedRole = ['manager', 'restaurant_manager', 'staff', 'cook'].includes(loggedInRole);

        let finalEmail = email;
        if (isRestrictedRole) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true }
            });
            if (currentUser) {
                finalEmail = currentUser.email;
            }
        }

        // Check unique username
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: { username: username, NOT: { id: userId } }
            });
            if (existingUser) return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        // Check unique email
        if (finalEmail) {
            const existingEmail = await prisma.user.findFirst({
                where: { email: finalEmail, NOT: { id: userId } }
            });
            if (existingEmail) return res.status(400).json({ success: false, error: 'Email already in use' });
        }

        // Normalise boolean flags
        const expenseToggle =
            typeof enableExpenseModule === 'boolean'
                ? enableExpenseModule
                : typeof enable_expense_module === 'boolean'
                    ? enable_expense_module
                    : undefined;

        const comboToggle =
            typeof enableComboModule === 'boolean'
                ? enableComboModule
                : typeof enable_combo_module === 'boolean'
                    ? enable_combo_module
                    : undefined;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email: finalEmail,
                username,
                upiId,
                ...(typeof expenseToggle === 'boolean' && { enable_expense_module: expenseToggle }),
                ...(typeof comboToggle === 'boolean' && { enable_combo_module: comboToggle })
            },
            select: {
                name: true,
                email: true,
                username: true,
                upiId: true,
                enable_expense_module: true,
                enable_combo_module: true
            }
        });

        if (upiId !== undefined) {
            const userForShop = await prisma.user.findUnique({
                where: { id: userId },
                select: { shopId: true }
            });
            if (userForShop?.shopId) {
                await prisma.shop.update({
                    where: { id: userForShop.shopId },
                    data: { upiId: upiId }
                });
            }
        }

        res.json({ success: true, message: 'Settings updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};

// ==========================================
// 2. SHOP SETTINGS (Company Info & Logo)
// ==========================================

const getShopSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true, upiId: true }
        });

        if (!user || !user.shopId) {
            return res.status(404).json({ success: false, error: 'Shop not associated with user' });
        }

        const shop = await prisma.shop.findUnique({
            where: { id: user.shopId }
        });

        let shopUpiId = shop?.upiId || user?.upiId;
        if (!shopUpiId && user?.shopId) {
            const owner = await prisma.user.findFirst({
                where: {
                    shopId: user.shopId,
                    role: {
                        in: ["shop_owner", "admin", "owner", "administrator", "restaurant_owner"]
                    }
                },
                select: { upiId: true }
            });
            shopUpiId = owner?.upiId || "";
        }

        const combinedData = {
            ...shop,
            upiId: shopUpiId
        };

        res.json({ success: true, data: combinedData });
    } catch (error) {
        console.error('Get shop settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch shop settings' });
    }
};

const updateShopSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, address, gstNumber, upiId, removeLogo } = req.body;

        let logoPath = undefined;
        if (req.file) {
            logoPath = `/uploads/${req.file.filename}`;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user || !user.shopId) {
            return res.status(404).json({ success: false, error: 'Shop not associated with user' });
        }

        const updateShopData = { name, address, gstNumber };
        if (logoPath) {
            updateShopData.logo = logoPath;
        } else if (removeLogo === 'true' || removeLogo === true) {
            updateShopData.logo = null;
        }
        if (upiId !== undefined) {
            updateShopData.upiId = upiId;
        }

        const updatedShop = await prisma.shop.update({
            where: { id: user.shopId },
            data: updateShopData
        });

        if (upiId !== undefined) {
            await prisma.user.update({
                where: { id: userId },
                data: { upiId: upiId }
            });
        }

        res.json({
            success: true,
            message: 'Shop settings updated successfully',
            data: { ...updatedShop, upiId }
        });
    } catch (error) {
        console.error('Update shop settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to update shop settings' });
    }
};

// ==========================================
// 3. INVOICE SETTINGS (Prefix, Tax, Notes)
// ==========================================

const getInvoiceSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        let settings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId }
        });

        if (!settings) {
            settings = {
                invoice_prefix: 'INV-',
                invoice_counter: 1,
                invoice_notes: '',
                default_tax: 0.0,
                stock_deduction: true,
                enable_buyback_exchange: false,
                enable_barcode_scanner: false,
                price_column_label: "Price per unit"
            };
        }

        // Get Shop UPI ID or Owner UPI ID
        const shop = await prisma.shop.findUnique({
            where: { id: user.shopId },
            select: { upiId: true }
        });

        let shopUpiId = shop?.upiId;
        if (!shopUpiId) {
            const owner = await prisma.user.findFirst({
                where: {
                    shopId: user.shopId,
                    role: {
                        in: ["shop_owner", "admin", "owner", "administrator", "restaurant_owner"]
                    }
                },
                select: { upiId: true }
            });
            shopUpiId = owner?.upiId || "";
        }

        res.json({ success: true, data: { ...settings, upiId: shopUpiId } });
    } catch (error) {
        console.error('Get invoice settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

const updateInvoiceSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            invoicePrefix,
            invoiceNotes,
            tax,
            stockMatter,
            enableBuyBackExchange,
            enableBarcodeScanner,
            priceColumnLabel,
            upiId
        } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        // Validation & Sanitization
        let cleanPrefix = "";
        if (invoicePrefix !== undefined && invoicePrefix !== null) {
            const trimmedPrefix = String(invoicePrefix).trim();
            if (trimmedPrefix === "") {
                return res.status(400).json({ success: false, error: 'Invoice Prefix is required and cannot be empty space.' });
            }
            if (trimmedPrefix.includes('.')) {
                return res.status(400).json({ success: false, error: 'Invoice Prefix cannot contain dots.' });
            }
            if (trimmedPrefix.length > 50) {
                return res.status(400).json({ success: false, error: 'Invoice Prefix cannot exceed 50 characters.' });
            }
            // Strip HTML tags for XSS & clean SQL metacharacters
            cleanPrefix = trimmedPrefix.replace(/<[^>]*>/g, '').replace(/['"\\;]/g, '');
        } else {
            return res.status(400).json({ success: false, error: 'Invoice Prefix is required.' });
        }

        let cleanNotes = "";
        if (invoiceNotes !== undefined && invoiceNotes !== null) {
            const trimmedNotes = String(invoiceNotes).trim();
            if (trimmedNotes.length > 1000) {
                return res.status(400).json({ success: false, error: 'Invoice Notes cannot exceed 1000 characters.' });
            }
            cleanNotes = trimmedNotes.replace(/<[^>]*>/g, '').replace(/['"\\;]/g, '');
        }

        let cleanTax = 0;
        if (tax !== undefined && tax !== null) {
            const parsedTax = parseFloat(tax);
            if (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
                return res.status(400).json({ success: false, error: 'Default GST (%) must be a valid number between 0 and 100.' });
            }
            cleanTax = parsedTax;
        } else {
            return res.status(400).json({ success: false, error: 'Default GST (%) is required.' });
        }

        let cleanLabel = "Price per unit";
        if (priceColumnLabel !== undefined && priceColumnLabel !== null) {
            const trimmedLabel = String(priceColumnLabel).trim();
            if (trimmedLabel.length > 100) {
                return res.status(400).json({ success: false, error: 'Price Column Label cannot exceed 100 characters.' });
            }
            cleanLabel = trimmedLabel.replace(/<[^>]*>/g, '').replace(/['"\\;]/g, '');
        }


        const existingSettings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId },
            select: { invoice_prefix: true }
        });

        const shouldResetCounter =
            existingSettings?.invoice_prefix &&
            cleanPrefix &&
            String(existingSettings.invoice_prefix) !== String(cleanPrefix);

        const updatedSettings = await prisma.shopSettings.upsert({
            where: { shopId: user.shopId },
            update: {
                invoice_prefix: cleanPrefix,
                invoice_notes: cleanNotes,
                default_tax: cleanTax,
                stock_deduction: stockMatter,
                ...(shouldResetCounter ? { invoice_counter: 1 } : {}),
                enable_buyback_exchange: enableBuyBackExchange,
                enable_barcode_scanner: enableBarcodeScanner,
                price_column_label: cleanLabel
            },
            create: {
                shopId: user.shopId,
                invoice_prefix: cleanPrefix,
                invoice_notes: cleanNotes,
                default_tax: cleanTax,
                stock_deduction: stockMatter,
                invoice_counter: 1,
                enable_buyback_exchange: enableBuyBackExchange || false,
                enable_barcode_scanner: enableBarcodeScanner || false,
                price_column_label: cleanLabel
            }
        });

        if (upiId !== undefined) {
            // Update Shop UPI ID
            await prisma.shop.update({
                where: { id: user.shopId },
                data: { upiId: upiId }
            });
            // Update User UPI ID for compatibility
            await prisma.user.update({
                where: { id: userId },
                data: { upiId: upiId }
            });
        }

        res.json({ success: true, message: 'Invoice settings saved', data: updatedSettings });
    } catch (error) {
        console.error('Update invoice settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to save settings: ' + error.message });
    }
};

// ==========================================
// 3B. ORDER SETTINGS (Prefix + Counter)
// ==========================================

const getOrderSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        let settings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId }
        });

        if (!settings) {
            return res.json({
                success: true,
                data: { order_prefix: 'ORD-', order_counter: 1 }
            });
        }

        res.json({
            success: true,
            data: {
                order_prefix: settings.order_prefix || 'ORD-',
                order_counter: settings.order_counter || 1
            }
        });
    } catch (error) {
        console.error('Get order settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

const updateOrderSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderPrefix } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        if (orderPrefix === undefined || orderPrefix === null) {
            return res.status(400).json({ success: false, error: 'Order Prefix is required.' });
        }

        const trimmedPrefix = String(orderPrefix).trim();
        if (trimmedPrefix === "") {
            return res.status(400).json({ success: false, error: 'Order Prefix is required and cannot be empty.' });
        }
        if (trimmedPrefix.includes('.')) {
            return res.status(400).json({ success: false, error: 'Order Prefix cannot contain dots.' });
        }
        if (trimmedPrefix.length > 50) {
            return res.status(400).json({ success: false, error: 'Order Prefix cannot exceed 50 characters.' });
        }

        // Strip HTML tags for XSS & clean SQL metacharacters
        const nextPrefix = trimmedPrefix.replace(/<[^>]*>/g, '').replace(/['"\\;]/g, '');

        const existingSettings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId },
            select: { order_prefix: true }
        });

        const shouldResetCounter =
            existingSettings?.order_prefix &&
            String(existingSettings.order_prefix) !== nextPrefix;

        const updatedSettings = await prisma.shopSettings.upsert({
            where: { shopId: user.shopId },
            update: {
                order_prefix: nextPrefix,
                ...(shouldResetCounter ? { order_counter: 1 } : {})
            },
            create: {
                shopId: user.shopId,
                order_prefix: nextPrefix,
                order_counter: 1,
                invoice_prefix: 'INV-',
                invoice_counter: 1,
                invoice_notes: '',
                default_tax: 0.0,
                stock_deduction: true,
                enable_buyback_exchange: false,
                price_column_label: "Price per unit"
            }
        });

        res.json({
            success: true,
            message: 'Order settings saved',
            data: {
                order_prefix: updatedSettings.order_prefix || 'ORD-',
                order_counter: updatedSettings.order_counter || 1
            }
        });
    } catch (error) {
        console.error('Update order settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to save settings: ' + error.message });
    }
};

// ==========================================
// 3C. PROJECT SETTINGS (Prefix + Counter)
// ==========================================

const getProjectSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        const settings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId },
            select: { project_prefix: true, project_counter: true }
        });

        res.json({
            success: true,
            data: {
                project_prefix: settings?.project_prefix || DEFAULT_PROJECT_PREFIX,
                project_counter: settings?.project_counter || DEFAULT_PROJECT_COUNTER
            }
        });
    } catch (error) {
        console.error('Get project settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

const updateProjectSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectPrefix } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        const nextPrefix = String(projectPrefix || DEFAULT_PROJECT_PREFIX).trim() || DEFAULT_PROJECT_PREFIX;

        const existingSettings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId },
            select: { project_prefix: true }
        });

        const shouldResetCounter =
            existingSettings?.project_prefix &&
            String(existingSettings.project_prefix) !== nextPrefix;

        const updatedSettings = await prisma.shopSettings.upsert({
            where: { shopId: user.shopId },
            update: {
                project_prefix: nextPrefix,
                ...(shouldResetCounter ? { project_counter: DEFAULT_PROJECT_COUNTER } : {})
            },
            create: {
                shopId: user.shopId,
                stock_deduction: true,
                invoice_prefix: 'INV-',
                invoice_counter: 1,
                invoice_notes: '',
                default_tax: 0.0,
                order_prefix: 'ORD-',
                order_counter: 1,
                enable_buyback_exchange: false,
                price_column_label: "Price per unit",
                project_prefix: nextPrefix,
                project_counter: DEFAULT_PROJECT_COUNTER,
                client_prefix: DEFAULT_CLIENT_PREFIX,
                client_counter: DEFAULT_CLIENT_COUNTER
            }
        });

        res.json({
            success: true,
            message: 'Project settings saved',
            data: {
                project_prefix: updatedSettings.project_prefix || nextPrefix,
                project_counter: updatedSettings.project_counter || DEFAULT_PROJECT_COUNTER
            }
        });
    } catch (error) {
        console.error('Update project settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to save settings: ' + error.message });
    }
};

// ==========================================
// 3D. CLIENT SETTINGS (Prefix + Counter)
// ==========================================

const getClientSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        const settings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId },
            select: { client_prefix: true, client_counter: true }
        });

        res.json({
            success: true,
            data: {
                client_prefix: settings?.client_prefix || DEFAULT_CLIENT_PREFIX,
                client_counter: settings?.client_counter || DEFAULT_CLIENT_COUNTER
            }
        });
    } catch (error) {
        console.error('Get client settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

const updateClientSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { clientPrefix } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shopId: true }
        });

        if (!user.shopId) return res.status(404).json({ success: false, error: 'Shop not found' });

        const nextPrefix = String(clientPrefix || DEFAULT_CLIENT_PREFIX).trim() || DEFAULT_CLIENT_PREFIX;

        const existingSettings = await prisma.shopSettings.findUnique({
            where: { shopId: user.shopId },
            select: { client_prefix: true }
        });

        const shouldResetCounter =
            existingSettings?.client_prefix &&
            String(existingSettings.client_prefix) !== nextPrefix;

        const updatedSettings = await prisma.shopSettings.upsert({
            where: { shopId: user.shopId },
            update: {
                client_prefix: nextPrefix,
                ...(shouldResetCounter ? { client_counter: DEFAULT_CLIENT_COUNTER } : {})
            },
            create: {
                shopId: user.shopId,
                stock_deduction: true,
                invoice_prefix: 'INV-',
                invoice_counter: 1,
                invoice_notes: '',
                default_tax: 0.0,
                order_prefix: 'ORD-',
                order_counter: 1,
                enable_buyback_exchange: false,
                price_column_label: "Price per unit",
                project_prefix: DEFAULT_PROJECT_PREFIX,
                project_counter: DEFAULT_PROJECT_COUNTER,
                client_prefix: nextPrefix,
                client_counter: DEFAULT_CLIENT_COUNTER
            }
        });

        res.json({
            success: true,
            message: 'Client settings saved',
            data: {
                client_prefix: updatedSettings.client_prefix || nextPrefix,
                client_counter: updatedSettings.client_counter || DEFAULT_CLIENT_COUNTER
            }
        });
    } catch (error) {
        console.error('Update client settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to save settings: ' + error.message });
    }
};

// ==========================================
// 4. PASSWORD SETTINGS (Change Password)
// ==========================================

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ success: false, error: 'Incorrect current password' });

        if (newPassword.length > 32) {
            return res.status(400).json({ success: false, error: 'Password must be at most 32 characters long.' });
        }
        if (/\s/.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'Password cannot contain spaces.' });
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[\]}|:;"'<,>.?/~`])/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain uppercase, lowercase, numbers, and at least one special character.'
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, error: 'Failed to change password' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getShopSettings,
    updateShopSettings,
    getInvoiceSettings,
    updateInvoiceSettings,
    getOrderSettings,
    updateOrderSettings,
    getProjectSettings,
    updateProjectSettings,
    getClientSettings,
    updateClientSettings,
    changePassword
};
