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
import { StaffEditTemp } from './StaffEdit.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class StaffAddTemp extends StaffEditTemp {
	constructor(props){
		super(props);
		this.state.labelProperty = {
            user_name: {label: '姓名', rules: [{
				required: true, message: '不能为空',
			}]},
			user_id: {label: '工号', rules: [{
				required: true, message: '不能为空',
		  	}]},
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
		if(key=='on_job'){
			labelProperty[key]['initialValue'] = "是";
		}else if(key=='sex'){
			labelProperty[key]['initialValue'] = '男';
		}else if(key=='group'){
			labelProperty[key]['initialValue'] = '杭州组';
		}else if(key=='branch'){
			labelProperty[key]['initialValue'] = '客户关系部';
		}else if(key=='level'){
			labelProperty[key]['initialValue'] = '4';
		}else if(key=='edu'){
			labelProperty[key]['initialValue'] = '本科';
		}else if(key=='marriage'){
			labelProperty[key]['initialValue'] = '未婚';
		}else if(key=='employ_way'){
			labelProperty[key]['initialValue'] = '专职';
		}else if(key=='duty'){
			labelProperty[key]['initialValue'] = [];
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
			if(key=='in_job_time'||key=='birth'||key=='leave_job_time'||key=='laborContractFirstSigningTime'){
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
				Base.RemoveStateSession();
	        	let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/staff/add'))
		            .set("token",token)
		            .send({
		                form_data: JSON.stringify(values)
		            })
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
		            		message.success(res.body.msg);
		            		this.handleBackClick();
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            })
	        }
	    });
	}

	transToModel(values){
		
	}
}

const StaffAdd = Form.create()(StaffAddTemp);

export default StaffAdd;