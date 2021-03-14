import React from 'react';
import { Button,message,Form,Input,Select,Upload,Icon, Divider, Modal } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import AppList from './AppList.jsx';
import moment from 'moment';
import ModalTemp from '../common/Modal.jsx';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import BaseEditList from '../common/BaseEditList.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;

class VirProductsEditCls extends BaseEditList {
    constructor(props){
        super(props);
        this.uploadRenderStart = true;
        this.target_key_prefix = '/virProducts/';
        this.updatePathname = '/virProducts/' + this.props.location.state.id;
        this.id = this.props.location.state.id;
		this.modelArr = /^D/.test(this.props.location.state.model) ? [ 'D700', 'D900', 'D910', 'D921' ] : [ 'V884', 'V881', 'V802', 'V801', 'V800', 'AD800' ];
        this.staffArr = [];
		this.state.labelProperty = {
            serialNo: {label: '序列号', input_attr: {disabled: 'disabled'}},
            model: { label: '型号', temp: <Select onChange={() => {}}>
                        {
                            this.modelArr.map(items => 
                                <Select.Option key={items} value={items}>{items}</Select.Option>
                            )
                        }
			</Select>},
			batch: {label: '批次'},
			inputDate: {label: '组装日期', input_attr: {disabled: 'disabled'}},
			maker: {label: '组装人', input_attr: {disabled: 'disabled'}},
			tester: {label: '测试人', input_attr: {disabled: 'disabled'}},
			isTest: {label: '是否测试', input_attr: {disabled: 'disabled'}},
			isPass: {label: '是否合格', input_attr: {disabled: 'disabled'}},
			testTime: {label: '测试日期', input_attr: {disabled: 'disabled'}},
			status: {label: '产品状态', input_attr: {disabled: 'disabled'}},
			scrappedRem: {label: '报废说明', input_attr: {disabled: 'disabled'}},
			storage: {label: '存放地', input_attr: {disabled: 'disabled'}},
			chnlNum: {label: '通道数'},
			caliCoeff: {label: '标比'},

			isDirectSale: {label: '是否直销', input_attr: {disabled: 'disabled'}},
			contract_no: {label: '合同号', input_attr: {disabled: 'disabled'}},
			dealer: {label: '客户', input_attr: {disabled: 'disabled'}},
			purchase: {label: '客户采购人', input_attr: {disabled: 'disabled'}},
			salesman: {label: '业务员', input_attr: {disabled: 'disabled'}},
			sign_time: {label: '签订时间', input_attr: {disabled: 'disabled'}},
			
			modelCode: {label: '型号编码', input_attr: {disabled: 'disabled'}},
			fwVer: {label: '固件版本', input_attr: {disabled: 'disabled'}},
			authType: {label: '规格', input_attr: {disabled: 'disabled'}},
			oemUser: {label: '用户软件许可', input_attr: {disabled: 'disabled'}},
			VBGN: {label: '名义试用起始', input_attr: {disabled: 'disabled'}},
            VEND: {label: '名义试用终止', input_attr: {disabled: 'disabled'}},
			machineNo: {label: '机器码'},
			latestRegNo: {label: '注册码', input_attr: {disabled: 'disabled'}},
			validTime: {label: '注册状态', input_attr: {disabled: 'disabled'}},
			ad2Mode: {label: 'AD采集模式', input_attr: {disabled: 'disabled'}},
            pulseMode: {label: 'PM脉冲模式', input_attr: {disabled: 'disabled'}},
            vibFreq: {label: 'DA伺服颤振频率', input_attr: {disabled: 'disabled'}},
            vibAmp: {label: 'DA伺服颤振幅值', input_attr: {disabled: 'disabled'}},
            SPWM_AC_AMP: {label: 'SPWM交流幅值', input_attr: {disabled: 'disabled'}},
            SSI_MODE: {label: 'DIO模式', input_attr: {disabled: 'disabled'}},
            HOURS: {label: '已用小时数', input_attr: {disabled: 'disabled'}},
			EMP_NO: {label: '最近操作者', input_attr: {disabled: 'disabled'}},

			max_count: {label: '最多使用次数', input_attr: {disabled: 'disabled'}},
			user_count: {label: '已使用次数', input_attr: {disabled: 'disabled'}},
			GP0: {label: '参数0', input_attr: {disabled: 'disabled'}},
			GP1: {label: '参数1', input_attr: {disabled: 'disabled'}},
			GP2: {label: '参数2', input_attr: {disabled: 'disabled'}},
			GP3: {label: '参数3', input_attr: {disabled: 'disabled'}},
			GP4: {label: '参数4', input_attr: {disabled: 'disabled'}},
			GP5: {label: '参数5', input_attr: {disabled: 'disabled'}},

			bind_unionid: {label: '安装人', input_attr: {disabled: 'disabled'}},
			addr: {label: '安装地点', input_attr: {disabled: 'disabled'}},
			insert_date: {label: '安装日期', input_attr: {disabled: 'disabled'}},
			valid_date: {label: '有效截至日期', input_attr: {disabled: 'disabled'}},
			// regAuth: {label: '授权码', input_attr: {disabled: 'disabled'}},
            remark: {label: '附注'},
            inputPerson: {label: '录入者', input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间', input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新者', input_attr: {disabled: 'disabled'}},
		}
		this.state.regHistory = [];
		this.state.resaleList = [];
		this.state.showResaleBtn = false;
		this.state.scrappedDisabled = true;
		this.scrappedRem = '';
	}
	
