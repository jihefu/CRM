import React, { Component } from 'react';
import { Statistic, Row, Col, Divider, Tree, Icon, Spin } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../public/js/common.js';
const { TreeNode } = Tree;


class CloudVtc extends Component {
    constructor(props) {
        super(props);
        this.userSelect = this.userSelect.bind(this);
        this.refresh = this.refresh.bind(this);
    }

    state = {
        loading: false,
        total: 0,
        mainProcessInfo: {
            pid: 0,
            memoryUsage: {
                heapTotal: 0,
            },
            totalHeap: 0,
        },
        childProcessData: [],
        activeKey: '0',
    };

    componentDidMount() {
        this.fetch();
    }

    fetch() {
        this.setState({
            loading: true,
        });
        const { activeKey } = this.state;
        request.get(common.cloudVtcUrl('/cloudVtc/connect/poolInfo'))
        .end((err,res) => {
            this.setState({
                loading: false,
            });
            const { mainProcessInfo, childProcessData, total } = res.body.data;
            mainProcessInfo.memoryUsage.heapTotal = mainProcessInfo.memoryUsage.heapTotal / 1024 / 1024;
            let totalHeap = 0;
            childProcessData.forEach(items => {
                try {
                    totalHeap += items.processInfo.memoryUsage.heapTotal;
                } catch (e) {
                    totalHeap += 0;
                }
            });
            totalHeap = totalHeap / 1024 / 1024;
            mainProcessInfo.totalHeap = totalHeap;

            const childArr = [];
            childProcessData.forEach(items => {
                childArr.push({
                    unionid: items.unionid,
                    userName: items.userName,
                    pid: items.processInfo.pid ? items.processInfo.pid : 0,
                    heapTotal: items.processInfo.pid ? items.processInfo.memoryUsage.heapTotal / 1024 / 1024 : 0,
                    logLoginTime: items.logLoginTime,
                    logLogoutTime: items.logLogoutTime,
                    runningState: items.runningState,
                });
            });
            const k = childArr.length !== 0 ? ( activeKey === '0' ? childArr[0].unionid : activeKey ) : '0';
            this.setState({
                mainProcessInfo,
                total,
                childProcessData: childArr,
                activeKey: k,
            });
        });
    }

    renderChildInfo() {
        const { activeKey, childProcessData } = this.state;
        let selectItem = {};
        childProcessData.forEach(items => {
            if (items.unionid == activeKey) selectItem = items;
        });
        return (
            <Row key={selectItem.unionid} style={{display: 'flex', textAlign: 'center'}}>
                <Col style={{flex: 1}}>
                    <Statistic title="pid" value={selectItem.pid} groupSeparator={''} />
                </Col>
                <Col style={{flex: 1}}>
                    <Statistic title="V8已申请内存" suffix='MB' value={selectItem.heapTotal} precision={2} />
                </Col>
                <Col style={{flex: 1}}>
                    <Statistic title="运行状态" valueStyle={this.renderState(selectItem).style} value={this.renderState(selectItem).text} />
                </Col>
                <Col style={{flex: 1}}>
                    <Statistic title="登陆时间" value={selectItem.logLoginTime} />
                </Col>
                { selectItem.logLogoutTime && <Col style={{flex: 1}}>
                    <Statistic title="退出时间" value={selectItem.logLogoutTime} />
                </Col> }
            </Row>
        );
    }

    renderState(selectItem) {
        const { runningState } = selectItem;
        if (!runningState) return {
            style: { color: '#cf1322' },
            text: '--',
        };
        const vtcState = runningState.vtc;
        if (vtcState == 'setup') {
            return {
                style: { color: '#1890ff' },
                text: '建立中',
            };
        } else if (vtcState == 'starting') {
            return {
                style: { color: '#1890ff' },
                text: '启动中',
            };
        } else if (vtcState == 'operating') {
            return {
                style: { color: '#4caf50' },
                text: '操作中',
            };
        } else if (vtcState == 'closing') {
            return {
                style: { color: '#cf1322' },
                text: '关闭中',
            };
        }
        return {
            style: { color: '#cf1322' },
            text: '未启动',
        };
    }

    userSelect(selectedKeys) {
        if (selectedKeys.length === 0) return;
        if (selectedKeys[0] === '0') return;
        this.setState({
            activeKey: selectedKeys[0],
        });
    }

    refresh() {
        this.fetch();
    }

    render() {
        const { mainProcessInfo, total, loading, activeKey, childProcessData } = this.state;
        const h = $('.ant-layout-content').height() - 30;
        return (
            <Spin spinning={loading}>
                <div style={{height: h, display: 'flex'}}>
                    <div style={{width: 190, height: '100%', overflow: 'auto', borderRight: '1px solid #e8e8e8', display: 'flex'}}>
                        <Tree showIcon switcherIcon={<Icon type="down" />} style={{flex: 1}} defaultExpandedKeys={['0']} selectedKeys={[activeKey]} onSelect={this.userSelect}>
                            <TreeNode icon={<Icon type="usergroup-delete" />} title={'操作者列表'} key='0'>
                                {
                                    childProcessData.map(items => (
                                        <TreeNode icon={<Icon type="user" />} title={items.userName} key={items.unionid} />
                                    ))
                                }
                            </TreeNode>
                        </Tree>
                        <Icon style={{marginLeft: 10, marginTop: 12, width: 20, cursor: 'pointer'}} onClick={this.refresh} type="sync" />
                    </div>
                    <div style={{flex: 1, height: '100%'}}>
                        <div style={{height: 140}}>
                            <Divider style={{fontSize: 18}}>主进程信息</Divider>
                            <Row style={{display: 'flex', textAlign: 'center'}}>
                                <Col style={{flex: 1}}>
                                    <Statistic title="pid" value={mainProcessInfo.pid} groupSeparator={''} />
                                </Col>
                                <Col style={{flex: 1}}>
                                    <Statistic title="V8已申请内存" suffix='MB' precision={2} value={mainProcessInfo.memoryUsage.heapTotal} />
                                </Col>
                                <Col style={{flex: 1}}>
                                    <Statistic title="子进程V8申请内存总量" suffix='MB' value={mainProcessInfo.totalHeap} precision={2} />
                                </Col>
                                <Col style={{flex: 1}}>
                                    <Statistic title="连接数" value={total} />
                                </Col>
                            </Row>
                        </div>
                        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                            <Divider style={{fontSize: 18, height: 30}}>子进程信息</Divider>
                            <div style={{display: 'flex', flex: 1}}>
                                {/* <div style={{width: 150, height: '100%', overflow: 'auto', borderRight: '1px solid #e8e8e8', display: 'flex'}}>
                                    <Tree style={{flex: 1}} showLine defaultExpandedKeys={['0']} selectedKeys={[activeKey]} onSelect={this.userSelect}>
                                        <TreeNode title={'操作者列表'} key='0'>
                                            {
                                                childProcessData.map(items => (
                                                    <TreeNode title={items.userName} key={items.unionid} />
                                                ))
                                            }
                                        </TreeNode>
                                    </Tree>
                                    <Icon style={{marginLeft: 10, marginTop: 12, width: 20, cursor: 'pointer'}} onClick={this.refresh} type="sync" />
                                </div> */}
                                <div style={{flex: 1}}>
                                    { this.renderChildInfo() }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Spin>
        )
    }
}

export default CloudVtc