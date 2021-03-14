import React, { Component } from 'react';
import { Form, Input, Select, InputNumber, Button, Message } from 'antd';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import request from 'superagent';
const FormItem = Form.Item;
const { Option } = Select;

class OtherProductsAddTemp extends Component {
    constructor(props) {
        super(props);
    }

    handleSubmit = e => {
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err) {
                if (/\D/.test(values.serialNo)) {
                    Message.error('序列号为纯数字');
                    return;
                }
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/otherProducts/add/'))
                    .set("token", token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        Message.success(res.body.msg);
                        if (res.body.code === 200) {
                            Base.RemoveStateSession();
                            setTimeout(this.props.history.goBack, 1000);
                        }
                    });
            }
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } }};
        return (
            <div>
                <Form onSubmit={this.handleSubmit} style={{padding: 24}}>
                    <div className = "dadContainer">
                        <div className="son">
                            <FormItem
                                key={'serialNo'}
                                {...formItemLayout}
                                label={'序列号'}
                            >
                                {getFieldDecorator('serialNo', {
                                    initialValue: '',
                                    rules: [{ required: true, message: '不能为空', }],
                                })(
                                    <Input />
                                )}
                            </FormItem>
                        </div>
                        <div className="son">
                            <FormItem
                                key={'model'}
                                {...formItemLayout}
                                label={'型号'}
                            >
                                {getFieldDecorator('model', {
                                    initialValue: '比例阀',
                                    rules: [{ required: true, message: '不能为空', }],
                                })(
                                    <Select>
                                        <Option key={'AD800'} value={'AD800'}>AD800</Option>
                                        <Option key={'比例阀'} value={'比例阀'}>比例阀</Option>
                                        <Option key={'手控器'} value={'手控器'}>手控器</Option>
                                        <Option key={'电控箱'} value={'电控箱'}>电控箱</Option>
                                        <Option key={'传感器'} value={'传感器'}>传感器</Option>
                                        <Option key={'电机'} value={'电机'}>电机</Option>
                                        <Option key={'TC'} value={'TC'}>TC</Option>
                                    </Select>
                                )}
                            </FormItem>
                        </div>
                        <div className="son">
                            <FormItem
                                key={'standrd'}
                                {...formItemLayout}
                                label={'规格'}
                            >
                                {getFieldDecorator('standrd', {
                                    initialValue: '',
                                })(
                                    <Input />
                                )}
                            </FormItem>
                        </div>
                        <div className="son">
                            <FormItem
                                key={'manufacturer'}
                                {...formItemLayout}
                                label={'厂家'}
                            >
                                {getFieldDecorator('manufacturer', {
                                    initialValue: '',
                                })(
                                    <Input />
                                )}
                            </FormItem>
                        </div>
                        <div className="son">
                            <FormItem
                                key={'valuation'}
                                {...formItemLayout}
                                label={'估价'}
                            >
                                {getFieldDecorator('valuation', {
                                    initialValue: 0,
                                })(
                                    <InputNumber />
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

const OtherProductsAdd = Form.create()(OtherProductsAddTemp);

export default OtherProductsAdd;