import pkg from 'jsonwebtoken';
const { verify } = pkg;
const excludedRoutes = ['/api/auth/verify-token'];

// Middleware para verificar el JWT
export const verifyToken = (req, res, next) => {
 console.log(req.path);
 
  if (excludedRoutes.includes(req.path)) {
    return next();
  }
  const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del header
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    console.log('middleware');
    
    // Verificar y decodificar el token
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adjuntar los datos decodificados al objeto req
    next(); // Continuar con la siguiente función o controlador
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
    console.log('user Refused');

      return res.status(401).json({ error: 'Token expired', expired: true });
    }
    console.log('user Refused');
    return res.status(403).json({ error: 'Invalid token' });
    
  }
};