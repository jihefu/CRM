import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Radio,Select,Tooltip,Checkbox,Popover,Tag, Drawer, Table } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import MeetOrdersInfo from './MeetOrdersInfo.jsx';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import PhotoLooker from '../common/PhotoLooker.jsx';
import $ from 'jquery';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import 'moment/locale/zh-cn';
import * as bluebird from 'bluebird';
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
                    text: '通过',
                    onClick: this.pass,
                },
                {
                    text: '退回',
                    onClick: this.notPass,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        pass = async () => {
            const { selectedRowKeys: idArr } = this.props;
            const r = window.confirm('确认通过' + idArr.length + '条见面联系单？');
            if (!r) {
                return;
            }
            const toast = message.loading('正在提交中');
            const token = sessionStorage.getItem('token');
            await bluebird.map(idArr, async id => {
                await new Promise(resolve => {
                    request.put(common.baseUrl('/businessTrip/meetOrder/normalAgree/' + id))
                        .set("token", token)
                        .end((err, res) => {
                            if (err) return;
                            resolve();
                        });
                });
            }, { concurrency: 2 });
            message.success('批量操作成功');
            toast();
            this.props.refresh();
        }

        notPass = async () => {
            const { selectedRowKeys: idArr } = this.props;
            const r = window.confirm('确认退回' + idArr.length + '条见面联系单？');
            if (!r) {
                return;
            }
            const toast = message.loading('正在提交中');
            const token = sessionStorage.getItem('token');
            await bluebird.map(idArr, async id => {
                await new Promise(resolve => {
                    request.put(common.baseUrl('/businessTrip/meetOrder/normalDisAgree/' + id))
                        .set("token", token)
                        .end((err, res) => {
                            if (err) return;
                            resolve();
                        });
                });
            }, { concurrency: 2 });
            message.success('批量操作成功');
            toast();
            this.props.refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            const user_id = sessionStorage.getItem('user_id');
            let showPassBtn = true;
            for (let i = 0; i < selectedRows.length; i++) {
                const { state, director, purpose } = selectedRows[i];
                if (purpose === '上门服务') {
                    showPassBtn = false;
                } else {
                    if (state != 6 || user_id != director) {
                        showPassBtn = false;
                    }
                }
            }
            if (!showPassBtn) {
                currentFunArr = [];
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

class BusinessTrip extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/businessTrip/meetOrderList';
        this.addPathName = '/meetOrdersImage';
        this.placeholder = '联系单位';
        this.actionWidth = 100;
        this.filter = [ 'purpose', 'state', 'staff', 'contact_time' ];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
        ];
        this.res_data = {
            create_person_name: {
                label: '申请人',
                width: 120,
            },
            state: {
                label: '状态',
                width: 150
            },
            contact_time: {
                label: '见面时间',
                width: 150,
            },
            company: {
                label: '联系单位',
                width: 200
            },
            contact_name: {
                label: '联系人',
                width: 150
            },
            album: {
                label: '照片',
                width: 200,
            },
            purpose: {
                label: '目的',
                width: 150,
            },
            directorName: {
                label: '指派人',
                width: 150,
            },
            content: {
                label: '服务内容及结果',
                width: 300,
            },
            addr: {
                label: '地址',
                width: 200,
            },
        };
        this.state.pagination.filter.purpose = '';
        this.state.pagination.filter.state = '审核中,已通过';
        this.state.pagination.filter.staff = '';
        this.state.pagination.filter.contact_time = '当月';
        this.state.total_work_time = 0;
        this.state.selectData = {};
        this.state.infoBlock = false;
        this.refresh = this.refresh.bind(this);
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
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
        }
        this.fetchAllStaff();
    }

    //@Override
    componentDidUpdate() {
        const { total_work_time, selectedRowKeys, selectedRows, pagination } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none', totalNum = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalNum = total_work_time;
        } else {
            selectedRows.forEach(row => {
                totalNum += Number(row.check_work_time);
            });
        }
        totalNum = parseFloat(totalNum).toFixed(2);
        let footTemp = '';
        const containerWidth = $('.ant-spin-container').width();
        const w = containerWidth - 500;
        footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">总服务工时：</span>'+
                                '<span>'+totalNum+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
        
    }

    //获取数据
    //@Override
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
                });
                let total = res.body.data.total;
                const total_work_time = res.body.data.total_work_time;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen,
                    total_work_time,
                });
            });
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if (key === 'state') {
            if (row[key] == 0) {
                title = '填报中';
                content = <Tag>{title}</Tag>
            } else if (row[key] == 3) {
                title = '反馈中';
                content = <Tag color="#1890ff">{title}</Tag>
            } else if (row[key] == 6) {
                title = '审核中';
                content = <Tag color="#ffc107">{title}</Tag>
            } else if (row[key] == 9) {
                title = '不同意';
                content = <Tag color="#f00">{title}</Tag>
            } else if (row[key] == 12) {
                title = '已通过';
                content = <Tag color="#00C853">{title}</Tag>
            }
        } else if (key === 'album') {
            let albumArr;
            try{
                albumArr = row[key].split(',').filter(items => items);
            }catch(e){  
                albumArr = [];
            }
            content = <div>
                        <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/gallery/'+items;
                                        let small_src = '/img/gallery/list_'+items;
                                        return(
                                            <img onClick={() => {
                                                this.setState({
                                                    photoOption: {
                                                        imgSrc: common.staticBaseUrl(src),
                                                        canRenderPhoto: true,
                                                        albumBorwerArr: albumArr,
                                                    },
                                                });
                                            }} key={index} style={{width: 35,height: 35,marginRight: 10, cursor: 'pointer'}} src={common.staticBaseUrl(small_src)} />
                                            // <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                            //     <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(small_src)} />
                                            // </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            title = <div>
                        {
                            albumArr.map((items,index) => {
                                if(items){
                                    let src = '/img/gallery/'+items;
                                    let small_src = '/img/gallery/list_'+items;
                                    return(
                                        <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                            <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(small_src)} />
                                        </a>
                                    )
                                }
                            })
                        }
                    </div>;
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

    //@override
    inputRender(){
        const { data, pagination, selectedRowKeys, selectedRows } = this.state;
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
                        { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>浏览图片</Button>}
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
    actionRender(text, row, index){
        const actionArr = [];
        const user_id = sessionStorage.getItem('user_id');
        if (row.purpose === '上门服务') {
            actionArr.push(<a key={'详情'} href="javascript:void(0)" onClick={() => this.moreInfo(row)}>详情</a>);
        } else {
            if (row.state == 6 && user_id == row.director) {
                actionArr.push(<a key={'通过'} href="javascript:void(0)" onClick={() => this.normalAgree(row.id)}>通过</a>);
                actionArr.push(<a key={'退回'} href="javascript:void(0)" onClick={() => this.normalDisAgree(row.id)} style={{marginLeft: 8}}>退回</a>);
            } else {
                actionArr.push(<a key={'foo'} href="javascript:void(0)" style={{visibility: 'hidden'}}>foo</a>);
            }
        }
        return (
            <p className={"_mark"}>
                { actionArr }
            </p>
        );
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination, staffArr } = this.state;
        const state = [ '填报中', '反馈中', '审核中', '已通过'];
        const contact_time = [ '当月', '上月', '所有' ];
        const purpose = [ '上门服务', '拜访', '开会', '偶遇', '其它'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return (
            <div style={{maxWidth: 600}}>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"目的："}</span>
                    <CheckboxGroup options={purpose} value={pagination.filter.purpose.split(',')} onChange={(v) => this.filterType('purpose',v)} />
                </div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"状态："}</span>
                    <CheckboxGroup options={state} value={pagination.filter.state.split(',')} onChange={(v) => this.filterType('state',v)} />
                </div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"员工："}</span>
                    <CheckboxGroup options={staffArr} value={pagination.filter.staff.split(',')} onChange={(v) => this.filterType('staff',v)} />
                </div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"联系时间："}</span>
                    <RadioGroup options={contact_time} value={pagination.filter.contact_time} onChange={(v) => this.filterType('contact_time',v.target.value)}/>
                </div>
            </div>
        );
    }

    // 普通见面联系单同意
    normalAgree(id) {
        const token = sessionStorage.getItem('token');
        const that = this;
        const r = window.confirm('确定通过？');
        if (!r) return;
        request.put(common.baseUrl('/businessTrip/meetOrder/normalAgree/' + id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                that.fetch();
            });
    }

    // 普通见面联系单不同意
    normalDisAgree(id) {
        const token = sessionStorage.getItem('token');
        const that = this;
        const r = window.confirm('确定退回？');
        if (!r) return;
        request.put(common.baseUrl('/businessTrip/meetOrder/normalDisAgree/' + id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                that.fetch();
            });
    }

    // 详情
    async moreInfo(data) {
        // 更新合同号
        const { contract_no } = data;
        const result = await new Promise(async resolve => {
            if (!contract_no) {
                // 更新contract_no
                const result = await updateContractNo();
                resolve(result);
            } else {
                resolve();
            }
        });
        if (result && result.contract_no) {
            data.contract_no = result.contract_no;
            data.check_work_time = result.check_work_time;
        }
        this.setState({
            selectData: data,
        }, () => {
            this.setState({
                infoBlock: true,
            });
        });

        async function updateContractNo() {
            const { id, sn } = data;
            const obj = {
                contract_no: null,
                check_work_time: 0,
            };
            const token = sessionStorage.getItem('token');
            await new Promise(async resolve => {
                request.put(common.baseUrl('/business/updateContractNoBySn'))
                .set("token",token)
                .send({
                    id,
                    sn,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        obj.contract_no = res.body.data.contract_no;
                        obj.check_work_time = res.body.data.check_work_time;
                    }
                    resolve();
                });
            });
            return obj;
        }
    }

    refresh() {
        this.fetch();
        this.setState({
            infoBlock: false,
        });
    }

    //获取所有员工信息
    fetchAllStaff(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                const staff = [];
                res.body.data.forEach((items) => {
                    const { branch, user_name } = items;
                    staff.push(user_name);
                });
                this.setState({
                    staffArr: staff,
                });
            });
    }

    render(){
        let { data,pagination, selectData, infoBlock, photoOption } = this.state;
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
                <Drawer
                    title={'上门服务详细信息'}
                    placement={'top'}
                    height={600}
                    visible={infoBlock}
                    closable={true}
                    onClose={() => this.setState({infoBlock: false})}
                >
                    <MeetOrdersInfo contentHeight={500} data={selectData} refresh={this.refresh}></MeetOrdersInfo>
                </Drawer>
                <PhotoLooker cancelPhotoLooker={this.cancelPhotoLooker} albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={canRenderPhoto}></PhotoLooker>
            </div>
        )
    }
}

export default BusinessTrip;