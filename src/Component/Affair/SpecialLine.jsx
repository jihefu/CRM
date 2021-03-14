import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { List, message, Spin,Input,Form,Button,Divider, Icon,Popover,Radio,Select,Popconfirm,Tabs,Upload,Table,Tag,DatePicker } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import InfiniteScroll from 'react-infinite-scroller';
import ModalTemp from '../common/Modal.jsx';
import '../../public/css/affairs.css';
import common from '../../public/js/common.js';
import Linq from 'linq';
import AffairsList from './AffairsList';
moment.locale('zh-cn');
const { TextArea } = Input;
const RadioGroup = Radio.Group;
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const Search = Input.Search;

class SpecialLine extends AffairsList {
    constructor(props){
        super(props);
        this.specialLine = 1;
        this.outerContactArr = [];
        this.affairProp.outerContact = [];
        this.affairOuterContactChange = this.affairOuterContactChange.bind(this);
    }

    //@Override
    //初始化
    componentWillReceiveProps(props){
        this.fetchAffair();
        this.fetchAllStaff();
        this.fetchTreeData();
        document.onkeyup = (e) => {
            if(e.keyCode==70){
                this.setState({
                    searchVisible: 'block'
                });
            }
        }
    }

    //获取外部联系人
    fetchAllOuterContact(data){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/customer/'+data.customerId))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                let company = res.body.data.company;
                request.get(common.baseUrl('/member/getRegMemberByCompany'))
                    .set("token", token)
                    .query({
                        company: company
                    })
                    .end((err, res) => {
                        if (err) return;
                        this.outerContactArr = res.body.data;
                    });
                });
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

    //@Override
    editAffair(data){
        // let token = sessionStorage.getItem('token');
        // request.get(common.baseUrl('/customer/'+data.customerId))
        //     .set("token", token)
        //     .end((err, res) => {
        //         if (err) return;
        //         let company = res.body.data.company;
        //         request.get(common.baseUrl('/member/getRegMemberByCompany'))
        //             .set("token", token)
        //             .query({
        //                 company: company
        //             })
        //             .end((err, res) => {
        //                 if (err) return;
                        const children = this.outerContactArr.map(items => 
                            <Option key={items.value} value={items.value}>{items.text}</Option>
                        );
                        let labels,team,outerContact;
                        try{
                            labels = data.RespoAffairs[0].labels.split(',');
                        }catch(e){
                            labels = [];
                        }
                        try{
                            team = data.team.split(',');
                        }catch(e){
                            team = [];
                        }
                        try{
                            outerContact = data.outerContact.split(',');
                        }catch(e){
                            outerContact = [];
                        }
                        let modalText = <div>
                                            <label style={{display:'flex'}}>
                                                <span style={{width:'85px'}}>事务名称：</span>
                                                <Input name={"name"} style={{flex:1}} defaultValue={data.name} />
                                            </label>
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>优先级：</span>
                                                <Select defaultValue={data.priority} onChange={this.affairPriorityChange}>
                                                    <Option value={'紧急'}>紧急</Option>
                                                    <Option value={'重要'}>重要</Option>
                                                    <Option value={'普通'}>普通</Option>
                                                    <Option value={'暂缓'}>暂缓</Option>
                                                </Select>
                                            </label>
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>状态：</span>
                                                <Select defaultValue={data.state} onChange={this.affairStateChange}>
                                                    <Option value={'草拟'}>草拟</Option>
                                                    <Option value={'进行中'}>进行中</Option>
                                                    <Option value={'已完成'}>已完成</Option>
                                                    <Option value={'关闭'}>关闭</Option>
                                                </Select>
                                            </label>
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>是否保密：</span>
                                                <Select defaultValue={data.secret} onChange={this.affairSecretChange}>
                                                    <Option value={1}>是</Option>
                                                    <Option value={0}>否</Option>
                                                </Select>
                                            </label>
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>职责描述：</span>
                                                <Input name={"resposibility"} style={{flex:1}} defaultValue={data.RespoAffairs[0].resposibility} />
                                            </label>
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>关键词：</span>
                                                <Select
                                                    key={1}
                                                    mode="tags"
                                                    style={{flex:1}}
                                                    placeholder="请输入..."
                                                    defaultValue={labels}
                                                    onChange={this.affairLabelsChange}
                                                >
                                                </Select>
                                            </label>
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>工作团队：</span>
                                                <Select
                                                    key={1}
                                                    mode="multiple"
                                                    style={{flex:1}}
                                                    placeholder="请输入..."
                                                    defaultValue={team}
                                                    onChange={this.affairTeamChange}
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
                                            <label style={{display:'flex',marginTop: 10}}>
                                                <span style={{width:'85px'}}>外部联系人：</span>
                                                <Select
                                                    mode="multiple"
                                                    style={{flex:1}}
                                                    placeholder="至少选择一名外部联系人"
                                                    defaultValue={outerContact}
                                                    onChange={this.affairOuterContactChange}
                                                >
                                                    {children}
                                                </Select>
                                            </label>
                                        </div>;
                        this.affairProp = {
                            priority: data.priority,
                            state: data.state,
                            secret: data.secret,
                            labels: labels,
                            team: team,
                            outerContact: outerContact
                        };
                        this.setState({
                            modalText,
                            visible: true
                        });
            //         });
            // });
    }

    //@Override
    handleModalDefine(data){
        const { affairProp } = this;
        let { selectedId,affairData } = this.state;
        let team = affairProp.team;
        let labels = affairProp.labels;
        if(team.length<1){
            message.warn('工作团队人数至少为一人');
            return;
        }else if(data.name==''){
            message.warn('事务名称不能为空');
            return;
        }else if(affairProp.outerContact.length<1){
            message.warn('外部联系人至少为一人');
            return;
        }
        team = team.join();
        labels = labels.join();
        if(labels=='') labels = null;

        const affairFormData = {
            name: data.name,
            priority: affairProp.priority,
            state: affairProp.state,
            secret: affairProp.secret,
            outerContact: affairProp.outerContact.join(),
            uuid: selectedId
        };
        const respoAffairFormData = {
            resposibility: data.resposibility,
            labels: labels,
            noti_client_affair_group_uuid: selectedId
        };
        const groupMemberFormData = {
            team: team,
            branch: '客户关系部',
            uuid: selectedId
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

    affairOuterContactChange(v){
        const { affairProp } = this;
        affairProp.outerContact = v;
        this.affairProp = affairProp;
    }
}

export default SpecialLine;