const router = require('express').Router();
const db = require('../../db/main');

router.get("/", function(req, res, next) {
  const { busqueda = null, categoria = null, orden = null, limit = 99999, offset = 0 } = req.query;
  const usuario_id = req.user.id;

  let sql = "SELECT * FROM tareas WHERE eliminada =FALSE AND usuario_id = ? ";
  let params = [usuario_id];

  if (busqueda) {
    sql += `AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?) `;
    const filtro = `%${busqueda}%`;
    params.push(filtro, filtro, filtro);
  }
  if (categoria) {
    sql += `AND (categoria LIKE ?) `;
    const filtro = `%${categoria}%`;
    params.push(filtro);
  }
  if (orden && (orden === "DESC" || orden === "ASC")) {
    sql += `ORDER BY prioridad ${orden} `;
  }

  sql += " LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));

  db.query(sql, params)
  .then(([resultados, fields]) => {
    console.log(resultados);
    res.status(200).json({ status: "ok", tareas: resultados });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ status: "error", error });
  });
});

router.post("/", function(req, res, next) {
  const { nombre, descripcion, prioridad, categoria, estado } = req.body;
  const usuario_id = req.user.id;

  const sql = `INSERT INTO tareas (nombre, descripcion, prioridad, categoria, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [nombre, descripcion, prioridad, categoria, estado, usuario_id])
  .then(([resultados, fields]) => {
    console.log(resultados);
    res.status(201).json({ status: "ok", tarea: resultados });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ status: "error", error });
  });
});

router.put("/estado/:tarea_id", function(req, res, next) {
  const { tarea_id } = req.params;
  const usuario_id = req.user.id;
  const { estado } = req.body;

  const sql = `UPDATE tareas SET estado = ? WHERE id = ? AND usuario_id = ?`;

  db.query(sql, [estado, tarea_id, usuario_id])
  .then(([resultados, fields]) => {
    console.log(resultados);
    res.status(202).json({ status: "ok", tarea: resultados });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ status: "error", error });
  });
});

router.delete("/:tarea_id", function(req, res, next) {
  const { tarea_id } = req.params;
  const usuario_id = req.user.id; 

  const sql = `UPDATE tareas SET eliminada = true WHERE id = ? AND usuario_id = ?`;

  db.query(sql, [tarea_id, usuario_id])
  .then(([resultados, fields]) => {
    console.log(resultados);
    res.status(202).json({ status: "ok" });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ status: "error", error });
  });
});

module.exports = router;