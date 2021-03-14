import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Tag,Popover,Radio,notification,Divider } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const RadioGroup = Radio.Group;

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

class ContactsOrder extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/order/list';
        this.editPathName = '/contactsOrderEdit';
        this.placeholder = '姓名，公司，手机，标签';
        this.filter = ['staff','incoming_time','state'];
        this.markType = 'contact_message';
        // this.fixedKey = 'contact_name';
        this.options = [
            {
                text: '呼入时间',
                value: 'incoming_time'
            }
        ];
        this.res_data = {
            contact_name: {
                label: '联系人',
                width: 100
            },
            contact_unit: {
                label: '联系单位',
                width: 150
            },
            staff: {
                label: '业务经理',
                width: 120
            },
            state: {
                label: '状态',
                width: 150
            },
            tags: {
                label: '标签',
                width: 100
            },
            demand: {
                label: '客户请求',
                width: 200
            },
            content: {
                label: '我的答复',
                width: 200
            },
            incoming_time: {
                label: '通话时间',
                width: window.innerWidth<2000?200:''
            },
        };
        this.state.pagination.filter = {
            staff: '',
            incoming_time: '近一个月',
            state: '待提交,已提交'
        }
        this.state.staff = [];
        this.canRowSelection = true;
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='hang_up_time'||key=='incoming_time'){
            title = row[key]?moment(row[key]).format('YYYY-MM-DD HH:mm:ss'):null;
            content = title;
        }else if(key=='tags'){
            if(row[key]){
                content = <Tag key={row[key]}>{row[key]}</Tag>
            }else{
                content = '';
            }
            title = content;
        }else if(key=='contact_name'){
            const type = row['contact_type'];
            title = <span onClick={() => this.nameLocation(type,row['contact_phone'])} style={{textDecoration: 'underline',cursor: 'pointer'}}>{row[key]}</span>;
            content = title;
        } else if (key === 'state') {
            const state = row[key];
            if (state == '待提交') {
                return <Tag color={'rgb(255, 193, 7)'}>{state}</Tag>;
            } else if (state == '已提交') {
                return <Tag color={'rgb(0, 200, 83)'}>{state}</Tag>;
            }
            return <Tag>{state}</Tag>;
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

    nameLocation = (type,val) => {
        let pathname;
        if(type=='会员'){
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
                phone: val
            }
        });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination, staff } = this.state;
        const incoming_time = ['近一个月','近三个月','所有'];
        const state = ['待提交','已提交','已关闭'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div style={{maxWidth: 500}}>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"业务经理："}</span>
                        <CheckboxGroup options={staff} value={pagination.filter.staff.split(',')} onChange={(v) => this.filterType('staff',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"时间："}</span>
                        <RadioGroup options={incoming_time} value={pagination.filter.incoming_time} onChange={(v) => this.filterType('incoming_time',v.target.value)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"状态："}</span>
                        <CheckboxGroup options={state} value={pagination.filter.state.split(',')} onChange={(v) => this.filterType('state',v)} />
                    </div>
                </div>
    }

    //@override
    inputRender(){
        const { selectedRows, selectedRowKeys, pagination } = this.state;
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
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                        {/* <Button onClick={this.getUserStatusInfo} style={{"position":"relative","top":3,marginRight: 60}}>查看在线信息</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    getUserStatusInfo(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/order/getUserStatusInfo'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                const infoArr = res.body.data.map(items => {
                    if(items.status){
                        return  <div>
                                    <Divider />
                                    <p>{items.user_name}<span style={{marginLeft: 10}}>{items.phone}</span></p>
                                    <p>{'上次登陆时间：'+moment(items.login_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                                </div>;
                    }
                });
                notification.open({
                    message: '朗杰服务助手在线详情',
                    description: <div style={{maxHeight: window.innerHeight-200,overflow: 'auto'}}>{infoArr}</div>,
                    duration: null
                });
            });
    }

    //@override
    actionRender(text, row, index){
        const { staff,state } = row;
        const user_name = sessionStorage.getItem('user_name');
        if(staff==user_name&&state=='待提交'){
            return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <a className={"_mark_a"} style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                </p>;
        }else{
            return <p className={"_mark"}>
                    <a className={"_mark_a"} href="javascript:void(0)">标记</a>
                </p>;
        }
    }

    //@Override
    componentDidMount(){
        if(Base.GetStateSession()&&Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]){
            this.setState(Base.GetStateSession(),() => {
                this.initMark();
            });
            Base.RemoveStateSession();
        }else{
            this.fetchAllStaff();
            const { pagination } = this.state;
            try{
                pagination.order = this.options[0].value;
            }catch(e){

            }
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
        }
    }

    //获取所有员工信息
    fetchAllStaff(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.staffData = res.body.data;
                let { staff, pagination } = this.state;
                res.body.data.forEach((items) => {
                    const { branch,user_id,user_name } = items;
                    if(branch=='客户关系部') staff.push(user_name);
                });
                staff = [...new Set(staff)];
                const l_user_name = sessionStorage.getItem('user_name');
                if(staff.indexOf(l_user_name)==-1) staff.push(l_user_name);
                pagination.filter.staff = l_user_name;
                this.setState({
                    staff,
                    pagination
                },() => this.fetch());
            });
    }
}

export default ContactsOrder;