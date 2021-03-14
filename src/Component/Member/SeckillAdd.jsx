import React from 'react';
import { Form, InputNumber, message, Select, Button, TimePicker, DatePicker } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import { SeckillEditTemp } from './SeckillEdit';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const FormItem = Form.Item;
const { Option } = Select;

class SeckillAddTemp extends SeckillEditTemp {
    constructor(props) {
        super(props);
        this.state.labelProperty = {
            goods_id: { label: '礼品名', rules: [{ required: true, message: '不能为空' }] },
            score: { label: '秒杀价' },
            start_time: { label: '秒杀开始时间' },
            survive_time: { label: '秒杀持续时间' },
            plan_inventory: { label: '额定数量' },
        }
        this.uploadRenderStart = true;
    }

    //@overload
    transToView(labelProperty, key) {
        labelProperty[key]['initialValue'] = null;
        if (key === 'score') {
            labelProperty[key]['initialValue'] = 100;
        } else if (key === 'survive_time') {
            labelProperty[key]['initialValue'] = 300;
        } else if (key === 'plan_inventory') {
            labelProperty[key]['initialValue'] = 1;
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

    fetchGoodsList = async () => {
        const token = sessionStorage.getItem('token');
        return await new Promise(resolve => {
            request.get(common.baseUrl('/member/getGiftList'))
                .set("token", token)
                .query({
                    page: 1,
                    num: 100,
                    keywords: '',
                    order: 'id',
                    filter: JSON.stringify({"isOpen":"微信公众号"}),
                })
                .end((err, res) => {
                    if (err) return;
                    const goods_list = res.body.data.data.map(items => ({
                        id: items.id,
                        goodsName: items.goodsName,
                    }));
                    resolve(goods_list);
                })
        });
    }

    //@override
    //初始化
    async componentDidMount() {
        const goods_list = await this.fetchGoodsList();
        this.init(goods_list);
    }

    init = goods_list => {
        const { labelProperty } = this.state;
        let fileList = [];
        this.start_time_format = moment().format('YYYY-MM-DD HH:mm') + ':00';;
        for (let key in labelProperty) {
            this.transToView(labelProperty, key);
            if (key === 'score' || key === 'survive_time' || key === 'plan_inventory') {
                labelProperty[key].temp = <InputNumber min={0} step={1} />
            } else if (key === 'start_time') {
                labelProperty[key].temp = <div>
                    <DatePicker allowClear={false} onChange={this.dateChange} defaultValue={moment()}/>
                    <span style={{ marginLeft: 3, marginRight: 3 }}></span>
                    <TimePicker allowClear={false} onChange={this.timeChange} format={'HH:mm'} defaultValue={moment()}/>
                </div>
            } else if (key === 'goods_id') {
                labelProperty[key].temp = <Select
                    showSearch
                    placeholder="请选择"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    { goods_list.map(items => <Option key={items.id} value={items.id}>{items.goodsName}</Option>) }
              </Select>
            }
        }
        this.setState({
            labelProperty: labelProperty,
            fileList
        });
    }

    //@override
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                this.transToModel(values);
                values.start_time = this.start_time_format;
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/seckill/createSeckillOrder'))
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

const SeckillAdd = Form.create()(SeckillAddTemp);

export default SeckillAdd;