/**
 * ALSYFA Bluetooth Thermal Printer Utility
 * Supports Web Bluetooth API (Scanning & Direct Printing)
 * Supports ESC/POS 58mm & 80mm binary formatting
 * Supports RawBT Android Bluetooth App Intent fallback
 */

import { formatDateID } from './dateFormat';

// Popular Thermal Printer Service UUIDs (ESC/POS, POS-58, POS-80, RPP, PT-210, Panda, Iware, etc.)
export const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Chinese POS service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Mobile thermal printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common ESC/POS BLE service
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb'
];

let activeDevice = null;
let activeCharacteristic = null;
let activeServer = null;

/**
 * Check if Web Bluetooth is supported by the current browser/environment
 */
export function isWebBluetoothSupported() {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!navigator.bluetooth;
}

/**
 * Get current connected device info
 */
export function getBluetoothPrinterState() {
  const isConnected = !!(activeDevice && activeDevice.gatt && activeDevice.gatt.connected && activeCharacteristic);
  const savedName = localStorage.getItem('alsyifa_bt_printer_name');
  return {
    isSupported: isWebBluetoothSupported(),
    isConnected,
    deviceName: isConnected ? (activeDevice.name || savedName || 'Printer Bluetooth') : null,
    savedDeviceName: savedName || null
  };
}

/**
 * Scan and connect to Bluetooth Thermal Printer
 */
export async function scanAndConnectBluetoothPrinter() {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth tidak didukung pada browser ini. Pastikan menggunakan Chrome/Edge dengan protokol HTTPS.');
  }

  try {
    // Request Bluetooth device with thermal printer services
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: THERMAL_PRINTER_SERVICES
    });

    if (!device) {
      throw new Error('Pemilihan printer bluetooth dibatalkan.');
    }

    // Connect to GATT Server
    const server = await device.gatt.connect();
    activeServer = server;
    activeDevice = device;

    // Listen to disconnect event
    device.addEventListener('gattserverdisconnected', () => {
      activeCharacteristic = null;
      activeServer = null;
    });

    // Discover services & writable characteristic
    let writeChar = null;
    const services = await server.getPrimaryServices();

    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
      } catch (err) {
        // continue search in next service
      }
      if (writeChar) break;
    }

    if (!writeChar) {
      throw new Error('Karakteristik cetak ESC/POS tidak ditemukan pada printer ini.');
    }

    activeCharacteristic = writeChar;
    const name = device.name || 'Printer Bluetooth';
    localStorage.setItem('alsyifa_bt_printer_name', name);

    return {
      success: true,
      deviceName: name,
      device
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Disconnect active Bluetooth thermal printer
 */
export function disconnectBluetoothPrinter() {
  if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected) {
    activeDevice.gatt.disconnect();
  }
  activeDevice = null;
  activeCharacteristic = null;
  activeServer = null;
}

/**
 * Generate binary ESC/POS command array for thermal receipt
 */
