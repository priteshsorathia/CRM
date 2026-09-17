const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Shops (Retailers + Restaurant)
  const shopRetail = await prisma.shop.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'CRM',
      ownerName: 'Retail User',
      address: 'Ahmedabad',
      phone: '1234567890',
      email: 'tmail9511@gmail.com',
      gstNumber: 'GSTIN123456789',
      logo: '/uploads/shop-logo-1764822788628-202576426.png',
      userType: 'retailers',
      createdAt: new Date('2025-11-01T04:32:14.287Z'),
      updatedAt: new Date('2025-12-12T12:41:49.756Z'),
    },
  });

  const shopRestaurant = await prisma.shop.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'CRM Restaurant',
      ownerName: 'Restaurant User',
      address: 'Ahmedabad',
      phone: '1234567890',
      email: 'tmail9511+restaurant@gmail.com',
      gstNumber: 'GSTIN123456789',
      logo: '/uploads/shop-logo-1764822788628-202576426.png',
      userType: 'restaurants',
      createdAt: new Date('2025-11-01T04:32:14.287Z'),
      updatedAt: new Date('2025-12-12T12:41:49.756Z'),
    },
  });

  const shopServices = await prisma.shop.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'CRM Services',
      ownerName: 'Services User',
      address: 'Ahmedabad',
      phone: '1234567890',
      email: 'tmail9511+services@gmail.com',
      gstNumber: 'GSTIN123456789',
      logo: '/uploads/shop-logo-1764822788628-202576426.png',
      userType: 'services',
      createdAt: new Date('2025-11-01T04:32:14.287Z'),
      updatedAt: new Date('2025-12-12T12:41:49.756Z'),
    },
  });

  // 2. Unit Categories
  const unitCategoriesData = [
    { id: 1, name: 'Weight', description: 'Measurements for mass (kg, g, etc.)' },
    { id: 2, name: 'Volume', description: 'Measurements for liquids (l, ml, etc.)' },
    { id: 3, name: 'Quantity', description: 'Count based measurements (pcs, dozen, etc.)' },
    { id: 4, name: 'Length', description: 'Measurements for distance (m, cm, etc.)' },
  ];

  for (const uc of unitCategoriesData) {
    await prisma.unitCategory.upsert({
      where: { id: uc.id },
      update: {},
      create: uc,
    });
  }

  // 3. Units
  const unitsData = [
    { id: 1, name: 'Kilogram', symbol: 'kg', conversionRate: 1, isBaseUnit: true, unitCategoryId: 1 },
    { id: 2, name: 'Gram', symbol: 'g', conversionRate: 0.001, isBaseUnit: false, unitCategoryId: 1 },
    { id: 3, name: 'Tonne', symbol: 't', conversionRate: 1000, isBaseUnit: false, unitCategoryId: 1 },
    { id: 4, name: 'Litre', symbol: 'l', conversionRate: 1, isBaseUnit: true, unitCategoryId: 2 },
    { id: 5, name: 'Millilitre', symbol: 'ml', conversionRate: 0.001, isBaseUnit: false, unitCategoryId: 2 },
    { id: 6, name: 'Piece', symbol: 'pc', conversionRate: 1, isBaseUnit: true, unitCategoryId: 3 },
    { id: 7, name: 'Dozen', symbol: 'doz', conversionRate: 12, isBaseUnit: false, unitCategoryId: 3 },
    { id: 8, name: 'Box', symbol: 'box', conversionRate: 10, isBaseUnit: false, unitCategoryId: 3 },
    { id: 9, name: 'Meter', symbol: 'm', conversionRate: 1, isBaseUnit: true, unitCategoryId: 4 },
    { id: 10, name: 'Centimeter', symbol: 'cm', conversionRate: 0.01, isBaseUnit: false, unitCategoryId: 4 },
    { id: 11, name: 'Kilometer', symbol: 'km', conversionRate: 1000, isBaseUnit: false, unitCategoryId: 4 },
  ];

  for (const u of unitsData) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }

  // 4. Employees (2 employees per shop)
  const ownerPasswordPlain = 'Admin@123';
  const employee1PasswordPlain = 'Emp@1234';
  const employee2PasswordPlain = 'Emp@5678';

  const ownerPasswordHash = await bcrypt.hash(ownerPasswordPlain, 12);
  const employee1PasswordHash = await bcrypt.hash(employee1PasswordPlain, 12);
  const employee2PasswordHash = await bcrypt.hash(employee2PasswordPlain, 12);

  const employeesData = [
    // Retailers shop (id: 1)
    {
      id: 1,
      emp_id: 'EMP-001',
      full_name: 'CRM Manager',
      email: 'tmail9511+retail.manager@gmail.com',
      username: 'crm.manager.retail',
      password: employee1PasswordHash,
      phone: '+91-99999-10001',
      role: 'Manager',
      salary: 35000,
      join_date: new Date('2025-11-05T00:00:00Z'),
      status: 'active',
      shopId: 1,
    },
    {
      id: 2,
      emp_id: 'EMP-002',
      full_name: 'CRM Staff',
      email: 'tmail9511+retail.staff@gmail.com',
      username: 'crm.staff.retail',
      password: employee2PasswordHash,
      phone: '+91-99999-10002',
      role: 'Sales',
      salary: 20000,
      join_date: new Date('2025-11-10T00:00:00Z'),
      status: 'active',
      shopId: 1,
    },
    // Restaurant shop (id: 2)
    {
      id: 3,
      emp_id: 'EMP-003',
      full_name: 'CRM Manager',
      email: 'tmail9511+restaurant.manager@gmail.com',
      username: 'crm.manager.restaurant',
      password: employee1PasswordHash,
      phone: '+91-99999-20001',
      role: 'Manager',
      salary: 35000,
      join_date: new Date('2025-11-05T00:00:00Z'),
      status: 'active',
      shopId: 2,
    },
    {
      id: 4,
      emp_id: 'EMP-004',
      full_name: 'CRM Staff',
      email: 'tmail9511+restaurant.staff@gmail.com',
      username: 'crm.staff.restaurant',
      password: employee2PasswordHash,
      phone: '+91-99999-20002',
      role: 'Sales',
      salary: 20000,
      join_date: new Date('2025-11-10T00:00:00Z'),
      status: 'active',
      shopId: 2,
    },
  ];

  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        emp_id: emp.emp_id,
        full_name: emp.full_name,
        email: emp.email,
        username: emp.username,
        password: emp.password,
        phone: emp.phone,
        role: emp.role,
        salary: emp.salary,
        join_date: emp.join_date,
        status: emp.status,
        shopId: emp.shopId,
      },
      create: emp,
    });
  }

  // 5. Users (same roles/passwords for both shops; unique emails/usernames)
  const usersData = [
    // Retailers shop (id: 1)
    {
      id: 1,
      email: 'tmail9511@gmail.com',
      name: 'CRM Owner',
      password: ownerPasswordHash,
      role: 'shop_owner',
      username: 'crm.owner.retail',
      shopId: 1,
      employeeId: null,
      userType: 'retailers',
    },
    {
      id: 2,
      email: 'tmail9511+retail.manager@gmail.com',
      name: 'CRM Manager',
      password: employee1PasswordHash,
      role: 'Manager',
      username: 'crm.manager.retail',
      shopId: 1,
      employeeId: 1,
      userType: 'retailers',
    },
    {
      id: 3,
      email: 'tmail9511+retail.staff@gmail.com',
      name: 'CRM Staff',
      password: employee2PasswordHash,
      role: 'Sales',
      username: 'crm.staff.retail',
      shopId: 1,
      employeeId: 2,
      userType: 'retailers',
    },
    // Restaurant shop (id: 2)
    {
      id: 4,
      email: 'tmail9511+restaurant@gmail.com',
      name: 'CRM Owner',
      password: ownerPasswordHash,
      role: 'shop_owner',
      username: 'crm.owner.restaurant',
      shopId: 2,
      employeeId: null,
      userType: 'restaurants',
    },
    {
      id: 5,
      email: 'tmail9511+restaurant.manager@gmail.com',
      name: 'CRM Manager',
      password: employee1PasswordHash,
      role: 'Manager',
      username: 'crm.manager.restaurant',
      shopId: 2,
      employeeId: 3,
      userType: 'restaurants',
    },
    {
      id: 6,
      email: 'tmail9511+restaurant.staff@gmail.com',
      name: 'CRM Staff',
      password: employee2PasswordHash,
      role: 'Sales',
      username: 'crm.staff.restaurant',
      shopId: 2,
      employeeId: 4,
      userType: 'restaurants',
    },
    // Services shop (id: 3)
    {
      id: 7,
      email: 'tmail9511+services@gmail.com',
      name: 'CRM Owner',
      password: ownerPasswordHash,
      role: 'shop_owner',
      username: 'crm.owner.services',
      shopId: 3,
      employeeId: null,
      userType: 'services',
    },
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role,
        username: user.username,
        shopId: user.shopId,
        employeeId: user.employeeId,
        userType: user.userType,
      },
      create: user,
    });
  }

  // 6. Categories (Note capitalization in DB schema)
  const categoriesData = [
    { id: 1, name: 'Dairy', shopId: 1 },
    { id: 2, name: 'Groceries ', shopId: 1 },
  ];

  // Assuming model is named 'Category' based on table name "Category"
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  // 7. Inventory Items
  const inventoryData = [
    {
      id: 1,
      item_name: 'Premium Milk',
      item_code: 'RICE-001',
      category: 'Dairy',
      brand: 'Organic Farms',
      default_quantity: 335.75,
      item_image: '/uploads/item-1764822948765-100369360.ico',
      default_unit_id: 4,
      original_price: 20,
      selling_price: 40,
      shopId: 1,
    },
    {
      id: 2,
      item_name: 'normal milk',
      item_code: 'NOR-001',
      category: 'Dairy',
      brand: 'Organic Farms',
      default_quantity: 1000,
      item_image: '/uploads/item-1765007510606-310952998.png',
      default_unit_id: 4,
      original_price: 20,
      selling_price: 50,
      shopId: 1,
    },
    {
      id: 3,
      item_name: 'Basmati Rice',
      item_code: 'RICE-002',
      category: 'Groceries ',
      brand: 'Basmati',
      default_quantity: 1000,
      item_image: '/uploads/item-1765457495020-977665380.png',
      default_unit_id: 1,
      original_price: 50,
      selling_price: 70,
      shopId: 1,
    },
    {
      id: 4,
      item_name: 'Desi milk ',
      item_code: 'MILK-003',
      category: 'Dairy',
      brand: 'Organic Farms',
      default_quantity: 999.99,
      item_image: null,
      default_unit_id: 4,
      original_price: 50,
      selling_price: 60,
      shopId: 1,
    },
  ];

  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  // 8. Shop Settings
  await prisma.shopSettings.upsert({
    where: { shopId: 1 },
    update: {},
    create: {
      shopId: 1,
      default_tax: 18,
      invoice_prefix: 'INV-',
      invoice_counter: 30,
      stock_deduction: true,
      hide_non_taxable: false,
      enable_buyback_exchange: true,
      price_column_label: 'vraj darji ₹',
    },
  });

  // 9. Invoices
  // Spread dates from November 2025 to December 12, 2025 (current date)
  // Includes examples of: Cash, EMI, Advanced payment methods
  const invoicesData = [
    // Regular Cash Payment - Paid
    { id: 1, invoice_number: 'INV-001', invoice_date: new Date('2025-11-05'), customer_name: "CRM Customer", subtotal: 400, total: 472, shopId: 1, userId: 2, payment_status: 'Paid', tax_percentage: 18, tax_amount: 72, rounded_total: 472, payment_method: 'Cash', amount_paid: 472, balance_due: 0 },

    // Regular Cash Payment - Paid
    { id: 3, invoice_number: 'INV-003', invoice_date: new Date('2025-11-10'), customer_name: 'mayank bhai', subtotal: 400, total: 472, shopId: 1, userId: 1, payment_status: 'Paid', tax_percentage: 18, tax_amount: 72, rounded_total: 472, payment_method: 'Cash', amount_paid: 472, balance_due: 0 },

    // Advanced Payment - Partial payment made
    { id: 4, invoice_number: 'INV-004', invoice_date: new Date('2025-11-15'), customer_name: 'mayank bhai', subtotal: 2000, total: 2360, shopId: 1, userId: 1, payment_status: 'Unpaid', tax_percentage: 18, tax_amount: 360, rounded_total: 2360, payment_method: 'Advanced', amount_paid: 1000, balance_due: 1360 },

    // EMI Payment - 6 months plan with interest
    // Total: 11800, Interest: 1416 (12% of 11800), Total with interest: 13216
    { id: 5, invoice_number: 'INV-005', invoice_date: new Date('2025-11-18'), customer_name: 'Rajesh Kumar', subtotal: 10000, total: 11800, shopId: 1, userId: 1, payment_status: 'Unpaid', tax_percentage: 18, tax_amount: 1800, rounded_total: 11800, payment_method: 'EMI', amount_paid: 0, balance_due: 13216, interest_percentage: 12, interest_amount: 1416, emi_months: 6 },

    // EMI Payment - 3 months plan with interest (first payment made)
    // Total: 17700, Interest: 1770 (10% of 17700), Total with interest: 19470, Paid: 5900, Balance: 13570
    { id: 6, invoice_number: 'INV-006', invoice_date: new Date('2025-11-20'), customer_name: 'Priya Sharma', subtotal: 15000, total: 17700, shopId: 1, userId: 2, payment_status: 'Unpaid', tax_percentage: 18, tax_amount: 2700, rounded_total: 17700, payment_method: 'EMI', amount_paid: 5900, balance_due: 13570, interest_percentage: 10, interest_amount: 1770, emi_months: 3 },

    // Advanced Payment - Full advance paid
    { id: 7, invoice_number: 'INV-007', invoice_date: new Date('2025-11-22'), customer_name: 'Amit Patel', subtotal: 5000, total: 5900, shopId: 1, userId: 1, payment_status: 'Paid', tax_percentage: 18, tax_amount: 900, rounded_total: 5900, payment_method: 'Advanced', amount_paid: 5900, balance_due: 0 },

    // EMI Payment - 12 months plan
    // Total: 29500, Interest: 4425 (15% of 29500), Total with interest: 33925
    { id: 8, invoice_number: 'INV-008', invoice_date: new Date('2025-11-25'), customer_name: 'Suresh Mehta', subtotal: 25000, total: 29500, shopId: 1, userId: 1, payment_status: 'Unpaid', tax_percentage: 18, tax_amount: 4500, rounded_total: 29500, payment_method: 'EMI', amount_paid: 0, balance_due: 33925, interest_percentage: 15, interest_amount: 4425, emi_months: 12 },

    // Advanced Payment - Large amount, partial advance
    { id: 24, invoice_number: 'INV-024', invoice_date: new Date('2025-12-05'), customer_name: "CRM Customer", subtotal: 40000, total: 47200, shopId: 1, userId: 1, payment_status: 'Unpaid', tax_percentage: 18, tax_amount: 7200, rounded_total: 47200, payment_method: 'Advanced', balance_due: 46200, amount_paid: 1000 },

    // Buyback invoice
    { id: 29, invoice_number: 'INV-029', invoice_date: new Date('2025-12-12'), customer_name: "CRM Customer", subtotal: 5000, total: 5900, shopId: 1, userId: 1, payment_status: 'Paid', tax_percentage: 18, tax_amount: 900, rounded_total: 5900, payment_method: 'Cash', amount_paid: 5900, balance_due: 0, buyback: true },
  ];

  // NOTE: For the seed to work perfectly with FKs, all invoices referenced in InvoiceItems/Payments must exist.
  // I am inserting a Loop for the remaining IDs based on the dump pattern to prevent FK errors, 
  // simplified with default placeholder data for the ones not explicitly detailed above.

  const allInvoiceIds = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];

  for (const invId of allInvoiceIds) {
    // Check if we defined specific data above, otherwise use generic paid placeholder matching the ID
    const specificData = invoicesData.find(i => i.id === invId);

    // Calculate date spread from November 1, 2025 to December 12, 2025 (42 days total)
    // This ensures different dates for visualization within the valid range
    let invoiceDate;
    if (!specificData) {
      // Spread across 42 days (Nov 1 - Dec 12, 2025)
      const daysFromStart = ((invId - 1) % 42); // 0-41 days
      const startDate = new Date('2025-11-01');
      invoiceDate = new Date(startDate);
      invoiceDate.setDate(startDate.getDate() + daysFromStart);

      // Ensure we don't go beyond December 12, 2025
      const maxDate = new Date('2025-12-12');
      if (invoiceDate > maxDate) {
        invoiceDate = maxDate;
      }
    } else {
      invoiceDate = specificData.invoice_date;
    }

    const baseAmount = 100 + (invId * 10);
    const taxAmount = baseAmount * 0.18;
    const totalAmount = baseAmount + taxAmount;
    const roundedTotal = Math.round(totalAmount);

    // Determine payment method and status for generic invoices
    let paymentMethod = 'Cash';
    let paymentStatus = invId % 3 === 0 ? 'Unpaid' : 'Paid';
    let amountPaid = paymentStatus === 'Paid' ? roundedTotal : 0;
    let balanceDue = paymentStatus === 'Paid' ? 0 : roundedTotal;
    let interestPercentage = 0;
    let interestAmount = 0;
    let emiMonths = null;

    // Add some variety for generic invoices
    if (invId % 7 === 0 && invId > 8) {
      // Some invoices with EMI
      paymentMethod = 'EMI';
      paymentStatus = 'Unpaid';
      interestPercentage = 12;
      emiMonths = 6;
      interestAmount = Math.round(totalAmount * (interestPercentage / 100));
      balanceDue = totalAmount + interestAmount;
      amountPaid = 0;
    } else if (invId % 5 === 0 && invId > 8) {
      // Some invoices with Advanced payment
      paymentMethod = 'Advanced';
      paymentStatus = 'Unpaid';
      amountPaid = Math.round(roundedTotal * 0.3); // 30% advance
      balanceDue = roundedTotal - amountPaid;
    }

    await prisma.invoice.upsert({
      where: { id: invId },
      update: {},
      create: specificData || {
        id: invId,
        invoice_number: `INV-${invId.toString().padStart(3, '0')}`,
        invoice_date: invoiceDate,
        customer_name: 'CRM Customer',
        subtotal: baseAmount,
        tax_percentage: 18,
        tax_amount: taxAmount,
        total: totalAmount,
        rounded_total: roundedTotal,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        interest_percentage: interestPercentage,
        interest_amount: interestAmount,
        emi_months: emiMonths,
        shopId: 1,
        userId: invId % 3 === 0 ? 2 : 1 // Vary users
      }
    })
  }


  // 10. Invoice Items
  // Items for various invoices including EMI and Advanced payment invoices
  const invoiceItemsData = [
    // Invoice 1 - Regular Cash Payment
    { id: 1, invoice_id: 1, item_id: 1, item_name: 'Premium Milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 10, price_per_unit: 40, item_total: 400, shopId: 1 },

    // Invoice 3 - Regular Cash Payment
    { id: 3, invoice_id: 3, item_id: 1, item_name: 'Premium Milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 10, price_per_unit: 40, item_total: 400, shopId: 1 },

    // Invoice 4 - Advanced Payment
    { id: 4, invoice_id: 4, item_id: 1, item_name: 'Premium Milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 50, price_per_unit: 40, item_total: 2000, shopId: 1 },

    // Invoice 5 - EMI Payment (6 months)
    { id: 5, invoice_id: 5, item_id: 3, item_name: 'Basmati Rice', unit_id: 1, unit_name: 'Kilogram', unit_symbol: 'kg', quantity: 200, price_per_unit: 50, item_total: 10000, shopId: 1 },

    // Invoice 6 - EMI Payment (3 months)
    { id: 6, invoice_id: 6, item_id: 1, item_name: 'Premium Milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 300, price_per_unit: 40, item_total: 12000, shopId: 1 },
    { id: 7, invoice_id: 6, item_id: 2, item_name: 'normal milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 60, price_per_unit: 50, item_total: 3000, shopId: 1 },

    // Invoice 7 - Advanced Payment (Full)
    { id: 8, invoice_id: 7, item_id: 2, item_name: 'normal milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 100, price_per_unit: 50, item_total: 5000, shopId: 1 },

    // Invoice 8 - EMI Payment (12 months)
    { id: 9, invoice_id: 8, item_id: 3, item_name: 'Basmati Rice', unit_id: 1, unit_name: 'Kilogram', unit_symbol: 'kg', quantity: 500, price_per_unit: 50, item_total: 25000, shopId: 1 },

    // Invoice 24 - Advanced Payment (Large)
    { id: 25, invoice_id: 24, item_id: 1, item_name: 'Premium Milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 1000, price_per_unit: 40, item_total: 40000, shopId: 1 },

    // Invoice 29 - Buyback
    { id: 30, invoice_id: 29, item_id: 2, item_name: 'normal milk', unit_id: 4, unit_name: 'Litre', unit_symbol: 'l', quantity: 100, price_per_unit: 50, item_total: 5000, shopId: 1 },
  ];

  for (const item of invoiceItemsData) {
    await prisma.invoiceItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  // 11. Invoice Payments
  // Payment history for various payment methods (Advanced, EMI, Cash)
  const paymentsData = [
    // Advanced Payment - Invoice 4 (INV-004)
    { id: 1, invoiceId: 4, amount: 1000, payment_method: 'Advanced', payment_date: new Date('2025-11-15'), note: 'Initial Advanced Payment' },
    { id: 2, invoiceId: 4, amount: 500, payment_method: 'Cash', payment_date: new Date('2025-11-20'), note: 'Second payment' },

    // EMI Payment - Invoice 5 (INV-005) - 6 months plan, first EMI payment
    // Total with interest: 13216, EMI per month: ~2203
    { id: 3, invoiceId: 5, amount: 2203, payment_method: 'EMI', payment_date: new Date('2025-11-18'), note: 'First EMI payment (Month 1 of 6)' },

    // EMI Payment - Invoice 6 (INV-006) - 3 months plan, first payment
    // Total with interest: 19470, EMI per month: ~6490, but first payment was 5900
    { id: 4, invoiceId: 6, amount: 5900, payment_method: 'EMI', payment_date: new Date('2025-11-20'), note: 'First EMI payment (Month 1 of 3)' },

    // Advanced Payment - Invoice 7 (INV-007) - Full advance
    { id: 5, invoiceId: 7, amount: 5900, payment_method: 'Advanced', payment_date: new Date('2025-11-22'), note: 'Full Advance Payment' },

    // EMI Payment - Invoice 8 (INV-008) - 12 months plan, first payment
    // Total with interest: 33925, EMI per month: ~2827
    { id: 6, invoiceId: 8, amount: 2827, payment_method: 'EMI', payment_date: new Date('2025-11-25'), note: 'First EMI payment (Month 1 of 12)' },
    { id: 7, invoiceId: 8, amount: 2827, payment_method: 'EMI', payment_date: new Date('2025-12-05'), note: 'Second EMI payment (Month 2 of 12)' },

    // Advanced Payment - Invoice 24 (INV-024)
    { id: 14, invoiceId: 24, amount: 1000, payment_method: 'Advanced', payment_date: new Date('2025-12-05'), note: 'Initial Advanced Payment' },

    // Additional EMI payment for Invoice 5 (second month)
    { id: 15, invoiceId: 5, amount: 2203, payment_method: 'EMI', payment_date: new Date('2025-12-10'), note: 'Second EMI payment (Month 2 of 6)' },

    // Additional EMI payment for Invoice 6 (second month)
    { id: 16, invoiceId: 6, amount: 6785, payment_method: 'EMI', payment_date: new Date('2025-12-12'), note: 'Second EMI payment (Month 2 of 3)' },
  ];

  for (const pay of paymentsData) {
    await prisma.invoicePayment.upsert({
      where: { id: pay.id },
      update: {},
      create: pay,
    });
  }

  // 12. Payrolls
  const payrollsData = [
    { id: 1, month: new Date('2025-11-01T00:00:00Z'), working_days: 30, present_days: 25, basic_salary: 10000, net_salary: 8333, status: 'pending', employeeId: 1, shopId: 1 },
  ];

  for (const pr of payrollsData) {
    await prisma.payroll.upsert({
      where: { id: pr.id },
      update: {},
      create: pr,
    });
  }

  // 13. Stock Entries
  // This tracks inventory movement
  const stockEntriesData = [
    { id: 1, itemId: 1, quantity: 1000, unitId: 4, stockType: 'in', pricePerUnit: 20, totalValue: 20000, notes: 'Initial Stock', shopId: 1 },
    { id: 2, itemId: 1, quantity: 10, unitId: 4, stockType: 'out', pricePerUnit: 40, totalValue: 400, notes: 'Sold via invoice INV-001', shopId: 1 },
    // ... skipping intermediate entries for brevity, inserting latest
    { id: 34, itemId: 3, quantity: 1000, unitId: 1, stockType: 'in', pricePerUnit: 50, totalValue: 50000, notes: 'Initial Stock', shopId: 1 },
    { id: 35, itemId: 4, quantity: 999.99, unitId: 4, stockType: 'in', pricePerUnit: 50, totalValue: 49999.5, notes: 'Initial Stock', shopId: 1 },
  ];

  for (const stock of stockEntriesData) {
    await prisma.stockEntry.upsert({
      where: { id: stock.id },
      update: {},
      create: stock,
    });
  }

  // 13.5 Restaurant Menu (for restaurant shopId: 2)
  const menuCategoriesData = [
    { id: 1, name: 'Starters', food_type: 'veg', shopId: 2 },
    { id: 2, name: 'Main Course', food_type: 'non_veg', shopId: 2 },
    { id: 3, name: 'Desserts', food_type: 'veg', shopId: 2 },
    { id: 4, name: 'Beverages', food_type: 'beverage', shopId: 2 },
  ];

  for (const cat of menuCategoriesData) {
    await prisma.restaurantMenuCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  const menuSubCategoriesData = [
    { id: 1, name: 'Soups', categoryId: 1, shopId: 2 },
    { id: 2, name: 'Grill', categoryId: 2, shopId: 2 },
    { id: 3, name: 'Ice Cream', categoryId: 3, shopId: 2 },
    { id: 4, name: 'Cold Drinks', categoryId: 4, shopId: 2 },
  ];

  for (const sub of menuSubCategoriesData) {
    await prisma.restaurantMenuSubCategory.upsert({
      where: { id: sub.id },
      update: {},
      create: sub,
    });
  }

  const menuAddOnsData = [
    { id: 1, name: 'Extra Cheese', price: 30, shopId: 2 },
    { id: 2, name: 'Extra Sauce', price: 15, shopId: 2 },
    { id: 3, name: 'Double Topping', price: 40, shopId: 2 },
  ];

  for (const addOn of menuAddOnsData) {
    await prisma.restaurantMenuAddOn.upsert({
      where: { id: addOn.id },
      update: {},
      create: addOn,
    });
  }

  const menuItemsData = [
    {
      id: 1,
      name: 'Tomato Soup',
      description: 'Fresh tomato soup with herbs',
      price: 120,
      original_price: 150,
      food_type: 'veg',
      categoryId: 1,
      subCategoryId: 1,
      service_types: ['dine_in', 'take_away'],
      add_on_ids: [2],
      is_available: true,
      image: null,
      shopId: 2,
    },
    {
      id: 2,
      name: 'Grilled Chicken',
      description: 'Juicy grilled chicken with spices',
      price: 280,
      original_price: 320,
      food_type: 'non_veg',
      categoryId: 2,
      subCategoryId: 2,
      service_types: ['dine_in', 'delivery'],
      add_on_ids: [1, 2],
      is_available: true,
      image: null,
      shopId: 2,
    },
    {
      id: 3,
      name: 'Vanilla Ice Cream',
      description: 'Classic vanilla scoop',
      price: 90,
      original_price: 110,
      food_type: 'veg',
      categoryId: 3,
      subCategoryId: 3,
      service_types: ['dine_in', 'take_away'],
      add_on_ids: [],
      is_available: true,
      image: null,
      shopId: 2,
    },
    {
      id: 4,
      name: 'Cold Coffee',
      description: 'Chilled coffee with milk',
      price: 150,
      original_price: 180,
      food_type: 'beverage',
      categoryId: 4,
      subCategoryId: 4,
      service_types: ['dine_in', 'take_away', 'delivery'],
      add_on_ids: [3],
      is_available: true,
      image: null,
      shopId: 2,
    },
  ];

  for (const item of menuItemsData) {
    await prisma.restaurantMenuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  // 14. Reset Sequences (Optional but recommended for Postgres)
  // Since we hardcoded IDs, the auto-increment counter might be lagging behind.
  // This raw SQL updates the sequences to the next available ID.
  try {
    const sequences = [
      'users_id_seq', 'shops_id_seq', 'employees_id_seq', 'Category_id_seq',
      'inventory_items_id_seq', 'invoices_id_seq', 'invoice_items_id_seq',
      'stock_entries_id_seq', 'shop_settings_id_seq', 'invoice_payments_id_seq'
    ];

    for (const seq of sequences) {
      // This is PostgreSQL specific syntax
      await prisma.$executeRawUnsafe(`SELECT setval('public."${seq}"', (SELECT MAX(id) FROM public."${seq.replace('_id_seq', '')}") + 1);`);
    }
    // Handle special case where table name "Category" is quoted in your dump but sequence might vary
    await prisma.$executeRawUnsafe(`SELECT setval('public."Category_id_seq"', (SELECT MAX(id) FROM public."Category") + 1);`);

    console.log("Sequences updated.");
  } catch (e) {
    console.log("Skipping sequence reset (might not be supported in this environment or table names differ).", e.message);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
