import React, { Component } from 'react';
import BaseTableList from '../common/BaseTableList.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { hashHistory } from 'react-router';
import { Tooltip, message, Form, Popover, Button, Input, Select, Checkbox } from 'antd';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import request from 'superagent';
import * as Barcode from 'react-barcode';
import $ from 'jquery';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const { Option } = Select;
const CheckboxGroup = Checkbox.Group;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '升级',
                    onClick: this.updateLatest,
                },
                {
                    text: '打印',
                    onClick: this.printPage,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
                printArr: [],
            };
        }

        updateLatest = () => {
            const r = window.confirm('升级后请重新打包下载！');
            if (!r) {
                return;
            }
            const hide = message.loading('升级中...', 0);
            const { selectedRowKeys } = this.props;
            const token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/burnDisk/updateDependenciesToLatest'))
                .set("token", token)
                .send({
                    idArr: selectedRowKeys,
                })
                .end((err, res) => {
                    if (err) return;
                    hide();
                    message.success(res.body.msg);
                    this.props.refresh();
                });
        }

        printPage = () => {
            const { selectedRows } = this.props;
            const printArr = [];
            selectedRows.forEach(items => {
                printArr.push(<div key={items._id} className={'disk-item'}><Barcode value={items._id} /></div>);
            });
            this.setState({
                printArr,
            }, () => {
                setTimeout(() => {
                    renderPrint();
                }, 500);
            });

            function renderPrint() {
                let _str = '';
                for (let i = 0; i < $('.disk-item').length; i++) {
                    const item = $('.disk-item').eq(i).html();
                    _str += `<div style="flex: 1;flex-basic: 50%;margin-bottom: 100px;text-align: center;">
                                <div style="text-align: center; width: 100%;">${selectedRows[i].diskName}（${selectedRows[i].remark}）</div>
                                ${item}
                            </div>`
                }
                const str = `
                    <div style="display: flex; flex-wrap: wrap;">
                        ${_str}
                    </div>
                `;
                const newWindow = window.open("打印窗口", "_blank");
                newWindow.document.write(str);
                newWindow.document.close();
                newWindow.print();
                newWindow.close();
            }
        }

        render() {
            const { currentFunArr, printArr } = this.state;
            const { selectedRowKeys } = this.props;
            if (selectedRowKeys.length === 0) {
                return <div></div>
            }
            return (
                <div>
                    <WrappedComponent style={{ position: 'relative', top: 3, marginRight: 60 }} funArr={currentFunArr} />
                    <div id='disk-print' style={{ display: 'none' }}>{printArr}</div>
                </div>
            )
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class BurnDisk extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/burnDisk/getList';
        this.addPathName = '/burnDiskAdd';
        this.editPathName = '/burnDiskEdit';
        this.options = [
            {
                text: '默认排序',
                value: 'id',
            },
        ];
        this.res_data = {
            diskName: {
                label: '盘名',
                width: 200
            },
            remark: {
                label: '定制',
                width: 200
            },
            projectId: {
                label: '工程名',
                width: 200
            },
            customerList: {
                label: '适用客户',
                width: 200
            },
            updatedAt: {
                label: '更新时间',
                width: 200
            },
        };
        this.state.pagination.filter = {
            projectId: '',
        };
        this.filter = ['projectId'];
        this.actionWidth = 140;
        this.canRowSelection = true;
        this.state.filterProjectArr = [];
    }

    componentDidMount() {
        this.fetchRootInstallPackList();
        if (Base.GetStateSession() && Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]) {
            this.setState(Base.GetStateSession(), () => {
                this.initMark();
            });
            Base.RemoveStateSession();
        } else {
            const { pagination } = this.state;
            try {
                pagination.order = this.options[0].value;
            } catch (e) {

            }
            this.setState({
                pagination
            }, () => {
                this.fetch();
            });
        }
    }

    fetchRootInstallPackList = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/burnDisk/getRootInstallPackList'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const filterProjectArr = res.body.data.map(items => items.projectId);
                this.setState({
                    filterProjectArr,
                });
            });
    }

    handleTableClick(record, index, e) {
        const { data } = this.state;
        if (e.target.innerHTML == '编辑') {
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const _id = record._id;
            let selectData;
            data.forEach((items, index) => {
                if (items._id == _id) {
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }
    }

    fetch() {
        this.setState({ loading: true });
        let token = sessionStorage.getItem('token');
        let { current, pageSize, keywords, order, filter } = this.state.pagination;
        request.get(common.baseUrl(this.fetchUrl))
            .set("token", token)
            .query({
                page: current,
                num: pageSize,
                keywords: keywords,
                order: order,
                filter: JSON.stringify(filter)
            })
            .end((err, res) => {
                if (err) return;
                let data = res.body.data.data;
                data.forEach((items, index) => {
                    data[index].key = items._id;
                    if (res.body.data.id_arr.indexOf(Number(items.id)) !== -1) {
                        data[index].isStarMark = 1;
                    } else {
                        data[index].isStarMark = 0;
                    }
                });
                let total = res.body.data.total;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen
                });
            });
    }

    inputRender() {
        const { pagination, selectedRowKeys, selectedRows } = this.state;
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
                {selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{ "position": "relative", "top": 3, marginRight: 60 }}>新增</Button>}
                {<BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} />}
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    //@override
    viewRender(key, res_data, text, row, index) {
        let title, content;
        let textAlign = 'left';
        if (key == 'updatedAt') {
            title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            content = title;
        } else if (key == 'customerList') {
            const customerNameArr = row[key].map(items => items.cn_abb);
            content = title = customerNameArr.join();
        } else {
            title = row[key];
            content = row[key];
        }
        return <p style={{ width: res_data[key]['width'] - 32, textAlign: textAlign, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    actionRender(text, row, index) {
        return (
            <p className={"_mark"}>
                <a href="javascript:void(0)">编辑</a>
                <a href="javascript:void(0)" style={{ marginLeft: 6 }} onClick={() => this.buildSoft(row._id)}>下载</a>
                <a href="javascript:void(0)" style={{ marginLeft: 6 }} onClick={() => this.copyCreate(row._id)}>复制</a>
            </p>
        );
    }

    copyCreate = _id => {
        const r = window.confirm('确定进行复制操作？');
        if (!r) {
            return;
        }
        const token = sessionStorage.getItem('token');
        const hide = message.loading('复制中...', 0);
        request.post(common.baseUrl(`/burnDisk/copyPackageTable`))
            .set("token", token)
            .send({ _id })
            .end((err, res) => {
                if (err) return;
                hide();
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    this.fetch();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    buildSoft = _id => {
        const token = sessionStorage.getItem('token');
        const hide = message.loading('正在打包中，请耐心等待...', 0);
        request.post(common.baseUrl(`/burnDisk/buildSoft/${_id}`))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                hide();
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    window.open(common.staticBaseUrl(`/open/burnDisk/download/${res.body.data}`));
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    filterContent() {
        const { pagination, filterProjectArr } = this.state;
        if (JSON.stringify(pagination.filter) == '{}') return <div></div>;
        return <div>
            <div style={{ padding: '5px 0px 5px 0px' }}>
                <span style={{ fontWeight: 'bolder' }}>{"工程名："}</span>
                <CheckboxGroup options={filterProjectArr} value={pagination.filter.projectId.split(',')} onChange={(v) => this.filterType('projectId', v)} />
            </div>
        </div>
    }

    render() {
        let { data, pagination } = this.state;
        let res_data = this.res_data;
        let b_height = window.innerHeight - 308;
        const columns = [];
        let tableWidth = this.tableWidth;
        for (let key in res_data) {
            tableWidth += res_data[key]['width'];
            let o = {
                title: res_data[key].label,
                dataIndex: key,
                key: key,
                width: res_data[key]['width'],
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

export default BurnDisk;