import React from 'react';
import Linq from 'linq';
import { Icon,Divider,Input,message, Button, Popconfirm, Modal } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common.js';

const obj = {
    summary: (params, isDirector) => {

        //队员可见
        const teamSecret = (secret) => {
            if(secret==1){
                return '是';
            }else{
                return '否';
            }
        }

        //关联事务
        const supRelativeAffair = (data) => {
            const resArr = [];
            data.supRelativeAffair.forEach((items,index) => {
                resArr.push(items.name);
            });
            return resArr.join();
        }

        //立项事务
        const projectSummary = () => {
            return <div>
                        <p>
                            <span>事务名称：</span>
                            <span>{params.name}</span>
                        </p>
                        <p>
                            <span>优先级：</span>
                            <span>{params.priority}</span>
                        </p>
                        <p>
                            <span>状态：</span>
                            <span>{params.state}</span>
                            { isDirector && <Popconfirm placement="topLeft" title={'确定关闭当前事务？'} onConfirm={() => {
                                const token = sessionStorage.getItem('token');
                                request.put(common.baseUrl('/affair/update'))
                                    .set("token", token)
                                    .send({
                                        form_data: JSON.stringify({
                                            state: '关闭',
                                            uuid: params.uuid,
                                        }),
                                    })
                                    .end((err, res) => {
                                        if (err) return;
                                        message.success('操作成功');
                                        request.get(common.baseUrl('/getTargetAffairSupAndSub/'+params.uuid))
                                            .set("token", token)
                                            .end((err, res) => {
                                                if (err) return;
                                                let { that, affairData } = params;
                                                affairData.forEach((items,index) => {
                                                    if(items.uuid==params.uuid){
                                                        affairData[index] = res.body.data;
                                                    }
                                                });
                                                affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                                                that.setState({
                                                    affairData
                                                });
                                            });
                                    });
                            }} okText="Yes" cancelText="No">
                                <Button style={{marginLeft: 10}} size={'small'}>关闭</Button>
                            </Popconfirm> }
                            { isDirector && params.state == '草拟' && <Button size={'small'} style={{marginLeft: 6}} onClick={() => {
                                const token = sessionStorage.getItem('token');
                                request.put(common.baseUrl('/affair/update'))
                                    .set("token", token)
                                    .send({
                                        form_data: JSON.stringify({
                                            state: '进行中',
                                            uuid: params.uuid,
                                        }),
                                    })
                                    .end((err, res) => {
                                        if (err) return;
                                        message.success('操作成功');
                                        request.get(common.baseUrl('/getTargetAffairSupAndSub/'+params.uuid))
                                            .set("token", token)
                                            .end((err, res) => {
                                                if (err) return;
                                                let { that, affairData } = params;
                                                affairData.forEach((items,index) => {
                                                    if(items.uuid==params.uuid){
                                                        affairData[index] = res.body.data;
                                                    }
                                                });
                                                affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                                                that.setState({
                                                    affairData
                                                });
                                            });
                                    });
                            }}>切换到进行中</Button> }
                        </p>
                        <p>
                            <span>事务发布人：</span>
                            <span>{params.insert_person_name}</span>
                        </p>
                        {/* <p>
                            <span>工作团队：</span>
                            <span>{params.teamName}</span>
                        </p> */}
                        <p>
                            <span>是否保密：</span>
                            <span>{teamSecret(params.secret)}</span>
                        </p>
                        <p>
                            <span>项目背景：</span>
                            <span>{params.ProjectAffairs[0].background}</span>
                        </p>
                        <p>
                            <span>目标描述：</span>
                            <span>{params.ProjectAffairs[0].target}</span>
                        </p>
                        <p>
                            <span>最后期限：</span>
                            <span>{params.ProjectAffairs[0].deadline}</span>
                        </p>
                        <p>
                            <span>关联事务：</span>
                            <span>{supRelativeAffair(params)}</span>
                        </p>
                        <p>
                            <span>关注的员工：</span>
                            <span>{params.attentionStaffName}</span>
                        </p>
                        <p>
                            <span>整体完成度：</span>
                            <span>{params.ProjectAffairs[0].completionDegree}%</span>
                            { isDirector && params.ProjectAffairs[0].completionDegree === 90 && <Button onClick={() => {
                                Modal.confirm({
                                    title: '完成总结',
                                    icon: <span></span>,
                                    content: <Input.TextArea rows={3} name={'summary'} />,
                                    onOk() {
                                        const summary = $('textarea[name=summary]').val();
                                        if (!summary) return;
                                        const par = {
                                            class: 'completeConfirm',
                                            frontUrl: window.location.href.split('#')[1].split('?')[0],
                                            title: params.name,
                                            content: '立项事务已完成',
                                            votes: '已阅',
                                            subscriber: params.insert_person,
                                            atSomeone: params.insert_person,
                                            noti_client_affair_group_uuid: params.uuid,
                                        }
                                        const token = sessionStorage.getItem('token');
                                        request.put(common.baseUrl('/projectAffair/update'))
                                            .set("token", token)
                                            .send({
                                                form_data: JSON.stringify({
                                                    summary,
                                                    noti_client_affair_group_uuid: params.uuid,
                                                }),
                                                par: JSON.stringify(par)
                                            })
                                            .end((err, res) => {
                                                if (err) return;
                                                message.success(res.body.msg);
                                            });
                                    },
                                    onCancel() {},
                                });
                            }} type="primary" size={'small'} style={{marginLeft: 10}}>完成总结</Button>}
                        </p>
                        <p>
                            <span>赏金：</span>
                            <span>{params.ProjectAffairs[0].reward}</span>
                        </p>
                        {/* <p>
                            <span>完成总结：</span>
                            <span>{params.ProjectAffairs[0].summary}</span>
                        </p> */}
                    </div>
        }

        //小事务
        const smallSummary = () => {
            return <div>
                        <p>
                            <span>事务名称：</span>
                            <span>{params.name}</span>
                        </p>
                        <p>
                            <span>优先级：</span>
                            <span>{params.priority}</span>
                        </p>
                        <p>
                            <span>状态：</span>
                            <span>{params.state}</span>
                            { isDirector && <Popconfirm placement="topLeft" title={'确定关闭当前事务？'} onConfirm={() => {
                                const token = sessionStorage.getItem('token');
                                request.put(common.baseUrl('/affair/update'))
                                    .set("token", token)
                                    .send({
                                        form_data: JSON.stringify({
                                            state: '关闭',
                                            uuid: params.uuid,
                                        }),
                                    })
                                    .end((err, res) => {
                                        if (err) return;
                                        message.success('操作成功');
                                        request.get(common.baseUrl('/getTargetAffairSupAndSub/'+params.uuid))
                                            .set("token", token)
                                            .end((err, res) => {
                                                if (err) return;
                                                let { that, affairData } = params;
                                                affairData.forEach((items,index) => {
                                                    if(items.uuid==params.uuid){
                                                        affairData[index] = res.body.data;
                                                    }
                                                });
                                                affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                                                that.setState({
                                                    affairData
                                                });
                                            });
                                    });
                            }} okText="Yes" cancelText="No">
                                <Button style={{marginLeft: 10}} size={'small'}>关闭</Button>
                            </Popconfirm> }
                            { isDirector && params.state == '草拟' && <Button size={'small'} style={{marginLeft: 6}} onClick={() => {
                                const token = sessionStorage.getItem('token');
                                request.put(common.baseUrl('/affair/update'))
                                    .set("token", token)
                                    .send({
                                        form_data: JSON.stringify({
                                            state: '进行中',
                                            uuid: params.uuid,
                                        }),
                                    })
                                    .end((err, res) => {
                                        if (err) return;
                                        message.success('操作成功');
                                        request.get(common.baseUrl('/getTargetAffairSupAndSub/'+params.uuid))
                                            .set("token", token)
                                            .end((err, res) => {
                                                if (err) return;
                                                let { that, affairData } = params;
                                                affairData.forEach((items,index) => {
                                                    if(items.uuid==params.uuid){
                                                        affairData[index] = res.body.data;
                                                    }
                                                });
                                                affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                                                that.setState({
                                                    affairData
                                                });
                                            });
                                    });
                            }}>切换到进行中</Button> }
                        </p>
                        <p>
                            <span>事务发布人：</span>
                            <span>{params.insert_person_name}</span>
                        </p>
                        {/* <p>
                            <span>工作团队：</span>
                            <span>{params.teamName}</span>
                        </p> */}
                        <p>
                            <span>是否保密：</span>
                            <span>{teamSecret(params.secret)}</span>
                        </p>
                        <p>
                            <span>事由：</span>
                            <span>{params.SmallAffairs[0].cause}</span>
                        </p>
                        <p>
                            <span>最后期限：</span>
                            <span>{params.SmallAffairs[0].deadline}</span>
                        </p>
                        <p>
                            <span>关联事务：</span>
                            <span>{supRelativeAffair(params)}</span>
                        </p>
                        <p>
                            <span>关注的员工：</span>
                            <span>{params.attentionStaffName}</span>
                        </p>
                        <p>
                            <span>整体完成度：</span>
                            <span>{params.SmallAffairs[0].completionDegree}%</span>
                            { isDirector && params.SmallAffairs[0].completionDegree === 90 && <Button onClick={() => {
                                Modal.confirm({
                                    title: '完成总结',
                                    icon: <span></span>,
                                    content: <Input.TextArea rows={3} name={'summary'} />,
                                    onOk() {
                                        const summary = $('textarea[name=summary]').val();
                                        if (!summary) return;
                                        const par = {
                                            class: 'completeConfirm',
                                            frontUrl: window.location.href.split('#')[1].split('?')[0],
                                            title: params.name,
                                            content: '小事务已完成',
                                            votes: '已阅',
                                            subscriber: params.insert_person,
                                            atSomeone: params.insert_person,
                                            noti_client_affair_group_uuid: params.uuid,
                                        }
                                        const token = sessionStorage.getItem('token');
                                        request.put(common.baseUrl('/smallAffair/update'))
                                            .set("token", token)
                                            .send({
                                                form_data: JSON.stringify({
                                                    summary,
                                                    noti_client_affair_group_uuid: params.uuid,
                                                }),
                                                par: JSON.stringify(par)
                                            })
                                            .end((err, res) => {
                                                if (err) return;
                                                message.success(res.body.msg);
                                            });
                                    },
                                    onCancel() {},
                                });
                            }} type="primary" size={'small'} style={{marginLeft: 10}}>完成总结</Button>}
                        </p>
                        {/* <p>
                            <span>完成总结：</span>
                            <span>{params.SmallAffairs[0].summary}</span>
                        </p> */}
                    </div>
        }

        if(params.ProjectAffairs.length==0){
            //小事务
            return smallSummary();
        }else{
            //立项事务
            return projectSummary();
        }
    },

    progress: (params) => {
        const user_id = sessionStorage.getItem('user_id');
        const { selectedIdDataArr,affairData,selectedIdData,staffData,that } = params;
        //队员编辑按钮
        const memberShowEdit = (data) => {
            let editable = false;
            let self = false;
            let isDirectorAndSelf = false;
            let teamDirector;
            try{
                teamDirector = selectedIdData[0].team.split(',')[0];
            }catch(e){}
            if(data.member==user_id||teamDirector==user_id||selectedIdData[0].insert_person==user_id){
                editable = true;
            }
            if(data.member==user_id) self = true;
            if(data.member==user_id&&teamDirector==user_id) isDirectorAndSelf = true;
            if(editable){
                return <p style={{color: '#1890ff',cursor: 'pointer'}} onClick={() => that.memberEditAffair(data,self,isDirectorAndSelf) }>
                            <Icon type="form" />
                            <span style={{marginLeft: 8}}>编辑</span>
                        </p>
            }
        }

        //各队员进度
        const progress = (data) => {
            const resArr = [];
            data.ProjectAffairs[0].ProjectAffairProgresses.forEach((items,index) => {
                const member = Linq.from(staffData).where(x => {
                    return x.user_id == items.member;
                }).toArray()[0]['user_name'];
                resArr.push(<div key={items.id}>
                    <Divider />
                    { memberShowEdit(items) }
                    <p>
                        <span>成员：</span>
                        <span>{member}</span>
                    </p>
                    <p>
                        <span>分工目标：</span>
                        <span>{items.division}</span>
                    </p>
                    <p>
                        <span>最新进展：</span>
                        <span>{items.news}</span>
                    </p>
                    <p>
                        <span>完成度：</span>
                        <span>{items.degree}%</span>
                    </p>
                </div>);
            });
            return resArr;
        }

        try{
            return progress(selectedIdDataArr);
        }catch(e){

        }
    },

    formLabel: (params) => {
        try{
            return [
                <label style={{display:'flex',marginTop: 10}}>
                    <span style={{width:'85px'}}>项目背景：</span>
                    <Input name={"background"} style={{flex:1}} defaultValue={params.ProjectAffairs[0].background} />
                </label>,
                <label style={{display:'flex',marginTop: 10}}>
                    <span style={{width:'85px'}}>目标描述：</span>
                    <Input name={"target"} style={{flex:1}} defaultValue={params.ProjectAffairs[0].target} />
                </label>
            ]
        }catch(e){
            return [
                <label style={{display:'flex',marginTop: 10}}>
                    <span style={{width:'85px'}}>事由：</span>
                    <Input name={"cause"} style={{flex:1}} defaultValue={params.SmallAffairs[0].cause} />
                </label>
            ]
        }
    },

    subAffairInfo: (params) => {
        const user_id = sessionStorage.getItem('user_id');
        const token = sessionStorage.getItem('token');
        let { in_affair_type,affairFormData,smallBaseAffairFormData,projectAffairFormData,
            smallAffairFormData,groupMemberFormData,par,selectedId,that,affairData } = params;

        const subProjectData = () => {
    
            const _p = [];
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
            // _p[2] = new Promise((resolve,reject) => {
            //     request.put(common.baseUrl('/affair/changeProjectTeamMember'))
            //         .set("token", token)
            //         .send({
            //             form_data: JSON.stringify(groupMemberFormData)
            //         })
            //         .end((err, res) => {
            //             if (err) return;
            //             resolve();
            //         });
            // });
            Promise.all(_p).then(result => {
                message.success('操作成功');
                request.get(common.baseUrl('/getTargetAffairSupAndSub/'+selectedId))
                    .set("token", token)
                    .end((err, res) => {
                        if (err) return;
                        affairData.forEach((items,index) => {
                            if(items.uuid==selectedId){
                                affairData[index] = res.body.data;
                            }
                        });
                        affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                        that.setState({
                            affairData
                        });
                    });
            }).catch(result => {
                message.error(result);
            });
        }

        const subSmallData = () => {
            const _p = [];

            _p[0] = new Promise((resolve,reject) => {
                request.put(common.baseUrl('/affair/update'))
                    .set("token", token)
                    .send({
                        form_data: JSON.stringify(smallBaseAffairFormData)
                    })
                    .end((err, res) => {
                        if (err) return;
                        resolve();
                    });
            });
            _p[1] = new Promise((resolve,reject) => {
                request.put(common.baseUrl('/smallAffair/update'))
                    .set("token", token)
                    .send({
                        form_data: JSON.stringify(smallAffairFormData),
                        par: JSON.stringify(par)
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
                                affairData[index] = res.body.data;
                            }
                        });
                        affairData = affairData.filter(items => items.state != '已完成' && items.state != '关闭');
                        that.setState({
                            affairData
                        });
                    });
            }).catch(result => {
                message.error(result);
            });
        }

        if(in_affair_type=='project'){
            par.content = '立项事务已完成';
            subProjectData();
        }else if(in_affair_type=='small'){
            par.content = '临时小事务已完成';
            subSmallData();
        }
    }
};

const renderTemp = (temp,params, isDirector) => {
    return obj[temp](params, isDirector);
}

export default renderTemp;