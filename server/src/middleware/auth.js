import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const { id } = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await User.findById(id).select('-accessToken');
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};