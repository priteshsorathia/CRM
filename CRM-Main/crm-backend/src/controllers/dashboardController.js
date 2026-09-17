const prisma = require('../lib/prisma');
const { startOfDay, startOfWeek, startOfMonth, subMonths, format, subDays, endOfMonth } = require('date-fns');

const getDashboardData = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = req.user.role;
    // ✅ Receive excludeNonTaxable and selectedMonth params
    const { timeframe = 'week', view = 'revenue', startDate, endDate, selectedDate, selectedMonth, excludeNonTaxable } = req.query;

    if (!shopId) return res.status(400).json({ success: false, error: 'Shop ID required' });

    // Determine access scope
    const isAdmin = role === 'admin' || role === 'shop_owner';

    // Base filtering condition
    const invoiceWhere = {
      shopId: parseInt(shopId),
      ...(isAdmin ? {} : { userId: req.user.id })
    };

    // ✅ LOGIC: If excludeNonTaxable is true, filter out invoices where tax is 0 or null
    if (excludeNonTaxable === 'true') {
        invoiceWhere.tax_percentage = { gt: 0 };
    }

    // ✅ UPDATED: Date range filtering with single date and month support
    let isSpecificDateSelected = false;

    // 1. Single Date
    if (selectedDate) {
      isSpecificDateSelected = true;
      const start = new Date(selectedDate);
      const end = new Date(selectedDate);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      invoiceWhere.invoice_date = {
        gte: start,
        lte: end
      };
    } 
    // 2. ✅ Month Selection
    else if (selectedMonth) {
      isSpecificDateSelected = true;
      const [year, month] = selectedMonth.split('-'); // Format YYYY-MM
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = endOfMonth(start);
      end.setHours(23, 59, 59, 999);

      invoiceWhere.invoice_date = {
        gte: start,
        lte: end
      };
    } 
    // 3. Custom Range
    else if (startDate && endDate) {
      // Date range selection
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      invoiceWhere.invoice_date = {
        gte: start,
        lte: end
      };
    }

    // --- 1. Fetch Invoices (Latest First) ---
    const allInvoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        invoice_number: true,
        customer_name: true,
        total: true,
        tax_percentage: true,
        invoice_date: true,
        created_at: true,
        invoice_items: {
          select: {
            quantity: true,
            price_per_unit: true,
            inventory_item: {
              select: {
                item_name: true,
                original_price: true
              }
            }
          }
        }
      },
      orderBy: { invoice_date: 'desc' } // ✅ Order by invoice date for proper visualization
    });

    // Helper: Calculate Value based on View Mode
    const getValue = (invoice) => {
      if (view === 'revenue') return invoice.total;
      
      // Profit = (Selling Price - Cost Price) * Qty
      let cost = 0;
      let sale = 0;
      invoice.invoice_items.forEach(item => {
        sale += (item.quantity * item.price_per_unit);
        const originalPrice = item.inventory_item?.original_price || 0;
        cost += (item.quantity * originalPrice);
      });
      return sale - cost;
    };

    // --- 2. Calculate Summaries (For Cards) ---
    let totalVal = 0;
    let todayInvoicesCount = 0;
    let todayRevenue = 0;

    allInvoices.forEach(inv => {
      const val = getValue(inv);
      totalVal += val;
      todayInvoicesCount++;
      
      if (view === 'revenue') {
        todayRevenue += inv.total;
      } else {
        let sale = 0;
        inv.invoice_items.forEach(item => {
          sale += (item.quantity * item.price_per_unit);
        });
        todayRevenue += sale;
      }
    });

    // ✅ UPDATED: For week and month summaries, only calculate if not in specific date mode
    let weekVal = 0, monthVal = 0;
    
    if (!isSpecificDateSelected && !startDate && !endDate) {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);

      // Construct WHERE clause for range totals (must also respect hidden tax logic)
      const rangeWhere = {
        shopId: parseInt(shopId),
        ...(isAdmin ? {} : { userId: req.user.id })
      };

      if (excludeNonTaxable === 'true') {
        rangeWhere.tax_percentage = { gt: 0 };
      }

      // Fetch all invoices for week/month calculation (without date filter)
      const allInvoicesForRange = await prisma.invoice.findMany({
        where: rangeWhere,
        select: {
          total: true,
          invoice_date: true,
          invoice_items: {
            select: {
              quantity: true,
              price_per_unit: true,
              inventory_item: {
                select: {
                  original_price: true
                }
              }
            }
          }
        }
      });

      allInvoicesForRange.forEach(inv => {
        const val = getValue(inv);
        const d = new Date(inv.invoice_date);
        if (d >= weekStart) weekVal += val;
        if (d >= monthStart) monthVal += val;
      });
    }

    // --- 3. Chart Data ---
    const groupedData = {};
    let startDateForChart;
    let endDateForChart;
    
    // ✅ Determine Start Date for Charts
    if (selectedDate) {
      startDateForChart = new Date(selectedDate);
      startDateForChart.setHours(0, 0, 0, 0);
      endDateForChart = new Date(selectedDate);
      endDateForChart.setHours(23, 59, 59, 999);
    } else if (selectedMonth) {
      // ✅ Month Selection
      const [year, month] = selectedMonth.split('-');
      startDateForChart = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDateForChart = endOfMonth(startDateForChart);
      endDateForChart.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {
      startDateForChart = new Date(startDate);
      startDateForChart.setHours(0, 0, 0, 0);
      endDateForChart = new Date(endDate);
      endDateForChart.setHours(23, 59, 59, 999);
    } else {
      // Default Timeframes
      const now = new Date();
      endDateForChart = new Date(now);
      endDateForChart.setHours(23, 59, 59, 999);
      
      if (timeframe === 'day') {
        startDateForChart = startOfDay(now);
      } else if (timeframe === 'week') {
        // ✅ Weekly: Current date going back 7 days (past week)
        startDateForChart = subDays(now, 6); // 6 days ago + today = 7 days total
        startDateForChart.setHours(0, 0, 0, 0);
      } else if (timeframe === 'month') {
        startDateForChart = startOfMonth(now);
      } else {
        startDateForChart = subMonths(now, 6);
      }
    }

    const chartInvoices = allInvoices.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return invDate >= startDateForChart && invDate <= endDateForChart;
    });

    // ✅ Initialize slots based on timeframe
    if (selectedDate) {
      // Initialize Hourly slots for single date
      for (let hour = 0; hour < 24; hour++) {
        const label = format(new Date(2024, 0, 1, hour), 'h a');
        groupedData[label] = 0;
      }
    } else if (timeframe === 'week' && !selectedMonth && !startDate && !endDate) {
      // ✅ Initialize all 7 days for weekly view (past week from current date)
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const label = format(date, 'MMM dd'); // Dec 25, Dec 26, etc. (more clear for weekly)
        groupedData[label] = 0;
      }
    }

    // Grouping Logic
    chartInvoices.forEach(inv => {
      const date = new Date(inv.invoice_date);
      let label;

      // ✅ Chart Labelling Logic
      if (selectedDate) {
        label = format(date, 'h a'); // Hourly: 10 AM
      } else if (selectedMonth) {
        label = format(date, 'MMM dd'); // ✅ Daily in Month: Dec 01
      } else if (timeframe === 'day') {
        label = format(date, 'h a'); // Hourly
      } else if (timeframe === 'week') {
        label = format(date, 'MMM dd'); // ✅ Daily with date: Dec 25 (past 7 days)
      } else {
        label = format(date, 'MMM dd'); // Daily: Dec 03
      }

      if (!groupedData[label]) groupedData[label] = 0;
      groupedData[label] += getValue(inv);
    });

    // Ensure chart labels are chronological
    const labels = Object.keys(groupedData);
    
    if (selectedDate) {
      // Sort Hourly
      labels.sort((a, b) => {
        const timeA = new Date(`2024-01-01 ${a}`).getTime();
        const timeB = new Date(`2024-01-01 ${b}`).getTime();
        return timeA - timeB;
      });
    } else if (selectedMonth) {
      // ✅ Sort Daily (MMM dd) for Month View
      labels.sort((a, b) => {
        const dateA = new Date(`${a} 2024`).getTime();
        const dateB = new Date(`${b} 2024`).getTime();
        return dateA - dateB;
      });
    } else if (timeframe === 'week' && !selectedMonth && !startDate && !endDate) {
      // ✅ Sort Weekly dates chronologically (MMM dd format)
      labels.sort((a, b) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const dateA = new Date(`${a} ${currentYear}`).getTime();
        const dateB = new Date(`${b} ${currentYear}`).getTime();
        return dateA - dateB;
      });
    } else if (!startDate && !endDate && timeframe !== 'week' && timeframe !== 'day') {
       labels.reverse();
    }
    
    const dataPoints = labels.map(label => groupedData[label]);

    // --- 4. Top Items ---
    const itemMap = {};
    allInvoices.forEach(inv => {
      inv.invoice_items.forEach(item => {
        // Skip items that have been deleted from inventory
        if (!item.inventory_item) return;

        const name = item.inventory_item.item_name;
        const item_id = item.inventory_item.id; // Passing item_id helps frontend match correctly

        if (!itemMap[name]) itemMap[name] = { name, item_id, qty: 0, revenue: 0 };
        
        itemMap[name].qty += item.quantity;
        itemMap[name].revenue += (item.quantity * item.price_per_unit);
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    if (topItems.length === 0) {
      topItems.push({ name: 'No items', qty: 0, revenue: 0 });
    }

    // --- 5. Recent Invoices ---
    const recentInvoices = allInvoices.slice(0, 5).map(inv => ({
      id: inv.id,
      number: inv.invoice_number,
      customer: inv.customer_name,
      total: inv.total,
      tax_percentage: inv.tax_percentage,
      date: inv.invoice_date
    }));

    // --- 6. User-specific data ---
    const userData = isAdmin ? null : {
      todayRevenue: todayRevenue,
      todayInvoicesCount: todayInvoicesCount,
      userId: req.user.id,
      userName: req.user.name,
      username: req.user.username
    };

    res.json({
      success: true,
      data: {
        summary: { 
          total: totalVal, 
          day: totalVal, 
          week: weekVal, 
          month: monthVal 
        },
        chart: { labels, data: dataPoints },
        topItems,
        recentInvoices,
        userData,
        isAdmin,
        appliedFilters: {
          timeframe: selectedDate ? 'single_day' : (selectedMonth ? 'month_view' : timeframe),
          selectedDate: selectedDate || null,
          selectedMonth: selectedMonth || null,
          excludeNonTaxable
        }
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
};

// EMI Dashboard Data
const getEmiDashboardData = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = req.user.role;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'Shop ID required' });
    }

    // Determine access scope
    const isAdmin = role === 'admin' || role === 'shop_owner';

    // Base filtering condition for EMI invoices
    const invoiceWhere = {
      shopId: parseInt(shopId),
      payment_method: 'EMI',
      ...(isAdmin ? {} : { userId: req.user.id })
    };

    // Fetch all EMI invoices with necessary fields
    const emiInvoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        invoice_number: true,
        total: true,
        balance_due: true,
        amount_paid: true,
        interest_amount: true,
        interest_percentage: true,
        emi_months: true,
        invoice_date: true,
        customer_name: true,
        payment_status: true
      },
      orderBy: { invoice_date: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalEmiInvoices: emiInvoices.length,
      totalEmiAmount: 0,
      activeEmiPlans: 0,
      monthlyEmiCollection: 0, // Base total / months (matches frontend)
      monthlyEmiCollectionWithInterest: 0, // (Total + Interest) / months (correct calculation)
      totalOutstanding: 0,
      totalInterest: 0,
      totalWithInterest: 0
    };

    emiInvoices.forEach(inv => {
      const total = parseFloat(inv.total) || 0;
      const interestAmount = parseFloat(inv.interest_amount) || 0;
      const balanceDue = parseFloat(inv.balance_due) || 0;
      const emiMonths = parseInt(inv.emi_months) || 1;
      
      // Total amount (base invoice total) - matches frontend calculation
      stats.totalEmiAmount += total;
      
      // Total with interest (for reference)
      const totalWithInterest = total + interestAmount;
      stats.totalWithInterest += totalWithInterest;
      stats.totalInterest += interestAmount;
      
      // Active plans (with outstanding balance)
      if (balanceDue > 0) {
        stats.activeEmiPlans += 1;
      }
      
      // Monthly collection: Total / EMI months (matches frontend calculation)
      // Note: Frontend uses invoice.total, not (total + interest)
      if (emiMonths > 0) {
        stats.monthlyEmiCollection += (total / emiMonths);
        // Correct calculation: (Total + Interest) / months
        stats.monthlyEmiCollectionWithInterest += (totalWithInterest / emiMonths);
      }
      
      // Total outstanding balance
      stats.totalOutstanding += balanceDue;
    });

    // Round values for cleaner display
    stats.totalEmiAmount = Math.round(stats.totalEmiAmount * 100) / 100;
    stats.monthlyEmiCollection = Math.round(stats.monthlyEmiCollection * 100) / 100;
    stats.monthlyEmiCollectionWithInterest = Math.round(stats.monthlyEmiCollectionWithInterest * 100) / 100;
    stats.totalOutstanding = Math.round(stats.totalOutstanding * 100) / 100;
    stats.totalInterest = Math.round(stats.totalInterest * 100) / 100;
    stats.totalWithInterest = Math.round(stats.totalWithInterest * 100) / 100;

    res.json({
      success: true,
      data: {
        stats,
        invoices: emiInvoices.map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          total: parseFloat(inv.total) || 0,
          interest_amount: parseFloat(inv.interest_amount) || 0,
          total_with_interest: (parseFloat(inv.total) || 0) + (parseFloat(inv.interest_amount) || 0),
          emi_months: parseInt(inv.emi_months) || 0,
          monthly_emi: parseInt(inv.emi_months) > 0 
            ? Math.round(((parseFloat(inv.total) || 0) + (parseFloat(inv.interest_amount) || 0)) / parseInt(inv.emi_months))
            : 0,
          amount_paid: parseFloat(inv.amount_paid) || 0,
          balance_due: parseFloat(inv.balance_due) || 0,
          payment_status: inv.payment_status,
          invoice_date: inv.invoice_date,
          interest_percentage: parseFloat(inv.interest_percentage) || 0
        }))
      }
    });

  } catch (error) {
    console.error('EMI Dashboard Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch EMI dashboard data',
      details: error.message 
    });
  }
};

module.exports = { getDashboardData, getEmiDashboardData };