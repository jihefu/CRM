import React, { Component } from 'react';
import common from '../public/js/common';

class SourceMap extends Component {
    constructor(props){
        super(props);
    }

    render(){
        let b_height = window.innerHeight-93;
        const token = sessionStorage.getItem('token');
        let src = common.staticBaseUrl('/html/sourceMap.html?token='+token);
        return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
    }
}

export default SourceMap;