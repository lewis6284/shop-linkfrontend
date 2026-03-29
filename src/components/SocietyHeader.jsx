import React from 'react';
import QRCodeGenerator from './QRCodeGenerator';

const SocietyHeader = ({ societyName = "AL-SUWEDI", subTitle = "Official Document", qrValue = "verified" }) => {
    return (
        <div className="relative overflow-hidden rounded-xl shadow-lg mb-8">
            {/* Background with Indigo gradient to match PDF colors (79, 70, 229) */}
            <div className="bg-indigo-600 bg-gradient-to-r from-indigo-700 to-brand-600 px-8 py-10 flex justify-between items-center text-white">
                <div className="space-y-2 z-10">
                    <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                        {societyName}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-12 bg-white/30 rounded-full"></div>
                        <p className="text-lg font-bold text-indigo-100/90 tracking-wide">
                            {subTitle}
                        </p>
                    </div>
                </div>

                <div className="z-10 translate-x-2">
                    <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-2xl">
                        <div className="bg-white p-2 rounded-xl">
                            <QRCodeGenerator 
                                value={qrValue} 
                                size={85} 
                            />
                        </div>
                        <p className="text-[10px] font-black mt-2 text-center text-white tracking-[0.2em] uppercase opacity-80">
                            Verify Authentic
                        </p>
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>
        </div>
    );
};

export default SocietyHeader;
