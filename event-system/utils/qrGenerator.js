const { v4: uuidv4 } = require('uuid');

const generateQrToken = () => uuidv4();

module.exports = {
  generateQrToken
};
