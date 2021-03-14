import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';

class CreditRecordReadonly extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let b_height = window.innerHeight-93;
        let src = common.staticBaseUrl('/html/credit_records_readonly.html');
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
    }
}

export default CreditRecordReadonly;