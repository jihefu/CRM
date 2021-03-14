import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Tag } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

class VerUnit extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/verUnit';
        this.editPathName = '/verUnitEdit';
        this.placeholder = '单位名称，地名';
        this.actionWidth = 100;
        this.filter = ['certified'];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
            {
                text: '累计联系单',
                value: 'total'
            },
            {
                text: '近三个月联系单',
                value: 'threeMonth'
            },
        ];
        this.res_data = {
            company: {
                label: '单位名',
                width: 200
            },
            user_id: {
                label: '单位号',
                width: 100
            },
            sub_type: {
                label: '子类型',
                width: 180
            },
            mainContacts: {
                label: '主要联系人',
                width: 300,
            },
            totalContactsOrderNum: {
                label: '累计联系单',
                width: 100,
            },
            latestThreeMonthContactsOrderNum: {
                label: '近三个月联系单',
                width: 120,
            },
            legal_person: {
                label: '法定代表人',
                width: 150
            },
            town: {
                label: '城市',
                width: 150
            },
            tax_id: {
                label: '机构代码',
                width: 200
            },
            province: {
                label: '省份',
                width: 150
            },
            reg_addr: {label: '注册地址', width: 200},
            reg_tel: {label: '注册电话', width: 200},
            update_person: {
                label: '更新人',
                width: 200
            },
            update_time: {
                label: '更新时间',
                width: 200
            },
        };
        this.state.pagination.filter.certified = '';
        this.canRowSelection = true;
    }

    // @Override
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
                keywords = this.props.location.state.company?this.props.location.state.company:'';
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

    fetch(){
        this.setState({ loading: true });
        let token = sessionStorage.getItem('token');
        let { current,pageSize,keywords,order,filter } = this.state.pagination;
        request.get(common.baseUrl(this.fetchUrl))
            .set("token",token)
            .query({
                page: current,
                num: pageSize,
                keywords: keywords,
                order: order,
                filter: JSON.stringify(filter)
            })
            .end((err,res) => {
                if (err) return;
                let data = res.body.data.data;
                data.forEach((items, index) => {
                    data[index].key = items.user_id;
                    if (res.body.data.id_arr.indexOf(Number(items.user_id)) !== -1) {
                        data[index].isStarMark = 1;
                    } else {
                        data[index].isStarMark = 0;
                    }
                });
                let total = res.body.data.total;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen
                });
            });
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='update_time'){
            title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            content = title;
        } else if (key=='company'){
            title = row[key];
            if(row['certified']==1){
                content = <span><span style={{color: '#42db41',marginRight: 5}}>V</span>{row[key]}</span>
            }else if(row['certified']==2){
                content = <span><span style={{marginRight: 5}}>-</span>{row[key]}</span>
            }else{
                content = <span><span style={{color: '#ffee58',marginRight: 5}}>N</span>{row[key]}</span>
            }
        } else if (key === 'mainContacts') {
            const nameArr = [];
            row[key].forEach((items,index) => {
                if (items) {
                    if(items.name){
                        nameArr.push(<span onClick={() => this.nameLocation(items)} title={this.getTitle(items)} style={{marginRight: 8,textDecoration: 'underline',cursor: 'pointer'}}>{items.name}</span>);
                    }else{
                        nameArr.push(<span style={{marginRight: 8}}>{items}</span>);
                    }
                }
            });
            content = nameArr;
            title = content;
        } else if (key === 'sub_type') {
            let typeArr;
            try {
                typeArr = row[key].split(',').filter(items => items);
            } catch (error) {
                typeArr = [];
            }
            content = typeArr.map(items => {
                let color;
                if (items === '客') {
                    color = 'green';
                } else if (items === '用') {
                    color = 'blue';
                } else if (items === '公') {
                    color = 'magenta';
                }
                return <Tag color={color} onClick={() => this.jumpSubPage(items, row.company)}>{items}</Tag>
            });
            title = row[key];
        } else if (key === 'totalContactsOrderNum' || key === 'latestThreeMonthContactsOrderNum') {
            textAlign = 'right';
            title = row[key];
            content = title;
        } else {
            title = row[key];
            content = title;
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    jumpSubPage(items, company) {
        let pathname;
        if (items === '客') {
            this.props.siderList.forEach((items,index) => {
                if(items.link=='/customers'){
                    pathname = items.link;
                }
            });
            if(!pathname) pathname = '/customersView';
        } else if (items === '用') {
            pathname = '/endUser';
        } else if (items === '供') {
            pathname = '/buyer';
        } else {
            pathname = '/publicRelationShip';
        }
        hashHistory.push({
            pathname: pathname,
            state: {
                company,
            }
        });
    }

    nameLocation(items){
        let pathname;
        if(items.type=='member'){
            this.props.siderList.forEach((items,index) => {
                if(items.link=='/member'){
                    pathname = items.link;
                }
            });
            if(!pathname) pathname = '/memberView';
        }else{
            this.props.siderList.forEach((items,index) => {
                if(items.link=='/contacts'){
                    pathname = items.link;
                }
            });
            if(!pathname) pathname = '/contactsView';
        }
        hashHistory.push({
            pathname: pathname,
            state: {
                phone: items.phone
            }
        });
    }

    getTitle(items){
        if(items.type=='member'){
            return '类型：会员\n职位：'+items.job;
        }else{
            return '类型：认证联系人';
        }
    }

    //@override
    actionRender(text, row, index){
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                </p>;
    }

    //表格点击
    handleTableClick(record, index, e){
        const { data } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const user_id = record.user_id;
            let selectData;
            data.forEach((items,index) => {
                if(items.user_id==user_id){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }
    }

    //@Override
    inputRender(){
        const { data,pagination } = this.state;
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
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const certified = ['待认证','未通过','已认证'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"认证："}</span>
                        <CheckboxGroup options={certified} value={pagination.filter.certified.split(',')} onChange={(v) => this.filterType('certified',v)} />
                    </div>
                </div>
    }
}

export default VerUnit;