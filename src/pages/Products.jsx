import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, categoryService, brandService } from '../services/inventoryService';
import { calculateMargin, calculateTax, generateBarcode, generateSKU } from '../utils/calculations';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { 
    Plus, Search, Edit2, Trash2, Package, Tag, Layers, 
    Image as ImageIcon, Barcode, DollarSign, Filter, MoreVertical, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        sku: '',
        description: '',
        CategoryId: '',
        BrandId: '',
        purchasePrice: '',
        sellingPrice: '',
        partnerPrice: '',
        wholesalePrice: '',
        tax_type: 'NTVA',
        tax_rate: 18,
        is_active: true,
        image_url: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pData, cData, bData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll(),
                brandService.getAll()
            ]);
            
            setProducts(Array.isArray(pData) ? pData : (pData?.products || []));
            setCategories(Array.isArray(cData) ? cData : (cData?.categories || []));
            setBrands(Array.isArray(bData) ? bData : (bData?.brands || []));
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error("Failed to load inventory data");
            setProducts([]);
            setCategories([]);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                barcode: product.barcode,
                sku: product.sku || '',
                description: product.description || '',
                CategoryId: product.CategoryId || '',
                BrandId: product.BrandId || '',
                purchasePrice: product.purchasePrice || product.buyingPrice || '',
                sellingPrice: product.sellingPrice,
                partnerPrice: product.partnerPrice || '',
                wholesalePrice: product.wholesalePrice || '',
                tax_type: product.tax_type || 'NTVA',
                tax_rate: product.tax_rate || 18,
                is_active: product.is_active,
                image_url: product.image_url || ''
            });
        } else {
            setEditingProduct(null);
            // Generate auto fields for new product
            const nextSku = generateSKU(products.length);
            const nextBarcode = generateBarcode();
            
            setFormData({
                name: '',
                barcode: nextBarcode,
                sku: nextSku,
                description: '',
                CategoryId: '',
                BrandId: '',
                purchasePrice: '',
                sellingPrice: '',
                partnerPrice: '',
                wholesalePrice: '',
                tax_type: 'NTVA',
                tax_rate: 18,
                is_active: true,
                image_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Ensure data consistency with backend (purchasePrice)
            const submissionData = { ...formData, buyingPrice: formData.purchasePrice };
            
            if (editingProduct) {
                await productService.update(editingProduct.id, submissionData);
                toast.success("Product updated successfully");
            } else {
                await productService.create(submissionData);
                toast.success("Product created successfully");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to save product");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to disable this product?")) {
            try {
                await productService.update(id, { is_active: false });
                toast.success("Product disabled");
                fetchData();
            } catch (error) {
                toast.error("Action failed");
            }
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter ? p.CategoryId === categoryFilter : true;
        const matchesBrand = brandFilter ? p.BrandId === brandFilter : true;
        return matchesSearch && matchesCategory && matchesBrand;
    });

    const isAuthorized = user?.role === 'owner' || user?.role === 'manager';

    // Derived Financials for the form
    const { margin, marginPercent } = calculateMargin(formData.purchasePrice, formData.sellingPrice);
    const taxAmount = calculateTax(formData.sellingPrice, formData.tax_type, formData.tax_rate);
    const finalPrice = Number(formData.sellingPrice) + taxAmount;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="text-brand-600" /> Catalog & Products
                    </h1>
                    <p className="text-gray-500 font-medium text-sm">Manage your inventory, prices and variants</p>
                </div>
                {isAuthorized && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Add Product
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 outline-none text-sm"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 outline-none text-sm"
                >
                    <option value="">All Brands</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            <Table headers={['Product', 'Category/Brand', 'Price', 'Stock', 'Tax', 'Actions']}>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                        </TableCell>
                    </TableRow>
                ) : filteredProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-gray-500">No products found.</TableCell>
                    </TableRow>
                ) : filteredProducts.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                                    <div className="flex gap-2">
                                        <p className="text-[10px] text-gray-400 font-mono font-black uppercase">{p.sku || 'NO-SKU'}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{p.barcode}</p>
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.Category?.name || 'Uncategorized'}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.Brand?.name || 'No Brand'}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-0.5">
                                <p className="font-black text-brand-600">{Number(p.sellingPrice).toLocaleString()} Fbu</p>
                                <p className="text-[10px] text-gray-400 font-bold">Cost: {Number(p.purchasePrice || p.buyingPrice).toLocaleString()}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-xs ${
                                (p.GlobalStock?.quantity || 0) <= (p.min_stock_level || 5) ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                <BarChart2 size={12} />
                                {p.GlobalStock?.quantity || 0}
                            </div>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={p.tax_type} />
                        </TableCell>
                        <TableCell>
                            {isAuthorized && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleOpenModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'New Product'} maxWidth="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Primary Info */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Product Name</label>
                                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">SKU Code</label>
                                    <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border rounded-xl font-mono text-xs font-black uppercase" readOnly={!editingProduct} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Barcode</label>
                                    <div className="relative">
                                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-mono" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Category</label>
                                        <select required value={formData.CategoryId} onChange={e => setFormData({...formData, CategoryId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none text-sm font-bold">
                                            <option value="">Select...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Brand</label>
                                        <select value={formData.BrandId} onChange={e => setFormData({...formData, BrandId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none text-sm font-bold">
                                            <option value="">Select...</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 text-sm" />
                            </div>
                        </div>

                        {/* Financial Side Panel */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-6">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Financial Preview</h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-600 dark:text-gray-400">Purchase Price</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input required type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-800 border rounded-lg font-black text-gray-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-600 dark:text-gray-400">Selling Price (Before Tax)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input required type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full pl-8 pr-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 border-brand-200 rounded-lg font-black text-brand-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-dashed">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">Margin</span>
                                    <span className={margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{margin.toLocaleString()} Fbu</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">Margin %</span>
                                    <span className={marginPercent >= 20 ? 'text-emerald-600' : 'text-amber-600'}>{marginPercent}%</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">{formData.tax_type} ({formData.tax_rate}%)</span>
                                    <span className="text-gray-900 dark:text-white">{taxAmount.toLocaleString()} Fbu</span>
                                </div>
                                <div className="flex justify-between text-sm font-black border-t pt-2 mt-2">
                                    <span className="text-brand-600">FINAL PRICE</span>
                                    <span className="text-brand-600">{finalPrice.toLocaleString()} Fbu</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Tiers */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Partner Price</label>
                            <input type="number" value={formData.partnerPrice} onChange={e => setFormData({...formData, partnerPrice: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Wholesale Price</label>
                            <input type="number" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tax Settings</label>
                            <div className="flex gap-2">
                                <select value={formData.tax_type} onChange={e => setFormData({...formData, tax_type: e.target.value})} className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-xs font-black">
                                    <option value="TVA">TVA</option>
                                    <option value="NTVA">N-TVA</option>
                                </select>
                                {formData.tax_type === 'TVA' && (
                                    <input type="number" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} className="w-16 px-2 py-2 bg-white dark:bg-gray-800 border rounded-xl text-xs font-black" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-gray-500 text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" className="px-10 py-3 bg-brand-600 text-white rounded-xl font-black shadow-xl shadow-brand-500/20 text-xs uppercase tracking-[0.2em] hover:bg-brand-700 transition-all active:scale-95">Save Product</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Products;
