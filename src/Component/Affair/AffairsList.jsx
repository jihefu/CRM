import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { TimePicker, List, message, Spin, Input, Form, Button, Divider, Icon, Popover, Radio, Select, Popconfirm, Tabs, Upload, Table, Tag, DatePicker, Modal, TreeSelect } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import InfiniteScroll from 'react-infinite-scroller';
import ModalTemp from '../common/Modal.jsx';
import AffairPdf from './AffairPdf.jsx';
import TransBox from '../common/TransBox.jsx';
import AffairTeamTemp from './AffairTeamTemp';
import '../../public/css/affairs.css';
import common from '../../public/js/common.js';
import PhotoLooker from '../common/PhotoLooker.jsx';
import Linq from 'linq';
import { isAbsolute } from 'path';
moment.locale('zh-cn');
const { TextArea } = Input;
const RadioGroup = Radio.Group;
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const Search = Input.Search;
const confirm = Modal.confirm;

class AffairsList extends Component {
    constructor(props) {
        super(props);
        this.specialLine = 0;
        this.affairType = 'respoAffair';
        this.staffData;

        this.scroll = {
            hasMore: true,
            loading: false,
            pageStart: 1,
            pageSize: 10,
            keywords: '',
            filter: {}
        }
        this.locationId = null;
        this.scrollHeight = 0;
        this.scrollMark = 0;
        this.forwardMsgReceiver = null;
        this.fileUploading = false;
        this.imgUploading = false;
        this.canRenderPhoto = true;
        this.affairClick = this.affairClick.bind(this);
        this.summaryTemp = this.summaryTemp.bind(this);
        this.fetchNotiMail = this.fetchNotiMail.bind(this);
        this.fetchNotiMailByScroll = this.fetchNotiMailByScroll.bind(this);
        this.publishReply = this.publishReply.bind(this);
        this.createMsg = this.createMsg.bind(this);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.fetchAllStaff = this.fetchAllStaff.bind(this);
        this.affairPriorityChange = this.affairPriorityChange.bind(this);
        this.affairStateChange = this.affairStateChange.bind(this);
        this.affairLabelsChange = this.affairLabelsChange.bind(this);
        this.affairTeamChange = this.affairTeamChange.bind(this);
        this.affairSecretChange = this.affairSecretChange.bind(this);
        this.subHandleTableClick = this.subHandleTableClick.bind(this);
        this.autoScrollToTarget = this.autoScrollToTarget.bind(this);
        this.getResourse = this.getResourse.bind(this);
        this.movePosition = this.movePosition.bind(this);
        this.deadlineChange = this.deadlineChange.bind(this);
        this.addReply = this.addReply.bind(this);
        this.forwardMsgReceiverChange = this.forwardMsgReceiverChange.bind(this);
        this.addToDocLib = this.addToDocLib.bind(this);
        this.staffArr = [
            [],     //研发部
            [],     //客户关系部
            [],     //生产部
            []      //管理部
        ];
        this.affairProp = {
            priority: '',
            state: '',
            secret: '',
            labels: '',
            team: ''
        }
        this.btnGroup = {
            isSending: false,
            isReplying: false,
        };
    }

    state = {
        treeData: [],
        affairData: [],
        selectedId: '',
        selectedMailList: [],
        resourse: [],
        mailPriority: "普通",
        votes: ['已阅'],
        at: [],
        imgArr: [],
        imgNameArr: [],
        fileArr: [],
        fileNameArr: [],
        title: '编辑',
        modalText: '',
        visible: false,
        popVisible: false,
        searchVisible: 'none',
        visibleSelf: false,
        pdfAffairId: null,
        imgSrc: null,
        eyeTitle: '只看他',
        albumBorwerArr: [],
        isMeetingMsg: 0,
        meetingDate: moment(),
        meetingHours: moment(),
        isDelay: 0,
        delayDate: moment(),
        delayHours: moment(Date.parse(moment().format('YYYY-MM-DD HH:mm:ss')) + 60 * 60 * 1000),
    }

    isDirector = () => {
        const user_id = sessionStorage.getItem('user_id');
        const { selectedId, affairData } = this.state;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        let teamDirector;
        try {
            teamDirector = selectedIdData[0].team.split(',')[0];
        } catch (e) { }
        if (teamDirector == user_id || selectedIdData[0].insert_person == user_id) return true;
        return false;
    }

