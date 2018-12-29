### mode 
* production 模式
提供了发布程序时的优化配置项，旨在更小的产出文件、更快的运行速度、不暴露源码和路径。会默认采用代码压缩(minification)，作用域提升(scope hoisting)，tree-shaking，NoEmitOnErrorsPlugin(打包过程中报错，不会退出),无副作用模块修建(side-effect-redd module pruning)等。
* development 模式
旨在提升开发调试过程中的体验，如更快的构建速度、调试时的代码易读性、暴露运行时的错误信息等。会默认采用bundle的输出包含路径名和eval-source-map等，提升代码的可读性和构建速度；
### 插件和优化
* webpack4删除了CommonsChunkPlugin插件，它使用内置API`optimization.splitChunks`和`optimization.runtimeChunk`
> 1、NoEmitOnErrorsPlugin废弃，使用`optimization.noEmitOnErrors`代替，在生产环境中默认开启  
2、ModuleConcatenationPlugin废弃，使用`optimization.concatenateModules`代替，在生产环境下默认开启  
3、NamedModulesPlugin废弃，使用`optimization.namedModules`代替，生产环境下默认开启  
4、uglifyjs-webpack-plugin 生产环境下默认开启

* 提取Css，ExtractTextWebpackPlugin 和 mini-css-extract-plugin
> 这两个插件都是用于提取css到独立的文件，`ExtractTextWebpackPlugin`是webpack V4前大家都使用的插件，现在也支持webpack V4(不过在使用的时候发现有时会生成一些空的css文件)，而`mini-css-extract-plugin`是一个轻量级易于使用的基于webpack V4的插件，使用后感觉性能更好。

### DllPlugin 和 DllReferencePlugin 插件，来实现动态链接库思想的优化；

使用的时候`output`中要添加library字段，指定打包后的js暴露处对象
> `DllPlugin`：是将第三方库等不经常变动的js打包成动态链接库映射文件`manifest.json`，，使用的时候需要预先将生成的js引入到页面中去  
`DllReferencePlugin`：将生成的动态链接库与逻辑代码中使用的时候相关联，通过`mainifest.json`文件

例子：  
Dllplugin 打包的例子
```
const path=require('path');
const DllPlugin =require('webpack/lib/DllPlugin');
const CleanWebpackPlugin=require('clean-webpack-plugin');

module.exports={
    mode:'development',
    entry:{
        react:['react','react-dom'],
        jquery:['jquery']
    },
    output:{
        filename:'[name].dll.js',
        path:path.resolve(__dirname,'../dist/lib'),
        library:'_dll_[name]'
    },
    plugins:[
        new CleanWebpackPlugin(['dist/lib'],{
            root:path.resolve(__dirname,'../')
        }),
        new DllPlugin({
            name:'_dll_[name]',//这个名字要和output.library字段值保持一致
            path:path.resolve(__dirname,'../dist/lib','[name].manifest.json')
        })
    ]
}
```
动态链接库的使用例子：
```
var path=require('path');
var CleanWebpackPlugin=require('clean-webpack-plugin');
var HtmlWebpackPlugin=require('html-webpack-plugin');
var DllReferencePlugin =require('webpack/lib/DllReferencePlugin');
module.exports={
    entry:{
        app:'./src/index.js'
    },
    output:{
        path:path.resolve(__dirname,'../dist'),
        filename:"[name].bundle.js"
    },
    module:{
        rules:[
            {
                test:/.js$/,
                use:'babel-loader',
                exclude:path.resolve(__dirname,'../node_modules/'),
                include:path.resolve(__dirname,'../src/')
            },
            {
                test:/.css$/,
                use:['style-loader','css-loader'],
                exclude:path.resolve(__dirname,'../node_modules/'),
                include:path.resolve(__dirname,'../src/')
            },
            {
                test:/.(png|jpg|gif|svg)$/,
                use:{
                    loader:'file-loader',
                    options:{
                        name:"[name].[ext]",
                        publicPath:'./img',
                        outputPath:'../dist/img'
                    }
                }
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template:path.resolve(__dirname,'../src/index.html'),
            filename:'index.html'
        }),
        new DllReferencePlugin({
            manifest:path.resolve(__dirname,'../dist/lib/jquery.manifest.json')
        }),
        new DllReferencePlugin({
            manifest:path.resolve(__dirname,'../dist/lib/react.manifest.json')
        })
    ]
}
```
### 多进程处理编译工作 HappyPack，用于管理任务和管理线程的事情，以下是需要修改的两处代码
  * 在loader配置中，对所有文件处理都交给`happypack/loader`，使用紧跟其后的`querystring?id=babel`去告诉`happypack/loader`选择哪个`happypack`实例处理文件；
  * 在Plugin配置中新增了两个HappyPack实例，分别用于告诉`happypack/loader`如何处理js和css文件。选项中的id属性的值就是和querystring中`?id=babel`对应，选项中的`loaders`属性和`loader`配置中一样；

