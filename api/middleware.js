const db = require('../db/main');

function middleware(req, res, next) { 
  const token = req.headers.authorization;

  const sql = 'SELECT * FROM usuarios WHERE documento = ?'
  db.query(sql, [token])
  .then(([resultados]) => {
    if (resultados.length === 1) {
      req.user = resultados[0];
      return next();
    }
    console.log(`Token incorrecto ${token}`);
    res.status(401).json({status:"error", error:"Sin autorización"});
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({status:"error", error});
  })
}

module.exports=middleware;