import React, { Component } from 'react';
import BaseTableList from '../common/BaseTableList.jsx';
import common from '../../public/js/common.js';
import { hashHistory } from 'react-router';
import { Table, Tooltip, Select, Form, Button, Popover, Input, message, Checkbox, Modal } from 'antd';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import request from 'superagent';
import * as bluebird from 'bluebird';
const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '赠予',
                    onClick: this.giving,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
                memberList: [],
            };
        }

        componentDidMount() {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/member/totalMemberList'))
                .set("token",token)
                .end((err,res) => {
                    if (err) return;
                    this.setState({ memberList: res.body.data });
                });
        }

        giving = () => {
            const { selectedRowKeys, refresh } = this.props;
            const { memberList } = this.state;
            let unionid;
            Modal.confirm({
                icon: <span></span>,
                title: '赠予对象',
                content: <Select onChange={v => unionid = v} 
                            showSearch
                            style={{ width: '100%' }}
                            filterOption={(input, option) =>
                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {
                                memberList.map(items => <Option value={items.unionid} key={items.unionid}>{items.name}</Option>)
                            }
                        </Select>,
                onOk() {
                    if (!unionid) {
                        message.error('请选择赠与对象');
                        return;
                    }
                    return new Promise(async (resolve, reject) => {
                        const token = sessionStorage.getItem('token');
                        await bluebird.map(selectedRowKeys, async goodsId => {
                            await new Promise(resolve => {
                                request.post(common.baseUrl('/member/giving'))
                                    .set("token", token)
                                    .send({
                                        unionid,
                                        goodsId,
                                    })
                                    .end((err, res) => {
                                        if (err) return;
                                        if (res.body.code == -1) {
                                            message.error(res.body.msg);
                                        } else {
                                            message.success(res.body.msg);
                                        }
                                        resolve();
                                    });
                            });
                        }, { concurrency: 1 });
                        refresh();
                        resolve();
                    });
                },
                onCancel() { },
            });
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            let showGiving = true;
            for (let i = 0; i < selectedRows.length; i++) {
                const { isOpen, inventory } = selectedRows[i];
                if (isOpen == 2 || inventory < 1) {
                    showGiving = false;
                }
            }

            if (!showGiving) {
                currentFunArr = currentFunArr.filter(items => items.text !== '赠予');
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

class VehicleRegist extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/member/getGiftList';
        this.addPathName = '/cashGiftAdd';
        this.editPathName = '/cashGiftEdit';
        this.options = [
            {
                text: '默认排序',
                value: 'id',
            },
            {
                text: '元宝分排序',
                value: 'needScore',
            },
        ];
        this.res_data = {
            goodsName: {
                label: '礼品名',
                width: 200
            },
            needScore: {
                label: '优惠价',
                width: 100
            },
            originalScore: {
                label: '原价',
                width: 100
            },
            exchangeCount: {
                label: '兑换数量',
                width: 100
            },
            inventory: {
                label: '库存数量',
                width: 100
            },
            isOpen: {
                label: '开放对象',
                width: 150
            },
        };
        this.state.pagination.filter = {
            isOpen: '微信公众号',
        };
        this.filter = ['isOpen'];
        this.actionWidth = 100;
        this.canRowSelection = true;
    }

    componentDidMount() {
        const { pagination } = this.state;
        try {
            pagination.order = this.options[0].value;
        } catch (e) {

        }
        this.setState({
            pagination
        }, () => {
            this.fetch();
        });
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
                        { <BtnGroup selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    handleTableClick(record, index, e) {
        const { data } = this.state;
        if (e.target.innerHTML == '编辑') {
            const id = record.id;
            let selectData;
            data.forEach(items => {
                if (items.id == id) {
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }
    }

    //@override
    viewRender(key, res_data, text, row, index) {
        let title, content;
        let textAlign = 'left';
        if (key == 'isOpen') {
            if (row[key] == 0) {
                title = '不开放';
            } else if (row[key] == 1) {
                title = '微信公众号';
            } else if (row[key] == 2) {
                title = '竞猜小程序';
            }
            content = title;
        } else {
            title = row[key];
            content = row[key];
        }
        return <p style={{ width: res_data[key]['width'] - 32, textAlign: textAlign, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    actionRender(text, row, index) {
        return (
            <p className={"_mark"}>
                <a href="javascript:void(0)">编辑</a>
            </p>
        );
    }

    filterContent() {
        const { pagination } = this.state;
        const isOpen = ['不开放', '微信公众号', '竞猜小程序'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"开放对象："}</span>
                        <CheckboxGroup options={isOpen} value={pagination.filter.isOpen.split(',')} onChange={(v) => this.filterType('isOpen',v)} />
                    </div>
                </div>
    }

    //@override
    tableRender(params) {
        const { columns, data, tableWidth, b_height } = params;
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

    expandedRowRender(data) {
        const columns = [
            { title: '兑换人', dataIndex: 'applyName', key: 'applyName', width: 150 },
            { title: '昵称', dataIndex: 'applyNickName', key: 'applyNickName', width: 150 },
            { title: '元宝分', dataIndex: 'needScore', key: 'needScore', width: 150 },
            { title: '途径', dataIndex: 'type', key: 'type', width: 150 },
            { title: '兑换时间', dataIndex: 'consumeTime', key: 'consumeTime' },
        ];
        common.resizeTableHeight();
        return (
            <Table
                columns={columns}
                dataSource={data.ExchangeRecords}
                pagination={false}
            />
        )
    }
}

export default VehicleRegist;