import React, { Component } from 'react';
import { message, Table, Form, Button, Popover, Input, Select, Tooltip, Upload, Modal } from 'antd';
import request from 'superagent';
import BaseTableList from '../common/BaseTableList.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
import common from '../../public/js/common.js';
import MachineTypeSelect from './MachineTypeSelect.jsx';
import { hashHistory } from 'react-router';
import Base from '../../public/js/base.js';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const Option = Select.Option;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        render() {
            return <div></div>
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class VirTemp extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/vir/tempList';
        this.editPathName = '/virTempEdit';
        this.placeholder = '模板名';
        this.actionWidth = 150;
        this.filter = [];
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            },
        ];
        this.res_data = {
            name: {
                label: '名称',
                width: 200,
            },
            actuator: {
                label: '主轴作动器',
                width: 200,
            },
            machineTypeName: {
                label: '解决方案',
                width: 200,
            },
            author: {
                label: '作者',
                width: 200,
            },
            // updateCount: {
            //     label: '更新数',
            //     width: 100,
            // },
            updatedAt: {
                label: '更新时间',
                width: 200,
            },
            remark: {
                label: '摘要',
                width: 600,
            },
            // channelNum: {
            //     label: '通道数',
            //     width: 100,
            // },
            // axiosNum: {
            //     label: '轴数',
            //     width: 100,
            // },
            // suitableProductListName: {
            //     label: '适用试验机',
            //     width: 400,
            // },
            // rem: {
            //     label: '备注',
            //     width: 200,
            // },
        };
        this.machineTypeSelect = this.machineTypeSelect.bind(this);
        this.uploadProps = this.uploadProps.bind(this);
        this.canRowSelection = true;
    }

    //获取数据
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

    // @Override
    viewRender(key, res_data, text, row, index) {
        let width = res_data[key]['width'];
        let title = row[key];
        let content = title;
        if (key == 'name') {
            content = <a href="javascript:void(0);" onClick={() => this.downloadTemp(row)}>
                {row[key]}
            </a>
        } else if (key === 'updatedAt') {
            content = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            title = content;
        } else if (key === 'suitableProductListName') {
            let str = '';
            row[key].forEach(items => {
                str += items.company;
                str += '（';
                str += items.model.join();
                str += '）,';
            });
            str = str.slice(0, str.length -1);
            content = str;
            title = content;
        } 
        return <p style={{ width: width - 32, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    // @Override
    inputRender() {
        const { data, pagination, selectedRowKeys, selectedRows } = this.state;
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
                { selectedRowKeys.length === 0 && <Upload {...this.uploadProps()}>
                    <Button type="primary" style={{"position":"relative","top":3,marginRight: 60}}>新增</Button>
                </Upload> }
                {<BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} />}
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    uploadProps(row) {
        const data = {};
        const that = this;
        if (row) data.fileTitle = row.name;
        const token = sessionStorage.getItem('token');
        const props = {
            name: 'files',
            action: common.baseUrl('/vir/parsePublicCfg'),
			headers: {
				token: token,
            },
            data,
            accept: '.json',
            showUploadList: false,
            onChange: (res) => {
				if(res.file.status=='done'){
                    const response = res.file.response;
                    if (response.code === 200) {
                        message.success(response.msg);
                        const name = response.data;
                        this.fetch();
                        if (!row) {
                            that.machineType = null;
                            Modal.confirm({
                                title: '解决方案',
                                content: <MachineTypeSelect machineTypeSelect={this.machineTypeSelect}></MachineTypeSelect>,
                                onOk() {
                                    const machineType = that.machineType;
                                    // 更新解决方案
                                    request.put(common.baseUrl('/vir/updateTemp'))
                                        .set("token",token)
                                        .send({
                                            machineType,
                                            name,
                                        })
                                        .end((err,res) => {
                                            message.success(response.msg);
                                            that.fetch();
                                        });
                                },
                            });
                        }
                    } else {
                        message.error(response.msg);
                    }
				}
			},
        };
        return props;
    }

    machineTypeSelect(v) {
        this.machineType = v;
    }

    // @Override
    actionRender(text, row, index) {
        return (
            <p className={'_mark'}>
                <a href="javascript:void(0)">编辑</a>
                <Upload {...this.uploadProps(row)}>
                    <a style={{marginLeft: 10}} href="javascript:void(0)">上传更新</a>
                </Upload>
            </p>
        );
    }

    //表格点击
    handleTableClick(record, index, e){
        const { data } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const name = record.name;
            let selectData;
            data.forEach((items,index) => {
                if(items.name==name){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }
    }

    renderSnInput(id) {
        return (
            <div>
                <div style={{display: 'flex'}}>
                    <Input name={'startSn' + id} style={{width: 120}} placeholder={'起始序列号'} />
                    <span style={{marginLeft: 10, marginRight: 10}}>~</span>
                    <Input name={'endSn' + id} style={{width: 120}} placeholder={'终止序列号'} />
                </div>
                <div style={{display: 'flex', marginTop: 10}}>
                    <div style={{paddingTop: 5}}>更新摘要：</div>
                    <Input name={'versionRem' + id} style={{flex: 1}} defaultValue={'厂家配置'} />
                </div>
            </div>
        );
    }

    createInstance(id) {
        const startSn = parseInt(window.$('input[name=startSn'+id+']').val());
        const endSn = parseInt(window.$('input[name=endSn'+id+']').val());
        if (!startSn || !endSn) {
            message.error('序列号不能为空');
            return;
        }
        if (startSn.toString().length !== 7 || endSn.toString().length !== 7) {
            message.error('序列号长度必须为7位');
            return;
        }
        const versionRem = window.$('input[name=versionRem'+id+']').val();
        // 实例化指定sn
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/vir/createInstance/' + id))
            .set("token", token)
            .send({
                startSn,
                endSn,
                versionRem,
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
            });
    }

    downloadTemp(row) {
        window.open(common.baseUrl('/vir/downloadTemp/' + row['name']));
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent() { }
}

export default VirTemp