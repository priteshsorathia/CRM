"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { isSvgFile } from "@/utils/fileValidation";

import { hrmsApi, rolesApi } from "@/lib/api";

const toDateInputValue = (d) => {
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  minLength,
  min,
  max,
  autoComplete,
  disabled,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-gray-700">
      {label}
      {required ? <span className="text-red-500 ml-1">*</span> : null}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      minLength={minLength}
      min={min}
      max={max}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 placeholder-gray-400"
    />
  </div>
);

const Select = ({ label, options, required, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-gray-700">
      {label}
      {required ? <span className="text-red-500 ml-1">*</span> : null}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 bg-white"
    >
      <option value="">Select...</option>
      {options.map((o) => {
        const isObj = typeof o === "object" && o !== null;
        const val = isObj ? o.value : o;
        const lab = isObj ? o.label : o;
        return (
          <option key={val} value={val}>
            {lab}
          </option>
        );
      })}
    </select>
  </div>
);

export default function OnboardingForm({
  mode = "create",
  employeeId,
  onClose,
  onCreated,
  onSaved,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [nextEmpId, setNextEmpId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    bloodGroup: "",
    username: "",
    password: "",
    department: "",
    role: "",
    reportingManager: "",
    employmentType: "",
    joinDate: toDateInputValue(Date.now()),
    salary: "",
    workLocation: "",

    probationDays: "",
    status: "active",
  });

  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showManageDepts, setShowManageDepts] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await rolesApi.getDesignations();
        if (res.success) {
          setDesignations(res.designations);
        }
      } catch (err) {
        console.error("Failed to fetch designations:", err);
        setDesignations(["Admin", "Employee", "Manager", "Team Leader", "Senior Developer", "Junior Developer", "Intern"]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await hrmsApi.getEmployees();
        if (res.success && Array.isArray(res.data)) {
          const filteredManagers = res.data
            .filter((emp) => {
              if (isEdit && String(emp.id) === String(employeeId)) return false;
              const role = (emp.role || "").toLowerCase();
              return role.includes("manager");
            })
            .map((emp) => ({
              value: emp.id,
              label: `${emp.full_name} (${emp.role || "No Role"})`,
            }));
          setManagers(filteredManagers);
        }
      } catch (err) {
        console.error("Failed to fetch managers:", err);
      }
    })();
  }, [isEdit, employeeId]);

  const fetchDepartments = async () => {
    try {
      const res = await hrmsApi.getDepartments();
      if (res.success) {
        setDepartments(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let mounted = true;
    if (!isEdit) {
      (async () => {
        try {
          const res = await hrmsApi.getNextEmployeeId();
          if (mounted && res?.success && res?.nextEmpId) setNextEmpId(res.nextEmpId);
        } catch {
          // optional
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !employeeId) return;

    let mounted = true;
    (async () => {
      setLoadingEmployee(true);
      try {
        const res = await hrmsApi.getEmployee(employeeId);
        if (!mounted) return;
        if (!res?.success) {
          toast.error(res?.error || "Employee not found");
          return;
        }

        const emp = res.data || {};
        const parts = String(emp.full_name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ");

        setForm((prev) => ({
          ...prev,
          firstName,
          lastName,
          email: emp.email || "",
          phone: emp.phone || "",
          username: emp.username || prev.username || "",
          role: emp.role || "",
          joinDate: emp.join_date ? toDateInputValue(emp.join_date) : prev.joinDate,
          salary: emp.salary != null ? String(emp.salary) : "",
          status: emp.status || prev.status || "active",
          // New fields
          dob: emp.dob ? toDateInputValue(emp.dob) : "",
          gender: emp.gender || "",
          bloodGroup: emp.bloodGroup || "",
          address: emp.address || "",
          department: emp.department || "",
          reportingManager: emp.reportingManager || "",
          employmentType: emp.employmentType || "",
          workLocation: emp.workLocation || "",
          probationDays: emp.probationDays != null ? String(emp.probationDays) : "",
        }));
      } catch (e) {
        if (mounted) toast.error(e?.message || "Failed to load employee");
      } finally {
        if (mounted) setLoadingEmployee(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId, isEdit]);

  const fullName = useMemo(
    () => `${form.firstName} ${form.lastName}`.trim(),
    [form.firstName, form.lastName],
  );

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim())
        return "First Name and Last Name are required";
      if (!isEdit && !form.dob) return "Date of Birth is required";
      if (form.dob && new Date(form.dob) > new Date()) return "Date of Birth cannot be in the future";
      if (!isEdit && !form.gender) return "Gender is required";
      if (!form.email.trim()) return "Email Address is required";
      if (!form.phone.trim()) return "Mobile Number is required";
      if (!form.username.trim()) return "Username is required";
      if (!isEdit) {
        if (!form.password || form.password.length < 6)
          return "Password must be at least 6 characters";
      } else if (form.password && form.password.length > 0 && form.password.length < 6) {
        return "Password must be at least 6 characters";
      }
    }

    if (step === 2) {
      if (!form.role.trim()) return "Designation is required";
      if (!form.joinDate) return "Date of Joining is required";
      if (!form.salary || Number(form.salary) <= 0) return "Monthly Salary is required";
    }

    return "";
  };

  const next = async () => {
    const msg = validateCurrentStep();
    if (msg) {
      toast.error(msg);
      return;
    }

    if (step === 1 && !isEdit) {
      setLoading(true);
      try {
        const res = await hrmsApi.checkAvailability(form.username.trim(), form.email.trim());
        if (!res?.success) {
          toast.error(res?.error || "User with this email or username already exists");
          setLoading(false);
          return;
        }
      } catch (err) {
        toast.error(err?.message || "User with this email or username already exists");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setStep((s) => Math.min(3, s + 1));
  };

  const prev = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    const msg = validateCurrentStep();
    if (msg) {
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      if (!isEdit) {
        const payload = {
          full_name: fullName,
          username: form.username.trim(),
          password: form.password,
          userType: "services",
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role.trim() || undefined,
          salary: Number(form.salary || 0),
          join_date: form.joinDate,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          department: form.department || undefined,
          reportingManager: form.reportingManager || undefined,
          employmentType: form.employmentType || undefined,
          workLocation: form.workLocation || undefined,
          probationDays: form.probationDays ? Number(form.probationDays) : undefined,
        };

        const res = await hrmsApi.createEmployee(payload);
        if (!res?.success) {
          toast.error(res?.error || "Failed to create employee");
          return;
        }

        if (typeof onCreated === "function") onCreated(res?.data);
      } else {
        const payload = {
          full_name: fullName,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role.trim() || undefined,
          salary: Number(form.salary || 0),
          join_date: form.joinDate,
          status: form.status || "active",
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          department: form.department || undefined,
          reportingManager: form.reportingManager || undefined,
          employmentType: form.employmentType || undefined,
          workLocation: form.workLocation || undefined,
          probationDays: form.probationDays ? Number(form.probationDays) : undefined,
        };

        const res = await hrmsApi.updateEmployee(employeeId, payload);
        if (!res?.success) {
          toast.error(res?.error || "Failed to update employee");
          return;
        }

        if (form.password && form.password.length >= 6) {
          const passRes = await hrmsApi.changeEmployeePassword(employeeId, form.password);
          if (!passRes?.success) {
            toast.error(passRes?.error || "Employee updated, but password change failed");
            return;
          }
        }

        if (typeof onSaved === "function") onSaved();
      }
    } catch (e) {
      toast.error(e?.message || (isEdit ? "Failed to update employee" : "Failed to create employee"));
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmployee) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {!isEdit && nextEmpId ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-semibold text-indigo-700">
          Next Employee ID: <span className="font-bold">{nextEmpId}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-2 mb-8">
        {/* Step Numbers & Progress - Hidden on Mobile */}
        <div className="hidden sm:flex items-center gap-2 flex-1">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  s === step
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : s < step
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                      : "bg-gray-50 text-gray-400 border-gray-200"
                }`}
              >
                {s}
              </div>
              {s < 3 ? (
                <div className={`flex-1 h-0.5 ${s < step ? "bg-indigo-400" : "bg-gray-200"}`} />
              ) : null}
            </React.Fragment>
          ))}
        </div>

        {/* Labels - Always visible, adjusted spacing for mobile */}
        <div className="flex gap-4 sm:gap-6 text-[12px] sm:text-xs font-bold text-gray-400 sm:ml-3">
          <span className={step === 1 ? "text-indigo-600" : ""}>Basic Info</span>
          <span className={step === 2 ? "text-indigo-600" : ""}>Job Details</span>
          <span className={step === 3 ? "text-indigo-600" : ""}>Documents</span>
        </div>
      </div>

      {step === 1 ? (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-5">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="First Name" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            <Input label="Last Name" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            <Input label="Date of Birth" type="date" required={!isEdit} max={toDateInputValue(Date.now())} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            <Select
              label="Gender"
              required={!isEdit}
              options={["Male", "Female", "Other"]}
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            />
            <Input label="Email Address" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
            <Input label="Mobile Number" type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
            <Input label="Permanent Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            <Select
              label="Blood Group"
              options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
              value={form.bloodGroup}
              onChange={(e) => set("bloodGroup", e.target.value)}
            />

            <Input
              label="Username"
              required
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              autoComplete="username"
              placeholder="e.g., rahul01"
              disabled={isEdit}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Password{!isEdit ? <span className="text-red-500 ml-1">*</span> : null}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  autoComplete={isEdit ? "off" : "new-password"}
                  minLength={isEdit ? undefined : 6}
                  placeholder={isEdit ? "Leave blank to keep current password" : undefined}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 placeholder-gray-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-5">Employment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="flex flex-col gap-1.5 relative">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">
                  Department
                </label>
                <button 
                  type="button"
                  onClick={() => setShowManageDepts(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Manage Departments
                </button>
              </div>
              <select
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 bg-white"
              >
                <option value="">Select Department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <Select 
              label="Designation" 
              required 
              options={designations}
              value={form.role} 
              onChange={(e) => set("role", e.target.value)} 
            />
            <Select
              label="Reporting Manager"
              options={managers}
              value={form.reportingManager}
              onChange={(e) => set("reportingManager", e.target.value)}
            />
            <Select
              label="Employment Type"
              options={["Full-Time", "Part-Time", "Contract", "Intern"]}
              value={form.employmentType}
              onChange={(e) => set("employmentType", e.target.value)}
            />
            <Input label="Date of Joining" type="date" required value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} />
            <Input label="Monthly Salary (₹)" type="number" required value={form.salary} onChange={(e) => set("salary", e.target.value)} min="0" />
            <Select
              label="Work Location"
              options={["Head Office", "Remote", "Hybrid"]}
              value={form.workLocation}
              onChange={(e) => set("workLocation", e.target.value)}
            />
            <Input label="Probation Period (Days)" type="number" value={form.probationDays} onChange={(e) => set("probationDays", e.target.value)} min="0" />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-5">Document Upload</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {["Aadhaar Card", "PAN Card", "Resume / CV", "Offer Letter", "Previous Experience Letter", "Educational Certificates"].map((doc) => (
              <div key={doc} className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">{doc}</label>
                <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors">
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Click to upload PDF / JPG</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && isSvgFile(file)) {
                        e.target.value = "";
                        return;
                      }
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 pt-5 border-t border-gray-100 flex justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={prev}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            ← Previous
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-60"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Employee"}
          </button>
        )}
      </div>

      {showManageDepts && (
        <ManageDepartmentsModal 
          onClose={() => setShowManageDepts(false)} 
          onUpdate={(newDepts, lastAddedId) => {
            setDepartments(newDepts);
            if (lastAddedId) set("department", lastAddedId);
          }}
        />
      )}
    </div>
  );
}

function ManageDepartmentsModal({ onClose, onUpdate }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await hrmsApi.getDepartments();
      if (res.success) {
        setDepartments(res.data || []);
      }
    } catch (err) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await hrmsApi.createDepartment({ name: newName.trim() });
      if (res.success) {
        toast.success("Department added");
        setNewName("");
        const updated = await hrmsApi.getDepartments();
        if (updated.success) {
          setDepartments(updated.data);
          onUpdate(updated.data, res.data.id);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to add department");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await hrmsApi.updateDepartment(id, { name: editName.trim() });
      if (res.success) {
        toast.success("Department updated");
        setEditingId(null);
        const updated = await hrmsApi.getDepartments();
        if (updated.success) {
          setDepartments(updated.data);
          onUpdate(updated.data);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to update department");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await hrmsApi.deleteDepartment(id);
      if (res.success) {
        toast.success("Department deleted");
        const updated = await hrmsApi.getDepartments();
        if (updated.success) {
          setDepartments(updated.data);
          onUpdate(updated.data);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete department");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Manage Departments</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Department name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {adding ? "..." : "Add"}
            </button>
          </form>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                No departments found.
              </div>
            ) : (
              departments.map((dept) => (
                <div 
                  key={dept.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 group"
                >
                  {editingId === dept.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border border-indigo-300 text-sm focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleUpdate(dept.id)} className="text-xs font-bold text-green-600 mr-1">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-bold text-gray-400">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setEditingId(dept.id);
                            setEditName(dept.name);
                          }}
                          className="text-[12px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(dept.id)}
                          className="text-[12px] font-bold text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
