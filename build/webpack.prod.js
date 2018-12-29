const path = require('path');
const merge = require("webpack-merge");
const common = require('./webpack.common');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextWebpackPlugin=require('extract-text-webpack-plugin');
const HappyPack=require('happypack');
const threadPool=HappyPack.ThreadPool({size:5});

module.exports = merge(common, {
    mode: 'production',
    module: {
        rules: [
            {
                test:/.css$/,
                use:ExtractTextWebpackPlugin.extract({
                    fallback:'style-loader',
                    use:[
                        'css-loader'
                    ]
                }),
                include: path.resolve(__dirname, '../src'),
                exclude: path.resolve(__dirname, '../node_modules')
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist/index.html', 'dist/bundle.js', 'dist/css'], {
            root: path.resolve(__dirname, '../')
        }),
        new ExtractTextWebpackPlugin({
            filename:'css/style.css'
        })
    ]
})