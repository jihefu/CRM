import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Modal, Button,message,Form,Input,InputNumber,Select,Tooltip,Checkbox,Popover } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';
import moment from 'moment';
import BaseTableList from './common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

class VirtualProducts extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/virProducts/getVirtualList';
        this.placeholder = '';
        this.actionWidth = 100;
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            }
        ];
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 150
            },
            model: {
                label: '型号',
                width: 150
            },
            company: {
                label: '客户',
                width: 200
            },
            contractNo: {
                label: '合同号',
                width: 200
            },
            insertTime: {
                label: '创建时间',
            },
        };
    }

    // @Override
    inputRender() {
        const { data, pagination } = this.state;
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

    jumpToPage = (path, v) => {
        const p = {
            state: { company: v },
        };
        if (path === 'company') {
            p.pathname = '/customers';
        } else {
            p.pathname = '/contracts';
            p.state.contract_no = v;
        }
        hashHistory.push(p);
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='insertTime'){
            content = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            title = content;
        } else if (key=='company') {
            content = <span onClick={() => this.jumpToPage('company', row[key])} style={{cursor: 'pointer'}}>{row[key]}</span>;
            title = row[key];
        } else if (key=='contractNo') {
            content = <span onClick={() => this.jumpToPage('contractNo', row[key])} style={{cursor: 'pointer'}}>{row[key]}</span>;
            title = row[key];
        } else {
            content = row[key];
            title = content;
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    actionRender(text, row, index){
        
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        return <div></div>;
    }
}

export default VirtualProducts;