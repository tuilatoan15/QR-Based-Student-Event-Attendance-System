const QRCode = require('qrcode');
const crypto = require('crypto');

class QRService {
  /**
   * Generate a unique QR token
   * @returns {string} - Unique QR token
   */
  generateQrToken() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(8).toString('hex');
    return `QR_${timestamp}_${random}`.substring(0, 50); // Limit length
  }

  /**
   * Generate QR code data URL from token
   * @param {string} qrToken - The QR token
   * @returns {Promise<string>} - Data URL of QR code
   */
  async generateQRCodeDataURL(qrToken) {
    try {
      const qrData = JSON.stringify({ qr_token: qrToken });
      const dataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return dataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code buffer from token
   * @param {string} qrToken - The QR token
   * @returns {Promise<Buffer>} - QR code buffer
   */
  async generateQRCodeBuffer(qrToken) {
    try {
      const qrData = JSON.stringify({ qr_token: qrToken });
      const buffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return buffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Validate QR token format
   * @param {string} qrToken - The QR token to validate
   * @returns {boolean} - True if valid format
   */
  validateQrToken(qrToken) {
    // Support both standard QR_... format and UUID format (for seeded data)
    const qrTokenRegex = /^(QR_\d+_[a-f0-9]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    return qrTokenRegex.test(qrToken) && qrToken.length <= 60;
  }

  /**
   * Extract QR token from QR code data
   * @param {string} qrData - The scanned QR data
   * @returns {string|null} - Extracted QR token or null
   */
  extractQrToken(qrData) {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.qr_token && this.validateQrToken(parsed.qr_token)) {
        return parsed.qr_token;
      }
      return null;
    } catch (error) {
      // Try direct token if not JSON
      if (this.validateQrToken(qrData)) {
        return qrData;
      }
      return null;
    }
  }
}

module.exports = new QRService();