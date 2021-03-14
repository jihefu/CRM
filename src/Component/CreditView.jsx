import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';

class CreditView extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let b_height = window.innerHeight-93;
        const token = sessionStorage.getItem('token');
        let src = common.staticBaseUrl('/html/over_view.html?token='+token);
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
    }
}

export default CreditView;