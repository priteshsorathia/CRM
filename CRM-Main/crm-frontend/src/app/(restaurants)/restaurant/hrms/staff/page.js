"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  Users,
  PenSquare,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import AccessDenied from "@/components/AccessDenied";
import { getApiBase } from "@/utils/apiBase";

const API_URL = `${getApiBase()}/api/hrms`;

function formatRole(role) {
  if (!role) return '';
  const roleMap = {
    'shop_owner': 'Shop Owner',
    'restaurant_owner': 'Restaurant Owner',
    'admin': 'Administrator',
    'administrator': 'Administrator'
  };
  const mapped = roleMap[role.toLowerCase()] || role;
  return mapped
    .replace(/_/g, ' ')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function StaffPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isOwner =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner");

      setHasAccess(isOwner);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);

  // Fetch Employees on Mount
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        toast.error("Authentication failed. Please login.");
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/staff`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setEmployees(data.data);
      } else {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expired. Please login again.");
          router.push('/auth/login');
          return;
        }
        toast.error(data.error || "Failed to fetch employees");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessChecked && hasAccess) fetchEmployees();
  }, [accessChecked, hasAccess]);

  const handleStatusClick = (empId, currentStatus) => {
    setSelectedEmployee(empId);
    setTargetStatus(currentStatus === "active" ? "inactive" : "active");
    setShowConfirm(true);
  };

  const handleStatusChange = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/staff/${selectedEmployee}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.emp_id === selectedEmployee
              ? { ...emp, status: targetStatus }
              : emp
          )
        );
        toast.success(`Status changed to ${targetStatus}`);
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (empId) => {
    setDeleteEmployeeId(empId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteEmployee = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication failed. Please login.");
        router.push("/auth/login");
        return;
      }

      const res = await fetch(`${API_URL}/staff/${deleteEmployeeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete employee");
      }

      setEmployees((prev) => prev.filter((e) => e.emp_id !== deleteEmployeeId && String(e.id) !== String(deleteEmployeeId)));
      // Toast message color should be in red for delete (using toast.error)
      toast.error(json.message || "Employee deleted successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to delete employee");
    } finally {
      setLoading(false);
      setDeleteEmployeeId(null);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  // Safe boundary check for pagination after delete
  useEffect(() => {
    if (currentPage > 1 && currentEmployees.length === 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [employees, currentPage, currentEmployees.length]);

  if (!accessChecked) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
          Loading...
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" />;
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Staff Management
            </h1>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link
              href="/restaurant/hrms/staff/add"
              className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff</span>
            </Link>
            <BackButton forceFallback={true} fallbackUrl="/restaurant/hrms" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading employees...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">No employees found.</td>
                </tr>
              ) : (
                currentEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {employee.emp_id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {employee.full_name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {formatRole(employee.role) || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {employee.phone || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                      ₹{employee.salary ? employee.salary.toLocaleString("en-IN") : 0}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleStatusClick(employee.emp_id, employee.status)
                          }
                          className={`relative inline-flex flex-shrink-0 items-center h-5 sm:h-6 rounded-full w-9 sm:w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${employee.status === "active"
                            ? "bg-green-500"
                            : "bg-gray-200"
                            }`}
                        >
                          <span
                            className={`${employee.status === "active"
                              ? "translate-x-5 sm:translate-x-6"
                              : "translate-x-1"
                              } inline-block w-3 h-3 sm:w-4 sm:h-4 transform bg-white rounded-full transition-transform`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Edit Button */}
                        <Link
                          href={`/restaurant/hrms/staff/${employee.emp_id}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200"
                          title="Edit"
                        >
                          <PenSquare className="w-4 h-4" />
                        </Link>

                        {/* View Button */}
                        <Link
                          href={`/restaurant/hrms/staff/${employee.emp_id}/view`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded bg-teal-100 text-teal-600 hover:bg-teal-200 transition-all duration-200"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(employee.emp_id)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && employees.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, employees.length)}</span> of{' '}
                  <span className="font-medium">{employees.length}</span> staff members
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </button>
                  {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleStatusChange}
        title="Change Employee Status"
        description={`Are you sure you want to change this employee's status to ${targetStatus}?`}
        confirmText="Change Status"
        cancelText="Cancel"
      />
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
