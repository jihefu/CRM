import React, { Component } from 'react';
import { Form,Radio, Input, message, Select, Button, AutoComplete,DatePicker, InputNumber } from 'antd';
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

export class ProductsCostEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.target_key_prefix = '/targetProductsLibrary/';
		this.deleteUrl = '/productsLibrary/del';
		this.state.labelProperty = {
			product_type: {label: '分类',input_attr: {disabled: 'disabled'}},
			product_group: {label: '分组',input_attr: {disabled: 'disabled'}},
            product_name: {label: '成本项',input_attr: {disabled: 'disabled'}},
			product_price: {label: '成本价'},
			product_rem: {label: '规格说明'},
			work_hours: {label: '工时'},
		}
		this.state.is_group = 0;
		this.state.remGroup = [];
		this.state.remText = '';
    };
    
    //@override
	//模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .send({
                id: this.id
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
		const { is_group, remGroup, remText } = this.state;
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.id = this.id;
				values.is_group = is_group;
				if (is_group) {
					values.product_rem = remGroup.join();
				} else {
					values.product_rem = remText;
				}
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/productsLibrary/update'))
		            .set("token",token)
		            .send(values)
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

	isGroupChange = e => {
		this.setState({
			is_group: e.target.value,
		}, () => {
			this.renderRem();
		});
	}

	//@override
	//初始化
	componentDidMount(){
		let data = this.props.location.state;
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		this.id = data['id'];
		this.state.is_group = data.is_group;
		try {
			this.state.remGroup = data.product_rem.split(',').filter(items => items);
		} catch (e) {
			this.state.remGroup = [];
		}
		this.state.remText = data.product_rem;
		for(let key in labelProperty){
            this.transToView(labelProperty,key,data);
            if(key=='product_price'){
				labelProperty[key].temp = <InputNumber step={50} min={0} defaultValue={labelProperty[key].initialValue} />
			} else if (key=='work_hours'){
				labelProperty[key].temp = <InputNumber precision={2} step={0.5} min={0} defaultValue={labelProperty[key].initialValue} />
			}
		}
		this.setState({
			labelProperty: labelProperty
		},() => {
			this.uploadRenderStart = true;
		});
	}

	remGroupChange = v => {
		this.setState({
			remGroup: v,
		});
	}

	remTextChange = e => {
		this.setState({
			remText: e.target.value,
		});
	}

	renderRem = () => {
		const { is_group, labelProperty, remGroup } = this.state;
		const key = 'product_rem';
		labelProperty[key].temp = <div>
			<Radio.Group onChange={this.isGroupChange} value={is_group}>
				<Radio value={0}>普通文字</Radio>
				<Radio value={1}>兼容产品项</Radio>
			</Radio.Group>
			{
				is_group === 0 && <Input onChange={this.remTextChange} defaultValue={labelProperty[key].initialValue} />
			}
			{
				is_group === 1 && <Select
					mode="tags"
					style={{ width: '100%' }}
					placeholder="Please select"
					onChange={this.remGroupChange}
					defaultValue={remGroup}
				>
			</Select>
			}
		</div>;
		this.setState({
			labelProperty,
		});
	}

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
		this.renderRem();
	}

	transToModel(values){
		
	}
}

const ProductsCostEdit = Form.create()(ProductsCostEditTemp);

export default ProductsCostEdit;