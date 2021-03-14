import React, { Component } from 'react';
import { Modal, Button,message,Form,Input,InputNumber,Select,Tooltip,Checkbox,Popover } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';
import moment from 'moment';
import BaseTableList from './common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from './common/SelectedButtonGroup.jsx';
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
            return <div></div>
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class SnApply extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/virProducts/showApplyList';
        this.placeholder = '';
        this.actionWidth = 100;
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            }
        ];
        this.res_data = {
            startSn: {
                label: '起始序列号',
                width: 200
            },
            endSn: {
                label: '终止序列号',
                width: 200
            },
            createPerson: {
                label: '申请人',
                width: 200
            },
            createTime: {
                label: '申请时间',
            },
        };
        this.state.applySnNum = 1;
        this.actioncolumns = false;
        this.canRowSelection = true;
    }

    change = v => {
        this.setState({
            applySnNum: v,
        });
    }

    applySnFun = () => {
        const { applySnNum } = this.state;
        const that = this;
        Modal.confirm({
            title: '申请序列号',
            content: <div>
                <span>申请数量：</span>
                <InputNumber min={1} max={1000} defaultValue={applySnNum} onChange={this.change} />
            </div>,
            onOk() {
                const num = that.state.applySnNum;
                request.post(common.baseUrl('/virProducts/applySn'))
                    .set("token", sessionStorage.getItem('token'))
                    .send({
                        num,
                    })
                    .end((err, res) => {
                        if (err) return;
                        message.success(res.body.msg);
                        that.fetch();
                    });
            },
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
                { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.applySnFun} style={{"position":"relative","top":3,marginRight: 60}}>申请序列号</Button> }
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
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='createTime'){
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }
        title = row[key];
        content = row[key];
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

export default SnApply;