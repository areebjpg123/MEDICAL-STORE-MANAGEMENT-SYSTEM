"use client";

import { useOrderStore } from "@/store/useOrderStore";

export function GlobalReceiptPrinter() {
  const printOrder = useOrderStore(state => state.printOrder);

  if (!printOrder) return null;

  return (
    <div className="hidden print:block receipt-printable bg-white text-black p-4 text-[12px] leading-tight font-mono w-[80mm] absolute top-0 left-0 z-[99999]">
      <div className="text-center mb-4 flex flex-col items-center">
        {/* We can use a real logo if available, or just text */}
        <img src="/receipt-logo.jpg" alt="Logo" className="w-16 h-16 mb-2 object-contain hidden" onError={(e) => e.currentTarget.style.display = 'none'} />
        <h2 className="text-xl font-bold mb-1">Hassan Medical Store ERP</h2>
        <p>Client: {printOrder.clientName || "Walk-in Customer"}</p>
        <p suppressHydrationWarning>Date: {printOrder.date}</p>
        <p>Receipt #: {printOrder.receiptNumber}</p>
      </div>
      <div className="border-b border-black border-dashed mb-2 pb-1 flex justify-between font-bold">
        <span className="w-1/2">Medicine</span>
        <span className="w-1/6 text-center">Qty</span>
        <span className="w-1/3 text-right">Total</span>
      </div>
      <div className="space-y-1 mb-2">
        {printOrder.items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="w-1/2 truncate pr-1">{item.name}</span>
            <span className="w-1/6 text-center">{item.qty}</span>
            <span className="w-1/3 text-right">{(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-black border-dashed pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Rs {printOrder.originalTotal.toLocaleString()}</span>
        </div>
        {printOrder.originalTotal > printOrder.total && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-Rs {(printOrder.originalTotal - printOrder.total).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>Total Amount:</span>
          <span>Rs {printOrder.total.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-center mt-6 text-[10px]">
        <p>Thank you for visiting Hassan Medical Store!</p>
      </div>
    </div>
  );
}