在实例化HappyPack插件时，除了可以传入id和loader两个参数，还可以传入以下参数；
> threads:代表开启几个子进程去处理这一类型的问价，默认是开启3个，必须是整数  
verbose:是否允许happypack输出日志，默认是true；  
threadPool:代表共享进程池，即多个happypack实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多


代码如下：
```
var path = require('path');
var HappyPack = require('happypack');
var ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
var happyThreadpool = HappyPack.ThreadPool({ size: 5 });
module.exports = {
    mode: 'development',
    entry: {
        app: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: "[name].bundle.js"
    },
    module: {
        rules: [
            {
                test: /.js$/,
                use: ['happypack/loader?id=babel'],
                exclude: path.resolve(__dirname, '../node_modules/'),
                include: path.resolve(__dirname, '../src/')
            },
            {
                test: /.css$/,
                use: ExtractTextWebpackPlugin.extract({
                    use: ['happypack/loader?id=css']
                }),
                exclude: path.resolve(__dirname, '../node_modules/'),
                include: path.resolve(__dirname, '../src/')
            },
            {
                test: /.(png|jpg|gif|svg)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: "[name].[ext]",
                        publicPath: './img',
                        outputPath: '../dist/img'
                    }
                }
            }
        ]
    },
    plugins: [
        new HappyPack({
            id: 'babel',
            loaders: ['babel-loader'],
            threadPool: happyThreadpool
        }),
        new HappyPack({
            id: 'css',
            loaders: ['css-loader'],
            threadPool: happyThreadpool
        }),
        new ExtractTextWebpackPlugin({
            filename: "css/style.css"
        })
    ]
}
```
### HappyPack工作原理

在整个Webpack构建流程中，最耗时的流程可能就是Loader对文件的转换操作了，因为要转换的文件数量巨大，而且这些转换操作都只能一个个地处理，HappyPack的核心原理就是将这部分任务分解到多个进程去并行处理，从而减少总的构建时间。  
从前面的代码中可以看出，所有需要通过Loader处理的文件都先交给了`happypack/loader`去处理，在收集到这些文件的处理权后，HappyPack就可以统一分配了。  
每通过`new HappyPack()`实例化一个HappyPack,其实就是告诉HappyPack核心调度器如何通过一系列Loader去转换一类文件，并且可以指定如何为这类转换操作分配子进程。  
核心调度的逻辑代码在主进程中，也就是运行着Webpack的进程中，核心调度器会将一个个任务分配给当前空闲的子进程，子进程处理完毕后将结果发送给核心调度器，它们之间的数据交换是通过进程间的通信API实现的。  
核心调度器收到来自子进程处理完毕的结果后，会通知Webpack该文件已处理完毕；

### Watch 文件监听 这个监听是webpack提供的

webpack官方提供了量大模块，一个是核心的`webpack`，一个是`webpack-dev-server` ,监听文件是`webpack`提供的，而刷新是`webpack-dev-server`提供的 

例子：
```
module.export={
    mode:'development',
    watch:true,
    watchOptions:{
        //不监听的文件或文件夹，支持正则，默认为空
        ignored:/node_modules/,
        //监听到变化发生后等300ms(默认值)再去执行动作，截流，防止文件更新太快而导致重新编译频率太快
        aggregateTimeout:300,
        //判断文件是否发生变化是通过不停地询问系统指定文件有没有变化实现的，默认每秒询问1000次,
        poll:1000
    }
}
```
文件监听的工作原理
> webpack会从配置Entry文件出发，递归解析出Entry文件所依赖的文件，将这些依赖的文件都加入监听列表中；由于保存文件的路径和最后的编译时间需要占用内存，定时检查周期检查需要占用CPU及文件I/O,所以最好减少需要监听的文件数量和降低检查频率

