/**
 * Web Bluetooth API implementation for Thermal Printers (ESC/POS)
 * Note: Web Bluetooth is only supported on Chrome, Edge, Opera, Android Chrome/Samsung Internet.
 * Not supported on iOS or Firefox/Safari desktop.
 *
 * Auto-print: setelah pertama kali pairing, nama printer disimpan di localStorage.
 * Print berikutnya pakai navigator.bluetooth.getDevices() (device yg sudah di-grant)
 * -> langsung connect tanpa dialog pemilihan.
 */
const SAVED_PRINTER_KEY = 'app_printer_name';

export function getSavedPrinterName() {
    try { return localStorage.getItem(SAVED_PRINTER_KEY); } catch { return null; }
}
export function savePrinterName(name) {
    try { if (name) localStorage.setItem(SAVED_PRINTER_KEY, name); } catch {}
}
export function clearSavedPrinter() {
    try { localStorage.removeItem(SAVED_PRINTER_KEY); } catch {}
}

/**
 * True jika printer sudah pernah di-pairing (nama tersimpan di localStorage).
 * Dipakai UI untuk menampilkan badge "Auto-Print Aktif".
 */
export function isPrinterPaired() {
    return !!getSavedPrinterName();
}

async function connectToDevice(device) {
    const server = await device.gatt.connect();
    let targetCharacteristic = null;
    const services = await server.getPrimaryServices();
    for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
                targetCharacteristic = char;
                break;
            }
        }
        if (targetCharacteristic) break;
    }
    if (!targetCharacteristic) {
        throw new Error('Tidak dapat menemukan service printer bluetooth yang bisa ditulis (writable).');
    }
    return targetCharacteristic;
}

const PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '0000ae30-0000-1000-8000-00805f9b34fb',
    '0000af30-0000-1000-8000-00805f9b34fb',
    '00001101-0000-1000-8000-00805f9b34fb',
    '0000180a-0000-1000-8000-00805f9b34fb'
];

export async function connectAndPrint(printData) {
    try {
        if (!navigator.bluetooth) {
            throw new Error('Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome atau Edge.');
        }

        let device = null;
        const savedName = getSavedPrinterName();

        // Coba device yg sudah pernah di-pairing (tanpa dialog)
        if (savedName && navigator.bluetooth.getDevices) {
            try {
                const devices = await navigator.bluetooth.getDevices();
                device = devices.find(d => d.name === savedName) || null;
            } catch { device = null; }
        }

        // Fallback: pilih manual (dialog) — lalu simpan namanya
        if (!device) {
            device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: PRINTER_SERVICES,
            });
            if (device && device.name) savePrinterName(device.name);
        }

        const targetCharacteristic = await connectToDevice(device);
        const sendChunks = async (data) => {
            const CHUNK_SIZE = 512;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                await targetCharacteristic.writeValue(new Uint8Array(chunk));
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        };
        await sendChunks(printData);
        device.gatt.disconnect();
        return { success: true, auto: !!savedName };
    } catch (error) {
        // Jika user batal pilih / device hilang, bersihkan cache agar next pilih ulang
        if (error && (error.name === 'NotFoundError' || error.message?.includes('User cancelled'))) {
            clearSavedPrinter();
        }
        console.error('Print error:', error);
        throw new Error('Gagal mencetak: ' + error.message);
    }
}

/**
 * Helper to build an ESC/POS receipt string buffer from order details
 */
export function buildReceiptBuffer(order, items, total, companyName = 'MY BUSINESS', address = 'Your address here') {
    const ESC = 0x1B;
    const GS = 0x1D;

    const commands = [];

    // Helpers
    const text = (str) => commands.push(...new TextEncoder().encode(str));
    const newline = () => text('\n');
    const boldOn = () => commands.push(ESC, 0x45, 1);
    const boldOff = () => commands.push(ESC, 0x45, 0);
    const centerAlign = () => commands.push(ESC, 0x61, 1);
    const leftAlign = () => commands.push(ESC, 0x61, 0);
    const rightAlign = () => commands.push(ESC, 0x61, 2);

    const padRight = (str, len) => str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
    const padLeft = (str, len) => str.length >= len ? str.substring(0, len) : ' '.repeat(len - str.length) + str;

    // Initialize printer
    commands.push(ESC, 0x40);

    // Header
    centerAlign();
    boldOn();
    text(companyName);
    newline();
    boldOff();
    text(companyName);
    newline();
    text(address);
    newline();
    
    text('--------------------------------');
    newline();

    // Meta Data
    leftAlign();
    
    let orderDate = order.date ? new Date(order.date) : new Date();
    let dateStr = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`;
    let timeStr = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
    
    text(`Tgl: ${dateStr}`);
    newline();
    
    let cashierStr = `Kasir: ${order.cashierName || 'System'}`;
    text(`${padRight(timeStr, 32 - cashierStr.length)}${cashierStr}`);
    newline();
    
    let idStr = `ID : #ORD-${(order.id || '').substring(0, 5).toUpperCase()}`;
    let typeStr = `Tipe : ${order.orderType || 'DINE IN'}`;
    if (idStr.length + typeStr.length <= 32) {
        text(`${padRight(idStr, 32 - typeStr.length)}${typeStr}`);
    } else {
        text(idStr); newline();
        text(typeStr);
    }
    newline();
    
    let tamuStr = `Tamu: ${order.customerName || 'Walk-in'}`;
    if (order.tableNumber) tamuStr += ` | Meja: ${order.tableNumber}`;
    text(tamuStr.substring(0, 32));
    newline();
    
    text('--------------------------------');
    newline();

    // Items Header
    text(padRight('Menu', 22) + padLeft('Qty', 3) + padLeft('Total', 7));
    newline();
    
    items.forEach(item => {
        let name = item.name.substring(0, 22);
        let qty = item.quantity.toString();
        let subtotal = (item.quantity * item.price).toLocaleString('id-ID');
        
        text(padRight(name, 22) + padLeft(qty, 3) + padLeft(subtotal, 7));
        newline();
        
        if (item.notes) {
            text(`  *${item.notes.substring(0, 28)}`);
            newline();
        }
    });

    text('--------------------------------');
    newline();

    // Totals
    let subtotalStr = total.toLocaleString('id-ID');
    text(padRight('Subtotal', 32 - subtotalStr.length) + subtotalStr);
    newline();
    text('--------------------------------');
    newline();

    boldOn();
    let grandTotalStr = `Rp ${subtotalStr}`;
    text(padRight('TOTAL', 32 - grandTotalStr.length) + grandTotalStr);
    newline();
    boldOff();
    
    let rawStatus = order.paymentStatus || order.payment_status || 'unpaid';
    let isPaid = String(rawStatus).toLowerCase() === 'paid' || String(rawStatus).toLowerCase() === 'lunas' || String(rawStatus).toLowerCase() === 'success';
    let statusStr = isPaid ? 'LUNAS' : 'BELUM LUNAS';
    text(padRight('Status Bayar', 32 - statusStr.length) + statusStr);
    newline();
    
    text('--------------------------------');
    newline();

    // Footer
    centerAlign();
    text('Terima Kasih Atas Kunjungan Anda!');
    newline();
    text('Silakan tinggalkan ulasan di');
    newline();
    text('website kami.');
    newline();
    newline();
    newline();
    newline(); // Extra spaces for tear-off

    commands.push(0x0A, 0x0A, 0x0A); // 3 blank lines
    commands.push(GS, 0x56, 0x41, 0x00); // Partial cut

    return commands;
}
