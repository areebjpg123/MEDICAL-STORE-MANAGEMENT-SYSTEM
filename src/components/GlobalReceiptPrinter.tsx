"use client";

import { useOrderStore } from "@/store/useOrderStore";
import Barcode from "react-barcode";

export function GlobalReceiptPrinter() {
  const printOrder = useOrderStore(state => state.printOrder);

  if (!printOrder) return null;

  return (
    <div className="hidden print:block receipt-printable bg-white text-black p-0 text-[12px] leading-tight font-mono w-[80mm] absolute top-0 left-0 z-[99999]" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      <div className="text-center mb-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-1 uppercase tracking-widest">HASSAN MEDICAL STORE</h2>
        <p className="uppercase">Client: {printOrder.clientName || "Walk-in Customer"}</p>
        <p className="uppercase">Receipt: {printOrder.receiptNumber}</p>
        <p className="uppercase" suppressHydrationWarning>Date: {printOrder.date}</p>
      </div>
      
      <div className="text-center font-bold">
        ------------------------------------------
      </div>
      <div className="flex justify-between font-bold px-1 uppercase">
        <span className="w-1/2 text-left">Item</span>
        <span className="w-1/6 text-center">Qty</span>
        <span className="w-1/3 text-right">Total</span>
      </div>
      <div className="text-center font-bold mb-1">
        ------------------------------------------
      </div>
      
      <div className="space-y-1 mb-2 px-1">
        {printOrder.items.map((item, idx) => (
          <div key={idx} className="flex justify-between uppercase">
            <span className="w-1/2 truncate pr-1">{item.name}</span>
            <span className="w-1/6 text-center">{item.qty}</span>
            <span className="w-1/3 text-right">{Number(item.price * item.qty).toLocaleString("en-PK")}</span>
          </div>
        ))}
      </div>
      
      <div className="text-center font-bold mt-2">
        ------------------------------------------
      </div>
      <div className="space-y-1 pt-1 px-1 uppercase">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Rs {printOrder.originalTotal.toLocaleString("en-PK")}</span>
        </div>
        {printOrder.originalTotal > printOrder.total && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-Rs {(printOrder.originalTotal - printOrder.total).toLocaleString("en-PK")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[14px] mt-2 border-t border-black border-dashed pt-2">
          <span>TOTAL:</span>
          <span>Rs {printOrder.total.toLocaleString("en-PK")}</span>
        </div>
      </div>
      <div className="text-center font-bold mt-2 mb-4">
        ==========================================
      </div>
      
      <div className="text-center mt-4 text-[11px] uppercase flex flex-col items-center">
        <p className="font-bold mb-2">Thank you for visiting!</p>
        <Barcode 
          value={printOrder.receiptNumber.replace("RCP-", "")} 
          width={1.5} 
          height={40} 
          fontSize={12}
          displayValue={true}
          background="#ffffff"
          lineColor="#000000"
          margin={0}
        />
        <p className="mt-4">Software by Areeb</p>
      </div>
    </div>
  );
}
