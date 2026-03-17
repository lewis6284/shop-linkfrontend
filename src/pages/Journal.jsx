import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../components/Table';
import { getJournals } from '../services/journalService';
import { useGlobal } from '../context/GlobalContext';
import { FileText, Download, Filter, Search } from 'lucide-react';
import { exportJournalToPDF } from '../utils/pdfExport';
import toast from 'react-hot-toast';

const Journal = () => {
    const { accounts } = useGlobal();
    const [journals, setJournals] = useState([]);
    const [filteredJournals, setFilteredJournals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountId: '',
        type: ''
    });

    useEffect(() => {
        loadJournals();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, journals]);

    const loadJournals = async () => {
        setLoading(true);
        try {
            console.log("📂 [Journal] Fetching all journal entries...");
            const data = await getJournals();
            console.log("✅ [Journal] Received data:", data);
            // Sort by date descending
            const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setJournals(sorted);
            setFilteredJournals(sorted);
        } catch (error) {
            console.error("❌ [Journal] Load failed:", error);
            toast.error('Failed to load journal entries');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...journals];
        if (filters.startDate) {
            result = result.filter(j => j.date >= filters.startDate);
        }
        if (filters.endDate) {
            result = result.filter(j => j.date <= filters.endDate);
        }
        if (filters.accountId) {
            result = result.filter(j => j.account_id === parseInt(filters.accountId));
        }
        if (filters.type) {
            result = result.filter(j => j.type === filters.type);
        }
        setFilteredJournals(result);
    };

    const exportCSV = () => {
        const headers = ['Date', 'Type', 'Amount', 'Currency', 'Account', 'Source', 'Balance After'];
        const csvContent = [
            headers.join(','),
            ...filteredJournals.map(j => [
                j.date,
                j.type,
                j.amount,
                j.currency,
                j.Account?.name || j.account_id,
                `${j.source_table} #${j.source_id}`,
                j.balance_after
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Journal_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-left">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financial Journal</h1>
                    <p className="text-gray-500 text-sm">Review all transactions and account balances</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportCSV}
                        className="btn-secondary flex items-center gap-2 text-sm"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={() => exportJournalToPDF(filteredJournals)}
                        className="btn-primary flex items-center gap-2 text-sm bg-brand-600"
                    >
                        <FileText size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">From Date</label>
                    <input
                        type="date"
                        className="input-field py-1 text-sm w-36"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">To Date</label>
                    <input
                        type="date"
                        className="input-field py-1 text-sm w-36"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Account</label>
                    <select
                        className="input-field py-1 text-sm w-44"
                        value={filters.accountId}
                        onChange={e => setFilters({ ...filters, accountId: e.target.value })}
                    >
                        <option value="">All Accounts</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                    <select
                        className="input-field py-1 text-sm w-32"
                        value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="ENTRY">Income</option>
                        <option value="EXIT">Expense</option>
                    </select>
                </div>
                <button
                    onClick={() => setFilters({ startDate: '', endDate: '', accountId: '', type: '' })}
                    className="text-gray-400 hover:text-gray-600 p-2 mb-0.5 transition-colors"
                    title="Clear Filters"
                >
                    <Filter size={18} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <Table headers={['Date', 'Type', 'Account', 'Source', 'Amount', 'Balance Reg.']}>
                    {filteredJournals.map((j) => (
                        <TableRow key={j.id}>
                            <TableCell className="text-sm font-medium text-gray-600">{j.date}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${j.type === 'ENTRY'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-rose-100 text-rose-700'
                                    }`}>
                                    {j.type}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm">{j.Account?.name || `Acc #${j.account_id}`}</TableCell>
                            <TableCell>
                                <div className="text-xs text-gray-500 flex flex-col">
                                    <span className="capitalize">{j.source_table?.replace('_', ' ')}</span>
                                    <span className="text-[10px] opacity-70">ID: {j.source_id}</span>
                                </div>
                            </TableCell>
                            <TableCell className={`font-mono font-bold ${String(j.amount).startsWith('-') ? 'text-rose-600' : 'text-green-600'
                                }`}>
                                {j.amount.toLocaleString()} <span className="text-[10px]">{j.currency}</span>
                            </TableCell>
                            <TableCell className="font-mono text-gray-800 font-semibold bg-gray-50/50">
                                {j.balance_after?.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">Fbu</span>
                            </TableCell>
                        </TableRow>
                    ))}
                    {filteredJournals.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">
                                No journal entries found matching criteria.
                            </TableCell>
                        </TableRow>
                    )}
                </Table>
            )}
        </div>
    );
};

export default Journal;
