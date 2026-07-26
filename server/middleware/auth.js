const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'dev_secret_change_me';

function buildToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, secret, { expiresIn });
}

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return next();
  const parts = auth.split(' ');
  if(parts.length!==2 || parts[0]!=='Bearer') return next();
  try{
    const payload = jwt.verify(parts[1], secret);
    req.user = payload;
  }catch(e){
    // invalid token; ignore
  }
  return next();
}

function requireAdmin(req, res, next){
  if(req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
}

module.exports = { authMiddleware, requireAdmin, buildToken, secret };
