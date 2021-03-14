import React, { Component } from 'react';
import { Form,Upload, Input, message, Select, Button, AutoComplete,DatePicker,Icon,List,Rate,Popover,Radio,Divider } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
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
const RadioGroup = Radio.Group;

export class CustomerEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.certifiedChange = this.certifiedChange.bind(this);
		this.getRatingHistoryList = this.getRatingHistoryList.bind(this);
		this.renderStarHistory = this.renderStarHistory.bind(this);
		this.renderStarAgain = this.renderStarAgain.bind(this);
		this.file_name_prefix = 'customers/';
		this.target_key_prefix = '/customer/';
		this.uploadUrl = '/customers/upload';
		this.deleteUrl = '/customers/update';
	    this.typeArr = ['生产厂家','经销商','终端客户'];
	    this.levelArr = ['A','B','C','D','F'];
		this.starArr = [0,1,2,3,4,5,6,7,8,9,10];
		this.certifiedArr = ['待认证','未通过','已认证'];
	    this.provinceArr = ['山东','吉林','上海','广东','浙江','广西','北京','甘肃','湖南','陕西','重庆','河南','宁夏','湖北',
					'辽宁','河北','江苏','海南','新疆','四川','云南','安徽','江西','福建','天津','山西','内蒙古',
					'青海','贵州','西藏','黑龙江','香港','澳门','台湾','国外','其他'];
		this.state.labelProperty = {
			/********************************** 认证信息 ***********************************/
            company: {label: '客户',input_attr: {disabled: 'disabled'}},
			user_id: {label: '客户号',input_attr: {disabled: 'disabled'}},
			// tax_id: {label: '机构代码',input_attr: {disabled: 'disabled'}},
            // legal_person: {label: '法定代表人',input_attr: {disabled: 'disabled'}},
            cn_abb: {label: '中文缩写'},
            abb: {label: '英文缩写'},
			// certified: {label: '认证状态'},
			// certifiedReason: {label: '未通过原因'},
			// certifiedPerson: {label: '认证人',input_attr: {disabled: 'disabled'}},
			// album: {label: '照片'},
			/********************************** 基本信息 ***********************************/
			// province: {label: '省份',input_attr: {disabled: 'disabled'}},
            // town: {label: '城镇',input_attr: {disabled: 'disabled'}},
            // reg_company: {label: '开票公司'},
            // reg_addr: {label: '开票地址'},
            // reg_tel: {label: '开票电话'},
            // bank_name: {label: '开户行'},
			// bank_account: {label: '银行账户'},
			website: {label: '网站'},
			email: {label: '邮箱'},
			// zip_code: {label: '邮政编码',input_attr: {disabled: 'disabled'}},
			products: {label: '主营产品'},
			bussiness_addr: {label: '营业地址'},
			/********************************** 动态信息 ***********************************/
            partner: {label: '合伙人'},
			reg_person: {label: '指定注册人'},
			finance: {label: '财务'},
			purchase: {label: '采购'},
            type: {label: '类型'},
            level: {label: '等级'},
            manager: {label: '业务员'},
            // tech_support: {label: '技术支持'},
            datefrom: {label: '开始合作时间'},
            star: {label: '星级'},
            credit_line: {label: '信用额',input_attr: {disabled: 'disabled'}},
            credit_period: {label: '信用期',input_attr: {disabled: 'disabled'}},
            credit_qualified: {label: '信用评价',input_attr: {disabled: 'disabled'}},
            last_sale: {label: '上年销售额',input_attr: {disabled: 'disabled'}},
			total_sale: {label: '累计销售额',input_attr: {disabled: 'disabled'}},
			total_dyna_sale: {label: '累计销售代龙',input_attr: {disabled: 'disabled'}},
			intention_products: {label: '意向产品'},
            adopt_products: {label: '采用产品'},
            use_per: {label: '采用率'},
            // rem: {label: '附注'},
            insert_person: {label: '录入人',input_attr: {disabled: 'disabled'}},
            insert_time: {label: '录入时间',input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人',input_attr: {disabled: 'disabled'}},
			update_time: {label: '更新时间',input_attr: {disabled: 'disabled'}},
			hasRegPower: {label: '注册权限'},
			// operKey: {label: '操作码'},
			funCodeAuth: {label: '功能码权限'},
			info_score: {label: '信息完整度',input_attr: {disabled: 'disabled'}}
		}
		this.state.typeKey = '';
		this.state.starHistoryArr = [];
		this.state.starRatingYear = new Date().getFullYear() - 1;
		this.state.star = 0;
	};

	//@override
	//模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .send({
                form_data: JSON.stringify({isdel: 1,user_id: this.id})
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
	        	let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/customers/update'))
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
									if(items.user_id==result.user_id){
										let contactsArr = items.contactsArr;
										data[index] = result;
										data[index].contactsArr = contactsArr;
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
		try {
			data.reg_person = data.reg_person.split(',').filter(items => items);
		} catch (e) {
			data.reg_person = [];
		}
		try {
			data.finance = data.finance.split(',').filter(items => items);
		} catch (e) {
			data.finance = [];
		}
		try {
			data.purchase = data.purchase.split(',').filter(items => items);
		} catch (e) {
			data.purchase = [];
		}
		try {
			data.partner = data.partner.split(',').filter(items => items);
		} catch (e) {
			data.partner = [];
		}
		let fileList = [];
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		this.id = data['user_id'];
		for(let key in labelProperty){
			this.transToView(labelProperty,key,data)
			if(key=='company'||key=='abb'||key=='cn_abb'){
				labelProperty[key].rules = [{
	          		required: true, message: '不能为空',
	        	}]
			}
			if(key=='datefrom'){
				labelProperty[key]['initialValue'] = moment(data[key]);
				try{
					if(!labelProperty[key].initialValue['_isValid']) labelProperty[key].initialValue = null;
				}catch(e){

				}
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
				labelProperty[key].temp = <div>
					<Rate allowHalf disabled value={labelProperty[key].initialValue/2} />
					<Popover placement="bottomRight" title={'评级历史'} content={this.renderStarHistory()} trigger="click">
						<span style={{cursor: 'pointer'}}>详细</span>
					</Popover>
				</div>
				// labelProperty[key].temp = <Select>
				// 	{
				// 		this.starArr.map(items => 
				// 			<Select.Option key={items} value={items}>{items}</Select.Option>
				// 		)
				// 	}
                // </Select>
			}else if(key=='province'){
				// labelProperty[key].temp = <Select>
				// 	{
				// 		this.provinceArr.map(items => 
				// 			<Select.Option key={items} value={items}>{items}</Select.Option>
				// 		)
				// 	}
                // </Select>
			}else if(key=='certified'){
				labelProperty[key].temp = <Select onChange={this.certifiedChange}>
					{
						this.certifiedArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			} else if (key === 'funCodeAuth') {
				labelProperty[key].temp = <Select onChange={this.funCodeAuthChange}>
					<Select.Option key={0} value={0}>{'不开放'}</Select.Option>
					<Select.Option key={1} value={1}>{'开放'}</Select.Option>
                </Select>
			} else if (key === 'hasRegPower') {
				labelProperty[key].temp = <Select onChange={this.regPowerChange}>
					<Select.Option key={0} value={0}>{'不开放'}</Select.Option>
					<Select.Option key={1} value={1}>{'开放'}</Select.Option>
                </Select>
			} else if(key=='album'){
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
			labelProperty: labelProperty,
			fileList,
			typeKey: data['user_id']
		},() => {
			this.uploadRenderStart = true;
			// this.initReadOnly(labelProperty['certified'].initialValue);
			this.getRatingHistoryList();
		});
	}

	getRatingHistoryList() {
		const company = this.state.labelProperty['company'].initialValue;
		let token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/customers/getRatingHistoryList'))
			.set("token",token)
			.query({
				company
			})
			.end((err,res) => {
				if(err) return;
				if(res.body.code==200){
					this.setState({
						starHistoryArr: res.body.data
					},() => {
						this.renderStarAgain();
					});
				}
			});
	}

	renderStarAgain(){
		const { labelProperty } = this.state;
		labelProperty['star'].temp = <div>
			<Rate allowHalf disabled value={labelProperty['star'].initialValue/2} />
			<Popover placement="bottomRight" title={'评级历史'} content={this.renderStarHistory()} trigger="click">
				<span style={{cursor: 'pointer'}}>详细</span>
			</Popover>
		</div>;
		this.setState({
			labelProperty
		});
	}
	renderStarHistory() {
		const { starHistoryArr, starRatingYear, labelProperty } = this.state;
		const nowYear = new Date().getFullYear();
		const optionArr = [nowYear,nowYear-1];
		const tempArr = starHistoryArr.map(items => <div>
			<span style={{marginRight: 16}}>{items.ratingYear}年</span>
			<Rate allowHalf disabled value={items.star/2} />
		</div>);
		tempArr.unshift(<div onClick={() => {
			$('.add_temp,.subBtn').show();
			$('.addBtn').hide();
		}} className={'st_add'} style={{cursor: 'pointer'}}>
			<div className={'addBtn'}><Icon type="folder-add" /><span style={{marginLeft: 6}}>新增</span></div>
			<div className={'subBtn'} style={{display:'none'}}><Button size={'small'} type="primary" onClick={() => {
				const { starRatingYear, star } = this.state;
				let token = sessionStorage.getItem('token');
				request.post(common.baseUrl('/customers/addRatingHistory'))
					.set("token",token)
					.send({
						star: star*2,
						ratingYear: starRatingYear,
						company: labelProperty['company'].initialValue
					})
					.end((err,res) => {
						if(err) return;
						if(res.body.code==200){
							message.success(res.body.msg);
							//sessionState替换
							let stateData = Base.GetStateSession();
							let { data } = stateData;
							data.forEach((items,index) => {
								if(items.user_id==labelProperty['user_id'].initialValue){
									data[index].star = res.body.data;
									Base.SetStateSession(stateData);
								}
							});
							labelProperty['star'].initialValue = res.body.data;
							starHistoryArr.unshift({
								star: res.body.data,
								ratingYear: starRatingYear
							});
							this.setState({
								labelProperty,
								starHistoryArr
							},() => {
								this.renderStarAgain();
								$('.add_temp,.subBtn').hide();
								$('.addBtn').show();
							});
						}else{
							message.error(res.body.msg);
						}
					});
			}}>提交</Button></div>
			<div className={'add_temp'} style={{display:'none',marginTop: 5}}>
				<RadioGroup defaultValue={starRatingYear} onChange={(v) => {
					this.setState({
						starRatingYear: v.target.value
					});
				}}>
					{
						optionArr.map(items => <Radio value={items}>{items}</Radio>)
					}
				</RadioGroup>
				<Rate style={{marginLeft: 6}} allowHalf defaultValue={0} onChange={(v) => {
					this.setState({
						star: v
					});
				}} />
			</div>
		</div>);
		return tempArr;
	}

	//初始化是否只读
	initReadOnly(v){
		const { labelProperty } = this.state;
		if(v=='已认证'){
			labelProperty.company.input_attr = {disabled: 'disabled'};
			labelProperty.tax_id.input_attr = {disabled: 'disabled'};
			labelProperty.legal_person.input_attr = {disabled: 'disabled'};
			labelProperty.cn_abb.input_attr = {disabled: 'disabled'};
			labelProperty.abb.input_attr = {disabled: 'disabled'};
		}else{
			labelProperty.company.input_attr = {};
			labelProperty.tax_id.input_attr = {};
			labelProperty.legal_person.input_attr = {};
			labelProperty.cn_abb.input_attr = {};
			labelProperty.abb.input_attr = {};
		}
		this.setState({
			labelProperty
		},() => {
			if(v=='已认证'){
				$('#certifiedReason').parent().parent().parent().parent().hide();
			}else{
				$('#certifiedReason').parent().parent().parent().parent().show();
			}
		});
	}

	certifiedChange(v){
		this.initReadOnly(v);
		const user_name = sessionStorage.getItem('user_name');
		this.props.form.setFieldsValue({
			certifiedPerson: user_name
		});
	}

	funCodeAuthChange = v => {
		this.props.form.setFieldsValue({
			funCodeAuth: v,
		});
	}

	regPowerChange = v => {
		this.props.form.setFieldsValue({
			hasRegPower: v,
		});
	}

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
		if(key=='credit_qualified'){
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue']?'合格':'不合格';
		}else if(key=='certified'){
			if(labelProperty[key]['initialValue']==0){
				labelProperty[key]['initialValue'] = '待认证';
			}else if(labelProperty[key]['initialValue']==1){
				labelProperty[key]['initialValue'] = '已认证';
			}else{
				labelProperty[key]['initialValue'] = '未通过';
			}
			// labelProperty[key]['initialValue'] = labelProperty[key]['initialValue']?'是':'否';
		}else if(key=='update_time'){
			if(moment(labelProperty[key]['initialValue'])['_isValid']){
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		}
	}

	transToModel(values){
		values.credit_qualified = values.credit_qualified=='合格'?1:0;
		if(values.certified=='已认证'){
			values.certified = 1;
		}else if(values.certified=='未通过'){
			values.certified = 2;
		}else{
			values.certified = 0;
		}
		values.reg_person = values.reg_person.join();
		values.finance = values.finance.join();
		values.purchase = values.purchase.join();
		values.partner = values.partner.join();
		// if(values.certified=='待认证'){
		// 	values.certified = 0;
		// }else if(values.certified=='已认证'){
		// 	values.certified = 1;
		// }else{
		// 	values.certified = 2;
		// }
		// values.certified = values.certified=='是'?1:0;
	}

	renderRegItem = (formItem, startKey, endKey) => {
		const resArr = [];
		let needPush;
		formItem.map((items,index) => {
			if (items.key == startKey) needPush = true;
			if (needPush) resArr.push(items);
			if (items.key == endKey) needPush = false;
		});
		return <div className = "dadContainer">
					{
						formItem.map((items,index) => {
							return <div key={index} className = "son">{items}</div>
						})
					}
				</div>
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
					key={i}
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
			}else if(i=='star'){
				formItem.push(<FormItem
    				key={i}
		        	{...formItemLayout}
		          	label={record[i].label}
		        >
		          	{temp}
		        </FormItem>);
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
					{ this.renderRegItem(formItem, 'company', 'album') }
					{/* <Divider /> */}
					{/* { this.renderRegItem(formItem, 'province', 'bussiness_addr') } */}
					{/* <Divider /> */}
					{/* { this.renderRegItem(formItem, 'partner', 'info_score') } */}
					<RemList type={'Customers'} typeKey={this.state.typeKey}></RemList>
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

const CustomerEdit = Form.create()(CustomerEditTemp);

export default CustomerEdit;