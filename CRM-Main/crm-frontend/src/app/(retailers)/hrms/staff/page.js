"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  Users,
  PenSquare,
  ArrowLeft,
  Eye,
} from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import { useRole } from "@/app/(services)/context/RoleContext";
import PermissionWrapper from "@/components/PermissionWrapper";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/hrms`;

export default function StaffPage() {
  const router = useRouter();
  const { can } = useRole();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canCreate = can('EMPLOYEE', 'CREATE');
  const canUpdate = can('EMPLOYEE', 'UPDATE');
  const canRead = can('EMPLOYEE', 'READ');
  const showActions = canUpdate || canRead;

  // Fetch Employees on Mount
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        toast.error("Authentication failed. Please login.");
        router.push('/login'); // Redirect to login if no token
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
        // If the token is invalid (expired), redirect to login
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expired. Please login again.");
          router.push('/login');
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
    fetchEmployees();
  }, []);

  const handleStatusClick = (empId, currentStatus) => {
    if (!canUpdate) return;
    setSelectedEmployee(empId);
    setTargetStatus(currentStatus === "active" ? "inactive" : "active");
    setShowConfirm(true);
  };

  const handleStatusChange = async () => {
    setShowConfirm(false);
    setLoading(true); // Show loading briefly during update
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
        // Optimistic update or refetch
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  // Safe boundary check for pagination
  useEffect(() => {
    if (currentPage > 1 && currentEmployees.length === 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [employees, currentPage, currentEmployees.length]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your employees</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <PermissionWrapper module="EMPLOYEE" action="CREATE">
              <Link
                href="/hrms/staff/add"
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-[13px] sm:text-sm shadow-lg shadow-blue-100 active:scale-95"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Add New Employee</span>
              </Link>
            </PermissionWrapper>
            <div className="col-span-2 sm:col-span-1 sm:w-auto">
              <BackButton
                forceFallback={true}
                fallbackUrl="/hrms"
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border-none shadow-sm active:scale-95 flex items-center justify-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3 mb-4">
        {loading ? (
          <div className="py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
            <span className="text-sm">Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
            <span className="text-3xl mb-2 block">👥</span>
            <span className="text-sm font-medium">No employees found</span>
          </div>
        ) : (
          currentEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
              {/* Name + status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{employee.full_name}</div>
                  <div className="text-[11px] text-gray-400">{employee.email}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">ID: {employee.emp_id}</div>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {employee.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[9px] font-bold text-gray-400 uppercase">Role</div>
                  <div className="text-xs font-semibold text-gray-700 truncate">{employee.role || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[9px] font-bold text-gray-400 uppercase">Phone</div>
                  <div className="text-xs font-semibold text-gray-700 truncate">{employee.phone || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-[9px] font-bold text-gray-400 uppercase">Salary</div>
                  <div className="text-xs font-semibold text-gray-700 truncate">₹{employee.salary ? employee.salary.toLocaleString('en-IN') : 0}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {canUpdate && (
                  <button
                    onClick={() => handleStatusClick(employee.emp_id, employee.status)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      employee.status === 'active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {employee.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
                {canUpdate && (
                  <Link
                    href={`/hrms/staff/${employee.emp_id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 transition-all active:scale-95"
                  >
                    <PenSquare className="w-3.5 h-3.5" /> Edit
                  </Link>
                )}
                {canRead && (
                  <Link
                    href={`/hrms/staff/${employee.emp_id}/view`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-100 text-teal-700 text-xs font-bold hover:bg-teal-200 transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {showActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading employees...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4">No employees found.</td></tr>
              ) : (
                currentEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.emp_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                      <div className="text-xs text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.role || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{employee.salary ? employee.salary.toLocaleString('en-IN') : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      <button
                        onClick={() => handleStatusClick(employee.emp_id, employee.status)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          employee.status === 'active' ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`${
                          employee.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                      </button>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {canUpdate && (
                            <Link href={`/hrms/staff/${employee.emp_id}`}
                              className="inline-flex items-center justify-center w-9 h-9 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all" title="Edit">
                              <PenSquare className="w-4 h-4" />
                            </Link>
                          )}
                          {canRead && (
                            <Link href={`/hrms/staff/${employee.emp_id}/view`}
                              className="inline-flex items-center justify-center w-9 h-9 rounded bg-teal-100 text-teal-600 hover:bg-teal-200 transition-all" title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
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
    </div>
  );
}
