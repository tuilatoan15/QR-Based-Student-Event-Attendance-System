const { v4: uuidv4 } = require('uuid');

const generateQRCode = () => {
  return uuidv4();
};

module.exports = generateQRCode;

