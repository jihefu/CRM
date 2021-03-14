import React, { Component } from 'react';
import BaseTableList from '../common/BaseTableList.jsx';
import common from '../../public/js/common.js';
import { hashHistory } from 'react-router';
import { Table, Tooltip, Select, Form, Button, Popover, Input, message, Checkbox, Modal, Tag } from 'antd';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import * as bluebird from 'bluebird';
const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
moment.locale('zh-cn');

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [];
            this.state = {
                currentFunArr: this.funArr,
                memberList: [],
            };
        }

        componentWillReceiveProps(props) {
            
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

class Seckill extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/seckill/listSeckill';
        this.addPathName = '/seckillAdd';
        this.editPathName = '/seckillEdit';
        this.options = [
            {
                text: '默认排序',
                value: 'id',
            },
        ];
        this.res_data = {
            start_time: {
                label: '秒杀开始时间',
                width: 200
            },
            goods_name: {
                label: '礼品名',
                width: 150
            },
            score: {
                label: '秒杀价',
                width: 100
            },
            plan_inventory: {
                label: '额定数量',
                width: 100
            },
            inventory: {
                label: '剩余数量',
                width: 100
            },
            survive_time: {
                label: '秒杀持续时间',
                width: 150
            },
            winnerName: {
                label: '参与会员',
                width: 200
            },
            is_end: {
                label: '活动是否结束',
                width: 150
            },
        };
        this.state.pagination.filter = {};
        this.filter = [];
        this.actionWidth = 100;
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
        if (key == 'start_time') {
            title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            content = title;
        } else if (key == 'survive_time') {
            title = row[key] + '秒';
            content = title;
        } else if (key == 'is_end') {
            title = row[key] == 1 ? '是' : '否';
            content = title;
        } else if (key === 'winnerName') {
            title = row[key].map(items => <Tag>{items}</Tag>)
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
                { row.is_end == 0 && <a href="javascript:void(0)">编辑</a> }
                { row.is_end == 1 && <a href="javascript:void(0)" style={{visibility: 'hidden'}}>foo</a> }
            </p>
        );
    }

    filterContent() {
        return <div></div>;
    }
}

export default Seckill;