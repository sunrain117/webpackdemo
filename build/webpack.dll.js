const path=require('path');
const DllPlugin =require('webpack/lib/DllPlugin');

module.exports={
    mode:'development',
    entry:{
        react:['react','react-dom']
    },
    output:{
        filename:'[name].dll.js',
        path:path.resolve(__dirname,'../dist/lib'),
        library:'_dll_[name]'
    },
    plugins:[
        new DllPlugin({
            name:'_dll_[name]',
            path:path.resolve(__dirname,'../dist/lib','[name].manifest.json')
        })
    ]
}