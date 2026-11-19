import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getLocalIpAddress, generateCompanionQRCode } from './QRCodeGenerator';

interface ConnectedClient {
  socket: any;
}

export class CompanionServer {
  private server: http.Server | null = null;
  private port = 8777;
  private running = false;
  private clients: Set<ConnectedClient> = new Set();

  public async start(port = 8777): Promise<void> {
    if (this.running) return;
    this.port = port;

    const webappPath = path.join(__dirname, 'webapp');

    this.server = http.createServer((req, res) => {
      const url = req.url || '/';

      if (url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            running: true,
            port: this.port,
            ip: getLocalIpAddress(),
            connectedClients: this.clients.size,
          })
        );
        return;
      }

      // Serve static files
      let filePath = path.join(webappPath, url === '/' ? 'index.html' : url);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg': 'image/svg+xml',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    // Native lightweight WebSocket upgrade handling (RFC 6455)
    this.server.on('upgrade', (req, socket) => {
      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }

      const acceptKey = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

      const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
      ];

      socket.write(headers.join('\r\n') + '\r\n\r\n');

      const client: ConnectedClient = { socket };
      this.clients.add(client);

      socket.on('close', () => {
        this.clients.delete(client);
      });

      socket.on('error', () => {
        this.clients.delete(client);
      });
    });

    await new Promise<void>((resolve) => {
      this.server!.listen(this.port, '0.0.0.0', () => {
        this.running = true;
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.running) return;

    for (const client of this.clients) {
      try {
        client.socket.destroy();
      } catch {}
    }
    this.clients.clear();

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }

    this.running = false;
  }

  public broadcast(data: any): void {
    if (!this.running || this.clients.size === 0) return;
    const jsonStr = JSON.stringify(data);
    const payload = Buffer.from(jsonStr, 'utf-8');

    // Build unmasked WebSocket text frame
    const len = payload.length;
    let header: Buffer;

    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode
      header[1] = len;
    } else if (len <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }

    const packet = Buffer.concat([header, payload]);

    for (const client of this.clients) {
      try {
        client.socket.write(packet);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getPort(): number {
    return this.port;
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getUrl(): string {
    return `http://${getLocalIpAddress()}:${this.port}`;
  }

  public async generateQRCode(): Promise<string> {
    const res = await generateCompanionQRCode(this.port);
    return res.qrDataUrl;
  }
}
export default CompanionServer;
