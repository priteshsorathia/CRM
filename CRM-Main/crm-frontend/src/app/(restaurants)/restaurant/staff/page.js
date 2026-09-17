'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUsers,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaPhone,
  FaEnvelope,
  FaUserTag
} from "react-icons/fa";
import { toast } from "sonner";
import RestaurantLoader from "@/components/RestaurantLoader";
import ConfirmationDialog from "@/components/ConfirmationDialog";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function StaffManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/api/hrms/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      } else {
        toast.error('Failed to load staff');
        setStaff([]);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      toast.error('Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (empId, currentStatus) => {
    setSelectedStaff(empId);
    setTargetStatus(currentStatus === "active" ? "inactive" : "active");
    setShowConfirm(true);
  };

  const handleStatusChange = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/api/hrms/staff/${selectedStaff}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: targetStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStaff(prev =>
            prev.map(emp =>
              emp.emp_id === selectedStaff
                ? { ...emp, status: targetStatus }
                : emp
            )
          );
          toast.success(`Status changed to ${targetStatus}`);
        } else {
          toast.error(data.error || 'Failed to update status');
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (empId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/hrms/staff/${empId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Staff member deleted successfully');
        loadStaff();
      } else {
        toast.error('Failed to delete staff member');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
      toast.error('Failed to delete staff member');
    }
  };

  const filteredStaff = staff.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.emp_id?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower) ||
      member.role?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeColor = (role) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower.includes('manager') || roleLower.includes('owner')) {
      return 'bg-purple-100 text-purple-800';
    } else if (roleLower.includes('chef') || roleLower.includes('cook')) {
      return 'bg-orange-100 text-orange-800';
    } else if (roleLower.includes('waiter') || roleLower.includes('server')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatRole = (role) => {
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
  };

  if (loading && staff.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <RestaurantLoader variant="container" message="Loading staff..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Staff Management
              </h1>
              <p className="text-gray-600 text-sm">
                Manage your restaurant staff members
              </p>
            </div>
            <Link
              href="/restaurant/staff/add"
              className="px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 w-fit"
            >
              <FaPlus />
              Add Staff Member
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email, phone, or role"
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value.replace(/\./g, '');
                setSearchTerm(val);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
            />
          </div>
        </div>

        {/* Staff List */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FaUsers className="text-gray-300 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Staff Members Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first staff member'}
            </p>
            {!searchTerm && (
              <Link
                href="/restaurant/staff/add"
                className="px-6 py-3 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 mx-auto w-fit"
              >
                <FaPlus />
                Add Staff Member
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{member.emp_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{member.full_name}</div>
                        {member.email && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <FaEnvelope className="text-[10px]" />
                            {member.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.role ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            <FaUserTag className="inline mr-1" />
                            {formatRole(member.role)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.phone ? (
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <FaPhone className="text-xs text-gray-400" />
                            {member.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{member.salary ? member.salary.toLocaleString('en-IN') : '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusClick(member.emp_id, member.status)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5655eb] ${member.status === "active"
                                ? "bg-green-500"
                                : "bg-gray-300"
                              }`}
                          >
                            <span
                              className={`${member.status === "active"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm`}
                            />
                          </button>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${member.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            {member.status === "active" ? (
                              <FaCheckCircle />
                            ) : (
                              <FaTimesCircle />
                            )}
                            {member.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/restaurant/staff/${member.emp_id}`}
                            className="p-2 text-[#5655eb] hover:bg-[#5655eb]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <Link
                            href={`/restaurant/staff/${member.emp_id}/view`}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                          <button
                            onClick={() => handleDelete(member.emp_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ConfirmationDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleStatusChange}
          title="Change Staff Status"
          description={`Are you sure you want to change this staff member's status to ${targetStatus}?`}
          confirmText="Change Status"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
