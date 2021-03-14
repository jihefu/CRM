import React, { Component } from 'react';
import { Form, Input, Select, Button, Message } from 'antd';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import request from 'superagent';
const FormItem = Form.Item;
const { Option } = Select;

class BurnDiskAddTemp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            projectArr: [],
        };
    }

    componentDidMount() {
        this.fetchRootInstallPackList();
    }

    fetchRootInstallPackList = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/burnDisk/getRootInstallPackList'))
            .set("token", token)
            .end((err,res) => {
                if(err) return;
                this.setState({
                    projectArr: res.body.data,
                });
            });
    }

    handleSubmit = e => {
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err) {
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/burnDisk/createPackageTable'))
                    .set("token", token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        Message.success(res.body.msg);
                        if (res.body.code === 200) {
                            Base.RemoveStateSession();
                            this.props.history.goBack();
                        }
                    });
            }
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const { projectArr } = this.state;
        const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } }};
        return (
            <div>
                <Form onSubmit={this.handleSubmit} style={{padding: 24}}>
                    <div className = "dadContainer">
                        <div className="son">
                            <FormItem
                                key={'projectPrimaryId'}
                                {...formItemLayout}
                                label={'工程名'}
                            >
                                {getFieldDecorator('projectPrimaryId', {
                                    initialValue: '',
                                    rules: [{ required: true, message: '不能为空', }],
                                })(
                                    <Select>
                                        { projectArr.map(items => <Option key={items.projectPrimaryId} value={items.projectPrimaryId}>{items.projectId}</Option>) }
                                    </Select>
                                )}
                            </FormItem>
                        </div>
                        <div className="son">
                            <FormItem
                                key={'remark'}
                                {...formItemLayout}
                                label={'定制'}
                            >
                                {getFieldDecorator('remark', {
                                    initialValue: '',
                                })(
                                    <Input />
                                )}
                            </FormItem>
                        </div>
                    </div>
                    <FormItem style={{textAlign: 'center'}}>
                        <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    </FormItem>
                </Form>
            </div>
        )
    }
}

const BurnDiskAdd = Form.create()(BurnDiskAddTemp);

export default BurnDiskAdd;