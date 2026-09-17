"use client";

import { usePathname } from "next/navigation";
import {
  FaTachometerAlt,
  FaUtensils,
  FaBookOpen,
  FaChair,
  FaBoxes,
  FaUsers,
  FaUsersCog,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaClipboardList,
  FaPlusCircle,
  FaFire,
  FaListAlt,
  FaStore,
  FaReceipt,
  FaFileInvoice,
} from "react-icons/fa";
import SidebarMenuItem from "../SidebarMenuItem";
import { useSidebar } from "@/app/(restaurants)/context/SidebarContext";
import { useShop } from "@/context/ShopContext";
import { logout } from "@/utils/auth";
import { useState, useEffect } from "react";
import { getApiBase } from "@/utils/apiBase";

const menuItems = [
  // Dashboard should be visible only to Admin/Owner.
  { href: "/restaurant", icon: <FaTachometerAlt />, label: "Dashboard", roles: ["owner"] },
  { href: "/restaurant/my-dashboard", icon: <FaTachometerAlt />, label: "My Dashboard", roles: ["staff", "manager"] },

  // Staff & Manager Features
  { href: "/restaurant/tables", icon: <FaStore />, label: "Table Master", roles: ["staff", "manager", "owner"], description: "Select & manage tables" },
  { href: "/restaurant/orders/new", icon: <FaPlusCircle />, label: "Take Order", roles: ["staff", "manager", "owner"], description: "Create new order" },
  { href: "/restaurant/orders", icon: <FaListAlt />, label: "Running Orders", roles: ["staff", "manager", "owner"], description: "View active orders" },

  // Kitchen/Chef Features
  { href: "/restaurant/kitchen", icon: <FaFire />, label: "Kitchen Dashboard", roles: ["chef", "owner"], description: "View & complete orders" },

  // Management Features
  { href: "/restaurant/menu", icon: <FaBookOpen />, label: "Menu Management", roles: ["manager", "owner"] },
  { href: "/restaurant/billing", icon: <FaFileInvoice />, label: "Billing", roles: ["manager", "owner"] },
  // { href: "/restaurant/inventory", icon: <FaBoxes />, label: "Inventory", roles: ["manager", "owner"] },
  { href: "/restaurant/hrms", icon: <FaUsersCog />, label: "HRMS", roles: ["staff", "manager", "chef", "owner"] },
  { href: "/restaurant/reports", icon: <FaChartBar />, label: "Reports & Analytics", roles: ["owner"] },
  { href: "/restaurant/logs", icon: <FaClipboardList />, label: "Activity Logs", roles: ["staff", "manager", "owner"] },
  { href: "/restaurant/account", icon: <FaCog />, label: "My Settings", roles: ["staff", "manager", "chef"], description: "Manage your profile" },
  { href: "/restaurant/settings", icon: <FaCog />, label: "Settings", roles: ["owner"], description: "System & Admin settings" },
];