### 自动刷新的原理

控制浏览器刷新有如下三种方法：
1. 借助浏览器扩展去通过浏览器提供的接口刷新，WebStorm IDE的`LiveEdit`功能就是这样实现的；
2. 向要开发的网页中注入代理客户端代码，通过代理客户端去刷新整个页面。
3. 将要开发的网页装进一个iframe中，通过刷新iframe去看到最新效果；

DevServer支持2、3种方法，第二种是DevServer默认采用的刷新方法。

### 热模块替换

DevServer 还支持一种叫做模块热替换(Hot module Replacement)的技术可在不刷新整个网页的情况下做到超灵敏实时预览。原理是在一个源码发生变化时，只需重新编译发生变化的模块，再用新输出的模块替换掉浏览器中对应的老模块。

模块热替换技术的优势如下：
* 实时预览反应更快，等待时间更短。
* 不刷新浏览器能保留当前网页的运行状态，例如在使用`Redux`管理数据的应用中搭配模块热替换能做到在代码更新时Redux中的数据保持不变；总的来说，热模块替换技术在很大成都上提升了开发效率和体验；

Devserver默认不会开启模块热替换模式，要开启该模式，则只需要在启动时带上参数--hot，完整命令是`webpack-dev-server --hot`,或者在webpack中devServer配置项中进行配置；  
除了设置`--hot`参数外，还需要介入Plugin,相关代码如下：
```
var path=require('path');
var webpack=require('webpack');
module.exports={
    entry:'./src/index.js',
    output:{
        filename:'bundle.js',
        path:path.resolve(__dirname,'./dist')
    },
    devServer:{
        port:8082,//端口号
        open:true,//自动启动浏览器
        hot:true//需要设置成true
    },
    plugins:[
        new webpack.HotModuleReplacementPlugin()//需要添加该插件,作用就是实现模块热替换的
    ]
}
```
到此为止，热替换已经启动，现在修改下样式文件保存，就能看到无刷新替换了，使用该功能样式不能用`extract-text-webpack-plugin`进行提取，否则将热替换将不起作用；

但是修改index.js文件时，我们会发现模块热替换没有生效，而是整个页面进行刷新；为什么会出现这种情况呢？
> 为了让使用者在使用模块热替换功能时能灵活地控制老模块被替换时的逻辑，Webpack允许在源码中定义一些代码去做相应的处理。

修改index.js文件如下：
```
import React from 'react';
import ReactDOM from 'react-dom';
import App from './component/app';
import '../css/style.css';

ReactDOM.render(<App/>,document.getElementById('root'));
//增加一下代码：
//只有当开启了模块热替换时`module.hot`才存在
if(module.hot){
    //accept函数的第一个参数指出当前文件接受哪些子模块的替换，这里表示只接受./component/app这个子模块；
    //第二个参数用于在新的子模块加载完毕后需要执行的逻辑
    module.hot.accept(['./component/app',()=>{
    //在新的AppComponent加载成功后重新执行组件渲染逻辑
        ReactDOM.render(<App/>,document.getElementById('root'));
    }])
}
```
其中的`module.hot`是当开启热替换后注入全局的API，用于控制模块热替换的逻辑。现在修改app.js内容，发现模块热替换生效了。但是我们修改入口index.js文件后，发现整个网页刷新了，为什么有不一样的表现呢；
> 其原因在于当子模块发生变化时，更新事件会一层层地向上传递，也就是从app.js文件传递到了main.js文件，只到有某层的文件接收了当前变化的模块，即index.js文件中定义的`module.hot.accept(['./component/app'],callback)`，这时就会调用`callback`函数去执行自定义逻辑。如果事件一直往上抛，到最外层都没有文件接收它，则会直接刷新网页；

为什么没有地方接收.css文件，但是修改所有的css文件都会触发模块热替换呢？
> 原因在于style-loader会注入用于接收CSS的代码。

最后注意，不要将模块热替换用于线上环境，它是专门为提升开发效率而生的；

