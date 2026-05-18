import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, categoryService, brandService, unitService } from '../services/inventoryService';
import { calculateMargin, calculateTax, generateBarcode, generateSKU } from '../utils/calculations';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { 
    Plus, Search, Edit2, Trash2, Package, Tag, Layers, Scale,
    Image as ImageIcon, Barcode, DollarSign, Filter, BarChart2, Check, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'brands', 'units'
    
    // Core data lists
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal forms states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

    // Editing items states
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingBrand, setEditingBrand] = useState(null);
    const [editingUnit, setEditingUnit] = useState(null);

    // Custom Confirmation Modal state (no native confirm!)
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        actionType: 'danger' // 'danger' | 'info'
    });

    // Lists searches and filters
    const [searchTerms, setSearchTerms] = useState({
        products: '',
        categories: '',
        brands: '',
        units: ''
    });
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    // Product Form state
    const [productFormData, setProductFormData] = useState({
        name: '',
        barcode: '',
        sku: '',
        description: '',
        CategoryId: '',
        BrandId: '',
        unit_of_measure: '', // UUID from Unit table
        purchasePrice: '',
        sellingPrice: '',
        partnerPrice: '',
        wholesalePrice: '',
        tax_type: 'HTVA',
        tax_rate: 18,
        image_url: ''
    });

    // Category Form state
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        parent_id: ''
    });

    // Brand Form state
    const [brandFormData, setBrandFormData] = useState({
        name: ''
    });

    // Unit Form state
    const [unitFormData, setUnitFormData] = useState({
        name: '',
        short_name: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pData, cData, bData, uData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll(),
                brandService.getAll(),
                unitService.getAll()
            ]);
            
            setProducts(Array.isArray(pData) ? pData : (pData?.products || []));
            setCategories(Array.isArray(cData) ? cData : (cData?.categories || []));
            setBrands(Array.isArray(bData) ? bData : (bData?.brands || []));
            setUnits(Array.isArray(uData) ? uData : (uData?.units || []));
        } catch (error) {
            console.error("Failed to fetch catalog data", error);
            toast.error("Failed to load catalog/inventory data");
            setProducts([]);
            setCategories([]);
            setBrands([]);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    };

    // --- 📦 PRODUCT ACTIONS ---
    const handleOpenProductModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setProductFormData({
                name: product.name,
                barcode: product.barcode || '',
                sku: product.sku || '',
                description: product.description || '',
                CategoryId: product.CategoryId || '',
                BrandId: product.BrandId || '',
                unit_of_measure: product.unit_of_measure || '',
                purchasePrice: product.purchasePrice || product.buyingPrice || '',
                sellingPrice: product.sellingPrice || '',
                partnerPrice: product.partnerPrice || '',
                wholesalePrice: product.wholesalePrice || '',
                tax_type: product.tax_type || 'HTVA',
                tax_rate: product.tax_rate || 18,
                image_url: product.image_url || ''
            });
        } else {
            setEditingProduct(null);
            const nextSku = generateSKU(products.length);
            setProductFormData({
                name: '',
                barcode: '', // Leave barcode blank (optional for version 1)
                sku: nextSku,
                description: '',
                CategoryId: '',
                BrandId: '',
                unit_of_measure: '',
                purchasePrice: '',
                sellingPrice: '',
                partnerPrice: '',
                wholesalePrice: '',
                tax_type: 'HTVA',
                tax_rate: 18,
                image_url: ''
            });
        }
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            const submissionData = { 
                ...productFormData, 
                buyingPrice: productFormData.purchasePrice,
                // If barcode is empty string, transmit as null so it doesn't violate unique constraint
                barcode: productFormData.barcode.trim() || null 
            };
            
            if (editingProduct) {
                await productService.update(editingProduct.id, submissionData);
                toast.success("Product updated successfully");
            } else {
                await productService.create(submissionData);
                toast.success("Product created successfully");
            }
            setIsProductModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save product");
        }
    };

    const handleProductDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product? This will perform a paranoid soft-delete in the system.',
            actionType: 'danger',
            onConfirm: async () => {
                try {
                    await productService.delete(id);
                    toast.success("Product deleted successfully");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    toast.error("Failed to delete product");
                }
            }
        });
    };

    // --- 🏷️ CATEGORY ACTIONS ---
    const handleOpenCategoryModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryFormData({
                name: category.name,
                parent_id: category.parent_id || ''
            });
        } else {
            setEditingCategory(null);
            setCategoryFormData({
                name: '',
                parent_id: ''
            });
        }
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const submissionData = {
                name: categoryFormData.name,
                parent_id: categoryFormData.parent_id || null
            };
            if (editingCategory) {
                await categoryService.update(editingCategory.id, submissionData);
                toast.success("Category updated successfully");
            } else {
                await categoryService.create(submissionData);
                toast.success("Category created successfully");
            }
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save category");
        }
    };

    const handleCategoryDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category? Any linked products will become uncategorized.',
            actionType: 'danger',
            onConfirm: async () => {
                try {
                    await categoryService.delete(id);
                    toast.success("Category deleted");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    toast.error("Failed to delete category");
                }
            }
        });
    };

    // --- 🔥 BRAND ACTIONS ---
    const handleOpenBrandModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setBrandFormData({
                name: brand.name
            });
        } else {
            setEditingBrand(null);
            setBrandFormData({
                name: ''
            });
        }
        setIsBrandModalOpen(true);
    };

    const handleBrandSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await brandService.update(editingBrand.id, brandFormData);
                toast.success("Brand updated successfully");
            } else {
                await brandService.create(brandFormData);
                toast.success("Brand created successfully");
            }
            setIsBrandModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save brand");
        }
    };

    const handleBrandDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Brand',
            message: 'Are you sure you want to delete this brand? Products associated with it will lose their brand designation.',
            actionType: 'danger',
            onConfirm: async () => {
                try {
                    await brandService.delete(id);
                    toast.success("Brand deleted");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    toast.error("Failed to delete brand");
                }
            }
        });
    };

    // --- 📏 UNIT ACTIONS ---
    const handleOpenUnitModal = (unit = null) => {
        if (unit) {
            setEditingUnit(unit);
            setUnitFormData({
                name: unit.name,
                short_name: unit.short_name
            });
        } else {
            setEditingUnit(null);
            setUnitFormData({
                name: '',
                short_name: ''
            });
        }
        setIsUnitModalOpen(true);
    };

    const handleUnitSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUnit) {
                await unitService.update(editingUnit.id, unitFormData);
                toast.success("Unit updated successfully");
            } else {
                await unitService.create(unitFormData);
                toast.success("Unit created successfully");
            }
            setIsUnitModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save unit");
        }
    };

    const handleUnitDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Unit',
            message: 'Are you sure you want to delete this unit of measure? Dynamic packaging specifications using this unit will be affected.',
            actionType: 'danger',
            onConfirm: async () => {
                try {
                    await unitService.delete(id);
                    toast.success("Unit of measure deleted");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    toast.error("Failed to delete unit");
                }
            }
        });
    };

    // --- 🔍 FILTER LOGIC ---
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerms.products.toLowerCase()) || 
                            (p.barcode && p.barcode.toLowerCase().includes(searchTerms.products.toLowerCase())) ||
                            (p.sku && p.sku.toLowerCase().includes(searchTerms.products.toLowerCase()));
        const matchesCategory = categoryFilter ? p.CategoryId === categoryFilter : true;
        const matchesBrand = brandFilter ? p.BrandId === brandFilter : true;
        return matchesSearch && matchesCategory && matchesBrand;
    });

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerms.categories.toLowerCase())
    );

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(searchTerms.brands.toLowerCase())
    );

    const filteredUnits = units.filter(u => 
        u.name.toLowerCase().includes(searchTerms.units.toLowerCase()) ||
        u.short_name.toLowerCase().includes(searchTerms.units.toLowerCase())
    );

    const isAuthorized = user?.role === 'owner' || user?.role === 'manager';

    // Real-time pricing calculations
    const { margin, marginPercent } = calculateMargin(productFormData.purchasePrice, productFormData.sellingPrice);
    const taxAmount = calculateTax(productFormData.sellingPrice, productFormData.tax_type, productFormData.tax_rate);
    const finalPrice = Number(productFormData.sellingPrice) + taxAmount;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-gray-900 dark:text-gray-100">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Package className="text-brand-600 w-8 h-8" /> Enterprise Catalog
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                        Manage products, dynamic pricing tiers, custom categories, brands, and units of measure.
                    </p>
                </div>
                {isAuthorized && (
                    <div className="flex gap-2">
                        {activeTab === 'products' && (
                            <button
                                onClick={() => handleOpenProductModal()}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 text-sm"
                            >
                                <Plus size={18} /> Add Product
                            </button>
                        )}
                        {activeTab === 'categories' && (
                            <button
                                onClick={() => handleOpenCategoryModal()}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 text-sm"
                            >
                                <Plus size={18} /> Add Category
                            </button>
                        )}
                        {activeTab === 'brands' && (
                            <button
                                onClick={() => handleOpenBrandModal()}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 text-sm"
                            >
                                <Plus size={18} /> Add Brand
                            </button>
                        )}
                        {activeTab === 'units' && (
                            <button
                                onClick={() => handleOpenUnitModal()}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 text-sm"
                            >
                                <Plus size={18} /> Add Unit
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Sliding Dashboard Tabs Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm gap-1">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'products'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    <Package size={16} /> Products ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'categories'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    <Layers size={16} /> Categories ({categories.length})
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'brands'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    <Tag size={16} /> Brands ({brands.length})
                </button>
                <button
                    onClick={() => setActiveTab('units')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'units'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    <Scale size={16} /> Units ({units.length})
                </button>
            </div>

            {/* TAB PANEL 1: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    {/* Filters & Search */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, SKU or barcode..."
                                value={searchTerms.products}
                                onChange={(e) => setSearchTerms({ ...searchTerms, products: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    {/* Products Table */}
                    <Table headers={['Product Details', 'Category / Brand', 'Unit of Measure', 'Selling Price', 'Stock Level', 'Tax Taxonomy', 'Actions']}>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20 text-gray-500">No products found in the catalog.</TableCell>
                            </TableRow>
                        ) : filteredProducts.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm">
                                            {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={22} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono font-black uppercase">{p.sku || 'NO SKU'}</span>
                                                {p.barcode && (
                                                    <span className="text-[10px] bg-brand-50 dark:bg-brand-900/20 text-brand-600 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                                        <Barcode size={8} /> {p.barcode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.Category?.name || 'Uncategorized'}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.Brand?.name || 'No Brand'}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                                        {p.Unit?.name ? `${p.Unit.name} (${p.Unit.short_name})` : 'Pcs (Default)'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5">
                                        <p className="font-black text-brand-600">{Number(p.sellingPrice).toLocaleString()} Fbu</p>
                                        <p className="text-[10px] text-gray-400 font-bold">Buying Cost: {Number(p.purchasePrice || p.buyingPrice || 0).toLocaleString()}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs ${
                                        (p.GlobalStock?.quantity || 0) <= (p.min_stock_level || 5) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }`}>
                                        <BarChart2 size={12} />
                                        {p.GlobalStock?.quantity || 0} units
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={p.tax_type === 'TVA' ? 'TVA' : 'HTVA'} />
                                </TableCell>
                                <TableCell>
                                    {isAuthorized && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenProductModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleProductDelete(p.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}

            {/* TAB PANEL 2: CATEGORIES */}
            {activeTab === 'categories' && (
                <div className="space-y-4">
                    {/* Search & Statistics */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerms.categories}
                                onChange={(e) => setSearchTerms({ ...searchTerms, categories: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                            />
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            Showing <span className="text-gray-900 dark:text-white">{filteredCategories.length}</span> Categories
                        </div>
                    </div>

                    {/* Table listing categories */}
                    <Table headers={['Category Name', 'Parent Category', 'Actions']}>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20 text-gray-500">No categories found.</TableCell>
                            </TableRow>
                        ) : filteredCategories.map((c) => {
                            const parent = categories.find(cat => cat.id === c.parent_id);
                            return (
                                <TableRow key={c.id}>
                                    <TableCell className="font-bold text-gray-900 dark:text-white">{c.name}</TableCell>
                                    <TableCell>
                                        {parent ? (
                                            <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg">
                                                {parent.name}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-bold">Top Level</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isAuthorized && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleOpenCategoryModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleCategoryDelete(c.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </Table>
                </div>
            )}

            {/* TAB PANEL 3: BRANDS */}
            {activeTab === 'brands' && (
                <div className="space-y-4">
                    {/* Search & Statistics */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search brands..."
                                value={searchTerms.brands}
                                onChange={(e) => setSearchTerms({ ...searchTerms, brands: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                            />
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            Showing <span className="text-gray-900 dark:text-white">{filteredBrands.length}</span> Brands
                        </div>
                    </div>

                    {/* Table listing brands */}
                    <Table headers={['Brand Name', 'Actions']}>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                                </TableCell>
                            </TableRow>
                        ) : filteredBrands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-20 text-gray-500">No brands found.</TableCell>
                            </TableRow>
                        ) : filteredBrands.map((b) => (
                            <TableRow key={b.id}>
                                <TableCell className="font-bold text-gray-900 dark:text-white">{b.name}</TableCell>
                                <TableCell>
                                    {isAuthorized && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenBrandModal(b)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleBrandDelete(b.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}

            {/* TAB PANEL 4: UNITS OF MEASURE */}
            {activeTab === 'units' && (
                <div className="space-y-4">
                    {/* Search & Statistics */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search units by name or abbreviation..."
                                value={searchTerms.units}
                                onChange={(e) => setSearchTerms({ ...searchTerms, units: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                            />
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            Showing <span className="text-gray-900 dark:text-white">{filteredUnits.length}</span> Units
                        </div>
                    </div>

                    {/* Table listing units */}
                    <Table headers={['Unit Name', 'Abbreviation / Short Name', 'Actions']}>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUnits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20 text-gray-500">No units of measure found.</TableCell>
                            </TableRow>
                        ) : filteredUnits.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-bold text-gray-900 dark:text-white">{u.name}</TableCell>
                                <TableCell>
                                    <span className="text-xs font-black bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-lg">
                                        {u.short_name}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {isAuthorized && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenUnitModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleUnitDelete(u.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}

            {/* WIDE MODAL FOR PRODUCT CREATION & EDITION (max-w-5xl) */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? 'Update Product Catalog Item' : 'Create New Catalog Item'} maxWidth="max-w-5xl">
                <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* LEFT COLUMN (3/5 width): General Information & Taxonomy */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                                    <Package size={14} className="text-brand-600" /> General Specifications
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Cold Soda 500ml"
                                        value={productFormData.name}
                                        onChange={e => setProductFormData({...productFormData, name: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SKU Identifier</label>
                                    <input
                                        type="text"
                                        value={productFormData.sku}
                                        onChange={e => setProductFormData({...productFormData, sku: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs font-black uppercase text-gray-600 dark:text-gray-300"
                                        readOnly={!editingProduct}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                        <span>Barcode (Optional)</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setProductFormData({...productFormData, barcode: generateBarcode()})}
                                            className="text-[9px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5 lowercase hover:underline"
                                        >
                                            <RefreshCw size={9} /> generate
                                        </button>
                                    </label>
                                    <div className="relative">
                                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Leave blank or scan barcode"
                                            value={productFormData.barcode}
                                            onChange={e => setProductFormData({...productFormData, barcode: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Unit of Measure (UoM)</label>
                                    <select
                                        value={productFormData.unit_of_measure}
                                        onChange={e => setProductFormData({...productFormData, unit_of_measure: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none text-sm font-bold"
                                    >
                                        <option value="">Select Unit...</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Category</label>
                                    <select
                                        required
                                        value={productFormData.CategoryId}
                                        onChange={e => setProductFormData({...productFormData, CategoryId: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none text-sm font-bold"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Manufacturer Brand</label>
                                    <select
                                        value={productFormData.BrandId}
                                        onChange={e => setProductFormData({...productFormData, BrandId: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none text-sm font-bold"
                                    >
                                        <option value="">Select Brand...</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Image Thumbnail URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="https://example.com/image.png"
                                        value={productFormData.image_url}
                                        onChange={e => setProductFormData({...productFormData, image_url: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Catalog Description</label>
                                <textarea
                                    value={productFormData.description}
                                    onChange={e => setProductFormData({...productFormData, description: e.target.value})}
                                    rows={3}
                                    placeholder="Write a descriptive summary for staff members or digital invoice references..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN (2/5 width): Pricing & Taxes (Harmonious & Sleek) */}
                        <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/30 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-6 flex flex-col justify-between">
                            <div>
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                                        <DollarSign size={14} className="text-brand-600" /> Pricing & Financials
                                    </h3>
                                </div>

                                <div className="space-y-4 mt-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Wholesale Buying Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-extrabold text-xs">Fbu</span>
                                            <input
                                                required
                                                type="number"
                                                value={productFormData.purchasePrice}
                                                onChange={e => setProductFormData({...productFormData, purchasePrice: e.target.value})}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Standard Retail Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 font-extrabold text-xs">Fbu</span>
                                            <input
                                                required
                                                type="number"
                                                value={productFormData.sellingPrice}
                                                onChange={e => setProductFormData({...productFormData, sellingPrice: e.target.value})}
                                                className="w-full pl-10 pr-4 py-2.5 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-200 rounded-xl font-black text-brand-600 dark:text-brand-400 outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Partner Price</label>
                                        <input
                                            type="number"
                                            placeholder="Standard if null"
                                            value={productFormData.partnerPrice}
                                            onChange={e => setProductFormData({...productFormData, partnerPrice: e.target.value})}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Wholesale Price</label>
                                        <input
                                            type="number"
                                            placeholder="Standard if null"
                                            value={productFormData.wholesalePrice}
                                            onChange={e => setProductFormData({...productFormData, wholesalePrice: e.target.value})}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                                        <span>Tax Class & Rating</span>
                                        <StatusBadge status={productFormData.tax_type === 'TVA' ? 'TVA' : 'HTVA'} />
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={productFormData.tax_type}
                                            onChange={e => setProductFormData({...productFormData, tax_type: e.target.value})}
                                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black outline-none"
                                        >
                                            <option value="HTVA">HTVA (No Tax)</option>
                                            <option value="TVA">TVA (Tax Applied)</option>
                                        </select>
                                        {productFormData.tax_type === 'TVA' && (
                                            <input
                                                type="number"
                                                value={productFormData.tax_rate}
                                                onChange={e => setProductFormData({...productFormData, tax_rate: e.target.value})}
                                                className="w-16 px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black outline-none"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Margin Indicator & Final Cost Snapshot */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 space-y-3 mt-6">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">Gross Margin Profit</span>
                                    <span className={margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                        {margin >= 0 ? '+' : ''}{margin.toLocaleString()} Fbu
                                    </span>
                                </div>
                                
                                {/* Sleek visual meter bar */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            marginPercent >= 30 ? 'bg-emerald-500' : marginPercent >= 15 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${Math.min(Math.max(marginPercent, 0), 100)}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between text-xs font-bold border-b pb-2">
                                    <span className="text-gray-500">Margin Percentage</span>
                                    <span className={marginPercent >= 20 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-amber-600 dark:text-amber-400 font-black'}>
                                        {marginPercent}%
                                    </span>
                                </div>
                                
                                {productFormData.tax_type === 'TVA' && (
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-400">VAT Amount ({productFormData.tax_rate}%)</span>
                                        <span className="text-gray-500">{taxAmount.toLocaleString()} Fbu</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between text-sm font-black pt-1">
                                    <span className="text-brand-600">INVOICE FINAL PRICE</span>
                                    <span className="text-brand-600">{finalPrice.toLocaleString()} Fbu</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                        <button 
                            type="button" 
                            onClick={() => setIsProductModalOpen(false)} 
                            className="px-8 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-black text-gray-500 text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-10 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black shadow-xl shadow-brand-500/20 text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                        >
                            Save Product Specifications
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL FOR CATEGORY FORM */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Create New Category'} maxWidth="max-w-md">
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Category Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Dairy & Eggs"
                            value={categoryFormData.name}
                            onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Parent Category (Optional)</label>
                        <select
                            value={categoryFormData.parent_id}
                            onChange={e => setCategoryFormData({ ...categoryFormData, parent_id: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none text-sm font-bold"
                        >
                            <option value="">None (Top Level Category)</option>
                            {categories
                                .filter(c => !editingCategory || c.id !== editingCategory.id)
                                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            }
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 border rounded-xl font-bold text-gray-500 text-xs uppercase hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-700">Save Category</button>
                    </div>
                </form>
            </Modal>

            {/* MODAL FOR BRAND FORM */}
            <Modal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} title={editingBrand ? 'Edit Brand' : 'Create New Brand'} maxWidth="max-w-md">
                <form onSubmit={handleBrandSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Brand Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Coca-Cola"
                            value={brandFormData.name}
                            onChange={e => setBrandFormData({ name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={() => setIsBrandModalOpen(false)} className="px-6 py-2 border rounded-xl font-bold text-gray-500 text-xs uppercase hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-700">Save Brand</button>
                    </div>
                </form>
            </Modal>

            {/* MODAL FOR UNIT FORM */}
            <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title={editingUnit ? 'Edit Unit of Measure' : 'Create New Unit of Measure'} maxWidth="max-w-md">
                <form onSubmit={handleUnitSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Unit Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Kilograms"
                            value={unitFormData.name}
                            onChange={e => setUnitFormData({ ...unitFormData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Abbreviation / Short Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. kg"
                            value={unitFormData.short_name}
                            onChange={e => setUnitFormData({ ...unitFormData, short_name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 font-bold font-mono"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-6 py-2 border rounded-xl font-bold text-gray-500 text-xs uppercase hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-700">Save Unit</button>
                    </div>
                </form>
            </Modal>

            {/* UNIFIED CUSTOM CONFIRMATION MODAL (Strictly replaces native confirm!) */}
            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} title={confirmModal.title} maxWidth="max-w-md">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${confirmModal.actionType === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                            <Trash2 size={24} />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <h4 className="font-extrabold text-base text-gray-900 dark:text-white">{confirmModal.title}</h4>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{confirmModal.message}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button 
                            type="button" 
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={confirmModal.onConfirm} 
                            className={`px-8 py-2.5 rounded-xl font-bold text-white text-xs uppercase tracking-wider shadow-lg ${
                                confirmModal.actionType === 'danger' 
                                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' 
                                    : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
                            }`}
                        >
                            Confirm Action
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Products;
