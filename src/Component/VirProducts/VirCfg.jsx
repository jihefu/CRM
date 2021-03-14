import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { message, Table, Form, Button, Popover, Input, Select, Tooltip, Modal, Icon } from 'antd';
import request from 'superagent';
import BaseTableList from '../common/BaseTableList.jsx';
import Base from '../../public/js/base.js';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import $ from 'jquery';
import moment from 'moment';
import 'moment/locale/zh-cn';
import common from '../../public/js/common.js';
moment.locale('zh-cn');
const Option = Select.Option;

class VirCfg extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/vir/list';
        this.editPathName = '/verUnitEdit';
        this.placeholder = '单位名称，序列号';
        this.actionWidth = 100;
        this.filter = [];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
        ];
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 100,
            },
            // model: {
            //     label: '型号',
            //     width: 100,
            // },
            // pulseMode: {
            //     label: 'PM脉冲模式',
            //     width: 100,
            // },
            // authType: {
            //     label: '授权类型',
            //     width: 100,
            // },
            company: {
                label: '客户',
                width: 200,
            },
            endUser: {
                label: '终端用户',
                width: 100,
            },
            versionNo: {
                label: '版本号',
                width: 100,
            },
            name: {
                label: '更新人',
                width: 100,
            },
            // title: {
            //     label: '标题',
            //     width: 200,
            // },
            njiCreateTime: {
                label: '更新时间',
                width: 200,
            },
            versionRem: {
                label: '更新摘要',
                // width: 300,
            },
        };
        this.state.snList = {};
        this.state.nameList = [];
    }

    fetchTempNameList() {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/vir/tempNameList'))
            .set("token", sessionStorage.getItem('token'))
            .end((err, res) => {
                if (err) return;
                const nameList = res.body.data;
                this.nameList = nameList;
                this.setState({
                    nameList,
                });
            });
    }

    // @Override
    viewRender(key, res_data, text, row, index) {
        let width = res_data[key]['width'];
        let content, title;
        if (key == 'versionRem') {
            let defaultWidth = 0;
            if (window.innerWidth > 1800) {
                defaultWidth = 800;
            } else {
                defaultWidth = 200;
            }
            width = defaultWidth;
            content = row[key];
            title = row[key];
        } else if (key === 'serialNo') {
            content = row[key];
            title = <div>
                <div>
                    <span>型号：</span>
                    <span>{row.model}</span>
                </div>
                <div>
                    <span>PM脉冲模式：</span>
                    <span>{row.pulseMode}</span>
                </div>
                <div>
                    <span>授权类型：</span>
                    <span>{row.authType}</span>
                </div>
            </div>
        } else {
            content = row[key];
            title = row[key];
        }
        return <p style={{ width: width - 32, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    // @Override
    inputRender() {
        const { data, pagination } = this.state;
        return <div>
            <Form style={{ "display": "flex", padding: "24px 0 0 24px" }}>
                <div style={{ flex: 1, display: 'flex' }}>
                    <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
                        <Button style={{ "marginRight": 15, "top": 4 }}>{"筛选"}</Button>
                    </Popover>
                    <Form.Item>
                        <Input name="keywords" style={{ width: 300 }} placeholder={this.placeholder} defaultValue={pagination.keywords} />
                    </Form.Item>
                    <Button type="primary" onClick={this.handleSearch} style={{ "position": "relative", "left": 15, "top": 3 }}>搜索</Button>
                    <span style={{ marginLeft: 50 }}>
                        <Select defaultValue={pagination.order} onChange={this.orderChange} style={{ "position": "relative", "top": 3, minWidth: 120 }}>
                            {
                                this.options.map(items =>
                                    <Option key={items.value} value={items.value}>{items.text}</Option>
                                )
                            }
                        </Select>
                    </span>
                </div>
                <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>批量新增</Button>
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    // @Override
    handleCreate() {
        this.singleTempName = null;
        const that = this;
        Modal.confirm({
            icon: <Icon type="info-circle" />,
            title: '批量新增实例',
            content: <div>
                <RemoteSearchInput placeholder={'选择模板'} style={{width: '100%'}} searchInputselected={v => this.cbNameData(v)} cbData={() => {}} remoteUrl={common.baseUrl('/vir/tempNameList?keywords=')} />
                <Input name={'versionRem'} style={{width: '100%', marginTop: 12}} placeholder={'更新摘要'} />
                <div style={{display: 'flex', marginTop: 12}}>
                    <Input name={'startSn'} placeholder={'起始序列号'} />
                    <span style={{marginLeft: 6, marginRight: 6}}>~</span>
                    <Input name={'endSn'} placeholder={'终止序列号'} />
                </div>
            </div>,
            onOk() {
                const versionRem = $('input[name=versionRem]').val();
                if (!that.singleTempName) {
                    message.error('模板名不能为空');
                    return;
                }
                if (!versionRem) {
                    message.error('更新摘要不能为空');
                    return;
                }
                const startSn = $('input[name=startSn]').val();
                const endSn = $('input[name=endSn]').val();
                if (!/^\d+$/.test(startSn) || !/^\d+$/.test(endSn)) {
                    message.error('序列号必须为纯数字');
                    return;
                }
                if (startSn.length !== 7 && endSn.length !== 7) {
                    message.error('序列号长度非法');
                    return;
                }
                if (Number(endSn) < Number(startSn)) {
                    message.error('非法起止序列号');
                    return;
                }
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/vir/createInstance/' + that.singleTempName))
                    .set("token", token)
                    .send({
                        versionRem,
                        startSn,
                        endSn,
                    })
                    .end((err, res) => {
                        if (err) return;
                        message.success(res.body.msg);
                        that.fetch();
                    });
            },
        });
    }

    uploadProps(sn) {
        const that = this;
        return {
            name: 'files',
            action: common.baseUrl('/vir/parseNji'),
            headers: {
                token: sessionStorage.getItem('token'),
            },
            accept: '.json',
            showUploadList: false,
            onChange(info) {
                if (info.file.status === 'done') {
                    const nji = info.file.response.data;
                    const r = window.prompt('更新摘要');
                    if (!r) return;
                    request.post(common.baseUrl('/vir/batchAdd'))
                        .set("token", sessionStorage.getItem('token'))
                        .send({
                            nji,
                            snArr: JSON.stringify([sn]),
                            versionRem: r,
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success(res.body.msg);
                            that.fetchTargetSnList(sn);
                            that.fetch();
                        });
                }
            },
        };
    }

    // @Override
    actionRender(text, row, index) {
        return <p className={"_mark"} style={{display: 'flex'}}>
            <a href="javascript:void(0)" onClick={() => {this.addInstance(row.serialNo)}}>新增</a>
            <a style={{marginLeft: 10}} href="javascript:void(0)" onClick={() => this.downloadNji(row.serialNo, row.njiId)}>下载</a>
        </p>;
    }

    addInstance(sn) {
        this.singleTempName = null;
        const that = this;
        Modal.confirm({
            icon: <Icon type="info-circle" />,
            title: '新建实例（' + sn + '）',
            content: <div>
                <RemoteSearchInput placeholder={'选择模板'} style={{width: '100%'}} searchInputselected={v => this.cbNameData(v)} cbData={() => {}} remoteUrl={common.baseUrl('/vir/tempNameList?keywords=')} />
                <Input name={'versionRem'} style={{width: '100%', marginTop: 12}} placeholder={'更新摘要'} />
            </div>,
            onOk() {
                const versionRem = $('input[name=versionRem]').val();
                if (!that.singleTempName) {
                    message.error('模板名不能为空');
                    return;
                }
                if (!versionRem) {
                    message.error('更新摘要不能为空');
                    return;
                }
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/vir/createInstance/' + that.singleTempName))
                    .set("token", token)
                    .send({
                        versionRem,
                        startSn: sn,
                        endSn: sn,
                    })
                    .end((err, res) => {
                        if (err) return;
                        message.success(res.body.msg);
                        that.fetch();
                        that.fetchTargetSnList(sn);
                    });
            },
        });
    }

    cbNameData(v) {
        this.singleTempName = v;
    }

    // @Override
    tableRender(params) {
        const { columns, data, tableWidth, b_height } = params;
        return <Table
            columns={columns}
            dataSource={data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            scroll={{ x: tableWidth, y: b_height }}
            onRowClick={this.handleTableClick}
            expandedRowRender={this.expandedRowRender}
            onChange={this.handleTableChange} />
    }

    renderExpand(dataSource, data, index) {
        let w = 0;
        for (let i = 1; i < 4; i++) {
            w += window.$('.ant-table-thead>tr>th').eq(i).width() + 16;
        }
        setTimeout(() => {
            let height = window.$('#cfg_' + data.serialNo).height() + 31;
            if (height === 51) height = 37;
            window.$('.ant-table-fixed-right .ant-table-fixed .ant-table-tbody .ant-table-expanded-row[data-row-key='+index+'-extra-row]').height(height);
        }, 300);
        return (
            <div id={'cfg_' + data.serialNo} style={{minHeight: 20}}>
                {
                    dataSource.map((items, index) => (
                        <p key={index} style={{ display: 'flex' }}>
                            <p style={{ width: w, marginBottom: 0 }}></p>
                            <p style={{ marginBottom: 0, width: window.$('.ant-table-thead>tr>th').eq(4).width() + 16 }}>
                                <a title={'下载'} href="javascript:void(0)" onClick={() => this.downloadNji(items.sn, items.contentId)}>
                                    {items.versionNo}
                                </a>
                            </p>
                            <p style={{ marginBottom: 0, width: window.$('.ant-table-thead>tr>th').eq(5).width() + 16 }}>{items.name}</p>
                            <p style={{ marginBottom: 0, width: window.$('.ant-table-thead>tr>th').eq(6).width() + 16 }}>{items.createdAt}</p>
                            <p style={{ marginBottom: 0, width: window.$('.ant-table-thead>tr>th').eq(7).width() + 16 }}>{items.versionRem}</p>
                            {/* <p style={{marginBottom: 0, padding: 8, paddingTop: 0}}>
                                <a href="javascript:void(0)" onClick={() => this.del(items.sn, items._id)}>删除</a> */}
                            {/* <a style={{marginLeft: 10}} href="javascript:void(0)" onClick={() => this.downloadNji(items.sn, items._id)}>下载</a> */}
                            {/* </p> */}
                        </p>
                    ))
                }
            </div>
            // <Table
            //     columns={columns}
            //     dataSource={dataSource}
            //     pagination={false}
            // />
        );
    }

    expandedRowRender = (data, index) => {
        const columns = [
            {
                title: '版本号', dataIndex: 'versionNo', key: 'versionNo', width: 100, render: (text, rows) => {
                    return <a href="javascript:void(0)" onClick={() => this.downloadNji(rows.sn, rows.njiId)} >{text}</a>;
                }
            },
            { title: '更新人', dataIndex: 'name', key: 'name', width: 100 },
            { title: '更新时间', dataIndex: 'createdAt', key: 'createdAt', width: 200 },
            // { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
            { title: '更新摘要', dataIndex: 'versionRem', key: 'versionRem' },
            // { title: '操作', dataIndex: 'action', key: 'action' },
        ];
        let dataSource = this.state.snList[data.serialNo];
        if (!Array.isArray(dataSource)) {
            this.fetchTargetSnList(data.serialNo);
            dataSource = [];
        }
        return this.renderExpand(dataSource, data, index);

    }

    fetchTargetSnList = sn => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/vir/' + sn))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const { snList } = this.state;
                snList[sn] = res.body.data;
                snList[sn].forEach((items, index) => {
                    snList[sn][index].action = <div>
                        <a href="javascript:void(0)" onClick={() => this.del(items.sn, items._id)}>删除</a>
                        <a style={{ marginLeft: 10 }} href="javascript:void(0)" onClick={() => this.downloadNji(items.sn, items._id)}>下载</a>
                    </div>
                });
                this.setState({
                    snList
                });
            });
    }

    // 下载指定nji
    downloadNji = (sn, njiId) => {
        if (!sn || !njiId) {
            message.error('不存在');
            return;
        }
        window.open(common.baseUrl('/vir/downloadNji/' + sn + '/' + njiId));
    }

    // 删除
    del = (sn, njiId) => {
        const r = window.confirm('确定删除？');
        if (!r) return;
        const token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/vir/' + sn + '/' + njiId))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.body.code === 200) {
                    this.fetchTargetSnList(sn);
                    message.success(res.body.msg);
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent() { }

    render() {
        let { data, pagination } = this.state;
        let res_data = this.res_data;
        let b_height = window.innerHeight - 308;
        const columns = [];
        let tableWidth = this.tableWidth;
        let defaultWidth = 0;
        if (window.innerWidth > 1800) {
            defaultWidth = 800;
        } else {
            defaultWidth = 200;
        }
        for (let key in res_data) {
            tableWidth += res_data[key]['width'] ? res_data[key]['width'] : defaultWidth;
            let o = {
                title: res_data[key].label,
                dataIndex: key,
                key: key,
                width: res_data[key]['width'] ? res_data[key]['width'] : defaultWidth,
                render: (text, row, index) => {
                    return this.viewRender(key, res_data, text, row, index);
                }
            };
            columns.push(o);
            if (key == this.fixedKey) o.fixed = 'left';
        }
        if (this.actioncolumns) {
            columns.push({
                title: '操作',
                key: 'operation',
                fixed: 'right',
                width: this.actionWidth,
                render: (text, row, index) => {
                    return this.actionRender(text, row, index);
                },
            });
        }
        if (!pagination.order) return <p></p>;
        return (
            <div>
                {this.inputRender()}
                {
                    this.tableRender({
                        columns: columns,
                        data: data,
                        tableWidth: tableWidth,
                        b_height: b_height
                    })
                }
            </div>
        )
    }
}

export default VirCfg