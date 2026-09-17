import { TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { FiPlus } from "react-icons/fi";
import { useState, useEffect } from "react";
import ItemRow from "@/app/(retailers)/invoices/components/ItemRow";
import { toast } from "sonner";
import Link from "next/link";
import QuickItemModal from "./QuickItemModal";

export default function InvoiceItems({
    items,
    errors = {},
    addItem,
    removeItem,
    updateItem,
    config,
    RowComponent = ItemRow
}) {
    const [topItems, setTopItems] = useState([]);
    const [loadingTop, setLoadingTop] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const fetchInventory = async () => {
        setLoadingInventory(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success && result.items) {
                setInventoryItems(result.items);
            }
        } catch (e) {
            console.error("Failed to fetch inventory", e);
        } finally {
            setLoadingInventory(false);
        }
    };

    useEffect(() => {
        const fetchTopItems = async () => {
            setLoadingTop(true);
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard?timeframe=month`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success && result.data?.topItems) {
                    const uniqueItems = result.data.topItems
                        .filter(item => item.name)
                        .slice(0, 10);
                    setTopItems(uniqueItems);
                }
            } catch (e) {
                console.error("Failed to fetch top items", e);
            } finally {
                setLoadingTop(false);
            }
        };

        fetchTopItems();
        fetchInventory();
    }, []);

    const addItemToInvoice = (fullItem) => {
        const emptyRow = items.find(item => !item.item_id && !item.item_name);

        const itemData = {
            item_id: fullItem.id,
            item_name: fullItem.item_name,
            unit_id: fullItem.unit?.id || fullItem.unit_id || null,
            unit_name: fullItem.unit?.name || fullItem.unit_name || 'Unit',
            unit_symbol: fullItem.unit?.symbol || fullItem.unit_symbol || '',
            price_per_unit: fullItem.selling_price || 0,
            quantity: '1',
            item_total: parseFloat(fullItem.selling_price) || 0,
            base_price_per_unit: fullItem.selling_price || 0,
            base_unit_symbol: fullItem.unit?.symbol || fullItem.unit_symbol || ''
        };

        if (emptyRow) {
            updateItem(emptyRow.id, itemData);
            toast.success(`Populated row with ${fullItem.item_name}`);
        } else {
            addItem(itemData);
            toast.success(`Added: ${fullItem.item_name}`);
        }
    };

    const handleQuickAdd = (topItem) => {
        const fullItem = inventoryItems.find(i =>
            i.id === topItem.item_id || i.item_name === topItem.name
        );

        if (!fullItem) {
            toast.error("Could not find full details for this item in inventory");
            return;
        }

        addItemToInvoice(fullItem);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
                <div className="flex flex-col">
                    <h2 className="text-base sm:text-lg font-bold">Items<span className="text-red-500">*</span></h2>
                    <p className="text-xs text-gray-400">Add products to your invoice</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addItem}
                        className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <FiPlus />
                        <span>Add Row</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowQuickAdd(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                    >
                        <FiPlus />
                        <span>New Item</span>
                    </button>
                </div>
            </div>
            {/* Mobile View: Cards */}
            <div className="sm:hidden space-y-4 mb-4">
                {items.length === 0 ? (
                   <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-sm text-gray-400">No items added yet</p>
                   </div>
                ) : (
                    items.map((item) => (
                        <RowComponent
                            key={item.id}
                            id={item.id}
                            itemData={item}
                            onRemove={removeItem}
                            onUpdate={updateItem}
                            inventoryItems={inventoryItems}
                            loadingInventory={loadingInventory}
                            isMobile={true}
                            isOnlyRow={items.length === 1}
                        />
                    ))
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block min-h-[200px] border border-gray-100 rounded-lg">
                <table className="w-full min-w-[900px] divide-y divide-gray-200 text-xs sm:text-sm table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px] w-[35%]">
                                Item Name
                            </th>
                            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px] w-[15%]">
                                Unit
                            </th>
                            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest text-[10px] w-[12%]">
                                Quantity
                            </th>
                            <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-widest text-[10px] w-[15%]">
                                {config.priceLabel} (₹)
                            </th>
                            <th className="px-3 py-2 text-center font-bold text-gray-500 uppercase tracking-widest text-[10px] w-[15%]">
                                Total (₹)
                            </th>
                            <th className="px-3 py-2 text-center font-bold text-gray-500 uppercase tracking-widest text-[10px] w-[8%]">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                            <RowComponent
                                key={item.id}
                                id={item.id}
                                itemData={item}
                                onRemove={removeItem}
                                onUpdate={updateItem}
                                inventoryItems={inventoryItems}
                                loadingInventory={loadingInventory}
                                isFirstRow={index === 0}
                                isOnlyRow={items.length === 1}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            {errors?.items && (
                <p className="text-red-500 text-xs mt-2 font-semibold italic">* {errors.items}</p>
            )}

            {/* Quick Add Suggestions */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-orange-500" />
                        Top Selling Items (Quick Add)
                    </h3>
                    {loadingTop && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {topItems.length === 0 && !loadingTop ? (
                        <p className="text-xs text-gray-400 italic">No popular items found yet</p>
                    ) : (
                        topItems.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleQuickAdd(item)}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-all shadow-sm whitespace-nowrap active:scale-95"
                            >
                                <span className="w-2 h-2 rounded-full bg-orange-400 group-hover:bg-orange-500"></span>
                                {item.name}
                                <span className="text-[10px] text-gray-400 group-hover:text-orange-400">₹{item.revenue.toLocaleString()}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <QuickItemModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onItemAdded={(newItem) => {
                    fetchInventory();
                    addItemToInvoice(newItem);
                }}
            />
        </div>
    );
}
