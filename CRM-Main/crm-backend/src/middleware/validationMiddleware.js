const validateShopCreation = (req, res, next) => {
  const { name, address, phone, email, gstNumber, ownerName, upiId } = req.body;

  // GST number is optional, but other fields are required
  if (!name || !address || !phone || !email || !ownerName || !upiId) {
    return res.status(400).json({ 
      error: 'All fields are required: name, ownerName, address, phone, email, upiId. GST number is optional.' 
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

module.exports = { validateShopCreation };