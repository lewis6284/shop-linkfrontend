/**
 * Core Business Logic & Financial Calculations
 * For ShopLink SaaS Enterprise
 */

/**
 * Calculate Margin and Margin Percentage
 */
export const calculateMargin = (purchasePrice, sellingPrice) => {
    const buy = Number(purchasePrice) || 0;
    const sell = Number(sellingPrice) || 0;
    
    const margin = sell - buy;
    const marginPercent = buy > 0 ? (margin / buy) * 100 : 0;
    
    return {
        margin,
        marginPercent: marginPercent.toFixed(2)
    };
};

/**
 * Calculate Tax (TVA)
 */
export const calculateTax = (sellingPrice, taxType = 'HTVA', taxRate = 18) => {
    const price = Number(sellingPrice) || 0;
    const rate = Number(taxRate) || 0;
    
    if (taxType === 'HTVA' || taxType === 'NTVA') return 0;
    
    return price * (rate / 100);
};

/**
 * Generate a professional SKU
 * Format: PRD-XXXXX
 */
export const generateSKU = (lastId = 0) => {
    const nextId = Number(lastId) + 1;
    return `PRD-${nextId.toString().padStart(5, '0')}`;
};

/**
 * Generate a random barcode if none provided
 */
export const generateBarcode = () => {
    return Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
};

/**
 * Resolve unit price for retail / wholesale tiers.
 */
export const resolveTierPrice = (product, customerType = 'retail') => {
    const retail = Number(product.sellingPrice) || 0;
    const type = (customerType || 'retail').toLowerCase();

    if (type === 'wholesale') {
        const wholesale = Number(product.wholesalePrice);
        if (wholesale > 0) return wholesale;
        return retail;
    }

    return retail;
};

/**
 * Pricing Rules Engine (Enterprise Version)
 * Calculates price based on ProductPricingRules table logic
 */
export const getEffectivePrice = (product, customerType = 'retail', quantity = 1, pricingRules = []) => {
    let finalPrice = resolveTierPrice(product, customerType);
    let activeRule = null;

    // 1. Check for specific Pricing Rules from the database
    // Rules are filtered by customer_type and min_quantity
    if (pricingRules && pricingRules.length > 0) {
        const applicableRules = pricingRules
            .filter(r => r.customer_type === customerType && quantity >= r.min_quantity && r.is_active)
            .sort((a, b) => b.min_quantity - a.min_quantity); // Get rule with highest min_quantity

        if (applicableRules.length > 0) {
            activeRule = applicableRules[0];
            const baseForRule = resolveTierPrice(product, customerType);
            if (activeRule.price) {
                finalPrice = Number(activeRule.price);
            } else if (activeRule.discount_percentage) {
                finalPrice = baseForRule * (1 - (activeRule.discount_percentage / 100));
            }
        }
    }

    const subtotal = finalPrice * quantity;
    const taxAmount = calculateTax(subtotal, product.tax_type, product.tax_rate);

    return {
        unitPrice: finalPrice,
        quantity,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        appliedRule: activeRule
    };
};
