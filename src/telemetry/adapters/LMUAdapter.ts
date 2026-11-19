import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { MockAdapter } from './MockAdapter';

export class LMUAdapter extends BaseAdapter {
  public readonly gameId = GameId.LMU;
  private fallback: MockAdapter;

  constructor() {
    super();
    this.fallback = new MockAdapter();
    this.fallback.on('data', (d) => this.emitData(d));
  }

  public isAvailable(): boolean {
    return process.platform === 'win32';
  }

  public start(): void {
    this.setState('running');
    this.fallback.start();
  }

  public stop(): void {
    this.fallback.stop();
    this.setState('stopped');
  }
}
