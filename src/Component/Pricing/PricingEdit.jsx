import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Modal, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Popconfirm,InputNumber,Steps } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import BaseEditList from '../common/BaseEditList.jsx';
import ModalTemp from '../common/Modal.jsx';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import moment from 'moment';
import $ from 'jquery';
import Linq from 'linq';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const FormItem = Form.Item;
const Step = Steps.Step;
const { confirm } = Modal;

class PricingEditTemp extends BaseEditList {
    constructor(props){
        super(props);
        this.target_key_prefix = '/targetPricing/';
        this.uploadRenderStart = true;
        this.goodsTable = this.goodsTable.bind(this);
        this.expandedRowRender = this.expandedRowRender.bind(this);
        this.calculCostPrice = this.calculCostPrice.bind(this);
        this.changeContractPrice = this.changeContractPrice.bind(this);
        this.state.state = {
            PricingListGoods: [],
        };
        this.state.labelProperty = {
            contract_no: {label: '合同号',input_attr: {disabled: 'disabled'}},
            contract_price: {label: '合同价'},
            cost_price: {label: '成本',input_attr: {disabled: 'disabled'}},
            achievement: {label: '业绩',input_attr: {disabled: 'disabled'}},
            deposit: {label: '服务保证金',input_attr: {disabled: 'disabled'}},
            total_work_hours: {label: '总工时',input_attr: {disabled: 'disabled'}}
        }
        this.state.goodsBreakArr = [];
        this.state.cost_price = 0;
        this.serverPriceMap = {
            '人': 0,
            '住宿': 0,
            '路程': 0
        };
        this.state.orderGoodsList = [];
        this.state.filterGroup = '全部';
        this.state.addType = '产品';
        this.state.addName = '';
        this.state.addNum = 1;
    }

    transToView(labelProperty,key,data){
        labelProperty[key]['initialValue'] = data[key];
	}

	transToModel(values){
		
    }

