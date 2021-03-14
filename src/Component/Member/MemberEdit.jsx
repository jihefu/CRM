import React, { Component } from 'react';
import { Form,Drawer, Input, message, Select, Button, AutoComplete,Divider,Table,Rate, Checkbox, Statistic, Row, Col, Empty, Icon, Upload, Modal, InputNumber, DatePicker, TimePicker, Radio } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import crypto from 'crypto';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import '../../public/css/Common.css'
import ModalTemp from '../common/Modal';
import BaseEditList from '../common/BaseEditList.jsx';
import Base from '../../public/js/base.js';
import RemList from '../common/RemList.jsx';
import TrainLog from './TrainLog';
import InfiniteScroll from 'react-infinite-scroller';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;
const { TextArea } = Input;
const { confirm } = Modal;

export class MemberEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.verifiedChange = this.verifiedChange.bind(this);
		this.initReadOnly = this.initReadOnly.bind(this);
		this.searchChange = this.searchChange.bind(this);
		this.handleRecover = this.handleRecover.bind(this);
		this.deleteUrl = '/member/delMember';
		this.target_key_prefix = '/member/';
		this.data;
		this.checkBoxArr = ['name','portrait','phone','company','job','birth','qq','addr','college','major'];
		this.witnessRelationArr = ['员工','同事','同学','亲属','朋友'];
		this.jobArr = ['法人','合伙人','注册人','财务','采购','开发','其它'];
		this.stateArr = ['待认证','未通过','申请认证'];
		// this.verifiedArr = ['是','否'];
		this.state.labelProperty = {
			name: {label: '姓名',input_attr: {disabled: 'disabled'}},
			portrait: {label: '本人头像',input_attr: {disabled: 'disabled'}},
			gender: {label: '性别',input_attr: {disabled: 'disabled'}},
			phone: {label: '手机号码',input_attr: {disabled: 'disabled'}},
			// typeCode: {label: '会员类型'},
			company: {label: '公司',input_attr: {}},
			job: {label: '职位',input_attr: {}},
			witness: {label: '证明人',input_attr: {}},
			witnessRelation: {label: '关系',input_attr: {}},
			state: {label: '认证状态',input_attr: {}},
			check_person: {label: '认证人',input_attr: {disabled: 'disabled'}},
			birth: {label: '生日',input_attr: {disabled: 'disabled'}},
			qq: {label: '常用社交帐号',input_attr: {disabled: 'disabled'}},
			addr: {label: '地址',input_attr: {disabled: 'disabled'}},
            college: {label: '毕业院校',input_attr: {disabled: 'disabled'}},
			major: {label: '专业',input_attr: {disabled: 'disabled'}},
            addr: {label: '地址',input_attr: {disabled: 'disabled'}},
            submit_time: {label: '会员申请时间',input_attr: {disabled: 'disabled'}},
			update_person: {label: '审核人',input_attr: {disabled: 'disabled'}},
			check_time: {label: '审核时间',input_attr: {disabled: 'disabled'}},
			familiar_degree: { label: '熟悉度' },
			tech_match: { label: '技术匹配程度' },
			isEnterpriseWx: { label: '企业微信' },
			// evaluate: {label: '评估分'}
		}
		this.state.typeKey = '';
		this.state.dataSource = [];
		this.state.staffSource = [];
		this.state.memberScore = {
			basic: 0, 
			business: 0,
			certificate: 0,
			cooper: 0,
			activity: 0,
			total: 0,
		};
		this.state.drawerVisible = false;
		this.type;
		this.state.refreshCount = 0;
		this.addAlbumArr = [];
	};

	//@Override
	//初始化
	componentDidMount(){
		let data = this.props.location.state;
		this.fetchMemberScore(data.open_id);
		this.data = data;
		const user_id = sessionStorage.getItem('user_id');
		let fileList = [];
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
		this.id = data['id'];
		for(let key in labelProperty){
			this.transToView(labelProperty,key,data);
			if(key=='state'){
				labelProperty[key].temp = <Select onChange={this.verifiedChange}>
					{
						this.stateArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			}else if(key=='portrait'){
				if(labelProperty[key].initialValue){
					labelProperty[key].temp = <a target="_blank" href={common.staticBaseUrl('/img/member/'+labelProperty[key].initialValue)}>
						<img src={common.staticBaseUrl('/img/member/'+labelProperty[key].initialValue)} style={{width: 35}} />
					</a>
				}else{
					labelProperty[key].temp = <span></span>
				}	
			} else if(key=='familiar_degree') {
				labelProperty[key].temp = <Rate tooltips={['见过一面', '偶尔联系', '经常联系', '铁粉']} count={4} value={labelProperty[key].initialValue} onChange={this.familiarRateChange} />
			} else if(key=='tech_match') {
				labelProperty[key].temp = <Rate tooltips={['不费劲', '很对口']} count={2} value={labelProperty[key].initialValue} onChange={this.techRateChange} />
			} else if (key=='typeCode') {
				labelProperty[key].initialValue = common.getCodeArr(labelProperty[key].initialValue);
				const options = [
					{ label: '员工', value: 0 },
					{ label: '客户', value: 1 },
					{ label: '用户', value: 2 },
					{ label: '供应商', value: 4 },
					{ label: '公共关系', value: 8 }
				];
				labelProperty[key].temp = <Checkbox.Group options={options} onChange={() => {this.initReadOnly(this.state.labelProperty['state'].initialValue)}} />
			} else if (key=='isEnterpriseWx') {
				labelProperty[key].temp = <Radio.Group style={{ marginTop: 4 }}>
                        <Radio value={0}>否</Radio>
                        <Radio value={1}>是</Radio>
                    </Radio.Group>
			}
		}
		this.setState({
			labelProperty,
			fileList,
			typeKey: data['id']
		},() => {
			this.uploadRenderStart = true;
			this.type = data['witnessRelation'];
			this.getRegColleague(data['company']);
			this.fetchAllStaff();
			this.initReadOnly(data['state']);
		});
	}

	fetchMemberScore = open_id => {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/member/getMemberScore/' + open_id))
			.set("token",token)
			.end((err, res) => {
				this.setState({
					memberScore: res.body.data,
				});
			})
	}

	//初始化是否只读
	initReadOnly(v){
		let selectData;
		if(this.type=='员工'){
			selectData = this.state.staffSource;
		}else{
			selectData = this.state.dataSource;
		}
		const { labelProperty } = this.state;
		if (this.props.location.state.isUser == 1) {
			labelProperty.witness.input_attr = {disabled: 'disabled'};
			labelProperty.company.input_attr = {disabled: 'disabled'};
			labelProperty.job.input_attr = {disabled: 'disabled'};
			labelProperty.witnessRelation.input_attr = {disabled: 'disabled'};
			labelProperty.state.input_attr = {disabled: 'disabled'};
			delete labelProperty.witnessRelation.temp;
			delete labelProperty.job.temp;
			delete labelProperty.company.temp;
			delete labelProperty.witness.temp;
			delete labelProperty.state.temp;
		} else {
			if(v=='已认证'){
				labelProperty.witness.input_attr = {disabled: 'disabled'};
				labelProperty.company.input_attr = {disabled: 'disabled'};
				labelProperty.job.input_attr = {disabled: 'disabled'};
				labelProperty.witnessRelation.input_attr = {disabled: 'disabled'};
				delete labelProperty.witnessRelation.temp;
				delete labelProperty.job.temp;
				delete labelProperty.company.temp;
				delete labelProperty.witness.temp;
			}else{
				labelProperty.witness.input_attr = {};
				labelProperty.company.input_attr = {};
				labelProperty.job.input_attr = {};
				labelProperty.witnessRelation.input_attr = {};
				labelProperty.witnessRelation.temp = <Select onChange={(v) => {
					this.type = v;
					this.initReadOnly(this.state.labelProperty['state'].initialValue);
				}}>
						{
							this.witnessRelationArr.map(items => 
								<Select.Option key={items} value={items}>{items}</Select.Option>
							)
						}
					</Select>
				labelProperty['job'].temp = <Select mode="multiple" tokenSeparators={[',']}>
					{
						this.jobArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
				let typeCode = 0;
				try {
					const typeCodeArr = this.props.form.getFieldValue('typeCode');
					typeCodeArr.forEach((items, index) => {
						typeCode += items;
					});
				} catch (e) {
					
				}
				labelProperty['company'].temp = <RemoteSelectRandom onChange={(v) => this.searchChange(v)} remoteUrl={common.baseUrl('/common/searchCpy?keywords=')} defaultValue={labelProperty['company'].initialValue} />
				labelProperty.witness.temp = <Select>
						{
							selectData.map(items => 
								<Option key={items} value={items}>{items}</Option>
							)
						}
					</Select>
			}
		}
		this.setState({
			labelProperty
		});
	}

	searchChange(v){
		this.props.form.setFieldsValue({
			company: v
		});
		let { labelProperty } = this.state;
		labelProperty['company'].initialValue = v;
		this.setState({
			labelProperty
		},() => {
			this.getRegColleague(v);
		});
	}

	//获取相关公司同事信息
	getRegColleague(company){
		let token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/member/getRegColleague'))
			.set("token",token)
			.query({
				company: company
			})
			.end((err,res) => {
				if(err) return;
				this.setState({
					dataSource: res.body.data
				},() => {
					this.initReadOnly(this.state.labelProperty['state'].initialValue);
				});
			});
	}

	//获取所有员工信息
    fetchAllStaff(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
				if(err) return;
				const staffSource = [];
                res.body.data.forEach(items => {
                    staffSource.push(items.user_name);
				});
				this.setState({
					staffSource: staffSource
				},() => {
					this.initReadOnly(this.state.labelProperty['state'].initialValue);
				});
            });
	}

	//认证状态改变
	verifiedChange(v){
		if(v=='已认证'){
			$('input[name="checkbox_company"],input[name="checkbox_job"]').prop('checked',true);
		}else{
			$('input[name="checkbox_company"],input[name="checkbox_job"]').prop('checked',false);
		}
		const { labelProperty } = this.state;
		labelProperty['state'].initialValue = v;
		this.setState({
			labelProperty
		},() => {
			this.initReadOnly(v);
			const user_name = sessionStorage.getItem('user_name');
			this.props.form.setFieldsValue({
				check_person: user_name
			});
		});
	}

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key]; 
		if(key=='submit_time'||key=='check_time'){
			if(moment(labelProperty[key]['initialValue'])['_isValid']){
				labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD HH:mm:ss');
			}
		}else if(key=='job'){
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue'].split(',');
		}else if(key=='familiar_degree' || key=='tech_match'){
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue'] * 10;
		}
	}

	transToModel(values){
		// values.checked = values.checked=='是'?1:0;
	}

	evaChange = (original, present, type) => {
		const content = type + '从' + original * 10 + '星改为' + present * 10 + '星';
		const token = sessionStorage.getItem('token');
		request.post(common.baseUrl('/rem/add'))
            .set("token", token)
            .send({
				type: 'Member',
				typeKey: this.props.location.state.id,
				content,
            })
            .end((err, res) => {});
	}

	//@override
	//提交
	handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.id = this.id;
				if(values.state=='申请认证'){
					if(!values.company||!values.job||!values.witness||!values.witnessRelation){
						message.warn('认证相关信息不能为空');
						return;
					}
				}
				values.job = values.job.join();
				this.checkBoxArr.forEach((items,index) => {
					if($('input[name="checkbox_'+items+'"]').prop('checked')){
						values['check_'+items] = 1;
					}else{
						values['check_'+items] = 0;
					}
				});
				values.familiar_degree = values.familiar_degree / 10;
				values.tech_match = values.tech_match / 10;
				values.evaluate = values.familiar_degree + values.tech_match;
				if (Number(values.familiar_degree) !== Number(this.props.location.state.familiar_degree)) {
					this.evaChange(this.props.location.state.familiar_degree, values.familiar_degree, '熟悉度');
				}
				if (Number(values.tech_match) !== Number(this.props.location.state.tech_match)) {
					this.evaChange(this.props.location.state.tech_match, values.tech_match, '技术匹配程度');
				}

				/*********************************************************************/
				if(values.checked||values.state=='申请认证'){
					if(values.name==values.witness){
						message.warn('证明人与当前会员重名！');
						return;
					}
				}
				// if (values.typeCode.length === 0) return message.error('请至少选择一种会员类型');
				let codeNum = 0;
				// values.typeCode.forEach(items => codeNum += items);
				// values.typeCode = codeNum;
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/member/subCheck'))
		            .set("token",token)
		            .send({
		                form_data: JSON.stringify(values)
		            })
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
							this.getOrderIdItem(result => {
								//sessionState替换
								let stateData = Base.GetStateSession();
								let { data } = stateData;
								data.forEach((items,index) => {
									if(items.id==result.id){
										const { canChangeScore } = data[index];
										data[index] = result;
										data[index].canChangeScore = canChangeScore;
										Base.SetStateSession(stateData);
									}
								});
								message.success('更新成功');
								this.handleBackClick();
							});
		            	}else{
		            		message.error(res.body.msg);
		            	}
		            });
			}
		});
	}

	//@override
	handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .send({
				id: this.id,
			})
            .end((err,res) => {
                if(err) return;
				let stateData = Base.GetStateSession();
				let { data } = stateData;
				data.forEach((items,index) => {
					if(items.id==this.id){
						data.splice(index, 1);
						// data[index] = result;
						Base.SetStateSession(stateData);
					}
				});
				message.success('删除成功');
				this.handleBackClick();
            });
	}
	
	//@override
	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
					{ this.data.isdel==0 && <Button style = {{"marginLeft":50}} type="danger" onClick={this.handleDelete}>删除</Button> }
					{ this.data.isdel==1 && <Button style = {{"marginLeft":50}} type="danger" onClick={this.handleRecover}>恢复</Button> }
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
					<Button style={{"marginLeft":50}} onClick={this.showMsgList}>私信</Button>
                </FormItem>
	}

	showMsgList = () => {
		this.setState({
			drawerVisible: true,
		});
	}
	
	handleRecover() {
		let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/member/recoverMember'))
            .set("token",token)
            .send({
				id: this.id,
			})
            .end((err,res) => {
                if(err) return;
				let stateData = Base.GetStateSession();
				let { data } = stateData;
				data.forEach((items,index) => {
					if(items.id==this.id){
						data.splice(index, 1);
						Base.SetStateSession(stateData);
					}
				});
				message.success(res.body.msg);
				this.handleBackClick();
            });
	}

	componentDidUpdate(){
		if($('input[name="checkbox_name"]').length!=0) return;
		this.checkBoxArr.forEach((items,index) => {
			$('label[for="'+items+'"]').before('<input name="checkbox_'+items+'" style="position: relative;top: 3px;right: 4px;" type="checkbox" />');
			let checked;
			if(this.data['check_'+items]==1){
				$('input[name="checkbox_'+items+'"]').prop('checked',true);
			}else{
				$('input[name="checkbox_'+items+'"]').prop('checked',false);
			}
			if(items=='name'||items=='phone'||items=='company'||items=='job'){
				$('input[name="checkbox_'+items+'"]').prop('disabled','disabled');
			}
		});
	}

	renderScore = () => {
		const { memberScore } = this.state;
		const { basic, business, certificate, cooper, activity, total } = memberScore;
		return (
			<Row gutter={16} style={{textAlign: 'center', margin: 20}}>
				<Col span={4}>
					<Statistic title="基本分" value={basic} />
				</Col>
				<Col span={4}>
					<Statistic title="商务分" value={business} />
				</Col>
				<Col span={4}>
					<Statistic title="认证分" value={certificate} />
				</Col>
				<Col span={4}>
					<Statistic title="合作分" value={cooper} />
				</Col>
				<Col span={4}>
					<Statistic title="活动分" value={activity} />
				</Col>
				<Col span={4}>
					<Statistic title="总分" value={total} />
				</Col>
			</Row>
		)
	}

	uploadProps = () => {
		let token = sessionStorage.getItem('token');
		let props = {
			action: common.baseUrl('/notiClient/imgUpload'),
			headers: {
				token: token
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList: [],
			multiple: false,
			onChange: (res) => {
				if(res.file.status=='done'){
					const file_name = res.file.response.data[0];
					this.addAlbumArr.push(file_name);
				}
			},
			onRemove: (result) => {
				const file_name = result.response.data[0];
				this.addAlbumArr = this.addAlbumArr.filter(items => items != file_name);
			}
		};
		return props;
    }

	addCustomMsg = () => {
		const { refreshCount } = this.state;
		const self = this;
		const open_id = this.data.open_id;
		const user_id = sessionStorage.getItem('user_id');
		let sendDate, sendTime, title, content, album;
		let sender = open_id;
		this.addAlbumArr = [];
		Modal.confirm({
			icon: <span></span>,
            title: '',
            content: <div>
				<div style={{display: 'flex'}}>
					<div style={{width: 80, position: 'relative', top: 5}}>发送时间：</div>
					<div style={{flex: 1, display: 'flex'}}>
						<DatePicker onChange={v => sendDate = v} /> <TimePicker onChange={v => sendTime = v} style={{marginLeft: 12}} />
					</div>
				</div>
				<div style={{display: 'flex', marginTop: 12}}>
					<div style={{width: 80}}>发送方：</div>
					<div style={{flex: 1}}>
						<Radio.Group onChange={e => sender = e.target.value} defaultValue={sender}>
							<Radio value={open_id}>会员</Radio>
							<Radio value={user_id}>管理员</Radio>
						</Radio.Group>
					</div>
				</div>
				{/* <div style={{display: 'flex', marginTop: 12}}>
					<div style={{width: 104}}>标题：</div>
					<Input placeholder="标题" onChange={e => title = e.target.value} />
				</div> */}
				<div style={{display: 'flex', marginTop: 12}}>
					<div style={{width: 104}}>内容：</div>
					<TextArea placeholder="内容" style={{ height: 100 }} onChange={e => content = e.target.value}></TextArea>
				</div>
				<div style={{display: 'flex', marginTop: 12}}>
					<div style={{width: 78}}>图片：</div>
					<Upload {...this.uploadProps()}>
						<Button><Icon type="upload" />上传</Button>
					</Upload>
				</div>
			</div>,
			async onOk() {
				const { addAlbumArr } = self;
				if (!sendDate) {
					message.error('发送日期不能为空');
					return;
				}
				if (!sendTime) {
					message.error('发送时间不能为空');
					return;
				}
				if (!content) {
					message.error('内容不能为空');
					return;
				}
				const post_time = sendDate.format('YYYY-MM-DD') + ' ' + sendTime.format('HH:mm:ss');
				const formData = {
					post_time,
					open_id,
					content,
				};
				if (/^\d+$/.test(sender)) {
					formData.admin_id = sender;
				}
				if (addAlbumArr.length !== 0) {
					formData.album = addAlbumArr.join();
				}
				await new Promise(resolve => {
					const token = sessionStorage.getItem('token');
					request.post(common.baseUrl('/member/addCustomMiddleMsg'))
						.set("token", token)
						.send(formData)
						.end((err,res) => {
							if (err) return;
							message.success(res.body.msg);
							resolve();
						});
				});
				self.setState({
					refreshCount: refreshCount + 1,
				});
			},
			onCancel() {},
		});
	}

	//@overload
	render() {
		const { drawerVisible } = this.state;
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
		    		default_temp = <Input />;
		    	}
	    	}catch(e){
	    		default_temp = <Input />;
	    	}
	    	let rules = record[i].rules?record[i].rules:default_rules;
			let temp = record[i].temp?record[i].temp:default_temp;
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
		return (
			<div>
				{ this.renderScore() }
				<Form onSubmit={this.handleSubmit} style={{padding: 24}}>
					<div className = "dadContainer">
						{
							formItem.map((items,index) =>
								<div key={index} className = "son">{items}</div>
							)
						}
					</div>
					<TrainLog open_id={this.data.open_id}></TrainLog>
					<RemList type={'Member'} typeKey={this.state.typeKey}></RemList>
					{this.actionBtns()}
				</Form>
				<Divider>元宝分</Divider>
				<YBScoreList open_id={this.data.open_id} user_id={this.data.user_id}></YBScoreList>
				<ModalTemp 
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    ModalText={this.state.modalText} 
                    visible={this.state.visible} />
				{ drawerVisible && <Drawer
					title={<div style={{display: 'flex', marginTop: 12, justifyContent: 'space-between'}}>
						<div>{this.data.name}</div>
						<Button onClick={this.addCustomMsg}>后补消息</Button>
					</div>}
					width={600}
					placement="right"
					closable={false}
					onClose={() => this.setState({ drawerVisible: false })}
					visible={drawerVisible}
				>
					<MemberMsgList refreshCount={this.state.refreshCount} open_id={this.data.open_id}></MemberMsgList>
				</Drawer> }
			</div>
		)
	}
}

