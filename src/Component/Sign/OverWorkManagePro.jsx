import React, { Component } from 'react';
import { message, Popconfirm, Rate, Input, Drawer, Form, Popover, Button, Select } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import MyOverWork from './MyOverWork.jsx';
import 'moment/locale/zh-cn';
import OverWorkManageInfo from './OverWorkManageInfo.jsx';
import PhotoLooker from '../common/PhotoLooker.jsx';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import * as bluebird from 'bluebird';
moment.locale('zh-cn');
const { Option } = Select;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '通过',
                    onClick: this.pass,
                },
                {
                    text: '退回',
                    onClick: this.notPass,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        pass = async () => {
            const { selectedRowKeys: idArr } = this.props;
            const r = window.confirm('确认通过' + idArr.length + '条加班单？');
            if (!r) {
                return;
            }
            const toast = message.loading('正在提交中');
            const token = sessionStorage.getItem('token');
            await bluebird.map(idArr, async id => {
                await new Promise(resolve => {
                    request.put(common.baseUrl('/attendance/checkOverWorkOrder'))
                        .set("token", token)
                        .send({ id, check: 1 })
                        .end((err, res) => {
                            if (err) return;
                            resolve();
                        });
                });
            }, { concurrency: 2 });
            message.success('批量操作成功');
            toast();
            this.props.refresh();
        }

        notPass = async () => {
            const { selectedRowKeys: idArr } = this.props;
            const r = window.confirm('确认退回' + idArr.length + '条加班单？');
            if (!r) {
                return;
            }
            const toast = message.loading('正在提交中');
            const token = sessionStorage.getItem('token');
            await bluebird.map(idArr, async id => {
                await new Promise(resolve => {
                    request.put(common.baseUrl('/attendance/checkOverWorkOrder'))
                        .set("token", token)
                        .send({ id, check: 0 })
                        .end((err, res) => {
                            if (err) return;
                            resolve();
                        });
                });
            }, { concurrency: 2 });
            message.success('批量操作成功');
            toast();
            this.props.refresh();
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            let showBtn = true;
            const user_name = sessionStorage.getItem('user_name');
            for (let i = 0; i < selectedRows.length; i++) {
                const { check, director } = selectedRows[i];
                if (check != 2 || director != user_name) {
                    showBtn = false;
                }
            }
            if (!showBtn) {
                currentFunArr = [];
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

class OverWorkManagePro extends MyOverWork {
    constructor(props){
        super(props);
        this.fetchUrl = '/attendance/directorGetOverWorkData';
        this.actionWidth = 160;
        this.res_data = {
            name: {
                label: '申请人',
                width: 150
            },
            check: {
                label: '状态',
                width: 150
            },
            actionWorkTime: {
                label: '认定工时',
                width: 100
            },
            on_time: {
                label: '加班开始时间',
                width: 200
            },
            off_time: {
                label: '加班结束时间',
                width: 200
            },
            album: {
                label: '现场照片',
                width: 200
            },
            director: {
                label: '指派人',
                width: 150
            },
            reason: {
                label: '指派原因',
                width: 200
            },
            content: {
                label: '加班内容及成果',
                width: 600
            },
            // rate: {
            //     label: '评分',
            //     width: 200,
            // },
            // rem: {
            //     label: '评分备注',
            //     width: 200,
            // },
            check_time: {
                label: '审核时间',
                width: 250
            }
        };
        this.rateMapper = {};
        this.remMapper = {};
        this.state.pagination.filter.check = '审核中,已通过';
        this.state.selectData = {};
        this.state.infoBlock = false;
        this.refresh = this.refresh.bind(this);
        this.canRowSelection = true;
    }

    inputRender(){
        const { pagination, selectedRowKeys, selectedRows } = this.state;
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
                        { <BtnGroup selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    checkItem(row){
        let { id } = row;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/checkOverWorkOrder'))
            .set("token",token)
            .send({
                check: 1,
                id: id
            })
            .end((err,res) => {
                if (err) return;
                this.fetch();
            });
    }

    notCheckItem(row){
        let { id } = row;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/checkOverWorkOrder'))
            .set("token",token)
            .send({
                check: 0,
                id: id
            })
            .end((err,res) => {
                if (err) return;
                this.fetch();
            });
    }

    getLocation(row){
        let { on_gps } = row;
        on_gps = JSON.parse(on_gps);
        let lng,lat;
        try{
            lng = on_gps.lng;
            lat = on_gps.lat;
        }catch(e){
            message.info('不存在');
            return;
        }
        let gc = new window.BMap.Geocoder(); 
        let point = new window.BMap.Point(lng,lat);
        gc.getLocation(point, function(rs) {
            message.info(rs.address);
        });
    }

    moreInfo(row) {
        row.actionWorkTime = this.caculOverWorkTime(row.on_time, row.off_time, row.check, row.rate);
        row.actionWorkTime = isNaN(row.actionWorkTime) ? 0 : row.actionWorkTime;
        this.setState({
            selectData: row,
        }, () => {
            this.setState({
                infoBlock: true,
            });
        });
    }

    refresh() {
        this.fetch();
        this.setState({
            infoBlock: false,
        });
    }
    
    //@override
    actionRender(text, row, index){
        const { check,director } = row;
        const user_name = sessionStorage.getItem('user_name');
        if(check==2&&director==user_name){
            return  <p>
                        <span onClick={() => this.checkItem(row)} style={{color: "#1890ff",cursor: 'pointer'}}>{"通过"}</span>
                        <span onClick={() => this.notCheckItem(row)} style={{color: "#1890ff",cursor: 'pointer',marginLeft: 10}}>{"退回"}</span>
                        <span onClick={() => this.getLocation(row)} style={{color: "#1890ff",cursor: 'pointer',marginLeft: 10}}>{"查看位置"}</span>
                        <span onClick={() => this.moreInfo(row)} style={{color: "#1890ff",cursor: 'pointer'}}>{"详情"}</span>
                    </p>;
        }else{
            return  <p>
                        <span onClick={() => this.getLocation(row)} style={{color: "#1890ff",cursor: 'pointer'}}>{"查看位置"}</span>
                        <span onClick={() => this.moreInfo(row)} style={{color: "#1890ff",cursor: 'pointer', marginLeft: 10}}>{"详情"}</span>
                    </p>;
        }
    }

    actionBar(row) {
        return <div>
            <div>
                评分：<Rate onChange={v => this.rateMapper[row.id] = v / 5} allowHalf defaultValue={row['rate'] * 5}/>
            </div>
            <div style={{display: 'flex', marginTop: 10}}>
                <span style={{paddingTop: 5}}>备注：</span>
                <Input onChange={v => this.remMapper[row.id] = v.target.value} style={{flex: 1}} defaultValue={row['rem']} />
            </div>
        </div>
    }

    confirm(row) {
        const rate = this.rateMapper[row.id] ? this.rateMapper[row.id] : row['rate'];
        const rem = this.remMapper[row.id] ? this.remMapper[row.id] : row['rem'];
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/rateOverWork'))
            .set("token",token)
            .send({
                id: row.id,
                rate,
                rem,
            })
            .end((err,res) => {
                if (err) return;
                this.fetch();
            });
    }

    render(){
        let { data,pagination, selectData, infoBlock, photoOption } = this.state;
        const { albumBorwerArr, imgSrc, canRenderPhoto } = photoOption;
        let res_data = this.res_data;
        let b_height = window.innerHeight-308;
        const columns = [];
        let tableWidth = this.tableWidth;
        for(let key in res_data){
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
        if(this.actioncolumns){
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
        if(!pagination.order) return <p></p>;
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
                <Drawer
                    title={'加班详细信息'}
                    placement={'top'}
                    height={450}
                    visible={infoBlock}
                    closable={true}
                    onClose={() => this.setState({infoBlock: false})}
                >
                    <OverWorkManageInfo data={selectData} refresh={this.refresh}></OverWorkManageInfo>
                </Drawer>
                <PhotoLooker cancelPhotoLooker={this.cancelPhotoLooker} albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={canRenderPhoto}></PhotoLooker>
            </div>
        )
    }
}

export default OverWorkManagePro;