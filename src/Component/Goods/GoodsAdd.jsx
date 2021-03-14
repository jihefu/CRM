import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message, InputNumber } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import { GoodsEditTemp } from './GoodsEdit.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class GoodsAddTemp extends GoodsEditTemp {
	constructor(props){
		super(props);
		this.state.labelProperty = {
			numbering: {label: '编号', rules: [{ required: true, message: '不能为空'}]},
			goodsName: {label: '名称', rules: [{ required: true, message: '不能为空'}]},
			goodsType: {label: '分类', rules: [{ required: true, message: '不能为空'}]},
			model: {label: '规格型号', rules: [{ required: true, message: '不能为空'}]},
			serialNo: {label: '序列号'},
			purchaseTime: {label: '购置时间', rules: [{ required: true, message: '不能为空'}]},
			originalValue: {label: '原值', rules: [{ required: true, message: '不能为空'}]},
			presentValue: {label: '现值', rules: [{ required: true, message: '不能为空'}]},
			management: {label: '保管部门', rules: [{ required: true, message: '不能为空'}]},
			isBorrow: {label: '允许借用'},
			location: {label: '存放地点'}
		}
	}

	//@override
	checkSafe(){
		let token = sessionStorage.getItem('token');
		if(!token){
			hashHistory.push('/');
			return 1;
		}
	}
	
	//@overload
	transToView(labelProperty,key){
		delete labelProperty['pwd'];
		labelProperty[key]['initialValue'] = null;
		if(key=='goodsType'){
			labelProperty[key]['initialValue'] = '办公设备';
		}else if(key=='management'){
			labelProperty[key]['initialValue'] = '管理部';
		}else if(key=='isBorrow'){
			labelProperty[key]['initialValue'] = '是';
		}else if(key=='location'){
			labelProperty[key]['initialValue'] = '杭州办';
		}else if(key=='originalValue'||key=='presentValue'){
			labelProperty[key]['initialValue'] = 0;
		}
	}

	//@override
	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

	//@override
	//初始化
	componentDidMount(){
		const { labelProperty } = this.state;
		let fileList = [];
		if(this.checkSafe()==1) return;
		for(let key in labelProperty){
			this.transToView(labelProperty,key);
			if(key=='goodsType'){
				labelProperty[key].temp = <Select>
					{
						this.goodsTypeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='purchaseTime'){
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
			}
		}
		this.setState({
			labelProperty: labelProperty,
			fileList
		},() => {
			this.uploadRenderStart = true;
		});
	}

	//@override
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.borrowStatus = '无借用';
				let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/goods/add'))
		            .set("token",token)
		            .send({
		                form_data: JSON.stringify(values)
		            })
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
							message.success(res.body.msg);
							Base.RemoveStateSession();
		            		this.handleBackClick();
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            })
	        }
	    });
	}
}

const GoodsAdd = Form.create()(GoodsAddTemp);

export default GoodsAdd;