const MemberEdit = Form.create()(MemberEditTemp);

export default MemberEdit;

export class MemberMsgList extends Component {
	constructor(props) {
		super(props);
		this.hasMore = true;
		this.isLoading = false;
		this.msgTitle = '';
		this.msgContent = '';
	}

	state = {
		data: [],
		page: 1,
		pageSize: 30,
		titleDataSource: ['发货提醒', '温馨提醒'],
		contentDataSource: ['您的U盘已发货，请留意快递信息！（快递单号：）'],
		albumArr: [],
	};

	componentDidMount() {
		this.fetch();
	}

	componentWillReceiveProps() {
		this.hasMore = true;
		this.isLoading = false;
		this.setState({
			page: 1,
			data: [],
		}, () => {
			this.fetch();
		});
	}

	fetch = () => {
		const { page, pageSize } = this.state;
		const { hasMore, isLoading } = this;
		if (isLoading || !hasMore) {
			return;
		}
		this.isLoading = true;
		const { open_id } = this.props;
		const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/member/getMiddleMsg'))
            .set("token", token)
            .query({
                page,
				pageSize,
				open_id,
            })
            .end((err,res) => {
				if (err) return;
				this.isLoading = false;
				res.body.data = res.body.data.reverse();
				if (res.body.data.length === 0) {
					this.hasMore = false;
				}
				let { data } = this.state;
				data = [...res.body.data, ...data];
				this.setState({
					data,
					page: page + 1,
				}, () => {
					if (page === 1) {
						const len = document.getElementsByClassName('chats').length;
						document.getElementsByClassName('chats')[len - 1].scrollTop = 10000;
					}
				});
			});
	}

