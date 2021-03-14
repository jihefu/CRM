import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Radio,Tree } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import * as QrCode from 'qrcode.react';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const RadioGroup = Radio.Group;
const { TreeNode } = Tree;

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
                },
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

class Goods extends BaseTableList {
    constructor(props) {
        super(props);
        this.treeOnSelect = this.treeOnSelect.bind(this);
        this.getGoodsNumAndAmount = this.getGoodsNumAndAmount.bind(this);
        this.expandedRowRender = this.expandedRowRender.bind(this);
        this.fetchUrl = '/goods/list';
        this.editPathName = '/goodsEdit';
        this.addPathName = '/goodsAdd';
        this.markType = 'Goods';
        this.placeholder = '编号，名称，序列号，责任人';
        this.filter = ['myGoods', 'goodsType', 'location', 'management', 'isBorrow', 'borrowStatus', 'isdel', 'events'];
        this.actionWidth = 200;
        this.tableWidth = 272;
        this.state.pagination.filter = {
            myGoods: '我的物品',
            goodsType: '全部类型',
            location: '',
            management: '',
            isBorrow: '',
            borrowStatus: '',
            isdel: '在库',
            events: '借用',
        };
        this.state.goodsNum = 0;
        this.state.goodsAmount = 0;
        this.state.goodsPresentAmount = 0;
        this.options = [
            {
                text: '拍照',
                value: 'albumUpdateTime'
            },
            {
                text: '最近新增',
                value: 'id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            },
        ];
        this.res_data = {
            numbering: {
                label: '编号',
                width: 100
            },
            album: {
                label: '照片',
                width: 100
            },
            // albumUpdateTime: {
            //     label: '照片更新时间',
            //     width: 150
            // },
            goodsName: {
                label: '名称',
                width: 150
            },
            manager: {
                label: '责任人',
                width: 100
            },
            goodsType: {
                label: '分类',
                width: 100
            },
            model: {
                label: '规格型号',
                width: 100
            },
            serialNo: {
                label: '序列号',
                width: 100
            },
            fromMethod: {
                label: '来源',
                width: 100
            },
            proof: {
                label: '入库单据',
                width: 150
            },
            originalValue: {
                label: '原值',
                width: 100
            },
            presentValue: {
                label: '现值',
                width: 100
            },
            type: {
                label: '责任类型',
                width: 100
            },
            location: {
                label: '存放点',
                width: 150
            },
            isdel: {
                label: '是否出库',
                width: 100
            },
            delRem: {
                label: '出库去向',
                width: 100
            },
            insertPerson: {
                label: '录入人',
                width: 160
            },
            insertTime: {
                label: '录入时间',
                width: 180
            },
            updatePerson: {
                label: '更新人',
                width: 160
            },
            updateTime: {
                label: '更新时间',
                width: 200
            },
        };
        this.canRowSelection = true;
    }

    // @Override
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
                let total = res.body.data.total;
                data.forEach((items, index) => {
                    data[index].key = items.id;
                    if (res.body.data.id_arr.indexOf(Number(items.id)) !== -1) {
                        data[index].isStarMark = 1;
                    } else {
                        data[index].isStarMark = 0;
                    }
                });
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen,
                    goodsNum: res.body.data.goodsAmountInfo.count,
                    goodsAmount: res.body.data.goodsAmountInfo.amount,
                    goodsPresentAmount: res.body.data.goodsAmountInfo.presentAmount,
                });
            });
    }

    //@Override
    componentDidMount(){
        if(Base.GetStateSession()&&Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]){
            this.setState(Base.GetStateSession(),() => {
                this.initMark();
            },() => {
                const { goodsType } = this.state.pagination.filter;
                const formData = {};
                if(goodsType!='全部类型') formData.goodsType = goodsType;
                this.getGoodsNumAndAmount(formData);
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
                keywords = this.props.location.state.no?this.props.location.state.no:'';
                pagination.keywords = keywords;
            }catch(e){

            }
            if (keywords) {
                pagination.filter.myGoods = '所有物品';
            }
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
            this.getGoodsNumAndAmount();
        }
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='updateTime'){
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }else if(key=='insertTime'){
            row[key] = moment(row[key]).format('YYYY-MM-DD');
        }else if(key=='isBorrow'||key=='isdel'){
            row[key] = (row[key]==1 || row[key]=='是') ?'是':'否';
        }else if(key=='originalValue'||key=='presentValue'){
            textAlign = 'right';
        } else if (key == 'albumUpdateTime') {
            row[key] = row[key] ? moment(row[key]).format('YYYY-MM-DD') : null;
        }
        title = row[key];
        content = row[key];
        if(key=='album') {
            let albumArr = [];
            try {
                albumArr = row[key].split(',');
            } catch (e) {
                
            }
            let albumName = albumArr.pop();
            if (albumName) {
                title = <a target={'_blank'} href={common.staticBaseUrl('/img/goods/'+albumName)}>
                    <img style={{cursor: 'pointer', maxHeight: 30}} src={common.staticBaseUrl('/img/goods/small_'+albumName)} />
                </a>;
                content = title;
            }
        }
        if (key == 'numbering') {
            // const currentMonth = new Date().getMonth() + 1;
            // const kMonth = new Date(row['albumUpdateTime']).getMonth() + 1;
            // if ((currentMonth == 6 || currentMonth == 12) && kMonth == currentMonth) {
            //     row[key] = <span>{row[key]}</span>
            // } else {
            //     row[key] = <span style={{color: '#f00'}}>{row[key]}</span>
            // }
            if (!row['albumUpdateTime'] || Date.now() - Date.parse(row['albumUpdateTime']) > 60 * 60 * 1000 * 24 * 30 * 6) {
                content = <span style={{color: '#f00'}}>{row[key]}</span>
            } else if (Date.now() - Date.parse(row['albumUpdateTime']) > 60 * 60 * 1000 * 24 * 30 * 5) {
                content = <span style={{color: 'rgb(255, 193, 7)'}}>{row[key]}</span>
            } else {
                content = <span>{row[key]}</span>
            }
            title = content;
        }
        return <p style={{width: res_data[key]['width']-18,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    componentDidUpdate(){
        this.initMark();
        const w = 470;
        const { goodsAmount, goodsNum, goodsPresentAmount, selectedRowKeys, selectedRows } = this.state;
        let showSelected = 'block', showNum = 'none';
        let originAmount = 0, currentAmount = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            originAmount = goodsAmount;
            currentAmount = goodsPresentAmount;
        } else {
            selectedRows.forEach(items => {
                originAmount += Number(items.originalValue);
                currentAmount += Number(items.presentValue);
            });
        }
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder;">资产数量：</span>'+
                                '<span>'+goodsNum+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">资产原值：</span>'+
                                '<span>'+originAmount+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">资产现值：</span>'+
                                '<span>'+currentAmount+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
        setTimeout(() => {
            common.textRight(['原值','现值']);
        },0);
    }

    //@Override
    //表格点击
    handleTableClick(record, index, e){
        const { data } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const id = record.id;
            let selectData;
            data.forEach((items,index) => {
                if(items.id==id){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }else if(e.target.innerHTML=='标记'){
            let targetDom = e.target;
            this.addMark(record.id,this.markType,() => {
                targetDom.innerHTML = '取消标记';
            });
        }else if(e.target.innerHTML=='取消标记'){
            let targetDom = e.target;
            this.cancelMark(record.id,this.markType,() => {
                targetDom.innerHTML = '标记';
            });
        }else if(e.target.innerHTML=='办理借用'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const { user, borrowStatus } = record;
            const user_name = sessionStorage.getItem('user_name');
            if(user){
                if(user == user_name){
                    // 直接通过
                    hashHistory.push({
                        pathname: '/userBorrowSteps',
                        state: {
                            id: record.id
                        }
                    });
                }else{
                    // 不通过
                    message.warn('该物品已借用');
                }
            }else{
                // 直接通过
                hashHistory.push({
                    pathname: '/userBorrowSteps',
                    state: {
                        id: record.id
                    }
                });
            }
        }else if(e.target.innerHTML=='处理借用'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            // 直接通过
            hashHistory.push({
                pathname: '/manageBorrowSteps',
                state: {
                    id: record.id
                }
            });
        }
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent() {
        const { pagination } = this.state;
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        const myGoods = ['我的物品','所有物品'];
        // const goodsType = ['电脑', '办公用品', '工具', '样机', '车辆'];
        const location = ['杭州办', '济南办', '广州办', '长春办'];
        const isdel = ['在库','已出库'];
        const events = ['借用', '拍照', '入库', '出库'];
        return <div>
                    {/* <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"归属："}</span>
                        <RadioGroup options={myGoods} value={pagination.filter.myGoods} onChange={(v) => this.filterType('myGoods',v.target.value)} />
                    </div> */}
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"存放地点："}</span>
                        <CheckboxGroup options={location} value={pagination.filter.location.split(',')} onChange={(v) => this.filterType('location',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"事件："}</span>
                        <CheckboxGroup options={events} value={pagination.filter.events.split(',')} onChange={(v) => this.filterType('events',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"出库状态："}</span>
                        <CheckboxGroup options={isdel} value={pagination.filter.isdel.split(',')} onChange={(v) => this.filterType('isdel',v)} />
                    </div>
                </div>
    }

    //@override
    //子表格
    expandedRowRender(data) {
        const columns = [
            { title: '执行人', dataIndex: 'borrower', key: 'borrower', width: 100 },
            { title: '执行时间', dataIndex: 'time', key: 'time', width: 100 },
            { title: '事件类型', dataIndex: 'typeValue', key: 'typeValue', width: 100 },
            { title: '备注', dataIndex: 'rem', key: 'rem', width: 200 },
            { title: '执行内容', dataIndex: 'content', key: 'content' },
        ];
        const resArr = [];
        data.events.forEach((items, index) => {
            resArr.push({
                borrower: items.borrower,
                time: moment(items.time).format('YYYY-MM-DD'),
                typeValue: items.typeValue,
                content: this.renderEventContent(items.type, items.content, items),
                rem: items.content.rem,
            });
        });
        common.resizeTableHeight();
        return <Table
                    columns={columns}
                    dataSource={resArr}
                    pagination={false}
                />;
    }

    // 渲染事件主体内容
    renderEventContent = (type, content, data) => {
        if (type === '1001') {
            return <div>
                <span>责任类型：{content.borrowType}；</span>
                <span>存放地点：{content.borrowLocation}；</span>
            </div>
        } else if (type === '1002') {
            return <div>
                <span>责任类型：{content.borrowType}；</span>
                <span>存放地点：{content.borrowLocation}；</span>
                { content.borrowExpectTime && <span>预计借用截止期：{moment(content.borrowExpectTime).format('YYYY-MM-DD')}；</span> }
            </div>
        } else if (type === '1003') {
            return <div>
                <span>
                    <a target={'_blank'} href={common.staticBaseUrl('/img/goods/'+content.goodsAlbum)}>
                        <img src={common.staticBaseUrl('/img/goods/small_'+content.goodsAlbum)} />
                    </a>
                </span>
            </div>
        } else if (type === '1004') {
            return <div>
                        <span>去向：{data.rem}；</span>
                    </div>
        }
    }

    //@override
    tableRender(params){
        const {columns,data,tableWidth,b_height} = params;
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height - 50 }} 
                    onRowClick={this.handleTableClick}
                    expandedRowRender={this.expandedRowRender}
                    rowSelection={this.rowSelection()}
                    onChange={this.handleTableChange} />
    }

    //@override
    inputRender(){
        const { data, pagination, selectedRows, selectedRowKeys } = this.state;
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
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    // 渲染树
    renderTree() {
        const nodeArr = ['电脑','办公用品','工具','样机','车辆','贵重外购件','试产品'];
        const resArr = nodeArr.map((items,index) => {
            return <TreeNode title={items} key={items} />
        });
        return resArr;
    }

    // 树节点被选中
    treeOnSelect(val) {
        this.filterType('goodsType',val);
        const formData = {};
        if(val!='全部类型') formData.goodsType = val;
        this.getGoodsNumAndAmount(formData);
    }

    // 获取指定类型的物品个数和总价
    getGoodsNumAndAmount(formData) {
        // formData = formData ? formData : {};
        // let token = sessionStorage.getItem('token');
        // request.get(common.baseUrl('/goods/getGoodsNumAndAmount'))
        //     .set("token",token)
        //     .query(formData)
        //     .end((err,res) => {
        //         this.setState({
        //             goodsAmount: res.body.data.amount,
        //             goodsNum: res.body.data.count,
        //             goodsPresentAmount: res.body.data.presentAmount,
        //         });
        //     });
    }

    // @override
    actionRender(text, row, index) {
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <Popover placement="bottomRight" content={<QrCode value={common.staticBaseUrl('/g/'+row['numbering'])} size={120} />} trigger="click">
                        <a style={{marginLeft: 10}} href="javascript:void(0)">二维码</a>
                    </Popover>
                    <a className={"_mark_a"} style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                </p>;
    }

    render(){
        const myGoods = ['我的物品','所有物品'];
        let { data,pagination } = this.state;
        const defaultGoodsType = pagination.filter.goodsType;
        const h = $('.ant-layout-content').height();
        let res_data = this.res_data;
        let b_height = window.innerHeight-308;
        const columns = [];
        let tableWidth = this.tableWidth;
        for(let key in res_data){
            tableWidth += res_data[key]['width'];
            let o = {
                title: res_data[key].label,
                dataIndex: key,
                key: key,
                width: res_data[key]['width'],
                render: (text, row, index) => {
                    return this.viewRender(key, res_data, text, row, index);
                }
            };
            columns.push(o);
            if (key == this.fixedKey) o.fixed = 'left';
        }
        if(this.actioncolumns){
            columns.push({
                title: '操作',
                key: 'operation',
                fixed: 'right',
                width: this.actionWidth,
                render: (text, row, index) => {
                    return this.actionRender(text, row, index);
                },
            });
        }
        if(!pagination.order) return <p></p>;
        return (
            <div style={{height: h,display: 'flex'}}>
                <div style={{width: 220,height: h,borderRight: '1px solid #f0f2f5'}}>
                <RadioGroup style={{marginLeft: 5, marginTop: 5}} options={myGoods} value={pagination.filter.myGoods} onChange={(v) => this.filterType('myGoods',v.target.value)} />
                    <Tree
                        showLine
                        defaultExpandedKeys={[defaultGoodsType]}
                        defaultSelectedKeys={[defaultGoodsType]}
                        onSelect={this.treeOnSelect}
                    >
                        <TreeNode title={'全部类型'} key={'全部类型'}>
                            {this.renderTree()}
                        </TreeNode>
                    </Tree>
                </div>
                <div style={{flex: 1, overflow: 'hidden'}}>
                    {this.inputRender()}
                    {
                        this.tableRender({
                            columns: columns,
                            data: data,
                            tableWidth: tableWidth,
                            b_height: b_height
                        })
                    }
                </div>
            </div>
        )
    }
}

export default Goods;