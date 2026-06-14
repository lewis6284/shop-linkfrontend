/**
 * Pricing Engine (Frontend version)
 * Calculates prices based on customer type and tax rules.
 */
export const calculatePrice = (product, customerType = 'RETAIL', quantity = 1) => {
    let basePrice = Number(product.sellingPrice);

    // Apply Pricing Rules based on customer type
    if (customerType === 'WHOLESALE' && product.wholesalePrice > 0) {
        basePrice = Number(product.wholesalePrice);
    }

    const subtotal = basePrice * quantity;
    let taxAmount = 0;

    // Apply Tax (TVA = 18% default)
    if (product.tax_type === 'TVA') {
        const rate = Number(product.tax_rate) || 18;
        taxAmount = (subtotal * rate) / 100;
    }

    return {
        unitPrice: basePrice,
        quantity,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        taxType: product.tax_type || 'NTVA'
    };
};
