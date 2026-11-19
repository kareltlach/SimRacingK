export const SERIAL_HEADER_1 = 0xAA;
export const SERIAL_HEADER_2 = 0x55;

export function encodeSerialTelemetry(rpm: number, maxRpm: number, gear: number, speed: number, abs: boolean, tc: boolean): Buffer {
  const buf = Buffer.alloc(10);
  buf.writeUInt8(SERIAL_HEADER_1, 0);
  buf.writeUInt8(SERIAL_HEADER_2, 1);
  buf.writeUInt16LE(Math.min(65535, Math.round(rpm)), 2);
  buf.writeUInt16LE(Math.min(65535, Math.round(maxRpm)), 4);
  buf.writeInt8(gear, 6);
  buf.writeUInt16LE(Math.min(65535, Math.round(speed)), 7);

  let flags = 0;
  if (abs) flags |= 0x01;
  if (tc) flags |= 0x02;
  buf.writeUInt8(flags, 9);

  return buf;
}
