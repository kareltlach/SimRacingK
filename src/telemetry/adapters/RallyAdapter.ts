import dgram from 'dgram';
import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { UnifiedTelemetryData, createDefaultTelemetryData } from '../UnifiedTelemetrySchema';

export class RallyAdapter extends BaseAdapter {
  public readonly gameId = GameId.RALLY;
  private socket: dgram.Socket | null = null;
  private readonly port: number;

  constructor(port = 20777) {
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
        const data = this.parseCodemastersPacket(msg);
        if (data) this.emitData(data);
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

  private parseCodemastersPacket(buffer: Buffer): UnifiedTelemetryData | null {
    if (buffer.length < 64) return null;

    const data = createDefaultTelemetryData();
    data.sessionInfo.gameId = this.gameId as any;
    data.timestamp = Date.now();

    // Codemasters DiRT/WRC UDP packet format
    data.lapTiming.currentLapTime = buffer.readFloatLE(0);
    data.trackProgress = buffer.readFloatLE(4);
    data.speed = Math.round(buffer.readFloatLE(28) * 3.6); // m/s to km/h

    data.worldPosX = buffer.readFloatLE(16);
    data.worldPosY = buffer.readFloatLE(20);
    data.worldPosZ = buffer.readFloatLE(24);

    if (buffer.length >= 128) {
      data.throttle = buffer.readFloatLE(116);
      data.steeringAngle = buffer.readFloatLE(120);
      data.brake = buffer.readFloatLE(124);
      data.clutch = buffer.readFloatLE(128);
      data.gear = Math.round(buffer.readFloatLE(132));
      data.gForceX = buffer.readFloatLE(136);
      data.gForceY = buffer.readFloatLE(140);
      data.rpm = buffer.readFloatLE(148) * 10;
      data.maxRpm = 8500;
    }

    return data;
  }
}
