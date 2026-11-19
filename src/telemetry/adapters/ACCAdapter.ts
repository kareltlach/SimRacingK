/**
 * ACC & Assetto Corsa Shared Memory Bridge via Node native UDP loopback
 * Starts a background Python 60Hz reader for:
 *   - Local\acpmf_physics  (rpm, speed, gas, brake, steer, gear, tyre temps, pressures, brake temps, tc, abs)
 *   - Local\acpmf_graphics (status, normalizedCarPosition, carCoordinates)
 *   - Local\acpmf_static   (carModel, track, maxRpm, maxFuel)
 * and streams parsed JSON to localhost UDP on port 9996.
 *
 * Also connects to ACC Broadcasting UDP API (port 9000) for competitor list & realtime standings.
 */

import dgram from 'dgram';
import { spawn, ChildProcess } from 'child_process';
import { BaseAdapter } from './BaseAdapter';
import { GameId } from '../../shared/types';
import { UnifiedTelemetryData, createDefaultTelemetryData } from '../UnifiedTelemetrySchema';

// ── ACC Broadcasting Protocol Constants ──
const BROADCASTING_PROTOCOL_VERSION = 4;
const BROADCASTING_REGISTER = 1;
const BROADCASTING_UNREGISTER = 9;
const BROADCASTING_REQUEST_ENTRY_LIST = 10;
const BROADCASTING_REQUEST_TRACK_DATA = 11;

const INBOUND_REGISTRATION_RESULT = 1;
const INBOUND_REALTIME_UPDATE = 2;
const INBOUND_REALTIME_CAR_UPDATE = 3;
const INBOUND_ENTRY_LIST = 4;
const INBOUND_BROADCASTING_EVENT = 5;
const INBOUND_ENTRY_LIST_CAR = 6;
const INBOUND_TRACK_DATA = 7;

interface CompetitorEntry {
  carIndex: number;
  driverName: string;
  carModel: string;
  raceNumber: number;
  position: number;
  cupPosition: number;
  splinePosition: number;
  laps: number;
  bestLapMs: number;
  lastLapMs: number;
  delta: number;
  location: string;
  classColor: string;
  isPlayer: boolean;
}

export class ACCAdapter extends BaseAdapter {
  public readonly gameId = GameId.ACC;
  private socket: dgram.Socket | null = null;
  private pythonProcess: ChildProcess | null = null;
  private readonly port = 9996;

  // ── Broadcasting state ──
  private broadcastSocket: dgram.Socket | null = null;
  private readonly broadcastPort = 9000;
  private readonly broadcastPassword = 'asd';
  private broadcastConnectionId = -1;
  private broadcastConnected = false;
  private broadcastRetryTimer: NodeJS.Timeout | null = null;
  private entryMap: Map<number, { driverName: string; carModel: string; raceNumber: number; classColor: string }> = new Map();
  private carRealtimeMap: Map<number, {
    position: number;
    cupPosition: number;
    splinePosition: number;
    laps: number;
    bestLapMs: number;
    lastLapMs: number;
    location: string;
    worldPosX?: number;
    worldPosY?: number;
    yaw?: number;
  }> = new Map();
  private playerCarIndex = -1;
  private competitors: CompetitorEntry[] = [];

  public isAvailable(): boolean {
    return process.platform === 'win32';
  }

