const { externalApi } = require('../../lib/externalApi');

// Normalize external lead to match our dashboard format
const normalizeLead = (l, index) => ({
  id: l.id || `ext-ld-${index}`,
  _rawId: l.id,                         // keep raw ID for accurate delete
  serialId: l.id || index + 1,
  fullName: l.fullname || l.fullName || 'Unknown',
  email: l.email || '',
  phone: l.phone || '',
  businessName: l.business_name || l.businessName || '—',
  businessType: l.business_type || l.businessType || '—',
  location: l.business_location || l.location || '—',
  message: l.message || '',
  status: 'New',
  createdAt: l.created_at || l.createdAt || new Date().toISOString(),
  updatedAt: l.updated_at || l.updatedAt || new Date().toISOString()
});

// Create a new lead (POST to external)
const createLead = async (data) => {
  const { fullName, email, phone, businessType, businessName, location, message } = data;
  
  const response = await externalApi.post('/api/get-started/get-started/submit', {
    fullname: fullName,
    email,
    phone,
    business_type: businessType,
    business_name: businessName,
    business_location: location,
    message
  });
  
  return response.data;
};

// Get all leads (GET from external)
const getAllLeads = async ({ search, status, page = 1, limit = 50 } = {}) => {
  const q = search || '';
  
  const response = await externalApi.get('/api/get-started/get-started/requests', {
    params: { q, page, limit }
  });
  
  const rawData = response.data.data || [];
  const leads = rawData.map((l, i) => normalizeLead(l, i));
  const total = response.data.meta?.total || leads.length;

  return { leads, total };
};

// Get lead by ID
const getLeadById = async (id) => {
  let numericId = id;
  if (typeof id === 'string' && id.startsWith('ext-ld-')) {
    numericId = id.replace('ext-ld-', '');
  } else if (typeof id === 'string' && id.startsWith('LD-')) {
    numericId = id.split('-')[1].replace(/^0+/, '');
  }

  const response = await externalApi.get(`/api/get-started/get-started/requests/${numericId}`);
  const data = response.data.data || response.data;
  
  if (!data) return null;
  return normalizeLead(data, 0);
};

// Update a lead's status (NOT supported by external API)
const updateLeadStatus = async (id, status) => {
  throw new Error('Status management for leads is not supported by the external service.');
};

// Delete a lead via external API
const deleteLead = async (id) => {
  // Extract numeric/raw ID from any prefixed format
  let numericId = id;
  if (typeof id === 'string' && id.startsWith('ext-ld-')) {
    numericId = id.replace('ext-ld-', '');
  } else if (typeof id === 'string' && id.startsWith('LD-')) {
    numericId = id.split('-')[1].replace(/^0+/, '');
  }

  // Try the user-provided endpoint first
  const urlsToTry = [
    `/get-started/requests/${numericId}`,
    `/api/get-started/get-started/requests/${numericId}`,
    `/api/get-started/requests/${numericId}`,
  ];

  let lastError;
  for (const url of urlsToTry) {
    try {
      console.log(`[DELETE LEAD] Trying: DELETE ${url}`);
      await externalApi.delete(url);
      console.log(`[DELETE LEAD] Success: ${url}`);
      return { success: true };
    } catch (err) {
      console.warn(`[DELETE LEAD] Failed (${err.response?.status}): ${url}`);
      lastError = err;
      if (err.response?.status !== 404) break; // Only retry on 404
    }
  }
  throw lastError;
};

// Stats
const getLeadStats = async () => {
  const { total } = await getAllLeads({ limit: 1 });
  return {
    total,
    new: total,
    contacted: 0,
    qualified: 0,
    lost: 0
  };
};

module.exports = { createLead, getAllLeads, updateLeadStatus, deleteLead, getLeadStats, getLeadById };
