import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { MockTelemetryEngine } from '../mock/MockTelemetryEngine';
import { UnifiedTelemetryData } from '../UnifiedTelemetrySchema';

export class MockAdapter extends BaseAdapter {
  public readonly gameId = GameId.AC;
  private engine: MockTelemetryEngine;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.engine = new MockTelemetryEngine();
  }

  public isAvailable(): boolean {
    return true;
  }

  public start(): void {
    if (this.intervalTimer) return;
    this.setState('running');

    // 60Hz tick
    this.intervalTimer = setInterval(() => {
      try {
        const frame = this.engine.tick();
        this.emitData(frame);
      } catch (err: any) {
        this.emit('error', err);
      }
    }, 16);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.setState('stopped');
  }
}
