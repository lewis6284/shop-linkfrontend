import React from 'react';

const Table = ({ headers, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                            {headers.map((header, index) => (
                                <th key={index} className="px-6 py-4 font-semibold">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TableRow = ({ children, className }) => (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`}>
        {children}
    </tr>
);

export const TableCell = ({ children, className }) => (
    <td className={`px-6 py-4 text-sm text-gray-700 ${className}`}>
        {children}
    </td>
);

export default Table;