export default function RestaurantSidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapse, toggleMobile } = useSidebar();
  const { currentShop } = useShop();

  const API_BASE = getApiBase();

  const [logoSrc, setLogoSrc] = useState("/shop-logo.png");
  const [displayName, setDisplayName] = useState("Loading...");
  const [userRole, setUserRole] = useState(null);
  const [imgKey, setImgKey] = useState(Date.now());
  const [modules, setModules] = useState({
    enable_expense_module: true,
    enable_combo_module: true,
  });

  const roleContext = (() => {
    const userRoleRaw = (userRole || "").toString().trim().toLowerCase();
    const userRoleVariants = new Set([
      userRoleRaw,
      userRoleRaw.replace(/\s+/g, "_"),
      userRoleRaw.replace(/_/g, " "),
      userRoleRaw.replace(/[-/]+/g, "_"),
      userRoleRaw.replace(/[-/]+/g, " "),
    ]);

    const roleMap = {
      staff: [
        "staff",
        "employee",
        "sales",
        "waiter",
        "waitress",
        "server",
        "cashier",
        "host",
        "hostess",
        "bartender",
        "cleaner",
        "other",
      ],
      chef: ["chef", "cook", "kitchen"],
      manager: ["manager", "restaurant_manager", "floor_manager", "supervisor"],
      owner: ["owner", "shop_owner", "restaurant_owner", "admin", "administrator"],
    };

    const matchesRole = (candidate) => userRoleVariants.has(candidate);
    const isAdmin = roleMap.owner.some(matchesRole);

    return { roleMap, matchesRole, isAdmin };
  })();

  // Function to load user data from LocalStorage
  const loadUserData = () => {
    try {
      // Read BOTH 'userData' and 'user' and merge them (user overrides)
      const userDataStr = localStorage.getItem("userData");
      const userStr = localStorage.getItem("user");

      let user = {};
      if (userDataStr) {
        user = { ...user, ...JSON.parse(userDataStr) };
      }
      if (userStr) {
        user = { ...user, ...JSON.parse(userStr) };
      }

      if (Object.keys(user).length > 0) {
        // Role may be stored as role or user_role, and may be 'shop_owner'
        const role = user.role || user.user_role || null;
        if (role) {
          setUserRole(role);
        }

        // Module toggles for conditional menus
        const enableExpense =
          typeof user.enable_expense_module === "boolean"
            ? user.enable_expense_module
            : user.enable_expense_module != null
              ? !!user.enable_expense_module
              : true;

        const enableCombo =
          typeof user.enable_combo_module === "boolean"
            ? user.enable_combo_module
            : user.enable_combo_module != null
              ? !!user.enable_combo_module
              : true;

        setModules({
          enable_expense_module: enableExpense,
          enable_combo_module: enableCombo,
        });
      }

      // For the sidebar header we always prefer the shop name over user name
      if (currentShop?.name) {
        setDisplayName(currentShop.name);
      } else if (user?.shop_name) {
        setDisplayName(user.shop_name);
      } else {
        setDisplayName("CRM");
      }
    } catch (e) {
      console.error("Error parsing user data for sidebar", e);
      setDisplayName("CRM");
    }
  };

  const getUserInitials = () => {
    if (!currentShop || !currentShop.name) return "R";
    const parts = currentShop.name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  };

  // Initial load on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // 1. Listen for Shop Context changes
  useEffect(() => {
    if (currentShop) {
      loadUserData(); // Re-check local storage when shop changes

      // Update Logo Logic
      const logoPath = currentShop.logo || currentShop.logo_path;
      if (logoPath) {
        let finalUrl = logoPath;
        if (logoPath.startsWith("/")) {
          finalUrl = `${API_BASE}${logoPath}`;
        }
        const timestamp = new Date().getTime();
        setLogoSrc(`${finalUrl}?t=${timestamp}`);
        setImgKey(timestamp);
      } else {
        setLogoSrc("/shop-logo.png");
      }
    } else {
      // If no shop, try to load from localStorage
      loadUserData();
      setLogoSrc("/shop-logo.png");
    }
  }, [currentShop]);

  // 2. Listen for "userUpdated" event from AdminSettings
  useEffect(() => {
    const handleUserUpdate = () => {
      loadUserData(); // Re-read from local storage
    };

    // Add event listener
    window.addEventListener("userUpdated", handleUserUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={toggleMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-slate-900 text-slate-100 z-40 shadow-xl transition-all duration-300 ease-in-out flex flex-col ${collapsed ? "w-[70px]" : "w-[250px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <header
          className={`bg-gradient-to-br from-slate-800 to-slate-950 border-b border-white/5 relative overflow-hidden mb-2 flex items-center ${collapsed ? "justify-center px-3 py-5" : "flex-col gap-3 justify-center px-5 py-5"
            }`}
        >
          {!collapsed ? (
            <>
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white p-2 shadow-lg overflow-hidden border border-slate-200 hover:scale-105 transition-transform flex items-center justify-center">
                <img
                  key={imgKey}
                  src={logoSrc}
                  alt="Restaurant Logo"
                  className="object-contain object-center w-full h-full z-10 relative rounded-full"
                  width={64}
                  height={64}
                  loading="eager"
                  onError={(e) => {
                    const img = e.currentTarget;

                    // First fallback: use the bundled app logo
                    if (img.getAttribute("data-fallback") !== "1") {
                      img.setAttribute("data-fallback", "1");
                      img.src = "/shop-logo.png";
                      return;
                    }

                    // Final fallback: show initials if even bundled logo fails
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector(".logo-fallback");
                      if (fallback) fallback.style.display = "flex";
                    }
                  }}
                />
                <span className="logo-fallback text-slate-900 font-bold text-xl md:text-2xl hidden items-center justify-center">
                  {(displayName || "CRM").substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="text-center w-full">
                <h2 className="text-white text-base md:text-lg font-bold truncate px-2 mb-1">
                  {displayName || "CRM"}
                </h2>
                <p className="text-xs text-slate-300 font-medium">Restaurant Management</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-200">
                <img
                  key={imgKey}
                  src={logoSrc}
                  alt="Restaurant Logo"
                  className="object-contain w-8 h-8"
                  width={36}
                  height={36}
                  loading="eager"
                  onError={(e) => {
                    const img = e.currentTarget;

                    if (img.getAttribute("data-fallback") !== "1") {
                      img.setAttribute("data-fallback", "1");
                      img.src = "/shop-logo.png";
                      return;
                    }

                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector(".logo-fallback-collapsed");
                      if (fallback) fallback.style.display = "flex";
                    }
                  }}
                />
                <span className="logo-fallback-collapsed text-slate-900 font-bold text-lg hidden items-center justify-center">
                  {getUserInitials() || "GV"}
                </span>
              </div>
            </div>
          )}
        </header>

        <nav
          className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide"
          aria-label="Main menu"
        >
          <ul className="space-y-1">
            {menuItems
              .filter((item) => {
                // If item has roles specified, check if user role matches
                if (item.roles && item.roles.length > 0) {
                  // Check if user role matches any of the allowed roles for this item
                  const hasAccess = item.roles.some((allowedRole) => {
                    const key = allowedRole.toLowerCase();
                    const mapped = roleContext.roleMap[key];
                    if (mapped) return mapped.some(roleContext.matchesRole);
                    return roleContext.matchesRole(key);
                  });

                  // Special handling for settings consolidation:
                  // Hide "My Settings" for owners since they have a consolidated "Settings" menu.
                  if (roleContext.isAdmin && item.href === "/restaurant/account") {
                    return false;
                  }

                  // Hide "My Dashboard" for owners/admins
                  if (roleContext.isAdmin && item.href === "/restaurant/my-dashboard") {
                    return false;
                  }

                  // Owners/admin always have access to roles-specified items (except when explicitly hidden above).
                  return hasAccess || roleContext.isAdmin;
                }

                // If no roles specified, show to everyone
                return true;
              })
              .map((item) => {
                const resolvedItem =
                  item.href === "/restaurant/hrms" && !roleContext.isAdmin
                    ? { ...item, label: "Attendance" }
                    : item;

                // Check if item should be active
                let isActive = false;
                if (resolvedItem.href === "/restaurant") {
                  isActive = pathname === resolvedItem.href;
                } else if (resolvedItem.href === "/restaurant/orders/new") {
                  // Take Order should be active on /restaurant/orders/new
                  isActive = pathname === resolvedItem.href || pathname?.startsWith("/restaurant/orders/new");
                } else if (resolvedItem.href === "/restaurant/orders") {
                  // Running Orders should be active on /restaurant/orders (but not /orders/new)
                  isActive = (pathname === resolvedItem.href || pathname?.startsWith(`${resolvedItem.href}/`)) &&
                    !pathname?.startsWith("/restaurant/orders/new");
                } else {
                  isActive = pathname === resolvedItem.href || pathname?.startsWith(`${resolvedItem.href}/`);
                }

                return (
                  <SidebarMenuItem
                    key={resolvedItem.href}
                    href={resolvedItem.href}
                    label={resolvedItem.label}
                    icon={resolvedItem.icon}
                    active={isActive}
                    collapsed={collapsed}
                    onClick={() => {
                      if (mobileOpen) toggleMobile();
                    }}
                  />
                );
              })}
          </ul>
        </nav>

        <footer className="mt-auto border-t border-white/5 p-4">
          <button
            onClick={() => {
              if (mobileOpen) toggleMobile();
              logout();
            }}
            className={`flex items-center gap-3 w-full transition-all duration-300 group rounded-xl p-3 ${collapsed
              ? "justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10"
              : "text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-4"
              }`}
            aria-label={collapsed ? "Logout" : undefined}
          >
            <FaSignOutAlt className={`text-lg transition-transform duration-300 group-hover:scale-110`} />
            {!collapsed && <span className="font-medium tracking-wide">Logout</span>}
          </button>
        </footer>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex absolute top-4 right-0 translate-x-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-indigo-500 hover:border-indigo-400 transition-all duration-300 shadow-lg z-50"
        >
          {collapsed ? (
            <span className="text-sm font-bold" aria-hidden="true">&#8250;</span>
          ) : (
            <span className="text-sm font-bold" aria-hidden="true">&#8249;</span>
          )}
        </button>
      </aside>
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        /* Optional: Add smooth scrolling */
        .scrollbar-hide {
          scroll-behavior: smooth;
        }

        /* Optional: Style for the entire app if needed */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  );
}
