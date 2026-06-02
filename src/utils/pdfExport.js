import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

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
    const shopName = shopInfo.name || 'ShopLink';
    const shopAddress = shopInfo.address || 'No address provided';
    const shopPhone = shopInfo.phone || 'No phone provided';
    const generatedAt = new Date().toLocaleString();
    const priceLabel = priceType === 'wholesale' ? 'Wholesale Price' : 'Retail Price';

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(shopName.toUpperCase(), 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Address: ${shopAddress}`, 14, 26);
    doc.text(`Phone: ${shopPhone}`, 14, 32);

    doc.setFontSize(10);
    doc.text(`Selected Products Export`, 140, 20);
    doc.text(`Price Type: ${priceLabel}`, 140, 26);
    doc.text(`Generated: ${generatedAt}`, 140, 32);

    doc.setDrawColor(201, 213, 225);
    doc.line(14, 38, 196, 38);

    const rows = products.map((product) => {
        const category = product.Category?.name || 'Uncategorized';
        const brand = product.Brand?.name || 'No Brand';
        const price = priceType === 'wholesale' ? (product.wholesalePrice ?? product.partnerPrice ?? product.sellingPrice) : product.sellingPrice;
        return [
            product.name || '',
            `${category} / ${brand}`,
            `${Number(price || 0).toLocaleString()} Fbu`
        ];
    });

    autoTable(doc, {
        head: [['Product', 'Category / Brand', priceLabel]],
        body: rows,
        startY: 42,
        theme: 'grid',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: 255,
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4
        },
        columnStyles: {
            2: { halign: 'right' }
        }
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(201, 213, 225);
    doc.line(14, pageHeight - 20, 196, pageHeight - 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${shopName} • ${shopAddress} • ${shopPhone}`, 105, pageHeight - 10, null, null, 'center');

    doc.save(`SelectedProducts-${new Date().toISOString().split('T')[0]}.pdf`);
};