    //获取所有员工信息
    fetchAllStaff() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.staffData = res.body.data;
                res.body.data.forEach((items) => {
                    const { branch, user_id, user_name } = items;
                    const info = {
                        user_id: user_id,
                        user_name: user_name
                    };
                    if (branch == '研发部') {
                        this.staffArr[0].push(info);
                    } else if (branch == '客户关系部') {
                        this.staffArr[1].push(info);
                    } else if (branch == '生产部') {
                        this.staffArr[2].push(info);
                    } else {
                        this.staffArr[3].push(info);
                    }
                });
            });
    }

    //获取事务列表
    fetchAffair(cb) {
        let token = sessionStorage.getItem('token');
        let user_id = sessionStorage.getItem('user_id');
        request.get(common.baseUrl('/affair/list'))
            .set("token", token)
            .query({
                affairType: this.affairType,
                department: this.props.department ? this.props.department : '客户关系部',
                specialLine: this.specialLine
            })
            .end((err, res) => {
                if (err) return;
                if (res.body.data.length != 0) {
                    let resArr = res.body.data;
                    let selectedId;
                    //如果是从首页跳转过来的
                    let affairId, locationId;
                    if (this.props.paramsData || (this.props.location && this.props.location.state)) {
                        try {
                            affairId = this.props.paramsData.affairId;
                        } catch (e) {
                            affairId = this.props.location.state.affairId;
                        }
                        try {
                            locationId = this.props.paramsData.locationId;
                        } catch (e) {
                            locationId = this.props.location.state.locationId;
                        }
                        resArr.forEach((items, index) => {
                            if (items.uuid == affairId) {
                                selectedId = affairId;
                                this.locationId = locationId;
                            }
                        });
                        if (!selectedId) {
                            // 找不到该事务列表
                            // 显示需要从某个例行事务查看
                            request.get(common.baseUrl('/getTargetAffair/' + affairId))
                                .set("token", token)
                                .end((err, res) => {
                                    if (err) return;
                                    let relatedAffairs;
                                    if (res.body.data.ProjectAffairs.length !== 0) {
                                        relatedAffairs = res.body.data.ProjectAffairs[0].relatedAffairs.split(',')[0];
                                    } else {
                                        relatedAffairs = res.body.data.SmallAffairs[0].relatedAffairs.split(',')[0];
                                    }
                                    request.get(common.baseUrl('/getTargetAffair/' + relatedAffairs))
                                        .set("token", token)
                                        .end((err, res) => {
                                            if (err) return;
                                            message.info('该事务已完成，请到' + res.body.data.name + '查看');
                                        });
                                });
                        }
                    }
                    //筛选保密的工作组
                    let endArr = [];
                    resArr.forEach((items, index) => {
                        let team = items.team.split(',');
                        if (items.secret == 0 || items.secret == 1 && team.indexOf(user_id) != -1 || user_id == items.insert_person) {
                            endArr.push(items);
                        }
                        // if(items.secret==0||user_id==items.insert_person){
                        //     endArr.push(items);
                        // }
                    });
                    //筛选我的事务
                    this.fetchMsgNotReply(notReplyArr => {
                        if (this.state.visibleSelf) {
                            // if(!this.props.location||!this.props.location.state||!this.props.location.state.fromBox){
                            //把跟我无关的全部去掉（我参与的，我关注的，我创建的）
                            let filterArr = [], mark = false;
                            endArr.forEach((items, index) => {
                                if (!items.RespoAffairs) {
                                    mark = true;
                                    let teamArr = items.team.split(',');
                                    let attentionArr;
                                    try {
                                        attentionArr = items.attentionStaff.split(',');
                                    } catch (e) {
                                        attentionArr = [];
                                    }
                                    if (teamArr.indexOf(user_id) != -1 || attentionArr.indexOf(user_id) != -1 || items.insert_person == user_id) {
                                        filterArr.push(items);
                                    }
                                }
                            });
                            if (mark) endArr = filterArr;
                        }
                        const myAffairsSortMap = common.myAffairsSortMap();
                        endArr.forEach((items, index) => {
                            if (!items.RespoAffairs) {
                                let count = 0;
                                //计算静态优先级
                                count += myAffairsSortMap[items.priority];
                                //计算外部联系人
                                if (items.outerContact) count += myAffairsSortMap['hasOuterContact'];
                                //计算负责，参与
                                let teamArr = items.team.split(',');
                                teamArr.forEach((items, index) => {
                                    if (items == user_id && index == 0) {
                                        count += myAffairsSortMap['responsible'];
                                    } else if (items == user_id) {
                                        count += myAffairsSortMap['join'];
                                    }
                                });
                                //计算关注
                                let attentionArr;
                                try {
                                    attentionArr = items.attentionStaff.split(',');
                                } catch (e) {
                                    attentionArr = [];
                                }
                                if (attentionArr.indexOf(user_id) != -1) count += myAffairsSortMap['attention'];
                                //计算逾期和临近到期，临近到期暂定7天
                                let deadlineStamp, deadline;
                                try {
                                    deadline = items.ProjectAffairs[0].deadline;
                                } catch (e) {
                                    deadline = items.SmallAffairs[0].deadline;
                                }
                                deadlineStamp = Date.parse(deadline);
                                if (deadlineStamp < Date.now()) {
                                    //已经逾期
                                    count += myAffairsSortMap['overTime'];
                                } else if ((deadlineStamp - Date.now()) / (1000 * 60 * 60 * 24) < 7) {
                                    //临近到期
                                    count += myAffairsSortMap['nearTime'];
                                }
                                //计算答复
                                let notReplyLen = 0;
                                notReplyArr.forEach((it, ind) => {
                                    let noti_post_mailId = it.NotiPost.noti_client_affair_group_uuid;
                                    let uuid = items.uuid;
                                    if (noti_post_mailId == uuid) {
                                        notReplyLen++;
                                        if (it.atMe) {
                                            count += myAffairsSortMap['atme'];
                                        } else {
                                            count += myAffairsSortMap['vote'];
                                        }
                                    }
                                });
                                endArr[index].notReplyLen = notReplyLen;
                                endArr[index].count = count;
                            }
                        });
                        const s = (a, b) => {
                            return b.count - a.count;
                        }
                        endArr = endArr.sort(s);
                        try {
                            selectedId = selectedId ? selectedId : endArr[0].uuid;
                            this.setState({
                                affairData: endArr,
                                selectedId: selectedId
                            });
                            this.fetchNotiMail(selectedId);
                        } catch (e) {
                            try {
                                selectedId = endArr[0].uuid;
                                this.setState({
                                    affairData: endArr,
                                    selectedId: selectedId
                                });
                                this.fetchNotiMail(selectedId);
                            } catch (e) {
                                this.setState({
                                    affairData: [],
                                    selectedMailList: [],
                                    resourse: [],
                                    selectedId: null
                                });
                            }
                        }
                        if (cb) cb();
                    });
                }
            });
    }

    //从通知中心获取未回复的消息
    fetchMsgNotReply(cb) {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/notiPost/fromCenterList'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                cb(res.body.data);
            });
    }

    //获取mail列表
    fetchNotiMail(uuid, cb) {

        const { affairData } = this.state;
        const staffData = this.staffData;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == uuid;
        }).toArray();
        let completionDegree = 10;
        try {
            completionDegree = selectedIdData[0].SmallAffairs[0].completionDegree;
        } catch (e) {
            try {
                const user_id = sessionStorage.getItem('user_id');
                selectedIdData[0].ProjectAffairs[0].ProjectAffairProgresses.forEach((items, index) => {
                    if (items.member == user_id) completionDegree = items.degree;
                });
            } catch (e) {

            }
        }
        this.setState({
            completionDegree
        });



        const { scroll } = this;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/notiClient/list'))
            .set("token", token)
            .query({
                noti_client_affair_group_uuid: uuid,
                page: scroll.pageStart,
                num: scroll.pageSize,
                keywords: scroll.keywords,
                filter: JSON.stringify(scroll.filter)
            })
            .end((err, res) => {
                if (err) return;
                res.body.data = res.body.data.reverse();
                const data = this.dealerMailDataSource(res.body.data);
                this.setState({
                    selectedMailList: data,
                    resourse: [],
                }, () => {
                    this.resoursePage = 1;
                    this.getResourse();
                    this.autoScrollToTarget();
                    if (cb) cb();
                });
            });
    }
    //后续获取mail列表
    fetchNotiMailByScroll(uuid, cb) {
        const { scroll } = this;
        this.scrollMark = 0;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/notiClient/list'))
            .set("token", token)
            .query({
                noti_client_affair_group_uuid: uuid,
                page: scroll.pageStart,
                num: scroll.pageSize,
                keywords: scroll.keywords,
                filter: JSON.stringify(scroll.filter)
            })
            .end((err, res) => {
                if (err) return;
                res.body.data = res.body.data.reverse();
                const data = this.dealerMailDataSource(res.body.data);
                cb(data);
            });
    }

    //事务点击
    affairClick(items) {
        this.locationId = null;
        this.scrollHeight = 0;
        this.scrollMark = 0;

        this.scroll.pageStart = 1;
        this.scroll.hasMore = true;
        this.scroll.loading = false;

        this.fetchNotiMail(items.uuid);

        this.setState({
            selectedId: items.uuid,
            selectedMailList: [],
        });
    }

    /*******************************************/
    affairPriorityChange(v) {
        const { affairProp } = this;
        affairProp.priority = v;
        this.affairProp = affairProp;
    }

    affairStateChange(v) {
        const { affairProp } = this;
        affairProp.state = v;
        this.affairProp = affairProp;
    }

    affairLabelsChange(v) {
        const { affairProp } = this;
        affairProp.labels = v;
        this.affairProp = affairProp;
    }

    affairTeamChange(v) {
        const { affairProp } = this;
        affairProp.team = v;
        this.affairProp = affairProp;
    }

    affairSecretChange(v) {
        const { affairProp } = this;
        affairProp.secret = v;
        this.affairProp = affairProp;
    }

    deadlineChange(v) {
        const { affairProp } = this;
        affairProp.deadline = v.format('YYYY-MM-DD');
        this.affairProp = affairProp;
    }
    /*******************************************/

    memberChange = team => {
        const teamArr = team.map(items => items.user_id);
        this.affairTeamChange(teamArr);
    }

    renderAffairTeam = team => {
        team.forEach((items, index) => {
            this.staffArr.forEach((it, ind) => {
                it.forEach((_it, _ind) => {
                    if (_it.user_id == items) {
                        team[index] = _it;
                    }
                });
            });
        });
        team.forEach((items, index) => {
            if (typeof items === 'string') {
                team[index] = {};
                team[index].user_name = items;
                team[index].user_id = items;
            }
        });
        return <AffairTeamTemp team={team} staffArr={this.staffArr} memberChange={this.memberChange} />
    }

    editAffair(data) {
        let labels, team;
        try {
            labels = data.RespoAffairs[0].labels.split(',');
        } catch (e) {
            labels = [];
        }
        try {
            team = data.team.split(',');
        } catch (e) {
            team = [];
        }
        let modalText = <div>
            <label style={{ display: 'flex' }}>
                <span style={{ width: '80px' }}>事务名称：</span>
                <Input name={"name"} style={{ flex: 1 }} defaultValue={data.name} />
            </label>
            <label style={{ display: 'flex', marginTop: 10 }}>
                <span style={{ width: '80px' }}>优先级：</span>
                <Select defaultValue={data.priority} onChange={this.affairPriorityChange}>
                    <Option value={'紧急'}>紧急</Option>
                    <Option value={'重要'}>重要</Option>
                    <Option value={'普通'}>普通</Option>
                    <Option value={'暂缓'}>暂缓</Option>
                </Select>
            </label>
            {/* <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'80px'}}>状态：</span>
                                <Select defaultValue={data.state} onChange={this.affairStateChange}>
                                    <Option value={'草拟'}>草拟</Option>
                                    <Option value={'进行中'}>进行中</Option>
                                    <Option value={'已完成'}>已完成</Option>
                                    <Option value={'关闭'}>关闭</Option>
                                </Select>
                            </label> */}
            <label style={{ display: 'flex', marginTop: 10 }}>
                <span style={{ width: '80px' }}>是否保密：</span>
                <Select defaultValue={data.secret} onChange={this.affairSecretChange}>
                    <Option value={1}>是</Option>
                    <Option value={0}>否</Option>
                </Select>
            </label>
            <label style={{ display: 'flex', marginTop: 10 }}>
                <span style={{ width: '80px' }}>职责描述：</span>
                <Input name={"resposibility"} style={{ flex: 1 }} defaultValue={data.RespoAffairs[0].resposibility} />
            </label>
            <label style={{ display: 'flex', marginTop: 10 }}>
                <span style={{ width: '80px' }}>关键词：</span>
                <Select
                    key={1}
                    mode="tags"
                    style={{ flex: 1 }}
                    placeholder="请输入..."
                    defaultValue={labels}
                    onChange={this.affairLabelsChange}
                >
                </Select>
            </label>
            <label style={{ display: 'flex', marginTop: 10 }}>
                <span style={{ width: '80px' }}>工作团队：</span>
                <div style={{ flex: 1 }}>{this.renderAffairTeam(team)}</div>
            </label>
            <label style={{ display: 'flex', marginTop: 10 }}>
                <span style={{ width: '80px' }}>所属部门：</span>
                <div style={{ flex: 1 }}>
                    <Select defaultValue={data.RespoAffairs[0].department} style={{ width: 120 }} onChange={v => this.affairProp.branch = v} >
                        <Option value="客户关系部">客户关系部</Option>
                        <Option value="会员">会员</Option>
                        <Option value="生产部">生产部</Option>
                        <Option value="研发部">研发部</Option>
                        <Option value="管理部">管理部</Option>
                    </Select>
                </div>
            </label>
        </div>;
        this.affairProp = {
            priority: data.priority,
            state: data.state,
            secret: data.secret,
            labels: labels,
            team: team,
            branch: data.RespoAffairs[0].department,
        };
        this.setState({
            modalText,
            visible: true
        });
    }

    handleModalDefine(data) {
        const { affairProp } = this;
        let { selectedId, affairData } = this.state;
        let team = affairProp.team;
        let labels = affairProp.labels;
        const branch = affairProp.branch;
        if (team.length < 1) {
            message.warn('工作团队人数至少为一人');
            return;
        } else if (data.name == '') {
            message.warn('事务名称不能为空');
            return;
        }
        if (typeof team[0] === 'object') {
            team = team.map(items => items.user_id);
        }
        team = team.join();
        labels = labels.join();
        if (labels == '') labels = null;

        const affairFormData = {
            name: data.name,
            priority: affairProp.priority,
            state: affairProp.state,
            secret: affairProp.secret,
            uuid: selectedId
        };
        const respoAffairFormData = {
            resposibility: data.resposibility,
            labels: labels,
            noti_client_affair_group_uuid: selectedId
        };
        const groupMemberFormData = {
            team: team,
            uuid: selectedId,
            branch,
        };
        const _p = [];
        const token = sessionStorage.getItem('token');
        _p[0] = new Promise((resolve, reject) => {
            request.put(common.baseUrl('/affair/update'))
                .set("token", token)
                .send({
                    form_data: JSON.stringify(affairFormData)
                })
                .end((err, res) => {
                    if (err) return;
                    resolve();
                });
        });
        _p[1] = new Promise((resolve, reject) => {
            request.put(common.baseUrl('/respoAffair/update'))
                .set("token", token)
                .send({
                    form_data: JSON.stringify(respoAffairFormData)
                })
                .end((err, res) => {
                    if (err) return;
                    resolve();
                });
        });
        _p[2] = new Promise((resolve, reject) => {
            request.put(common.baseUrl('/affair/changeTeamMember'))
                .set("token", token)
                .send({
                    form_data: JSON.stringify(groupMemberFormData)
                })
                .end((err, res) => {
                    if (err) return;
                    resolve();
                });
        });
        Promise.all(_p).then(result => {
            message.success('操作成功');
            request.get(common.baseUrl('/getTargetAffair/' + selectedId))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    affairData.forEach((items, index) => {
                        if (items.uuid == selectedId) {
                            if (items.RespoAffairs[0].department != res.body.data.RespoAffairs[0].department) {
                                affairData.splice(index, 1);
                            } else {
                                //保留原来的关联事务和被关联事务
                                const { subRelativeAffair, supRelativeAffair } = affairData[index];
                                res.body.data.subRelativeAffair = subRelativeAffair;
                                res.body.data.supRelativeAffair = supRelativeAffair;
                                affairData[index] = res.body.data;
                            }
                        }
                    });
                    this.setState({
                        affairData
                    });
                });
        }).catch(result => {
            message.error(result);
        });
    }

    handleModalCancel() {
        this.setState({
            visible: !this.state.visible
        });
    }

    //摘要模板
    summaryTemp() {
        let { selectedId, affairData } = this.state;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        if (selectedIdData.length == 0) return;
        const user_id = sessionStorage.getItem('user_id');
        const token = sessionStorage.getItem('token');
        let tagArr;
        try {
            tagArr = selectedIdData[0].RespoAffairs[0].labels.split(',');
        } catch (e) {
            tagArr = [];
        };
        //编辑按钮
        const showEdit = () => {
            let editable = false;
            let teamDirector;
            try {
                teamDirector = selectedIdData[0].team.split(',')[0];
            } catch (e) { }
            let user_id = sessionStorage.getItem('user_id');
            if (teamDirector == user_id || selectedIdData[0].insert_person == user_id) editable = true;
            if (editable) {
                return (
                    <p style={{ display: 'flex' }}>
                        <div style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => this.editAffair(selectedIdData[0])}>
                            <Icon type="form" />
                            <span style={{ marginLeft: 4 }}>编辑</span>
                        </div>
                        <div style={{ color: '#1890ff', cursor: 'pointer', marginLeft: 32 }} onClick={() => this.transferMsg(selectedIdData[0].uuid)}>
                            <Icon type="export" />
                            <span style={{ marginLeft: 4 }}>消息迁移</span>
                        </div>
                    </p>
                )
            }
        }
        //队员可见
        const teamSecret = (secret) => {
            if (secret == 1) {
                return '是';
            } else {
                return '否';
            }
        }
        const temp = <div>
            {showEdit()}
            <p>
                <span>事务名称：</span>
                <span>{selectedIdData[0].name}</span>
            </p>
            <p>
                <span>优先级：</span>
                <span>{selectedIdData[0].priority}</span>
            </p>
            <p>
                <span>状态：</span>
                <span>{selectedIdData[0].state}</span>
                {this.isDirector() && <Popconfirm placement="topLeft" title={'确定关闭当前事务？'} onConfirm={() => {
                    const token = sessionStorage.getItem('token');
                    request.put(common.baseUrl('/affair/update'))
                        .set("token", token)
                        .send({
                            form_data: JSON.stringify({
                                state: '关闭',
                                uuid: selectedId,
                            }),
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success('操作成功');
                            request.get(common.baseUrl('/getTargetAffairSupAndSub/' + selectedId))
                                .set("token", token)
                                .end((err, res) => {
                                    if (err) return;
                                    affairData.forEach((items, index) => {
                                        if (items.uuid == selectedId) {
                                            affairData[index] = res.body.data;
                                        }
                                    });
                                    affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                                    this.setState({
                                        affairData
                                    });
                                });
                        });
                }} okText="Yes" cancelText="No">
                    <Button style={{ marginLeft: 10 }} size={'small'}>关闭</Button>
                </Popconfirm>}
                {this.isDirector() && selectedIdData[0].state == '草拟' && <Button size={'small'} style={{ marginLeft: 6 }} onClick={() => {
                    const token = sessionStorage.getItem('token');
                    request.put(common.baseUrl('/affair/update'))
                        .set("token", token)
                        .send({
                            form_data: JSON.stringify({
                                state: '进行中',
                                uuid: selectedId,
                            }),
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success('操作成功');
                            request.get(common.baseUrl('/getTargetAffairSupAndSub/' + selectedId))
                                .set("token", token)
                                .end((err, res) => {
                                    if (err) return;
                                    affairData.forEach((items, index) => {
                                        if (items.uuid == selectedId) {
                                            affairData[index] = res.body.data;
                                        }
                                    });
                                    affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                                    this.setState({
                                        affairData
                                    });
                                });
                        });
                }}>切换到进行中</Button>}
            </p>
            <p>
                <span>所属部门：</span>
                <span>{selectedIdData[0].RespoAffairs[0].department}</span>
            </p>
            <p>
                <span>是否保密：</span>
                <span>{teamSecret(selectedIdData[0].secret)}</span>
            </p>
            <p>
                <span>职责描述：</span>
                <span>{selectedIdData[0].RespoAffairs[0].resposibility}</span>
            </p>
            <p>
                <span>关键词标签：</span>
                <span>
                    {
                        tagArr.map(items =>
                            <Tag key={items}>{items}</Tag>
                        )
                    }
                </span>
            </p>
            <p>
                <span>事务发布人：</span>
                <span>{selectedIdData[0].insert_person_name}</span>
            </p>
            <p>
                <span>工作团队：</span>
                <span>{selectedIdData[0].teamName}</span>
            </p>
            <p>
                <span>关注的员工：</span>
                <span>{selectedIdData[0].attentionStaffName}</span>
            </p>
        </div>;
        return temp;
    }

    fetchTotalAffair = async () => {
        let token = sessionStorage.getItem('token');
        return await new Promise(resolve => {
            request.get(common.baseUrl('/affair/listForSelect'))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    resolve(res.body.data);
                });
        });
    }

    transferMsg = async currentAffairId => {
        let totalAffairList = await this.fetchTotalAffair();
        totalAffairList = totalAffairList.filter(items => items.uuid !== currentAffairId);
        this.targetAffairId = null;
        const self = this;
        Modal.confirm({
            icon: <span></span>,
            title: '迁移至',
            content: <Select
                    showSearch
                    style={{ width: '100%' }}
                    optionFilterProp="children"
                    onChange={v => this.targetAffairId = v}
                    filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {
                        totalAffairList.map(items => <Option key={items.uuid} value={items.uuid}>{items.name}</Option>)
                    }
                </Select>,
            onOk() {
                const token = sessionStorage.getItem('token');
                request.put(common.baseUrl('/affair/transferMsg'))
                    .set("token", token)
                    .send({
                        targetAffairId: self.targetAffairId,
                        currentAffairId,
                    })
                    .end((err, res) => {
                        if (err) return;
                        message.success(res.body.msg);
                        self.targetAffairId = null;
                        self.fetchNotiMail(currentAffairId);
                    });
            },
            onCancel() { 
                self.targetAffairId = null;
            },
        });
    }

    //追加回复
    addReply(params) {
        const { selectedMailList } = this.state;
        if (params.atReply == '') return;
        const { mailId } = params.params;
        const form_data = {
            atReply: params.atReply,
            noti_client_mailId: mailId
        };
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/notiClient/addReply'))
            .set("token", token)
            .send(form_data)
            .end((err, res) => {
                if (err) return;
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    request.get(common.baseUrl('/notiMail/' + mailId))
                        .set("token", token)
                        .end((err, res) => {
                            selectedMailList.forEach((items, index) => {
                                if (items.mailId == res.body.data.mailId) {
                                    selectedMailList[index] = res.body.data;
                                }
                            });
                            this.setState({
                                selectedMailList
                            });
                        });
                    $('.actionWrap[data-mailId=' + mailId + '] .addReply textarea').val('');
                    $('.actionWrap[data-mailId=' + mailId + '] .addReply').hide();
                    $('.actionWrap[data-mailId=' + mailId + '] .actionBar').fadeOut();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    //转发接收者变化
    forwardMsgReceiverChange(v) {
        this.forwardMsgReceiver = v;
    }

    //转发消息
    forwardMsg(params) {
        if (!this.forwardMsgReceiver) return;
        const user_id = sessionStorage.getItem('user_id');
        const token = sessionStorage.getItem('token');
        let mailId = Date.now();
        const data = {
            mailId: mailId,
            class: 'forward',
            priority: '普通',
            frontUrl: window.location.href.split('#')[1].split('?')[0],
            sender: user_id,
            post_time: moment().format('YYYY-MM-DD HH:mm:ss'),
            title: params.params.title,
            content: params.params.content + '（原发送者：' + params.params.senderName + '）',
            subscriber: this.forwardMsgReceiver,
            noti_client_affair_group_uuid: params.params.noti_client_affair_group_uuid,
            locationId: params.params.locationId,
            NotiClientSubs: [
                {
                    receiver: this.forwardMsgReceiver,
                    noti_post_mailId: mailId
                }
            ]
        };
        request.post(common.baseUrl('/notiClient/forwardMsg'))
            .set("token", token)
            .send({
                data: JSON.stringify(data)
            })
            .end((err, res) => {
                if (err) return;
                if (res.status == 200) {
                    message.success('转发成功');
                    this.forwardMsgReceiver = null;
                    $('.actionWrap[data-mailId=' + params.params.mailId + '] .msgExport').hide();
                    $('.actionWrap[data-mailId=' + params.params.mailId + '] .actionBar').fadeOut();
                } else {
                    message.error('转发失败');
                }
            });
    }

    //消息模板
    mailTemp() {
        const { selectedMailList } = this.state;
        if (selectedMailList.length == 0) return;
        //消息对齐方向
        const checkDirection = (items) => {
            const user_id = sessionStorage.getItem('user_id');
            const sender = items.sender;
            if (user_id != sender) {
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-rightTop',
                    flexDirection: 'row'
                };
            } else {
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-leftTop',
                    flexDirection: 'row-reverse'
                }
            }
        }

        //渲染内容
        const renderContent = (items) => {
            const locationHref = (items) => {
                let data = {
                    frontUrl: items.frontUrl,
                    affairId: items.noti_client_affair_group_uuid
                };
                this.subHandleTableClick(data);
            }

            const trans = (content) => {
                content = content.replace(/\n/g, '</br>');
                content = content.replace(/\s/g, '&nbsp;');
                return content;
            }

            const recall = (items) => {
                const { sender } = items;
                const user_id = sessionStorage.getItem('user_id');
                if (sender != user_id) return;
                return <Popconfirm placement="bottomRight" title={'确定撤回？'} onConfirm={(e) => {
                    const token = sessionStorage.getItem('token');
                    const mailId = items.mailId;
                    request.put(common.baseUrl('/notiClient/recall'))
                        .set("token", token)
                        .send({
                            mailId: mailId
                        })
                        .end((err, res) => {
                            if (err) return;
                            message.success(res.body.msg);
                            request.get(common.baseUrl('/notiMail/' + mailId))
                                .set("token", token)
                                .end((err, res) => {
                                    selectedMailList.forEach((items, index) => {
                                        if (items.mailId == res.body.data.mailId && res.body.data.isdel == 1) {
                                            selectedMailList.splice(index, 1);
                                        }
                                    });
                                    this.setState({
                                        selectedMailList
                                    });
                                });
                        });
                }} okText="Yes" cancelText="No">
                    <Icon title={"撤回"} style={{ cursor: 'pointer', position: 'absolute', right: 84 }} type="delete" />
                </Popconfirm>
            }

            const renderMeetingMsg = () => {
                if (items.isMeetingMsg) {
                    return '<p>【会议通知】' + moment(items.meetingTime).format('YYYY-MM-DD HH:mm:ss') + '</p>';
                }
                return '';
            }

            if (items.class != 'respoAffair') {
                return <div title={'点击跳转到指定事务'} style={{ cursor: 'pointer' }} onClick={() => locationHref(items)} dangerouslySetInnerHTML={{ __html: renderMeetingMsg() + trans('【' + items.title + '】' + items.content) }}></div>;
            } else {
                return <div className={'actionWrap'} data-mailId={items.mailId}>
                    <div dangerouslySetInnerHTML={{ __html: renderMeetingMsg() + trans(items.content) }}></div>
                    <div className={'actionBar'} style={{ textAlign: 'right', fontSize: 17, display: 'none' }}>
                        {recall(items)}
                        <Icon onClick={(e) => {
                            const sender = items.sender;
                            this.search();
                            let eyeTitle;
                            if (this.state.eyeTitle == '只看他') {
                                eyeTitle = '查看全部';
                                this.scroll.filter.sender = sender;
                            } else {
                                eyeTitle = '只看他';
                                delete this.scroll.filter.sender;
                            }
                            this.setState({
                                eyeTitle: eyeTitle
                            });
                        }} title={this.state.eyeTitle} style={{ cursor: 'pointer', position: 'absolute', right: 59 }} type="eye" />
                        <Icon onClick={(e) => {
                            $(e.target).parents('.actionBar').find('.addReply').show();
                            $(e.target).parents('.actionBar').find('.msgExport').hide();
                            let prevHeight = $(e.target).parents('.actionBar').prev().height() + 45;
                            $(e.target).parents('.actionBar').find('i').css('top', prevHeight);
                        }} title={"添加回复"} style={{ cursor: 'pointer', position: 'absolute', right: 36 }} type="edit" />
                        <Icon onClick={(e) => {
                            $(e.target).parents('.actionBar').find('.msgExport').show();
                            $(e.target).parents('.actionBar').find('.addReply').hide();
                            let prevHeight = $(e.target).parents('.actionBar').prev().height() + 45;
                            $(e.target).parents('.actionBar').find('i').css('top', prevHeight);
                        }} title={"转发"} style={{ cursor: 'pointer', marginLeft: 8, position: 'absolute', right: 11 }} type="export" />
                        <div style={{ display: 'none', marginTop: 25 }} className={"addReply"}>
                            <textarea className="ant-input" rows={3}></textarea>
                            {/* <TextArea rows={3}></TextArea> */}
                            <Button style={{ fontSize: 12, marginTop: 5 }} size={'small'} type={'primary'}
                                onClick={(e) => this.addReply({
                                    params: items,
                                    atReply: $(e.target).parent().parent().find('textarea').val()
                                })}
                            >{'回复'}</Button>
                        </div>
                        <div style={{ display: 'none', marginTop: 25 }} className={"msgExport"}>
                            <Select
                                showSearch
                                placeholder={'请选择一人'}
                                onChange={this.forwardMsgReceiverChange}
                                style={{ width: '100%' }}
                            >
                                <Select.OptGroup label="研发部">
                                    {
                                        this.staffArr[0].map(items =>
                                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                        )
                                    }
                                </Select.OptGroup>
                                <Select.OptGroup label="客户关系部">
                                    {
                                        this.staffArr[1].map(items =>
                                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                        )
                                    }
                                </Select.OptGroup>
                                <Select.OptGroup label="生产部">
                                    {
                                        this.staffArr[2].map(items =>
                                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                        )
                                    }
                                </Select.OptGroup>
                                <Select.OptGroup label="管理部">
                                    {
                                        this.staffArr[3].map(items =>
                                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                        )
                                    }
                                </Select.OptGroup>
                            </Select>
                            <Button style={{ fontSize: 12, marginTop: 5 }} size={'small'} type={'primary'}
                                onClick={(e) => this.forwardMsg({
                                    params: items
                                })}
                            >{'提交'}</Button>
                        </div>
                    </div>
                </div>
            }
        }

        //附件
        const annex = (items) => {
            if (items.class != 'respoAffair') return;
            let albumArr = [], albumNameArr = [], fileArr = [], fileNameArr = [];
            if (items.album) {
                albumArr = items.album.split(',');
                albumNameArr = items.albumName.split(',');
            }
            if (items.file) {
                fileArr = items.file.split(',');
                fileNameArr = items.fileName.split(',');
            }
            return <div>
                <div style={{ padding: 2 }}>
                    {
                        albumArr.map((items, index) =>
                            <img onClick={() => {
                                this.canRenderPhoto = true;
                                this.setState({
                                    imgSrc: common.staticBaseUrl('/img/notiClient/' + items),
                                    albumBorwerArr: albumArr
                                }, () => {
                                    this.canRenderPhoto = false;
                                })
                            }} key={items} title={albumNameArr[index]} style={{ marginLeft: 13, cursor: 'pointer' }} src={common.staticBaseUrl('/img/notiClient/small_' + items)} />
                            // <a key={items} title={albumNameArr[index]} target={'_blank'} href={common.staticBaseUrl('/img/notiClient/'+items)}>
                            //     <img style={{marginLeft: 13}} src={common.staticBaseUrl('/img/notiClient/small_'+items)} />
                            // </a>
                        )
                    }
                </div>
                <div style={{ padding: 2 }}>
                    {
                        fileArr.map((items, index) =>
                            <p key={items} style={{ marginBottom: 0 }}>
                                <a style={{ marginLeft: 13 }} title={fileNameArr[index]} target={'_blank'} href={common.staticBaseUrl('/notiClient/' + items)}>
                                    {Number(index + 1) + '. ' + fileNameArr[index]}
                                </a>
                            </p>
                        )
                    }
                </div>
            </div>;
        }

        //回复模板
        const actionshow = (it) => {
            if (it.class != 'respoAffair') return;
            const user_id = sessionStorage.getItem('user_id');

            //自己发的模板
            const tempSelfPublish = (it) => {
                const trans = (content) => {
                    try {
                        content = content.replace(/\n/g, '</br>');
                        content = content.replace(/\s/g, '&nbsp;');
                    } catch (e) {

                    }
                    return content;
                }
                let _contentArr;
                try {
                    _contentArr = it.votes.split(',');
                } catch (e) {
                    _contentArr = [];
                }
                _contentArr.forEach((_it, _ind) => {
                    _contentArr[_ind] = {};
                    _contentArr[_ind][_it] = [];
                });
                _contentArr.push({
                    '未处理': []
                });
                it.NotiClientSubs.map((_items, _index) => {
                    _contentArr.forEach((_it, _ind) => {
                        for (let _key in _it) {
                            if (_items.vote == _key) {
                                _contentArr[_ind][_key].push(_items.receiverName);
                                // _contentArr[_ind][_key].push(_items.receiver);
                                break;
                            } else if (!_items.vote && _ind == _contentArr.length - 1 && _items.replied == 0) {
                                // _contentArr[_contentArr.length-1]['未处理'].push(_items.receiver);
                                // _contentArr[_contentArr.length-1]['未投票'].push(_items.receiverName);
                            }
                        }
                    });
                    if (_items.replied == 0) {
                        _contentArr[_contentArr.length - 1]['未处理'].push(_items.receiverName);
                        // _contentArr[_contentArr.length-1]['未处理'].push(_items.receiver);
                    }
                });
                const inRender = (items) => {
                    for (let key in items) {
                        return <div key={key}>
                            <span>{key}（{items[key].length}）：</span>
                            <span>{items[key].join()}</span>
                        </div>
                    }
                }
                const orderReply = () => {
                    let resArr = [];
                    it.NotiClientSubs.map((_items, _index) => {
                        if (_items.atMe) {
                            resArr.push(_items);
                        }
                    });
                    const s = (a, b) => {
                        return Date.parse(a.replyTime) - Date.parse(b.replyTime);
                    }
                    resArr = resArr.sort(s);
                    return resArr.map(items =>
                        <p key={items.id} style={{ marginBottom: 0 }}>
                            <span>{items.receiverName}：</span>
                            {/* <span>{items.receiver}：</span> */}
                            {/* <span>{items.atReply}</span> */}
                            <span dangerouslySetInnerHTML={{ __html: trans(items.atReply) }}></span>
                        </p>
                    );
                }
                /*************清除已阅********************/
                let key1, key2, v1, v2;
                _contentArr.forEach((items, index) => {
                    for (let key in items) {
                        if (index == 0) {
                            key1 = key;
                        } else if (index == 1) {
                            key2 = key;
                            v2 = items[key];
                        }
                    }
                });
                if (_contentArr.length == 2 && key1 == '已阅' && key2 == '未处理' && v2.length == 0) {
                    _contentArr = [];
                }
                /****************************************/

                _contentArr.forEach((items, index) => {
                    for (let key in items) {
                        if (key == '未处理' && items[key].length == 0) {
                            _contentArr.splice(index, 1);
                        }
                    }
                });

                /*****************返回结果***********************/
                const orderReplyArr = orderReply();
                if (orderReplyArr.length != 0 || _contentArr.length != 0) {
                    return <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                        {
                            orderReply()
                        }
                        {
                            _contentArr.map(items =>
                                inRender(items)
                            )
                        }
                    </div>
                }
            }

            //别人发的模板
            const tempOtherPublish = (it) => {
                const user_id = sessionStorage.getItem('user_id');
                let mark = false;
                //防止回复模板刷多次
                const hasDoneArr = [];
                return it.NotiClientSubs.map((_items, _index) => {
                    if (user_id == _items.receiver) {
                        mark = true;
                        if (_items.replied == 1) {
                            if (hasDoneArr.indexOf(_items.receiver) == -1) {
                                hasDoneArr.push(_items.receiver);
                                //回复完毕之后，看到的内容跟发送人一致
                                // return tempSelfPublish(it);
                            }
                        } else {
                            let _arr;
                            try {
                                _arr = it.votes.split(',');
                            } catch (e) {
                                _arr = [];
                            }
                            const atMeTemp = (_items) => {
                                if (_items.atMe == 0) return;
                                const checkHasDone = () => {
                                    let hasDone = false;
                                    if (_items.atReply) hasDone = true;
                                    if (hasDone) {
                                        return <div style={{ marginBottom: 5 }}>
                                            {_items.atReply}
                                        </div>
                                    } else {
                                        return <div style={{ textAlign: 'right', marginTop: 5 }} key={_items.id}>
                                            {/* <TextArea rows={3}></TextArea> */}
                                            <textarea className="ant-input" rows={3}></textarea>
                                            <Button style={{ fontSize: 12, marginTop: 5 }} size={'small'} type={'primary'}
                                                onClick={(e) => this.publishReply({
                                                    id: _items.id,
                                                    noti_client_mailId: _items.noti_client_mailId,
                                                    atReply: $(e.target).parent().parent().find('textarea').val()
                                                })}
                                            >{'回复'}</Button>
                                        </div>
                                    }
                                }
                                return checkHasDone();
                            }
                            const radioTemp = (_items) => {
                                if (_arr.length == 0) return;
                                const checkHasDone = () => {
                                    let hasDone = false;
                                    if (_items.vote) hasDone = true;
                                    if (hasDone) {
                                        return <div style={{ marginBottom: 5 }}>
                                            {_items.vote}
                                        </div>
                                    } else {
                                        return <div style={{ marginBottom: 5 }}>
                                            <RadioGroup defaultValue={_arr[0]}>
                                                {
                                                    _arr.map(items =>
                                                        <Radio key={items} value={items}>{items}</Radio>
                                                    )
                                                }
                                            </RadioGroup>
                                            <Button type={'primary'} style={{ marginLeft: 25, fontSize: 12 }} size={'small'} onClick={(e) => {
                                                let index = $(e.target).parent().parent().find('.ant-radio-wrapper-checked').index();
                                                const _arr = it.votes.split(',');
                                                this.publishReply({
                                                    id: _items.id,
                                                    noti_client_mailId: _items.noti_client_mailId,
                                                    vote: _arr[index]
                                                })
                                            }}>提交</Button>
                                        </div>
                                    }
                                }
                                return checkHasDone();
                            }
                            return <div key={_items.id} style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                                {radioTemp(_items)}
                                {atMeTemp(_items)}
                            </div>
                        }
                    } else if (user_id != _items.receiver && _index == it.NotiClientSubs.length - 1) {
                        //路人看到的回执信息跟发件人一样
                        // if(!mark) return tempSelfPublish(it);
                    }
                });
            }

            if (it.sender == user_id) { //自己发的
                return tempSelfPublish(it);
            } else {
                return (
                    <div>
                        {tempSelfPublish(it)}
                        {tempOtherPublish(it)}
                    </div>
                );
            }
        }

        //loadMore
        const loadMore = () => {
            let { selectedMailList, selectedId } = this.state;
            if (this.scroll.loading || !this.scroll.hasMore) return;
            this.scroll.pageStart++;
            this.scroll.loading = true;
            this.fetchNotiMailByScroll(selectedId, data => {
                if (data[0] == null) {
                    this.scroll.loading = false;
                    this.scroll.hasMore = false;
                    return;
                }
                selectedMailList = [...data, ...selectedMailList];
                this.scroll.loading = false;
                this.scroll.hasMore = true;
                this.setState({
                    selectedMailList
                }, () => {
                    this.autoScrollToTarget();
                });
            });
        }

        const checkIsFromCall = (items) => {
            if (items.isFromCall) {
                return <Icon title={'来自电话联系单'} style={{ marginLeft: 5 }} type="phone" />;
            }
        }

        let temp = <div className={"chats"} style={{ height: window.innerHeight - 165, overflow: 'auto' }}>
            <InfiniteScroll
                initialLoad={false}
                pageStart={this.scroll.pageStart}
                isReverse={true}
                loadMore={loadMore}
                hasMore={this.scroll.hasMore}
                useWindow={false}
                threshold={1}
            >
                {
                    selectedMailList.map(items =>
                        <div data-uuid={items.mailId} key={items.mailId} className={"chat"} style={{ display: 'flex', flexDirection: checkDirection(items)['flexDirection'], margin: 10 }}>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0 }}>{items.senderName}{checkIsFromCall(items)}</p>
                            </div>
                            <div className={checkDirection(items)['popoverPlace']} style={{ position: 'relative', maxWidth: 600, zIndex: 1 }}>
                                <div className={"ant-popover-content"}>
                                    <div className={"ant-popover-arrow"}></div>
                                    <div className={"ant-popover-inner"}>
                                        <div>
                                            <div className={"ant-popover-title"} style={{ ...this.skipStyle(items) }} onClick={() => this.locationToPage(items)}>
                                                <span>{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                            </div>
                                            <div className={"ant-popover-inner-content"}
                                                onMouseEnter={(e) => {
                                                    if ($(e.target).find('.addReply').css('display') == 'none' && $(e.target).find('.msgExport').css('display') == 'none') {
                                                        $(e.target).find('.actionBar').fadeIn();
                                                    } else if ($(e.target).parents('.ant-popover-inner-content').find('.addReply').css('display') == 'none' && $(e.target).parents('.ant-popover-inner-content').find('.msgExport').css('display') == 'none') {
                                                        $(e.target).parents('.ant-popover-inner-content').find('.actionBar').fadeIn();
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if ($(e.target).find('.addReply').css('display') == 'none' && $(e.target).find('.msgExport').css('display') == 'none') {
                                                        $(e.target).find('.actionBar').fadeOut();
                                                    } else if ($(e.target).parents('.ant-popover-inner-content').find('.addReply').css('display') == 'none' && $(e.target).parents('.ant-popover-inner-content').find('.msgExport').css('display') == 'none') {
                                                        $(e.target).parents('.ant-popover-inner-content').find('.actionBar').fadeOut();
                                                    }
                                                }}
                                            >
                                                <div>
                                                    <p style={{ marginBottom: 0, wordBreak: 'break-all', wordWrap: 'break-word' }}>{renderContent(items)}</p>
                                                    {/* <p style={{marginBottom: 0,wordBreak: 'break-all',wordWrap: 'break-word'}}>{items.content}</p> */}
                                                </div>
                                            </div>
                                            {annex(items)}
                                            {/* <div style={{padding: '12px 16px',borderTop: '1px solid #eee'}}> */}
                                            {actionshow(items)}
                                            {/* </div> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </ InfiniteScroll >
        </div>;
        return temp;
    }

    locationToPage = items => {
        const { skipPage, skipId } = items;
        if (skipId) {
            hashHistory.push({
                pathname: skipPage,
                state: {
                    phone: skipId,
                }
            });
        }
    }

    skipStyle = items => {
        const { skipId } = items;
        if (skipId) {
            return { cursor: 'pointer' };
        }
        return {};
    }

    // 为了做跳转，加skipId，skipPage
    dealerMailDataSource = data => {
        data.forEach((items, index) => {
            if (items.sender.indexOf('oxI') !== -1) {
                data[index].skipId = items.sender;
                data[index].skipPage = '/member';
            }
        });
        return data;
    }

    //回复
    publishReply(params) {
        const { noti_client_mailId } = params;
        const { selectedMailList } = this.state;
        if (!params.vote && !params.atReply) {
            message.warn('回复不能为空');
            return;
        }
        if (this.btnGroup.isReplying) return;
        this.btnGroup.isReplying = true;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/notiClient/subUpdate'))
            .set("token", token)
            .send(params)
            .end((err, res) => {
                if (err) return;
                this.btnGroup.isReplying = false;
                if (res.body.code == 200) {
                    message.success(res.body.msg);
                    // this.fetchNotiMail(this.state.selectedId);
                    request.get(common.baseUrl('/notiMail/' + noti_client_mailId))
                        .set("token", token)
                        .end((err, res) => {
                            selectedMailList.forEach((items, index) => {
                                if (items.mailId == res.body.data.mailId) {
                                    selectedMailList[index] = res.body.data;
                                }
                            });
                            this.setState({
                                selectedMailList
                            });
                        });
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 服务器端拉取资源
    // 控制resoursePage++即可
    getResourse() {
        const { selectedId, resourse } = this.state;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/notiClient/getResourse'))
            .set("token", token)
            .query({
                noti_client_affair_group_uuid: selectedId,
                page: this.resoursePage,
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    resourse: [...resourse, ...res.body.data],
                });
            });
    }

    //渲染资源
    pullResourse(c_height) {
        c_height = c_height - 105;
        const { selectedMailList, selectedId, resourse } = this.state;
        if (resourse.length == 0) return <h2 style={{ textAlign: 'center' }}>暂无资源</h2>;
        let resArr = [];
        var w = $('.ant-tabs').width();
        resourse.forEach((items, index) => {
            let fileArr = items.file.split(',');
            let fileNameArr = items.fileName.split(',');
            fileArr.forEach((it, ind) => {
                resArr = [...resArr, {
                    senderName: items.senderName,
                    content: <p title={items.content} style={{ marginBottom: 0, maxWidth: w - 720, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{items.content}</p>,
                    post_time: moment(items.post_time).format('YYYY-MM-DD HH:mm:ss'),
                    // fileName: <span style={{cursor: 'pointer', color: '#1890ff'}} title={fileNameArr[ind]} onClick={() => this.addToDocLib(fileNameArr[ind])}>
                    //             {fileNameArr[ind]}
                    //          </span>
                    fileName: <span>
                        <a target={'_blank'} title={fileNameArr[ind]} href={common.staticBaseUrl('/notiClient/' + it)}>
                            {fileNameArr[ind]}
                        </a>
                        {items.isExport == 0 && <Icon style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => this.addToDocLib(fileNameArr[ind], items.mailId)} type="export" />}
                    </span>
                }];
            });
        });
        const columns = [
            {
                title: '文件名',
                dataIndex: 'fileName',
                width: 300
            },
            {
                title: '上传者',
                dataIndex: 'senderName',
                width: 200
            },
            {
                title: '附注',
                dataIndex: 'content',
                // width: 200
            },
            {
                title: '上传时间',
                dataIndex: 'post_time',
                width: 180
            }
        ];
        return <Table columns={columns} pagination={{ defaultPageSize: 20 }} scroll={{ y: c_height }} dataSource={resArr} size="middle" />
    }

    // 获取节点树数据源
    fetchTreeData() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getKnowledgeTree'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                this.setState({
                    treeData: res.body.data
                });
            });
    }

    addToDocLib(fileName, mailId) {
        const { treeData } = this.state;
        const selectTreeData = getSelectTreeData(treeData);
        this.knTree = [];
        const that = this;
        confirm({
            title: '归并文档库',
            content: <Form className={'kn_form'}>
                <Form.Item label="目录" style={{ display: 'flex', width: '100%' }}>
                    <TreeSelect
                        defaultValue={[]}
                        showSearch
                        multiple
                        treeData={selectTreeData}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder="Please select"
                        treeDefaultExpandAll
                        onChange={v => this.knTree = v}
                    />
                </Form.Item>
            </Form>,
            icon: <span></span>,
            onOk() {
                let token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/knowlib/pipeToDoc'))
                    .set("token", token)
                    .send({
                        "fileName": fileName,
                        "treeId": JSON.stringify(that.knTree),
                        "mailId": mailId,
                    })
                    .end((err, res) => {
                        if (err) return;
                        message.success(res.body.msg);
                    });
            },
        });

        function getSelectTreeData(treeData) {
            return treeData.map(items => {
                if (items.subTreeArr && items.subTreeArr.length !== 0) {
                    return {
                        title: items.name,
                        value: items.id,
                        key: items.id,
                        children: getSelectTreeData(items.subTreeArr),
                    };
                } else {
                    return {
                        title: items.name,
                        value: items.id,
                        key: items.id,
                    };
                }
            });
        }
    }

    //表格点击
    subHandleTableClick(data, index) {
        const { state } = data;
        if (state == '关闭' || state == '已完成') {
            const createPdf = () => {
                const { affairId } = data;
                this.setState({
                    pdfAffairId: affairId
                }, () => {
                    this.setState({
                        pdfAffairId: null
                    });
                });
            }
            createPdf();
            return;
        }
        hashHistory.push({
            pathname: data.frontUrl,
            state: {
                affairId: data.affairId,
                fromBox: true
            }
        });
    }

    //被关联事务
    relativeAffair(c_height) {
        const { selectedId, affairData, popVisible } = this.state;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();

        //添加小事务
        const addSmallAffair = () => {
            let name = $('input[name=pop_name]').val();
            let cause = $('input[name=pop_cause]').val();
            let team = this.affairProp.team;
            let deadline = this.affairProp.deadline;
            if (!name || !cause || !deadline) {
                message.warning('输入不能为空');
                return;
            }
            if (team.length < 1) {
                message.warning('团队成员至少为一人');
                return;
            }
            let form_data = {
                name: name,
                team: team.join(),
                cause: cause,
                deadline: deadline,
                priority: '普通',
                readAuth: 1,
                state: '进行中',
                relatedAffairs: selectedId
            };
            let token = sessionStorage.getItem('token');
            request.post(common.baseUrl('/smallAffair/add'))
                .set("token", token)
                .send(form_data)
                .end((err, res) => {
                    if (err) return;
                    message.success(res.body.msg);
                    request.get(common.baseUrl('/getTargetAffairSupAndSub/' + selectedId))
                        .set("token", token)
                        .end((err, res) => {
                            if (err) return;
                            affairData.forEach((items, index) => {
                                if (items.uuid == selectedId) {
                                    affairData[index] = res.body.data;
                                }
                            });
                            this.setState({
                                affairData,
                                popVisible: false
                            });
                        });
                });
        }

        const formContent = () => {
            return <div className={'pop_form'} style={{ width: 500 }}>
                <label style={{ display: 'flex' }}>
                    <span style={{ width: '100px' }}>标题：</span>
                    <Input name={"pop_name"} style={{ flex: 1 }} />
                </label>
                <label style={{ display: 'flex', marginTop: 10 }}>
                    <span style={{ width: '100px' }}>工作团队：</span>
                    <Select
                        mode="multiple"
                        placeholder="请至少选择一人"
                        onChange={this.affairTeamChange}
                        style={{ flex: 1 }}
                    >
                        <Select.OptGroup label="研发部">
                            {
                                this.staffArr[0].map(items =>
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                        <Select.OptGroup label="客户关系部">
                            {
                                this.staffArr[1].map(items =>
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                        <Select.OptGroup label="生产部">
                            {
                                this.staffArr[2].map(items =>
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                        <Select.OptGroup label="管理部">
                            {
                                this.staffArr[3].map(items =>
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                    </Select>
                </label>
                <label style={{ display: 'flex', marginTop: 10 }}>
                    <span style={{ width: '100px' }}>事由：</span>
                    <Input name={"pop_cause"} style={{ flex: 1 }} />
                </label>
                <label style={{ display: 'flex', marginTop: 10 }}>
                    <span style={{ width: '100px' }}>最后期限：</span>
                    <DatePicker onChange={this.deadlineChange} />
                </label>
            </div>
        }

        if (selectedIdData.length == 0 || selectedIdData[0].subRelativeAffair.length == 0) {
            return <div>
                <Popconfirm icon={false} visible={popVisible} placement="bottomLeft" title={formContent()} onConfirm={addSmallAffair} onCancel={() => { this.setState({ popVisible: false }) }} okText="Yes" cancelText="No">
                    <Button onClick={() => { this.setState({ popVisible: !popVisible }) }} style={{ marginLeft: 8, marginBottom: 8 }}>新增小事务</Button>
                </Popconfirm>
                <h2 style={{ textAlign: 'center' }}>暂无下属事务</h2>
            </div>
        }
        let resArr = [];
        const user_id = sessionStorage.getItem('user_id');
        selectedIdData[0].subRelativeAffair.forEach((items, index) => {
            let team = items.team.split(',');
            if (items.secret == 0 || items.secret == 1 && team.indexOf(user_id) != -1) {
                resArr.push({
                    name: items.name,
                    state: items.state,
                    teamName: items.teamName,
                    affairId: items.uuid,
                    frontUrl: '/projectAffair'
                });
            }
        });
        const columns = [
            {
                title: '事务名称',
                dataIndex: 'name',
                width: 200
            },
            {
                title: '状态',
                dataIndex: 'state',
                width: 200
            },
            {
                title: '工作团队',
                dataIndex: 'teamName'
            }
        ];
        return <div>
            <Popconfirm icon={false} visible={popVisible} placement="bottomLeft" title={formContent()} onConfirm={addSmallAffair} onCancel={() => { this.setState({ popVisible: false }) }} okText="Yes" cancelText="No">
                <Button onClick={() => { this.setState({ popVisible: !popVisible }) }} style={{ marginLeft: 8, marginBottom: 8 }}>新增小事务</Button>
            </Popconfirm>
            <Table columns={columns} onRowClick={this.subHandleTableClick} pagination={false} scroll={{ y: c_height }} dataSource={resArr} size="middle" />
        </div>
    }

    //创建消息
    createMsg(c_height) {
        const that = this;

        //判断自己是否具备发言资格
        //2018-08-20提出需求，任何人都能发言
        const checkCanSpeak = () => {
            const { affairData, selectedId } = this.state;
            const user_id = sessionStorage.getItem('user_id');
            let groupArr = [];
            affairData.forEach((items, index) => {
                if (items.uuid == selectedId) {
                    try {
                        groupArr = items.team.split(',');
                    } catch (e) {

                    }
                }
            });
            if (groupArr.indexOf(user_id) == -1) {
                return false;
            } else {
                return true;
            }
        }

        //获取群成员
        //2018-08-20提出需求，能@任何人
        const getGroupMember = (n) => {
            const { affairData, selectedId } = this.state;
            const user_name = sessionStorage.getItem('user_name');
            let groupArr;
            affairData.forEach((items, index) => {
                if (items.uuid == selectedId) {
                    groupArr = items.teamName.split(',');
                }
            });
            let resArr = [];
            if (!groupArr) return resArr;
            const allStaffNameArr = [];
            this.staffArr.map(items => {
                items.map(it => allStaffNameArr.push(it.user_name));
            });
            const otherArr = [];
            Linq.from(allStaffNameArr).except(groupArr).forEach(i => {
                otherArr.push(i);
            });

            const _groupArr = [];
            groupArr.forEach((items, index) => {
                if (items != user_name) {
                    _groupArr.push(<Option key={items} value={items}>{items}</Option>);
                }
            });
            const _otherArr = [];
            otherArr.forEach((items, index) => {
                if (items != user_name) {
                    _otherArr.push(<Option key={items} value={items}>{items}</Option>);
                }
            });
            if (n == 0) {
                return _groupArr;
            } else {
                return _otherArr;
            }
        }

        //mail优先级变化
        const priorityChange = (v) => {
            this.setState({
                mailPriority: v
            });
        }

        //投票变化
        const votesChange = (v) => {
            this.setState({
                votes: v
            });
        }

        //@变化
        const atChange = (v) => {
            this.setState({
                at: v
            });
        }

        //上传图片
        const imgProps = () => {
            let token = sessionStorage.getItem('token');
            const props = {
                action: common.baseUrl('/notiClient/imgUpload'),
                defaultFileList: this.state.imgArr,
                name: 'file',
                headers: {
                    token: token
                },
                accept: 'image/*',
                multiple: false,
                onChange(res) {
                    that.imgUploading = true;
                    if (res.file.status == 'removed') {
                        that.imgUploading = false;
                    }
                    if (res.file.status == 'done') {
                        that.imgUploading = false;
                        let file_name = res.file.response.data[0];
                        let { imgArr, imgNameArr } = that.state;
                        imgArr.push(file_name);
                        imgNameArr.push(res.file.name);
                        that.setState({
                            imgArr,
                            imgNameArr
                        });
                    }
                },
                onRemove(res) {
                    const { imgArr, imgNameArr } = that.state;
                    imgArr.forEach((items, index) => {
                        if (items == res.response.data[0]) {
                            imgArr.splice(index, 1);
                        }
                    });
                    imgNameArr.forEach((items, index) => {
                        if (items == res.response.data[0]) {
                            imgNameArr.splice(index, 1);
                        }
                    });
                    that.setState({
                        imgArr,
                        imgNameArr
                    });
                }
            };
            return props;
        }

        //上传文件
        const fileProps = () => {
            let token = sessionStorage.getItem('token');
            const props = {
                action: common.baseUrl('/notiClient/fileUpload'),
                defaultFileList: this.state.fileArr,
                name: 'file',
                headers: {
                    token: token
                },
                multiple: false,
                beforeUpload(res) {
                    // if(/\s/.test(res.name)) {
                    //     message.error('文件名不允许有空格');
                    //     return false;
                    // }
                },
                onChange(res) {
                    that.fileUploading = true;
                    if (res.file.status == 'removed') {
                        that.fileUploading = false;
                    }
                    if (res.file.status == 'done') {
                        that.fileUploading = false;
                        let file_name = res.file.response.data[0];
                        let { fileArr, fileNameArr } = that.state;
                        fileArr.push(file_name);
                        fileNameArr.push(res.file.name);
                        that.setState({
                            fileArr,
                            fileNameArr
                        });
                    }
                },
                onRemove(res) {
                    const { fileArr, fileNameArr } = that.state;
                    fileArr.forEach((items, index) => {
                        if (items == res.response.data[0]) {
                            fileArr.splice(index, 1);
                        }
                    });
                    fileNameArr.forEach((items, index) => {
                        if (items == res.response.data[0]) {
                            fileNameArr.splice(index, 1);
                        }
                    });
                    that.setState({
                        fileArr,
                        fileNameArr
                    });
                }
            };
            return props;
        }

        //发布消息
        const handleSubmit = () => {
            //判断图片或文件是否上传完毕
            if (this.fileUploading || this.imgUploading) {
                message.warn('请等待上传完成！');
                return;
            }
            let { votes, at, mailPriority, affairData, selectedId, selectedMailList } = this.state;
            let content = $('textarea[name=content]').val();
            if (!content) {
                message.warn('内容不能为空');
                return;
            }
            if (votes[0] == null && at[0] == null) {
                message.warning('请至少选择一项操作');
                return;
            }

            /**start @员工名转换成id */
            at.forEach((items, index) => {
                if (/[\u4e00-\u9fa5]+/.test(items) != -1) {
                    this.staffArr.forEach((it, ind) => {
                        it.forEach((_it, _ind) => {
                            if (_it.user_name == items) {
                                at[index] = _it.user_id;
                            }
                        });
                    });
                }
            });
            /**end */

            //获取订阅者和title
            let subscriber, title;
            if (votes[0] == null) {
                subscriber = at.join();
                affairData.forEach((items, index) => {
                    if (items.uuid == selectedId) {
                        title = items.name;
                    }
                });
            } else {
                const user_id = sessionStorage.getItem('user_id');
                let _arr = [];
                affairData.forEach((items, index) => {
                    if (items.uuid == selectedId) {
                        _arr = items.team.split(',');
                        title = items.name;
                    }
                });
                _arr.forEach((items, index) => {
                    if (items == user_id) _arr.splice(index, 1);
                });
                if (at.length == 0) {
                    subscriber = _arr.join();
                } else {
                    //有@的情况，需要检查是否有团队外的@人员
                    at.forEach((items, index) => {
                        this.staffArr.forEach((it, ind) => {
                            it.forEach((_it, _ind) => {
                                if (items == _it.user_name || items == _it.user_id) {
                                    _arr.push(_it.user_id);
                                }
                            });
                        });
                    });
                    _arr = [...new Set(_arr)];
                    subscriber = _arr.join();
                }
            }
            //获取前端路由
            let href = window.location.href.split('#')[1].split('?')[0];
            //获取图片和文件
            let form_data = {
                class: this.affairType,
                priority: mailPriority,
                frontUrl: href,
                title: title,
                content: content,
                album: this.state.imgArr.join() ? this.state.imgArr.join() : null,
                albumName: this.state.imgNameArr.join() ? this.state.imgNameArr.join() : null,
                file: this.state.fileArr.join() ? this.state.fileArr.join() : null,
                fileName: this.state.fileNameArr.join() ? this.state.fileNameArr.join() : null,
                votes: votes.join() ? votes.join() : null,
                atSomeone: at.join() ? at.join() : null,
                subscriber: subscriber,
                isMeetingMsg: that.state.isMeetingMsg,
                meetingTime: that.state.meetingDate.format('YYYY-MM-DD') + ' ' + that.state.meetingHours.format('HH:mm:ss'),
                isDelay: that.state.isDelay,
                delayTime: that.state.delayDate.format('YYYY-MM-DD') + ' ' + that.state.delayHours.format('HH:mm:ss'),
                non_str: Number.parseInt(Math.random() * 10000),
                noti_client_affair_group_uuid: selectedId
            };
            if (this.btnGroup.isSending) return;
            this.btnGroup.isSending = true;
            let token = sessionStorage.getItem('token');
            request.post(common.baseUrl('/notiClient/add'))
                .set("token", token)
                .send(form_data)
                .end((err, res) => {
                    if (err) return;
                    if (res.body.code == 200) {
                        this.scrollHeight = 0;
                        this.scroll.pageStart = 1;
                        this.scroll.hasMore = true;
                        this.scroll.loading = false;
                        this.btnGroup.isSending = false;
                        this.fetchNotiMail(selectedId, () => {
                            $('.ant-tabs-tab').eq(1).trigger('click');
                        });
                        $('textarea[name=content]').val('');
                        message.success(res.body.msg);
                        this.setState({
                            votes: ['已阅'],
                            at: [],
                            imgArr: [],
                            imgNameArr: [],
                            fileArr: [],
                            fileNameArr: []
                        });
                        $('.ant-upload-list-item').remove();
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        const widthFit = () => {
            if (/edge/ig.test(window.navigator.userAgent)) {
                return '180px';
            } else {
                return 'fit-content';
            }
        }

        const isMeetingMsgChange = e => {
            that.setState({
                isMeetingMsg: e.target.value,
            });
        }

        const meetingTimeDateChange = v => {
            that.setState({
                meetingDate: v,
            });
        }

        const meetingTimeHoursChange = v => {
            that.setState({
                meetingHours: v,
            });
        }

        const isDelayChange = e => {
            that.setState({
                isDelay: e.target.value,
            });
        }

        const delayTimeDateChange = v => {
            that.setState({
                delayDate: v,
            });
        }

        const delayTimeHoursChange = v => {
            that.setState({
                delayHours: v,
            });
        }

        // if(!checkCanSpeak()) return;
        return <TabPane tab="发布消息" key="4">
            <div style={{ marginLeft: 8, marginRight: 8, textAlign: 'center', height: c_height, overflow: 'auto' }}>
                <label style={{ display: 'flex' }}>
                    <span style={{ width: 75 }}>正文：</span>
                    <textarea className="ant-input" rows={'6'} name={"content"} style={{ flex: 1 }}></textarea>
                    {/* <TextArea rows={'6'} name={"content"} style={{flex:1}} /> */}
                </label>
                <div style={{ display: 'flex', marginTop: 15, textAlign: 'left', width: widthFit() }}>
                    <span style={{ width: 75, paddingLeft: 12 }}>图片：</span>
                    <Upload {...imgProps()}>
                        <Button>
                            <Icon type="upload" />上传图片
                                </Button>
                    </Upload>
                </div>
                <div style={{ display: 'flex', marginTop: 15, textAlign: 'left', width: widthFit() }}>
                    <span style={{ width: 75, paddingLeft: 12 }}>文件：</span>
                    <Upload {...fileProps()}>
                        <Button>
                            <Icon type="upload" />上传文件
                                </Button>
                    </Upload>
                </div>
                {/* <label style={{display:'flex',marginTop: 15}}>
                            <span style={{width:65}}>优先级：</span>
                            <Select key={0} defaultValue={this.state.mailPriority} onChange={priorityChange}>
                                <Option value="紧急">紧急</Option>
                                <Option value="重要">重要</Option>
                                <Option value="普通">普通</Option>
                                <Option value="暂缓">暂缓</Option>
                            </Select>
                        </label> */}
                <label style={{ display: 'flex', marginTop: 15 }}>
                    <span style={{ width: 75 }}>选单：</span>
                    <Select
                        key={1}
                        mode="tags"
                        style={{ width: '100%' }}
                        placeholder="请输入..."
                        // defaultValue={this.state.votes}
                        value={this.state.votes}
                        onChange={votesChange}
                    >
                        <Option value={'已阅'}>{'已阅'}</Option>
                        <Option value={'同意'}>{'同意'}</Option>
                        <Option value={'不同意'}>{'不同意'}</Option>
                        <Option value={'是'}>{'是'}</Option>
                        <Option value={'否'}>{'否'}</Option>
                        <Option value={'弃权'}>{'弃权'}</Option>
                    </Select>
                </label>
                <label style={{ display: 'flex', marginTop: 15 }}>
                    <span style={{ width: 75 }}>@：</span>
                    <Select
                        key={2}
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="请输入..."
                        value={this.state.at}
                        onChange={atChange}
                    >
                        <Select.OptGroup label="团队成员">
                            {getGroupMember(0)}
                        </Select.OptGroup>
                        <Select.OptGroup label="其它">
                            {getGroupMember(1)}
                        </Select.OptGroup>
                        {/* {getGroupMember()} */}
                    </Select>
                </label>
                <label style={{ display: 'flex', marginTop: 15, width: widthFit() }}>
                    <span style={{ width: 75 }}>会议：</span>
                    <Radio.Group onChange={isMeetingMsgChange} value={that.state.isMeetingMsg}>
                        <Radio value={0}>否</Radio>
                        <Radio value={1}>是</Radio>
                    </Radio.Group>
                    {
                        that.state.isMeetingMsg === 1 && <div>
                            <DatePicker onChange={meetingTimeDateChange} allowClear={false} defaultValue={that.state.meetingDate} />
                            <span style={{ marginLeft: 3, marginRight: 3 }}></span>
                            <TimePicker onChange={meetingTimeHoursChange} allowClear={false} defaultValue={that.state.meetingHours} />
                        </div>
                    }
                </label>
                <label style={{ display: 'flex', marginTop: 15, width: widthFit() }}>
                    <span style={{ width: 75 }}>定时发送：</span>
                    <Radio.Group onChange={isDelayChange} value={that.state.isDelay}>
                        <Radio value={0}>否</Radio>
                        <Radio value={1}>是</Radio>
                    </Radio.Group>
                    {
                        that.state.isDelay === 1 && <div>
                            <DatePicker onChange={delayTimeDateChange} allowClear={false} defaultValue={that.state.delayDate} />
                            <span style={{ marginLeft: 3, marginRight: 3 }}></span>
                            <TimePicker onChange={delayTimeHoursChange} allowClear={false} defaultValue={that.state.delayHours} />
                        </div>
                    }
                </label>
                <Button style={{ marginTop: 20 }} type={'primary'} onClick={handleSubmit}>提交</Button>
            </div>
        </TabPane>
    }

    //移动位置
    movePosition(items) {
        const { selectedId, affairData } = this.state;
        const toTop = (items) => {
            let index;
            affairData.forEach((it, ind) => {
                if (it.uuid == selectedId) index = ind;
            });
            const firstOrder = affairData[0].viewOrder;
            const presentOrder = affairData[index].viewOrder;
            const needUpdateArr = Linq.from(affairData).where(x => {
                return x.viewOrder < presentOrder;
            }).toArray();
            const notNeedUpdateArr = Linq.from(affairData).where(x => {
                return x.viewOrder > presentOrder;
            }).toArray();
            needUpdateArr.forEach((items, index) => {
                if (index != needUpdateArr.length - 1) {
                    needUpdateArr[index].viewOrder = needUpdateArr[index + 1].viewOrder;
                } else {
                    needUpdateArr[index].viewOrder = presentOrder;
                }
            });
            items.viewOrder = firstOrder;
            let resArr = [items, ...needUpdateArr, ...notNeedUpdateArr];
            syncToSever(affairData);
            this.setState({
                affairData
            });
        }
        const betweenMove = (type, items) => {
            let index;
            affairData.forEach((it, ind) => {
                if (it.uuid == selectedId) index = ind;
            });
            let presentOrder = affairData[index].viewOrder;
            if (type == 'down') {
                affairData[index].viewOrder = affairData[index + 1].viewOrder;
                affairData[index + 1].viewOrder = presentOrder;
            } else {
                affairData[index].viewOrder = affairData[index - 1].viewOrder;
                affairData[index - 1].viewOrder = presentOrder;
            }
            syncToSever(affairData);
            this.setState({
                affairData
            });
        }
        const syncToSever = (affairData, cb) => {
            const viewOrderArr = affairData.map(items => {
                return {
                    uuid: items.uuid,
                    viewOrder: items.viewOrder
                }
            });
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/affair/changeViewOrder'))
                .set("token", token)
                .send({
                    viewOrderArr: JSON.stringify(viewOrderArr)
                })
                .end((err, res) => {
                    if (err) return;
                    if (res.body.code != 200) {
                        message.error(res.body.msg);
                        this.fetchAffair();
                    } else {
                        message.success(res.body.msg);
                    }
                });
        }
        let resArr = [
            <span onClick={() => toTop(items)}>
                <Icon type={'to-top'} style={{ marginRight: 4 }} />
                {'置顶'}
            </span>,
            <span onClick={() => betweenMove('up', items)}>
                <Icon type={'arrow-up'} style={{ marginRight: 4 }} />
                {'上移'}
            </span>,
            <span onClick={() => betweenMove('down', items)}>
                <Icon type={'arrow-down'} style={{ marginRight: 4 }} />
                {'下移'}
            </span>
        ];
        const checkPosition = (items) => {
            const len = affairData.length;
            if (len > 1) {
                let index;
                affairData.forEach((it, ind) => {
                    if (it.uuid == selectedId) index = ind;
                });
                if (index == 0) {
                    resArr.splice(0, 2);
                } else if (index == len - 1) {
                    resArr.pop();
                }
                return resArr;
            }
        }
        if (items.uuid == selectedId) {
            const user_id = sessionStorage.getItem('user_id');
            const authOrder = common.removeAffairOrder();
            if (authOrder.indexOf(user_id) != -1) {
                return checkPosition();
            }
        }
    }

    //初始化
    componentWillReceiveProps(props) {
        this.fetchAffair();
        this.fetchAllStaff();
        this.fetchTreeData();
        document.onkeyup = (e) => {
            if (e.keyCode == 70) {
                this.setState({
                    searchVisible: 'block'
                });
            }
        }
    }

    //状态更新后
    componentDidUpdate() {
        let { selectedId, affairData, selectedMailList } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        $('.l_list').css('background', '#fff');
        $('#_' + selectedId).css({
            background: '#e6f7ff'
        });
        $('.tabsWrap').width(600);
    }

    autoScrollToTarget() {
        try {
            let scrollHeight = document.getElementsByClassName('chats')[0].scrollHeight - this.scrollHeight;
            document.getElementsByClassName('chats')[0].scrollTop = scrollHeight;
            this.scrollHeight = document.getElementsByClassName('chats')[0].scrollHeight;
        } catch (e) {

        }
        if (this.locationId) {
            if ($('.chat[data-uuid=' + this.locationId + ']').length == 0) {
                document.getElementsByClassName('chats')[0].scrollTop = 0;
            } else {
                let offsetTop = $('.chat[data-uuid=' + this.locationId + ']').offset().top;
                if (offsetTop < 0) {
                    document.getElementsByClassName('chats')[0].scrollTop += offsetTop - 130;
                }
                this.locationId = null;
            }
        }
    }

    attentionAffair(item) {
        let markColor = '#f8cd2b', normalColor = '#d1d1d1';
        const user_id = sessionStorage.getItem('user_id');
        let color = normalColor;
        let attentionStaffArr;
        try {
            attentionStaffArr = item.attentionStaff.split(',');
        } catch (e) {
            attentionStaffArr = [];
        }
        if (attentionStaffArr.indexOf(user_id) != -1) color = markColor;
        const subAttention = (uuid) => {
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/affair/attentionAffair'))
                .set("token", token)
                .send({
                    uuid: uuid
                })
                .end((err, res) => {
                    if (err) return;
                    message.success(res.body.msg);
                    request.get(common.baseUrl('/getTargetAffair/' + uuid))
                        .set("token", token)
                        .end((err, res) => {
                            if (err) return;
                            const { affairData } = this.state;
                            affairData.forEach((items, index) => {
                                if (items.uuid == uuid) {
                                    //保留原来的关联事务和被关联事务
                                    const { subRelativeAffair, supRelativeAffair } = affairData[index];
                                    res.body.data.subRelativeAffair = subRelativeAffair;
                                    res.body.data.supRelativeAffair = supRelativeAffair;
                                    affairData[index] = res.body.data;
                                }
                            });
                            this.setState({
                                affairData
                            });
                        });
                });
        }
        return <div onClick={() => subAttention(item.uuid)} style={{ display: 'inline', marginRight: 5, color: color }}>
            <Icon type="star" />
        </div>
    }

    search(keywords) {
        const { selectedId } = this.state;
        this.scroll.keywords = keywords;
        this.scroll.pageStart = 1;
        this.scroll.hasMore = true;
        this.scrollHeight = 0;
        this.setState({
            selectedMailList: []
        }, () => {
            this.fetchNotiMail(selectedId);
            setTimeout(() => {
                this.setState({
                    searchVisible: 'none'
                });
            }, 1000);
        });
    }

    render() {
        let b_height = window.innerHeight - 105;
        let c_height = window.innerHeight - 170;
        let { affairData, selectedId, searchVisible, pdfAffairId, imgSrc, albumBorwerArr } = this.state;
        const s = (a, b) => {
            return a.viewOrder - b.viewOrder;
        }
        affairData = affairData.sort(s);
        return (
            <div>
                <div className="demo-infinite-container" style={{ paddingRight: 10, height: b_height, display: 'flex' }}>
                    <div className={'leftBar'} style={{ width: 250 }}>
                        <div style={{ borderTop: "1px solid #e8e8e8", width: 250, height: b_height, overflow: 'auto' }}>
                            <List
                                dataSource={affairData}
                                itemLayout={"vertical"}
                                renderItem={item => (
                                    <List.Item key={item.uuid}
                                        className={'l_list'}
                                        id={'_' + item.uuid}
                                        style={{ paddingLeft: 10, cursor: 'pointer', width: '100%', position: 'relative' }}
                                        onClick={() => this.affairClick(item)}
                                        actions={this.movePosition(item)}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                    {this.attentionAffair(item)}
                                                    {item.name}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            >
                            </List>
                        </div>
                    </div>
                    <div className={'tabsWrap'} style={{ flex: 3, border: '1px solid #eee' }}>
                        <Tabs defaultActiveKey="2">
                            <TabPane tab="摘要" key="1">
                                <div style={{ height: c_height, paddingLeft: 10, overflow: 'auto' }}>
                                    {this.summaryTemp()}
                                </div>
                            </TabPane>
                            <TabPane tab="消息" key="2">
                                <div style={{ height: c_height }}>
                                    <div style={{ position: 'absolute', right: 0, top: 6, zIndex: 10, display: searchVisible }}>
                                        <Search
                                            placeholder="消息内容关键字"
                                            onSearch={value => this.search(value)}
                                            style={{ width: 300 }}
                                            enterButton
                                        />
                                    </div>
                                    {this.mailTemp()}
                                </div>
                            </TabPane>
                            <TabPane tab="资源" key="3">
                                <div style={{ height: c_height, overflow: 'auto' }}>
                                    {this.pullResourse(c_height)}
                                </div>
                            </TabPane>
                            {this.createMsg(c_height)}
                            <TabPane tab="下属事务" key="5">
                                <div style={{ height: c_height, overflow: 'auto' }}>
                                    {this.relativeAffair(c_height)}
                                </div>
                            </TabPane>
                        </Tabs>
                    </div>
                </div>
                <ModalTemp
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    title={this.state.title}
                    ModalText={this.state.modalText}
                    visible={this.state.visible} />
                <AffairPdf affairId={pdfAffairId}></AffairPdf>
                <PhotoLooker albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={this.canRenderPhoto}></PhotoLooker>
            </div>
        );
    }
}

export default AffairsList;