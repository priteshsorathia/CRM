"use client";

export default function ShopInformation({ shopDetails, logoUrl, merchantUpi }) {
    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Shop Information
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex-1 space-y-1 sm:space-y-2 text-sm sm:text-base">
                    <p className="font-medium">{shopDetails.shop_name || "N/A"}</p>
                    <p
                        className="text-gray-600 truncate"
                        title={shopDetails.shop_address}
                    >
                        {shopDetails.shop_address || "Address not available"}
                    </p>
                    <p>Phone: {shopDetails.shop_phone || "N/A"}</p>
                    {shopDetails.shop_email && <p>Email: {shopDetails.shop_email}</p>}
                    <p>GST: {shopDetails.shop_gst || "Not registered"}</p>
                    <p>UPI: {merchantUpi || shopDetails.upi_id || "N/A"}</p>
                </div>
                {logoUrl && (
                    <div className="flex-shrink-0 flex justify-center sm:justify-end">
                        <img
                            src={logoUrl}
                            alt="Shop Logo"
                            className="h-14 sm:h-16 object-contain"
                            onError={(e) => (e.target.style.display = "none")}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
