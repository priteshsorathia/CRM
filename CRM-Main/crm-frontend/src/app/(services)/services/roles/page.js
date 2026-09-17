"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Save,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Lock,
  Users,
  ShieldCheck,
  Zap,

  Check,
  X,
  Users2,
  Receipt,
  FileBarChart,
  BookOpen,
  CreditCard,
  Trash2,
  History,
  ClipboardList,
  Plus,
  Settings
} from "lucide-react";


import { useRole } from "@/app/(services)/context/RoleContext";
import AccessDenied from "@/components/AccessDenied";
import { rolesApi } from "@/lib/api";

const MODULES = [
  { id: "PROJECT", label: "Project Management", icon: Zap },
  { id: "TASK", label: "Task Management", icon: ClipboardList },
  { id: "CLIENTS", label: "Client Management", icon: Users2 },
  { id: "EMPLOYEE", label: "Employee Directory", icon: Users },
  { id: "LEAVE_MANAGEMENT", label: "Leave Management", icon: ClipboardList },
  { id: "ASSETS", label: "Asset Tracking", icon: Shield },
  { id: "BILLING", label: "Billing & Invoices", icon: CreditCard },
  { id: "EXPENSES", label: "Expense Tracking", icon: Receipt },
  { id: "ACCOUNTING", label: "Accounting", icon: BookOpen },
  { id: "REPORTS", label: "System Reports", icon: FileBarChart },
  { id: "ACTIVITY_LOGS", label: "Activity Logs", icon: History },
  { id: "SETTINGS", label: "System Settings", icon: Settings },
  { id: "ROLES", label: "Role Management", icon: ShieldCheck },
];

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"];

