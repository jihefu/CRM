import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover } from 'antd';
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
            this.funArr = [
                {
                    text: '标记',
                    onClick: this.markAll,
                },
                {
                    text: '取消标记',
                    onClick: this.removeMarkAll,
                }
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        markAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.markAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        removeMarkAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.removeMarkAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            const markSet = new Set();
            for (let i = 0; i < selectedRows.length; i++) {
                const { isStarMark } = selectedRows[i];
                markSet.add(isStarMark);
            }
            if (markSet.size === 2) {
                currentFunArr = currentFunArr.filter(items => items.text != '取消标记' && items.text != '标记' );
            } else if (markSet.size === 1) {
                if (markSet.has(1)) {
                    currentFunArr = currentFunArr.filter(items => items.text != '标记' );
                } else {
                    currentFunArr = currentFunArr.filter(items => items.text != '取消标记' );
                }
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

class Output extends BaseTableList {
    constructor(props) {
        super(props);
        this.markType = 'DeliveryRecord';
        this.fetchUrl = '/output/list';
        this.addPathName = '/outputAdd';
        this.editPathName = '/outputEdit';
        this.placeholder = '维修单号，收件客户，快递单号，联系人，联系人手机';
        this.filter = [''];
        this.actionWidth = 150;
        this.fixedKey = 'cus_cn_abb';
        this.options = [
            {
                text: '最近发货',
                value: 'id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            }
        ];
        this.res_data = {
            cus_cn_abb: {
                label: '收件单位',
                width: 200
            },
            contract_no: {
                label: '维修单号',
                width: 200
            },
            contacts: {
                label: '相关联系人',
                width: 200
            },
            contacts_tel: {
                label: '联系人电话',
                width: 200
            },
            express_no: {
                label: '快递单号',
                width: 200
            },
            express_type: {
                label: '快递类型',
                width: 100
            },
            delivery_time: {
                label: '发件时间',
                width: 200
            },
            goods: {
                label: '物品',
                width: 200
            },
            received_time: {
                label: '收件时间',
                width: 200
            },
            received_person: {
                label: '收件人',
                width: 200
            },
            rem: {
                label: '备注',
                width: 200
            },
            // all_shipments: {
            //     label: '发货完全',
            //     width: 120
            // },
            insert_person: {
                label: '录入人',
                width: 100
            },
            insert_time: {
                label: '录入时间',
                width: 200
            },
            update_person: {
                label: '更新人',
                width: 100
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
        if(key=='all_shipments'){
            title = res_data[key]?'是':'否';
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
                    <a href="javascript:void(0)" className={'_mark_a'} style={{marginLeft: 6}}>标记</a>
                </p>;
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        return <div></div>;
    }
}

export default Output;