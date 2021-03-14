import React, { Component } from 'react';
import { message, Tree, Modal, Input, Icon } from 'antd';
import DocTreeManage from './DocTreeManage.jsx';
import common from '../../public/js/common.js';
const { TreeNode } = Tree;
const confirm = Modal.confirm;

class SolutionManage extends DocTreeManage {
    constructor(props) {
        super(props);
        this.treeName = '解决方案树';
        this.treeSourceUrl = '/solutionTree/getTree';
        this.addNodeUrl = '/solutionTree/addNode';
        this.delNodeUrl = '/solutionTree/delNode';
        this.renameNodeUrl = '/solutionTree/renameNode';
        // 拖拽
        this.removeTreeUrl = '/solutionTree/removeTree';
        this.dragNodeInUrl = '/solutionTree/dragNodeIn';

        this.disabledId = common.solutionOtherId;
    }
}

export default SolutionManage;