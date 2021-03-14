import React, { Component } from 'react';
import { Table, Input, Icon, Button, Popconfirm, InputNumber, Select, message } from 'antd';
import common from '../../public/js/common';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import Linq from 'linq';
import request from 'superagent';

class ContractsOfferList extends Component {
	constructor(props) {
		super(props);
		this.res_data = {
			offer_type: {
				label: '优惠类型',
				width: 200
			},
			offer_amount: {
				label: '优惠金额',
				width: 200
			},
			offer_no: {
				label: '优惠凭据',
				width: 300
			}
		};

		this.state = {
			dataSource: [],
			count: 0,
		};
	}

	componentWillReceiveProps(props) {
		if (props.cus_abb) {
			this.forceUpdate();
		}
	}

	onDelete = (key) => {
		let dataSource = [...this.state.dataSource];
		dataSource = dataSource.filter(item => item.key !== key);
		this.props.payableChange(dataSource);
		this.setState({
			dataSource
		});
	}
	handleAdd = () => {
		const { count, dataSource } = this.state;
		const newData = {
			key: count,
			offer_type: '抵价券',
			offer_amount: 0,
			offer_no: ''
		};
		this.setState({
			dataSource: [...dataSource, newData],
			count: count + 1,
		});
	}

	viewRender(key,res_data,text, row, index){
		if(key=='offer_amount'){
			return <InputNumber
						// min={0}
						step={50}
						value={row[key]}
						onChange={(v) => {
							const { dataSource } = this.state;
							const targetItem = Linq.from(dataSource).where(x => {
								return x.key == row.key;
							}).toArray()[0];
							targetItem.offer_amount = v;
							this.setState({
								dataSource
							});
							this.props.payableChange(dataSource);
						}}
					/>
		}else if(key=='offer_no'){
			if(row['offer_type']=='服务保证金'){
				const cus_abb = this.props.cus_abb;
				return <RemoteSearchInput 
					style={{width: '100%'}} 
					cbData={(v) => {
						const { dataSource } = this.state;
						const targetItem = Linq.from(dataSource).where(x => {
							return x.key == row.key;
						}).toArray()[0];
						targetItem.offer_no = v.contract_no;
						targetItem.offer_amount = v.amount;
						this.setState({
							dataSource
						});
						this.props.payableChange(dataSource);
					}} 
					remoteUrl={common.baseUrl('/contracts/remoteSearchForDeposit?cus_abb='+cus_abb+'&keywords=')} 
				/>;
			}else if(row['offer_type']=='抵价券'){
				const cus_abb = this.props.cus_abb;
				return <RemoteSearchInput 
					style={{width: '100%'}} 
					cbData={(v) => {
						const { dataSource } = this.state;
						const targetItem = Linq.from(dataSource).where(x => {
							return x.key == row.key;
						}).toArray()[0];
						targetItem.offer_no = v.coupon_no;
						targetItem.offer_amount = v.amount;
						this.setState({
							dataSource
						});
						this.props.payableChange(dataSource);
					}} 
					value={row[key]}
					remoteUrl={common.baseUrl('/wallet/remoteSearchCouponNo?cus_abb='+cus_abb+'&keywords=')} 
				/>;
			}else{
				return <Input 
							value={row[key]}
							onChange={(v) => {
								const { dataSource } = this.state;
								const targetItem = Linq.from(dataSource).where(x => {
									return x.key == row.key;
								}).toArray()[0];
								targetItem.offer_no = v.target.value;
								this.setState({
									dataSource
								});
								this.props.payableChange(dataSource);
							}}/>
			}
		}else{
			return <Select
						style={{width: '100%'}}
						value={row[key]}
						onChange={(v) => {
							const { dataSource } = this.state;
							const targetItem = Linq.from(dataSource).where(x => {
								return x.key == row.key;
							}).toArray()[0];
							targetItem.offer_type = v;
							this.setState({
								dataSource
							});
							this.props.payableChange(dataSource);
						}}
					>
						<Select.Option value="抵价券">抵价券</Select.Option>
						<Select.Option value="服务保证金">服务保证金</Select.Option>
						<Select.Option value="其它优惠">其它优惠</Select.Option>
					</Select>
		}
	}
	
	// 批量新增抵价券
	mulAdd(){
		return <div style={{display: 'flex'}}>
					<Input style={{flex: 1}} placeholder={'起始编号'} onChange={v => this.startNo = v.target.value}/>
					<span style={{marginLeft: 5,marginRight: 5}}>-</span>
					<Input style={{flex: 1}} placeholder={'结束编号'} onChange={v => this.endNo = v.target.value}/>
				</div>
	}

	render() {
		const { dataSource } = this.state;
		const columns = [];
		const res_data = this.res_data;
		for(let key in res_data){
			let o = {
                title: res_data[key].label,
                dataIndex: key,
                key: key,
                width: res_data[key]['width'],
                render: (text, row, index) => {
                    return this.viewRender(key, res_data, text, row, index);
                }
            };
            columns.push(o);
		}
		columns.push({
			title: '操作',
            key: 'operation',
            render: (text, record) => {
				return (
					this.state.dataSource.length > 0 ?
						(
							<Popconfirm title="确定删除" onConfirm={() => this.onDelete(record.key)}>
								<a href="#">删除</a>
							</Popconfirm>
						) : null
				);
			},
		});
		return (
			<div>
				<Button className="editable-add-btn" style={{ marginLeft: 6, marginBottom: 6 }} onClick={this.handleAdd}>新增优惠</Button>
				<Popconfirm placement="topLeft" title={this.mulAdd()} onConfirm={() => {
					let startNo = this.startNo,endNo = this.endNo;
					if(Number(endNo)<Number(startNo)){
						message.error('顺序错误');
						return;
					}
					const { count, dataSource } = this.state;
					let key = count,i=0;
					const newDataArr = [];
					const dealer = () => {
						let no = Number(startNo) + i;
						if(no<=Number(endNo)){
							no = no.toString();
							if(no.length==5) no = '00'+no;
							if(no.length==6) no = '0'+no;
							const data = {
								key: key,
								offer_type: '抵价券',
								offer_amount: 0,
								offer_no: no
							};
							newDataArr.push(data);
							key++;
							i++;
							dealer();
						}
					}
					dealer();
					let token = sessionStorage.getItem('token');
					request.get(common.baseUrl('/wallet/remoteSearchCouponNo'))
						.set("token",token)
						.query({
							cus_abb: this.props.cus_abb,
							keywords: ''
						})
						.end((err,res) => {
							if(err) return;
							if(res.body.code==200){
								const hashMapper = {};
								res.body.data.forEach((items,index) => {
									hashMapper[items.value] = items.data.amount;
								});
								let isExist = true;
								newDataArr.forEach((items,index) => {
									const { offer_no } = items;
									if(hashMapper[offer_no]){
										newDataArr[index].offer_amount = hashMapper[offer_no];
									}else{
										if(isExist) message.error('不存在'+offer_no);
										isExist = false;
									}
								});
								if(isExist){
									this.setState({
										dataSource: [...dataSource, ...newDataArr],
										count: key,
									});
									this.props.payableChange([...dataSource, ...newDataArr]);
								}
							}
						});
				}} okText="Yes" cancelText="No">
					<Button className="editable-add-btn" style={{ marginLeft: 6, marginBottom: 6 }}>批量新增抵价券</Button>
				</Popconfirm>
				<Table bordered dataSource={dataSource} columns={columns} />
			</div>
		);
	}
}

export default ContractsOfferList;