	renderAlbum = album => {
		let albumArr;
		try {
			albumArr = album.split(',').filter(items => items);
		} catch (e) {
			albumArr = [];
		}
		return albumArr.map((items, index) => (
			<a target={'_blank'} key={items + index} href={common.staticBaseUrl(`/img/notiClient/${items}`)}>
				<img style={{width: 30, marginRight: 12}} src={common.staticBaseUrl(`/img/notiClient/${items}`)} />
			</a>
		))
	}

	renderMsg = () => {
		const { data } = this.state;
		return data.map(items => {
			const { openid } = items;
			let popPosition;
			if (openid) {
				popPosition = 'ant-popover-placement-leftTop';
			} else {
				popPosition = 'ant-popover-placement-rightTop';
			}
			return (
				<div key={items.id} style={{marginBottom: 20}}>
					<div style={{textAlign: 'left'}}>
						
					</div>
					<div className={popPosition} style={{position: 'relative', width: 520}}>
						<div className={"ant-popover-content"}>
							<div className={"ant-popover-arrow"}></div>
							<div className={"ant-popover-inner"}>
								<div>
									<div className={"ant-popover-title"} style={{fontWeight: 'bold'}}>
										<span>{items.title}</span>
										<span style={{marginLeft: 6}}>{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
										{ items.is_read == 0 && <span style={{fontWeight: 'normal', marginLeft: 6, color: '#999', fontSize: 12}}>未读</span> }
									</div>
									<div className={"ant-popover-inner-content"}>
										<div>
											<p style={{marginBottom: 0,wordBreak: 'break-all',wordWrap: 'break-word'}}>
												{ items.message }
											</p>
											{ this.renderAlbum(items.album) }
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)
		});
	}

	handleSend = () => {
		const { msgTitle, msgContent } = this;
		const { albumArr } = this.state;
		const { open_id } = this.props;
		if (!msgTitle || !msgContent) {
			message.warn('不能为空');
			return;
		}
		const album = albumArr.join();
		const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/member/sendMiddleMsg'))
            .set("token", token)
            .send({
				open_id,
				title: msgTitle,
				content: msgContent,
				album,
            })
            .end((err,res) => {
				if (err) return;
				message.success(res.body.msg);
				this.hasMore = true;
				this.isLoading = false;
				this.setState({
					page: 1,
					data: [],
					albumArr: [],
				}, () => {
					this.fetch();
				});
			});
	}

	uploadProps = () => {
		let token = sessionStorage.getItem('token');
		let { albumArr } = this.state;
		let props = {
			action: common.baseUrl('/notiClient/imgUpload'),
			headers: {
				token: token
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList: [],
			multiple: false,
			onChange: (res) => {
				if(res.file.status=='done'){
					const file_name = res.file.response.data[0];
					albumArr.push(file_name);
					this.setState({
						albumArr,
					});
				}
			},
			onRemove: (result) => {
				const file_name = result.response.data[0];
				albumArr = albumArr.filter(items => items != file_name);
				this.setState({
					albumArr,
				});
			}
		};
		return props;
    }

	render() {
		const { data, page, titleDataSource, contentDataSource } = this.state;
		const maxHeight = window.innerHeight - 400;
		if (data.length === 0) {
			return <Empty></Empty>
		}
		return (
			<div>
				<div className={'chats'} style={{ overflow: 'auto', maxHeight }}>
					<InfiniteScroll
						initialLoad={false}
						pageStart={page}
						isReverse={true}
						loadMore={this.fetch}
						hasMore={this.hasMore}
						useWindow={false}
						threshold={1}
					>
						{ this.renderMsg() }
					</InfiniteScroll>
				</div>
				<AutoComplete
					dataSource={titleDataSource}
					style={{ width: '100%' }}
					onSelect={v => this.msgTitle = v}
					onSearch={v => this.msgTitle = v}
					placeholder="标题"
				/>
				<AutoComplete
					dataSource={contentDataSource}
					style={{ width: '100%', marginTop: 6 }}
					onSelect={v => this.msgContent = v}
					onSearch={v => this.msgContent = v}
					defaultActiveFirstOption={false}
				>
					<TextArea placeholder="内容" style={{ height: 100 }}></TextArea>
				</AutoComplete>
				<div style={{display: 'flex', marginTop: 12, justifyContent: 'space-between'}}>
					<Upload {...this.uploadProps()}>
						<Button><Icon type="upload" />图片</Button>
					</Upload>
					<Button type={'primary'} style={{marginLeft: 12}} onClick={this.handleSend}>发送</Button>
				</div>
			</div>
			
		)
	}
}

class YBScoreList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			list: [],
			total: 0,
			inputType: '',
			inputScore: 100,
		};
	}

	componentDidMount() {
		this.fetch();
	}

	fetch = () => {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/member/getScoreTicketByUid'))
			.set("token",token)
			.query({
				user_id: this.props.user_id,
				page: 1,
				pageSize: 9999,
			})
			.end((err, res) => {
				this.setState({
					list: res.body.data.ticketList,
					total: res.body.data.ticketScore,
				});
			})
	}

	typeChange = e => {
		const v = e.target.value;
		this.setState({
			inputType: v,
		});
	}

	scoreChange = v => {
		this.setState({
			inputScore: v,
		});
	}

	subYBScoreTicket = async (type, score) => {
		const { open_id } = this.props;
		if (!type) {
			message.error('不能为空');
			return;
		}
		await new Promise(resolve => {
			const token = sessionStorage.getItem('token');
			request.post(common.baseUrl('/member/inputYBScoreByCustom'))
				.set("token",token)
				.send({
					openIdArr: [open_id],
					score,
					activityId: type,
					type,
				})
				.end((err, res) => {
					resolve();
					if (err) {
						message.error(err.message);
						return;
					}
					message.success(res.body.msg);
					this.fetch();
					setTimeout(this.fetch, 1000);
				})
		});
	}

	showConfirm = () => {
		const self = this;
		const { inputType, inputScore } = this.state;
		confirm({
			icon: <span></span>,
			content: <div>
				<div style={{display: 'flex'}}>
					<div style={{width: 50}}>券名：</div>
					<Input onChange={self.typeChange} defaultValue={inputType} />
				</div>
				<div style={{display: 'flex', marginTop: 12}}>
					<div style={{width: 44}}>分值：</div>
					<InputNumber onChange={self.scoreChange} min={-10000} max={10000} step={100} defaultValue={inputScore} />
				</div>
			</div>,
			onOk() {
				const { inputType, inputScore } = self.state;
				return new Promise(async (resolve, reject) => {
					await self.subYBScoreTicket(inputType, inputScore);
					resolve();
				});
			},
		});
	}

	render() {
		const { list, total } = this.state;
		const user_id = sessionStorage.getItem('user_id');
		const columns = [
			{
			  title: '类型',
			  dataIndex: 'rem',
			  key: 'rem',
			},
			{
				title: '分值',
				dataIndex: 'score',
				key: 'score',
			},
			{
			  title: '创建时间',
			  dataIndex: 'create_time',
			  key: 'create_time',
			},
			{
				title: '创建人',
				dataIndex: 'create_person_name',
				key: 'create_person_name',
				width: 100,
			},
		];
		const hasPower = common.powerCheckMeetOrder.includes(user_id);
		return (
			<div>
				{ hasPower && <Button onClick={this.showConfirm} style={{marginBottom: 12, marginLeft: 12}}>新增</Button> }
				<Table dataSource={list} columns={columns} footer={() => <span style={{fontWeight: 'bold'}}>总元宝分：{total}</span>} />
			</div>
		)
	}
}