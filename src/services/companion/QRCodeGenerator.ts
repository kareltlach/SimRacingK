import QRCode from 'qrcode';
import os from 'os';

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export async function generateCompanionQRCode(port = 8777): Promise<{ url: string; qrDataUrl: string }> {
  const ip = getLocalIpAddress();
  const url = `http://${ip}:${port}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 2,
    color: {
      dark: '#ffffff',
      light: '#0a0a0f',
    },
    width: 256,
  });
  return { url, qrDataUrl };
}
