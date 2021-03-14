import React, { Component } from 'react';
import { Form, Input, Select, InputNumber, Button, Message } from 'antd';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import request from 'superagent';
const FormItem = Form.Item;
const { Option } = Select;

class DynaProductsAddTemp extends Component {
    constructor(props) {
        super(props);
        this.labelObj = {
            serialNo: { label: '序列号', rules: [{ required: true, message: '不能为空' }] },
            model: { 
                label: '型号', 
                rules: [{ required: true, message: '不能为空' }],
                initialValue: 'D900',
                temp: <Select>
                    <Option key={'D900'} value={'D900'}>D900</Option>
                    <Option key={'D910'} value={'D910'}>D910</Option>
                    <Option key={'D921'} value={'D921'}>D921</Option>
                    <Option key={'D700'} value={'D700'}>D700</Option>
                </Select>
            },
            fwVer: { label: '固件版本' },
            authType: { label: '规格' },
            oemUser: { label: '用户软件许可', initialValue: 0 },
            max_count: { label: '最多使用次数', initialValue: 0 },
            user_count: { label: '已使用次数', initialValue: 0 },
            GP0: { label: '参数0' },
            GP1: { label: '参数1' },
            GP2: { label: '参数2' },
            GP3: { label: '参数3' },
            GP4: { label: '参数4' },
            GP5: { label: '参数5' },
        };
    }

    transToModelCode = model => {
        if (model === 'D900') {
            return 1900;
        } else if (model === 'D910') {
            return 1910;
        } else if (model === 'D921') {
            return 1921;
        } else if (model === 'D700') {
            return 1700;
        }
    }

    handleSubmit = e => {
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
	        if(!err) {
                if (/\D/.test(values.serialNo)) {
                    Message.error('序列号为纯数字');
                    return;
                }
                values.modelCode = this.transToModelCode(values.model);
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/virProducts/addCtrlInfo'))
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

    renderFormItem = () => {
        const { labelObj } = this;
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } }};
        const arr = [];
        for (const key in labelObj) {
            const rules = labelObj[key].rules ? labelObj[key].rules : [];
            const initialValue = labelObj[key].initialValue == undefined ? '' : labelObj[key].initialValue;
            const temp = labelObj[key].temp ? labelObj[key].temp : <Input />;
            arr.push(
                <div className="son" key={key}>
                    <FormItem
                        key={key}
                        {...formItemLayout}
                        label={labelObj[key].label}
                    >
                        { getFieldDecorator(key, {
                            initialValue,
                            rules,
                        })(
                            temp
                        ) }
                    </FormItem>
                </div>
            );
        }
        return arr;
    }

    render() {
        return (
            <div>
                <Form onSubmit={this.handleSubmit} style={{padding: 24}}>
                    <div className = "dadContainer">
                        { this.renderFormItem() }
                    </div>
                    <FormItem style={{textAlign: 'center'}}>
                        <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                    </FormItem>
                </Form>
            </div>
        )
    }
}

const DynaProductsAdd = Form.create()(DynaProductsAddTemp);

export default DynaProductsAdd;