const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const {User} = require('../schema/user.schema')
dotenv.config()

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' })
    } 
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
  }
  

module.exports = authMiddleware