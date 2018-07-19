let express = require('express');



let path = require('path');


//引入验证码模块

let svgCaptcha =require('svg-captcha');

//引入express中的 session中间件 
let session = require('express-session');

// body-parser 中间件 获取post请求方式的参数
let bodyParser = require('body-parser');

// 导入自己的首页路由
let indexRoute = require(path.join(__dirname,'/route/indexRoute'));


//引入自己封装的工具包有查询跟增加 还有返回信息
let myT = require(path.join(__dirname,'tools/myT.js'));

//创建app-------------------
let app = express();

//设置静态支援管理
app.use(express.static('static'));

//使用session中间件 每个路由req对象中都多了一个session这属性
//每个路有中多了一个可以访问到的session属性 可以在他身上保存需要共享的属性;
app.use(session({
    //给session加密
    secret: 'keyboard cat'
  }))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// 使用 index路由中间件 挂载到 /index这个路径下面
app.use('/index',indexRoute);

// 导入 art-template
app.engine('art', require('express-art-template'));
app.set('views', '/static/views');



//路由1 -----------------
//当访问login页面的时候直接读取登录页面并且返回

app.get("/login",(req,res) => {
    //直接读取文件
    let url = path.join(__dirname,'static/views/login.html');

    res.sendFile(url);
})

//路由2
//验证验证码是否登录
app.post('/login',(req,res)=> {
    //接收数据 
    // console.log(req);
    let userName = req.body.username;
    let userPass = req.body.userpass;
    // console.log(userName)
    // console.log(userPass)c
   
    // 验证码
    let code = req.body.code;
    //验证数据

    if(code == req.session.captcha){
         //去数据库找是否有帐号密码
         myT.find('user',{userName,userPass},(err,docs) => {
            if(!err) {
                //保存帐号密码到session
                if(docs.length == 1) {

                    req.session.userInfo = {
                        userName
                    }
                    //回首页
                    myT.mess(res,'欢迎回来','/index');
                }else {
                    myT.mess(res,'账号名或者密码错误','/login');
                }

            }
         })
        // console.log('验证成功')
    }else {
        // console.log('验证失败')
        res.setHeader('content-type','text/html');
        res.send('<script>alert("验证失败");window.location.href="/login"</script>')
    }
})

//路由3
//生成验证码

app.get('/login/captchaImg',function(req,res){
    var captcha = svgCaptcha.create();
    // req.session.captcha = captcha.text;
    // console.log(captcha.text);
    //保存验证码的值 在session中 方便后续使用
    //为了验证简单转换成小写
    req.session.captcha = captcha.text.toLocaleLowerCase();
    res.type('SVG');
    res.status(200).send(captcha.data);
});

//路由4
//访问首页
// app.get('/index',(req,res) => {
//     //session 中有userInfo 就表示登录了 留在首页 
//     //反之回到登录页
//     if(req.session.userInfo) {

//         //读取首页
//         res.sendFile(path.join(__dirname,'static/views/index.html'));
//     }else{
//         //返回登录页
//         res.setHeader('content-type','text/html');
//         res.send("<script>alert('请登录');window.location.href='/login'</script>")
//     }
// })

//路由5
//登出
app.get('/logout',(req,res) => {
    //删除session中的userInfo
    delete req.session.userInfo;
    //返回登录页面
    res.redirect("/login");
})

//路由6
//展示注册页面
app.get('/register',(req,res) => {

    res.sendFile(path.join(__dirname,'static/views/register.html'));
})

//路由7
//
app.post('/register',(req,res) =>{

    //获取用户数据
    let userName = req.body.username;
    let userPass = req.body.userpass;

    myT.find('user',{userName},(err,docs) => {
        if(docs.length == 0) {
            myT.insert('user',{userName,userPass},(err,result) => {
                if(!err){
                    myT.mess(res,'注册成功','/login');
                } 
            })
        }else {
            myT.mess(res,'用户已被注册','/register');
        }
    })
    
})

//开始监听
app.listen(8848,'127.0.0.1',() => {
    console.log('success');
})