import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { getCandidateById } from '../services/candidateService';

export const exportReceiptToPDF = async (receiptData) => {
    const doc = new jsPDF();

    let candidate = null;
    let allPayments = [];
    let societyName = "AL-SUWEDI";

    if (receiptData.payer_type === 'CANDIDATE') {
        try {
            candidate = await getCandidateById(receiptData.payer_id);
            allPayments = candidate.CandidatePayments || [];
            if (candidate.Agency && candidate.Agency.name) {
                societyName = candidate.Agency.name;
            }
        } catch (error) {
            console.error("Failed to fetch candidate details for PDF", error);
        }
    }

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

export const exportJournalToPDF = (entries) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Journal Entries", 14, 20);

    const tableColumn = ["Date", "Type", "Amount", "Currency", "Account", "Balance"];
    const tableRows = entries.map(entry => [
        entry.date,
        entry.type,
        entry.amount,
        entry.currency,
        entry.account_id, // Ideally resolve name
        entry.balance_after
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
    });

    doc.save("Journal_Entries.pdf");
};