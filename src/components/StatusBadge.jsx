import React from 'react';

const StatusBadge = ({ status }) => {
    const styles = {
        ACTIVE: 'bg-green-100 text-green-700',
        PAID: 'bg-green-100 text-green-700',
        APPROVED: 'bg-blue-100 text-blue-700',
        PENDING: 'bg-yellow-100 text-yellow-700',
        INACTIVE: 'bg-gray-100 text-gray-700',
        REJECTED: 'bg-red-100 text-red-700',
        SUSPENDED: 'bg-red-100 text-red-700',
        ENTRY: 'bg-teal-100 text-teal-700', // Journal Types
        EXIT: 'bg-rose-100 text-rose-700',
    };

    const defaultStyle = 'bg-gray-100 text-gray-700';

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
