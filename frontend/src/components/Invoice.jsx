'use client';

import React from 'react';

export const Invoice = React.forwardRef(({ transaction, businessDetails }, ref) => {
    if (!transaction) return null;

    const contact = transaction.customerId || transaction.vendorId;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return (amount || 0).toFixed(2);
    };

    // Number to words helper (simplified for Indian context)
    const toWords = (amount) => {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const inWords = (num) => {
            if ((num = num.toString()).length > 9) return 'overflow';
            let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return;
            let str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
            return str.toUpperCase();
        };

        return inWords(Math.floor(amount));
    };

    // Reusable invoice content component
    const InvoiceContent = ({ copyLabel }) => (
        <div className="relative">
            {/* Copy Label */}
            {copyLabel && (
                <div className="absolute top-0 right-0 bg-gray-200 px-3 py-1 text-[8pt] font-bold uppercase border border-black">
                    {copyLabel}
                </div>
            )}

            {/* Header section */}
            <div className="text-center border-b-2 border-black pb-1 mb-2">
                <p className="text-[7pt] uppercase mb-0.5">Tax Invoice</p>
                <h1 className="text-lg font-bold uppercase">{businessDetails.name}</h1>
                <p className="text-[7pt] leading-tight">{businessDetails.address}</p>
                <div className="flex justify-center gap-4 text-[7pt]">
                    <span>PH NO:- {businessDetails.phone}</span>
                </div>
                <p className="font-bold text-[7pt]">GSTIN:- {businessDetails.gstin}</p>
            </div>

            {/* Buyer info grid */}
            <div className="grid grid-cols-3 border-2 border-black mb-0">
                <div className="col-span-2 border-r-2 border-black p-1">
                    <p className="font-bold uppercase text-[7pt]">Buyer,</p>
                    <div className="mt-0.5 leading-tight min-h-[40px]">
                        <p className="font-bold uppercase text-[8pt]">{contact?.name || 'N/A'}</p>
                        <p className="text-[7pt]">{typeof contact?.address === 'object'
                            ? [contact.address.street, contact.address.city, contact.address.state, contact.address.zipCode].filter(Boolean).join(', ')
                            : (contact?.address || '')}
                        </p>
                    </div>
                    <p className="font-bold mt-1 text-[6pt]">GSTIN:- {contact?.GSTIN || 'N/A'}</p>
                </div>
                <div className="p-0">
                    <div className="grid grid-cols-2 border-b-2 border-black">
                        <div className="border-r-2 border-black p-0.5 font-bold text-[6pt] text-center uppercase">Dated</div>
                        <div className="p-0.5 font-bold text-[6pt] text-center uppercase">Invoice No</div>
                    </div>
                    <div className="grid grid-cols-2 border-b-2 border-black min-h-[20px]">
                        <div className="border-r-2 border-black p-0.5 text-center text-[7pt]">
                            {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <div className="p-0.5 text-center text-[7pt] font-bold">
                            {transaction.invoiceNumber || transaction._id.slice(-6).toUpperCase()}
                        </div>
                    </div>
                    <div className="p-0.5 font-bold text-[6pt] uppercase text-center border-b-2 border-black bg-gray-50">Picker Sign,</div>
                    <div className="min-h-[15px] border-b-2 border-black"></div>
                    <div className="p-0.5 font-bold text-[6pt] uppercase text-center bg-gray-50">Buyer Sign,</div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-x-2 border-b-2 border-black text-[7pt]">
                <thead>
                    <tr className="bg-gray-50 border-b-2 border-black">
                        <th className="border-r-2 border-black font-bold uppercase p-0.5 w-8">Si</th>
                        <th className="border-r-2 border-black font-bold uppercase p-0.5">Description</th>
                        <th className="border-r-2 border-black font-bold uppercase p-0.5 w-16">HSN</th>
                        <th className="border-r-2 border-black font-bold uppercase p-0.5 w-12">Piece</th>
                        <th className="border-r-2 border-black font-bold uppercase p-0.5 w-12">Case</th>
                        <th className="border-r-2 border-black font-bold uppercase p-0.5 w-14">Price</th>
                        <th className="font-bold uppercase p-0.5 w-16">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {transaction.products.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="border-r-2 border-black p-0.5 text-center">{index + 1}</td>
                            <td className="border-r-2 border-black p-0.5 uppercase">{item.productName}</td>
                            <td className="border-r-2 border-black p-0.5 text-center">{item.HSN || item.productId?.HSN || '-'}</td>
                            <td className="border-r-2 border-black p-0.5 text-center">{item.unitType === 'single' ? item.quantity : 0}</td>
                            <td className="border-r-2 border-black p-0.5 text-center">{item.unitType === 'case' ? item.quantity : 0}</td>
                            <td className="border-r-2 border-black p-0.5 text-right">{formatCurrency(item.price)}</td>
                            <td className="p-0.5 text-right">{formatCurrency(item.total)}</td>
                        </tr>
                    ))}
                    {/* Fill extra empty rows */}
                    {[...Array(Math.max(0, 5 - transaction.products.length))].map((_, i) => (
                        <tr key={`empty-${i}`} className="h-4">
                            <td className="border-r-2 border-black p-0.5"></td>
                            <td className="border-r-2 border-black p-0.5"></td>
                            <td className="border-r-2 border-black p-0.5"></td>
                            <td className="border-r-2 border-black p-0.5"></td>
                            <td className="border-r-2 border-black p-0.5"></td>
                            <td className="border-r-2 border-black p-0.5"></td>
                            <td className="p-0.5"></td>
                        </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-black font-bold">
                        <td colSpan={3} className="border-r-2 border-black"></td>
                        <td className="border-r-2 border-black p-0.5 text-center">
                            {transaction.products.reduce((acc, item) => acc + (item.unitType === 'single' ? item.quantity : 0), 0)}
                        </td>
                        <td className="border-r-2 border-black p-0.5 text-center">
                            {transaction.products.reduce((acc, item) => acc + (item.unitType === 'case' ? item.quantity : 0), 0)}
                        </td>
                        <td className="border-r-2 border-black p-0.5 text-center bg-gray-50 text-[6pt] uppercase">Sub Total</td>
                        <td className="p-0.5 text-right">{formatCurrency(transaction.subtotal)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Bottom section */}
            <div className="grid grid-cols-2 border-x-2 border-black mb-0">
                <div className="border-r-2 border-black p-2 flex flex-col justify-center">
                    <p className="font-bold uppercase text-[7pt] mb-1 underline">Total in Words:-</p>
                    <p className="font-bold text-[7pt]">
                        {toWords(transaction.totalAmount)}
                    </p>
                </div>
                <div className="p-0 font-bold uppercase text-[7pt]">
                    <div className="grid grid-cols-2 border-b border-black">
                        <div className="border-r-2 border-black p-0.5 pl-2">SGST (2.5%)</div>
                        <div className="p-0.5 text-right">{formatCurrency(transaction.sgst)}</div>
                    </div>
                    <div className="grid grid-cols-2 border-b border-black">
                        <div className="border-r-2 border-black p-0.5 pl-2">CGST (2.5%)</div>
                        <div className="p-0.5 text-right">{formatCurrency(transaction.cgst)}</div>
                    </div>
                    {transaction.discount > 0 && (
                        <div className="grid grid-cols-2 border-b border-black text-green-700">
                            <div className="border-r-2 border-black p-0.5 pl-2">Discount</div>
                            <div className="p-0.5 text-right">-{formatCurrency(transaction.discount)}</div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 border-b-2 border-black bg-gray-50">
                        <div className="border-r-2 border-black p-0.5 pl-2">Total</div>
                        <div className="p-0.5 text-right text-[8pt]">{formatCurrency(transaction.totalAmount)}</div>
                    </div>
                    <div className="grid grid-cols-2 bg-gray-100">
                        <div className="border-r-2 border-black p-0.5 pl-2">Total (Round)</div>
                        <div className="p-0.5 text-right text-[9pt]">{Math.round(transaction.totalAmount)}</div>
                    </div>
                </div>
            </div>

            {/* Bank Details section */}
            <div className="grid grid-cols-3 border-2 border-black">
                <div className="border-r-2 border-black p-1">
                    <p className="font-bold uppercase text-[6pt] underline">Bank Details:-</p>
                    <div className="grid grid-cols-2 mt-1 gap-y-1 text-[6pt]">
                        <span className="font-bold">BANK NAME</span>
                        <span>: {businessDetails.bank.name}</span>
                        <span className="font-bold">A/C NO</span>
                        <span>: {businessDetails.bank.accountNo}</span>
                        <span className="font-bold">IFCS CODE</span>
                        <span>: {businessDetails.bank.ifsc}</span>
                    </div>
                </div>
                <div className="border-r-2 border-black p-0">
                    <div className="grid grid-cols-3 border-b border-black bg-gray-50 font-bold text-[6pt] text-center">
                        <div className="col-span-1 border-r border-black p-0.5">GST</div>
                        <div className="col-span-2 p-0.5 font-bold">FOR</div>
                    </div>
                    <div className="grid grid-cols-3 text-[6pt] text-center border-b border-gray-300">
                        <div className="border-r border-black p-0.5 font-bold">SGST</div>
                        <div className="border-r border-black p-0.5">2.5%</div>
                        <div className="p-0.5 font-bold">{formatCurrency(transaction.sgst)}</div>
                    </div>
                    <div className="grid grid-cols-3 text-[6pt] text-center border-b border-gray-300">
                        <div className="border-r border-black p-0.5 font-bold">CGST</div>
                        <div className="border-r border-black p-0.5">2.5%</div>
                        <div className="p-0.5 font-bold">{formatCurrency(transaction.cgst)}</div>
                    </div>
                    <div className="grid grid-cols-3 text-[6pt] text-center font-bold bg-gray-50">
                        <div className="border-r border-black p-0.5">GST</div>
                        <div className="border-r border-black p-0.5">5%</div>
                        <div className="p-0.5">{formatCurrency(transaction.sgst + transaction.cgst)}</div>
                    </div>
                </div>
                <div className="p-1 flex flex-col items-center justify-center text-center">
                    <p className="font-bold text-[6pt] uppercase">{businessDetails.name}, STAMP</p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 0;
                }
                
                .invoice-container {
                    width: 210mm;
                    height: 297mm;
                    margin: 0 auto;
                    background: white;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                    padding: 10mm;
                }
                
                @media print {
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .invoice-container {
                        margin: 0;
                        box-shadow: none;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        padding: 10mm;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                
                @media screen {
                    .invoice-container {
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                }
            `}</style>

            <div ref={ref} className="invoice-container">
                {/* Customer Copy - Top Half */}
                <div style={{
                    height: '138mm',
                    padding: '2mm',
                    boxSizing: 'border-box',
                    borderBottom: '2px dashed #9ca3af',
                    marginBottom: '1mm'
                }}>
                    <InvoiceContent copyLabel="CUSTOMER COPY" />
                </div>

                {/* Official Copy - Bottom Half */}
                <div style={{
                    height: '138mm',
                    padding: '2mm',
                    boxSizing: 'border-box'
                }}>
                    <InvoiceContent copyLabel="OFFICIAL COPY" />
                </div>
            </div>
        </>
    );
});

Invoice.displayName = 'Invoice';
