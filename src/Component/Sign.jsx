import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button, message, Progress, Calendar, Input, Select, Upload, Badge, Collapse, Spin, Popconfirm } from 'antd';
import request from 'superagent';
import moment from 'moment';
import ModalTemp from './common/Modal.jsx';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import common from '../public/js/common.js';
import { comment } from 'postcss';
import SignCalendar from './SignCalendar.jsx';
import '../public/css/greenBtn.css';
moment.locale('zh-cn');
const Option = Select.Option;
const { TextArea } = Input;
const Panel = Collapse.Panel;

class Sign extends Component {
    constructor(props) {
        super(props);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.directorSelect = this.directorSelect.bind(this);
        this.uploadProps = this.uploadProps.bind(this);
        this.signTimeView = this.signTimeView.bind(this);
        this.showViewTime = this.showViewTime.bind(this);
        this.directorArr = ['沈波', '马颜春', '黎建伟', '王华生'];
        this.director = '马颜春';
        this.albumArr = [];
        this.timer;
    }

    state = {
        workTime: 0,
        viewWorkTime: 0,
        overWorkTime: 0,
        onDutyTime: 0,
        total: 0,
        notUpdate: 0,
        status: -1,
        onDutyStaff: '',
        onDutyStaffId: '',
        onDutyInsideStaffId: '',
        onDutyInsideStaff: '',
        checkTime: null,
        overWorkCheckTime: null,
        leaveBtn: false,
        modalText: '',
        title: '提醒',
        visible: false,
        headerTitle: true,
        todaySignInfo: [],
        loading: false,
        assessmentData: {
            appNotSign: 0,
            atMe: 0,
            directotAffair: 0,
            joinAffair: 0,
            notRead: 0,
            notReply: 0,
            notUpdate: 0,
            notUpdateArr: [],
            overTime: 0,
            overTimeArr: [],
            received: 0,
            serverDuty: 0,
            warnProgress: 0,
            warnProgressArr: []
        }
    }

