var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('admin', { title: 'testuser',
                        FS: ['Chemie','Informatik','Mathematik','Elektrotechnik/Informationstechnik','Philosophische Fakult\u00e4t','Wirtschaftswissenschaften','Human- und Sozialwissenschaften','Physik'],
                        gremien: ['SturRa','FSR']
  });
});

module.exports = router;
