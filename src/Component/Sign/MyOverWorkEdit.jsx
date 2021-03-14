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

export class MyOverWorkEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.file_name_prefix = '';
		this.target_key_prefix = '/overwork/';
		this.uploadUrl = '/attendance/upload';
	    this.directorArr = [];
		this.state.labelProperty = {
            // name: {label: '姓名',input_attr:{disabled:'disabled'}},
            on_time: {label: '加班开始时间',input_attr:{disabled:'disabled'}},
            off_time: {label: '加班结束时间',input_attr:{disabled:'disabled'}},
            director: {label: '指派人',rules: [{
                required: true, message: '不能为空',
            }]},
            reason: {label: '指派原因', placeholder: '为什么加班', rules: [{
                required: true, message: '不能为空',
            }]},
            content: {label: '加班内容及成果', placeholder: '加班达到了什么成果', rules: [{
                required: true, message: '不能为空',
            }]},
            album: {label: '现场照片',rules: [{
                required: true, message: '不能为空',
            }]}
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
                if(!values.album){
                    message.error('现场照片不能为空');
                    return;
                }
                const user_name = sessionStorage.getItem('user_name');
                if (values.director == user_name) {
                    message.error('指派人不能为自己');
                    return;
                }
                let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/attendance/updateOverWork'))
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
                                        data[index].album = result.album;
                                        data[index].reason = result.reason;
                                        data[index].director = result.director;
                                        data[index].content = result.content;
                                        data[index].check = result.check;
										// data[index] = result;
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
		const user_id = sessionStorage.getItem('user_id');
		let fileList = [];
		const { labelProperty } = this.state;
        if(this.checkSafe()==1) return;

        this.id = data['id'];
        this.directorArr = data.directorArr;
        for(let key in labelProperty){
            this.transToView(labelProperty,key,data);
            if(key=='album'){
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
                            url: common.staticBaseUrl('/img/overwork/'+items)
                        });
                    }
                });
            }else if(key=='director'){
                labelProperty[key].initialValue = labelProperty[key].initialValue?labelProperty[key].initialValue:'马颜春';
                labelProperty[key].temp = <Select>
                    {
                        this.directorArr.map(items => 
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

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
		if(key=='on_time'||key=='off_time'){
			if(moment(labelProperty[key]['initialValue'])['_isValid']){
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		}
	}

	transToModel(values){
		
    }
    
    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }
}

const MyOverWorkEdit = Form.create()(MyOverWorkEditTemp);

export default MyOverWorkEdit;