import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidateById, updateCandidate } from '../services/candidateService';
import Table, { TableRow, TableCell } from '../components/Table';
import { ArrowLeft, User, CreditCard, FileText, CheckCircle, Globe, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const CandidateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('identity'); // identity, payments, status

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const data = await getCandidateById(id);
            setCandidate(data);
        } catch (error) {
            toast.error("Failed to load candidate details");
            navigate('/candidates');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateCandidate(id, { status: newStatus });
            toast.success("Status updated");
            loadData();
        } catch (error) { toast.error("Failed to update status"); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!candidate) return <div className="p-8 text-center text-gray-500">Candidate not found.</div>;

    const totalPaid = candidate.CandidatePayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors
                ${activeTab === id
                    ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
            `}
        >
            {Icon && <Icon size={18} />}
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800">
                <ArrowLeft size={20} className="mr-2" /> Back
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-2xl font-black shrink-0">
                    {candidate.name.charAt(0)}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
                    <div className="text-gray-500 mt-1 flex flex-wrap justify-center md:justify-start gap-3 items-center">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 font-mono">{candidate.candidate_code}</span>
                        <span>•</span>
                        <span>{candidate.position_applied || 'No Position'}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase
                         ${candidate.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            candidate.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                candidate.status === 'DEPLOYED' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'}`}>
                        {candidate.status}
                    </span>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
                <TabButton id="identity" label="Identity" icon={User} />
                <TabButton id="payments" label="Payments" icon={CreditCard} />
                <TabButton id="status" label="Status / Notes" icon={CheckCircle} />
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'identity' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Personal & Official Identity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Basic Info</h3>
                                <div className="grid grid-cols-2 gap-y-4">
                                    <div className="text-sm">
                                        <div className="text-gray-500 mb-1">Gender</div>
                                        <div className="font-semibold">{candidate.gender}</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-gray-500 mb-1">Marital Status</div>
                                        <div className="font-semibold">{candidate.marital_status}</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-gray-500 mb-1">Nationality</div>
                                        <div className="font-semibold flex items-center gap-2"><Globe size={14} className="text-gray-400" /> {candidate.nationality}</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-gray-500 mb-1">National ID</div>
                                        <div className="font-semibold">{candidate.national_id || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Passport Details</h3>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase">Passport No.</div>
                                            <div className="font-mono font-bold text-lg text-brand-700">{candidate.passport_number || 'N/A'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase">Status</div>
                                            <div className="font-bold text-gray-800">{candidate.passport_status}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-500">Issued:</span> {candidate.passport_issue_date || '-'}</div>
                                        <div><span className="text-gray-500">Expires:</span> {candidate.passport_expiry_date || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-gray-500 text-sm mb-1">Phone</div>
                                    <div className="font-semibold">{candidate.phone || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-sm mb-1">Email</div>
                                    <div className="font-semibold">{candidate.email || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Financial History</h2>
                            <div className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl">
                                Total: {totalPaid.toLocaleString()}
                            </div>
                        </div>
                        <Table headers={['Date', 'Type', 'Amount', 'Account']}>
                            {candidate.CandidatePayments?.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-sm text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</TableCell>

                                    <TableCell>
                                        <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                                            {p.CandidatePaymentType?.name || 'Payment'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-emerald-600">
                                        +{parseFloat(p.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">{p.Account?.name || '-'}</TableCell>
                                </TableRow>
                            ))}
                            {(!candidate.CandidatePayments || candidate.CandidatePayments.length === 0) && (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No payments recorded yet.</td></tr>
                            )}
                        </Table>
                    </div>
                )}

                {activeTab === 'status' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Status & Notes</h2>
                        <div className="max-w-md">
                            <label className="label mb-2">Change Status</label>
                            <select
                                className="input-field mb-4"
                                value={candidate.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="DEPLOYED">Deployed</option>
                            </select>
                            <p className="text-sm text-gray-500">
                                Changing the status will update the candidate's journey progress.
                                'Deployed' indicates the candidate has successfully been placed.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateDetails;
