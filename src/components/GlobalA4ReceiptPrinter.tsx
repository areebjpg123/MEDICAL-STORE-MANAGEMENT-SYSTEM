"use client";

import { useOrderStore } from "@/store/useOrderStore";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { toWords } from "number-to-words";

const ITEMS_FIRST_PAGE = 35;
const ITEMS_CONTINUATION_PAGE = 45;

export function GlobalA4ReceiptPrinter() {
  const data = useOrderStore(state => state.printOrderA4);

  if (!data) return null;

  const displayId = data.receiptNumber || data.id;
  const barcodeValue = displayId.length > 15 ? "ORD-" + displayId.substring(0, 6).toUpperCase() : displayId;
  const storeName = "Hassan Medical Store";
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const receiptUrl = `${baseUrl}/receipt/${data.id}`;

  const chunks: typeof data.items[] = [];
  if (data.items.length <= ITEMS_FIRST_PAGE) {
    chunks.push(data.items);
  } else {
    chunks.push(data.items.slice(0, ITEMS_FIRST_PAGE));
    let remaining = data.items.slice(ITEMS_FIRST_PAGE);
    while (remaining.length > 0) {
      chunks.push(remaining.slice(0, ITEMS_CONTINUATION_PAGE));
      remaining = remaining.slice(ITEMS_CONTINUATION_PAGE);
    }
  }
  if (chunks.length === 0) chunks.push([]);

  const getSerialOffset = (pageIndex: number) => {
    if (pageIndex === 0) return 0;
    let offset = ITEMS_FIRST_PAGE;
    for (let i = 1; i < pageIndex; i++) {
      offset += chunks[i].length;
    }
    return offset;
  };

  return (
    <div className="hidden print:block receipt-printable bg-white text-black p-0 font-sans absolute top-0 left-0 w-[210mm] z-[99999]">
      {chunks.map((chunk, pageIndex) => {
        const isLastPage = pageIndex === chunks.length - 1;
        const pageNumber = pageIndex + 1;
        const totalPages = chunks.length;
        const serialOffset = getSerialOffset(pageIndex);

        return (
          <div 
            key={pageIndex}
            className="w-[210mm] min-h-[297mm] flex flex-col mb-8 print:mb-0 relative bg-white"
            style={{ padding: '8mm' }}
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none overflow-hidden z-0">
               <img src="/receipt-logo.jpg" alt="Watermark" className="w-[150mm] h-[150mm] object-contain rotate-[-15deg] grayscale mix-blend-multiply" />
            </div>

            <div className="flex-1 flex flex-col z-10">
            {pageIndex === 0 && (
              <>
                <div className="flex justify-between items-center mb-1 border-b-2 border-slate-900 pb-1 print:border-b-2 shrink-0">
                  <div className="flex flex-col items-start w-1/3 pt-1">
                    <Barcode 
                      value={barcodeValue} 
                      width={1.2} 
                      height={24} 
                      fontSize={12} 
                      margin={0}
                      displayValue={false}
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold tracking-widest">{displayId}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-1/3">
                     <img src="/receipt-logo.jpg" alt="Store Logo" className="w-[120px] h-[85px] object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col items-end w-1/3 pt-1">
                    <span className="text-[6.5px] font-bold tracking-[0.2em] text-slate-800 mb-0.5 mr-0.5 uppercase">Scan to Verify</span>
                    <QRCodeSVG value={receiptUrl} size={45} />
                  </div>
                </div>

                <div className="text-center mb-1 shrink-0">
                  <h1 className="text-2xl font-black text-[#1a202c] tracking-wider uppercase">{storeName}</h1>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-4">
                     <span>Contact: 0300 0000000</span>
                     <span>&bull;</span>
                     <span>NTN: 0000000-0</span>
                    </div>
                </div>

                <div className="border-t-2 border-b-2 border-slate-800 py-1 mb-1 print:border-t-2 print:border-b-2 shrink-0">
                   <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[11px]">
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">CLIENT NAME:</span>
                         <span className="text-slate-700">{data.clientName || 'Walk-in Customer'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">DATE:</span>
                         <span className="text-slate-700">{new Date(data.date).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">ORDER ID:</span>
                         <span className="text-slate-700 font-mono font-bold text-xs self-center">{displayId}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">STATUS:</span>
                         <span className="text-slate-700">{data.status}</span>
                      </div>
                   </div>
                </div>
              </>
            )}

            {pageIndex !== 0 && (
              <div className="flex items-start justify-between mb-1 border-b border-slate-200 pb-1 print:border-b shrink-0">
                 <div className="flex flex-col items-start w-1/3 pt-0">
                   <Barcode 
                     value={barcodeValue} 
                     width={1.2} 
                     height={24} 
                     fontSize={12} 
                     margin={0}
                     displayValue={false}
                   />
                   <span className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold tracking-widest">{displayId}</span>
                 </div>
                 <div className="flex flex-col items-center justify-center w-1/3">
                   <img src="/receipt-logo.jpg" alt="Store Logo" className="w-[80px] h-[55px] object-contain mix-blend-multiply" />
                 </div>
                 <div className="flex flex-col items-end w-1/3 pt-0">
                   <span className="text-[6.5px] font-bold tracking-[0.2em] text-slate-800 mb-0.5 mr-0.5">SCAN TO VERIFY</span>
                   <QRCodeSVG value={receiptUrl} size={45} />
                 </div>
              </div>
            )}

            {pageIndex !== 0 && (
              <>
                <div className="text-center mb-1 border-b border-slate-200 pb-1 print:border-b shrink-0">
                  <h1 className="text-2xl font-black text-[#1a202c] tracking-wider uppercase">{storeName}</h1>
                </div>

                <div className="border-t-2 border-b-2 border-slate-800 py-1 mb-1 print:border-t-2 print:border-b-2 shrink-0">
                   <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[11px]">
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">CLIENT NAME:</span>
                         <span className="text-slate-700">{data.clientName || 'Walk-in Customer'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">ORDER ID:</span>
                         <span className="text-slate-700 font-mono font-bold text-xs self-center">{displayId}</span>
                      </div>
                   </div>
                </div>
              </>
            )}

            <div className="flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-t-2 border-slate-800 text-[11px]">
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-8">S.No</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800">Product Name</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[60px]">Quantity</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[85px]">Rate</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[95px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => {
                    const serialNo = serialOffset + idx + 1;
                    return (
                      <tr key={idx} className="border-b border-slate-400 print:break-inside-avoid text-[11px]">
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{serialNo}</td>
                        <td className="py-0 px-1 text-slate-900 font-semibold border-x-2 border-slate-800 leading-tight uppercase">{item.name}</td>
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{item.qty}</td>
                        <td className="py-0 px-1 text-center text-slate-800 border-x-2 border-slate-800">{Number(item.price).toFixed(2)}</td>
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{(item.qty * item.price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isLastPage && (
                <div className="flex flex-col items-end border-b-[3px] border-slate-800 pb-0.5 mt-1 print:border-b-2">
                  <div className="flex items-center gap-4 text-base mb-0.5">
                      <span className="font-bold text-slate-900 uppercase tracking-widest text-sm">SUBTOTAL:</span>
                      <span className="font-bold text-slate-900 text-sm">Rs. {data.originalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  {data.originalTotal > data.total && (
                    <div className="flex items-center gap-4 text-base mb-0.5 text-red-700">
                        <span className="font-bold uppercase tracking-widest text-sm">DISCOUNT:</span>
                        <span className="font-bold text-sm">-Rs. {(data.originalTotal - data.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-base mb-0.5">
                      <span className="font-bold text-slate-900 uppercase tracking-widest text-lg">GRAND TOTAL:</span>
                      <span className="font-black text-slate-900 text-xl">Rs. {data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <span className="font-semibold text-slate-600 italic text-[9px] uppercase mt-1">
                      Amount in Words: {toWords(Math.floor(data.total))} Rupees Only
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 mt-auto pt-2">
              {isLastPage ? (
                <div className="flex justify-between items-end">
                  <div className="w-56 text-center border-t-2 border-slate-800 pt-1 mt-2">
                      <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Authorized Sign</p>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 pt-1.5 uppercase tracking-widest flex flex-col items-end gap-0.5">
                      <span>PAGE {pageNumber} OF {totalPages}</span>
                      <span>Software by Areeb & Isbah</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end border-t-2 border-slate-800 pt-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                   PAGE {pageNumber} OF {totalPages}
                </div>
              )}
            </div>

          </div>
          </div>
        );
      })}
    </div>
  );
}
