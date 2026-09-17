const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

// 1. Save Draft Invoice
const saveDraftInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const {
      invoice_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_gst,
      invoice_date,
      tax,
      discount,
      discount_type,
      discount_amount,
      making_charges,
      payment_method,
      items,
      subtotal,
      tax_amount,
      total,
      payment_status,
      interest_percentage,
      interest_amount,
      emi_months,
      amount_paid,
      exchange,
      buyback,
      notes
    } = req.body;

    if (!customer_name || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and items are required'
      });
    }

    const rounded_total = Math.round(total);
    const round_off = rounded_total - total;

    const result = await prisma.$transaction(async (tx) => {
      const draftInvoice = await tx.draftInvoice.create({
        data: {
          invoice_number: invoice_number || null,
          customer_name,
          customer_phone: customer_phone || null,
          customer_address: customer_address || null,
          customer_gst: customer_gst || null,
          invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
          subtotal: parseFloat(subtotal),
          tax_percentage: parseFloat(tax) || 0,
          tax_amount: parseFloat(tax_amount) || 0,
          discount: parseFloat(discount) || 0,
          discount_type: discount_type || 'percentage',
          discount_amount: parseFloat(discount_amount) || 0,
          making_charges: parseFloat(making_charges) || 0,
          total: parseFloat(total),
          rounded_total: rounded_total,
          round_off: round_off,
          payment_method: payment_method || 'Cash',
          payment_status: payment_status || 'Paid',
          amount_paid: parseFloat(amount_paid) || 0,
          balance_due: parseFloat(total) - (parseFloat(amount_paid) || 0),
          interest_percentage: parseFloat(interest_percentage) || 0,
          interest_amount: parseFloat(interest_amount) || 0,
          emi_months: parseInt(emi_months) || 0,
          exchange: exchange === true || exchange === 'true',
          buyback: buyback === true || buyback === 'true',
          notes: notes || null,
          shopId,
          userId: req.user.id,
          draft_items: {
            create: items.map(item => ({
              item_id: item.item_id || null,
              item_name: item.item_name,
              unit_id: item.unit_id,
              unit_name: item.unit_name || '',
              unit_symbol: item.unit_symbol || '',
              quantity: parseFloat(item.quantity),
              price_per_unit: parseFloat(item.price_per_unit),
              item_total: parseFloat(item.item_total),
              shopId
            }))
          }
        },
        include: { draft_items: true }
      });

      // If we reserved an invoice number for this draft, advance the invoice counter
      if (invoice_number) {
        await tx.shopSettings.upsert({
          where: { shopId },
          update: { invoice_counter: { increment: 1 } },
          create: {
            shopId,
            invoice_counter: 2,
            invoice_prefix: 'INV-',
            default_tax: 0.0,
            stock_deduction: true
          }
        });
      }

      return draftInvoice;
    });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'DRAFT_INVOICE_CREATE',
        `Created draft invoice for customer ${customer_name}`,
        'Invoice',
        'Success'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Draft invoice saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error saving draft invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save draft invoice'
    });
  }
};

// 2. Get Draft Invoice by ID
const getDraftInvoiceById = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const draftId = parseInt(req.params.id);

    if (isNaN(draftId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid draft invoice ID'
      });
    }

    const draftInvoice = await prisma.draftInvoice.findFirst({
      where: {
        id: draftId,
        shopId: shopId
      },
      include: {
        draft_items: {
          include: {
            unit: true,
            inventory_item: true
          }
        },
        shop: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (!draftInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Draft invoice not found'
      });
    }

    res.json({
      success: true,
      data: draftInvoice
    });
  } catch (error) {
    console.error('Error fetching draft invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch draft invoice'
    });
  }
};

// 3. Get All Draft Invoices by Shop ID
const getAllDraftInvoices = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const {
      page = 1,
      limit = 20,
      search = '',
      customer_name
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = {
      shopId: shopId
    };

    if (search) {
      whereCondition.OR = [
        { customer_name: { contains: search, mode: 'insensitive' } },
        { customer_phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (customer_name) {
      whereCondition.customer_name = customer_name;
    }

    const [draftInvoices, totalCount] = await Promise.all([
      prisma.draftInvoice.findMany({
        where: whereCondition,
        include: {
          draft_items: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.draftInvoice.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: draftInvoices,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching draft invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch draft invoices'
    });
  }
};

// 4. Delete Draft Invoice
const deleteDraftInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const draftId = parseInt(req.params.id);

    if (isNaN(draftId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid draft invoice ID'
      });
    }

    const draftInvoice = await prisma.draftInvoice.findFirst({
      where: {
        id: draftId,
        shopId: shopId
      }
    });

    if (!draftInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Draft invoice not found'
      });
    }

    await prisma.draftInvoice.delete({
      where: { id: draftId }
    });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'DRAFT_INVOICE_DELETE',
        `Deleted draft invoice for customer ${draftInvoice.customer_name}`,
        'Invoice',
        'Success'
      );
    }

    res.json({
      success: true,
      message: 'Draft invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft invoice'
    });
  }
};