    // 获取线上考核数据
    getOnlineAssessmentData() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/onlineAssessment'))
            .set("token", token)
            .query({
                keywords: sessionStorage.getItem('user_name'),
                filter: JSON.stringify({
                    date: '当月'
                })
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    assessmentData: res.body.data.data[0]
                });
            });
    }

    /***************************** 签到事务 **********************************/

    getSignedNum = () => {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/workingNum'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                clearInterval(this.timer);
                this.setState({
                    workTime: res.body.data.workTime,
                    viewWorkTime: res.body.data.workTime,
                    overWorkTime: res.body.data.overWorkTime,
                    onDutyTime: res.body.data.onDutyTime,
                    total: res.body.data.total,
                    status: res.body.data.status,
                    notUpdate: res.body.data.notUpdate,
                    onDutyStaff: res.body.data.onDutyStaff,
                    onDutyStaffId: res.body.data.onDutyStaffId,
                    onCusDutyStaff: res.body.data.onCusDutyStaff,
                    onCusDutyStaffId: res.body.data.onCusDutyStaffId,
                    onDutyInsideStaffId: res.body.data.onDutyInsideStaffId,
                    onDutyInsideStaff: res.body.data.onDutyInsideStaff,
                    checkTime: res.body.data.checkTime,
                    overWorkCheckTime: res.body.data.overWorkCheckTime,
                    todaySignInfo: res.body.data.staffSignInfoArr
                }, () => {
                    if (this.state.status == 1 || this.state.status == 2) {
                        this.showViewTime();
                        this.timer = setInterval(() => {
                            this.showViewTime();
                        }, 1000 * 60);
                    } else {
                        let viewWorkTime = Number(this.state.workTime) * 1000 * 60 * 60;
                        let hours, minute;
                        hours = parseInt(viewWorkTime / 1000 / 60 / 60);
                        minute = parseInt(viewWorkTime / 1000 / 60 % 60);
                        viewWorkTime = hours + '时' + minute + '分';
                        this.setState({
                            viewWorkTime
                        });
                    }
                });
                this.getOnlineAssessmentData();
            });
    }

    showViewTime = () => {
        let sign_on_time = Date.parse(this.state.checkTime);
        let todayNineClock = Date.parse(moment().format('YYYY-MM-DD') + ' 09:00:00');
        if (sign_on_time < todayNineClock) {
            sign_on_time = todayNineClock;
        }
        let resStamp = Date.now() - sign_on_time;
        resStamp = resStamp < 0 ? 0 : resStamp;
        let viewWorkTime = parseInt(Number(resStamp));
        viewWorkTime += Number(this.state.workTime) * 1000 * 60 * 60;
        let hours, minute;
        hours = parseInt(viewWorkTime / 1000 / 60 / 60);
        minute = parseInt(viewWorkTime / 1000 / 60 % 60);
        viewWorkTime = hours + '时' + minute + '分';
        // viewWorkTime = viewWorkTime/1000/60/60;
        // viewWorkTime = viewWorkTime>8?8:parseFloat(viewWorkTime).toFixed(2);
        // viewWorkTime = Number(viewWorkTime);
        // viewWorkTime += Number(this.state.workTime);
        // viewWorkTime = viewWorkTime.toFixed(2);
        this.setState({
            viewWorkTime
        });
    }

    getDirectorArr = () => {
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
                this.directorArr = directorArr;
            });
    }

    signTimeView = () => {
        const { checkTime, overWorkCheckTime, status } = this.state;
        let viewTime;
        if (status == 1 || status == 2) {
            viewTime = moment(checkTime).format('YYYY-MM-DD HH:mm:ss');
        } else if (status == 4) {
            viewTime = moment(overWorkCheckTime).format('YYYY-MM-DD HH:mm:ss');
        } else {
            viewTime = '未签到';
        }
        // if(viewTime=='Invalid date') viewTime = '未签到';
        let str = <p><span>签到时间:</span>  <span style={{ color: '#f60' }}>{viewTime}</span></p>;
        return str;
    }

    signStaffView = () => {
        const { todaySignInfo, onDutyStaff, onCusDutyStaff } = this.state;
        const goOutArr = [], notSignedArr = [], overWorkArr = [];
        const normalSignedArr = [];
        // const allStatusArr = [normalSignedArr,[''],goOutArr,notSignedArr];
        const allStatusArr = [normalSignedArr, goOutArr, notSignedArr];
        //加班状态
        const overStatus = (_items, _index) => {
            let title = '加班';
            const getUserNameInfo = (items) => {
                return <span key={items.user_id} style={{ marginRight: 15 }}>{items.user_name}</span>
            }
            return <p key={_index} style={{ textAlign: 'left' }}>
                <span key={title} style={{ marginRight: 20, color: '#f60' }}>{title}</span>
                {getUserNameInfo(_items)}
            </p>;
        }
        //正常上班
        const getnormalSignedStaff = (_items, _index) => {
            let title;
            if (_index == 0) {
                title = '上班';
            } else if (_index == 1) {
                title = '外出';
            } else if (_index == 2) {
                title = '缺勤';
            }
            // else if(_index==1){
            //     title = '值日';
            // }
            const getUserNameInfo = (items) => {
                // if(_index==1){
                //     return [0,1].map((items,index) => {
                //         if(index==0&&onDutyStaff){
                //             return <span key={index} style={{marginRight: 15}}>{onDutyStaff+'（安卫）'}</span>
                //         }else if(index==1&&onCusDutyStaff){
                //             return <span key={index} style={{marginRight: 15}}>{onCusDutyStaff+'（客服）'}</span>
                //         }
                //     });
                // }
                if (title == '外出') {
                    return <span key={items.user_id} style={{ marginRight: 15 }}>
                        {items.user_name}(
                                {<span style={{ marginLeft: 5, marginRight: 5 }}>
                            {items.StaffOutLogs[items.StaffOutLogs.length - 1].reason}，指派人：{items.StaffOutLogs[items.StaffOutLogs.length - 1].director}</span>})
                            </span>
                } else if (title == '缺勤') {
                    if (items.StaffAbsenceReasons.length === 0) return <span key={items.user_id} style={{ marginRight: 15 }}>{items.user_name}</span>;
                    return <span key={items.user_id} style={{ marginRight: 15 }}>
                        {items.user_name}
                        (
                                    <span style={{ marginLeft: 5, marginRight: 5 }}>
                            {items.StaffAbsenceReasons[items.StaffAbsenceReasons.length - 1].description}
                        </span>
                        )
                            </span>
                } else {
                    return <span key={items.user_id} style={{ marginRight: 15 }}>{items.user_name}</span>
                }
            }
            const _arr = _items.map(items =>
                getUserNameInfo(items)
            );
            return <p key={_index} style={{ textAlign: 'left' }}>
                <span key={title} style={{ marginRight: 20, color: '#f60' }}>{title}</span>
                {_arr}
            </p>;
        }
        todaySignInfo.forEach((items, index) => {
            const { status } = items;
            if (status == 0) {
                notSignedArr.push(items);
            } else if (status == 1) {
                normalSignedArr.push(items);
            } else if (status == 2) {
                goOutArr.push(items);
            } else if (status == 4) {
                overWorkArr.push(items);
            }
        });
        if (notSignedArr[0] == null && normalSignedArr[0] == null && goOutArr[0] == null) {
            if (overWorkArr.length == 0) return;
            return (
                <p style={{ textAlign: 'left' }}>
                    <span key={'加班'} style={{ marginRight: 20, color: '#f60' }}>{'加班'}</span>
                    {
                        overWorkArr.map((items, index) =>
                            <span key={items.user_id} style={{ marginRight: 15 }}>{items.user_name}</span>
                        )
                    }
                    {/* {getUserNameInfo(_items)} */}
                </p>
                // overWorkArr.map((items,index) => 
                //     overStatus(items,index)
                // )
            );
        } else {
            return (
                allStatusArr.map((items, index) =>
                    getnormalSignedStaff(items, index)
                )
            );
        }
    }

    //指派人
    directorSelect(director) {
        this.director = director;
    }

    //点击申请外出
    clickGoOut = e => {
        e.target.style.color = '#4CAF50;';
        this.setState({
            visible: true,
            title: '外出申请',
            modalText: <div>
                <label style={{ display: 'flex' }}>
                    <span style={{ width: '100px' }}>指派人：</span>
                    <Select name={"director"} defaultValue={this.director} onSelect={this.directorSelect} style={{ flex: 1 }}>
                        {
                            this.directorArr.map(items =>
                                <Option key={items}>{items}</Option>
                            )
                        }
                    </Select>
                </label>
                <label style={{ display: 'flex', marginTop: 10 }}>
                    <span style={{ width: '100px' }}>外出原因：</span>
                    <Input name={"reason"} style={{ flex: 1 }} />
                </label>
            </div>
        });
    }

    //点击离岗
    clickLeave = () => {
        this.setState({
            visible: true,
            leaveBtn: true,
            modalText: '当前为工作时间，确定提前离岗？'
        });
    }

    //点击外出时离岗
    clickOutLeave = () => {
        this.setState({
            visible: true,
            leaveBtn: true,
            modalText: '当前为工作时间，确定提前离岗？'
        });
    }

    //点击加班
    clickOverWork = () => {
        this.setState({
            visible: true,
            leaveBtn: false,
            title: '加班申请',
            modalText: <div>
                <label style={{ display: 'flex' }}>
                    <span style={{ width: '100px' }}>指派人：</span>
                    <Select name={"director"} defaultValue={this.director} onSelect={this.directorSelect} style={{ flex: 1 }}>
                        {
                            this.directorArr.map(items =>
                                <Option key={items}>{items}</Option>
                            )
                        }
                    </Select>
                </label>
                <label style={{ display: 'flex', marginTop: 10 }}>
                    <span style={{ width: '100px' }}>加班理由：</span>
                    <Input name={"reason"} style={{ flex: 1 }} />
                </label>
            </div>
        });
    }

    uploadProps() {
        let token = sessionStorage.getItem('token');
        let props = {
            action: common.baseUrl('/attendance/upload'),
            headers: {
                token: token
            },
            accept: 'image/*',
            listType: 'picture',
            name: 'file',
            multiple: false,
            onChange: (res) => {
                if (res.file.status == 'done') {
                    let file_name = res.file.response.data[0];
                    this.albumArr.push(file_name);
                }
            },
            onRemove: (result) => {
                let name = result.response.data[0];
                let i = this.albumArr.indexOf('name');
                this.albumArr.splice(i, 1);
            }
        };
        return props;
    }

    //点击结束加班
    clickEndOverWork = () => {
        let uploadProps = this.uploadProps();
        this.setState({
            visible: true,
            leaveBtn: false,
            title: '结束加班',
            modalText: <div>
                <label style={{ display: 'flex' }}>
                    <span style={{ width: '100px' }}>照片：</span>
                    <Upload {...uploadProps}>
                        <Button>
                            <Icon type="upload" /> 上传照片
                                    </Button>
                    </Upload>
                </label>
                <label style={{ display: 'flex', marginTop: 10 }}>
                    <span style={{ width: '100px' }}>加班描述：</span>
                    <TextArea name={"content"} style={{ flex: 1 }} rows={3} ></TextArea>
                </label>
            </div>
        });
    }

    //获取位置信息
    getLocation(cb) {
        const geolocation = new window.BMap.Geolocation();
        geolocation.getCurrentPosition(function (r) {
            cb(r.point);
        });
    }

    //签到
    sign = () => {
        this.setState({
            loading: true
        });
        let on_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/sign'))
            .query({
                on_time: on_time,
                isNotApp: 1,
                // gps: gps
            })
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return;
                }
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
                //补gps信息
                let gps;
                this.getLocation(point => {
                    gps = JSON.stringify(point);
                    request.put(common.baseUrl('/attendance/signGps'))
                        .send({
                            gps: gps
                        })
                        .set("token", token)
                        .end((err, res) => { });
                });
            });
    }

    //离岗
    leaveSub = () => {
        this.setState({
            loading: true
        });
        let off_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/leave'))
            .query({
                off_time: off_time
            })
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return;
                }
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
            });
    }

    //申请外出提交
    goOutSub = (form_data) => {
        const user_name = sessionStorage.getItem('user_name');
        if (this.director == user_name) {
            message.error('指派人不能为自己');
            return;
        }
        if (!form_data['reason']) {
            message.error('外出原因不能为空！');
            return;
        }
        this.setState({
            loading: true
        });
        let out_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/goOut'))
            .send({
                out_time: out_time,
                director: this.director,
                reason: form_data.reason
            })
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return;
                }
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
            });
    }

    //返岗
    outBack = () => {
        this.setState({
            loading: true
        });
        let back_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/outBack'))
            .send({
                back_time: back_time
            })
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return;
                }
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
            });
    }

    //外出时离岗
    outLeaveSub = () => {
        this.setState({
            loading: true
        });
        let off_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/outLeave'))
            .send({
                off_time: off_time
            })
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return;
                }
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
            });
    }

    //加班
    overWork = (formRes) => {
        // if(!formRes['reason']){
        //     message.error('加班原因不能为空！');
        //     return;
        // }
        this.setState({
            loading: true
        });
        let on_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let on_gps;
        this.getLocation(point => {
            on_gps = JSON.stringify(point);
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/attendance/overWork'))
                .send({
                    // on_time: on_time,
                    on_gps: on_gps,
                    // director: this.director,
                    // reason: formRes.reason
                })
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    if (res.body.code == -1) {
                        message.error(res.body.msg);
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                        return;
                    }
                    this.setState({
                        loading: false
                    });
                    message.success(res.body.msg);
                    this.getSignedNum();
                    // this.getAllMonthData();
                });
        });
    }

    //结束加班
    endOverWork = (formRes) => {
        // formRes.album = this.albumArr.join();
        // if(!formRes['content']||!formRes['album']){
        //     message.error('不能为空！');
        //     return;
        // }
        this.setState({
            loading: true
        });
        let off_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        let off_gps;
        this.getLocation(point => {
            off_gps = JSON.stringify(point);
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/attendance/endOverWork'))
                .send({
                    // off_time: off_time,
                    off_gps: off_gps,
                    // content: formRes.content,
                    // album: formRes.album
                })
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    if (res.body.code == -1) {
                        message.error(res.body.msg);
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                        return;
                    }
                    this.setState({
                        loading: false
                    });
                    message.success(res.body.msg);
                    this.albumArr = [];
                    this.getSignedNum();
                    // this.getAllMonthData();
                });
        });
    }

    recall = () => {
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/attendance/recall'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.code == -1) {
                    message.error(res.body.msg);
                    window.location.reload();
                    return;
                }
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
            });
    }

    recallOverWork = () => {
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/attendance/recallOverWork'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                if (res.code == -1) {
                    message.error(res.body.msg);
                    window.location.reload();
                    return;
                }
                message.success(res.body.msg);
                this.getSignedNum();
                // this.getAllMonthData();
            });
    }

    //申请值日
    applyDuty = () => {
        this.setState({
            loading: true
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/applyDuty'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    loading: false
                });
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                } else {
                    message.success(res.body.msg);
                }
                this.getSignedNum();
            });
    }

    //取消申请值日
    cancelApplyDuty = () => {
        this.setState({
            loading: true
        });
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/cancelApplyDuty'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
            });
    }

    //申请客服值日
    applyCusDuty = () => {
        this.setState({
            loading: true
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/applyCusDuty'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    loading: false
                });
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                } else {
                    message.success(res.body.msg);
                }
                this.getSignedNum();
            });
    }

    //取消申请客服值日
    cancelApplyCusDuty = () => {
        this.setState({
            loading: true
        });
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/cancelApplyCusDuty'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
            });
    }

    // 取消内勤
    cancelInsideDuty() {
        this.setState({
            loading: true
        });
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/cancelInsideDuty'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    loading: false
                });
                message.success(res.body.msg);
                this.getSignedNum();
            });
    }

    // 申请内勤
    applyInsideDuty() {
        this.setState({
            loading: true
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/applyInsideDuty'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    loading: false
                });
                if (res.body.code == -1) {
                    message.error(res.body.msg);
                } else {
                    message.success(res.body.msg);
                }
                this.getSignedNum();
            });
    }

    siderDuty = () => {
        let { status, onDutyStaff, onDutyStaffId, onCusDutyStaff, onCusDutyStaffId, onDutyInsideStaffId, onDutyInsideStaff } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        let safeDuty, cusDuty, insideDuty;
        if (status != 1) return;
        if (onDutyStaff && user_id == onDutyStaffId) {
            safeDuty = () => {
                this.cancelApplyDuty();
            }
        } else {
            safeDuty = () => {
                this.applyDuty();
            }
        }
        if (onCusDutyStaff && user_id == onCusDutyStaffId) {
            cusDuty = () => {
                this.cancelApplyCusDuty();
            }
        } else {
            cusDuty = () => {
                this.applyCusDuty();
            }
        }
        if (onDutyInsideStaff && user_id == onDutyInsideStaffId) {
            insideDuty = () => {
                this.cancelInsideDuty();
            }
        } else {
            insideDuty = () => {
                this.applyInsideDuty();
            }
        }
        onDutyStaff = onDutyStaff ? onDutyStaff : '';
        onCusDutyStaff = onCusDutyStaff ? onCusDutyStaff : '';
        onDutyInsideStaff = onDutyInsideStaff ? onDutyInsideStaff : '';
        return <span style={{ position: 'absolute', left: 22 }}>
            <label style={{ fontSize: 16, cursor: 'pointer' }} onClick={safeDuty}>
                <span>安卫：</span>
                <span style={{ display: 'inline-block', width: 80, textAlign: 'left' }}>{onDutyStaff}</span>
                <div style={{ display: 'inline-block', width: 57, height: 1, position: 'absolute', top: 26, left: 45, background: 'rgba(0, 0, 0, 0.65)' }}></div>
            </label>
            <label style={{ fontSize: 16, marginLeft: 0, cursor: 'pointer' }} onClick={cusDuty}>
                <span>客服：</span>
                <span style={{ display: 'inline-block', width: 80, textAlign: 'left' }}>{onCusDutyStaff}</span>
                <div style={{ display: 'inline-block', width: 57, height: 1, position: 'absolute', top: 26, left: 171, background: 'rgba(0, 0, 0, 0.65)' }}></div>
            </label>
            <label style={{ fontSize: 16, marginLeft: 0, cursor: 'pointer' }} onClick={insideDuty}>
                <span>内勤：</span>
                <span style={{ display: 'inline-block', width: 80, textAlign: 'left' }}>{onDutyInsideStaff}</span>
                <div style={{ display: 'inline-block', width: 57, height: 1, position: 'absolute', top: 26, left: 303, background: 'rgba(0, 0, 0, 0.65)' }}></div>
            </label>
        </span>
    }

    siderButton = () => {
        const { status, onDutyStaff, onDutyStaffId, onCusDutyStaff, onCusDutyStaffId, todaySignInfo } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        if (status == 1) {
            return <span style={{ position: 'absolute', right: 40 }}>
                <Button onClick={this.clickGoOut} type={'default'} className={'lj_green_btn'}>登记外出</Button>
                <Popconfirm placement="bottom" title={'确定撤销上班？'} onConfirm={this.recall} okText="是" cancelText="否">
                    <Button style={{ marginLeft: 10 }} type={'default'} className={'lj_green_btn'}>撤销上班</Button>
                </Popconfirm>
                {/* {dutySelect()} */}
            </span>
        } else if (status == 4) {
            return <span style={{ position: 'absolute', right: 40 }}>
                <Popconfirm placement="bottom" title={'确定撤销加班？'} onConfirm={this.recallOverWork} okText="是" cancelText="否">
                    <Button style={{ marginLeft: 10 }} type={'default'} className={'lj_green_btn'}>撤销加班</Button>
                </Popconfirm>
            </span>
        } else if (status == 0) {
            return <span style={{ position: 'absolute', right: 40 }}>
                <Popconfirm placement="bottomRight" icon={<span></span>} title={<Input placeholder={'请假事由'} ref={'absence'} />} onConfirm={() => {
                    const v = this.refs.absence.state.value;
                    if (!v) return message.error('不能为空');
                    const staff_sign_id = todaySignInfo.filter(items => items.user_id == user_id)[0].id;
                    let token = sessionStorage.getItem('token');
                    request.post(common.baseUrl('/attendance/applyAbsence'))
                        .set("token", token)
                        .send({
                            description: v,
                            staff_sign_id,
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success(res.body.msg);
                            this.getSignedNum();
                        });
                }} okText="提交" cancelText="取消">
                    <Button type={'default'} className={'lj_green_btn'}>请假</Button>
                </Popconfirm>
            </span>
        } else {
            return '';
        }
    }

    buttonStatus = () => {
        const { status } = this.state;
        if (status == 0) {
            return <span>
                <Button onClick={this.sign} type={'primary'} className={'greenBtn'}>上班</Button>
            </span>
        } else if (status == 1) {
            return <span>
                {/* <Button onClick={this.clickGoOut} type={'primary'}>登记外出</Button> */}
                <Button onClick={this.clickLeave} style={{ marginLeft: 10 }} type={'primary'} className={'greenBtn'}>下班</Button>
                {/* <Button onClick={this.recall} style={{marginLeft: 10}} type={'danger'}>撤销上班</Button> */}
            </span>
        } else if (status == 2) {
            return <span>
                <Button onClick={this.outBack} type={'default'} className={'lj_green_btn'}>返岗</Button>
                <Button onClick={this.clickOutLeave} style={{ marginLeft: 10 }} type={'primary'} className={'greenBtn'}>下班</Button>
            </span>
        } else if (status == 3) {
            return <span>
                <Button onClick={this.overWork} type={'primary'} className={'greenBtn'}>加班</Button>
                {/* <Button onClick={this.clickOverWork} type={'primary'}>加班</Button> */}
            </span>
        } else if (status == 4) {
            return <span>
                <Button onClick={this.endOverWork} type={'primary'} className={'greenBtn'}>结束加班</Button>
                {/* <Button onClick={this.clickEndOverWork} type={'primary'}>结束加班</Button> */}
            </span>
        }
    }

    componentDidMount() {
        this.getSignedNum();
        this.getDirectorArr();
        // this.getAllMonthData();
    }

    componentDidUpdate() {
        const w1 = $('.orderItem').width();
        const w2 = $('.orderItem2').width();
        $('.itemShow').width(w1);
        $('.itemShow2').width(w2 * 2);
    }

    handleModalCancel() {
        this.setState({
            visible: false,
            leaveBtn: false
        });
    }
    handleModalDefine(backRes) {
        const { status, leaveBtn } = this.state;
        if (leaveBtn) {
            if (status == 1) {
                this.leaveSub();
            } else {
                this.outLeaveSub();
            }
            this.setState({
                leaveBtn: false
            });
        } else {
            if (status == 1) {
                this.goOutSub(backRes);
            } else if (status == 4) {
                this.endOverWork(backRes);
            } else if (status == 3) {
                this.overWork(backRes);
            }
        }
    }

    render() {
        const width = $('.ant-layout-content').width();
        let { total, workTime, overWorkTime, onDutyTime, headerTitle, loading, viewWorkTime, assessmentData } = this.state;
        const { appNotSign, atMe, directotAffair, joinAffair, notRead,
            notReply, notUpdate, overTime, received, serverDuty,
            warnProgress, overTimeArr, warnProgressArr, notUpdateArr } = assessmentData;
        const user_id = sessionStorage.getItem('user_id');
        let headerText = '签到月历';
        if (total == 0) return false;
        const percent = parseInt(workTime / total * 100);

        const checkAppUser = () => {
            if (common.hasAppUserArr.indexOf(sessionStorage.getItem('user_id')) != -1) {
                return <div className={"itemShow2"} style={{ display: 'flex', border: '1px solid #eee', borderTop: 'none' }}>
                    <div style={{ flex: 1 }}>
                        <h3>服务工作日</h3>
                        <p>{serverDuty} 个</p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3>APP未签到</h3>
                        <p>{fontColor(appNotSign, '个')}</p>
                    </div>
                </div>
            }
        }

        const fontColor = (num, d) => {
            if (num > 0) {
                return <span style={{ color: '#f00' }}>{num + ' ' + d}</span>;
            } else {
                return <span>{num + ' ' + d}</span>;
            }
        }

        return <div className={"signBlock"}>
            <Spin spinning={loading}>
                <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ display: 'flex' }}>
                        <div className={"orderItem"} style={{ flex: 1, display: 'flex', border: '1px solid #eee', borderTop: 'none' }}>
                            <div style={{ flex: 1 }}>
                                <h3>工时</h3>
                                <p>{viewWorkTime}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>加班工时</h3>
                                <p>{overWorkTime} 小时</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>值日天数</h3>
                                <p>{onDutyTime} 天</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>规定工时</h3>
                                <p>{total} 小时</p>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', border: '1px solid #eee', borderTop: 'none'}}>
                            <div style={{ flex: 1 }} className={"orderItem2"}>
                                <h3>参与事务</h3>
                                <p>{joinAffair} 个</p>
                            </div>
                            <div style={{ flex: 1 }} title={notUpdateArr.join()}>
                                <h3>未更新</h3>
                                <p>{fontColor(notUpdate, '个')}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>负责事务</h3>
                                <p>{directotAffair} 个</p>
                            </div>
                            <div style={{ flex: 1 }} title={overTimeArr.join()}>
                                <h3>逾期</h3>
                                <p>{fontColor(overTime, '天')}</p>
                            </div>
                            <div style={{ flex: 1 }} title={warnProgressArr.join()}>
                                <h3>进度警告</h3>
                                <p>{fontColor(warnProgress, '个')}</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div className={"itemShow"} style={{ display: 'flex', border: '1px solid #eee', borderTop: 'none' }}>
                            <div style={{ flex: 1 }}>
                                <h3>收到推送</h3>
                                <p>{received} 个</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>未读</h3>
                                <p>{fontColor(notRead, '个')}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>收到@</h3>
                                <p>{atMe} 个</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>未答复</h3>
                                <p>{fontColor(notReply, '个')}</p>
                            </div>
                        </div>
                        {checkAppUser()}
                    </div>
                    <Progress strokeWidth={5} percent={percent} style={{ opacity: 0.6 }} />
                    {
                        <div style={{ marginTop: 14, textAlign: 'center' }}>
                            {this.siderDuty()}
                            {this.buttonStatus()}
                            {this.siderButton()}
                        </div>
                    }
                    <div style={{ fontSize: 16, marginTop: 18 }}>{this.signTimeView()}</div>
                </div>
                <div style={{border: '1px solid #eee', padding: 16, borderBottom: 'none'}}>
                    {this.signStaffView()}
                </div>
                {/* <Collapse onChange={this.headerChange} >
                    <Panel style={{ textAlign: 'center' }} showArrow={false} header={'当天签到一览'}>
                        {this.signStaffView()}
                    </Panel>
                </Collapse> */}
                <ModalTemp
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    ModalText={this.state.modalText}
                    title={this.state.title}
                    visible={this.state.visible} />
            </Spin>
        </div>;
    }
}

export default Sign;