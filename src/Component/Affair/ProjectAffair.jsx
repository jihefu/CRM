import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { TimePicker, List, message, Spin,Input,Form,Button,Divider, Icon,Popover,Radio,Select,Popconfirm,Tabs,Upload,Table,Tag,DatePicker,Slider,Progress,Modal,InputNumber  } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import InfiniteScroll from 'react-infinite-scroller';
import ModalTemp from '../common/Modal.jsx';
import common from '../../public/js/common.js';
import Linq from 'linq';
import AffairsList from './AffairsList.jsx';
import renderTemp from './AffairTemp.jsx';
import AffairPdf from './AffairPdf.jsx';
import PhotoLooker from '../common/PhotoLooker.jsx';
moment.locale('zh-cn');
const { TextArea } = Input;
const { confirm } = Modal;
const RadioGroup = Radio.Group;
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const Search = Input.Search;

class ProjectAffair extends AffairsList {
    constructor(props) {
        super(props);
        this.affairType = 'projectAndSmallAffair';
        this.dialogType = 0;
        this.memberDegree;
        this.allAffairData = [];
        this.rewardChange = this.rewardChange.bind(this);
        this.deadlineChange = this.deadlineChange.bind(this);
        this.sliderChange = this.sliderChange.bind(this);
        this.memberEditAffair = this.memberEditAffair.bind(this);
        this.affairEdit = this.affairEdit.bind(this);
        this.progressEdit = this.progressEdit.bind(this);
        this.memberSliderChange = this.memberSliderChange.bind(this);
        this.supHandleTableClick = this.supHandleTableClick.bind(this);
        this.fetchAllAffair = this.fetchAllAffair.bind(this);
        this.relatedAffairsChange = this.relatedAffairsChange.bind(this);
        this.changeAffairSelf = this.changeAffairSelf.bind(this);
        this.renderProgress = this.renderProgress.bind(this);
        this.affairProp = {
            priority: '',
            state: '',
            secret: '',
            team: '',
            deadline: '',
            completionDegree: '',
            reward: 0
        }
        this.state.arrivalDateArr = [];
    }

