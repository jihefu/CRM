import React, { Component } from 'react';
import common from '../public/js/common.js';

class ProductWorkHours extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const token = sessionStorage.getItem('token');
        let b_height = window.innerHeight-93;
        let src = common.staticBaseUrl('/html/product_work_hours.html?token=' + token);
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none',padding:10}}></iframe>
    }
}

export default ProductWorkHours;