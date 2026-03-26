import React from 'react';
import { Globe } from 'lucide-react';

const CandidateIdentity = ({ candidate }) => {
    return (
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
                            <div className="font-semibold flex items-center gap-2">
                                <Globe size={14} className="text-gray-400" /> {candidate.nationality}
                            </div>
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
    );
};

export default CandidateIdentity;
