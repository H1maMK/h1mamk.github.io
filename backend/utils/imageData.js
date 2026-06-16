const toBase64 = (buffer) => buffer.toString('base64');

const getSafeMimeType = (mimeType = '') => {
  if (typeof mimeType !== 'string') {
    return 'application/octet-stream';
  }

  return mimeType.trim() || 'application/octet-stream';
};

const fileToDataUrl = (file) => {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return '';
  }

  const mimeType = getSafeMimeType(file.mimetype);
  return `data:${mimeType};base64,${toBase64(file.buffer)}`;
};

const isDataImageUrl = (value = '') => typeof value === 'string' && value.startsWith('data:image/');

module.exports = {
  fileToDataUrl,
  isDataImageUrl,
};
