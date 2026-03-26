import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidateById, updateCandidate } from '../services/candidateService';
import { ArrowLeft, User, CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Sub-components
import CandidateIdentity from '../components/candidate/CandidateIdentity';
import CandidatePayments from '../components/candidate/CandidatePayments';
import CandidateStatus from '../components/candidate/CandidateStatus';

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

    const totalPaid = candidate.CandidatePayments?.filter(p => p.status !== 'CANCELLED').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

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
                    {candidate.name?.charAt(0)}
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
                {activeTab === 'identity' && <CandidateIdentity candidate={candidate} />}
                {activeTab === 'payments' && <CandidatePayments candidate={candidate} totalPaid={totalPaid} onRefresh={loadData} />}
                {activeTab === 'status' && <CandidateStatus candidate={candidate} handleStatusUpdate={handleStatusUpdate} />}
            </div>
        </div>
    );
};

export default CandidateDetails;
