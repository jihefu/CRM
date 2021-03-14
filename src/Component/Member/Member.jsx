import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Button, Form,Input,Select,Tooltip,Checkbox,Popover,Radio,Drawer,Table, Tag } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import ModalTemp from '../common/Modal.jsx';
import PhotoLooker from '../common/PhotoLooker.jsx';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
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

class Member extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/member/list';
        this.editPathName = '/memberCheck';
        this.placeholder = '姓名，公司，手机';
        this.filter = ['state', 'delStatus', 'isUser', 'level', 'activeDegree', 'isEnterpriseWx'];
        this.markType = 'Member';
        this.fixedKey = 'name';
        this.options = [
            {
                text: '入会时间',
                value: 'id'
            },
            {
                text: '等级分',
                value: 'levelScore'
            },
            {
                text: '元宝分',
                value: 'ybScore'
            },
            {
                text: '最近活跃',
                value: 'last_login_time'
            },
            {
                text: '最近审核',
                value: 'check_time'
            }
        ];
        this.res_data = {
            name: {
                label: '姓名',
                width: 120
            },
            nick_name: {
                label: '昵称',
                width: 100
            },
            type: {
                label: '会员类型',
                width: 200
            },
            canChangeScore: {
                label: '元宝分',
                width: 100,
            },
            active_degree: {
                label: '活跃度',
                width: 150,
            },
            // state: {
            //     label: '认证状态',
            //     width: 150
            // },
            // portrait: {
            //     label: '本人头像',
            //     width: 100
            // },
            submit_time: {
                label: '入会时间',
                width: 150,
            },
            phone: {
                label: '手机号码',
                width: 150
            },
            // gender: {
            //     label: '性别',
            //     width: 100
            // },
            company: {
                label: '公司',
                width: 200
            },
            job: {
                label: '职位',
                width: 150
            },
            qq: {
                label: '常用社交帐号',
                width: 150
            },
            addr: {
                label: '地址',
                width: 150
            },
            college: {
                label: '毕业院校',
                width: 150
            },
            major: {
                label: '专业',
                width: 150
            },
            birth: {
                label: '生日',
                width: 150
            }
        };
        this.state.pagination.filter = {
            state: '',
            codeType: '',
            delStatus: '未删除',
            isUser: '',
            level: '',
            activeDegree: '',
            isEnterpriseWx: '',
        }
        this.state.stateDisabled = false;
        this.state.totalCanChangeScore = 0;
        this.state.exchangeRecordVisible = false;
        this.canRowSelection = true;
    }

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
                    totalCanChangeScore: res.body.data.totalCanChangeScore,
                });
            });
    }

    //@Override
    componentDidMount() {
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
                keywords = this.props.location.state.phone?this.props.location.state.phone:'';
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

    nameLocation(data){
        // let pathname;
        // this.props.siderList.forEach((items,index) => {
        //     if(items.link=='/customers'){
        //         pathname = items.link;
        //     }
        // });
        // if(!pathname) pathname = '/customersView';
        // hashHistory.push({
        //     pathname: pathname,
        //     state: {
        //         company: data.company
        //     }
        // });
        // const { typeCode, company } = data;
        // const codeArr = common.getCodeArr(typeCode);
        // let pathname;
        // if (codeArr.indexOf(0) !== -1 || codeArr.indexOf(1) !== -1) {
        //     this.props.siderList.forEach((items,index) => {
        //         if(items.link=='/customers'){
        //             pathname = items.link;
        //         }
        //     });
        //     if(!pathname) pathname = '/customersView';
        // } else if (codeArr.indexOf(2) !== -1) {
        //     pathname = '/endUser';
        // } else if (codeArr.indexOf(4) !== -1) {
        //     pathname = '/buyer';
        // } else {
        //     pathname = '/publicRelationShip';
        // }
        hashHistory.push({
            pathname: '/verUnit',
            state: {
                company: data.company
            }
        });
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='portrait'){
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
                                        let src = '/img/member/'+items;
                                        return(
                                            <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                                <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(src)} />
                                            </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            content = title;
        }else if(key=='type'){
            title = row[key] + '（'+row['score']+'分）';
            content = title;
        }else if(key=='name'){
            title = row[key];
            if (row['isUser']==1) {
                content = <span><span style={{color: '#42db41',marginRight: 5}}>P</span>{row[key]}</span>
            } else if(row['state']=='已认证'){
                content = <span><span style={{color: '#42db41',marginRight: 5}}>V</span>{row[key]}</span>
            }else if(row['state']=='未通过'){
                content = <span><span style={{marginRight: 5}}>-</span>{row[key]}</span>
            }else{
                content = <span><span style={{color: '#ffee58',marginRight: 5}}>N</span>{row[key]}</span>
            }
            content = <span>
                    { row.isEnterpriseWx == 1 && <svg style={{position: 'relative', top: 5}} t="1614321483599" class="icon" viewBox="0 0 1228 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2178" width="20" height="20"><path d="M798.5152 795.4432a16.384 16.384 0 0 0 2.048 24.9856 210.1248 210.1248 0 0 1 64.7168 126.1568 68.4032 68.4032 0 1 0 73.1136-86.016 209.92 209.92 0 0 1-116.736-65.1264 16.384 16.384 0 0 0-23.1424 0z" fill="#FB6500" p-id="2179"></path><path d="M1076.224 687.104a68.1984 68.1984 0 0 0-19.6608 41.1648 209.92 209.92 0 0 1-64.9216 116.9408 16.384 16.384 0 1 0 24.9856 20.8896 209.92 209.92 0 0 1 126.1568-64.7168 68.4032 68.4032 0 1 0-66.3552-114.2784z" fill="#0082EF" p-id="2180"></path><path d="M883.5072 494.1824a68.4032 68.4032 0 0 0 41.1648 116.3264 209.92 209.92 0 0 1 116.9408 64.9216 16.384 16.384 0 1 0 20.8896-24.9856 210.1248 210.1248 0 0 1-64.7168-126.1568 68.4032 68.4032 0 0 0-114.2784-30.1056z" fill="#2DBC00" p-id="2181"></path><path d="M849.92 601.088l-1.2288 1.2288a209.7152 209.7152 0 0 1-128 66.9696 67.9936 67.9936 0 0 0-30.3104 114.2784 68.4032 68.4032 0 0 0 116.3264-41.1648 210.1248 210.1248 0 0 1 65.1264-116.9408 16.384 16.384 0 0 0-21.9136-24.3712z" fill="#FFCC00" p-id="2182"></path><path d="M436.6336 10.6496C313.9584 24.1664 202.752 76.5952 122.88 158.5152 91.136 190.8736 65.3312 227.328 46.2848 266.24a375.1936 375.1936 0 0 0 26.4192 378.88c21.7088 32.768 57.344 73.728 89.9072 102.8096l-14.7456 115.9168-1.6384 4.9152c-0.4096 1.4336-0.4096 3.072-0.6144 4.5056l-0.4096 3.6864 0.4096 3.6864a37.2736 37.2736 0 0 0 56.1152 28.8768h0.6144l2.2528-1.6384 35.2256-17.6128 105.0624-52.8384a542.3104 542.3104 0 0 0 153.6 21.0944 550.912 550.912 0 0 0 188.416-32.768 68.1984 68.1984 0 0 1-46.4896-71.4752 462.6432 462.6432 0 0 1-193.7408 19.2512L436.224 772.096a468.3776 468.3776 0 0 1-69.632-14.5408 47.5136 47.5136 0 0 0-37.2736 3.8912l-2.8672 1.4336-86.4256 50.7904-3.6864 2.2528c-2.048 1.2288-3.072 1.6384-4.096 1.6384a5.9392 5.9392 0 0 1-5.5296-6.144l3.2768-13.312 3.8912-14.5408 6.144-23.9616 7.168-26.624a36.2496 36.2496 0 0 0-13.1072-40.3456 377.856 377.856 0 0 1-87.2448-90.9312A295.5264 295.5264 0 0 1 125.5424 303.104c15.5648-31.1296 36.0448-60.0064 61.44-86.016 65.536-67.584 157.696-110.592 259.6864-121.6512a483.7376 483.7376 0 0 1 106.0864 0c101.376 11.6736 193.1264 55.296 258.2528 122.4704 25.1904 26.0096 45.6704 55.296 60.8256 86.4256 20.2752 41.3696 30.5152 85.1968 30.5152 130.048 0 4.7104-0.4096 9.4208-0.6144 13.9264a68.1984 68.1984 0 0 1 83.968 9.8304l3.072 3.6864a373.1456 373.1456 0 0 0-37.2736-194.1504 418.2016 418.2016 0 0 0-75.776-107.7248A514.048 514.048 0 0 0 563.2 11.0592a576.1024 576.1024 0 0 0-126.5664-0.4096z" fill="#0082EF" p-id="2183"></path></svg> }
                    {content}
                </span>
        }else if(key=='company'){
            title = <span onClick={() => this.nameLocation(row)} style={{cursor: 'pointer'}}>{row[key]}</span>
            content = title;
        } else if (key == 'canChangeScore') {
            title = row[key] + '分';
            content = title;
        } else if (key === 'submit_time') {
            title = moment(row[key]).format('YYYY-MM-DD');
            content = title;
        } else if (key === 'active_degree') {
            const d = moment(row.last_login_time).format('YYYY-MM-DD HH:mm:ss').split(' ')[0];
            const diffDay = moment().diff(moment(d), 'days');
            let tag;
            if (diffDay < 1) {
                tag = <span>{row[key] + '/7'}<Tag color="magenta" style={{marginLeft: 6}}>当天活跃</Tag></span>
            } else if (diffDay < 3) {
                tag = <span>{row[key] + '/7'}<Tag color="red" style={{marginLeft: 6}}>3天内活跃</Tag></span>
            } else if (diffDay < 7) {
                tag = <span>{row[key] + '/7'}<Tag color="volcano" style={{marginLeft: 6}}>7天内活跃</Tag></span>
            } else if (diffDay < 15) {
                tag = <Tag color="orange">15天内活跃</Tag>
            } else if (diffDay < 30) {
                tag = <Tag color="gold">30天内活跃</Tag>
            }
            content = tag;
            title = content;
        } else {
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
    inputRender(){
        const { selectedRows, selectedRowKeys, pagination } = this.state;
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
                        { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.showExchangeRecord} style={{"position":"relative","top":3,marginRight: 60}}>兑换记录</Button> }
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
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
        const { pagination, stateDisabled } = this.state;
        const state = ['待认证', '未通过','已认证','认证申请中'];
        const delStatus= ['未删除', '已删除'];
        const isUser = [ '个人', '商务' ];
        const level = ['白银会员', '黄金会员', '铂金会员', '钻石会员'];
        const activeDegree = ['当天活跃', '3天内活跃', '7天内活跃', '15天内活跃', '30天内活跃'];
        const isEnterpriseWx = ['否', '是'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"认证状态："}</span>
                        <CheckboxGroup disabled={stateDisabled} options={state} value={pagination.filter.state.split(',')} onChange={(v) => this.filterType('state',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"会员类型："}</span>
                        <CheckboxGroup options={isUser} value={pagination.filter.isUser.split(',')} onChange={(v) => this.filterType('isUser',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"会员等级："}</span>
                        <CheckboxGroup options={level} value={pagination.filter.level.split(',')} onChange={(v) => this.filterType('level',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"删除状态："}</span>
                        <RadioGroup options={delStatus} value={pagination.filter.delStatus} onChange={(v) => this.filterType('delStatus',v.target.value)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"活跃度："}</span>
                        <CheckboxGroup options={activeDegree} value={pagination.filter.activeDegree.split(',')} onChange={(v) => this.filterType('activeDegree',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"企业微信："}</span>
                        <CheckboxGroup options={isEnterpriseWx} value={pagination.filter.isEnterpriseWx.split(',')} onChange={(v) => this.filterType('isEnterpriseWx',v)} />
                    </div>
                </div>
    }

    // @Override
    filterType = (type,v) => {
        let stateDisabled = true;
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
        if (pagination.filter.isUser.indexOf('个人') !== -1) {
            stateDisabled = true;
            pagination.filter.state = '';
        } else {
            stateDisabled = false;
        }
        if (pagination.filter.state !== '') {
            pagination.filter.isUser = '商务';
        }
        this.setState({
            pagination,
            stateDisabled,
        },() => this.fetch());
    }

    showExchangeRecord = () => {
        const { exchangeRecordVisible }= this.state;
        this.setState({
            exchangeRecordVisible: !exchangeRecordVisible,
        });
    }

    componentDidUpdate(){
        this.initMark();
        const { pagination, totalCanChangeScore, selectedRowKeys, selectedRows } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none', totalYbScore = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalYbScore = totalCanChangeScore;
        } else {
            selectedRows.forEach(items => {
                totalYbScore += items.canChangeScore;
            });
        }
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: 270px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder">会员数：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">元宝分：</span>'+
                                '<span>'+totalYbScore+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        }, 0);
    }

    render(){
        let { data,pagination, photoOption } = this.state;
        const { albumBorwerArr, imgSrc, canRenderPhoto } = photoOption;
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
            <div>
                {this.inputRender()}
                {
                    this.tableRender({
                        columns: columns,
                        data: data,
                        tableWidth: tableWidth,
                        b_height: b_height
                    })
                }
                <PhotoLooker cancelPhotoLooker={this.cancelPhotoLooker} albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={canRenderPhoto}></PhotoLooker>
                { this.state.exchangeRecordVisible && <ExchangeRecord drawerClose={this.showExchangeRecord} visible={this.state.exchangeRecordVisible}></ExchangeRecord> }
            </div>
        )
    }
}

class ExchangeRecord extends Component {
    constructor(props) {
        super(props);
        this.state = {
            recordList: [],
        };
    }

    componentDidMount() {
        this.fetchRecord();
    }

    fetchRecord = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/member/getExchangeRecord'))
            .set("token",token)
            .end((err,res) => {
                if (err) return;
                this.setState({
                    recordList: res.body.data,
                });
            });
    }

    columns = [
        {
            title: '会员',
            dataIndex: 'memberName',
            key: 'memberName',
        },
        {
            title: '物品',
            dataIndex: 'goodsName',
            key: 'goodsName',
        },
        {
            title: '兑换时间',
            dataIndex: 'consumeTime',
            key: 'consumeTime',
            render: text => <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>
        },
    ];

    render() {
        const { recordList } = this.state;
        return (
            <Drawer
                width={600}
                title={'兑换记录'}
                placement="right"
                closable={false}
                onClose={this.props.drawerClose}
                visible={this.props.visible}
            >
                <Table columns={this.columns} dataSource={recordList} />
            </Drawer>
        )
    }
}

export default Member;