// 5. Complete Draft Invoice (Move to Invoice and Delete Draft)
const completeDraftInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const draftId = parseInt(req.params.id);
    const { invoice_number } = req.body; // Invoice number from frontend

    if (isNaN(draftId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid draft invoice ID'
      });
    }

    // Fetch draft invoice with items
    const draftInvoice = await prisma.draftInvoice.findFirst({
      where: {
        id: draftId,
        shopId: shopId
      },
      include: {
        draft_items: true
      }
    });

    if (!draftInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Draft invoice not found'
      });
    }

    const finalInvoiceNumber = invoice_number || draftInvoice.invoice_number;
    if (!finalInvoiceNumber) {
      return res.status(400).json({
        success: false,
        error: 'Invoice number is required'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Calculate payment status
      let status = draftInvoice.payment_status || "Paid";
      let calculatedAmountPaid = draftInvoice.amount_paid || 0;
      let balanceDue = draftInvoice.balance_due || 0;

      if (draftInvoice.payment_method === 'Advanced') {
        calculatedAmountPaid = parseFloat(draftInvoice.amount_paid) || 0;
        balanceDue = parseFloat(draftInvoice.total) - calculatedAmountPaid;
        status = balanceDue <= 0 ? "Paid" : "Unpaid";
      } else if (draftInvoice.payment_method === 'EMI') {
        calculatedAmountPaid = 0;
        balanceDue = parseFloat(draftInvoice.total);
        status = "Unpaid";
      } else if (status === "Paid") {
        calculatedAmountPaid = parseFloat(draftInvoice.total);
        balanceDue = 0;
      } else {
        calculatedAmountPaid = 0;
        balanceDue = parseFloat(draftInvoice.total);
        status = "Unpaid";
      }

      // 1. Create Invoice from Draft
      const invoice = await tx.invoice.create({
        data: {
          invoice_number: finalInvoiceNumber,
          invoice_date: draftInvoice.invoice_date,
          customer_name: draftInvoice.customer_name,
          customer_phone: draftInvoice.customer_phone,
          customer_address: draftInvoice.customer_address,
          customer_gst: draftInvoice.customer_gst,
          subtotal: draftInvoice.subtotal,
          tax_percentage: draftInvoice.tax_percentage,
          tax_amount: draftInvoice.tax_amount,
          discount: draftInvoice.discount,
          discount_type: draftInvoice.discount_type || 'percentage',
          discount_amount: draftInvoice.discount_amount || 0,
          making_charges: draftInvoice.making_charges,
          total: draftInvoice.total,
          rounded_total: draftInvoice.rounded_total,
          round_off: draftInvoice.round_off,
          payment_method: draftInvoice.payment_method,
          payment_status: status,
          amount_paid: calculatedAmountPaid,
          balance_due: balanceDue,
          interest_percentage: draftInvoice.interest_percentage,
          interest_amount: draftInvoice.interest_amount,
          emi_months: draftInvoice.emi_months,
          exchange: draftInvoice.exchange,
          buyback: draftInvoice.buyback,
          notes: draftInvoice.notes,
          shopId,
          userId: req.user.id,
          invoice_items: {
            create: draftInvoice.draft_items.map(item => ({
              item_id: item.item_id || null,
              item_name: item.item_name,
              unit_id: item.unit_id,
              unit_name: item.unit_name,
              unit_symbol: item.unit_symbol,
              quantity: item.quantity,
              price_per_unit: item.price_per_unit,
              item_total: item.item_total,
              shopId
            }))
          }
        },
        include: { invoice_items: true }
      });

      // 2. IF ADVANCED PAYMENT: Create an initial Ledger Entry
      if (draftInvoice.payment_method === 'Advanced' && calculatedAmountPaid > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            amount: calculatedAmountPaid,
            payment_method: 'Advanced',
            note: 'Initial Advanced Payment',
            payment_date: new Date()
          }
        });
      }

      // 3. Stock Deduction
      const settings = await tx.shopSettings.findUnique({ where: { shopId } });
      const shouldDeductStock = settings?.stock_deduction ?? true;

      if (shouldDeductStock) {
        for (const item of draftInvoice.draft_items) {
          if (item.item_id) {
            await tx.stockEntry.create({
              data: {
                itemId: parseInt(item.item_id),
                quantity: parseFloat(item.quantity),
                unitId: parseInt(item.unit_id),
                stockType: 'out',
                pricePerUnit: parseFloat(item.price_per_unit),
                totalValue: parseFloat(item.item_total),
                notes: `Sold via invoice ${invoice_number}`,
                shopId
              }
            });
          }
        }
      }

      // 4. Delete Draft Invoice (cascade will delete items)
      await tx.draftInvoice.delete({
        where: { id: draftId }
      });

      return invoice;
    });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'DRAFT_INVOICE_COMPLETE',
        `Completed draft invoice and created invoice ${finalInvoiceNumber} for customer ${draftInvoice.customer_name}`,
        'Invoice',
        'Success'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Draft invoice completed and converted to invoice',
      data: result
    });
  } catch (error) {
    console.error('Error completing draft invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete draft invoice'
    });
  }
};

