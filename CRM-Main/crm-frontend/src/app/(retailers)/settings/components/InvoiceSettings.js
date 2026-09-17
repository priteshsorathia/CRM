'use client';

import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getApiBase } from '@/utils/apiBase';

export default function InvoiceSettings() {
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [tax, setTax] = useState('0.00'); 
  const [stockMatter, setStockMatter] = useState(true);
  
  // ✅ New States
  const [enableBuyBackExchange, setEnableBuyBackExchange] = useState(false);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(false);
  const [priceColumnLabel, setPriceColumnLabel] = useState('Price per unit');
  const [makingChargesLabel, setMakingChargesLabel] = useState('Making Charges');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from API
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const API_BASE = getApiBase();
            
            const response = await fetch(`${API_BASE}/api/settings/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success && result.data) {
                const s = result.data;
                setInvoicePrefix(s.invoice_prefix || 'INV-');
                setInvoiceNotes(s.invoice_notes || '');
                setTax(s.default_tax !== undefined && s.default_tax !== null ? s.default_tax.toString() : '0.00');
                setStockMatter(s.stock_deduction ?? true);
                
                // ✅ Load New Settings
                setEnableBuyBackExchange(s.enable_buyback_exchange ?? false);
                setEnableBarcodeScanner(s.enable_barcode_scanner ?? false);
                setPriceColumnLabel(s.price_column_label || 'Price per unit');
                setMakingChargesLabel(s.making_charges_label || 'Making Charges');
            }
        } catch (error) {
            console.error("Failed to load invoice settings", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };
    fetchSettings();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE = getApiBase();
      
      const payload = {
        invoicePrefix: invoicePrefix.trim(),
        invoiceNotes: invoiceNotes.trim(),
        tax: parseFloat(tax) || 0,
        stockMatter,
        // ✅ Send New Settings
        enableBuyBackExchange,
        enableBarcodeScanner,
        priceColumnLabel: priceColumnLabel.trim() || "Price per unit",
        makingChargesLabel: makingChargesLabel.trim() || "Making Charges"
      };

      const response = await fetch(`${API_BASE}/api/settings/invoice`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Invoice settings saved successfully!');
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading settings...</div>;

  return (
    <section className="p-4 w-full">
      <h2 className="text-xl font-semibold mb-4">Invoice Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="bg-white p-4 rounded shadow-sm border space-y-4">
            <div>
              <label htmlFor="invoicePrefix" className="block text-sm font-medium mb-1">
                Invoice Prefix
              </label>
              <input
                id="invoicePrefix"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                required
                className="w-full border rounded p-2"
                placeholder="e.g. INV-"
              />
              <p className="text-xs text-slate-500 mt-1">
                Prefix added before invoice numbers (example: <span className="font-medium">INV-</span>).
              </p>
            </div>

            <div>
              <label htmlFor="invoiceNotes" className="block text-sm font-medium mb-1">
                Invoice Footer Notes
              </label>
              <textarea
                id="invoiceNotes"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                rows={4}
                className="w-full border rounded p-2"
                placeholder="Footer note shown on printed invoices..."
              />
            </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border space-y-4">
            <h3 className="font-medium text-gray-700">Calculation & Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tax" className="block text-sm font-medium mb-1">
                  Default Tax Rate (%)
                </label>
                <input
                  id="tax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="e.g. 0.00"
                />
              </div>

              <div>
                <label htmlFor="stockMatter" className="block text-sm font-medium mb-1">
                  Stock Deduction
                </label>
                <select
                  id="stockMatter"
                  value={stockMatter ? 'yes' : 'no'}
                  onChange={(e) => setStockMatter(e.target.value === 'yes')}
                  className="w-full border rounded p-2"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
        </div>

        {/* ✅ NEW SECTION: Customization */}
        <div className="bg-white p-4 rounded shadow-sm border space-y-4">
            <h3 className="font-medium text-gray-700">Customization</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Price Column Label */}
                <div>
                  <label htmlFor="priceLabel" className="block text-sm font-medium mb-1">
                    Price Column Label
                  </label>
                  <input
                    id="priceLabel"
                    value={priceColumnLabel}
                    onChange={(e) => setPriceColumnLabel(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="e.g. Price per unit, Gold Charges"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Customize the header name for the price column in invoices.
                  </p>
                </div>

                {/* 2. Making Charges Label */}
                <div>
                  <label htmlFor="makingChargesLabel" className="block text-sm font-medium mb-1">
                    Making Charges Label
                  </label>
                  <input
                    id="makingChargesLabel"
                    value={makingChargesLabel}
                    onChange={(e) => setMakingChargesLabel(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="e.g. Making Charges, Craft Charges"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Customize the label name for making charges in the totals section.
                  </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* 3. Enable BuyBack / Exchange */}
                <div>
                  <label htmlFor="buyBackToggle" className="block text-sm font-medium mb-1">
                    Enable BuyBack & Exchange Options
                  </label>
                  <select
                    id="buyBackToggle"
                    value={enableBuyBackExchange ? 'yes' : 'no'}
                    onChange={(e) => setEnableBuyBackExchange(e.target.value === 'yes')}
                    className="w-full border rounded p-2"
                  >
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Show options to mark invoices with "Exchange" or "BuyBack".
                  </p>
                </div>

                {/* 4. Enable Barcode Scanner Section */}
                <div>
                  <label htmlFor="barcodeScannerToggle" className="block text-sm font-medium mb-1">
                    Barcode Scanner Section
                  </label>
                  <select
                    id="barcodeScannerToggle"
                    value={enableBarcodeScanner ? 'yes' : 'no'}
                    onChange={(e) => setEnableBarcodeScanner(e.target.value === 'yes')}
                    className="w-full border rounded p-2"
                  >
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Show the Barcode Scanner input and camera scanner in the invoice form.
                  </p>
                </div>
            </div>
        </div>

        <div className="flex justify-start pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className='h-4 w-4' />
                  Save Settings
                </>
              )}
            </button>
        </div>
      </form>
    </section>
  );
}
