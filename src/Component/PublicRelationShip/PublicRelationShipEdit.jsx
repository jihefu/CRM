import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Form,Input,Select,Upload,Icon } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import { PublicRealtionShipAddCls } from './PublicRelationShipAdd.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;

export class PublicRealtionShipEditCls extends PublicRealtionShipAddCls {
    constructor(props) {
        super(props);
        this.deleteUrl = '/publicRelationShip/'+this.props.location.state.user_id;
        this.target_key_prefix = '/publicRelationShip/';
        this.id = this.props.location.state.user_id;
        this.state.labelProperty = {
            company: {label: '公共关系单位', input_attr: {disabled: 'disabled'}},
            user_id: {label: '单位号', input_attr: {disabled: 'disabled'}},
            // legal_person: {label: '法定代表人', rules: [{
            //     required: true, message: '不能为空',
            // }]},
            // tax_id: {label: '税号'},
            // certified: {label: '认证状态', temp: <Select onChange={this.certifiedChange}>
            //     <Select.Option key={0} value={0}>{'待认证'}</Select.Option>
            //     <Select.Option key={1} value={1}>{'已认证'}</Select.Option>
            //     <Select.Option key={2} value={2}>{'未通过'}</Select.Option>
            // </Select>},
            // certifiedPerson: {label: '认证人', input_attr: {disabled: 'disabled'}},
            // province: {label: '省份', rules: [{
            //     required: true, message: '不能为空',
            // }], temp: <Select>
            //     {
            //         this.provinceArr.map(items => 
            //             <Select.Option key={items} value={items}>{items}</Select.Option>
            //         )
            //     }
            // </Select>},
            // town: {label: '城镇', rules: [{
            //     required: true, message: '不能为空',
            // }]},
            // reg_company: {label: '开票公司'},
            // reg_addr: {label: '开票地址'},
            // reg_tel: {label: '开票电话'},
            // bank_name: {label: '开户行'},
            // bank_account: {label: '银行账号'},
            website: {label: '网站'},
            relation: {label: '与朗杰关系'},
            // zip_code: {label: '邮政编码'},
            rem: {label: '备注'},
            insert_person: {label: '新增人', input_attr: {disabled: 'disabled'}},
            insert_time: {label: '新增时间', input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人', input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间', input_attr: {disabled: 'disabled'}},
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

    transToView(labelProperty, key, data){
        labelProperty[key]['initialValue'] = data[key];
        if (key == 'insert_time' || key == 'update_time') {
            labelProperty[key]['initialValue'] = moment(data[key]).format('YYYY-MM-DD HH:mm:ss');
        } else if (key == 'company' || key == 'legal_person' || key == 'tax_id') {
            // if (data['certified'] == 1) {
            //     labelProperty[key].input_attr = {disabled: 'disabled'};
            // } else {
            //     delete labelProperty[key].input_attr;
            // }
        }
    }

    certifiedChange = v => {
        const { labelProperty } = this.state;
        const user_name = sessionStorage.getItem('user_name');
        this.props.form.setFieldsValue({
            certifiedPerson: user_name,
        });
        if (v === 1) {
            labelProperty.company.input_attr = {disabled: 'disabled'};
            labelProperty.legal_person.input_attr = {disabled: 'disabled'};
            labelProperty.tax_id.input_attr = {disabled: 'disabled'};
        } else {
            delete labelProperty.company.input_attr;
            delete labelProperty.legal_person.input_attr;
            delete labelProperty.tax_id.input_attr;
        }
        this.setState({
            labelProperty,
        });
    }

    handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl(this.target_key_prefix + values.user_id))
		            .set("token",token)
		            .send(values)
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
                            this.getOrderIdItem(result => {
								//sessionState替换
								let stateData = Base.GetStateSession();
								let { data } = stateData;
								data.forEach((items,index) => {
									if(items.user_id == result.user_id){
										data[index] = result;
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

    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style = {{"marginLeft":50}} type="danger" onClick={this.handleDelete}>删除</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    //模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                message.success('删除成功');
                let stateData = Base.GetStateSession();
                let { data } = stateData;
                data.forEach((items,index) => {
                    if(items.user_id == this.id){
                        data.splice(index, 1);
                        Base.SetStateSession(stateData);
                    }
                });
				this.handleBackClick();
            });
    }
}

const PublicRealtionShipEdit = Form.create()(PublicRealtionShipEditCls);

export default PublicRealtionShipEdit;
