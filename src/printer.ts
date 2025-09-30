import net from 'node:net';
import EscPosEncoder from 'esc-pos-encoder';

const HOST = process.env.PRINTER_HOST || '192.168.1.232'; // The IP address of the printer
const PORT = Number(process.env.PRINTER_PORT) || 9100;
console.log(`[🧾 THERMAL] Printer will connect to ${HOST}:${PORT}`);

declare const globalThis: {
  printerClientGlobal: ReturnType<typeof printerClientSingleton>;
  printerConnected: boolean;
} & typeof global;

const printerClientSingleton = () => {
  console.log('[🧾 THERMAL] Creating new socket...');
  return new net.Socket();
};

// This singleton pattern is used to ensure that the client is only created once and reused across hot reloads in Next.js
export const socket = globalThis.printerClientGlobal ?? printerClientSingleton();
globalThis.printerClientGlobal = socket;

if (!globalThis.printerConnected) {
  console.log('[🧾 THERMAL] Connecting to printer for the first time');

  // Set a connection timeout of 5 seconds
  socket.setTimeout(5000);

  socket.connect(PORT, HOST, () => {
    globalThis.printerConnected = true;
    console.log('[🧾 THERMAL] Connected to printer');
    socket.setTimeout(0); // Disable timeout after successful connection
  });
}

socket.on('error', (err) => {
  console.error('[🧦 SOCKET] Error on socket:', err);
  process.exit(1);
});

socket.on('close', () => {
  console.log('[🧦 SOCKET] Disconnected from printer');
});

socket.on('timeout', () => {
  console.error('[🧦 SOCKET] Connection timeout - could not connect to printer');
  socket.destroy();
  process.exit(1);
});

socket.on('data', (data) => {
  console.log('[🧦 SOCKET] Received:', data.toString('hex'));
});

const socketEvents = [
  'close',
  'connectionAttempt',
  'connectionAttemptFailed',
  'connectionAttemptTimeout',
  'drain',
  'end',
  'lookup',
  'connect',
  'ready',
  'timeout',
];

socketEvents.forEach((event) => {
  socket.on(event, (data) => {
    console.log('[🧦 SOCKET] Event:', event);
  });
});

export const encoder = new EscPosEncoder();
