import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { productService } from "../services/inventoryService";
import { customerService } from "../services/customerService";
import { creditService } from "../services/creditService";
import { saleService } from "../services/saleService";
import { getEffectivePrice } from "../utils/calculations";
import Table, { TableRow, TableCell } from "../components/Table";
import ProductDetailsModal from "../components/ProductDetailsModal";

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
    ShieldAlert,
    Phone,
    UserPlus,
    AlertCircle,
    Store,
    Users
} from "lucide-react";

import toast from "react-hot-toast";
import { getImageUrl } from "../utils/imageUrl";

const POS = () => {
    const { activeShopId } = useAuth();

    // ─── Product Search ───────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ─── Customer Type Toggle ─────────────────────────────────────────
    const [customerType, setCustomerType] = useState("retail"); // 'retail' | 'wholesale'

    // ─── Cart ─────────────────────────────────────────────────────────
    const [cart, setCart] = useState([]);

    // ─── Debt UI ──────────────────────────────────────────────────────
    const [debtPhone, setDebtPhone] = useState("");
    const [debtSearchResults, setDebtSearchResults] = useState([]);
    const [debtSearching, setDebtSearching] = useState(false);
    const [debtClient, setDebtClient] = useState(null);          // selected debt client
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientAddress, setNewClientAddress] = useState("");
    const [debtAmount, setDebtAmount] = useState("");
    const [debtNote, setDebtNote] = useState("");
    const [isDebtMode, setIsDebtMode] = useState(false);

    // ─── Misc ─────────────────────────────────────────────────────────
    const [previewProduct, setPreviewProduct] = useState(null);
    const [showCartMobile, setShowCartMobile] = useState(false);
    const searchRef = useRef(null);

    const shopIdMatches = (a, b) => a != null && b != null && String(a) === String(b);

    const getShopStock = (product) =>
        Number(product.Stocks?.find(s => shopIdMatches(s.ShopId, activeShopId))?.quantity || 0);

    const loadPosCatalog = async (search = "") => {
        if (!activeShopId) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const params = { in_stock: "true" };
            if (search.trim()) params.search = search.trim();
            const res = await productService.getAll(params);
            const products = Array.isArray(res) ? res : res?.products || [];
            setSearchResults(products.filter((p) => getShopStock(p) > 0));
        } catch (err) {
            console.error("Failed to fetch product catalog", err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // ==========================================
    // PRODUCT CATALOG — in-stock at active shop (X-Shop-Id header), no limit
    // ==========================================
    useEffect(() => {
        if (!activeShopId) {
            setSearchResults([]);
            return;
        }
        const t = setTimeout(() => loadPosCatalog(searchQuery), searchQuery.trim() ? 300 : 0);
        return () => clearTimeout(t);
    }, [searchQuery, activeShopId]);

    // Clear stale catalog/cart when switching shops
    useEffect(() => {
        setSearchResults([]);
        setCart([]);
        setSearchQuery("");
    }, [activeShopId]);

    // ==========================================
    // DEBT PHONE LIVE SEARCH
    // ==========================================
    useEffect(() => {
        if (!debtPhone.trim() || debtPhone.length < 3) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDebtSearchResults([]);
            setShowNewClientForm(false);
            return;
        }
        const t = setTimeout(async () => {
            setDebtSearching(true);
            try {
                const res = await customerService.getAll({ search: debtPhone.trim() });
                const customers = Array.isArray(res) ? res : res?.customers || [];
                setDebtSearchResults(customers);
                setShowNewClientForm(customers.length === 0);
            } catch {
                setDebtSearchResults([]);
            } finally {
                setDebtSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [debtPhone]);

    // ==========================================
    // CART & QUANTITY SAFETY LOGIC
    // ==========================================
    const addToCart = (product) => {
        const shopStock = getShopStock(product);
        if (shopStock <= 0) {
            toast.error(`${product.name} is out of stock.`, { position: "top-center" });
            return;
        }
        setCart(prev => {
            const exist = prev.find(i => i.id === product.id);
            const currentQty = exist ? exist.qty : 0;
            if (currentQty >= shopStock) {
                toast.error(`Cannot exceed available stock of ${shopStock} for ${product.name}`, { position: "top-center" });
                return prev;
            }
            if (exist) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...product, qty: 1 }];
        });
        navigator.vibrate?.(40);
    };

    const updateQty = (id, delta) => {
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;
            const shopStock = getShopStock(item);
            if (delta > 0 && item.qty >= shopStock) {
                toast.error(`Cannot exceed available stock of ${shopStock} for ${item.name}`, { position: "top-center" });
                return prev;
            }
            return prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0);
        });
    };

    const setAbsoluteQty = (id, value) => {
        const qty = value === "" ? "" : parseInt(value, 10);
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;
            if (qty === "") return prev.map(i => i.id === id ? { ...i, qty: "" } : i);
            if (isNaN(qty) || qty < 0) return prev;
            const shopStock = getShopStock(item);
            if (qty > shopStock) {
                toast.error(`Cannot exceed available stock of ${shopStock} for ${item.name}`, { position: "top-center" });
                return prev.map(i => i.id === id ? { ...i, qty: shopStock } : i);
            }
            if (qty === 0) return prev.filter(i => i.id !== id);
            return prev.map(i => i.id === id ? { ...i, qty } : i);
        });
    };

    const effectiveCustomerType = customerType; // 'retail' or 'wholesale'

    const totals = cart.reduce((acc, item) => {
        const p = getEffectivePrice(item, effectiveCustomerType, item.qty);
        return {
            subtotal: acc.subtotal + p.subtotal,
            tax: acc.tax + p.taxAmount,
            total: acc.total + p.total
        };
    }, { subtotal: 0, tax: 0, total: 0 });

    // ==========================================
    // CHECKOUT
    // ==========================================
    const checkout = async () => {
        if (cart.length === 0) return;
        const loading = toast.loading("Finalizing sale...");
        try {
            const payload = {
                CustomerId: null,
                items: cart.map(i => {
                    const p = getEffectivePrice(i, effectiveCustomerType, i.qty);
                    return { ProductId: i.id, quantity: i.qty, unitPrice: p.unitPrice, total: p.total };
                }),
                paymentMethod: "CASH",
                ShopId: activeShopId,
                customerType: effectiveCustomerType,
                status: "COMPLETED"
            };

            await saleService.create(payload);
            setCart([]);
            setSearchQuery("");

            await loadPosCatalog(searchQuery);
            toast.success("Sale Successful!", { id: loading });
        } catch (e) {
            const msg = e.response?.data?.message || e.message || "Checkout failed.";
            toast.error(msg, { id: loading });
        }
    };

    // ==========================================
    // SAVE DEBT
    // ==========================================
    const saveDebt = async () => {
        if (cart.length === 0) { toast.error("Add products to cart before selling on credit"); return; }
        if (!debtPhone.trim()) { toast.error("Phone number is required"); return; }
        if (showNewClientForm && !newClientName.trim()) {
            toast.error("Enter the client's name"); return;
        }

        const amount = debtAmount ? Number(debtAmount) : totals.total;
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Enter a valid credit amount"); return;
        }
        if (amount > totals.total) {
            toast.error("Credit amount cannot exceed the cart total"); return;
        }

        const loading = toast.loading("Saving credit sale...");
        try {
            let customer = debtClient;
            if (!customer) {
                customer = await customerService.create({
                    full_name: newClientName.trim(),
                    phone: debtPhone.trim(),
                    address: newClientAddress.trim() || null,
                    customer_type: 'retail',
                    ShopId: activeShopId
                });
            }

            const paymentMethod = amount === totals.total ? 'CREDIT' : 'CASH';
            const sale = await saleService.create({
                CustomerId: customer.id,
                items: cart.map(i => {
                    const p = getEffectivePrice(i, effectiveCustomerType, i.qty);
                    return { ProductId: i.id, quantity: i.qty, unitPrice: p.unitPrice, total: p.total };
                }),
                paymentMethod,
                ShopId: activeShopId,
                customerType: effectiveCustomerType,
                status: 'COMPLETED'
            });

            await creditService.create({
                phone: debtPhone.trim(),
                full_name: customer.full_name,
                address: customer.address || newClientAddress.trim() || undefined,
                total_credit: amount,
                note: debtNote.trim() || undefined,
                sale_id: sale.id
            });

            toast.success("Credit sale completed successfully!", { id: loading });
            setCart([]);
            setSearchQuery("");
            setDebtPhone("");
            setDebtClient(null);
            setDebtSearchResults([]);
            setShowNewClientForm(false);
            setNewClientName("");
            setNewClientAddress("");
            setDebtAmount("");
            setDebtNote("");
            setIsDebtMode(false);
        } catch (e) {
            const msg = e.response?.data?.message || e.message || "Failed to save credit sale.";
            toast.error(msg, { id: loading });
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row bg-white dark:bg-gray-950 overflow-hidden select-none">

            {/* LEFT: Product Catalog Browser */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all ${showCartMobile ? "hidden" : "flex"}`}>
                {/* Search & Customer Type Bar */}
                <div className="p-4 lg:p-6 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500" size={20} />
                            <input
                                ref={searchRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products by name..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-brand-500 outline-none font-black text-gray-900 dark:text-white transition-all shadow-inner"
                            />
                        </div>

                        {/* Retail / Wholesale Toggler */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setCustomerType("retail")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                    customerType === "retail"
                                        ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                            >
                                <Store size={14} /> <span className="hidden sm:inline">Retail</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomerType("wholesale")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                    customerType === "wholesale"
                                        ? "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                            >
                                <Users size={14} /> <span className="hidden sm:inline">Wholesale</span>
                            </button>
                        </div>
                    </div>

                    {/* Active mode label */}
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            customerType === "retail"
                                ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                        }`}>
                            {customerType === "retail" ? <Store size={10} /> : <Users size={10} />}
                            {customerType === "retail" ? "Retail pricing active" : "Wholesale pricing active"}
                        </span>
                    </div>
                </div>

                {/* Products Table */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-36 lg:pb-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-950">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                            <Loader2 className="animate-spin text-brand-600" size={48} />
                            <p className="font-black text-xs uppercase tracking-widest">Loading Catalog...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <Table headers={["Product", customerType === "wholesale" ? "Wholesale Price" : "Price", "Action"]}>
                            {searchResults.map(p => {
                                const shopStock = getShopStock(p);
                                const priceInfo = getEffectivePrice(p, effectiveCustomerType, 1);
                                return (
                                    <TableRow key={p.id} className="cursor-pointer group" onClick={() => addToCart(p)}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={(e) => { e.stopPropagation(); setPreviewProduct(p); }}
                                                >
                                                    {p.image_url ? (
                                                        <img src={getImageUrl(p.image_url, "placeholder-product.png")} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <Package size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white uppercase group-hover:text-brand-600 transition-colors leading-tight mb-1">{p.name}</p>
                                                    <p className="text-[10px] font-mono text-gray-400">Stock: {shopStock}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className={`font-black text-base ${customerType === "wholesale" ? "text-amber-600 dark:text-amber-400" : "text-brand-600 dark:text-brand-400"}`}>
                                                {Number(priceInfo.unitPrice).toLocaleString()} <span className="text-xs">Fbu</span>
                                            </p>
                                            {customerType === "wholesale" && Number(p.sellingPrice) !== Number(priceInfo.unitPrice) && (
                                                <p className="text-[10px] text-gray-400 line-through mt-0.5">
                                                    Retail {Number(p.sellingPrice).toLocaleString()}
                                                </p>
                                            )}
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
                            <p className="mt-6 text-2xl font-black uppercase tracking-[0.4em]">No Products In Stock</p>
                        </div>
                    )}
                </div>

                {/* Mobile Cart Row */}
                <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.12)]">
                    <button
                        type="button"
                        onClick={() => setShowCartMobile(true)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-gray-900 dark:bg-gray-800 text-white rounded-3xl font-black uppercase tracking-widest"
                    >
                        <span className="flex items-center gap-2"><ShoppingCart size={18} /><span>{cart.length} items</span></span>
                        <span>{totals.total.toLocaleString()} FBU</span>
                    </button>
                </div>
            </div>

            {/* RIGHT: Cart & Totals */}
            <div className={
                `fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0 lg:w-[450px] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col transition-transform lg:translate-x-0 ${showCartMobile ? "translate-x-0" : "translate-x-full"}`
            }>
                {/* Cart Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-black flex items-center gap-3 dark:text-white">
                        <ShoppingCart className="text-brand-600" size={24} />
                        ORDER CART
                        <span className="bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCart([])} className="p-2 text-gray-400 hover:text-rose-600 transition-colors"><Trash2 size={20} /></button>
                        <button onClick={() => setShowCartMobile(false)} className="lg:hidden p-2 text-gray-400"><X size={24} /></button>
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
                        const p = getEffectivePrice(item, effectiveCustomerType, item.qty);
                        return (
                            <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-right-4">
                                <div className="flex justify-between mb-2">
                                    <p className="font-black text-sm text-gray-900 dark:text-white line-clamp-1 uppercase">{item.name}</p>
                                    <button onClick={() => updateQty(item.id, -item.qty)} className="text-gray-300 hover:text-rose-500"><X size={14} /></button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-800">
                                        <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-400 hover:text-brand-600"><Minus size={14} /></button>
                                        <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => setAbsoluteQty(item.id, e.target.value)}
                                            onBlur={() => { if (item.qty === "") setAbsoluteQty(item.id, 1); }}
                                            className="w-12 text-center font-black text-sm dark:text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-400 hover:text-brand-600"><Plus size={14} /></button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">
                                            {Number(p.unitPrice).toLocaleString()} × {item.qty}
                                        </p>
                                        <p className="font-black text-lg text-gray-900 dark:text-white">{p.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Debt Section */}
                <div className="border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={() => setIsDebtMode(v => {
                            if (!v) setDebtAmount(totals.total.toString());
                            return !v;
                        })}
                        className={`w-full flex items-center justify-between px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                            isDebtMode
                                ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                    >
                        <span className="flex items-center gap-2"><AlertCircle size={14} /> Give on Debt / Credit</span>
                        <span>{isDebtMode ? "▲" : "▼"}</span>
                    </button>

                    {isDebtMode && (
                        <div className="px-4 pb-4 space-y-3 bg-orange-50/40 dark:bg-orange-950/10 border-t border-orange-100 dark:border-orange-900/30">
                            {/* Phone search */}
                            <div className="relative mt-3">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                                <input
                                    type="tel"
                                    value={debtPhone}
                                    onChange={(e) => {
                                        setDebtPhone(e.target.value);
                                        setDebtClient(null);
                                        setShowNewClientForm(false);
                                    }}
                                    placeholder="Client phone number..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl outline-none font-bold text-sm dark:text-white focus:border-orange-400 transition-colors"
                                />
                                {debtSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-orange-400" size={14} />}
                            </div>

                            {/* Live search results */}
                            {!debtClient && debtSearchResults.length > 0 && (
                                <div className="bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden shadow-md">
                                    {debtSearchResults.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setDebtClient(c);
                                                setDebtPhone(c.phone);
                                                setDebtSearchResults([]);
                                                setShowNewClientForm(false);
                                            }}
                                            className="w-full px-4 py-3 flex justify-between items-center hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                                        >
                                            <div className="text-left">
                                                <p className="font-black text-sm text-gray-900 dark:text-white">{c.full_name}</p>
                                                <p className="text-xs text-gray-400">{c.phone}</p>
                                            </div>
                                            {c.credit_balance > 0 && (
                                                <span className="text-[10px] font-black px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                                                    Owes {Number(c.credit_balance).toLocaleString()} Fbu
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected client badge */}
                            {debtClient && (
                                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 px-4 py-2.5 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-orange-600 dark:text-orange-400" />
                                        <div>
                                            <p className="font-black text-sm text-orange-900 dark:text-orange-300">{debtClient.full_name}</p>
                                            <p className="text-[10px] text-orange-500">{debtClient.phone}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => { setDebtClient(null); setDebtPhone(""); }} className="text-orange-400 hover:text-orange-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* New client form */}
                            {showNewClientForm && !debtClient && (
                                <div className="space-y-2 bg-white dark:bg-gray-900 border border-dashed border-orange-300 dark:border-orange-700 rounded-xl p-3">
                                    <p className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                        <UserPlus size={12} /> New client — fill in details
                                    </p>
                                    <input
                                        type="text"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        placeholder="Full name *"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none font-bold text-sm dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={newClientAddress}
                                        onChange={(e) => setNewClientAddress(e.target.value)}
                                        placeholder="Address (optional)"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none font-bold text-sm dark:text-white"
                                    />
                                </div>
                            )}

                            {/* Debt amount & note */}
                            {(debtClient || showNewClientForm) && (
                                <>
                                    <div className="grid gap-3">
                                        <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-orange-600">Credit amount</label>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Max {totals.total.toLocaleString()} Fbu</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={debtAmount}
                                                onChange={(e) => setDebtAmount(e.target.value)}
                                                placeholder="Amount to put on credit"
                                                min="0"
                                                max={totals.total}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-xl outline-none font-bold text-sm dark:text-white"
                                            />
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Leave this amount empty to automatically use the cart total.</p>
                                        </div>
                                        <input
                                            type="text"
                                            value={debtNote}
                                            onChange={(e) => setDebtNote(e.target.value)}
                                            placeholder="Note (optional)"
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl outline-none font-bold text-sm dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={saveDebt}
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <AlertCircle size={14} /> Save Credit Sale
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Summary */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950">
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
                                : customerType === "wholesale"
                                    ? "bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-500/20"
                                    : "bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/20"
                        }`}
                    >
                        <CreditCard size={24} /> PAY NOW
                    </button>
                </div>
            </div>

            <ProductDetailsModal
                isOpen={!!previewProduct}
                onClose={() => setPreviewProduct(null)}
                product={previewProduct}
            />
        </div>
    );
};

export default POS;