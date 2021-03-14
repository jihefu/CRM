import React, { Component } from 'react';
import common from '../public/js/common.js';

class WxAppletManage extends Component {

    render() {
        const b_height = window.innerHeight-93;
        const token = sessionStorage.getItem('token');
        const src = ('https://mp.langjie.com/static/wxAppletManage/index.html?token=' + token);
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
    }
}

export default WxAppletManage;