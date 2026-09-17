"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaChair,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaUsers,
  FaArrowRight,
  FaExclamationTriangle,
  FaReceipt,
  FaQrcode,
  FaSync,
  FaDownload,
  FaPrint
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import RestaurantLoader from "@/components/RestaurantLoader";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { getApiBase } from "@/utils/apiBase";
import PrevNextPager from "@/components/ui/PrevNextPager";

const TABLE_NUMBER_REGEX = /^[a-zA-Z0-9\-_/]+$/;
const INJECTION_OR_HTML_REGEX = /(<[^>]*>|javascript:|onerror=|onload=|onmouseover=|--|\/\*|\*\/|'\s+(or|and)\s+\S+\s*=\s*\S+|'\s*=\s*')/i;

const isInvalidText = (val) => {
  if (!val) return false;
  return INJECTION_OR_HTML_REGEX.test(String(val));
};

export default function TableMasterPage() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canGenerateBill, setCanGenerateBill] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, available, occupied, reserved, unavailable
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "",
    status: "available",
    section: "",
    notes: "",
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);
  const [regenTableId, setRegenTableId] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTables(true);
    const intervalId = setInterval(() => {
      loadTables(false);
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (showAddModal || showQRModal || showConfirmRegen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal, showQRModal, showConfirmRegen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowQRModal(false);
        setShowConfirmRegen(false);
      }
    };

    if (showAddModal || showQRModal || showConfirmRegen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAddModal, showQRModal, showConfirmRegen]);



  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isAdmin =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner");

      const isManager =
        role === "manager" ||
        role === "restaurant_manager" ||
        role === "floor_manager" ||
        role === "supervisor";

      setCanGenerateBill(isAdmin || isManager);
    } catch {
      setCanGenerateBill(false);
    }
  }, []);

  const loadTables = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const response = await fetch(`${API_BASE}/api/restaurant/tables`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
      setTables([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    if (table.status === "available") {
      router.push(`/restaurant/orders/new?table=${table.table_number}`);
    }
  };

  const handleAddTable = () => {
    setEditingTable(null);
    setFormData({
      table_number: "",
      capacity: "",
      status: "available",
      section: "",
      notes: "",
    });
    setErrors({});
    setShowAddModal(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status,
      section: table.section || "",
      notes: table.notes || "",
    });
    setErrors({});
    setShowAddModal(true);
  };

  const handleSaveTable = async () => {
    const newErrors = {};
    if (!formData.table_number?.trim()) {
      newErrors.table_number = "This field is required";
    } else if (!TABLE_NUMBER_REGEX.test(formData.table_number)) {
      newErrors.table_number = "Only alphanumeric characters, hyphens, underscores, and slashes are allowed (no spaces or emojis)";
    } else if (isInvalidText(formData.table_number)) {
      newErrors.table_number = "Invalid characters or injection signature detected";
    }

    if (!formData.capacity) {
      newErrors.capacity = "This field is required";
    } else {
      const cap = parseInt(formData.capacity, 10);
      if (cap < 1 || cap > 50 || isNaN(cap)) {
        newErrors.capacity = "Capacity must be between 1 and 50";
      }
    }

    if (formData.section && formData.section.trim()) {
      if (isInvalidText(formData.section)) {
        newErrors.section = "Invalid characters or injection signature detected";
      }
    }

    if (formData.notes && formData.notes.trim()) {
      const trimmedNotes = formData.notes.trim();
      if (isInvalidText(trimmedNotes)) {
        newErrors.notes = "Invalid characters or injection signature detected";
      } else if (trimmedNotes.length < 3) {
        newErrors.notes = "Notes must be at least 3 characters";
      } else if (trimmedNotes.length > 100) {
        newErrors.notes = "Notes cannot exceed 100 characters";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const url = editingTable
        ? `${API_BASE}/api/restaurant/tables/${editingTable.id}`
        : `${API_BASE}/api/restaurant/tables`;

      const method = editingTable ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        loadTables();
        toast.success(editingTable ? "Table updated successfully!" : "Table added successfully!");
      } else {
        let errorMessage = "Failed to save table";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch {
          // ignore JSON parse errors
        }
        if (errorMessage.toLowerCase().includes("already used")) {
          setErrors((prev) => ({ ...prev, table_number: "Table number already used" }));
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(error?.message || "Failed to save table");
    }
  };

  const handleRegenerateTokenClick = (tableId) => {
    setRegenTableId(tableId);
    setShowConfirmRegen(true);
  };

  const handleRegenerateToken = async () => {
    if (!regenTableId) return;
    setShowConfirmRegen(false);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/restaurant/tables/${regenTableId}/regenerate-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("QR Token regenerated!");
        loadTables(false);
        if (qrTable && qrTable.id === regenTableId && data.qr_token) {
            setQrTable(prev => ({
                ...prev,
                qr_token: data.qr_token
            }));
        }
      } else {
        toast.error("Failed to regenerate QR Token");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to regenerate QR Token");
    } finally {
      setRegenTableId(null);
    }
  };

  const handlePrintQR = () => {
    const printContent = document.getElementById('qr-print-area');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.write(`
      <html>
        <head>
          <title>Print QR - Table ${qrTable?.table_number}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .qr-container { padding: 40px; border: 2px solid #eee; border-radius: 20px; width: fit-content; margin: auto; }
            h1 { margin-top: 20px; color: #333; font-size: 32px; margin-bottom: 5px; }
            p { color: #666; margin-bottom: 30px; font-size: 18px; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${printContent.innerHTML}
            <h1>${qrTable?.table_number}</h1>
            <p>Scan to place your order</p>
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 18px; display: flex; justify-content: center;">
              <img src="${window.location.origin}/shop-logo.png" alt="CRM" style="height: 24px;" />
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 300);
  };

  const handlePrintAllQR = () => {
    const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    let qrHtml = '';
    tables.forEach((table, index) => {
        const qrUrl = `${baseDomain}/order?t=${table.qr_token || ''}&u=qr`;
        qrHtml += `
          <div class="qr-card">
            <div class="qr-container">
              <div class="qr-image">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}" />
              </div>
              <h1>${table.table_number}</h1>
              <p>Scan to place your order</p>
              <div class="footer">
                <img src="${window.location.origin}/shop-logo.png" alt="CRM" style="height: 16px;" />
              </div>
            </div>
          </div>
        `;
    });

    const doc = iframe.contentWindow.document;
    doc.write(`
      <html>
        <head>
          <title>Print All QR Codes</title>
          <style>
            @page { margin: 5mm; size: auto; }
            body { font-family: sans-serif; margin: 0; padding: 10px; background: #fff; }
            .print-grid { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 10px;
            }
            .qr-card { 
                padding: 5px;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 48vh; /* Approximately half page height */
            }
            .qr-container { 
                padding: 20px; 
                border: 1px solid #eee; 
                border-radius: 25px; 
                width: 240px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.02);
            }
            .qr-image img { width: 150px; height: 150px; }
            h1 { margin-top: 10px; font-size: 28px; color: #111; font-weight: 800; margin-bottom: 2px; }
            p { font-size: 12px; color: #666; margin-bottom: 20px; margin-top: 0; font-weight: 600; }
            .footer { margin-top: 15px; border-top: 1px solid #f5f5f5; padding-top: 10px; display: flex; justify-content: center; }
            
            /* Page break logic for 4 per page (2x2) */
            @media print {
                .qr-card:nth-child(4n) { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="print-grid">
            ${qrHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-white text-green-700 border-green-300";
      case "occupied":
        return "bg-white text-red-700 border-red-300";
      case "reserved":
        return "bg-white text-yellow-700 border-yellow-300";
      case "unavailable":
        return "bg-white text-gray-700 border-gray-300";
      default:
        return "bg-white text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "available":
        return <FaCheck className="text-green-600" size={14} />;
      case "occupied":
        return <FaTimes className="text-red-600" size={14} />;
      case "reserved":
        return <FaExclamationTriangle className="text-yellow-600" size={14} />;
      default:
        return <FaTimes className="text-gray-600" size={14} />;
    }
  };

  const availableTables = tables.filter((t) => t.status === "available").length;
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;
  const reservedTables = tables.filter((t) => t.status === "reserved").length;
  const unavailableTables = tables.filter((t) => t.status === "unavailable").length;

  const filteredTables = tables.filter((table) => {
    const matchesStatus = filterStatus === "all" || table.status === filterStatus;
    const matchesSearch = searchQuery.trim() === "" || 
      (table.table_number && table.table_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (table.section && table.section.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pages = Math.max(1, Math.ceil(filteredTables.length / pageSize));
  const pagedTables = filteredTables.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), pages));
  }, [pages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader
          variant="container"
          message="Loading tables..."
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-5 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 lg:mb-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
                Table Master
              </h1>
              <p className="text-gray-600 text-[10px] lg:text-sm mt-0.5">
                Select a table to create order
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintAllQR}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-white text-gray-700 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all font-semibold text-xs lg:text-sm shadow-sm whitespace-nowrap"
              >
                <FaPrint size={12} /> Print All QR
              </button>
              <button
                onClick={handleAddTable}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-xs lg:text-sm shadow-sm whitespace-nowrap"
              >
                <FaPlus size={12} /> Add Table
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Subtle Opacity Backgrounds with Colored Borders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-5">
          <div
            onClick={() => setFilterStatus("all")}
            className={`transition-all duration-200 ease-in-out cursor-pointer flex flex-col gap-1 h-full p-2.5 lg:p-4 rounded-xl border-2 shadow-sm hover:shadow-md hover:-translate-y-[1px] ${filterStatus === "all" ? "bg-blue-50 border-blue-600 ring-2 ring-blue-100" : "bg-blue-50/40 border-blue-100 hover:border-blue-300"
              }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setFilterStatus("all");
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-blue-100/50 rounded-lg flex items-center justify-center shrink-0">
                <FaChair className="text-blue-600" size={16} lg={18} />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900 leading-none">{tables.length}</p>
            </div>
            <p className="text-blue-600/70 text-[10px] font-bold uppercase tracking-widest ml-11 leading-none">Total Tables</p>
          </div>

          <div
            onClick={() => setFilterStatus("available")}
            className={`transition-all duration-200 ease-in-out cursor-pointer flex flex-col gap-1 h-full p-2.5 lg:p-4 rounded-xl border-2 shadow-sm hover:shadow-md hover:-translate-y-[1px] ${filterStatus === "available" ? "bg-green-50 border-green-600 ring-2 ring-green-100" : "bg-green-50/40 border-green-100 hover:border-green-300"
              }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setFilterStatus("available");
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-green-100/50 rounded-lg flex items-center justify-center shrink-0">
                <FaCheck className="text-green-600" size={16} lg={18} />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900 leading-none">{availableTables}</p>
            </div>
            <p className="text-green-600/70 text-[10px] font-bold uppercase tracking-widest ml-11 leading-none">Available</p>
          </div>

          <div
            onClick={() => setFilterStatus("occupied")}
            className={`transition-all duration-200 ease-in-out cursor-pointer flex flex-col gap-1 h-full p-2.5 lg:p-4 rounded-xl border-2 shadow-sm hover:shadow-md hover:-translate-y-[1px] ${filterStatus === "occupied" ? "bg-red-50 border-red-600 ring-2 ring-red-100" : "bg-red-50/40 border-red-100 hover:border-red-300"
              }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setFilterStatus("occupied");
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-red-100/50 rounded-lg flex items-center justify-center shrink-0">
                <FaTimes className="text-red-600" size={16} lg={18} />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900 leading-none">{occupiedTables}</p>
            </div>
            <p className="text-red-600/70 text-[10px] font-bold uppercase tracking-widest ml-11 leading-none">Occupied</p>
          </div>

          <div
            onClick={() => setFilterStatus("reserved")}
            className={`transition-all duration-200 ease-in-out cursor-pointer flex flex-col gap-1 h-full p-2.5 lg:p-4 rounded-xl border-2 shadow-sm hover:shadow-md hover:-translate-y-[1px] ${filterStatus === "reserved" ? "bg-amber-50 border-amber-600 ring-2 ring-amber-100" : "bg-amber-50/40 border-amber-100 hover:border-amber-300"
              }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setFilterStatus("reserved");
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-amber-100/50 rounded-lg flex items-center justify-center shrink-0">
                <FaExclamationTriangle className="text-amber-600" size={16} lg={18} />
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900 leading-none">{reservedTables}</p>
            </div>
            <p className="text-amber-600/70 text-[10px] font-bold uppercase tracking-widest ml-11 leading-none">Reserved</p>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 lg:mb-5">
          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {[
              { value: "all", label: "All Tables", count: tables.length },
              { value: "available", label: "Available", count: availableTables },
              { value: "occupied", label: "Occupied", count: occupiedTables },
              { value: "reserved", label: "Reserved", count: reservedTables },
              { value: "unavailable", label: "Unavailable", count: unavailableTables },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-medium text-xs lg:text-sm transition-all duration-200 ${filterStatus === filter.value
                  ? "bg-indigo-600 text-white shadow-sm border-2 border-indigo-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-300"
                  }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search table or section"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value.replace(/\./g, '');
                setSearchQuery(val);
              }}
              className="w-full pl-9 pr-8 py-1.5 bg-white border-2 border-gray-300 rounded-lg text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-colors shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tables Grid */}
        {filteredTables.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
            <FaChair className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-500 font-medium text-lg mb-2">No tables found</p>
            <p className="text-gray-400 text-sm">
              {filterStatus !== "all"
                ? `No ${filterStatus} tables available`
                : "Get started by adding your first table"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4 p-3 lg:p-4">
              {pagedTables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`relative rounded-xl shadow-sm border transition-all duration-200 ease-in-out cursor-pointer hover:shadow-md hover:-translate-y-[1px] ${table.status === "available"
                  ? "bg-green-50/60 border-green-300 hover:border-green-400 hover:bg-green-50/80"
                  : table.status === "occupied"
                    ? "bg-red-50/60 border-red-300 hover:border-red-400 hover:bg-red-50/80 cursor-not-allowed"
                    : table.status === "reserved"
                      ? "bg-yellow-50/60 border-yellow-300 hover:border-yellow-400 hover:bg-yellow-50/80"
                      : "bg-gray-50/60 border-gray-300 hover:border-gray-400 hover:bg-gray-50/80 cursor-not-allowed"
                  }`}
              >
                <div className="p-3 lg:p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2 lg:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm lg:text-base font-bold text-gray-900 truncate">
                        {table.table_number}
                      </h3>
                      {table.section ? (
                        <p className="text-[10px] lg:text-xs text-gray-500 truncate mt-0">{table.section}</p>
                      ) : (
                        <p className="text-[10px] lg:text-xs text-gray-500 truncate mt-0 opacity-0 select-none" aria-hidden="true">&nbsp;</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTable(table);
                      }}
                      className="p-2 lg:p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <FaEdit size={16} lg={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrTable(table);
                        setShowQRModal(true);
                      }}
                      className="p-2 lg:p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                      title="Manage QR Code"
                    >
                      <FaQrcode size={16} lg={12} />
                    </button>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center gap-2 lg:gap-2 mb-2 lg:mb-3">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-100 rounded flex items-center justify-center">
                      <FaUsers className="text-gray-600" size={12} lg={12} />
                    </div>
                    <span className="text-xs lg:text-sm font-semibold text-gray-600">
                      {table.capacity} <span className="hidden sm:inline">seats</span>
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium border flex items-center gap-1.5 lg:gap-1.5 ${getStatusColor(
                        table.status
                      )}`}
                    >
                      {getStatusIcon(table.status)}
                      <span className="capitalize">{table.status}</span>
                    </span>
                  </div>

                  {/* Quick Action Hint */}
                  {table.status === "available" && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] lg:text-xs text-indigo-600 font-medium flex items-center gap-1.5">
                        <FaArrowRight size={10} lg={10} className="shrink-0" /> Tap to order
                      </p>
                    </div>
                  )}

                  {table.status === "occupied" && canGenerateBill && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/restaurant/billing/add?table=${encodeURIComponent(
                              table.table_number
                            )}`
                          );
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 h-8 lg:h-10 px-2 lg:px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-[11px] lg:text-sm font-semibold shadow-sm"
                      >
                        <FaReceipt size={12} lg={14} />
                        Bill
                      </button>
                    </div>
                  )}

                  {table.status === "reserved" && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/restaurant/orders/new?table=${encodeURIComponent(table.table_number)}`
                          );
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 h-8 lg:h-10 px-2 lg:px-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-[11px] lg:text-sm font-semibold shadow-sm"
                      >
                        <FaCheck size={12} lg={14} />
                        Arrived
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
            {pages > 1 ? (
              <PrevNextPager page={page} pages={pages} onPageChange={setPage} />
            ) : null}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 lg:p-6 w-full max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">
                {editingTable ? "Edit Table" : "Add New Table"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={16} lg={18} />
              </button>
            </div>
            <div className="space-y-3 lg:space-y-4">
              <div>
                <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">
                  Table Number <span className="text-red-600">*</span> 
                </label>
                <input
                  type="text"
                  value={formData.table_number}
                  onChange={(e) => {
                    setFormData({ ...formData, table_number: e.target.value.replace(/\s/g, "") });
                    if (errors.table_number) {
                      setErrors((prev) => ({ ...prev, table_number: "" }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base ${
                    errors.table_number ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., T-01"
                />
                {errors.table_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.table_number}</p>
                )}
              </div>
              <div>
                <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">
                  Capacity <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => {
                    const value = e.target.value;
                    let cleanValue = value.replace(/\D/g, "");
                    if (cleanValue.startsWith("0")) {
                      cleanValue = cleanValue.replace(/^0+/, "");
                    }
                    setFormData({ ...formData, capacity: cleanValue });
                    if (errors.capacity) {
                      setErrors((prev) => ({ ...prev, capacity: "" }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (["-", "+", "e", ".", " "].includes(e.key)) {
                      e.preventDefault();
                    }
                    if (e.key === "0" && !formData.capacity) {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base ${
                    errors.capacity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., 4"
                  min="1"
                  max="50"
                />
                {errors.capacity && (
                  <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>
                )}
              </div>
              {editingTable && (
                <div>
                  <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">Status</label>
                  <div className="flex flex-wrap gap-1.5 lg:gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: "available" })}
                      className={`px-2 py-1 lg:px-3 lg:py-2 rounded-md text-[11px] lg:text-sm font-medium border ${formData.status === "available"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: "occupied" })}
                      className={`px-2 py-1 lg:px-3 lg:py-2 rounded-md text-[11px] lg:text-sm font-medium border ${formData.status === "occupied"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      Occupied
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: "reserved" })}
                      className={`px-2 py-1 lg:px-3 lg:py-2 rounded-md text-[11px] lg:text-sm font-medium border ${formData.status === "reserved"
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      Reserved
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: "unavailable" })}
                      className={`px-2 py-1 lg:px-3 lg:py-2 rounded-md text-[11px] lg:text-sm font-medium border ${formData.status === "unavailable"
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      Unavailable
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => {
                    setFormData({ ...formData, section: e.target.value });
                    if (errors.section) {
                      setErrors((prev) => ({ ...prev, section: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base ${
                    errors.section ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Main Hall, VIP"
                />
                {errors.section && (
                  <p className="text-red-500 text-xs mt-1">{errors.section}</p>
                )}
              </div>
              <div>
                <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => {
                    setFormData({ ...formData, notes: e.target.value });
                    if (errors.notes) {
                      setErrors((prev) => ({ ...prev, notes: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base resize-none ${
                    errors.notes ? "border-red-500" : "border-gray-300"
                  }`}
                  rows="2"
                  placeholder="Notes"
                  maxLength={200}
                />
                {errors.notes && (
                  <p className="text-red-500 text-xs mt-1">{errors.notes}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 lg:gap-3 mt-4 lg:mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-3 py-2 lg:px-4 lg:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold text-sm lg:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTable}
                className="flex-1 px-3 py-2 lg:px-4 lg:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm lg:text-base shadow-lg"
              >
                {editingTable ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* QR Modal */}
      {showQRModal && qrTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
             {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-600 to-blue-700" />
            
            <div className="relative z-10 text-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">Table QR Code</h3>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full backdrop-blur-md transition-all"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-6 inline-block">
                <div id="qr-print-area">
                  <QRCodeSVG 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/order?t=${qrTable.qr_token || ''}&u=qr`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">{qrTable.table_number}</h2>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Section: {qrTable.section || 'General'}</p>
              </div>

              <div className="mb-6 flex justify-center pt-2">
                <img src="/shop-logo.png" alt="CRM" className="h-6" />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4">
                <button
                  onClick={handlePrintQR}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all"
                >
                  <FaPrint /> Print
                </button>
                <button
                  onClick={() => handleRegenerateTokenClick(qrTable.id)}
                  className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all border border-red-100"
                >
                  <FaSync /> Reset
                </button>
              </div>
              
              <div className="text-[10px] text-gray-400 font-medium leading-relaxed">
                Scan this code to link customers directly to the digital menu for Table {qrTable.table_number}.
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmRegen && (
        <ConfirmationDialog
          isOpen={showConfirmRegen}
          onClose={() => setShowConfirmRegen(false)}
          onConfirm={handleRegenerateToken}
          title="Regenerate QR Token"
          description="Are you sure? Old QR codes for this table will stop working."
          confirmText="Reset"
          cancelText="Cancel"
          zIndexClass="z-[70]"
        />
      )}
    </div>
  );
}
