// Public routes - only these will be accessible without authentication
export const PUBLIC_ROUTES = [
  '/',
  '/order',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/privacy',
  '/auth/terms',
  '/auth/support',
  '/auth/seller-dashboard',
  '/auth/get-started',
  '/lp'
];

// Routes that require shop-owner role
export const SHOP_OWNER_ROUTES = [
  '/hrms',
];

// Helper function to check if route is public
export const isPublicRoute = (pathname) => {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Check if it's a seller-dashboard with password (dynamic route)
  if (pathname.startsWith('/auth/seller-dashboard/')) {
    return true;
  }

  // Check for public module documentation pages
  const publicSlugs = [
    // Services
    'client-crm', 'project-tracking', 'hrms-attendance', 'accounting-finance',
    // Restaurants
    'table-management', 'kitchen-kot', 'running-orders', 'billing-reports',
    // Retailers
    'smart-inventory', 'emi-payment-plans', 'gst-invoicing', 'sales-analytics'
  ];

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 2 && ['services', 'restaurants', 'retailers'].includes(parts[0])) {
    return publicSlugs.includes(parts[1]);
  }

  return false;
};

// Helper function to check if route requires shop owner
export const requiresShopOwner = (pathname) => {
  return SHOP_OWNER_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

// Special routes that might need different handling
export const SPECIAL_ROUTES = {
  HOME: '/',
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500'
};

// Redirect routes used by auth guard / app level redirects
export const REDIRECT_ROUTES = {
  unauthenticated: '/',
  authenticated: '/dashboard',
  retailers: '/dashboard',
  restaurants: '/restaurant',
  services: '/services',
  logout: '/'
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isAdminRole = (role) => {
  const r = normalizeRole(role);
  return (
    r === 'admin' ||
    r === 'administrator' ||
    r === 'owner' ||
    r === 'shop_owner' ||
    r === 'restaurant_owner' ||
    r.endsWith('_owner')
  );
};

const isChefRole = (role) => {
  const r = normalizeRole(role);
  return r === 'chef' || r === 'cook' || r === 'kitchen';
};

const getRestaurantRedirectByRole = (role) => {
  if (isAdminRole(role)) return '/restaurant'; // admin dashboard only
  if (isChefRole(role)) return '/restaurant/hrms/attendance';
  return '/restaurant/hrms'; // staff/manager default
};

// Helper to get redirect route based on userType (and optional role).
export const getRedirectByUserType = (userType, role) => {
  if (userType === 'restaurants') {
    return role ? getRestaurantRedirectByRole(role) : REDIRECT_ROUTES.restaurants;
  }
  if (userType === 'services') {
    return REDIRECT_ROUTES.services;
  }
  return REDIRECT_ROUTES.retailers;
};

// Helper to get auth redirect target
export const getAuthRedirect = (isAuthenticated) => {
  return isAuthenticated ? REDIRECT_ROUTES.authenticated : REDIRECT_ROUTES.unauthenticated;
};
