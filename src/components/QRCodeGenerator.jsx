import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeGenerator = ({ value, size = 128 }) => {
    if (!value) return null;

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <QRCodeCanvas
                value={value}
                size={size}
                level={"H"}
                includeMargin={true}
            />
            <p className="mt-2 text-xs text-center text-gray-500 font-mono break-all max-w-[150px]">
                {value}
            </p>
        </div>
    );
};

export default QRCodeGenerator;
