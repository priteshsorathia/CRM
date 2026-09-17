"use client";

import { usePathname } from "next/navigation";
import {
  FaTachometerAlt,
  FaFileInvoice,
  FaMoneyBill,
  FaBoxes,
  FaIdBadge,
  FaCog,
  FaSignOutAlt,
  FaClipboardList,
  FaUserFriends,
  FaReceipt,
  FaFileInvoiceDollar,
  FaUsersCog,
  FaCalendarCheck,
  FaTimes,
} from "react-icons/fa";
import SidebarMenuItem from "../SidebarMenuItem";
import { useSidebar } from "@/app/(retailers)/context/SidebarContext";
import { useShop } from "@/context/ShopContext";
import { logout } from "@/utils/auth";
import { useState, useEffect } from "react";
import { requiresShopOwner } from "@/constants/routes";
import { getApiBase } from "@/utils/apiBase";

const menuItems = [
  { href: "/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
  { href: "/invoices", icon: <FaFileInvoice />, label: "Invoices" },
  { href: "/clients", icon: <FaUserFriends />, label: "Clients" },
  { href: "/inventory", icon: <FaBoxes />, label: "Inventory" },
  {
    href: "/expense",
    icon: <FaReceipt />,
    label: "My Expenses",
    requiresShopOwner: true,
    allowedRoles: ["Manager"],
  },
  {
    href: "/my-bills",
    icon: <FaFileInvoiceDollar />,
    label: "My Bills",
    requiresShopOwner: true,
    allowedRoles: ["Manager"],
  },
  {
    href: "/hrms",
    icon: <FaUsersCog />,
    label: "HRMS",
    requiresShopOwner: true,
  },
  {
    href: "/my-attendance",
    icon: <FaCalendarCheck />,
    label: "My Attendance",
    hideForShopOwner: true,
  },
  { href: "/logs", icon: <FaClipboardList />, label: "Activity Logs" },
  {
    href: "/settings",
    icon: <FaCog />,
    label: "Settings",
    requiresShopOwner: true,
    allowedRoles: ["Manager", "Sales", "Cashier"],
  },
];

export default function Sidebar() {
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
      } else {
        setDisplayName("CRM");
      }
    } catch (e) {
      console.error("Error parsing user data for sidebar", e);
    }
  };
  const getUserInitials = () => {
    if (!currentShop || !currentShop.name) return "G";
    const parts = currentShop.name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
  };
  // 1. Initial Load & Listen for Shop Context changes
  useEffect(() => {
    if (currentShop) {
      loadUserData(); // Check local storage first

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
        setLogoSrc(null);
      }
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
        className={`fixed top-0 left-0 h-full bg-slate-900 text-slate-100 z-40 shadow-lg transition-all duration-300 ease-in-out flex flex-col ${collapsed ? "w-[70px]" : "w-[250px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <header className="relative p-6 bg-gradient-to-br from-slate-800 to-slate-950 border-b border-white/5 flex flex-col items-center gap-3">
          {/* Close Button for Mobile */}
          {mobileOpen && (
            <button
              onClick={toggleMobile}
              className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
          {/* <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800 p-1 shadow-md overflow-hidden border border-white/20 hover:scale-105 transition-transform">
            <img
              key={imgKey}
              src={logoSrc}
              alt="Shop Logo"
              className="object-contain w-full h-full z-10 relative"
              width={64}
              height={64}
              loading="eager"
              onError={(e) => {
                e.target.src = "/shop-logo.png";
                e.target.onerror = null;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent rounded-full" />
          </div> */}
          {/* when sidebar open show Company logo but when its collapsed show only initials */}

          {!collapsed ? (
            logoSrc && (
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800 p-1 shadow-md overflow-hidden border border-white/20 hover:scale-105 transition-transform">
                <img
                  key={imgKey}
                  src={logoSrc}
                  alt="Shop Logo"
                  className="object-contain w-full h-full z-10 relative"
                  width={64}
                  height={64}
                  loading="eager"
                  onError={() => setLogoSrc(null)}
                />
              </div>
            )
          ) : (
            <span className="text-white font-bold text-lg">
              {getUserInitials()}
            </span>
          )}


          {!collapsed && (
            <div className="text-center">
              <h2 className="text-white text-lg font-semibold truncate px-2">
                {displayName}
              </h2>
              <p className="text-xs text-slate-300">Business Management</p>
            </div>
          )}
        </header>

        <nav
          className="flex-1 overflow-y-auto py-2 scrollbar-hide"
          aria-label="Main menu"
        >
          <ul className="space-y-1">
            {menuItems
              .filter((item) => {
                // Hide My Expenses if module disabled
                if (
                  item.href === "/expense" &&
                  !modules.enable_expense_module
                ) {
                  return false;
                }

                // If a menu item requires shop-owner role, hide it for other roles
                if (item.requiresShopOwner) {
                  // Consider 'shop_owner' and 'owner' as shop owner roles
                  const isOwner =
                    userRole && ["shop_owner", "owner"].includes(userRole);
                  const isAllowedExtra =
                    userRole && item.allowedRoles?.includes(userRole);

                  if (!isOwner && !isAllowedExtra) {
                    return false;
                  }
                }

                // If a menu item should be hidden from shop owners, do so
                if (item.hideForShopOwner) {
                  if (userRole && ["shop_owner", "owner"].includes(userRole)) {
                    return false;
                  }
                }
                return true;
              })
              .map((item) => (
                <SidebarMenuItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
                  collapsed={collapsed}
                  onClick={() => {
                    if (mobileOpen) toggleMobile();
                  }}
                />
              ))}
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

        {!mobileOpen && (
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex absolute top-4 right-0 translate-x-1/2 w-7 h-7 rounded-full bg-white/10 items-center justify-center text-white hover:bg-blue-500 transition-colors"
          >
            {collapsed ? (
              <span aria-hidden="true">&#8250;</span>
            ) : (
              <span aria-hidden="true">&#8249;</span>
            )}
          </button>
        )}
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
