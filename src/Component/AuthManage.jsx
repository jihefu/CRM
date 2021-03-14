import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import NormalTree from './NormalTree.jsx';
import ListTemp from './ListTemp.jsx';
import Tags from './common/Tags.jsx';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Input } from 'antd';
import request from 'superagent';
import ModalTemp from './common/Modal.jsx';
import common from '../public/js/common.js';
const { TextArea } = Input;

class AuthManage extends Component {
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.fetch = this.fetch.bind(this);
        this.fetchDeal = this.fetchDeal.bind(this);
        this.sourceList = {};
        this.menuList = [];
    }
    state = {
        sourceList: [],
        key: '',
        modalText: '',
        title: '',
        visible: false
    };
    parentNodeClick(values){
        let { authFun,value,key } = this.sourceList[values];
        this.setState({
            visible: !this.state.visible,
            title: value,
            key: values,
            modalText: <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'100px'}}>菜单资源：</span><Input name={"source"} disabled={true} style={{flex:1}} defaultValue={values} />
                            </label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'100px'}}>权限函数：</span><TextArea name="authFun" style={{flex:1}} rows="20" defaultValue={authFun}></TextArea>
                            </label>
                        </div>
        });
    }
    childNodeClick(values){
        let sourceList = this.sourceList;
        let source = values.split('-')[0];
        let url = values.split('-')[1];
        let rem;
        let id;
        sourceList[source].sourceArr.forEach((items,index) => {
            if(items.url==url){
                rem = items.rem;
                id = items.id;
            }
        });
        this.setState({
            visible: !this.state.visible,
            title: sourceList[source].value,
            key: source,
            modalText: <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'45px'}}>id：</span><Input name={"id"} disabled={true} style={{flex:1}} defaultValue={id} /></label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'45px'}}>路由：</span><Input name={"url"} style={{flex:1}} defaultValue={url} /></label>
                            <label style={{display:'flex','marginTop': '12px'}}>
                                <span style={{width:'45px'}}>注释：</span><Input name={"rem"} style={{flex:1}} defaultValue={rem} /></label>
                        </div>
        });
    }
    onSelect(values){
        try{
            let key = values[0];
            if(key.indexOf('-')==-1){
                //父节点
                this.parentNodeClick(key);
            }else{
                //子节点
                this.childNodeClick(key);
            }
        }catch(e){

        }
    }
    handleModalCancel(){
        this.setState({
            visible: !this.state.visible
        });
    }
    handleModalDefine(vObj){
        delete vObj['source'];
        let form_data = vObj;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/menu/updateSourceCfg'))
            .set("token",token)
            .send({
                form_data: JSON.stringify(form_data),
                key: this.state.key
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
                this.fetch();
            });
    }
    fetch(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/menu/sourceList'))
            .set("token",token)
            .end((err,res) => {
                if (err) {
                    hashHistory.push('/login');
                    return;
                }
                this.fetchDeal(res);
            });
    }
    fetchDeal(res){
        let res_arr = [];
        let sourceList = res.body.data.sourceArr;
        let menuList =  res.body.data.menuArr;
        this.sourceList = sourceList;
        this.menuList = menuList;
        for(let key in sourceList){
            for (let i = 0; i < menuList.length; i++) {
                if(key==menuList[i].source){
                    sourceList[key].value = menuList[i].title;
                    break;
                }else if(key!=menuList[i].source&&i==menuList.length-1){
                    sourceList[key].value = key;
                }
            };
        }
        for(let key in sourceList){
            res_arr.push({
                title: sourceList[key].value,
                key: key,
                children: sourceList[key]['sourceArr']
            });
        }
        res_arr.forEach((items,index) => {
            items.children.forEach((it,ind) => {
                items.children[ind] = {
                    id: it.id,
                    url: it.url,
                    rem: it.rem,
                    title: <div>
                            <span>{it.id}.</span>
                            <span style={{marginLeft: 15}}>{it.url}</span>
                            <span style={{marginLeft: 15}}>{it.rem}</span>
                            </div>,
                    key: items.key+'-'+it.url
                };
            });
        });
        this.setState({
            sourceList: res_arr
        });
    }
    //在初始化渲染执行之后调用，只执行一次
    componentDidMount(){
        this.fetch();
    }
    render() {
        let b_height = window.innerHeight-150;
        return(
           <div style={{padding:24}}>
                <div style={{height: b_height,overflow: 'auto'}}>
                    <NormalTree list={this.state.sourceList} totalTitle="页面资源" onSelect={this.onSelect} fetch={this.fetch} />
                </div>
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

export default AuthManage;