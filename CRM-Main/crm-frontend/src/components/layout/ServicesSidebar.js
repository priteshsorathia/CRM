"use client";

import { usePathname } from "next/navigation";
import {
    FaTachometerAlt,
    FaFileInvoice,
    FaUserFriends,
    FaReceipt,
    FaFileInvoiceDollar,
    FaUsersCog,
    FaCalendarCheck,
    FaClipboardList,
    FaCog,
    FaSignOutAlt,
    FaTools,
    FaTasks,
} from "react-icons/fa";
import SidebarMenuItem from "../SidebarMenuItem";
import { useSidebar } from "@/app/(services)/context/SidebarContext";
import { useShop } from "@/context/ShopContext";
import { logout } from "@/utils/auth";
import { useState, useEffect } from "react";
import { getApiBase } from "@/utils/apiBase";

const menuItems = [
    { href: "/services", icon: <FaTachometerAlt />, label: "Dashboard" },
    { href: "/services/bookings", icon: <FaTasks />, label: "Service Bookings" },
    { href: "/services/customers", icon: <FaUserFriends />, label: "Customers" },
    { href: "/services/invoices", icon: <FaFileInvoice />, label: "Service Invoices" },
    {
        href: "/services/expense",
        icon: <FaReceipt />,
        label: "My Expenses",
        requiresShopOwner: true,
    },
    {
        href: "/services/hrms",
        icon: <FaUsersCog />,
        label: "HRMS",
        requiresShopOwner: true,
    },
    {
        href: "/services/my-attendance",
        icon: <FaCalendarCheck />,
        label: "My Attendance",
        hideForShopOwner: true,
    },
    { href: "/services/logs", icon: <FaClipboardList />, label: "Activity Logs" },
    {
        href: "/services/settings",
        icon: <FaCog />,
        label: "Settings",
        requiresShopOwner: true,
    },
    {
        href: "#logout",
        icon: <FaSignOutAlt />,
        label: "Logout",
    },
];

export default function ServicesSidebar() {
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

    const loadUserData = () => {
        try {
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
                const role = user.role || user.user_role || null;
                if (role) {
                    setUserRole(role);
                }

                const enableExpense =
                    typeof user.enable_expense_module === "boolean"
                        ? user.enable_expense_module
                        : user.enable_expense_module != null
                            ? !!user.enable_expense_module
                            : true;

                setModules({
                    enable_expense_module: enableExpense,
                });
            }

            if (currentShop?.name) {
                setDisplayName(currentShop.name);
            } else {
                setDisplayName("CRM Services");
            }
        } catch (e) {
            console.error("Error parsing user data for sidebar", e);
        }
    };

    const getUserInitials = () => {
        if (!currentShop || !currentShop.name) return "S";
        const parts = currentShop.name.trim().split(/\s+/);
        const first = parts[0]?.[0] || "";
        const second = parts[1]?.[0] || "";
        return (first + second).toUpperCase();
    };

    useEffect(() => {
        if (currentShop) {
            loadUserData();
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
        }
    }, [currentShop]);

    useEffect(() => {
        const handleUserUpdate = () => {
            loadUserData();
        };

        window.addEventListener("userUpdated", handleUserUpdate);

        return () => {
            window.removeEventListener("userUpdated", handleUserUpdate);
        };
    }, []);

    return (
        <>
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
                <header className="p-4 md:p-6 bg-gradient-to-br from-indigo-800 to-slate-950 border-b border-white/5 flex flex-col items-center gap-3 relative overflow-hidden">
                    {!collapsed ? (
                        <>
                            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white p-1 shadow-lg overflow-hidden border border-indigo-200 hover:scale-105 transition-transform flex items-center justify-center">
                                <img
                                    key={imgKey}
                                    src={logoSrc}
                                    alt="Services Logo"
                                    className="object-contain w-full h-full z-10 relative"
                                    width={64}
                                    height={64}
                                    loading="eager"
                                    onError={(e) => {
                                        e.target.src = "/shop-logo.png";
                                    }}
                                />
                            </div>
                            <div className="text-center w-full">
                                <h2 className="text-white text-base md:text-lg font-bold truncate px-2 mb-1">
                                    {displayName}
                                </h2>
                                <p className="text-xs text-indigo-300 font-medium tracking-wider">SERVICES MODULE</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center w-full h-16">
                            <span className="text-white font-black text-xl bg-indigo-600 w-10 h-10 flex items-center justify-center rounded-lg shadow-inner">
                                {getUserInitials()}
                            </span>
                        </div>
                    )}
                </header>

                <nav
                    className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide"
                    aria-label="Services menu"
                >
                    <ul className="space-y-1">
                        {menuItems
                            .filter((item) => {
                                if (
                                    item.href === "/services/expense" &&
                                    !modules.enable_expense_module
                                ) {
                                    return false;
                                }

                                if (item.requiresShopOwner) {
                                    if (
                                        !userRole ||
                                        !["shop_owner", "owner"].includes(userRole)
                                    ) {
                                        return false;
                                    }
                                }

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
                                    active={item.href !== "#logout" && (pathname === item.href || pathname?.startsWith(`${item.href}/`))}
                                    collapsed={collapsed}
                                    onClick={(e) => {
                                        if (item.href === "#logout") {
                                            e.preventDefault();
                                            logout();
                                        }
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

                <button
                    onClick={toggleCollapse}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden md:flex absolute top-4 right-0 translate-x-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-indigo-500 transition-all duration-300 shadow-xl"
                >
                    {collapsed ? (
                        <span className="text-sm font-bold" aria-hidden="true">&#8250;</span>
                    ) : (
                        <span className="text-sm font-bold" aria-hidden="true">&#8249;</span>
                    )}
                </button>
            </aside>
        </>
    );
}
