import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Form,Input,Select,Upload,Icon, Table, Divider, Modal } from 'antd';
import ModalTemp from '../common/Modal.jsx';
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

class VerUnitEditCls extends BaseEditList {
    constructor(props){
        super(props);
        this.uploadRenderStart = true;
        this.target_key_prefix = '/verUnit/';
        this.updatePathname = '/verUnit/' + this.props.location.state.user_id;
        this.id = this.props.location.state.user_id;
        this.provinceArr = ['山东','吉林','上海','广东','浙江','广西','北京','甘肃','湖南','陕西','重庆','河南','宁夏','湖北',
					'辽宁','河北','江苏','海南','新疆','四川','云南','安徽','江西','福建','天津','山西','内蒙古',
					'青海','贵州','西藏','黑龙江','香港','澳门','台湾','国外','其他'];
		this.state.labelProperty = {
            company: {label: '单位名', rules: [{
                required: true, message: '不能为空',
            }]},
            user_id: {label: '单位号', input_attr: {disabled: 'disabled'}},
            legal_person: {label: '法定代表人', rules: [{
                required: true, message: '不能为空',
            }]},
            tax_id: {label: '机构代码'},
            certified: {label: '认证状态', temp: <Select onChange={this.certifiedChange}>
                <Select.Option key={0} value={0}>{'待认证'}</Select.Option>
                <Select.Option key={1} value={1}>{'已认证'}</Select.Option>
                <Select.Option key={2} value={2}>{'未通过'}</Select.Option>
            </Select>},
            certifiedPerson: {label: '认证人', input_attr: {disabled: 'disabled'}},
            province: {label: '省份', temp: <Select>
                {
                    this.provinceArr.map(items => 
                        <Select.Option key={items} value={items}>{items}</Select.Option>
                    )
                }
            </Select>},
            town: {label: '城市'},
            reg_addr: {label: '注册地址'},
            reg_tel: {label: '注册电话'},
            zip_code: {label: '邮政编码'},
            // telArr: {label: '常用认证电话'},
            update_person: {label: '更新人', input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间', input_attr: {disabled: 'disabled'}},
        }
        this.state.telArr = this.props.location.state.telArr;
        this.renderTelTable = this.renderTelTable.bind(this);
        this.addTel = this.addTel.bind(this);
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
            if (data['certified'] == 1) {
                labelProperty[key].input_attr = {disabled: 'disabled'};
            } else {
                delete labelProperty[key].input_attr;
            }
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
    
    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    handleSubmit = (e) => {
        const { telArr } = this.state;
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                values.telArr = telArr;
                let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl(this.updatePathname))
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
                                        const { latestThreeMonthContactsOrderNum, totalContactsOrderNum, mainContacts } = data[index];
                                        data[index] = result;
                                        data[index].latestThreeMonthContactsOrderNum = latestThreeMonthContactsOrderNum;
                                        data[index].totalContactsOrderNum = totalContactsOrderNum;
                                        data[index].mainContacts = mainContacts;
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

    renderTelTable() {
        const { telArr } = this.state;
        const columns = [
            {
              title: '名称',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '座机',
              dataIndex: 'tel',
              key: 'tel',
            },
            {
                title: '操作',
                dataIndex: 'action',
                key: 'action',
                render: (text, record) => (
                    <span>
                      <a href={'javascript:void(0)'} onClick={() => this.delTel(record)}>删除</a>
                    </span>
                ),
            },
        ];
        return <Table dataSource={telArr} columns={columns} />;
    }

    delTel(record) {
        const { telArr } = this.state;
        const newTelArr = telArr.filter(items => items.tel != record.tel);
        this.setState({
            telArr: newTelArr,
        });
    }

    addTel() {
        const { telArr } = this.state;
        const that = this;
        Modal.confirm({
            title: '新增认证电话',
            icon: <Icon type="info-circle" />,
            content: <div>
                <label style={{display:'flex'}}>
                    <span style={{width:'60px'}}>名称：</span>
                    <Input name={"name"} style={{flex:1}} />
                </label>
                <label style={{display:'flex',marginTop: 10}}>
                    <span style={{width:'60px'}}>座机：</span>
                    <Input name={"tel"} style={{flex:1}} />
                </label>
            </div>,
            onOk() {
                const name = $('input[name=name]').val();
                const tel = $('input[name=tel]').val();
                if (!name || !tel) {
                    message.error('不能为空');
                    return;
                }
                let isExist = false;
                telArr.forEach(items => {
                    if (items.tel == tel) isExist = true;
                });
                if (isExist) {
                    message.error('该电话已存在');
                    return;
                }
                telArr.push({
                    name,
                    tel,
                });
                that.setState({
                    telArr,
                });
            },
        });
    }

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
                    <Divider>常用认证电话</Divider>
                    <Button style={{marginBottom: 6}} onClick={this.addTel}>新增</Button>
                    { this.renderTelTable() }
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

const VerUnitEdit = Form.create()(VerUnitEditCls);

export default VerUnitEdit;