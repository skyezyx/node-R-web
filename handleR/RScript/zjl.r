library("rjson")
library("lpSolve")
library("gurobi")

funWF <- function(test){
  test <- fromJSON(test)
  # return(toJSON(test))
  
  # 解析数据，sink保存以下数据到文档
  # sink("output.txt",append=FALSE,split=TRUE)
  a=test$a
  b=test$b
  L=test$l
  out=test$anumber
  iin=test$bnumber
  a.number=test$anumber
  b.number=test$bnumber
  a.coord=matrix(test$acoord,ncol = 2,byrow = TRUE)
  b.coord=matrix(test$bcoord,ncol = 2,byrow = TRUE)

  if(test$distance==0){
    coord=rbind(a.coord,b.coord)
    distance=as.matrix(dist(coord))
    n=distance[1:a,(a+1):(a+b)]
    distances=n
  }else{
    dis=test$distance
    #构造距离矩阵
    distances=matrix(rep(0,a*b),nrow = a,byrow = TRUE)
    ii=1
    for (i in c(1:a)){
      for (j in c(1:b)){
        distances[i,j]=dis[ii]
        ii=ii+1
      }
    }
    n=distances
  }
  # print(paste("初始值:","a:",a,"b:",b,"out:",out,"iin:",iin,"a.coord:",a.coord,"b.coord:",b.coord))
 
  # 最近邻
  size=dim(n)
  x=matrix(c(rep(-1,size[1]*size[2])), nrow = size[1],ncol = size[2],byrow = TRUE)
  out1=out    
  iin1=iin
  n1=n
  while(1){
    min=which(n1 == min(n1), arr.ind = TRUE)  
    minrow=min[1,1]
    mincol=min[1,2]
    
    if( out1[minrow]>0 && iin1[mincol]>0 ){
      if( out1[minrow] > iin1[mincol] ){
        x[minrow,mincol] = iin1[mincol]                   
      }
      else{
        x[minrow,mincol] = out1[minrow]           
      }
      out1[minrow]=out1[minrow]-x[minrow,mincol]   
      iin1[mincol]=iin1[mincol]-x[minrow,mincol]
    }
    
    for (i in c(1:size[1])){
      if(out1[i]==0){
        out1[i]=-1
        for (j in c(1:size[2])) {
          n1[i,j]=max(n)+1
        }
      }
    }

    for (j in c(1:size[2])) {
      if(iin1[j]==0){
        iin1[j]=-1
        for (i in c(1:size[1])){
          n1[i,j]=max(n)+1
        }
      }
    }
    
    if(all(out1==-1)){
      break
    }
  }
  for (i in c(1:size[1])){
    for (j in c(1:size[2])) {
      if(x[i,j]==-1){
        x[i,j]=0
      }
    }
  }
  jieguo=sum(ceiling(x/L)*n)
  print(jieguo)
  print(x)
  # 返回结果列表
  data.output<-array(list('ok'),dimnames =list('ok'))
  data.output$jieguo<-jieguo
  data.output$x<-x


  # 启发式
  cost=distances
  row.signs=rep('=',a)#避灾人员全部安置
  row.rhs=floor(a.number/L)
  col.signs=rep('<=',b)#安置点容量可以有剩余
  col.rhs=floor(b.number/L)
  trans=lp.transport(cost,"min",row.signs,row.rhs,col.signs,col.rhs)
  #trans为最终最小花费的运输成本，trans$solution为运输方案
  print(trans)
  print(trans$solution)
  ## 剩余人数以及剩余容量
  a.number1=a.number-(rowSums(trans$solution)*L)
  b.number1=b.number-(colSums(trans$solution)*L)
  # 剩余人数的运输矩阵
  transb=matrix(rep(0,a*b),nrow = a)
  # 临时变量，记录是否分配结束
  a.number2=a.number1
  b.number2=b.number1
  repeat{
   # 按受灾点剩余人数从大到小排序
    ra.number1=sort(a.number2,decreasing = TRUE)
    # 当前人数最多的受灾点的位置
    anmax=which(a.number2==ra.number1[1])
    h=anmax[1] #即使存在一样的值，默认取第一个
    
    #按距离从小到大依次判断是否能一次性容纳该受灾点的剩余人数
    dish=sort(distances[h,])
    for (j in c(1:length(b.number))) {
      l=which(distances[h,]==dish[j],arr.ind = TRUE)
      
      #判断该安置点的容量是否大于受灾点的人数
      if(b.number2[l]>=a.number2[h]){
        b.number2[l]=b.number2[l]-a.number2[h]
        transb[h,l]=transb[h,l]+a.number2[h]
        a.number2[h]=0
        break
      }
    }
    
    # 不存在能一次性容纳该受灾点的安置点，则优先将大部分人进行转移
    if(a.number2[h]!=0){
      ll=which(b.number2==max(b.number2),arr.ind = TRUE)
      a.number2[h]=a.number2[h]-b.number2[ll[1]]
      transb[h,ll[1]]=transb[h,ll[1]]+b.number2[ll[1]]
      b.number2[ll[1]]=0
    }
    
    #结束条件
    if(any(a.number2)==0){
      break
    }
  }
  transc=transb+(trans$solution*L)
  transz=sum(ceiling(transc/L)*distances)
  data.output$transz<-transz
  data.output$transc<-transc

  # 精确式
  # 构建矩阵
  jz=matrix(rep(0,(a*b*4)*(a+b+a*b*4)),ncol = a*b*4,byrow = TRUE)
  # x:(a行a*b列+b行a*b列)
  for (i in c(0:(a-1))) {
    jz[(i+1),(i*b+1):(i*b+b)]=1
  }
  for (i in c(1:b)) {
    for (j in c(0:(a-1))) {
      jz[(a+i),(j*b+i)]=1
    }
  }
  # y:(a*b行a*b列)
  for (i in c(1:(a*b))) {
    jz[(a+b+i),i]=-1
    jz[(a+b+i),(a*b+i)]=L
    jz[(a+b+i),(2*a*b+i)]=1
  }
  # k:(a*b行a*b列)
  for (i in c(1:(a*b))) {
    jz[(a+b+a*b+i),(a*b*2+i)]=1
  }
 # z:(a*b*2行a*b列)
  for (i in c(1:(a*b))) {
    jz[(a+b+a*b*2+i),(a*b*2+i)]=1
    jz[(a+b+a*b*2+i),(a*b*3+i)]=-1
  }
  for (i in c(1:(a*b))) {
    jz[(a+b+a*b*3+i),(a*b*2+i)]=-1
    jz[(a+b+a*b*3+i),(a*b*3+i)]=L
  }
  #线性规划Gurobi求解
  model=list()
  model$obj=c(rep(0,a*b),c(t(distances)),rep(0,a*b),c(t(distances)))
  model$A=jz
  model$modelsense='min'
  model$sense=c(rep('=',a),rep('<=',b),rep('=',a*b),rep('<',a*b),rep('>=',a*b),rep('>=',a*b))
  model$rhs=c(a.number,b.number,rep(0,a*b),rep((L-1),a*b),rep(0,a*b*2))
  model$vtype=c(rep('I',a*b*3),rep('B',a*b))
  result=gurobi(model)
  resultx=matrix(c(result$x[1:(a*b)]),nrow = a,byrow = TRUE)
  data.output$objval<-result$objval
  data.output$resultx<-resultx
  return(toJSON(data.output))
}

# 测试数据
# cccc = { "ww": [3, 3, 8, 6, 3, 8, 10, 7, 0.353429951705039, 2.78037805622444, 2.67890369240195, 2.67128446279094, 0.966001375811175, 0.674962663091719, 2.53098861942999, 0.308997062500566, 1.20749394292943, 0.763942815363407, 0.271690940950066, 1.81726457015611] };
# # cccc = "[3,3,8,6,3,8,10,7,0.353429951705039,2.78037805622444,2.67890369240195,2.67128446279094,0.966001375811175,0.674962663091719,2.53098861942999,0.308997062500566,1.20749394292943,0.763942815363407,0.271690940950066,1.81726457015611]"
# res <- funWF(cccc)
# print(res)

