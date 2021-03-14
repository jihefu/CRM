import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Table, Tooltip, Checkbox, DatePicker, Form, Button, Select, Input, Popover } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import Base from '../../public/js/base.js';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
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
                    text: '标记',
                    onClick: this.markAll,
                },
                {
                    text: '取消标记',
                    onClick: this.removeMarkAll,
                }
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        markAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.markAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        removeMarkAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.removeMarkAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            const markSet = new Set();
            for (let i = 0; i < selectedRows.length; i++) {
                const { isStarMark } = selectedRows[i];
                markSet.add(isStarMark);
            }
            if (markSet.size === 2) {
                currentFunArr = currentFunArr.filter(items => items.text != '取消标记' && items.text != '标记' );
            } else if (markSet.size === 1) {
                if (markSet.has(1)) {
                    currentFunArr = currentFunArr.filter(items => items.text != '标记' );
                } else {
                    currentFunArr = currentFunArr.filter(items => items.text != '取消标记' );
                }
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

class Repairs extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/repairs/list';
        this.editPathName = '/repairEdit';
        this.addPathName = '/repairAdd';
        this.placeholder = '维修单号，客户名，序列号';
        this.filter = ['delivery_state'];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            }
        ];
        this.res_data = {
            repair_contractno: {
                label: '维修单号',
                width: 130
            },
            deliver_state: {
                label: '维修状态',
                width: 100
            },
            serial_no: {
                label: '序列号',
                width: 100
            },
            cust_name: {
                label: '送修单位',
                width: 100
            },
            receive_time: {
                label: '收件时间',
                width: 130
            },
            receive_no: {
                label: '收件快递单号',
                input_attr: {
                    'disabled': 'disabled'
                },
                width: 100
            },
            album: {
                label: '照片',
                width: 100
            },
            goods: {
                label: '型号',
                width: 100
            },
            // standrd: {
            //     label: '规格',
            //     width: 100
            // },
            // number: {
            //     label: '数量',
            //     width: 100
            // },
            express: {
                label: '发件快递单号',
                width: 100
            },
            deliver_time: {
                label: '发件时间',
                width: 130
            },
            problems: {
                label: '客户反映故障',
                width: 130
            },
            conclusion: {
                label: '检验发现',
                width: 130
            },
            treatement: {
                label: '处理方法',
                width: 130
            },
            pri_check_person: {
                label: '送修检验人',
                width: 130
            },
            own_cost: {
                label: '自产',
                width: 100
            },
            outer_cost: {
                label: '外购',
                width: 100
            },
            guarantee_repair: {
                label: '是否保修',
                width: 100
            },
            related_contract: {
                label: '维修合同',
                width: 100
            },
            again_conclusion: {
                label: '维修检验结果',
                width: 130
            },
            again_check_person: {
                label: '维修检验人',
                width: 130
            },
            contact: {
                label: '客户联系人',
                width: 100
            },
            contact_type: {
                label: '联系电话',
                width: 100
            },
            // rem: {
            //     label: '备注',
            //     width: 100
            // },
            // insert_person: {
            //     label: '录入人',
            //     input_attr: {
            //         'disabled': 'disabled'
            //     },
            //     width: 100
            // },
            // insert_time: {
            //     label: '录入时间',
            //     input_attr: {
            //         'disabled': 'disabled'
            //     },
            //     width: 130
            // },
            // update_person: {
            //     label: '更新人',
            //     input_attr: {
            //         'disabled': 'disabled'
            //     },
            //     width: 100
            // },
            // update_time: {
            //     label: '更新时间',
            //     input_attr: {
            //         'disabled': 'disabled'
            //     },
            //     width: 200
            // }
        };
        this.state.pagination.filter = {
            delivery_state: '',
            sign_time_start: new Date().getFullYear() - 2 + '-01-01',
            sign_time_end: moment(new Date(Date.now() + 3600 * 1000 * 24)).format('YYYY-MM-DD'),
        };
        this.state.averageRepairDay = 0;
        this.state.averageRepairCount = 0;
        this.markType = 'Repairs';
        this.canRowSelection = true;
    }

    componentDidMount(){
        if(Base.GetStateSession()&&Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]){
            this.setState(Base.GetStateSession(),() => {
                this.initMark();
            });
            Base.RemoveStateSession();
        }else{
            const { pagination } = this.state;
            try{
                pagination.order = this.options[0].value;
            }catch(e){

            }
            let keywords;
            try{
                keywords = this.props.location.state.repair_contractno?this.props.location.state.repair_contractno:'';
                pagination.keywords = keywords;
            }catch(e){

            }
            this.setState({
                pagination
            },() => {
                this.fetch();
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
                    averageRepairDay: res.body.data.averageRepairDay,
                    averageRepairCount: res.body.data.averageRepairCount,
                });
            });
    }

    gotoInfoPage = ({ pathname, serial_no }) => {
        hashHistory.push({
            pathname,
            state: {
                serialNo: serial_no,
            },
        });
    }

    inputRender(){
        const { data,pagination, selectedRows, selectedRowKeys } = this.state;
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
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
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
        if (key == 'insert_time' || key == 'update_time') {
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            title = row[key];
            content = row[key];
        } else if (key === 'repair_contractno') {
            const deliveryStateArr = ['送修检验中', '维修中', '维修检验中', '待发件', '已发件', '已收件'];
            if (row.deliver_state != '关闭' && deliveryStateArr.indexOf(row['deliver_state']) < 4) {
                const receive_time = Date.parse(row['receive_time']);
                const statusIndex = deliveryStateArr.indexOf(row['deliver_state']);
                const day = (Date.now() - receive_time) / (1000 * 60 * 60 * 24);
                if (day >= 5 && statusIndex < 4) {
                    content = <span style={{ color: '#f00' }}>{row[key]}</span>
                } else if (day >= 3 && statusIndex < 4) {
                    content = <span style={{ color: '#ffc107' }}>{row[key]}</span>
                } else {
                    content = row[key];
                }
            } else {
                content = <span style={{ color: 'rgb(0, 200, 83)' }}>{row[key]}</span>
            }
            title = row[key];
        } else if (key == 'serial_no') {
            let pathname = '/otherProducts';
            if (row.modelType == 'V') {
                pathname = '/virProducts';
            } else if (row.modelType == 'D') {
                pathname = '/dynaProducts';
            }
            title = row[key];
            content = <span style={{cursor: 'pointer'}} onClick={() => this.gotoInfoPage({ pathname, serial_no: row[key] })}>{title}</span>
        } else if (key === 'album') {
            let albumArr;
            try {
                albumArr = row[key].split(',').filter(items => items);
            } catch (e) {
                albumArr = [];
            }
            content = albumArr.map((items, index) => {
                if (items) {
                    let src = '/img/' + items;
                    let smallSrc = src.split('/repair/')[0] + 'repair/small_' + src.split('/repair/')[1];
                    return (
                        <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                            <img style={{ width: 35, height: 35, marginRight: 10 }} src={common.staticBaseUrl(smallSrc)} />
                        </a>
                    )
                }
            })
            title = content;
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

    //改变筛选时间
    signDateStartChange = (o,v) => {
        const { pagination } = this.state;
        pagination.filter.sign_time_start = v;
        this.setState({
            pagination
        },() => this.fetch());
    }

    //改变筛选时间
    signDateEndChange = (o,v) => {
        const { pagination } = this.state;
        pagination.filter.sign_time_end = v;
        this.setState({
            pagination
        },() => this.fetch());
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent() {
        const { pagination } = this.state;
        const delivery_state = ['送修检验中', '维修中', '维修检验中', '待发件', '已发件', '已收件', '关闭'];
        if (JSON.stringify(pagination.filter) == '{}') return <div></div>;
        let sign_time_start = pagination.filter.sign_time_start;
        let sign_time_end = pagination.filter.sign_time_end?pagination.filter.sign_time_end:moment().format('YYYY-MM-DD');
        return <div>
            <div style={{padding: '5px 0px 5px 0px'}}>
                <span style={{fontWeight: 'bolder'}}>{"接收日期："}</span>
                <DatePicker allowClear={false} onChange={this.signDateStartChange} value={moment(sign_time_start)} format={'YYYY-MM-DD'} />
                <span style={{marginLeft: 5,marginRight: 5}}>-</span>
                <DatePicker allowClear={false} onChange={this.signDateEndChange} value={moment(sign_time_end)} format={'YYYY-MM-DD'} />
            </div>
            <div style={{ padding: '5px 0px 5px 0px' }}>
                <span style={{ fontWeight: 'bolder' }}>{"发货状态："}</span>
                <CheckboxGroup options={delivery_state} value={pagination.filter.delivery_state.split(',')} onChange={(v) => this.filterType('delivery_state', v)} />
            </div>
        </div>
    }

    //@Override
    tableRender(params) {
        const { columns, data, tableWidth, b_height } = params;
        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={this.state.pagination}
                loading={this.state.loading}
                scroll={{ x: tableWidth, y: b_height - 40 }}
                expandedRowRender={this.expandedRowRender}
                onRowClick={this.handleTableClick}
                rowSelection={this.rowSelection()}
                onChange={this.handleTableChange} />
        )
    }

    fetchHistory = (id, snStr) => {
        const { data } = this.state;
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/repairs/searchHistory'))
            .set("token", token)
            .query({
                id,
                sn: snStr,
            })
            .end((err, res) => {
                if (err) return;
                data.forEach((items, index) => {
                    if (items.id == id) {
                        data[index].logs = res.body.data;
                    }
                });
                this.setState({ data });
            });
    }

    expandedRowRender = data => {
        const { id, serial_no, logs } = data;
        if (!logs) {
            this.fetchHistory(id, serial_no.replace(/\D/ig, ','));
            return <div>加载中...</div>
        }
        const columns = [
            { title: '维修单号', dataIndex: 'repair_contractno', key: 'repair_contractno', width: 150 },
            { title: '序列号', dataIndex: 'serial_no', key: 'serial_no', width: 150 },
            { title: '问题', dataIndex: 'problems', key: 'problems', width: 150 },
            { title: '检验结论', dataIndex: 'conclusion', key: 'conclusion', width: 150 },
            { title: '处理方法', dataIndex: 'treatement', key: 'treatement' }
        ];
        return (
            <Table
                columns={columns}
                dataSource={logs}
                pagination={false}
                bordered
                scroll={{ y: 300 }}
            />
        )
    }

    componentDidUpdate(){
        this.initMark();
        const { averageRepairDay, averageRepairCount, selectedRowKeys, selectedRows, pagination } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none';
        let currentAverageRepairCount = 0, currentAverageRepairDay = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            currentAverageRepairCount = averageRepairCount;
            currentAverageRepairDay = averageRepairDay;
        } else {
            let totalDays = 0;
            selectedRows.forEach(items => {
                if (items.deliver_time && items.deliver_state !== '关闭') {
                    currentAverageRepairCount++;
                    const deliver_time = moment(items.deliver_time).format('YYYY-MM-DD');
                    const receive_time = moment(items.receive_time).format('YYYY-MM-DD');
                    let n = (Date.parse(deliver_time) - Date.parse(receive_time)) / (60 * 60 * 24 * 1000);
                    n = isNaN(n) ? 0 : n;
                    totalDays += n;
                }
            });
            if (currentAverageRepairCount !== 0) {
                currentAverageRepairDay = totalDays / currentAverageRepairCount;
            }
        }
        currentAverageRepairDay = parseFloat(currentAverageRepairDay).toFixed(2);
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: 400px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;margin-right: 36px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;">'+
                                '<span style="font-weight: bolder">维修统计数：</span>'+
                                '<span>'+currentAverageRepairCount+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">平均维修天数：</span>'+
                                '<span>'+currentAverageRepairDay+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        }, 0);
    }
}

export default Repairs;