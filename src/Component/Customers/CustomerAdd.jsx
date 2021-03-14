import React, { Component } from 'react';
import { Form,Upload, Input, message, Select, Button, AutoComplete,DatePicker,Icon } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import '../../public/css/Common.css'
import ModalTemp from '../common/Modal';
import Base from '../../public/js/base.js';
import { CustomerEditTemp } from './CustomerEdit.jsx';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class CustomerAddTemp extends CustomerEditTemp {
	constructor(props){
		super(props);
		// this.deleteArr = ['user_id','tax_id','album','reg_company','reg_addr','reg_tel','bank_name','bank_account','tech_support',
		// 'website','email','products','star','credit_line','credit_period','credit_qualified','last_sale','total_sale','bussiness_addr',
		// 'intention_products','adopt_products','use_per','zip_code','insert_person','insert_time','update_person','update_time',
		// 'operKey','info_score','certified','certifiedReason','certifiedPerson','datefrom'];
		this.state.labelProperty = {
			/********************************** 认证信息 ***********************************/
            company: {label: '客户'},
            legal_person: {label: '法定代表人'},
            cn_abb: {label: '中文缩写'},
            abb: {label: '英文缩写'},
			// certified: {label: '认证状态'},
			// certifiedReason: {label: '未通过原因'},
			// certifiedPerson: {label: '认证人',input_attr: {disabled: 'disabled'}},
			// album: {label: '照片'},
			/********************************** 基本信息 ***********************************/
			province: {label: '省份'},
            town: {label: '城镇'},
            // reg_company: {label: '开票公司'},
            // reg_addr: {label: '开票地址'},
            // reg_tel: {label: '开票电话'},
            // bank_name: {label: '开户行'},
			// bank_account: {label: '银行账户'},
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
	
	transToModel(values) {

	}

	//@override
	//初始化
	componentDidMount(){
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		// this.deleteArr.forEach((items,index) => {delete labelProperty[items]});
		// delete this.state.labelProperty.company.input_attr;
		// delete this.state.labelProperty.town.input_attr;
		// delete this.state.labelProperty.legal_person.input_attr;
		for(let key in labelProperty){
			this.transToView(labelProperty,key);
			if(key=='company'||key=='abb'||key=='cn_abb'){
				labelProperty[key].rules = [{
	          		required: true, message: '不能为空',
	        	}]
			}
			if(key=='datefrom'){
				labelProperty[key]['initialValue'] = moment();
				labelProperty[key].temp = <DatePicker />
			}else if(key=='type'){
				labelProperty[key].temp = <Select>
					{
						this.typeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='level'){
				labelProperty[key].temp = <Select>
					{
						this.levelArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='star'){
				labelProperty[key].temp = <Select>
					{
						this.starArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='province'){
				labelProperty[key].temp = <Select>
					{
						this.provinceArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='certified'){
				labelProperty[key].temp = <Select onChange={this.certifiedChange}>
					{
						this.certifiedArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='reg_person' || key=='finance' || key=='purchase' || key=='partner'){
				labelProperty[key].temp = labelProperty[key].temp = <Select
				mode="tags"
				style={{ width: '100%' }}
				placeholder=""
			>
			</Select>;
			}
		}
		this.setState({
			labelProperty: labelProperty
		},() => this.uploadRenderStart = true);
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
	//提交
	handleSubmit = (e) => {
		e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				Base.RemoveStateSession();
				values.credit_qualified = 1;
				let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/customers/add'))
		            .set("token",token)
		            .send({
		                form_data: JSON.stringify(values)
		            })
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
							message.success('添加成功');
							this.handleBackClick();
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            });
			}
		});
	}

	//@overload
	transToView(labelProperty,key){
		labelProperty[key]['initialValue'] = null;
		if(key=='credit_qualified'){
			labelProperty[key]['initialValue'] = "合格";
		}else if(key=='certified'){
			labelProperty[key]['initialValue'] = '待认证';
		}else if(key=='type'){
			labelProperty[key]['initialValue'] = '生产厂家';
		}else if(key=='level'){
			labelProperty[key]['initialValue'] = 'D';
		}else if(key=='province'){
			labelProperty[key]['initialValue'] = '山东';
		}
		// labelProperty['reg_person']['initialValue'] = [];
		// labelProperty['finance']['initialValue'] = [];
		// labelProperty['purchase']['initialValue'] = [];
		// labelProperty['partner']['initialValue'] = [];
	}

	//@overload
	render() {
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
			if(i=='album'){
                let props = this.uploadProps();
				formItem.push(<FormItem 
					{...formItemLayout}
					label={record[i].label}
				>
					<Upload {...props}>
						<Button>
							<Icon type="upload" />上传照片
						</Button>
					</Upload>
				</FormItem>)
				formItem.push(
	    			<FormItem>
		    			{getFieldDecorator(i, {
			          		initialValue: record[i].initialValue
			          	})(
			            	<Input name="album" type="hidden" />
			          	)}
		          	</FormItem>)
			}else{
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
		}
		return (
			<div>
				<Form onSubmit={this.handleSubmit} style={{padding: 24}}>
					<div className = "dadContainer">
						{
							formItem.map((items,index) =>
								<div key={index} className = "son">{items}</div>
							)
						}
					</div>
					{this.actionBtns()}
				</Form>
				<ModalTemp 
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    ModalText={this.state.modalText} 
                    visible={this.state.visible} />
			</div>
		)
	}
}

const CustomerAdd = Form.create()(CustomerAddTemp);

export default CustomerAdd;