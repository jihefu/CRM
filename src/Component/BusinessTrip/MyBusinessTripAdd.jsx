import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message } from 'antd';
import request from 'superagent';
import ModalTemp from '../common/Modal';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import { MyBusinessTripEditTemp } from './MyBusinessTripEdit.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;
const { TextArea } = Input;

class MyBusinessTripAddTemp extends MyBusinessTripEditTemp {
	constructor(props){
        super(props);
        this.cbData = this.cbData.bind(this);
        this.state.labelProperty = {
			// addr: {label: '出差地址', rules: [{ required: true, message: '不能为空'}]},
			type: {label: '出差类型'},
            director: {label: '指派人'},
            go_out_time: {label: '出差起始日期', rules: [{ required: true, message: '不能为空'}]},
			back_time: {label: '出差结束日期', rules: [{ required: true, message: '不能为空'}]},
            reason: {label: '出差事由', rules: [{ required: true, message: '不能为空'}]},
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
        if (key === 'type') {
            labelProperty[key]['initialValue'] = '销售';
        } else if (key === 'director') {
            labelProperty[key]['initialValue'] = '马颜春';
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
	async componentDidMount(){
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
        this.fetchAllStaff();
		for(let key in labelProperty){
			this.transToView(labelProperty,key);
			if (key === 'type'){
				labelProperty[key].temp = <Select>
					{
						this.type.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			} else if (key === 'go_out_time' || key === 'back_time') {
                labelProperty[key].temp = <DatePicker onChange={(v, str) => this.dateChange(str, key)} defaultValue={labelProperty[key]['initialValue']} />
            } else if (key === 'reason') {
                labelProperty[key].temp = <TextArea rows={3}>{labelProperty[key]['initialValue']}</TextArea>
			}
			//  else if (key === 'company') {
            //     labelProperty[key].temp = <RemoteSearchInput style={{width: '100%'}} searchInputselected={() => {}} cbData={this.cbData} remoteUrl={common.baseUrl('/output/searchCpy?keywords=')} />;
            // }
		}
		this.setState({
			labelProperty: labelProperty,
		},() => {
			this.uploadRenderStart = true;
		});
    }
    
    cbData(v) {
        this.props.form.setFieldsValue({
            company: v.company,
        });
    }

	//@override
	handleSubmit = (e) => {
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				const user_name = sessionStorage.getItem('user_name');
                if (values.director == user_name) {
					message.error('指派人不能为自己');
					return;
				}
                Base.RemoveStateSession();
	        	let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/businessTrip/add'))
		            .set("token",token)
		            .send(values)
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

	//@Override
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
		    		default_temp = <Input placeholder={record[i].placeholder} />;
		    	}
	    	}catch(e){
	    		default_temp = <Input placeholder={record[i].placeholder} />;
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

const MyBusinessTripAdd = Form.create()(MyBusinessTripAddTemp);

export default MyBusinessTripAdd;