import React, { createElement } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Home from './views/home';

function getAsyncComponent(load) {
    return class AsyncComponent extends React.Component {
        componentDidMount() {
            load().then(({default:component} ) => {
                console.log('bbbbbbbbbbb', component);
                this.setState({ component })
            })
        }
        render() {
            const { component } = this.state || {};
            return component ? createElement(component) : null;
        }
    }
}


class App extends React.Component {
    constructor() {
        super();
    }

    render() {
        return (
            <Router>
                <div>
                    <div>
                        <Link to="/">首页</Link>
                        <Link to="/about">关于</Link>
                        <Link to="/login">登录</Link>

                    </div>
                  
                    <div>
                        <Route exact path="/" component={Home}></Route>
                        <Route exact path="/about" component={getAsyncComponent(() => {
                            return import(/* webpackChunkName:"About" */ './views/about')
                        })}></Route>
                        <Route exact path="/login" component={getAsyncComponent(() => {
                            return import(/* webpackChunkName:"Login" */ './views/login')
                        })}></Route>
                    </div>
                </div>
            </Router>)
    }
}

ReactDOM.render(<App></App>, document.getElementById('root'));