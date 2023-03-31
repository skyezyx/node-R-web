var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var multer = require('multer');
var consolidate = require('consolidate');

var handleRcopy = require('./handleR/handleRcopy');
var handleRcopynojq = require('./handleR/handleRcopynojq');
var indexRouter = require('./routes/index');
// const cons = require('consolidate');
// const { addListener } = require('process');

// header("Cache-Control: no-cache, must-revalidate");

var app = express();
var router = express.Router();

// view engine setup
app.engine('html', consolidate.nunjucks);
app.engine('html', require('express-art-template'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(indexRouter);
// app.use('/', indexRouter);

// __dirname是node.js中的全局变量，表示取当前执行文件的路径
var upload = multer({ dest: path.join(__dirname, 'tmpCSV') });
app.post('/upload', upload.any(), function (req, res) {
	// console.log(req.body);
	handleRcopy(req, res);
});
app.post('/uploada', upload.any(), function (req, res) {
	// console.log(req.body);
	handleRcopynojq(req, res);
});
app.post('/feixiana', upload.any(), function (reqa, resa) {
	app.post('/feixianaa', function (req, res, next) {
		console.log("reqa.body", reqa.body);
		res.send(reqa.body);
	})
});

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
// 	next(createError(404));
// });
// // error handlera
// app.use(function (err, req, res, next) {
// 	// set locals, only providing error in development
// 	res.locals.message = err.message;
// 	res.locals.error = req.app.get('env') === 'development' ? err : {};

// 	// render the error page
// 	res.status(err.status || 500);
// 	res.render('error');
// });

module.exports = app;