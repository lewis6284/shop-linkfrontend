import React from 'react';

const Table = ({ headers, children }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                            {headers.map((header, index) => (
                                <th key={index} className="px-6 py-4 font-semibold">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TableRow = ({ children, className }) => (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${className}`}>
        {children}
    </tr>
);

export const TableCell = ({ children, className }) => (
    <td className={`px-6 py-4 text-sm text-gray-700 dark:text-gray-300 ${className}`}>
        {children}
    </td>
);

export default Table;
