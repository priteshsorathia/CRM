'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportReportsCard = ({ currentMonth, payrollData, summary }) => {
  const [selectedFormat, setSelectedFormat] = useState('CSV');
  const [loading, setLoading] = useState(false);

  // --- Format Helpers ---
  const monthDate = new Date(currentMonth + '-01');
  const reportMonth = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const csvMonthLabel = `${monthDate.toLocaleDateString('en-US', { month: 'short' })}-${monthDate.toLocaleDateString('en-US', { year: '2-digit' })}`;

  const formatCurrency = (val) => `Rs. ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const csvEscape = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    const needsQuotes = /[",\n\r]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  // --- CSV Logic ---
  const generateCSV = () => {
    const lines = [];

    // Summary Header
    lines.push(`Report Title,${csvEscape(`Payroll Report - ${reportMonth}`)}`);
    lines.push(`Report Month,${csvEscape(csvMonthLabel)}`);
    lines.push(`Total Employees,${csvEscape(summary.totalEmployees)}`);
    lines.push(`Total Payroll,${csvEscape(formatCurrency(summary.totalPayroll))}`);
    lines.push(`Paid Payroll,${csvEscape(formatCurrency(summary.paidAmount))}`);
    lines.push(`Pending Payroll,${csvEscape(formatCurrency(summary.pendingAmount))}`);
    lines.push('');

    // Table Header
    lines.push('Employee Name,Net Salary,Status,Month,Paid On');

    // Table Rows
    payrollData.forEach(row => {
      const status = row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Unknown';
      const paidOn = row.payment_date
        ? `'${new Date(row.payment_date).toISOString().slice(0, 10)}`
        : 'Not Paid';

      lines.push([
        csvEscape(row.full_name || ''),
        csvEscape(formatCurrency(row.net_salary)),
        csvEscape(status),
        csvEscape(csvMonthLabel),
        csvEscape(paidOn)
      ].join(','));
    });

    const csvContent = `data:text/csv;charset=utf-8,${lines.join('\r\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_Report_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PDF Logic ---
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Add Title
    doc.setFontSize(18);
    doc.text("Payroll Summary Report", 14, 20);

    // 2. Add Summary Section
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Left Column
    doc.text(`Report Month:`, 14, 30);
    doc.text(reportMonth, 50, 30);

    doc.text(`Total Employees:`, 14, 36);
    doc.text(String(summary.totalEmployees), 50, 36);

    // Right Column (Financials)
    doc.text(`Total Payroll:`, 110, 30);
    doc.text(formatCurrency(summary.totalPayroll), 150, 30);

    doc.text(`Paid Amount:`, 110, 36);
    doc.setTextColor(0, 128, 0); // Green
    doc.text(formatCurrency(summary.paidAmount), 150, 36);

    doc.setTextColor(100);
    doc.text(`Pending Amount:`, 110, 42);
    doc.setTextColor(255, 0, 0); // Red
    doc.text(formatCurrency(summary.pendingAmount), 150, 42);

    // 3. Prepare Table Data
    const tableColumn = ["Employee Name", "Net Salary", "Status", "Month", "Paid On"];
    const tableRows = [];

    payrollData.forEach(row => {
      const salary = formatCurrency(row.net_salary);
      const status = row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Unknown';
      const paidOn = row.payment_date
        ? new Date(row.payment_date).toLocaleDateString('en-GB')
        : 'Not Paid';

      tableRows.push([
        row.full_name,
        salary,
        status,
        csvMonthLabel,
        paidOn
      ]);
    });

    // 4. Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [52, 58, 64] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'Paid') {
            data.cell.styles.textColor = [0, 128, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'Pending') {
            data.cell.styles.textColor = [255, 165, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // 5. Save
    doc.save(`Payroll_Report_${currentMonth}.pdf`);
  };

  const handleExport = () => {
    if (!payrollData || payrollData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    setLoading(true);
    try {
      if (selectedFormat === 'CSV') {
        generateCSV();
        toast.success("CSV downloaded successfully");
      } else if (selectedFormat === 'PDF') {
        generatePDF();
        toast.success("PDF downloaded successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Export Reports</h3>
      </div>

      {/* Description */}
      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm text-gray-600">
          Generate and download detailed payroll reports for <span className='font-bold text-gray-900'>{reportMonth}</span>.
        </p>
      </div>

      {/* Format Selection Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 mt-auto">
        {/* CSV Option */}
        <button
          onClick={() => setSelectedFormat('CSV')}
          disabled={loading}
          className={`
            relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200
            ${selectedFormat === 'CSV'
              ? 'border-green-600 bg-green-50 text-green-700 shadow-sm'
              : 'border-gray-50 hover:border-green-200 text-gray-500 hover:bg-gray-50'
            }
          `}
        >
          {selectedFormat === 'CSV' && (
            <div className="absolute top-1.5 right-1.5 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 h-4" />
            </div>
          )}
          <FileSpreadsheet className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 ${selectedFormat === 'CSV' ? 'text-green-600' : 'text-gray-400'}`} />
          <span className="text-xs sm:text-sm font-bold">CSV / Excel</span>
        </button>

        {/* PDF Option */}
        <button
          onClick={() => setSelectedFormat('PDF')}
          disabled={loading}
          className={`
            relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200
            ${selectedFormat === 'PDF'
              ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
              : 'border-gray-50 hover:border-red-200 text-gray-500 hover:bg-gray-50'
            }
          `}
        >
          {selectedFormat === 'PDF' && (
            <div className="absolute top-1.5 right-1.5 text-red-600">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 h-4" />
            </div>
          )}
          <FileText className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 ${selectedFormat === 'PDF' ? 'text-red-600' : 'text-gray-400'}`} />
          <span className="text-xs sm:text-sm font-bold">PDF Report</span>
        </button>
      </div>

      {/* Main Action Button */}
      <button
        onClick={handleExport}
        disabled={loading || !payrollData.length}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold
          transition-all duration-200 shadow-sm active:scale-95
          ${loading || !payrollData.length
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            : 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow-md'
          }
        `}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            Downloading...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download {selectedFormat}
          </>
        )}
      </button>
    </div>
  );
};

export default ExportReportsCard;
