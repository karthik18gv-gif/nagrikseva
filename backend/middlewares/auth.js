const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return errorResponse(res, 'Access denied. No token provided.', 401);
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token.', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return errorResponse(res, 'Access forbidden. Insufficient permissions.', 403);
  next();
};

module.exports = { verifyToken, authorize };
