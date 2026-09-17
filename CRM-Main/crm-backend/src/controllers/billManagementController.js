const prisma = require('../lib/prisma');

// get dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const { shopId } = req.query;

        if (!shopId) {
            return res.status(400).json({
                status: "error",
                message: "shopId is required",
            });
        }

        const stats = await prisma.purchaseBill.aggregate({
            where: { shopId: Number(shopId) },
            _count: { _all: true },
            _sum: { totalAmount: true },
        });

        return res.json({
            status: "success",
            data: {
                totalBills: stats._count._all,
                totalAmount: stats._sum.totalAmount || 0,
            },
        });
    } catch (error) {

    }
};

// get bills shop wise
const getBillsShopWise = async (req, res) => {
    try {
        const {
            shopId,          // required
            page = 1,
            limit = 10,
            search = "",
            startDate,
            endDate,
        } = req.query;

        if (!shopId) {
            return res.status(400).json({
                status: "error",
                message: "shopId is required",
            });
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);
        const skip = (pageNumber - 1) * pageSize;

        // 🔹 Build where condition
        const whereCondition = {
            shopId: Number(shopId),
            AND: [
                search
                    ? {
                        OR: [
                            { supplierName: { contains: search, mode: "insensitive" } },
                            { billNumber: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {},
                startDate && endDate
                    ? {
                        billDate: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                    }
                    : {},
            ],
        };

        // 🔹 Fetch data
        const [bills, totalCount] = await Promise.all([
            prisma.purchaseBill.findMany({
                where: whereCondition,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.purchaseBill.count({
                where: whereCondition,
            }),
        ]);

        return res.json({
            status: "success",
            data: bills,
            pagination: {
                totalRecords: totalCount,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / pageSize),
                limit: pageSize,
            },
        });
    } catch (error) {
        console.error("Get Bills Shop Wise Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch purchase bills",
        });
    }
};

// get Lended (lent-in) purchase bills shop wise
const getUdharBillsShopWise = async (req, res) => {
    try {
        const {
            shopId,          // required
            page = 1,
            limit = 10,
            search = "",
            startDate,
            endDate,
        } = req.query;

        if (!shopId) {
            return res.status(400).json({
                status: "error",
                message: "shopId is required",
            });
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);
        const skip = (pageNumber - 1) * pageSize;

        // 🔹 Build where condition
        const whereCondition = {
            shopId: Number(shopId),
            paymentMode: "Lended", // ✅ ONLY UDhar bills
            AND: [
                search
                    ? {
                        OR: [
                            { supplierName: { contains: search, mode: "insensitive" } },
                            { billNumber: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {},
                startDate && endDate
                    ? {
                        billDate: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                    }
                    : {},
            ],
        };

        // 🔹 Fetch data
        const [bills, totalCount, totalAmount] = await Promise.all([
            prisma.purchaseBill.findMany({
                where: whereCondition,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.purchaseBill.count({
                where: whereCondition,
            }),
            prisma.purchaseBill.aggregate({
                where: whereCondition,
                _sum: { totalAmount: true },
            }),
        ]);

        return res.json({
            status: "success",
            data: bills,
            summary: {
                totalUdharAmount: totalAmount._sum.totalAmount || 0,
            },
            pagination: {
                totalRecords: totalCount,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / pageSize),
                limit: pageSize,
            },
        });
    } catch (error) {
        console.error("Get Udhar Bills Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch Lended purchase bills",
        });
    }
};

// mark Lended purchase bill as paid
const markPurchaseBillAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMode = "paid", note } = req.body;

        // 🔍 Find bill
        const bill = await prisma.purchaseBill.findUnique({
            where: { id: Number(id) },
        });

        if (!bill) {
            return res.status(404).json({
                status: "error",
                message: "Purchase bill not found",
            });
        }

        // ❌ Only Lended bills allowed
        if (bill.paymentMode !== "Lended") {
            return res.status(400).json({
                status: "error",
                message: "This bill is not an Lended bill or already paid",
            });
        }

        // ✅ Update bill
        const updatedBill = await prisma.purchaseBill.update({
            where: { id: Number(id) },
            data: {
                paymentMode, // cash | bank | upi | paid
                notes: note
                    ? `${bill.notes ?? ""}\n[Paid]: ${note}`.trim()
                    : bill.notes,
            },
        });

        return res.json({
            status: "success",
            message: "Purchase bill marked as paid successfully",
            data: updatedBill,
        });
    } catch (error) {
        console.error("Mark Purchase Bill As Paid Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to mark purchase bill as paid",
        });
    }
};

// create the bill shop wise function
const createPurchaseBill = async (req, res) => {
    try {
        let {
            shopId,
            billNumber,
            billDate,
            supplierName,
            supplierPhone,
            supplierGst,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paymentMode,
            notes,
        } = req.body;

        // 🔴 Required fields validation
        if (!shopId || !supplierName || !totalAmount || !paymentMode) {
            return res.status(400).json({
                status: "error",
                message:
                    "shopId, supplierName, totalAmount and paymentMode are required",
            });
        }

        // 📎 Handle uploaded bill file (optional)
        let billFileUrl = null;
        if (req.file) {
            billFileUrl = `/uploads/${req.file.filename}`;
        }

        // 🧾 Create purchase bill
        const purchaseBill = await prisma.purchaseBill.create({
            data: {
                shopId: Number(shopId),
                billNumber: billNumber || null,
                billDate: billDate ? new Date(billDate) : new Date(),
                supplierName: supplierName.trim(),
                supplierPhone: supplierPhone || null,
                supplierGst: supplierGst || null,
                subtotal: subtotal ? Number(subtotal) : null,
                taxAmount: taxAmount ? Number(taxAmount) : null,
                discountAmount: discountAmount ? Number(discountAmount) : 0,
                totalAmount: Number(totalAmount),
                paymentMode: paymentMode,
                notes: notes || null,
                billFileUrl,
            },
        });

        return res.status(201).json({
            status: "success",
            message: "Purchase bill created successfully",
            data: purchaseBill,
        });
    } catch (error) {
        console.error("Create Purchase Bill Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to create purchase bill",
        });
    }
};

// view single purchase bill
const getPurchaseBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const bill = await prisma.purchaseBill.findUnique({
            where: { id: Number(id) },
        });

        if (!bill) {
            return res.status(404).json({
                status: "error",
                message: "Purchase bill not found",
            });
        }

        return res.json({
            status: "success",
            data: bill,
        });
    } catch (error) {
        console.error("Get Purchase Bill Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch purchase bill",
        });
    }
};

