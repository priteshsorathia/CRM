"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    FaShoppingCart,
    FaPlus,
    FaMinus,
    FaSearch,
    FaChevronRight,
    FaUtensils,
    FaCheckCircle,
    FaRegSmileBeam,
    FaExclamationCircle,
    FaClipboardList,
    FaHistory,
    FaWallet,
    FaQrcode,
    FaArrowLeft,
    FaArrowRight,
    FaGooglePay,
    FaMobileAlt
} from 'react-icons/fa';
import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBase } from '@/utils/apiBase';
import RestaurantLoader from '@/components/RestaurantLoader';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';

const MenuImage = ({ src, alt, className, fallbackSize = 24 }) => {
    const [error, setError] = React.useState(false);

    if (error || !src) {
        return (
            <div className="flex flex-col items-center gap-1">
                <FaUtensils className="text-gray-200" size={fallbackSize} />
                <span className="text-[8px] font-bold text-gray-200">G-VOICE</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
};

function SelfOrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('t')?.trim();

    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState(null);
    const [table, setTable] = useState(null);
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [cartLoaded, setCartLoaded] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatus, setOrderStatus] = useState('browsing');
    const [placingOrder, setPlacingOrder] = useState(false);

    // New states for "My Orders" and Payment
    const [myOrders, setMyOrders] = useState([]);
    const [isSessionPaid, setIsSessionPaid] = useState(false);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders'
    const [tabLoaded, setTabLoaded] = useState(false);
    const [isPolling, setIsPolling] = useState(true);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        notes: ''
    });
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setOrderStatus('error');
            setLoading(false);
            return;
        }
        fetchMenu();
        fetchMyOrders();

        // Start polling for orders status
        const interval = setInterval(fetchMyOrders, 10000); // 10s poll
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (shop && table && !cartLoaded) {
            const savedCart = localStorage.getItem(`cart_${shop.id}_${table.id}`);
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
            setCartLoaded(true);
        }
    }, [shop, table, cartLoaded]);

    useEffect(() => {
        if (cartLoaded && shop && table) {
            localStorage.setItem(`cart_${shop.id}_${table.id}`, JSON.stringify(cart));
        }
    }, [cart, cartLoaded, shop, table]);

    useEffect(() => {
        if (shop && table && !tabLoaded) {
            const savedTab = localStorage.getItem(`activeTab_${shop.id}_${table.id}`);
            if (savedTab) {
                setActiveTab(savedTab);
            }
            setTabLoaded(true);
        }
    }, [shop, table, tabLoaded]);

    useEffect(() => {
        if (tabLoaded && shop && table) {
            localStorage.setItem(`activeTab_${shop.id}_${table.id}`, activeTab);
        }
    }, [activeTab, tabLoaded, shop, table]);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const base = getApiBase() || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8001` : '');
            const res = await fetch(`${base}/api/restaurant/self-order/menu/${token}`);
            const data = await res.json();

            if (data.success) {
                setShop(data.shop);
                setTable(data.table);
                setMenu(data.menu);

                // Pre-fill customer info if table is already occupied
                if (data.currentCustomer) {
                    setCustomerInfo(prev => ({
                        ...prev,
                        name: data.currentCustomer.name || '',
                        phone: data.currentCustomer.phone || ''
                    }));
                }

                setActiveCategory('all');
                setOrderStatus('browsing');
                setErrorMessage('');
            } else {
                setErrorMessage(data.error || 'Invalid or inactive table');
                setOrderStatus('error');
            }
        } catch (error) {
            console.error('Fetch menu error:', error);
            setErrorMessage('Could not connect to restaurant network. Please ensure you are on the restaurant WiFi.');
            setOrderStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyOrders = async () => {
        if (!token) return;
        try {
            const base = getApiBase() || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8001` : '');
            const res = await fetch(`${base}/api/restaurant/self-order/orders/${token}`);
            const data = await res.json();
            if (data.success) {
                setMyOrders(data.orders || []);
                setIsSessionPaid(data.isPaid || false);
                if (data.isPaid) {
                    setIsPolling(false);
                    setPaymentSuccess(true);
                }
            }
        } catch (error) {
            console.error('Fetch orders error:', error);
        }
    };

    const handlePaymentAction = () => {
        if (!shop?.upiId) {
            toast.error("Online payment is not configured for this restaurant. Please pay at the counter.");
            return;
        }
        const link = generateUPILink(myOrdersTotal);
        if (link) {
            window.location.assign(link);
        } else {
            toast.error("Could not generate payment link. Please try again.");
        }
    };

    const generateUPILink = (amount) => {
        if (!shop?.upiId) return null;
        
        const cleanUpiId = shop.upiId.trim();
        const cleanName = (shop.name || 'Restaurant').trim();
        const name = encodeURIComponent(cleanName);
        
        // Generate a descriptive note for the bill: "Table T-07 | ID: 123, 124"
        const orderTokens = myOrders.map(o => o.order_token.split('-').pop()).join(', ');
        const noteText = `Table ${table?.number} | Orders: ${orderTokens}`;
        const encodedNote = encodeURIComponent(noteText);
        
        return `upi://pay?pa=${cleanUpiId}&pn=${name}&am=${finalTotal.toFixed(2)}&cu=INR&tn=${encodedNote}`;
    };

    const handlePaymentComplete = async () => {
        // This is now triggered by Admin, but we keep the success screen logic
        setPaymentSuccess(true);
        setIsSessionPaid(true);
    };

    const myOrdersTotal = myOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const taxRate = shop?.taxRate || 0;
    const subtotal = myOrdersTotal;
    const taxAmount = (subtotal * taxRate) / 100;
    const finalTotal = subtotal + taxAmount;

    const myOrdersCount = myOrders.length;
    const myOrdersItemsCount = myOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    const totalPayable = finalTotal;

    const hasServableOrders = myOrders.some(o => ['ready', 'completed', 'served'].includes(o.status.toLowerCase()));
    
    // Check if there are any active orders that need payment
    const hasActiveOrders = myOrders.some(o => ['pending', 'preparing', 'ready', 'served'].includes(o.status.toLowerCase()));

    const imageUrl = (path) => {
        if (!path) return null;
        const s = String(path).trim();
        if (!s) return null;
        // Already a full URL, use as-is
        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;

        // Always build base from browser's current hostname so LAN customers get correct IP
        let base = '';
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const host = window.location.hostname;
            // Use same host, backend runs on port 8001
            base = `${protocol}//${host}:8001`;
        } else {
            base = getApiBase() || '';
        }

        // Normalize path — strip leading slashes then ensure 'uploads/' prefix
        let cleanPath = s.replace(/^\/+/, '');
        if (!cleanPath.startsWith('uploads/')) {
            cleanPath = `uploads/${cleanPath}`;
        }

        return `${base}/${cleanPath}`;
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        toast.success(`Added ${item.name}`);
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.id !== itemId);
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        if (!customerInfo.name.trim()) { toast.error("Please enter your name"); return; }
        if (!customerInfo.phone.trim() || customerInfo.phone.length < 10) { toast.error("Valid 10-digit mobile number required"); return; }

        setPlacingOrder(true);
        try {
            const base = getApiBase() || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8001` : '');
            const res = await fetch(`${base}/api/restaurant/self-order/place/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerInfo.name,
                    customer_phone: customerInfo.phone,
                    customer_notes: customerInfo.notes,
                    items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity, notes: '' }))
                })
            });
            const data = await res.json();
            if (data.success) {
                setOrderStatus('success');
                setCart([]);
                if (shop && table) {
                    localStorage.removeItem(`cart_${shop.id}_${table.id}`);
                }
                fetchMyOrders(); // Immediately refresh orders
            } else { toast.error(data.error || 'Failed to place order'); }
        } catch (error) { toast.error('Connection error'); } finally { setPlacingOrder(false); }
    };

    const scrollToCategory = (catId) => {
        setActiveCategory(catId);
        if (catId === 'all') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const element = document.getElementById(`cat-${catId}`);
        if (element) {
            const offset = 200;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
    };

    const filteredMenu = menu.map(cat => ({
        ...cat,
        items: (cat.items || []).filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0);

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><RestaurantLoader message="Setting your table..." /></div>;

    if (orderStatus === 'error') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"> <FaExclamationCircle className="text-red-500" size={40} /> </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Invalid Session</h1>
                <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">{errorMessage || 'Please scan the QR code again.'}</p>
                <button onClick={() => window.location.reload()} className="px-10 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-xl shadow-indigo-100 active:scale-95 transition-transform">Try Again</button>
            </div>
        );
    }

    if (orderStatus === 'success') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white overflow-hidden">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"> <FaCheckCircle className="text-green-500" size={48} /> </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Order Placed!</motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-gray-500 mb-10 max-w-xs leading-relaxed">Your meal is being prepared for <span className="text-indigo-600 font-bold">Table {table?.number}</span>.</motion.p>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-indigo-50 p-7 rounded-[40px] w-full max-w-xs border border-indigo-100">
                    <FaClipboardList className="text-indigo-600 mx-auto mb-3" size={32} />
                    <p className="text-sm font-bold text-indigo-900">Track your order status</p>
                    <button onClick={() => { setOrderStatus('browsing'); setActiveTab('orders'); }} className="mt-4 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold border border-indigo-200 shadow-sm active:scale-95 transition-transform">Go to My Orders</button>
                    <button onClick={() => setOrderStatus('browsing')} className="mt-2 w-full py-3 bg-white text-gray-500 rounded-2xl font-bold text-xs active:scale-95 transition-transform">Order more items</button>
                </motion.div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans selection:bg-indigo-100">


            {/* Header with Search and Categories */}
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 shrink-0 p-1.5">
                        <MenuImage
                            src={imageUrl(shop?.logo)}
                            alt="logo"
                            className="w-full h-full object-contain"
                            fallbackSize={18}
                        />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-gray-900 leading-tight">{shop?.name}</h1>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none mt-1">{table?.number}</p> 
                    </div>
                </div>

                {/* Search Bar - Precise Screenshot Style */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-300" size={16} />
                    </div>
                    <input
                        type="text"
                        className="w-full h-12 pl-12 pr-5 bg-white border border-gray-100 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all placeholder:text-gray-300"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Categories - Pill Shape Screenshot Style */}
                {!searchQuery && activeTab === 'menu' && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-0.5">
                        <button
                            onClick={() => scrollToCategory('all')}
                            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border ${activeCategory === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-[#334155] hover:border-gray-200'}`}
                        >
                            All
                        </button>
                        {menu.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => scrollToCategory(cat.id)}
                                className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all border ${activeCategory === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-[#334155] hover:border-gray-200'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <FaHistory className="text-indigo-600" />
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Order History</h2>
                        </div>
                        <div className="flex gap-2">
                             <div className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase">{myOrdersCount} ORDERS</div>
                             <div className="px-3 py-1 bg-green-50 rounded-full text-[10px] font-black text-green-600 border border-green-100 uppercase">₹{myOrdersTotal}</div>
                        </div>
                    </div>
                )}
            </header>

            {/* Menu Items Section */}
            {activeTab === 'menu' && (
                <main className="px-4 py-6 space-y-8">
                    {filteredMenu.map(category => (
                        <section key={category.id} id={`cat-${category.id}`} className="space-y-4">
                            <h2 className="text-[15px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{category.name}</h2>

                            <div className="grid grid-cols-1 gap-4">
                                {category.items.map(item => {
                                    const inCart = cart.find(i => i.id === item.id);
                                    return (
                                        <motion.div key={item.id} className="bg-white rounded-[24px] border border-gray-100 p-4 flex gap-4 relative shadow-sm">
                                            <div className="w-20 h-20 rounded-[20px] overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-50">
                                                <MenuImage
                                                    src={imageUrl(item.image)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    fallbackSize={24}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {(() => {
                                                        const rawType = item.food_type?.toLowerCase().trim() || '';
                                                        const type = rawType.replace(/[\s\-_]/g, '');

                                                        let isVeg = ['veg', 'pureveg', 'vegetarier'].includes(type);
                                                        let isNonVeg = ['nonveg', 'non', 'nv', 'nonvegetarian'].includes(type);

                                                        if (isNonVeg) {
                                                            return (
                                                                <div className="w-3.5 h-3.5 border-2 border-red-500 flex items-center justify-center shrink-0">
                                                                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-500 mb-[0.5px]" />
                                                                </div>
                                                            );
                                                        } else if (isVeg) {
                                                            return (
                                                                <div className="w-3.5 h-3.5 border-2 border-green-500 flex items-center justify-center shrink-0">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="w-3.5 h-3.5 border-2 border-blue-500 flex items-center justify-center shrink-0">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                    <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
                                                </div>
                                                <p className="text-indigo-600 font-bold text-base tracking-tight">₹{item.price}</p>
                                            </div>

                                            <div className="flex items-center">
                                                <AnimatePresence mode="wait">
                                                    {inCart ? (
                                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center bg-indigo-50 p-1 rounded-xl border border-indigo-100">
                                                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-indigo-600 active:scale-75"><FaMinus size={10} /></button>
                                                            <span className="text-xs font-black w-5 text-center text-indigo-600">{inCart.quantity}</span>
                                                            <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-indigo-600 active:scale-75"><FaPlus size={10} /></button>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button
                                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                            onClick={() => addToCart(item)}
                                                            className="h-10 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 active:scale-95"
                                                        >
                                                            Add
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </main>
            )}

            {/* My Orders Section */}
            {activeTab === 'orders' && (
                <main className="px-4 py-8 space-y-6">
                    {myOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                                <FaClipboardList className="text-gray-200" size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">No active orders</h3>
                            <p className="text-sm text-gray-400 max-w-[200px]">Items you order from the menu will appear here.</p>
                            <button onClick={() => setActiveTab('menu')} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-100 active:scale-95">Browse Menu</button>
                        </div>
                    ) : (
                        <>
                            {myOrders.map((order, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={order.id} 
                                    className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm"
                                >
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">ORDER #{order.order_token.split('-').pop()}</p>
                                            <p className="text-[11px] font-bold text-gray-400 mt-1">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                            order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                                            order.status === 'served' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                            order.status === 'ready' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            order.status === 'preparing' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[11px] font-black text-gray-500 border border-gray-100">{item.quantity}x</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold mt-1">₹{item.price} each</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Order Total</span>
                                            <span className="text-base font-black text-indigo-600 tracking-tight">₹{order.total_amount}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            <div className="pt-4">
                                <div className="bg-indigo-900 rounded-3xl p-6 shadow-xl text-white">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Items</p>
                                            <p className="text-xl font-bold">{myOrdersItemsCount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Table</p>
                                            <p className="text-xl font-bold">{table?.number}</p>
                                        </div>
                                    </div>

                                    {/* Bill Breakdown */}
                                    <div className="space-y-2 mb-6 border-b border-indigo-800 pb-6 opacity-90">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-indigo-300 font-medium tracking-wide italic">Subtotal</span>
                                            <span className="font-bold tracking-tight">₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        {taxRate > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-indigo-300 font-medium tracking-wide italic">GST ({taxRate}%)</span>
                                                <span className="font-bold tracking-tight">+ ₹{taxAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">Total Amount</span>
                                            <span className="text-3xl font-black tracking-tighter">₹{finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {isSessionPaid ? (
                                        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                                            <FaCheckCircle className="text-green-400" size={18} />
                                            <p className="text-sm font-bold text-green-100">Payment Completed</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <button 
                                                onClick={handlePaymentAction}
                                                className="w-full bg-white text-indigo-900 h-16 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-bold shadow-lg"
                                            >
                                                 <FaWallet size={20} />
                                                 <span className="text-lg">Pay Total Bill</span>
                                            </button>

                                            <div className="text-center">
                                                {shop?.upiId && (
                                                    <p className="text-[10px] font-medium text-indigo-300 mb-2 opacity-80">UPI ID: {shop.upiId}</p>
                                                )}
                                                <p className="text-[9px] text-indigo-300 font-medium uppercase tracking-[0.15em] opacity-60">
                                                    Fast & Secure UPI Payment
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            )}


            {/* Payment Success Overlay */}
            <AnimatePresence>
                {paymentSuccess && isSessionPaid && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 text-center"
                    >
                         <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8"
                        >
                             <FaCheckCircle className="text-green-500" size={64} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Payment Successful!</h2>
                        <p className="text-gray-500 mb-12 max-w-xs leading-relaxed font-medium">Thank you for dining with us! Your payment has been received and confirmed.</p>
                        
                        <div className="bg-gray-50 rounded-[32px] p-6 w-full max-w-xs mb-10 border border-gray-100">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</span>
                                 <span className="text-xl font-black text-gray-900 tracking-tight">₹{myOrdersTotal}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Table</span>
                                 <span className="text-sm font-black text-indigo-600">{table?.number}</span>
                             </div>
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full max-w-xs py-5 bg-gray-900 text-white rounded-full font-black text-sm tracking-widest active:scale-95 transition-all shadow-2xl"
                        >
                            DONE
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white border-t border-gray-100 mt-6 relative z-10">
                <Footer />
            </div>

            {/* Bottom Navigation / Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => setActiveTab('menu')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'menu' ? 'text-indigo-600 scale-110' : 'text-gray-400 opacity-60'}`}
                    >
                        <FaUtensils size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Menu</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'orders' ? 'text-indigo-600 scale-110' : 'text-gray-400 opacity-60'}`}
                    >
                        <FaClipboardList size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest">My Orders</span>
                        {myOrders.length > 0 && !isSessionPaid && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </button>
                </div>

                <div className="flex-1 flex justify-end ml-6">
                    {cart.length > 0 ? (
                        <button 
                            onClick={() => setOrderStatus('checkout')}
                            className="bg-indigo-600 text-white px-6 py-3.5 rounded-full flex items-center gap-3 shadow-lg shadow-indigo-200 active:scale-95 transition-all w-full max-w-[180px] justify-center"
                        >
                            <FaShoppingCart size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">View Cart ({cart.length})</span>
                        </button>
                    ) : (myOrdersTotal > 0 && !isSessionPaid) ? (
                        <button 
                            onClick={handlePaymentAction}
                            className="bg-gray-900 text-white px-6 py-3.5 rounded-full flex items-center gap-3 shadow-lg shadow-gray-200 active:scale-95 transition-all w-full max-w-[180px] justify-center"
                        >
                            <FaWallet size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none text-center">Pay Bill<br/>(₹{finalTotal.toFixed(2)})</span>
                        </button>
                    ) : (
                        <div className="bg-gray-50 text-gray-400 px-6 py-3.5 rounded-full flex items-center gap-3 w-full max-w-[180px] justify-center opacity-50">
                            <FaShoppingCart size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Empty</span>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {orderStatus === 'checkout' && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOrderStatus('browsing')} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="relative bg-white rounded-t-[40px] h-[92vh] flex flex-col overflow-hidden">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-6 shrink-0" />
                            <div className="px-8 flex-1 overflow-y-auto pb-32">
                                <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Review Order</h2>
                                <div className="space-y-6 mb-10">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-xs border border-gray-100">{item.quantity}x</div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 leading-none">{item.name}</p>
                                                    <p className="text-[11px] text-indigo-600 font-bold mt-1.5 tracking-tight">₹{item.price * item.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-white border border-gray-100 text-gray-400 rounded-lg flex items-center justify-center active:scale-90"><FaMinus size={8} /></button>
                                                <button onClick={() => addToCart(item)} className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm active:scale-90"><FaPlus size={8} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-px bg-gray-100 my-6" />
                                    <div className="flex justify-between items-center pr-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Bill</span>
                                        <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{cartTotal}</span>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 block mb-2">Customer Name</label>
                                        <input type="text" placeholder="Enter your name" className="w-full h-12 px-5 bg-gray-50 border-none rounded-[16px] text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300" value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 block mb-2">Mobile Number</label>
                                        <input type="tel" placeholder="10-digit number" className="w-full h-12 px-5 bg-gray-50 border-none rounded-[16px] text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300" value={customerInfo.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setCustomerInfo({ ...customerInfo, phone: val }); }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 block mb-2">Instructions</label>
                                        <textarea placeholder="e.g. Extra spicy, No onions..." className="w-full p-4 bg-gray-50 border-none rounded-[16px] text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300 resize-none" rows={2} value={customerInfo.notes} onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 flex flex-col gap-3">
                                <button onClick={handlePlaceOrder} disabled={placingOrder} className="w-full h-14 bg-indigo-600 text-white rounded-full font-black text-base shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                    {placingOrder ? 'PLACING...' : 'CONFIRM ORDER'}
                                    {!placingOrder && <FaCheckCircle size={18} />}
                                </button>
                                <button onClick={() => setOrderStatus('browsing')} className="w-full h-10 text-gray-400 font-bold text-xs tracking-tight active:text-gray-900">BACK TO MENU</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                body { overflow-x: hidden; }
            `}</style>
        </div>
    );
}

export default function SelfOrderPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <SelfOrderContent />
        </Suspense>
    );
}
