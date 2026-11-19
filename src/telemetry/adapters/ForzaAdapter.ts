import dgram from 'dgram';
import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { UnifiedTelemetryData, createDefaultTelemetryData } from '../UnifiedTelemetrySchema';

export class ForzaAdapter extends BaseAdapter {
  public readonly gameId = GameId.FORZA;
  private socket: dgram.Socket | null = null;
  private readonly port: number;

  constructor(port = 5300) {
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
        const data = this.parseForzaPacket(msg);
        if (data) {
          this.emitData(data);
        }
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

  private parseForzaPacket(buffer: Buffer): UnifiedTelemetryData | null {
    // Sled: 232, Dash: 311, CarDash: 324
    if (buffer.length < 232) return null;

    const data = createDefaultTelemetryData();
    data.sessionInfo.gameId = this.gameId as any;

    // Check IsRaceOn (int32 at 0)
    const isRaceOn = buffer.readInt32LE(0);
    if (!isRaceOn) return null;

    data.timestamp = Date.now();
    data.rpm = buffer.readFloatLE(16);
    data.maxRpm = buffer.readFloatLE(8);
    data.gear = buffer.readUInt8(304);

    const speedMs = Math.sqrt(
      Math.pow(buffer.readFloatLE(32), 2) +
      Math.pow(buffer.readFloatLE(36), 2) +
      Math.pow(buffer.readFloatLE(40), 2)
    );
    data.speed = Math.round(speedMs * 3.6);

    data.throttle = buffer.readUInt8(301) / 255;
    data.brake = buffer.readUInt8(302) / 255;
    data.clutch = buffer.readUInt8(303) / 255;
    data.steeringAngle = buffer.readInt8(305) / 127;

    data.worldPosX = buffer.readFloatLE(232);
    data.worldPosY = buffer.readFloatLE(236);
    data.worldPosZ = buffer.readFloatLE(240);

    data.trackProgress = buffer.readFloatLE(292); // DistanceTraveled / approx
    data.lapTiming.currentLapTime = buffer.readFloatLE(284);
    data.lapTiming.bestLapTime = buffer.readFloatLE(288);
    data.lapTiming.lastLapTime = buffer.readFloatLE(280);
    data.lapTiming.lapNumber = buffer.readUInt16LE(300);

    return data;
  }
}
