var path=require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack=require('webpack');
module.exports={
    mode:'development',
    entry:'./src/split.js',
    output:{
        filename:'[name].js',
        path:path.resolve(__dirname,'../dist')
    },
    optimization:{
        splitChunks:{
            chunks:'all',
            name:true
        },
        runtimeChunk:{
            name:'runtime'
        }
    },
    module:{
        rules:[
            {
                test:/\.js$/,
                use:['babel-loader'],
                include:path.resolve(__dirname,'../src'),
                exclude:path.resolve(__dirname,'../node_modules')
            }
        ]
    },
    plugins:[
        new webpack.optimize.ModuleConcatenationPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../src/index.html')
        }),
    ]
}