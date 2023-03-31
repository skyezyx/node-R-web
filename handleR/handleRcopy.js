var path = require('path');
var fs = require('fs');
var rio = require("rio");

function handleRcopy(req, resFB) {
	var pointdata = req.body;
	console.log("pointdata-----------");
	console.log(pointdata);
	var acourt = 0;
	var bcourt = 0;
	var anumbernum = [];
	var bnumbernum = [];
	var acoordnum = [];
	var bcoordnum = [];
	// 返回的结果
	var objFB = {};

	for (let index = 0; index < pointdata.length; index++) {
		if ((pointdata[index].geometry.count % 2) == 1) {
			acourt = acourt + 1;
			anumbernum.push(parseInt(pointdata[index].geometry.numr));
			acoordnum.push(pointdata[index].geometry.coordinates[0]);
			acoordnum.push(pointdata[index].geometry.coordinates[1]);
		} else {
			bcourt = bcourt + 1;
			bnumbernum.push(parseInt(pointdata[index].geometry.numr));
			bcoordnum.push(pointdata[index].geometry.coordinates[0]);
			bcoordnum.push(pointdata[index].geometry.coordinates[1]);
		}
	};

	var cccc = {
		a: acourt,
		b: bcourt,
		anumber: anumbernum,
		bnumber: bnumbernum,
		acoord: acoordnum,
		bcoord: bcoordnum,
		l: parseInt(pointdata[0].geometry.zaike),
		distance: pointdata[0].geometry.distance
	};

	// var aaa = rio.e({ command: "pi / 2 * 2" });
	// console.log("aaa-----------");
	// console.log(aaa);

	console.log("传入handleRcopy的参数-----------");
	console.log(cccc);

	rio.e({
		filename: path.join(__dirname, "RScript/zjl.r"),
		entrypoint: "funWF",
		data: cccc,
		callback: funResAfterE
	});

	// 回调函数
	function funResAfterE(err, res) {
		console.log("R代码返回的结果res-----------");
		console.log(res);
		if (!err) {
			objFB.message = 'Done';
			res = JSON.parse(res);
			objFB.re = res;
		} else {
			objFB.message = 'Err';
			objFB.re = err.toString();
		}

		resFB.send(objFB);
		console.log("handleRcopy代码返回的结果objFB----------");
		console.log(objFB);
	}

};

module.exports = handleRcopy; 