import React, { Component } from 'react';
import { Form,Upload, Input, message, Select, Button, AutoComplete,DatePicker, InputNumber, Popconfirm } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import crypto from 'crypto';
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
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

export class GoodsEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.searchInputselected = this.searchInputselected.bind(this);
		this.cbData = this.cbData.bind(this);
		this.target_key_prefix = '/targetGood/';
		this.deleteUrl = '/goods/del';
		this.goodsTypeArr = ['电脑', '软件', '办公设备', '工具', '样机', '车辆', '贵重外购件', '试产品'];
		this.managementArr = ['管理部','生产部','客户关系部','研发部'];
		this.isBorrowArr = ['是','否'];
		this.locationArr = ['杭州办', '济南办', '广州办', '长春办'];
		this.fromMethodArr = ['购买','借用','生产','沈总拿来'];
		this.state.labelProperty = {
			numbering: {label: '编号',input_attr: {disabled: 'disabled'}},
			goodsName: {label: '名称', rules: [{ required: true, message: '不能为空'}]},
			goodsType: {label: '分类', rules: [{ required: true, message: '不能为空'}]},
			model: {label: '规格型号', rules: [{ required: true, message: '不能为空'}]},
			serialNo: {label: '序列号'},
			purchaseTime: {label: '使用时间', rules: [{ required: true, message: '不能为空'}]},
			fromMethod: {label: '来源'},
			proof: {label: '入库单据'},
			originalValue: {label: '原值', rules: [{ required: true, message: '不能为空'}]},
			presentValue: {label: '现值', rules: [{ required: true, message: '不能为空'}]},
			manager: {label: '责任人',input_attr: {disabled: 'disabled'}},
			// management: {label: '管理部门', rules: [{ required: true, message: '不能为空'}]},
			// manager: {label: '管理人', temp: <RemoteSearchInput searchInputselected={this.searchInputselected} cbData={this.cbData} remoteUrl={common.baseUrl('/goods/searchStaff?keywords=')} />},
			// user: {label: '借用人',input_attr: {disabled: 'disabled'}},
			// isBorrow: {label: '允许借用'},
			delRem: {label: '出库去处',input_attr: {disabled: 'disabled'}},
			// location: {label: '存放地点'},
			insertPerson: {label: '入库人',input_attr: {disabled: 'disabled'}},
			insertTime: {label: '入库时间',input_attr: {disabled: 'disabled'}},
			updatePerson: {label: '更新人',input_attr: {disabled: 'disabled'}},
			updateTime: {label: '更新时间',input_attr: {disabled: 'disabled'}}
		}
	};
	
	searchInputselected(v){
		this.props.form.setFieldsValue({
			manager: v
		});
	}

	cbData(v) {
		
	}

	//@Override
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
					{/* <Popconfirm placement="top" title={<Input ref="delRem" placeholder={"出库去向"} />} onConfirm={() => {
						const delRem = this.refs.delRem.state.value;
						if(!delRem.trim()){
							message.warning('去向不能为空');
							return;
						}
						let token = sessionStorage.getItem('token');
						request.delete(common.baseUrl(this.deleteUrl))
							.set("token",token)
							.send({
								id: this.id,
								delRem
							})
							.end((err,res) => {
								if(err) return;
								message.success('删除成功');
								// Base.RemoveStateSession();
								//sessionState替换
								let stateData = Base.GetStateSession();
								let { data } = stateData;
								const resArr = [];
								data.forEach((items,index) => {
									if(items.id!=this.id){
										resArr.push(items);
									}
								});
								stateData.data = resArr;
								Base.SetStateSession(stateData);
								this.handleBackClick();
							});
                        }} okText="Yes" cancelText="No">
						<Button style = {{"marginLeft":50}} type="danger">出库</Button>
					</Popconfirm> */}
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

	//@override
	//提交
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.id = this.id;
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/goods/update'))
		            .set("token",token)
		            .send({
						form_data: JSON.stringify(values)
					})
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
							this.getOrderIdItem(result => {
								//sessionState替换
								let stateData = Base.GetStateSession();
								let { data } = stateData;
								data.forEach((items,index) => {
									if(items.id==result.id){
										const events = data[index].events;
										data[index] = result;
										data[index].events = events;
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

	//@override
	//初始化
	componentDidMount(){
		let data = this.props.location.state;
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		this.id = data['id'];
		for(let key in labelProperty){
			this.transToView(labelProperty,key,data);
			if(key=='goodsType'){
				labelProperty[key].temp = <Select>
					{
						this.goodsTypeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='purchaseTime'){
				labelProperty[key]['initialValue'] = moment(data[key]);
				try{
					if(!labelProperty[key].initialValue['_isValid']) labelProperty[key].initialValue = null;
				}catch(e){

				}
				labelProperty[key].temp = <DatePicker />;
			}else if(key=='originalValue'||key=='presentValue'){
				labelProperty[key].temp = <InputNumber step={50} min={0} defaultValue={labelProperty[key].initialValue} />
			}else if(key=='management'){
				labelProperty[key].temp = <Select>
					{
						this.managementArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='isBorrow'){
				labelProperty[key].temp = <Select>
					{
						this.isBorrowArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='location'){
				labelProperty[key].temp = <Select>
					{
						this.locationArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='fromMethod'){
				labelProperty[key].temp = <Select>
				{
					this.fromMethodArr.map(items => 
						<Select.Option key={items} value={items}>{items}</Select.Option>
					)
				}
			</Select>
			}
		}
		this.setState({
			labelProperty: labelProperty
		},() => {
			this.uploadRenderStart = true;
		});
	}

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
	}

	transToModel(values){
		values.isBorrow = values.isBorrow=='是'?1:0;
		values.isdel = values.isdel=='是'?1:0;
	}
}

const GoodsEdit = Form.create()(GoodsEditTemp);

export default GoodsEdit;