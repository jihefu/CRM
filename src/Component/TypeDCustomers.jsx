import React, { Component } from 'react';
import { Checkbox, Tooltip, Form, Popover, Input, Select, Drawer, Button,message, List, Upload } from 'antd';
import moment from 'moment';
import request from 'superagent';
import common from '../public/js/common.js';
import BaseTableList from './common/BaseTableList.jsx';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

class TypeDCustomers extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/customers/typeDList';
        this.placeholder = '客户';
        this.actionWidth = 110;
        this.filter = [ 'intent_degree' ];
        this.options = [
            {
                text: '意向度',
                value: 'intent_degree',
            },
            {
                text: '热度',
                value: 'hot_degree',
            },
            {
                text: '近期联系单数',
                value: 'latest_contact_num',
            },
            {
                text: '总联系单数',
                value: 'total_contact_num',
            },
            {
                text: '最近联系时间',
                value: 'latest_contact_time',
            },
            {
                text: '录入时间',
                value: 'insert_time',
            },
        ];
        this.res_data = {
            company: {
                label: '客户名',
                width: 250
            },
            total_contact_num: {
                label: '联系单数',
                width: 120
            },
            latest_contact_num: { 
                label: '近期联系单数', 
                width: 120
            },
            latest_contact_time: {
                label: '最近联系时间',
                width: 200
            },
            insert_time: {
                label: '录入时间',
                width: 120,
            },
            intent_degree: {
                label: '意向度',
                width: 120
            },
            hot_degree: {
                label: '热度',
                width: 120,
            },
            intention_products: {
                label: '意向产品',
                width: 250
            },
            manager: {
                label: '业务员',
                width: 150
            },
            other_staff: {label: '其他联系员工', width: 300},
        };
        this.state.pagination.filter.intent_degree = '';
        this.state.recordArr = [];
        this.state.infoBlock = false;
        this.state.actionBlock = false;
        this.state.selectItem = {};
        this.canRowSelection = true;
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
                    if (res.body.data.id_arr.indexOf(Number(items.id)) !== -1) {
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

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const intent_degree = [ 'D0', 'D1', 'D2', 'D3', 'D4', 'D5' ];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return (
            <div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"意向度："}</span>
                    <CheckboxGroup options={intent_degree} value={pagination.filter.intent_degree.split(',')} onChange={(v) => this.filterType('intent_degree',v)} />
                </div>
            </div>
        );
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='latest_contact_time'){
            if (row[key]) {
                title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            } else {
                title = '';
            }
            content = title;
        } else if (key === 'total_contact_num') {
            content = <span style={{cursor: 'pointer'}} onClick={() => this.fetchRecord(row.company, row[key])}>{row[key]}</span>;
            title = row[key];
        } else if (key === 'latest_contact_num') {
            content = <span style={{cursor: 'pointer'}} onClick={() => this.fetchRecord(row.company, row[key], true)}>{row[key]}</span>;
            title = row[key];
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

    // @Override
    fetchRecord(company, num, isLatest) {
        if (num === 0) {
            message.warn('暂无联系单记录');
            return;
        }
        let startDate;
        const endDate = moment().format('YYYY-MM-DD');
        if (isLatest) {
            startDate = moment().subtract(3, 'months').format('YYYY-MM-DD');
        } else {
            startDate = '2018-01-01';
        }
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/business/getOnlineContactRecord'))
            .set("token", token)
            .query({
                company,
                startDate,
                endDate,
                needList: true,
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    recordArr: res.body.list,
                    infoBlock: true,
                });
            });
    }

    renderMore(row) {
        this.setState({
            actionBlock: true,
            selectItem: row,
        });
    }

    //@override
    actionRender(text, row, index) {
        if (row.intent_degree === 3 || row.intent_degree === 4) {
            return (
                <p className={"_mark"}>
                    <a href="javascript:void(0)" onClick={() => this.renderMore(row)}>详情</a>
                </p>
            );
        }
        // if (row.intent_degree === 3 ) {
        //     return (
        //         <p className={"_mark"}>
        //             <a href="javascript:void(0)">递交技术方案</a>
        //         </p>
        //     );
        // } else if (row.intent_degree === 4 ) {
        //     return (
        //         <p className={"_mark"}>
        //             <a href="javascript:void(0)">递交销售合同</a>
        //             <a href="javascript:void(0)">关闭技术方案</a>
        //         </p>
        //     );
        // }
        return (
            <p className={"_mark"}>
                <a href="javascript:void(0)" style={{visibility: 'hidden'}}>foo</a>
            </p>
        );
    }

    renderRecord() {
        const { recordArr } = this.state;
        return (
            <List
                itemLayout="horizontal"
                dataSource={recordArr}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            title={moment(item.time).format('YYYY-MM-DD HH:mm:ss')}
                            description={'【' + item.staffName +'】' + ( item.content ? item.content : '' ) }
                        />
                    </List.Item>
                )}
            />
        );
    }

    renderAction() {
        const { selectItem } = this.state;
        if (!selectItem.TypeDInfo) return;
        const { intent_degree } = selectItem.TypeDInfo;
        const that = this;

        return (
            <div style={{display: 'flex'}}>
                <div style={{flex: 1}}></div>
                <div style={{display: 'flex', flexWrap: 'wrap', flex: 6}}>
                    { renderInfo() }
                    <div style={{marginTop: 30, width: '100%', textAlign: 'center'}}>
                        { checkActionPower() }
                    </div>
                </div>
                <div style={{flex: 1}}></div>
            </div>
        );

        function renderInfo() {
            let arr;
            if (intent_degree === 3) {
                arr = [{
                    label: '客户名',
                    value: selectItem.company,
                }, {
                    label: '热度',
                    value: selectItem.hot_degree,
                }, {
                    label: '技术方案',
                    value: selectItem.TypeDInfo.technical_solution 
                            ? <a target={'_blank'} href={common.staticBaseUrl('/d_solution/'+selectItem.TypeDInfo.technical_solution)}>{selectItem.TypeDInfo.technical_solution}</a>
                            : '暂无',
                }];
            } else {
                arr = [{
                    label: '客户名',
                    value: selectItem.company,
                }, {
                    label: '热度',
                    value: selectItem.hot_degree,
                }, {
                    label: '技术方案',
                    value: <a target={'_blank'} href={common.staticBaseUrl('/d_solution/'+selectItem.TypeDInfo.technical_solution)}>{selectItem.TypeDInfo.technical_solution}</a>,
                }];
            }
            return arr.map(items => (
                <div key={items.label} style={{
                    display: 'flex',
                    width: '50%',
                    color: 'rgba(0,0,0,0.85)',
                    fontWeight: 'normal',
                    fontSize: 16,
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                    padding: 12,
                }}>
                    <span>{items.label}：</span>
                    <span style={{whiteSpace: 'pre-wrap'}}>{items.value}</span>
                </div>
            ));
        }

        function checkActionPower() {
            if (intent_degree === 3) {
                const props = {
                    name: 'files',
                    action: common.baseUrl('/customers/uploadDSolution/' + selectItem.user_id),
                    headers: {
                        token: sessionStorage.getItem('token'),
                    },
                    showUploadList: false,
                    onChange(info) {
                        if (info.file.status === 'done') {
                            if (info.file.response.code == 200) {
                                message.success(info.file.response.msg);
                                that.setState({
                                    actionBlock: false,
                                });
                                that.fetch();
                            } else {
                                message.error(info.file.response.msg);
                            }
                        } else if (info.file.status === 'error') {
                            message.error(info.file.response.msg);
                        }
                    },
                };
                return (
                    <Upload { ...props }>
                        <Button>递交技术方案</Button>
                    </Upload>
                );
            }
            return (
                <div>
                    <Button onClick={() => that.changeDegree(selectItem.user_id, 5)}>递交销售合同</Button>
                    <Button onClick={() => that.changeDegree(selectItem.user_id, 3)} style={{marginLeft: 20}}>关闭技术方案</Button>
                </div>
            );
        }
    }

    changeDegree(user_id, intent_degree) {
        let r;
        if (intent_degree === 3) {
            r = window.confirm('确定关闭技术方案？');
        } else {
            r = window.confirm('确定递交销售合同？');
        }
        if (!r) return;
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/customers/changeDegree/' + user_id))
            .set("token", token)
            .send({
                intent_degree,
            })
            .end((err, res) => {
                if (err) return;
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    this.setState({
                        actionBlock: false,
                    });
                    this.fetch();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    //@override
    render(){
        let { data, pagination, infoBlock, actionBlock } = this.state;
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
                }
            };
            columns.push(o);
            if (key == this.fixedKey) o.fixed = 'left';
        }
        if(this.actioncolumns){
            columns.push({
                title: '操作',
                key: 'operation',
                fixed: 'right',
                width: this.actionWidth,
                render: (text, row, index) => {
                    return this.actionRender(text, row, index);
                },
            });
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
                <Drawer
                    title={'联系记录'}
                    placement={'right'}
                    width={400}
                    visible={infoBlock}
                    closable={true}
                    onClose={() => this.setState({infoBlock: false})}
                >
                    { this.renderRecord() }
                </Drawer>
                <Drawer
                    title={'详情'}
                    placement={'top'}
                    height={300}
                    visible={actionBlock}
                    closable={true}
                    onClose={() => this.setState({actionBlock: false})}
                >
                    { this.renderAction() }
                </Drawer>
            </div>
        )
    }
}

export default TypeDCustomers;