	componentWillMount() {
		if (this.props.location.state.status !== '报废') {
			delete this.state.labelProperty.scrappedRem;
			this.state.scrappedDisabled = false;
		}
	}

    async componentDidMount() {
        const data = this.props.location.state;
		const { labelProperty } = this.state;
		this.checkCardType(labelProperty);
		this.fetch(data.serialNo);
		this.fetchResaleList(data.serialNo);
        await this.getStaffData();
        for(let key in labelProperty) {
			this.transToView(labelProperty, key, data);
        }
		this.setState({
			labelProperty,
		});
	}

	// 判断是代龙还是威程
	// 删除属性
	checkCardType = labelProperty => {
		const data = this.props.location.state;
		if (/^D/.test(data.model)) {
			delete labelProperty.VBGN;
			delete labelProperty.VEND;
			delete labelProperty.machineNo;
			delete labelProperty.latestRegNo;
			delete labelProperty.validTime;
			delete labelProperty.ad2Mode;
			delete labelProperty.pulseMode;
			delete labelProperty.vibFreq;
			delete labelProperty.vibAmp;
			delete labelProperty.SPWM_AC_AMP;
			delete labelProperty.SSI_MODE;
			delete labelProperty.HOURS;
			delete labelProperty.EMP_NO;
		} else {
			delete labelProperty.max_count;
			delete labelProperty.user_count;
			delete labelProperty.GP0;
			delete labelProperty.GP1;
			delete labelProperty.GP2;
			delete labelProperty.GP3;
			delete labelProperty.GP4;
			delete labelProperty.GP5;
		}
		this.setState({ labelProperty });
	}

    async getStaffData() {
        return new Promise(resolve => {
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/staff/all'))
                .set("token",token)
                .end((err,res) => {
                    if(err) return;
                    this.staffArr = res.body.data.map(items => items.user_name);
                    resolve();
                });
        });
	}
	
	fetch(sn) {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/virProducts/getRegHistory/' + sn))
			.set("token",token)
			.end((err,res) => {
				this.setState({
					regHistory: res.body.data,
				});
			});
		
	}

	fetchResaleList(sn) {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/virProducts/getResaleList/' + sn))
			.set("token",token)
			.end((err,res) => {
				this.setState({
					resaleList: res.body.data,
				});
			});
	}

