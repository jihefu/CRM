import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import ModalTemp from './common/Modal.jsx';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Input } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../public/js/common.js';
import DragTree from './DragTree.jsx';

class MenuManage extends Component {
    constructor(props) {
        super(props);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.fetch = this.fetch.bind(this);
        this.select = this.select.bind(this);
        this.key = '';
    }
    state = {
        list: [],
        modalText: '',
        title: '',
        visible: false
    };
    fetch(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/menu/sourceList'))
            .set("token",token)
            .end((err,res) => {
                if (err) {
                    hashHistory.push('/login');
                    return;
                }
                let menuArr = res.body.data.menuArr;
                let list = [];
                menuArr.forEach((items,index) => {
                    if(items.menuId%100==0){
                        list.push({
                            _id: items.id,
                            key: items.menuId,
                            title: items.title,
                            children: []
                        })
                    }
                });
                for (let i = 0; i < list.length; i++) {
                    for (let j = 0; j < menuArr.length; j++) {
                        let listKey = list[i].key;
                        let menuKey = menuArr[j].menuId;
                        if(menuKey!=listKey&&menuKey-listKey<100&&menuKey-listKey>0){
                            list[i].children.push({
                                _id: menuArr[j].id,
                                _source: menuArr[j].source,
                                key: menuKey,
                                title: menuArr[j].title
                            });
                        }
                    };
                };
                this.setState({
                    list
                });
            });
    }
    handleModalCancel(){
        this.setState({
            visible: !this.state.visible
        });
    }
    handleModalDefine(form_data){
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/menu/updateMenu'))
            .set("token",token)
            .send({
                form_data: JSON.stringify(form_data),
                id: this.key
            })
            .end((err,res) => {
                if (err) {
                    hashHistory.push('/login');
                    return;
                }
                if(res.body.code==200){
                    message.success(res.body.msg);
                    this.fetch();
                }else{
                    message.error(res.body.msg);
                }
            });
    }
    dragOk(data){
        data.forEach((items,index) => {
            items.id = (index + 1) * 100;
            items.children.forEach((it,ind) => {
                it.id = (index + 1) * 100 + ind + 1;
            });
        });
        let form_data = {};
        data.forEach((items,index) => {
            if(items.key!=items.id){
                form_data[items._id] = items.id;
            }
            items.children.forEach((it,ind) => {
                if(it.key!=it.id){
                    form_data[it._id] = it.id;
                }
            });
        });
        if(JSON.stringify(form_data)=='{}') return;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/menu/updateMenuPosition'))
            .set("token",token)
            .send({
                form_data: JSON.stringify(form_data)
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
            });
    }
    select(keys){
        let key = keys[0];
        if((!key)||key==0) return;
        let gData = this.state.list;
        let title,source,disabled;
        gData.forEach((items,index) => {
            if(items.key==key){
                title = items.title;
                source = items._source;
                this.key = items._id;
            }
            items.children.forEach((it,ind) => {
                if(it.key==key){
                    title = it.title;
                    source = it._source;
                    this.key = it._id;
                }
            });
        });
        if(source){
            disabled = false;
        }else{
            disabled = true;
        }
        //下面这行代码为了安全，防止页面死循环
        if(source=='index') disabled = true;
        this.setState({
            visible: !this.state.visible,
            title: title,
            modalText: <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'100px'}}>菜单名：</span><Input name={"title"} style={{flex:1}} defaultValue={title} />
                            </label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'100px'}}>指向资源：</span><Input name={"source"} disabled={disabled} style={{flex:1}} defaultValue={source} />
                            </label>
                        </div>
        });
    }
    componentDidMount() {
        this.fetch();
    }
    render() {
        return(
           <div style={{padding:24}}>
                <DragTree list={this.state.list} dragOk={this.dragOk} fetch={this.fetch} select={this.select} />
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

export default MenuManage;