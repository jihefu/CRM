import React, { Component } from 'react';
import { Form, Input, Select, InputNumber, Button, Message } from 'antd';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import request from 'superagent';
const FormItem = Form.Item;
const { Option } = Select;

class VirProductsAddTemp extends Component {
    constructor(props) {
        super(props);
        this.labelObj = {
            serialNo: { label: '序列号', rules: [{ required: true, message: '不能为空' }] },
            model: { 
                label: '型号', 
                rules: [{ required: true, message: '不能为空' }],
                initialValue: 'V802',
                temp: <Select>
                    <Option key={'V884'} value={'V884'}>V884</Option>
                    <Option key={'V881'} value={'V881'}>V881</Option>
                    <Option key={'V802'} value={'V802'}>V802</Option>
                    <Option key={'V801'} value={'V801'}>V801</Option>
                    <Option key={'V800'} value={'V800'}>V800</Option>
                </Select>
            },
            latestRegNo: { label: '注册码' },
            machineNo: { label: '机器号' },
            ad2Mode: { label: 'AD采集模式' },
            pulseMode: { label: 'PM脉冲模式' },
            vibFreq: { label: 'DA伺服颤振频率' },
            vibAMP: { label: 'DA伺服颤振幅值' },
            SPWM_AC_AMP: { label: 'SPWM交流幅值' },
            SSI_MODE: { label: 'DIO模式' },
            HOURS: { label: '已用小时数', initialValue: 0 },
            authType: { label: '规格' },
            oemUser: { label: '用户软件许可', initialValue: 0 },
            VBGN: { label: '名义试用起始' },
            VEND: { label: '名义试用终止' },
            fwVer: { label: '固件版本' },
        };
    }

    transToModelCode = model => {
        if (model === 'V884') {
            return 1884;
        } else if (model === 'V881') {
            return 1881;
        } else if (model === 'V802') {
            return 1802;
        } else if (model === 'V801') {
            return 1801;
        } else if (model === 'V800') {
            return 1800;
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

const VirProductsAdd = Form.create()(VirProductsAddTemp);

export default VirProductsAdd;