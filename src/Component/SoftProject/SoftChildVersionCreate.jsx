import React, { Component } from 'react';
import { Icon, Button,message,Form,Input,Select,Upload } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const Option = Select.Option;
const FormItem = Form.Item;
const TextArea = Input.TextArea;

class SoftChildVersionCreateCls extends Component {
    constructor(props){
        super(props);
        this.uploadProps = this.uploadProps.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    state = {
        fileArr: [],
        versionList: [],
    };

    componentDidMount(){
        this.fetchVersionList();
    }

    fetchVersionList() {
        request.get(common.baseUrl2('/open/soft/' + this.props.location.state.soft_project_id))
            .end((err,res) => {
                if (res.body.data.versionArr.length === 0) {
                    message.error('请先发布一个已知版本');
                    this.props.history.goBack();
                    return;
                }
                this.setState({
                    versionList: res.body.data.versionArr,
                });
            });
    }

    handleSubmit(e) {
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                values.package = this.state.fileArr.join();
                values.soft_project_id = this.props.location.state.id;
                if(!values.package){
                    message.error('请先上传版本包');
                    return;
                }
                if(values.package.split(',').length>1){
                    message.error('仅支持单个版本包');
                    return;
                }
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/softProject/pushNewChildVersion'))
                    .set("token",token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        if(res.body.code==200){
                            message.success(res.body.msg);
                            this.props.history.goBack();
                        }else{
                            if(res.body.code=='-11005'){
                                const r = window.confirm('该分版本名已存在，是否覆盖？');
                                if(r){
                                    values.mongoId = res.body.data;
                                    request.put(common.baseUrl('/softProject/recoverChildVersion'))
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
        const { versionList } = this.state;
        const { getFieldDecorator } = this.props.form;
        return <div>
                    <Form onSubmit={this.handleSubmit} style={{padding: 24, alignItems: 'center',display: 'flex',flexDirection: 'column'}}>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'versionNo'}
                            label={'主版本号'}
                        >
                            {getFieldDecorator('versionNo', {
                                initialValue: '',
                                rules: [{ required: true, message: '不能为空' }],
                            })(
                                <Select style={{width: 400}}>
                                    { versionList.map(items => (<Option key={items.softVersionNo} value={items.softVersionNo}>{items.softVersionNo}</Option>)) }
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'childVersionName'}
                            label={'分版本名'}
                        >
                            {getFieldDecorator('childVersionName', {
                                initialValue: '',
                                rules: [{ required: true, message: '不能为空' }],
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
                                initialValue: '',
                                rules: [{ required: true, message: '不能为空' }],
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
                            <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                            <Button style={{"marginLeft":50}} onClick={() => {this.props.history.goBack()}}>返回</Button>
                        </FormItem>
                    </Form>
                </div>
    }

}

const SoftChildVersionCreate = Form.create()(SoftChildVersionCreateCls);

export default SoftChildVersionCreate;