    transToView(labelProperty, key, data){
        labelProperty[key]['initialValue'] = data[key];
        if (key == 'validTime') {
            labelProperty[key]['initialValue'] = labelProperty[key]['initialValue'] == 0 ? '永久注册' : labelProperty[key]['initialValue'];
        } else if (key === 'isDirectSale' || key === 'isPass' || key === 'isTest') {
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue'] == 1 ? '是' : '否';
		} else if (key == 'dealer') {
            // labelProperty[key].temp = <RemoteSearchInput style={{width: '100%'}} searchInputselected={this.searchInputselected} cbData={this.cbStaffData} remoteUrl={common.baseUrl('/customers/remoteSearchCustomers?keywords=')} />;
        } else if (key == 'testTime') {
			labelProperty[key]['initialValue'] = labelProperty[key]['initialValue'] ? moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD') : null;
		}
    }
	
	searchInputselected(v){
        
    }

    cbData = v => {
		this.resaleUserId = v.user_id;
    }

    cbStaffData = v => {
        this.props.form.setFieldsValue({
			dealer: v.user_id,
		});
    }

    handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				const fromData = {
					model: values.model,
					batch: values.batch,
					// maker: values.maker,
					// tester: values.tester,
					dealer_purchase: values.dealer_purchase,
					machineNo: values.machineNo,
					remark: values.remark,
					chnlNum: values.chnlNum,
					caliCoeff: values.caliCoeff,
				};
                let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl(this.updatePathname))
		            .set("token",token)
		            .send(fromData)
		            .end((err,res) => {
		            	if(err) return;
		            	if(res.body.code==200){
                            this.getOrderIdItem(result => {
								//sessionState替换
								let stateData = Base.GetStateSession();
                                let { data } = stateData;
								data.forEach((items,index) => {
									if(items.id == result.id){
										data[index] = result;
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

    //模态确定，删除
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl(this.updatePathname))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
				message.success('删除成功');
                Base.RemoveStateSession();
                this.handleBackClick();
            });
	}

	addResaleRecord = () => {
		const self = this;
		const sn = this.props.location.state.serialNo;
		const resaleUserId = this.resaleUserId;
		if (!resaleUserId) {
			message.error('请选择公司');
			return;
		}
		this.setState({
			showResaleBtn: false,
		});
		const token = sessionStorage.getItem('token');
		request.post(common.baseUrl('/virProducts/addResaleRecord'))
			.set("token",token)
			.send({
				sn,
				user_id: resaleUserId,
			})
			.end((err,res) => {
				if(err) return;
				if(res.body.code==200){
					message.success(res.body.msg);
					this.fetchResaleList(sn);
					this.getOrderIdItem(result => {
						//sessionState替换
						let stateData = Base.GetStateSession();
						let { data } = stateData;
						data.forEach((items,index) => {
							if(items.id == result.id){
								data[index] = result;
								Base.SetStateSession(stateData);
								self.props.form.setFieldsValue({
									dealer: result.dealer,
								});
							}
						});
					});
				} else {
					message.error(res.body.msg);
				}
			});
	}

	renderRegHistory() {
		const { regHistory } = this.state;
		const getEndDate = validDate => {
			if (validDate == 0) {
				return '已永久注册。';
			}
			return '有效期至' + validDate + '。';
		}
		return regHistory.map(items => (
			<div style={{borderBottom: '1px solid #eee', margin: 20}}>
				<p style={{marginBottom: 0}}>{items.regDate}</p>
				<p style={{marginBottom: 0}}>{items.name}（{items.company}）注册产品{items.product}，{getEndDate(items.validDate)}注册码：{items.regCode}，授权码：{items.authOperKey}</p>
			</div>
		))
	}

	renderResaleList() {
		const { resaleList, showResaleBtn } = this.state;
		const visibility = showResaleBtn ? 'initial' : 'hidden';
		return (
			<div>
				<div style={{marginLeft: 20}}>
					<span style={{cursor: 'pointer'}} onClick={() => this.setState({ showResaleBtn: true })}>新增<Icon type="plus" /></span>
					<RemoteSearchInput style={{width: 300, marginLeft: 6, visibility}} searchInputselected={this.searchInputselected} cbData={this.cbData} remoteUrl={common.baseUrl('/customers/remoteSearchCustomers?keywords=')} />
					<Button onClick={this.addResaleRecord} type="primary" style={{marginLeft: 6, visibility}}>提交</Button>
				</div>
				<div>
					{
						resaleList.map(items => (
							<div style={{borderBottom: '1px solid #eee', margin: 20}}>
								<p style={{marginBottom: 0}}>{moment(items.time).format('YYYY-MM-DD HH:mm:ss')}</p>
								<p style={{marginBottom: 0}}>转手至{items.rem}（处理人：{items.person}）</p>
							</div>
						))
					}
				</div>
			</div>
		)
	}

	scrapped = () => {
		const self = this;
        Modal.confirm({
            title: '',
            content: (
                <div>
                    <Input placeholder={'报废说明'} defaultValue={self.scrappedRem} onChange={e => self.scrappedRem = e.target.value} />
                </div>
            ),
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
                self.subScrapped();
            }
        });
	}

	subScrapped = () => {
		const scrappedRem = this.scrappedRem;
		const token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/virProducts/scrapped/' + this.id))
			.set("token",token)
			.send({
				scrappedRem,
			})
			.end((err,res) => {
				if(err) return;
				message.success(res.body.msg);
				this.getOrderIdItem(result => {
					//sessionState替换
					let stateData = Base.GetStateSession();
					let { data } = stateData;
					data.forEach((items,index) => {
						if(items.id == result.id){
							data[index] = result;
							Base.SetStateSession(stateData);
						}
					});
					this.handleBackClick();
				});
			});
	}

	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style = {{"marginLeft":50}} type="danger" onClick={this.handleDelete}>删除</Button>
					<Button style={{"marginLeft":50}} disabled={this.state.scrappedDisabled} onClick={this.scrapped}>报废</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
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
	    const formItem = [[], [], [], [], []];
		const default_rules = [];
		let _index = 0;
	    for(let i in record){
			if (i == 'isDirectSale') {
				_index = 1;
			} else if (i == 'modelCode') {
				_index = 2;
			} else if (i == 'bind_unionid') {
				_index = 3;
			} else if (i == 'remark') {
				_index = 4;
			}
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
				formItem[_index].push(<FormItem 
					{...formItemLayout}
					label={record[i].label}
				>
					<Upload {...props}>
						<Button>
							<Icon type="upload" />上传照片
						</Button>
					</Upload>
				</FormItem>)
				formItem[_index].push(
	    			<FormItem>
		    			{getFieldDecorator(i, {
			          		initialValue: record[i].initialValue
			          	})(
			            	<Input name="album" type="hidden" />
			          	)}
		          	</FormItem>)
			}else{
				formItem[_index].push(<FormItem
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
					{
						formItem.map((labelObj, labelIndex) => (
							<div key={labelIndex}>
								<div>
									{labelIndex === 0 && <Divider>出厂</Divider>}
									{labelIndex === 1 && <Divider>订单</Divider>}
									{labelIndex === 2 && <Divider>硬件配置</Divider>}
									{labelIndex === 3 && <Divider>电子保修单</Divider>}
									{labelIndex === 4 && <Divider>其它</Divider>}
								</div>
								<div className = "dadContainer">
									{
										labelObj.map((items,index) =>
											<div key={index} className = "son">{items}</div>
										)
									}
								</div>
							</div>
						))
					}
					<Divider>注册历史</Divider>
					<div style={{marginBottom: 30, maxHeight: 200, overflow: 'auto'}}>
						{this.renderRegHistory()}
					</div>
					<Divider>转手记录</Divider>
					<div style={{marginBottom: 30, maxHeight: 200, overflow: 'auto'}}>
						{this.renderResaleList()}
					</div>
					{this.actionBtns()}
				</Form>
				<ModalTemp 
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    ModalText={this.state.modalText} 
                    visible={this.state.visible} />
                <AppList id={this.props.location.state.id}></AppList>
			</div>
		)
	}
}

const VirProductsEdit = Form.create()(VirProductsEditCls);

export default VirProductsEdit;