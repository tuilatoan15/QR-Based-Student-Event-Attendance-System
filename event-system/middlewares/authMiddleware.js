const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { errorResponse } = require('../utils/response');

dotenv.config();

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Authorization header missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired token');
  }
};

module.exports = auth;
