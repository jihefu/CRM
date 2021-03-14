import React, { Component } from 'react';
import { Form, DatePicker, InputNumber, message } from 'antd';
import { ContractAddTemp } from './ContractAdd.jsx';
import request from 'superagent';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import Base from '../../public/js/base.js';
moment.locale('zh-cn');

class ContractAddAgainTemp extends ContractAddTemp {
    constructor(props) {
        super(props);
    }

    //@Override
    componentDidMount(){
        const data = this.props.location.state;
        const { labelProperty } = this.state;
        if(this.checkSafe()==1) return;
		for(let key in labelProperty){
            labelProperty[key].initialValue = null;
            if(key=='sign_time'){
                labelProperty[key]['initialValue'] = moment(data.sign_time);
                labelProperty[key].temp = <DatePicker />;
            }else if(key=='cus_abb'){
                labelProperty[key]['initialValue'] = data.cus_abb;
                labelProperty[key].temp = <RemoteSearchInput style={{width: '100%'}} searchInputselected={this.searchInputselected} cbData={this.cbData} remoteUrl={common.baseUrl('/customers/remoteSearchCustomers?keywords=')} />;
            }else if(key=='sale_person'){
                labelProperty[key]['initialValue'] = data.sale_person;
                labelProperty[key].input_attr = {
                    disabled: 'disabled',
                };
            }else if(key=='snNum' || key== 'otherSnNum'){
                labelProperty[key].temp = <InputNumber defaultValue={0} step={1} min={0} />;
            } else if (key === 'contract_no') {
                labelProperty[key]['initialValue'] = data.contract_no;
                labelProperty[key].input_attr = {
                    disabled: 'disabled',
                };
            }
		}
		this.setState({
            labelProperty: labelProperty,
            sale_person: data.sale_person,
            cus_abb: data.cus_abb,
        },() => this.uploadRenderStart = true);
        this.getAllProductsSelected();
        this.getGoodsType();
    }

    //@Override
	//提交
	handleSubmit = (e) => {
		e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                if(!this.dataValidate(values)) return;
                values.paid = 0;
                values.delivery_state = '审核中';
                values.snLackNum = values.snNum;
                values.otherSnLackNum = values.otherSnNum;
                let token = sessionStorage.getItem('token');
	        	request.post(common.baseUrl('/contracts/addAgain'))
		            .set("token",token)
		            .send({
                        contracts_head: values,
                        contracts_body: this.contract_body,
                        contracts_offer: this.contract_offer,
		            })
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
                            Base.RemoveStateSession();
							message.success('添加成功');
							this.handleBackClick();
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            });
			}
		});
    }
}

const ContractAddAgain = Form.create()(ContractAddAgainTemp);

export default ContractAddAgain;