'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || localStorage.getItem("token");
  }
  return null;
};

export default function ViewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params.id;

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const token = getToken();
        if (!token) {
          setError("No authentication token found. Please login again.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/expenses/get-expense-by/${expenseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to fetch expense:", text);
          setError("Failed to load expense details.");
          return;
        }

        const data = await res.json();
        // Some APIs wrap the object in data, handle both
        setExpense(data.data || data.expense || data);
      } catch (err) {
        console.error("Error fetching expense:", err);
        setError("Error loading expense details.");
      } finally {
        setLoading(false);
      }
    };

    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading expense...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-lg text-red-500 text-center">{error}</div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/expense")}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Expenses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Expense not found</div>
        </div>
      </div>
    );
  }

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("en-GB");
    } catch {
      return value;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
              Expense Details
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              View full information for this expense entry.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <BackButton
              fallbackUrl="/expense"
              forceFallback={true}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border-none flex items-center justify-center shadow-sm active:scale-95"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Title
              </div>
              <div className="text-sm sm:text-base font-medium">
                {expense.title || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Category
              </div>
              <div className="text-sm sm:text-base">
                {expense.category || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Amount
              </div>
              <div className="text-sm sm:text-base font-semibold text-emerald-700">
                ₹{Number(expense.amount || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Expense Date
              </div>
              <div className="text-sm sm:text-base">
                {formatDate(expense.expenseDate || expense.expense_date)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Payment Mode
              </div>
              <div className="text-sm sm:text-base">
                {expense.paymentMode ||
                  expense.payment_mode ||
                  "-"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Created At
              </div>
              <div className="text-sm sm:text-base">
                {formatDate(expense.createdAt || expense.created_at)}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Description
            </div>
            <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
              {expense.description || "-"}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Notes
            </div>
            <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
              {expense.notes || "-"}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/expense/edit/${expenseId}`)}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm text-white bg-primary-600 hover:bg-primary-700 transition"
            >
              Edit Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