### 接入CDN
* 什么是CDN
> CDN(内容分发网络)的作用就是加速网络传输，通过将资源部署到世界各地，使用户在访问时按照就近原则从离其最近的服务器获取资源，来加快资源的获取速度；  
CDN其实是通过优化物理链路层传输过程中的光速有限、丢包等问题来提升网速的；  
==注意：浏览器有一个规则，在同一时刻针对同一个域名的资源的并行请求有限制(大概4个左右，不同浏览器可能不同)，将资源分开放置，用不同的域名访问；==  
==注意：使用多个域名后又有个新的问题：增加域名解析时间，对于是否采用多域名分散资源，需要根据自己的需求去衡量得失。当然可以在HTML HEAD标签加入<link rel="dns-prefetch" href="//js.cdn.com">预解析域名，以减少域名解析带来的问题；==
* 构建需要实现以下几点：
  * 静态资源的导入URL需要变成指向CDN服务的绝对路径的URL，而不是相对于HTML文件的URL
  * 静态资源的文件名需要带上由文件内容算出来的Hash值，以防止被缓存。
  * 将不同类型的资源放到不同域名的CDN服务上，以防止资源的并行加载被阻塞。
 * 代码配置
 ```
 const path=require('path');
 const ExtractTextPlugin=require('extract-text-webpack-plugin');
 const {WebPlugin}=require('web-webpack-plugin');
 module.exports={
     entry:'./src/index.js',
     output:{
        //为输出的javascript文件名加上hash值
         filename:'[name]_[chunkhash:8].js',
         path:path.resolve(__dirname,'./dist'),
         //指定存放Javascript文件的CDN目录URL
         publicPath:'//js.cdn.com/id/'
     }，
     module:{
         rules:[
         {
             test:/\.css$/,
             //提取Chunk中的Css代码到单独的文件中
             use:ExtractTextPlugin.extract({
                //压缩CSS use:['css-loader?minimize'],
                publicPath:'//img.cdn.com/id'
             })
         },{
             //增加对PNG文件的支持
             test:/\.png$/,
             //为输出的PNG文件名加上Hash值
             use:['file-loader?name=[name]_[hash:8].[ext]']
         },
         //省略其他loader配置
         ]
     }，
     plugins:[
     //使用Webplugin自动生成HTML
     new WebPlugin({
         //HTML模版文件所在的文件路径
         template:'./template.html',
         //输出的HTML的文件名
         filename:'index.html',
         //指定存放CSS文件的CDN目录URL
         stylePublicPath:'//css.cdn.com/id/'
     }),
     new ExtractTextPlugin({
         //为输出的CSS文件名加上Hash值
         filename:'[name]_[contenthash:8].css'
     })
     ]
 }
 ```
 以上代码中核心的部分是通过publicPath参数设置存放静态资源的CDN目录URL。为了让不同类型的资源输出到不同的CDN，需要分别进行如下设置。
 > 1、在output.publicPath中设置javascript的地址  
 2、在css-loader.publicPath中设置被CSS导入的资源地址。  
 3、在WebPlugin.stylePublicPath中设置CSS文件的地址。
 
 ### Tree Shaking
 > Tree Shaking 可以用来剔除JavaScript中用不上的死代码。它依赖静态的ES6模块化语法，例如通过import和export导入、导出,ES5的module.exports和require 是不行的；
 
 1、方法一：  
 webpack4 实现该功能，只需要将`mode`设置成`production`模式即可，或者启动webpack命令的时候加上`--optimize-minimize`参数，都会在` webpack` 内部调用 `UglifyJsPlugin`,达到目的
 
 2、方法二：  
 首先，为了将采用ES6模块的代码提交给Webpack，需要配置Babel以让其保留ES6模块化语句。修改.babelrc代码如下：  
 ```
 {
     "presets":[
     "env",
     {
         "modules":false
     }
     ]
 }
 ```
 其中，`"modules":false`的含义是关闭Babel的模块转换功能，保留原本的ES6模块化语法。  
 命令：`webpack `时加上`--display-used-exports`参数，以方便准总Tree Shaking的工作，到这一步Webpack只能判断处哪些模块用到，哪些没有用，但打包后没用的代码还存在；  
 想要剔除没用的代码，还得经过`UglifyJ
 s`处理一遍，要介入`UglifyJS`,也很简单，启动Webpack时加上`--optimize-minimize`参数；
 
 注意：项目中使用大量的第三方库时，我们会发现Tree Shaking 似乎不生效了，原因是大部分Npm中的代码都采用了CommonJS语法，这导致Tree Shaking无法正常工作而降级处理。但幸运的是，有些库考虑到了这一点，会采用两份代码，一份采用CommonJS模块化语法，一份采用ES6模块化语法。并且在package.json文件中分别指出这两份代码的入口。  
 以redux库为例，其发布到Npm上的目录结构为：  
