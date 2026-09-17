import { NextResponse } from 'next/server';

export function middleware(request) {
    // If someone opens a Next.js internal RSC URL (contains `_rsc`) directly in the browser,
    // the response can render as raw flight data. Redirect document navigations to the clean URL,
    // but do NOT interfere with real RSC fetches (Accept: text/x-component).
    const accept = request.headers.get('accept') || '';
    const isRscRequest = accept.includes('text/x-component');
    if (!isRscRequest && request.nextUrl.searchParams.has('_rsc')) {
        const url = request.nextUrl.clone();
        url.searchParams.delete('_rsc');
        return NextResponse.redirect(url);
    }

    const token = request.cookies.get('authToken')?.value;
    const { pathname } = request.nextUrl;

    if (pathname === '/lp') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Canonical Staff module path:
    // - User-facing URL: `/services/hrms/staff/*`
    // - Implementation route: `/services/employees/*`
    //
    // Keep the old URL working via redirect, and serve the new URL via rewrite.
    if (pathname.startsWith('/services/employees')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.replace('/services/employees', '/services/hrms/staff');
        return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/services/hrms/staff')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.replace('/services/hrms/staff', '/services/employees');
        return NextResponse.rewrite(url);
    }

    const publicSlugs = [
        'client-crm', 'project-tracking', 'hrms-attendance', 'accounting-finance',
        'table-management', 'kitchen-kot', 'running-orders', 'billing-reports',
        'smart-inventory', 'emi-payment-plans', 'gst-invoicing', 'sales-analytics'
    ];
    const pathParts = pathname.split('/').filter(Boolean);
    const isDocPage = pathParts.length === 2 && ['services', 'restaurants', 'retailers'].includes(pathParts[0]) && publicSlugs.includes(pathParts[1]);

    // Define public routes
    const isPublicRoute =
        pathname === '/lp' ||
        pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/get-started') ||
        pathname.startsWith('/auth/forgot-password') ||
        pathname.startsWith('/auth/reset-password') ||
        pathname.startsWith('/auth/support') ||
        pathname.startsWith('/auth/terms') ||
        pathname.startsWith('/auth/privacy') ||
        pathname.startsWith('/auth/seller-dashboard') ||
        pathname === '/restaurants-info' ||
        pathname === '/retailers-info' ||
        pathname === '/services-info' ||
        (pathname.startsWith('/order') && (request.nextUrl.searchParams.get('u') === 'qr' || request.nextUrl.searchParams.has('t'))) ||
        isDocPage;

    // Helper to decode token and get userType (edge runtime compatible)
    const decodeTokenPayload = (token) => {
        try {
            // Simple base64 decode for edge runtime
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const binaryString = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const decoder = new TextDecoder();
            const jsonPayload = decoder.decode(binaryString);
            return JSON.parse(jsonPayload);
        } catch {
            return null;
        }
    };

    const tokenPayload = token ? decodeTokenPayload(token) : null;
    const nowSeconds = Date.now() / 1000;
    const tokenExpired =
        !!tokenPayload?.exp && Number(tokenPayload.exp) <= nowSeconds + 5; // small clock skew
    const tokenUsable = !!token && !!tokenPayload && !tokenExpired;
    const userType = tokenUsable ? (tokenPayload.userType || 'retailers') : 'retailers';

    // Helper to check if path is for retailers
    const isRetailersRoute = (path) => {
        return path.startsWith('/dashboard') ||
            path.startsWith('/invoices') ||
            path.startsWith('/clients') ||
            path.startsWith('/inventory') ||
            path.startsWith('/expense') ||
            path.startsWith('/my-bills') ||
            path.startsWith('/hrms') ||
            path.startsWith('/my-attendance') ||
            path.startsWith('/logs') ||
            path.startsWith('/settings') ||
            path.startsWith('/stocks');
    };

    // Helper to check if path is for restaurants
    const isRestaurantsRoute = (path) => {
        return path.startsWith('/restaurant');
    };

    // Helper to check if path is for services
    const isServicesRoute = (path) => {
        return path.startsWith('/services');
    };

    const clearAuthCookie = (response) => {
        response.cookies.set('authToken', '', { path: '/', maxAge: 0 });
        return response;
    };

    // 1. If user is authenticated and tries to access login/register, redirect based on userType
    if (token && tokenExpired) {
        // Expired cookie should not block login pages; also clear it to avoid redirect loops.
        if (isPublicRoute) {
            return clearAuthCookie(NextResponse.next());
        }
        const res = NextResponse.redirect(new URL('/auth/login', request.url));
        return clearAuthCookie(res);
    }

    // Only redirect authenticated users from "auth only" pages back to dashboard.
    // Allow them to visit public informational pages like /auth/support, /auth/terms, /auth/privacy.
    const isAuthOnlyPage =
        pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/get-started') ||
        pathname.startsWith('/auth/forgot-password') ||
        pathname.startsWith('/auth/reset-password') ||
        pathname.startsWith('/auth/seller-dashboard');

    if (tokenUsable && isAuthOnlyPage && !pathname.includes('logout')) {
        const role = String(tokenPayload?.role || '').trim().toLowerCase();
        const isAdminRole =
            role === 'admin' ||
            role === 'administrator' ||
            role === 'owner' ||
            role === 'shop_owner' ||
            role === 'restaurant_owner' ||
            role.endsWith('_owner');
        const isChefRole = role === 'chef' || role === 'cook' || role === 'kitchen';

        const redirectPath =
            userType === 'restaurants'
                ? isAdminRole
                    ? '/restaurant'
                    : isChefRole
                        ? '/restaurant/hrms/attendance'
                        : '/restaurant/hrms'
                : userType === 'services'
                    ? '/services'
                    : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // 2. Check userType and route access for authenticated users
    if (tokenUsable && !isPublicRoute && pathname !== '/') {

        // If retailers user tries to access other routes, redirect to retailers dashboard
        if (userType === 'retailers' && (isRestaurantsRoute(pathname) || isServicesRoute(pathname))) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // If restaurants user tries to access other routes, redirect to restaurants dashboard
        if (userType === 'restaurants' && (isRetailersRoute(pathname) || isServicesRoute(pathname))) {
            return NextResponse.redirect(new URL('/restaurant', request.url));
        }

        // If services user tries to access other routes, redirect to services dashboard
        if (userType === 'services' && (isRetailersRoute(pathname) || isRestaurantsRoute(pathname))) {
            return NextResponse.redirect(new URL('/services', request.url));
        }
    }

    // 3. If user is NOT authenticated and tries to access private routes, redirect to login
    if (!tokenUsable && !isPublicRoute && pathname !== '/') {
        // Exclude static assets and api routes if necessary
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.includes('.')
        ) {
            return NextResponse.next();
        }

        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.next();
}

// Config to match all routes except static files and generic root if needed
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
