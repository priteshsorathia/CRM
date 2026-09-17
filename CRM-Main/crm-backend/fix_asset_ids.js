const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAssetIds() {
    console.log('Starting Asset ID re-sequencing...');
    
    // Get all assets ordered by creation date
    const assets = await prisma.asset.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${assets.length} assets to process.`);

    for (let i = 0; i < assets.length; i++) {
        const newId = String(i + 1);
        const asset = assets[i];
        
        console.log(`Updating Asset "${asset.name}" (Current ID: ${asset.assetId}) to New ID: ${newId}`);
        
        await prisma.asset.update({
            where: { id: asset.id },
            data: { assetId: newId }
        });
    }

    console.log('Asset ID re-sequencing completed successfully!');
    process.exit(0);
}

fixAssetIds().catch(err => {
    console.error('Error during re-sequencing:', err);
    process.exit(1);
});
