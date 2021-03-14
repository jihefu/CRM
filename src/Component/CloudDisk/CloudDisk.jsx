import React, { Component } from 'react';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import common from '../../public/js/common.js';
import $ from 'jquery';
import { Table, Tooltip, Descriptions, Button, Empty, message, Drawer, Result, Form, Select, Input, Popover, Radio } from 'antd';
import BaseTableList from '../common/BaseTableList';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import * as bluebird from 'bluebird';

moment.locale('zh-cn');
const { Option } = Select;
const RadioGroup = Radio.Group;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '移除',
                    onClick: this.deleteAll,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        deleteAll = async () => {
            const { selectedRowKeys } = this.props;
            const r = window.confirm('是否批量移除' + selectedRowKeys.length + '条记录？');
            if (!r) {
                return;
            }
            let completedCount = 0, deleteTotal = selectedRowKeys.length;
            const toast = message.loading(`正在删除中，请勿进行其他操作！（${completedCount}/${deleteTotal}）`, 0);
            const token = sessionStorage.getItem('token');
            await bluebird.map(selectedRowKeys, async _id => {
                await new Promise(resolve => {
                    request.delete(common.baseUrl('/cloudDisk/del/' + _id))
                    .set("token",token)
                    .end((err,res) => {
                        if(err) return;
                        resolve();
                    });
                });
                completedCount++;
                $('.ant-message-loading').find('span').html(`正在删除中，请勿进行其他操作！（${completedCount}/${deleteTotal}）`);
            }, { concurrency: 1 });
            message.success('批量操作成功');
            toast();
            this.props.refresh();
            this.props.deleteAll(selectedRowKeys);
        }

        render() {
            const { currentFunArr } = this.state;
            const { selectedRowKeys } = this.props;
            if (selectedRowKeys.length === 0) {
                return <div></div>
            }
            return (
                <WrappedComponent style={{position: 'relative', top: 3, marginRight: 60}} funArr={currentFunArr} />
            )
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class CloudDiskTable extends BaseTableList {
    constructor(props) {
        super(props);
        this.placeholder = '客户名，文件名';
        this.filter = ['type'];
        this.options = [
            {
                text: '更新时间',
                value: 'createdAt'
            },
        ];
        this.state.showDrawer = false;
        this.state.selectedData = {};
        this.state.pagination.filter = {
            type: '全部',
        };
        this.canRowSelection = true;
        this.res_data = {
            uploadTime: {
                label: '更新时间',
                width: 120
            },
            type: {
                label: '类型',
                width: 100
            },
            customer: {
                label: '客户',
                width: 150
            },
            fileName: {
                label: '文件名',
                width: 150
            },
            uploadPerson: {
                label: '上传人',
                width: 100
            },
            remark: {
                label: '附言',
                width: 200
            },
        };
        this.actionWidth = 80;
        this.delCount = 0;
    }

    componentWillReceiveProps(props) {
        const { delCount } = props;
        if (delCount !== this.delCount) {
            this.fetch();
            this.delCount = delCount;
        }
    }

    fetch = () => {
        this.setState({ loading: true });
        const token = sessionStorage.getItem('token');
        const { current, pageSize, keywords, order, filter } = this.state.pagination;
        request.get(common.baseUrl('/cloudDisk/getListByUpdateTime'))
            .set("token", token)
            .query({
                page: current,
                pageSize,
                keywords,
                order,
                filter: JSON.stringify(filter),
            })
            .end((err, res) => {
                if (err) return;
                const { data, total } = res.body.data;
                data.forEach((items, index) => {
                    data[index].key = items._id;
                    data[index].uploadTime = moment(items.uploadTime).format('YYYY-MM-DD');
                    data[index].size = items.size < 1024 * 1024 ? (items.size / 1024).toFixed(2) + ' KB' : (items.size / 1024 / 1024).toFixed(2) + ' MB';
                });
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                });
            });
    };

    filterContent = () => {
        const { pagination } = this.state;
        const type = ['全部', '软件', '文档', '图库'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"类型："}</span>
                        <RadioGroup options={type} value={pagination.filter.type} onChange={(v) => this.filterType('type',v.target.value)} />
                    </div>
                </div>
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
                        <Input name="keywords" style={{ width: 200 }} placeholder={this.placeholder} defaultValue={pagination.keywords} />
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
                { <BtnGroup deleteAll={this.props.deleteAll} removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
            </Form>
            <div style={{ width: 300, position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    viewRender = (key, res_data, text, row) => {
        let title, content;
        let textAlign = 'left';
        if (key === 'uploadTime') {
            title = moment(text).format('YYYY-MM-DD');
        } else {
            title = text;
        }
        content = title;
        return (
            <div style={{
                width: res_data[key].width - 32, textAlign: textAlign,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
                <Tooltip placement="top" title={title}>
                    {content}
                </Tooltip>
            </div>
        )
    }

    actionRender(text, row, index) {
        return (
            <div>
                <a href="javascript:void(0)" onClick={() => this.props.moreInfo(row)}>详情</a>
            </div>
        );
    }

    tableRender(params) {
        const { columns, data, b_height } = params;
        return <Table 
                columns={columns} 
                dataSource={data} 
                pagination={this.state.pagination}
                loading={this.state.loading}
                scroll={{ x: 500, y: b_height - 40 }} 
                onRowClick={this.handleTableClick}
                rowSelection={this.rowSelection()}
                onChange={this.handleTableChange} />
    }
}

class CloudDisk extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedData: {},
            showDrawer: false,
        };
        this.delCount = 0;
    }

    moreInfo = record => {
        this.setState({
            selectedData: record,
        });
    }

    deleteAll = async _idArr => {
        this.setState({
            selectedData: {},
        });
    }

    removeFile = _id => {
        const r = window.confirm('确定移除？');
        if (!r) {
            return;
        }
        const token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/cloudDisk/del/' + _id))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.delCount++;
                message.success(res.body.msg);
                this.setState({
                    selectedData: {},
                });
            });
    }

    downloadFile = (type, _id, picId) => {
        let src = '/cloudDisk/download/' + _id;
        if (picId) {
            src += '/' + picId;
        }
        let hide;
        if (type === '安装盘') {
            hide = message.loading('正在打包中，请耐心等待...', 0);
        }
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl(src))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (hide) {
                    hide();
                }
                if (res.body.code === 200) {
                    const fileStr = res.body.data;
                    window.open(common.baseUrl2('/open/burnDisk/download/' + fileStr));
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    preview = () => {
        this.setState({
            showDrawer: true,
        });
    }

    renderContent = h => {
        h = h - 50;
        const { selectedData } = this.state;
        const { suffixName, originalName} = selectedData;
        const self = this;
        if (suffixName === '.gallery') {
            return renderGallery(selectedData);
        } else if (['.gz', '.rar', '.zip', '.tdf' ].includes(suffixName)) {
            return <Result status="warning" title="无法预览" />
        } else if ([ '.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx' ].includes(suffixName)) {
            const src = common.staticBaseUrl('/selfDoc/'+originalName+suffixName);
            return <iframe className={'doc_iframe'} style={{width: '100%', height: h}} src={'https://view.officeapps.live.com/op/view.aspx?src=' + src} frameBorder={0}></iframe>;
        } else {
            const src = common.staticBaseUrl('/selfDoc/'+originalName+suffixName);
            return <iframe className={'doc_iframe'} style={{width: '100%', height: h}} src={src} frameBorder={0}></iframe>;
        }

        function renderGallery(items) {
            const { picList, _id, type } = items;
            if (picList.length === 0) return <Empty />;
            return picList.map(items => {
                if (items.album.indexOf('.mp4') === -1) {
                    const src = '/img/gallery/list_';
                    return (
                        <div style={{width: 110, margin: 6, display: 'inline-block'}} key={items.id}>
                            <img 
                                title={'下载'}
                                onClick={() => self.downloadFile(type, _id, items.id)}
                                src={common.staticBaseUrl(src+items.album)}
                                className={'gallery_img'}
                                style={{cursor: 'pointer', margin: 6, border: '1px solid #eee', borderRadius: 4, boxShadow: '5px 5px 5px #ccc', width: 100}} />
                        </div>
                    )
                } else {
                    const src = '/img/gallery/' + items.album;
                    return (
                        <div style={{width: 310, margin: 6, display: 'inline-block'}} key={items.id}>
                            <video style={{width: 300}} controls="controls" src={common.staticBaseUrl(src)}></video>
                        </div>
                    )
                }
            });
        }
    }

    downloadDependency = (_id, record) => {
        const { id, type } = record;
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

    render() {
        const { selectedData } = this.state;
        const h = $('.sideMenuWrap').height();
        return (
            <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ flex: 1, height: h, borderRight: '1px solid #eee', overflow: 'auto' }}>
                    <CloudDiskTable delCount={this.delCount} moreInfo={this.moreInfo} deleteAll={this.deleteAll}></CloudDiskTable>
                </div>
                <div className={'virProductsInfo'} style={{ width: 400, height: h, overflow: 'auto' }}>
                    <div className={'virProductsInfo-table'}>
                        { !selectedData.fileName && <Empty></Empty> }
                        { selectedData.fileName && (
                            <div>
                                { !selectedData.installDiskId && <Descriptions size={'small'} column={1} title={<div style={{textAlign: 'center', position: 'relative', top: 8}}>{selectedData.fileName}</div>} bordered>
                                    <Descriptions.Item label={<div>类型</div>}>{ selectedData.type }</Descriptions.Item>
                                    <Descriptions.Item label={<div>文件名</div>}>{ selectedData.fileName }</Descriptions.Item>
                                    { selectedData.version && <Descriptions.Item label={<div>版本号</div>}>{ selectedData.version }</Descriptions.Item> }
                                    <Descriptions.Item label={<div>尺寸</div>}>{ selectedData.size }</Descriptions.Item>
                                    <Descriptions.Item label={<div>上传人</div>}>{ selectedData.uploadPerson }</Descriptions.Item>
                                    <Descriptions.Item label={<div>更新时间</div>}>{ selectedData.uploadTime }</Descriptions.Item>
                                    <Descriptions.Item label={<div>附言</div>}>{ selectedData.remark }</Descriptions.Item>
                                </Descriptions> }
                                { selectedData.installDiskId && <Descriptions size={'small'} column={1} title={<div style={{textAlign: 'center', position: 'relative', top: 8}}>{selectedData.fileName}</div>} bordered>
                                    <Descriptions.Item label={<div>类型</div>}>{ selectedData.type }</Descriptions.Item>
                                    <Descriptions.Item label={<div>文件名</div>}>{ selectedData.fileName }</Descriptions.Item>
                                    <Descriptions.Item label={<div>定制</div>}>{ selectedData.remark }</Descriptions.Item>
                                    <Descriptions.Item label={<div>上传人</div>}>{ selectedData.uploadPerson }</Descriptions.Item>
                                    <Descriptions.Item label={<div>更新时间</div>}>{ selectedData.uploadTime }</Descriptions.Item>
                                </Descriptions> }
                                { selectedData.installDiskId && <Descriptions size={'small'} column={1} title={<div style={{textAlign: 'center', position: 'relative', top: 8}}>{'补丁表'}</div>} bordered>
                                    {
                                        selectedData.installDiskInfo.dependencies.map(items => (
                                            <Descriptions.Item key={items.uuid} label={<div onClick={() => this.downloadDependency(selectedData.installDiskInfo._id, items)} style={{cursor: 'pointer'}}>{items.name}</div>}>
                                                { items.version }
                                                { items.description && <span>（{items.description}）</span> }
                                            </Descriptions.Item>
                                        ))
                                    }
                                </Descriptions> }
                                <div style={{marginTop: 20, textAlign: 'center'}}>
                                    { !['软件', '安装盘'].includes(selectedData.type) && <Button onClick={() => this.preview()}>预览</Button> }
                                    { selectedData.type !== '图库' && <Button style={{marginLeft: 30}} onClick={() => this.downloadFile(selectedData.type, selectedData._id)}>下载</Button> }
                                    <Button style={{marginLeft: 30}} type="danger" onClick={() => this.removeFile(selectedData._id)}>移除</Button>
                                </div>
                            </div>
                        ) }
                    </div>
                </div>
                <Drawer
                    width={800}
                    title={selectedData.fileName}
                    placement={'left'}
                    closable={false}
                    onClose={() => this.setState({ showDrawer: false })}
                    visible={this.state.showDrawer}
                    >
                    { this.renderContent(h) }
                </Drawer>
            </div>
        )
    }
}

export default CloudDisk;