    getServerPriceMap(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/productsLibrary/getServerPriceMap'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.serverPriceMap = res.body.data;
            });
    }

    getOrderTypeGoods(type){
        if(type=='产品'||type=='附加配件'){
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/productsLibrary/search'))
                .set("token",token)
                .query({
                    product_type: type,
                    keywords: '',
                })
                .end((err,res) => {
                    if(err) return;
                    const orderGoodsList = [];
                    if(res.body.code==200){
                        res.body.data.forEach((items, index) => {
                            orderGoodsList.push(items.data);
                        });
                        this.setState({
                            orderGoodsList
                        });
                    }
                });
        }
    }

    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center',marginTop: 30}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    changeContractPrice(v){
        let cost_price = Number(this.props.form.getFieldValue('cost_price'));
        let achievement = v - cost_price;
        achievement = achievement<0?0:achievement;
        let deposit = achievement * 0.04;
        this.props.form.setFieldsValue({
            achievement,
            deposit
        });
    }
    
    //@Override
	//初始化
	componentDidMount(){
        let data = this.props.location.state;
		const user_id = sessionStorage.getItem('user_id');
		let fileList = [];
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		this.id = data['id'];
		for(let key in labelProperty){
            this.transToView(labelProperty,key,data);
            if(key=='contract_price'){
                labelProperty[key].temp = <InputNumber step={50} onChange={this.changeContractPrice} defaultValue={labelProperty[key].initialValue} />
            }
        }
        this.setInitData(data);
        this.getServerPriceMap();
    }

    setInitData = state => {
        const pricingListGoods = state.PricingListGoods;
        const goodsBreakArr = [];
        pricingListGoods.forEach((items,index) => {
            const obj = {
                _id: items.id,
                pricingListGoodsAmounts: items.PricingListGoodsAmounts
            };
            goodsBreakArr.push(obj);
        });
        this.setState({
            goodsBreakArr,
            cost_price: state.cost_price,
            state,
        });
    }

    //@Override
	//提交
	handleSubmit = (e) => {
        const { goodsBreakArr } = this.state;
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                this.transToModel(values);
                const form_data = {
                    id: this.id,
                    contract_no: values.contract_no,
                    cost_price: values.cost_price,
                    achievement: values.achievement,
                    deposit: values.deposit,
                    total_work_hours: values.total_work_hours,
                    contract_price: values.contract_price,
                    goodsBreakArr: goodsBreakArr
                };
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/pricing/update'))
		            .set("token",token)
		            .send(form_data)
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
							this.getOrderIdItem(result => {
								//sessionState替换
								let stateData = Base.GetStateSession();
								let { data } = stateData;
								data.forEach((items,index) => {
									if(items.id==result.id){
										data[index] = result;
										Base.SetStateSession(stateData);
									}
								});
								message.success('更新成功');
								this.handleBackClick();
							});
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            });
	        }
	    });
    }

    //计算成本价
    calculCostPrice(){
        const { goodsBreakArr, state: data } = this.state;
        let allGoodsAmount = 0, allWorkHours = 0;
        goodsBreakArr.forEach((items,index) => {
            const _id = items._id;
            let goods_num = 1;
            data.PricingListGoods.forEach((_it,_ind) => {
                if(_it.id == _id) goods_num = _it.goods_num;
            });
            items.pricingListGoodsAmounts.forEach((it,ind) => {
                allGoodsAmount += goods_num * it.amount;
                allWorkHours += goods_num * Number(it.total_work_hours ? it.total_work_hours : 0);
            });
        });
        const contract_price = data.contract_price;
        let achievement = contract_price - allGoodsAmount;
        achievement = achievement<0?0:achievement;
        let deposit = achievement * 0.04;
        this.props.form.setFieldsValue({
            cost_price: allGoodsAmount,
            achievement,
            deposit,
            total_work_hours: allWorkHours,
        });
    }

    //渲染分解物品列表
    goodsTypeRender(_id, goods_type){
        const { goodsBreakArr } = this.state;
        let i,obj;
        goodsBreakArr.forEach((items,index) => {
            if(items._id==_id){
                i = index;
                obj = items;
            }
        });
        const { pricingListGoodsAmounts } = obj;
        const goodsArr = [],serverArr = [],techArr = [],upgradeArr = [], advisoryArr = [];
        pricingListGoodsAmounts.forEach((items,index) => {
            if(goods_type == '产品' || goods_type == '附加配件'){
                goodsArr.push(items);
            }else if(goods_type == '现场服务'){
                serverArr.push(items);
            }else if(goods_type == '研发服务'){
                techArr.push(items);
            }else if(goods_type == '生产服务'){
                upgradeArr.push(items);
            }else if(goods_type == '咨询服务'){
                advisoryArr.push(items);
            }
        });
        if(goods_type == '现场服务'&&serverArr.length==0) serverArr.push({
            person_num: 0,
            day: 0,
            mile: 0,
            amount: 0,
            pricing_list_good_id: this.addId
        });
        if(goods_type == '研发服务'&&techArr.length==0) techArr.push({
            amount: 0,
            pricing_list_good_id: this.addId
        });
        if(goods_type == '生产服务'&&upgradeArr.length==0) upgradeArr.push({
            amount: 0,
            work_hours: 0,
            pricing_list_good_id: this.addId
        });
        if(goods_type == '咨询服务'&&advisoryArr.length==0) advisoryArr.push({
            amount: 0,
            pricing_list_good_id: this.addId
        });
        const goodsColumns = [
            { title: '成本项', dataIndex: 'name', key: 'name', width: 200 },
                // return <RemoteSearchInput value={record.name} searchInputselected={() => {}} cbData={(v) => {
                //     goodsArr[index].name = v.product_name;
                //     goodsArr[index].price = v.product_price;
                //     goodsArr[index].amount = v.product_price * goodsArr[index].num;
                //     let breakGoodsArr = [...goodsArr,...serverArr];
                //     goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                //     this.setState({
                //         goodsBreakArr
                //     },() => this.calculCostPrice());
                // }} remoteUrl={common.baseUrl('/productsLibrary/search?product_type='+goods_type+'&keywords=')} />
            { title: '成本', dataIndex: 'price', key: 'price', width: 100 },
            { title: '数量', dataIndex: 'num', key: 'num', width: 50, render: (text, record, index) => {
                return <InputNumber min={1} precision={0} value={record.num} onChange={(v) => {
                    goodsArr[index].num = v;
                    goodsArr[index].amount = v * goodsArr[index].price;
                    goodsArr[index].total_work_hours = v * goodsArr[index].work_hours;
                    let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                    goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                    this.setState({
                        goodsBreakArr
                    },() => this.calculCostPrice());
                }} />
            } },
            { title: '金额', dataIndex: 'amount', key: 'amount', width: 90},
            { title: '工时', dataIndex: 'total_work_hours', key: 'total_work_hours', width: 60},
            { title: '操作', dataIndex: 'action', key: 'action', render: (text, record, index) => {
                return (
                    <a href="javascript:void(0);" onClick={() => {
                        goodsArr.splice(index,1);
                        let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                        goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                        this.setState({
                            goodsBreakArr
                        },() => this.calculCostPrice());
                    }}><Icon type="delete" /></a>
                );
            }}
        ];
        const serverColumns = [
            { title: '人数', dataIndex: 'person_num', key: 'person_num', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} precision={0} value={record.person_num} onChange={(v) => {
                            serverArr[index].person_num = v;
                            let _day = (serverArr[index].day - 1) < 0 ? 0: serverArr[index].day - 1;
                            serverArr[index].amount = serverArr[index].person_num * (_day * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程']);
                            // serverArr[index].amount = serverArr[index].person_num * this.serverPriceMap['人'] + serverArr[index].day * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程'];
                            let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                            goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                            this.setState({
                                goodsBreakArr
                            },() => this.calculCostPrice());
                        }} />
            } },
            { title: '天数', dataIndex: 'day', key: 'day', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} precision={0} value={record.day} onChange={(v) => {
                            serverArr[index].day = v;
                            let _day = (serverArr[index].day - 1) < 0 ? 0: serverArr[index].day - 1;
                            serverArr[index].amount = serverArr[index].person_num * (_day * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程']);
                            // serverArr[index].amount = serverArr[index].person_num * ((serverArr[index].day - 1) * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程']);
                            // serverArr[index].amount = serverArr[index].person_num * this.serverPriceMap['人'] + serverArr[index].day * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程'];
                            let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                            goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                            this.setState({
                                goodsBreakArr
                            },() => this.calculCostPrice());
                        }} />
            } },
            { title: '全程', dataIndex: 'mile', key: 'mile', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} precision={0} step={50} value={record.mile} onChange={(v) => {
                            serverArr[index].mile = v;
                            let _day = (serverArr[index].day - 1) < 0 ? 0: serverArr[index].day - 1;
                            serverArr[index].amount = serverArr[index].person_num * (_day * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程']);
                            // serverArr[index].amount = serverArr[index].person_num * ((serverArr[index].day - 1) * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程']);
                            // serverArr[index].amount = serverArr[index].person_num * this.serverPriceMap['人'] + serverArr[index].day * this.serverPriceMap['住宿'] + serverArr[index].mile * this.serverPriceMap['路程'];
                            let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                            goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                            this.setState({
                                goodsBreakArr
                            },() => this.calculCostPrice());
                        }} />
            } },
            { title: '金额', dataIndex: 'amount', key: 'amount', width: 150},
            { title: '操作', dataIndex: 'action', key: 'action', render: (text, record, index) => {
                return (
                    <a href="javascript:void(0);" onClick={() => {
                        serverArr.splice(index,1);
                        let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                        goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                        this.setState({
                            goodsBreakArr
                        },() => this.calculCostPrice());
                    }}><Icon type="delete" /></a>
                );
            } }
        ];
        const techColumns = [
            { title: '成本', dataIndex: 'amount', key: 'amount', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} precision={0} step={50} value={record.amount} onChange={(v) => {
                    techArr[index].amount = v;
                    let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                    goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                    this.setState({
                        goodsBreakArr
                    },() => this.calculCostPrice());
                }} />
            } },
            { title: '操作', dataIndex: 'action', key: 'action', render: (text, record, index) => {
                return (
                    <a href="javascript:void(0);" onClick={() => {
                        techArr.splice(index,1);
                        let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                        goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                        this.setState({
                            goodsBreakArr
                        },() => this.calculCostPrice());
                    }}><Icon type="delete" /></a>
                );
            } }
        ];
        const upgradeColumns = [
            { title: '成本', dataIndex: 'amount', key: 'amount', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} precision={0} step={50} value={record.amount} onChange={(v) => {
                    upgradeArr[index].amount = v;
                    let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                    goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                    this.setState({
                        goodsBreakArr
                    },() => this.calculCostPrice());
                }} />
            } },
            { title: '工时', dataIndex: 'work_hours', key: 'work_hours', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} step={0.5} value={record.work_hours} onChange={(v) => {
                    upgradeArr[index].work_hours = v;
                    upgradeArr[index].total_work_hours = v;
                    let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                    goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                    this.setState({
                        goodsBreakArr
                    },() => this.calculCostPrice());
                }} />
            } },
            { title: '操作', dataIndex: 'action', key: 'action', render: (text, record, index) => {
                return (
                    <a href="javascript:void(0);" onClick={() => {
                        upgradeArr.splice(index,1);
                        let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                        goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                        this.setState({
                            goodsBreakArr
                        },() => this.calculCostPrice());
                    }}><Icon type="delete" /></a>
                );
            } }
        ];
        const advisoryColumns = [
            { title: '成本', dataIndex: 'amount', key: 'amount', width: 150, render: (text, record, index) => {
                return <InputNumber min={0} precision={0} step={50} value={record.amount} onChange={(v) => {
                    advisoryArr[index].amount = v;
                    let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                    goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                    this.setState({
                        goodsBreakArr
                    },() => this.calculCostPrice());
                }} />
            } },
            { title: '操作', dataIndex: 'action', key: 'action', render: (text, record, index) => {
                return (
                    <a href="javascript:void(0);" onClick={() => {
                        advisoryArr.splice(index,1);
                        let breakGoodsArr = [...goodsArr,...serverArr,...techArr,...upgradeArr,...advisoryArr];
                        goodsBreakArr[i].pricingListGoodsAmounts = breakGoodsArr;
                        this.setState({
                            goodsBreakArr
                        },() => this.calculCostPrice());
                    }}><Icon type="delete" /></a>
                );
            } }
        ];
        const tableArr = [];
        if(goodsArr.length!=0){
            tableArr.push(<Table
                bordered
                columns={goodsColumns}
                pagination={false}
                dataSource={goodsArr} />);
        }
        if(serverArr.length!=0){
            tableArr.push(<Table
                bordered
                columns={serverColumns}
                pagination={false}
                dataSource={serverArr} />);
        }
        if(techArr.length!=0){
            tableArr.push(<Table
                bordered
                columns={techColumns}
                pagination={false}
                dataSource={techArr} />);
        }
        if(upgradeArr.length!=0){
            tableArr.push(<Table
                bordered
                columns={upgradeColumns}
                pagination={false}
                dataSource={upgradeArr} />);
        }
        if(advisoryArr.length!=0){
            tableArr.push(<Table
                bordered
                columns={advisoryColumns}
                pagination={false}
                dataSource={advisoryArr} />);
        }
        return <div>{tableArr}</div>;
    }

    //子表格
    expandedRowRender(data){
        const { id, goods_type } = data;
        const { goodsBreakArr } = this.state;
        // const addItem = (id) => {
        //     this.addId = id;
        //     this.getOrderTypeGoods(goods_type);
        // }
        const targetGoodsArr = Linq.from(goodsBreakArr).where(x => {
            return x._id == id;
        }).toArray()[0].pricingListGoodsAmounts;
        let thatGoodsAmount = 0, thatWorkHours = 0;
        targetGoodsArr.forEach((items,index)=> {
            thatGoodsAmount += parseInt(items.amount);
            thatWorkHours += Number(items.total_work_hours);
        });
        if (Number.isNaN(thatWorkHours)) {
            thatWorkHours = 0;
        }
        return <div>
                    {/* <Button onClick={() => addItem(id)} size={'small'}>添加</Button> */}
                    { this.goodsTypeRender(id, goods_type) }
                    <p style={{fontWeight: 'bolder'}}>{data.goods_name}的成本为
                        <span style={{marginLeft: 6}}>{thatGoodsAmount}</span>元，工时为
                        <span style={{marginLeft: 6}}>{thatWorkHours}</span>
                    </p>
                </div>
    }

    showConfirm = () => {
        const { addType, addName, addNum } = this.state;
        const self = this;
        confirm({
            icon: <span></span>,
            content: <div>
                        <div>
                            分类：
                            <Select defaultValue={addType} style={{ width: 200 }} onChange={v => this.setState({ addType: v })}>
                                {
                                    ['产品', '附加配件','现场服务','研发服务','生产服务','咨询服务'].map(items => <Option value={items}>{items}</Option>)
                                }
                            </Select>
                        </div>
                        <div style={{display: 'flex', marginTop: 10}}>
                            <span style={{width: 50}}>货品：</span>
                            <Input defaultValue={addName} onChange={e => this.setState({ addName: e.target.value })} />
                        </div>
                        <div style={{display: 'flex', marginTop: 10}}>
                            <span style={{width: 43}}>数量：</span>
                            <InputNumber defaultValue={addNum} min={1} max={100} onChange={v => this.setState({ addNum: v })} />
                        </div>
                    </div>,
            onOk() {
                const { addType, addName, addNum } = self.state;
                if (!addName) {
                    message.error('货品名不能为空');
                    return;
                }
                self.addGoods(addType, addName, addNum);
            },
        });
    }

    addGoods = (addType, addName, addNum) => {
        const pricingId = this.id;
        const { goodsBreakArr, state } = this.state;
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/pricing/addGoods'))
            .set("token",token)
            .send({
                goods_type: addType,
                goods_name: addName,
                goods_num: addNum,
                pricingId,
            })
            .end((err,res) => {
                message.success(res.body.msg);
                if (res.body.code === 200) {
                    const r = res.body.data;
                    r.PricingListGoodsAmounts = [];
                    state.PricingListGoods.push(r);
                    goodsBreakArr.push({
                        _id: r.id,
                        pricingListGoodsAmounts: [],
                    });
                    this.setState({
                        state,
                        goodsBreakArr,
                    });
                    this.getOrderIdItem(result => {
                        //sessionState替换
                        let stateData = Base.GetStateSession();
                        let { data } = stateData;
                        data.forEach((items,index) => {
                            if(items.id==result.id){
                                data[index] = result;
                                Base.SetStateSession(stateData);
                            }
                        });
                    });
                }
            });
    }

    delGoods = (e, id) => {
        e.stopPropagation();
        const result = window.confirm('确定删除？');
        if (!result) {
            return;
        }
        let { goodsBreakArr, state } = this.state;
        const token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/pricing/delGoods/' + id))
            .set("token",token)
            .end((err,res) => {
                message.success(res.body.msg);
                goodsBreakArr = goodsBreakArr.filter(items => items._id != id);
                state.PricingListGoods = state.PricingListGoods.filter(items => items.id != id);
                this.setState({
                    state,
                    goodsBreakArr,
                }, () => {
                    this.calculCostPrice();
                });
                this.getOrderIdItem(result => {
                    //sessionState替换
                    let stateData = Base.GetStateSession();
                    let { data } = stateData;
                    data.forEach((items,index) => {
                        if(items.id==result.id){
                            data[index] = result;
                            Base.SetStateSession(stateData);
                        }
                    });
                });
            });
    }

    goodsTable(){
        const { state } = this.state;
        const columns = [
            { title: '分类', dataIndex: 'goods_type', key: 'goods_type', width: 150 },
            { title: '货品', dataIndex: 'goods_name', key: 'goods_name', width: 200 },
            { title: '数量', dataIndex: 'goods_num', key: 'goods_num', width: 100 },
            { title: '操作', dataIndex: 'action', key: 'action', width: 100, render: (text, record, index) => {
                return <a onClick={e => this.delGoods(e, record.id) } href="javascript:void(0)"><Icon type="delete" /></a>
            } },
        ];
        const pricingListGoods = state.PricingListGoods;
        pricingListGoods.forEach(items => items.key == items.id);
        return (
            <div style={{marginTop: 30}}>
                <Button onClick={this.showConfirm}>新增</Button>
                <Table 
                    style={{marginTop: 6}}
                    columns={columns} 
                    dataSource={pricingListGoods} 
                    pagination={false}
                    expandRowByClick={true}
                    expandedRowRender={this.expandedRowRender}
                    onExpand={(expanded, record) => {
                        this.addId = record.id;
                        this.getOrderTypeGoods(record.goods_type);
                    }}
                />
            </div>
        )
    }

    updateCount(id) {
        const token = sessionStorage.getItem('token');
        request.patch(common.baseUrl('/productsLibrary/updateCount/' + id))
            .set("token",token)
            .end((err,res) => {});
    }

    selectGoods = (record, name) => {
        name = name ? name : record.product_name;
        let { goodsBreakArr } = this.state;
        for (let i = 0; i < goodsBreakArr.length; i++) {
            const element = goodsBreakArr[i];
            if(element._id == this.addId){
                element.pricingListGoodsAmounts.push({
                    name,
                    num: 1,
                    rem: record.product_rem,
                    price: record.product_price,
                    amount: record.product_price,
                    pricing_list_good_id: this.addId,
                    work_hours: record.work_hours,
                    total_work_hours: record.work_hours,
                });
                this.calculCostPrice();
            }
        }
        this.setState({
            goodsBreakArr
        });
        // 更新频度
        this.updateCount(record.id);
    }
    
    //@Override
    render() {
        let { orderGoodsList, filterGroup } = this.state;
		if(!this.uploadRenderStart) return <div></div>;
		let record = this.state.labelProperty;
		const { getFieldDecorator } = this.props.form;
		const formItemLayout = {
			labelCol: {
				xs: { span: 6 },
			},
			wrapperCol: {
				xs: { span: 12 },
			},
	    };
	    const formBtnLayout = {
			wrapperCol: {
		        xs: {
		            span: 24,
		            offset: 0,
		        },
		        sm: {
		            span: 16,
		            offset: 8,
		        },
		    },
	    };
	    const formItem = [];
		const default_rules = [];
	    for(let i in record){
	    	let default_temp;
	    	try{
	    		if(record[i].input_attr['disabled']=='disabled'){
		    		default_temp = <Input disabled={true} />;
		    	}else{
		    		default_temp = <Input />;
		    	}
	    	}catch(e){
	    		default_temp = <Input />;
	    	}
	    	let rules = record[i].rules?record[i].rules:default_rules;
			let temp = record[i].temp?record[i].temp:default_temp;
            formItem.push(<FormItem
                key={i}
                {...formItemLayout}
                label={record[i].label}
            >
                {getFieldDecorator(i, {
                    initialValue: record[i].initialValue,
                    rules
                })(
                    temp
                )}
            </FormItem>);
        }
        const h = $('.ant-layout-content').height();
        let optionArr = ['全部'],optionMap = {};
        orderGoodsList.forEach((items, index) => {
            if(!optionMap[items.product_group]){
                optionMap[items.product_group] = 1;
                optionArr.push(items.product_group);
            }
        });
        let _arr = [];
        orderGoodsList.map((items, index) => {
            if(items.product_group==filterGroup||filterGroup=='全部'){
                _arr.push(items);
            }
        });
        orderGoodsList = _arr;
		return (
			<div style={{display: 'flex'}}>
                <div style={{flex: 5}}>
                    <Form onSubmit={this.handleSubmit} style={{padding: 24}}>
                        <div className = "dadContainer">
                            {
                                formItem.map((items,index) =>
                                    <div key={index} className = "son">{items}</div>
                                )
                            }
                        </div>
                        {this.goodsTable()}
                        {this.actionBtns()}
                    </Form>
                    <ModalTemp 
                        handleModalCancel={this.handleModalCancel}
                        handleModalDefine={this.handleModalDefine}
                        ModalText={this.state.modalText} 
                        visible={this.state.visible} />
                </div>
                <div style={{flex: 4, height: h, overflow: 'auto', borderLeft: '1px solid #999'}}>
                    <div style={{padding: 8}}>
                        <span>分组：</span>
                        <Select 
                            style={{width: 150}}
                            value={filterGroup}
                            onChange={(v) => {
                                this.setState({
                                    filterGroup: v
                                });
                            }}
                        >
                            {
                                optionArr.map(items => <Option value={items}>{items}</Option>)
                            }
                        </Select>
                    </div>
                    <div style={{width: '100%'}}>
                        <Table 
                            columns={[
                                { title: '成本项', dataIndex: 'product_name', key: 'product_name', width: 150 },
                                { title: '成本', dataIndex: 'product_price', key: 'product_price', width: 100 },
                                { title: '工时', dataIndex: 'work_hours', key: 'work_hours', width: 100 },
                                { title: '规格说明', dataIndex: 'product_rem', key: 'product_rem', width: 200, render: (text, record, index) => {
                                    if (record.is_group) {
                                        let arr = [];
                                        try {
                                            arr = record.product_rem.split(',').filter(items => items);
                                        } catch (e) {
                                            
                                        }
                                        return arr.map(items => (
                                            <span
                                                onClick={() => this.selectGoods(record, items)}
                                                style={{marginRight: 6, cursor: 'pointer', color: '#1890ff'}}>{items}</span>
                                        ));
                                    } else {
                                        return record.product_rem;
                                    }
                                }}
                            ]} 
                            dataSource={orderGoodsList} 
                            onRow={(record) => {
                                return {
                                    onDoubleClick: () => {
                                        this.selectGoods(record);
                                    }
                                }
                            }}
                            pagination={false}
                        />
                    </div>
                </div>
			</div>
		)
	}
}

const PricingEdit = Form.create()(PricingEditTemp);

export default PricingEdit;