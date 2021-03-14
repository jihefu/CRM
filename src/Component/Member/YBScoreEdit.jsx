import React from 'react';
import BaseEditList from '../common/BaseEditList.jsx';
import { Form, Input, Spin, message, Select, Button, Upload, Icon, DatePicker, InputNumber } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import ModalTemp from '../common/Modal.jsx';
import debounce from 'lodash/debounce';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

const FormItem = Form.Item;
const { Option } = Select;

class YBScoreEditTemp extends BaseEditList {
    constructor(props) {
        super(props);
        this.memberArr = this.props.location.state.memberArr;
        this.state.staffArr = [[], [], [], []];
        this.state.imgArr = [];
        this.state.labelProperty = {
            activityName: { label: '活动名', temp: <Input disabled={true}></Input> },
            hostDate: { label: '举办日期', rules: [{ required: true, message: '举办日期不能为空' }], temp: <DatePicker /> },
            album: { label: '照片' },
            hostDays: { label: '举办天数', temp: <InputNumber min={1} max={30} /> },
            team: { label: '活动团队' },
            score: { label: '元宝分' },
            memberArr: { label: '会员' },
            add_person: { label: '录入人', temp: <Input disabled={true}></Input> },
            check_person: { label: '审核人', temp: <Input disabled={true}></Input> },
        }
    }

    selectedMember = value => {
        const openIdArr = value.map(items => items.key);
        this.props.form.setFieldsValue({
            memberArr: openIdArr,
        });
    }

    handleModalDefine() {
        const { activityId } = this.props.location.state;
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/member/deleteActivity'))
            .set("token", token)
            .send({
                activityId,
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                this.handleBackClick();
            });
    }

    async componentDidMount() {
        this.initComp();
        await this.fetchAllStaff();
        await this.fetchMiniMemberList();
        this.initComp();
    }

