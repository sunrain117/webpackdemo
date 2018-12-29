import React from 'react';
import '../css/cdn.css';

export default class CDNView extends React.Component {
    constructor() {
        super()
    }

    render() {
        return (
            <div>
                <div>
                    <p>来自网页</p>
                    <div className="imgBox">
                        <img src={require('../img/icon.jpg')}></img>
                    </div>
                    <p style={{marginTop:'20px'}}>来自背景</p>
                    <div className="imgBg"></div>
                </div>
            </div>
        )
    }
}