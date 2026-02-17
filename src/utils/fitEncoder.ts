/**
 * Minimaler Garmin .FIT Datei-Encoder fuer Workout-Dateien.
 *
 * FIT (Flexible and Interoperable Data Transfer) ist Garmins binaeres Dateiformat.
 * Dieser Encoder unterstuetzt nur den Workout-Typ (file_id, workout, workout_step).
 *
 * Referenz: Garmin FIT SDK Profile.xlsx + FIT Protocol Spec
 *
 * File-Struktur:
 *   [14-byte Header mit Header-CRC]
 *   [Definition + Data Messages]
 *   [2-byte File-CRC ueber Header + Data]
 */

// === CRC-16 (Garmin FIT Variante) ===
const CRC_TABLE = [
  0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
  0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
];

function crc16(data: number[], startCrc: number = 0): number {
  let crc = startCrc;
  for (const byte of data) {
    let tmp = CRC_TABLE[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ CRC_TABLE[byte & 0xF];
    tmp = CRC_TABLE[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xF];
  }
  return crc;
}

// === Base Types (FIT SDK) ===
const BASE_TYPE = {
  ENUM: 0x00,     // 1 byte
  UINT8: 0x02,    // 1 byte
  UINT16: 0x84,   // 2 bytes, LE
  UINT32: 0x86,   // 4 bytes, LE
  UINT32Z: 0x8C,  // 4 bytes, LE (zero = invalid)
  STRING: 0x07,   // N bytes, null-terminated
} as const;

// === Global Message Numbers ===
const MESG_NUM = {
  FILE_ID: 0,
  WORKOUT: 26,
  WORKOUT_STEP: 27,
} as const;

interface FieldDef {
  num: number;
  size: number;
  baseType: number;
}

// === Garmin Timestamp: Seconds since 1989-12-31 00:00:00 UTC ===
const GARMIN_EPOCH = Date.UTC(1989, 11, 31, 0, 0, 0) / 1000;

function garminTimestamp(): number {
  return Math.round(Date.now() / 1000) - GARMIN_EPOCH;
}

// === Public Types ===

export interface WorkoutStepDef {
  name: string;
  durationType: number;  // 0=time(ms), 1=distance(cm), 5=open
  durationValue: number; // milliseconds or centimeters
  targetType: number;    // 0=speed, 2=open
  targetValue: number;   // 0 for custom speed range
  speedLow: number;      // m/s * 1000 (slower speed = higher pace)
  speedHigh: number;     // m/s * 1000 (faster speed = lower pace)
  intensity: number;     // 0=active, 1=rest, 2=warmup, 3=cooldown
}

// === Main Encoder ===

export function encodeFitWorkout(workoutName: string, steps: WorkoutStepDef[]): Uint8Array {
  const data: number[] = [];

  // === 1. File ID Definition + Data (local type 0) ===
  const fileIdFields: FieldDef[] = [
    { num: 0, size: 1, baseType: BASE_TYPE.ENUM },      // type
    { num: 1, size: 2, baseType: BASE_TYPE.UINT16 },     // manufacturer
    { num: 2, size: 2, baseType: BASE_TYPE.UINT16 },     // product
    { num: 3, size: 4, baseType: BASE_TYPE.UINT32Z },    // serial_number
    { num: 4, size: 4, baseType: BASE_TYPE.UINT32 },     // time_created
  ];
  writeDefinition(data, 0, MESG_NUM.FILE_ID, fileIdFields);

  const ts = garminTimestamp();
  writeDataRecord(data, 0, [
    { size: 1, value: 5 },          // type = 5 (workout)
    { size: 2, value: 1 },          // manufacturer = 1 (garmin)
    { size: 2, value: 65534 },      // product
    { size: 4, value: ts },         // serial_number
    { size: 4, value: ts },         // time_created
  ]);

  // === 2. Workout Definition + Data (local type 1) ===
  const nameSize = 24; // Fixed size for workout name
  const workoutFields: FieldDef[] = [
    { num: 8, size: nameSize, baseType: BASE_TYPE.STRING },  // wkt_name (FIRST - most important field)
    { num: 4, size: 1, baseType: BASE_TYPE.ENUM },           // sport
    { num: 5, size: 1, baseType: BASE_TYPE.ENUM },           // sub_sport
    { num: 6, size: 2, baseType: BASE_TYPE.UINT16 },         // num_valid_steps
  ];
  writeDefinition(data, 1, MESG_NUM.WORKOUT, workoutFields);

  const nameBytes = stringToBytes(workoutName, nameSize);
  writeDataRecord(data, 1, [
    { size: nameSize, bytes: nameBytes },    // wkt_name
    { size: 1, value: 1 },                   // sport = 1 (running)
    { size: 1, value: 0 },                   // sub_sport = 0 (generic)
    { size: 2, value: steps.length },         // num_valid_steps
  ]);

  // === 3. Workout Step Definition (local type 2) ===
  const stepNameSize = 16;
  const stepFields: FieldDef[] = [
    { num: 254, size: 2, baseType: BASE_TYPE.UINT16 },    // message_index
    { num: 0, size: stepNameSize, baseType: BASE_TYPE.STRING }, // wkt_step_name
    { num: 1, size: 1, baseType: BASE_TYPE.ENUM },        // duration_type
    { num: 2, size: 4, baseType: BASE_TYPE.UINT32 },      // duration_value
    { num: 3, size: 1, baseType: BASE_TYPE.ENUM },        // target_type
    { num: 4, size: 4, baseType: BASE_TYPE.UINT32 },      // target_value
    { num: 5, size: 4, baseType: BASE_TYPE.UINT32 },      // custom_target_value_low
    { num: 6, size: 4, baseType: BASE_TYPE.UINT32 },      // custom_target_value_high
    { num: 7, size: 1, baseType: BASE_TYPE.ENUM },        // intensity
  ];
  writeDefinition(data, 2, MESG_NUM.WORKOUT_STEP, stepFields);

  // === 4. Workout Step Data Records ===
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNameBytes = stringToBytes(step.name, stepNameSize);

    writeDataRecord(data, 2, [
      { size: 2, value: i },                      // message_index
      { size: stepNameSize, bytes: stepNameBytes }, // wkt_step_name
      { size: 1, value: step.durationType },       // duration_type
      { size: 4, value: step.durationValue },      // duration_value
      { size: 1, value: step.targetType },         // target_type
      { size: 4, value: step.targetValue },        // target_value
      { size: 4, value: step.speedLow },           // custom_target_value_low
      { size: 4, value: step.speedHigh },          // custom_target_value_high
      { size: 1, value: step.intensity },          // intensity
    ]);
  }

  // === 5. Build final file with correct CRCs ===
  return buildFitFile(data);
}

