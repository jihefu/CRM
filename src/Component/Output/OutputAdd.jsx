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
import { OutputTemp } from './OutputEdit.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

class RemoteMultSelect extends Component {
    constructor(props) {
        super(props);
        this.url = this.props.remoteUrl;
    }

    state = {
        defaultValue: [],
        placeholder: 'Please select',
        children: [],
    };

    fetch = () => {
        const token = sessionStorage.getItem('token');
        request.get(this.url + 'WX&notDelivery=1')
            .set("token", token)
            .end((err,res) => {
				const children = res.body.data.map(items => <Option key={items.value}>{items.value}</Option>);
				this.setState({ children });
            });
    }

    componentDidMount() {
        this.fetch();
    }

    handleChange = v => {
        try {
			this.props.Select(v);
		} catch (e) {
			
		}
    }

    render() {
        const { defaultValue, placeholder, children } = this.state;
        return (
            <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={this.handleChange}
            >
                {children}
            </Select>
        )
    }
}

class OutputAddTemp extends OutputTemp {
	constructor(props){
		super(props);
		this.contract_no = [];
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
        labelProperty['express_type']['initialValue'] = '顺丰';
        // labelProperty['all_shipments']['initialValue'] = '否';
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
        delete labelProperty['insert_person'];
        delete labelProperty['insert_time'];
        delete labelProperty['update_person'];
        delete labelProperty['update_time'];
        delete labelProperty['received_time'];
        delete labelProperty['received_person'];
		for(let key in labelProperty){
            this.transToView(labelProperty,key);
            if(key=='express_type'){
				labelProperty[key].temp = <Select>
					{
						this.expressTypeArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='all_shipments'){
				labelProperty[key].temp = <Select>
					{
						this.allShipmentsArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='delivery_time'){
                labelProperty[key].temp = <DatePicker />;
            }else if(key=='cus_cn_abb'){
                labelProperty[key].temp = <RemoteSelect remoteUrl={common.baseUrl('/output/searchCpy?keywords=')} initialValue="" />;
            }else if(key=='contract_no'){
				labelProperty[key].temp = <RemoteMultSelect Select={this.noSelect} remoteUrl={common.baseUrl('/output/searchNo?keywords=')} />;
                // labelProperty[key].temp = <RemoteSelect remoteUrl={common.baseUrl('/output/searchNo?keywords=')} initialValue="" />;
            }else if(key=='contacts'){
				labelProperty[key].temp = <RemoteSelectRandom onChange={(v,obj) => {
					let phone = obj.phone?obj.phone:'';
					this.props.form.setFieldsValue({
						contacts_tel: phone
					});
				}} remoteUrl={common.baseUrl('/contacts/searchInfoByKeywords?keywords=')} defaultValue={labelProperty[key].initialValue} />;
			}
            if(key=='express_no'||key=='delivery_time'||key=='goods'){
				labelProperty[key].rules = [{
	          		required: true, message: '不能为空',
	        	}]
			}
		}
		this.setState({
			labelProperty: labelProperty,
			fileList
		},() => {
			this.uploadRenderStart = true;
		});
	}

	noSelect = v => {
		this.contract_no = v;
	}

	//@override
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                this.transToModel(values);
				values.cus_cn_abb = $('.ant-select-search__field').eq(0).val();
				values.contract_no = this.contract_no.join();
				values.all_shipments = 1;
                Base.RemoveStateSession();
	        	let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/output/add'))
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
}

const OutputAdd = Form.create()(OutputAddTemp);

export default OutputAdd;