// 6. Update Draft Invoice
const updateDraftInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const draftId = parseInt(req.params.id);
    const {
      invoice_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_gst,
      invoice_date,
      tax,
      discount,
      discount_type,
      discount_amount,
      making_charges,
      payment_method,
      items,
      subtotal,
      tax_amount,
      total,
      payment_status,
      interest_percentage,
      interest_amount,
      emi_months,
      amount_paid,
      exchange,
      buyback,
      notes
    } = req.body;

    const draftInvoice = await prisma.draftInvoice.findFirst({
      where: {
        id: draftId,
        shopId: shopId
      }
    });

    if (!draftInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Draft invoice not found'
      });
    }

    const rounded_total = Math.round(total);
    const round_off = rounded_total - total;

    const result = await prisma.$transaction(async (tx) => {
      const shouldUpdateItems = Array.isArray(items) && items.length > 0;

      // If items are provided, remove old ones so we can replace with the new list
      if (shouldUpdateItems) {
        await tx.draftInvoiceItem.deleteMany({
          where: { draft_invoice_id: draftId }
        });
      }

      // Update draft invoice (fields fall back to existing values when not provided)
      const updatedDraft = await tx.draftInvoice.update({
        where: { id: draftId },
        data: {
          invoice_number: invoice_number || draftInvoice.invoice_number,
          customer_name: customer_name || draftInvoice.customer_name,
          customer_phone: customer_phone || draftInvoice.customer_phone,
          customer_address: customer_address || draftInvoice.customer_address,
          customer_gst: customer_gst || draftInvoice.customer_gst,
          invoice_date: invoice_date ? new Date(invoice_date) : draftInvoice.invoice_date,
          subtotal: subtotal !== undefined ? parseFloat(subtotal) : draftInvoice.subtotal,
          tax_percentage: tax !== undefined ? parseFloat(tax) : draftInvoice.tax_percentage,
          tax_amount: tax_amount !== undefined ? parseFloat(tax_amount) : draftInvoice.tax_amount,
          discount: discount !== undefined ? parseFloat(discount) : draftInvoice.discount,
          discount_type: discount_type !== undefined ? discount_type : draftInvoice.discount_type,
          discount_amount: discount_amount !== undefined ? parseFloat(discount_amount) : draftInvoice.discount_amount,
          making_charges: making_charges !== undefined ? parseFloat(making_charges) : draftInvoice.making_charges,
          total: total !== undefined ? parseFloat(total) : draftInvoice.total,
          rounded_total: total !== undefined ? rounded_total : draftInvoice.rounded_total,
          round_off: total !== undefined ? round_off : draftInvoice.round_off,
          payment_method: payment_method || draftInvoice.payment_method,
          payment_status: payment_status || draftInvoice.payment_status,
          amount_paid: amount_paid !== undefined ? parseFloat(amount_paid) : draftInvoice.amount_paid,
          balance_due: total !== undefined || amount_paid !== undefined
            ? (parseFloat(total ?? draftInvoice.total) - (parseFloat(amount_paid ?? draftInvoice.amount_paid) || 0))
            : draftInvoice.balance_due,
          interest_percentage: interest_percentage !== undefined ? parseFloat(interest_percentage) : draftInvoice.interest_percentage,
          interest_amount: interest_amount !== undefined ? parseFloat(interest_amount) : draftInvoice.interest_amount,
          emi_months: emi_months !== undefined ? parseInt(emi_months) : draftInvoice.emi_months,
          exchange: exchange !== undefined ? (exchange === true || exchange === 'true') : draftInvoice.exchange,
          buyback: buyback !== undefined ? (buyback === true || buyback === 'true') : draftInvoice.buyback,
          notes: notes !== undefined ? notes : draftInvoice.notes,
          userId: req.user.id,
          ...(shouldUpdateItems && {
            draft_items: {
              create: items.map(item => ({
                item_id: item.item_id || null,
                item_name: item.item_name,
                unit_id: item.unit_id,
                unit_name: item.unit_name || '',
                unit_symbol: item.unit_symbol || '',
                quantity: parseFloat(item.quantity),
                price_per_unit: parseFloat(item.price_per_unit),
                item_total: parseFloat(item.item_total),
                shopId
              }))
            }
          })
        },
        include: { draft_items: true }
      });

      return updatedDraft;
    });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'DRAFT_INVOICE_UPDATE',
        `Updated draft invoice for customer ${customer_name}`,
        'Invoice',
        'Success'
      );
    }

    res.json({
      success: true,
      message: 'Draft invoice updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating draft invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update draft invoice'
    });
  }
};

module.exports = {
  saveDraftInvoice,
  getDraftInvoiceById,
  getAllDraftInvoices,
  deleteDraftInvoice,
  completeDraftInvoice,
  updateDraftInvoice
};

