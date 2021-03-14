import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,InputNumber,Divider } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import BaseEditList from '../common/BaseEditList.jsx';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import ContractsBodyList from './ContractsBodyList.jsx';
import ContractsOfferList from './ContractsOfferList.jsx';
import ModalTemp from '../common/Modal';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;

export class ContractAddTemp extends BaseEditList {
    constructor(props) {
        super(props);
        this.state.cus_abb = null;
        this.state.sale_person = null;
        this.dataValidate = this.dataValidate.bind(this);
        this.cbData = this.cbData.bind(this);
        this.cbStaffData = this.cbStaffData.bind(this);
        this.totalAmountChange = this.totalAmountChange.bind(this);
        this.payableChange = this.payableChange.bind(this);
        this.getAllProductsSelected = this.getAllProductsSelected.bind(this);
        this.getGoodsType = this.getGoodsType.bind(this);
		this.state.labelProperty = {
            contract_no: {label: '合同编号'},
            cus_abb: {label: '购方'},
            sale_person: {label: '销售员'},
            sign_time: {label: '签订日期'},
            total_amount: {label: '总金额',input_attr: {disabled: 'disabled'}},
            payable: {label: '应付金额',input_attr: {disabled: 'disabled'}},
            snNum: {label: '控制器数量',input_attr: {disabled: 'disabled'}},
            otherSnNum: {label: '其它序列号数量',input_attr: {disabled: 'disabled'}},
        }
        this.state.productsSelectedArr = [];
        this.state.goodsTypeArr = [];
        this.contract_body = [];
        this.contract_offer = [];
    }

    //@Override
	checkSafe(){
		let token = sessionStorage.getItem('token');
		if(!token){
			hashHistory.push('/');
			return 1;
		}
    }

