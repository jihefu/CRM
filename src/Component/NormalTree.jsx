import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Tree,Input,message } from 'antd';
import $ from 'jquery';
import request from 'superagent';
import ModalTemp from './common/Modal.jsx';
import common from '../public/js/common.js';
import '../public/css/tree.css';
const TreeNode = Tree.TreeNode;
const { TextArea } = Input;

class NormalTree extends Component {
    constructor(props) {
        super(props);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.type = 1;
        this.key = '';
        this.parentKey = '';
        this.childKey = '';
    }
    state = {
        list: [],
        modalText: '',
        title: '',
        visible: false
    };
    handleModalDefine(form_data){
        if(JSON.stringify(form_data)=='{}'){
            this.subDeleteSource();
            return;
        }
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/menu/addSourceCfg'))
            .set("token",token)
            .send({
                form_data: JSON.stringify(form_data),
                key: this.key
            })
            .end((err,res) => {
                if (err) {
                    hashHistory.push('/login');
                    return;
                }
                if(res.body.code==200){
                    message.success(res.body.msg);
                }else{
                    message.error(res.body.msg);
                }
                this.props.fetch();
            });
    }
    handleModalCancel(){
        this.setState({
            visible: !this.state.visible
        });
    }
    //添加子资源
    addsource(key){
        this.key = key;
        let type = this.type;
        let modalText;
        if(type==1){
            modalText = <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'100px'}}>菜单资源：</span><Input name={"source"} style={{flex:1}} />
                            </label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'100px'}}>权限函数：</span><TextArea name="authFun" style={{flex:1}} rows="20"></TextArea>
                            </label>
                        </div>
        }else if(type==2){
            let { list } = this.state;
            let id;
            list.forEach((items,index) => {
                if(items.key==key){
                   id = items.children.length;
                }
            });
            modalText = <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'45px'}}>id：</span><Input name={"id"} disabled={true} style={{flex:1}} defaultValue={id} /></label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'45px'}}>路由：</span><Input name={"url"} style={{flex:1}} /></label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'45px'}}>注释：</span><Input name={"rem"} style={{flex:1}} /></label>
                        </div>
        }
        this.setState({
            visible: !this.state.visible,
            title: '新增',
            modalText
        });
    }
    //删除资源
    delSource(key){
        let parentKey,childKey;
        if(key.indexOf('-')==-1){
            parentKey = key;
        }else{
            parentKey = key.split('-')[0];
            childKey = key.split('-')[1];
        }
        this.parentKey = parentKey;
        this.childKey = childKey;
        this.setState({
            visible: !this.state.visible,
            title: '提醒',
            modalText: '确定删除该资源？'
        });
    }
    subDeleteSource(){
        let { parentKey,childKey } = this;
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/menu/delSourceCfg'))
            .set("token",token)
            .send({
                parentKey: parentKey,
                childKey: childKey
            })
            .end((err,res) => {
                if (err) {
                    hashHistory.push('/login');
                    return;
                }
                if(res.body.code==200){
                    message.success(res.body.msg);
                }else{
                    message.error(res.body.msg);
                }
                this.props.fetch();
            });
    }
    onSelect = (keys) => {
        this.props.onSelect(keys);
    }
    onRightClick = (e) => {
        let x = e.event.pageX;
        let y = e.event.pageY;
        let key = e.node.props.eventKey;
        let strMenu = '';
        if(key=='0'){
            strMenu = '<p class="add">新增</p>';
            this.type = 1;
        }else if(key.indexOf('-')==-1){
            strMenu = '<p class="add">新增</p><p class="del">删除</p>';
            this.type = 2;
        }else{
            strMenu = '<p class="del">删除</p>';
            this.type = 3;
        }
        if($('#rightClickMenu').length==0){
            let str = '<div id="rightClickMenu" style="left:'+x+'px;top:'+y+'px">'+strMenu+'</div>';
            $('body').append(str);
            $(document).on('click','#rightClickMenu p',(e) => {
                let cls = $(e.target).attr('class');
                if(cls=='add'){
                    this.addsource(key);
                }else if(cls=='del'){
                    this.delSource(key);
                }
                $('#rightClickMenu').remove();
                $(document).off();
            });
            $(document).on('click','body',() => {
                $('#rightClickMenu').remove();
                $(document).off();
            });
        }
    }
    componentWillReceiveProps(props){
        this.setState({
            list: props.list
        });
    }
    render() {
        let { totalTitle } = this.props;
        let { list } = this.state;
        return (
            <div>
                <Tree
                    defaultExpandedKeys={['0']}
                    onSelect={this.onSelect}
                    onRightClick={this.onRightClick}
                >
                    <TreeNode defaultExpandAll={true} title={totalTitle} key="0">
                        {
                            list.map((items) => {
                                return (
                                    <TreeNode title={items.title} key={items.key}>
                                        {
                                            items.children.map(it => {
                                                return <TreeNode title={it.title} key={it.key} />
                                            })
                                        }
                                    </TreeNode>
                                )
                            })
                        }
                    </TreeNode>
                </Tree>
                <ModalTemp 
                        handleModalCancel={this.handleModalCancel}
                        handleModalDefine={this.handleModalDefine}
                        ModalText={this.state.modalText} 
                        title={this.state.title}
                        visible={this.state.visible} />
            </div>
        );
    }
}

export default NormalTree;