import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Button, message, Form, Input, Select, Upload, Icon, Row, Col,AutoComplete } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import BaseEditList from '../common/BaseEditList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import '../../public/css/App.css';
moment.locale('zh-cn');
const Option = Select.Option;
const OptGroup = Select.OptGroup;
const FormItem = Form.Item;

export class softProjectCreateCls extends BaseEditList {
    constructor(props) {
        super(props);
        this.firstClsChange = this.firstClsChange.bind(this);
        this.firstClsArr = ['云服务', '应用软件', '安可迅'];
        this.secondClsArr = ['云测控','试验数据服务','客户关系'];
        this.runTypeArr = ['云','桌面','移动','嵌入式'];
        this.IDEArr = ['Visual Studio','Visual Studio Code','VC++'];
        this.langArr = ['c/c++','c#','VB','js'];
        this.developerArr = [];
        this.affairArr = [[],[],[]];
        this.projectArr = [];
        this.uploadImgUrl = '/notiClient/imgUpload';
        this.uploadDocumentUrl = '/softProject/uploadProjectFile';
		this.state.labelProperty = {
			projectId: {label: '工程名', rules: [{ required: true, message: '不能为空'}],placeholder: '英文，惟一，不可更改'},
			projectTitle: {label: '工程标题', rules: [{ required: true, message: '不能为空'}],placeholder: '中文'},
			firstCls: {
                label: '一级分类',
                initialValue: this.firstClsArr[0],
                temp: <Select onChange={this.firstClsChange}>
                        {
                            this.firstClsArr.map(items => 
                                <Select.Option key={items} value={items}>{items}</Select.Option>
                            )
                        }
                    </Select>
            },
			secondCls: {
                label: '二级分类',
                initialValue: this.secondClsArr[0],
                temp: <Select>
                        {
                            this.secondClsArr.map(items => 
                                <Select.Option key={items} value={items}>{items}</Select.Option>
                            )
                        }
                    </Select>
            },
            usage: {label: '用途', rules: [{ required: true, message: '不能为空'}]},
            tags: {label: '标签',temp: <Select mode={"tags"}></Select>},
            developTeam: {
                label: '开发团队',
                rules: [{ required: true, message: '不能为空'}],
                temp: <Select>
                            {
                                this.developerArr.map(items => 
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select>
            },
			IDE: {
                label: '开发工具', 
                rules: [{ required: true, message: '不能为空'}],
                temp: <AutoComplete  dataSource={this.IDEArr} />
            },
			lang: {
                label: '编程语言',
                rules: [{ required: true, message: '不能为空'}],
                temp: <AutoComplete  dataSource={this.langArr} />
            },
			runType: {
                label: '目标运行分类',
                initialValue: this.runTypeArr[0],
                temp: <Select>
                        {
                            this.runTypeArr.map(items => 
                                <Select.Option key={items} value={items}>{items}</Select.Option>
                            )
                        }
                    </Select>
            },
            relatedAffair: {
                label: '关联事务',
                temp: <Select>
                        {
                            this.affairArr.map((items,index) => 
                                index===0&&<OptGroup key={index} label="例行事务">
                                    { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                                </OptGroup>||
                                index===1&&<OptGroup key={index} label="立项事务">
                                    { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                                </OptGroup>||
                                index===2&&<OptGroup key={index} label="小事务">
                                    { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                                </OptGroup>
                            )
                        }
                    </Select>
            },
            dependOtherProject: {
                label: '引用其它工程',
                temp: <Select>
                            {
                                this.projectArr.map(items => 
                                    <Select.Option key={items} value={items}>{items}</Select.Option>
                                )
                            }
                        </Select>
            },
            album: {
                label: '主要截图'
            },
            document: {
                label: '相关文档'
            }
        }
        this.submiting = false;
    }

    firstClsChange(v) {
        let secondClsArr;
        if(v=='云服务'){
            secondClsArr = ['云测控','试验数据服务','客户关系'];
        }else if(v=='应用软件'){
            secondClsArr = ['MaxTest','DynaTest','安装包','模板'];
        }else if(v=='安可迅'){
            secondClsArr = ['工具箱','平台','驱动','固件','老版维护'];
        }
        this.secondClsArr = secondClsArr;
        this.props.form.setFieldsValue({
            secondCls: secondClsArr[0]
        });
        this.initData();
    }

    fetchStaff(cb){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                res.body.data.forEach((items) => {
                    const { branch,user_id,user_name } = items;
                    if(branch=='研发部') this.developerArr.push(items);
                });
                cb();
            });
    }

    fetchProject(cb){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getAllProjectName'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                res.body.data.forEach((items) => {
                    this.projectArr.push(items.projectId);
                });
                cb();
            });
    }

    fetchAffair(cb){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/affair/listForSelect'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                res.body.data.forEach((items, index) => {
                    this.affairArr[items.type].push(items);
                });
                cb();
            });
    }

    handleSubmit = (e) => {
	    e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                this.transToModel(values);
                if (this.submiting) return;
                this.submiting = true;
                let token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/softProject/createProject'))
                    .set("token",token)
                    .send(values)
                    .end((err, res) => {
                        if(err) return;
                        if(res.body.code==200){
                            message.success(res.body.msg);
                            this.handleBackClick();
                        }else{
                            message.error(res.body.msg);
                            this.submiting = false;
                        }
                    });
            }
        });
    }

    initData() {
        const { labelProperty } = this.state;
        for(let key in labelProperty) {
            if(key=='developTeam'){
                labelProperty[key].temp = <Select mode={'multiple'} >
                    {
                        this.developerArr.map(items => 
                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                        )
                    }
                </Select>
            }else if(key=='dependOtherProject'){
                labelProperty[key].temp = <Select mode={'multiple'} >
                    {
                        this.projectArr.map(items => 
                            <Select.Option key={items} value={items}>{items}</Select.Option>
                        )
                    }
                </Select>
            }else if(key=='secondCls'){
                labelProperty[key].initialValue = this.secondClsArr[0];
                labelProperty[key].temp = <Select>
                    {
                        this.secondClsArr.map(items => 
                            <Select.Option key={items} value={items}>{items}</Select.Option>
                        )
                    }
                </Select>
            }else if(key=='relatedAffair'){
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
            }
        }
        this.setState({
            labelProperty: labelProperty
        });
    }

    componentDidMount(){
        this.fetchStaff(() => {
            this.fetchAffair(() => {
                this.fetchProject(() => {
                    this.initData();
                });
            });
        });
    }
    
    transToView(){
		
	}

	transToModel(values){
        values.developTeam = values.developTeam.join();
        try{
            values.dependOtherProject = values.dependOtherProject.join();
        }catch(e){

        }
        if(!values.dependOtherProject) values.dependOtherProject = null;
        try{
            values.tags = values.tags.join();
        }catch(e){

        }
    }

    //操作按钮
    actionBtns(){
        return <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    <Button style={{"marginLeft":50}} onClick={this.handleBackClick}>返回</Button>
                </FormItem>
    }

    uploadAlbumProps() {
        let token = sessionStorage.getItem('token');
		let props = {
			action: common.baseUrl(this.uploadImgUrl),
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
                let name = result.name;
				let albumArr = this.props.form.getFieldValue('album').split(',');
				albumArr.forEach((items,index) => {
					if(items==name) albumArr.splice(index,1);
				});
				this.props.form.setFieldsValue({
					album: albumArr.join()
				});
			}
		};
		return props;
    }

    uploadDocumentProps() {
        let token = sessionStorage.getItem('token');
		let props = {
			action: common.baseUrl(this.uploadDocumentUrl),
			headers: {
				token: token
			},
			accept: '*',
			listType: 'picture',
			name: 'file',
			defaultFileList: [],
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
                let name = result.name;
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
    
    render() {
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

const softProjectCreate = Form.create()(softProjectCreateCls);

export default softProjectCreate;