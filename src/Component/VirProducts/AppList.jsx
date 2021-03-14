import React, { Component } from 'react';
import { Input, message, Button, Table, Popconfirm, Select, Modal } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
const { Option, OptGroup } = Select;
moment.locale('zh-cn');

class AppList extends Component {
    constructor(props) {
        super(props);
        this.selectAppName = 'MaxTest';
    }

    state = {
        list: [],
        softList: {},
        showSelect: false,
    };

    componentDidMount() {
        this.fetch();
        this.fetchOpenList();
    }

    fetch = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/virProducts/getApp/' + this.props.id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const list = res.body.data.map(items => {
                    if (items.appValidTime == 'null') {
                        items.appValidTime = '';
                    } else if (items.appValidTime == 0) {
                        items.appValidTime = '永久注册';
                    }
                    return items;
                });
                this.setState({
                    list,
                });
            });
    }

    fetchOpenList = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getTotalOpenSoft'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    softList: res.body.data,
                });
            });
    }

    del = record => {
        const { regAppName } = record;
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/virProducts/delApp'))
            .set("token", token)
            .send({
                id: this.props.id,
                appName: regAppName,
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                this.fetch();
                try {
                    this.props.fetch();
                } catch (e) {
                    
                }
            });
    }

    appSelected = v => {
        const index = v.lastIndexOf('-');
        const appName = v.slice(0, index);
        const appVerwsion = v.slice(index+1, v.length);
        this.add(appName, appVerwsion);
    }

    selectApp = () => {
        const { softList } = this.state;
        const softNameArr = [], softVersionArr = [];
        for (const softName in softList) {
            softNameArr.push(softName);
            softVersionArr.push(softList[softName]);
        }
        return (
            <Select style={{width: 300}} onChange={this.appSelected}>
                {
                    softNameArr.map((items, index) => {
                        return (
                            <OptGroup label={items} key={items}>
                                { softVersionArr[index].map(it => <Option key={it} value={items + '-' + it}>{it}</Option>) }
                            </OptGroup>
                        )
                    })
                }
            </Select>
        );
    }

    add = (appName, appVersion) => {
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/virProducts/addApp/'))
            .set("token", token)
            .send({
                id: this.props.id,
                appName,
                _version: appVersion,
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                this.fetch();
                try {
                    this.props.fetch();
                } catch (e) {
                    
                }
            });
    }

    render() {
        const { list, showSelect } = this.state;
        const columns = [
            {
                title: '软件名',
                dataIndex: 'regAppName',
                key: 'regAppName',
            },
            {
                title: '版本号',
                dataIndex: 'appVersion',
                key: 'appVersion',
            },
            {
                title: '有效期',
                dataIndex: 'appValidTime',
                key: 'appValidTime',
            },
            {
                title: '注册码',
                dataIndex: 'appRegCode',
                key: 'appRegCode',
            },
            {
                title: '授权码',
                dataIndex: 'appRegAuth',
                key: 'appRegAuth',
            },
            {
                title: '操作',
                dataIndex: 'action',
                key: 'action',
                render: (text, record) => (
                    <Popconfirm
                        placement="bottomRight"
                        title={'确定删除？'}
                        onConfirm={() => this.del(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <a>删除</a>
                    </Popconfirm>
                ),
            },
        ];

        return (
            <div>
                {/* <Popconfirm
                    placement="bottomLeft"
                    title={this.selectApp()}
                    onConfirm={() => this.add()}
                    okText="Yes"
                    cancelText="No"
                > */}
                <Button style={{marginBottom: 10}} onClick={() => this.setState({ showSelect: true })}>新增App</Button>
                <div style={{marginBottom: 10}}>
                    { showSelect && this.selectApp() }
                </div>
                <Table pagination={false} dataSource={list} columns={columns} />
            </div>
        )
    }
}

export default AppList;