    //@Override
	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    dataValidate(values){
        values.cus_abb = this.state.cus_abb;
        values.sale_person = this.state.sale_person;
        values.snNum = values.snNum ? values.snNum : 0;
        values.otherSnNum = values.otherSnNum ? values.otherSnNum : 0;
        if(!values.contract_no){
            message.error('合同号不能为空');
            return false;
        }
        if(!values.cus_abb){
            message.error('购方不能为空');
            return false;
        }
        if(!values.sale_person){
            message.error('销售员不能为空');
            return false;
        }
        if(!values.total_amount){
            message.error('合同金额不能为空');
            return false;
        }
        for (let i = 0; i < this.contract_body.length; i++) {
            const items = this.contract_body[i];
            delete items['key'];
            items.contract_no = values.contract_no;
            if(!items.goods_name){
                message.error('货品名称不能为空');
            // if(!items.goods_name||!items.goods_spec){
            //     message.error('货品名称或规格不能为空');
                return;
            }
            if(!items.goods_type){
                message.error('货品类型不能为空');
                return;
            }
        }
        for (let i = 0; i < this.contract_offer.length; i++) {
            const items = this.contract_offer[i];
            delete items['key'];
            if(items.offer_type=='抵价券'){
                items.coupon_value = items.offer_amount;
                items.coupon_no = items.offer_no;
            }else if(items.offer_type=='服务保证金'){
                items.service_deposit_value = items.offer_amount;
                items.service_deposit_no = items.offer_no;
            }else{
                items.other_offers = items.offer_amount;
                items.other_id = items.offer_no;
            }
            delete items.offer_amount;
            delete items.offer_no;
            delete items.offer_type;
            if(items.coupon_value){
                if(!items.coupon_no){
                    message.error('请输入抵价券号码');
                    return;
                }
            }
            if(items.service_deposit_value){
                if(!items.service_deposit_no){
                    message.error('请输入合同号');
                    return;
                }
            }
        }
        if(this.contract_offer[0]==null){
            this.contract_offer = [{
                other_offers: 0
            }];
        }
        return true;
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
	        	request.post(common.baseUrl('/contracts/add'))
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
    
    searchInputselected(v){
        
    }

    cbData(v){
        this.setState({
            cus_abb: v.abb
        });
    }

    cbStaffData(v){
        this.setState({
            sale_person: v.user_id
        });
    }

    //计算货品金额和重置应付金额
    totalAmountChange(totalAmountArr){
        this.contract_body = totalAmountArr;
        let totalAmount = 0;
        for (let i = 0; i < totalAmountArr.length; i++) {
            const { goods_price, goods_num, goods_ded_rate } = totalAmountArr[i];
            totalAmount += goods_price * goods_num * goods_ded_rate;
        }
        let originTotalAmount = this.props.form.getFieldValue('total_amount');
        let originPayable = this.props.form.getFieldValue('payable');
        originTotalAmount = originTotalAmount?originTotalAmount:0;
        originPayable = originPayable?originPayable:0;
        let favo = originTotalAmount - originPayable;
        this.props.form.setFieldsValue({
            total_amount: totalAmount,
            payable: totalAmount - favo
        });
    }

    //计算应付金额
    payableChange(favoArr){
        this.contract_offer = favoArr;
        let favo = 0;
        for (let i = 0; i < favoArr.length; i++) {
            favo += Number(favoArr[i].offer_amount);
            // const { coupon_value, service_deposit_value, other_offers } = favoArr[i];
            // favo += coupon_value + service_deposit_value + other_offers;
        }
        let total_amount = this.props.form.getFieldValue('total_amount');
        total_amount = total_amount?total_amount:0;
        let payable = Number(total_amount) - Number(favo);
        this.props.form.setFieldsValue({
            payable: payable
        });
    }

    //@Override
    componentDidMount(){
        const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		for(let key in labelProperty){
            labelProperty[key].initialValue = null;
            if(key=='sign_time'){
                labelProperty[key]['initialValue'] = moment();
                labelProperty[key].temp = <DatePicker />;
            }else if(key=='cus_abb'){
                labelProperty[key].temp = <RemoteSearchInput style={{width: '100%'}} searchInputselected={this.searchInputselected} cbData={this.cbData} remoteUrl={common.baseUrl('/customers/remoteSearchCustomers?keywords=')} />;
            }else if(key=='sale_person'){
                labelProperty[key].temp = <RemoteSearchInput style={{width: '100%'}} searchInputselected={this.searchInputselected} cbData={this.cbStaffData} remoteUrl={common.baseUrl('/staff/remoteSearchStaff?branch=客户关系部&keywords=')} />;
            }else if(key=='snNum' || key== 'otherSnNum'){
                labelProperty[key].temp = <InputNumber defaultValue={0} step={1} min={0} />;
            }
		}
		this.setState({
			labelProperty: labelProperty
        },() => this.uploadRenderStart = true);
        this.getAllProductsSelected();
        this.getGoodsType();
    }

    //@Override
    getAllProductsSelected(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/contracts/getAllProductsSelected'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    const productsSelectedArr = res.body.data;
                    this.setState({
                        productsSelectedArr
                    });
                }
            });
    }

    getGoodsType(){
        this.setState({
            goodsTypeArr: ['产品','附加配件','现场服务','研发服务','生产服务','咨询服务']
        });
        // let token = sessionStorage.getItem('token');
        // request.get(common.baseUrl('/productsLibrary/getGoodsType'))
        //     .set("token",token)
        //     .end((err,res) => {
        //         if(err) return;
        //         if(res.body.code==200){
        //             this.setState({
        //                 goodsTypeArr: res.body.data
        //             });
        //         }
        //     });
    }

    //@Override
    render() {
        if(!this.uploadRenderStart) return <div></div>;
        const { productsSelectedArr, goodsTypeArr } = this.state;
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
		    		default_temp = <Input />;
		    	}
	    	}catch(e){
	    		default_temp = <Input />;
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
                <Divider>货品</Divider>
                <ContractsBodyList goodsTypeArr={goodsTypeArr} productsSelectedArr={productsSelectedArr} totalAmountChange={this.totalAmountChange} />
                <Divider style={{marginTop: 60}}>支付优惠</Divider>
                <ContractsOfferList cus_abb={this.state.cus_abb} payableChange={this.payableChange} />
				<ModalTemp 
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    ModalText={this.state.modalText} 
                    visible={this.state.visible} />
			</div>
		)
	}
}

const ContractAdd = Form.create()(ContractAddTemp);

export default ContractAdd;