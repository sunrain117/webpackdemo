const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DllReferencePlugin =require('webpack/lib/DllReferencePlugin');
const HappyPack =require('happypack');
const threadPool=HappyPack.ThreadPool({size:5});

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../dist')
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
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../src/index.html')
        }),
        new DllReferencePlugin({
            manifest:require(path.resolve(__dirname,'../dist/lib/react.manifest.json'))
        }),
        new HappyPack({
            id:'babel',
            loaders:['babel-loader'],
            threadPool:threadPool
        })

    ]
}