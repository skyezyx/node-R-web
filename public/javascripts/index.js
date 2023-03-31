// 显示面板开关
function togglePanel() {
	let classList = document.querySelector('.menu').classList;
	if (classList.contains('hide')) {
		classList.remove('hide');
		classList.add('show');
	} else {
		classList.remove('show');
		classList.add('hide');
	}
}
$(() => {

	// 初始化地图
	// var map = new BMapGL.Map('map_container');
	var map = initMap({
		tilt: 0,
		heading: 0,
		center: [121.506379, 31.245414],
		zoom: 12,
		style: snowStyle,
		skyColors: [
			// 地面颜色
			'rgba(226, 237, 248, 0)',
			// 天空颜色
			'rgba(186, 211, 252, 1)'
		]
	});

	// map.centerAndZoom(new BMapGL.Point(121.354531, 31.157003), 15);
	var view = new mapvgl.View({
		map: map
	});

	// 存放点图层的数据，以id来区分受灾点1和安置点2
	var pointdata = [];
	var renshunum = [];
	let rongliangnum = [];
	// 总人数和总容量
	var sumrenshu;
	var sumrongliang;
	// 实际驾车距离
	// var distance = [0];
	var distance = {
		zhuangtai: 0,
		zhi: [0]
	};
	var sznum = 0;
	var aznum = 0;
	var anum = 0;
	var bnum = 0;
	// 传入结果展示页面的对象
	var pointdatare = {};
	var pointdatareJSON = {};

	// 点图层
	var pointLayer = new mapvgl.PointLayer({
		blend: 'default',
		size: 20,
		enablePicked: true, // 是否可以拾取
		selectedColor: '#ffff00', // 选中项颜色
		autoSelect: true, // 根据鼠标位置来自动设置选中项
		// enableDragging: true, //是否可以拖拽
		onRightClick: pointrightclick
	});
	// 标注
	let textLayer = new mapvgl.TextLayer({
		collides: false,
		offset: [0, 20],
		color: '#000',
		fontFamily: 'PingFangSC-Medium',
	});

	// 地图点击的监听函数(区别在于不同的id 1为受灾点，2为安置点)
	function handleClicks(e) {
		var apoint = new BMapGL.Point(e.latlng.lng, e.latlng.lat);
		var person = prompt("请输入该受灾点的人数：", "45");
		if (person == null || person == "") {
			alert("请输入该受灾点的人数");
		} else {
			anum = anum + 1;
			var stringanum = `受灾点${anum}`;
			pointdata.push({
				geometry: {
					type: 'Point',
					coordinates: [e.latlng.lng, e.latlng.lat],
					count: parseInt('1')
				},
				properties: {
					text: stringanum,
					a: anum
				},
			});
			renshunum.push(person);
			$('#renshu').val(renshunum);
			refreshlayer();
		};
	};
	function handleClicka(e) {
		var apoint = new BMapGL.Point(e.latlng.lng, e.latlng.lat);
		var person = prompt("请输入该安置点的容量：", "50");
		if (person == null || person == "") {
			alert("请输入该安置点的人数");
		} else {
			bnum = bnum + 1;
			var stringbnum = `避灾点${bnum}`;
			pointdata.push({
				geometry: {
					type: 'Point',
					coordinates: [e.latlng.lng, e.latlng.lat],
					count: parseInt('2'),
				},
				properties: {
					text: stringbnum,
					a: bnum
				},
			});
			// 读取安置点容量，写入文本框
			rongliangnum.push(person);
			$("#rongliang").val(rongliangnum);
			// console.log($('#rongliang').val(), 'text');
			refreshlayer();
		};
	};
	// 刷新地图
	function refreshlayer() {
		pointLayer.setOptions({
			// 按照id设置点的颜色
			color: function (item) {
				if ((item.geometry.count % 2) == 1) {
					return '#ff0033';
				}
				else {
					return '#32CD32';
				}
			},
		});
		pointLayer.setData(pointdata);
		view.addLayer(pointLayer);

		textLayer.setData(pointdata);
		view.addLayer(textLayer);
		// console.log(pointdata);
	};
	// 点的鼠标右键函数:删除点
	function pointrightclick(e) {
		var message = confirm('是否要删除当前点？');
		if (message == true) {
			var a = e.dataItem.geometry.coordinates;
			for (var i = 0; i < pointdata.length; i++) {
				if (pointdata[i].geometry.coordinates == a) {
					// 该点属于第几个受灾点或者第几个安置点，从而刷新文本框，从数组中去掉对应人数/容量
					var sz = 0;
					var az = 0;
					for (var j = 0; j < i; j++) {
						if ((pointdata[j].geometry.count % 2) == 1) {
							sz = sz + 1;
						} else {
							az = az + 1;
						}
					}
					if ((pointdata[i].geometry.count % 2) == 1) {
						renshunum.splice(sz, 1);
						$('#renshu').val(renshunum);
					} else {
						rongliangnum.splice(az, 1);
						$("#rongliang").val(rongliangnum);
					}
					// 从点数据集中去掉
					pointdata.splice(i, 1);
					// 地图移除覆盖物
					pointLayer.setData(pointdata);
					view.addLayer(pointLayer);
					alert("已删除");
					console.log(pointdata);
				}
			}
		}
	};

	// 清空所有数据点
	$('#btnclear').click(function (e) {
		pointdata = [];
		pointLayer.setData(pointdata);
		view.addLayer(pointLayer);
		renshunum = [];
		$('#renshu').val(renshunum);
		rongliangnum = [];
		$("#rongliang").val(rongliangnum);
	});

	// 添加受灾点(小bug:第二次点击添加时，仍执行的是第一次的函数！！！)
	$('#addspoint').click(function (e) {
		map.removeEventListener('click', handleClicka);
		map.addEventListener('click', handleClicks);
	});
	// 添加安置点
	$('#addapoint').click(function (e) {
		// 添加安置点前先结束添加受灾点
		map.removeEventListener('click', handleClicks);
		map.addEventListener('click', handleClicka);
	});
	// 结束添加受灾点
	$('#endspoint').click(function (e) {
		map.removeEventListener('click', handleClicks);
	});
	// 结束添加安置点
	$('#endapoint').click(function (e) {
		map.removeEventListener('click', handleClicka);
	});

	// 关键词检索:是否添加点  
	function keywordsearch() {
		var mykeys = [document.getElementById('keyword1').value, document.getElementById('keyword2').value];

		var local = new BMapGL.LocalSearch(map, {
			renderOptions: { map: map, panel: "r-result" },
			pageCapacity: 5,
			onMarkersSet: function (results) {
				console.log(results);
				if (local.getStatus() == BMAP_STATUS_SUCCESS) {
					// marker.addEventListener('click', function () {
					//     alert(a);
					// });
					// var message = confirm('是否要添加当前点？');
					// // 添加点
					// if (message == true) {

					// }
				}

			}
		});
		local.search(mykeys);
	}

	// 计算总人数、总容量等input框的内容
	function updateinput() {
		pointdatare = {};
		// 计算总人数和总容量
		sumrenshu = 0;
		sumrongliang = 0;
		// 更新input框的内容，拆分     是否添加判断这个框内数字的长度不能超过点数!!!
		var zaikeliang = document.getElementById('zaikeliang').value;
		var renshunum2 = document.getElementById('renshu').value;
		var renshunumsplit = renshunum2.split(',');
		renshunum = renshunumsplit;
		$("#renshu").val(renshunum);
		var rongliangnum2 = document.getElementById('rongliang').value;
		var rongliangnumsplit = rongliangnum2.split(',');
		// 更新后的安置点容量，更新文本框
		rongliangnum = rongliangnumsplit
		$("#rongliang").val(rongliangnum);

		// 后端采用驾车距离
		if ($("#cardistance").get(0).checked) {
			distance.zhuangtai = 1;
			distance.zhi = [];
			// 计算每个受灾点到安置点的距离
			var szcoord = [];
			var azcoord = [];
			for (let index = 0; index < pointdata.length; index++) {
				if ((pointdata[index].geometry.count % 2) == 1) {
					var a = pointdata[index].geometry.coordinates[0];
					var b = pointdata[index].geometry.coordinates[1];
					szcoord.push(a);
					szcoord.push(b);
				} else {
					var aa = pointdata[index].geometry.coordinates[0];
					var bb = pointdata[index].geometry.coordinates[1];
					azcoord.push(aa);
					azcoord.push(bb);
				}
			};
			for (let i = 0; i < szcoord.length; i = i + 2) {
				for (let j = 0; j < azcoord.length; j = j + 2) {
					var start = new BMapGL.Point(szcoord[i], szcoord[i + 1]);
					var end = new BMapGL.Point(azcoord[j], azcoord[j + 1]);
					//根据起始点经纬度坐标开始驾车路线规划
					transit.search(start, end);
				}
			}
			console.log("distance", distance);
			pointdatavalue();
		} else {
			distance.zhuangtai = 0;
			distance.zhi = [0];
			pointdatavalue();
		}
		// 赋值给pointdata
		async function pointdatavalue() {
			var i = 0;
			var j = 0;
			sznum = 0;
			aznum = 0;
			pointdata[0].geometry.distance = distance.zhi;
			for (let index = 0; index < pointdata.length; index++) {
				if ((pointdata[index].geometry.count % 2) == 1) {
					pointdata[index].geometry.numr = renshunumsplit[i];
					pointdata[index].geometry.zaike = zaikeliang;
					i = i + 1;
					sznum = sznum + 1;
				} else {
					pointdata[index].geometry.numr = rongliangnumsplit[j];
					pointdata[index].geometry.zaike = zaikeliang;
					j = j + 1;
					aznum = aznum + 1;
				}
			};
			for (let index = 0; index < renshunumsplit.length; index++) {
				sumrenshu = sumrenshu + parseInt(renshunumsplit[index]);
			};
			for (let index = 0; index < rongliangnumsplit.length; index++) {
				sumrongliang = sumrongliang + Number(rongliangnumsplit[index]);
			};
			// console.log("pointdata", pointdata);
		}
	}

	// 检索完成后的回调函数（参数为results: DrivingRouteResult）
	var searchComplete = function (results) {
		// 判断是否检索成功
		if (transit.getStatus() != BMAP_STATUS_SUCCESS) {
			return;
		}
		//DrivingRouteResult的方法，返回索引指定的方案
		var plan = results.getPlan(0);
		var zhi = plan.getDistance(false);
		// 按行存入
		distance.zhi.push(zhi);
	}
	// 驾车路线规划
	var transit = new BMapGL.DrivingRoute(map,
		{
			onSearchComplete: searchComplete
		});

	// 计算
	$('#btnjs').click(async function (e) {
		// $('#btnjs').click(function (e) {
		// 阻止默认操作
		e.preventDefault();
		updateinput();
		let pointdatajson;
		// 判断总容量是否大于总人数
		if (sumrongliang >= sumrenshu) {
			if (distance.zhuangtai == 1) {
				// 监听pointdata[0].distance的长度，直到所有值都计算完成，才执行传参
				function listenFlagState() {
					if (distance.zhi.length == (sznum * aznum)) {
						console.log("pointdata---------", pointdata);
						pointdatajson = JSON.stringify(pointdata);
						// console.log("pointdatajson---------", pointdatajson);
						postpointdata();
						return;
					}
					requestAnimationFrame(listenFlagState);
				};
				listenFlagState();
			} else {
				console.log("pointdata---------", pointdata);
				// console.log("我是直线---------");
				pointdatajson = JSON.stringify(pointdata);
				// console.log("pointdatajson---------", pointdatajson);
				postpointdata();
			}

			// 打包后续传参
			function postpointdata() {
				$.ajax({
					url: "./upload",
					type: "POST",
					dataType: "json",
					data: pointdatajson,
					contentType: "application/json",
					processData: false,
					success: function (data) {
						// console.log(data);
						// 显示在文本框
						$('#divOutputPic').html("");
						if (data.message == "Done") {
							$('#taResult').text("计算完成啦！" + '\n' + "最近邻方法计算得到的疏散费用为：" + data.re.jieguo + '\n' + "疏散矩阵为：" + data.re.x + '\n' + "启发式算法计算得到的疏散费用为：" + data.re.transz + '\n' + "疏散矩阵为：" + data.re.transc + '\n' + "精确式算法计算得到的疏散费用为：" + data.re.objval + '\n' + "疏散矩阵为：" + data.re.resultx);
							// console.log(data.re);
							console.log("计算完成啦！");

							// 传入结果展示页面的对象
							pointdatare = {};
							pointdatareJSON = {};
							// 把点的信息和结果捆绑到一个对象里传入结果展示页面
							pointdatare.pointdata = pointdata;
							pointdatare.jieguo = data.re.jieguo;
							pointdatare.x = data.re.x;
							pointdatare.transz = data.re.transz;
							pointdatare.transc = data.re.transc;
							pointdatare.objval = data.re.objval;
							pointdatare.resultx = data.re.resultx;
							console.log("pointdatare", pointdatare);

						} else {
							$('#taResult').text('失败，理由为：' + data.re);
							console.log("Not done : " + data.re);
						}
					},
					error: function (err) {
						$('#divOutputPic').html("");
						$('#taResult').text('网络原因问题，主要原因为:[秘密]');
						console.log(err);
						// $('#btnUpload').attr('disabled', false);
					}
				});
			}
		} else {
			alert('容量不够，无法安置所有受灾人员！');
		}
	});

	$('#feixian').click(function (e) {
		listenFlagState();
		function listenFlagState() {
			if (JSON.stringify(pointdatareJSON) == "{}" && JSON.stringify(pointdatare) != "{}") {
				pointdatareJSON = JSON.stringify(pointdatare);
				console.log("pointdatareJSON----------", pointdatareJSON);
				$.ajax({
					url: "./feixiana",
					type: "POST",
					dataType: "json",
					data: pointdatareJSON,
					contentType: "application/json",
					processData: false,
					cache: false,
					ifModified: true,
				});
				return;
			}
			requestAnimationFrame(listenFlagState);
			pointdatareJSON = {};
		};

	});
});
