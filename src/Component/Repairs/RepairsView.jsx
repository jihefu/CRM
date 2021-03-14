import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Layout, Menu, Icon, Button, message, Table, Form, Input,Badge, Dropdown,Select,Tooltip } from 'antd';
import request from 'superagent';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import ModalTemp from '../common/Modal.jsx';
import common from '../../public/js/common.js';
import base from '../../public/js/base';
const { TextArea } = Input;
const Option = Select.Option;
moment.locale('zh-cn');
let type = 0;

    class RepairsView extends Component {
        constructor(props) {
            super(props);
            this.handleTableChange = this.handleTableChange.bind(this);
            this.handleTableClick = this.handleTableClick.bind(this);
            this.handleCreate = this.handleCreate.bind(this);
            this.handleSearch = this.handleSearch.bind(this);
            this.handleModalCancel = this.handleModalCancel.bind(this);
            this.handleModalDefine = this.handleModalDefine.bind(this);
            this.orderChange = this.orderChange.bind(this);
            this.filterType = this.filterType.bind(this);
            this.markLen = 0;
            this.deleteId = 0;
        }
        state = {
            res_data: {},
            data: [],
            pagination: {
                current: 1,
                pageSize: 30,
                keywords: '',
                order: '',
                total: 0
            },
            loading: false,
            visible: false,
            modalText: '确定删除？'
        };

        fetch() {
            this.setState({ loading: true });
            let token = sessionStorage.getItem('token');
            let { current, pageSize, keywords, order } = this.state.pagination;
            request.get(common.baseUrl('/repairs/list'))
                .set("token", token)
                .query({
                    page: current,
                    num: pageSize,
                    keywords: keywords,
                    type: type,
                    order: order
                })
                .end((err, res) => {
                    if (err) return;
                    let data = res.body.data.data;
                    const pagination = { ...this.state.pagination };
                    pagination.total = res.body.data.total;
                    try{
                        this.markLen = res.body.data.id_arr.length;
                    }catch(e){}
                    data.forEach((items, index) => {
                        for (let key in items) {
                            if(key=='receive_time'||key=='deliver_time'){
                                items[key] = items[key]?moment(Number(items[key]+'000')).format('YYYY-MM-DD'):null;
                            }else if(key=='update_time'){
                                items[key] = items[key]?moment(items[key]).format('YYYY-MM-DD HH:mm:ss'):null;
                            }else if(key=='insert_time'){
                                items[key] = moment(items[key])['_isValid']?moment(items[key]).format('YYYY-MM-DD'):null;
                            }else if(key=='complete'){
                                items[key] = items[key]?'是':'否';
                            }
                        }
                    });
                    this.setState({
                        pagination,
                        data,
                        loading: false
                    });
                });
        }

        //新增
        handleCreate = () => {
            let res_data = this.state.res_data;
            for(let j in res_data){
                res_data[j].initialValue = '';
            }
            hashHistory.push({
                pathname: '/repairAdd',
                state: res_data
            });
            this.props.changeBread('新增');
        }

        //分页
        handleTableChange(pagination) {
            const pager = { ...this.state.pagination };
            pager.current = pagination.current;
            this.setState({
                pagination: pager
            }, () => {
                this.fetch();
            });
        }
        //表格点击
        handleTableClick(record, index, e) {
            let res_data = this.state.res_data;
            if (e.target.innerHTML == '编辑') {
                for (let i in record) {
                    for (let j in res_data) {
                        if (i == j) {
                            res_data[j].initialValue = record[i];
                        }
                    }
                }
                res_data.id = record.id;
                base.SetStateSession(this.state);
                hashHistory.push({
                    pathname: '/repairEdit',
                    state: res_data
                });
                this.props.changeBread('编辑');
            }else if(e.target.innerHTML=='标记'){
                this.deleteId = record.id;
                let targetDom = e.target;
                this.addMark(record.id,() => {
                    targetDom.innerHTML = '取消标记';
                });
            }else if(e.target.innerHTML=='取消标记'){
                this.deleteId = record.id;
                let targetDom = e.target;
                this.cancelMark(record.id,() => {
                    targetDom.innerHTML = '标记';
                });
            }
        }
        handleModalCancel(){
            this.setState({
                visible: false
            });
        }

        handleModalDefine(){
            let id = this.deleteId;
            let token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/repairs/del'))
                .set("token", token)
                .send({
                    form_data: JSON.stringify({
                        id: id,
                        isdel: 1
                    })
                })
                .end((err, res) => {
                    if(err) return;
                    if(res.body.code==200){
                        message.success(res.body.msg);
                    }else{
                        message.error(res.body.msg);
                    }
                    this.fetch();
                });
        }
        //搜索
        handleSearch() {
            let keywords = $('input[name=keywords]').val();
            let pagination = this.state.pagination;
            pagination.keywords = keywords;
            pagination.current = 1;
            this.fetch();
        }

        componentDidMount() {
            if(base.GetStateSession()){
                this.setState({
                    pagination: base.GetStateSession()
                },() => {
                    this.fetch();
                    base.RemoveStateSession();
                });
            }else{
                const { pagination } = this.state;
                try{
                    pagination.order = this.options[0].value;
                }catch(e){

                }
                let keywords;
                try{
                    keywords = this.props.location.state.repair_contractno?this.props.location.state.repair_contractno:'';
                    pagination.keywords = keywords;
                }catch(e){

                }
                this.setState({
                    pagination
                },() => {
                    this.fetch();
                });
            }
            
            let res_data = {
                repair_contractno: {
                    label: '维修单号',
                    width: 130
                },
                cust_name: {
                    label: '送修单位',
                    width: 100
                },
                receive_time: {
                    label: '接收时间',
                    width: 130
                },
                album: {
                    label: '照片',
                    width: 100
                },
                goods: {
                    label: '产品',
                    width: 100
                },
                standrd: {
                    label: '规格',
                    width: 100
                },
                serial_no: {
                    label: '序列号',
                    width: 100
                },
                number: {
                    label: '数量',
                    width: 100
                },
                express: {
                    label: '快递单号',
                    width: 100
                },
                deliver_time: {
                    label: '发件时间',
                    width: 130
                },
                problems: {
                    label: '问题',
                    width: 130
                },
                conclusion: {
                    label: '送修测试结论',
                    width: 130
                },
                pri_check_person: {
                    label: '送修测试人',
                    width: 130
                },
                treatement: {
                    label: '处理方法',
                    width: 130
                },
                own_cost: {
                    label: '自产',
                    width: 100
                },
                outer_cost: {
                    label: '外购',
                    width: 100
                },
                guarantee_repair: {
                    label: '保修',
                    width: 100
                },
                related_contract: {
                    label: '维修合同',
                    width: 100
                },
                again_conclusion: {
                    label: '维修测试结论',
                    width: 130
                },
                again_check_person: {
                    label: '维修测试人',
                    width: 130
                },
                contact: {
                    label: '联系人',
                    width: 100
                },
                contact_type: {
                    label: '联系方式',
                    width: 100
                },
                deliver_state: {
                    label: '维修状态',
                    width: 100
                },
                rem: {
                    label: '备注',
                    width: 100
                },
                take_person: {
                    label: '收件确认人',
                    width: 100
                },
                take_time: {
                    label: '收件确认时间',
                    width: 130
                },
                complete: {
                    label: '维修是否完成',
                    input_attr: {
                        'disabled': 'disabled'
                    },
                    width: 100
                },
                insert_person: {
                    label: '录入人',
                    input_attr: {
                        'disabled': 'disabled'
                    },
                    width: 100
                },
                insert_time: {
                    label: '录入时间',
                    input_attr: {
                        'disabled': 'disabled'
                    },
                    width: 130
                },
                update_person: {
                    label: '更新人',
                    input_attr: {
                        'disabled': 'disabled'
                    },
                    width: 100
                },
                update_time: {
                    label: '更新时间',
                    input_attr: {
                        'disabled': 'disabled'
                    },
                    width: 200
                }
            };
            this.setState({
                res_data
            });
        }
        //子表格
        expandedRowRender(data){
            const columns = [
                { title: '维修单号', dataIndex: 'repair_contractno', key: 'repair_contractno', width: 150 },
                { title: '问题', dataIndex: 'problems', key: 'problems', width: 150 },
                { title: '测试结论', dataIndex: 'conclusion', key: 'conclusion', width: 150 },
                { title: '处理方法', dataIndex: 'treatement', key: 'treatement' }
            ];
            data = data.history;
            const _data = [];
            for (let i = 0; i < data.length; i++) {
                _data.push({
                    key: data[i].id,
                    repair_contractno: data[i].repair_contractno,
                    problems: data[i].problems,
                    conclusion: data[i].conclusion,
                    treatement: data[i].treatement
                });
            }
            return (
                <Table
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                />
            );
        }

        filterType(v){
            type = v;
            this.fetch();
        }

        selectBefore = () => {
            return <Select onChange={this.filterType} defaultValue={type} style={{ width: 100 }}>
                        <Option value={0}>全部</Option>
                        <Option value={"送修检验中"}>送修检验中</Option>
                        <Option value={"维修中"}>维修中</Option>
                        <Option value={"维修检验中"}>维修检验中</Option>
                        <Option value={"待发件"}>待发件</Option>
                        <Option value={"已发件"}>已发件</Option>
                        <Option value={"已收件"}>已收件</Option>
                    </Select>
        }

        //添加标记
        addMark(id,cb){
            let token = sessionStorage.getItem('token');
            request.post(common.baseUrl('/mark/add'))
                .set("token",token)
                .send({
                    tableId: id,
                    type: 'Repairs'
                })
                .end((err,res) => {
                    if(err) return;
                    if(res.body.code==200){
                        message.success(res.body.msg);
                        cb();
                    }else{
                        message.error(res.body.msg);
                    }
                })
        }

        //取消标记
        cancelMark(id,cb){
            let token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/mark/del'))
                .set("token",token)
                .send({
                    tableId: id,
                    type: 'Repairs'
                })
                .end((err,res) => {
                    if(err) return;
                    if(res.body.code==200){
                        message.success(res.body.msg);
                        cb();
                    }else{
                        message.error(res.body.msg);
                    }
                })
        }

        orderChange(v){
            let pagination = this.state.pagination;
            pagination.order = v;
            this.setState({
                pagination
            },() => this.fetch());
        }
        componentDidUpdate(){
            $('.ant-table-fixed-right ._mark').each((index,items) => {
                if(index<this.markLen){
                    $('.ant-table-fixed-right ._mark').eq(index).find('a').eq(0).html('取消标记');
                }else{
                    $('.ant-table-fixed-right ._mark').eq(index).find('a').eq(0).html('标记');
                }
            });
        }

        render() {
            let { data, res_data } = this.state;
            let b_height = window.innerHeight - 308;
            const columns = [];
            let tableWidth = 222;
            const colorType = (key,row) => {
                const deliveryStateArr = ['送修检验中','维修中','维修检验中','待发件','已发件','已收件'];
                if(key=='repair_contractno'){
                    if (deliveryStateArr.indexOf(row['deliver_state']) < 4) {
                        let receive_time = Date.parse(row['receive_time']);
                        let statusIndex = deliveryStateArr.indexOf(row['deliver_state']);
                        let day = (Date.now() - receive_time)/(1000*60*60*24);
                        if(day>=5&&statusIndex<4){
                            return <span style={{color: '#f00'}}>{row[key]}</span>
                        }else if(day>=3&&statusIndex<4){
                            return <span style={{color: '#ffc107'}}>{row[key]}</span>
                        }else{
                            return row[key];
                        }
                    } else {
                        return <span style={{color: 'rgb(0, 200, 83)'}}>{row[key]}</span>
                    }
                }else{
                    return row[key];
                }
            }
            for (let key in res_data) {
                tableWidth += res_data[key]['width'];
                let o = {
                    title: res_data[key].label,
                    dataIndex: key,
                    key: key,
                    width: res_data[key]['width'],
                    render: (text, row, index) => {
                        if(key=='album'){
                            let albumArr;
                            try{
                                albumArr = row[key].split(',');
                            }catch(e){  
                                albumArr = [];
                            }
                            return(
                                <div>
                                    <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                        {
                                            albumArr.map((items,index) => {
                                                if(items){
                                                    let src = '/img/'+items;
                                                    let smallSrc = src.split('/repair/')[0]+'repair/small_'+src.split('/repair/')[1];
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
                            )
                        }else{
                            return <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                        <Tooltip placement="top" title={row[key]}>
                                            {colorType(key,row)}
                                            {/* {row[key]} */}
                                        </Tooltip>
                                    </p>
                        }
                    }
                };
                if (key == 'name') o.fixed = 'left';
                columns.push(o);
            }
            columns.push({
                title: '操作',
                key: 'operation',
                fixed: 'right',
                width: 110,
                render: (text, row, index) => <p className={"_mark"}>
                                {/* <a href="javascript:void(0)">编辑</a> */}
                                <a style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                            </p>,
            });
            return (
                <div>
                    <Form style={{"display":"flex",padding: "24px 24px 0px 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Form.Item>
                                <Input addonBefore={this.selectBefore()} name="keywords" style={{ width: 400 }} placeholder="维修单号，维修单位" />
                            </Form.Item>
                            <Button type="primary" onClick={this.handleSearch} style={{"position":"relative","left":15,"top":3}}>搜索</Button>
                            <span style={{marginLeft: 50}}>
                                <Select defaultValue="id" onChange={this.orderChange} style={{"position":"relative","top":3,minWidth: 120}}>
                                    <Option value="id">最近新增</Option>
                                    <Option value="update_time">最近更新</Option>
                                </Select>
                            </span>
                        </div>
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <Table
                        columns={columns}
                        dataSource={data}
                        pagination={this.state.pagination}
                        loading={this.state.loading}
                        scroll={{ x: tableWidth, y: b_height }}
                        onRowClick={this.handleTableClick}
                        onChange={this.handleTableChange} 
                        expandedRowRender={this.expandedRowRender}
                        expandRowByClick={false} />
                    <ModalTemp 
                        handleModalCancel={this.handleModalCancel}
                        handleModalDefine={this.handleModalDefine}
                        ModalText={this.state.modalText} 
                        visible={this.state.visible} />
                </div>
            )
        }
    }

    export default RepairsView;