// update purchase bill
const updatePurchaseBill = async (req, res) => {
    try {
        const { id } = req.params;

        let {
            billNumber,
            billDate,
            supplierName,
            supplierPhone,
            supplierGst,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paymentMode,
            notes,
        } = req.body;

        const existingBill = await prisma.purchaseBill.findUnique({
            where: { id: Number(id) },
        });

        if (!existingBill) {
            return res.status(404).json({
                status: "error",
                message: "Purchase bill not found",
            });
        }

        // 📎 Handle optional new file upload
        let billFileUrl = existingBill.billFileUrl;
        if (req.file) {
            billFileUrl = `/uploads/${req.file.filename}`;
        }

        const parseOptionalNumber = (value, defaultValue) => {
            if (value === undefined) return defaultValue;
            if (value === null || value === "" || String(value).trim() === "") return null;
            const parsed = Number(value);
            return isNaN(parsed) ? null : parsed;
        };

        const updatedBill = await prisma.purchaseBill.update({
            where: { id: Number(id) },
            data: {
                billNumber: billNumber !== undefined ? (billNumber === "" ? null : billNumber) : existingBill.billNumber,
                billDate: billDate ? new Date(billDate) : existingBill.billDate,
                supplierName: supplierName?.trim() || existingBill.supplierName,
                supplierPhone: supplierPhone !== undefined ? (supplierPhone === "" ? null : supplierPhone) : existingBill.supplierPhone,
                supplierGst: supplierGst !== undefined ? (supplierGst === "" ? null : supplierGst) : existingBill.supplierGst,
                subtotal: parseOptionalNumber(subtotal, existingBill.subtotal),
                taxAmount: parseOptionalNumber(taxAmount, existingBill.taxAmount),
                discountAmount: parseOptionalNumber(discountAmount, existingBill.discountAmount) ?? 0,
                totalAmount: parseOptionalNumber(totalAmount, existingBill.totalAmount) ?? existingBill.totalAmount,
                paymentMode: paymentMode ?? existingBill.paymentMode,
                notes: notes !== undefined ? (notes === "" ? null : notes) : existingBill.notes,
                billFileUrl,
            },
        });

        return res.json({
            status: "success",
            message: "Purchase bill updated successfully",
            data: updatedBill,
        });
    } catch (error) {
        console.error("Update Purchase Bill Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to update purchase bill",
        });
    }
};

// delete purchase bill
const deletePurchaseBill = async (req, res) => {
    try {
        const { id } = req.params;

        const existingBill = await prisma.purchaseBill.findUnique({
            where: { id: Number(id) },
        });

        if (!existingBill) {
            return res.status(404).json({
                status: "error",
                message: "Purchase bill not found",
            });
        }

        await prisma.purchaseBill.delete({
            where: { id: Number(id) },
        });

        return res.json({
            status: "success",
            message: "Purchase bill deleted successfully",
        });
    } catch (error) {
        console.error("Delete Purchase Bill Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to delete purchase bill",
        });
    }
};

module.exports = { getDashboardStats, getBillsShopWise, getUdharBillsShopWise, markPurchaseBillAsPaid, getPurchaseBillById, createPurchaseBill, updatePurchaseBill, deletePurchaseBill };
