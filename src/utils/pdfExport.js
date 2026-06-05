import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { getImageUrl } from '../utils/imageUrl';
import companySettingService from '../services/companySettingService';

const cleanValue = (value) => String(value || '').trim();

export const getPrintableCompanyInfo = async (shopInfo = {}) => {
    let settings = null;
    try {
        const response = await companySettingService.getAll();
        settings = Array.isArray(response) ? response[0] : response;
    } catch (error) {
        console.warn('Company settings could not be loaded for PDF export', error);
    }

    const companyName = cleanValue(settings?.company_name) || cleanValue(shopInfo?.name) || 'ShopLink';

    return {
        name: companyName,
        address: cleanValue(shopInfo?.address),
        phone: cleanValue(settings?.phone) || cleanValue(shopInfo?.phone),
        nif: cleanValue(settings?.nif),
        rc: cleanValue(settings?.rc),
        stamp_url: cleanValue(settings?.stamp_url),
        logo_url: cleanValue(shopInfo?.logo_url)
    };
};

export const getCompanyIdentityLines = (companyInfo = {}, { includeLegal = true } = {}) => {
    const lines = [];
    if (companyInfo.address) lines.push(`Address: ${companyInfo.address}`);
    if (companyInfo.phone) lines.push(`Phone: ${companyInfo.phone}`);
    if (includeLegal && companyInfo.nif) lines.push(`NIF: ${companyInfo.nif}`);
    if (includeLegal && companyInfo.rc) lines.push(`RC: ${companyInfo.rc}`);
    return lines;
};

