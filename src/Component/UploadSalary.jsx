import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb, Icon, Button,message } from 'antd';
import common from '../public/js/common.js';

class UploadSalary extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let b_height = window.innerHeight-93;
        const token = sessionStorage.getItem('token');
        let src = common.staticBaseUrl('/html/uploadSalary.html?token='+token);
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
    }
}

export default UploadSalary;