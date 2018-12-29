import React from 'react';
import './css/style.css';
import PrintMe from './component/print';
import CDNView from './component/cdn';
import {SayHello} from './tools/tools';
export default function App(){
    SayHello();
    return (<div className="apptext">
        App Page fff bb
        <CDNView></CDNView>
        <PrintMe></PrintMe>
    </div>)
}