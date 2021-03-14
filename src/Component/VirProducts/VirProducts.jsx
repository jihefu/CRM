import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import {  Button,Form,Input,Select,Tooltip,Popover,Checkbox,Radio } from 'antd';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import 'moment/locale/zh-cn';
import * as Barcode from 'react-barcode'
import $ from 'jquery';
import Base from '../../public/js/base.js';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;

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

class VirProducts extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/virProducts';
        this.editPathName = '/virProductsEdit';
        this.addPathName = '/virProductsAdd';
        this.placeholder = '序列号，客户';
        this.actionWidth = 100;
        this.filter = ['status', 'storage'];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
        ];
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 100,
            },
            model: {
                label: '型号',
                width: 100
            },
            status: {
                label: '产品状态',
                width: 100,
            },
            storage: {
                label: '库存地',
                width: 100,
            },
            dealer: {
                label: '当前拥有者',
                width: 200,
            },
            salesman: {
                label: '业务员',
                width: 150
            },
            validTime: {
                label: '注册状态',
                width: 150,
            },
            latestRegNo: {
                label: '注册码',
                width: 150,
            },
            regAuth: {
                label: '授权码',
                width: 150,
            },
            machineNo: {
                label: '机器码',
                width: 150
            },
            maker: {
                label: '组装人',
                width: 150
            },
            tester: {
                label: '测试人',
                width: 150,
            },
            inputDate: {
                label: '组装日期',
                width: 200,
            },
        };
        this.state.pagination.filter = {
            status: '',
            storage: '全部',
            model: '威程',
        };
        this.state.storageDisabled = true;
        this.canRowSelection = true;
    }

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
            let keywords;
            try{
                keywords = this.props.location.state.serialNo?this.props.location.state.serialNo:'';
                pagination.keywords = keywords;
            }catch(e){

            }
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
        }
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if (key=='validTime'){
            content = row[key] == 0 ? '永久注册' : row[key];
            title = content;
        } else {
            title = row[key];
            content = title;
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    moreInfo = (sn, id) => {
        this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
        Base.SetStateSession(this.state);
        hashHistory.push({
            pathname: '/virProductsInfo',
            state: {
                sn,
                id,
            },
        });
    }

    //@override
    actionRender(text, row, index){
        return <p className={"_mark"}>
                    {/* <a href="javascript:void(0)">编辑</a> */}
                    <a onClick={() => this.moreInfo(row.serialNo, row.id)} href="javascript:void(0)">查看</a>
                    <Popover placement="bottomRight" content={<Barcode value={row.serialNo} />} trigger="click">
                        <a href="javascript:void(0)" style={{marginLeft: 6}}>条形码</a>
                    </Popover>
                </p>;
    }

    //@Override
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
                        {<BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} />}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination, storageDisabled } = this.state;
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        const status = ['未入库','库存','售出', '报废'];
        const storage = ['全部','杭州办','济南办','借用'];
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"产品状态："}</span>
                        <CheckboxGroup options={status} value={pagination.filter.status.split(',')} onChange={(v) => this.filterType('status',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"库存地："}</span>
                        <RadioGroup disabled={storageDisabled} options={storage} value={pagination.filter.storage} onChange={(v) => this.filterType('storage',v.target.value)} />
                    </div>
                </div>
    }

    // @Override
    filterType = (type,v) => {
        let storageDisabled = true;
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
        if (pagination.filter.status === '库存') {
            storageDisabled = false;
        } else {
            storageDisabled = true;
            pagination.filter.storage = '全部';
        }
        this.setState({
            pagination,
            storageDisabled,
            selectedRowKeys: [],
            selectedRows: [],
        },() => this.fetch());
    }
}

export default VirProducts;