    //@override
    //摘要模板
    summaryTemp(){
        const { selectedId,affairData } = this.state;
        const staffData = this.staffData;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        if(selectedIdData.length==0) return;
        const user_id = sessionStorage.getItem('user_id');
        const token = sessionStorage.getItem('token');
        //编辑按钮
        const showEdit = () => {
            let editable = false;
            let teamDirector;
            try{
                teamDirector = selectedIdData[0].team.split(',')[0];
            }catch(e){}
            let user_id = sessionStorage.getItem('user_id');
            if(teamDirector==user_id||selectedIdData[0].insert_person==user_id) editable = true;
            if(editable){
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

        const temp = <div>
                        { showEdit() }
                        { renderTemp('summary',{...selectedIdData[0], that: this, affairData,}, this.isDirector()) }
                        { this.teamTemp(selectedIdData[0]) }
                        {/* { renderTemp('progress',{
                            selectedIdDataArr: selectedIdData[0],
                            affairData: affairData,
                            selectedIdData: selectedIdData,
                            staffData: staffData,
                            that: this
                        }) } */}
                    </div>;
        return temp;
    }

    teamTemp = () => {
        const that = this;
        const { selectedId,affairData } = this.state;
        const staffData = this.staffData;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        if(selectedIdData.length==0) return;
        const data = selectedIdData[0];
        const teamArr = data.team.split(',');
        const columns = [
            {
                title: '成员',
                key: 'member',
                dataIndex: 'member',
                render: (text, record) => {
                    let it;
                    staffData.forEach((items, index) => {
                        if (record.member == items.user_id) {
                            it = items.user_name;
                        }
                    });
                    return it;
                }
            },
            {
                title: '分工',
                key: 'division',
                dataIndex: 'division',
                render: (text, record) => {
                    return <div style={{minWidth: 100, height: 20, cursor: 'pointer'}} onClick={() => {
                        if (!this.isDirector()) return;
                        confirm({
                            title: '分工',
                            content: <Input name={'division'} defaultValue={record.division} />,
                            icon: <span></span>,
                            onOk() {
                                const division = $('input[name=division]').val();
                                that.progressEdit({
                                    id:  record.id,
                                    division,
                                });
                            },
                            onCancel() {},
                        });
                    }}>{ record.division }</div>;
                }
            },
            {
                title: '进度',
                key: 'degree',
                dataIndex: 'degree',
            },
            {
                title: '贡献度',
                key: 'contribution',
                dataIndex: 'contribution',
                render: (text, record) => {
                    return <div style={{cursor: 'pointer'}} onClick={() => {
                        if (!this.isDirector()) return;
                        confirm({
                            title: '贡献度',
                            content: <InputNumber name={'contribution'} min={1} max={5} defaultValue={record.contribution} />,
                            icon: <span></span>,
                            onOk() {
                                const contribution = $('input[name=contribution]').val();
                                that.progressEdit({
                                    id:  record.id,
                                    contribution,
                                });
                            },
                            onCancel() {},
                        });
                    }}>{ record.contribution }</div>;
                }
            },
            {
                title: '操作',
                key: 'operation',
                dataIndex: 'operation',
                render: (text, record) => {
                    return <span>
                        <a href="javascript:void(0)" onClick={e => {
                            const member = record.member;
                            let newTargetItem;
                            let newArr = [];
                            teamArr.forEach((items, index) => {
                                if (items.member == member) {
                                    newTargetItem = items;
                                } else {
                                    newArr.push(items);
                                }
                            });
                            newArr.unshift(newTargetItem);
                            newArr = newArr.map(items => items.member);
                            changeProjectTeamMember(newArr, selectedId);
                        }}>置顶</a>
                        <a style={{marginLeft: 6}} href="javascript:void(0)" onClick={e => {
                            if (teamArr.length === 1) return message.error('团队不能少于一人');
                            const member = record.member;
                            let newArr = teamArr.map(items => {
                                if (items.member != member) {
                                    return items.member;
                                }
                            });
                            newArr = newArr.filter(items => items);
                            changeProjectTeamMember(newArr, selectedId)
                        }}>移除</a>
                    </span>
                }
            },
        ];
        if (!this.isDirector()) columns.pop();
        if (data.ProjectAffairs.length !== 0) {
            // 立项事务
            const memberArr = data.ProjectAffairs[0].ProjectAffairProgresses.map(items => {
                return {
                    id: items.id,
                    member: items.member,
                    division: items.division,
                    degree: items.degree,
                    contribution: items.contribution,
                };
            });
            const memberHashMapper = {};
            memberArr.forEach((items, index) => {
                memberHashMapper[items.member] = items;
            });
            teamArr.forEach((items, index) => {
                teamArr[index] = memberHashMapper[items];
            });
            return <div>
                    { this.isDirector() && <Button style={{marginBottom: 6}} onClick={() => {
                        this.newAddMember = null;
                        const that = this;
                        confirm({
                            title: '新增成员',
                            content: <Select style={{ width: 120 }} onSelect={v => this.newAddMember = v}>
                                        { this.staffData.map(items => {
                                            if (memberHashMapper[items.user_id]) {
                                                return <Option key={items.user_id} value={items.user_id} disabled>{items.user_name}</Option>
                                            } else {
                                                return <Option key={items.user_id} value={items.user_id}>{items.user_name}</Option>
                                            }
                                        }) }
                                    </Select>,
                            icon: <span></span>,
                            onOk() {
                                let newArr = teamArr.map(items => items.member);
                                newArr.push(that.newAddMember);
                                newArr = newArr.filter(items => items);
                                changeProjectTeamMember(newArr, selectedId);
                            },
                            onCancel() {},
                        });
                    }}>新增成员</Button> }
                    <Table pagination={false} columns={columns} dataSource={teamArr} />
                </div>
        } else {
            // 小事务
            const colArr = [columns.shift()];
            if (this.isDirector()) colArr.push({
                title: '操作',
                key: 'operation',
                dataIndex: 'operation',
                render: (text, record) => {
                    return <span>
                        <a href="javascript:void(0)" onClick={e => {
                            const member = record.member;
                            let newTargetItem;
                            let newArr = [];
                            teamArr.forEach((items, index) => {
                                if (items.member == member) {
                                    newTargetItem = items;
                                } else {
                                    newArr.push(items);
                                }
                            });
                            newArr.unshift(newTargetItem);
                            newArr = newArr.map(items => items.member);
                            changeSmallTeamMember(newArr, selectedId);
                        }}>置顶</a>
                        <a style={{marginLeft: 6}} href="javascript:void(0)" onClick={e => {
                            if (teamArr.length === 1) return message.error('团队不能少于一人');
                            const member = record.member;
                            let newArr = teamArr.map(items => {
                                if (items.member != member) {
                                    return items.member;
                                }
                            });
                            newArr = newArr.filter(items => items);
                            changeSmallTeamMember(newArr, selectedId)
                        }}>移除</a>
                    </span>
                }
            });
            teamArr.forEach((items, index) => {
                teamArr[index] = {
                    member: items,
                };
            });
            return <div>
                    { this.isDirector() && <Button style={{marginBottom: 6}} onClick={() => {
                        this.newAddMember = null;
                        const that = this;
                        confirm({
                            title: '新增成员',
                            content: <Select style={{ width: 120 }} onSelect={v => this.newAddMember = v}>
                                        { this.staffData.map(items => {
                                            // if (memberHashMapper[items.user_id]) {
                                            //     return <Option key={items.user_id} value={items.user_id} disabled>{items.user_name}</Option>
                                            // } else {
                                                return <Option key={items.user_id} value={items.user_id}>{items.user_name}</Option>
                                            // }
                                        }) }
                                    </Select>,
                            icon: <span></span>,
                            onOk() {
                                let newArr = teamArr.map(items => items.member);
                                newArr.push(that.newAddMember);
                                newArr = [...new Set(newArr)];
                                newArr = newArr.filter(items => items);
                                changeSmallTeamMember(newArr, selectedId);
                            },
                            onCancel() {},
                        });
                    }} >新增成员</Button> }
                    <Table pagination={false} columns={colArr} dataSource={teamArr} />
                </div>
        }

        // 改变立项事务成员
        function changeProjectTeamMember(newArr, selectedId) {
            request.put(common.baseUrl('/affair/changeProjectTeamMember'))
            .set("token", sessionStorage.getItem('token'))
            .send({
                form_data: JSON.stringify({
                    team: newArr.join(),
                    uuid: selectedId,
                })
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                    .set("token", sessionStorage.getItem('token'))
                    .end((err, res) => {
                        if (err) return;
                        affairData.forEach((items,index) => {
                            if(items.uuid==selectedId){
                                affairData[index] = res.body.data;
                            }
                        });
                        that.setState({
                            affairData
                        });
                    });
            });
        }

        // 改变小事务成员
        function changeSmallTeamMember(newArr, selectedId) {
            request.put(common.baseUrl('/affair/update'))
                .set("token", sessionStorage.getItem('token'))
                .send({
                    form_data: JSON.stringify({
                        team: newArr.join(),
                        uuid: selectedId,
                    })
                })
                .end((err, res) => {
                    if (err) return;
                    message.success(res.body.msg);
                    request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                        .set("token", sessionStorage.getItem('token'))
                        .end((err, res) => {
                            if (err) return;
                            affairData.forEach((items,index) => {
                                if(items.uuid==selectedId){
                                    affairData[index] = res.body.data;
                                }
                            });
                            that.setState({
                                affairData
                            });
                        });
                });
        }
    }

    //@override
    //消息模板
    mailTemp(){
        const { selectedMailList,selectedId,affairData } = this.state;
        if(selectedMailList.length==0) return;
        //消息对齐方向
        const checkDirection = (items) => {
            const user_id = sessionStorage.getItem('user_id');
            const sender = items.sender;
            if(user_id!=sender){
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-rightTop',
                    flexDirection: 'row'
                };
            }else{
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
                content = content.replace(/\n/g,'</br>');
                content = content.replace(/\s/g,'&nbsp;');
                return content;
            }

            const recall = (items) => {
                const { sender } = items;
                const user_id = sessionStorage.getItem('user_id');
                if(sender!=user_id) return;
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
                            request.get(common.baseUrl('/notiMail/'+mailId))
                                .set("token", token)
                                .end((err, res) => {
                                    selectedMailList.forEach((items,index) => {
                                        if(items.mailId==res.body.data.mailId&&res.body.data.isdel==1){
                                            selectedMailList.splice(index,1);
                                        }
                                    });
                                    this.setState({
                                        selectedMailList
                                    });
                                });
                        });
                }} okText="Yes" cancelText="No">
                    <Icon title={"撤回"} style={{cursor: 'pointer',position: 'absolute',right: 84}} type="delete" />
                </Popconfirm>
            }

            const renderMeetingMsg = () => {
                if (items.isMeetingMsg) {
                    return '<p>【会议通知】'+moment(items.meetingTime).format('YYYY-MM-DD HH:mm:ss')+'</p>';
                }
                return '';
            }

            const selectedAffairData = Linq.from(affairData).where(x => {
                return x.uuid == selectedId;
            }).toArray();
            if (selectedAffairData.length === 0) return;
            if(items.title!=selectedAffairData[0].name){
                return <div title={'点击跳转到指定事务'} style={{cursor: 'pointer'}} onClick={() => locationHref(items)} dangerouslySetInnerHTML={{__html: renderMeetingMsg() + trans('【'+items.title+'】'+items.content)}}></div>;
            }else{
                return <div className={'actionWrap'} data-mailId={items.mailId}>
                            <div dangerouslySetInnerHTML={{__html: renderMeetingMsg() + trans(items.content)}}></div>
                            <div className={'actionBar'} style={{textAlign: 'right',fontSize: 17,display: 'none'}}>
                                {recall(items)}
                                <Icon onClick={(e) => {
                                    const sender = items.sender;
                                    this.search();
                                    let eyeTitle;
                                    if(this.state.eyeTitle=='只看他'){
                                        eyeTitle = '查看全部';
                                        this.scroll.filter.sender = sender;
                                    }else{
                                        eyeTitle = '只看他';
                                        delete this.scroll.filter.sender;
                                    }
                                    this.setState({
                                        eyeTitle: eyeTitle
                                    });
                                }} title={this.state.eyeTitle} style={{cursor: 'pointer',position: 'absolute',right: 59}} type="eye" />
                                <Icon onClick={(e) => {
                                    $(e.target).parents('.actionBar').find('.addReply').show();
                                    $(e.target).parents('.actionBar').find('.msgExport').hide();
                                    let prevHeight = $(e.target).parents('.actionBar').prev().height()+45;
                                    $(e.target).parents('.actionBar').find('i').css('top',prevHeight);
                                }} title={"添加回复"} style={{cursor: 'pointer',position: 'absolute',right: 36}} type="edit" />
                                <Icon onClick={(e) => {
                                    $(e.target).parents('.actionBar').find('.msgExport').show();
                                    $(e.target).parents('.actionBar').find('.addReply').hide();
                                    let prevHeight = $(e.target).parents('.actionBar').prev().height()+45;
                                    $(e.target).parents('.actionBar').find('i').css('top',prevHeight);
                                }} title={"转发"} style={{cursor: 'pointer',marginLeft: 8,position: 'absolute',right: 11}} type="export" />
                                <div style={{display: 'none',marginTop: 25}} className={"addReply"}>
                                    {/* <TextArea rows={3}></TextArea> */}
                                    <textarea className="ant-input" rows={3}></textarea>
                                    <Button style={{fontSize: 12,marginTop: 5}} size={'small'} type={'primary'} 
                                        onClick={(e) => this.addReply({
                                            params: items,
                                            atReply: $(e.target).parent().parent().find('textarea').val()
                                        })}
                                    >{'回复'}</Button>
                                </div>
                                <div style={{display: 'none',marginTop: 25}} className={"msgExport"}>
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
                                    <Button style={{fontSize: 12,marginTop: 5}} size={'small'} type={'primary'} 
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
            const selectedAffairData = Linq.from(affairData).where(x => {
                return x.uuid == selectedId;
            }).toArray();
            if (selectedAffairData.length === 0) return;
            if(items.title!=selectedAffairData[0].name) return;

            let albumArr = [],albumNameArr = [],fileArr = [],fileNameArr = [];
            if(items.album){
                albumArr = items.album.split(',');
                albumNameArr = items.albumName.split(',');
            }
            if(items.file){
                fileArr = items.file.split(',');
                fileNameArr = items.fileName.split(',');
            }
            return  <div>
                        <div style={{padding: 2}}>
                            {
                                albumArr.map((items,index) => 
                                    <img onClick={() => {
                                        this.canRenderPhoto = true;
                                        this.setState({
                                            imgSrc: common.staticBaseUrl('/img/notiClient/'+items),
                                            albumBorwerArr: albumArr
                                        },() => {
                                            this.canRenderPhoto = false;
                                        })
                                    }} key={items} title={albumNameArr[index]} style={{marginLeft: 13,cursor: 'pointer'}} src={common.staticBaseUrl('/img/notiClient/small_'+items)} />
                                )
                            }
                        </div>
                        <div style={{padding: 2}}>
                            {
                                fileArr.map((items,index) => 
                                    <p key={items} style={{marginBottom: 0}}>
                                        <a style={{marginLeft: 13}} title={fileNameArr[index]} target={'_blank'} href={common.staticBaseUrl('/notiClient/'+items)}>
                                            {Number(index+1)+'. '+fileNameArr[index]}
                                        </a>
                                    </p>
                                )
                            }
                        </div>
                    </div>;
        }

        //回复模板
        const actionshow = (it) => {
            const selectedAffairData = Linq.from(affairData).where(x => {
                return x.uuid == selectedId;
            }).toArray();
            if (selectedAffairData.length === 0) return;
            if(it.title!=selectedAffairData[0].name) return;
            const user_id = sessionStorage.getItem('user_id');

            //自己发的模板
            const tempSelfPublish = (it) => {
                const trans = (content) => {
                    try{
                        content = content.replace(/\n/g,'</br>');
                        content = content.replace(/\s/g,'&nbsp;');
                    }catch(e){

                    }
                    return content;
                }
                let _contentArr;
                try{
                    _contentArr = it.votes.split(',');
                }catch(e){
                    _contentArr = [];
                }
                _contentArr.forEach((_it,_ind) => {
                    _contentArr[_ind] = {};
                    _contentArr[_ind][_it] = [];
                });
                _contentArr.push({
                    '未处理': []
                });
                it.NotiClientSubs.map((_items,_index) => {
                    _contentArr.forEach((_it,_ind) => {
                        for(let _key in _it){
                            if(_items.vote==_key){
                                _contentArr[_ind][_key].push(_items.receiverName);
                                // _contentArr[_ind][_key].push(_items.receiver);
                                break;
                            }else if(!_items.vote&&_ind==_contentArr.length-1&&_items.replied==0){
                                // _contentArr[_contentArr.length-1]['未处理'].push(_items.receiver);
                                // _contentArr[_contentArr.length-1]['未投票'].push(_items.receiverName);
                            }
                        }
                    });
                    if(_items.replied==0){
                        _contentArr[_contentArr.length-1]['未处理'].push(_items.receiverName);
                        // _contentArr[_contentArr.length-1]['未处理'].push(_items.receiver);
                    }
                });
                const inRender = (items) => {
                    for(let key in items){
                        return  <div key={key}>
                                    <span>{key}（{items[key].length}）：</span>
                                    <span>{items[key].join()}</span>
                                </div>
                    }
                }
                const orderReply = () => {
                    let resArr = [];
                    it.NotiClientSubs.map((_items,_index) => {
                        if(_items.atMe){
                            resArr.push(_items);
                        }
                    });
                    const s = (a,b) => {
                        return Date.parse(a.replyTime) - Date.parse(b.replyTime);
                    }
                    resArr = resArr.sort(s);
                    return resArr.map(items => 
                        <p key={items.id} style={{marginBottom: 0}}>
                            <span>{items.receiverName}：</span>
                            {/* <span>{items.receiver}：</span> */}
                            {/* <span>{items.atReply}</span> */}
                            <span dangerouslySetInnerHTML={{__html: trans(items.atReply)}}></span>
                        </p>
                    );
                }
                /*************清除已阅********************/
                let key1,key2,v1,v2;
                _contentArr.forEach((items,index) => {
                    for(let key in items){
                        if(index==0){
                            key1 = key;
                        }else if(index==1){
                            key2 = key;
                            v2 = items[key];
                        }
                    }
                });
                if(_contentArr.length==2&&key1=='已阅'&&key2=='未处理'&&v2.length==0){
                    _contentArr = [];
                }
                /****************************************/

                _contentArr.forEach((items,index) => {
                    for(let key in items){
                        if(key=='未处理'&&items[key].length==0) {
                            _contentArr.splice(index,1);
                        }
                    }
                });

                /*****************返回结果***********************/
                const orderReplyArr = orderReply();
                if(orderReplyArr.length!=0||_contentArr.length!=0){
                    return  <div style={{padding: '12px 16px',borderTop: '1px solid #eee'}}>
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
                return it.NotiClientSubs.map((_items,_index) => {
                    if(user_id==_items.receiver){
                        mark = true;
                        if(_items.replied==1){
                            if(hasDoneArr.indexOf(_items.receiver)==-1){
                                hasDoneArr.push(_items.receiver);
                                //回复完毕之后，看到的内容跟发送人一致
                                // return tempSelfPublish(it);
                            }
                            // if(_items.atMe==1){
                            //     return <div key={_items.id} style={{padding: '12px 16px',borderTop: '1px solid #eee'}}>
                            //                 <span>{_items.atReply}</span>
                            //             </div>
                            // }else{
                            //     //判断是否是“已阅”
                            //     if(_items.vote!='已阅'){
                            //         return <div key={_items.id} style={{padding: '12px 16px',borderTop: '1px solid #eee'}}><span>{_items.vote}</span></div>
                            //     }
                            // }
                        }else{
                            let _arr;
                            try{
                                _arr = it.votes.split(',');
                            }catch(e){
                                _arr = [];
                            }
                            const atMeTemp = (_items) => {
                                if(_items.atMe==0) return;
                                const checkHasDone = () => {
                                    let hasDone = false;
                                    if(_items.atReply) hasDone = true;
                                    if(hasDone){
                                        return  <div style={{marginBottom: 5}}>
                                                    {_items.atReply}
                                                </div>
                                    }else{
                                        return <div style={{textAlign: 'right',marginTop: 5}} key={_items.id}>
                                                    {/* <TextArea rows={3}></TextArea> */}
                                                    <textarea className="ant-input" rows={3}></textarea>
                                                    <Button style={{fontSize: 12,marginTop: 5}} size={'small'} type={'primary'} 
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
                                if(_arr.length==0) return;
                                const checkHasDone = () => {
                                    let hasDone = false;
                                    if(_items.vote) hasDone = true;
                                    if(hasDone){
                                        return  <div style={{marginBottom: 5}}>
                                                    {_items.vote}
                                                </div>
                                    }else{
                                        return <div style={{marginBottom: 5}}>
                                                    <RadioGroup defaultValue={_arr[0]}>
                                                        {
                                                            _arr.map(items => 
                                                                <Radio key={items} value={items}>{items}</Radio>
                                                            )
                                                        }
                                                    </RadioGroup>
                                                    <Button type={'primary'} style={{marginLeft: 25,fontSize: 12}} size={'small'} onClick={(e) => {
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
                            return  <div key={_items.id} style={{padding: '12px 16px',borderTop: '1px solid #eee'}}>
                                        {radioTemp(_items)}
                                        {atMeTemp(_items)}
                                    </div>
                        }
                    }else if(user_id!=_items.receiver&&_index==it.NotiClientSubs.length-1){
                        //路人看到的回执信息跟发件人一样
                        // if(!mark) return tempSelfPublish(it);
                    }
                });
            }

            if(it.sender==user_id){ //自己发的
                return tempSelfPublish(it);
            }else{
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
            let { selectedMailList,selectedId } = this.state;
            if(this.scroll.loading||!this.scroll.hasMore) return;
            this.scroll.pageStart++;
            this.scroll.loading = true;
            this.fetchNotiMailByScroll(selectedId,data => {
                if(data[0]==null){
                    this.scroll.loading = false;
                    this.scroll.hasMore = false;
                    return;
                }
                // this.selectedMailId = data[data.length-1].mailId;
                selectedMailList = [...data,...selectedMailList];
                this.scroll.loading = false;
                this.scroll.hasMore = true;
                this.setState({
                    selectedMailList
                },() => {
                    this.autoScrollToTarget();
                });
            });
        }
        let temp =  <div className={"chats"} style={{height: window.innerHeight-165,overflow: 'auto'}}>
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
                                    <div data-uuid={items.mailId} key={items.mailId} className={"chat"} style={{display: 'flex',flexDirection: checkDirection(items)['flexDirection'],margin: 10}}>
                                        <div style={{textAlign: 'left'}}>
                                            <p style={{margin: 0}}>{items.senderName}</p>
                                            {/* <p style={{margin: 0}}>{items.sender}</p> */}
                                        </div>
                                        <div className={checkDirection(items)['popoverPlace']} style={{position: 'relative',maxWidth: 600,zIndex: 1}}>
                                            <div className={"ant-popover-content"}>
                                                <div className={"ant-popover-arrow"}></div>
                                                <div className={"ant-popover-inner"}>
                                                    <div>
                                                        <div className={"ant-popover-title"}>
                                                            <span>{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                                        </div>
                                                        <div className={"ant-popover-inner-content"}
                                                            onMouseEnter={(e) => {
                                                                if($(e.target).find('.addReply').css('display')=='none'&&$(e.target).find('.msgExport').css('display')=='none'){
                                                                    $(e.target).find('.actionBar').fadeIn();
                                                                }else if($(e.target).parents('.ant-popover-inner-content').find('.addReply').css('display')=='none'&&$(e.target).parents('.ant-popover-inner-content').find('.msgExport').css('display')=='none'){
                                                                    $(e.target).parents('.ant-popover-inner-content').find('.actionBar').fadeIn();
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if($(e.target).find('.addReply').css('display')=='none'&&$(e.target).find('.msgExport').css('display')=='none'){
                                                                    $(e.target).find('.actionBar').fadeOut();
                                                                }else if($(e.target).parents('.ant-popover-inner-content').find('.addReply').css('display')=='none'&&$(e.target).parents('.ant-popover-inner-content').find('.msgExport').css('display')=='none'){
                                                                    $(e.target).parents('.ant-popover-inner-content').find('.actionBar').fadeOut();
                                                                }
                                                            }}
                                                        >
                                                            <div>
                                                                <p style={{marginBottom: 0,wordBreak: 'break-all',wordWrap: 'break-word'}}>{renderContent(items)}</p>
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

    deadlineChange(v){
        const { affairProp } = this;
        affairProp.deadline = v.format('YYYY-MM-DD');
        this.affairProp = affairProp;
    }

    rewardChange(v) {
        const { affairProp } = this;
        affairProp.reward = v;
        this.affairProp = affairProp;
    }

    sliderChange(v){
        const { affairProp } = this;
        const { selectedId, affairData } = this.state;
        affairProp.completionDegree = v;
        this.affairProp = affairProp;
        this.setState({
            completionDegree: v
        });
    }

    relatedAffairsChange(v){
        const { affairProp } = this;
        affairProp.relatedAffairs = v;
        this.affairProp = affairProp;
    }

    memberSliderChange(v){
        this.memberDegree = v;
    }

    //@override
    //回复
    publishReply(params){
        const { noti_client_mailId } = params;
        const { affairData,selectedId,selectedMailList } = this.state;
        if(!params.vote&&!params.atReply){
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
                this.btnGroup.isReplying = false;
                if (err) return;
                if(res.body.code==-1){
                    message.error(res.body.msg);
                    return;
                }
                message.success(res.body.msg);
                // this.fetchNotiMail(this.state.selectedId);
                request.get(common.baseUrl('/notiMail/'+noti_client_mailId))
                    .set("token", token)
                    .end((err, res) => {
                        selectedMailList.forEach((items,index) => {
                            if(items.mailId==res.body.data.mailId){
                                selectedMailList[index] = res.body.data;
                            }
                        });
                        this.setState({
                            selectedMailList
                        });
                    });
                //创建人同意，改变项目完成度，例行事务中不需要
                request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                    .set("token", token)
                    .end((err, res) => {
                        if (err) return;
                        affairData.forEach((items,index) => {
                            if(items.uuid==selectedId){
                                //保留原来的关联事务和被关联事务
                                // const { subRelativeAffair,supRelativeAffair } = affairData[index];
                                // res.body.data.subRelativeAffair = subRelativeAffair;
                                // res.body.data.supRelativeAffair = supRelativeAffair;
                                affairData[index] = res.body.data;
                            }
                        });
                        this.setState({
                            affairData
                        });
                    });
            });
    }

    //@overload
    editAffair(data){
        const { selectedId } = this.state;
        this.dialogType = 0;
        let disabled = false,max=90;
        /***********************************************************/
        try{
            if(data.ProjectAffairs[0].completionDegree==100){
                disabled = true;
                max = 100;
            }
        }catch(e){
            if(data.SmallAffairs[0].completionDegree==100){
                disabled = true;
                max = 100;
            }
        }
        let deadline,completionDegree,summary;
        try{
            deadline = data.ProjectAffairs[0].deadline;
        }catch(e){
            deadline = data.SmallAffairs[0].deadline;
        }
        try{
            completionDegree = data.ProjectAffairs[0].completionDegree;
        }catch(e){
            completionDegree = data.SmallAffairs[0].completionDegree;
        }
        try{
            summary = data.ProjectAffairs[0].summary;
        }catch(e){
            summary = data.SmallAffairs[0].summary;
        }
        let relatedAffairs;
        try{
            relatedAffairs = data.ProjectAffairs[0].relatedAffairs.split(',');
        }catch(e){
            try{
                relatedAffairs = data.SmallAffairs[0].relatedAffairs.split(',');
            }catch(e){
                relatedAffairs = [];
            }
        }
        /**********************************************************/
        let team;
        try{
            team = data.team.split(',');
        }catch(e){
            team = [];
        }
        const allAffairData = [];
        this.allAffairData.forEach(items => {
            if(items.uuid!=selectedId) allAffairData.push(items);
        });
        let modalText = <div>
                            <label style={{display:'flex'}}>
                                <span style={{width:'85px'}}>事务名称：</span>
                                <Input name={"name"} style={{flex:1}} defaultValue={data.name} />
                            </label>
                            { data.insert_person == sessionStorage.getItem('user_id') && <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>优先级：</span>
                                <Select defaultValue={data.priority} onChange={this.affairPriorityChange}>
                                    <Option value={'紧急'}>紧急</Option>
                                    <Option value={'重要'}>重要</Option>
                                    <Option value={'普通'}>普通</Option>
                                    <Option value={'暂缓'}>暂缓</Option>
                                </Select>
                            </label> }
                            {/* <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>状态：</span>
                                <Select defaultValue={data.state} onChange={this.affairStateChange}>
                                    <Option value={'草拟'}>草拟</Option>
                                    <Option value={'进行中'}>进行中</Option>
                                    <Option value={'已完成'}>已完成</Option>
                                    <Option value={'关闭'}>关闭</Option>
                                </Select>
                            </label> */}
                            <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>是否保密：</span>
                                <Select defaultValue={data.secret} onChange={this.affairSecretChange}>
                                    <Option value={1}>是</Option>
                                    <Option value={0}>否</Option>
                                </Select>
                            </label>
                            {/* <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>工作团队：</span>
                                <div style={{flex:1}}>{ this.renderAffairTeam(team) }</div>
                            </label> */}
                            { renderTemp('formLabel',data) }
                            {/* <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>项目背景：</span>
                                <Input name={"background"} style={{flex:1}} defaultValue={data.ProjectAffairs[0].background} />
                            </label>
                            <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>目标描述：</span>
                                <Input name={"target"} style={{flex:1}} defaultValue={data.ProjectAffairs[0].target} />
                            </label> */}
                            <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>最后期限：</span>
                                <DatePicker disabled={disabled} onChange={this.deadlineChange} defaultValue={moment(deadline)} />
                            </label>
                            <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>关联事务：</span>
                                <Select
                                    showSearch
                                    mode="multiple"
                                    placeholder="至少选择一个事务"
                                    style={{flex: 1}}
                                    defaultValue={relatedAffairs}
                                    onChange={this.relatedAffairsChange}
                                >
                                    {
                                        allAffairData.map(items => 
                                            <Option key={items.uuid} value={items.uuid}>{items.name}</Option>
                                        )
                                    }
                                </Select>
                            </label>
                            { data.ProjectAffairs.length !== 0 && <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>赏金：</span>
                                <InputNumber min={0} max={1000000} step={100} defaultValue={data.ProjectAffairs[0].reward} onChange={this.rewardChange} />
                            </label> }
                            {/* <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px',paddingTop: 8}}>整体完成度：</span>
                                <Slider disabled={disabled} style={{flex: 1}} min={10} max={max} onChange={this.sliderChange} defaultValue={completionDegree} step={10} />
                            </label> */}
                            {/* <label style={{display:'flex',marginTop: 10}}>
                                <span style={{width:'85px'}}>完成总结：</span>
                                <Input disabled={disabled} name={"summary"} style={{flex:1}} placeholder={'完成度为90%时填写'} defaultValue={summary} />
                            </label> */}
                        </div>;
        
        this.affairProp = {
            priority: data.priority,
            state: data.state,
            secret: data.secret,
            team: team,
            deadline: deadline,
            completionDegree: completionDegree,
            relatedAffairs: relatedAffairs
        };
        this.setState({
            modalText,
            visible: true
        });
    }

    memberEditAffair(data,self,isDirectorAndSelf){
        this.dialogType = 1;
        this.memberDegree = data.degree;
        let directorDisplay,selfDisplay;
        if(self){
            directorDisplay = 'none';
            selfDisplay = 'flex';
        }else{
            directorDisplay = 'flex';
            selfDisplay = 'none';
        }
        if(isDirectorAndSelf){
            directorDisplay = 'flex';
            selfDisplay = 'flex';
        }
        let modalText = <div>
                            <label style={{display:'none'}}>
                                <span style={{width:'85px'}}>id：</span>
                                <Input name={"id"} style={{flex:1}} defaultValue={data.id} />
                            </label>
                            <label style={{display:directorDisplay}}>
                                <span style={{width:'85px'}}>分工目标：</span>
                                <Input name={"division"} style={{flex:1}} defaultValue={data.division} />
                            </label>
                            <label style={{display:selfDisplay,marginTop: 10}}>
                                <span style={{width:'85px'}}>最新进展：</span>
                                <Input name={"news"} style={{flex:1}} defaultValue={data.news} />
                            </label>
                            {/* <label style={{display:selfDisplay,marginTop: 10}}>
                                <span style={{width:'85px',paddingTop: 8}}>完成度：</span>
                                <Slider style={{flex: 1}} min={0} max={100} onChange={this.memberSliderChange} defaultValue={data.degree} step={10} />
                            </label> */}
                        </div>
        this.setState({
            modalText,
            visible: true
        });
    }

    //@overload
    handleModalDefine(data){
        if(this.dialogType==0){
            this.affairEdit(data);
        }else{
            this.progressEdit(data);
        }
    }

    affairEdit(data){
        let { selectedId,affairData } = this.state;
        const { affairProp } = this;
        let team = affairProp.team;
        let relatedAffairs = affairProp.relatedAffairs;
        // if(team.length<1){
        //     message.warn('工作团队人数至少为一人');
        //     return;
        // }else 
        if(data.name==''){
            message.warn('事务名称不能为空');
            return;
        }
        if(relatedAffairs.length<1){
            message.warn('关联事务不能为空');
            return;
        }
        if (typeof team[0] === 'object') {
            team = team.map(items => items.user_id);
        }
        team = team.join();
        relatedAffairs = relatedAffairs.join();
        if(affairProp.completionDegree!=90&&affairProp.completionDegree!=100) data.summary = null;
        const form_data = {
            name: data.name,
            priority: affairProp.priority,
            // state: affairProp.state,
            team: team,
            secret: affairProp.secret,
            background: data.background,
            target: data.target,
            cause: data.cause,
            deadline: affairProp.deadline,
            // completionDegree: affairProp.completionDegree,
            // summary: data.summary,
            relatedAffairs: relatedAffairs,
            reward: affairProp.reward,
        };

        const affairFormData = {
            name: form_data.name,
            priority: form_data.priority,
            state: form_data.state,
            secret: form_data.secret,
            uuid: selectedId
        };

        const smallBaseAffairFormData = {
            name: form_data.name,
            priority: form_data.priority,
            // state: form_data.state,
            secret: form_data.secret,
            team: form_data.team,
            uuid: selectedId
        };

        const projectAffairFormData = {
            background: form_data.background,
            target: form_data.target,
            deadline: form_data.deadline,
            // completionDegree: form_data.completionDegree,
            // summary: form_data.summary,
            relatedAffairs: form_data.relatedAffairs,
            noti_client_affair_group_uuid: selectedId,
            reward: form_data.reward
        };

        const smallAffairFormData = {
            cause: form_data.cause,
            deadline: form_data.deadline,
            // completionDegree: form_data.completionDegree,
            // summary: form_data.summary,
            relatedAffairs: form_data.relatedAffairs,
            noti_client_affair_group_uuid: selectedId
        };

        const groupMemberFormData = {
            team: form_data.team,
            uuid: selectedId
        };
        let title,insert_person;
        affairData.forEach((items,index) => {
            if(items.uuid==selectedId){
                title = items.name;
                insert_person = items.insert_person;
            }
        });
        let in_affair_type;
        if(smallAffairFormData.cause==undefined){
            in_affair_type = 'project';
        }else{
            in_affair_type = 'small';
        }
        const par = {
            class: 'completeConfirm',
            frontUrl: window.location.href.split('#')[1].split('?')[0],
            title: title,
            content: '立项事务已完成',
            votes: '已阅',
            subscriber: insert_person,
            atSomeone: insert_person,
            noti_client_affair_group_uuid: selectedId
        }
        renderTemp('subAffairInfo',{
            in_affair_type: in_affair_type,
            affairFormData: affairFormData,
            smallBaseAffairFormData: smallBaseAffairFormData,
            projectAffairFormData: projectAffairFormData,
            smallAffairFormData: smallAffairFormData,
            groupMemberFormData: groupMemberFormData,
            par: par,
            that: this,
            selectedId: selectedId,
            affairData: affairData
        });
        return;

        /**
        const _p = [];
        const token = sessionStorage.getItem('token');
        _p[0] = new Promise((resolve,reject) => {
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
        _p[1] = new Promise((resolve,reject) => {
            request.put(common.baseUrl('/projectAffair/update'))
                .set("token", token)
                .send({
                    form_data: JSON.stringify(projectAffairFormData),
                    par: JSON.stringify(par)
                })
                .end((err, res) => {
                    if (err) return;
                    resolve();
                });
        });
        _p[2] = new Promise((resolve,reject) => {
            request.put(common.baseUrl('/affair/changeProjectTeamMember'))
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
            request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    affairData.forEach((items,index) => {
                        if(items.uuid==selectedId){
                            // //保留原来的关联事务和被关联事务
                            // const { subRelativeAffair,supRelativeAffair } = affairData[index];
                            // res.body.data.subRelativeAffair = subRelativeAffair;
                            // res.body.data.supRelativeAffair = supRelativeAffair;
                            affairData[index] = res.body.data;
                        }
                    });
                    this.setState({
                        affairData
                    });
                });
        }).catch(result => {
            message.error(result);
        });
         */
    }

    progressEdit(data){
        const { selectedId,affairData } = this.state;
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/childProjectAffair/update'))
            .set("token", token)
            .send({
                form_data: JSON.stringify(data)
            })
            .end((err, res) => {
                if (err) return;
                message.success('操作成功');
                request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                    .set("token", token)
                    .end((err, res) => {
                        if (err) return;
                        affairData.forEach((items,index) => {
                            if(items.uuid==selectedId){
                                //保留原来的关联事务和被关联事务
                                // const { subRelativeAffair,supRelativeAffair } = affairData[index];
                                // res.body.data.subRelativeAffair = subRelativeAffair;
                                // res.body.data.supRelativeAffair = supRelativeAffair;
                                affairData[index] = res.body.data;
                            }
                        });
                        this.setState({
                            affairData
                        });
                    });
            });
    }

    //@override
    //初始化
    componentWillReceiveProps(props){
        this.fetchAffair(() => {
            this.fetchDeadLine();
        });
        this.fetchAllStaff();
        this.fetchAllAffair();
        this.fetchTreeData();
        if(!props.location||!props.location.state||!props.location.state.fromBox){
            this.setState({
                visibleSelf: true
            });
        }
        document.onkeyup = (e) => {
            if(e.keyCode==70){
                this.setState({
                    searchVisible: 'block'
                });
            }
        }
    }

    //切换显示我的事务和全部事务
    changeAffairSelf(){
        delete this.props.location.state;

        this.locationId = null;
        this.scrollHeight = 0;
        this.scrollMark = 0;

        this.scroll.pageStart = 1;
        this.scroll.hasMore = true;
        this.scroll.loading = false;

        this.setState({
            visibleSelf: !this.state.visibleSelf,
            selectedId: null,
            selectedMailList: [],
        }, () => {
            this.fetchAffair(() => {
                this.fetchDeadLine();
            });
        });
    }
    
    fetchAllAffair(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/affair/listForSelect'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.allAffairData = res.body.data;
            });
    }

    supHandleTableClick(data,index){
        const { affairId } = data;
        const { affairData,selectedId } = this.state;
        let self = false;
        affairData.forEach((items,index) => {
            if(items.uuid==affairId) self = true;
        });
        let pathname = '/projectAffair';
        if(self){
            hashHistory.push({
                pathname: pathname,
                state: {
                    affairId: affairId
                }
            });
        }else{
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/getTargetAffair/'+affairId))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    const department = res.body.data.RespoAffairs[0].department;
                    if(department=='客户关系部'){
                        if(res.body.data.outerContact){
                            pathname = '/specialLine';
                        }else{
                            pathname = '/custRelationsAffairs';
                        }
                    }else if(department=='生产部'){
                        pathname = '/productsAffairs';
                    }else if(department=='研发部'){
                        pathname = '/researchAffairs';
                    }else if(department=='管理部'){
                        pathname = '/manageAffairs';
                    }
                    hashHistory.push({
                        pathname: pathname,
                        state: {
                            affairId: affairId
                        }
                    });
                });
        }
    }

    supRelativeAffair(c_height){
        const { selectedId,affairData } = this.state;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        if(selectedIdData.length==0||selectedIdData[0].supRelativeAffair.length==0) return <h2 style={{textAlign: 'center'}}>暂无上属事务</h2>;
        let resArr = [];
        const user_id = sessionStorage.getItem('user_id');
        selectedIdData[0].supRelativeAffair.forEach((items,index) => {
            let team = items.team.split(',');
            if(items.secret==0||items.secret==1&&team.indexOf(user_id)!=-1){
                resArr.push({
                    name: items.name,
                    state: items.state,
                    teamName: items.teamName,
                    affairId: items.uuid
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
        const nowArr = [];
        this.allAffairData.forEach((items,index) => {
            if(items.uuid!=selectedId) nowArr.push(items);
        });
        return <Table columns={columns} onRowClick={this.supHandleTableClick} pagination={false} scroll={{y: c_height}} dataSource={resArr} size="middle" />
    }

    filterBar(){
        const { visibleSelf } = this.state;
        let selectText;
        if(visibleSelf){
            selectText = '我的事务';
        }else{
            selectText = '全部事务';
        }
        return <RadioGroup style={{marginTop: 6,marginBottom: 6}} onChange={this.changeAffairSelf} value={selectText}>
                    <Radio value={'我的事务'}>我的事务</Radio>
                    <Radio value={'全部事务'}>全部事务</Radio>
                </RadioGroup>
        // return  <Select value={selectText} style={{ width: 230 }} onChange={this.changeAffairSelf}>
        //             <Option value="我的事务">我的事务</Option>
        //             <Option value="全部事务">全部事务</Option>
        //         </Select>
    }

    renderProgress(item){
        let deadline,completionDegree,insert_time;
        insert_time = item.insert_time;
        const user_id = sessionStorage.getItem('user_id');
        let hasMyProgress = false,myProgress = 0;
        if(item.ProjectAffairs.length!=0){
            deadline = item.ProjectAffairs[0].deadline;
            completionDegree = item.ProjectAffairs[0].completionDegree;
            item.ProjectAffairs[0].ProjectAffairProgresses.forEach((items,index) => {
                if(items.member == user_id){
                    hasMyProgress = true;
                    myProgress = items.degree;
                }
            });
            const allLen = Date.parse(deadline) - Date.parse(insert_time);
            const nowLen = Date.now() - Date.parse(insert_time);
            let rate;
            try{
                rate = parseInt(nowLen/allLen*100);
            }catch(e){
                rate = 0;
            }
            rate = rate>100?100:rate;
            rate = rate<0?0:rate;
            rate = Number((rate/10).toFixed(0))*10;
            rate = rate==0?10:rate;
            return [<Progress format={() => ''} strokeColor={'#ffeb3b'} percent={rate} successPercent={completionDegree} />];
        }else{
            return [<div style={{height: 21.6}}></div>];
        }
    }

    //创建消息
    createMsg(c_height){
        const that = this;

        //判断自己是否具备发言资格
        //2018-08-20提出需求，任何人都能发言
        const checkCanSpeak = () => {
            const { affairData,selectedId } = this.state;
            const user_id = sessionStorage.getItem('user_id');
            let groupArr = [];
            affairData.forEach((items,index) => {
                if(items.uuid==selectedId){
                    try{
                        groupArr = items.team.split(',');
                    }catch(e){

                    }
                }
            });
            if(groupArr.indexOf(user_id)==-1){
                return false;
            }else{
                return true;
            }
        }

        //获取群成员
        //2018-08-20提出需求，能@任何人
        const getGroupMember = (n) => {
            const { affairData,selectedId } = this.state;
            const user_name = sessionStorage.getItem('user_name');
            let groupArr;
            affairData.forEach((items,index) => {
                if(items.uuid==selectedId){
                    groupArr = items.teamName.split(',');
                }
            });
            let resArr = [];
            if(!groupArr) return resArr;
            const allStaffNameArr = [];
            this.staffArr.map(items => {
                items.map(it => allStaffNameArr.push(it.user_name));
            });
            const otherArr = [];
            Linq.from(allStaffNameArr).except(groupArr).forEach(i => {
                otherArr.push(i);
            });

            const _groupArr = [];
            groupArr.forEach((items,index) => {
                if(items!=user_name){
                    _groupArr.push(<Option key={items} value={items}>{items}</Option>);
                }
            });
            const _otherArr = [];
            otherArr.forEach((items,index) => {
                if(items!=user_name){
                    _otherArr.push(<Option key={items} value={items}>{items}</Option>);
                }
            });
            if(n==0){
                return _groupArr;
            }else{
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
        const votesChange = (v) =>{
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
                    if(res.file.status=='removed'){
                        that.imgUploading = false;
                    }
                    if(res.file.status=='done'){
                        that.imgUploading = false;
                        let file_name = res.file.response.data[0];
                        let { imgArr,imgNameArr } = that.state;
                        imgArr.push(file_name);
                        imgNameArr.push(res.file.name);
                        that.setState({
                            imgArr,
                            imgNameArr
                        });
                    }
                },
                onRemove(res) {
                    const { imgArr,imgNameArr } = that.state;
                    imgArr.forEach((items,index) => {
                        if(items==res.response.data[0]){
                            imgArr.splice(index,1);
                        }
                    });
                    imgNameArr.forEach((items,index) => {
                        if(items==res.response.data[0]){
                            imgNameArr.splice(index,1);
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
                    if(/\s/.test(res.name)) {
                        message.error('文件名不允许有空格');
                        return false;
                    }
                },
                onChange(res) {
                    that.fileUploading = true;
                    if(res.file.status=='removed'){
                        that.fileUploading = false;
                    }
                    if(res.file.status=='done'){
                        that.fileUploading = false;
                        let file_name = res.file.response.data[0];
                        let { fileArr,fileNameArr } = that.state;
                        fileArr.push(file_name);
                        fileNameArr.push(res.file.name);
                        that.setState({
                            fileArr,
                            fileNameArr
                        });
                    }
                },
                onRemove(res){
                    const { fileArr,fileNameArr } = that.state;
                    fileArr.forEach((items,index) => {
                        if(items==res.response.data[0]){
                            fileArr.splice(index,1);
                        }
                    });
                    fileNameArr.forEach((items,index) => {
                        if(items==res.response.data[0]){
                            fileNameArr.splice(index,1);
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
            if(this.fileUploading||this.imgUploading){
                message.warn('请等待上传完成！');
                return;
            }
            let { votes,at,mailPriority,affairData,selectedId,selectedMailList } = this.state;
            let content = $('textarea[name=content]').val();
            if(!content){
                message.warn('内容不能为空');
                return;
            }
            if(votes[0]==null&&at[0]==null){
                message.warning('请至少选择一项操作');
                return;
            }

            /**start @员工名转换成id */
            at.forEach((items,index) => {
                if(/[\u4e00-\u9fa5]+/.test(items)!=-1){
                    this.staffArr.forEach((it,ind) => {
                        it.forEach((_it,_ind) => {
                            if(_it.user_name==items){
                                at[index] = _it.user_id;
                            }
                        });
                    });
                }
            });
            /**end */

            //获取订阅者和title
            let subscriber,title;
            if(votes[0]==null){
                subscriber = at.join();
                affairData.forEach((items,index) => {
                    if(items.uuid==selectedId){
                        title = items.name;
                    }
                });
            }else{
                const user_id = sessionStorage.getItem('user_id');
                let _arr = [];
                affairData.forEach((items,index) => {
                    if(items.uuid==selectedId){
                        _arr = items.team.split(',');
                        title = items.name;
                    }
                });
                _arr.forEach((items,index) => {
                    if(items==user_id) _arr.splice(index,1);
                });
                if(at.length==0){
                    subscriber = _arr.join();
                }else{
                    //有@的情况，需要检查是否有团队外的@人员
                    at.forEach((items,index) => {
                        this.staffArr.forEach((it,ind) => {
                            it.forEach((_it,_ind) => {
                                if(items==_it.user_name||items==_it.user_id){
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
                album: this.state.imgArr.join()?this.state.imgArr.join():null,
                albumName: this.state.imgNameArr.join()?this.state.imgNameArr.join():null,
                file: this.state.fileArr.join()?this.state.fileArr.join():null,
                fileName: this.state.fileNameArr.join()?this.state.fileNameArr.join():null,
                votes: votes.join()?votes.join():null,
                atSomeone: at.join()?at.join():null,
                subscriber: subscriber,
                isMeetingMsg: that.state.isMeetingMsg,
                meetingTime: that.state.meetingDate.format('YYYY-MM-DD') + ' ' + that.state.meetingHours.format('HH:mm:ss'),
                noti_client_affair_group_uuid: selectedId,
                degree: this.state.completionDegree,
                isDelay: that.state.isDelay,
                delayTime: that.state.delayDate.format('YYYY-MM-DD') + ' ' + that.state.delayHours.format('HH:mm:ss'),
                non_str: Number.parseInt(Math.random() * 10000),
            };
            if (this.btnGroup.isSending) return;
            this.btnGroup.isSending = true;
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/affair/changeDegree'))
                .set("token", token)
                .send({
                    degree: this.state.completionDegree,
                    affairId: this.state.selectedId
                })
                .end((err, res) => {
                    if (err) return;
                    this.btnGroup.isSending = false;
                    // message.success(res.body.msg);
                    request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                        .set("token", token)
                        .end((err, res) => {
                            if (err) return;
                            affairData.forEach((items,index) => {
                                if(items.uuid==selectedId){
                                    affairData[index] = res.body.data;
                                }
                            });
                            this.setState({
                                affairData
                            });

                            request.post(common.baseUrl('/notiClient/add'))
                                .set("token", token)
                                .send(form_data)
                                .end((err, res) => {
                                    if (err) return;
                                    if(res.body.code==200){
                                        this.scrollHeight = 0;
                                        this.scroll.pageStart = 1;
                                        this.scroll.hasMore = true;
                                        this.scroll.loading = false;
                                        this.fetchNotiMail(selectedId,() => {
                                            $('.ant-tabs-tab').eq(1).trigger('click');
                                        });
                                        message.success(res.body.msg);
                                        $('textarea[name=content]').val('');
                                        this.setState({
                                            votes: ['已阅'],
                                            at: [],
                                            imgArr: [],
                                            imgNameArr: [],
                                            fileArr: [],
                                            fileNameArr: []
                                        });
                                        $('.ant-upload-list-item').remove();
                                    }else{
                                        message.error(res.body.msg);
                                    }
                                });


                        });
                });
        }

        const widthFit = () => {
            if(/edge/ig.test(window.navigator.userAgent)){
                return '180px';
            }else{
                return 'fit-content';
            }
        }

        const degree = () => {
            const { selectedId,affairData } = this.state;
            const staffData = this.staffData;
            const selectedIdData = Linq.from(affairData).where(x => {
                return x.uuid == selectedId;
            }).toArray();
            let disabled = false,max = 90,completionDegree = 10;
            // 判断是否显示进度条
            let degreeShow = false;
            const user_id = sessionStorage.getItem('user_id');
            try{
                // 小事务队长修改进度条
                if(selectedIdData[0].SmallAffairs[0]&&selectedIdData[0].team.split(',')[0]==user_id){
                // if(selectedIdData[0].SmallAffairs[0]&&selectedIdData[0].team.indexOf(user_id)!=-1){
                    degreeShow = true;
                }else if(selectedIdData[0].ProjectAffairs[0]&&selectedIdData[0].team.indexOf(user_id)!=-1){
                    degreeShow = true;
                }
            }catch(e){

            }

            try{
                if(selectedIdData[0].ProjectAffairs[0].completionDegree==100){
                    disabled = true;
                    max = 100;
                }
            }catch(e){
                try{
                    if(selectedIdData[0].SmallAffairs[0].completionDegree==100){
                        disabled = true;
                        max = 100;
                    }
                }catch(e){

                }
            }
            if(degreeShow) return <label style={{display:'flex',marginTop: 15,paddingRight: 4}}>
                                <span style={{width: 80}}>我的进度：</span>
                                <Slider disabled={disabled} style={{flex: 1}} min={10} max={max} onChange={this.sliderChange} value={this.state.completionDegree} step={10} />
                            </label>
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
                    <div style={{marginLeft: 8,marginRight: 8,textAlign: 'center',height: c_height,overflow: 'auto'}}>
                        <label style={{display:'flex'}}>
                            <span style={{width:75}}>正文：</span>
                            <textarea className="ant-input" rows={6} name={"content"} style={{flex:1}}></textarea>
                            {/* <TextArea rows={'6'} name={"content"} style={{flex:1}} /> */}
                        </label>
                        <div style={{display:'flex',marginTop: 15,textAlign: 'left',width: 'fit-content'}}>
                            <span style={{width:75,paddingLeft: 12}}>图片：</span>
                            <Upload {...imgProps()}>
                                <Button>
                                    <Icon type="upload" />上传图片
                                </Button>
                            </Upload>
                        </div>
                        <div style={{display:'flex',marginTop: 15,textAlign: 'left',width: 'fit-content'}}>
                            <span style={{width:75,paddingLeft: 12}}>文件：</span>
                            <Upload {...fileProps()}>
                                <Button>
                                    <Icon type="upload" />上传文件
                                </Button>
                            </Upload>
                        </div>
                        <label style={{display:'flex',marginTop: 15}}>
                            <span style={{width:75}}>选单：</span>
                            <Select
                                key={1}
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder="请输入..."
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
                        <label style={{display:'flex',marginTop: 15}}>
                            <span style={{width:75}}>@：</span>
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
                            </Select>
                        </label>
                        { degree() }
                        <label style={{display:'flex',marginTop: 15,width: widthFit()}}>
                            <span style={{width:75}}>会议：</span>
                            <Radio.Group onChange={isMeetingMsgChange} value={that.state.isMeetingMsg}>
                                <Radio value={0}>否</Radio>
                                <Radio value={1}>是</Radio>
                            </Radio.Group>
                            {
                                that.state.isMeetingMsg === 1 && <div>
                                    <DatePicker onChange={meetingTimeDateChange} allowClear={false} defaultValue={that.state.meetingDate} />
                                    <span style={{marginLeft: 3, marginRight: 3}}></span>
                                    <TimePicker onChange={meetingTimeHoursChange} allowClear={false} defaultValue={that.state.meetingHours} />
                                </div>
                            }
                        </label>
                        <label style={{display:'flex',marginTop: 15,width: widthFit()}}>
                            <span style={{width:75}}>定时发送：</span>
                            <Radio.Group onChange={isDelayChange} value={that.state.isDelay}>
                                <Radio value={0}>否</Radio>
                                <Radio value={1}>是</Radio>
                            </Radio.Group>
                            {
                                that.state.isDelay === 1 && <div>
                                    <DatePicker onChange={delayTimeDateChange} allowClear={false} defaultValue={that.state.delayDate} />
                                    <span style={{marginLeft: 3, marginRight: 3}}></span>
                                    <TimePicker onChange={delayTimeHoursChange} allowClear={false} defaultValue={that.state.delayHours} />
                                </div>
                            }
                        </label>
                        <Button style={{marginTop: 20}} type={'primary'} onClick={handleSubmit}>提交</Button>
                    </div>
                </TabPane>
    }

    fetchDeadLine() {
        const { visibleSelf, affairData } = this.state;
        if (!visibleSelf || affairData.length === 0) return;
        let affairIdArr = affairData.filter(items => items.priority !== '暂缓');
        affairIdArr = affairIdArr.map(items => items.uuid);
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/affair/fetchDeadLine'))
            .set("token", token)
            .query({
                affairIdArr: JSON.stringify(affairIdArr),
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    arrivalDateArr: res.body.data,
                });
            });
    }

    showEndTimeTitle(affairId) {
        const { visibleSelf, arrivalDateArr } = this.state;
        if (!visibleSelf) return;
        let date = '暂无';
        arrivalDateArr.forEach(items => {
            if (items.affairId === affairId) {
                date = items.arrivalDate;
            }
        });
        return '事务更新最迟时间：' + date;
    }

    // 区分上属事务是不是为专线
    checkSupAffair(item) {
        const name = item.name+'（'+item.teamName.split(',')[0]+'）';
        return name;
        if (item.supRelativeAffair.length === 0) return name;
        const it = item.supRelativeAffair[0].name;
        let splitArr = [];
        try {
            splitArr = it.split('专线');
        } catch (e) {
            splitArr = [];
        }
        if (splitArr.length === 1) return name;
        return splitArr[0] + '——' + name;
    }

    //@override
    render() {
        let b_height = window.innerHeight-105;
        let c_height = window.innerHeight-170;
        const { affairData,selectedId,searchVisible,visibleSelf,pdfAffairId,imgSrc,albumBorwerArr } = this.state;
        return (
            <div>
                <div className="demo-infinite-container" style={{paddingRight: 10,height: b_height,display: 'flex'}}>
                    <div className={'leftBar'} style={{width: 300}}>
                        <div style={{borderTop: "1px solid #e8e8e8",width: 300,height: b_height,overflow: 'auto'}}>
                            <div style={{textAlign: 'center',minHeight: 10}}>
                                {this.filterBar()}
                            </div>
                            <List
                                dataSource={this.state.affairData}
                                itemLayout={"vertical"}
                                className={'projectList'}
                                renderItem={item => (
                                    <List.Item key={item.uuid}
                                        className={'l_list'}
                                        id={'_'+item.uuid}
                                        style={{paddingLeft: 10,cursor: 'pointer',width: '100%',position: 'relative'}}
                                        onClick={() => this.affairClick(item)}
                                        actions={this.renderProgress(item)}
                                        title={this.showEndTimeTitle(item.uuid)}
                                    >
                                        <List.Item.Meta
                                            title={
                                                    <div style={{opacity: item.priority == '暂缓' ? 0.2 : 1, overflow: 'hidden',whiteSpace: 'nowrap',textOverflow: 'ellipsis'}}>
                                                        {this.attentionAffair(item)}
                                                        {this.checkSupAffair(item)}
                                                    </div>
                                                }
                                        />
                                    </List.Item>
                                )}
                            >
                            </List>
                        </div>
                    </div>
                    <div className={'tabsWrap'} style={{flex: 3,border: '1px solid #eee'}}>
                        <Tabs defaultActiveKey="2">
                            <TabPane tab="摘要" key="1">
                                <div style={{height: c_height,paddingLeft: 10,overflow: 'auto'}}>
                                    {this.summaryTemp()}
                                </div>
                            </TabPane>
                            <TabPane tab="消息" key="2">
                                <div style={{height: c_height}}>
                                    <div style={{position: 'absolute',right: 0,top: 6,zIndex: 10,display: searchVisible}}>
                                        <Search
                                            placeholder="消息内容关键字"
                                            onSearch={value => this.search(value)}
                                            style={{width: 300}}
                                            enterButton
                                        />
                                    </div>
                                    {this.mailTemp()}
                                </div>
                            </TabPane>
                            <TabPane tab="资源" key="3">
                                <div style={{height: c_height,overflow: 'auto'}}>
                                    {this.pullResourse(c_height)}
                                </div>
                            </TabPane>
                            {this.createMsg(c_height)}
                            <TabPane tab="上属事务" key="6">
                                <div style={{height: c_height,overflow: 'auto'}}>
                                    {this.supRelativeAffair(c_height)}
                                </div>
                            </TabPane>
                            <TabPane tab="下属事务" key="5">
                                <div style={{height: c_height,overflow: 'auto'}}>
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

export default ProjectAffair;