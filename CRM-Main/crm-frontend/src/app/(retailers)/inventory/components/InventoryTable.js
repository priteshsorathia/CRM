import { Edit, Package, Trash2, Download, FileText, Check } from "lucide-react";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import Link from "next/link";
import { getApiBase } from "@/utils/apiBase";

const API_BASE = getApiBase();

export default function InventoryTable({ items, onDeleteClick }) {
  // Calculate stock status based on current_stock (calculated from stock entries)
  const getStockStatus = (quantity) => {
    if (quantity <= 0) {
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    } else if (quantity < 10) {
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { status: "In Stock", color: "bg-green-100 text-green-800" };
    }
  };

  // Function to get complete image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // If it's a relative path, prepend the base URL
    if (imagePath.startsWith("/")) {
      return `${API_BASE}${imagePath}`;
    }

    // Default case - assume it's stored in uploads folder
    return `${API_BASE}/api/uploads/${imagePath}`;
  };

  const handleDownloadBarcode = async (item) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Setup Canvas Size (Standard Label scale)
    canvas.width = 400;
    canvas.height = 220;
    
    // Clear & Background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // 1. Draw Product Name (Truncated if long)
    ctx.fillStyle = "black";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    const displayName = item.item_name || item.name || "Product";
    ctx.fillText(displayName.length > 25 ? displayName.substring(0, 22) + "..." : displayName, canvas.width / 2, 45);
    
    // 2. Load & Draw Barcode Image
    const barcodeImg = new Image();
    barcodeImg.crossOrigin = "anonymous";
    barcodeImg.src = `${API_BASE}/api/barcode?code=${item.barcode}`;
    
    barcodeImg.onload = () => {
      // Draw Barcode in Center
      const bHeight = 85;
      const bWidth = 320;
      ctx.drawImage(barcodeImg, (canvas.width - bWidth) / 2, 65, bWidth, bHeight);
      
      // 3. Draw Barcode Text
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px monospace";
      ctx.fillText(item.barcode, canvas.width / 2, 175);
      
      // 4. Draw Price Overlay
      ctx.fillStyle = "black";
      ctx.font = "bold 16px sans-serif";
      const priceText = `₹${(item.selling_price ?? item.price)?.toFixed(2)}`;
      ctx.fillText(priceText, canvas.width / 2, 200);

      // Trigger Download
      const link = document.createElement("a");
      const filename = `${displayName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-barcode.png`;
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };

  // --- PDF GENERATION STATE ---
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- PDF GENERATION ---
  const generatePdfForItems = async (itemsToPrint) => {
    if (itemsToPrint.length === 0) return;
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      
      // PDF Config for Grid (2 items per row)
      const margin = 20;
      const itemWidth = 75;
      const itemHeight = 50;
      const xGap = 20;
      const yGap = 10;
      const itemsPerRow = 2;
      const itemsPerPage = itemsPerRow * 5; // 10 items per page
      
      let count = 0;
      
      for (const item of itemsToPrint) {
        if (!item.barcode) continue;

        if (count > 0 && count % itemsPerPage === 0) {
          doc.addPage();
        }

        const pageIndex = count % itemsPerPage;
        const row = Math.floor(pageIndex / itemsPerRow);
        const col = pageIndex % itemsPerRow;

        const x = margin + (col * (itemWidth + xGap));
        const y = margin + (row * (itemHeight + yGap));

        // 1. Product Name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        const name = (item.item_name || item.name).substring(0, 30);
        doc.text(name, x + itemWidth / 2, y, { align: "center" });

        // 2. Barcode Image
        try {
          const imgUrl = `${API_BASE}/api/barcode?code=${item.barcode}`;
          const imgData = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgUrl;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
          });
          doc.addImage(imgData, "PNG", x, y + 2, itemWidth, 22);
        } catch (err) {
          console.error("Barcode PDF Image Error:", err);
        }

        // 3. Barcode String
        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        doc.text(item.barcode, x + itemWidth / 2, y + 30, { align: "center" });

        // 4. Price
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const priceText = `Price: Rs.${(item.selling_price || item.price || 0).toFixed(2)}`;
        doc.text(priceText, x + itemWidth / 2, y + 38, { align: "center" });

        count++;
      }

      if (count > 0) {
        doc.save("barcodes.pdf");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateAllMobilePDF = () => {
    return generatePdfForItems(items);
  };

  useEffect(() => {
    const handler = () => generateAllMobilePDF();
    window.addEventListener("downloadAllMobileBarcodes", handler);
    return () => window.removeEventListener("downloadAllMobileBarcodes", handler);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">No items found</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-4">
        {items.map((item) => {
          const isCombo = item.isCombo;
          const stockQuantity = item.current_stock !== undefined && item.current_stock !== null ? item.current_stock : item.default_quantity || 0;
          const stockStatus = getStockStatus(stockQuantity);
          const imageUrl = getImageUrl(item.item_image);

          return (
            <div key={`${isCombo ? "combo" : "item"}-${item.id}`} className={`bg-white border rounded-2xl p-4 shadow-sm relative ${stockStatus.status === "Out of Stock" ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}`}>
              <div className="flex gap-4 mb-4">
                {/* Image Section */}
                <div className="relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.item_name} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                      <Package size={24} />
                    </div>
                  )}
                  {isCombo && <span className="absolute -top-2 -left-2 bg-purple-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg">Combo</span>}
                </div>

                {/* Main Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate leading-tight">{item.item_name || item.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{item.item_code || item.code}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${stockStatus.color}`}>
                      {stockStatus.status}
                    </span>
                    <span className="text-xs font-bold text-gray-700">{stockQuantity} {item.unit?.symbol || "unit"}</span>
                  </div>
                </div>
              </div>

              {/* Barcode Section (New) */}
              {item.barcode && (
                <div className="mb-4 flex flex-col items-center bg-white p-2 rounded-xl border border-gray-100 shadow-inner">
                  <img src={`${API_BASE}/api/barcode?code=${item.barcode}`} alt="Barcode" className="h-10 w-auto" />
                  <span className="text-[10px] font-mono text-gray-500 mt-1">{item.barcode}</span>
                  <button 
                    onClick={() => handleDownloadBarcode(item)}
                    className="mt-2 flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase transition-all active:scale-95"
                  >
                    <Download size={10} /> Download
                  </button>
                </div>
              )}

              {/* Price & Category Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Selling Price</p>
                  <p className="text-sm font-black text-blue-600">₹{(item.selling_price ?? item.price)?.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Category</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{isCombo ? "Combo" : item.category || "N/A"}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                {!isCombo ? (
                  <>
                    <Link href={`/inventory/item-form/${item.id}`} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:bg-blue-100">
                      <Edit size={14} /> Edit
                    </Link>
                    <Link href={`/inventory/stock/add/${item.id}`} className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:bg-green-100">
                      <Package size={14} /> + Stock
                    </Link>
                  </>
                ) : (
                  <div className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs flex items-center justify-center">
                    Combo Product
                  </div>
                )}
                <button onClick={() => onDeleteClick(item)} className="p-2 bg-red-50 text-red-500 rounded-xl active:bg-red-100">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const isCombo = item.isCombo;
                const stockQuantity = item.current_stock !== undefined && item.current_stock !== null ? item.current_stock : item.default_quantity || 0;
                const stockStatus = getStockStatus(stockQuantity);
                const imageUrl = getImageUrl(item.item_image);
                const rowHighlightClass = stockStatus.status === "Low Stock" ? "bg-yellow-50" : stockStatus.status === "Out of Stock" ? "bg-red-50" : "";

                return (
                  <tr key={`${isCombo ? "combo" : "item"}-${item.id}`} className={`${rowHighlightClass} hover:bg-gray-50 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative group">
                        {imageUrl && (
                          <img 
                            src={imageUrl} 
                            alt={item.item_name || "Product"} 
                            className="w-12 h-12 object-cover rounded shadow-sm" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        )}
                        <div className={`w-12 h-12 bg-gray-100 rounded items-center justify-center text-gray-400 border border-gray-200 ${imageUrl ? 'hidden' : 'flex'}`}>
                          <Package className="w-6 h-6" />
                        </div>
                        {isCombo && <span className="absolute -top-2 -left-2 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg">COMBO</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.item_name || item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Code: <span className="font-mono">{item.item_code || item.code}</span> • {isCombo ? "Combo" : item.category || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">₹{(item.selling_price ?? item.price)?.toFixed(2)}</div>
                      {item.original_price != null && (
                        <div className="text-[10px] text-gray-400 italic mb-1">Cost: ₹{item.original_price?.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${stockStatus.color}`}>
                        {stockQuantity} {item.unit?.symbol || "unit"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.barcode ? (
                        <div className="flex flex-col items-center max-w-[140px]">
                           <img 
                            src={`${API_BASE}/api/barcode?code=${item.barcode}`} 
                            alt="Barcode" 
                            className="h-8 w-auto hover:scale-150 transition-transform origin-center cursor-zoom-in" 
                          />
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-mono text-gray-400">{item.barcode}</span>
                             <button 
                               onClick={() => handleDownloadBarcode(item)}
                               className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                               title="Download Labeled Barcode"
                             >
                               <Download size={12} />
                             </button>
                           </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-[10px]">No Barcode</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCombo ? (
                          <>
                            <Link href={`/inventory/item-form/${item.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm transition-all" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <Link href={`/inventory/stock/add/${item.id}`} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 shadow-sm transition-all" title="Add Stock">
                              <Package className="w-4 h-4" />
                            </Link>
                          </>
                        ) : (
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">Combo</span>
                        )}
                        <button onClick={() => onDeleteClick(item)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 shadow-sm transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}