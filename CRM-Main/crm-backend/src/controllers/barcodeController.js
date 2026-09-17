const bwipjs = require('bwip-js');
const prisma = require('../lib/prisma');

/**
 * Generates a barcode image using bwip-js
 * @route GET /api/barcode?code=NNNN
 */
const getBarcodeImage = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Barcode code is required' });
    }

    try {
        const png = await bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: code,            // Text to encode
            scale: 5,               // Increased scaling factor for better scanning
            height: 15,             // Increased bar height
            includetext: true,      // Show human-readable text
            textxalign: 'center',   // Always good to set this
        });

        res.set('Content-Type', 'image/png');
        res.send(png);
    } catch (err) {
        console.error('Barcode generation error:', err);
        res.status(500).json({ success: false, message: 'Could not generate barcode image' });
    }
};

/**
 * Finds a product (Item or Combo) by its barcode
 * @route GET /api/products/barcode/:code
 */
const getProductByBarcode = async (req, res) => {
    const { code } = req.params;

    try {
        // Try to find in InventoryItem
        let product = await prisma.inventoryItem.findUnique({
            where: { barcode: code },
            include: { unit: true }
        });

        if (product) {
            return res.json({
                success: true,
                type: 'item',
                data: product
            });
        }

        // Try to find in ComboProduct
        product = await prisma.comboProduct.findUnique({
            where: { barcode: code }
        });

        if (product) {
            return res.json({
                success: true,
                type: 'combo',
                data: product
            });
        }

        return res.status(404).json({ success: false, message: 'Product not found' });
    } catch (err) {
        console.error('Barcode lookup error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getBarcodeImage,
    getProductByBarcode
};
