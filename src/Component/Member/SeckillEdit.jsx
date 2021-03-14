import React from 'react';
import { Form, InputNumber, message, TimePicker, DatePicker } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import BaseEditList from '../common/BaseEditList.jsx';
moment.locale('zh-cn');

export class SeckillEditTemp extends BaseEditList {
    constructor(props) {
        super(props);
        this.target_key_prefix = '/output/';
        this.deleteUrl = '/member/delCashGift';
        this.uploadUrl = '/notiClient/imgUpload';
        this.state.labelProperty = {
            goods_name: { label: '礼品名', input_attr: { disabled: 'disabled' } },
            score: { label: '秒杀价' },
            start_time: { label: '秒杀开始时间' },
            survive_time: { label: '秒杀持续时间' },
            plan_inventory: { label: '额定数量' },
        }
    };

    //@override
    //模态确定
    handleModalDefine() {
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl(`/seckill/delSeckillOrder/${this.id}`))
            .set("token", token)
            .send({ goods_id: this.goods_id })
            .end((err, res) => {
                if (err) return;
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    this.handleBackClick();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    //@override
    //提交
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                this.transToModel(values);
                values.order_id = this.id;
                values.goods_id = this.goods_id;
                values.start_time = this.start_time_format;
                const token = sessionStorage.getItem('token');
                request.put(common.baseUrl('/seckill/updateSeckillOrder'))
                    .set("token", token)
                    .send({
                        order_id: values.order_id,
                        goods_id: values.goods_id,
                        plan_inventory: values.plan_inventory,
                        score: values.score,
                        start_time: values.start_time,
                        survive_time: values.survive_time,
                    })
                    .end((err, res) => {
                        if (err) return;
                        if (res.body.code == 200) {
                            message.success('更新成功');
                            this.handleBackClick();
                        } else {
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }

    dateChange = v => {
        const date = v.format('YYYY-MM-DD');
        this.start_time_format = date + ' ' + this.start_time_format.split(' ')[1];
    }

    timeChange = v => {
        const time = v.format('HH:mm') + ':00';
        this.start_time_format = this.start_time_format.split(' ')[0] + ' ' + time;
    }

    //@override
    //初始化
    componentDidMount() {
        let data = this.props.location.state;
        let fileList = [];
        const { labelProperty } = this.state;
        if (this.checkSafe() == 1) return;
        this.id = data['id'];
        this.goods_id = data.goods_id;
        this.start_time_format = moment(data.start_time).format('YYYY-MM-DD HH:mm') + ':00';
        for (let key in labelProperty) {
            this.transToView(labelProperty, key, data);
            if (key === 'score' || key === 'survive_time' || key === 'plan_inventory') {
                labelProperty[key].temp = <InputNumber min={0} step={1} />
            } else if (key === 'start_time') {
                labelProperty[key].temp = <div>
                    <DatePicker allowClear={false} onChange={this.dateChange} defaultValue={moment(data[key])}/>
                    <span style={{ marginLeft: 3, marginRight: 3 }}></span>
                    <TimePicker allowClear={false} onChange={this.timeChange} format={'HH:mm'} defaultValue={moment(data[key])}/>
                </div>
            }
        }
        this.setState({
            labelProperty: labelProperty,
            fileList
        }, () => {
            this.uploadRenderStart = true;
        });
    }

    transToView(labelProperty, key, data) {
        labelProperty[key]['initialValue'] = data[key];
    }

    transToModel(values) {
        
    }
}

const SeckillEdit = Form.create()(SeckillEditTemp);

export default SeckillEdit;