const path=require('path');
const merge=require("webpack-merge");
const common=require('./webpack.common');
const CleanWebpackPlugin=require('clean-webpack-plugin');
const HotModuleReplacementPlugin=require('webpack/lib/HotModuleReplacementPlugin');
const HappyPack =require('happypack');
const threadPool=HappyPack.ThreadPool({size:5});

module.exports=merge(common,{
    mode:'development',
    module: {
        rules: [
            {
                test:/.css$/,
                use:['happypack/loader?id=css'],
                include: path.resolve(__dirname, '../src'),
                exclude: path.resolve(__dirname, '../node_modules')
            }
        ]
    },
    plugins:[
        new CleanWebpackPlugin(['dist/bundle.js','dist/index.html'],{
            root:path.resolve(__dirname,'../')
        }),
        new HotModuleReplacementPlugin(),
        new HappyPack({
            id:'css',
            loaders:['style-loader','css-loader'],
            threadPool:threadPool
        })
    ],
    devServer:{
        contentBase:path.resolve(__dirname,'../dist'),
        port:8082,
        hot:true,
        open:true
    }
})