export function buildEscPosBytes(order, format = '58mm') {
  const is80 = format === '80mm';
  const width = is80 ? 48 : 32;
  const divider = '-'.repeat(width) + '\n';
  const doubleDivider = '='.repeat(width) + '\n';

  const encoder = new TextEncoder();
  const buffer = [];

  const addBytes = (bytes) => {
    for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
  };

  const addText = (text) => {
    const encoded = encoder.encode(text);
    for (let i = 0; i < encoded.length; i++) buffer.push(encoded[i]);
  };

  // Helper formatting line with left and right alignment
  const formatTwoColumn = (left, right) => {
    const totalSpaces = width - left.length - right.length;
    if (totalSpaces < 1) {
      return left + '\n' + ' '.repeat(Math.max(0, width - right.length)) + right + '\n';
    }
    return left + ' '.repeat(totalSpaces) + right + '\n';
  };

  // 1. ESC @ (Initialize printer)
  addBytes([0x1B, 0x40]);

  // 2. Align Center & Bold for Header
  addBytes([0x1B, 0x61, 0x01]); // Align Center
  addBytes([0x1B, 0x45, 0x01]); // Bold ON
  addBytes([0x1D, 0x21, 0x11]); // Double height & width
  addText('ALSYFA\n');
  addBytes([0x1D, 0x21, 0x00]); // Normal size
  addBytes([0x1B, 0x45, 0x00]); // Bold OFF
  addText('PRODUK SNACK COKLAT\n');
  addText('Distribusi Snack & Coklat Pilihan\n');
  addText('Telp/WA: 0812-3456-7890\n');

  // 3. Align Left for Order Metadata
  addBytes([0x1B, 0x61, 0x00]); // Align Left
  addText(doubleDivider);
  addText(`No Faktur : ${order.invoice_number || '-'}\n`);
  addText(`Tanggal   : ${formatDateID(order.order_date)}\n`);
  addText(`Sales     : ${order.sales_name || '-'}\n`);
  addText(`Toko      : ${order.customer_name || '-'}\n`);
  if (order.customer_address) {
    addText(`Alamat    : ${order.customer_address}\n`);
  }
  addText(divider);

  // 4. Items Table
  addBytes([0x1B, 0x45, 0x01]); // Bold ON
  if (is80) {
    addText(formatTwoColumn('ITEM / PRODUK', 'TOTAL'));
  } else {
    addText(formatTwoColumn('PRODUK', 'HARGA'));
  }
  addBytes([0x1B, 0x45, 0x00]); // Bold OFF
  addText(divider);

  (order.items || []).forEach((item) => {
    // Line 1: Product name
    addText(`${item.product_name}\n`);
    // Line 2: Qty x Price and Line Total
    const qtyPrice = `${item.qty} ${item.unit || 'pcs'} x Rp ${Number(item.price || 0).toLocaleString('id-ID')}`;
    const total = `Rp ${Number(item.total_price || 0).toLocaleString('id-ID')}`;
    addText(formatTwoColumn(qtyPrice, total));
  });

  addText(divider);

  // 5. Totals
  const subtotal = `Rp ${Number(order.subtotal || 0).toLocaleString('id-ID')}`;
  addText(formatTwoColumn('Subtotal', subtotal));

  if (Number(order.discount_amount || 0) > 0) {
    const disc = `-Rp ${Number(order.discount_amount).toLocaleString('id-ID')}`;
    addText(formatTwoColumn('Diskon', disc));
  }

  addBytes([0x1B, 0x45, 0x01]); // Bold ON
  const grandTotal = `Rp ${Number(order.grand_total || 0).toLocaleString('id-ID')}`;
  addText(formatTwoColumn('TOTAL PEMBAYARAN', grandTotal));
  addBytes([0x1B, 0x45, 0x00]); // Bold OFF

  addText(formatTwoColumn('Metode Bayar', (order.payment_method || '-').toUpperCase()));
  addText(formatTwoColumn('Jumlah Bayar', `Rp ${Number(order.paid_amount || 0).toLocaleString('id-ID')}`));
  addText(formatTwoColumn('Status', (order.payment_status || '-').toUpperCase()));

  addText(doubleDivider);

  // 6. Footer Center
  addBytes([0x1B, 0x61, 0x01]); // Align Center
  addText('Terima Kasih Atas Pesanan Anda!\n');
  addText('Barang yang sudah dibeli dapat ditukar\n');
  addText('sesuai syarat retur resmi ALSYFA.\n');
  addText('www.alsyfa-snack.com\n\n');

  // 7. Feed lines & Cut
  addBytes([0x1B, 0x64, 0x04]); // Feed 4 lines
  addBytes([0x1D, 0x56, 0x42, 0x00]); // Paper Cut (GS V 66 0)

  return new Uint8Array(buffer);
}

/**
 * Send binary bytes to connected Bluetooth thermal printer in chunks
 */
export async function sendEscPosToBluetoothPrinter(uint8Bytes) {
  if (!activeCharacteristic) {
    throw new Error('Printer bluetooth belum terhubung. Silakan lakukan scan printer terlebih dahulu.');
  }

  const CHUNK_SIZE = 60; // Safe chunk size for BLE MTU
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let offset = 0; offset < uint8Bytes.length; offset += CHUNK_SIZE) {
    const slice = uint8Bytes.slice(offset, offset + CHUNK_SIZE);
    try {
      if (activeCharacteristic.writeValueWithoutResponse) {
        await activeCharacteristic.writeValueWithoutResponse(slice);
      } else {
        await activeCharacteristic.writeValue(slice);
      }
    } catch (e) {
      // Fallback
      await activeCharacteristic.writeValue(slice);
    }
    // Small pause between chunks to prevent printer buffer overflow
    await delay(25);
  }

  return true;
}

/**
 * Send ESC/POS to Android RawBT App via URL Scheme Intent
 */
export function openRawBtAppPrint(order, format = '58mm') {
  const bytes = buildEscPosBytes(order, format);
  // Convert Uint8Array to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  // Trigger RawBT intent scheme
  const rawBtUrl = `rawbt:base64,${base64}`;
  window.location.href = rawBtUrl;
}
