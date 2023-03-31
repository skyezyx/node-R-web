library(Rserve) 
Rserve()

library(RSclient)
  conn2<-RS.connect()#建立一个本地连�?
  # RS.eval(conn2,rnorm(100))