import React from 'react';
import { Form, Upload, Input, Icon, message, Select, Modal, Button, DatePicker, InputNumber, Divider, Spin, Collapse } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import BaseEditList from '../common/BaseEditList.jsx';
import ModalTemp from '../common/Modal';
import Base from '../../public/js/base.js';
const FormItem = Form.Item;
moment.locale('zh-cn');
const { Panel } = Collapse;

export class ContractEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.contractGoodsTypeArr = [];
		this.sub = this.sub.bind(this);
		this.file_name_prefix = '/contract/';
		this.target_key_prefix = '/contract/';
		this.uploadUrl = '/contracts/upload';
		this.deleteUrl = '/contracts/del';
		this.contractStateArr = ['有效', '草签', '关闭'];
		this.installArr = ['是', '否'];
		this.deliveryArr = ['审核中', '待发货', '已发货', '已收货', '安装中', '已验收'];
		this.startNo = 0;
		this.endNo = 0;
		this.delPowerArr = ['1603', '1101', '1006', '1702'];
		this.freezePowerArr = ['1603', '1702'];
		this.deliveryPowerArr = ['1101', '1006', '1702'];
		this.paidPowerPower = ['1603', '1702'];
		this.state.labelProperty = {
			contract_no: { label: '合同编号', input_attr: { disabled: 'disabled' } },
			cus_abb: { label: '购方', input_attr: { disabled: 'disabled' } },
			album: { label: '照片' },
			sale_person: { label: '销售员', input_attr: { disabled: 'disabled' } },
			purchase: { label: '购方采购' },
			contract_state: { label: '合同状态' },
			sign_time: { label: '签订日期', input_attr: { disabled: 'disabled' } },
			isDirectSale: { label: '是否直销', input_attr: { disabled: 'disabled' } },
			total_amount: { label: '总金额', input_attr: { disabled: 'disabled' } },
			favo: { label: '优惠金额', input_attr: { disabled: 'disabled' } },
			payable: { label: '应付金额', input_attr: { disabled: 'disabled' } },
			paid: { label: '已付金额' },
			install: { label: '需要安装' },
			snNum: { label: '控制器数量' },
			otherSnNum: { label: '其它序列号数量' },
			hardType: { label: '硬件类型' },
			softType: { label: '软件类型' },
			delivery_state: { label: '流程状态' },
			delivery_time: { label: '发货日期' },
			take_person: { label: '收货确认人' },
			take_time: { label: '收货确认时间' },
			isFreeze: { label: '是否冻结' },
			freeze_reason: { label: '冻结原因' },
			freeze_start_time: { label: '冻结开始时间' },
			freeze_time: { label: '冻结截止日期' },
			close_reason: { label: '关闭原因' },
			close_time: { label: '关闭日期' },
			other: { label: '其他约定' },
			complete: { label: '合同是否完成', input_attr: { disabled: 'disabled' } },
			insert_person: { label: '录入人', input_attr: { disabled: 'disabled' } },
			insert_time: { label: '录入时间', input_attr: { disabled: 'disabled' } },
			update_person: { label: '更新人', input_attr: { disabled: 'disabled' } },
			update_time: { label: '更新时间', input_attr: { disabled: 'disabled' } }
		}
		this.state.spinLoading = false;
		this.state.snGroupRem = [];
		this.state.otherSnGroupRem = [];
		this.state.packingList = [];
		this._v;
		this.burnDiskArr = [];
	}

	//@override
	//模态确定
	handleModalDefine() {
		let token = sessionStorage.getItem('token');
		request.delete(common.baseUrl(this.deleteUrl))
			.set("token", token)
			.send({
				form_data: JSON.stringify({ isdel: 1, id: this.id })
			})
			.end((err, res) => {
				if (err) return;
				if (res.body.code === 200) {
					message.success('删除成功');
					Base.RemoveStateSession();
					this.handleBackClick();
				} else {
					message.error(res.body.msg);
				}
			});
	}

	//@override
	//初始化
	async componentDidMount() {
		const data = this.props.location.state;
		this.fetchPackInfo(data.id);
		await this.fetchBurnDiskList();
		this._v = data._v;
		this.bodyArr = data.bodyArr;
		this.init(data);
		const { snGroupRem, otherSnGroupRem } = data;
		this.setState({
			snGroupRem: snGroupRem.split(',').filter(items => items),
			otherSnGroupRem: otherSnGroupRem.split(',').filter(items => items),
		});
	}

	fetchBurnDiskList = async () => {
		const burnDiskArr = await new Promise(resolve => {
			const token = sessionStorage.getItem('token');
			request.get(common.baseUrl('/burnDisk/getList'))
				.set("token", token)
				.query({
					page: 1,
					pageSize: 9999,
				})
				.end((err, res) => {
					const burnDiskArr = res.body.data.data.map(items => ({
						_id: items._id,
						diskName: items.diskName,
						remark: items.remark,
					}));
					resolve(burnDiskArr);
				});
		});
		this.burnDiskArr = burnDiskArr;
	}

	getPower() {
		const user_id = sessionStorage.getItem('user_id');
		const powerMap = {
			del: false,
			freeze: false,
			delivery: false,
			paid: false,
		};
		const contract_state = this.props.form.getFieldValue('contract_state') ? this.props.form.getFieldValue('contract_state') : this.props.location.state.contract_state;
		if (contract_state !== '关闭' && this.delPowerArr.includes(user_id)) {
			powerMap.del = true;
		}
		if (this.freezePowerArr.includes(user_id)) {
			powerMap.freeze = true;
		}
		if (this.deliveryPowerArr.includes(user_id)) {
			powerMap.delivery = true;
		}
		if (this.paidPowerPower.includes(user_id)) {
			powerMap.paid = true;
		}
		return powerMap;
	}

	init(data) {
		this.infoData = data;
		let fileList = [];
		const { labelProperty } = this.state;
		const powerMap = this.getPower();
		if (!powerMap.freeze) {
			labelProperty.freeze_reason.input_attr = { disabled: 'disabled' };
		}
		if (!powerMap.del) {
			labelProperty.close_reason.input_attr = { disabled: 'disabled' };
		}
		if (!powerMap.delivery) {
			labelProperty.take_person.input_attr = { disabled: 'disabled' };
		}
		if (this.checkSafe() == 1) return;
		this.id = data['id'];
		data['favo'] = Number(data['total_amount']) - Number(data['payable']);
		for (let key in labelProperty) {
			this.transToView(labelProperty, key, data);
			if (key == 'delivery_time' || key == 'take_time' || key == 'freeze_start_time' || key == 'freeze_time' || key == 'close_time') {
				labelProperty[key]['initialValue'] = moment(data[key]);
				try {
					if (!labelProperty[key].initialValue['_isValid']) labelProperty[key].initialValue = null;
				} catch (e) {

				}
				if (key == 'freeze_start_time' || key == 'freeze_time') {
					labelProperty[key].temp = <DatePicker disabled={!powerMap.freeze} />
				} else if (key == 'close_time') {
					labelProperty[key].temp = <DatePicker disabled={!powerMap.del} />
				} else if (key == 'delivery_time' || key == 'take_time') {
					labelProperty[key].temp = <DatePicker disabled={!powerMap.delivery} />
				} else {
					labelProperty[key].temp = <DatePicker />
				}
			} else if (key == 'paid') {
				labelProperty[key].temp = <InputNumber disabled={!powerMap.paid} value={labelProperty[key].initialValue} precision={2} step={500} />
			} else if (key == 'install') {
				labelProperty[key].temp = <Select>
					{
						this.installArr.map(items =>
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			} else if (key == 'isFreeze') {
				labelProperty[key].temp = <Select disabled={!powerMap.freeze}>
					{
						this.installArr.map(items =>
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			} else if (key == 'contract_state') {
				labelProperty[key].temp = <Select disabled={!powerMap.del}>
					{
						this.contractStateArr.map(items =>
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			} else if (key == 'album') {
				let _arr = [];
				try {
					_arr = labelProperty[key].initialValue.split(',');
				} catch (e) {

				}
				_arr.forEach((items, index) => {
					if (items) {
						fileList.push({
							uid: index,
							name: items,
							status: 'done',
							key: items,
							url: common.staticBaseUrl('/img/' + items)
						});
					}
				});
			} else if (key == 'snNum' || key == 'otherSnNum') {
				labelProperty[key].temp = <InputNumber defaultValue={labelProperty[key].initialValue} step={1} min={0} />;
			} else if (key === 'hardType') {
				labelProperty[key].temp = <Select mode="tags">
					{
						['V802', 'V884', 'V801', 'V800', 'V881', 'D900'].map(items =>
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			} else if (key === 'softType') {
				labelProperty[key].temp = <Select mode="multiple">
					{
						this.burnDiskArr.map(items =>
							<Select.Option title={`${items.diskName}（${items.remark}）`} key={items._id} value={items._id}>{`${items.diskName}（${items.remark}）`}</Select.Option>
						)
					}
				</Select>
			}
		}
		this.setState({
			labelProperty: labelProperty,
			fileList,
		}, () => this.uploadRenderStart = true);
	}

	sub(cb) {
		this.props.form.validateFieldsAndScroll((err, values) => {
			if (!err) {
				this.transToModel(values);
				values.id = this.id;
				delete values.delivery_state;
				values._v = this._v;
				if (this.check(values)) {
					let token = sessionStorage.getItem('token');
					request.put(common.baseUrl('/contracts/update'))
						.set("token", token)
						.send({
							form_data: JSON.stringify(values)
						})
						.end((err, res) => {
							if (err) return;
							if (res.body.code == 200) {
								this.getOrderIdItem(result => {
									// sessionState替换
									this._v = result._v;
									let stateData = Base.GetStateSession();
									let { data } = stateData;
									data.forEach((items, index) => {
										if (items.id == result.id) {
											data[index] = result;
											this.init(result);
											Base.SetStateSession(stateData);
										}
									});
									message.success('更新成功');
									if (cb) cb();
								});
							} else {
								message.error(res.body.msg);
							}
						});
				}
			}
		});
	}

	//@override
	//提交
	handleSubmit = (e) => {
		e.preventDefault();
		this.sub();
	}

	check(values) {
		let { contract_state, delivery_state, delivery_time, take_person, take_time,
			isFreeze, freeze_start_time, freeze_time, freeze_reason, close_reason, close_time } = values;
		if (contract_state != '有效') {
			if (!close_reason || !close_time) {
				message.error('关闭原因或关闭时间不能为空');
				return 0;
			}
		}
		if (isFreeze) {
			if (!freeze_start_time || !freeze_time || !freeze_reason) {
				message.error('冻结原因或冻结开始时间或冻结结束时间不能为空');
				return 0;
			}
		}
		if (delivery_state == '已发货') {
			if (!delivery_time) {
				message.error('发货日期不能为空');
				return 0;
			}
		} else if (delivery_state == '已收货') {
			if (!take_time || !take_person) {
				message.error('收货日期或收获人不能为空');
				return 0;
			}
		}
		return 1;
	}

	//@override
	transToView(labelProperty, key, data) {
		labelProperty[key]['initialValue'] = data[key];
		if (key == 'install' || key == 'complete' || key == 'isFreeze' || key == 'isDirectSale') {
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue'] ? '是' : '否';
		} else if (key == 'update_time') {
			if (moment(labelProperty[key]['initialValue'])['_isValid']) {
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		} else if (key == 'delivery_state') {
			labelProperty[key].temp = <div>
				<span style={{ marginLeft: 10 }}>{labelProperty[key].initialValue}</span>
			</div>
		} else if (key == 'hardType') {
			labelProperty[key]['initialValue'] = data[key].split(',').filter(items => items);
		} else if (key == 'softType') {
			labelProperty[key]['initialValue'] = data[key].split(',').filter(items => items);
		}
	}

	//@override
	transToModel(values) {
		values.install = values.install == '是' ? 1 : 0;
		values.complete = values.complete == '是' ? 1 : 0;
		values.isFreeze = values.isFreeze == '是' ? 1 : 0;
		values.isDirectSale = values.isDirectSale == '是' ? 1 : 0;
		values.hardType = values.hardType.join();
		values.softType = values.softType.join();
		delete values['favo'];
	}

	//操作按钮
	// @Override
	actionBtns() {
		const powerMap = this.getPower();
		return <FormItem style={{ textAlign: 'center' }}>
			<div style={{ marginTop: 40 }}>
				<Button id={"submit"} type="primary" htmlType="submit">提交</Button>
				{powerMap.del === true && <Button style={{ "marginLeft": 50 }} type="danger" onClick={this.handleDelete}>删除</Button>}
				{powerMap.del === true && this.props.location.state.contract_state != '关闭' && <Button style={{ "marginLeft": 50 }} onClick={this.returnGoods}>退货</Button>}
				<Button style={{ "marginLeft": 50 }} onClick={this.handleBackClick}>返回</Button>
			</div>
		</FormItem>
	}

	returnGoods = () => {
		const r = window.confirm('确定退货?');
		if (!r) {
			return;
		}
		const id = this.id;
		let token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/contracts/returnGoods'))
			.set("token", token)
			.send({
				id,
			})
			.end((err, res) => {
				if (err) return;
				if (res.body.code == 200) {
					message.success(res.body.msg);
					Base.RemoveStateSession();
					setTimeout(this.handleBackClick, 2000);
				} else {
					message.error(res.body.msg);
				}
			});
	}

	snGroupRemChange = v => {
		const snGroupRemArr = v.filter(items => items);
		this.setState({
			snGroupRem: snGroupRemArr,
		});
	}

	otherSnGroupRemChange = v => {
		const otherSnGroupRemArr = v.filter(items => items);
		this.setState({
			otherSnGroupRem: otherSnGroupRemArr,
		});
	}

	subSnRem = () => {
		const { snGroupRem, otherSnGroupRem } = this.state;
		const token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/contracts/subSnRem'))
			.set("token", token)
			.send({
				snGroupRem: snGroupRem.join(),
				otherSnGroupRem: otherSnGroupRem.join(),
				id: this.id,
			})
			.end((err, res) => {
				if (err) return;
				message.success(res.body.msg);
				this.getOrderIdItem(result => {
					// sessionState替换
					let stateData = Base.GetStateSession();
					let { data } = stateData;
					data.forEach((items, index) => {
						if (items.id == result.id) {
							data[index].snGroupRem = result.snGroupRem;
							data[index].otherSnGroupRem = result.otherSnGroupRem;
							Base.SetStateSession(stateData);
							setTimeout(() => {
								this.handleBackClick();
							}, 1000);
						}
					});
				});
			});
	}

	productRemList = () => {
		const user_id = sessionStorage.getItem('user_id');
		const { otherSnGroupRem, snGroupRem } = this.state;
		if (!['1006', '1101'].includes(user_id)) {
			return <div></div>;
		}
		return (
			<div style={{ marginLeft: 20, marginRight: 20, marginBottom: 60 }}>
				<Divider>生产备注</Divider>
				<div style={{ display: 'flex' }}>
					<div style={{ width: 110 }}>控制器序列号：</div>
					<Select
						mode="tags"
						style={{ width: '100%' }}
						placeholder="请输入控制器序列号"
						value={snGroupRem}
						onChange={this.snGroupRemChange}
					>
					</Select>
				</div>
				<div style={{ display: 'flex', marginTop: 10 }}>
					<div style={{ width: 110 }}>其它序列号：</div>
					<Select
						mode="tags"
						style={{ width: '100%' }}
						placeholder="请输入其它序列号"
						value={otherSnGroupRem}
						onChange={this.otherSnGroupRemChange}
					>
					</Select>
				</div>
				<div style={{ textAlign: 'center', marginTop: 20 }}>
					<Button onClick={this.subSnRem} type={'primary'}>提交备注序列号</Button>
				</div>
			</div>
		)
	}

	fetchPackInfo = contractId => {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/contracts/packingList/' + contractId))
			.set("token",token)
			.end((err,res) => {
				if(err) return;
				const packingList = res.body.data;
				packingList.forEach((items, index) => packingList[index].expressInfoList = []);
				this.setState({
					packingList,
				});
			});
	}

	renderPackList = () => {
		const { packingList, spinLoading } = this.state;
		return (
			<Spin spinning={spinLoading}>
				<Collapse style={{marginBottom: 50}} defaultActiveKey={['0']}>
					{
						packingList.map((items, index) => {
							let snArr, otherSnArr;
							try {
								snArr = items.sn.split(',').filter(items => items);
							} catch (e) {
								snArr = [];
							}
							try {
								otherSnArr = items.otherSn.split(',').filter(items => items);
							} catch (e) {
								otherSnArr = [];
							}
							return <Panel header={'#'+ (packingList.length - index)} key={index}>
								<div style={{display: 'flex'}}>
									<div style={{flex: 1}}>
										<p>
											<span>装箱人：</span>
											<span>{ items.insertPersonName }</span>
										</p>
										<p>
											<span>装箱时间：</span>
											<span>{ moment(items.insertTime).format('YYYY-MM-DD HH:mm:ss') }</span>
										</p>
										<p>
											<span>控制器序列号数量：</span>
											<span>{ snArr.length }</span>
										</p>
										<p>
											<span>控制器序列号：</span>
											<span>{ snArr.join() }</span>
										</p>
										<p>
											<span>其它序列号数量：</span>
											<span>{ otherSnArr.length }</span>
										</p>
										<p>
											<span>其他序列号：</span>
											<span>{ otherSnArr.join() }</span>
										</p>
										<p>
											<span>发货时间：</span>
											<span>{ items.sendTime ? moment(items.sendTime).format('YYYY-MM-DD HH:mm:ss') : '' }</span>
										</p>
										<p>
											<span>发货类型：</span>
											{ items.isSend == 0 && <span>
												<Button onClick={() => this.subDeliveryInfo(items.id, '送货')} size={'small'}>送货</Button>
												<Button onClick={() => this.subDeliveryInfo(items.id, '自提')} size={'small'} style={{marginLeft: 12}}>自提</Button>
												<Button onClick={() => this.inputExpressNo(items.id, '快递')} size={'small'} style={{marginLeft: 12}}>快递</Button>
											</span> }
											{ items.isSend == 1 && <span>{ items.sendType ? items.sendType : '' }</span> }
										</p>
										<p>
											<span>快递单号：</span>
											<span>{ items.expressNo ? <span>{items.expressNo}<Button onClick={() => this.queryExpress(items.expressNo)} style={{marginLeft: 6}} size={'small'}>查询</Button></span> : '' }</span>
										</p>
									</div>
									<div style={{flex: 1}}>
										{
											items.expressInfoList.map(items => (
												<p style={{display: 'flex'}}>
													<p style={{width: 160}}>{ items.time }</p>
													<p style={{flex: 1}}>{ items.status }</p>
												</p>
											))
										}
									</div>
								</div>
							</Panel>
						})
					}
				</Collapse>
			</Spin>
		)
	}

	inputExpressNo = (id, sendType) => {
		const self = this;
		let no;
		Modal.confirm({
			icon: <span></span>,
            title: '新增快递单号',
            content: <Input onChange={e => no = e.target.value} />,
            onOk() {
				if (!no) {
					message.error('单号不能为空');
					return;
				}
                return new Promise(async (resolve, reject) => {
					await self.subDeliveryInfo(id, sendType, no);
					resolve();
                });
            },
            onCancel() { },
		});
	}

	subDeliveryInfo = async (id, sendType, expressNo) => {
		const self = this;
		await new Promise(resolve => {
			const token = sessionStorage.getItem('token');
			request.put(common.baseUrl('/productOrder/updateExpressNoInPacking'))
				.set("token",token)
				.send({ id, sendType, expressNo })
				.end((err,res) => {
					if (err) return;
					message.success(res.body.msg);
					self.fetchPackInfo(self.props.location.state.id);
					resolve();
				});
		});
	}

	queryExpress = no => {
		const { packingList } = this.state;
		this.setState({
			spinLoading: true,
		});
		let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/contracts/queryExpress/' + no))
            .set("token",token)
            .end((err,res) => {
				if (err) return;
				if (res.body.data.status != '0') {
					message.error(res.body.data.msg);
				}
				const list = res.body.data.result.list;
				packingList.forEach((items, index) => {
					if (items.expressNo === no) {
						packingList[index].expressInfoList = list;
					}
				});
				this.setState({
					spinLoading: false,
					packingList,
				});
			});
	}

	render() {
		if (!this.uploadRenderStart) return <div></div>;
		let record = this.state.labelProperty;
		const { spinning } = this.state;
		const { getFieldDecorator } = this.props.form;
		const formItemLayout = {
			labelCol: {
				xs: { span: 6 },
			},
			wrapperCol: {
				xs: { span: 12 },
			},
		};
		const formItem = [];
		const default_rules = [];
		for (let i in record) {
			let default_temp;
			try {
				if (record[i].input_attr['disabled'] == 'disabled') {
					default_temp = <Input disabled={true} />;
				} else {
					default_temp = <Input />;
				}
			} catch (e) {
				default_temp = <Input />;
			}
			let rules = record[i].rules ? record[i].rules : default_rules;
			let temp = record[i].temp ? record[i].temp : default_temp;
			if (i == 'album') {
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
			} else {
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
			<Spin spinning={spinning}>
				<div>
					<Form onSubmit={this.handleSubmit} style={{ padding: 24 }}>
						<div className="dadContainer">
							{
								formItem.map((items, index) =>
									<div key={index} className="son">{items}</div>
								)
							}
						</div>
						{this.actionBtns()}
					</Form>
					{this.productRemList()}
					<Divider>装箱单</Divider>
					{ this.renderPackList() }
					<ModalTemp
						handleModalCancel={this.handleModalCancel}
						handleModalDefine={this.handleModalDefine}
						ModalText={this.state.modalText}
						visible={this.state.visible} />
				</div>
			</Spin>
		)
	}
}

const ContractEdit = Form.create()(ContractEditTemp);

export default ContractEdit;