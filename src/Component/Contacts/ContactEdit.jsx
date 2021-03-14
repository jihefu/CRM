import React, { Component } from 'react';
import { Form,Upload, Input, message, Select, Button, AutoComplete,DatePicker,Icon, Checkbox } from 'antd';
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
import RemList from '../common/RemList.jsx';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

export class ContactsEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.verifiedChange = this.verifiedChange.bind(this);
		this.initReadOnly = this.initReadOnly.bind(this);
		this.searchChange = this.searchChange.bind(this);
		this.getRegColleague = this.getRegColleague.bind(this);
		this.fetchAllStaff = this.fetchAllStaff.bind(this);
		this.file_name_prefix = 'contacts/';
		this.target_key_prefix = '/contact/';
		this.uploadUrl = '/contacts/upload';
		this.deleteUrl = '/contacts/delContact';
		this.sexArr = ['','男','女','未知'];
		this.witnessRelationArr = ['员工','同事','同学','亲属','朋友'];
		this.relationArr = ['客户','同行','经销商','供应商','主管单位','主管部门','合作','公共关系','其他'];
		this.verifiedArr = ['待认证','未通过','申请认证'];
		this.state.labelProperty = {
			name: {label: '姓名'},
			sex: {label: '性别'},
			phone1: {label: '手机号码'},
			// phone2: {label: '手机号码2'},
			company: {label: '公司'},
			// typeCode: {label: '联系人类型'},
			witness: {label: '证明人'},
			witnessRelation: {label: '关系'},
			verified: {label: '认证状态'},
			verifiedPerson: {label: '认证人',input_attr: {disabled: 'disabled'}},
			album: {label: '照片'},
			// tel: {label: '电话'},
			// qq: {label: 'qq'},
			// wx_id: {label: '微信号'},
            // email: {label: '邮箱'},
			// identify: {label: '身份证'},
			// relation: {label: '公司关系'},
            // job: {label: '职位'},
            // addr: {label: '地址'},
            // rem: {label: '附注'},
            insert_person: {label: '录入人',input_attr: {disabled: 'disabled'}},
            insert_time: {label: '录入时间',input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人',input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间',input_attr: {disabled: 'disabled'}}
		}
		this.state.typeKey = '';
		this.state.dataSource = [];
		this.state.staffSource = [];
		this.type;
	};

	//@Override
	//初始化
	componentDidMount(){
		let data = this.props.location.state;
		this.data = data;
		const user_id = sessionStorage.getItem('user_id');
		let fileList = [];
		this.id = data['id'];
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		let _arr = [];
		try{
			_arr = data['album'].split(',');
		}catch(e){}
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
		for(let key in labelProperty){
			this.transToView(labelProperty,key,this.data);
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
			} else if (key=='typeCode') {
				labelProperty[key].initialValue = common.getCodeArr(labelProperty[key].initialValue);
				const options = [
					{ label: '员工', value: 0 },
					{ label: '客户', value: 1 },
					{ label: '用户', value: 2 },
					{ label: '供应商', value: 4 },
					{ label: '公共关系', value: 8 }
				];
				labelProperty[key].temp = <Checkbox.Group options={options} onChange={() => {this.initReadOnly(this.state.labelProperty['verified'].initialValue)}} />
			}
		}
		this.setState({
			labelProperty,
			fileList,
			typeKey: data['id']
		},() => {
			this.uploadRenderStart = true;
			this.type = data['witnessRelation'];
			this.getRegColleague(data['company']);
			this.fetchAllStaff();
			this.initReadOnly(data['verified']);
		});
	}

	searchChange(v){
		this.props.form.setFieldsValue({
			company: v
		});
		let { labelProperty } = this.state;
		labelProperty['company'].initialValue = v;
		this.setState({
			labelProperty
		},() => {
			this.getRegColleague(v);
		});
	}

	//初始化是否只读
	initReadOnly(v){
		let selectData;
		if(this.type=='员工'){
			selectData = this.state.staffSource;
		}else{
			selectData = this.state.dataSource;
		}
		const { labelProperty } = this.state;
		if(v==1||v=='已认证'){
			labelProperty.name.input_attr = {disabled: 'disabled'};
			labelProperty.phone1.input_attr = {disabled: 'disabled'};
			labelProperty.witness.input_attr = {disabled: 'disabled'};
			labelProperty.company.input_attr = {disabled: 'disabled'};
			labelProperty.sex.input_attr = {disabled: 'disabled'};
			labelProperty.witnessRelation.input_attr = {disabled: 'disabled'};
			delete labelProperty.sex.temp;
			delete labelProperty.company.temp;
			delete labelProperty.witnessRelation.temp;
			delete labelProperty.witness.temp;
		}else{
			labelProperty.name.input_attr = {};
			labelProperty.sex.input_attr = {};
			labelProperty.phone1.input_attr = {};
			labelProperty.witness.input_attr = {};
			labelProperty.company.input_attr = {};
			labelProperty['sex'].temp = <Select>
				{
					this.sexArr.map(items => 
						<Select.Option key={items} value={items}>{items}</Select.Option>
					)
				}
			</Select>;
			labelProperty.witness.temp = <Select>
					{
						selectData.map(items => 
							<Option key={items} value={items}>{items}</Option>
						)
					}
				</Select>
			labelProperty.witnessRelation.temp = <Select onChange={(v) => {
				this.type = v;
				this.initReadOnly(this.state.labelProperty['verified'].initialValue);
			}}>
					{
						this.witnessRelationArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			let typeCode = 0;
			try {
				const typeCodeArr = this.props.form.getFieldValue('typeCode');
				typeCodeArr.forEach((items, index) => {
					typeCode += items;
				});
			} catch (e) {
				
			}
			labelProperty['company'].temp = <RemoteSelectRandom onChange={(v) => this.searchChange(v)} remoteUrl={common.baseUrl('/common/searchCpy?typeCode='+typeCode+'&keywords=')} defaultValue={labelProperty['company'].initialValue} />
		}
		this.setState({
			labelProperty
		});
	}

	//认证状态改变
	verifiedChange(v){
		const { labelProperty } = this.state;
		labelProperty['verified'].initialValue = v;
		this.setState({
			labelProperty
		},() => {
			this.initReadOnly(v);
			const user_name = sessionStorage.getItem('user_name');
			this.props.form.setFieldsValue({
				verifiedPerson: user_name
			});
		});
	}

	//获取相关公司同事信息
	getRegColleague(company){
		let token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/member/getRegColleague'))
			.set("token",token)
			.query({
				company: company
			})
			.end((err,res) => {
				if(err) return;
				this.setState({
					dataSource: res.body.data
				},() => {
					this.initReadOnly(this.state.labelProperty['verified'].initialValue);
				});
			});
	}

	//获取所有员工信息
    fetchAllStaff(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
				if(err) return;
				const staffSource = [];
                res.body.data.forEach(items => {
                    staffSource.push(items.user_name);
				});
				this.setState({
					staffSource: staffSource
				},() => {
					this.initReadOnly(this.state.labelProperty['verified'].initialValue);
				});
            });
	}

	//@override
	//提交
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.id = this.state.typeKey;
				if(values.verified==3){
					if(!values.name||!values.sex||!values.phone1||!values.company||!values.witness||!values.witnessRelation){
						message.warn('认证相关信息不能为空');
						return;
					}
					if(values.name==values.witness){
						message.warn('证明人与当前联系人重名！');
						return;
					}
				}
				if(values.witness==values.verifiedPerson){
					message.warn('认证人和证明人不能为同一个人');
					return;
				}
				// if (values.typeCode.length === 0) return message.error('请至少选择一种联系人类型');
				// let codeNum = 0;
				// values.typeCode.forEach(items => codeNum += items);
				// values.typeCode = codeNum;
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/contacts/update'))
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

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
		if(key=='update_time'||key=='insert_time'){
			if(moment(labelProperty[key]['initialValue'])['_isValid']){
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		}else if(key=='verified'){
			if(labelProperty[key]['initialValue']==0){
				labelProperty[key]['initialValue'] = '待认证';
			}else if(labelProperty[key]['initialValue']==1){
				labelProperty[key]['initialValue'] = '已认证';
			}else if(labelProperty[key]['initialValue']==3){
				labelProperty[key]['initialValue'] = '申请认证';
			}else if(labelProperty[key]['initialValue']==2){
				labelProperty[key]['initialValue'] = '未通过';
			}
		}
	}

	transToModel(values){
		if(values.verified=='已认证'){
			values.verified = 1;
		}else if(values.verified=='未通过'){
			values.verified = 2;
		}else if(values.verified=='申请认证'){
			values.verified = 3;
		}else if(values.verified=='待认证'){
			values.verified = 0;
		}
	}

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
				let stateData = Base.GetStateSession();
                let { data } = stateData;
                data.forEach((items,index) => {
                    if(items.id == this.id){
                        data.splice(index, 1);
                        Base.SetStateSession(stateData);
                    }
                });
				this.handleBackClick();
            });
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
					<RemList type={'Contacts'} typeKey={this.state.typeKey}></RemList>
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

const ContactsEdit = Form.create()(ContactsEditTemp);

export default ContactsEdit;