const mysql = require('mysql2/promise');

const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = process.env;

const db = mysql.createPool({
  database: DB_NAME,
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  port: parseInt(DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


console.log('Conectando a la base de datos MySQL.');

db.getConnection()
  .then((connection) => {
    console.log('✅ Conexión exitosa a la base de datos MySQL.');
    connection.release();
  })
  .catch((error) => {
    console.error('❌ Error al conectar a la base de datos:', error.message);
  });

module.exports = db;