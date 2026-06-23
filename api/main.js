const router = require('express').Router();

const middleware = require('./middleware');

const tareasRouter = require('./tareas/main');

router.use('/tareas', middleware, tareasRouter);


router.get('/', function(req, res, next){
  res.send("OK");
})

module.exports = router;