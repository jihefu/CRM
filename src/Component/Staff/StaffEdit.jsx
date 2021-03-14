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

export class StaffEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.onPwdBlur = this.onPwdBlur.bind(this);
		this.file_name_prefix = 'employees/';
		this.target_key_prefix = '/staff/';
		this.uploadUrl = '/staff/upload';
		this.deleteUrl = '/staff/update';
	    this.onJobArr = ['在职','离职'];
	    this.sexArr = ['男','女'];
	    this.groupArr = ['杭州组','济南组'];
	    this.branchArr = ['研发部','客户关系部','生产部','管理部'];
	    this.levelArr = [0,1,2,3,4,5,6,7,8,9,10];
	    this.eduArr = ['博士','硕士','本科','专科','高中','其他'];
	    this.marrigeArr = ['未婚','已婚'];
		this.positionTypeArr = ['专职','挂职','其他'];
		this.dutyArr = ['客服主管'];
		this.state.labelProperty = {
            user_name: {label: '姓名', input_attr: { disabled: 'disabled' } },
			user_id: {label: '工号', input_attr: { disabled: 'disabled' } },
			album: {label: '头像'},
            leader: {label: '上级'},
            seat: {label: '座位'},
            on_job: {label: '在职状态'},
			in_job_time: {label: '入职时间'},
			laborContractFirstSigningTime: {label: '劳动合同首签时间'},
			sex: {label: '性别'},
            group: {label: '工作组别'},
            branch: {label: '部门'},
            position: {label: '职位'},
            duty: {label: '负责区域'},
            level: {label: '行政等级'},
            nation: {label: '民族'},
            birth: {label: '生日'},
            work_phone: {label: '工作电话'},
            native: {label: '籍贯'},
            native_adr: {label: '户籍地址'},
            identify: {label: '身份证'},
            school: {label: '毕业院校'},
            edu: {label: '学历'},
            pro: {label: '专业'},
            marriage: {label: '婚姻状况'},
            wife_child: {label: '配偶'},
            employ_way: {label: '职位类型'},
            qq: {label: 'qq'},
            phone: {label: '手机号码'},
            em_contacter: {label: '紧急联系人'},
            em_phone: {label: '紧急联系人电话'},
            addr: {label: '家庭地址'},
            work_addr: {label: '工作地址'},
            leave_job_time: {label: '离职时间'},
			leave_reason: {label: '离职原因'},
			pwd: {label: '修改登陆密码'},
            insert_person: {label: '录入人',input_attr: {disabled: 'disabled'}},
            insert_time: {label: '录入时间',input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人',input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间',input_attr: {disabled: 'disabled'}}
		}
		this.originalPwd;
		this.dirty = false;
	};

	//@override
	//提交
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.id = this.id;
				if(this.dirty){
					let md5 = crypto.createHash('md5');
					let passWord = md5.update(values.pwd).digest('hex');
					values.pwd = passWord;
				}
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/staff/update'))
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
								if(this.dirty){
									sessionStorage.removeItem('token');
									message.warn('请重新登陆');
									hashHistory.push('/login');
								}else{
									message.success('更新成功');
									this.handleBackClick();
								}
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
			if(key=='in_job_time'||key=='birth'||key=='leave_job_time'||key=='laborContractFirstSigningTime'){
				labelProperty[key]['initialValue'] = moment(data[key]);
				try{
					if(!labelProperty[key].initialValue['_isValid']) labelProperty[key].initialValue = null;
				}catch(e){

				}
				labelProperty[key].temp = <DatePicker />
			}else if(key=='on_job'){
				labelProperty[key].temp = <Select>
					{
						this.onJobArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='sex'){
				labelProperty[key].temp = <Select>
					{
						this.sexArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='group'){
				labelProperty[key].temp = <Select>
					{
						this.groupArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='branch'){
				labelProperty[key].temp = <Select>
					{
						this.branchArr.map(items => 
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
			}else if(key=='edu'){
				labelProperty[key].temp = <Select>
					{
						this.eduArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='marriage'){
				labelProperty[key].temp = <Select>
					{
						this.marrigeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='employ_way'){
				labelProperty[key].temp = <Select>
					{
						this.positionTypeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='duty'){
				labelProperty[key].temp = <Select mode="tags">
					{
						this.dutyArr.map(items => 
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
			}else if(key=='pwd'){
				this.originalPwd = labelProperty['pwd']['initialValue'];
				labelProperty[key].temp = <Input type={'password'} onFocus={this.onPwdFocus} onBlur={this.onPwdBlur} />
				if(labelProperty['user_id']['initialValue']!=user_id) delete labelProperty['pwd'];
			}
		}
		this.setState({
			labelProperty: labelProperty,
			fileList
		},() => {
			this.uploadRenderStart = true;
		});
	}

	onPwdFocus(e){
		e.target.value = '';
	}

	onPwdBlur(e){
		if(e.target.value==''){
			e.target.value = this.originalPwd;
		}else{
			this.dirty = true;
			this.originalPwd = e.target.value;
		}
	}

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
		if(key=='update_time'||key=='insert_time'){
			if(moment(labelProperty[key]['initialValue'])['_isValid']){
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		}else if(key=='on_job'){
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue']=='1'?'在职':'离职';
		}else if(key=='duty'){
			let dutyArr;
			try{
				dutyArr = labelProperty[key]['initialValue'].split(',');
			}catch(e){
				dutyArr = [];
			}
			dutyArr = dutyArr.filter(items => items);
			labelProperty[key]['initialValue'] = dutyArr;
		}
	}

	transToModel(values){
		values.on_job = values.on_job=='在职'?1:0;
		values.duty = values.duty.join();
	}
}

const StaffEdit = Form.create()(StaffEditTemp);

export default StaffEdit;