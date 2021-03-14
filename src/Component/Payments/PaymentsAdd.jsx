import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message,InputNumber } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import { PaymentsEditTemp } from './PaymentsEdit.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class PaymentsAddTemp extends PaymentsEditTemp {
	constructor(props){
        super(props);
        this.state.labelProperty = {
            company: {label: '付款客户'},
			method: {label: '付款方式'},
			arrival: {label: '到账时间'},
            amount: {label: '到账金额'}
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
            if(key=='arrival'){
				labelProperty[key]['initialValue'] = moment();
				labelProperty[key].temp = <DatePicker />
			}else if(key=='method'){
                labelProperty[key]['initialValue'] = '电汇';
				labelProperty[key].temp = <Select>
					{
						this.methodArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='amount'){
                labelProperty[key].initialValue = 0;
				labelProperty[key].temp = <InputNumber value={labelProperty[key].initialValue} precision={2} />
			}else if(key=='company'){
                labelProperty[key].initialValue = '';
                labelProperty[key].temp = <RemoteSelect remoteUrl={common.baseUrl('/output/searchCpy?keywords=')} defaultValue={labelProperty[key].initialValue} />
            }
		}
		this.setState({
			labelProperty: labelProperty
		});
	}

	//@override
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                values.company = $('.ant-select-search__field').eq(0).val();
                if(!values.company||values.amount==0){
                    message.error('内容不能为空');
                    return;
                }
				// this.transToModel(values);
				Base.RemoveStateSession();
	        	let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/payment/add'))
		            .set("token",token)
		            .send(values)
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
                            message.success(res.body.msg);
                            hashHistory.push({
                                pathname: '/paymentsEdit',
                                state: res.body.data
                            });
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            })
	        }
	    });
	}
}

const PaymentsAdd = Form.create()(PaymentsAddTemp);

export default PaymentsAdd;