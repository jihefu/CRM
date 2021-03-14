import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Radio,Select,Tooltip,Checkbox,Popover,Tag, Modal, InputNumber, Table, Popconfirm } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import PhotoLooker from '../common/PhotoLooker.jsx';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const RadioGroup = Radio.Group;

class BusinessTrip extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/businessTrip/list';
        this.editPathName = '/businessTripEdit';
        this.placeholder = '姓名，出差单位';
        this.actionWidth = 100;
        this.filter = [ 'state', 'type', 'create_time' ];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
        ];
        this.res_data = {
            user_name: {
                label: '申请人',
                width: 150
            },
            // branch: {
            //     label: '部门',
            //     width: 150
            // },
            // create_time: {
            //     label: '申请日期',
            //     width: 200
            // },
            state: {
                label: '状态',
                width: 150
            },
            amount: { label: '出差费用', width: 150 },
            go_out_time: {
                label: '出差起始日期',
                width: 150
            },
            back_time: {
                label: '出差结束日期',
                width: 150
            },
            // company: {
            //     label: '客户单位',
            //     width: 200,
            // },
            // addr: {
            //     label: '地址',
            //     width: 200,
            // },
            type: {
                label: '出差类型',
                width: 150,
            },
            reason: {
                label: '出差事由',
                width: 200
            },
            director: {
                label: '指派人',
                width: 150
            },
            check_person: {label: '审核人', width: 150},
            check_rem: {label: '审核备注', width: 200},
            check_time: {label: '审核时间', width: 200},
        };
        this.state.pagination.filter.state = '报销中,已通过';
        this.state.pagination.filter.type = '';
        this.state.pagination.filter.create_time = '当月';
        this.state.amount = 0;
        this.amount = 100;
        this.check_rem = '';
        this.expandedRowRender = this.expandedRowRender.bind(this);
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

    componentDidUpdate(){
        const { amount, selectedRowKeys, selectedRows, pagination } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none', totalNum = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalNum = amount;
        } else {
            selectedRows.forEach(items => {
                totalNum += Number(items.amount);
            });
        }
        totalNum = parseFloat(totalNum).toFixed(2);
        let containerWidth = $('.ant-spin-container').width();
        let w = containerWidth - 500;
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">总出差费用：</span>'+
                                '<span>'+totalNum+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
    }

    //获取数据
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
                    data[index].key = items.id;
                });
                let total = res.body.data.total;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    amount: res.body.data.amount,
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
        if(key=='create_time' || key === 'check_time'){
            if (row[key]) {
                title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            } else {
                title = '';
            }
            content = title;
        } else if (key === 'go_out_time' || key === 'back_time') {
            if (row[key]) {
                title = moment(row[key]).format('YYYY-MM-DD');
            } else {
                title = '';
            }
            content = title;
        } else if (key === 'state') {
            title = row[key];
            if (row.state === '报销中') {
                content = <Tag color='#ffc107'>报销中</Tag>
            } else if (row.state === '已通过') {
                content = <Tag color='#00C853'>已通过</Tag>
            } else {
                content = <Tag>{row.state}</Tag>
            }
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

    //@override
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

    //@override
    actionRender(text, row, index){
        const user_id = sessionStorage.getItem('user_id');
        const hasPower = common.powerCheckMeetOrder.indexOf(user_id) === -1 ? false : true;
        if (row.state === '报销中' && hasPower) {
            return (
                <p className={"_mark"}>
                    <a href="javascript:void(0)" onClick={() => { this.agree(row) }}>通过</a>
                    <a href="javascript:void(0)" onClick={() => { this.disagree(row) }} style={{marginLeft: 8}}>退回</a>
                </p>
            );
        } else if (row.state === '已通过' && hasPower) {
            return (
                <p className={"_mark"}>
                    <Popconfirm
                        placement="bottomRight"
                        title={<div>
                            <span>出差费用：</span>
                            <InputNumber step={100} min={0} max={50000} onChange={v => row.amount = v} defaultValue={row.amount} />
                        </div>}
                        onConfirm={() => this.changeAmount(row.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <a href="javascript:void(0)">修改费用</a>
                    </Popconfirm>
                </p>
            );
        }
        return (
            <p className={"_mark"}>
                <a href="javascript:void(0)" style={{visibility: 'hidden'}}>foo</a>
            </p>
        );
    }

    changeAmount(id) {
        const { data } = this.state;
        data.forEach(items => {
            if (items.id == id) {
                const amount = items.amount;
                const token = sessionStorage.getItem('token');
                request.put(common.baseUrl('/businessTrip/changeAmount'))
                    .set("token", token)
                    .send({
                        id,
                        amount,
                    })
                    .end((err, res) => {
                        if (err) return;
                        message.success(res.body.msg);
                        this.fetch();
                    });
            }
        });
    }

    agree(data) {
        const token = sessionStorage.getItem('token');
        const that = this;
        this.amount = 100;
        this.check_rem = '';
        Modal.confirm({
            icon: <Icon type="info-circle" />,
            content: <div>
                <div>
                    出差费用：<InputNumber min={0} step={50} defaultValue={this.amount} onChange={v => that.amount = v} />
                </div>
                <div style={{marginTop: 16, display: 'flex'}}>
                    备注：<Input style={{flex: 1}} defaultValue={this.check_rem} onChange={e => that.check_rem = e.target.value} />
                </div>
            </div>,
            async onOk() {
                const { amount, check_rem } = that;
                return new Promise((resolve, reject) => {
                    request.put(common.baseUrl('/businessTrip/agree'))
                        .set("token", token)
                        .send({
                            id: data.id,
                            amount,
                            check_rem,
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success(res.body.msg);
                            that.fetch();
                            resolve();
                        });
                });
            },
        });
    }

    disagree(data) {
        const token = sessionStorage.getItem('token');
        const that = this;
        this.amount = 100;
        this.check_rem = '';
        Modal.confirm({
            icon: <Icon type="info-circle" />,
            content: <div>
                <div style={{marginTop: 16, display: 'flex'}}>
                    备注：<Input style={{flex: 1}} defaultValue={this.check_rem} onChange={e => that.check_rem = e.target.value} />
                </div>
            </div>,
            async onOk() {
                const { amount, check_rem } = that;
                return new Promise((resolve, reject) => {
                    request.put(common.baseUrl('/businessTrip/disagree'))
                        .set("token", token)
                        .send({
                            id: data.id,
                            check_rem,
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success(res.body.msg);
                            that.fetch();
                            resolve();
                        });
                });
            },
        });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const state = [ '填报中', '报销中', '已通过' ];
        const create_time = [ '当月', '上月', '所有' ];
        const type = [ '销售', '服务', '公务安排', '学习', '培训', '会议', '其他' ];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return (
            <div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"审核状态："}</span>
                    <CheckboxGroup options={state} value={pagination.filter.state.split(',')} onChange={(v) => this.filterType('state',v)} />
                </div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"出差类型："}</span>
                    <CheckboxGroup options={type} value={pagination.filter.type.split(',')} onChange={(v) => this.filterType('type',v)} />
                </div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"申请时间："}</span>
                    <RadioGroup options={create_time} value={pagination.filter.create_time} onChange={(v) => this.filterType('create_time',v.target.value)}/>
                </div>
            </div>
        );
    }

    //@override
    tableRender(params){
        const {columns,data,tableWidth,b_height} = params;
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    expandedRowRender={this.expandedRowRender}
                    rowSelection={this.rowSelection()}
                    onChange={this.handleTableChange} />
    }

    //@override
    //子表格
    expandedRowRender(data){
        const columns = [
            { title: '见面单位', dataIndex: 'company', key: 'company', width: 200 },
            { title: '联系时间', dataIndex: 'contact_time', key: 'contact_time', width: 120 },
            { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 100 },
            { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 100 },
            { title: '目的', dataIndex: 'purpose', key: 'purpose', width: 100 },
            { title: '见面地点', dataIndex: 'addr', key: 'addr', width: 150 },
            { title: '照片', dataIndex: 'albumTrans', key: 'albumTrans', width: 200 },
            { title: '内容', dataIndex: 'content', key: 'content' },
        ];
        data = data.meet_orders;
        for (let i = 0; i < data.length; i++) {
            let albumArr;
            try {
                albumArr = data[i].album.split(',').filter(items => items);
                const _arr = JSON.parse(JSON.stringify(albumArr));
                albumArr = albumArr.map(items => {
                    return (
                        <img onClick={() => {
                            this.setState({
                                photoOption: {
                                    imgSrc: common.staticBaseUrl('/img/gallery/' + items),
                                    canRenderPhoto: true,
                                    albumBorwerArr: _arr,
                                },
                            });
                        }} key={items} style={{width: 30, cursor: 'pointer'}} src={common.baseUrl2('/img/gallery/list_' + items)} />
                        // <a key={items} target={'_blank'} href={common.baseUrl2('/img/gallery/' + items)}>
                        //     <img style={{width: 30, cursor: 'pointer'}} src={common.baseUrl2('/img/gallery/list_' + items)} />
                        // </a>
                    )
                });
            } catch (e) {
                albumArr = [];
            }
            data[i].albumTrans = albumArr;
        }
        common.resizeTableHeight();
        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
            />
        );
    }

    //@Override
    handleTableClick(record, index, e){
        const { data } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            this.state.data.forEach((items, index) => {
                items.meet_orders.forEach(it => {
                    delete it.albumTrans;
                });
            });
            Base.SetStateSession(this.state);
            const id = record.id;
            let selectData;
            data.forEach((items,index) => {
                if(items.id==id){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }else if(e.target.innerHTML=='标记'){
            let targetDom = e.target;
            this.addMark(record.id,this.markType,() => {
                targetDom.innerHTML = '取消标记';
            });
        }else if(e.target.innerHTML=='取消标记'){
            let targetDom = e.target;
            this.cancelMark(record.id,this.markType,() => {
                targetDom.innerHTML = '标记';
            });
        }
    }

    //新增
    handleCreate(){
        this.state.data.forEach((items, index) => {
            items.meet_orders.forEach(it => {
                delete it.albumTrans;
            });
        });
        Base.SetStateSession(this.state);
        hashHistory.push({
            pathname: this.addPathName
        });
    }
}

export default BusinessTrip;