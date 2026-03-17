import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import { getReceipts } from '../services/receiptService';
import { exportReceiptToPDF } from '../utils/pdfExport';
import { Download, Eye, FileCheck, Search, Filter } from 'lucide-react';
import Modal from '../components/Modal';
import QRCodeGenerator from '../components/QRCodeGenerator';
import toast from 'react-hot-toast';

const Receipts = () => {
    const [receipts, setReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReceipts();
    }, []);

    useEffect(() => {
        const filtered = receipts.filter(r =>
            r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.payer_type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredReceipts(filtered);
    }, [searchTerm, receipts]);

    const loadReceipts = async () => {
        setLoading(true);
        try {
            console.log("📂 [Receipts] Fetching all receipts...");
            const data = await getReceipts();
            console.log("✅ [Receipts] Received data:", data);
            const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setReceipts(sorted);
            setFilteredReceipts(sorted);
        } catch (error) {
            console.error("❌ [Receipts] Load failed:", error);
            toast.error('Failed to load receipts archive');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Receipts Archive</h1>
                    <p className="text-gray-500 text-sm">Official records of all income and payments</p>
                </div>
            </div>

            <div className="flex bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by receipt number or payer..."
                        className="input-field pl-10 py-2 text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-secondary flex items-center gap-2 text-sm">
                    <Filter size={16} /> Filters
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <Table headers={['Receipt #', 'Date', 'Payer Entity', 'Amount', 'Status', 'Actions']}>
                        {filteredReceipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                                <TableCell className="font-mono text-brand-600 font-black text-sm">{receipt.receipt_number}</TableCell>
                                <TableCell className="text-sm text-gray-600">{receipt.date}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{receipt.payer_type}</span>
                                        <span className="font-medium text-gray-800">Entity ID: {receipt.payer_id}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono font-bold text-gray-900">
                                    {receipt.amount.toLocaleString()} <span className="text-[10px] font-normal">{receipt.currency || 'Fbu'}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 italic">
                                        <FileCheck size={12} /> VERIFIED
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedReceipt(receipt)}
                                            className="text-gray-400 hover:text-brand-600 hover:bg-brand-50 p-2 rounded-xl transition-all"
                                            title="Quick View"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportReceiptToPDF(receipt);
                                                toast.success(`Downloading Receipt ${receipt.receipt_number}`);
                                            }}
                                            className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-all"
                                            title="Download PDF"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                    {filteredReceipts.length === 0 && (
                        <div className="text-center py-20 text-gray-400 italic bg-gray-50/30">
                            No receipts found matching your search.
                        </div>
                    )}
                </div>
            )}

            {/* Receipt Preview Modal */}
            <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Official Receipt Preview">
                {selectedReceipt && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                            <QRCodeGenerator value={`REC:${selectedReceipt.receipt_number}|VAL:${selectedReceipt.amount}|DATE:${selectedReceipt.date}`} />
                            <p className="mt-4 font-mono text-xs font-black text-gray-400">{selectedReceipt.receipt_number}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 text-sm bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div>
                                <p className="text-gray-400 font-bold text-[10px] uppercase">Transaction Date</p>
                                <p className="font-bold text-gray-800">{selectedReceipt.date}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 font-bold text-[10px] uppercase">Currency Unit</p>
                                <p className="font-bold text-gray-800">{selectedReceipt.currency || 'Fbu'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 font-bold text-[10px] uppercase">Payer Information</p>
                                <p className="font-bold text-gray-800">{selectedReceipt.payer_type} #{selectedReceipt.payer_id}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 font-bold text-[10px] uppercase">Total Value</p>
                                <p className="font-bold text-brand-600 text-lg">{selectedReceipt.amount.toLocaleString()} Fbu</p>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button onClick={() => setSelectedReceipt(null)} className="btn-secondary flex-1 font-bold">Close Preview</button>
                            <button
                                onClick={() => exportReceiptToPDF(selectedReceipt)}
                                className="btn-primary flex-1 bg-brand-600 font-bold flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Download
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Receipts;
