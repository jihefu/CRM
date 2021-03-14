import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Popconfirm,DatePicker,Radio,Modal,Divider } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import common from '../public/js/common.js';
import BaseTableList from './common/BaseTableList.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
const { RangePicker } = DatePicker;

class OnlineAssessment extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/attendance/onlineAssessment';
        this.addPathName = '';
        this.editPathName = '';
        this.placeholder = '姓名';
        this.filter = ['branch','group'];
        this.actionWidth = 150;
        this.fixedKey = 'user_name';
        this.options = [
            {
                text: '默认排序',
                value: 'id'
            }
        ];
        this.res_data = {
            user_name: {
                label: '姓名',
                width: 100
            },
            joinAffair: {
                label: '参与事务',
                width: 100
            },
            notUpdate: {
                label: '未更新',
                width: 100
            },
            directotAffair: {
                label: '负责事务',
                width: 100
            },
            overTime: {
                label: '逾期',
                width: 100
            },
            warnProgress: {
                label: '进度警告',
                width: 100
            },
            received: {
                label: '收到推送',
                width: 100
            },
            notRead: {
                label: '未读',
                width: 100
            },
            atMe: {
                label: '收到@',
                width: 100
            },
            notReply: {
                label: '未答复',
                width: 100
            },
            serverDuty: {
                label: '服务工作日',
                width: 100
            },
            appNotSign: {
                label: 'APP未签到',
                width: 100
            },
        };
        this.state.pagination.filter = {
            branch: '',
            group: '',
            startDate: moment().startOf('month').format("YYYY-MM-DD")+" 00:00:00",
            endDate: moment().endOf('month').format("YYYY-MM-DD")+" 23:59:59",
        }
    }

    rangeDateChange = v => {
        const startDate = v[0].format("YYYY-MM-DD")+" 00:00:00";
        const endDate = v[1].format("YYYY-MM-DD")+" 23:59:59";
        const { pagination } = this.state;
        pagination.filter.startDate = startDate;
        pagination.filter.endDate = endDate;
        this.setState({
            pagination,
        }, () => this.fetch());
    }

    //@Override
    inputRender(){
        const { data,pagination } = this.state;
        const defaultRangeDate = [moment().startOf('month'), moment().endOf('month')];
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
                    <RangePicker allowClear={false} defaultValue={defaultRangeDate} style={{width: 222, position: 'relative', top: -20, left: 24}} onChange={this.rangeDateChange} />
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        if (key == 'notRead') {
            title = <span style={{cursor: 'pointer'}} title={'点击查看详情'} onClick={() => this.getTargetEvent('1501', row['user_id'])}>{row[key]}</span>
        } else if (key == 'notReply') {
            title = <span style={{cursor: 'pointer'}} title={'点击查看详情'} onClick={() => this.getTargetEvent('1502', row['user_id'])}>{row[key]}</span>
        } else if (key == 'notUpdate') {
            title = <span style={{cursor: 'pointer'}} title={'点击查看详情'} onClick={() => this.getTargetEvent('1503', row['user_id'])}>{row[key]}</span>
        } else {
            title = row[key];
        }
        content = title;
        return <p style={{width: res_data[key]['width'],margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        {/* <Tooltip placement="top" title={title}> */}
                            {content}
                        {/* </Tooltip> */}
                    </p>
    }

    getTargetEvent = (type, user_id) => {
        const { pagination } = this.state;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/getTargetEvent'))
            .set("token", token)
            .query({
                type,
                user_id,
                startDate: pagination.filter.startDate,
                endDate: pagination.filter.endDate,
            })
            .end((err, res) => {
                if (err) return;
                if (res.body.data.length === 0) return;
                const { title, content } = this.getTemp(res.body.data);
                Modal.confirm({
                    icon: <span></span>,
                    title,
                    content,
                    okText: '确认',
                    cancelText: '取消',
                });
            });
    }

    getTemp = params => {
        let title = '', content = '';
        const { type } = params[0];
        if (type === '1501' || type === '1502') {
            if (type === '1501') {
                title = '未阅读明细';
            } else {
                title = '未回复明细';
            }
            const resArr = params.map(items => {
                return <div>
                    <Divider />
                    <div>
                        <span>记录时间：</span>
                        <span>{moment(items.time).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                    <div>
                        <span>事务名称：</span>
                        <span>{items.content.notiTitle}</span>
                    </div>
                    <div>
                        <span>发布人：</span>
                        <span>{items.content.notiSenderName}</span>
                    </div>
                    <div>
                        <span>发布时间：</span>
                        <span>{moment(items.content.notiPostTime).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                    <div>
                        <span>内容：</span>
                        <span>{items.content.notiContent}</span>
                    </div>
                </div>
            });
            content = <div style={{maxHeight: window.innerHeight - 300, overflow: 'auto'}}>{resArr}</div>;
        }else if (type === '1503') {
            title = '未更新明细';
            const resArr = params.map(items => {
                return <div>
                    <Divider />
                    <div>
                        <span>记录时间：</span>
                        <span>{moment(items.time).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                    <div>
                        <span>事务名称：</span>
                        <span>{items.content.notiTitle}</span>
                    </div>
                </div>
            });
            content = <div style={{maxHeight: window.innerHeight - 300, overflow: 'auto'}}>{resArr}</div>;
        }
        return {
            title,
            content,
        };
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const group = ['杭州组', '济南组'];
        const branch = ['客户关系部', '研发部','生产部','管理部'];
        // const date = ['当月','上月'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"分组："}</span>
                        <CheckboxGroup options={group} value={pagination.filter.group.split(',')} onChange={(v) => this.filterType('group',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"部门："}</span>
                        <CheckboxGroup options={branch} value={pagination.filter.branch.split(',')} onChange={(v) => this.filterType('branch',v)} />
                    </div>
                </div>
    }

    //@Override
    //分页
    handleTableChange(pagination){
        
    }

    //@Override
    tableRender(params){
        const {columns,data,tableWidth,b_height} = params;
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={false}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    onChange={this.handleTableChange} />
    }

    //@Override
    render(){
        let { data,pagination } = this.state;
        let res_data = this.res_data;
        let b_height = window.innerHeight-308;
        const columns = [];
        let tableWidth = this.tableWidth;
        for(let key in res_data){
            tableWidth += res_data[key]['width'];
            let o = {
                title: res_data[key].label,
                dataIndex: key,
                key: key,
                width: res_data[key]['width'],
                render: (text, row, index) => {
                    return this.viewRender(key, res_data, text, row, index);
                },
                sorter: (a, b) => a[key] - b[key],
            };
            columns.push(o);
            if (key == this.fixedKey) o.fixed = 'left';
        }
        if(!pagination.order) return <p></p>;
        return (
            <div>
                {this.inputRender()}
                {
                    this.tableRender({
                        columns: columns,
                        data: data,
                        tableWidth: tableWidth,
                        b_height: b_height
                    })
                }
            </div>
        )
    }
}

export default OnlineAssessment;