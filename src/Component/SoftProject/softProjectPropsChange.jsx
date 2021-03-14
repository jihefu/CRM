import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Button, message, Form, Input, Select, Upload, Icon, Row, Col,AutoComplete } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import { softProjectCreateCls } from './softProjectCreate.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import '../../public/css/App.css';
moment.locale('zh-cn');
const Option = Select.Option;
const OptGroup = Select.OptGroup;
const FormItem = Form.Item;

class softProjectPropsChangeCls extends softProjectCreateCls {
    constructor(props) {
        super(props);
        this.state.projectProperty = {};
        this.state.imgFileList = [];
        this.state.docFileList = [];
		this.state.canRender = false;
	}

    //@Override
    initData() {
        const { labelProperty, projectProperty } = this.state;
        const imgFileList = [], docFileList = [];
        for(let key in labelProperty) {
            labelProperty[key].initialValue = projectProperty[key];
            if(key=='developTeam'){
                let developTeamNameArr = labelProperty[key].initialValue.split(',');
                developTeamNameArr.forEach((items,index) => {
                    this.developerArr.forEach((it,ind) => {
                        if(items==it.user_name){
                            developTeamNameArr[index] = it.user_id;
                        }
                    });
                });
                labelProperty[key].initialValue = developTeamNameArr;
                labelProperty[key].temp = <Select mode={'multiple'} >
                    {
                        this.developerArr.map(items => 
                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                        )
                    }
                </Select>
            }else if(key=='dependOtherProject'){
				let dependOtherProjectArr;
				try{
					dependOtherProjectArr = labelProperty[key].initialValue.split(',');
				}catch(e){
					dependOtherProjectArr = [];
				}
				dependOtherProjectArr.forEach((items,index) => {
                    this.projectArr.forEach((it,ind) => {
                        if(items==it){
                            dependOtherProjectArr[index] = it;
                        }
                    });
                });
                labelProperty[key].initialValue = dependOtherProjectArr;
                labelProperty[key].temp = <Select mode={'multiple'} >
                    {
                        this.projectArr.map(items => 
                            <Select.Option key={items} value={items}>{items}</Select.Option>
                        )
                    }
                </Select>
			}else if(key=='projectId'){
                labelProperty[key].temp = <Input disabled={true} />;
            }else if(key=='firstCls'){
				labelProperty[key].temp = <Select onChange={this.firstClsChange}>
					{
						this.firstClsArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='secondCls'){
				labelProperty[key].temp = <Select>
					{
						this.secondClsArr.map(items => 
							<Select.Option key={items} value={items}>{items}</Select.Option>
						)
					}
				</Select>
			}else if(key=='relatedAffair'){
				let affairNameArr;
				try{
					affairNameArr = labelProperty[key].initialValue.split(',');
				}catch(e){
					affairNameArr = [];
				}
                // let affairNameArr = labelProperty[key].initialValue.split(',');
                affairNameArr.forEach((items,index) => {
                    this.affairArr.forEach((it,ind) => {
						it.forEach(_it => {
							if(items==_it.name){
								affairNameArr[index] = _it.uuid;
							}
						});
                    });
                });
				labelProperty[key].initialValue = affairNameArr.join();
				labelProperty[key].temp = <Select>
                    {
						this.affairArr[0].filter(items => !/专线$/.test(items.name)).map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option>)
                        // this.affairArr.map((items,index) => 
                        //     index===0&&<OptGroup key={index} label="例行事务">
                        //         { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                        //     </OptGroup>||
                        //     index===1&&<OptGroup key={index} label="立项事务">
                        //         { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                        //     </OptGroup>||
                        //     index===2&&<OptGroup key={index} label="小事务">
                        //         { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                        //     </OptGroup>
                        // )
                    }
                </Select>
                // labelProperty[key].temp = <Select>
                //     {
                //         this.affairArr.map(items => 
                //             <Select.Option key={items.uuid} value={items.uuid}>{items.name}</Select.Option>
                //         )
                //     }
                // </Select>
            }else if(key=='tags'){
                if(!labelProperty[key].initialValue) {
                    delete labelProperty[key].initialValue;
                }else{
                    try{
                        labelProperty[key].initialValue = labelProperty[key].initialValue.split(',');
                    }catch(e){

                    }
                }
            }else if(key=='album'){
				let _arr = [];
				try{
					_arr = labelProperty[key].initialValue.split(',');
				}catch(e){

				}
				_arr.forEach((items,index) => {
					if(items){
						imgFileList.push({
							uid: index,
							name: items,
							status: 'done',
							key: items,
							url: common.staticBaseUrl('/img/notiClient/'+items)
						});
					}
				});
			}else if(key=='document'){
                let _arr = [];
				try{
					_arr = labelProperty[key].initialValue.split(',');
				}catch(e){

				}
				_arr.forEach((items,index) => {
					if(items){
						docFileList.push({
							uid: index,
							name: items,
							status: 'done',
							key: items,
							url: common.staticBaseUrl('/projectFile/'+items)
						});
					}
				});
            }
        }
        this.setState({
            labelProperty: labelProperty,
            imgFileList,
            docFileList
        },() => {
            this.setState({
                canRender: true
            });
        });
    }

