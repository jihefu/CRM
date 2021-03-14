import React, { Component } from 'react';
import { Form,Upload, Input, message, Select, Button, AutoComplete,DatePicker,Radio,Popconfirm } from 'antd';
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
const { TextArea } = Input;
const RadioGroup = Radio.Group;

export class ContactsOrderEditTemp extends BaseEditList {
	constructor(props) {
        super(props);
		this.target_key_prefix = '/contactOrder/';
        this.tagHash = [];
        this.uploadRenderStart = true;
		this.state.labelProperty = {
            contact_name: {label: '联系人',input_attr: {disabled: 'disabled'}},
            tags: {label: '标签'},
            demand: {label: '客户需求',rules: [{
                required: true, message: '不能为空',
            }]},
            content: {label: '我的答复'}
		}
    };

	//@override
	//提交
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
                values.id = this.id;
                values.state = '已提交';
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/order/update'))
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
                                        let { content,tags,demand,state } = result;
                                        data[index].state = state;
                                        data[index].content = content;
                                        data[index].tags = tags;
                                        data[index].demand = demand;
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
        this.data = data;
		const user_id = sessionStorage.getItem('user_id');
		let fileList = [];
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
        this.id = data['id'];
        this.getTags(() => {
            for(let key in labelProperty){
                this.transToView(labelProperty,key,data);
                // if(key=='complete'){
                //     labelProperty[key].temp = <Select>
                //         {
                //             this.completeArr.map(items => 
                //                 <Select.Option key={items} value={items}>{items}</Select.Option>
                //             )
                //         }
                //     </Select>
                // }
            }
            this.setState({
                labelProperty: labelProperty,
                fileList
            });
        });
    }
    
    getTags = (cb) => {
		let token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/order/getTagHash'))
			.set("token",token)
			.end((err,res) => {
				if(err) return;
				this.tagHash = res.body.data;
				cb();
			});
	}

	transToView(labelProperty,key,data){
        labelProperty[key]['initialValue'] = data[key];
        if(key=='tags'){
            let children = [];
            let count = 0;
            let defaultValue;
            for(let key in this.tagHash){
                if(count==0) {
                    defaultValue = key;
                    count++;
                }
                children.push(<Option key={key}>{key}</Option>);
            }
            labelProperty[key]['initialValue'] = defaultValue;
            labelProperty[key].temp = <Select
                                style={{ width: '100%' }}
                            >
                                {children}
                            </Select>
        }else if(key=='demand'||key=='content'){
            labelProperty[key].temp = <TextArea rows={3}></TextArea>;
        }
    }

    componentDidUpdate(){
        try{
            const v = this.props.form.getFieldValue('tags');
            const { description } = this.tagHash[v];
            $('#demand').attr('placeholder',description);
        }catch(e){

        }
    }

	transToModel(values){
        
    }
    
    //@override
	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center',marginTop: 30}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Popconfirm placement="topRight" title={'确定关闭'} onConfirm={() => {
                        const id = this.id;
                        let token = sessionStorage.getItem('token');
                        request.put(common.baseUrl('/order/closeOrder'))
                            .set("token",token)
                            .send({
                                id
                            })
                            .end((err,res) => {
                                if(err) return;
                                this.getOrderIdItem(result => {
                                    //sessionState替换
                                    let stateData = Base.GetStateSession();
                                    let { data } = stateData;
                                    data.forEach((items,index) => {
                                        if(items.id==result.id){
                                            let { state } = result;
                                            data[index].state = state;
                                            Base.SetStateSession(stateData);
                                        }
                                    });
                                    message.success('更新成功');
                                    this.handleBackClick();
                                });
                            });
                    }} okText="Yes" cancelText="No">
                        <Button style={{"marginLeft":50}} type="danger">关闭</Button>
                    </Popconfirm>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }
}

const ContactsOrderEdit = Form.create()(ContactsOrderEditTemp);

export default ContactsOrderEdit;