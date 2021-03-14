import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Select,DatePicker,Upload,Radio } from 'antd';
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
const RadioGroup = Radio.Group;

class softEvaluationAddCls extends Component {
    constructor(props){
        super(props);
        this.uploadProps = this.uploadProps.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    state = {
        versionId: '',
        testStatus: '',
        isRelease: '',
        versionNo: '',
        softChildVersionName: '',
        soft_project_id: '',
        replaceId: undefined,
        fileArr: [],
        replaceList: [],
    };

    componentDidMount() {
        let { soft_project_id, versionId, versionNo, testStatus, isRelease, softChildVersionName, replaceId } = this.props.location.state;
        this.fetch(soft_project_id, versionId);
        this.setState({
            soft_project_id,
            versionId,
            testStatus,
            isRelease,
            versionNo,
            softChildVersionName,
            replaceId,
        });
    }

    fetch = (soft_project_id, versionId) => {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getVersionListById'))
            .set("token",token)
            .query({
                soft_project_id,
                typeArr: JSON.stringify(["1202","1204"]),
            })
            .end((err,res) => {
                if(err) return;
                const versionList = res.body.data;
                let replaceList = [];
                versionList.map(items => {
                    if (items.id != versionId && !['关闭', '被替换'].includes(items.subContent.softTestStatus)) {
                        replaceList.push({
                            id: items.id,
                            version: items.rem,
                        });
                    }
                });
                replaceList = replaceList.sort((a, b) => b.version.localeCompare(a.version));
                this.setState({
                    replaceList,
                });
            });
    }

    uploadProps() {
        let token = sessionStorage.getItem('token');
        const { fileArr } = this.state;
		let props = {
			action: common.baseUrl('/softProject/uploadProjectFile'),
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

    handleSubmit(e){
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err){
                values.soft_project_id = this.state.soft_project_id;
                values.versionId = this.state.versionId;
                values.versionNo = this.state.versionNo;
                values.testAnnex = this.state.fileArr.join();
                values.softChildVersionName = this.state.softChildVersionName;
                if (values.testAnnex === '被替换') {
                    values.replaceId = this.state.replaceId;
                    if (!values.replaceId) {
                        message.error('请选择目标文件');
                        return;
                    }
                }
                let token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/softProject/createTestReport'))
                    .set("token",token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        if(res.body.code==200){
                            message.success(res.body.msg);
                            this.props.history.goBack()
                        }else{
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }

    statusChange = v => {
        this.setState({
            testStatus: v,
        });
    }

    replaceChange = v => {
        this.setState({
            replaceId: v,
        });
    }

    render(){
        const { getFieldDecorator } = this.props.form;
        const { testStatus, isRelease, replaceList, replaceId } = this.state;
        return <div>
                    <Form onSubmit={this.handleSubmit} style={{padding: 24, alignItems: 'center',display: 'flex',flexDirection: 'column'}}>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'testTime'}
                            label={'测试时间'}
                        >
                            {getFieldDecorator('testTime', {
                                initialValue: moment(),
                                rules: [{
                                    required: true
                                }]
                            })(
                                <DatePicker style={{width: 400}} />
                            )}
                        </FormItem>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'testOpinion'}
                            label={'测试意见'}
                        >
                            {getFieldDecorator('testOpinion', {
                                initialValue: '',
                                rules: [{
                                    required: true
                                }]
                            })(
                                <TextArea rows={6} style={{width: 400}} ></TextArea>
                            )}
                        </FormItem>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'testStatus'}
                            label={'测试状态'}
                        >
                            {getFieldDecorator('testStatus', {
                                initialValue: testStatus
                            })(
                                <Select style={{width: 400}} onChange={this.statusChange}>
                                    <Option key={'内测'} value={'内测'}>内测</Option>
                                    <Option key={'用户试用'} value={'用户试用'}>用户试用</Option>
                                    <Option key={'稳定'} value={'稳定'}>稳定</Option>
                                    <Option key={'被替换'} value={'被替换'}>被替换</Option>
                                    <Option key={'关闭'} value={'关闭'}>关闭</Option>
                                </Select>
                            )}
                        </FormItem>
                        { testStatus === '被替换' && <FormItem
                            style={{display: 'flex'}}
                            key={'replaceId'}
                            label={'目标文件'}
                        >
                            {getFieldDecorator('replaceId', {
                                initialValue: replaceId,
                                rules: [{ required: true, message: '不能为空' }],
                            })(
                                <Select style={{width: 400}} onChange={this.replaceChange}>
                                    { replaceList.map(items => (
                                        <Option key={items.id} value={items.id}>{items.version}</Option>
                                    )) }
                                </Select>
                            )}
                        </FormItem> }
                        <FormItem
                            style={{display: 'flex'}}
                            key={'isRelease'}
                            label={'对外发布'}
                        >
                            {getFieldDecorator('isRelease', {
                                initialValue: isRelease
                            })(
                                <Select style={{width: 400}}>
                                    <Option key={'是'} value={true}>是</Option>
                                    <Option key={'否'} value={false}>否</Option>
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            style={{display: 'flex'}}
                            key={'testAnnex'}
                            label={'测试附件'}
                        >
                            <Upload {...this.uploadProps()}>
                                <Button style={{width: 400,textAlign: 'left'}}>
                                    <Icon type="upload" />上传附件
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

const softEvaluationAdd = Form.create()(softEvaluationAddCls);

export default softEvaluationAdd;