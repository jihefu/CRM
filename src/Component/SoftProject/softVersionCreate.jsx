import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Select,DatePicker,Upload } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;
const TextArea = Input.TextArea;

class softVersionCreateCls extends Component {
    constructor(props){
        super(props);
        this.uploadProps = this.uploadProps.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    state = {
        soft_project_id: '',
        fileArr: [],
        disabled: false,
    };

    componentDidMount(){
        const { soft_project_id } = this.props.location.state;
        this.setState({
            soft_project_id
        });
    }

    handleSubmit(e) {
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                values.soft_project_id = this.state.soft_project_id;
                values.package = this.state.fileArr.join();
                if(!values.versionNo){
                    message.error('版本号不能为空');
                    return;
                }
                if(!values.package){
                    message.error('请先上传版本包');
                    return;
                }
                if(values.package.split(',').length>1){
                    message.error('仅支持单个版本包');
                    return;
                }
                this.setState({
                    disabled: true,
                });
                let token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/softProject/pushNewVersion'))
                    .set("token",token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        if(res.body.code==200){
                            message.success(res.body.msg);
                            this.props.history.goBack();
                        }else{
                            if(res.body.code=='-11005'){
                                const r = window.confirm('该版本号已存在，是否覆盖？');
                                if(r){
                                    request.put(common.baseUrl('/softProject/recoverVersion'))
                                        .set("token",token)
                                        .send(values)
                                        .end((err,res) => {
                                            if(err) return;
                                            if(res.body.code==200){
                                                message.success(res.body.msg);
                                                this.props.history.goBack();
                                            }else{
                                                message.error(res.body.msg);
                                            }
                                        });
                                }
                            }else{
                                message.error(res.body.msg);
                            }
                        }
                    });
            }
        });
    }

    uploadProps() {
        let token = sessionStorage.getItem('token');
        const { fileArr } = this.state;
		let props = {
			action: common.baseUrl('/notiClient/fileUpload'),
			headers: {
				token: token
			},
			accept: '*',
			name: 'file',
			defaultFileList: [],
			multiple: false,
			onChange: (res) => {
				if(res.file.status=='done'){
					let file_name = res.file.response.data[0];
                    fileArr.push(file_name);
                    this.setState({
                        fileArr
                    });
				}
			},
			onRemove: (result) => {
                const name = result.name;
                const newArr = [];
                fileArr.forEach((items,index) => {
                    if(items!=name) newArr.push(items);
                });
                this.setState({
                    fileArr: newArr
                });
			}
		};
		return props;
    }

    render(){
        const { getFieldDecorator } = this.props.form;
        const { disabled } = this.state;
        return <div>
                    <Form onSubmit={this.handleSubmit} style={{padding: 24, alignItems: 'center',display: 'flex',flexDirection: 'column'}}>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'versionNo'}
                            label={'版本编号'}
                        >
                            {getFieldDecorator('versionNo', {
                                initialValue: ''
                            })(
                                <Input style={{width: 400}} />
                            )}
                        </FormItem>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'createDescription'}
                            label={'发布说明'}
                        >
                            {getFieldDecorator('createDescription', {
                                initialValue: ''
                            })(
                                <TextArea rows={6} style={{width: 400}} ></TextArea>
                            )}
                        </FormItem>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'package'}
                            label={'版本文件'}
                        >
                            <Upload {...this.uploadProps()}>
                                <Button style={{width: 400,textAlign: 'left'}}>
                                    <Icon type="upload" />上传文件
                                </Button>
                            </Upload>
                        </FormItem>
                        <FormItem style={{textAlign: 'center',marginTop: 20}}>
                            <Button id={"submit"} disabled={disabled} type="primary" htmlType="submit">提交</Button>
                            <Button style={{"marginLeft":50}} onClick={() => {this.props.history.goBack()}}>返回</Button>
                        </FormItem>
                    </Form>
                </div>
    }

}

const softVersionCreate = Form.create()(softVersionCreateCls);

export default softVersionCreate;