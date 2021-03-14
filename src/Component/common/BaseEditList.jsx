import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Form,Input,Select,Upload,Icon,Spin } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import ModalTemp from './Modal.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;

/**
 *  Abstract Class
 */
class BaseEditList extends Component {
    constructor(props){
        super(props);
        this.id = '';
        this.file_name_prefix = '';
        this.target_key_prefix = '';
        this.uploadUrl = '';
		this.deleteUrl = '';
		this.uploadRenderStart = false;
        this.uploadProps = this.uploadProps.bind(this);
        this.handleBackClick = this.handleBackClick.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
    }

    state = {
        data: [],
        fileList: [],
        labelProperty: {},
        modalText: '确定删除？',
		visible: false,
		spinning: false,
    };

    checkSafe(){
		let data = this.props.location.state;
		let token = sessionStorage.getItem('token');
		if(!token){
			hashHistory.push('/');
			return 1;
		}
		if(!data){
            this.props.history.goBack();
			return 1;
		}
    }
    
    handleBackClick() {
		this.props.history.goBack();
    }
    
    uploadProps(){
		let token = sessionStorage.getItem('token');
		let props = {
			action: common.baseUrl(this.uploadUrl),
			headers: {
				token: token
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList: [...this.state.fileList],
			className: 'upload-list-inline',
			multiple: false,
			onChange: (res) => {
				if (res.file.status === 'uploading') {
					this.setState({
						spinning: true,
					});
				}
				if(res.file.status=='done'){
					this.setState({
						spinning: false,
					});
					let file_name = res.file.response.data[0];
					file_name = this.file_name_prefix+file_name;
					let album_str = this.props.form.getFieldValue('album');
					if(!album_str){
						album_str = file_name;
					}else{
						album_str += ','+file_name;
					}
					this.props.form.setFieldsValue({
						album: album_str
					});
				}
			},
			onRemove: (result) => {
				let name;
				try{
					name = this.file_name_prefix+result.response.data[0];
				}catch(e){
					name = result.name;
				}
				let albumArr = this.props.form.getFieldValue('album').split(',');
				albumArr.forEach((items,index) => {
					if(items==name) albumArr.splice(index,1);
				});
				let str = '';
				albumArr.forEach((items,index) => {
					str += items+',';
				});
				str = str.slice(0,str.length-1);
				this.props.form.setFieldsValue({
					album: str
				});
			}
		};
		return props;
    }
    
    handleDelete(){
		this.setState({
			visible: true
		});
    }
    
    handleModalCancel(){
		this.setState({
			visible: false
		});
    }
    
    //模态确定
    handleModalDefine(){
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl(this.deleteUrl))
            .set("token",token)
            .send({
                form_data: JSON.stringify({isdel: 1,id: this.id})
            })
            .end((err,res) => {
                if(err) return;
				message.success('删除成功');
				this.handleBackClick();
            });
    }
    
    //初始化
    componentDidMount(){
        
    }

    //提交表单
    handleSubmit = (e) => {

    }

    //获取指定id的item
    getOrderIdItem = (cb) => {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl(this.target_key_prefix+this.id))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    cb(res.body.data);
                }
            });
    }

    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style = {{"marginLeft":50}} type="danger" onClick={this.handleDelete}>删除</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    render() {
		if(!this.uploadRenderStart) return <div></div>;
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
			<Spin spinning={spinning}>
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

export default BaseEditList;