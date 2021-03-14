import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Popconfirm,DatePicker } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import * as bluebird from 'bluebird';
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
                    text: '撤销审核',
                    onClick: this.rebackCheck,
                },
                {
                    text: '同意',
                    onClick: this.agree,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        rebackCheck = async () => {
            const { selectedRows, parent } = this.props;
            await bluebird.map(selectedRows, async row => {
                await this.props.rebackCheck.call(parent, row);
            }, { concurrency: 1 });
            this.props.refresh();
        }

        agree = async () => {
            const { selectedRows, parent } = this.props;
            await bluebird.map(selectedRows, async row => {
                await this.props.agree.call(parent, row);
            }, { concurrency: 1 });
            this.props.refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows, checker } = props;
            const user_id = sessionStorage.getItem('user_id');
            let currentFunArr = this.funArr;
            let showAgree = true, showBack = true;
            if (checker.includes(user_id)) {
                for (let i = 0; i < selectedRows.length; i++) {
                    const { state } = selectedRows[i];
                    if (state === '待审核') {
                        showBack = false;
                    } else if (state === '已通过') {
                        showAgree = false;
                    } else {
                        showAgree = false;
                        showBack = false;
                    }
                }
            } else {
                showAgree = false;
                showBack = false;
            }

            if (!showAgree) {
                currentFunArr = currentFunArr.filter(items => items.text != '同意' && items.text != '不同意' );
            }

            if (!showBack) {
                currentFunArr = currentFunArr.filter(items => items.text != '撤销审核' );
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

class PricingList extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/pricing/list';
        this.editPathName = '/pricingEdit';
        this.placeholder = '合同号';
        this.filter = ['state','isSub'];
        this.actionWidth = 150;
        // this.fixedKey = 'company';
        this.expandedRowRender = this.expandedRowRender.bind(this);
        this.supExpandedRowRender = this.supExpandedRowRender.bind(this);
        this.getTargetItem = this.getTargetItem.bind(this);
        this.signDateStartChange = this.signDateStartChange.bind(this);
        this.signDateEndChange = this.signDateEndChange.bind(this);
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
        this.tableWidth = 200;
        this.res_data = {
            company: {
                label: '公司',
                width: 200
            },
            contract_no: {
                label: '合同号',
                width: 180
            },
            contract_price: {
                label: '合同价',
                width: 100
            },
            cost_price: {
                label: '成本价',
                width: 100
            },
            achievement: {
                label: '业绩',
                width: 100
            },
            total_work_hours: {
                label: '工时',
                width: 100
            },
            deposit: {
                label: '服务保证金',
                width: 100
            },
            state: {
                label: '状态',
                width: 100
            },
            insert_person: {
                label: '录入人',
                width: 150
            },
            insert_time: {
                label: '录入时间',
                width: 200
            },
            update_person: {
                label: '更新人',
                width: 150
            },
            update_time: {
                label: '更新时间',
                width: 200
            },
        };
        this.state.pagination.filter = {
            state: '',
            isSub: '',
            sign_time_start: '2018-01-01',
            sign_time_end: moment().format('YYYY-MM-DD')
        }
        this.state.checker = [];
        this.state.editor = [];
        this.canRowSelection = true;
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
        }else if(e.target.innerHTML=='合同'){
            let href;
            this.props.siderList.forEach((items,index) => {
                if(items.link=='/contracts'||items.link=='/contractsViewOnly'||items.link=='/contractsViewOnlyLess'){
                    href = items.link;
                }
            });
            hashHistory.push({
                pathname: href,
                state: {
                    contract_no: record.contract_no
                }
            });
        }
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
            let keywords;
            try{
                keywords = this.props.location.state.contract_no?this.props.location.state.contract_no:'';
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
        if(key=='insert_time'||key=='update_time'){
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        }else if(key=='contract_price'||key=='cost_price'||key=='deposit'||key=='achievement'||key=='total_work_hours'){
            row[key] = parseInt(row[key]);
            textAlign = 'right';
        }
        title = row[key];
        content = row[key];
        return <p style={{width: res_data[key]['width']-16,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    actionRender(text, row, index){
        const { state } = row;
        let { checker,editor } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        if(state=='待审核'){
            if(editor.indexOf(user_id)!=-1){
                return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <a href="javascript:void(0)" style={{marginLeft: 10}}>合同</a>
                </p>;
            }else if(checker.indexOf(user_id)!=-1){
                return <p className={"_mark"}>
                    <Popconfirm title="确定同意？" onConfirm={() => this.agree(row)}>
                        <a href="javascript:void(0)">同意</a>
                    </Popconfirm>
                    <Popconfirm title={<Input placeholder={'请输入理由'} name="nowAggreReason" />} onConfirm={() => this.notAgree(row)}>
                        <a href="javascript:void(0)" style={{marginLeft: 8}} >不同意</a>
                    </Popconfirm>
                    <a href="javascript:void(0)" style={{marginLeft: 10}}>合同</a>
                </p>;
            }else{
                return <p className={"_mark"}>
                    <a href="javascript:void(0)">合同</a>
                </p>;
            }
        }else if(state=='已通过'){
            if(checker.indexOf(user_id)!=-1){
                return <p className={"_mark"}>
                            <Popconfirm title="确定撤销审核？" onConfirm={() => this.rebackCheck(row)}>
                                <a href="javascript:void(0)">撤销审核</a>
                            </Popconfirm>
                            <a href="javascript:void(0)" style={{marginLeft: 10}}>合同</a>
                        </p>;
            }else{
                return <p className={"_mark"}><a href="javascript:void(0)">合同</a></p>;
            }
        }else{
            if(editor.indexOf(user_id)!=-1){
                return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <a href="javascript:void(0)" style={{marginLeft: 10}}>合同</a>
                </p>;
            }else{
                return <p className={"_mark"}><a href="javascript:void(0)">合同</a></p>;
            }
        }
    }

    //@Override
    inputRender(){
        const { selectedRows, selectedRowKeys, pagination, checker } = this.state;
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
                        { <BtnGroup parent={this} rebackCheck={this.rebackCheck} agree={this.agree} checker={checker} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //@Override
    componentDidUpdate(){
        this.initMark();
        common.textRight(['合同价','成本价','服务保证金','业绩','工时']);
        super.componentDidUpdate();
    }

    //@override
    //子表格
    expandedRowRender(data){
        const columns = [
            { title: '类型', dataIndex: 'goods_type', key: 'goods_type', width: 100 },
            { title: '货品', dataIndex: 'goods_name', key: 'goods_name', width: 200 },
            { title: '数量', dataIndex: 'goods_num', key: 'goods_num', width: 100}
        ];
        data = data.PricingListGoods;
        common.resizeTableHeight();
        let onlyOne = true;
        for (let i = 0; i < data.length; i++) {
            if (data[i].PricingListGoodsAmounts.length !== 1) {
                onlyOne = false;
                break;
            }
        }
        if (onlyOne) {
            return this.renderDiyTable(data, columns);
        }
        delete columns[columns.length - 1].width;
        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                bordered
                expandedRowRender={this.supExpandedRowRender}
            />
        );
    }

    renderDiyTable(data, columns) {
        let typeArr = data.map(items => items.goods_type);
        typeArr = [ ...new Set(typeArr) ];
        columns.push({ title: '金额', dataIndex: 'amount', key: 'amount', width: 120});
        if (typeArr.indexOf('产品') !== -1 || typeArr.indexOf('附加配件') !== -1) {
            columns.push({ title: '成本项', dataIndex: 'name', key: 'name', width: 200 });
            columns.push({ title: '成本价', dataIndex: 'price', key: 'price', width: 120});
            columns.push({ title: '规格说明', dataIndex: 'rem', key: 'rem', width: 200});
        }
        if (typeArr.length === 1 && typeArr[0] === '现场服务') {
            columns.push({ title: '人数', dataIndex: 'person_num', key: 'person_num', width: 200 });
            columns.push({ title: '天数', dataIndex: 'day', key: 'day', width: 200 });
            columns.push({ title: '路程', dataIndex: 'mile', key: 'mile', width: 200 });
        }
        delete columns[columns.length - 1].width;
        const dataSource = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i].goods_type === '产品' || data[i].goods_type === '附加配件') {
                dataSource.push({
                    id: data[i].id,
                    goods_type: data[i].goods_type,
                    goods_name: data[i].goods_name,
                    goods_num: data[i].goods_num * data[i].PricingListGoodsAmounts[0].num,
                    pricing_list_id: data[i].pricing_list_id,
                    PricingListGoodsAmounts: data[i].PricingListGoodsAmounts,
                    name: data[i].PricingListGoodsAmounts[0].name,
                    price: data[i].PricingListGoodsAmounts[0].price,
                    rem: data[i].PricingListGoodsAmounts[0].rem,
                    amount: data[i].PricingListGoodsAmounts[0].amount * data[i].goods_num,
                });
            } else if (data[i].goods_type === '现场服务') {
                dataSource.push({
                    id: data[i].id,
                    goods_type: data[i].goods_type,
                    goods_name: data[i].goods_name,
                    goods_num: data[i].goods_num * data[i].PricingListGoodsAmounts[0].num,
                    pricing_list_id: data[i].pricing_list_id,
                    PricingListGoodsAmounts: data[i].PricingListGoodsAmounts,
                    person_num: data[i].PricingListGoodsAmounts[0].person_num,
                    day: data[i].PricingListGoodsAmounts[0].day,
                    mile: data[i].PricingListGoodsAmounts[0].mile,
                    amount: data[i].PricingListGoodsAmounts[0].amount * data[i].goods_num,
                });
            } else {
                dataSource.push({
                    id: data[i].id,
                    goods_type: data[i].goods_type,
                    goods_name: data[i].goods_name,
                    goods_num: data[i].goods_num * data[i].PricingListGoodsAmounts[0].num,
                    pricing_list_id: data[i].pricing_list_id,
                    PricingListGoodsAmounts: data[i].PricingListGoodsAmounts,
                    amount: data[i].PricingListGoodsAmounts[0].amount * data[i].goods_num,
                });
            }
        }
        return (
            <Table
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                bordered
                expandedRowRender={this.supExpandedRowRender}
            />
        );
    }

    //@override
    //孙子表格
    supExpandedRowRender(data){
        const { PricingListGoodsAmounts, goods_type } = data;
        let columns = [];
        if(goods_type=='产品'){
            columns = [
                { title: '成本项', dataIndex: 'name', key: 'name', width: 200 },
                { title: '成本', dataIndex: 'price', key: 'price', width: 120},
                { title: '规格说明', dataIndex: 'rem', key: 'rem', width: 200},
                { title: '数量', dataIndex: 'num', key: 'num', width: 100},
                { title: '工时', dataIndex: 'total_work_hours', key: 'total_work_hours', width: 100},
                { title: '成本', dataIndex: 'amount', key: 'amount'}
            ];
        } else if (goods_type=='附加配件') {
            columns = [
                { title: '成本项', dataIndex: 'name', key: 'name', width: 200 },
                { title: '成本', dataIndex: 'price', key: 'price', width: 120},
                { title: '规格说明', dataIndex: 'rem', key: 'rem', width: 200},
                { title: '数量', dataIndex: 'num', key: 'num', width: 100},
                { title: '成本', dataIndex: 'amount', key: 'amount'}
            ];
        }else if(goods_type=='现场服务'){
            columns = [
                { title: '人数', dataIndex: 'person_num', key: 'person_num', width: 200 },
                { title: '天数', dataIndex: 'day', key: 'day', width: 200 },
                { title: '路程', dataIndex: 'mile', key: 'mile', width: 200 },
                { title: '成本', dataIndex: 'amount', key: 'amount'}
            ];
        }else if(goods_type=='研发服务'){
            columns = [
                { title: '成本', dataIndex: 'amount', key: 'amount'}
            ];
        }else if(goods_type=='生产服务'){
            columns = [
                { title: '成本', dataIndex: 'amount', key: 'amount', width: 200},
                { title: '工时', dataIndex: 'total_work_hours', key: 'total_work_hours'}
            ];
        }else if(goods_type=='咨询服务'){
            columns = [
                { title: '成本', dataIndex: 'amount', key: 'amount'}
            ];
        }
        common.resizeTableHeight();
        return (
            <Table
                columns={columns}
                bordered
                dataSource={PricingListGoodsAmounts}
                pagination={false}
            />
        );
    }

    //改变筛选时间
    signDateStartChange(o,v){
        const { pagination } = this.state;
        pagination.filter.sign_time_start = v;
        this.setState({
            pagination
        },() => this.fetch());
    }

    //改变筛选时间
    signDateEndChange(o,v){
        const { pagination } = this.state;
        pagination.filter.sign_time_end = v;
        this.setState({
            pagination
        },() => this.fetch());
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const state = ['待审核','已通过','未通过'];
        const isSub = ['已提交','未提交'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        let sign_time_start = pagination.filter.sign_time_start;
        let sign_time_end = pagination.filter.sign_time_end?pagination.filter.sign_time_end:moment().format('YYYY-MM-DD');
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"签订日期："}</span>
                        <DatePicker allowClear={false} onChange={this.signDateStartChange} value={moment(sign_time_start)} format={'YYYY-MM-DD'} />
                        <span style={{marginLeft: 5,marginRight: 5}}>-</span>
                        <DatePicker allowClear={false} onChange={this.signDateEndChange} value={moment(sign_time_end)} format={'YYYY-MM-DD'} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"状态："}</span>
                        <CheckboxGroup options={state} value={pagination.filter.state.split(',')} onChange={(v) => this.filterType('state',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"提交状态："}</span>
                        <CheckboxGroup options={isSub} value={pagination.filter.isSub.split(',')} onChange={(v) => this.filterType('isSub',v)} />
                    </div>
                </div>
    }

    //@Override
    tableRender(params){
        const {columns,data,tableWidth,b_height} = params;
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    rowSelection={this.rowSelection()}
                    expandedRowRender={this.expandedRowRender}
                    onChange={this.handleTableChange} />
    }

    //@Override
    //获取数据
    fetch(){
        this.setState({ loading: true });
        let token = sessionStorage.getItem('token');
        let { current,pageSize,keywords,order,filter } = this.state.pagination;

        request.get(common.baseUrl('/staff/getPricingAuth'))
            .set("token",token)
            .end((err,res) => {
                if (err) return;
                this.setState({
                    checker: res.body.data.checker,
                    editor: res.body.data.editor
                });
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
                        data.forEach((items, index) => {
                            data[index].key = items.id;
                            if (res.body.data.id_arr.indexOf(Number(items.id)) !== -1) {
                                data[index].isStarMark = 1;
                            } else {
                                data[index].isStarMark = 0;
                            }
                        });
                        let total = res.body.data.total;
                        const pagination = { ...this.state.pagination };
                        pagination.total = total;
                        let markLen = res.body.data.id_arr.length;
                        this.setState({
                            pagination,
                            data,
                            loading: false,
                            markLen
                        });
                    });
            });
    }

    // 获取指定定价单
    getTargetItem = async (id) => {
        await new Promise(resolve => {
            const { data } = this.state;
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/targetPricing/'+id))
                .set("token",token)
                .end((err,res) => {
                    if(err) return;
                    data.forEach((items,index) => {
                        if(items.id==id){
                            data[index] = res.body.data;
                        }
                    });
                    this.setState({
                        data
                    }, () => resolve());
                });
        });
    }

    // 同意
    async agree(rows){
        const self = this;
        await new Promise(resolve => {
            const { deposit, contract_no, id } = rows;
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/pricing/agree'))
                .set("token",token)
                .send({
                    id: id,
                    contract_no: contract_no,
                    deposit: deposit
                })
                .end(async (err,res) => {
                    if(err) return;
                    if(res.body.code==200){
                        message.success(res.body.msg);
                        await self.getTargetItem(id);
                    }else{
                        message.error(res.body.msg);
                    }
                    resolve();
                });
        });
    }

    // 不同意
    notAgree(rows){
        const nowAggreReason = $('input[name=nowAggreReason]').val();
        if(!nowAggreReason){
            message.error('请输入理由');
            return;
        }
        const { deposit, contract_no, id } = rows;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/pricing/notAgree'))
            .set("token",token)
            .send({
                id: id,
                contract_no: contract_no,
                deposit: deposit,
                nowAggreReason: nowAggreReason
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    this.getTargetItem(id);
                }else{
                    message.error(res.body.msg);
                }
            });
    }

    // 撤销审核
    async rebackCheck(rows){
        const self = this;
        await new Promise(resolve => {
            const { id } = rows;
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/pricing/rebackCheck'))
                .set("token",token)
                .send({
                    id: id
                })
                .end(async (err,res) => {
                    if(err) return;
                    if(res.body.code==200){
                        message.success(res.body.msg);
                        await self.getTargetItem(id);
                    }else{
                        message.error(res.body.msg);
                    }
                    resolve();
                });
        });
    }
}

export default PricingList;