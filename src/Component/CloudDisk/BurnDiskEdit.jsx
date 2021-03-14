import React from 'react';
import BaseEditList from '../common/BaseEditList.jsx';
import { Form, Input, Spin, message, Select, Button, Table, Cascader } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import ModalTemp from '../common/Modal.jsx';
import debounce from 'lodash/debounce';
import moment from 'moment';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
moment.locale('zh-cn');

const FormItem = Form.Item;
const { Option, OptGroup } = Select;
const { TextArea } = Input;

class YBScoreEditTemp extends BaseEditList {
    constructor(props) {
        super(props);
        this.target_key_prefix = '/burnDisk/targetBurnDisk/';
        this.state.labelProperty = {
            diskName: { label: '盘名', temp: <Input></Input> },
            projectId: { label: '工程名', temp: <Input disabled={true}></Input> },
            remark: { label: '定制', temp: <TextArea></TextArea> },
            customerList: { label: '适用客户' },
            dependencies: { label: '补丁表' },
        }
    }

    selectedCustomer = value => {
        const customerList = value.map(items => ({
            user_id: items.key,
            cn_abb: items.label,
        }));
        this.props.form.setFieldsValue({
            customerList,
        });
    }

    handleModalDefine() {
        const token = sessionStorage.getItem('token');
        const id = this.props.location.state._id;
        request.delete(common.baseUrl(this.target_key_prefix + id))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                message.success(res.body.msg);
                Base.RemoveStateSession();
				this.handleBackClick();
            });
    }

    async componentDidMount() {
        this.initComp();
    }

    initComp = () => {
        const data = this.props.location.state;
        const { labelProperty } = this.state;
        for (let key in labelProperty) {
            labelProperty[key].initialValue = data[key];
            if (key === 'customerList') {
                labelProperty[key].temp = <UserRemoteSelect disabled={false} defaultMemberList={data['customerList']} selectedMember={this.selectedCustomer}></UserRemoteSelect>;
            } else if (key === 'dependencies') {
                labelProperty[key].temp = <DependenciesMapper _id={data._id} value={data.dependencies} />;
            }
        }
        this.setState({
            labelProperty,
        }, () => {
            this.uploadRenderStart = true;
        });
    }

    handleSubmit = async e => {
        if (e) {
            e.preventDefault();
        }
        await new Promise(resolve => {
            this.props.form.validateFieldsAndScroll((err, values) => {
                if (!err) {
                    let galleryIsValid = true;
                    for (let i = 0; i < values.dependencies.length; i++) {
                        const { type, picId } = values.dependencies[i];
                        if (type === 'gallery' && picId.length === 0) {
                            galleryIsValid = false;
                            break;
                        }
                    }
                    if (!galleryIsValid) {
                        message.error('请至少选择一张照片');
                        return;
                    }
                    values.userIds = values.customerList.map(items => Number(items.user_id));
                    delete values.customerList;
                    values._id = this.props.location.state._id;
                    const token = sessionStorage.getItem('token');
                    request.put(common.baseUrl('/burnDisk/updateInfo'))
                        .set("token", token)
                        .send(values)
                        .end((err, res) => {
                            if (res.body.code == 200) {
                                message.success(res.body.msg);
                                this.id = this.props.location.state._id;
                                this.getOrderIdItem(result => {
                                    //sessionState替换
                                    let stateData = Base.GetStateSession();
                                    let { data } = stateData;
                                    data.forEach((items,index) => {
                                        if(items._id==result._id){
                                            data[index] = result;
                                            Base.SetStateSession(stateData);
                                        }
                                    });
                                    this.handleBackClick();
                                });
                            } else {
                                message.error(res.body.msg);
                            }
                            resolve();
                        });
                }
            });
        });
    }

    //操作按钮
    actionBtns() {
        return <FormItem style={{ textAlign: 'center' }}>
            <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
            <Button style={{ "marginLeft": 50 }} type="danger" onClick={this.handleDelete}>删除</Button>
            <Button style={{ "marginLeft": 50 }} onClick={this.handleBackClick}>返回</Button>
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
                            <div className="son" key="diskName">
                                <FormItem key={'diskName'} {...formItemLayout} label={record['diskName'].label}>
                                    {getFieldDecorator('diskName', { initialValue: record['diskName'].initialValue })(record['diskName'].temp)}
                                </FormItem>
                            </div>
                            <div className="son" key="projectId">
                                <FormItem key={'projectId'} {...formItemLayout} label={record['projectId'].label}>
                                    {getFieldDecorator('projectId', { initialValue: record['projectId'].initialValue })(record['projectId'].temp)}
                                </FormItem>
                            </div>
                            <div className="son" key="remark">
                                <FormItem key={'remark'} {...formItemLayout} label={record['remark'].label}>
                                    {getFieldDecorator('remark', { initialValue: record['remark'].initialValue })(record['remark'].temp)}
                                </FormItem>
                            </div>
                            <div key="customerList" className="son">
                                <FormItem key={'customerList'} {...formItemLayout} label={record['customerList'].label}>
                                    {getFieldDecorator('customerList', { initialValue: record['customerList'].initialValue })(record['customerList'].temp)}
                                </FormItem>
                            </div>
                            <div key="dependencies" style={{ width: '100%' }}>
                                <FormItem key={'dependencies'} {...{ labelCol: { xs: { span: 3 } }, wrapperCol: { xs: { span: 18 } } }} label={record['dependencies'].label}>
                                    {getFieldDecorator('dependencies', { initialValue: record['dependencies'].initialValue })(record['dependencies'].temp)}
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

    initValue = defaultMemberList => {
        const value = defaultMemberList.map(items => ({
            key: items.user_id,
            label: items.cn_abb,
        }));
        this.setState({ value });
    }

    fetchUser = keywords => {
        this.lastFetchId += 1;
        const fetchId = this.lastFetchId;
        this.setState({ data: [], fetching: true });
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/customers/list'))
            .set("token", token)
            .query({
                page: 1,
                num: 5,
                keywords,
                order: 'user_id',
                filter: JSON.stringify({ "group": "", "level": "", "certified": "" })
            })
            .end((err, res) => {
                if (fetchId !== this.lastFetchId) {
                    return;
                }
                const data = res.body.data.data.map(items => ({
                    text: `${items.cn_abb}`,
                    value: items.user_id,
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
                    placeholder="选择客户"
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
            </div>
        );
    }
}

class DependenciesMapper extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
        value: [],
        clsList: {},
        totalDependencies: {},
        showSearch: false,
    };

    _uuidCreator = (type, id) => {
        let str = '';
        for (let i = 0; i < type.length; i++) {
            str += String(type.charCodeAt(i));
        }
        str += String(id) + String(Date.now()) + String(Number.parseInt(Math.random() * 1000));
        return str;
    }

    async componentDidMount() {
        await this.getClsList();
        await this.getDependenciesList();
        const { value } = this.props;
        this.setState({
            value,
        });
    }

    getClsList = async () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getClsList'))
            .set("token", token)
            .end((err, res) => {
                this.setState({
                    clsList: res.body.data,
                });
            });
    }

    getDependenciesList = async () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/burnDisk/getDependenciesList'))
            .set("token", token)
            .end((err, res) => {
                this.setState({
                    totalDependencies: res.body.data,
                });
            });
    }

    removeDependency = record => {
        const { id, type, uuid } = record;
        const { value } = this.state;
        value.forEach((items, index) => {
            if (items.uuid === uuid) {
            // if (items.type === type && items.id == id) {
                value.splice(index, 1);
            }
        });
        this.setState({
            value,
        });
    }

    downloadDependency = record => {
        const { id, type } = record;
        const { _id } = this.props;
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/burnDisk/buildDependency/' + _id))
            .set("token",token)
            .send({ fileId: id, type })
            .end((err,res) => {
                if(err) return;
                if (res.body.code === 200) {
                    window.open(common.baseUrl2(`/open/burnDisk/download/${res.body.data}`));
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    versionChange = (record, v) => {
        const { id, type, uuid } = record;
        const { totalDependencies, value } = this.state;
        let selectedItem;
        for (let i = 0; i < totalDependencies[type].length; i++) {
            if (totalDependencies[type][i].id == v) {
                selectedItem = totalDependencies[type][i];
            }
        }
        if (selectedItem) {
            value.forEach((items, index) => {
                if (items.uuid === uuid) {
                // if (items.type == type && items.id == id) {
                    value[index].id = v;
                    value[index].version = selectedItem.softVersionNo;
                    value[index].description = selectedItem.softCreateDescription;
                }
            });
        }
        this.setState({
            value,
        });
    }

    picChange = (record, v) => {
        const { id, type, name, uuid } = record;
        const { totalDependencies, value } = this.state;
        let selectedItem;
        for (let i = 0; i < totalDependencies[type].length; i++) {
            if (totalDependencies[type][i].name == name) {
                selectedItem = totalDependencies[type][i];
            }
        }
        if (selectedItem) {
            value.forEach((items, index) => {
                if (items.uuid === uuid) {
                // if (items.type == type && items.id == id) {
                    value[index].picId = v;
                }
            });
        }
        this.setState({
            value,
        });
    }

    relativePathChange = (record, v) => {
        const { value } = this.state;
        const { id, type, uuid } = record;
        value.forEach((items, index) => {
            if (items.uuid === uuid) {
            // if (items.type === type && items.id == id) {
                value[index].relativePath = v;
            }
        });
        this.setState({ value });
    }

    getColumns = () => {
        const { totalDependencies } = this.state;
        const columns = [
            {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                width: 100,
                render: text => {
                    if (text === 'soft') {
                        return '软件';
                    } else if (text === 'docLib') {
                        return '文档';
                    } else if (text === 'gallery') {
                        return '图库';
                    }
                    return text;
                },
            },
            {
                title: '补丁名',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => {
                    if (record.type === 'soft' && totalDependencies.soft) {
                        return <span title={record.description}>{text}</span>;
                    }
                    return text;
                }
            },
            {
                title: '版本号',
                dataIndex: 'version',
                key: 'version',
                render: (text, record) => {
                    if (record.type === 'soft' && totalDependencies.soft) {
                        const targetVersionArr = totalDependencies.soft.filter(items => items.projectId === record.name);
                        return (
                            <Select value={record.version} onChange={v => this.versionChange(record, v)}>
                                { targetVersionArr.map(items => (
                                    <Option title={items.softCreateDescription} key={items.id} value={items.id}>{items.softVersionNo}</Option>
                                )) }
                            </Select>
                        );
                    } else if (record.type === 'gallery' && totalDependencies.gallery) {
                        const gallerySubs = totalDependencies.gallery.filter(items => items.name === record.name)[0].GallerySubs;
                        return (
                            <Select value={record.picId} mode="multiple" onChange={v => this.picChange(record, v)} >
                                { gallerySubs.map(items => (
                                    <Option key={items.id} value={items.id}>
                                        <img style={{width: 30}} src={common.staticBaseUrl(`/img/gallery/${items.album}`)} />
                                    </Option>
                                )) }
                            </Select>
                        );
                    }
                    return text;
                },
            },
            {
                title: '相对目录',
                dataIndex: 'relativePath',
                key: 'relativePath',
                render: (text, record) => {
                    return <Input onChange={e => this.relativePathChange(record, e.target.value)} value={text}/>
                },
            },
            {
                title: '操作',
                dataIndex: 'action',
                key: 'action',
                width: 100,
                render: (text, record) => {
                    return (
                        <div>
                            <a onClick={() => this.downloadDependency(record)} href="javascript:void(0);">下载</a>
                            <a onClick={() => this.removeDependency(record)} style={{marginLeft: 6}} href="javascript:void(0);">删除</a>
                        </div>
                    );
                },
            }
        ];
        return columns;
    }

    renderSoftSelect = () => {
        const { totalDependencies, clsList } = this.state;
        const options = [];
        for (const type in totalDependencies) {
            const children = [];
            if (type === 'soft') {
                const softMapper = {};
                totalDependencies[type].forEach(items => {
                    const { projectId } = items;
                    if (!softMapper[projectId]) {
                        softMapper[projectId] = [];
                    }
                    softMapper[projectId].push(items);
                });
                for (const firstCls in clsList) {
                    const secondClsArr = clsList[firstCls];
                    const o = { value: firstCls, label: firstCls, children: [] };
                    for (let i = 0; i < secondClsArr.length; i++) {
                        const secondCls = secondClsArr[i];
                        const cArr = [];
                        for (const projectId in softMapper) {
                            const o = { value: projectId, label: projectId, children: [] };
                            softMapper[projectId].forEach(items => {
                                if (items.firstCls === firstCls && items.secondCls === secondCls) {
                                    o.children.push({ value: items.id, label: items.softVersionNo });
                                }
                            });
                            if (o.children.length !== 0) {
                                cArr.push(o);
                            }
                        }
                        if (cArr.length !== 0) { 
                            o.children.push({ value: secondCls, label: secondCls, children: cArr });
                        }
                    }
                    if (o.children.length !== 0) {
                        children.push(o);
                    }
                }
                // for (const projectId in softMapper) {
                //     const o = { value: projectId, label: projectId, children: [] };
                //     softMapper[projectId].forEach(items => {
                //         o.children.push({ value: items.id, label: items.softVersionNo, });
                //     });
                //     children.push(o);
                // }
                options.push({ value: 'soft', label: '软件', children });
            } else if (type === 'docLib') {
                totalDependencies[type].forEach(items => {
                    children.push({ value: items.id, label: items.name });
                });
                options.push({ value: 'docLib', label: '文档', children });
            } else if (type === 'gallery') {
                totalDependencies[type].forEach(items => {
                    const o = { value: items.name, label: items.name, children: [] };
                    items.GallerySubs.map(items => {
                        o.children.push({
                            value: items.id,
                            label: items.album,
                            // label: <img key={items.id} style={{width: 30}} src={common.staticBaseUrl(`/img/gallery/${items.album}`)} />,
                        });
                    });
                    children.push(o);
                });
                options.push({ value: 'gallery', label: '图库', children });
            }
        }
        return options;
    }

    addDependency = v => {
        const type = v[0];
        const id = v[v.length - 1];
        const { totalDependencies, value } = this.state;
        let selectedItem;
        totalDependencies[type].forEach(items => {
            if (type === 'gallery') {
                if (items.name == v[1]) {
                    selectedItem = items;
                }
            } else {
                if (items.id == id) {
                    selectedItem = items;
                }
            }
        });
        if (selectedItem) {
            const uuid = this._uuidCreator(type, id);
            if (type === 'soft') {
                value.unshift({ uuid, type, id, name: selectedItem.projectId, version: selectedItem.softVersionNo, description: selectedItem.softCreateDescription, relativePath: '/' });
            } else if (type === 'docLib') {
                value.unshift({ uuid, type, id, name: selectedItem.name, relativePath: '/' });
            } else if (type === 'gallery') {
                let picId = selectedItem.GallerySubs.filter(items => items.id == id);
                picId = picId.map(items => items.id);
                value.unshift({ uuid, type, id: selectedItem.id, name: selectedItem.name, picId, relativePath: '/' });
            }
        }
        this.setState({ value, showSearch: false });

        function checkIsExist(v) {
            const type = v[0];
            const id = v[v.length - 1];
            let isExist = false;
            value.forEach(items => {
                if (v.length === 3) {
                    if (items.type == type && items.name == v[1]) {
                        isExist = true;
                    }
                } else {
                    if (items.type == type && items.id == id) {
                        isExist = true;
                    }
                }
            });
            return isExist;
        }
    }

    render() {
        const columns = this.getColumns();
        const { showSearch, value: dataSource, totalDependencies } = this.state;
        return (
            <div>
                { !showSearch && <Button onClick={() => this.setState({ showSearch: true })}>新增</Button> }
                { showSearch && <Cascader
                    options={this.renderSoftSelect()}
                    allowClear={false}
                    showSearch
                    onChange={this.addDependency}
                /> }
                <Table style={{marginTop: 6}} dataSource={dataSource} columns={columns} pagination={false} />
            </div>
        )
    }
}

const YBScoreEdit = Form.create()(YBScoreEditTemp);

export default YBScoreEdit;