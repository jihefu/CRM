import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import common from '../../public/js/common.js';
import request from 'superagent';
import { Empty, Table, Form, Popover, Input, Button, Select, message } from 'antd';
import BaseTableList from '../common/BaseTableList.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';

moment.locale('zh-cn');
const { Option } = Select;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '删除',
                    onClick: this.deleteAll,
                },
            ];
        }

        state = {
            currentFunArr: this.funArr,
        };

        deleteAll = () => {
            const { selectedRowKeys } = this.props;
            const r = window.confirm('是否批量删除' + selectedRowKeys.length + '条记录？');
            if (!r) {
                return;
            }
            const token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/member/deleteActivityBatch'))
                .set("token", token)
                .send({
                    activityIdArr: selectedRowKeys,
                })
                .end((err, res) => {
                    if (err) return;
                    message.success(res.body.msg);
                    this.props.refresh();
                });
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
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

class YBScore extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/member/getActivityMapper';
        this.addPathName = '/ybScoreAdd';
        this.editPathName = '/ybScoreEdit';
        this.actionWidth = 80;
        this.options = [
            {
                text: '默认排序',
                value: 'id',
            },
        ];
        this.res_data = {
            activityName: {
                label: '活动名',
                width: 250
            },
            album: {
                label: '照片',
                width: 200
            },
            hostDate: {
                label: '举办日期',
                width: 100
            },
            hostDays: {
                label: '举办天数',
                width: 100,
            },
            teamName: {
                label: '活动团队',
                width: 200,
            },
        };
        this.canRowSelection = true;
    }

    fetch(){
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
                    data[index].key = items.activityId;
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

    // @Override
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
                { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{ "position": "relative", "top": 3, marginRight: 60 }}>新增</Button> }
                { <BtnGroup selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    componentDidMount(){
        const { pagination } = this.state;
        try{
            pagination.order = this.options[0].value;
        }catch(e){

        }
        this.setState({
            pagination
        },() => {
            this.fetch();
        });
    }

    handleTableClick(record, index, e){
        const { data } = this.state;
        if (e.target.innerHTML === '详情') {
            const id = record.id;
            let selectData;
            data.forEach((items,index) => {
                if(items.id==id){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }
    }

    filterContent() {
        return <div></div>
    }

    viewRender(key, res_data, text, row, index) {
        let content;
        if (key === 'create_time') {
            content = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
        } else if (key === 'album') {
            let albumArr;
            try{
                albumArr = row[key].split(',').filter(items => items);
            }catch(e){  
                albumArr = [];
            }
            content = <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        {
                            albumArr.map((items,index) => {
                                if (items) {
                                    const src = '/img/notiClient/'+items;
                                    const smallSrc = '/img/notiClient/small_'+items;
                                    return (
                                        <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                            <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(smallSrc)} />
                                        </a>
                                    )
                                }
                            })
                        }
                    </p>
        } else {
            content = row[key];
        }
        return content;
    }

    actionRender(text, row, index){
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">详情</a>
                </p>;
    }

    tableRender(params){
        const {columns,data,tableWidth,b_height} = params;
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    expandedRowRender={this.expandedRowRender}
                    rowSelection={this.rowSelection()}
                    onChange={this.handleTableChange} />
    }

    expandedRowRender = data => {
        const { memberArr } = data;
        common.resizeTableHeight();
        const columns = [
            {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
            },
            {
                title: '手机',
                dataIndex: 'phone',
                key: 'phone',
            },
            {
                title: '公司',
                dataIndex: 'company',
                key: 'company',
            },
        ];
        const w = $('.ant-layout-content').width() - 200;
        return (
            <div style={{width: w}}>
                <Table
                    columns={columns}
                    dataSource={memberArr}
                    footer={() => <div style={{fontWeight: 'bold', position: 'relative', left: -8}}>人数：{memberArr.length}</div>}
                    pagination={{ hideOnSinglePage: true, size: 'small' }}
                />
            </div>
        )
    }
}

export default YBScore;