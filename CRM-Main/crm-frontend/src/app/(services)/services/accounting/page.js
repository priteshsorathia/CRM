"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Plus,
    ChevronRight,
    ArrowRight,
    Search,
    Filter,
    FileText,
    Calculator,
    AlertCircle,
    X,
    Save,
    Trash2,
    Pencil,
    Download,
    Package
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getApiBase } from '@/utils/apiBase';
import { useRole } from '@/app/(services)/context/RoleContext';

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all bg-gray-50/50 hover:bg-white";
const Label = ({ children }) => <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">{children}</label>;

export default function AccountingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AccountingContent />
        </Suspense>
    );
}

function AccountingContent() {
    const { can } = useRole();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSheet, setActiveSheet] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSheetData, setNewSheetData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    // Summary data for top cards
    const [globalSummary, setGlobalSummary] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0
    });

    const [currentView, setCurrentView] = useState('years'); // 'years', 'months', 'details'
    const [selectedYear, setSelectedYear] = useState(null);
    const [fiscalPeriods, setFiscalPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [createType, setCreateType] = useState('year'); // 'year' or 'custom'
    const [customPeriodData, setCustomPeriodData] = useState({
        name: '',
        startMonth: 4,
        startYear: new Date().getFullYear(),
        endMonth: 3,
        endYear: new Date().getFullYear() + 1
    });
    const [editingPeriodId, setEditingPeriodId] = useState(null);

    const fetchSheets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/accounting/sheets?_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSheets(data.data);
            }
        } catch (e) {
            console.error('Failed to load sheets:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchPeriods = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/accounting/periods`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setFiscalPeriods(data.data);
            }
        } catch (e) {
            console.error('Failed to load periods:', e);
        }
    };

    const fetchGlobalOverview = async (year = null) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = year
                ? `${getApiBase()}/api/services/accounting/overview?year=${year}`
                : `${getApiBase()}/api/services/accounting/overview`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGlobalSummary({
                    revenue: data.data.revenue,
                    expenses: data.data.expenses,
                    profit: data.data.profit
                });
            }
        } catch (e) {
            console.error('Failed to load global overview:', e);
        }
    };

    useEffect(() => {
        fetchGlobalOverview(selectedYear);
    }, [selectedYear]);

    useEffect(() => {
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        if (year) {
            setSelectedYear(parseInt(year));
            if (month) {
                handleViewSheet({ month: parseInt(month), year: parseInt(year) });
            } else {
                setCurrentView('months');
            }
        } else {
            setCurrentView('years');
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentView === 'years') {
            params.delete('year');
            params.delete('month');
        } else if (currentView === 'months') {
            params.set('year', selectedYear);
            params.delete('month');
        } else if (currentView === 'details' && activeSheet) {
            params.set('year', activeSheet.year);
            params.set('month', activeSheet.month);
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [currentView, selectedYear, activeSheet]);

    useEffect(() => {
        fetchSheets();
        fetchPeriods();
    }, []);

    const handleCreateFiscalPeriod = async () => {
        if (!customPeriodData.name?.trim()) {
            alert('Please enter a period name');
            return;
        }
        if (!customPeriodData.startMonth || !customPeriodData.startYear || !customPeriodData.endMonth || !customPeriodData.endYear) {
            alert('All date fields are required');
            return;
        }

        // Simple chronological check
        const start = new Date(customPeriodData.startYear, customPeriodData.startMonth - 1, 1);
        const end = new Date(customPeriodData.endYear, customPeriodData.endMonth - 1, 1);
        if (end < start) {
            alert('End date cannot be earlier than start date');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = editingPeriodId
                ? `${getApiBase()}/api/services/accounting/periods/${editingPeriodId}`
                : `${getApiBase()}/api/services/accounting/periods`;

            const res = await fetch(url, {
                method: editingPeriodId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(customPeriodData)
            });

            const data = await res.json();
            if (data.success) {
                alert(editingPeriodId ? 'Fiscal Period updated successfully!' : 'Fiscal Period created successfully!');
                await fetchPeriods();
                setShowCreateModal(false);
                setEditingPeriodId(null);
            } else {
                throw new Error(data.message || 'Failed to save period');
            }
        } catch (e) {
            console.error('Failed to save period:', e);
            alert(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    const handleCreateSheet = async () => {
        // If year already exists, just navigate
        if (sheets.some(s => s.year === newSheetData.year)) {
            setSelectedYear(newSheetData.year);
            setCurrentView('months');
            setShowCreateModal(false);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = `${getApiBase()}/api/services/accounting/sheets/fetch?month=1&year=${newSheetData.year}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.success) {
                alert(`Fiscal Year ${newSheetData.year} initialized successfully!`);
                setSelectedYear(newSheetData.year);
                setCurrentView('months');
                setShowCreateModal(false);
                await fetchSheets();
            } else {
                throw new Error(data.message || 'Failed to initialize year');
            }
        } catch (e) {
            console.error('Failed to create sheet:', e);
            alert(`Error adding year: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteYear = async (year) => {
        if (!confirm(`Warning: This will delete ALL internal accounting ledger sheets and manual adjustments for the year ${year}. This action CANNOT be undone. Are you sure?`)) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/accounting/years/${year}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert(`All records for ${year} deleted successfully.`);
                await fetchSheets();
                await fetchGlobalOverview();
            } else {
                alert(data.message || 'Error deleting year');
            }
        } catch (e) {
            console.error('Delete year failed:', e);
            alert('Failed to delete year records');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPeriod = (period) => {
        setCustomPeriodData({
            name: period.name,
            startMonth: period.startMonth,
            startYear: period.startYear,
            endMonth: period.endMonth,
            endYear: period.endYear
        });
        setEditingPeriodId(period.id);
        setCreateType('custom');
        setShowCreateModal(true);
    };

    const handleViewSheet = async (sheetRef) => {
        if (!sheetRef?.month || !sheetRef?.year) {
            console.error('Missing month or year in sheetRef:', sheetRef);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = `${getApiBase()}/api/services/accounting/sheets/fetch?month=${sheetRef.month}&year=${sheetRef.year}`;
            console.log('Fetching sheet:', url);

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.success) {
                setActiveSheet(data.data);
                setCurrentView('details');
            } else {
                throw new Error(data.message || 'Failed to fetch sheet');
            }
        } catch (e) {
            console.error('Error fetching sheet details:', e);
            alert(`Failed to load ledger: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Get unique years from sheets
    const years = [...new Set(sheets.map(s => s.year))].sort((a, b) => b - a);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-0">
            {/* Page Header */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-100/50 transition-all duration-700" />

                <div className="flex items-center gap-4 relative z-10">
                    {currentView !== 'years' && (
                        <button
                            onClick={() => setCurrentView(currentView === 'details' ? 'months' : 'years')}
                            className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all hover:bg-white hover:shadow-sm"
                        >
                            <ArrowRight className="rotate-180" size={18} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                            {currentView === 'years' ? 'Ledger & Profits' :
                                currentView === 'months' ? (selectedPeriod ? selectedPeriod.name : `Fiscal Year ${selectedYear}`) :
                                    `${monthNames[activeSheet?.month - 1]} ${activeSheet?.year}`}
                        </h1>
                        <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                            {currentView === 'years' ? 'Corporate Financial Overview' :
                                currentView === 'months' ? 'Monthly Performance Tracking' :
                                    'Specific Ledger Record Details'}
                        </p>
                    </div>
                </div>

                {currentView === 'years' && can('ACCOUNTING', 'CREATE') && (
                    <button
                        onClick={() => {
                            setEditingPeriodId(null);
                            setCustomPeriodData({
                                name: '',
                                startMonth: 4,
                                startYear: new Date().getFullYear(),
                                endMonth: 3,
                                endYear: new Date().getFullYear() + 1
                            });
                            setShowCreateModal(true);
                        }}
                        className="relative z-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200/50 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest"
                    >
                        <Plus size={20} strokeWidth={2.5} /> Add Fiscal Year
                    </button>
                )}
            </div>

            {/* Quick Cards (Only on high level or with smaller size) */}
            {currentView !== 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {[
                        { label: "Total Revenue (YTD)", val: globalSummary.revenue, icon: TrendingUp, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", sub: "Collected" },
                        { label: "Total Expenses (YTD)", val: globalSummary.expenses, icon: TrendingDown, color: "rose", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", sub: "Operational" },
                        { label: "Net Profit (YTD)", val: globalSummary.profit, icon: DollarSign, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", sub: "Revenue - Expenses" }
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                            <div className={`p-4 rounded-xl border flex-shrink-0 transition-transform group-hover:scale-105 ${card.bg} ${card.border}`}>
                                <card.icon size={22} className={card.text} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold text-gray-900 leading-none">₹{Number(card.val || 0).toLocaleString()}</p>
                                <p className="text-sm font-semibold text-gray-700 mt-1 truncate">{card.label}</p>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content Area: Conditional Views */}
            <div className="min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Syncing Ledger...</p>
                    </div>
                ) : currentView === 'years' ? (
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center gap-4 py-4">
                            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] whitespace-nowrap">Select Management Period</h2>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-100 via-gray-200 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {years.length === 0 && fiscalPeriods.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <FileText className="text-gray-300" size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No periods defined</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Start by adding a regular fiscal year or a custom business period.</p>
                                </div>
                            ) : (
                                <>
                                    {years.map(year => (
                                        <div key={`year-${year}`} className="group relative">
                                            <button
                                                onClick={() => { setSelectedYear(year); setSelectedPeriod(null); setCurrentView('months'); }}
                                                className="w-full bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all text-left flex flex-col gap-4 relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover:bg-indigo-100/40 transition-colors" />
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50 flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm shadow-indigo-100/50">
                                                        <Calendar size={22} className="text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-3xl font-black text-gray-900 leading-none">{year}</p>
                                                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100/50 text-indigo-600 text-[9px] font-black uppercase tracking-widest mt-2 border border-indigo-100/30">
                                                            Financial Year
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cycle</p>
                                                        <p className="text-xs font-bold text-gray-600 mt-0.5">Jan - Dec</p>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                        <ChevronRight size={18} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-20 font-bold">
                                                {can('ACCOUNTING', 'UPDATE') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCustomPeriodData({
                                                                name: `FY ${year}`,
                                                                startMonth: 1,
                                                                startYear: year,
                                                                endMonth: 12,
                                                                endYear: year
                                                            });
                                                            setEditingPeriodId(null);
                                                            setCreateType('custom');
                                                            setShowCreateModal(true);
                                                        }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-amber-100 bg-white/40 backdrop-blur-md font-bold"
                                                        title="Convert"
                                                    >
                                                        <Pencil size={15} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                                {can('ACCOUNTING', 'DELETE') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteYear(year);
                                                        }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-rose-100 bg-white/40 backdrop-blur-md font-bold"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {fiscalPeriods.map(period => (
                                        <div key={`period-${period.id}`} className="group relative">
                                            <button
                                                onClick={() => { setSelectedPeriod(period); setSelectedYear(null); setCurrentView('months'); }}
                                                className="w-full bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all text-left flex flex-col gap-4 relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/30 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover:bg-emerald-100/40 transition-colors" />

                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm shadow-emerald-100/50">
                                                        <Calendar size={22} className="text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-10">
                                                        <p className="text-xl font-black text-gray-900 leading-tight truncate">{period.name}</p>
                                                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100/50 text-emerald-600 text-[9px] font-black uppercase tracking-widest mt-2 border border-emerald-100/30">
                                                            Custom Period
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Range</p>
                                                        <p className="text-xs font-bold text-gray-600 mt-0.5 truncate">
                                                            {monthNames[period.startMonth - 1].slice(0,3)} '{period.startYear % 100} - {monthNames[period.endMonth - 1].slice(0,3)} '{period.endYear % 100}
                                                        </p>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                        <ChevronRight size={18} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-20 font-bold">
                                                {can('ACCOUNTING', 'UPDATE') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditPeriod(period);
                                                        }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-amber-100 bg-white/40 backdrop-blur-md font-bold"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={15} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                                {can('ACCOUNTING', 'DELETE') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Delete this fiscal period?')) {
                                                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                                fetch(`${getApiBase()}/api/services/accounting/periods/${period.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                }).then(res => res.json()).then(data => {
                                                                    if (data.success) fetchPeriods();
                                                                    else alert(data.message);
                                                                });
                                                            }
                                                        }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-rose-100 bg-white/40 backdrop-blur-md font-bold"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                ) : currentView === 'months' ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1 h-3 bg-indigo-600 rounded-full" />
                            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Monthly Ledger Calendar</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {(() => {
                                let monthsToShow = [];
                                if (selectedPeriod) {
                                    // Calculate months between start and end
                                    let currM = selectedPeriod.startMonth;
                                    let currY = selectedPeriod.startYear;
                                    while (currY < selectedPeriod.endYear || (currY === selectedPeriod.endYear && currM <= selectedPeriod.endMonth)) {
                                        monthsToShow.push({ month: currM, year: currY, name: monthNames[currM - 1] });
                                        currM++;
                                        if (currM > 12) {
                                            currM = 1;
                                            currY++;
                                        }
                                    }
                                } else {
                                    monthsToShow = monthNames.map((mName, idx) => ({ month: idx + 1, year: selectedYear, name: mName }));
                                }

                                return monthsToShow.map((m, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleViewSheet({ month: m.month, year: m.year })}
                                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex items-center gap-4 group text-left"
                                    >
                                        <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 flex-shrink-0 transition-transform group-hover:scale-110">
                                            <FileText size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{m.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.year}</p>
                                        </div>
                                        <ArrowRight size={18} className="text-gray-200 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                ) : (
                    <SheetDetails
                        sheet={activeSheet}
                        onUpdate={() => {
                            handleViewSheet(activeSheet);
                            fetchGlobalOverview();
                        }}
                    />
                )}
            </div>

            {/* Create Year Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900">
                                    {editingPeriodId ? 'Edit Fiscal Period' : 'Add Fiscal Year'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {editingPeriodId ? 'Modify period range and name' : 'Populate a new years calendar'}
                                </p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {!editingPeriodId && (
                            <div className="flex items-center gap-2 mb-6 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setCreateType('year')}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${createType === 'year' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-50' : 'text-gray-400'}`}
                                >
                                    Standard Year
                                </button>
                                <button
                                    onClick={() => setCreateType('custom')}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${createType === 'custom' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-50' : 'text-gray-400'}`}
                                >
                                    Custom Range
                                </button>
                            </div>
                        )}

                        <div className="space-y-6">
                            {createType === 'year' ? (
                                <div>
                                    <Label>Select Year</Label>
                                    <select
                                        className={inputCls}
                                        value={newSheetData.year}
                                        onChange={(e) => setNewSheetData({ ...newSheetData, year: parseInt(e.target.value) })}
                                    >
                                        {[2024, 2025, 2026, 2027, 2028].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleCreateSheet}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 mt-6"
                                    >
                                        Open Year Calendar
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Period Name</Label>
                                        <input
                                            className={inputCls}
                                            placeholder="e.g. FY 2025-26"
                                            value={customPeriodData.name}
                                            onChange={(e) => setCustomPeriodData({ ...customPeriodData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Start Month</Label>
                                            <select
                                                className={inputCls}
                                                value={customPeriodData.startMonth}
                                                onChange={(e) => setCustomPeriodData({ ...customPeriodData, startMonth: parseInt(e.target.value) })}
                                            >
                                                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Start Year</Label>
                                            <select
                                                className={inputCls}
                                                value={customPeriodData.startYear}
                                                onChange={(e) => setCustomPeriodData({ ...customPeriodData, startYear: parseInt(e.target.value) })}
                                            >
                                                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>End Month</Label>
                                            <select
                                                className={inputCls}
                                                value={customPeriodData.endMonth}
                                                onChange={(e) => setCustomPeriodData({ ...customPeriodData, endMonth: parseInt(e.target.value) })}
                                            >
                                                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <Label>End Year</Label>
                                            <select
                                                className={inputCls}
                                                value={customPeriodData.endYear}
                                                onChange={(e) => setCustomPeriodData({ ...customPeriodData, endYear: parseInt(e.target.value) })}
                                            >
                                                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCreateFiscalPeriod}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        Create Custom Period
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SheetDetails({ sheet, onUpdate }) {
    const { can } = useRole();
    const [adjustments, setAdjustments] = useState(sheet.adjustments || []);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddAdjustment, setShowAddAdjustment] = useState(false);
    const [editingAdj, setEditingAdj] = useState(null);
    const [newAdj, setNewAdj] = useState({ type: 'Profit', amount: 0, description: '' });

    useEffect(() => {
        setAdjustments(sheet.adjustments || []);
    }, [sheet]);

    const handleSaveAdjustments = async (updatedList) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/accounting/sheets/${sheet.id}/adjustments`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ adjustments: updatedList })
            });
            const data = await res.json();
            if (data.success) {
                onUpdate();
            }
        } catch (e) {
            console.error('Failed to update adjustments:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const addAdjustment = () => {
        if (!newAdj.description || !newAdj.amount) return;

        let updated;
        if (editingAdj) {
            updated = adjustments.map(a => a.id === editingAdj.id ? { ...newAdj, id: a.id } : a);
        } else {
            updated = [...adjustments, { ...newAdj, id: Date.now() }];
        }

        setAdjustments(updated);
        handleSaveAdjustments(updated);
        setShowAddAdjustment(false);
        setEditingAdj(null);
        setNewAdj({ type: 'Profit', amount: 0, description: '' });
    };

    const startEdit = (adj) => {
        setEditingAdj(adj);
        setNewAdj({ type: adj.type, amount: adj.amount, description: adj.description });
        setShowAddAdjustment(true);
    };

    const removeAdjustment = (id) => {
        const updated = adjustments.filter(a => a.id !== id);
        setAdjustments(updated);
        handleSaveAdjustments(updated);
    };

    const totalAdjustments = adjustments.reduce((acc, curr) => {
        return curr.type === 'Profit' ? acc + parseFloat(curr.amount) : acc - parseFloat(curr.amount);
    }, 0);

    const finalProfit = (sheet.summary?.baseProfit || 0) + totalAdjustments - (sheet.summary?.totalAssets || 0);

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.setFont("helvetica", "bold");
        doc.text("CRM LEDGER", 20, 25);

        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175); // Gray 400
        doc.setFont("helvetica", "normal");
        const dateStr = new Date().toLocaleString();
        doc.text(`Generated on: ${dateStr}`, pageWidth - 20, 25, { align: "right" });

        doc.setDrawColor(243, 244, 246);
        doc.line(20, 32, pageWidth - 20, 32);

        // Title
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55); // Gray 800
        doc.setFont("helvetica", "bold");
        doc.text(`${monthNames[sheet.month - 1]} ${sheet.year} Financial Report`, 20, 45);

        // Summary Cards Section
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text("FINANCIAL SUMMARY", 20, 55);

        autoTable(doc, {
            startY: 60,
            head: [['Description', 'Amount']],
            body: [
                ['Total Fixed Asset Value (Deducted)', `- INR ${sheet.summary?.totalAssets?.toLocaleString() || '0'}`],
                ['Total Revenue (Invoiced)', `INR ${sheet.summary?.revenue?.toLocaleString() || '0'}`],
                ['Total Operational Expenses', `INR ${sheet.summary?.expenses?.toLocaleString() || '0'}`],
                ['Manual Adjustments (Net)', `INR ${totalAdjustments?.toLocaleString() || '0'}`],
                ['NET MONTHLY PROFIT', `INR ${finalProfit?.toLocaleString() || '0'}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { fontSize: 10, textColor: 31, fontStyle: 'bold' },
            columnStyles: { 1: { halign: 'right' } }
        });

        // Revenue Breakdown
        let currentY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text("1. REVENUE BREAKDOWN", 20, currentY);

        const invoiceRows = sheet.details?.invoices?.map(inv => [
            inv.invoiceNumber || '-',
            inv.clientName || inv.clientUsername || '-',
            new Date(inv.issuedDate).toLocaleDateString(),
            inv.status,
            `INR ${inv.paid?.toLocaleString() || '0'}`
        ]) || [];

        autoTable(doc, {
            startY: currentY + 5,
            head: [['No.', 'Client', 'Date', 'Status', 'Paid Amount']],
            body: invoiceRows,
            theme: 'striped',
            headStyles: { fillColor: [243, 244, 254], textColor: [79, 70, 229], fontStyle: 'bold' },
            styles: { fontSize: 9 }
        });

        // Expenses Breakdown
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setTextColor(225, 29, 72); // Rose 600
        doc.text("2. OPERATIONAL EXPENSES", 20, currentY);

        const expenseRows = sheet.details?.expenses?.map(exp => [
            exp.title,
            exp.category || '-',
            new Date(exp.expenseDate).toLocaleDateString(),
            `INR ${exp.amount?.toLocaleString() || '0'}`
        ]) || [];

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Description', 'Category', 'Date', 'Amount']],
            body: expenseRows,
            theme: 'striped',
            headStyles: { fillColor: [251, 241, 242], textColor: [225, 29, 72], fontStyle: 'bold' },
            styles: { fontSize: 9 }
        });

        // Manual Adjustments
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setTextColor(5, 150, 105); // Emerald 600
        doc.text("3. MANUAL ADJUSTMENTS", 20, currentY);

        const adjRows = adjustments.map(adj => [
            adj.description,
            adj.type,
            `INR ${adj.amount?.toLocaleString() || '0'}`
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Description', 'Type', 'Amount']],
            body: adjRows,
            theme: 'striped',
            headStyles: { fillColor: [236, 253, 245], textColor: [5, 150, 105], fontStyle: 'bold' },
            styles: { fontSize: 9 }
        });

        // Fixed Assets
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setTextColor(225, 29, 72); // Rose 600
        doc.text("4. FIXED ASSETS", 20, currentY);

        const assetRows = sheet.details?.assets?.map(asset => [
            asset.name,
            asset.category || '-',
            new Date(asset.purchaseDate).toLocaleDateString(),
            `INR ${asset.cost?.toLocaleString() || '0'}`
        ]) || [];

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Asset Name', 'Category', 'Purchase Date', 'Cost']],
            body: assetRows,
            theme: 'striped',
            headStyles: { fillColor: [255, 241, 242], textColor: [225, 29, 72], fontStyle: 'bold' },
            styles: { fontSize: 9 }
        });

        doc.save(`CRM_Ledger_${monthNames[sheet.month - 1]}_${sheet.year}.pdf`);
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
            {/* Sheet Header */}
            <div className="bg-indigo-50/50 px-8 py-8 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                            <Calendar className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {monthNames[sheet.month - 1]} <span className="text-gray-400 font-bold">{sheet.year}</span>
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Monthly Statistical Sheet</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={generatePDF}
                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold border border-gray-200 transition-all shadow-sm active:scale-95"
                        >
                            <Download size={16} className="text-indigo-600" />
                            Download Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <SummaryItem label="Collected" val={sheet.summary?.revenue} color="indigo" icon={TrendingUp} sub="Invoiced" />
                    <SummaryItem label="Asset Value" val={sheet.summary?.totalAssets} color="rose" icon={Package} sub="Fixed Assets" />
                    <SummaryItem label="Expenses" val={sheet.summary?.expenses} color="rose" icon={TrendingDown} sub="Operational" />
                    <SummaryItem label="Manual Adj." val={totalAdjustments} color={totalAdjustments >= 0 ? "emerald" : "rose"} icon={Calculator} sub="Manual" />
                    <SummaryItem label="Profit" val={finalProfit} color={finalProfit >= 0 ? "emerald" : "rose"} isBold icon={DollarSign} sub="Net Total" />
                </div>
            </div>

            {/* Sheet Content */}
            <div className="p-8 space-y-10">
                {/* Collected & Expenses Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue Source</h4>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <TrendingUp size={14} />
                            </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-gray-50/50 border border-gray-100 flex flex-col gap-4">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-bold text-gray-600">Client billing collections</span>
                                <span className="text-base font-black text-gray-900">₹{Number(sheet.summary?.revenue || 0).toLocaleString()}</span>
                            </div>

                            {sheet.details?.invoices?.length > 0 && (
                                <div className="pt-4 border-t border-gray-100/50 space-y-2">
                                    <div className="flex items-center justify-between px-1 mb-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Linked Invoices</span>
                                        <span className="text-[9px] font-bold text-indigo-500 uppercase">{sheet.details.invoices.length} entries</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                                        {sheet.details.invoices.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between text-[11px] bg-white p-3 rounded-xl border border-gray-50 hover:border-indigo-100 transition-colors">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="font-bold text-gray-700 truncate">{inv.client?.company || 'Unknown Client'}</p>
                                                    <p className="text-[9px] text-gray-400">#{inv.invoiceId || 'INV-' + inv.id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-gray-900">₹{Number(inv.paid || inv.amount).toLocaleString()}</p>
                                                    <p className={`text-[8px] font-bold uppercase ${inv.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{inv.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expense Outflow</h4>
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <TrendingDown size={14} />
                            </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-gray-50/50 border border-gray-100 flex flex-col gap-4">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-bold text-gray-600">Operational expenditures</span>
                                <span className="text-base font-black text-gray-900">₹{Number(sheet.summary?.expenses || 0).toLocaleString()}</span>
                            </div>

                            {sheet.details?.expenses?.length > 0 && (
                                <div className="pt-4 border-t border-gray-100/50 space-y-2">
                                    <div className="flex items-center justify-between px-1 mb-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expense Logs</span>
                                        <span className="text-[9px] font-bold text-rose-500 uppercase">{sheet.details.expenses.length} entries</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                                        {sheet.details.expenses.map(exp => (
                                            <div key={exp.id} className="flex items-center justify-between text-[11px] bg-white p-3 rounded-xl border border-gray-50 hover:border-rose-100 transition-colors">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="font-bold text-gray-700 truncate">{exp.category || 'General'}</p>
                                                    <p className="text-[9px] text-gray-400">{exp.description || 'No description'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-rose-600">₹{Number(exp.amount).toLocaleString()}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Adjustments Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Manual Adjustments</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add or modify profit/loss data manually</p>
                        </div>
                        {can('ACCOUNTING', 'CREATE') && (
                            <button
                                onClick={() => setShowAddAdjustment(true)}
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                                <Plus size={14} />
                                Add Entry
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {adjustments.length === 0 ? (
                            <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-300">
                                <AlertCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No manual adjustments added</p>
                            </div>
                        ) : (
                            adjustments.map((adj) => (
                                <div key={adj.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-10 rounded-full ${adj.type === 'Profit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{adj.description}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${adj.type === 'Profit' ? 'text-emerald-500' : 'text-rose-500'}`}>{adj.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className={`text-sm font-black ${adj.type === 'Profit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {adj.type === 'Profit' ? '+' : '-'} ₹{Number(adj.amount).toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-1.5 font-bold">
                                            {can('ACCOUNTING', 'UPDATE') && (
                                                <button
                                                    onClick={() => startEdit(adj)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all font-bold shadow-sm"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            {can('ACCOUNTING', 'DELETE') && (
                                                <button
                                                    onClick={() => removeAdjustment(adj.id)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Fixed Assets Breakdown */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Fixed Asset Portfolio</h4>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
                            <Package size={14} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sheet.details?.assets?.length === 0 ? (
                            <div className="col-span-full py-12 border-2 border-dashed border-gray-50 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                                <Package size={32} className="mb-2 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No assets registered</p>
                            </div>
                        ) : (
                            sheet.details?.assets?.map((asset) => (
                                <div key={asset.id} className="p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-base font-bold text-gray-800 tracking-tight group-hover:text-indigo-600 transition-colors">{asset.name}</p>
                                        <span className="text-sm font-black text-rose-500">₹{Number(asset.cost || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{asset.category}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-300 capitalize">{asset.status}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Adjustment Modal Snippet */}
            {showAddAdjustment && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 border border-white/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-extrabold text-gray-900">{editingAdj ? 'Edit Entry' : 'Add Entry'}</h3>
                            <button onClick={() => { setShowAddAdjustment(false); setEditingAdj(null); }} className="text-gray-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <Label>Entry Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Profit', 'Loss'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setNewAdj({ ...newAdj, type })}
                                            className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${newAdj.type === type
                                                ? type === 'Profit' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-rose-500 border-rose-500 text-white'
                                                : 'bg-gray-50 border-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. Tax refund, Hardware sales..."
                                    value={newAdj.description}
                                    onChange={(e) => setNewAdj({ ...newAdj, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Amount (₹)</Label>
                                <input
                                    type="number"
                                    className={inputCls}
                                    placeholder="0.00"
                                    value={newAdj.amount}
                                    onChange={(e) => setNewAdj({ ...newAdj, amount: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={addAdjustment}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 mt-2"
                            >
                                {editingAdj ? 'Save Changes' : 'Confirm Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryItem({ label, val, color, isBold, icon: Icon, sub }) {
    const colors = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
    };

    return (
        <div className={`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md`}>
            {Icon && (
                <div className={`p-3 rounded-xl border flex-shrink-0 ${colors[color]}`}>
                    <Icon size={18} />
                </div>
            )}
            <div className="min-w-0">
                <p className={`text-xl font-bold text-gray-900 leading-none ${isBold ? 'text-indigo-600' : ''}`}>
                    ₹{Number(val || 0).toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-gray-700 mt-1 truncate uppercase tracking-widest">{label}</p>
                {sub && <p className="text-[10px] font-medium text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}
