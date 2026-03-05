const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const generateQrToken = () => uuidv4();

/**
 * Generate QR code as Data URL (base64 image) from qr_token
 * @param {string} qrToken - Unique token (e.g. UUID) to encode
 * @returns {Promise<string>} Data URL (e.g. data:image/png;base64,...)
 */
const generateQRCodeDataURL = async (qrToken) => {
  return QRCode.toDataURL(qrToken);
};

module.exports = {
  generateQrToken,
  generateQRCodeDataURL
};
