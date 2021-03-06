import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';

ReactDOM.render(<App></App>,document.getElementById('root'))

if(module.hot){
    module.hot.accept(['./app'],()=>{
        ReactDOM.render(<App></App>,document.getElementById('root'))
    })
}