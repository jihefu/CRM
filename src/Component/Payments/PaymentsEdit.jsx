import React, { Component } from 'react';
import { Form, Upload, Input, message, Select, Button, AutoComplete, DatePicker, Icon, List, InputNumber,Table,Divider,Popconfirm } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import '../../public/css/Common.css'
import ModalTemp from '../common/Modal';
import BaseEditList from '../common/BaseEditList.jsx';
import Base from '../../public/js/base.js';
import RemList from '../common/RemList.jsx';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

export class PaymentsEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.payUseFun = this.payUseFun.bind(this);
		this.stateInit = this.stateInit.bind(this);
		this.removePay = this.removePay.bind(this);
		this.typeChange = this.typeChange.bind(this);
		this.searchInputselected = this.searchInputselected.bind(this);
		this.cbData = this.cbData.bind(this);
		this.target_key_prefix = '/payment/';
		this.deleteUrl = '/payment/';
		this.methodArr = ['电汇', '银承', '现金', '代付'];
		this.type = '合同';
		this.contract_no;
		this.state.labelProperty = {
			company: { label: '客户', input_attr: { disabled: 'disabled' } },
			method: { label: '付款方式', input_attr: { disabled: 'disabled' } },
			arrival: { label: '到账时间', input_attr: { disabled: 'disabled' } },
			amount: { label: '到账金额', input_attr: { disabled: 'disabled' } },
			insert_person: { label: '录入人', input_attr: { disabled: 'disabled' } },
			insert_time: { label: '录入时间', input_attr: { disabled: 'disabled' } },
			update_person: { label: '更新人', input_attr: { disabled: 'disabled' } },
			update_time: { label: '更新时间', input_attr: { disabled: 'disabled' } }
		};
		this.state.data;
		this.state.title = '新增用途';
	};

	//@override
	handleBackClick() {
		hashHistory.push({
			pathname: '/payments'
		});
	}

	//@override
	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
					<Button type="primary" htmlType={'button'} onClick={this.handleDelete}>新增用途</Button>
					{/* <Button id={"submit"} type="primary" htmlType="submit">提交</Button> */}
					<Popconfirm placement="topRight" title={'确定删除？'} onConfirm={this.removePay} okText="是" cancelText="否">
						<Button style = {{"marginLeft":50}} htmlType={'button'} type="danger" >删除</Button>
					</Popconfirm>
                    <Button style={{"marginLeft":50}} htmlType={'button'} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

	//@override
	//模态确定
	//新增用途
	handleModalDefine(v) {
		const form_data = {
			pay_id: this.id,
			type: this.type,
			contract_no: this.contract_no,
			amount: v.amount,
			rem: v.rem
		};
		if(!this.contract_no) return;
		const token = sessionStorage.getItem('token');
		request.post(common.baseUrl('/payUse/add'))
			.set("token", token)
			.send(form_data)
			.end((err, res) => {
				if (err) return;
				if(res.body.code==-1){
					message.error(res.body.msg);
				}else{
					message.success(res.body.msg);
					try{
						let stateData = Base.GetStateSession();
						let { data } = stateData;
						data.forEach((items,index) => {
							if(items.id==res.body.data.id){
								data[index] = res.body.data;
								Base.SetStateSession(stateData);
							}
						});
					}catch(e){
						//从新增那边跳过来的
					}
					this.setState({
						data: res.body.data
					});
				}
			});
	}	

	//@override
	//提交
	handleSubmit = (e) => {
		e.preventDefault();
		this.props.form.validateFieldsAndScroll((err, values) => {
			if (!err) {
				this.transToModel(values);
				let token = sessionStorage.getItem('token');
				request.put(common.baseUrl('/payment/update'))
					.set("token", token)
					.send({
						form_data: JSON.stringify(values)
					})
					.end((err, res) => {
						if (err) return;
						if (res.body.code == 200) {
							this.getOrderIdItem(result => {
								//sessionState替换
								// let stateData = Base.GetStateSession();
								// let { data } = stateData;
								// data.forEach((items,index) => {
								// 	if(items.user_id==result.user_id){
								// 		data[index] = result;
								// 		Base.SetStateSession(stateData);
								// 	}
								// });
								message.success('更新成功');
								this.handleBackClick();
							});
						} else {
							message.error(res.body.msg);
						}
					});
			}
		});
	}

	//@override
	//初始化
	componentDidMount() {
		let data = this.props.location.state;
		this.stateInit(data);
	}

	removePay(){
		let token = sessionStorage.getItem('token');
		request.delete(common.baseUrl(this.deleteUrl + this.id))
			.set("token", token)
			.end((err, res) => {
				if (err) return;
				message.success('删除成功');
				Base.RemoveStateSession();
				this.handleBackClick();
			});
	}

	typeChange(v){
		this.type = v;
	}

	searchInputselected(v){
		this.contract_no = v;
	}

	cbData(obj){
		const v = Number(obj.payable)-Number(obj.paid);
		$('input[name=amount]').val(v);
	}

	stateInit(data){
		const { labelProperty } = this.state;
		if (this.checkSafe() == 1) return;
		this.id = data['id'];
		for (let key in labelProperty) {
			this.transToView(labelProperty, key, data);
		}
		this.setState({
			labelProperty: labelProperty,
			data: data,
			modalText: <div>
							<label style={{display:'flex'}}>
								<span style={{width:60}}>用途：</span>
								<Select name={"type"} defaultValue={this.type} style={{width: '100%'}} onChange={this.typeChange}>
									<Select.Option key={'合同'} value={'合同'}>{'合同'}</Select.Option>
									<Select.Option key={'押金'} value={'押金'}>{'押金'}</Select.Option>
									<Select.Option key={'租金'} value={'租金'}>{'租金'}</Select.Option>
									<Select.Option key={'预付款'} value={'预付款'}>{'预付款'}</Select.Option>
								</Select>
							</label>
							<label style={{display:'flex',marginTop: 15}}>
								<span style={{width:60}}>编号：</span>
								<RemoteSearchInput style={{width: '100%'}} searchInputselected={this.searchInputselected} cbData={this.cbData} remoteUrl={common.baseUrl('/payment/searchContractNo?company='+data.company+'&keywords=')} />
							</label>
							<label style={{display:'flex',marginTop: 15}}>
								<span style={{width:60}}>金额：</span>
								<InputNumber name={"amount"} style={{width: '100%'}} defaultValue={0} />
							</label>
							<label style={{display:'flex',marginTop: 15}}>
								<span style={{width:60}}>备注：</span>
								<Input name={"rem"} style={{width: '100%'}} />
							</label>
						</div>
		});
	}

	transToView(labelProperty, key, data) {
		labelProperty[key]['initialValue'] = data[key];
		if (key == 'update_time' || key == 'insert_time') {
			if (moment(labelProperty[key]['initialValue'])['_isValid']) {
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		}
	}

	transToModel(values) {

	}

	/*******************************************************************************************/

	deletePayUse(row){
		const id = row.key;
		const token = sessionStorage.getItem('token');
		request.delete(common.baseUrl('/payUse/' + id))
			.set("token", token)
			.send({pay_id: this.id})
			.end((err, res) => {
				if (err) return;
				message.success('删除成功');
				let stateData = Base.GetStateSession();
				let { data } = stateData;
				data.forEach((items,index) => {
					if(items.id==res.body.data.id){
						data[index] = res.body.data;
						Base.SetStateSession(stateData);
					}
				});
				this.setState({
					data: res.body.data
				});
			});
	}

	payUseFun() {
		const payUseArr = this.state.data.pay_use;
		if(!payUseArr) return;
		const columns = [{
			title: '用途',
			dataIndex: 'type',
		}, {
			title: '合同编号',
			dataIndex: 'contract_no',
		}, {
			title: '金额',
			dataIndex: 'amount',
		}, {
			title: '备注',
			dataIndex: 'rem',
		}, {
			title: '操作',
			key: 'operation',
			fixed: 'right',
			width: 100,
			render: (text, row, index) =>  <Popconfirm placement="topRight" title={'确定删除？'} onConfirm={() => this.deletePayUse(row)} okText="是" cancelText="否">
								<a href="javascript:;">删除</a>
							</Popconfirm>
		}];
		const data = payUseArr.map((items,index) => {
			return {
				key: items.id,
				type: items.type,
				contract_no: items.contract_no,
				amount: items.amount,
				rem: items.rem
			}
		});
		return <Table style={{marginTop: 20,marginBottom: 40}} columns={columns} dataSource={data} size="small" pagination={false} />
	}

	//@overload
	render() {
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
		for (let i in record) {
			let default_temp;
			try {
				if (record[i].input_attr['disabled'] == 'disabled') {
					default_temp = <Input disabled={true} />;
				} else {
					default_temp = <Input />;
				}
			} catch (e) {
				default_temp = <Input />;
			}
			let rules = record[i].rules ? record[i].rules : default_rules;
			let temp = record[i].temp ? record[i].temp : default_temp;
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
		return (
			<div>
				<Form onSubmit={this.handleSubmit} style={{ padding: 24 }}>
					<div className="dadContainer">
						{
							formItem.map((items, index) =>
								<div key={index} className="son">{items}</div>
							)
						}
					</div>
					<Divider>分配用途</Divider>
					{this.payUseFun()}
					{this.actionBtns()}
				</Form>
				<ModalTemp
					handleModalCancel={this.handleModalCancel}
					handleModalDefine={this.handleModalDefine}
					title={this.state.title}
					ModalText={this.state.modalText}
					visible={this.state.visible} />
			</div>
		)
	}
}

const PaymentsEdit = Form.create()(PaymentsEditTemp);

export default PaymentsEdit;