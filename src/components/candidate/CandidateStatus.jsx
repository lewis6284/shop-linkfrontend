import React from 'react';
import { AlertTriangle } from 'lucide-react';

const CandidateStatus = ({ candidate, handleStatusUpdate }) => {
    const activePayments = candidate.CandidatePayments?.filter(p => p.status !== 'CANCELLED') || [];
    const hasActivePayments = activePayments.length > 0;
    const blockedStatuses = ['APPROVED', 'DEPLOYED'];

    const handleChange = (e) => {
        const newStatus = e.target.value;
        if (blockedStatuses.includes(newStatus) && !hasActivePayments) {
            return; // Blocked — guard in UI via disabled options
        }
        handleStatusUpdate(newStatus);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Status & Notes</h2>

            {!hasActivePayments && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-6">
                    <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No Active Payments</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-0.5">
                            This candidate has no active payments. <strong>Approved</strong> and <strong>Deployed</strong> statuses are locked until at least one payment is recorded.
                        </p>
                    </div>
                </div>
            )}

            <div className="max-w-md">
                <label className="label dark:text-gray-300 mb-2">Change Status</label>
                <select
                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 mb-4"
                    value={candidate.status}
                    onChange={handleChange}
                >
                    <option value="PENDING">Pending</option>
                    <option
                        value="APPROVED"
                        disabled={!hasActivePayments}
                        title={!hasActivePayments ? 'Requires at least one active payment' : ''}
                    >
                        Approved{!hasActivePayments ? ' (locked — no payments)' : ''}
                    </option>
                    <option value="REJECTED">Rejected</option>
                    <option
                        value="DEPLOYED"
                        disabled={!hasActivePayments}
                        title={!hasActivePayments ? 'Requires at least one active payment' : ''}
                    >
                        Deployed{!hasActivePayments ? ' (locked — no payments)' : ''}
                    </option>
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Changing the status will update the candidate&apos;s journey progress.
                    'Deployed' indicates the candidate has successfully been placed.
                </p>
            </div>
        </div>
    );
};

export default CandidateStatus;
