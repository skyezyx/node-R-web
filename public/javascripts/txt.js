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

var map = new BMap.Map("allmap");    // 创建Map实例
map.centerAndZoom(new BMap.Point(105.003765, 35.914850), 5);//地图缩放中心和级别
map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
// // 标注
// let textLayer = new mapvgl.TextLayer({
//     collides: false,
//     offset: [0, 20],
//     color: '#000',
//     fontFamily: 'PingFangSC-Medium',
// });

// 获得行政边界
//鼠标点击函数
$("#commitBtn").bind('click', function () {
    getBoundary($("#keyword").val());
});
function getBoundary(city) {
    var bdary = new BMap.Boundary();
    bdary.get(city, function (rs) {       //获取行政区域  
        map.clearOverlays();        //清除地图覆盖物         
        var count = rs.boundaries.length; //行政区域的点有多少个  
        if (count === 0) {
            alert('未能获取当前输入行政区域');
            return;
        }
        var pointArray = [];
        for (var i = 0; i < count; i++) {
            var ply = new BMap.Polygon(rs.boundaries[i], { strokeWeight: 2, strokeColor: "#ff0000" }); //建立多边形覆盖物  
            map.addOverlay(ply);  //添加覆盖物  
            pointArray = pointArray.concat(ply.getPath());
        }
        map.setViewport(pointArray);    //调整视野                   
    });
}

//得到文件内容
var arr1 = [];
var arr2 = [];
var slng = document.getElementById('slng').value;
var slat = document.getElementById('slat').value;
var srs = document.getElementById('srs').value;
var blng = document.getElementById('blng').value;
var blat = document.getElementById('blat').value;
var brl = document.getElementById('brl').value;
// 存放点图层的数据，以id来区分受灾点1和安置点2
var pointdata = [];
var renshunum = [];
let rongliangnum = [];
// 总人数和总容量
var sumrenshu;
var sumrongliang;
// 实际驾车距离
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

//得到文件内容
function readtxt(text, arr, a, b, c, color) {
    for (var i = 0; i < text.length - 1; i++) {
        if (i === 0) {
            continue;
        }
        var _ele = text[i].split(',');
        arr.push({ x: _ele[a], y: _ele[b], sx: _ele[c] });
    }
    //点大小参数：BMAP_POINT_SIZE_SMALLER ，BMAP_POINT_SIZE_NORMAL ，BMAP_POINT_SIZE_BIG
    plotpoints(arr, map, color, BMAP_POINT_SIZE_BIG);
}

var openFilea = function (event) {
    arr1 = [];
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function () {
        if (reader.result) {
            var text = reader.result
            text = text.split('\n');
            readtxt(text, arr1, slng, slat, srs, '#ff0033');
            console.log("arr1", arr1);
        }
    };
    reader.readAsText(input.files[0]);
};
var openFileb = function (event) {
    arr2 = [];
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function () {
        if (reader.result) {
            //得到文件内容
            var text = reader.result
            text = text.split('\n');
            readtxt(text, arr2, blng, blat, brl, '#32CD32');
            console.log("arr2", arr2);
        }
    };
    reader.readAsText(input.files[0]);
};

//地图上添加点
function plotpoints(ar, map, colo, siz) {
    var points = [];
    for (var i in ar) {
        var _data = new BMap.Point(ar[i].x, ar[i].y);
        points.push(_data);
    }
    if (document.createElement('canvas').getContext) {  // 判断当前浏览器是否支持绘制海量点
        var options = {
            size: siz,
            shape: BMAP_POINT_SHAPE_CIRCLE,
            color: colo
        }
        var pointCollection = new BMap.PointCollection(points, options);  // 初始化PointCollection
        pointCollection.addEventListener('click', function (e) {
            alert('单击点的坐标为：' + e.point.lng + ',' + e.point.lat);  // 监听点击事件
        });
        pointdatavalue();
        map.addOverlay(pointCollection);  // 添加Overlay
        // textLayer.setData(pointdata);
        // map.addLayer(textLayer);
    } else {
        alert('请在chrome、safari、IE8+以上浏览器查看本示例');
    }
}

