import React, { Component } from 'react';
import { message, Tree, Modal, Input, Icon } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import DocTreeManage from './DocTreeManage.jsx';
import SolutionManage from './SolutionManage.jsx';
import common from '../../public/js/common.js';
const { TreeNode } = Tree;
const confirm = Modal.confirm;

class KnTreeManage extends Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        const h = $('.ant-layout-content').height();
        return (
            <div style={{height: h, overflow: 'auto', display: 'flex'}}>
                <DocTreeManage></DocTreeManage>
                <div style={{marginLeft: 100}}>
                    <SolutionManage></SolutionManage>
                </div>
            </div>
        )
    }
}

export default KnTreeManage;