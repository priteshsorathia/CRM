'use client';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Tooltip, Legend
} from 'chart.js';
import { useState, useEffect } from 'react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Tooltip, Legend
);

export default function ChartCard({ title, data }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ FIX: Use local state so changing chart type DOES NOT reset the parent Dashboard filters
  const [chartType, setChartType] = useState('line');

  // Safety check: Prevent crash if data hasn't loaded yet
  if (!mounted || !data || !data.labels) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 h-full flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-400 text-sm">Loading Chart...</p>
      </div>
    );
  }

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Revenue (₹)",
        data: data.data,
        borderColor: "#3b82f6",
        backgroundColor: chartType === 'pie' 
          ? [
              '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
              '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#64748b'
            ]
          : '#3b82f655',
        fill: chartType !== 'pie',
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    } : undefined
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      default:
        return <Line data={chartData} options={options} />;
    }
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 h-full">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Line Chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l4-4m0 0l4 4m-4-4v8" />
            </svg>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Bar Chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Pie Chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="h-[250px] sm:h-[300px]">
        {renderChart()}
      </div>
    </div>
  );
}