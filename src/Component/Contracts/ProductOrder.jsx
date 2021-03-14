import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Tooltip, Button, Form, Input, Select, Radio, Popover, Checkbox, Tag, Table, DatePicker, Divider, Badge, message, Modal } from 'antd';
import moment from 'moment';
import request from 'superagent';
import BaseTableList from '../common/BaseTableList.jsx';
import common from '../../public/js/common.js';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import * as bluebird from 'bluebird';
import InfiniteScroll from 'react-infinite-scroller';
moment.locale('zh-cn');
const { Option, OptGroup } = Select;
const CheckboxGroup = Checkbox.Group;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '装盘',
                    onClick: this.assembleDisk,
                },
                {
                    text: '移动',
                    onClick: this.changeDisk,
                },
                {
                    text: '装箱',
                    onClick: this.packing,
                },
                {
                    text: '删除',
                    onClick: this.del,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
            this.diskId;
        }

        fetchBurnDiskList = async () => {
            const { softType } = this.props;
            return await new Promise(resolve => {
                const token = sessionStorage.getItem('token');
                request.get(common.baseUrl('/burnDisk/getList'))
                    .set("token", token)
                    .query({
                        page: 1,
                        pageSize: 9999,
                    })
                    .end((err, res) => {
                        const burnDiskArr = res.body.data.data.filter(items => softType.includes(items._id)).map(items => ({
                            _id: items._id,
                            diskName: items.diskName,
                            remark: items.remark,
                        }));
                        resolve(burnDiskArr);
                    });
            });
        }

        assembleDisk = async () => {
            const { selectedRows, contract_id, refresh, existDiskIdArr } = this.props;
            const self = this;
            const snArr = selectedRows.map(items => items.serialNo);
            // 获取所有的安装盘
            const totalDiskArr = await this.fetchBurnDiskList();
            const notExistDiskArr = totalDiskArr.filter(items => existDiskIdArr.includes(items._id) == false);
            const existDiskArr = totalDiskArr.filter(items => existDiskIdArr.includes(items._id) == true);
            this.diskId = null;
            Modal.confirm({
                icon: <span></span>,
                title: '装盘',
                content: <Select onChange={v => self.diskId = v} style={{ width: '100%' }}>
                    <OptGroup label="已装">
                        {
                            existDiskArr.map(items => <Option title={`${items.diskName}（${items.remark}）`} value={items._id} key={items._id}>{`${items.diskName}（${items.remark}）`}</Option>)
                        }
                    </OptGroup>
                    <OptGroup label="未装">
                        {
                            notExistDiskArr.map(items => <Option title={`${items.diskName}（${items.remark}）`} value={items._id} key={items._id}>{`${items.diskName}（${items.remark}）`}</Option>)
                        }
                    </OptGroup>
                </Select>,
                onOk() {
                    return new Promise(async (resolve, reject) => {
                        const { diskId } = self;
                        const dataSource = [{ install_disk_id: diskId, snArr }];
                        const token = sessionStorage.getItem('token');
                        await new Promise(resolve => {
                            request.post(common.baseUrl('/contracts/createAssembleDiskBatch'))
                                .set("token", token)
                                .send({
                                    dataSource,
                                    contract_id,
                                })
                                .end((err, res) => {
                                    if (err) return;
                                    if (res.body.code == -1) {
                                        message.error(res.body.msg);
                                    } else {
                                        message.success(res.body.msg);
                                    }
                                    resolve();
                                });
                        });
                        refresh();
                        resolve();
                    });
                },
                onCancel() { },
            });
        }

        changeDisk = async () => {
            const { selectedRows, contract_id, refresh, existDiskIdArr } = this.props;
            const self = this;
            const snArr = selectedRows.map(items => items.serialNo);
            // 获取所有的安装盘
            const totalDiskArr = await this.fetchBurnDiskList();
            const notExistDiskArr = totalDiskArr.filter(items => existDiskIdArr.includes(items._id) == false);
            const existDiskArr = totalDiskArr.filter(items => existDiskIdArr.includes(items._id) == true);
            this.diskId = null;
            Modal.confirm({
                icon: <span></span>,
                title: '移动',
                content: <Select onChange={v => self.diskId = v} style={{ width: '100%' }}>
                    <OptGroup label="已装">
                        {
                            existDiskArr.map(items => <Option title={`${items.diskName}（${items.remark}）`} value={items._id} key={items._id}>{`${items.diskName}（${items.remark}）`}</Option>)
                        }
                    </OptGroup>
                    <OptGroup label="未装">
                        {
                            notExistDiskArr.map(items => <Option title={`${items.diskName}（${items.remark}）`} value={items._id} key={items._id}>{`${items.diskName}（${items.remark}）`}</Option>)
                        }
                    </OptGroup>
                </Select>,
                onOk() {
                    return new Promise(async (resolve, reject) => {
                        const { diskId } = self;
                        const token = sessionStorage.getItem('token');
                        await new Promise(resolve => {
                            request.put(common.baseUrl('/contracts/changeDiskBatch'))
                                .set("token", token)
                                .send({
                                    snArr,
                                    contract_id,
                                    targetDiskId: diskId,
                                })
                                .end((err, res) => {
                                    if (err) return;
                                    if (res.body.code == -1) {
                                        message.error(res.body.msg);
                                    } else {
                                        message.success(res.body.msg);
                                    }
                                    resolve();
                                });
                        });
                        refresh();
                        resolve();
                    });
                },
                onCancel() { },
            });
        }

        packing = async () => {
            const { selectedRows, contract_id, refresh } = this.props;
            const snArr = [], snTypeMapper = {};
            selectedRows.map(items => {
                snArr.push(items.serialNo);
                snTypeMapper[items.type] = 1;
            });
            if (Object.keys(snTypeMapper).length === 2) {
                message.error('请选择同一类型的序列号');
                return;
            }
            const type = Object.keys(snTypeMapper)[0];
            const token = sessionStorage.getItem('token');
            const toast = message.loading('提交中', 0);

            let packId;
            await bluebird.mapSeries(snArr, async sn => {
                await new Promise(resolve => {
                    request.post(common.baseUrl('/productOrder/addPack'))
                        .set("token", token)
                        .send({
                            sn,
                            contract_id,
                            type,
                        })
                        .end((err, res) => {
                            if (err) return;
                            if (res.body.code == -1) {
                                message.error(res.body.msg);
                            } else {
                                packId = res.body.data.packId;
                            }
                            resolve();
                        });
                });
            }, { concurrency: 1 });
            toast();
            message.success('操作完成');
            refresh();
            // 提示是否直接发货
            this.toastDelivery(packId);
        }

        toastDelivery = packId => {
            let sendType = '快递';
            let no;
            const radioStyle = {
                display: 'block',
                height: '30px',
                lineHeight: '30px',
            };
            Modal.confirm({
                icon: <span></span>,
                title: '发货',
                content: <Radio.Group defaultValue={sendType} onChange={e => sendType = e.target.value}>
                    <Radio style={radioStyle} value={'快递'}>快递{sendType === '快递' ? <Input style={{ width: 200, marginLeft: 6 }} onChange={e => no = e.target.value} /> : ''}</Radio>
                    <Radio style={radioStyle} value={'送货'}>送货</Radio>
                    <Radio style={radioStyle} value={'自提'}>自提</Radio>
                </Radio.Group>,
                onOk() {
                    if (sendType !== '快递') {
                        no = '';
                    } else {
                        if (!no) {
                            message.error('单号不能为空');
                            return;
                        }
                    }
                    return new Promise(async (resolve, reject) => {
                        const token = sessionStorage.getItem('token');
                        request
                            .put(common.baseUrl('/productOrder/updateExpressNoInPacking'))
                            .set("token", token)
                            .send({ id: packId, sendType, expressNo: no })
                            .end((err, res) => {
                                if (err) return;
                                message.success(res.body.msg);
                                resolve();
                            });
                    });
                },
                onCancel() { },
            });

        }

        del = async () => {
            const token = sessionStorage.getItem('token');
            const { selectedRows, contract_id, refresh } = this.props;
            const snArr = selectedRows.map(items => items.serialNo);
            const toast = message.loading('提交中', 0);
            await bluebird.map(snArr, async sn => {
                await new Promise(resolve => {
                    request.delete(common.baseUrl('/productOrder/del'))
                        .set("token", token)
                        .send({
                            serialNo: sn,
                            contract_id,
                        })
                        .end((err, res) => {
                            if (err) return;
                            if (res.body.code == -1) {
                                message.error(res.body.msg);
                            }
                            resolve();
                        });
                });
            }, { concurrency: 1 });
            toast();
            message.success('提交成功');
            refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            let isBindSoft = false, isBindPackage = false;
            let canBindSoft = true;
            let canOper = true;
            for (let i = 0; i < selectedRows.length; i++) {
                if (selectedRows[i].isBindSoft == 1) {
                    isBindSoft = true;
                }
                if (selectedRows[i].isBindPackage == 1) {
                    isBindPackage = true;
                }
                if (selectedRows[i].type == 'other') {
                    canBindSoft = false;
                }
                if (selectedRows[i].isReplaced == 1) {
                    canOper = false;
                }
            }
            if (!canOper) {
                this.setState({ currentFunArr: [] });
                return;
            }
            if (isBindSoft) {
                currentFunArr = currentFunArr.filter(items => items.text != '装盘');
            }
            if (isBindPackage) {
                currentFunArr = currentFunArr.filter(items => items.text != '装箱');
            }
            if (!canBindSoft) {
                currentFunArr = currentFunArr.filter(items => items.text != '装盘' && items.text != '移动');
            }
            let bindSoftArr = selectedRows.map(items => items.isBindSoft);
            bindSoftArr = [...new Set(bindSoftArr)];
            if (bindSoftArr.length === 2 || (bindSoftArr.length === 1 && !isBindSoft)) {
                currentFunArr = currentFunArr.filter(items => items.text != '移动');
            }

            this.setState({ currentFunArr });
        }

        render() {
            const { currentFunArr } = this.state;
            const { selectedRowKeys } = this.props;
            if (selectedRowKeys.length === 0) {
                return <div></div>
            }
            return (
                <WrappedComponent style={{ position: 'relative', top: 3, marginRight: 60 }} funArr={currentFunArr} />
            )
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class ProductOrderTable extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/productOrder/list';
        this.editPathName = '';
        this.placeholder = '序列号';
        this.filter = ['contract_id', 'isBindPackage', 'isBindSoft'];
        this.actionWidth = 100;
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
        ];
        this.fixedKey = 'serialNo';
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 100,
            },
            model: {
                label: '型号',
                width: 100,
            },
            authType: {
                label: '规格',
                width: 100,
            },
            isTest: {
                label: '检测',
                width: 100,
            },
            isBindPackage: {
                label: '装箱',
                width: 100,
            },
            isBindSoft: {
                label: '装盘',
                width: 200,
            },
        };
        this.state.pagination.filter = {
            contract_id: props.selectedContractId,
            isBindPackage: '',
            isBindSoft: '',
        };
        this.state.addDisabled = false;
        this.state.inventorySnArr = [];
        this.canRowSelection = true;
        this.needAddSnArr = [];
        this.state.existDiskIdArr = [];
        this.actioncolumns = false;
        this.state.totalSnArr = [];
    }

    componentWillReceiveProps(props) {
        const { selectedContractId } = props;
        const { pagination } = this.state;
        pagination.filter.contract_id = selectedContractId;
        this.handleSearch();
    }

    // @Override
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
                const existDiskIdArr = res.body.data.existDiskIdArr;
                const totalSnArr = res.body.data.totalSnArr;
                data.forEach((items, index) => {
                    data[index].key = items.id;
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
                    markLen,
                    existDiskIdArr,
                    totalSnArr,
                });
            });
    }

    //@override
    viewRender(key, res_data, text, row, index) {
        let title, content;
        let textAlign = 'left';
        if (key === 'isTest') {
            if (row[key] == 1) {
                content = title = row.isPass == 1 ? '合格' : '不合格';
            } else {
                content = title = '未检测';
            }
        } else if (key === 'isBindSoft') {
            if (row[key] == 1) {
                content = title = `${row.diskName}（${row.remark}）`;
            } else {
                content = title = '';
            }
        } else if (key === 'isBindPackage') {
            if (row[key] == 1) {
                content = title = `#${row.packNum}`;
            } else {
                content = title = '';
            }
        } else if (key === 'serialNo') {
            title = row[key];
            if (row.isReplaced == 1) {
                content = <span style={{ textDecoration: 'line-through' }}>{title}</span>;
            } else {
                if (row.type == 'ctrl') {
                    content = <a href="javascript:void(0);" onClick={() => this.serialHref(row)}>{title}</a>;
                } else {
                    content = title;
                }
            }
        } else {
            title = row[key];
            content = row[key];
        }
        return <p style={{ width: res_data[key]['width'] - 16, textAlign: textAlign, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    serialHref = row => {
        const { serialNo, model } = row;
        let pathName = '/virProductsInfo';
        if (/^D/.test(model)) {
            pathName = '/dynaProductsInfo';
        }
        hashHistory.push({
            pathname: pathName,
            state: { sn: serialNo },
        });
    }

    handleCreate = async () => {
        const { addDisabled } = this.state;
        const self = this;
        if (addDisabled) {
            return;
        }
        this.setState({
            addDisabled: true,
        });
        // await this.fetchTotalSn();
        this.setState({
            addDisabled: false,
        });
        this.needAddSnArr = [];
        Modal.confirm({
            icon: <span></span>,
            title: '新增序列号',
            content: <Select autoFocus={true} mode="tags" onChange={v => this.needAddSnArr = v} style={{ width: '100%' }}>
                {
                    self.state.inventorySnArr.map(sn => <Option key={sn} value={sn}>{sn}</Option>)
                }
            </Select>,
            onOk() {
                return new Promise(async (resolve, reject) => {
                    const { needAddSnArr } = self;
                    const token = sessionStorage.getItem('token');
                    const contract_id = self.props.selectedContractId;
                    const toast = message.loading('提交中', 0);
                    await bluebird.mapSeries(needAddSnArr, async sn => {
                        await new Promise(resolve => {
                            request.post(common.baseUrl('/productOrder/add'))
                                .set("token", token)
                                .send({
                                    serialNo: sn,
                                    contract_id,
                                })
                                .end(async (err, res) => {
                                    if (err) return;
                                    if (res.body.code == -100) {
                                        // 处理替换
                                        await self.dealerReplace(sn, contract_id);
                                        resolve();
                                    } else {
                                        if (res.body.code == -1) {
                                            message.error(res.body.msg);
                                        }
                                        resolve();
                                    }
                                });
                        });
                    }, { concurrency: 1 });
                    toast();
                    message.success('已全部提交');
                    self.handleSearch();
                    resolve();
                });
            },
            onCancel() { },
        });
    }

    dealerReplace = async (sn, contract_id) => {
        const { totalSnArr } = this.state;
        const token = sessionStorage.getItem('token');
        let replacedSn;
        await new Promise(resolve => {
            Modal.confirm({
                icon: <span></span>,
                title: '替换序列号',
                content: <Select style={{ width: '100%' }} onChange={v => replacedSn = v}>
                    {
                        totalSnArr.map(sn => <Option key={sn} value={sn}>{sn}</Option>)
                    }
                </Select>,
                async onOk() {
                    // 删除，新增
                    await new Promise(resolve => {
                        request.delete(common.baseUrl('/productOrder/del'))
                            .set("token", token)
                            .send({
                                serialNo: replacedSn,
                                contract_id,
                                byReplaced: 1,
                            })
                            .end((err, res) => {
                                if (err) return;
                                if (res.body.code == -1) {
                                    message.error(res.body.msg);
                                }
                                resolve();
                            });
                    });
                    await new Promise(resolve => {
                        request.post(common.baseUrl('/productOrder/add'))
                            .set("token", token)
                            .send({
                                serialNo: sn,
                                contract_id,
                            })
                            .end(async (err, res) => {
                                if (err) return;
                                if (res.body.code == -1) {
                                    message.error(res.body.msg);
                                }
                                resolve();
                            });
                    });
                    resolve();
                },
                onCancel() {
                    resolve();
                },
            });
        });
    }

    // 获取库存的序列号
    fetchTotalSn = async () => {
        const { inventorySnArr } = this.state;
        if (inventorySnArr.length !== 0) {
            return;
        }
        await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/product/getTotalInventorySn'))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    this.setState({
                        inventorySnArr: res.body.data,
                    }, () => resolve());
                });
        });

    }

    inputRender() {
        const { selectedRowKeys, selectedRows, pagination, addDisabled, existDiskIdArr } = this.state;
        const { softType } = this.props;
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
                {selectedRowKeys.length === 0 && <Button disabled={addDisabled} type="primary" onClick={this.handleCreate} style={{ "position": "relative", "top": 3, marginRight: 60 }}>新增</Button>}
                {<BtnGroup softType={softType} existDiskIdArr={existDiskIdArr} contract_id={this.props.selectedContractId} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} />}
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    //@override
    actionRender(text, row, index) {
        return (
            <p className={"_mark"}>
                <a href="javascript:void(0)" onClick={() => this.moreInfo(row)}>详情</a>
            </p>
        );
    }

    moreInfo = row => {
        console.log(row);
    }

    // 子类必须有该方法
    // 实现父类的筛选内容
    filterContent() {
        const { pagination } = this.state;
        const isBindPackage = ['已装箱', '未装箱'];
        const isBindSoft = ['已装盘', '未装盘'];
        return (
            <div>
                <div style={{ padding: '5px 0px 5px 0px' }}>
                    <span style={{ fontWeight: 'bolder' }}>{"是否装箱："}</span>
                    <CheckboxGroup options={isBindPackage} value={pagination.filter.isBindPackage.split(',')} onChange={(v) => this.filterType('isBindPackage', v)} />
                </div>
                <div style={{ padding: '5px 0px 5px 0px' }}>
                    <span style={{ fontWeight: 'bolder' }}>{"是否装盘："}</span>
                    <CheckboxGroup options={isBindSoft} value={pagination.filter.isBindSoft.split(',')} onChange={(v) => this.filterType('isBindSoft', v)} />
                </div>
            </div>
        );
    }
}

