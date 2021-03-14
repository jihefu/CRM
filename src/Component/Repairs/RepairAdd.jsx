import React, { Component } from 'react';
import { Form, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete, DatePicker, Message, InputNumber } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelect from '../common/RemoteSelect.jsx';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');

class RepairAddTemp extends Component {
	constructor(props) {
		super(props);
		this.handleBackClick = this.handleBackClick.bind(this);
	};

	state = {
		labelProperty: {
			serial_no: { 
				label: '序列号',
				rules: [{
					required: true, message: '不能为空',
				}]},
			cust_name: {
				label: '送修单位',
				rules: [{
					required: true, message: '不能为空',
				}],
			},
			receive_time: {
				label: '收件时间',
				rules: [{
					required: true, message: '不能为空',
				}],
			},
			receive_no: { label: '收件快递单号' },
			// goods: {
			// 	label: '产品',
			// 	rules: [{
			// 		required: true, message: '不能为空',
			// 	}],
			// },
			// standrd: { label: '规格' },
			// number: { label: '数量' },
			// problems: { label: '问题' },
			// guarantee_repair: { label: '保修' },
			contact: { label: '客户联系人' },
			contact_type: { label: '联系电话', },
			// rem: { label: '备注' },
		},
		contact: '',
	};

	init = () => {
		const { labelProperty, contact } = this.state;
		for (const key in labelProperty) {
			if (key === 'cust_name') {
				labelProperty[key].temp = <RemoteSelect remoteUrl={common.baseUrl('/repairs/searchCnAbb?keywords=')} initialValue="" />;
			} else if (key === 'contact_type') {
				labelProperty[key].temp = <RemoteSelectRandom remoteUrl={common.baseUrl('/contacts/searchInfoByName?contact=' + contact + '&keywords=')} initialValue="" />;
			} else if (key === 'receive_time') {
				labelProperty[key].initialValue = moment();
				labelProperty[key].temp = <DatePicker showTime />;
			} else if (key === 'guarantee_repair') {
				labelProperty[key].initialValue = '否';
				labelProperty[key].temp = <Select>
					<Select.Option key="否" value="否">否</Select.Option>
					<Select.Option key="是" value="是">是</Select.Option>
				</Select>
			} else if (key === 'number') {
				labelProperty[key].initialValue = 1;
				labelProperty[key].temp = <InputNumber value={1} />
			}
		}
		this.setState({
			labelProperty,
		});
	}

	onChange = e => {
		const input_name = e.target.id;
		if (input_name == 'contact') {
			this.setState({
				contact: e.target.value
			}, () => {
				this.init();
			});
		}
	}

	handleSubmit = (e) => {
		e.preventDefault();
		this.props.form.setFieldsValue({
			cust_name: $('.ant-select-search__field').eq(0).val(),
		});
		this.props.form.setFieldsValue({
			contact_type: $('.ant-select-search__field').eq(1).val(),
		});
		this.props.form.validateFieldsAndScroll((err, values) => {
			if (!err) {
				if (/\D/.test(values.serial_no)) {
					message.error('序列号必须为纯数字');
					return;
				}
				let token = sessionStorage.getItem('token');
				request.post(common.baseUrl('/repairs/add'))
				    .set("token",token)
				    .send({
				        form_data: JSON.stringify(values)
				    })
				    .end((err,res) => {
						if(err) return;
						if (res.body.code == 200) {
							message.success('新增成功');
							Base.RemoveStateSession();
							this.handleBackClick();
						} else {
							message.error(res.body.msg);
						}
				    })
			}
		});
	}

	handleBackClick() {
		this.props.history.goBack();
	}

	componentDidMount() {
		this.init();
	}

	render() {
		const record = this.state.labelProperty;
		const { getFieldDecorator } = this.props.form;
		const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } } };
		const formItem = [];
		const default_rules = [];
		for (let i in record) {
			const default_temp = <Input onChange={this.onChange} />;
			const rules = record[i].rules ? record[i].rules : default_rules;
			const temp = record[i].temp ? record[i].temp : default_temp;
			formItem.push(<FormItem key={i} {...formItemLayout} label={record[i].label}>
				{getFieldDecorator(i, { initialValue: record[i].initialValue, rules })(temp)}
			</FormItem>);
		}
		return (
			<Form onSubmit={this.handleSubmit} style={{ padding: 24 }}>
				<div className="dadContainer">
					{
						formItem.map((items, index) =>
							<div key={index} className="son">{items}</div>
						)
					}
				</div>
				<FormItem style={{ display: 'flex' }} className={'editBtn'}>
					<Button type="primary" htmlType="submit">提交</Button>
					<Button style={{ "marginLeft": 50 }} onClick={this.handleBackClick}>返回</Button>
				</FormItem>
			</Form>
		)
	}
}

const RepairAdd = Form.create()(RepairAddTemp);

export default RepairAdd;