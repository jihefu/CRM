import React, { Component } from 'react';
import { Icon, Form,Upload, Input, message, Select, Button, Table, DatePicker, Divider, Popconfirm, Modal } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import '../../public/css/Common.css'
import ModalTemp from '../common/Modal';
import BaseEditList from '../common/BaseEditList.jsx';
import Base from '../../public/js/base.js';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;
const { TextArea } = Input;

export class MyBusinessTripEditTemp extends BaseEditList {
	constructor(props) {
		super(props);
		this.addOrder = this.addOrder.bind(this);
		this.cbData = this.cbData.bind(this);
		this.target_key_prefix = '/businessTrip/';
        this.deleteUrl = '/businessTrip/del';
        this.type = ['销售', '服务', '公务安排', '学习', '培训', '会议', '其他'];
		this.state.labelProperty = {
            user_name: {label: '姓名', input_attr: {disabled: 'disabled'}},
            // branch: {label: '部门', input_attr: {disabled: 'disabled'}},
            create_time: {label: '申请日期', input_attr: {disabled: 'disabled'}},
            // state: {label: '状态', input_attr: {disabled: 'disabled'}},
            // company: {label: '客户单位', input_attr: {disabled: 'disabled'}},
            // addr: {label: '地址'},
            type: {label: '出差类型'},
            director: {label: '指派人'},
            go_out_time: {label: '出差起始日期'},
            back_time: {label: '出差结束日期'},
            reason: {label: '出差事由'},
        }
		this.state.meet_orders = this.props.location.state ? this.props.location.state.meet_orders : [];
		this.autoGetMeetOrders = this.autoGetMeetOrders.bind(this);
	};

	//@override
	//提交
	handleSubmit = (e) => {
		e.preventDefault();
		this.sub();
	}

	sub = isSave => {
		const { meet_orders } = this.state;
		this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
				this.transToModel(values);
				values.id = this.id;
				const meet_order_id_arr = meet_orders.map(items => items.id);
				values.orders = meet_order_id_arr.join();
				values.isSave = isSave;
				const user_name = sessionStorage.getItem('user_name');
                if (values.director == user_name) {
					message.error('指派人不能为自己');
					return;
				}
				let token = sessionStorage.getItem('token');
	        	request.put(common.baseUrl('/businessTrip/update'))
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
									if(items.id==result.id){
										data[index] = result;
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

	save = () => {
		this.sub(true);
	}

	//@override
	//初始化
	async componentDidMount(){
		let data = this.props.location.state;
		let fileList = [];
		const { labelProperty } = this.state;
		if(this.checkSafe()==1) return;
        this.id = data['id'];
        this.fetchAllStaff();
		for(let key in labelProperty){
			this.transToView(labelProperty,key,data);
			if (key === 'type'){
				labelProperty[key].temp = <Select>
					{
						this.type.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
                </Select>
			} else if (key === 'go_out_time' || key === 'back_time') {
                labelProperty[key].temp = <DatePicker onChange={(v, str) => this.dateChange(str, key)} defaultValue={labelProperty[key]['initialValue']} />
            } else if (key === 'reason') {
                labelProperty[key].temp = <TextArea rows={3}>{labelProperty[key]['initialValue']}</TextArea>
            }
		}
		this.setState({
			labelProperty: labelProperty,
			fileList
		},() => {
			this.uploadRenderStart = true;
		});
	}

	autoGetMeetOrders() {
		const go_out_time = this.props.form.getFieldValue('go_out_time').format('YYYY-MM-DD');
		const back_time = this.props.form.getFieldValue('back_time').format('YYYY-MM-DD');
		const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/businessTrip/remoteSearchMeetOrder'))
			.set("token",token)
			.query({
				go_out_time,
				back_time,
			})
            .end((err,res) => {
				const meet_orders = res.body.data;
				this.setState({
					meet_orders,
				});
            });
	}

	transToView(labelProperty,key,data){
		labelProperty[key]['initialValue'] = data[key];
		if(key === 'go_out_time' || key === 'back_time'){
            if (labelProperty[key]['initialValue']) {
                labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']);
            } else {
                labelProperty[key]['initialValue'] = null;
            }
		} else if (key === 'create_time') {
            labelProperty[key]['initialValue'] = moment(labelProperty[key]['initialValue']).format('YYYY-MM-DD');
        }
	}

	transToModel(values){
		
    }
    
    dateChange(v, type) {
        const obj = {};
        obj[type] = v;
        this.props.form.setFieldsValue(obj);
    }

    //获取所有员工信息
    async fetchAllStaff(){
        const that = this;
        let token = sessionStorage.getItem('token');
        await new Promise(resolve => {
            request.get(common.baseUrl('/staff/getListByLevel'))
			.set("token",token)
			.query({
				level: common.getLevel(),
			})
            .end((err,res) => {
                if(err) return;
                const { labelProperty } = that.state;
                labelProperty.director.temp = <Select>
                    {
                        res.body.data.map(items => (
							<Select.Option key={items.user_name} value={items.user_name}>{items.user_name}</Select.Option>
                            // items.level >= 6 && <Select.Option key={items.user_name} value={items.user_name}>{items.user_name}</Select.Option>
                        ))
                    }
                </Select>
                that.setState({
                    labelProperty,
                });
                resolve();
            });
        });
    }

    //模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .send({
                id: this.id,
            })
            .end((err,res) => {
                if(err) return;
                message.success('删除成功');
                Base.RemoveStateSession();
				this.handleBackClick();
            });
    }

