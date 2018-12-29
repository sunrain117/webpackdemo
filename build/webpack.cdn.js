//页面引入样式的CDN独立，如何实现？

const path=require('path');
const ExtractTextPlugin=require('extract-text-webpack-plugin');
const {WebPlugin} =require('web-webpack-plugin');
const HtmlWebpackPlgun =require('html-webpack-plugin');

module.exports={
    mode:'production',
    entry:'./src/index.js',
    output:{
        filename:'bundle_[chunkhash:8].js',
        path:path.resolve(__dirname,'../dist'),
        publicPath:'//192.168.84.209:8083'
    },
    module:{
        rules:[
            {
                test:/\.js$/,
                use:['babel-loader'],
                include:path.resolve(__dirname,'../src'),
                exclude:path.resolve(__dirname,'../node_modules')
            },
            {
                test:/\.css$/,
                use:ExtractTextPlugin.extract({
                    use:['css-loader'],
                    publicPath:'//192.168.84.209:8083/img'
                }),
                include:path.resolve(__dirname,'../src'),
                exclude:path.resolve(__dirname,'../node_modules')
            },
            {
                test:/.(png|jpg|gif|svg)$/,
                use:{
                    loader:'file-loader',
                    options:{
                        name:"[name]_[hash:8].[ext]",
                        publicPath:'//192.168.84.209:8083/img',
                        outputPath:'../dist/img'
                    }
                }
            }
        ]
    },
    plugins:[
        new ExtractTextPlugin({
            filename:'css/[name].css'
        }),
        // new WebPlugin({
        //     template:path.resolve(__dirname,'../src/index.html'),
        //     filename:'index.html',
        //     stylePublicPath:'//192.168.84.209:8083/css'
        // })
        new HtmlWebpackPlgun({
            template:path.resolve(__dirname,'../src/index.html'),
            filename:'index.html'
        })
    ]
}