const loadPdfImage = (url) => new Promise((resolve) => {
    if (!url) {
        resolve(null);
        return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = getImageUrl(url);
});

export const drawPdfImage = async (doc, imageUrl, x, y, width, height, format = 'PNG') => {
    const img = await loadPdfImage(imageUrl);
    if (!img) return false;

    try {
        doc.addImage(img, format, x, y, width, height);
        return true;
    } catch (error) {
        console.error('Failed to draw PDF image', error);
        return false;
    }
};

export const drawStampBlock = async (doc, companyInfo = {}, options = {}) => {
    const {
        x = 130,
        y = 230,
        width = 60,
        height = 24,
        label = 'Verified Stamp & Date'
    } = options;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');

    if (companyInfo.stamp_url) {
        const padding = 2;
        const drawn = await drawPdfImage(doc, companyInfo.stamp_url, x + padding, y + padding, width - padding * 2, height - padding * 2);
        if (drawn) return;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(label, x + width / 2, y + height / 2 + 1, { align: 'center' });
};

const ensurePdfSpace = (doc, startY, neededHeight) => {
    const pageHeight = doc.internal.pageSize.height;
    if (startY + neededHeight <= pageHeight - 24) return startY;
    doc.addPage();
    return 24;
};


export const exportReceiptToPDF = async (receiptData) => {
    const doc = new jsPDF();

    const candidate = null;
    const allPayments = [];
    const societyName = "AL-SUWEDI";

    // QR CODE
    let qrDataUrl = null;
    try {
        const qrString = `Receipt:${receiptData.receipt_number}
Amount:${receiptData.amount}
Date:${receiptData.date}`;
        qrDataUrl = await QRCode.toDataURL(qrString, { margin: 1 });
    } catch (e) {
        console.error("QR error", e);
    }

    // HEADER
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(societyName.toUpperCase(), 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL PAYMENT RECEIPT", 14, 28);

    // QR BOX
    if (qrDataUrl) {
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);

        // envelope box
        doc.roundedRect(160, 8, 40, 40, 3, 3);

        // label
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text("SCAN TO VERIFY", 165, 12);

        // QR inside box
        doc.addImage(qrDataUrl, 'PNG', 165, 14, 30, 30);
    }

    let y = 50;

    // Receipt info box
    doc.setDrawColor(220);
    doc.roundedRect(14, y, 182, 28, 3, 3);

    doc.setFontSize(10);
    doc.setTextColor(0);

    doc.setFont("helvetica", "bold");
    doc.text("Receipt No:", 18, y + 8);
    doc.text("Date:", 18, y + 16);
    doc.text("Amount:", 110, y + 8);
    doc.text("Payer:", 110, y + 16);

    doc.setFont("helvetica", "normal");
    doc.text(receiptData.receipt_number, 45, y + 8);
    doc.text(receiptData.date, 45, y + 16);
    doc.text(`${receiptData.amount.toLocaleString()} FBU`, 135, y + 8);

    let payerName = `${receiptData.payer_type}`;
    if (candidate) payerName = candidate.name;
    doc.text(payerName, 135, y + 16);

    y += 35;

    // Candidate block
    if (candidate) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("Candidate Information", 14, y);

        y += 6;

        doc.setDrawColor(230);
        doc.roundedRect(14, y, 182, 32, 3, 3);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Name: ${candidate.name}`, 18, y + 8);
        doc.text(`Code: ${candidate.candidate_code}`, 18, y + 16);
        doc.text(`Phone: ${candidate.phone || "-"}`, 18, y + 24);

        doc.text(`Passport: ${candidate.passport_number || "-"}`, 110, y + 8);
        doc.text(`Position: ${candidate.position_applied || "-"}`, 110, y + 16);
        doc.text(`Package: ${candidate.package_amount ? Number(candidate.package_amount).toLocaleString() + " FBU" : "-"}`, 110, y + 24);

        y += 40;
    }

    // Payment History
    if (allPayments.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("Payment History", 14, y);

        const tableColumn = ["Date", "Type", "Amount", "Status"];

        const tableRows = allPayments.map(p => {
            const dateStr = p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '';
            const typeName = p.CandidatePaymentType ? p.CandidatePaymentType.name : 'Payment';
            const amountStr = Number(p.amount).toLocaleString() + ' FBU';
            return [dateStr, typeName, amountStr, p.status || 'ACTIVE'];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: y + 4,
            theme: "grid",
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255
            },
            styles: {
                fontSize: 9
            }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // FOOTER
    const pageHeight = doc.internal.pageSize.height;

    doc.setDrawColor(220);
    doc.line(14, pageHeight - 20, 196, pageHeight - 20);

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Generated automatically by Accounting System", 105, pageHeight - 10, null, null, "center");

    doc.save(`Receipt-${receiptData.receipt_number}.pdf`);
};

const drawHeader = (doc, societyName, qrDataUrl, title) => {
    // HEADER BACKGROUND
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(societyName.toUpperCase(), 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 28);

    // QR BOX
    if (qrDataUrl) {
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.roundedRect(160, 8, 40, 40, 3, 3);
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text("OFFICIAL DOC.", 165, 12);
        doc.addImage(qrDataUrl, 'PNG', 165, 14, 30, 30);
    }
};

export const exportJournalToPDF = async (entries, societyName = "AL-SUWEDI") => {
    const doc = new jsPDF();
    const title = "OFFICIAL FINANCIAL JOURNAL";

    // QR CODE
    let qrDataUrl = null;
    try {
        const qrString = `JournalExport:${new Date().toISOString()}`;
        qrDataUrl = await QRCode.toDataURL(qrString, { margin: 1 });
    } catch (e) {
        console.error("QR error", e);
    }

    // Compute totals
    const totalIncome = entries.filter(e => e.type === 'ENTRY').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const totalExpense = entries.filter(e => e.type === 'EXIT').reduce((s, e) => s + Math.abs(parseFloat(e.amount || 0)), 0);
    const netBalance = totalIncome - totalExpense;

    const tableColumn = ["Date", "Type", "Amount", "Account", "Source", "Balance"];
    const tableRows = entries.map(entry => [
        entry.date,
        entry.type,
        entry.amount.toLocaleString() + " " + entry.currency,
        entry.Account?.name || entry.account_id,
        entry.source_table,
        entry.balance_after.toLocaleString() + " Fbu"
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        margin: { top: 55 },
        theme: "grid",
        headStyles: {
            fillColor: [79, 70, 229],
            textColor: 255
        },
        styles: {
            fontSize: 8
        },
        didDrawPage: () => {
            drawHeader(doc, societyName, qrDataUrl, title);
        }
    });

    // --- Totals Summary Footer ---
    const finalY = doc.lastAutoTable.finalY + 8;

    // Income box (green)
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(14, finalY, 57, 18, 2, 2, 'F');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL INCOME", 16, finalY + 6);
    doc.setFontSize(10);
    doc.text(`${totalIncome.toLocaleString()} Fbu`, 16, finalY + 14);

    // Expenses box (red)
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(76, finalY, 57, 18, 2, 2, 'F');
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(7);
    doc.text("TOTAL EXPENSES", 78, finalY + 6);
    doc.setFontSize(10);
    doc.text(`${totalExpense.toLocaleString()} Fbu`, 78, finalY + 14);

    // Net box (indigo/orange)
    const netPositive = netBalance >= 0;
    doc.setFillColor(...(netPositive ? [224, 231, 255] : [255, 237, 213]));
    doc.roundedRect(138, finalY, 57, 18, 2, 2, 'F');
    doc.setTextColor(...(netPositive ? [79, 70, 229] : [234, 88, 12]));
    doc.setFontSize(7);
    doc.text("NET MOVEMENT", 140, finalY + 6);
    doc.setFontSize(10);
    doc.text(`${netPositive ? '+' : ''}${netBalance.toLocaleString()} Fbu`, 140, finalY + 14);

    // Page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, null, null, "center");
    }

    doc.save(`Journal_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportProductsToPDF = async ({ products = [], shopInfo = {}, priceType = 'retail' }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const companyInfo = await getPrintableCompanyInfo(shopInfo);
    const shopName = companyInfo.name;
    const shopAddress = companyInfo.address || 'No address provided';
    const shopPhone = companyInfo.phone || 'No phone provided';
    const generatedAt = new Date().toLocaleString();
    const priceLabel = priceType === 'wholesale' ? 'Wholesale Price' : 'Retail Price';

    const primaryColor = [15, 23, 42];
    const textColor = [51, 65, 85];

    // Draw Company Logo (async) similar to Sales.jsx
    const addImageProcess = new Promise((resolve) => {
        const img = new Image();
        img.src = getImageUrl(companyInfo.logo_url);
        img.onload = () => {
            try {
                doc.addImage(img, 'PNG', 14, 14, 32, 32);
            } catch (e) {
                console.error('Failed to draw logo for products export', e);
            }
            resolve();
        };
        img.onerror = () => {
            // fallback square with initials
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.roundedRect(14, 14, 32, 32, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            const initials = (shopName || 'S').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
            doc.text(initials, 30, 34, { align: 'center' });
            resolve();
        };
    });

    await addImageProcess;

    // Header Text Details (aligned like Sales.jsx)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(shopName.toUpperCase(), 58, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('PRODUCT LIST / EXPORT', 58, 36);
    getCompanyIdentityLines(companyInfo, { includeLegal: true }).forEach((line, index) => {
        doc.text(line, 58, 42 + (index * 5));
    });

    // Right header box with meta
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(135, 20, 55, 32, 3, 3, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('EXPORT DETAILS', 140, 27);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Price: ${priceLabel}`, 140, 33);
    doc.text(`Generated: ${generatedAt}`, 140, 38);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 64, 196, 64);

    // Prepare rows
    const rows = products.map((product) => ({
        name: product.name || '',
        category: `${product.Category?.name || 'Uncategorized'} / ${product.Brand?.name || 'No Brand'}`,
        price: `${Number(priceType === 'wholesale' ? (product.wholesalePrice ?? product.partnerPrice ?? product.sellingPrice) : product.sellingPrice || 0).toLocaleString()} Fbu`
    }));

    autoTable(doc, {
        head: [[ 'Product', 'Category / Brand', priceLabel ]],
        body: rows.map(r => [r.name, r.category, r.price]),
        startY: 74,
        margin: { left: 14, right: 14 },
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: { 2: { halign: 'right' } }
    });

    // Footer and stamp
    const pageHeight = doc.internal.pageSize.height;
    const stampY = ensurePdfSpace(doc, (doc.lastAutoTable?.finalY || 74) + 10, 34);
    await drawStampBlock(doc, companyInfo, { x: 142, y: stampY, width: 48, height: 24, label: 'Company stamp' });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 20, 196, pageHeight - 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('THANK YOU FOR YOUR BUSINESS!', 105, pageHeight - 14, null, null, 'center');
    doc.text(`${shopName} | ${shopAddress} | ${shopPhone}`, 105, pageHeight - 8, null, null, 'center');

    doc.save(`SelectedProducts-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportCreditsToPDF = async ({ credits = [], shopInfo = {}, filter = 'all' }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const companyInfo = await getPrintableCompanyInfo(shopInfo);
    const shopName = companyInfo.name;
    const shopAddress = companyInfo.address || 'No address provided';
    const shopPhone = companyInfo.phone || 'No phone provided';
    const generatedAt = new Date().toLocaleString();

    const primaryColor = [15, 23, 42];
    const textColor = [51, 65, 85];
    const accentColor = [234, 88, 12]; // orange for credits

    // Draw Company Logo (async) similar to Sales.jsx
    const addImageProcess = new Promise((resolve) => {
        const img = new Image();
        img.src = getImageUrl(companyInfo.logo_url);
        img.onload = () => {
            try {
                doc.addImage(img, 'PNG', 14, 14, 32, 32);
            } catch (e) {
                console.error('Failed to draw logo for credits export', e);
            }
            resolve();
        };
        img.onerror = () => {
            // fallback square with initials
            doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.roundedRect(14, 14, 32, 32, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            const initials = (shopName || 'S').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
            doc.text(initials, 30, 34, { align: 'center' });
            resolve();
        };
    });

    await addImageProcess;

    // Header Text Details
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(shopName.toUpperCase(), 58, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CUSTOMER DEBTS / EXPORT', 58, 36);
    getCompanyIdentityLines(companyInfo, { includeLegal: true }).forEach((line, index) => {
        doc.text(line, 58, 42 + (index * 5));
    });

    // Right header box with meta
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(135, 20, 55, 32, 3, 3, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('EXPORT DETAILS', 140, 27);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Filter: ${filter.toUpperCase()}`, 140, 33);
    doc.text(`Generated: ${generatedAt}`, 140, 38);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 64, 196, 64);

    // Filter credits by status
    const filteredCredits = filter === 'all' ? credits : credits.filter(c => c.status === filter);

    // Calculate totals
    const totalDebt = filteredCredits.reduce((sum, c) => sum + Number(c.total_credit || 0), 0);
    const totalPaid = filteredCredits.reduce((sum, c) => sum + Number(c.paid_credit || 0), 0);
    const totalRemaining = filteredCredits.reduce((sum, c) => sum + Number(c.remaining_credit || 0), 0);

    // Prepare rows
    const rows = filteredCredits.map((credit) => ({
        customer: credit.customer?.full_name || 'Unknown',
        phone: credit.customer?.phone || '—',
        totalDebt: `${Number(credit.total_credit || 0).toLocaleString()} Fbu`,
        paid: `${Number(credit.paid_credit || 0).toLocaleString()} Fbu`,
        remaining: `${Number(credit.remaining_credit || 0).toLocaleString()} Fbu`,
        status: (credit.status || 'unpaid').toUpperCase()
    }));

    autoTable(doc, {
        head: [[ 'Customer', 'Phone', 'Total Debt', 'Paid', 'Remaining', 'Status' ]],
        body: rows.map(r => [r.customer, r.phone, r.totalDebt, r.paid, r.remaining, r.status]),
        startY: 74,
        margin: { left: 14, right: 14 },
        theme: 'striped',
        headStyles: { fillColor: accentColor, textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    // Totals Summary Footer
    const finalY = doc.lastAutoTable.finalY + 8;

    // Total Debt box (orange/red)
    doc.setFillColor(255, 237, 213);
    doc.roundedRect(14, finalY, 57, 18, 2, 2, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL DEBT", 16, finalY + 6);
    doc.setFontSize(10);
    doc.text(`${totalDebt.toLocaleString()} Fbu`, 16, finalY + 14);

    // Total Paid box (green)
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(76, finalY, 57, 18, 2, 2, 'F');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(7);
    doc.text("TOTAL PAID", 78, finalY + 6);
    doc.setFontSize(10);
    doc.text(`${totalPaid.toLocaleString()} Fbu`, 78, finalY + 14);

    // Remaining box (rose)
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(138, finalY, 57, 18, 2, 2, 'F');
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(7);
    doc.text("REMAINING", 140, finalY + 6);
    doc.setFontSize(10);
    doc.text(`${totalRemaining.toLocaleString()} Fbu`, 140, finalY + 14);

    // Footer and stamp
    const pageHeight = doc.internal.pageSize.height;
    const stampY = ensurePdfSpace(doc, finalY + 24, 34);
    await drawStampBlock(doc, companyInfo, { x: 142, y: stampY, width: 48, height: 24, label: 'Company stamp' });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 20, 196, pageHeight - 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('CUSTOMER DEBTS REPORT', 105, pageHeight - 14, null, null, 'center');
    doc.text(`${shopName} | ${shopAddress} | ${shopPhone}`, 105, pageHeight - 8, null, null, 'center');

    doc.save(`CustomerDebts-${new Date().toISOString().split('T')[0]}.pdf`);
};
