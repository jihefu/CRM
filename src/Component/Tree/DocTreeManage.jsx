import React, { Component } from 'react';
import { message, Tree, Modal, Input, Icon } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common.js';
const { TreeNode } = Tree;
const confirm = Modal.confirm;

class DocTreeManage extends Component {
    constructor(props) {
        super(props);
        this.treeName = '公司树';
        this.treeSourceUrl = '/knowlib/getKnowledgeTree';
        this.addNodeUrl = '/knowlib/addKnowledgeTree';
        this.delNodeUrl = '/knowlib/delKnowledgeTree';
        this.renameNodeUrl = '/knowlib/renameTree';
        // 拖拽
        this.removeTreeUrl = '/knowlib/removeTree';
        this.dragNodeInUrl = '/knowlib/dragNodeIn';

        this.disabledId = common.gcId;

    }
    state = {
        treeData: [],
    };

    // 获取节点树数据源
    fetchTreeData = () => {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl(this.treeSourceUrl))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.setState({
                    treeData: res.body.data
                });
            });
    }

    componentDidMount() {
        this.fetchTreeData();
    }

    onDrop = e => {
        const that = this;
        const { treeData } = this.state;
        const { dragNode, node } = e;
        const selfNodeProps = dragNode.props;
        const targetNodeProps = node.props;
        const { dragOverGapBottom, dragOverGapTop } = targetNodeProps;
        const selfId = selfNodeProps.eventKey;
        const targetId = targetNodeProps.eventKey;
        let resArr, selfArr, selfIndex, targetIndex, formData = {};
        if (!dragOverGapBottom && !dragOverGapTop) {
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl(that.dragNodeInUrl))
                .set("token",token)
                .send({
                    selfId,
                    targetId,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code === 200) {
                        message.success(res.body.msg);
                        this.fetchTreeData();
                    } else {
                        message.error(res.body.msg);
                    }
                });
        } else {
            let type;
            if (dragOverGapBottom && !dragOverGapTop) {
                // 拖到了下面
                type = 'bottom';
            } else if (!dragOverGapBottom && dragOverGapTop) {
                // 拖到了上面
                type = 'top';
            }
            findTargetArr(targetId, treeData);
            findSelfArr(selfId, treeData);
            let newArr = [], it, ind;
            resArr.forEach(items => {
                if (items.id != selfId) {
                    newArr.push(items);
                }
            });
            selfArr.forEach(items => {
                if (items.id == selfId) {
                    it = items;
                }
            });
            it.mainId = newArr[0].mainId;
            newArr.forEach((items, index) => {
                if (items.id == targetId) {
                    if (type == 'bottom') {
                        ind = index + 1;
                    } else {
                        ind = index;
                    }
                }
            });
            newArr.splice(ind, 0, it);
            newArr.forEach((items, index) => {
                items.index = index;
                if (items.id == selfId) selfIndex = index;
                if (items.id == targetId) targetIndex = index;
            });
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl(that.removeTreeUrl))
                .set("token",token)
                .send({
                    newTreeArr: newArr,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code === 200) {
                        message.success(res.body.msg);
                        this.fetchTreeData();
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }
        
        function findTargetArr(id, treeData) {
            treeData.forEach((items,index) => {
                if (items.id == id) {
                    resArr = treeData;
                } else {
                    findTargetArr(id, items.subTreeArr);
                }
            });
        }

        function findSelfArr (id, treeData) {
            treeData.forEach((items,index) => {
                if (items.id == id) {
                    selfArr = treeData;
                } else {
                    findSelfArr(id, items.subTreeArr);
                }
            });
        }
    }

    // 渲染节点树
    renderTree = () => {
        let { treeData } = this.state;
        const that = this;
        const resArr = [];
        function getTreeNode(arr) {
            return arr.map(items => {
                if (items.subTreeArr && items.subTreeArr.length !== 0) {
                    return <TreeNode disabled={items.id === that.disabledId} title={items.name} key={items.id}>
                                {getTreeNode(items.subTreeArr)}
                            </TreeNode>
                }
                return <TreeNode disabled={items.id === that.disabledId} title={items.name} key={items.id} />
            });
        }
        return <Tree
                    draggable
                    blockNode
                    defaultExpandedKeys={['0']}
                    onDrop={this.onDrop}
                    onRightClick={this.onRightClick}
                >
                    <TreeNode title={'全部'} key={0}>
                        {getTreeNode(treeData)}
                    </TreeNode>
                </Tree>;
    }

    // 右键点击树节点
    onRightClick = e => {
        const x = e.event.pageX;
        const y = e.event.pageY;
        const key = e.node.props.eventKey;
        const eItems = e.node.props;
        if (key == this.disabledId) return;
        if($('#rightClickMenu').length !==0 ) return;
        $(e.event.target).append('<div id="rightClickMenu" style="left:'+x+'px;top:'+y+'px"><p class="add">新增</p><p class="rename">重命名</p><p class="del">删除</p></div>');
        $(document).on('click','#rightClickMenu p', e => {
            let cls = $(e.target).attr('class');
            if(cls=='add'){
                this.addNode(key);
            }else if(cls=='del'){
                this.delNode(key);
            } else {
                this.title = eItems.title;
                this.renameNode(key);
            }
            $('#rightClickMenu').remove();
            $(document).off();
        });
        $(document).on('click','body',() => {
            $('#rightClickMenu').remove();
            $(document).off();
        });
    }

    addNode = id => {
        const that = this;
        confirm({
            title: '新增节点',
            content: <Input name={'addNode'} placeholder={'节点名'} />,
            icon: <Icon type="info-circle" />,
            onOk() {
                const name = $('input[name=addNode]').val().trim();
                if (!name) return message.warning('不能为空');
                let token = sessionStorage.getItem('token');
                request.post(common.baseUrl(that.addNodeUrl))
                    .set("token",token)
                    .send({
                        name,
                        mainId: id,
                    })
                    .end((err,res) => {
                        if(err) return;
                        message.success(res.body.msg);
                        that.fetchTreeData();
                    });
            },
        });
    }

    delNode = id => {
        const that = this;
        confirm({
            title: '删除节点',
            content: '确定删除该节点？',
            icon: <Icon type="info-circle" />,
            onOk() {
                let token = sessionStorage.getItem('token');
                request.delete(common.baseUrl(that.delNodeUrl))
                    .set("token",token)
                    .send({
                        id,
                    })
                    .end((err,res) => {
                        if(err) return;
                        message.success(res.body.msg);
                        that.fetchTreeData();
                    });
            },
        });
    }

    renameNode = id => {
        const that = this;
        confirm({
            title: '重命名',
            content: <Input name={'renameNode'} defaultValue={this.title} />,
            icon: <Icon type="info-circle" />,
            onOk() {
                const name = $('input[name=renameNode]').val().trim();
                if (!name) return message.warning('不能为空');
                let token = sessionStorage.getItem('token');
                request.put(common.baseUrl(that.renameNodeUrl))
                    .set("token",token)
                    .send({
                        name,
                        id,
                    })
                    .end((err,res) => {
                        if(err) return;
                        message.success(res.body.msg);
                        that.fetchTreeData();
                    });
            },
        });
    }
    
    render() {
        const h = $('.ant-layout-content').height();
        return (
            <div style={{height: h, overflow: 'auto'}}>
                <h2 style={{marginLeft: 6, marginTop: 6}}>{this.treeName}</h2>
                { this.renderTree() }
            </div>
        )
    }
}

export default DocTreeManage;