class ProductOrder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasMore: true,
            page: 1,
            pageSize: 30,
            keywords: props.location.state ? props.location.state.contract_no : '',
            contractList: [],
            selectedContractId: 0,
            softType: '',
        };
    }

    async componentDidMount() {
        await this.fetchContractList();
        const { contractList } = this.state;
        if (contractList.length !== 0) {
            this.setState({
                selectedContractId: contractList[0].id,
                softType: contractList[0].softType,
            });
        }
    }

    fetchContractList = async () => {
        const token = sessionStorage.getItem('token');
        const { page, pageSize, keywords, contractList } = this.state;
        await new Promise(resolve => {
            request.get(common.baseUrl('/contracts/list'))
                .set("token", token)
                .query({
                    page,
                    num: pageSize,
                    keywords,
                    order: 'delivery_state',
                    filter: JSON.stringify({
                        sign_time: "2017-01",
                        group: "",
                        contract_state: "有效",
                        delivery_state: "待发货,发货中,已发货,已收货",
                        delivery_time: "",
                        overdraft: "",
                        directSale: "",
                        new_customer: "所有客户",
                    })
                })
                .end((err, res) => {
                    if (err) return;
                    const data = res.body.data.data;
                    const resData = [...contractList, ...data];
                    this.setState({
                        contractList: resData,
                        page: page + 1,
                    }, () => resolve());
                });
        });
    }

    contractClick = items => {
        this.setState({
            selectedContractId: items.id,
            softType: items.softType,
        });
    }

    onSearch = keywords => {
        this.setState({
            page: 1,
            keywords,
            hasMore: true,
            contractList: [],
            selectedContractId: 0,
            softType: '',
        }, async () => {
            await this.fetchContractList();
            const { contractList } = this.state;
            if (contractList.length !== 0) {
                this.setState({
                    selectedContractId: contractList[0].id,
                    softType: contractList[0].softType,
                });
            }
        });
    }

    hrefToContract = contract_no => {
        hashHistory.push({
            pathname: '/contracts',
            state: { contract_no },
        });
    }

    render() {
        const { contractList, hasMore, page, keywords, selectedContractId, softType } = this.state;
        return (
            <div style={{ display: 'flex' }}>
                <div style={{ width: 250, height: window.innerHeight - 92, borderRight: '1px solid #eee' }}>
                    <Input.Search style={{padding: 12}} defaultValue={keywords} placeholder="合同号" onSearch={value => this.onSearch(value)} enterButton />
                    <div style={{ width: '100%', height: window.innerHeight - 145, overflow: 'auto' }}>
                        <InfiniteScroll
                            initialLoad={false}
                            pageStart={page}
                            isReverse={false}
                            loadMore={this.fetchContractList}
                            hasMore={hasMore}
                            useWindow={false}
                            threshold={1}
                        >
                            { contractList.map(items => (
                                <div 
                                    onClick={() => this.contractClick(items)} 
                                    style={{ width: '100%', height: 80, cursor: 'pointer', padding: 10, borderBottom: '1px solid #eee', background: items.id == selectedContractId ? '#e6f7ff' : '#fff' }}
                                >
                                    <p>
                                        <a href="javascript:void(0);" onClick={() => this.hrefToContract(items.contract_no)}>{items.contract_no}</a>
                                        <Badge style={{transform: 'scale(0.8)', marginLeft: 2}} count={Number(items['snLackNum']) + Number(items['otherSnLackNum'])} />
                                    </p>
                                    <p style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{items.cus_abb}</p>
                                </div>
                            )) }
                        </InfiniteScroll>
                    </div>
                </div>
                <div style={{ flex: 1, overflowX: 'auto' }}>
                    { selectedContractId != 0 && <ProductOrderTable {...this.props} selectedContractId={selectedContractId} softType={softType}></ProductOrderTable> }
                </div>
            </div>
        )
    }
}

export default ProductOrder;