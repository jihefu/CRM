import React from 'react';
import { Form, InputNumber, message, Radio, Button } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import { CashGiftEditTemp } from './CashGiftEdit';
const FormItem = Form.Item;

class CashGiftAddTemp extends CashGiftEditTemp {
    constructor(props) {
        super(props);
        this.state.labelProperty = {
            goodsName: { label: '礼品名', rules: [{ required: true, message: '不能为空' }] },
            needScore: { label: '元宝分' },
            inventory: { label: '库存数量' },
            isOpen: { label: '开放对象' },
        }
    }

    //@overload
    transToView(labelProperty, key) {
        labelProperty[key]['initialValue'] = null;
        if (key === 'isOpen') {
            labelProperty[key]['initialValue'] = 0;
        } else if (key === 'needScore') {
            labelProperty[key]['initialValue'] = 1000;
        } else if (key === 'inventory') {
            labelProperty[key]['initialValue'] = 50;
        }
    }

    //@override
    //操作按钮
    actionBtns() {
        return <FormItem style={{ textAlign: 'center' }}>
            <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
            <Button style={{ "marginLeft": 50 }} onClick={this.handleBackClick}>返回</Button>
        </FormItem>
    }

    //@override
    //初始化
    componentDidMount() {
        const { labelProperty } = this.state;
        let fileList = [];
        for (let key in labelProperty) {
            this.transToView(labelProperty, key);
            if (key == 'isOpen') {
                labelProperty[key].temp = <Radio.Group style={{ marginTop: 4 }}>
                        <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={0}>不开放</Radio>
                        <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={1}>微信公众号</Radio>
                        <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={2}>竞猜小程序</Radio>
                    </Radio.Group>
            } else if (key === 'needScore') {
                labelProperty[key].temp = <InputNumber min={1} step={1000} />
            } else if (key === 'inventory') {
                labelProperty[key].temp = <InputNumber min={0} step={1} />
            }
        }
        this.setState({
            labelProperty: labelProperty,
            fileList
        }, () => {
            this.uploadRenderStart = true;
        });
    }

    //@override
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                this.transToModel(values);
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/member/createGift'))
                    .set("token", token)
                    .send(values)
                    .end((err, res) => {
                        if (err) return;
                        if (res.body.code == 200) {
                            message.success(res.body.msg);
                            this.handleBackClick();
                        } else {
                            message.error(res.body.msg);
                        }
                    })
            }
        });
    }
}

const CashGiftAdd = Form.create()(CashGiftAddTemp);

export default CashGiftAdd;