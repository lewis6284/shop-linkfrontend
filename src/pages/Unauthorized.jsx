import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-50 text-red-500 rounded-full">
                        <ShieldAlert size={48} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-8">
                    You don't have permission to access this page. If you believe this is a mistake, contact your administrator.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="w-full flex justify-center items-center gap-2 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
                >
                    <ArrowLeft size={20} /> Go Back
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
