import React, { Component } from 'react';
import { Table, Input, Icon, Button, Popconfirm, InputNumber, Select, AutoComplete } from 'antd';
import common from '../../public/js/common';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import Linq from 'linq';
const Option = Select.Option;

class ContractsBodyList extends Component {
	constructor(props) {
		super(props);
		this.onChange = this.onChange.bind(this);
		this.res_data = {
			goods_type: {
				label: '类型',
				width: 200
			},
			goods_name: {
				label: '名称',
				width: 200
			},
			goods_spec: {
				label: '规格型号',
				width: 200
			},
			goods_num: {
				label: '数量',
				width: 100
			},
			goods_price: {
				label: '单价',
				width: 100
			},
			goods_ded_rate: {
				label: '扣率',
				width: 100
			},
			rem: {
				label: '备注'
			}
		};

		this.state = {
			dataSource: [],
			type: [],
			count: 0,
		};
	}

	componentWillReceiveProps(props) {
		if (props.productsSelectedArr.length!=0) {
			this.forceUpdate();
		}
		if (props.goodsTypeArr.length!=0) {
			this.setState({
				type: props.goodsTypeArr
			});
		}
	}

	onDelete = (key) => {
		let dataSource = [...this.state.dataSource];
		dataSource = dataSource.filter(item => item.key !== key);
		this.props.totalAmountChange(dataSource);
		this.setState({ 
			dataSource
		});
	}

	handleAdd = () => {
		const { count, dataSource } = this.state;
		const newData = {
			key: count,
			goods_type: '产品',
			goods_name: '',
			goods_spec: '',
			goods_num: 1,
			goods_price: 0,
			goods_ded_rate: 1.0,
			rem: '',
		};
		this.setState({
			dataSource: [...dataSource, newData],
			count: count + 1,
		});
	}

	onChange = (v,key,k) => {
		const { dataSource } = this.state;
		const targetItem = Linq.from(dataSource).where(x => {
			return x.key == key;
		}).toArray()[0];
		targetItem[k] = v;
		this.setState({
			dataSource
		});
		this.props.totalAmountChange(dataSource);
	}

	viewRender(key,res_data,text, row, index){
		if(key=='goods_type'){
			return <Select
						style={{width: '100%'}}
						value={row[key]}
						onChange={(v) => this.onChange(v,row.key,key)}
					>
						{ 
							this.state.type.map((items,index) => <Option key={index} value={items}>{items}</Option>)
						}
					</Select>
		}else if(key=='goods_name'){
			const productsSelectedArr = this.props.productsSelectedArr.map(items => items.product_name);
			return <AutoComplete
						value={row[key]}
						onChange={(v) => this.onChange(v,row.key,key)}
						dataSource={productsSelectedArr}
						filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
					/>
		}else if(key=='goods_spec'){
			let goodsSpecArr = [];
			this.props.productsSelectedArr.forEach((items,index) => {
				if(items.product_name==row.goods_name){
					goodsSpecArr = items.ProductsSpecLogs;
				}
			});
			const productsSpecArr = [];
			goodsSpecArr.map((items,index) => {
				if(items.product_spec.length!=0){
					productsSpecArr.push({
						text: items.product_spec,
						value: items.product_spec
					});
				}
			});
			return <AutoComplete
						value={row[key]}
						onChange={(v) => this.onChange(v,row.key,key)}
						dataSource={productsSpecArr}
						filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
					/>
		}else if(key=='goods_num'){
			return <InputNumber
						min={1}
						value={row[key]}
						onChange={(v) => this.onChange(v,row.key,key)}
					/>
		}else if(key=='goods_price'){
			return <InputNumber
						min={0}
						step={50}
						value={row[key]}
						onChange={(v) => this.onChange(v,row.key,key)}
					/>
		}else if(key=='goods_ded_rate'){
			return <InputNumber
						min={0} 
						max={1} 
						step={0.05}
						value={row[key]}
						onChange={(v) => this.onChange(v,row.key,key)}
					/>
		}else{
			return <Input value={row[key]} onChange={(v) => this.onChange(v.target.value,row.key,key)}/>
		}
	}

	render() {
		const { dataSource } = this.state;
		// const columns = this.columns;
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
				<Button className="editable-add-btn" style={{marginLeft: 6,marginBottom: 6}} onClick={this.handleAdd}>新增货品</Button>
				<Table bordered dataSource={dataSource} columns={columns} />
			</div>
		);
	}
}

export default ContractsBodyList;