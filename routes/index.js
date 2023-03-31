var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('firstpage.html')

});
router.get('/txt', function (req, res, next) {
	res.render('txt.html')

});
router.get('/feixian', function (req, res, next) {
	res.render('feixian.html')
});

router.get('/index', function (req, res, next) {
	res.render('index.html')
});


module.exports = router; 
