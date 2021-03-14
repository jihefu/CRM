import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import { ContactsEditTemp } from './ContactEdit.jsx';
import Base from '../../public/js/base.js';
import ModalTemp from '../common/Modal';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class StaffAddTemp extends ContactsEditTemp {
	constructor(props){
		super(props);
		this.state.labelProperty = {
            name: {label: '姓名'},
			sex: {label: '性别'},
			phone1: {label: '手机号码'},
			company: {label: '公司'},
			// witness: {label: '证明人'},
			// witnessRelation: {label: '关系'},
			// verified: {label: '认证状态'},
			// verifiedPerson: {label: '认证人',input_attr: {disabled: 'disabled'}}
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
		labelProperty[key]['initialValue'] = null;
		if(key=='verified'){
			labelProperty[key]['initialValue'] = "待认证";
		}else if(key=='sex'){
			labelProperty[key]['initialValue'] = "男";
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
			if(key=='sex'){
				labelProperty[key].temp = <Select>
					{
						this.sexArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='relation'){
				labelProperty[key].temp = <Select>
					{
						this.relationArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='verified'){
				labelProperty[key].temp = <Select onChange={this.verifiedChange}>
					{
						this.verifiedArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='album'){
				let _arr = [];
				try{
					_arr = labelProperty[key].initialValue.split(',');
				}catch(e){

				}
				_arr.forEach((items,index) => {
					if(items){
						fileList.push({
							uid: index,
							name: items,
							status: 'done',
							key: items,
							url: common.staticBaseUrl('/img/'+items)
						});
					}
				});
			}else if(key=='company'){
				labelProperty[key].temp = <RemoteSelectRandom remoteUrl={common.baseUrl('/output/searchCpy?keywords=')} defaultValue={labelProperty[key].initialValue} />
			}else if(key=='witnessRelation'){
				labelProperty[key].temp = <Select>
					{
						this.witnessRelationArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='witness'){
				labelProperty[key].temp = <AutoComplete dataSource={this.state.dataSource}></AutoComplete>
			}
		}
		this.setState({
			labelProperty: labelProperty,
			fileList
		},() => {
			this.uploadRenderStart = true;
			// this.initReadOnly(labelProperty['verified'].initialValue);
		});
	}

	//@override
	handleSubmit = (e) => {
		const that = this;
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				if(values.verified!=1) values.company = $('.ant-select-search__field').eq(0).val();
				if(values.verified==1){
					if(!values.name||!values.sex||!values.phone1||!values.company||!values.witness||!values.witnessRelation){
						message.warn('认证相关信息不能为空');
						return;
					}
					if(values.name==values.witness){
						message.warn('证明人与当前联系人重名！');
						return;
					}
				}
				let token = sessionStorage.getItem('token');
				request.post(common.baseUrl('/contacts/checkAdd'))
					.set("token",token)
					.send({
						name: values.name,
						phone: values.phone1,
						company: values.company,
					})
					.end((err,res) => {
						if (res.body.code == 200) {
							sub(values);
						} else if (res.body.code == -1) {
							message.error(res.body.msg);
						} else {
							const r = window.confirm(res.body.msg);
							if (r) {
								sub(values, 1);
							} else {
								sub(values);
							}
						}
					});
				
	        }
		});
		
		function sub(values, isCover) {
			let token = sessionStorage.getItem('token');
			Base.RemoveStateSession();
			request.post(common.baseUrl('/contacts/add'))
				.set("token",token)
				.send({
					form_data: JSON.stringify(values),
					isCover,
				})
				.end((err,res) => {
					if(err) return;
					if(res.body.code==200){
						message.success(res.body.msg);
						that.handleBackClick();
					}else{
						message.error(res.body.msg);
					}
				})
		}
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

const StaffAdd = Form.create()(StaffAddTemp);

export default StaffAdd;