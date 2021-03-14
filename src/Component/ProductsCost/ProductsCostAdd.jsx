import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message, InputNumber } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import { ProductsCostEditTemp } from './ProductsCostEdit.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class ProductsCostAddTemp extends ProductsCostEditTemp {
	constructor(props){
		super(props);
		this.state.is_group = 0;
		this.state.remGroup = [];
		this.state.remText = '';
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
        if(key=='product_price'){
            labelProperty[key]['initialValue'] = 0;
        } else if(key=='work_hours'){
            labelProperty[key]['initialValue'] = 0;
        }else if(key=='product_type'){
            labelProperty[key]['initialValue'] = '产品';
        }else if(key=='product_group'){
            labelProperty[key]['initialValue'] = '套装';
		}
		this.renderRem();
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
        if(this.checkSafe()==1) return;
        delete labelProperty['product_type']['input_attr'];
		delete labelProperty['product_name']['input_attr'];
		for(let key in labelProperty){
            this.transToView(labelProperty,key);
            if(key=='product_price'){
				labelProperty[key].temp = <InputNumber step={50} min={0} defaultValue={labelProperty[key]['initialValue']} />
			} else if (key=='work_hours') {
				labelProperty[key].temp = <InputNumber precision={2} step={0.5} min={0} defaultValue={labelProperty[key]['initialValue']} />
			}else if(key=='product_type'){
				labelProperty[key].temp = <Select>
											<Option value="产品">产品</Option>
											<Option value="附加配件">附加配件</Option>
										</Select>
				labelProperty[key].rules = [{
					required: true, message: '不能为空',
				}];
            }else if(key=='product_name'){
                labelProperty[key].rules = [{
                    required: true, message: '不能为空',
                }];
            }else if(key=='product_group'){
				labelProperty[key].temp = <AutoComplete
					dataSource={['套装','板卡','箱体','传感器','电子件','比例阀','液压件','机械件','电脑','软件']}
					filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
				/>
				labelProperty[key].rules = [{
					required: true, message: '不能为空',
				}];
			}
		}
		this.setState({
			labelProperty: labelProperty
		},() => {
			this.uploadRenderStart = true;
		});
	}

	//@override
	handleSubmit = (e) => {
		const { is_group, remGroup, remText } = this.state;
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.is_group = is_group;
				if (is_group) {
					values.product_rem = remGroup.join();
				} else {
					values.product_rem = remText;
				}
                Base.RemoveStateSession();
	        	let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/productsLibrary/add'))
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
}

const ProductsCostAdd = Form.create()(ProductsCostAddTemp);

export default ProductsCostAdd;