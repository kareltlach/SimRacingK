import dgram from 'dgram';
import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { UnifiedTelemetryData } from '../UnifiedTelemetrySchema';

export class LANRelayAdapter extends BaseAdapter {
  public readonly gameId = GameId.AC;
  private socket: dgram.Socket | null = null;
  private readonly port: number;

  constructor(port = 9999) {
    super();
    this.port = port;
  }

  public isAvailable(): boolean {
    return true;
  }

  public start(): void {
    if (this.socket) return;
    this.setState('starting');

    this.socket = dgram.createSocket('udp4');
    this.socket.on('error', (err) => {
      this.emit('error', err);
      this.setState('error');
    });

    this.socket.on('message', (msg: Buffer) => {
      try {
        const json = JSON.parse(msg.toString('utf-8'));
        this.emitData(json as UnifiedTelemetryData);
      } catch (err: any) {
        this.emit('error', err);
      }
    });

    this.socket.bind(this.port, () => {
      this.setState('running');
    });
  }

  public stop(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setState('stopped');
  }
}
