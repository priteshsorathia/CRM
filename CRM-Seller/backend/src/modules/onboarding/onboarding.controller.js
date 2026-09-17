const prisma = require('../../database/prisma');
const { externalApi } = require('../../lib/externalApi');

// Get all onboarding requests
exports.getAllOnboardings = async (req, res) => {
    try {
        const onboardings = await prisma.onboarding.findMany({
            orderBy: { serialId: 'desc' }
        });
        res.status(200).json({ success: true, data: onboardings });
    } catch (error) {
        console.error("Fetch Onboardings Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Get single onboarding by ID
exports.getOnboardingById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        
        if (id.startsWith('OB-')) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        const onboarding = await prisma.onboarding.findUnique({
            where: query
        });

        if (!onboarding) {
            return res.status(404).json({ success: false, message: 'Onboarding record not found' });
        }

        res.status(200).json({ success: true, data: onboarding });
    } catch (error) {
        console.error("Fetch Single Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Create new onboarding request
exports.createOnboarding = async (req, res) => {
    try {
        const {
            businessName, businessType, panType, panNumber,
            gstNumber, addressProofType, fssaiLicense,
            fullName, email, phone
        } = req.body;

        if (!businessName || !fullName || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const existing = await prisma.onboarding.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already exists in records' });
        }

        // Handle file uploads natively via our multer configuration
        const documentPan = req.files?.documentPan ? `/uploads/onboarding/${req.files.documentPan[0].filename}` : null;
        const documentAddress = req.files?.documentAddress ? `/uploads/onboarding/${req.files.documentAddress[0].filename}` : null;
        const documentGst = req.files?.documentGst ? `/uploads/onboarding/${req.files.documentGst[0].filename}` : null;

        const newOnboarding = await prisma.onboarding.create({
            data: {
                businessName, businessType, panType, panNumber,
                gstNumber, addressProofType, fssaiLicense,
                fullName, email, phone,
                documentPan, documentAddress, documentGst,
                status: 'Pending'
            }
        });

        try {
            await externalApi.post('/shops/create', {
                name: businessName,
                address: 'Address pending verification',
                phone: phone,
                email: email,
                ownerName: fullName,
                gstNumber: gstNumber || '',
                userType: 'retailers'
            });
        } catch (shopError) {
            console.error("Failed to auto-create shop:", shopError.message);
        }

        res.status(201).json({ success: true, data: newOnboarding });
    } catch (error) {
        console.error("Create Onboarding Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        let query = {};
        if (id && id.startsWith('OB-')) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        const updated = await prisma.onboarding.update({
            where: query,
            data: { status }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Update onboarding data
exports.updateOnboarding = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            businessName, businessType, panType, panNumber,
            gstNumber, addressProofType, fssaiLicense,
            fullName, email, phone, status
        } = req.body;

        const updateData = {};
        if (businessName) updateData.businessName = businessName;
        if (businessType) updateData.businessType = businessType;
        if (panType) updateData.panType = panType;
        if (panNumber) updateData.panNumber = panNumber;
        if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
        if (addressProofType) updateData.addressProofType = addressProofType;
        if (fssaiLicense !== undefined) updateData.fssaiLicense = fssaiLicense;
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (status) updateData.status = status;

        if (req.files?.documentPan) updateData.documentPan = `/uploads/onboarding/${req.files.documentPan[0].filename}`;
        if (req.files?.documentAddress) updateData.documentAddress = `/uploads/onboarding/${req.files.documentAddress[0].filename}`;
        if (req.files?.documentGst) updateData.documentGst = `/uploads/onboarding/${req.files.documentGst[0].filename}`;

        let query = {};
        if (id && id.startsWith('OB-')) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        const oldRecord = await prisma.onboarding.findUnique({ where: query });
        const updated = await prisma.onboarding.update({
            where: query,
            data: updateData
        });

        // Sync updates to corresponding shop if it exists
        if (oldRecord && oldRecord.email) {
            try {
                const shopsRes = await externalApi.get('/shops');
                const shopsList = shopsRes.data.data || shopsRes.data;
                
                if (Array.isArray(shopsList)) {
                    // Try to match the shop by the original email
                    const matchedShop = shopsList.find(s => s.email === oldRecord.email);
                    if (matchedShop) {
                        const extId = matchedShop.id || matchedShop._id ? matchedShop.id || matchedShop._id : `SH-${String(matchedShop.serialId).padStart(2, '0')}`;
                        await externalApi.put(`/shops/${extId}`, {
                            name: updateData.businessName || oldRecord.businessName,
                            address: 'Address pending verification',
                            phone: updateData.phone || oldRecord.phone,
                            email: updateData.email || oldRecord.email,
                            ownerName: updateData.fullName || oldRecord.fullName,
                            gstNumber: updateData.gstNumber !== undefined ? updateData.gstNumber : oldRecord.gstNumber,
                        });
                    }
                }
            } catch (shopSyncError) {
                console.error("Failed to sync onboarding update to shop:", shopSyncError.message);
            }
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Record Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Delete onboarding
exports.deleteOnboarding = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        if (id && id.startsWith('OB-')) {
            const serialNum = parseInt(id.split('-')[1]);
            query = { serialId: serialNum };
        } else {
            query = { id: id };
        }

        await prisma.onboarding.delete({ where: query });
        res.status(200).json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
        console.error("Delete Record Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error or Record Not Found' });
    }
};
