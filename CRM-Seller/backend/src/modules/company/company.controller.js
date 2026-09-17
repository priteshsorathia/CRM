const prisma = require('../../database/prisma');

exports.getCompanySettings = async (req, res) => {
  try {
    let settings = await prisma.companySetting.findFirst();

    // Create default if none exists
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          shopName: "CRM Restaurant",
          email: "restaurant@crm.com",
          phone: "1234567890",
          gstNumber: "GSTIN123456789",
          address: "Ahmedabad"
        }
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateCompanySettings = async (req, res) => {
  try {
    const { shopName, email, phone, gstNumber, address, logoPath } = req.body;
    let settings = await prisma.companySetting.findFirst();

    if (!settings) {
      settings = await prisma.companySetting.create({
        data: { shopName, email, phone, gstNumber, address, logoPath }
      });
    } else {
      settings = await prisma.companySetting.update({
        where: { id: settings.id },
        data: { shopName, email, phone, gstNumber, address, logoPath }
      });
    }

    res.json({ success: true, message: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating company settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