$('#btnlx').click(function (e) {
    map.clearOverlays();
    getBoundary("合肥市");
    for (var i in arr1) {
        for (var i in arr2) {
            var start = new BMap.Point(arr1[i].x, arr1[i].y);
            var end = new BMap.Point(arr2[i].x, arr2[i].y);
            var driving = new BMap.DrivingRoute(map, {
                renderOptions: {
                    map: map,
                    autoViewport: true
                }
            });
            driving.search(start, end);
        }
    }
})

$('#btnonelx').click(function (e) {
    map.clearOverlays();
    getBoundary("合肥市");
    var driving = new BMap.DrivingRoute(map, {
        renderOptions: {
            map: map,
            autoViewport: true
        }
    });
    for (var i in arr1) {
        for (var i in arr2) {
            var start = new BMap.Point(arr1[i].x, arr1[i].y);
            var end = new BMap.Point(arr2[i].x, arr2[i].y);

            driving.search(start, end);
        }
    }
})

// 赋值给pointdata
async function pointdatavalue() {
    pointdatare = {};
    // 计算总人数和总容量
    sumrenshu = 0;
    sumrongliang = 0;
    sznum = 0;
    aznum = 0;
    // 更新input框的内容，拆分  
    var zaikeliang = document.getElementById('zaikeliang').value;

    for (let index = 0; index < arr1.length; index++) {
        var stringanum = `受灾点${(index + 1)}`;
        sznum = sznum + 1;
        pointdata.push({
            geometry: {
                type: 'Point',
                coordinates: [arr1[index].x, arr1[index].y],
                count: parseInt('1'),
                numr: arr1[index].sx,
                zaike: zaikeliang
            },
            properties: {
                text: stringanum,
                a: (index + 1)
            },
        });
        sumrenshu = sumrenshu + parseInt(arr1[index].sx);
    };
    for (let index = 0; index < arr2.length; index++) {
        var stringbnum = `避灾点${(index + 1)}`;
        aznum = aznum + 1;
        pointdata.push({
            geometry: {
                type: 'Point',
                coordinates: [arr2[index].x, arr2[index].y],
                count: parseInt('2'),
                numr: arr2[index].sx,
                zaike: zaikeliang
            },
            properties: {
                text: stringbnum,
                a: (index + 1)
            },
        });
        sumrongliang = sumrongliang + Number(arr2[index].sx);
    };
    console.log("pointdata", pointdata);
}

// 计算总人数、总容量等input框的内容
function updateinput() {
    pointdatavalue();
    // 后端采用驾车距离
    if ($("#cardistance").get(0).checked) {
        distance.zhuangtai = 1;
        distance.zhi = [];
        // 计算每个受灾点到安置点的距离
        for (let i = 0; i < arr1.length; i = i + 1) {
            for (let j = 0; j < arr2.length; j = j + 1) {
                var start = new BMap.Point(arr1[i].x, arr1[i].y);
                var end = new BMap.Point(arr2[i].x, arr2[i].y);
                //根据起始点经纬度坐标开始驾车路线规划
                transit.search(start, end);
            }
        }
        console.log("distance", distance);
        pointdata[0].geometry.distance = distance.zhi;
    } else {
        distance.zhuangtai = 0;
        distance.zhi = [0];
        pointdata[0].geometry.distance = distance.zhi;
    }
}

// 驾车路线规划
var transit = new BMap.DrivingRoute(map, {
    onSearchComplete: function (results) {
        // 判断是否检索成功
        if (transit.getStatus() != BMAP_STATUS_SUCCESS) {
            console.log("路线计算失败！");
            return;
        }
        //DrivingRouteResult的方法，返回索引指定的方案
        var plan = results.getPlan(0);
        var zhi = plan.getDistance(false);
        // 按行存入
        distance.zhi.push(zhi);
        console.log("distance.zhi", distance.zhi)
    }
});

// 计算
$('#btnjs').click(async function (e) {
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
                url: "./uploada",
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
                        $('#taResult').text("计算完成啦！" + '\n' + "最近邻方法计算得到的疏散费用为：" + data.re.jieguo + '\n' + "疏散矩阵为：" + data.re.x + '\n' + "启发式算法计算得到的疏散费用为：" + data.re.transz + '\n' + "疏散矩阵为：" + data.re.transc + '\n');
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