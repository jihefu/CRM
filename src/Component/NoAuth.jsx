import React, { Component } from 'react';
import '../public/css/App.css';


class NoAuth extends Component {
  render() {
    return (
      <div className="App">
        <h1>没有权限访问</h1>
      </div>
    );
  }
}

export default NoAuth;
