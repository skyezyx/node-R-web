// 显示面板开关
function togglePanel() {
    let classList = document.querySelector('.panel').classList;
    if (classList.contains('hide')) {
        classList.remove('hide');
        classList.add('show');
    } else {
        classList.remove('show');
        classList.add('hide');
    }
}
$(() => {
    $.ajax({
        url: "./feixianaa",
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        processData: false,
        success: function (data) {
            // 解析结果数据，分为点数据，成本，分配矩阵
            console.log("data------------", data);
            var acourt = 0;
            var bcourt = 0;
            var anumbernum = [];
            var bnumbernum = [];
            var acoordnum = [];
            var bcoordnum = [];
            for (let index = 0; index < data.pointdata.length; index++) {
                if ((data.pointdata[index].geometry.count % 2) == 1) {
                    acourt = acourt + 1;
                    anumbernum.push(parseInt(data.pointdata[index].geometry.numr));
                    acoordnum.push(data.pointdata[index].geometry.coordinates[0]);
                    acoordnum.push(data.pointdata[index].geometry.coordinates[1]);
                } else {
                    bcourt = bcourt + 1;
                    bnumbernum.push(parseInt(data.pointdata[index].geometry.numr));
                    bcoordnum.push(data.pointdata[index].geometry.coordinates[0]);
                    bcoordnum.push(data.pointdata[index].geometry.coordinates[1]);
                }
            };
            var cccc = {
                a: acourt,
                b: bcourt,
                anumber: anumbernum,
                bnumber: bnumbernum,
                acoord: acoordnum,
                bcoord: bcoordnum,
            };
            console.log("cccc", cccc);

            // 初始化地图
            let map = initMap({
                tilt: 0,
                heading: 0,
                center: [cccc.acoord[0], cccc.acoord[1]],
                zoom: 12,
                style: snowStyle,
                skyColors: [
                    // 地面颜色
                    'rgba(226, 237, 248, 0)',
                    // 天空颜色
                    'rgba(186, 211, 252, 1)'
                ]
            });
            // 创建view
            let view = new mapvgl.View({
                map,
            });
            // 线图层
            let curve = new mapvgl.OdCurve();
            let lineLayer = new mapvgl.LineLayer({
                width: 4,
            });
            view.addLayer(lineLayer);
            // 动画飞线效果
            let flowLineLayer = new mapvgl.LineFlowLayer({
                color: 'rgb(255, 255, 0)', // 飞线动画颜色
                step: 0.2,
            });
            // 点图层
            let pointLayer = new mapvgl.PointLayer({
                size: 15,
            });
            view.addLayer(pointLayer);
            // 排行文字
            let indexLayer = new mapvgl.TextLayer({
                depthTest: false,
                offset: [0, 0],
                padding: [0, 0],
            });
            view.addLayer(indexLayer);
            // 目的地
            let textLayer = new mapvgl.TextLayer({
                collides: false,
                offset: [0, 20],
                color: '#000',
                fontFamily: 'PingFangSC-Medium',
            });
            view.addLayer(textLayer);
            // 目的地
            let textLayera = new mapvgl.TextLayer({
                collides: false,
                offset: [0, 20],
                color: '#000',
                fontFamily: 'PingFangSC-Medium',
            });
            // view.addLayer(textLayera);

            let isAnimate = false;
            let colors = ['#ffa000', '#ff6000', '#ff2000', '#FF33FF', '#00ff40', '#40a0ff'];
            // 起点坐标和终点坐标
            let startCities = [];
            let endCities = [];
            let lastStart;
            let lastEnd;

            var results = {
                cost: data.transz,
                juzhen: data.transc
            }
            updatecoord();
            updateview();
            // 点击button更新结果数据
            $('#zjl').click(function (e) {
                results = {
                    cost: data.jieguo,
                    juzhen: data.x
                }
                updatecoord();
                updateview();
            });
            $('#qfs').click(function (e) {
                results = {
                    cost: data.transz,
                    juzhen: data.transc
                }
                updatecoord();
                updateview();
            });
            $('#jqs').click(function (e) {
                results = {
                    cost: data.objval,
                    juzhen: data.resultx
                }
                updatecoord();
                updateview();
            });
            // 计算起点坐标和终点坐标
            function updatecoord() {
                // acoord和cccc.acoord相同，但为字符串格式
                var acoord = [];
                for (let i = 0; i < cccc.acoord.length; i = i + 2) {
                    var s = String(cccc.acoord[i]) + "," + String(cccc.acoord[(i + 1)]);
                    acoord.push(s)
                }
                var bcoord = [];
                for (let i = 0; i < cccc.bcoord.length; i = i + 2) {
                    var s = String(cccc.bcoord[i]) + "," + String(cccc.bcoord[(i + 1)]);
                    bcoord.push(s)
                }

                // 起点坐标和终点坐标
                startCities = acoord;
                endCities = [];
                // 有几个起点对应终点有几组
                for (let i = 0; i < acoord.length; i++) {
                    endCities.push([]);
                }
                for (let i = 0; i < results.juzhen.length; i++) {
                    if (results.juzhen[i] != 0) {
                        var hang = (i % cccc.a);
                        var lie = parseInt(i / cccc.a);
                        endCities[hang].push(bcoord[lie]);
                        console.log("i", i);
                        console.log("hang", hang);
                        console.log("lie", lie);
                    }
                }
                console.log("endCities", endCities);

            }
            // 更新地图视图以及文本框
            function updateview() {
                // 赋值给文本框
                $('#cost').text("此次疏散的费用为：" + results.cost + '\n' + "疏散矩阵为：" + results.juzhen);
                lastStart = startCities.join('；');
                lastEnd = endCities.map(cities => cities.join('，')).join('；\n');
                document.getElementById('origin').value = lastStart;
                document.getElementById('destination').value = lastEnd;

                createLines(startCities, endCities);
            }

            // 更改数据后重新生成飞线
            $('#changeLine').click(function (e) {
                let startList = document.getElementById('origin').value;
                let endList = document.getElementById('destination').value;
                // 判断是否对起始点进行了更改
                if (lastStart === startList && lastEnd === endList) {
                    return;
                }
                lastStart = startList;
                lastEnd = endList;
                startCities = startList.split('；');
                endCities = endList.split('；').map(item => item.replace(/\n| /g, '').split('，'));
                createLines(startCities, endCities);
            });

            // 创建OD飞线效果
            function createLines(startCities, endCities) {
                // let instances = [];
                let cityMap = getStartEndMap(startCities, endCities);
                let lineData = [];
                let pointData = [];
                let pointDataa = [];
                let indexData = [];

                // 图层数据
                Object.keys(cityMap).forEach((city, index) => {
                    let option = {
                        isAnimate,
                        lineColor: colors[index],
                        indexColor: '#fff',
                    };

                    let data = createODLineData(city, cityMap[city], index, option);
                    lineData = lineData.concat(data.lineData);
                    pointData = pointData.concat(data.pointData);
                    pointDataa = pointDataa.concat(data.pointDataa);
                    indexData = indexData.concat(
                        data.pointData.map((item, index) => ({ geometry: item.geometry, properties: { text: index } })).slice(1)
                    );
                });

                lineLayer.setData(lineData);
                flowLineLayer.setData(lineData.map((item, index) => ({ geometry: item.geometry, properties: { color: '#fff' } })));
                pointLayer.setData(pointData);
                // console.log(pointData);
                textLayer.setData(pointData);
                textLayera.setData(pointDataa);
                indexLayer.setData(indexData);
            }
            // 创建飞线数据
            function createODLineData(startCity, endCities, num, option) {
                let {
                    isAnimate,
                    lineColor = '#f00',
                    lineWidth,
                    showText = true,
                } = option;

                // let textData = [];
                let pointData = [];
                let pointDataa = [];
                let lineData = [];
                let layers = [];

                // 起点数据
                let startPoint = startCity.split(',');
                var aaa;
                for (var i = 0; i < data.pointdata.length; i++) {
                    if (startPoint[0] == data.pointdata[i].geometry.coordinates[0] && startPoint[1] == data.pointdata[i].geometry.coordinates[1]) {
                        var a = data.pointdata[i].properties.a;
                        aaa = `受灾点${a}`;
                    }
                }
                pointData.push({
                    geometry: {
                        type: 'Point',
                        coordinates: [startPoint[0], startPoint[1]],
                    },
                    properties: {
                        text: aaa,
                        // texta: startCity,
                        color: lineColor,
                        size: 15
                    },
                });
                pointDataa.push({
                    geometry: {
                        type: 'Point',
                        coordinates: [startPoint[0], startPoint[1]],
                    },
                    properties: {
                        text: startCity
                    },
                });

                // 终点
                endCities.forEach((item, index) => {
                    // 终点数据
                    let endPoint = item.split(',');
                    // 设置曲线经过点的坐标数组
                    curve.setOptions({
                        points: [startPoint, endPoint],
                    });
                    let curveModelData = curve.getPoints(20);   //传入的参数为曲线分段数
                    lineData.push({
                        geometry: {
                            type: 'LineString',
                            coordinates: curveModelData,
                        },
                        properties: {
                            color: lineColor,
                        },
                    });
                    var bbb;
                    for (var i = 0; i < data.pointdata.length; i++) {
                        if (endPoint[0] == data.pointdata[i].geometry.coordinates[0] && endPoint[1] == data.pointdata[i].geometry.coordinates[1]) {
                            var a = data.pointdata[i].properties.a;
                            bbb = `避灾点${a}`;
                        }
                    }
                    pointData.push({
                        geometry: {
                            type: 'Point',
                            coordinates: [endPoint[0], endPoint[1]],
                        },
                        properties: {
                            text: bbb,
                            // texta: endCities[index],
                            color: lineColor,
                            size: 20
                        },
                    });
                    pointDataa.push({
                        geometry: {
                            type: 'Point',
                            coordinates: [endPoint[0], endPoint[1]],
                        },
                        properties: {
                            text: endCities[index],
                        },
                    });
                });

                return {
                    lineData,
                    pointData,
                    pointDataa,
                    destroy() {
                        layers.forEach(layer => view.removeLayer(layer));
                    },
                    animate(flag) {
                        if (flag !== isAnimate) {
                            isAnimate = flag;
                            if (!flag) {
                                view.removeLayer(flowLineLayer);
                            } else {
                                view.addLayer(flowLineLayer);
                            }
                        }
                    },
                };
            }
            // 起始点对应
            function getStartEndMap(startCities, endCities) {
                let map = {};
                startCities.forEach((city, index) => {
                    let cities = endCities[index];
                    cities = cities.filter(city => city);

                    if (map[city]) {
                        map[city] = Array.from(new Set(map[city].concat(cities)));
                    } else {
                        map[city] = cities;
                    }
                });

                // 数组错误
                console.log("map:", map);
                return map;
            }

            // 动画开关：flowLineLayer
            $('#animate').click(function (event) {
                isAnimate = event.target.checked;
                if (isAnimate) {
                    view.addLayer(flowLineLayer);
                } else {
                    view.removeLayer(flowLineLayer);
                }
            });
            // 是否显示点的文本标注
            $('#coord').click(function (event) {
                !event.target.checked ? view.removeLayer(textLayera) : view.addLayer(textLayera);
                !event.target.checked ? view.addLayer(textLayer) : view.removeLayer(textLayer);
            });

            // 生成具体驾车路线
            $('#drivingroute').click(function (e) {
                var s = prompt("请输入选择的受灾点的序号：", "1");
                var a = prompt("请输入选择的安置点的序号：", "1");
                for (var i = 0; i < data.pointdata.length; i++) {
                    if ((data.pointdata[i].geometry.count) % 2 == 1) {
                        if (s == data.pointdata[i].properties.a) {
                            var spoint = new BMapGL.Point(data.pointdata[i].geometry.coordinates[0], data.pointdata[i].geometry.coordinates[1]);
                        }
                    } else {
                        if (a == data.pointdata[i].properties.a) {
                            var apoint = new BMapGL.Point(data.pointdata[i].geometry.coordinates[0], data.pointdata[i].geometry.coordinates[1]);
                        }
                    }
                }
                console.log(spoint);
                console.log(apoint);

                //根据起始点经纬度坐标开始驾车路线规划
                transit.search(spoint, apoint);
            });
            // 驾车路线规划
            var transit = new BMapGL.DrivingRoute(map,
                {
                    renderOptions: { map: map },
                });


        },
        error: function (err) {
            $('#cost').text('网络原因问题，主要原因为:[秘密]');
            console.log(err);
        },
        cache: false,
        ifModified: true
    });
})
