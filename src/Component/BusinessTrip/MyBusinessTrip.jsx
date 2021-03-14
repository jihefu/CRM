import React, { Component } from 'react';
import { Icon, Button,message,Form,Input,Radio,Select,Tooltip,Checkbox,Popover,Tag, Modal, InputNumber, Table } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BusinessTrip from './BusinessTrip.jsx';
import $ from 'jquery';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import * as bluebird from 'bluebird';
import 'moment/locale/zh-cn';
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
                    text: '申请报销',
                    onClick: this.apply,
                },
                {
                    text: '删除',
                    onClick: this.delete,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        apply = async () => {
            const { selectedRowKeys: idArr } = this.props;
            const r = window.confirm('确认申请报销' + idArr.length + '条出差单？');
            if (!r) {
                return;
            }
            const toast = message.loading('正在提交中');
            const token = sessionStorage.getItem('token');
            await new Promise(resolve => {
                request.put(common.baseUrl('/businessTrip/applyExpenseBatch'))
                    .set("token", token)
                    .send({ idArr })
                    .end((err, res) => {
                        if (err) return;
                        toast();
                        message.success(res.body.msg);
                        resolve();
                    });
            });
            this.props.refresh();
        }

        delete = async () => {
            const { selectedRowKeys: idArr } = this.props;
            const r = window.confirm('确认删除' + idArr.length + '条出差单？');
            if (!r) {
                return;
            }
            const toast = message.loading('正在提交中');
            const token = sessionStorage.getItem('token');
            await bluebird.map(idArr, async id => {
                await new Promise(resolve => {
                    request.delete(common.baseUrl('/businessTrip/del'))
                        .set("token", token)
                        .send({ id })
                        .end((err, res) => {
                            if (err) return;
                            resolve();
                        });
                });
            }, { concurrency: 2 });
            message.success('批量操作成功');
            toast();
            this.props.refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            let showBtn = true;
            for (let i = 0; i < selectedRows.length; i++) {
                const { state } = selectedRows[i];
                if (state != '填报中') {
                    showBtn = false;
                }
            }
            if (!showBtn) {
                currentFunArr = [];
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

class MyBusinessTrip extends BusinessTrip {
    constructor(props) {
        super(props);
        this.addPathName = '/myBusinessTripAdd';
        this.editPathName = '/myBusinessTripEdit';
        this.state.pagination.filter.state = '';
    }

    //@Override
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
                filter: JSON.stringify(filter),
                isSelf: 1,
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
    inputRender(){
        const { pagination, selectedRowKeys, selectedRows } = this.state;
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

    //@override
    actionRender(text, row, index){
        if (row.state === '填报中') {
            return (
                <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                </p>
            );
        }
        return (
            <p className={"_mark"}>
                <a href="javascript:void(0)" style={{visibility: 'hidden'}}>foo</a>
            </p>
        );
    }
}

export default MyBusinessTrip;