    //@Override
    componentDidMount(){
        this.setState({
            projectProperty: this.props.location.state.projectProperty
        });
        this.fetchStaff(() => {
            this.fetchAffair(() => {
				this.fetchProject(() => {
					this.initData();
				});
            });
        });
    }

    //@Override
    uploadAlbumProps() {
        let token = sessionStorage.getItem('token');
        let defaultFileList = this.state.imgFileList;
		let props = {
			action: common.baseUrl(this.uploadImgUrl),
			headers: {
				token: token
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList,
			multiple: false,
			onChange: (res) => {
				if(res.file.status=='done'){
                    let file_name = res.file.response.data[0];
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
                    name = result.response.data[0];
                }catch(e){
                    name = result.name;
                }
                let albumArr = this.props.form.getFieldValue('album').split(',');
                const rArr = [];
				albumArr.forEach((items,index) => {
					if(items!=name) rArr.push(items);
				});
				this.props.form.setFieldsValue({
					album: rArr.join()
				});
			}
		};
		return props;
    }

    //@Override
    uploadDocumentProps() {
        let token = sessionStorage.getItem('token');
        let defaultFileList = this.state.docFileList;
		let props = {
			action: common.baseUrl(this.uploadDocumentUrl),
			headers: {
				token: token
			},
			accept: '*',
			listType: 'picture',
			name: 'file',
			defaultFileList,
			multiple: false,
			onChange: (res) => {
				if(res.file.status=='done'){
                    let file_name = res.file.response.data[0];
					let album_str = this.props.form.getFieldValue('document');
					if(!album_str){
						album_str = file_name;
					}else{
						album_str += ','+file_name;
					}
					this.props.form.setFieldsValue({
						document: album_str
					});
				}
			},
			onRemove: (result) => {
                let name;
                try{
                    name = result.response.data[0];
                }catch(e){
                    name = result.name;
                }
				let albumArr = this.props.form.getFieldValue('document').split(',');
				albumArr.forEach((items,index) => {
					if(items==name) albumArr.splice(index,1);
				});
				this.props.form.setFieldsValue({
					document: albumArr.join()
				});
			}
		};
		return props;
    }

    //@Override
    handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                this.transToModel(values);
                values.id = this.state.projectProperty.id;
                let token = sessionStorage.getItem('token');
                request.put(common.baseUrl('/softProject/updateProjectProperty'))
                    .set("token",token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        if(res.body.code==200){
                            message.success(res.body.msg);
                            this.handleBackClick();
                        }else{
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }

    render() {
        if(!this.state.canRender) return <p></p>;
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
                let props = this.uploadAlbumProps();
				formItem.push(<FormItem 
					{...formItemLayout}
					label={record[i].label}
				>
					<Upload {...props}>
						<Button>
							<Icon type="upload" />上传截图
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
			}else if(i=='document'){
                let props = this.uploadDocumentProps();
				formItem.push(<FormItem 
					{...formItemLayout}
					label={record[i].label}
				>
					<Upload {...props}>
						<Button>
							<Icon type="upload" />上传文档
						</Button>
					</Upload>
				</FormItem>)
				formItem.push(
	    			<FormItem>
		    			{getFieldDecorator(i, {
			          		initialValue: record[i].initialValue
			          	})(
			            	<Input name="document" type="hidden" />
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
					{this.actionBtns()}
				</Form>
			</div>
		)
    }
}

const softProjectPropsChange = Form.create()(softProjectPropsChangeCls);

export default softProjectPropsChange;