const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const DOCX_PATH = path.join(process.cwd(), 'Пояснительная_записка_DSLK.docx');
const BACKUP_PATH = path.join(process.cwd(), 'Пояснительная_записка_DSLK.backup-before-peripherals.docx');

function readUInt32LE(buf, offset) {
  return buf.readUInt32LE(offset);
}

function findEndOfCentralDirectory(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('Не найден конец центрального каталога ZIP');
}

function parseZip(buf) {
  const eocd = findEndOfCentralDirectory(buf);
  const totalEntries = buf.readUInt16LE(eocd + 10);
  const centralOffset = readUInt32LE(buf, eocd + 16);
  const entries = [];
  let offset = centralOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Некорректная запись центрального каталога ZIP');
    }

    const method = buf.readUInt16LE(offset + 10);
    const crc = buf.readUInt32LE(offset + 16);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const uncompressedSize = buf.readUInt32LE(offset + 24);
    const fileNameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.slice(offset + 46, offset + 46 + fileNameLength).toString('utf8');

    const localNameLength = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = buf.slice(dataStart, dataStart + compressedSize);

    let data;
    if (method === 0) {
      data = compressedData;
    } else if (method === 8) {
      data = zlib.inflateRawSync(compressedData);
    } else {
      throw new Error(`Неподдерживаемый метод сжатия ${method} для ${name}`);
    }

    if (data.length !== uncompressedSize && uncompressedSize !== 0) {
      throw new Error(`Некорректный размер распакованных данных для ${name}`);
    }

    entries.push({ name, data, crc });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const crc = crc32(dataBuf);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dataBuf.length, 18);
    local.writeUInt32LE(dataBuf.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, dataBuf);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(dataBuf.length, 20);
    central.writeUInt32LE(dataBuf.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuf);

    offset += local.length + nameBuf.length + dataBuf.length;
  }

  const centralStart = offset;
  const centralBuffer = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralBuffer, end]);
}

function replaceAllWithCount(text, from, to) {
  let count = 0;
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const result = text.replace(new RegExp(escaped, 'g'), () => {
    count += 1;
    return to;
  });
  return { text: result, count };
}

if (!fs.existsSync(DOCX_PATH)) {
  throw new Error(`Файл не найден: ${DOCX_PATH}`);
}

const original = fs.readFileSync(DOCX_PATH);
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, original);
}

const entries = parseZip(original);
const documentEntry = entries.find((entry) => entry.name === 'word/document.xml');
const coreEntry = entries.find((entry) => entry.name === 'docProps/core.xml');
if (!documentEntry) throw new Error('В docx не найден word/document.xml');

let xml = documentEntry.data.toString('utf8');
let total = 0;

const replacements = [
  ['компьютерной техники и периферийных устройств', 'периферийной техники и устройств'],
  ['компьютерной техники DSLK', 'периферийной техники и устройств DSLK'],
  ['компьютерной техники', 'периферийной техники и устройств'],
  ['компьютерную технику', 'периферийную технику и устройства'],
  ['компьютерная техника', 'периферийная техника и устройства'],
  ['компьютерная техника и периферия', 'периферийная техника и устройства'],
  ['компьютерных комплектующих и периферии', 'периферийной техники и устройств'],
  ['компьютерных комплектующих', 'периферийных устройств'],
  ['компьютерных компонентов', 'периферийных устройств'],
  ['ПК-компонентов', 'периферийных устройств'],
  ['ПК компонентов', 'периферийных устройств'],
  ['комплектующих и периферии', 'периферийной техники и устройств'],
  ['комплектующих', 'периферийных устройств']
];

for (const [from, to] of replacements) {
  const res = replaceAllWithCount(xml, from, to);
  xml = res.text;
  total += res.count;
}

documentEntry.data = Buffer.from(xml, 'utf8');

if (coreEntry) {
  let coreXml = coreEntry.data.toString('utf8');
  for (const [from, to] of replacements) {
    coreXml = replaceAllWithCount(coreXml, from, to).text;
  }
  coreEntry.data = Buffer.from(coreXml, 'utf8');
}

fs.writeFileSync(DOCX_PATH, createZip(entries));
console.log(`Готово. Заменено фрагментов: ${total}`);
console.log(`Файл обновлён: ${DOCX_PATH}`);
console.log(`Резервная копия: ${BACKUP_PATH}`);
