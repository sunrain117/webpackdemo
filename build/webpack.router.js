const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DllReferencePlugin =require('webpack/lib/DllReferencePlugin');
const HappyPack =require('happypack');
const threadPool=HappyPack.ThreadPool({size:5});

module.exports = {
    mode:'development',
    entry: './src/routerdemo.js',
    output: {
        filename: '[name]_bundle.js',
        path: path.resolve(__dirname, '../dist'),
        chunkFilename : '[name].js'
    },
    module: {
        rules: [
            {
                test: /.js$/,
                use: ['happypack/loader?id=babel'],
                include: path.resolve(__dirname, '../src'),
                exclude: path.resolve(__dirname, '../node_modules')
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
    optimization:{
        splitChunks:{
            chunks:'all',
        },
        runtimeChunk:{
            name:'runtime'
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../src/index.html')
        }),
        new HappyPack({
            id:'babel',
            loaders:['babel-loader'],
            threadPool:threadPool
        })

    ]
}