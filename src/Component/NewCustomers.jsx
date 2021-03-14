import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';

class NewCustomers extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let b_height = window.innerHeight-93;
        let src = common.staticBaseUrl('/html/new_customer.html');
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
    }
}

export default NewCustomers;