import React, { Component } from 'react';
import { Radio, Icon, Button, message, Form, Input, Table, Select, Tooltip, Checkbox, Popover, Popconfirm, InputNumber, DatePicker, Spin, Upload, Alert } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import 'moment/locale/zh-cn';
import $ from 'jquery';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const RadioGroup = Radio.Group;

class WalletList extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/wallet/list';
        this.editPathName = '/walletEdit';
        this.placeholder = '客户名，合同号，抵价券编号';
        this.filter = ['type'];
        this.actionWidth = 100;
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
            {
                text: '余额从高到低',
                value: 'hignToLow'
            },
            {
                text: '余额从低到高',
                value: 'lowToHigh'
            },
        ];
        this.res_data = {
            user_id: {
                label: '客户号',
                width: 200
            },
            company: {
                label: '客户名',
                width: 300
            },
            total_amount: {
                label: '余额'
            },
        };
        this.state.pagination.filter = {
            type: '客户',
        }
        this.actioncolumns = false;
        this.canRowSelection = true;
    }

    //@override
    viewRender(key, res_data, text, row, index) {
        let title, content;
        let textAlign = 'left';
        if (key == 'insert_time' || key == 'update_time') {
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }
        title = row[key];
        content = row[key];
        return <p style={{ width: res_data[key]['width'] - 32, textAlign: textAlign, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    //@Override
    inputRender() {
        const { pagination } = this.state;
        return <div>
            <Form style={{ "display": "flex", padding: "24px 0 0 24px" }}>
                <div style={{ flex: 1, display: 'flex' }}>
                    <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
                        <Button style={{ "marginRight": 15, "top": 4 }}>{"筛选"}</Button>
                    </Popover>
                    <Form.Item>
                        <Input name="keywords" style={{ width: 300 }} placeholder={this.placeholder} defaultValue={pagination.keywords} />
                    </Form.Item>
                    <Button type="primary" onClick={this.handleSearch} style={{ "position": "relative", "left": 15, "top": 3 }}>搜索</Button>
                    <span style={{ marginLeft: 50 }}>
                        <Select defaultValue={pagination.order} onChange={this.orderChange} style={{ "position": "relative", "top": 3, minWidth: 120 }}>
                            {
                                this.options.map(items =>
                                    <Option key={items.value} value={items.value}>{items.text}</Option>
                                )
                            }
                        </Select>
                    </span>
                </div>
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    fetchTargetWallet = user_id => {
        const { data } = this.state;
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/targetWallet/' + user_id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const targetData = res.body.data;
                data.forEach((items, index) => {
                    if (items.id === targetData.id) {
                        for (const key in targetData) {
                            data[index][key] = targetData[key];
                        }
                    }
                });
                this.setState({
                    data,
                });
            });
    }

    //@override
    //子表格
    expandedRowRender = data => {
        const { WalletDepos, WalletCoups, id, user_id } = data;
        if (!WalletCoups) {
            this.fetchTargetWallet(user_id);
            return <div>正在加载...</div>
        }
        let depoAmount = 0, coupAmount = 0;
        WalletDepos.map(items => { depoAmount += Number(items.amount) });
        WalletCoups.map(items => { coupAmount += Number(items.amount) });
        WalletDepos.forEach((items, index) => {
            WalletDepos[index].hasUsed = Number(items.original_amount) - Number(items.amount);
        });
        const columns = [
            {
                title: <span style={{ display: 'flex' }}><span style={{ width: 75, paddingTop: 5 }}>抵价券编号</span><Input
                    style={{ flex: 1 }}
                    placeholder={'搜索'}
                    onChange={e => {
                        const v = e.target.value;
                        const { data } = this.state;
                        const filterWalletCoups = [];
                        data.forEach((items, index) => {
                            if (items.id == id) {
                                items.WalletCoups.forEach(it => {
                                    const coupon_no = it.coupon_no;
                                    if (coupon_no.indexOf(v) != -1) filterWalletCoups.push(it);
                                });
                                data[index].WalletCoups = filterWalletCoups;
                            }
                        });
                        this.setState({
                            data
                        });
                    }}
                /></span>, dataIndex: 'coupon_no', key: 'coupon_no', width: 250
            },
            { title: '面值', dataIndex: 'amount', key: 'amount', width: 100, sorter: (a, b) => Number(a.amount) - Number(b.amount) },
            { title: '失效日期', dataIndex: 'endTime', key: 'endTime', sorter: (a, b) => Date.parse(a.endTime) - Date.parse(b.endTime) },
        ];
        const columns2 = [
            {
                title: <span style={{ display: 'flex' }}><span style={{ width: 50, paddingTop: 5 }}>合同号</span><Input
                    style={{ flex: 1 }}
                    placeholder={'搜索'}
                    onChange={e => {
                        const v = e.target.value;
                        const { data } = this.state;
                        const filterWalletDepos = [];
                        data.forEach((items, index) => {
                            if (items.id == id) {
                                items.WalletDepos.forEach(it => {
                                    const contract_no = it.contract_no;
                                    if (contract_no.indexOf(v) != -1) filterWalletDepos.push(it);
                                });
                                data[index].WalletDepos = filterWalletDepos;
                            }
                        });
                        this.setState({
                            data,
                        });
                    }}
                /></span>, dataIndex: 'contract_no', key: 'contract_no', width: 250
            },
            { title: '可用值', dataIndex: 'amount', key: 'amount', width: 100, sorter: (a, b) => Number(a.amount) - Number(b.amount) },
            { title: '原值', dataIndex: 'original_amount', key: 'original_amount', width: 100, sorter: (a, b) => Number(a.original_amount) - Number(b.original_amount) },
            // { title: '已用值', dataIndex: 'hasUsed', key: 'hasUsed', width: 100, sorter: (a, b) => Number(a.hasUsed) - Number(b.hasUsed) },
            { title: '失效日期', dataIndex: 'endTime', key: 'endTime', sorter: (a, b) => Date.parse(a.endTime) - Date.parse(b.endTime) }
        ];
        return (
            <div>
                <Table
                    columns={columns}
                    dataSource={WalletCoups}
                    pagination={false}
                    bordered
                    scroll={{ y: 300 }}
                    footer={() => <span style={{ fontWeight: 'bolder' }}>抵价券总计：{coupAmount}</span>}
                />
                <Table
                    style={{ marginTop: 30 }}
                    columns={columns2}
                    dataSource={WalletDepos}
                    pagination={false}
                    bordered
                    scroll={{ y: 300 }}
                    footer={() => <span style={{ fontWeight: 'bolder' }}>服务保证金总计：{depoAmount}</span>}
                />
            </div>
        );
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent() {
        const { pagination } = this.state;
        const type = ['客户', '会员'];
        if (JSON.stringify(pagination.filter) == '{}') return <div></div>;
        return <div>
            <div style={{ padding: '5px 0px 5px 0px' }}>
                <span style={{ fontWeight: 'bolder' }}>{"类型："}</span>
                <RadioGroup options={type} value={pagination.filter.type} onChange={(v) => this.filterType('type', v.target.value)} />
            </div>
        </div>
    }

    //@Override
    tableRender(params) {
        const { columns, data, tableWidth, b_height } = params;
        return (
            <Table 
                columns={columns} 
                dataSource={data} 
                pagination={this.state.pagination}
                loading={this.state.loading}
                scroll={{ x: tableWidth, y: b_height }} 
                onRowClick={this.handleTableClick}
                rowSelection={this.rowSelection()}
                expandedRowRender={this.expandedRowRender}
                onChange={this.handleTableChange} />
        )
    }

    componentDidUpdate() {
        this.initMark();
        const { pagination, selectedRowKeys } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none';
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
        }
        const w = 300;
        const footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder;">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
    }
}

export default WalletList;