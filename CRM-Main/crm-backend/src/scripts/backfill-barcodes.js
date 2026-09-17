const prisma = require('../lib/prisma');
const { generateBarcode } = require('../utils/barcode');

async function backfillBarcodes() {
    console.log('🚀 Starting Barcode Backfill process...');

    try {
        // 1. Handle InventoryItems
        const items = await prisma.inventoryItem.findMany({
            where: { barcode: null }
        });

        console.log(`📦 Found ${items.length} inventory items without barcodes.`);

        for (const item of items) {
            const barcode = generateBarcode();
            await prisma.inventoryItem.update({
                where: { id: item.id },
                data: { barcode }
            });
            console.log(`✅ Updated Item: ${item.item_name} -> ${barcode}`);
        }

        // 2. Handle ComboProducts
        const combos = await prisma.comboProduct.findMany({
            where: { barcode: null }
        });

        console.log(`🍱 Found ${combos.length} combo products without barcodes.`);

        for (const combo of combos) {
            const barcode = generateBarcode();
            await prisma.comboProduct.update({
                where: { id: combo.id },
                data: { barcode }
            });
            console.log(`✅ Updated Combo: ${combo.name} -> ${barcode}`);
        }

        console.log('✨ Barcode backfill completed successfully!');
    } catch (error) {
        console.error('❌ Error during backfill:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillBarcodes();
