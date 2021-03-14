import React, { Component } from 'react';
import { Form,Upload, Input, message, Select, Button, AutoComplete,DatePicker } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import crypto from 'crypto';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import '../../public/css/Common.css'
import ModalTemp from '../common/Modal';
import BaseEditList from '../common/BaseEditList.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

export class OutputTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.target_key_prefix = '/output/';
		this.deleteUrl = '/output/update';
	    this.expressTypeArr = ['天天','德邦','顺丰','其它'];
	    this.allShipmentsArr = ['是','否'];
		this.state.labelProperty = {
            cus_cn_abb: {label: '收件单位',input_attr: {disabled: 'disabled'}},
			contract_no: {label: '维修单号',input_attr: {disabled: 'disabled'}},
            contacts: {label: '相关联系人'},
            contacts_tel: {label: '联系人电话'},
            express_no: {label: '快递单号'},
            express_type: {label: '快递类型'},
            delivery_time: {label: '发件时间',input_attr: {disabled: 'disabled'}},
			goods: {label: '物品'},
			received_time: {label: '收件时间'},
			received_person: {label: '收件人'},
            rem: {label: '备注'},
            // all_shipments: {label: '发货完全'},
            insert_person: {label: '录入人',input_attr: {disabled: 'disabled'}},
            insert_time: {label: '录入时间',input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人',input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间',input_attr: {disabled: 'disabled'}}
		}
    };
    
    //@override
	//模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .send({
                form_data: JSON.stringify({isdel: 1,id: this.id})
            })
            .end((err,res) => {
                if(err) return;
				message.success('删除成功');
				Base.RemoveStateSession();
				this.handleBackClick();
            });
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
	        	request.put(common.baseUrl(this.deleteUrl))
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

	//@override
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
			if(key=='express_type'){
				labelProperty[key].temp = <Select>
					{
						this.expressTypeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='all_shipments'){
				labelProperty[key].temp = <Select>
					{
						this.allShipmentsArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='received_time'){
                labelProperty[key].temp = <DatePicker />;
            }else if(key=='contacts'){
				labelProperty[key].temp = <RemoteSelectRandom onChange={(v,obj) => {
					let phone = obj.phone?obj.phone:'';
					this.props.form.setFieldsValue({
						contacts_tel: phone
					});
				}} remoteUrl={common.baseUrl('/contacts/searchInfoByKeywords?keywords=')} defaultValue={labelProperty[key].initialValue} />;
			}
		}
		this.setState({
			labelProperty: labelProperty,
			fileList
		},() => {
			this.uploadRenderStart = true;
		});
	}

	transToView(labelProperty,key,data){
        labelProperty[key]['initialValue'] = data[key];
        if(key=='received_time'){
            labelProperty[key]['initialValue'] = data[key]?moment(data[key]):null;
        }else if(key=='all_shipments'){
            labelProperty[key]['initialValue'] = data[key]?'是':'否';
        }
	}

	transToModel(values){
		// values.all_shipments = values.all_shipments=='是'?1:0;
	}
}

const OutputEdit = Form.create()(OutputTemp);

export default OutputEdit;