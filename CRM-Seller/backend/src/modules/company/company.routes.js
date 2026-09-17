const express = require("express");
const router = express.Router();
const companyController = require("./company.controller");

// GET /api/company/settings
router.get("/settings", companyController.getCompanySettings);

// PUT /api/company/settings
router.put("/settings", companyController.updateCompanySettings);

module.exports = router;
