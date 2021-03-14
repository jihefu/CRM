import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
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

class ProductsCost extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/productsLibrary/list';
        this.editPathName = '/productsCostEdit';
        this.addPathName = '/productsCostAdd';
        this.placeholder = '物品名';
        this.filter = ['product_type'];
        this.actionWidth = 100;
        this.fixedKey = 'product_type';
        this.state.product_type = [];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            }
        ];
        this.res_data = {
            product_type: {
                label: '分类',
                width: 150
            },
            product_name: {
                label: '成本项',
                width: 200
            },
            product_price: {
                label: '成本价',
                width: 100
            },
            work_hours: {
                label: '工时',
                width: 100
            },
            product_rem: {
                label: '规格说明',
                width: 300
            },
            insert_person: {
                label: '录入人',
                width: 200
            },
            insert_time: {
                label: '录入时间',
                width: 300
            },
            update_person: {
                label: '更新人',
                width: 200
            },
            update_time: {
                label: '更新时间',
                width: 300
            },
        };
        this.state.pagination.filter = {
            product_type: ''
        }
        this.getGoodsType = this.getGoodsType.bind(this);
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

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='insert_time'||key=='update_time'){
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
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                </p>;
    }

    //@Override
    componentDidMount(){
        if(Base.GetStateSession()&&Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]){
            this.setState(Base.GetStateSession(),() => {
                this.initMark();
            });
            Base.RemoveStateSession();
        }else{
            const { pagination } = this.state;
            try{
                pagination.order = this.options[0].value;
            }catch(e){

            }
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
            this.getGoodsType();
        }
    }

    getGoodsType(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/productsLibrary/getGoodsType'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    this.setState({
                        product_type: res.body.data
                    });
                }
            });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination, product_type } = this.state;
        // product_type = ['套装','板卡','箱体','传感器','电子件','比例阀','液压件','机械件','电脑','软件'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"分类："}</span>
                        <CheckboxGroup options={product_type} value={pagination.filter.product_type.split(',')} onChange={(v) => this.filterType('product_type',v)} />
                    </div>
                </div>
    }
}

export default ProductsCost;