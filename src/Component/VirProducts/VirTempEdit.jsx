import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Form,Input,Select } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import BaseEditList from '../common/BaseEditList.jsx';
import MachineTypeSelect from './MachineTypeSelect.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;
const { TextArea } = Input;

class VirTempEditCls extends BaseEditList {
    constructor(props){
        super(props);
        this.machineTypeSelect = this.machineTypeSelect.bind(this);
        this.uploadRenderStart = true;
		this.state.labelProperty = {
            name: {label: '名称', input_attr: {disabled: 'disabled'}},
            actuator: {label: '主轴作动器', input_attr: {disabled: 'disabled'}},
            channelNum: {label: '通道数', input_attr: {disabled: 'disabled'}},
            axiosNum: {label: '轴数', input_attr: {disabled: 'disabled'}},
            cardNum: {label: '卡数', input_attr: {disabled: 'disabled'}},
            updateCount: {label: '更新次数', input_attr: {disabled: 'disabled'}},
            machineType: {label: '解决方案', temp: <MachineTypeSelect defaultValue={this.props.location.state.machineType} machineTypeSelect={this.machineTypeSelect}></MachineTypeSelect>},
            // suitableProductList: {label: '适用机型', input_attr: {disabled: 'disabled'}},
            author: {label: '作者', input_attr: {disabled: 'disabled'}},
            remarks: { label: '资源备注', temp: <TextArea disabled={true} rows={6}></TextArea>},
            remark: { label: '标签备注', temp: <TextArea rows={6}></TextArea> },
            createdAt: {label: '创建时间', input_attr: {disabled: 'disabled'}},
            updatedAt: {label: '更新时间', input_attr: {disabled: 'disabled'}},
		}
    }

    componentDidMount() {
        const data = this.props.location.state;
        const { labelProperty } = this.state;
        for(let key in labelProperty) {
			this.transToView(labelProperty, key, data);
		}
		this.setState({
			labelProperty,
		});
    }

    machineTypeSelect(machineType) {
        this.props.form.setFieldsValue({
            machineType,
        });
    }

    transToView(labelProperty, key, data){
        labelProperty[key]['initialValue'] = data[key];
        if (key == 'createdAt' || key == 'updatedAt') {
            labelProperty[key]['initialValue'] = moment(data[key]).format('YYYY-MM-DD HH:mm:ss');
        }
    }

    handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/vir/updateTemp'))
		            .set("token",token)
		            .send(values)
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200) {
                            request.get(common.baseUrl('/vir/targetTemp'))
                                .set("token",token)
                                .query({
                                    name: values.name,
                                })
                                .end((err,res) => {
                                    if(err) return;
                                    //sessionState替换
                                    let stateData = Base.GetStateSession();
                                    let { data } = stateData;
                                    data.forEach((items,index) => {
                                        if(items.name == res.body.data.name){
                                            data[index] = res.body.data;
                                            Base.SetStateSession(stateData);
                                        }
                                    });
                                    message.success('更新成功');
                                    this.handleBackClick();
                                });
                        } else {
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }

    //模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/vir/deleteTemp'))
            .set("token",token)
            .send({
                name: this.props.location.state.name,
            })
            .end((err,res) => {
                if(err) return;
                message.success(res.body.msg);
                if (res.body.code === 200) {
                    Base.RemoveStateSession();
                    this.handleBackClick();
                }
            });
    }
}

const VirTempEdit = Form.create()(VirTempEditCls);

export default VirTempEdit;