  public start(): void {
    if (this.socket) return;
    this.setState('starting');

    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', (msg) => {
      try {
        const payload = JSON.parse(msg.toString('utf-8'));
        const frame = this.mapAccDataToUnified(payload);
        this.emitData(frame);
      } catch (err: any) {
        // silent parse error
      }
    });

    this.socket.bind(this.port, '127.0.0.1', () => {
      this.setState('running');
      this.spawnPythonReader();
      this.startBroadcastClient();
    });
  }

  public stop(): void {
    if (this.pythonProcess) {
      try {
        this.pythonProcess.kill();
      } catch {}
      this.pythonProcess = null;
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }

    this.stopBroadcastClient();
    this.setState('stopped');
  }

  // ══════════════════════════════════════════════════════════════════
  //  Broadcasting UDP Client — Real ACC Competitors & Standings
  // ══════════════════════════════════════════════════════════════════

  private startBroadcastClient(): void {
    try {
      this.broadcastSocket = dgram.createSocket('udp4');

      this.broadcastSocket.on('message', (msg) => {
        try {
          this.parseBroadcastMessage(msg);
        } catch {}
      });

      this.broadcastSocket.on('error', () => {
        // Handled silently
      });

      this.broadcastSocket.bind(0, '127.0.0.1', () => {
        this.sendBroadcastRegister();
      });

      // Poll registration until connected
      this.broadcastRetryTimer = setInterval(() => {
        if (!this.broadcastConnected) {
          this.sendBroadcastRegister();
        }
      }, 3000);
    } catch {}
  }

  private stopBroadcastClient(): void {
    if (this.broadcastRetryTimer) {
      clearInterval(this.broadcastRetryTimer);
      this.broadcastRetryTimer = null;
    }
    if (this.broadcastSocket) {
      if (this.broadcastConnected && this.broadcastConnectionId >= 0) {
        try {
          const buf = Buffer.alloc(5);
          buf.writeUInt8(BROADCASTING_UNREGISTER, 0);
          buf.writeInt32LE(this.broadcastConnectionId, 1);
          this.broadcastSocket.send(buf, 0, buf.length, this.broadcastPort, '127.0.0.1');
        } catch {}
      }
      try {
        this.broadcastSocket.close();
      } catch {}
      this.broadcastSocket = null;
    }
    this.broadcastConnected = false;
    this.broadcastConnectionId = -1;
  }

  private sendBroadcastRegister(): void {
    if (!this.broadcastSocket) return;
    try {
      // ACC Registration Packet (SDK spec):
      // byte 0: messageType = 1
      // byte 1: protocolVersion = 4
      // string (utf-8): displayName
      // string (utf-8): connectionPassword
      // int32: msRealtimeUpdateInterval
      // string (utf-8): commandPassword
      const parts: Buffer[] = [];
      parts.push(Buffer.from([BROADCASTING_REGISTER, BROADCASTING_PROTOCOL_VERSION]));
      parts.push(this.writeUtf8String('ApexTelemetry'));
      parts.push(this.writeUtf8String(this.broadcastPassword));
      const intervalBuf = Buffer.alloc(4);
      intervalBuf.writeInt32LE(250, 0);
      parts.push(intervalBuf);
      parts.push(this.writeUtf8String(''));

      const packet = Buffer.concat(parts);
      this.broadcastSocket.send(packet, 0, packet.length, this.broadcastPort, '127.0.0.1');
    } catch {}
  }

  private parseBroadcastMessage(buf: Buffer): void {
    if (buf.length < 1) return;
    const msgType = buf.readUInt8(0);
    let offset = 1;

    switch (msgType) {
      case INBOUND_REGISTRATION_RESULT: {
        if (buf.length < 5) return;
        const connId = buf.readInt32LE(offset); offset += 4;
        if (connId >= 0) {
          this.broadcastConnectionId = connId;
          this.broadcastConnected = true;
          this.sendRequestEntryList();
          this.sendRequestTrackData();
        }
        break;
      }

      case INBOUND_ENTRY_LIST: {
        if (buf.length < offset + 6) return;
        this.broadcastConnectionId = buf.readInt32LE(offset); offset += 4;
        const carCount = buf.readUInt16LE(offset); offset += 2;
        for (let i = 0; i < carCount && offset + 2 <= buf.length; i++) {
          const carIdx = buf.readUInt16LE(offset); offset += 2;
          if (!this.entryMap.has(carIdx)) {
            this.entryMap.set(carIdx, { driverName: '', carModel: '', raceNumber: 0, classColor: '#888' });
          }
        }
        break;
      }

      case INBOUND_ENTRY_LIST_CAR: {
        try {
          if (buf.length < offset + 3) return;
          const carIdx = buf.readUInt16LE(offset); offset += 2;
          const modelType = buf.readUInt8(offset); offset += 1;
          const teamRes = this.readUtf8String(buf, offset); offset = teamRes.offset;
          if (offset + 4 > buf.length) return;
          const raceNumber = buf.readInt32LE(offset); offset += 4;
          if (offset + 2 > buf.length) return;
          const cupCategory = buf.readUInt8(offset); offset += 1;
          const currentDriverIdx = buf.readUInt8(offset); offset += 1;
          if (offset + 2 > buf.length) return;
          const nationality = buf.readUInt16LE(offset); offset += 2; // Nationality is uint16 (2 bytes)

          if (offset + 1 > buf.length) return;
          const driverCount = buf.readUInt8(offset); offset += 1;
          let firstName = '';
          let lastName = '';

          for (let d = 0; d < driverCount && offset < buf.length; d++) {
            const fnRes = this.readUtf8String(buf, offset); offset = fnRes.offset;
            const lnRes = this.readUtf8String(buf, offset); offset = lnRes.offset;
            const snRes = this.readUtf8String(buf, offset); offset = snRes.offset;
            if (offset < buf.length) offset += 1; // driverCategory (byte)
            if (offset + 2 <= buf.length) offset += 2; // driverNationality (ushort)

            if (d === currentDriverIdx || d === 0) {
              firstName = fnRes.value;
              lastName = lnRes.value;
            }
          }

          const displayName = firstName && lastName
            ? `${firstName.charAt(0)}. ${lastName}`
            : firstName || lastName || `Car #${raceNumber}`;

          const classColors = ['#e11d48', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#06b6d4', '#f43f5e'];
          const classColor = classColors[cupCategory % classColors.length];
          const carModelName = this.getCarModelName(modelType);

          this.entryMap.set(carIdx, {
            driverName: displayName,
            carModel: carModelName,
            raceNumber,
            classColor,
          });
          this.rebuildCompetitors();
        } catch {}
        break;
      }

      case INBOUND_REALTIME_CAR_UPDATE: {
        try {
          if (buf.length < offset + 30) return;
          const carIdx = buf.readUInt16LE(offset); offset += 2;
          const driverIdx = buf.readUInt16LE(offset); offset += 2; // driverIdx is ushort in SDK!
          const gear = buf.readUInt8(offset); offset += 1;
          const worldPosX = buf.readFloatLE(offset); offset += 4;
          const worldPosY = buf.readFloatLE(offset); offset += 4;
          const yaw = buf.readFloatLE(offset); offset += 4;
          const carLocation = buf.readUInt8(offset); offset += 1;
          const speedKmh = buf.readUInt16LE(offset); offset += 2;
          const position = buf.readUInt16LE(offset); offset += 2;
          const cupPosition = buf.readUInt16LE(offset); offset += 2;
          const splinePosition = buf.readFloatLE(offset); offset += 4;
          const laps = buf.readUInt16LE(offset); offset += 2;
          const delta = buf.readInt32LE(offset); offset += 4;
          const bestSessionLapMs = buf.readInt32LE(offset); offset += 4;
          offset += 12; // 3 splits
          const currentLapMs = buf.readInt32LE(offset); offset += 4;
          const lastLapMs = buf.readInt32LE(offset); offset += 4;

          const locationStr = carLocation === 1 ? 'TRACK'
            : (carLocation === 2 || carLocation === 3 || carLocation === 4) ? 'PIT'
            : 'TRACK';

          this.carRealtimeMap.set(carIdx, {
            position,
            cupPosition,
            splinePosition,
            laps,
            bestLapMs: bestSessionLapMs,
            lastLapMs,
            location: locationStr,
            worldPosX,
            worldPosY,
            yaw,
          });

          this.rebuildCompetitors();
        } catch {}
        break;
      }

      case INBOUND_REALTIME_UPDATE: {
        try {
          // sessionTime (4), sessionRemaining (4), focusedCarIndex (4)
          if (buf.length >= offset + 16) {
            offset += 2 + 2 + 1 + 1 + 4 + 4; // event, session, sessionType, phase, sessionTime, sessionRemainingTime
            if (offset + 4 <= buf.length) {
              this.playerCarIndex = buf.readInt32LE(offset);
            }
          }
          if (this.broadcastConnected && this.entryMap.size === 0) {
            this.sendRequestEntryList();
          }
        } catch {}
        break;
      }
    }
  }

  private rebuildCompetitors(): void {
    const result: CompetitorEntry[] = [];
    const playerRt = this.carRealtimeMap.get(this.playerCarIndex);
    const playerSpline = playerRt?.splinePosition ?? 0;

    for (const [carIdx, rt] of this.carRealtimeMap) {
      const entry = this.entryMap.get(carIdx) || {
        driverName: `Car #${carIdx}`,
        carModel: 'GT3',
        raceNumber: carIdx,
        classColor: '#3b82f6',
      };

      let splineDiff = rt.splinePosition - playerSpline;
      if (splineDiff > 0.5) splineDiff -= 1.0;
      if (splineDiff < -0.5) splineDiff += 1.0;

      const avgLapTimeMs = playerRt?.bestLapMs && playerRt.bestLapMs > 0
        ? playerRt.bestLapMs
        : 90000;
      const deltaSeconds = splineDiff * (avgLapTimeMs / 1000);

      result.push({
        carIndex: carIdx,
        driverName: entry.driverName,
        carModel: entry.carModel,
        raceNumber: entry.raceNumber,
        position: rt.position,
        cupPosition: rt.cupPosition,
        splinePosition: rt.splinePosition,
        laps: rt.laps,
        bestLapMs: rt.bestLapMs,
        lastLapMs: rt.lastLapMs,
        delta: carIdx === this.playerCarIndex ? 0 : parseFloat(deltaSeconds.toFixed(1)),
        location: rt.location,
        classColor: entry.classColor,
        isPlayer: carIdx === this.playerCarIndex,
      });
    }

    result.sort((a, b) => a.position - b.position);
    this.competitors = result;
  }

  private sendRequestEntryList(): void {
    if (!this.broadcastSocket || !this.broadcastConnected || this.broadcastConnectionId < 0) return;
    try {
      const buf = Buffer.alloc(5);
      buf.writeUInt8(BROADCASTING_REQUEST_ENTRY_LIST, 0);
      buf.writeInt32LE(this.broadcastConnectionId, 1);
      this.broadcastSocket.send(buf, 0, buf.length, this.broadcastPort, '127.0.0.1');
    } catch {}
  }

  private sendRequestTrackData(): void {
    if (!this.broadcastSocket || !this.broadcastConnected || this.broadcastConnectionId < 0) return;
    try {
      const buf = Buffer.alloc(5);
      buf.writeUInt8(BROADCASTING_REQUEST_TRACK_DATA, 0);
      buf.writeInt32LE(this.broadcastConnectionId, 1);
      this.broadcastSocket.send(buf, 0, buf.length, this.broadcastPort, '127.0.0.1');
    } catch {}
  }

  private writeUtf8String(str: string): Buffer {
    const encoded = Buffer.from(str, 'utf-8');
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(encoded.length, 0);
    return Buffer.concat([lenBuf, encoded]);
  }

  private readUtf8String(buf: Buffer, offset: number): { value: string; offset: number } {
    if (offset + 2 > buf.length) return { value: '', offset: buf.length };
    const len = buf.readUInt16LE(offset); offset += 2;
    if (offset + len > buf.length) return { value: '', offset: buf.length };
    const value = buf.slice(offset, offset + len).toString('utf-8');
    return { value, offset: offset + len };
  }

  private getCarModelName(modelType: number): string {
    const models: Record<number, string> = {
      0: 'Porsche 991 GT3 R', 1: 'Mercedes-AMG GT3', 2: 'Ferrari 488 GT3',
      3: 'Audi R8 LMS', 4: 'Lamborghini Huracán GT3', 5: 'McLaren 650S GT3',
      6: 'Nissan GT-R Nismo GT3', 7: 'BMW M6 GT3', 8: 'Bentley Continental GT3',
      9: 'Porsche 991.II GT3 Cup', 10: 'Nissan GT-R Nismo GT3 2018',
      11: 'Bentley Continental GT3 2018', 12: 'AMR V12 Vantage GT3',
      13: 'Lamborghini Reiter R-EX GT3', 14: 'Jaguar G3', 15: 'Lexus RC F GT3',
      16: 'Lamborghini Huracán GT3 Evo', 17: 'Honda NSX GT3',
      18: 'Lamborghini Super Trofeo', 19: 'Audi R8 LMS Evo',
      20: 'AMR V8 Vantage', 21: 'Honda NSX GT3 Evo', 22: 'McLaren 720S GT3',
      23: 'Porsche 911.II GT3 R', 24: 'Ferrari 488 GT3 Evo',
      25: 'Mercedes-AMG GT3 Evo', 30: 'BMW M4 GT3', 31: 'Audi R8 LMS Evo II',
      32: 'Ferrari 296 GT3', 33: 'Lamborghini Huracán GT3 Evo 2',
      34: 'Porsche 992 GT3 R', 35: 'McLaren 720S GT3 Evo',
      50: 'Alpine A110 GT4', 51: 'AMR V8 Vantage GT4', 52: 'Audi R8 LMS GT4',
      53: 'BMW M4 GT4', 55: 'Chevrolet Camaro GT4', 56: 'Ginetta G55 GT4',
      57: 'KTM X-Bow GT4', 58: 'Maserati MC GT4', 59: 'McLaren 570S GT4',
      60: 'Mercedes-AMG GT4', 61: 'Porsche 718 Cayman GT4',
    };
    return models[modelType] || `GT3 Car #${modelType}`;
  }

  // ══════════════════════════════════════════════════════════════════
  //  Python Shared Memory Reader (access=mmap.ACCESS_READ)
  // ══════════════════════════════════════════════════════════════════

  private spawnPythonReader(): void {
    const script = `
import mmap
import struct
import socket
import json
import time
import ctypes

kernel32 = ctypes.windll.kernel32
FILE_MAP_READ = 0x0004

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
target = ('127.0.0.1', ${this.port})

phys_shm = None
gfx_shm = None
stat_shm = None

def can_open(name):
    h = kernel32.OpenFileMappingW(FILE_MAP_READ, False, name)
    if h != 0:
        kernel32.CloseHandle(h)
        return True
    return False

while True:
    try:
        # STRICT SAFETY GUARD: NEVER create the shared memory mapping if ACC has not created it yet!
        # Creating it before ACC causes ACC (Unreal Engine 4) to crash with EXCEPTION_ACCESS_VIOLATION.
        if not phys_shm and can_open('Local\\\\acpmf_physics'):
            try: phys_shm = mmap.mmap(0, 712, 'Local\\\\acpmf_physics', access=mmap.ACCESS_READ)
            except: pass
        if not gfx_shm and can_open('Local\\\\acpmf_graphics'):
            try: gfx_shm = mmap.mmap(0, 1588, 'Local\\\\acpmf_graphics', access=mmap.ACCESS_READ)
            except: pass
        if not stat_shm and can_open('Local\\\\acpmf_static'):
            try: stat_shm = mmap.mmap(0, 800, 'Local\\\\acpmf_static', access=mmap.ACCESS_READ)
            except: pass

        if phys_shm and gfx_shm:
            phys_shm.seek(0)
            p_bytes = phys_shm.read(712)

            gfx_shm.seek(0)
            g_bytes = gfx_shm.read(1588)

            track_name = ""
            car_name = ""
            max_rpm = 0.0
            max_fuel = 0.0
            if stat_shm:
                try:
                    stat_shm.seek(0)
                    s_bytes = stat_shm.read(800)
                    if len(s_bytes) >= 212:
                        car_name = s_bytes[68:134].decode('utf-16le', errors='ignore').split('\\x00')[0].strip()
                        track_name = s_bytes[134:200].decode('utf-16le', errors='ignore').split('\\x00')[0].strip()
                        max_rpm = struct.unpack('<f', s_bytes[204:208])[0]
                        max_fuel = struct.unpack('<f', s_bytes[208:212])[0]
                except:
                    pass

            if len(p_bytes) >= 416:
                pid, gas, brake, fuel, gear, rpm, steer, speed_kmh = struct.unpack('<ifffiiff', p_bytes[:32])

                # Pressures in psi: offset 88:104 (4 floats)
                pressures = struct.unpack('<4f', p_bytes[88:104])

                # TC & ABS & Pit Limiter
                tc_val = struct.unpack('<f', p_bytes[204:208])[0]
                pit_limiter, abs_val = struct.unpack('<if', p_bytes[248:256])

                # Brake temperatures: offset 348:364
                brakes = struct.unpack('<4f', p_bytes[348:364])

                # Tire temperatures 3 zones (Inner, Mid, Outer)
                tempI = struct.unpack('<4f', p_bytes[368:384])
                tempM = struct.unpack('<4f', p_bytes[384:400])
                tempO = struct.unpack('<4f', p_bytes[400:416])
                coreTemps = struct.unpack('<4f', p_bytes[152:168])

                tire_zones = {
                    'fl': [round(tempI[0] or coreTemps[0], 1), round(tempM[0] or coreTemps[0], 1), round(tempO[0] or coreTemps[0], 1)],
                    'fr': [round(tempI[1] or coreTemps[1], 1), round(tempM[1] or coreTemps[1], 1), round(tempO[1] or coreTemps[1], 1)],
                    'rl': [round(tempI[2] or coreTemps[2], 1), round(tempM[2] or coreTemps[2], 1), round(tempO[2] or coreTemps[2], 1)],
                    'rr': [round(tempI[3] or coreTemps[3], 1), round(tempM[3] or coreTemps[3], 1), round(tempO[3] or coreTemps[3], 1)]
                }

                # Normalized car position and world coordinates from graphics
                normalized_progress = 0.0
                status = 0
                world_x = 0.0
                world_z = 0.0
                if len(g_bytes) >= 264:
                    status = struct.unpack('<i', g_bytes[4:8])[0]
                    normalized_progress = struct.unpack('<f', g_bytes[248:252])[0]
                    world_x, world_y, world_z = struct.unpack('<3f', g_bytes[252:264])

                curr_speed = max(0.0, float(speed_kmh))

                packet = {
                    'rpm': max(0, int(rpm)),
                    'maxRpm': int(max_rpm) if max_rpm > 0 else 8500,
                    'speed': curr_speed,
                    'speedKmh': curr_speed,
                    'gear': int(gear) - 1,
                    'throttle': max(0.0, min(1.0, float(gas))),
                    'gas': max(0.0, min(1.0, float(gas))),
                    'brake': max(0.0, min(1.0, float(brake))),
                    'steeringAngle': float(steer),
                    'steer': float(steer),
                    'fuel': float(fuel),
                    'fuelLevel': float(fuel),
                    'fuelCapacity': float(max_fuel) if max_fuel > 0 else 120.0,
                    'trackProgress': max(0.0, min(1.0, float(normalized_progress))),
                    'tireZones': tire_zones,
                    'temps': [round(coreTemps[i] or tempM[i], 1) for i in range(4)],
                    'pressures': [round(p, 1) for p in pressures],
                    'brakes': [round(b, 1) for b in brakes],
                    'tc': float(tc_val) > 0.0,
                    'abs': float(abs_val) > 0.0,
                    'pitLimiter': int(pit_limiter) == 1,
                    'status': int(status),
                    'track': track_name,
                    'car': car_name,
                    'worldX': float(world_x),
                    'worldZ': float(world_z)
                }

                sock.sendto(json.dumps(packet).encode('utf-8'), target)
    except Exception as e:
        phys_shm = None
        gfx_shm = None
        stat_shm = None

    time.sleep(0.016)
`;

    this.pythonProcess = spawn('python', ['-u', '-c', script], {
      windowsHide: true,
      stdio: 'ignore'
    });
  }

  private mapAccDataToUnified(raw: any): UnifiedTelemetryData {
    const d = createDefaultTelemetryData();
    d.sessionInfo.gameId = GameId.ACC as any;
    d.sessionInfo.carName = raw.car || '';
    d.sessionInfo.trackName = raw.track || '';
    d.timestamp = Date.now();

    d.rpm = raw.rpm || 0;
    d.maxRpm = raw.maxRpm || 8500;
    d.speed = Math.round(raw.speed || 0);
    (d as any).speedKmh = d.speed;
    d.gear = raw.gear !== undefined ? raw.gear : 0;
    d.throttle = raw.gas !== undefined ? raw.gas : (raw.throttle || 0);
    d.brake = raw.brake || 0;
    d.steeringAngle = raw.steer !== undefined ? raw.steer : (raw.steeringAngle || 0);
    d.fuelLevel = raw.fuel || 0;
    d.trackProgress = raw.trackProgress || 0;

    d.electronics.abs = !!raw.abs;
    d.electronics.tc = !!raw.tc;
    (d as any).abs = !!raw.abs;
    (d as any).tc = !!raw.tc;
    (d as any).pitLimiter = !!raw.pitLimiter;
    (d as any).trackName = raw.track || '';
    (d as any).carName = raw.car || '';
    (d as any).tireZones = raw.tireZones;
    (d as any).worldX = raw.worldX || 0;
    (d as any).worldZ = raw.worldZ || 0;

    (d as any).competitors = this.competitors;

    // Calculate nearCars (radar) from competitor world coordinates relative to player
    const playerRt = this.carRealtimeMap.get(this.playerCarIndex);
    const nearCars: Array<{ x: number; y: number; id: number }> = [];
    if (playerRt && (raw.worldX || playerRt.worldPosX)) {
      const pX = raw.worldX || playerRt.worldPosX || 0;
      const pY = raw.worldZ || playerRt.worldPosY || 0;
      const pYaw = playerRt.yaw || 0;

      for (const [carIdx, rt] of this.carRealtimeMap) {
        if (carIdx === this.playerCarIndex) continue;
        const dx = (rt.worldPosX || 0) - pX;
        const dy = (rt.worldPosY || 0) - pY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 60) {
          // Transform world coordinates into player car heading frame
          // Heading angle pYaw
          const cos = Math.cos(-pYaw);
          const sin = Math.sin(-pYaw);
          const lateral = dx * cos - dy * sin;
          const longitudinal = dx * sin + dy * cos;
          nearCars.push({
            x: Math.round(lateral * 10) / 10,
            y: Math.round(longitudinal * 10) / 10,
            id: carIdx,
          });
        }
      }
    }
    (d as any).nearCars = nearCars;

    if (raw.temps && raw.temps.length >= 4) {
      d.tyreTemp.mid.fl = raw.temps[0];
      d.tyreTemp.mid.fr = raw.temps[1];
      d.tyreTemp.mid.rl = raw.temps[2];
      d.tyreTemp.mid.rr = raw.temps[3];
    }

    if (raw.pressures && raw.pressures.length >= 4) {
      d.tyrePressure.fl = raw.pressures[0];
      d.tyrePressure.fr = raw.pressures[1];
      d.tyrePressure.rl = raw.pressures[2];
      d.tyrePressure.rr = raw.pressures[3];
    }

    if (raw.brakes && raw.brakes.length >= 4) {
      d.brakeTemp.fl = raw.brakes[0];
      d.brakeTemp.fr = raw.brakes[1];
      d.brakeTemp.rl = raw.brakes[2];
      d.brakeTemp.rr = raw.brakes[3];
    }

    return d;
  }
}
export default ACCAdapter;
