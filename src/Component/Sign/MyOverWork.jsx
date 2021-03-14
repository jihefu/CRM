import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Rate, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Radio, Tag } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const RadioGroup = Radio.Group;

class MyOverWork extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/attendance/getOverWorkData';
        this.editPathName = '/myOverWorkEdit';
        this.placeholder = '加班内容';
        this.filter = ['workTime','check'];
        this.markType = 'Overwork';
        this.fixedKey = 'name';
        this.actionWidth = 100;
        this.options = [
            {
                text: '最近申请',
                value: 'on_time'
            },
            {
                text: '最近审核',
                value: 'check_time'
            }
        ];
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
        this.state.pagination.filter = {
            workTime: '当月',
            check: ''
        }
        this.state.totalWorkTime = 0;
    }

    //@Override
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
                    data[index].key = items.id;
                });
                let total = res.body.data.total;
                const totalWorkTime = res.body.data.totalWorkTime;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen,
                    totalWorkTime,
                });
            });
    }

    //@Override
    componentDidUpdate() {
        this.initMark();
        const { totalWorkTime, selectedRowKeys, selectedRows, pagination } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none', totalNum = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalNum = totalWorkTime;
        } else {
            selectedRows.forEach(row => {
                let res = this.caculOverWorkTime(row.on_time, row.off_time, row.check, row.rate);
                res = isNaN(res) ? 0 : res;
                totalNum += res;
            });
        }
        totalNum = parseFloat(totalNum).toFixed(2);
        const containerWidth = $('.ant-spin-container').width();
        const w = containerWidth - 500;
        const footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">总加班工时：</span>'+
                                '<span>'+totalNum+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
    }

    //@override
    //表格点击
    handleTableClick(record, index, e){
        const { data,pagination } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const id = record.id;
            let selectData;
            data.forEach((items,index) => {
                if(items.id==id){
                    selectData = items;
                }
            });
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/staff/getListByLevel'))
                .set("token", token)
                .query({
                    level: common.getLevel(),
                })
                .end((err, res) => {
                    if (err) return;
                    const directorArr = res.body.data.map(items => 
                        items.user_name
                    );
                    selectData.directorArr = directorArr;
                    hashHistory.push({
                        pathname: this.editPathName,
                        state: selectData
                    });
                });
        }
    }

    //@override
    actionRender(text, row, index){
        // const user_id = sessionStorage.getItem('user_id');
        const check = row.check;
        // const presentMonth = new Date().getMonth() + 1;
        // const originMonth = new Date(row.on_time).getMonth() + 1;
        if (check == 0) {
            return <p className={"_mark"}>
                         <a href="javascript:void(0)">编辑</a>
                     </p>;
        }
        return <p className={"_mark"} style={{visibility: 'hidden'}}>
                 <a href="javascript:void(0)">aaa</a>
             </p>;
        // if (check == 1 && (presentMonth !== originMonth)) {   // 已经审核通过，并且不是当月了，则不能修改加班单
        //     return <p className={"_mark"} style={{visibility: 'hidden'}}>
        //         <a href="javascript:void(0)">aaa</a>
        //     </p>;
        // }
        // return <p className={"_mark"}>
        //             <a href="javascript:void(0)">编辑</a>
        //         </p>;
    }

    //计算加班时间
    caculOverWorkTime = (on_time, off_time, check, rate) => {
        let workTime = 0;
        let startTimeStamp;
        let date = moment(on_time).format('YYYY-MM-DD');
        const nineNode = Date.parse(date+' 09:00:00');
        const seventeenNode = Date.parse(date+' 17:00:00');
        const eighteenNode = Date.parse(date+' 18:00:00');
        if(Date.parse(on_time)<=nineNode){  //九点前签到
            startTimeStamp = nineNode;
        }else if(Date.parse(on_time)>nineNode&&Date.parse(on_time)<=seventeenNode){ //17点前签到
            startTimeStamp = Date.parse(on_time);
        }else if(Date.parse(on_time)>seventeenNode&&Date.parse(on_time)<=eighteenNode){ //18点前签到
            startTimeStamp = eighteenNode;
        }else{  //18点后签到
            startTimeStamp = Date.parse(on_time);
        }
        workTime = (Date.parse(off_time) - Number(startTimeStamp))/(1000*60*60);
        workTime = workTime * rate;
        if (check != 1) {
            workTime = 0;
        }
        return parseInt(workTime * 100) / 100;
        // return workTime.toFixed(1);
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='album'){
            let albumArr;
            try{
                albumArr = row[key].split(',');
            }catch(e){  
                albumArr = [];
            }
            content = <div>
                        <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/overwork/'+items;
                                        return(
                                            <img onClick={() => {
                                                this.setState({
                                                    photoOption: {
                                                        imgSrc: common.staticBaseUrl(src),
                                                        canRenderPhoto: true,
                                                        albumBorwerArr: albumArr,
                                                    },
                                                });
                                            }} key={index} style={{width: 35,height: 35,marginRight: 10, cursor: 'pointer'}} src={common.staticBaseUrl(src)} />
                                            // <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                            //     <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(src)} />
                                            // </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            title = <div>
                {
                    albumArr.map((items,index) => {
                        if(items){
                            let src = '/img/overwork/'+items;
                            return(
                                <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                    <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(src)} />
                                </a>
                            )
                        }
                    })
                }
            </div>;
        }else if(key=='on_time'||key=='off_time'||key=='check_time'){
            title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            title = title=='Invalid date'?'':title;
            content = title;
        }else if(key=='check'){
            if(row[key]==0){
                title = '填报中';
                content = <Tag>{title}</Tag>;
            }else if(row[key]==1){
                title = '已通过';
                content = <Tag color="#00C853">{title}</Tag>;
            }else{
                title = '审核中';
                content = <Tag color="#ffc107">{title}</Tag>;
            }
        } else if (key=='actionWorkTime') {
            content = this.caculOverWorkTime(row.on_time, row.off_time, row.check, row.rate);
            content = isNaN(content) ? 0 : content;
            title = content;
            const presentMonth = new Date().getMonth() + 1;
            const originMonth = new Date(row.on_time).getMonth() + 1;
            if (presentMonth !== originMonth ) title = row['rem'];
        } else if (key == 'rate') {
            content = <Rate disabled allowHalf value={row[key] * 5} />;
            title = content;
        }else{
            title = row[key];
            content = row[key];
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    inputRender(){
        const { data,pagination } = this.state;
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
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const workTime = ['当月', '上月','所有'];
        const check = ['填报中','审核中','已通过'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"加班时间："}</span>
                        <RadioGroup options={workTime} value={pagination.filter.workTime} onChange={(v) => this.filterType('workTime',v.target.value)}/>
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"审核状态："}</span>
                        <CheckboxGroup options={check} value={pagination.filter.check.split(',')} onChange={(v) => this.filterType('check',v)} />
                    </div>
                </div>
    }
}

export default MyOverWork;