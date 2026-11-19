// ─────────────────────────────────────────────────────────────────────────────
// TelemetryBus.ts – Central telemetry event hub operating at up to 60Hz
// ─────────────────────────────────────────────────────────────────────────────

import { EventEmitter } from 'events';
import { UnifiedTelemetryData, createDefaultTelemetryData } from './UnifiedTelemetrySchema';
import { BaseAdapter } from './adapters/BaseAdapter';
import { MockAdapter } from './adapters/MockAdapter';
import { ForzaAdapter } from './adapters/ForzaAdapter';
import { RallyAdapter } from './adapters/RallyAdapter';
import { LANRelayAdapter } from './adapters/LANRelayAdapter';
import { ACAdapter } from './adapters/ACAdapter';
import { ACCAdapter } from './adapters/ACCAdapter';
import { ACEvoAdapter } from './adapters/ACEvoAdapter';
import { LMUAdapter } from './adapters/LMUAdapter';

export interface TelemetryBusEvents {
  data: (data: UnifiedTelemetryData) => void;
  'lap-complete': (lapData: any) => void;
  'session-start': (session: any) => void;
  'session-end': (session: any) => void;
  status: (status: { running: boolean; activeGame: string | null; rate: number }) => void;
}

export class TelemetryBus extends EventEmitter {
  private static instance: TelemetryBus | null = null;
  private activeAdapter: BaseAdapter | null = null;
  private adapters: Map<string, BaseAdapter> = new Map();
  private running = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentRate = 0;
  private rateInterval: NodeJS.Timeout | null = null;
  private activeGameName: string | null = null;

  private constructor() {
    super();
    this.registerDefaultAdapters();
  }

  public static getInstance(): TelemetryBus {
    if (!TelemetryBus.instance) {
      TelemetryBus.instance = new TelemetryBus();
    }
    return TelemetryBus.instance;
  }

  private registerDefaultAdapters(): void {
    this.adapters.set('mock', new MockAdapter());
    this.adapters.set('forza', new ForzaAdapter());
    this.adapters.set('rally', new RallyAdapter());
    this.adapters.set('lan', new LANRelayAdapter());
    this.adapters.set('ac', new ACAdapter());
    this.adapters.set('acc', new ACCAdapter());
    this.adapters.set('acevo', new ACEvoAdapter());
    this.adapters.set('lmu', new LMUAdapter());
  }

  public start(gameId?: string): void {
    if (this.running) return;

    // Priority: if no gameId provided, check if ACC or AC is running in memory
    let targetKey = gameId?.toLowerCase();
    if (!targetKey) {
      if (process.platform === 'win32') {
        targetKey = 'acc'; // Default to ACC shared memory on Windows
      } else {
        targetKey = 'mock';
      }
    }

    let adapter = this.adapters.get(targetKey);
    if (!adapter) {
      adapter = this.adapters.get('acc') || this.adapters.get('mock')!;
    }

    this.activeAdapter = adapter;
    this.activeGameName = targetKey;
    this.running = true;

    this.activeAdapter.on('data', (data: UnifiedTelemetryData) => {
      this.frameCount++;
      this.emit('data', data);
    });

    this.activeAdapter.start();

    // Fallback: if no active sim process is emitting real data, emit realistic simulated frames
    // so every widget, gauge, chart, and LED animates seamlessly in preview mode!
    const mock = this.adapters.get('mock') as MockAdapter;
    if (targetKey !== 'mock' && mock) {
      mock.on('data', (data: UnifiedTelemetryData) => {
        // Only forward mock frames when no game frames have arrived recently
        if (Date.now() - this.lastFrameTime > 500) {
          (data as any).isMock = true;
          (data as any).trackName = '';
          (data as any).carName = '';
          data.sessionInfo.trackName = '';
          data.sessionInfo.carName = '';
          this.emit('data', data);
        }
      });
      mock.start();
    }

    this.activeAdapter.on('data', () => {
      this.lastFrameTime = Date.now();
    });

    this.rateInterval = setInterval(() => {
      this.currentRate = this.frameCount;
      this.frameCount = 0;
      this.emit('status', {
        running: this.running,
        activeGame: this.activeGameName,
        rate: this.currentRate,
      });
    }, 1000);
  }

  public stop(): void {
    if (!this.running) return;

    if (this.activeAdapter) {
      this.activeAdapter.removeAllListeners('data');
      this.activeAdapter.stop();
      this.activeAdapter = null;
    }

    const mock = this.adapters.get('mock') as MockAdapter;
    if (mock) {
      mock.removeAllListeners('data');
      mock.stop();
    }

    if (this.rateInterval) {
      clearInterval(this.rateInterval);
      this.rateInterval = null;
    }

    this.running = false;
    this.activeGameName = null;
    this.currentRate = 0;

    this.emit('status', {
      running: false,
      activeGame: null,
      rate: 0,
    });
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getActiveGame(): string | null {
    return this.activeGameName;
  }

  public getCurrentRate(): number {
    return this.currentRate;
  }
}
