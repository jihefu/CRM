import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Modal, Radio, Icon, Button, message, Form, Input, Table, Select, Tooltip, Checkbox, Popover, Popconfirm, InputNumber, DatePicker, Spin, Upload, Alert } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import RemoteSearchInput from '../common/RemoteSearchInput';
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
                    text: '分配',
                    onClick: this.assign,
                },
            ];
            this.userId;
            this.endTime = moment(Date.now() + 60 * 60 * 1000 * 24 * 365);
        }

        state = {
            currentFunArr: this.funArr,
        };

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let isNotAssign = true;
            for (let i = 0; i < selectedRows.length; i++) {
                const items = selectedRows[i];
                if (items.is_assign == 1) {
                    isNotAssign = false;
                }
            }
            let currentFunArr = this.funArr;
            if (!isNotAssign) {
                currentFunArr = currentFunArr.filter(items => items.text != '分配');
            }
            this.setState({ currentFunArr });
        }

        assign = () => {
            const { selectedRowKeys } = this.props;
            const { handleAssign } = this;
            Modal.confirm({
                icon: <span></span>,
                title: '',
                content: <div>
                    <div>已选数量：{ selectedRowKeys.length }</div>
                    <RemoteSearchInput placeholder={'公司名或姓名'} style={{width: 250, marginTop: 20}} searchInputselected={v => this.userId = v} cbData={() => {}} remoteUrl={common.baseUrl('/virProducts/remoteSearchUserId?keywords=')} />
                    <DatePicker style={{marginTop: 20}} defaultValue={this.endTime} allowClear={false} onChange={this.dateChange} />
                </div>,
                okText: '确认',
                cancelText: '取消',
                onOk: handleAssign,
            });
        }

        dateChange = v => {
            this.endTime = v;
        }

        handleAssign = () => {
            let endTime = this.endTime;
            if (!endTime) {
                message.error('请选择有效时间');
                return;
            }
            endTime = moment(endTime).format('YYYY-MM-DD');
            const { userId } = this;
            const { selectedRowKeys } = this.props;
            if (!userId) {
                message.error('请选择分配对象');
                return;
            }
            if (selectedRowKeys.length === 0) {
                message.error('请选择抵价券');
                return;
            }
            const token = sessionStorage.getItem('token');
            request.post(common.baseUrl('/wallet/assignCouponByUserId'))
                .set("token", token)
                .send({
                    userId,
                    endTime,
                    couponNoArr: selectedRowKeys,
                })
                .end((err, res) => {
                    message.success(res.body.msg);
                    this.userId = null;
                    this.props.refresh();
                });
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


/********************************************** 组件 ***********************************************/
class WalletBank extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/wallet/bankCoupList';
        this.placeholder = '抵价券编号';
        this.filter = ['status', 'closeToEndTime'];
        this.actionWidth = 100;
        this.options = [
            {
                text: '默认排序',
                value: 'coupon_no_desc'
            },
            {
                text: '发行时间',
                value: 'coupon_no'
            },
        ];
        this.res_data = {
            coupon_no: {
                label: '编号',
                width: 150
            },
            amount: {
                label: '金额',
                width: 150
            },
            status: {
                label: '抵价券状态',
                width: 150
            },
            owner: {
                label: '持有人',
                width: 150
            },
            endTime: {
                label: '有效截止期',
                width: 150
            },
            create_time: {
                label: '发行时间',
            },
        };
        this.state.pagination.filter = {
            status: '已使用',
            closeToEndTime: '所有',
        }
        this.actioncolumns = false;
        this.num = 50;
        this.userId;
        this.state.loading = false;
        this.canRowSelection = true;
        this.state.endTimeDisabled = true;
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
                    data[index].key = items.coupon_no;
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

    // @Override
    inputRender() {
        const { pagination, selectedRowKeys, selectedRows } = this.state;
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
                { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{ "position": "relative", "top": 3, marginRight: 60 }}>发行</Button> }
                { <BtnGroup selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    //@override
    viewRender(key, res_data, text, row, index) {
        let content;
        let textAlign = 'left';
        if (key == 'create_time') {
            content = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        } else if (key === 'endTime') {
            if (row[key]) {
                content = moment(row[key]).format('YYYY-MM-DD');
            } else {
                content = '';
            }
        } else {
            content = row[key];
        }
        return <p style={{ width: res_data[key]['width'] - 32, textAlign: textAlign, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            {content}
        </p>
    }

    // @Override
    actionRender(text, row, index) {
        return <p className={"_mark"}>

        </p>;
    }

    // @Override
    handleCreate() {
        const self = this;
        Modal.confirm({
            icon: <span></span>,
            title: '',
            content: (
                <div>
                    抵价券数量：<InputNumber min={1} max={1000} defaultValue={self.num} onChange={v => self.num = v} />
                </div>
            ),
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
                self.createCoupon();
            }
        });
    }

    createCoupon = () => {
        const num = this.num;
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/wallet/printCoup'))
            .set("token", token)
            .send({
                num,
            })
            .end((err, res) => {
                this.fetch();
                message.success(res.body.msg);
            });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent() {
        const { pagination, endTimeDisabled } = this.state;
        const status = ['未分配', '未使用', '已使用', '已过期'];
        const closeToEndTime = ['所有', '半年', '三个月', '一个月'];
        if (JSON.stringify(pagination.filter) == '{}') return <div></div>;
        return <div>
            <div style={{ padding: '5px 0px 5px 0px' }}>
                <span style={{ fontWeight: 'bolder' }}>{"抵价券状态："}</span>
                <RadioGroup options={status} value={pagination.filter.status} onChange={(v) => this.filterType('status',v.target.value)} />
            </div>
            <div style={{ padding: '5px 0px 5px 0px' }}>
                <span style={{ fontWeight: 'bolder' }}>{"有效截止期："}</span>
                <RadioGroup disabled={endTimeDisabled} options={closeToEndTime} value={pagination.filter.closeToEndTime} onChange={(v) => this.filterType('closeToEndTime',v.target.value)} />
            </div>
        </div>
    }

    filterType = (type,v) => {
        let endTimeDisabled = true;
        const { pagination } = this.state;
        let { filter } = pagination;
        pagination.current = 1;
        this.filter.forEach((items,index) => {
            if(type==items){
                try{
                    filter[items] = v.join();
                }catch(e){
                    filter[items] = v;
                }
            }
        });
        if (pagination.filter.status.indexOf('未使用') !== -1) {
            endTimeDisabled = false;
        } else {
            endTimeDisabled = true;
            pagination.filter.closeToEndTime = '所有';
        }
        this.setState({
            pagination,
            selectedRowKeys: [],
            selectedRows: [],
            endTimeDisabled,
        },() => this.fetch());
    }

    //@Override
    tableRender(params) {
        const { columns, data, tableWidth, b_height } = params;
        return (
            <Table
                className={'walletBank'}
                columns={columns}
                dataSource={data}
                pagination={this.state.pagination}
                loading={this.state.loading}
                scroll={{ x: tableWidth, y: b_height - 40 }}
                rowSelection={this.rowSelection()}
                expandedRowRender={this.expandedRowRender}
                onChange={this.handleTableChange} />
        )
    }

    expandedRowRender = data => {
        const { coupon_no, logs } = data;
        if (!logs) {
            this.fetchLogs(coupon_no);
            return <div>加载中...</div>
        }
        const columns = [
            { title: '时间', dataIndex: 'create_time', key: 'create_time', width: 150 },
            { title: '类型', dataIndex: 'actionName', key: 'actionName', width: 100 },
            { title: '描述', dataIndex: 'no', key: 'no', render: (no, rows) => {
                if (rows.actionName === '交易') {
                    return (
                        <div>
                            <span>受让方：{ rows.transferee }</span>；
                            <span>出让方：{ rows.transferor }</span>
                        </div>
                    )
                } else {
                    if (rows.action == 2) {
                        return <span></span>
                    } else {
                        return <span>用于{ no }合同</span>
                    }
                }
            }},
        ];
        return (
            <Table
                columns={columns}
                dataSource={logs}
                pagination={false}
                bordered
                scroll={{ y: 300 }} 
            />
        )
    }

    fetchLogs = coupon_no => {
        const { data } = this.state;
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/wallet/getTargetCoupLog/' + coupon_no))
            .set("token",token)
            .end((err,res) => {
                const resData = res.body;
                data.forEach((items, index) => {
                    if (items.id == resData.id) {
                        data[index].logs = resData.logs;
                        this.setState({
                            data,
                        });
                    }
                });
            });
    }
}

export default WalletBank;