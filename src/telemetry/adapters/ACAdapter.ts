import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { ACCAdapter } from './ACCAdapter';

export class ACAdapter extends BaseAdapter {
  public readonly gameId = GameId.AC;
  private accBridge: ACCAdapter;

  constructor() {
    super();
    this.accBridge = new ACCAdapter();
    this.accBridge.on('data', (d) => this.emitData(d));
  }

  public isAvailable(): boolean {
    return process.platform === 'win32';
  }

  public start(): void {
    this.setState('running');
    this.accBridge.start();
  }

  public stop(): void {
    this.accBridge.stop();
    this.setState('stopped');
  }
}
