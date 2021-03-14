import React from 'react';
import BaseEditList from '../common/BaseEditList.jsx';
import { Form, Button, InputNumber, message, DatePicker, Select, Radio, Input } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');
const FormItem = Form.Item;

class YBScoreAddTemp extends BaseEditList {
    constructor(props) {
        super(props);
        this.miniActivityList = [];
        this.state.type = 1;
        this.state.staffArr = [[], [], [], []];
        this.state.labelProperty = {
            type: {
                label: '类型', initialValue: this.state.type, temp: <Radio.Group onChange={this.typeChange}>
                    <Radio value={1}>普通</Radio>
                    <Radio value={2}>问答小程序</Radio>
                </Radio.Group>
            },
            activityName: { label: '活动名', initialValue: '', rules: [{ required: true, message: '活动名不能为空' }], temp: <Input /> },
            miniActivityName: { label: '活动名', initialValue: '', rules: [{ required: true, message: '活动名不能为空' }], temp: <Input /> },
            hostDate: { label: '举办日期', rules: [{ required: true, message: '举办日期不能为空' }], temp: <DatePicker /> },
            hostDays: { label: '举办天数', initialValue: 1, temp: <InputNumber min={1} max={30} /> },
            team: { label: '活动团队', initialValue: [] },
        }
    }

    async componentDidMount() {
        this.fetchMiniActivityList();
        this.initComp();
        await this.fetchAllStaff();
        await this.fetchMiniActivityList();
        this.initComp();
    }

    typeChange = e => {
        this.setState({
            type: e.target.value,
        });
    }

    miniTitleChange = v => {
        const selectedData = this.miniActivityList.filter(items => items.id == v)[0];
        let { createTime, deadline } = selectedData;
        createTime = moment(createTime);
        deadline = moment(deadline);
        const hostDays = deadline.diff(createTime, 'days');
        this.props.form.setFieldsValue({
            hostDate: createTime,
            hostDays,
        });
    }

    initComp = () => {
        const { labelProperty, staffArr } = this.state;
        for (let key in labelProperty) {
            if (!labelProperty[key].hasOwnProperty('initialValue')) {
                labelProperty[key]['initialValue'] = null;
            }
            if (key === 'team') {
                labelProperty[key].temp = <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                >
                    <Select.OptGroup label="研发部">
                        {
                            staffArr[0].map(items =>
                                <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                            )
                        }
                    </Select.OptGroup>
                    <Select.OptGroup label="客户关系部">
                        {
                            staffArr[1].map(items =>
                                <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                            )
                        }
                    </Select.OptGroup>
                    <Select.OptGroup label="生产部">
                        {
                            staffArr[2].map(items =>
                                <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                            )
                        }
                    </Select.OptGroup>
                    <Select.OptGroup label="管理部">
                        {
                            staffArr[3].map(items =>
                                <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                            )
                        }
                    </Select.OptGroup>
                </Select>
            } else if (key === 'miniActivityName') {
                labelProperty[key].temp = <Select onChange={this.miniTitleChange}>
                    {
                        this.miniActivityList.map(items => (
                            <Select.Option key={items.id} value={items.id}>{items.title}</Select.Option>
                        ))
                    }
                </Select>
            }
        }
        this.setState({
            labelProperty,
        }, () => {
            this.uploadRenderStart = true;
        });
    }

    fetchMiniActivityList = async () => {
        await new Promise(resolve => {
            request.get('https://mp.langjie.com/easyAnswer/open/titleInfo')
            .end((err, res) => {
                if (err) return;
                this.miniActivityList = res.body.data.data;
                resolve();
            });
        });
    }

    //获取所有员工信息
    fetchAllStaff = async () => {
        await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/staff/all'))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    const staffArr = [[], [], [], []];
                    const staffData = res.body.data;
                    staffData.forEach((items) => {
                        const { branch, user_id, user_name } = items;
                        const info = {
                            user_id,
                            user_name,
                        };
                        if (branch === '研发部') {
                            staffArr[0].push(info);
                        } else if (branch === '客户关系部') {
                            staffArr[1].push(info);
                        } else if (branch === '生产部') {
                            staffArr[2].push(info);
                        } else {
                            staffArr[3].push(info);
                        }
                    });
                    this.setState({
                        staffArr,
                    });
                    resolve();
                });
        });
    }

    actionBtns() {
        return <FormItem style={{ textAlign: 'center' }}>
            <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
            <Button style={{ "marginLeft": 50 }} onClick={this.handleBackClick}>返回</Button>
        </FormItem>
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                values.team = values.team.join();
                if (values.type === 2) {
                    values.miniProgramActivityId = values.miniActivityName;
                    values.activityName = this.miniActivityList.filter(items => items.id == values.miniActivityName)[0].title;
                }
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/member/createActivity'))
                    .set("token", token)
                    .send(values)
                    .end((err, res) => {
                        if (res.body.code == 200) {
                            message.success(res.body.msg);
                            this.handleBackClick();
                        } else {
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }

    render() {
        if (!this.uploadRenderStart) return <div></div>;
        const { type } = this.state;
        let record = this.state.labelProperty;
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } } };
        return (
            <div>
                <Form onSubmit={this.handleSubmit} style={{ padding: 24 }}>
                    <div className="dadContainer" style={{ marginBottom: 40 }}>
                        <div className="son" key="type">
                            <FormItem key={'type'} {...formItemLayout} label={record['type'].label}>
                                {getFieldDecorator('type', { initialValue: record['type'].initialValue })(record['type'].temp)}
                            </FormItem>
                        </div>
                        <div className="son" key="foo1">

                        </div>
                        <div className="son" key="activityName">
                            <FormItem key={'activityName'} {...formItemLayout} label={record['activityName'].label}>
                                {type === 1 && getFieldDecorator('activityName', { initialValue: record['activityName'].initialValue, rules: record['activityName'].rules })(record['activityName'].temp)}
                                {type === 2 && getFieldDecorator('miniActivityName', { initialValue: record['miniActivityName'].initialValue, rules: record['activityName'].rules })(record['miniActivityName'].temp)}
                            </FormItem>
                        </div>
                        <div className="son" key="hostDate">
                            <FormItem key={'hostDate'} {...formItemLayout} label={record['hostDate'].label}>
                                {getFieldDecorator('hostDate', { initialValue: record['hostDate'].initialValue, rules: record['hostDate'].rules })(record['hostDate'].temp)}
                            </FormItem>
                        </div>
                        <div className="son" key="hostDays">
                            <FormItem key={'hostDays'} {...formItemLayout} label={record['hostDays'].label}>
                                {getFieldDecorator('hostDays', { initialValue: record['hostDays'].initialValue })(record['hostDays'].temp)}
                            </FormItem>
                        </div>
                        <div className="son" key="team">
                            <FormItem key={'team'} {...formItemLayout} label={record['team'].label}>
                                {getFieldDecorator('team', { initialValue: record['team'].initialValue })(record['team'].temp)}
                            </FormItem>
                        </div>
                    </div>
                    {this.actionBtns()}
                </Form>
            </div>
        )
    }
}

const YBScoreAdd = Form.create()(YBScoreAddTemp);

export default YBScoreAdd;