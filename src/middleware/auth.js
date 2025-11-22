const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${userRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Ownership-based authorization middleware
const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      let resource;
      switch (resourceModel) {
        case 'loan':
          resource = await prisma.loan.findUnique({
            where: { id: resourceId },
            select: { user_id: true }
          });
          break;
        case 'user':
          resource = { user_id: resourceId };
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Allow if user is librarian or owns the resource
      if (req.user.role === 'LIBRARIAN' || resource.user_id === req.user.id) {
        next();
      } else {
        res.status(403).json({ error: 'Access denied - insufficient permissions' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Combined middleware for librarian OR ownership
const requireLibrarianOrOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      // If user is librarian, allow access
      if (req.user.role === 'LIBRARIAN') {
        return next();
      }

      // Otherwise, check ownership
      return requireOwnership(resourceModel, resourceIdParam)(req, res, next);
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  requireLibrarianOrOwnership
};