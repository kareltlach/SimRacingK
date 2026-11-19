import { UnifiedTelemetryData } from '../UnifiedTelemetrySchema';
import { LapSplitter } from './LapSplitter';

export class SessionRecorder {
  private samplesBuffer: UnifiedTelemetryData[] = [];
  private isRecording = false;
  private splitter: LapSplitter;
  private currentLapIndex = 1;

  constructor() {
    this.splitter = new LapSplitter();
    this.splitter.on('lap-complete', (info) => {
      this.currentLapIndex++;
      this.samplesBuffer = [];
    });
  }

  public start(): void {
    this.isRecording = true;
    this.samplesBuffer = [];
  }

  public stop(): void {
    this.isRecording = false;
    this.samplesBuffer = [];
  }

  public recordFrame(data: UnifiedTelemetryData): void {
    if (!this.isRecording) return;
    this.samplesBuffer.push(data);
    this.splitter.update(data);
  }

  public getSamples(): UnifiedTelemetryData[] {
    return this.samplesBuffer;
  }
}
