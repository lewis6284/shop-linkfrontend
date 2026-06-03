import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, categoryService, brandService, unitService } from '../services/inventoryService';
import userService from '../services/userService';
import api from '../services/api';
import { calculateMargin, calculateTax, generateSKU } from '../utils/calculations';
import Table, { TableRow, TableCell } from '../components/Table';
import Modal from '../components/Modal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import StatusBadge from '../components/StatusBadge';
import { getImageUrl } from '../utils/imageUrl';
import { exportProductsToPDF } from '../utils/pdfExport';
import { 
    Plus, Search, Edit2, Trash2, Package, Tag, Layers, Scale,
    Image as ImageIcon, Barcode, DollarSign, Filter, BarChart2, Check, X, RefreshCw, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
    const { user } = useAuth();
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [exportPriceType, setExportPriceType] = useState('retail'); // 'retail' | 'wholesale'
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'brands', 'units'
    
    // Core data lists
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [shops, setShops] = useState([]);
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
    const [previewProduct, setPreviewProduct] = useState(null);

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
        image_url: '',
        ShopId: '' // empty string equals global, UUID equals specific shop
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
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const promises = [
                productService.getAll(),
                categoryService.getAll(),
                brandService.getAll(),
                unitService.getAll()
            ];
            
            if (user?.role === 'owner') {
                promises.push(userService.getShops());
            }

            const results = await Promise.all(promises);
            const pData = results[0];
            const cData = results[1];
            const bData = results[2];
            const uData = results[3];
            
            setProducts(Array.isArray(pData) ? pData : (pData?.products || []));
            setCategories(Array.isArray(cData) ? cData : (cData?.categories || []));
            setBrands(Array.isArray(bData) ? bData : (bData?.brands || []));
            setUnits(Array.isArray(uData) ? uData : (uData?.units || []));

            if (user?.role === 'owner' && results[4]) {
                const sData = results[4];
                setShops(Array.isArray(sData?.data) ? sData.data : (sData?.shops || []));
            }
        } catch (error) {
            console.error("Failed to fetch catalog data", error);
            toast.error("Failed to load catalog/inventory data");
            setProducts([]);
            setCategories([]);
            setBrands([]);
            setUnits([]);
            setShops([]);
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
                image_url: product.image_url || '',
                ShopId: product.ShopId || ''
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
                image_url: '',
                ShopId: ''
            });
        }
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading("Saving product...");
        try {
            let finalImageUrl = productFormData.image_url;
            const fileInput = document.getElementById('product-image-upload');
            if (fileInput && fileInput.files[0]) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', fileInput.files[0]);
                const uploadRes = await api.post('/uploads', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalImageUrl = uploadRes.data.data?.url || uploadRes.data.url;
            }

            const submissionData = { 
                ...productFormData, 
                image_url: finalImageUrl,
                buyingPrice: productFormData.purchasePrice,
                // If barcode is empty string, transmit as null so it doesn't violate unique constraint
                barcode: productFormData.barcode.trim() || null 
            };
            
            if (editingProduct) {
                await productService.update(editingProduct.id, submissionData);
                toast.success("Product updated successfully", { id: loadingToast });
            } else {
                await productService.create(submissionData);
                toast.success("Product created successfully", { id: loadingToast });
            }
            setIsProductModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save product", { id: loadingToast });
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
        const matchesSearch = p.name.toLowerCase().includes(searchTerms.products.toLowerCase());
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

    const getStockQuantity = (product) => {
        const shopTotal = product.Stocks?.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0);
        if (shopTotal > 0) return shopTotal;
        if (product.GlobalStock?.quantity != null) return Number(product.GlobalStock.quantity);
        return Number(shopTotal || 0);
    };
    const toggleSelect = (id) => {
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAllFiltered = () => {
        const ids = filteredProducts.map(p => p.id);
        setSelectedProducts(ids);
    };

    const clearSelection = () => setSelectedProducts([]);

    const productRows = filteredProducts.map((p) => {
        const stockQuantity = getStockQuantity(p);
        return (
            <TableRow key={p.id}>
                <TableCell className="w-12">
                    <input
                        type="checkbox"
                        checked={selectedProducts.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4"
                    />
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewProduct(p); }} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm hover:opacity-80 transition-opacity cursor-pointer">
                            {p.image_url ? <img src={getImageUrl(p.image_url, 'placeholder-product.png')} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={22} />}
                        </button>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
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
                        {p.Unit?.name ? `${p.Unit.name} (${p.Unit.short_name})` : p.unit_of_measure || 'pcs'}
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
                        stockQuantity <= (p.min_stock_level || 5) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                        <BarChart2 size={12} />
                        {stockQuantity} {p.Unit?.short_name || p.unit_of_measure || 'pcs'}
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
        );
    });

    const productsTableBody = loading ? (
        <TableRow>
            <TableCell colSpan={8} className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
            </TableCell>
        </TableRow>
    ) : filteredProducts.length === 0 ? (
        <TableRow>
            <TableCell colSpan={8} className="text-center py-20 text-gray-500">No products found in the catalog.</TableCell>
        </TableRow>
    ) : (
        productRows
    );

    // Real-time pricing calculations
    const { margin, marginPercent } = calculateMargin(productFormData.purchasePrice, productFormData.sellingPrice);
    const taxAmount = calculateTax(productFormData.sellingPrice, productFormData.tax_type, productFormData.tax_rate);
    const finalPrice = Number(productFormData.sellingPrice) + taxAmount;

    const handlePrintSelected = async () => {
        if (!selectedProducts.length) {
            toast.error('Select products to print');
            return;
        }

        const selected = products.filter(p => selectedProducts.includes(p.id));
        const activeShopData = JSON.parse(localStorage.getItem('activeShopData') || '{}');

        try {
            await exportProductsToPDF({
                products: selected,
                shopInfo: activeShopData,
                priceType: exportPriceType
            });
        } catch (error) {
            console.error('Failed to export selected products', error);
            toast.error('Unable to export selected products.');
        }
    };

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
                    <div className="flex gap-2 items-center">
                        {activeTab === 'products' && (
                            <div className="flex items-center gap-2">
                                <select
                                    value={exportPriceType}
                                    onChange={(e) => setExportPriceType(e.target.value)}
                                    className="bg-gray-100 dark:bg-gray-900 text-sm rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2"
                                >
                                    <option value="retail">Retail Price</option>
                                    <option value="wholesale">Wholesale Price</option>
                                </select>
                                <button
                                    onClick={handlePrintSelected}
                                    disabled={!selectedProducts.length}
                                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition ${selectedProducts.length ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <Printer size={16} /> Print Selected
                                </button>
                            </div>
                        )}
                        <div>
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
                                placeholder="Search by product name..."
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
                    <Table headers={['Select', 'Product Details', 'Category / Brand', 'Unit of Measure', 'Selling Price', 'Stock Level', 'Tax Taxonomy', 'Actions']}>
                        {productsTableBody}
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
                                <TableCell colSpan={3} className="text-center py-20 text-gray-500">No units found.</TableCell>
                            </TableRow>
                        ) : filteredUnits.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-bold text-gray-900 dark:text-white">{u.name}</TableCell>
                                <TableCell className="text-gray-500">{u.short_name}</TableCell>
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

            {/* MODALS */}
            {/* Product Modal */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? "Edit Product" : "Create Product"} maxWidth="max-w-5xl">
                <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Left column: Basic Info */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Product Name *</label>
                                <input required type="text" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                                    <select value={productFormData.CategoryId} onChange={e => setProductFormData({...productFormData, CategoryId: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none">
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Brand</label>
                                    <select value={productFormData.BrandId} onChange={e => setProductFormData({...productFormData, BrandId: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none">
                                        <option value="">Select Brand</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Unit of Measure</label>
                                    <select value={productFormData.unit_of_measure} onChange={e => setProductFormData({...productFormData, unit_of_measure: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none">
                                        <option value="">Select Unit</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Tax Type</label>
                                    <select value={productFormData.tax_type} onChange={e => setProductFormData({...productFormData, tax_type: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none">
                                        <option value="HTVA">HTVA</option>
                                        <option value="TVA">TVA</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea value={productFormData.description} onChange={e => setProductFormData({...productFormData, description: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" rows="3"></textarea>
                            </div>
                        </div>

                        {/* Right column: Image */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Product Image</label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-gray-50 dark:bg-gray-900">
                                    {productFormData.image_url ? (
                                        <img src={productFormData.image_url} alt="Product" className="max-h-32 object-contain rounded-lg" />
                                    ) : (
                                        <span className="text-gray-400 text-sm text-center">No image selected</span>
                                    )}
                                </div>
                                <input type="file" id="product-image-upload" accept="image/*" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm mt-2" />
                            </div>
                            {user?.role === 'owner' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Shop Assignment</label>
                                    <select value={productFormData.ShopId} onChange={e => setProductFormData({...productFormData, ShopId: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none">
                                        <option value="">Global (All Shops)</option>
                                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pricing</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Purchase Price *</label>
                                <input required type="number" value={productFormData.purchasePrice} onChange={e => setProductFormData({...productFormData, purchasePrice: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Selling Price *</label>
                                <input required type="number" value={productFormData.sellingPrice} onChange={e => setProductFormData({...productFormData, sellingPrice: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                            </div>
                            {/* <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Partner Price</label>
                                <input type="number" value={productFormData.partnerPrice} onChange={e => setProductFormData({...productFormData, partnerPrice: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                            </div> */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Wholesale Price</label>
                                <input type="number" value={productFormData.wholesalePrice} onChange={e => setProductFormData({...productFormData, wholesalePrice: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                            </div>
                        </div>

                        {/* Real-time Profit/Margin Visualization */}
                        {(productFormData.purchasePrice || productFormData.sellingPrice) && (
                            <div className="mt-4 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/50 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none block mb-1">Expected Profit</span>
                                    <span className={`text-lg font-black ${Number(margin) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {Number(margin).toLocaleString()} Fbu
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none block mb-1">Margin Percentage</span>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider inline-block ${Number(marginPercent) >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                                        {marginPercent}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold">Save Product</button>
                    </div>
                </form>
            </Modal>

            {/* Category Modal */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? "Edit Category" : "Create Category"}>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Category Name *</label>
                        <input required type="text" value={categoryFormData.name} onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Parent Category</label>
                        <select value={categoryFormData.parent_id} onChange={e => setCategoryFormData({...categoryFormData, parent_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none">
                            <option value="">None (Top Level)</option>
                            {categories.filter(c => c.id !== editingCategory?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold">Save Category</button>
                    </div>
                </form>
            </Modal>

            {/* Brand Modal */}
            <Modal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} title={editingBrand ? "Edit Brand" : "Create Brand"}>
                <form onSubmit={handleBrandSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Brand Name *</label>
                        <input required type="text" value={brandFormData.name} onChange={e => setBrandFormData({...brandFormData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsBrandModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold">Save Brand</button>
                    </div>
                </form>
            </Modal>

            {/* Unit Modal */}
            <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title={editingUnit ? "Edit Unit" : "Create Unit"}>
                <form onSubmit={handleUnitSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Unit Name *</label>
                        <input required type="text" value={unitFormData.name} onChange={e => setUnitFormData({...unitFormData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" placeholder="e.g. Kilogram" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Short Name / Abbreviation *</label>
                        <input required type="text" value={unitFormData.short_name} onChange={e => setUnitFormData({...unitFormData, short_name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" placeholder="e.g. kg" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold">Save Unit</button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-500 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold">Cancel</button>
                            <button onClick={() => confirmModal.onConfirm()} className={`px-4 py-2 text-white rounded-lg font-bold ${confirmModal.actionType === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'}`}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <ProductDetailsModal 
                isOpen={!!previewProduct} 
                onClose={() => setPreviewProduct(null)} 
                product={previewProduct} 
            />
        </div>
    );
};

export default Products;