    fetchMiniMemberList = async () => {
        const { miniProgramActivityId, type } = this.props.location.state;
        await new Promise(resolve => {
            if (type == 1) {
                resolve();
                return;
            }
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/member/getMiniMemberListById/' + miniProgramActivityId))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    this.memberArr = res.body.data;
                    const openIdArr = res.body.data.map(items => items.open_id);
                    this.props.form.setFieldsValue({
                        memberArr: openIdArr,
                    });
                    resolve();
                });
        });
    }

    initComp = () => {
        const data = this.props.location.state;
        const { check_state, type } = data;
        const { labelProperty, staffArr } = this.state;
        let imgArr;
        let memberDisabled, ybDisabled;
        if (check_state == 0 && type == 1) {
            memberDisabled = false;
        } else {
            memberDisabled = true;
        }
        if (check_state == 0) {
            ybDisabled = false;
        } else {
            ybDisabled = true;
        }
        for (let key in labelProperty) {
            if (key === 'hostDate') {
                labelProperty[key].initialValue = data[key] ? moment(data[key]) : moment();
            } else if (key === 'team') {
                labelProperty[key].initialValue = data[key].split(',').filter(items => items);
            } else {
                labelProperty[key].initialValue = data[key];
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
            } else if (key === 'album') {
                let _arr = [];
                try {
                    _arr = labelProperty[key].initialValue.split(',').filter(items => items);
                } catch (e) {

                }
                imgArr = _arr.map((items, index) => ({
                    uid: items,
                    name: items,
                    status: 'done',
                    key: items,
                    url: common.staticBaseUrl('/img/notiClient/' + items)
                }));
            } else if (key === 'score') {
                labelProperty[key].temp = <InputNumber disabled={ybDisabled} min={0} max={2000} />
            } else if (key === 'memberArr') {
                labelProperty[key].temp = <UserRemoteSelect disabled={memberDisabled} defaultMemberList={this.memberArr} selectedMember={this.selectedMember}></UserRemoteSelect>
            }
        }
        this.setState({
            labelProperty,
            imgArr,
        }, () => {
            this.uploadRenderStart = true;
        });
    }

    uploadProps = () => {
        const { imgArr } = this.state;
        const self = this;
        const token = sessionStorage.getItem('token');
        return {
            action: common.baseUrl('/notiClient/imgUpload'),
            defaultFileList: imgArr,
            name: 'file',
            headers: { token },
            accept: 'image/*',
            multiple: false,
            listType: 'picture',
            onChange(res) {
                if (res.file.status === 'done') {
                    const uploadedItem = res.file.response.data[0];
                    const { imgArr } = self.state;
                    imgArr.push({
                        uid: uploadedItem,
                        name: uploadedItem,
                        status: 'done',
                        key: uploadedItem,
                        url: common.staticBaseUrl('/img/notiClient/' + uploadedItem)
                    });
                    self.setState({ imgArr });
                }
            },
            onRemove(removedItem) {
                let { imgArr } = self.state;
                imgArr = imgArr.filter(items => items.key !== removedItem.key);
                self.setState({ imgArr });
            }
        };
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

    handleSubmit = async e => {
        const { imgArr } = this.state;
        if (e) {
            e.preventDefault();
        }
        await new Promise(resolve => {
            this.props.form.validateFieldsAndScroll((err, values) => {
                if (!err) {
                    values.album = imgArr.map(items => items.name);
                    values.album = values.album.join();
                    values.team = values.team.join();
                    values.open_id_arr = values.memberArr.map(items => {
                        if (typeof items === 'string') {
                            return items;
                        } else {
                            return items.open_id;
                        }
                    });
                    values.open_id_arr = values.open_id_arr.join();
                    values.id = this.props.location.state.id;
                    const token = sessionStorage.getItem('token');
                    request.put(common.baseUrl('/member/updateActivityProps'))
                        .set("token", token)
                        .send(values)
                        .end((err, res) => {
                            if (res.body.code == 200) {
                                message.success(res.body.msg);
                            } else {
                                message.error(res.body.msg);
                            }
                            resolve();
                        });
                }
            });
        });
    }

    // 申请审核
    applyCheck = async () => {
        // 先执行更新操作
        await this.handleSubmit();
        let openIdArr = this.props.form.getFieldValue('memberArr');
        openIdArr = openIdArr.map(items => {
            if (typeof items === 'string') {
                return items;
            } else {
                return items.open_id;
            }
        });
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/member/applyCheck'))
            .set("token", token)
            .send({
                id: this.props.location.state.id,
                openIdArr,
            })
            .end((err, res) => {
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    this.handleBackClick();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 通过
    checkPass = () => {
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/member/checkPass'))
            .set("token", token)
            .send({
                id: this.props.location.state.id,
            })
            .end((err, res) => {
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    this.handleBackClick();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 退回
    checkNotPass = () => {
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/member/checkNotPass'))
            .set("token", token)
            .send({
                id: this.props.location.state.id,
            })
            .end((err, res) => {
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    this.handleBackClick();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    //操作按钮
    actionBtns() {
        const { check_state } = this.props.location.state;
        const { staffArr } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        const powerCheckArr = staffArr[3].map(items => items.user_id);
        let hasCheckPower = false;
        if (check_state == 1 && powerCheckArr.includes(user_id)) {
            hasCheckPower = true;
        }
        return <FormItem style={{ textAlign: 'center' }}>
            <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
            <Button style={{ "marginLeft": 50 }} type="danger" onClick={this.handleDelete}>删除</Button>
            <Button style={{ "marginLeft": 50 }} onClick={this.handleBackClick}>返回</Button>
            {check_state == 0 && <Button style={{ "marginLeft": 50 }} onClick={this.applyCheck}>申请审核</Button>}
            {hasCheckPower && <Button style={{ "marginLeft": 50 }} onClick={this.checkPass}>通过</Button>}
            {hasCheckPower && <Button style={{ "marginLeft": 50 }} onClick={this.checkNotPass}>退回</Button>}
        </FormItem>
    }

    render() {
        if (!this.uploadRenderStart) return <div></div>;
        let record = this.state.labelProperty;
        const { spinning } = this.state;
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } } };
        return (
            <Spin spinning={spinning}>
                <div>
                    <Form onSubmit={this.handleSubmit} style={{ padding: 24 }}>
                        <div className="dadContainer" style={{ marginBottom: 40 }}>
                            <div className="son" key="activityName">
                                <FormItem key={'activityName'} {...formItemLayout} label={record['activityName'].label}>
                                    {getFieldDecorator('activityName', { initialValue: record['activityName'].initialValue })(record['activityName'].temp)}
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
                            <div className="son" key="score">
                                <FormItem key={'score'} {...formItemLayout} label={record['score'].label}>
                                    {getFieldDecorator('score', { initialValue: record['score'].initialValue })(record['score'].temp)}
                                </FormItem>
                            </div>
                            <div className="son" key="foo1">

                            </div>
                            <div className="son" key="add_person">
                                <FormItem key={'add_person'} {...formItemLayout} label={record['add_person'].label}>
                                    {getFieldDecorator('add_person', { initialValue: record['add_person'].initialValue })(record['add_person'].temp)}
                                </FormItem>
                            </div>
                            <div className="son" key="check_person">
                                <FormItem key={'check_person'} {...formItemLayout} label={record['check_person'].label}>
                                    {getFieldDecorator('check_person', { initialValue: record['check_person'].initialValue })(record['check_person'].temp)}
                                </FormItem>
                            </div>
                            <div key="memberArr" style={{ width: '100%' }}>
                                <FormItem key={'memberArr'} {...{ labelCol: { xs: { span: 3 } }, wrapperCol: { xs: { span: 18 } } }} label={record['memberArr'].label}>
                                    {getFieldDecorator('memberArr', { initialValue: record['memberArr'].initialValue })(record['memberArr'].temp)}
                                </FormItem>
                            </div>
                            <div key="album" style={{ width: '100%' }}>
                                <FormItem {...{ labelCol: { xs: { span: 3 } }, wrapperCol: { xs: { span: 18 } } }} label={record['album'].label}>
                                    <Upload {...this.uploadProps()}>
                                        <Button>
                                            <Icon type="upload" />上传照片
                                        </Button>
                                    </Upload>
                                </FormItem>
                            </div>
                        </div>
                        {this.actionBtns()}
                    </Form>
                    <ModalTemp
                        handleModalCancel={this.handleModalCancel}
                        handleModalDefine={this.handleModalDefine}
                        ModalText={this.state.modalText}
                        visible={this.state.visible} />
                </div>
            </Spin>
        )
    }
}

class UserRemoteSelect extends React.Component {
    constructor(props) {
        super(props);
        this.lastFetchId = 0;
        this.fetchUser = debounce(this.fetchUser, 500);
    }

    state = {
        data: [],
        value: [],
        fetching: false,
    };

    componentDidMount() {
        this.initValue(this.props.defaultMemberList);
    }

    componentWillReceiveProps(props) {
        this.initValue(props.defaultMemberList);
    }

    initValue = defaultMemberList => {
        const value = defaultMemberList.map(items => ({
            key: items.open_id,
            label: items.name + ' ' + items.phone,
        }));
        this.setState({ value });
    }

    fetchUser = keywords => {
        this.lastFetchId += 1;
        const fetchId = this.lastFetchId;
        this.setState({ data: [], fetching: true });
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/member/list'))
            .set("token", token)
            .query({
                page: 1,
                num: 5,
                keywords,
                order: 'id',
                filter: JSON.stringify({ "state": "", "codeType": "", "delStatus": "未删除", "isUser": "" })
            })
            .end((err, res) => {
                if (fetchId !== this.lastFetchId) {
                    return;
                }
                const data = res.body.data.data.map(items => ({
                    text: `${items.name} ${items.phone}`,
                    value: items.open_id,
                }));
                this.setState({ data, fetching: false });
            });
    };

    handleChange = value => {
        this.setState({
            value,
            data: [],
            fetching: false,
        });
        try {
            this.props.selectedMember(value);
        } catch (e) {

        }
    };

    parseExcelPhoneForActivityProps = () => {
        const self = this;
        return {
            name: 'file',
            action: common.baseUrl('/member/parseExcelPhoneForActivity'),
            headers: {
                token: sessionStorage.getItem('token'),
            },
            accept: '.xlsx',
            showUploadList: false,
            onChange(info) {
                if (info.file.status === 'done') {
                    if (info.file.response.code != 200) {
                        message.error(info.file.response.msg);
                    } else {
                        message.success(info.file.response.msg);
                        const { value } = self.state;
                        const existOpenIdMapper = {};
                        for (let i = 0; i < value.length; i++) {
                            const { key: open_id } = value[i];
                            existOpenIdMapper[open_id] = 1;
                        }
                        const newData = info.file.response.data;
                        for (let i = 0; i < newData.length; i++) {
                            const { name, phone, open_id } = newData[i];
                            if (!existOpenIdMapper[open_id]) {
                                value.push({
                                    key: open_id,
                                    label: `${name} ${phone}`,
                                });
                            }
                        }
                        self.handleChange(value);
                    }
                } else if (info.file.status === 'error') {
                    message.error(info.file.response.msg);
                }
            },
        };
    };

    render() {
        const { fetching, data, value } = this.state;
        const { disabled } = this.props;
        return (
            <div>
                <Select
                    disabled={disabled}
                    mode="multiple"
                    labelInValue
                    value={value}
                    placeholder="Select member"
                    notFoundContent={fetching ? <Spin size="small" /> : null}
                    filterOption={false}
                    onSearch={this.fetchUser}
                    onChange={this.handleChange}
                    style={{ width: '100%' }}
                >
                    {data.map(d => (
                        <Option key={d.value}>{d.text}</Option>
                    ))}
                </Select>
                <Upload {...this.parseExcelPhoneForActivityProps()} >
                    <Button title={'excel格式：第一列为手机号码'} disabled={disabled} style={{ "marginLeft": 0 }}><Icon type="upload" />上传Excel</Button>
                </Upload>
                <span style={{ marginLeft: 12 }}>共{value.length}人</span>
            </div>
        );
    }
}

const YBScoreEdit = Form.create()(YBScoreEditTemp);

export default YBScoreEdit;