import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Tree, Input, message } from 'antd';
import $ from 'jquery';
import request from 'superagent';
import ModalTemp from './common/Modal.jsx';
import common from '../public/js/common.js';
import '../public/css/tree.css';
const TreeNode = Tree.TreeNode;
const { TextArea } = Input;

class DragTree extends Component {
	constructor(props) {
		super(props);
		this.onSelect = this.onSelect.bind(this);
		this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.key = '';
        this.type = 1;
	}
	state = {
		gData: [],
		expandedKeys: [],
		modalText: '',
        title: '菜单',
        visible: false
	}

	onSelect(keys){
		this.props.select(keys);
	}

	onDrop = (info) => {
		const dropKey = info.node.props.eventKey;
		const dragKey = info.dragNode.props.eventKey;
		const dropPos = info.node.props.pos.split('-');
		const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
		// const dragNodesKeys = info.dragNodesKeys;
		const loop = (data, key, callback) => {
			data.forEach((item, index, arr) => {
				if (item.key == key) {
					return callback(item, index, arr);
				}
				if (item.children) {
					return loop(item.children, key, callback);
				}
			});
		};
		const data = [...this.state.gData];
		let dragObj;
		loop(data, dragKey, (item, index, arr) => {
			arr.splice(index, 1);
			dragObj = item;
		});
		if (info.dropToGap) {
			let ar;
			let i;
			loop(data, dropKey, (item, index, arr) => {
				ar = arr;
				i = index;
			});
			try{
				let dragObjKey = dragObj.key;
				let arKey = ar[0].key;
				if((dragObjKey%100==0&&arKey%100==0)||(dragObjKey%100!=0&&arKey%100!=0)){
					if (dropPosition === -1) {
						ar.splice(i, 0, dragObj);
					} else {
						ar.splice(i + 1, 0, dragObj);
					}
					this.setState({
						gData: data,
					},() => {
						this.props.dragOk(this.state.gData);
					});
				}
			}catch(e){

			}
		}
	}

	onRightClick = (e) => {
		let x = e.event.pageX;
        let y = e.event.pageY;
        let key = e.node.props.eventKey;
        this.key = key;
        let strMenu;
        if(key==0){
        	this.type = 1;
        	strMenu = '<p class="add">新增</p>';
        }else if(key%100==0){
        	this.type = 2;
        	strMenu = '<p class="add">新增</p><p class="del">删除</p>';
        }else{
        	this.type = 3;
        	strMenu = '<p class="del">删除</p>';
        }
        if($('#rightClickMenu').length==0){
            let str = '<div id="rightClickMenu" style="left:'+x+'px;top:'+y+'px">'+strMenu+'</div>';
            $('body').append(str);
            $(document).on('click','#rightClickMenu p',(e) => {
                let cls = $(e.target).attr('class');
                if(cls=='add'){
                    this.addMenu(key);
                }else if(cls=='del'){
                    this.delMenu(key);
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

	addMenu(key){
        let type = this.type;
        let disabled;
        if(type==1){
            disabled = true;
        }else{
            disabled = false;
        }
        this.setState({
            visible: !this.state.visible,
            title: '新增菜单',
            modalText: <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'100px'}}>菜单名：</span><Input name={"title"} style={{flex:1}} />
                            </label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'100px'}}>指向资源：</span><Input name={"source"} disabled={disabled} style={{flex:1}} />
                            </label>
                        </div>
        });
    }

    delMenu(key){
        this.setState({
            visible: !this.state.visible,
            title: '提醒',
            modalText: '确定删除该菜单？'
        });
    }

	handleModalDefine(form_data){
		if(JSON.stringify(form_data)=='{}'){
			this.subDelMenu();
			return;
		}
		let key = this.key;
		if(form_data.title==''){
			message.error('菜单名不能为空');
			return;
		}
		if(key!=0&&form_data.source==''){
			message.error('指向资源不能为空');
			return;
		}
		let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/menu/addMenu'))
            .set("token",token)
            .send({
                form_data: JSON.stringify(form_data),
                key: key
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

	subDelMenu(){
		let key = this.key;
		let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/menu/delMenu'))
            .set("token",token)
            .send({
                key: key
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

	componentWillReceiveProps(props){
		this.setState({
			gData: props.list
		});
	}

	render() {
		const loop = data => data.map((item) => {
			if (item.children && item.children.length) {
				return <TreeNode key={item.key} title={item.title}>{loop(item.children)}</TreeNode>;
			}
			return <TreeNode key={item.key} title={item.title} />;
		});
		return (
			<div>
				<Tree
					defaultExpandedKeys={['0']}
					draggable
					onDrop={this.onDrop}
					onSelect={this.onSelect}
					onRightClick={this.onRightClick}
				>
					<TreeNode defaultExpandAll={true} title={"菜单"} key="0">
						{loop(this.state.gData)}
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

export default DragTree;