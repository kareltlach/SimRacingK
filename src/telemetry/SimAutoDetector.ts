import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { SUPPORTED_SIM_GAMES, SupportedGameMeta } from '../shared/supportedGames';

export interface ActiveSimInfo {
  game: SupportedGameMeta | null;
  isRunning: boolean;
  pid?: number;
  detectionSource: 'shared_memory' | 'process_scan' | 'mock';
}

export class SimAutoDetector extends EventEmitter {
  private static instance: SimAutoDetector | null = null;
  private timer: NodeJS.Timeout | null = null;
  private currentActive: ActiveSimInfo = {
    game: SUPPORTED_SIM_GAMES.acc,
    isRunning: false,
    detectionSource: 'process_scan'
  };

  private constructor() {
    super();
  }

  public static getInstance(): SimAutoDetector {
    if (!SimAutoDetector.instance) {
      SimAutoDetector.instance = new SimAutoDetector();
    }
    return SimAutoDetector.instance;
  }

  public startPolling(intervalMs = 2000): void {
    if (this.timer) return;
    this.poll();
    this.timer = setInterval(() => this.poll(), intervalMs);
  }

  public stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getActiveSim(): ActiveSimInfo {
    return this.currentActive;
  }

  private poll(): void {
    if (process.platform !== 'win32') {
      return;
    }

    // Fast tasklist check in Windows
    exec('tasklist /fo csv /nh', (err, stdout) => {
      if (err || !stdout) return;

      const lowerOutput = stdout.toLowerCase();
      let detected: SupportedGameMeta | null = null;

      for (const game of Object.values(SUPPORTED_SIM_GAMES)) {
        for (const proc of game.processNames) {
          if (lowerOutput.includes(proc.toLowerCase())) {
            detected = game;
            break;
          }
        }
        if (detected) break;
      }

      const wasRunning = this.currentActive.isRunning;
      const prevGameId = this.currentActive.game?.id;

      if (detected) {
        this.currentActive = {
          game: detected,
          isRunning: true,
          detectionSource: 'process_scan'
        };
      } else {
        // Fallback default: ACC
        this.currentActive = {
          game: this.currentActive.game || SUPPORTED_SIM_GAMES.acc,
          isRunning: false,
          detectionSource: 'shared_memory'
        };
      }

      if (wasRunning !== this.currentActive.isRunning || prevGameId !== this.currentActive.game?.id) {
        this.emit('sim-change', this.currentActive);
      }
    });
  }
}
export default SimAutoDetector;
