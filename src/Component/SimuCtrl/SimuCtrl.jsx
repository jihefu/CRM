import React, { Component } from 'react';
import BaseTableList from '../common/BaseTableList.jsx';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import { hashHistory } from 'react-router';
import { Checkbox, Badge, message, Form, Popover, Button, Input, Select } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
import request from 'superagent';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import $ from 'jquery';
import * as bluebird from 'bluebird';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const { Option } = Select;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '关机',
                    onClick: this.close,
                },
                {
                    text: '开机',
                    onClick: this.create,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        close = async () => {
            const { selectedRows } = this.props;
            const pidArr = selectedRows.map(items => items.pid);
            this.props.startLoading();
            await bluebird.map(pidArr, async pid => {
                await this.props.closeProcess(pid, true);
            }, { concurrency: 5 });
            this.props.stopLoading();
            this.props.fetch();
            this.props.refresh();
        }

        create = async () => {
            const { selectedRows } = this.props;
            const snArr = selectedRows.map(items => items.serialNo);
            this.props.startLoading();
            await bluebird.map(snArr, async sn => {
                await this.props.startProcess(sn, true);
            }, { concurrency: 1 });
            this.props.stopLoading();
            this.props.fetch();
            this.props.refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            let startedExist = false, closedExist = false;
            for (let i = 0; i < selectedRows.length; i++) {
                const { workState } = selectedRows[i];
                if (workState == 0) {
                    closedExist = true;
                } else {
                    startedExist = true;
                }
            }
            if (closedExist) {
                currentFunArr = currentFunArr.filter(items => items.text !== '关机');
            }
            if (startedExist) {
                currentFunArr = currentFunArr.filter(items => items.text !== '开机');
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
                <WrappedComponent style={{position: 'relative', top: 3, marginRight: 60}} funArr={currentFunArr} />
            )
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class SimuCtrl extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/simuCtrl/getSimuList';
        this.addPathName = '/simuCtrlAdd';
        this.placeholder = '序列号，机型';
        this.actionWidth = 100;
        this.options = [
            {
                text: '默认排序',
                value: 'id'
            }
        ];
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 100
            },
            workState: {
                label: '控制器状态',
                width: 100
            },
            vtcState: {
                label: '操作状态',
                width: 100
            },
            solution: {
                label: '解决方案',
                width: 100
            },
            machineModel: {
                label: '机型',
                width: 150
            },
            usePerson: {
                label: '当前操作者',
                width: 100
            },
            logLoginTime: {
                label: '登陆时间',
                width: 160
            },
            pid: {
                label: 'pid',
                width: 100
            },
            rss: {
                label: '占用内存',
                width: 100
            },
        };
        this.filter = ['workState'];
        this.state.totalRss = 0;
        this.state.processNum = 0;
        this.state.pagination.filter = {
            workState: '',
        }
        this.canRowSelection = true;
    }

    //获取数据
    fetch = () => {
        this.setState({ loading: true });
        let token = sessionStorage.getItem('token');
        let { current,pageSize,keywords,order,filter } = this.state.pagination;
        request.get(common.baseUrl(this.fetchUrl))
            .set("token",token)
            .query({
                page: current,
                num: pageSize,
                keywords: keywords,
                order: order,
                filter: JSON.stringify(filter)
            })
            .end((err,res) => {
                if (err) return;
                let data = res.body.data.data;
                data.forEach((items, index) => {
                    data[index].key = items.id;
                });
                let total = res.body.data.total;
                const { totalRss, processNum } = res.body.data;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen,
                    totalRss,
                    processNum,
                });
            });
    }

    inputRender(){
        const { data,pagination, selectedRowKeys, selectedRows } = this.state;
        return <div>
                    <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
                                <Button style={{"marginRight": 15,"top": 4}}>{"筛选"}</Button>
                            </Popover>
                            <Form.Item>
                                <Input name="keywords" style={{width: 300}} placeholder={this.placeholder} defaultValue={pagination.keywords}/>
                            </Form.Item>
                            <Button type="primary" onClick={this.handleSearch} style={{"position":"relative","left":15,"top":3}}>搜索</Button>
                            <span style={{marginLeft: 50}}>
                                <Select defaultValue={pagination.order} onChange={this.orderChange} style={{"position":"relative","top":3,minWidth: 120}}>
                                    {
                                        this.options.map(items => 
                                            <Option key={items.value} value={items.value}>{items.text}</Option>
                                        )
                                    }
                                </Select>
                            </span>
                        </div>
                        { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> }
                        { <BtnGroup fetch={this.fetch} stopLoading={() => this.setState({ loading: false })} startLoading={() => this.setState({ loading: true })} closeProcess={this.closeProcess} startProcess={this.startProcess} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    viewRender(key, res_data, text, row, index) {
        let content;
        let textAlign = 'left';
        if (key === 'workState') {
            if (row[key] === 1) {
                content = <span><Badge status={'success'} />{'空闲'}</span>
            } else if (row[key] === 2) {
                content = <span><Badge status={'processing'} />{'使用中'}</span>
            } else {
                content = <span><Badge status={'default'} />{'离线'}</span>
            }
        } else if (key === 'vtcState') {
            if (row.workState === 2) {
                if (row[key] === 'free') {
                    content = <span style={{color: '#cf1322'}}>未启动</span>
                    // content = '未启动';
                } else if (row[key] === 'setup') {
                    content = <span style={{color: '#1890ff'}}>建立中</span>
                    // content = '建立中';
                } else if (row[key] === 'starting') {
                    content = <span style={{color: '#1890ff'}}>启动中</span>
                    // content = '启动中';
                } else if (row[key] === 'operating') {
                    content = <span style={{color: '#4caf50'}}>操作中</span>
                    // content = '操作中';
                } else if (row[key] === 'closing') {
                    content = <span style={{color: '#cf1322'}}>关闭中</span>
                    // content = '关闭中';
                } else if (row[key] === 'closed') {
                    content = <span style={{color: '#cf1322'}}>已关闭</span>
                    // content = '已关闭';
                }
            } else {
                content = '';
            }
        } else if (key === 'logLoginTime') {
            if (row[key]) {
                content = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            } else {
                content = '';
            }
        } else if (key === 'rss') {
            if (!isNaN(row[key])) {
                content = (row[key]/1024/1024).toFixed(2) + 'MB';
            }
        } else {
            content = row[key];
        }
        return (
            <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                {content}
            </p>
        );
    }

    //@override
    actionRender(text, row, index) {
        if (row.workState === 0) {
            return (
                <div>
                    <a href="javascript:void(0)" onClick={() => this.startProcess(row.serialNo)}>开机</a>
                </div>
            );
        } else {
            return (
                <div>
                    <a href="javascript:void(0)" onClick={() => this.openCtrlPage(row)}>连接</a>
                    <a href="javascript:void(0)" onClick={() => this.closeProcess(row.pid)} style={{marginLeft: 12}}>关机</a>
                </div>
            );
        }
    }

    startProcess = async (sn, batch) => {
        this.setState({ loading: true });
        const result = await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.post(common.cloudVtcUrl('/cloudVtc/createChildProcess/' + sn))
                .set('token', token)
                .end((err,res) => {
                    resolve(res.body);
                })
        });
        if (!batch) {
            this.setState({ loading: false });
        }
        if (result.code === 200) {
            message.success('启动成功');
            if (!batch) {
                this.fetch();
            }
        } else {
            message.error(result.msg);
        }
    }

    closeProcess = async (pid, batch) => {
        this.setState({ loading: true });
        const result = await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.post(common.cloudVtcUrl('/cloudVtc/closeChildProcess/' + pid))
                .set('token', token)
                .end((err,res) => {
                    resolve(res.body);
                })
        });
        if (!batch) {
            this.setState({ loading: false });
        }
        if (result.code === 200) {
            message.success(result.msg);
            if (!batch) {
                this.fetch();
            }
        } else {
            message.error(result.msg);
        }
    }

    openCtrlPage = row => {
        const { id } = row;
        const { data } = this.state;
        const item = data.filter(items => items.id === id);
        const { spaUrl, serialNo, machineModel } = item[0];
        const unionid = sessionStorage.getItem('unionid');
        window.open(spaUrl + '?sn=' + serialNo + '&unionid=' + unionid + '&machineModel=' + machineModel);
    }

    componentDidUpdate(){
        this.initMark();
        const { totalRss, processNum, pagination, selectedRowKeys, selectedRows } = this.state;
        const { total } = pagination;
        let currentProcessNum = 0, currentTotalRss = 0;
        let showSelected = 'block', showNum = 'none';
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            currentProcessNum = processNum;
            currentTotalRss = totalRss;
        } else {
            selectedRows.forEach(items => {
                if (items.processInfo.processInfo) {
                    currentProcessNum += 1;
                    currentTotalRss += items.processInfo.processInfo.memoryUsage.rss;
                }
            });
        }
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: 400px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">运行数：</span>'+
                                '<span>'+currentProcessNum+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">占用内存：</span>'+
                                '<span>'+(currentTotalRss/1024/1024).toFixed(2)+'MB</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
    }

    moreInfo = row => {
        // this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
        // Base.SetStateSession(this.state);
        // hashHistory.push({
        //     pathname: '/otherProductsInfo',
        //     state: {
        //         row,
        //     },
        // });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const workState = ['使用中', '空闲', '离线'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return (
            <div>
                <div style={{padding: '5px 0px 5px 0px'}}>
                    <span style={{fontWeight: 'bolder'}}>{"控制器状态："}</span>
                    <CheckboxGroup options={workState} value={pagination.filter.workState.split(',')} onChange={(v) => this.filterType('workState',v)} />
                </div>
            </div>
        )
    }
}

export default SimuCtrl;