``` 
node_modules/redux  
|--es
|  |--index.js #采用ES6模块化语法
|--lib
|  |--index.js #采用ES5模块化语法
|--package.json
 
 ```
 在package.json文件中有两个字段：
 ```
 {
     "main":"lib/index.js",//指采用CommonJS模块化的代码入口
     "jsnext:main":"es/index.js" //指明采用ES6模块化代码入口
 }
 ```
 为了让Tree Shaking对redux生效，需要配置Webpack的文件寻找规则如下：
 ```
 module.exports={
     resolve:{
        //针对Npm中的第三方模块优先采用jsnext:main中指向的ES6模块化语法的文件
        //如果不存在jsnext:main，就会采用browser或则main并将其作为入口；
         mainFields:['jsnext:main','browser','main']
     }
 }
 ```
 
 ### 按需加载
 1. 为什么要按需加载 

&emsp;&emsp;随着互联网的发展，一个网页需要承载的功能越来越多，采用单页应用作为前端架构的网站面临着网页需要加载的代码量很大的问题，因为许多功能都被集中做到了一个html里，这回导致网页加载缓慢、交互卡顿，用户体验非常糟糕。  
&emsp;&emsp;导致这个问题的原因在于一次性加载所有功能对应的代码，但其实用户在每个阶段只可能使用其中一部分功能，所以解决以上问题的方法就是用户当前需要用什么功能就只加载这个功能对应的代码，也就是所谓的按需加载；
 2. 如何使用按需加载（单页应用做加载优化时，一般采用以下原则）
 * 将整个网站划分成一个个小功能，再按照每个功能的相关成都将它们分成几类
 * 将每一类合并为一个Chunk，按需加载对应的Chunk
 * 不要按需加载用户首次打开网站时需要看到的画面所对应的功能，将其放到执行入口所在的Chunk中，以减少用户能感知的网页加载时间
 * 对于不依赖大量代码的功能点，例如依赖Chart.js去画图标、依赖flv.js去播放视频的功能点，可再对其进行按需加载
 
注意：被分割出去的代码的加载需要一定的时机去触发，即当用户操作到或者将操作到对应的功能时再去加载对应的代码。由于加载也需要耗时，可以预估用户接下来可能会进行的操作，并提前加载对应的代码，让用户感知不到网络加载。
3. 用Webpack实现按需加载

&emsp;&emsp;Webpack内置了强大的分割代码的功能去实现按需加载，实现起来非常简单。举个例子
* 网页首次加载时只加载main.js文件，网页会展示一个按钮，在main.js文件中只包含监听按钮事件和加载按需加载的代码
* 在按钮被单击时才去加载被分割出去的show.js文件，在加载成功后再执行show.js里的函数；
```
//main.js
window.document.getElementById('btn').addEventListener('click',function(){
    import(/* webpackChunkName:"show" */ './show').then(show=>{
        show('webpack');
    })
},false);

//show.js
export default function(con){
    console.log('show:'+con);
}

//其中最关键的一句是：
//import(/* webpackChunkName:"show" */ './show')

```
&emsp;&emsp;webpack 内置了对import(*)语句支持，当遇到类似语句时会这样处理：  
1、以`./show.js`为入口重新生成一个Chunk；  
2、当代码执行到`import`所在的语句时采取加载由Chunk对应生成的文件；  
3、import 返回一个Promise，当文件加载成功时可以在Promise的then方法中获取show.js导出的内容。

&emsp;&emsp;`/* webpackChunkName:"show" */`的含义是为动态生成的Chunk赋予一个名称，以方便我们追踪和调试代码。如果不指定动态生成的Chunk的名称，则默认的名称将会是`[id].js`,该指定Chunk名称的功能是在webpack3中引入的新特性，在之前是无法为动态生成的Chunk赋予名称的； 

为了正确输出在`/* webpackChunkName:"show" */`中配置的ChunkName,还需要配置Webpack；
```
module.exports={
    //entyr...
    output:{
        filename:'[name].js',
        chunkFilename:'[name].js'//专门指定生成的chunk在输出时的文件名称，但是在webpack4中，不指定的化也可以的
    }
}
```
### 按需加载与ReactRouter

