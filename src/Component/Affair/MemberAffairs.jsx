import React from 'react';
import AffairsList from './AffairsList.jsx';
import request from 'superagent';
import common from '../../public/js/common.js';
import { message, List, Tabs, Input, Drawer, Icon, Tag } from 'antd';
import Linq from 'linq';
import ModalTemp from '../common/Modal.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import InfiniteScroll from 'react-infinite-scroller';
import PhotoLooker from '../common/PhotoLooker.jsx';
import { MemberMsgList } from '../Member/MemberEdit';

const TabPane = Tabs.TabPane;
const Search = Input.Search;
moment.locale('zh-cn');

class MemberAffairs extends AffairsList {
	constructor(props) {
        super(props);
        this.isMemberMsg = false;
        this.state.eyeTitle = '与他相关';
        this.readOnlyNameArr = ['会员服务大厅', '会员私信大厅'];
        this.state.drawerVisible = false;
        this.state.drawerTitle = '';
        this.state.drawerId = '';
    }

    //@Override
    //摘要模板
    summaryTemp(){
        const { selectedId,affairData } = this.state;
        const selectedArr = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        try{
            this.fetchAllOuterContact(selectedArr[0]);
        }catch(e){

        }
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == selectedId;
        }).toArray();
        if(selectedIdData.length==0) return;
        const user_id = sessionStorage.getItem('user_id');
        const token = sessionStorage.getItem('token');
        let tagArr;
        try{
            tagArr = selectedIdData[0].RespoAffairs[0].labels.split(',');
        }catch(e){
            tagArr = [];
        };
        const self = this;
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
                        { !self.isMemberMsg && <div style={{ color: '#1890ff', cursor: 'pointer', marginLeft: 32 }} onClick={() => this.transferMsg(selectedIdData[0].uuid)}>
                            <Icon type="export" />
                            <span style={{ marginLeft: 4 }}>消息迁移</span>
                        </div> }
                    </p>
                )
            }
        }
        //队员可见
        const teamSecret = (secret) => {
            if(secret==1){
                return '是';
            }else{
                return '否';
            }
        }
        const temp = <div>
                        { showEdit() }
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
                            <span>发布人：</span>
                            <span>{selectedIdData[0].insert_person_name}</span>
                        </p>
                        <p>
                            <span>工作团队：</span>
                            <span>{selectedIdData[0].teamName}</span>
                        </p>
                        <p>
                            <span>外部联系人：</span>
                            <span>{selectedIdData[0].outerContactName}</span>
                        </p>
                        <p>
                            <span>关注的员工：</span>
                            <span>{selectedIdData[0].attentionStaffName}</span>
                        </p>
                    </div>;
        return temp;
    }

    //获取事务列表
    fetchAffair(cb){
        const token = sessionStorage.getItem('token');
        const user_id = sessionStorage.getItem('user_id');
        request.get(common.baseUrl('/affair/list'))
            .set("token", token)
            .query({
                affairType: this.affairType,
                department: '会员',
            })
            .end((err, res) => {
                if (err) return;
                if(res.body.data.length!=0){
                    let resArr = res.body.data;
                    let selectedId;
                    //如果是从首页跳转过来的
                    let affairId,locationId;
                    if(this.props.paramsData||(this.props.location&&this.props.location.state)){
                        try{
                            affairId = this.props.paramsData.affairId;
                        }catch(e){
                            affairId = this.props.location.state.affairId;
                        }
                        try{
                            locationId = this.props.paramsData.locationId;
                        }catch(e){
                            locationId = this.props.location.state.locationId;
                        }
                        resArr.forEach((items,index) => {
                            if(items.uuid==affairId){
                                selectedId = affairId;
                                this.locationId = locationId;
                            }
                        });
                        if (!selectedId) {
                            // 找不到该事务列表
                            // 显示需要从某个例行事务查看
                            request.get(common.baseUrl('/getTargetAffair/'+affairId))
                                .set("token", token)
                                .end((err, res) => {
                                    if (err) return;
                                    let relatedAffairs;
                                    if (res.body.data.ProjectAffairs.length !== 0) {
                                        relatedAffairs = res.body.data.ProjectAffairs[0].relatedAffairs.split(',')[0];
                                    } else {
                                        relatedAffairs = res.body.data.SmallAffairs[0].relatedAffairs.split(',')[0];
                                    }
                                    request.get(common.baseUrl('/getTargetAffair/'+relatedAffairs))
                                        .set("token", token)
                                        .end((err, res) => {
                                            if (err) return;
                                            message.info('该事务已完成，请到'+res.body.data.name+'查看');
                                        });
                                });
                        }
                    }
                    //筛选保密的工作组
                    let endArr = [];
                    resArr.forEach((items,index) => {
                        let team = items.team.split(',');
                        if(items.secret==0||items.secret==1&&team.indexOf(user_id)!=-1||user_id==items.insert_person){
                            endArr.push(items);
                        }
                    });
                    //筛选我的事务
                    this.fetchMsgNotReply(notReplyArr => {
                        if(this.state.visibleSelf){
                        // if(!this.props.location||!this.props.location.state||!this.props.location.state.fromBox){
                            //把跟我无关的全部去掉（我参与的，我关注的，我创建的）
                            let filterArr = [],mark = false;
                            endArr.forEach((items,index) => {
                                if(!items.RespoAffairs){
                                    mark = true;
                                    let teamArr = items.team.split(',');
                                    let attentionArr;
                                    try{
                                        attentionArr = items.attentionStaff.split(',');
                                    }catch(e){
                                        attentionArr = [];
                                    }
                                    if(teamArr.indexOf(user_id)!=-1||attentionArr.indexOf(user_id)!=-1||items.insert_person==user_id){
                                        filterArr.push(items);
                                    }
                                }
                            });
                            if(mark) endArr = filterArr;
                        }
                        const myAffairsSortMap = common.myAffairsSortMap();
                        endArr.forEach((items,index) => {
                            if(!items.RespoAffairs){
                                let count = 0;
                                //计算静态优先级
                                count += myAffairsSortMap[items.priority];
                                //计算外部联系人
                                if(items.outerContact) count += myAffairsSortMap['hasOuterContact'];
                                //计算负责，参与
                                let teamArr = items.team.split(',');
                                teamArr.forEach((items,index) => {
                                    if(items==user_id&&index==0){
                                        count += myAffairsSortMap['responsible'];
                                    }else if(items==user_id){
                                        count += myAffairsSortMap['join'];
                                    }
                                });
                                //计算关注
                                let attentionArr;
                                try{
                                    attentionArr = items.attentionStaff.split(',');
                                }catch(e){
                                    attentionArr = [];
                                }
                                if(attentionArr.indexOf(user_id)!=-1)  count += myAffairsSortMap['attention'];
                                //计算逾期和临近到期，临近到期暂定7天
                                let deadlineStamp,deadline;
                                try{
                                    deadline = items.ProjectAffairs[0].deadline;
                                }catch(e){
                                    deadline = items.SmallAffairs[0].deadline;
                                }
                                deadlineStamp = Date.parse(deadline);
                                if(deadlineStamp<Date.now()){
                                    //已经逾期
                                    count += myAffairsSortMap['overTime'];
                                }else if((deadlineStamp - Date.now())/(1000*60*60*24)<7){
                                    //临近到期
                                    count += myAffairsSortMap['nearTime'];
                                }
                                //计算答复
                                let notReplyLen = 0;
                                notReplyArr.forEach((it,ind) => {
                                    let noti_post_mailId = it.NotiPost.noti_client_affair_group_uuid;
                                    let uuid = items.uuid;
                                    if(noti_post_mailId==uuid){
                                        notReplyLen++;
                                        if(it.atMe){
                                            count += myAffairsSortMap['atme'];
                                        }else{
                                            count += myAffairsSortMap['vote'];
                                        }
                                    }
                                });
                                endArr[index].notReplyLen = notReplyLen;
                                endArr[index].count = count;
                            }
                        });
                        const s = (a,b) => {
                            return b.count - a.count;
                        }
                        endArr = endArr.sort(s);
                        try{
                            selectedId = selectedId?selectedId:endArr[0].uuid;
                            this.setState({
                                affairData: endArr,
                                selectedId: selectedId
                            });
                            this.fetchNotiMail(selectedId);
                        }catch(e){
                            try{
                                selectedId = endArr[0].uuid;
                                this.setState({
                                    affairData: endArr,
                                    selectedId: selectedId
                                });
                                this.fetchNotiMail(selectedId);
                            }catch(e){
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

    handleModalDefine(data){
        const { affairProp } = this;
        let { selectedId,affairData } = this.state;
        let team = affairProp.team;
        let labels = affairProp.labels;
        const branch = affairProp.branch;
        if(team.length<1){
            message.warn('工作团队人数至少为一人');
            return;
        }else if(data.name==''){
            message.warn('事务名称不能为空');
            return;
        }
        if (typeof team[0] === 'object') {
            team = team.map(items => items.user_id);
        }
        team = team.join();
        labels = labels.join();
        if(labels=='') labels = null;

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
        _p[2] = new Promise((resolve,reject) => {
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
            request.get(common.baseUrl('/getTargetAffair/'+selectedId))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    affairData.forEach((items,index) => {
                        if(items.uuid==selectedId){
                            if(items.RespoAffairs[0].department!=res.body.data.RespoAffairs[0].department){
                                affairData.splice(index,1);
                            }else{
                                //保留原来的关联事务和被关联事务
                                const { subRelativeAffair,supRelativeAffair } = affairData[index];
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

    //创建消息
    createMsg(c_height) {
        if (!this.isMemberMsg) {
            return super.createMsg(c_height);
        }
    }

    //获取mail列表
    fetchNotiMail(uuid, cb) {
        const { affairData } = this.state;
        const selectedIdData = Linq.from(affairData).where(x => {
            return x.uuid == uuid;
        }).toArray();
        if (selectedIdData.length === 1 && this.readOnlyNameArr.includes(selectedIdData[0].name)) {
            this.isMemberMsg = true;
        } else {
            this.isMemberMsg = false;
        }
        if (!this.isMemberMsg) {
            return super.fetchNotiMail(uuid, cb);
        }
        const { scroll } = this;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/member/getTotalMiddleMsg'))
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
                },() => {
                    this.autoScrollToTarget();
                    if(cb) cb();
                });
            });
    }

    //后续获取mail列表
    fetchNotiMailByScroll(uuid,cb) {
        if (!this.isMemberMsg) {
            return super.fetchNotiMailByScroll(uuid, cb);
        }
        const { scroll } = this;
        this.scrollMark = 0;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/member/getTotalMiddleMsg'))
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

    //消息模板
    mailTemp(){
        if (!this.isMemberMsg) {
            return super.mailTemp();
        }
        const { selectedMailList } = this.state;
        if(selectedMailList.length==0) return;
        //消息对齐方向
        const checkDirection = items => {
            if (items.sender !== 'system' && !/^\d+$/.test(items.sender)) {
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

            const trans = items => {
                let { content, openid, receiverName } = items;
                content = content.replace(/\n/g,'</br>');
                content = content.replace(/\s/g,'&nbsp;');
                // if (openid) {
                //     return receiverName + '：' + content;
                // }
                return content;
            }
            return <div className={'actionWrap'} data-mailId={items.mailId} style={{paddingBottom: 10}}>
                        <div dangerouslySetInnerHTML={{__html: trans(items)}}></div>
                        <div className={'actionBar'} style={{textAlign: 'right',fontSize: 17,display: 'none'}}>
                            <Icon onClick={(e) => {
                                const sender = items.sender == 'system' ? items.openid : items.sender;
                                this.search();
                                let eyeTitle;
                                if(this.state.eyeTitle=='与他相关'){
                                    eyeTitle = '查看全部';
                                    this.scroll.filter.sender = sender;
                                }else{
                                    eyeTitle = '与他相关';
                                    delete this.scroll.filter.sender;
                                }
                                this.setState({
                                    eyeTitle: eyeTitle
                                });
                            }} title={this.state.eyeTitle} style={{cursor: 'pointer',position: 'absolute',right: 11}} type="eye" />
                        </div>
                    </div>
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

        //附件
        const annex = (items) => {
            let albumArr = [];
            if (items.album) {
                albumArr = items.album.split(',');
            }
            return  <div>
                        <div style={{padding: 2}}>
                            {
                                albumArr.map((items,index) => 
                                    // <img onClick={() => {
                                    //     this.canRenderPhoto = true;
                                    //     this.setState({
                                    //         imgSrc: common.staticBaseUrl('/img/notiClient/'+items),
                                    //         albumBorwerArr: albumArr
                                    //     },() => {
                                    //         this.canRenderPhoto = false;
                                    //     })
                                    // }} key={items} title={albumNameArr[index]} style={{marginLeft: 13,cursor: 'pointer'}} src={common.staticBaseUrl('/img/notiClient/small_'+items)} />
                                    <a key={items + index} title={albumArr[index]} target={'_blank'} href={common.staticBaseUrl('/img/notiClient/'+items)}>
                                        <img style={{marginLeft: 13, marginBottom: 6, width: 30}} src={common.staticBaseUrl('/img/notiClient/'+items)} />
                                    </a>
                                )
                            }
                        </div>
                    </div>;
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
                                        </div>
                                        <div className={checkDirection(items)['popoverPlace']} style={{position: 'relative',maxWidth: 600,zIndex: 1}}>
                                            <div className={"ant-popover-content"}>
                                                <div className={"ant-popover-arrow"}></div>
                                                <div className={"ant-popover-inner"}>
                                                    <div>
                                                        <div className={"ant-popover-title"} style={{display: 'flex', justifyContent: 'space-between', ...this.skipStyle(items)}} onClick={() => this.locationToPage(items)}>
                                                            { items.openid && <span>{items.receiverName}</span> }
                                                            <span>{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                                        </div>
                                                        <div className={"ant-popover-inner-content"}
                                                            onMouseEnter={e => {
                                                                $('.actionBar').hide();
                                                                $(e.target).find('.actionBar').show();
                                                            }}
                                                            onMouseLeave={e => {
                                                                $('.actionBar').hide();
                                                            }}
                                                        >
                                                            <div>
                                                                <p style={{marginBottom: 0,wordBreak: 'break-all',wordWrap: 'break-word'}}>{renderContent(items)}</p>
                                                            </div>
                                                        </div>
                                                        {annex(items)}
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
        const { skipId, receiverName, senderName, openid } = items;
        if (skipId) {
            const drawerTitle = openid ? receiverName : senderName;
            this.setState({
                drawerVisible: true,
                drawerTitle,
                drawerId: skipId,
            });
        }
    }

    render() {
        let b_height = window.innerHeight-105;
        let c_height = window.innerHeight-170;
        let { affairData,selectedId,searchVisible,pdfAffairId,imgSrc,albumBorwerArr, drawerVisible, drawerTitle, drawerId } = this.state;
        const s = (a,b) => {
            return a.viewOrder - b.viewOrder;
        }
        affairData = affairData.sort(s);
        return (
            <div>
                <div className="demo-infinite-container" style={{paddingRight: 10,height: b_height,display: 'flex'}}>
                    <div className={'leftBar'} style={{width: 250}}>
                        <div style={{borderTop: "1px solid #e8e8e8",width: 250,height: b_height,overflow: 'auto'}}>
                            <List
                                dataSource={affairData}
                                itemLayout={"vertical"}
                                renderItem={item => (
                                    <List.Item key={item.uuid}
                                        className={'l_list'}
                                        id={'_'+item.uuid}
                                        style={{paddingLeft: 10,cursor: 'pointer',width: '100%',position: 'relative'}}
                                        onClick={() => this.affairClick(item)}
                                        actions={this.movePosition(item)}
                                    >
                                        <List.Item.Meta
                                            title={
                                                    <div style={{overflow: 'hidden',whiteSpace: 'nowrap',textOverflow: 'ellipsis'}}>
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
                            { !this.isMemberMsg && <TabPane tab="资源" key="3">
                                <div style={{height: c_height,overflow: 'auto'}}>
                                    {this.pullResourse(c_height)}
                                </div>
                            </TabPane> }
                            {this.createMsg(c_height)}
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
                <PhotoLooker albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={this.canRenderPhoto}></PhotoLooker>
                { drawerVisible && <Drawer
					title={drawerTitle}
					width={600}
					placement="right"
					closable={false}
					onClose={() => this.setState({ drawerVisible: false })}
					visible={drawerVisible}
				>
					<MemberMsgList open_id={drawerId}></MemberMsgList>
                </Drawer> }
            </div>
        );
    }
}

export default MemberAffairs;