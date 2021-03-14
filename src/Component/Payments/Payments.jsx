import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [];
            this.state = {
                currentFunArr: this.funArr,
            };
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

class Payments extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/payment/list';
        this.addPathName = '/paymentsAdd';
        this.editPathName = '/paymentsEdit';
        this.placeholder = '公司';
        this.filter = [''];
        this.actionWidth = 100;
        // this.fixedKey = 'company';
        this.options = [
            {
                text: '到款时间',
                value: 'arrival'
            },
            {
                text: '最近更新',
                value: 'update_time'
            }
        ];
        this.res_data = {
            company: {
                label: '公司',
                width: 200
            },
            method: {
                label: '付款方式',
                width: 200
            },
            arrival: {
                label: '到款时间',
                width: 200
            },
            amount: {
                label: '到账金额',
                width: 200
            },
            insert_person: {
                label: '录入人',
                width: 200
            },
            insert_time: {
                label: '录入时间',
                width: 200
            },
            update_person: {
                label: '更新人',
                width: 200
            },
            update_time: {
                label: '更新时间',
                width: 200
            },
        };
        this.state.pagination.filter = {
            // checked: ''
        }
        this.canRowSelection = true;
    }

    inputRender(){
        const { pagination, selectedRows, selectedRowKeys } = this.state;
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
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
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
        let textAlign = 'left';
        if(key=='insert_time'||key=='update_time'){
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }
        if(row['isAssign']==0&&key=='amount'){
            title = <span style={{color: '#f00'}}>{row[key]}</span>
            content = title;
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

    //@override
    actionRender(text, row, index){
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                </p>;
    }

    //@override
    //子表格
    expandedRowRender(data){
        const columns = [
            { title: '用途', dataIndex: 'type', key: 'type', width: 200 },
            { title: '合同编号', dataIndex: 'contract_no', key: 'contract_no', width: 200 },
            { title: '金额', dataIndex: 'amount', key: 'amount', width: 200 },
            { title: '备注', dataIndex: 'rem', key: 'rem' }
        ];
        data = data.pay_use;
        const _data = [];
        for (let i = 0; i < data.length; i++) {
            _data.push({
                key: data[i].id,
                type: data[i].type,
                contract_no: data[i].contract_no,
                amount: data[i].amount,
                rem: data[i].rem
            });
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

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        return <div></div>;
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
}

export default Payments;