export default function RoleManagementPage() {
  const { permissions, updatePermissions, userRole, loading: roleLoading } = useRole();
  const [selectedRole, setSelectedRole] = useState("");
  const [designations, setDesignations] = useState(["Admin"]);
  const [localPermissions, setLocalPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDesignation, setNewDesignation] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Load designations
  useEffect(() => {
    (async () => {
      try {
        const res = await rolesApi.getDesignations();
        if (res.success) {
          setDesignations(res.designations);
        }
      } catch (e) {
        console.error("Error loading designations:", e);
      }
    })();
  }, []);


  // Initialize local state from context
  useEffect(() => {
    if (!roleLoading && selectedRole) {
      if (permissions[selectedRole]) {
        setLocalPermissions(permissions[selectedRole]);
      } else {
        // Default empty permissions if new designation - initialize all modules to false
        // This ensures the role is saved to DB even if no permissions are granted yet
        const defaultPerms = {};
        MODULES.forEach(m => {
          defaultPerms[m.id] = ACTIONS.reduce((acc, action) => {
            acc[action] = false;
            return acc;
          }, {});
        });
        setLocalPermissions(defaultPerms);
      }
    }
  }, [selectedRole, permissions, roleLoading]);

  if (roleLoading) {
    return <div className="p-10 text-center">Loading Permissions...</div>;
  }

  // Only Admin (Owner) can see this page
  if (userRole !== 'Admin') {
    return (
      <AccessDenied
        homeHref="/services"
        homeLabel="Back to Dashboard"
        title="Admin Access Required"
        message="Only administrators can manage system-wide role permissions."
      />
    );
  }

  const handleAddNew = () => {
    if (!newDesignation.trim()) return;
    if (designations.includes(newDesignation.trim())) {
      setSelectedRole(newDesignation.trim());
      setIsAddingNew(false);
      setNewDesignation("");
      return;
    }
    const d = newDesignation.trim();
    setDesignations(prev => [...prev, d]);
    setSelectedRole(d);
    setNewDesignation("");

    setIsAddingNew(false);
  };



  const handleDeleteDesignation = async (roleToDelete) => {
    const target = roleToDelete || selectedRole;
    if (target === 'Admin') return;

    if (!confirm(`Are you sure you want to delete the configuration for "${target}"? This will reset permissions but won't affect existing employees assigned to this role.`)) return;

    try {
      const res = await rolesApi.deleteDesignation(target);
      if (res.success) {
        setDesignations(prev => prev.filter(d => d !== target));
        const updatedPerms = { ...permissions };
        delete updatedPerms[target];
        updatePermissions(updatedPerms);

        if (selectedRole === target) {
          setSelectedRole(""); // Return to Control Panel overview
        }

        setSaveStatus("deleted");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      console.error("Error deleting designation:", e);
    }
  };

  const handleCheckboxChange = (module, action) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [action]: !prev[module]?.[action],
      },
    }));
    setSaveStatus(null);
  };

  const handleSelectAllRow = (module, value) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [module]: ACTIONS.reduce((acc, action) => {
        acc[action] = value;
        return acc;
      }, {}),
    }));
    setSaveStatus(null);
  };

  const isRowAllSelected = (module) => {
    return ACTIONS.every((action) => localPermissions[module]?.[action]);
  };


  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const updatedFullSet = {
        ...permissions,
        [selectedRole]: localPermissions
      };

      const res = await rolesApi.updatePermissions(updatedFullSet);

      if (res.success) {
        updatePermissions(updatedFullSet);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 mb-2">
          {selectedRole && (
            <button 
              onClick={() => setSelectedRole("")}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-500 hover:text-blue-600 group"
              title="Back to all roles"
            >
              <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
            </button>
          )}
          <div className="p-2.5 bg-blue-50 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {selectedRole ? "Role Permissions" : "Control Panel"}
            </h1>
            {selectedRole && <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{selectedRole}</p>}
          </div>
        </div>




        {!selectedRole ? (
          isAddingNew ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
              <div className="relative">
                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  autoFocus
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddNew();
                    if (e.key === 'Escape') { setIsAddingNew(false); setNewDesignation(""); }
                  }}
                  placeholder="Enter role name..."
                  className="pl-9 pr-3 py-2.5 bg-white border-2 border-blue-400 rounded-xl shadow-sm text-sm font-bold text-gray-700 outline-none w-48 sm:w-64 transition-all focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={handleAddNew}
                  className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Check size={18} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => { setIsAddingNew(false); setNewDesignation(""); }}
                  className="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <Plus size={16} strokeWidth={3} />
              Add New Designation
            </button>
          )
        ) : (
          <div className="flex items-center gap-3">
            {selectedRole !== 'Admin' && (
              <button
                onClick={() => handleDeleteDesignation(selectedRole)}
                className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <Trash2 size={16} />
                Delete Role
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 disabled:opacity-40
                ${saveStatus === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : saveStatus === "success" ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? "Saving..." : saveStatus === "success" ? "Saved" : "Save Changes"}
            </button>
          </div>
        )}
      </div>


      {saveStatus && (saveStatus === "success" || saveStatus === "deleted") && (
        <div className={`${saveStatus === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-rose-50 border-rose-200 text-rose-700"} px-4 py-3 rounded-xl flex items-center gap-3 slide-in-right`}>
          {saveStatus === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="font-medium">
            {saveStatus === "success"
              ? `Permissions for ${selectedRole} updated system-wide.`
              : `Configuration for deleted successfully.`}
          </p>
        </div>
      )}

      {/* Permission Matrix Area */}
      {!selectedRole ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {designations.map((role, idx) => {
            const isNoAdmin = role.toLowerCase() !== 'admin';
            const colors = [
              'bg-blue-50 text-blue-600 border-blue-100',
              'bg-indigo-50 text-indigo-600 border-indigo-100',
              'bg-emerald-50 text-emerald-600 border-emerald-100',
              'bg-violet-50 text-violet-600 border-violet-100',
              'bg-amber-50 text-amber-600 border-amber-100',
            ];
            const colorClass = colors[idx % colors.length];
            
            return (
              <div
                key={role}
                onClick={() => setSelectedRole(role)}
                className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center gap-4 active:scale-[0.98] relative"
              >
                <div className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border ${colorClass}`}>
                  {!isNoAdmin ? <ShieldCheck className="w-5 h-5" /> : <Users2 className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors capitalize truncate">{role}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Access Settings</p>
                </div>

                <div className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
          
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-6 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Module Name
                  </th>
                  {ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="px-6 py-6 text-center text-sm font-bold text-gray-500 uppercase tracking-wider"
                    >
                      {action}
                    </th>
                  ))}
                  <th className="px-6 py-6 text-center text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Select All
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MODULES.map((module, idx) => {
                  const ModuleIcon = module.icon;
                  const isAllSelected = isRowAllSelected(module.id);

                  return (
                    <tr
                      key={module.id}
                      className={`group transition-colors duration-150 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        } hover:bg-blue-50/50`}
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${idx % 3 === 0 ? "bg-indigo-100 text-indigo-600" :
                            idx % 3 === 1 ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                            }`}>
                            <ModuleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{module.label}</p>
                            <p className="text-xs text-gray-400 font-medium">{module.id} • System Access</p>
                          </div>
                        </div>
                      </td>

                      {ACTIONS.map((action) => {
                        const isChecked = localPermissions[module.id]?.[action] || false;
                        return (
                          <td key={action} className="px-6 py-5 whitespace-nowrap text-center">
                            <label className="relative inline-flex items-center justify-center cursor-pointer group/cb">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(module.id, action)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-200 transform group-active/cb:scale-90
                                ${isChecked
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-4 ring-blue-600/10"
                                  : "bg-white border-gray-200 text-transparent hover:border-blue-400"
                                }`}
                              >
                                <Check size={12} strokeWidth={4} className={`transition-all duration-200 ${isChecked ? 'scale-100' : 'scale-0'}`} />
                              </div>
                            </label>
                          </td>
                        );
                      })}

                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleSelectAllRow(module.id, !isAllSelected)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border
                            ${isAllSelected
                              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500"
                            }`}
                        >
                          {isAllSelected ? "Deselect" : "Select All"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Info Footer */}
          <div className="bg-gray-50 p-6 flex items-start gap-4 border-t border-gray-100">
            <div className="mt-0.5">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700">RBAC Enforcement Notice</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                When a permission is revoked (unchecked), the corresponding "Create", "Edit", or "Delete"
                buttons will be automatically hidden from that role's interface across all system modules.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
