const router = require('express').Router();
const db = require('../../db/main');

/**
 * @api {get} /tareas Listar tareas
 * @apiName GetTareas
 * @apiGroup Tareas
 * @apiDescription Devuelve todas las tareas activas del usuario autenticado. Admite búsqueda por texto, filtro por categoría, ordenamiento por prioridad y paginación.
 *
 * @apiHeader {String} Authorization Número de documento del usuario (usado como token de autenticación).
 *
 * @apiQuery {String} [busqueda]      Texto a buscar en <code>nombre</code>, <code>descripcion</code> o <code>categoria</code>.
 * @apiQuery {String} [categoria]     Filtra por categoría (búsqueda parcial).
 * @apiQuery {String="ASC","DESC"} [orden] Ordena los resultados por <code>prioridad</code>.
 * @apiQuery {Number} [limit=99999]   Cantidad máxima de resultados a devolver.
 * @apiQuery {Number} [offset=0]      Desplazamiento para paginación.
 *
 * @apiSuccess {String}   status       <code>"ok"</code>
 * @apiSuccess {Object[]} tareas        Lista de tareas del usuario.
 * @apiSuccess {Number}   tareas.id          ID de la tarea.
 * @apiSuccess {String}   tareas.nombre      Nombre de la tarea.
 * @apiSuccess {String}   tareas.descripcion Descripción detallada.
 * @apiSuccess {Number}   tareas.prioridad   Nivel de prioridad.
 * @apiSuccess {String}   tareas.categoria   Categoría de la tarea.
 * @apiSuccess {String}   tareas.estado      Estado actual.
 * @apiSuccess {Number}   tareas.usuario_id  ID del usuario propietario.
 * @apiSuccess {Boolean}  tareas.eliminada   Siempre <code>false</code> en este endpoint.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *   HTTP/1.1 200 OK
 *   {
 *     "status": "ok",
 *     "tareas": [
 *       {
 *         "id": 1,
 *         "nombre": "Estudiar para el parcial",
 *         "descripcion": "Repasar capítulos 3 y 4",
 *         "prioridad": 1,
 *         "categoria": "escolar",
 *         "estado": "pendiente",
 *         "usuario_id": 42,
 *         "eliminada": false
 *       }
 *     ]
 *   }
 *
 * @apiError (401) {String} error <code>"Sin autorización"</code> — el documento no corresponde a ningún usuario.
 * @apiError (500) {String} error Descripción del error interno del servidor.
 */
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

/**
 * @api {post} /tareas Crear tarea
 * @apiName PostTarea
 * @apiGroup Tareas
 * @apiDescription Crea una nueva tarea asociada al usuario autenticado.
 *
 * @apiHeader {String} Authorization Número de documento del usuario.
 *
 * @apiBody {String} nombre       Nombre de la tarea.
 * @apiBody {String} [descripcion] Descripción detallada de la tarea.
 * @apiBody {Number} prioridad    Nivel de prioridad (ej: 1 = alta, 2 = media, 3 = baja).
 * @apiBody {String} categoria    Categoría de la tarea.
 * @apiBody {String} estado       Estado inicial (ej: <code>"pendiente"</code>).
 *
 * @apiSuccess (201) {String} status <code>"ok"</code>
 * @apiSuccess (201) {Object} tarea  Resultado del INSERT. Incluye <code>insertId</code> con el ID generado.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *   HTTP/1.1 201 Created
 *   {
 *     "status": "ok",
 *     "tarea": {
 *       "fieldCount": 0,
 *       "affectedRows": 1,
 *       "insertId": 7,
 *       "info": "",
 *       "serverStatus": 2,
 *       "warningStatus": 0
 *     }
 *   }
 *
 * @apiError (401) {String} error <code>"Sin autorización"</code>
 * @apiError (500) {String} error Descripción del error interno del servidor.
 */
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

/**
 * @api {put} /tareas/estado/:tarea_id Actualizar estado
 * @apiName PutEstadoTarea
 * @apiGroup Tareas
 * @apiDescription Modifica únicamente el campo <code>estado</code> de una tarea del usuario autenticado.
 *
 * @apiHeader {String} Authorization Número de documento del usuario.
 *
 * @apiParam {Number} tarea_id ID de la tarea a actualizar.
 *
 * @apiBody {String} estado Nuevo estado de la tarea (ej: <code>"en curso"</code>, <code>"completada"</code>).
 *
 * @apiSuccess (202) {String} status <code>"ok"</code>
 * @apiSuccess (202) {Object} tarea  Resultado del UPDATE con <code>affectedRows</code>.
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *   HTTP/1.1 202 Accepted
 *   {
 *     "status": "ok",
 *     "tarea": {
 *       "fieldCount": 0,
 *       "affectedRows": 1,
 *       "insertId": 0,
 *       "info": "Rows matched: 1  Changed: 1  Warnings: 0",
 *       "serverStatus": 2,
 *       "warningStatus": 0
 *     }
 *   }
 *
 * @apiError (401) {String} error <code>"Sin autorización"</code>
 * @apiError (500) {String} error Descripción del error interno del servidor.
 */
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

/**
 * @api {delete} /tareas/:tarea_id Eliminar tarea
 * @apiName DeleteTarea
 * @apiGroup Tareas
 * @apiDescription Realiza un <em>soft delete</em> de la tarea: marca el campo <code>eliminada = true</code>. El registro no se borra físicamente de la base de datos.
 *
 * @apiHeader {String} Authorization Número de documento del usuario.
 *
 * @apiParam {Number} tarea_id ID de la tarea a eliminar.
 *
 * @apiSuccess (202) {String} status <code>"ok"</code>
 *
 * @apiSuccessExample {json} Respuesta exitosa:
 *   HTTP/1.1 202 Accepted
 *   {
 *     "status": "ok"
 *   }
 *
 * @apiError (401) {String} error <code>"Sin autorización"</code>
 * @apiError (500) {String} error Descripción del error interno del servidor.
 */
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
