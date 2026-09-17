'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import BackButton from "@/components/BackButton";
import { FiSave } from "react-icons/fi";

export default function AddCategoryPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    if (!name.trim()) {
      setError('Category name cannot be empty or contain only spaces.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim() })
      });

      const result = await res.json();

      if (result.success) {
        toast.success('Category added successfully!');
        router.push('/inventory/category');
      } else {
        toast.error(result.error || 'Failed to add category');
      }
    } catch (error) {
      toast.error('Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Add New Category</h1>
          <BackButton />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const val = e.target.value.trimStart();
                setName(val);
                // Clear error as soon as user types valid content
                if (error && val.trim()) setError('');
              }}
              onBlur={validate}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? 'border-red-400 focus:ring-red-200 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }`}
              placeholder="e.g. Electronics, Groceries"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <FiSave /> {loading ? 'Saving...' : 'Save Category'}
          </button>
        </form>
      </div>
    </div>
  );
}