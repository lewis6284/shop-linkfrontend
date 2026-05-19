import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { productService } from "../services/inventoryService";
import { customerService } from "../services/customerService";
import { saleService } from "../services/saleService";
import { getEffectivePrice } from "../utils/calculations";
import Table, { TableRow, TableCell } from "../components/Table";

import {
    ShoppingCart,
    CreditCard,
    Plus,
    Minus,
    Trash2,
    User,
    X,
    Loader2,
    Package,
    Search,
    ShieldAlert
} from "lucide-react";

import toast from "react-hot-toast";
import { getImageUrl } from "../utils/imageUrl";

const POS = () => {
    const { user, activeShopId } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerResults, setCustomerResults] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const searchRef = useRef(null);

    // ==========================================
    // SIMPLE CATALOG PRODUCT BROWSING & SEARCH
    // ==========================================
    useEffect(() => {
        const fetchProducts = async () => {
            setIsSearching(true);
            try {
                const params = {};
                if (searchQuery.trim()) {
                    params.search = searchQuery.trim();
                }
                const res = await productService.getAll(params);
                const products = Array.isArray(res) ? res : res?.products || [];
                setSearchResults(products);
            } catch (err) {
                console.error("Failed to fetch product catalog", err);
            } finally {
                setIsSearching(false);
            }
        };

        const t = setTimeout(fetchProducts, searchQuery.trim() ? 300 : 0);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ==========================================
    // CART & QUANTITY SAFETY LOGIC
    // ==========================================
    const addToCart = (product) => {
        const shopStock = Number(product.Stocks?.find(s => s.ShopId === activeShopId)?.quantity || 0);

        if (shopStock <= 0) {
            toast.error(`${product.name} is currently out of stock.`, { position: 'top-center' });
            return;
        }

        setCart(prev => {
            const exist = prev.find(i => i.id === product.id);
            const currentQty = exist ? exist.qty : 0;

            if (currentQty >= shopStock) {
                toast.error(`Cannot exceed available stock of ${shopStock} for ${product.name}`, { position: 'top-center' });
                return prev;
            }

            if (exist) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        navigator.vibrate?.(40);
    };

    const updateQty = (id, delta) => {
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;

            const shopStock = Number(item.Stocks?.find(s => s.ShopId === activeShopId)?.quantity || 0);
            if (delta > 0 && item.qty >= shopStock) {
                toast.error(`Cannot exceed available stock of ${shopStock} for ${item.name}`, { position: 'top-center' });
                return prev;
            }

            return prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0);
        });
    };

    const setAbsoluteQty = (id, value) => {
        const qty = value === '' ? '' : parseInt(value, 10);
        
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;

            if (qty === '') {
                 return prev.map(i => i.id === id ? { ...i, qty: '' } : i);
            }

            if (isNaN(qty) || qty < 0) return prev;

            const shopStock = Number(item.Stocks?.find(s => s.ShopId === activeShopId)?.quantity || 0);
            if (qty > shopStock) {
                toast.error(`Cannot exceed available stock of ${shopStock} for ${item.name}`, { position: 'top-center' });
                return prev.map(i => i.id === id ? { ...i, qty: shopStock } : i);
            }

            if (qty === 0) {
                return prev.filter(i => i.id !== id);
            }

            return prev.map(i => i.id === id ? { ...i, qty } : i);
        });
    };

    const totals = cart.reduce((acc, item) => {
        const p = getEffectivePrice(item, customer?.customer_type || "retail", item.qty);
        return {
            subtotal: acc.subtotal + p.subtotal,
            tax: acc.tax + p.taxAmount,
            total: acc.total + p.total
        };
    }, { subtotal: 0, tax: 0, total: 0 });

    // ==========================================
    // ROBUST CHECKOUT FLOW
    // ==========================================
    const checkout = async () => {
        if (cart.length === 0) return;
        const loading = toast.loading("Finalizing sale...");
        try {
            const payload = {
                CustomerId: customer?.id || null,
                items: cart.map(i => {
                    const p = getEffectivePrice(i, customer?.customer_type || "retail", i.qty);
                    return {
                        ProductId: i.id,
                        quantity: i.qty,
                        unitPrice: p.unitPrice,
                        total: p.total
                    };
                }),
                paymentMethod: paymentMethod,
                ShopId: activeShopId,
                customerType: customer?.customer_type || "retail",
                status: 'COMPLETED'
            };

            const responseData = await saleService.create(payload);
            const isPartnerOrWholesale = responseData?.isPartner || customer?.customer_type === 'partner' || customer?.customer_type === 'wholesale';
            
            setCart([]);
            setSearchQuery("");
            setCustomer(null);
            setPaymentMethod("CASH");

            // Reload products to immediately refresh stock numbers
            const res = await productService.getAll();
            const products = Array.isArray(res) ? res : res?.products || [];
            setSearchResults(products);

            toast.success(isPartnerOrWholesale ? "Order Submitted for Owner Approval!" : "Sale Successful!", { id: loading });
        } catch (e) {
            const msg = e.response?.data?.message || e.message || "Checkout failed. Check stock levels.";
            toast.error(msg, { id: loading });
        }
    };

    const [showCartMobile, setShowCartMobile] = useState(false);

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row bg-white dark:bg-gray-950 overflow-hidden select-none">
            
            {/* LEFT: Product Catalog Browser */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all ${showCartMobile ? 'hidden' : 'flex'}`}>
                {/* Simple Search & Customer Bar */}
                <div className="p-4 lg:p-6 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500" size={20} />
                            <input
                                ref={searchRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products by name..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-brand-500 outline-none font-black text-gray-900 dark:text-white transition-all shadow-inner"
                            />
                        </div>
                        <button 
                            onClick={() => setIsCustomerModalOpen(true)}
                            className="w-full md:w-auto px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            <User size={20} className={customer ? 'text-brand-600' : 'text-gray-400'} />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Customer</p>
                                <p className="font-black text-xs text-gray-900 dark:text-white uppercase truncate max-w-[120px]">
                                    {customer?.full_name || 'Walk-in Customer'}
                                </p>
                            </div>
                            {customer && <X size={14} className="text-gray-400" onClick={(e) => { e.stopPropagation(); setCustomer(null); }} />}
                        </button>
                    </div>
                </div>

                {/* Products Table (Instead of Cards) */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-950">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                            <Loader2 className="animate-spin text-brand-600" size={48} />
                            <p className="font-black text-xs uppercase tracking-widest">Loading Catalog...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <Table headers={['Product Preview', 'Selling Price', 'Shop Stock', 'Action']}>
                            {searchResults.map(p => {
                                const shopStock = Number(p.Stocks?.find(s => s.ShopId === activeShopId)?.quantity || 0);
                                return (
                                    <TableRow key={p.id} className="cursor-pointer group" onClick={() => addToCart(p)}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                                                    {p.image_url ? (
                                                        <img src={getImageUrl(p.image_url, 'placeholder-product.png')} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <Package size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white uppercase group-hover:text-brand-600 transition-colors leading-tight mb-1">{p.name}</p>
                                                    <p className="text-[10px] font-mono text-gray-400">{p.sku || p.barcode || p.product_code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-black text-brand-600 dark:text-brand-400 text-base">{Number(p.sellingPrice).toLocaleString()} <span className="text-xs">Fbu</span></p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm ${shopStock <= 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' : shopStock < 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'}`}>
                                                {shopStock <= 0 ? 'OUT OF STOCK' : `${shopStock} IN STOCK`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                                disabled={shopStock <= 0}
                                                className="px-4 py-2 bg-brand-55 hover:bg-brand-600 text-brand-600 hover:text-white dark:bg-brand-950/30 dark:hover:bg-brand-600 dark:text-brand-400 dark:hover:text-white disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
                                            >
                                                + Add
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </Table>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                            <Package size={120} strokeWidth={1} />
                            <p className="mt-6 text-2xl font-black uppercase tracking-[0.4em]">No Products Available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart & Totals */}
            <div className={`
                fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0
                lg:w-[450px] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col
                transition-transform lg:translate-x-0 ${showCartMobile ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Cart Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-black flex items-center gap-3 dark:text-white">
                        <ShoppingCart className="text-brand-600" size={24} /> 
                        ORDER CART
                        <span className="bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCart([])} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                            <Trash2 size={20} />
                        </button>
                        <button onClick={() => setShowCartMobile(false)} className="lg:hidden p-2 text-gray-400">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Package size={48} />
                            <p className="mt-4 font-black uppercase text-[10px] tracking-widest">Cart is empty</p>
                        </div>
                    ) : cart.map(item => {
                        const p = getEffectivePrice(item, customer?.customer_type || 'retail', item.qty);
                        return (
                            <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-right-4">
                                <div className="flex justify-between mb-2">
                                    <p className="font-black text-sm text-gray-900 dark:text-white line-clamp-1 uppercase">{item.name}</p>
                                    <button onClick={() => updateQty(item.id, -item.qty)} className="text-gray-300 hover:text-rose-500">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-800">
                                        <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-400 hover:text-brand-600"><Minus size={14} /></button>
                                        <input 
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => setAbsoluteQty(item.id, e.target.value)}
                                            onBlur={() => { if(item.qty === '') setAbsoluteQty(item.id, 1); }}
                                            className="w-12 text-center font-black text-sm dark:text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-400 hover:text-brand-600"><Plus size={14} /></button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Total</p>
                                        <p className="font-black text-lg text-gray-900 dark:text-white">{p.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Summary */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950">
                    
                    {/* Payment Method Segmented Picker */}
                    <div className="mb-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">PAYMENT METHOD</label>
                        <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("CASH")}
                                className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${paymentMethod === 'CASH' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("MOBILE_MONEY")}
                                className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${paymentMethod === 'MOBILE_MONEY' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                            >
                                M-Money
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("CREDIT")}
                                className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 ${paymentMethod === 'CREDIT' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                            >
                                Credit
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>{totals.subtotal.toLocaleString()} Fbu</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                            <span>Total Tax (VAT)</span>
                            <span>{totals.tax.toLocaleString()} Fbu</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
                            <p className="font-black text-xl dark:text-white">TOTAL</p>
                            <p className="text-4xl font-black text-brand-600 dark:text-brand-400">{totals.total.toLocaleString()} <span className="text-xs">Fbu</span></p>
                        </div>
                    </div>
                    <button
                        onClick={checkout}
                        disabled={cart.length === 0}
                        className={`w-full py-5 text-white rounded-3xl font-black text-xl active:scale-95 transition-all flex items-center justify-center gap-4 ${
                            cart.length === 0 
                                ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed" 
                                : (customer?.customer_type === 'partner' || customer?.customer_type === 'wholesale')
                                    ? "bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-500/20"
                                    : "bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/20"
                        }`}
                    >
                        {(customer?.customer_type === 'partner' || customer?.customer_type === 'wholesale') ? (
                            <>
                                <ShieldAlert size={24} /> SUBMIT FOR APPROVAL
                            </>
                        ) : (
                            <>
                                <CreditCard size={24} /> PAY NOW
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Footer Toggle */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 z-40">
                <button 
                    onClick={() => setShowCartMobile(true)}
                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl flex items-center justify-between px-6 font-black"
                >
                    <div className="flex items-center gap-3">
                        <ShoppingCart size={20} />
                        <span className="text-xs uppercase">{cart.length} ITEMS</span>
                    </div>
                    <span>{totals.total.toLocaleString()} FBU</span>
                </button>
            </div>

            {/* Customer Selection Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black dark:text-white">SELECT CUSTOMER</h3>
                            <button onClick={() => setIsCustomerModalOpen(false)}><X className="text-gray-400" /></button>
                        </div>
                        <input 
                            autoFocus
                            placeholder="Search by name or phone..."
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border rounded-2xl mb-4 font-bold dark:text-white"
                            onChange={async (e) => {
                                const val = e.target.value;
                                if (val.length > 2) {
                                    const res = await customerService.getAll({ search: val });
                                    setCustomerResults(Array.isArray(res) ? res : res?.customers || []);
                                }
                            }}
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                            {customerResults.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setCustomer(c); setIsCustomerModalOpen(false); }}
                                    className="w-full p-4 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-2xl flex justify-between items-center border border-transparent hover:border-brand-100 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="font-black text-gray-900 dark:text-white group-hover:text-brand-600">{c.full_name}</p>
                                        <p className="text-xs text-gray-400 font-bold">{c.phone}</p>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full uppercase tracking-widest">{c.customer_type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;