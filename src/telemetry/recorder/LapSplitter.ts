import { EventEmitter } from 'events';
import { UnifiedTelemetryData } from '../UnifiedTelemetrySchema';

export class LapSplitter extends EventEmitter {
  private lastProgress = 0;
  private currentLapNumber = 1;

  public update(frame: UnifiedTelemetryData): void {
    const progress = frame.trackProgress;

    // Detect trackProgress rollover: from ~0.95+ to <0.05
    if (this.lastProgress > 0.90 && progress < 0.10) {
      this.emit('lap-complete', {
        lapNumber: this.currentLapNumber,
        lapTime: frame.lapTiming.lastLapTime || frame.lapTiming.currentLapTime,
      });
      this.currentLapNumber++;
    }

    this.lastProgress = progress;
  }
}
