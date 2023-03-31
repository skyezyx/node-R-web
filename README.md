# node-R-web
 通过R语言的支持库Rserve实现R语言与其Nodejs的通信

环境配置：
1.安装R语言 
2.安装RServe 
3.安装Node.js 
4.安装express

启动RServe服务器的两种方式：
1.在命令行中启动RServe服务器，并打开远程访问模式(R CMD Rserve --RS-enable-remote)
2.在R运行环境中运行Rserver.R（位于handleR/RScript中）

依赖版本：
Node.js:16.14.0
Express:4.16.1
R:4.0.2
Rserve:R版本4.0.5 
RSclient:R版本4.0.5 