"use client";

import { useContext } from "react";
import { usePathname } from "next/navigation";
import { SidebarContext as RetailerSidebarContext } from "@/app/(retailers)/context/SidebarContext";
import { SidebarContext as RestaurantSidebarContext } from "@/app/(restaurants)/context/SidebarContext";

/**
 * Custom hook that automatically detects and uses the appropriate sidebar context
 * based on the current route. Works for both retailer and restaurant modules.
 * 
 * @returns {Object} Sidebar context with { collapsed, mobileOpen, toggleCollapse, toggleMobile }
 */
export function useSidebarContext() {
  const pathname = usePathname();
  const isRestaurantRoute = pathname?.startsWith("/restaurant");
  
  // Use useContext on both contexts - one will return null if not in provider
  const restaurantContext = useContext(RestaurantSidebarContext);
  const retailerContext = useContext(RetailerSidebarContext);
  
  // Determine which context to use based on route and availability
  // Check for both null and undefined (note: typeof null === 'object' in JavaScript)
  const hasRestaurantContext = restaurantContext !== null && restaurantContext !== undefined && typeof restaurantContext === 'object';
  const hasRetailerContext = retailerContext !== null && retailerContext !== undefined && typeof retailerContext === 'object';
  
  let context = null;
  if (isRestaurantRoute) {
    context = hasRestaurantContext ? restaurantContext : (hasRetailerContext ? retailerContext : null);
  } else {
    context = hasRetailerContext ? retailerContext : (hasRestaurantContext ? restaurantContext : null);
  }
  
  // Return context if available, otherwise return defaults
  return context || { collapsed: false, mobileOpen: false, toggleCollapse: () => {}, toggleMobile: () => {} };
}
