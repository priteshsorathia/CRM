'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackButton from "@/components/BackButton";
import { FiPlus, FiTrash2, FiTag } from "react-icons/fi";

export default function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/get-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id, isExplicit) => {
    if (!isExplicit) {
      toast.error("This category is automatically detected from items and cannot be deleted here.");
      return;
    }

    if (!confirm('Delete this category?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Category deleted successfully');
        fetchCategories(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FiTag size={24} />
            </div>
            <span>Categories</span>
          </h1>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-3">
            <Link href="/inventory/category/add" className="w-full sm:w-auto">
              <button className="w-full px-2 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-1 sm:gap-2 hover:bg-blue-700 font-bold text-[11px] sm:text-sm shadow-lg shadow-blue-100 transition-all active:scale-95">
                <FiPlus className="shrink-0" /> 
                <span className="whitespace-nowrap">Add Category</span>
              </button>
            </Link>
            <div className="w-full sm:w-auto">
                <BackButton className="w-full h-full px-2 sm:px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-1 sm:gap-2 hover:bg-gray-200 font-bold text-[11px] sm:text-sm transition-all active:scale-95 border-none shadow-sm" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No categories found. Create one!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 font-medium text-gray-600">Name</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">
                      {cat.name}
                      {!cat.isExplicit && (
                        <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                          Auto-detected
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(cat.id, cat.isExplicit)} 
                        className={`transition-colors ${cat.isExplicit ? 'text-red-500 hover:text-red-700' : 'text-gray-300 cursor-not-allowed'}`}
                        title={cat.isExplicit ? "Delete category" : "Auto-detected categories cannot be deleted"}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}