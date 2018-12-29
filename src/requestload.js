import React from 'react';
import ReactDOM from 'react-dom';

function App() {
    return (<div>
        <button id="btnClick" onClick={clickEvent}>点击</button>
    </div>)
}

function clickEvent() {
    import(/* webpackChunkName:"show" */ '../public/show').then((show) => {
       console.log(show);
    })
}

ReactDOM.render(<App />, document.getElementById('root'));