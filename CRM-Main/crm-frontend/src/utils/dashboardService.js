import apiClient from "./apiClient";
import apiRoutes from "./apiRoutes";

export const fetchDashboardData = async () => {
  try {
    const [summary, chart, topItems, invoices] = await Promise.all([
      apiClient.get(apiRoutes.dashboard.summary),
      apiClient.get(apiRoutes.dashboard.chart),
      apiClient.get(apiRoutes.dashboard.topItems),
      apiClient.get(apiRoutes.dashboard.recentInvoices),
    ]);

    return {
      summary: summary.data,
      chart: chart.data,
      topItems: topItems.data,
      invoices: invoices.data,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error; // Let caller decide how to handle
  }
};
