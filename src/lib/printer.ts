import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import { CartItem } from '../store/useCartStore';

export type PrinterType = 'usb' | 'none';

export async function printReceiptESC(
  printerType: PrinterType,
  ipAddress: string,
  clientName: string,
  phone: string,
  cart: CartItem[],
  subTotal: number,
  discountPct: number,
  discountAmt: number,
  total: number
) {
  if (printerType === 'none') {
    throw new Error('No printer configured. Please configure in settings.');
  }

  // 1. Encode the receipt using ESC/POS standard
  const encoder = new ReceiptPrinterEncoder({
    language: 'esc-pos',
    width: 42, // Typical for 80mm
    imageMode: 'raster' // Ensures any images/logos encode perfectly
  });

  const dateStr = new Date().toLocaleString();

  encoder
    .initialize()
    .codepage('cp858')
    .align('center')
    .bold(true)
    .size(2, 2)
    .text('Hassan Medical Store')
    .size(1, 1)
    .bold(false)
    .newline()
    .text('Client: ' + (clientName || 'Walk-in Customer'))
    .newline()
    .text(phone ? 'Phone: ' + phone : '')
    .newline()
    .text('Date: ' + dateStr)
    .newline()
    .align('left')
    .newline()
    .line(Array(42).fill('-').join(''))
    .text('Item                  Qty     Total')
    .newline()
    .line(Array(42).fill('-').join(''));

  for (const item of cart) {
    // Format layout: [20 char name]  [5 char qty] [10 char price]
    const name = item.name.length > 20 ? item.name.substring(0, 20) : item.name.padEnd(20, ' ');
    const qty = String(item.quantity).padEnd(5, ' ');
    const priceStr = String(item.price * item.quantity).padStart(10, ' ');
    encoder.text(`${name}  ${qty} ${priceStr}`).newline();
  }

  encoder
    .line(Array(42).fill('-').join(''))
    .align('right')
    .text(`Subtotal: Rs ${subTotal.toLocaleString()}`)
    .newline();

  if (discountPct > 0) {
    encoder.text(`Discount (${discountPct}%): -Rs ${discountAmt.toLocaleString()}`).newline();
  }

  encoder
    .bold(true)
    .text(`Total Amount: Rs ${total.toLocaleString()}`)
    .bold(false)
    .newline()
    .newline()
    .align('center')
    .text('Thank you for visiting!')
    .newline()
    .newline()
    .barcode(Math.floor(10000000 + Math.random() * 90000000).toString(), 'ean13', 60)
    .newline()
    .cut()       // Send the hardware cut command
    .cashdraw(); // Send the hardware open drawer command

  const rawBytes = encoder.encode();

  // 2. Deliver the bytes
  if (printerType === 'usb') {
    const { default: WebUSBReceiptPrinter } = await import('./webusb-receipt-printer.js');
    const printer = new WebUSBReceiptPrinter();
    await printer.connect();
    await printer.print(rawBytes);
  }
}
