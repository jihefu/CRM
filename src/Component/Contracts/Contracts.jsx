import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Tooltip,Button,Form,Input,Select,Radio,Popover,Popconfirm,Checkbox,Tag,Table,DatePicker,Divider,Badge, message } from 'antd';
import moment from 'moment';
import request from 'superagent';
import BaseTableList from '../common/BaseTableList.jsx';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import $ from 'jquery';
import * as Barcode from 'react-barcode'
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import * as bluebird from 'bluebird';
moment.locale('zh-cn');
const Option = Select.Option;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const { MonthPicker } = DatePicker;

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
                {
                    text: '允许发货',
                    onClick: this.allowDelivery,
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

        allowDelivery = async () => {
            const { selectedRows } = this.props;
            const contractNoArr = selectedRows.map(items => items.contract_no);
            await bluebird.map(contractNoArr, async contract_no => {
                await this.props.allowDeliveryFun(contract_no);
            }, { concurrency: 5 });
            this.props.refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows, paidPowerPower } = props;
            let currentFunArr = this.funArr;
            let allowDelivery = true;
            const markSet = new Set();
            for (let i = 0; i < selectedRows.length; i++) {
                const { isStarMark, delivery_state } = selectedRows[i];
                markSet.add(isStarMark);
                if (delivery_state !== '审核中') {
                    allowDelivery = false;
                }
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

            const user_id = sessionStorage.getItem('user_id');
            if (!paidPowerPower.includes(user_id) || !allowDelivery) {
                currentFunArr = currentFunArr.filter(items => items.text != '允许发货' );
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

class Contracts extends BaseTableList {
    constructor(props) {
        super(props);
        this.signDateChange = this.signDateChange.bind(this);
        this.fetchUrl = '/contracts/list';
        this.addPathName = '/contractAdd';
        this.editPathName = '/contractEdit';
        this.placeholder = '合同号，客户id，业务员id，序列号';
        this.filter = ['sign_time','group','contract_state','delivery_state','delivery_time','overdraft','directSale', 'new_customer'];
        this.markType = 'ContractsHead';
        this.actionWidth = 260;
        this.tableWidth = 292;
        this.paidPowerPower = [ '1603', '1702' ];
        this.options = [
            {
                text: '流程状态',
                value: 'delivery_state'
            },
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
            contract_no: {
                label: '合同编号',
                width: 200
            },
            cus_abb: {
                label: '客户',
                width: 200
            },
            album: {
                label: '照片',
                width: 200
            },
            delivery_state: {
                label: '流程状态',
                width: 150
            },
            paid: {
                label: '付款状态',
                width: 150
            },
            credit_qualified: {
                label: '信用状态',
                width: 150
            },
            total_amount: {
                label: '总金额',
                width: 100
            },
            payable: {
                label: '应付金额',
                width: 100
            },
            contract_state: {
                label: '合同状态',
                width: 100
            },
            sale_person: {
                label: '业务员',
                width: 100
            },
            sign_time: {
                label: '签订日期',
                width: 150
            }
            
        };
        this.state.pagination.filter = {
            sign_time: new Date().getFullYear()-1 + '-01',
            group: "",
            contract_state: "有效",
            delivery_state: "",
            delivery_time: "",
            overdraft: "",
            directSale: "",
            new_customer: '所有客户',
        }
        this.canRowSelection = true;
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

    inputRender(){
        const { selectedRowKeys, selectedRows, pagination } = this.state;
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
                        { <BtnGroup allowDeliveryFun={this.allowDelivery} paidPowerPower={this.paidPowerPower} removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //获取数据
    //override
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
                    markLen,
                    sumTotalAmount: res.body.data.sumTotalAmount,
                    sumPayable: res.body.data.sumPayable,
                    sumPaid: res.body.data.sumPaid
                });
            });
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='total_amount'||key=='payable'){
            textAlign = 'right';
            row[key] = parseInt(row[key]);
        }
        if(key=='album'){
            let albumArr;
            try{
                albumArr = row[key].split(',');
            }catch(e){  
                albumArr = [];
            }
            title = <div>
                        <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/'+items;
                                        let smallSrc = src.split('/contract/')[0]+'contract/small_'+src.split('/contract/')[1];
                                        return(
                                            <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                                <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(smallSrc)} />
                                            </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            content = title;
        }else if(key=='paid'){
            const payable = row['payable'];
            const paid = row['paid'];
            let overdraft = parseInt(Number(payable) - Number(paid));
            if(payable==paid){
                content = '已结清';
                title = content;
            }else{
                content = <span style={{color: '#f00'}}>{'欠款（'+overdraft+'）'}</span>;
                title = <span>{'欠款（'+overdraft+'）'}</span>;
            }
        }else if(key=='credit_qualified'){
            if(row[key]==1){
                content = <span>{'合格'}</span>;
            }else if(row[key]==0){
                content = <span style={{color: '#f00'}}>{'不合格'}</span>;
            }else{
                content = <span></span>;
            }
        }else if(key=='contract_no') {
            const num = Number(row['snLackNum']) + Number(row['otherSnLackNum']);
            if (num==0) {
                content = row[key];
            }else{
                content = <span>{row[key]}<Badge style={{transform: 'scale(0.8)', marginLeft: 2}} count={num} /></span>;
            }
            if (row.grade < 3) {
                content = <span>
                    {content}
                    <Badge style={{transform: 'scale(0.8)', marginLeft: 2, backgroundColor: '#fff', borderColor: 'rgb(66, 219, 65)', color: 'rgb(66, 219, 65)'}} count={row.grade} />
                </span>
            }
            if (row.madeInApp) {
                content = <div><span style={{color: '#ffee58',marginRight: 5}}>N</span>{content}</div>;
            }
            title = row[key];
        }else{
            title = row[key];
            content = row[key];
        }
        return <p style={{width: res_data[key]['width']-16,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    //表格点击
    handleTableClick(record, index, e){
        const { data,pagination } = this.state;
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
            if (record.madeInApp == 1) {
                hashHistory.push({
                    pathname: '/contractAddAgain',
                    state: selectData
                });
            } else {
                let pathname = this.editPathName;
                this.props.siderList.forEach(items => {
                    if (items.link == this.editPathName + 'Pro') {
                        pathname = this.editPathName + 'Pro';
                    }
                });
                hashHistory.push({
                    pathname,
                    state: selectData
                });
            }
        }else if(e.target.innerHTML=='标记'){
            let targetDom = e.target;
            this.addMark(record.id,'ContractsHead',() => {
                targetDom.innerHTML = '取消标记';
            });
        }else if(e.target.innerHTML=='取消标记'){
            let targetDom = e.target;
            this.cancelMark(record.id,'ContractsHead',() => {
                targetDom.innerHTML = '标记';
            });
        }else if(e.target.innerHTML=='打印'){
            setTimeout(() => {
                this.download(record);
            }, 500);
            // this.printPage(record);
        }else if(e.target.innerHTML=='定价单'){
            hashHistory.push({
                pathname: '/pricingList',
                state: {
                    contract_no: record.contract_no
                }
            });
        } else if (e.target.innerHTML === '生产单') {
            const softType = record.softType.split(',').filter(items => items);
            hashHistory.push({
                pathname: '/productOrder',
                state: {
                    id: record.id,
                    contract_no: record.contract_no,
                    softType,
                }
            });
        }
    }

    //@override
    actionRender(text, row, index){
        const user_id = sessionStorage.getItem('user_id');
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <a style={{marginLeft: 10}} href="javascript:void(0)">定价单</a>
                    { row.delivery_state !== '审核中' && <a style={{marginLeft: 10}} href="javascript:void(0)">生产单</a> }
                    { row.delivery_state !== '审核中' && <Popover placement="bottomRight" id="barcode" content={<Barcode value={row.contract_no} />} trigger="click">
                        <a style={{marginLeft: 10}} href="javascript:void(0)">打印</a>
                    </Popover> }
                    { row.delivery_state === '审核中' && this.paidPowerPower.includes(user_id) === true && <Popconfirm placement="bottomRight" title={'确定？'} onConfirm={() => {
                        this.allowDelivery(row.contract_no);
                    }}>
                        <a style={{marginLeft: 10}} href="javascript:void(0)">允许发货</a>
                    </Popconfirm> }
                    <a className={"_mark_a"} style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                </p>;
    }

    allowDelivery = async contract_no => {
        let token = sessionStorage.getItem('token');
        await new Promise(resolve => {
            request.put(common.baseUrl('/contracts/turnToAllowDelivery/'+contract_no))
                .set("token",token)
                .end((err,res) => {
                    if (err) return;
                    message.success(res.body.msg);
                    resolve();
                    this.fetch();
                });
        });
    }

    download = record => {
        const svgXml = $('#barcode .ant-popover-inner-content').html();
        const image = new Image();
        image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgXml)));
        const canvas = document.createElement('canvas');  //准备空画布
        canvas.width = $('#barcode .ant-popover-inner-content svg').width();
        canvas.height = $('#barcode .ant-popover-inner-content svg').height();
        const context = canvas.getContext('2d');  //取得画布的2d绘图上下文
        setTimeout(() => {
            context.drawImage(image, 0, 0);
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');  //将画布内的信息导出为png图片数据
            a.download = record.contract_no;  //设定下载名称
            a.click(); //点击触发下载
        }, 500);
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const group = ['杭州组', '济南组'];
        const contract_state = ['草签', '关闭','有效'];
        const delivery_state = ['审核中', '待发货', '发货中', '已发货', '已收货'];
        const delivery_time = ['已发货','未发货'];
        const overdraft = ['欠款','已结清'];
        const directSaleArr = ['直销','非直销'];
        const newCustomerArr = ['所有客户', '一年新', '二年新'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        let sign_time = pagination.filter.sign_time?pagination.filter.sign_time:null;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"签订起始时间："}</span>
                        <MonthPicker allowClear={false} onChange={this.signDateChange} value={moment(sign_time)} format={'YYYY-MM'} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"分组："}</span>
                        <CheckboxGroup options={group} value={pagination.filter.group.split(',')} onChange={(v) => this.filterType('group',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"合同状态："}</span>
                        <CheckboxGroup options={contract_state} value={pagination.filter.contract_state.split(',')} onChange={(v) => this.filterType('contract_state',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"流程状态："}</span>
                        <CheckboxGroup options={delivery_state} value={pagination.filter.delivery_state.split(',')} onChange={(v) => this.filterType('delivery_state',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"发货状态："}</span>
                        <CheckboxGroup options={delivery_time} value={pagination.filter.delivery_time.split(',')} onChange={(v) => this.filterType('delivery_time',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"欠款状态："}</span>
                        <CheckboxGroup options={overdraft} value={pagination.filter.overdraft.split(',')} onChange={(v) => this.filterType('overdraft',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"是否直销："}</span>
                        <CheckboxGroup options={directSaleArr} value={pagination.filter.directSale.split(',')} onChange={(v) => this.filterType('directSale',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"新客户："}</span>
                        <RadioGroup options={newCustomerArr} value={pagination.filter.new_customer} onChange={(v) => this.filterType('new_customer',v.target.value)} />
                    </div>
                </div>
    }

    //改变筛选时间
    signDateChange(o,v){
        const { pagination } = this.state;
        pagination.filter.sign_time = v;
        this.setState({
            pagination
        },() => this.fetch());
    }

    //打印
    printPage(record){
        let _str = '<div style="display: flex;flex-direction: column;height:100%;justify-content: space-around;">';
        let str = '<table style="flex: 1" width="100%" border="1px solid #000" cellspacing="0" cellpadding="2" align="center">';
        str += '<caption style="margin-bottom: 15px;">'+record.contract_no+'（'+record.cus_abb+'）</caption>';
        str += '<th style="width:20%">名称</th><th style="width:20%">规格型号</th><th style="width:20%">数量</th><th>备注</th>';
        record.bodyArr.forEach((items,index) => {
            str += '<tr style="text-align: center;"><td>'+items.goods_name+'</td><td>'+items.goods_spec+'</td><td>'+items.goods_num+'</td><td>'+items.rem+'</td></tr>';
        });
        str += '<tr style="text-align: center;"><td>接收人</td><td colspan="3"></td></tr>';
        _str = _str + str+'</table>' + str+'</table>' + str+
                '<tr style="text-align: center;"><td>准许发货</td><td></td><td>发货时间</td><td></td></tr>'+
                '</table>' + '</div>';
        let newWindow = window.open("打印窗口","_blank");
        newWindow.document.write(_str);
        newWindow.document.close();
        newWindow.print();
        newWindow.close();
    }

    //@override
    //子表格
    expandedRowRender(data){
        const columns = [
            { title: '类型', dataIndex: 'goods_type', key: 'goods_type', width: 150 },
            { title: '名称', dataIndex: 'goods_name', key: 'goods_name', width: 150 },
            { title: '规格型号', dataIndex: 'goods_spec', key: 'goods_spec', width: 150 },
            { title: '数量', dataIndex: 'goods_num', key: 'goods_num', width: 100 },
            { title: '单价', dataIndex: 'goods_price', key: 'goods_price',width: 100 },
            { title: '扣率', dataIndex: 'goods_ded_rate', key: 'goods_ded_rate',width: 100 },
            { title: '金额', dataIndex: 'goods_amount', key: 'goods_amount',width: 100 },
            { title: '备注', dataIndex: 'rem', key: 'rem' }
        ];
        const columns2 = [
            { title: '优惠类型', dataIndex: 'offer_type', key: 'offer_type', width: 200 },
            { title: '优惠金额', dataIndex: 'offer_amount', key: 'offer_amount', width: 200 },
            { title: '优惠凭据', dataIndex: 'offer_id', key: 'offer_id' },
            // { title: '抵价券号码', dataIndex: 'coupon_no', key: 'coupon_no', width: 200 },
            // { title: '抵价券金额', dataIndex: 'coupon_value', key: 'coupon_value', width: 150 },
            // { title: '合同号', dataIndex: 'service_deposit_no', key: 'service_deposit_no',width: 200 },
            // { title: '服务保证金额', dataIndex: 'service_deposit_value', key: 'service_deposit_value', width: 150 },
            // { title: '其它优惠', dataIndex: 'other_offers', key: 'other_offers' }
        ];
        // 货品
        const bodyArr = data.bodyArr;
        let goodsTotalAmount = 0,offerTotalAmount = 0;
        bodyArr.forEach((items,index) => {
            let { goods_num,goods_price,goods_ded_rate } = items;
            goods_ded_rate = !goods_ded_rate?1:goods_ded_rate;
            items.goods_amount = parseFloat(Number(goods_num) * Number(goods_price) * Number(goods_ded_rate)).toFixed(2);
            goodsTotalAmount += items.goods_amount;
        });
        const goodsFoot = () => {
            goodsTotalAmount = parseInt(goodsTotalAmount);
            return <p style={{marginBottom: 0,fontWeight: 'bolder'}}><span style={{marginRight: 4}}>货品总金额为</span>{data.total_amount}</p>;
        }
        // 优惠
        const offersData = [];
        data.ContractsOffers.forEach((items,index) => {
            if(items.coupon_no){
                offerTotalAmount += Number(items.coupon_value);
                offersData.push({
                    offer_type: '抵价券',
                    offer_amount: items.coupon_value,
                    offer_id: items.coupon_no
                });
            }
            if(items.service_deposit_no){
                offerTotalAmount += Number(items.service_deposit_value);
                offersData.push({
                    offer_type: '服务保证金',
                    offer_amount: items.service_deposit_value,
                    offer_id: items.service_deposit_no
                });
            }
            if(items.other_offers&&items.other_offers!=0){
                offerTotalAmount += Number(items.other_offers);
                offersData.push({
                    offer_type: '其它优惠',
                    offer_amount: items.other_offers,
                    offer_id: items.other_id
                });
            }
        });
        const offerFoot = () => {
            offerTotalAmount = parseInt(offerTotalAmount);
            return <p style={{marginBottom: 0,fontWeight: 'bolder'}}><span style={{marginRight: 4}}>优惠总金额为</span>{offerTotalAmount}</p>;
        }
        common.resizeTableHeight();
        if(offersData.length==0||offersData.length==1&&parseInt(offersData[0].offer_amount)==0){
            return (
                <div>
                    <Table
                        columns={columns}
                        dataSource={bodyArr}
                        pagination={false}
                        bordered
                        footer={() => goodsFoot()}
                    />
                </div>
            );
        }else{
            return (
                <div>
                    <Table
                        columns={columns}
                        dataSource={bodyArr}
                        pagination={false}
                        bordered
                        footer={() => goodsFoot()}
                    />
                    <Divider></Divider>
                    <Table
                        columns={columns2}
                        dataSource={offersData}
                        pagination={false}
                        footer={() => offerFoot()}
                    />
                </div>
            );
        }
    }

    //显示合同总金额，应付金额，总金额
    componentDidUpdate(){
        this.initMark();
        const { sumTotalAmount,sumPayable,sumPaid, selectedRowKeys, selectedRows, pagination } = this.state;
        const { total } = pagination;
        let totalPaybale = 0, totalOver = 0;
        let showSelected = 'block', showNum = 'none';
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalPaybale = sumPayable;
            totalOver = (Number(sumPayable)-Number(sumPaid)).toFixed(2);
        } else {
            let _p = 0;
            selectedRows.forEach(items => {
                totalPaybale += Number(items.payable);
                _p += Number(items.paid);
            });
            totalOver = totalPaybale - _p;
        }
        totalPaybale = parseFloat(totalPaybale).toFixed(2);
        totalOver = parseFloat(totalOver).toFixed(2);
        let containerWidth = $('.ant-spin-container').width();
        let w = containerWidth - 480;
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder;">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            // '<div style="margin-left: 48px;">'+
                            //     '<span style="font-weight: bolder">总金额：</span>'+
                            //     '<span>'+sumTotalAmount+'</span>'+
                            // '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">应付金额：</span>'+
                                '<span>'+this.formatAmount(totalPaybale)+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">欠款金额：</span>'+
                                '<span>'+this.formatAmount(totalOver)+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
        common.textRight(['总金额','应付金额']);
    }

    formatAmount = str => {
        const strArr = str.split('.');
        let amount = strArr[0];
        let count = 0;
        const formatStrArr = [];
        for (let i = amount.length - 1; i >= 0; i--) {
            formatStrArr.unshift(amount[i]);
            count++;
            if (count === 3) {
                count = 0;
                formatStrArr.unshift(',');
            }
        }
        if (formatStrArr.length !== 0 && formatStrArr[0] === ',') {
            formatStrArr.shift();
        }
        let resStr = '';
        formatStrArr.forEach(items => resStr += items);
        resStr += ('.' + strArr[1]);
        return resStr;
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

export default Contracts;