    del(record) {
        const newArr = [];
        const { meet_orders } = this.state;
        meet_orders.forEach((items, index) => {
            if (items.id !== record.id) {
                newArr.push(items);
            }
        });
        this.setState({
            meet_orders: newArr,
        });
    }

    renderMeetOrderTable() {
        const { meet_orders } = this.state;
        const columns = [
			{ title: '见面客户', dataIndex: 'company', key: 'company', width: 200 },
			{ title: '联系时间', dataIndex: 'contact_time', key: 'contact_time', width: 120 },
            { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 100 },
			{ title: '目的', dataIndex: 'purpose', key: 'purpose', width: 200 },
			{ title: '见面地点', dataIndex: 'addr', key: 'addr', width: 200 },
            { title: '内容', dataIndex: 'content', key: 'content', width: 200 },
            { title: '操作', dataIndex: 'action', key: 'action', render: (text, record) => (
                <Popconfirm
                    placement="bottomRight"
                    title={'确定删除？'}
                    onConfirm={() => this.del(record)}
                    okText="Yes"
                    cancelText="No"
                >
                    <a>删除</a>
                </Popconfirm>
            )},
        ];
        return (
            <Table
                columns={columns}
                dataSource={meet_orders}
                pagination={false}
            />
        );
	}

	cbData(v) {
		this.selectMeetOrderId = v;
	}
	
	addOrder() {
		this.autoGetMeetOrders();
		return;
		const that = this;
		this.selectMeetOrderId = null;
		const { meet_orders } = this.state;
		const token = sessionStorage.getItem('token');
		Modal.confirm({
			icon: <Icon type="info-circle" />,
            content: <div>
                <div style={{marginTop: 16, display: 'flex'}}>
                    <RemoteSearchInput style={{width: '100%'}} searchInputselected={() => {}} cbData={that.cbData} remoteUrl={common.baseUrl('/businessTrip/remoteSearchMeetOrder?keywords=')} ></RemoteSearchInput>
                </div>
            </div>,
            async onOk() {
				if (!that.selectMeetOrderId) return;
				let isExist = false;
				meet_orders.forEach(items => {
					if (items.id === that.selectMeetOrderId.id) isExist = true;
				});
				if (isExist) return;
				meet_orders.push(that.selectMeetOrderId);
				that.setState({
					meet_orders,
				});
            },
		});
	}

	//操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">申请报销</Button>
					<Button style = {{"marginLeft":50}} onClick={this.save}>保存</Button>
                    <Button style = {{"marginLeft":50}} type="danger" onClick={this.handleDelete}>删除</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
	}

    //@Override
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
                    <Divider>见面联系单</Divider>
                    <div style={{marginTop: 16, marginBottom: 16}}>
                        <Button onClick={this.addOrder} style={{marginBottom: 6}}>自动填充见面联系单</Button>
                        { this.renderMeetOrderTable() }
                    </div>
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

const MyBusinessTripEdit = Form.create()(MyBusinessTripEditTemp);

export default MyBusinessTripEdit;