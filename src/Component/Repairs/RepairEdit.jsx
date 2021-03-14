import React, { Component } from 'react';
import { Form, Upload, Input, Icon, message, Button, DatePicker, Divider, Select } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelect from '../common/RemoteSelect.jsx';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');

class RepairEditTemp extends Component {
	constructor(props) {
		super(props);
		this.deliveryStateArr = ['送修检验中', '维修中', '维修检验中', '待发件', '已发件', '已收件'];
		this.initStatus = this.props.location.state.deliver_state;
		this.formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } } };
		this.renderActionBar = this.renderActionBar.bind(this);
	};

	state = {
		labelProperty: {
			serial_no: {
				label: '序列号',
				input_attr: { disabled: 'disabled' },
			},
			goods: {
				label: '型号',
				input_attr: { disabled: 'disabled' },
			},
			cust_name: {
				label: '送修单位',
				input_attr: { disabled: 'disabled' },
			},
			repair_contractno: {
				label: '维修单号',
				input_attr: { disabled: 'disabled' },
			},
			receive_time: {
				label: '收件时间',
				input_attr: { disabled: 'disabled' },
			},
			receive_no: {
				label: '收件快递单号',
				input_attr: { disabled: 'disabled' },
			},
			problems: {
				label: '客户反映故障',
				input_attr: { disabled: 'disabled' },
			},
			conclusion: {
				label: '检验发现',
			},
			treatement: {
				label: '处理方法',
			},
			pri_check_person: {
				label: '送修检验人',
				input_attr: { disabled: 'disabled' },
			},
			repair_conclusion: {
				label: '维修操作',
			},
			repair_person: {
				label: '维修人',
			},
			again_conclusion: {
				label: '维修检验结果',
			},
			again_check_person: {
				label: '维修检验人',
				input_attr: { disabled: 'disabled' },
			},
			deliver_time: {
				label: '发件时间',
			},
			express: {
				label: '发件快递单号',
			},
			take_time: {
				label: '客户收件时间',
			},
			take_person: {
				label: '签收人',
			},
			contact: {
				label: '客户联系人',
				input_attr: { disabled: 'disabled' },
			},
			contact_type: {
				label: '联系电话',
				input_attr: { disabled: 'disabled' },
			},
			guarantee_repair: {
				label: '是否保修',
			},
			related_contract: {
				label: '维修合同',
			},
			own_cost: {
				label: '自产',
			},
			outer_cost: {
				label: '外购',
			},
			fee_basis: {
				label: '收费依据',
			},
			fee_checker: {
				label: '收费核定人',
			},
			album: {
				label: '照片',
			},
			// standrd: {
			// 	label: '规格',
			// 	input_attr: { disabled: 'disabled' },
			// },
			// deliver_state: {
			// 	label: '维修状态',
			// 	input_attr: { disabled: 'disabled' },
			// },
			// rem: {
			// 	label: '备注',
			// },
			// insert_person: {
			// 	label: '录入人',
			// 	input_attr: { disabled: 'disabled' },
			// },
			// insert_time: {
			// 	label: '录入时间',
			// 	input_attr: { disabled: 'disabled' },
			// },
			// update_person: {
			// 	label: '更新人',
			// 	input_attr: { disabled: 'disabled' },
			// },
			// update_time: {
			// 	label: '更新时间',
			// 	input_attr: { disabled: 'disabled' },
			// }
		},
		fileList: [],
		actionBar: [],
		readBar: [],
		btnArr: [],
	};

	componentDidMount() {
		const data = this.props.location.state;
		this.init(data);
	}

	_getNextStatus = () => {
		const currentIndex = this.deliveryStateArr.indexOf(this.initStatus);
		const status = this.deliveryStateArr[currentIndex + 1];
		if (status) {
			return status;
		}
	}

	_getPrevStatus = () => {
		const currentIndex = this.deliveryStateArr.indexOf(this.initStatus);
		const status = this.deliveryStateArr[currentIndex - 1];
		if (status) {
			return status;
		}
	}

	init = data => {
		const { labelProperty } = this.state;
		const actionBar = [labelProperty.album], readBar = [], btnArr = [
			<Button type={'primary'} htmlType={'submit'} style={{marginLeft: 18}} onClick={this.sub}>提交</Button>
		];
		for (const key in labelProperty) {
			labelProperty[key].name = key;
			labelProperty[key].initialValue = data[key];
		}
		const nextStatus = this._getNextStatus();
		const prevStatus = this._getPrevStatus();
		if (this.initStatus === '送修检验中') {
			actionBar.push(labelProperty.problems);
			actionBar.push(labelProperty.conclusion);
			actionBar.push(labelProperty.treatement);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(nextStatus)}>下一状态（{nextStatus}）</Button>);
		} else if (this.initStatus === '维修中') {
			actionBar.push(labelProperty.repair_conclusion);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(nextStatus)}>下一状态（{nextStatus}）</Button>);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(prevStatus)}>退回（{prevStatus}）</Button>);
		} else if (this.initStatus === '维修检验中') {
			actionBar.push(labelProperty.again_conclusion);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(nextStatus)}>下一状态（{nextStatus}）</Button>);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(prevStatus)}>退回（{prevStatus}）</Button>);
		} else if (this.initStatus === '待发件') {
			actionBar.push(labelProperty.express);
			actionBar.push(labelProperty.deliver_time);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(nextStatus)}>下一状态（{nextStatus}）</Button>);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(prevStatus)}>退回（{prevStatus}）</Button>);
		} else if (this.initStatus === '已发件') {
			actionBar.push(labelProperty.take_person);
			actionBar.push(labelProperty.take_time);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(nextStatus)}>下一状态（{nextStatus}）</Button>);
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(prevStatus)}>退回（{prevStatus}）</Button>);
		} else if (this.initStatus === '已收件') {
			btnArr.unshift(<Button style={{marginLeft: 18}} onClick={() => this.changeStatus(prevStatus)}>退回（{prevStatus}）</Button>);
		} else {
			btnArr.pop();
		}
		let fileList = [];
		for (const key in labelProperty) {
			// let isExist = false;
			// for (let i = 0; i < actionBar.length; i++) {
			// 	if (actionBar[i].name === key) {
			// 		isExist = true;
			// 	}
			// }
			if (key !== 'album') {	
				readBar.push(labelProperty[key]);
			}
		}
		try {
			fileList = labelProperty.album.initialValue.split(',').filter(items => items);
		} catch (e) {
			fileList = [];
		}
		fileList = fileList.map(items => {
			return {
				uid: items,
				name: items,
				status: 'done',
				url: common.staticBaseUrl('/img'+items),
			}
		});
		this.setState({
			actionBar,
			readBar,
			btnArr,
			fileList,
		});
	}

	uploadProps = () => {
		const { fileList } = this.state;
		const self = this;
		const token = sessionStorage.getItem('token');
		const props = {
			action: common.baseUrl('/repairs/upload'),
			headers: {
				token,
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList: fileList,
			multiple: false,
			onChange: (res) => {
				if (res.file.status=='done') {
					let file_name = res.file.response.data[0];
					file_name = '/repair/' + file_name;
					self.setState({
						fileList: [...self.state.fileList, {
							uid: file_name,
							name: file_name,
							status: 'done',
							url: common.staticBaseUrl('/img'+file_name),
						}],
					});
				}
			},
			onRemove: (result) => {
				let name;
				try {
					name = '/repair/' + result.response.data[0];
				} catch(e) {
					name = result.name;
				}
				const fileList = self.state.fileList.filter(items => items.name != name);
				self.setState({
					fileList,
				});
			}
		};
		return props;
	}

	close = () => {
		const token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/repairs/update'))
			.set("token",token)
			.send({
				form_data: JSON.stringify({
					deliver_state: '关闭',
					id: this.props.location.state.id,
				})
			})
			.end((err,res) => {
				message.success(res.body.msg);
				this.fetchNewData();
			});
	}

	sub = (e, cb) => {
		const { fileList } = this.state;
		try {
			e.preventDefault();
		} catch (e) {
			
		}
		this.props.form.validateFieldsAndScroll((err, values) => {
			if (!err) {
				const albumStrArr = fileList.map(items => items.name);
				values.album = albumStrArr.join();
				values.id = this.props.location.state.id;
				const token = sessionStorage.getItem('token');
				request.put(common.baseUrl('/repairs/update'))
					.set("token",token)
					.send({
						form_data: JSON.stringify(values)
					})
					.end((err,res) => {
						if (res.body.code == 200) {
							if (!cb) {
								message.success(res.body.msg);
								this.fetchNewData();
							} else {
								cb();
							}
						} else {
							message.error(res.body.msg);
						}
					});
			}
		});
	}

	changeStatus = status => {
		let url;
		if (status === '送修检验中') {
			url = '/repairs/toFirstCheck';
		} else if (status === '维修中') {
			url = '/repairs/toRepairing';
		} else if (status === '维修检验中') {
			url = '/repairs/toSecondCheck';
		} else if (status === '待发件') {
			url = '/repairs/toPrepareSend';
		} else if (status === '已发件') {
			url = '/repairs/toHasSend';
		} else if (status === '已收件') {
			url = '/repairs/toHasReceive';
		}
		this.sub({}, () => {
			const token = sessionStorage.getItem('token');
			request.put(common.baseUrl(url))
				.set("token", token)
				.send({
					id: this.props.location.state.id,
				})
				.end((err,res) => {
					if (res.body.code == 200) {
						message.success(res.body.msg);
						this.fetchNewData();
					} else {
						message.error(res.body.msg);
					}
				});
		});
	}

	fetchNewData = () => {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/repairs/getOneById/' + this.props.location.state.id))
			.set("token", token)
			.end((err,res) => {
				const stateData = Base.GetStateSession();
				const { data } = stateData;
				data.forEach((items, index) => {
					if (items.id == this.props.location.state.id) {
						data[index] = res.body.data;
						Base.SetStateSession(stateData);
						this.initStatus = res.body.data.deliver_state;
						this.init(res.body.data);
					}
				});
			});
	}

	del = () => {
		const r = window.confirm('确认删除？');
		if (!r) {
			return;
		}
		const token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/repairs/update'))
			.set("token",token)
			.send({
				form_data: JSON.stringify({
					isdel: 1,
					id: this.props.location.state.id,
				})
			})
			.end((err,res) => {
				if (res.body.code == 200) {
					message.success('删除成功');
					Base.RemoveStateSession();
					this.handleBackClick();
				}
			});
	}

	handleBackClick = () => {
		this.props.history.goBack();
	}

	renderActionBar = () => {
		const { actionBar } = this.state;
		const { getFieldDecorator } = this.props.form;
		return actionBar.map((items, index) => {
			let temp = <Input />;
			if (items.name === 'related_contract') {
				temp = <RemoteSelect remoteUrl={common.baseUrl('/output/searchNo?keywords=')} initialValue={items.initialValue} />;
			} else if (items.name === 'deliver_time' || items.name === 'take_time') {
				if (items.initialValue) {
					actionBar[index].initialValue = moment(items.initialValue);
				}
				temp = <DatePicker />;
			} else if (items.name === 'again_conclusion') {
				temp = <Select>
					<Select.Option key={'修复'} value={'修复'}>修复</Select.Option>
					<Select.Option key={'无法修复'} value={'无法修复'}>无法修复</Select.Option>
					<Select.Option key={'无需修复'} value={'无需修复'}>无需修复</Select.Option>
					<Select.Option key={'部分修复'} value={'部分修复'}>部分修复</Select.Option>
				</Select>
			}
			if (items.name === 'album') {
				return (
					<div key={items.name}>
						<FormItem label={items.label} {...this.formItemLayout}>
							<Upload {...this.uploadProps()}>
								<Button>
									<Icon type="upload" />上传照片
								</Button>
							</Upload>
						</FormItem>
					</div>
				)
			} else {
				return (
					<div key={items.name}>
						<FormItem label={items.label} {...this.formItemLayout}>
							{getFieldDecorator(items.name, { initialValue: items.initialValue })(temp)}
						</FormItem>
					</div>
				)
			}
		});
	}

	renderBtnArr = () => {
		const { btnArr } = this.state;
		return btnArr;
	}

	renderReadBar = () => {
		const { readBar } = this.state;
		return readBar.map(items => {
			return (
				<div key={items.name} className="son">
					<FormItem label={items.label} {...this.formItemLayout}>
						{ tempRender(items) }
					</FormItem>
				</div>
			)
		});

		function tempRender(items) {
			const notDisabledArr = ['contact', 'contact_type', 'rem', 'goods', 'standrd', 'guarantee_repair', 'related_contract', 'own_cost', 'outer_cost', 'fee_basis'];
			const { name } = items;
			if (name === 'related_contract') {
				return <RemoteSelect remoteUrl={common.baseUrl('/output/searchNo?keywords=')} initialValue={items.initialValue} />;
			}
			if (notDisabledArr.includes(name)) {
				return <Input name={items.name} defaultValue={items.initialValue} />
			}
			return <Input name={items.name} disabled value={items.initialValue} />
		}
	}

	subStatic = () => {
		const contact = $('input[name=contact]').val();
		const contact_type = $('input[name=contact_type]').val();
		const rem = $('input[name=rem]').val();
		const goods = $('input[name=goods]').val();
		const standrd = $('input[name=standrd]').val();
		const guarantee_repair = $('input[name=guarantee_repair]').val();
		const own_cost = $('input[name=own_cost]').val();
		const outer_cost = $('input[name=outer_cost]').val();
		const id = this.props.location.state.id;
		const related_contract = $('.ant-select-search__field').eq(0).val();
		const fee_basis = this.props.location.state.fee_basis;
		let form_data = {
			contact,
			contact_type,
			rem,
			goods,
			standrd,
			guarantee_repair,
			related_contract,
			id,
			own_cost,
			outer_cost,
			fee_basis,
		};
		const originData = this.props.location.state;
		if (own_cost != originData.own_cost || outer_cost != originData.outer_cost || fee_basis != originData.fee_basis) {
			form_data.fee_checker = sessionStorage.getItem('user_id');
		}
		form_data = JSON.stringify(form_data);
		const token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/repairs/update'))
			.set("token",token)
			.send({
				form_data,
			})
			.end((err,res) => {
				if (res.body.code == 200) {
					message.success(res.body.msg);
					this.fetchNewData();
				} else {
					message.error(res.body.msg);
				}
			});
	}

	render() {
		return (
			<div>
				<Form onSubmit={this.sub}>
					<Divider>{this.initStatus}</Divider>
					{this.renderActionBar()}
					{/* <div className={"dadContainer"} style={{ padding: 24 }}>{this.renderActionBar()}</div> */}
					<div style={{textAlign: 'center'}}>
						{this.renderBtnArr()}
					</div>
				</Form>
				<Divider />
				<div className={"dadContainer"} style={{ padding: 24 }}>{this.renderReadBar()}</div>
				<div style={{textAlign: 'center', marginBottom: 18}}>
					<Button type={'primary'} onClick={this.subStatic}>提交</Button>
					<Button style={{marginLeft: 18}} type={'danger'} onClick={this.del}>删除</Button>
					<Button style={{marginLeft: 18}} onClick={this.handleBackClick}>返回</Button>
				</div>
			</div>
		)
	}
}

const RepairEdit = Form.create()(RepairEditTemp);

export default RepairEdit;