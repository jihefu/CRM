import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Form,Input,Select,Upload,Icon } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import BaseEditList from '../common/BaseEditList.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;

export class PublicRealtionShipAddCls extends BaseEditList {
    constructor(props){
        super(props);
        this.addPathname = '/publicRelationShip';
        this.uploadRenderStart = true;
        this.provinceArr = ['山东','吉林','上海','广东','浙江','广西','北京','甘肃','湖南','陕西','重庆','河南','宁夏','湖北',
					'辽宁','河北','江苏','海南','新疆','四川','云南','安徽','江西','福建','天津','山西','内蒙古',
					'青海','贵州','西藏','黑龙江','香港','澳门','台湾','国外','其他'];
		this.state.labelProperty = {
            company: {label: '单位名称', rules: [{
                required: true, message: '不能为空',
            }]},
            legal_person: {label: '法定代表人', rules: [{
                required: true, message: '不能为空',
            }]},
            province: {label: '省份', rules: [{
                required: true, message: '不能为空',
            }], temp: <Select>
                {
                    this.provinceArr.map(items => 
                        <Select.Option key={items} value={items}>{items}</Select.Option>
                    )
                }
            </Select>},
            town: {label: '城镇', rules: [{
                required: true, message: '不能为空',
            }]},
		}
    }

    componentDidMount() {
        const { labelProperty } = this.state;
        for(let key in labelProperty) {
			this.transToView(labelProperty, key, {});
		}
		this.setState({
			labelProperty,
		});
    }

    transToView(labelProperty, key, data){
        labelProperty[key]['initialValue'] = data[key];
        labelProperty['province']['initialValue'] = '山东';
    }
    
    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl(this.addPathname))
		            .set("token",token)
		            .send(values)
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
                            message.success(res.body.msg);
                            Base.RemoveStateSession();
                            this.props.history.goBack();
                        } else {
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }
}

const PublicRealtionShipAdd = Form.create()(PublicRealtionShipAddCls);

export default PublicRealtionShipAdd;