该例子中包含三个页面，Home、About、Login，其中Home为默认页，初始化加载，另两个页面按需加载，点解跳转的时候，加载页面；
```
import React ,{createElement} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router,Route,Link} from 'react-router-dom';
import Home from './views/home';

/**
*异步加载组件
*@param load 组件加载函数，load函数会返回一个Promise，在文件加载完成时resolve
*@returns {AsyncComponent}返回一个告诫组件用于封装需要异步加载的组件
*/
function getAsyncComponent(load){
    return class AsyncComponent extends React.Component{
        componentDidMount(){  
            load().then({default:component}=>{
                this.setState({component});
            })
        }
        render(){
            const {component}=this.state||{};
            return component?createElement(component):null;
            // component 是React.Component类型，需要通过React。createElement生产一个组件实例
        }
    }
}

//入口App组件
class App extends React.Component{
    render(){
        return(
            <Router>
                <div>
                    <div>
                        <Link to="/">首页</Link>
                     <Link to="/about">关于</Link>   
                     <Link to="/login">登录</Link>
                    </div>
                    
                    <div>
                        <Route exact path="/" component={Home}></Route>
                        <Route exact path="/about" component={getAsyncComponent(() => {
                        //异步加载组件
                            return import(/* webpackChunkName:"About" */ './views/about')
                        })}></Route>
                        <Route exact path="/login" component={getAsyncComponent(() => {
                            return import(/* webpackChunkName:"Login" */ './views/login')
                        })}></Route>
                    </div>
                </div>
            </Router>
        )
    }
}

ReactDOM.render(<App />,document.getElemementById('root'));
```
Webpack处理其中的`import(*)`语句，会有一个问题，Babel报错，说不理解`import(*)`语法。其原因是该语法还没有被加入在ECMAScript标准里。为此，我们需要安装一个Babel插件`@babel/plugin-syntax-dynamic-import`，并且将其加入到.babelrc中；
```
{
    "presets": [
        "@babel/preset-react","@babel/preset-env"
    ],
    "plugins": [
        "@babel/plugin-syntax-dynamic-import"
    ]
}
```
执行后就会发现生成了三个文件；
* main.js：执行入口所在的代码块，同时包括Home所需要的代码。因为Home是打开应用需要看到的内容，所以不需要按需加载；其他两个页面在首页是不会加载的；
* Login.js：在访问/login时才会加载的代码块
* About.js：在用户访问/about时才会加载的代码块；

### 提取公共代码
webpack3 的CommonsChunkPlugin被废弃了，取而代之的是Webpack4中的SplitChunksPlugin,这不仅仅是plugin名称的变化，而是分割chunk思想的变化；
##### CommonsChunkPlugin的痛
* 如何避免单页应用首次的入口文件过大？ 
> 这个问题处理起来倒简单，webpack支持import()语法实现模块的懒加载，可以做到随用随载，也就是除了首页要的文件，其他模块使用懒加载能有效避免入口文件过大
* 入口模块以及剩下的懒加载模块引用公用的模块时，代码会重复么？webpack会处理么？怎么处理？
> 代码重复是肯定的，如果父级模块中没有引入来加载模块的公用模块，那么懒加载模块间就会出现代码重复；webpack能处理么？那么怎么处理呢？这时CommonsChunkPlugin就信誓旦旦的登场了，它能够将懒加载模块引入的公用模块统一抽取出来，形成一个新的common块，这样就避免了懒加载模块间的代码重复了。可惜的是，又回到了第一个问题，把公共的东西都抽出来了，这样又造成了入口文件过大了；