// === Helper Functions ===

function writeDefinition(buf: number[], localType: number, globalMesgNum: number, fields: FieldDef[]) {
  // Record header: definition (bit 6 set), no developer data (bit 5 clear)
  buf.push(0x40 | (localType & 0x0F));
  buf.push(0);                       // reserved
  buf.push(0);                       // architecture = 0 (little-endian)
  pushUint16LE(buf, globalMesgNum);  // global message number
  buf.push(fields.length);           // num fields

  for (const field of fields) {
    buf.push(field.num & 0xFF);
    buf.push(field.size & 0xFF);
    buf.push(field.baseType & 0xFF);
  }
}

interface FieldValue {
  size: number;
  value?: number;
  bytes?: number[];
}

function writeDataRecord(buf: number[], localType: number, fields: FieldValue[]) {
  // Record header: data message (bit 6 clear)
  buf.push(localType & 0x0F);

  for (const field of fields) {
    if (field.bytes) {
      for (const b of field.bytes) buf.push(b & 0xFF);
    } else {
      const v = field.value ?? 0;
      switch (field.size) {
        case 1:
          buf.push(v & 0xFF);
          break;
        case 2:
          pushUint16LE(buf, v);
          break;
        case 4:
          pushUint32LE(buf, v);
          break;
      }
    }
  }
}

function pushUint16LE(buf: number[], value: number) {
  buf.push(value & 0xFF);
  buf.push((value >> 8) & 0xFF);
}

function pushUint32LE(buf: number[], value: number) {
  buf.push(value & 0xFF);
  buf.push((value >> 8) & 0xFF);
  buf.push((value >> 16) & 0xFF);
  buf.push((value >> 24) & 0xFF);
}

function stringToBytes(str: string, maxLen: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < Math.min(str.length, maxLen - 1); i++) {
    bytes.push(str.charCodeAt(i) & 0xFF);
  }
  // Null-terminate and pad to exact size
  while (bytes.length < maxLen) {
    bytes.push(0);
  }
  return bytes;
}

function buildFitFile(dataBytes: number[]): Uint8Array {
  const dataSize = dataBytes.length;

  // === Header (14 bytes) ===
  const header: number[] = [];
  header.push(14);                     // [0] header_size = 14
  header.push(0x20);                   // [1] protocol_version = 2.0
  pushUint16LE(header, 2084);          // [2-3] profile_version = 20.84
  pushUint32LE(header, dataSize);      // [4-7] data_size
  header.push(0x2E); // [8]  '.'
  header.push(0x46); // [9]  'F'
  header.push(0x49); // [10] 'I'
  header.push(0x54); // [11] 'T'

  // Header CRC: CRC of bytes 0-11
  const headerCrc = crc16(header.slice(0, 12));
  pushUint16LE(header, headerCrc);     // [12-13] header CRC

  // === File CRC: CRC of entire file (header + data), excluding the CRC itself ===
  // Per FIT spec: "CRC is calculated from byte 0 of the header to the last byte of data"
  let fileCrc = crc16(header);          // Start with header bytes
  fileCrc = crc16(dataBytes, fileCrc);  // Continue with data bytes

  // === Assemble final file ===
  const totalSize = header.length + dataBytes.length + 2; // +2 for file CRC
  const result = new Uint8Array(totalSize);
  let offset = 0;

  for (const b of header) result[offset++] = b;
  for (const b of dataBytes) result[offset++] = b;
  result[offset++] = fileCrc & 0xFF;
  result[offset++] = (fileCrc >> 8) & 0xFF;

  return result;
}
