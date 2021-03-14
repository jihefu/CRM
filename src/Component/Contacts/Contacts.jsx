import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Popover, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const { Option } = Select;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '标记',
                    onClick: this.markAll,
                },
                {
                    text: '取消标记',
                    onClick: this.removeMarkAll,
                }
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        markAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.markAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        removeMarkAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.removeMarkAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            const markSet = new Set();
            for (let i = 0; i < selectedRows.length; i++) {
                const { isStarMark } = selectedRows[i];
                markSet.add(isStarMark);
            }
            if (markSet.size === 2) {
                currentFunArr = currentFunArr.filter(items => items.text != '取消标记' && items.text != '标记' );
            } else if (markSet.size === 1) {
                if (markSet.has(1)) {
                    currentFunArr = currentFunArr.filter(items => items.text != '标记' );
                } else {
                    currentFunArr = currentFunArr.filter(items => items.text != '取消标记' );
                }
            }
            
            this.setState({ currentFunArr });
        }

        render() {
            const { currentFunArr } = this.state;
            const { selectedRowKeys } = this.props;
            if (selectedRowKeys.length === 0) {
                return <div></div>
            }
            return (
                <WrappedComponent style={{position: 'relative', top: 3, marginRight: 60}} funArr={currentFunArr} />
            )
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class Contacts extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/contacts/list';
        this.addPathName = '/contactAdd';
        this.editPathName = '/contactEdit';
        this.placeholder = '姓名，公司，手机';
        this.filter = ['verified', 'is_member'];
        this.markType = 'Contacts';
        this.fixedKey = '';
        this.options = [
            {
                text: '新增时间',
                value: 'id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            }
        ];
        this.res_data = {
            name: {
                label: '姓名',
                width: 200
            },
            sex: {
                label: '性别',
                width: 100
            },
            phone1: {
                label: '手机号码',
                width: 150
            },
            // phone2: {
            //     label: '手机号码2',
            //     width: 150
            // },
            company: {
                label: '公司',
                width: 300
            },
            // tel: {
            //     label: '电话',
            //     width: 100
            // },
            // qq: {
            //     label: 'qq',
            //     width: 100
            // },
            // wx_id: {
            //     label: '微信号',
            //     width: 150
            // },
            // email: {
            //     label: '邮箱',
            //     width: 150
            // },
            // addr: {
            //     label: '地址',
            //     width: 150
            // },
            // relation: {
            //     label: '关系',
            //     width: 150
            // },
            album: {
                label: '照片',
                width: 150
            },
            // rem: {
            //     label: '附注',
            //     width: 200
            // }
        };
        this.state.pagination.filter = {
            verified: '',
            is_member: '',
        }
        this.canRowSelection = true;
    }

    inputRender(){
        const { data,pagination, selectedRows, selectedRowKeys } = this.state;
        return <div>
                    <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
                                <Button style={{"marginRight": 15,"top": 4}}>{"筛选"}</Button>
                            </Popover>
                            <Form.Item>
                                <Input name="keywords" style={{width: 300}} placeholder={this.placeholder} defaultValue={pagination.keywords}/>
                            </Form.Item>
                            <Button type="primary" onClick={this.handleSearch} style={{"position":"relative","left":15,"top":3}}>搜索</Button>
                            <span style={{marginLeft: 50}}>
                                <Select defaultValue={pagination.order} onChange={this.orderChange} style={{"position":"relative","top":3,minWidth: 120}}>
                                    {
                                        this.options.map(items => 
                                            <Option key={items.value} value={items.value}>{items.text}</Option>
                                        )
                                    }
                                </Select>
                            </span>
                        </div>
                        { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> }
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //@Override
    componentDidMount(){
        if(Base.GetStateSession()&&Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]){
            this.setState(Base.GetStateSession(),() => {
                this.initMark();
            });
            Base.RemoveStateSession();
        }else{
            const { pagination } = this.state;
            try{
                pagination.order = this.options[0].value;
            }catch(e){

            }
            let keywords;
            try{
                keywords = this.props.location.state.phone?this.props.location.state.phone:'';
                pagination.keywords = keywords;
            }catch(e){

            }
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
        }
    }

    nameLocation(data){
        // let pathname;
        // this.props.siderList.forEach((items,index) => {
        //     if(items.link=='/customers'){
        //         pathname = items.link;
        //     }
        // });
        // if(!pathname) pathname = '/customersView';
        // hashHistory.push({
        //     pathname: pathname,
        //     state: {
        //         company: data.company
        //     }
        // });
        // const { typeCode, company } = data;
        // const codeArr = common.getCodeArr(typeCode);
        // let pathname;
        // if (codeArr.indexOf(0) !== -1 || codeArr.indexOf(1) !== -1) {
        //     this.props.siderList.forEach((items,index) => {
        //         if(items.link=='/customers'){
        //             pathname = items.link;
        //         }
        //     });
        //     if(!pathname) pathname = '/customersView';
        // } else if (codeArr.indexOf(2) !== -1) {
        //     pathname = '/endUser';
        // } else if (codeArr.indexOf(4) !== -1) {
        //     pathname = '/buyer';
        // } else {
        //     pathname = '/publicRelationShip';
        // }
        hashHistory.push({
            pathname: '/verUnit',
            state: {
                company: data.company
            }
        });
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='album'){
            let albumArr;
            try{
                albumArr = row[key].split(',');
            }catch(e){  
                albumArr = [];
            }
            title = <div>
                        <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/'+items;
                                        return(
                                            <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                                <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(src)} />
                                            </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            content = title;
        }else if(key=='name'){
            title = row[key];
            if(row['verified']==1){
                content = <span><span style={{color: '#42db41',marginRight: 5}}>V</span>{row[key]}</span>
            }else if(row['verified']==2){
                content = <span><span style={{marginRight: 5}}>-</span>{row[key]}</span>
            }else{
                content = <span><span style={{color: '#ffee58',marginRight: 5}}>N</span>{row[key]}</span>
            }
            if (row.is_member) {
                content = <span><Icon type="wechat" style={{color: '#42db41',marginRight: 5}} />{content}</span>
            }
        }else if(key=='company'){
            title = <span onClick={() => this.nameLocation(row)} style={{cursor: 'pointer'}}>{row[key]}</span>
            content = title;
        }else{
            title = row[key];
            content = row[key];
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const verified = ['待认证', '未通过','已认证','认证申请中'];
        const is_member = ['是', '否'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"认证状态："}</span>
                        <CheckboxGroup options={verified} value={pagination.filter.verified.split(',')} onChange={(v) => this.filterType('verified',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"是否会员："}</span>
                        <CheckboxGroup options={is_member} value={pagination.filter.is_member.split(',')} onChange={(v) => this.filterType('is_member',v)} />
                    </div>
                </div>
    }
}

export default Contacts;