以下是CommonsChunkPlugin时代常用的代码：
```
new webpack.optimize.CommonsChunkPlugin({
    name:'vendor',
    minChunks:function(module,count){
        //any required modules inside node_modules are extracted to vendor
        return(
            module.resource && /\.js$/.test(module.resource) && module.resource.indexOf(path.join(__dirname,'../node_modules')===0)
        )
    }
    //或者直接minChunks:2,重复模块大于2的全部抽出来
})
```
CommonsChunkPlugin的痛，痛在只能统一抽取模块到父模块，造成父模块过大，不易于优化
##### SplitChunksPlugin 
前面讲了那么多，其实`SplitChunksPlugin`的登场就是为了磨平之前`CommonsChunkPlugin`的痛的，它能够抽出懒加载模块之间的公用模块，并且不会抽到父级，而是会与首次用到的懒加载模块并行加载，这样就可以放心使用懒加载模块了；
* SplitChunksPlugin 优化的默认规则
> 1、新代码块是被共享引用，或者这些模块都是来自node_modules  
2、新产出的vendor-chunk的大小得大于30kb  
3、按需加载的代码块并行请求的数量小于或等于5个  
4、初始加载的代码块，并行请求的数量小于或等于3个
```
//默认配置
splitChunks:{
    chunks:'async',//只作用于异步
    minSize:30000,
    minChunks:1,
    maxAsyncRequests:5,
    maxInitialRequests:3,
    name:true,
    automaticNameDelimiter: '~',
    cacheGroups:{
        default:{
            minChunks:2,
            priority:-20,
            reuseExistingChunk:true
        },
        vendors:{
            test:/[\\/]node_modules[\\/]/,
            priority:-10 //确定优先级的，默认为0
        }
    }
}
```
包含参数所代表的意思：
* chunks:表示显示块的范围，有三个可选值：`initial`(初始块)，`async`(按需加载),`all`(全部)，默认为`all`;
* minSize:产出新Chunk的大小得大于此值，默认30kb
* minChunks:表示被引用次数，默认为1
* maxAsyncrequests:最大的按需(异步)加载次数，默认为5；==暂时理解：按需加载chunks时，该chunks加载slip chunks的数量不能超过5个==
* maxInitialRequests:最大的初始化加载次数，默认为3；==暂时理解：初始化加载时，调用的slip chunks的数量不能超过3个==
* name:产分出来块的名字，设置成true，chunk名字由打包的chunk和cache group key组成，可以是字符串和函数,
* automaticNameDelimiter:产出chunks名字之间的链接符，默认为～
* 以上配置都可以在cacheGroups中重新定义

##### runtimeChunkPlugin
在使用CommonsChunkPlugin的时候，我们通常会把webpack runtime的基础函数提取出来，单独作为一个chunk，毕竟code splitting 想把不变的代码淡出抽离出来，方便浏览器缓存，提升加载速度。webpack4废除了CommonsChunkPlugin,采用了runtimeChunkPlugin可以将每个entry chunk 中的runtime部分的函数分离出来，只需要一个简单的配置：
```
 optimization:{
        splitChunks:{
            chunks:'all',
            name:true
        },
        runtimeChunk:{
            name:'runtime'
        }
    }
```

### 开启Scope Hoisting(作用域提升)
Scope Hoisting可以让Webpack打包出来的代码文件更小，运行更快，它又被译作“作用域提升”，是在webpack 3 中新推出的功能，在Webpac 4 模式为“production”下，默认开启；

##### Scope Hoisting的优势
* 代码提及更小，因为函数声明语句会产生大量的代码
* 代码在运行时因为创建的函数作用域变少了，所以内存开销也变小了；

##### Scope Hoisting原理
Scope Hoisting的实现原理其实很简单，分析模块之间的依赖关系，尽可能将被打散的模块合并到一个函数中，但前提时不能造成代码冗余。因此只有那些被引用了一次的模块才能被合并。同时，必须采用ES6模块化语句，不然不它无法生效；
##### Scope Hoisting的实现
在Webpack中使用它非常简单，因为webpack内置了该功能，只需要配置一个插件，代码如下：
```
//const ModuleConcatenationPlugin=requirei('webpack/lib/optimize/ModuleConcatenationPlugin');
cosnt webpack=require('webpack');
module.exports={
    /*针对npm中的第三方模块优先采用jsnext:main中指向的ES6模块化语法的文件*/
    resolve:{
        mainFields:['jsnext:main','browser','main']
    },
    plugins:[
        new webpack.optimize.ModuleconcatenationPlugin()
    ]
}
```
对于采用了非ES6模块化语法的代码，webpack会降级处理切不实用Scope Hoisting优化。为了知道webpack对那些代码做了降级处理，我们可以在启动Webpack时带上`--display-optimization-bailout`参数，这样在输出日志中显示；其中的`ModuleConcatenation bailout`告诉我们哪个文件因为什么原因导致了降级处理；
