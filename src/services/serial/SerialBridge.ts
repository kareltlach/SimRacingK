import { encodeSerialTelemetry } from './ArduinoProtocol';

export class SerialBridge {
  private isConnected = false;
  private portName: string | null = null;

  public async listPorts(): Promise<string[]> {
    return ['COM3 (Arduino Uno)', 'COM4 (ESP32-S3)'];
  }

  public async connect(port: string, _baudRate = 115200): Promise<void> {
    this.portName = port;
    this.isConnected = true;
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    this.portName = null;
  }

  public sendTelemetry(rpm: number, maxRpm: number, gear: number, speed: number, abs: boolean, tc: boolean): void {
    if (!this.isConnected) return;
    const _buffer = encodeSerialTelemetry(rpm, maxRpm, gear, speed, abs, tc);
  }

  public isPortConnected(): boolean {
    return this.isConnected;
  }
}
