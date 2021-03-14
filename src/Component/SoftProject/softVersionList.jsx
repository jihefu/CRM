import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Tree,Popconfirm,Modal,Radio } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import CustomerRemoteSelect from '../Customers/CustomerRemoteSelect';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const { TreeNode } = Tree;
const { TextArea } = Input;
const RadioGroup = Radio.Group;

class softVersionList extends Component {
    constructor(props){
        super(props);
        this.leaveMsg = this.leaveMsg.bind(this);
        this.projectPropertyArr = [
            {
                name: 'projectId',
                label: '工程名'
            },
            {
                name: 'projectTitle',
                label: '工程标题'
            },
            {
                name: 'latestVersion',
                label: '最新版'
            },
            {
                name: 'ltsVersion',
                label: '稳定版'
            },
            {
                name: 'firstCls',
                label: '一级分类'
            },
            {
                name: 'secondCls',
                label: '二级分类'
            },
            {
                name: 'usage',
                label: '用途'
            },
            {
                name: 'developTeam',
                label: '开发团队'
            },
            {
                name: 'createTime',
                label: '立项时间'
            },
            {
                name: 'dependOtherProject',
                label: '引用其它工程'
            },
            {
                name: 'tags',
                label: '标签'
            },
            {
                name: 'IDE',
                label: '开发工具'
            },
            {
                name: 'lang',
                label: '编程语言'
            },
            {
                name: 'runType',
                label: '目标运行分类'
            },
            {
                name: 'album',
                label: '主要截图'
            },
            {
                name: 'relatedAffair',
                label: '关联事务'
            },
            {
                name: 'document',
                label: '相关文档'
            }
        ]
    }

    state = {
        projectProperty: {},
        versionList: [],
        typeArr: ['1202', '1204'],
        showShare: false,
        fileId: 0,
    };

    componentDidMount(){
        let projectId = this.props.location.state;
        this.setState({
            soft_project_id: projectId
        },() => {
            this.fetch();
            this.getPropertyBySoftProjectId();
        });
    }

    getPropertyBySoftProjectId() {
        const { soft_project_id } = this.state;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getPropertyBySoftProjectId'))
            .set("token",token)
            .query({
                soft_project_id
            })
            .end((err,res) => {
                if(err) return;
                this.setState({
                    projectProperty: res.body.data
                });
            });
    }

    fetch() {
        const { soft_project_id, typeArr } = this.state;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getVersionListById'))
            .set("token",token)
            .query({
                soft_project_id,
                typeArr: JSON.stringify(typeArr),
            })
            .end((err,res) => {
                if(err) return;
                const versionList = res.body.data;
                versionList.forEach((items, index) => {
                    for (const key in items.subContent) {
                        versionList[index][key] = items.subContent[key];
                    }
                });
                this.setState({
                    versionList,
                });
            });
    }

    renderProperty() {
        const { projectProperty } = this.state;
        // const w = $('.ant-layout-content').width();
        return this.projectPropertyArr.map(items => {
            let v = projectProperty[items.name];
            if(items.name!='document'){
                if(items.name=='createTime'){
                    v = moment(v).format('YYYY-MM-DD');
                }else if(items.name=='album') {
                    let albumArr;
                    try{
                        albumArr = v.split(',').filter(items => items);
                    }catch(e){
                        albumArr = [];
                    }
                    v = albumArr.map(items => <a style={{marginRight: 10}} target={'_blank'} href={common.staticBaseUrl('/img/notiClient/'+items)}>
                                                <img src={common.staticBaseUrl('/img/notiClient/small_'+items)} />
                                            </a>);
                }else if(items.name=='document'){
                    v = '';
                    // let documentArr;
                    // try{
                    //     documentArr = v.split(',').filter(items => items);
                    // }catch(e){
                    //     documentArr = [];
                    // }
                    // v = documentArr.map(items => <a style={{marginRight: 10}} target={'_blank'} href={common.staticBaseUrl('/projectFile/'+items)}>{items}</a>);
                }
                return <div style={{width: '33%',display: 'flex',paddingLeft: 6,paddingRight: 6}}>
                            <p>{items.label}：</p>
                            <p title={typeof(v)=='object'?'':v} style={{"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>{v}</p>
                        </div>
            }
        })
    }

    documentRender() {
        const { projectProperty } = this.state;
        return this.projectPropertyArr.map(items => {
            let v = projectProperty[items.name];
            if(items.name=='document'){
                let documentArr;
                try{
                    documentArr = v.split(',').filter(items => items);
                }catch(e){
                    documentArr = [];
                }
                return documentArr.map(items => <a style={{display: 'block'}} target={'_blank'} href={common.staticBaseUrl('/projectFile/'+items)}>{items}</a>);
            }
        });
    }

    tableColumns() {
        const self = this;
        const w = $('.ant-layout-content').width();
        let maxWidth = 200;
        const { typeArr } = this.state;
        let columns = [{
            title: '执行人', dataIndex: 'person', width: 100,
        }, {
            title: '执行时间', dataIndex: 'time', width: 180, render: (text, row, index) => {
                if(row['time']){
                    return <div>{moment(row['time']).format('YYYY-MM-DD HH:mm:ss')}</div>;
                }else{
                    return <div></div>;
                }
            },
        }, {
            title: '执行类型', dataIndex: 'type', width: 100,
        }];
        if (typeArr.length === 1 || (typeArr.length === 2 && typeArr.includes('1202') && typeArr.includes('1204'))) {
            if (typeArr[0] == '1201') {
                maxWidth = w-550;
                columns[0].title = '发言人';
                columns[1].title = '发言时间';
                columns.pop();
                columns.push({title: '针对版本', dataIndex: 'rem', width: 150});
                columns.push({
                    title: '内容', dataIndex: 'softContent', render: (text, row, index) => {
                        const content = row['softContent'];
                        return <p title={content} style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                    {content}
                                </p>
                    }
                });
            } else if (typeArr[0] == '1202' || typeArr[0] == '1204') {
                maxWidth = w-700;
                columns[0].title = '上传人';
                columns[1].title = '上传时间';
                columns.pop();
                columns.push({ title: '版本号', dataIndex: 'softVersionNo', width: 100, render: (text, row, index) => {
                    return <a target={'_blank'} href={common.staticBaseUrl('/notiClient/'+row['softPackage'])}>{row['softVersionNo']}</a>;
                }});
                // columns.push({ title: '分版本名', dataIndex: 'softChildVersionName', width: 100 });
                columns.push({ title: '对外发布', dataIndex: 'softIsRelease', width: 100, render: (text, row, index) => {
                    if(row['softIsRelease']) return '是';
                    return '否';
                }});
                columns.push({ title: '测试状态', dataIndex: 'softTestStatus', width: 100, });
                columns.push({ title: '上传说明', dataIndex: 'softCreateDescription', render: (text, row, index) => {
                    const content = row['softCreateDescription'];
                    return <p title={content} style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                {content}
                            </p>
                }});
                columns.push({ title: '操作', key: 'operation', width: 120, render: (text, row, index) => <div>
                    <a href="javascript:void(0);" onClick={() => this.leaveMsg(row)} >发言</a>
                    <a href="javascript:void(0);" style={{marginLeft: 6}} onClick={() => {
                        hashHistory.push({
                            pathname: '/softEvaluationAdd',
                            state: {
                                versionNo: row['rem'],
                                versionId: row['id'],
                                testStatus: row['softTestStatus'],
                                isRelease: row['softIsRelease'],
                                soft_project_id: row['ownerId'],
                                softChildVersionName: row.softChildVersionName,
                                replaceId: row['softReplaceId'],
                            }
                        })
                    }} >测评</a>
                    { row.subContent.softIsRelease && ['关闭', '被替换'].indexOf(row.subContent.softTestStatus) === -1 && <a href="javascript:void(0);" style={{marginLeft: 6}} onClick={() => self.share(row.id)}>分享</a>}
                </div>});
            } else if (typeArr[0] == '1203') {
                maxWidth = w-920;
                columns[0].title = '测评人';
                columns[1].title = '测评时间';
                columns.pop();
                columns.push({title: '针对版本', dataIndex: 'rem', width: 150});
                columns.push({
                    title: '测评内容', dataIndex: 'softContent', render: (text, row, index) => {
                        const content = row['softContent'];
                        return <p title={content} style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                    {content}
                                </p>
                    }
                });
                columns.push({
                    title: '测试状态', dataIndex: 'softChangeTestStatus', width: 150, render: (text, row, index) => {
                        if (row['softChangeTestStatus'].length === 0) return <span>获取失败</span>;
                        if (row['softChangeTestStatus'][0].toString() == row['softChangeTestStatus'][1].toString()) return <span>未改变</span>;
                        return <span>{row['softChangeTestStatus'][0]}->{row['softChangeTestStatus'][1]}</span>
                    }
                });
                columns.push({
                    title: '对外发布', dataIndex: 'softChangeIsRelease', width: 150, render: (text, row, index) => {
                        if (row['softChangeIsRelease'].length === 0) return <span>获取失败</span>;
                        if (row['softChangeIsRelease'][0].toString() == row['softChangeIsRelease'][1].toString()) return <span>未改变</span>;
                        const t1 = row['softChangeIsRelease'][0] == 'true' ? '是' : '否';
                        const t2 = row['softChangeIsRelease'][1] == 'true' ? '是' : '否';
                        return <span>{t1}->{t2}</span>
                    }
                });
                columns.push({
                    title: '测评附件', dataIndex: 'softTestAnnex', width: 200, render: (text, row, index) => {
                        let fileArr;
                        if (row['softTestAnnex']) {
                            try {
                                fileArr = row['softTestAnnex'].split(',').filter(items => items);
                            } catch (e) {
                                fileArr = [];
                            }
                            if (fileArr.length === 0) return;
                            return fileArr.map(items => <a target={'_blank'} href={common.staticBaseUrl('/projectFile/'+items)} style={{marginRight: 6}}>{items}</a>);
                        }
                    }
                });
            }
        } else {
            columns.push({
                title: '执行内容', dataIndex: 'rem', render: (text, row, index) => {
                    const type = row['type'];
                    if (type == '发言') {
                        maxWidth = w-400;
                        const content = '针对版本：'+ row['rem'] +'；内容：' + row['softContent'];
                        return <p title={content} style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                    {content}
                                </p>
                    } else if (type == '测评') {
                        maxWidth = w-400;
                        const content = [];
                        let annex = [], fileArr = [];
                        if (row['softTestAnnex']) {
                            try {
                                fileArr = row['softTestAnnex'].split(',').filter(items => items);
                            } catch (e) {
                                fileArr = [];
                            }
                            if (fileArr.length === 0) return;
                            annex = fileArr.map(items => <a target={'_blank'} href={common.staticBaseUrl('/projectFile/'+items)} style={{marginRight: 6}}>{items}</a>);
                        }
                        content.push(<span>针对版本：{row['rem']}；</span>);
                        content.push(<span>内容：{row['softContent']}；</span>);

                        if (row['softChangeTestStatus'].length !== 0 && ( row['softChangeTestStatus'][0].toString() != row['softChangeTestStatus'][1].toString() )) {
                            content.push(<span>测试状态：{row['softChangeTestStatus'][0]} -> {row['softChangeTestStatus'][1] }；</span>);
                        }

                        if (row['softChangeIsRelease'].length !== 0 && ( row['softChangeIsRelease'][0].toString() != row['softChangeIsRelease'][1].toString() )) {
                            content.push(<span>对外发布：{row['softChangeIsRelease'][0].toString() == 'true' ? '是' : '否'} -> {row['softChangeIsRelease'][1].toString() == 'true' ? '是' : '否' }；</span>);
                        }

                        if (annex.length !== 0) content.push(<span>附件：{annex}；</span>);
                        // return <span>{row['softChangeTestStatus'][0]}->{row['softChangeTestStatus'][1]}</span>

                        return <p style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                    {content}
                                </p>
                    } else if (type == '发布' || type == '分版本') {
                        maxWidth = w-400;
                        const content = <span>版本号：{row['softVersionNo']}；发布说明：{row['softCreateDescription']}
                            ；测试状态：{row['softTestStatus']}；是否对外发布：{row['softIsRelease'] ? '是' : '否'}</span>;
                        return <p style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                    {content}
                                </p>
                    }
                }
            });
        }
        return columns;
    }

    share = softId => {
        this.setState({
            showShare: true,
            fileId: softId,
        });
    }

    changeReleaseStatus(isRelease) {
        if(isRelease==false){
            return '确定对外发布？';
        }else{
            return '确定取消对外发布？';
        }
    }

    subChangeReleaseStatus(isRelease,id) {
        // isRelease = isRelease==0 ? 1 : 0;
        const { soft_project_id } = this.state;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/softProject/changeRelease'))
            .set("token",token)
            .send({
                isRelease: !isRelease,
                id
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    this.fetch();
                }else{
                    message.error(res.body.msg);
                }
            });
    }

    changeTestStatus(status) {
        if (!status) return;
        return <RadioGroup style={{width: 200}} options={[
            '内测', '用户试用', '稳定', '被替换', '关闭'
        ]} className={'testStatus'} defaultValue={status} />
    }

    subChangeTestStatus(id) {
        const v = $('.testStatus input[type=radio]:checked').val();
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/softProject/changeTestStatus'))
            .set("token",token)
            .send({
                testStatus: v,
                id,
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    this.fetch();
                }else{
                    message.error(res.body.msg);
                }
            });
    }

    expandedRowRender(data) {

    }

    leaveMsg(row) {
        const softChildVersionName = row.softChildVersionName;
        const versionNo = row.rem;
        const versionId = row.id;
        Modal.confirm({
            title: '发言',
            content: <TextArea className={'leaveMsg'} rows={3} />,
            okText: '确认',
            cancelText: '取消',
            icon: <Icon type="info-circle" />,
            onOk: () => {
                const v = $('.leaveMsg').val();
                if (!v) {
                    message.error('不能为空');
                    return;
                }
                return new Promise((resolve, reject) => {
                    const { soft_project_id } = this.state;
                    let token = sessionStorage.getItem('token');
                    request.post(common.baseUrl('/softProject/leaveMessage'))
                        .set("token",token)
                        .send({
                            id: soft_project_id,
                            content: v,
                            versionNo,
                            versionId,
                            softChildVersionName,
                        })
                        .end((err,res) => {
                            if(err) return;
                            message.success(res.body.msg);
                            resolve();
                        });
                }).then(() => {
                    this.fetch();
                });
            }
        });
    }

    searchTypeChange = v => {
        v = v.join();
        v = v.split(',').filter(items => items);
        this.setState({
            typeArr: v,
        }, () => this.fetch());
    }

    render(){
        const { versionList, projectProperty, showShare, fileId } = this.state;
        const h = $('.ant-layout-content').height();
        return <div style={{height: h,display: 'flex',flexDirection: 'column'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div>
                            <Button style={{margin: 6}} onClick={() => this.props.history.goBack()}>返回</Button>
                            <Button style={{margin: 6}} onClick={() => {
                                let pathname = '/softVersionCreate';
                                if(window.location.href.split('#')[1].split('?')[0].indexOf('Dev')!=-1) pathname = '/softVersionCreateDev';
                                hashHistory.push({
                                    pathname,
                                    state: {
                                        soft_project_id: projectProperty.id
                                    }
                                })
                            }} >上传新版本</Button>
                            <Button style={{margin: 6}} onClick={() => {
                                let pathname = '/softProjectPropsChange';
                                if(window.location.href.split('#')[1].split('?')[0].indexOf('Dev')!=-1) pathname = '/softProjectPropsChangeDev';
                                hashHistory.push({
                                    pathname,
                                    state: {
                                        projectProperty: projectProperty
                                    }
                                })
                            }}>修改</Button>
                            {/* <Button onClick={() => {
                                hashHistory.push({
                                    pathname: '/softChildVersionCreate',
                                    state: {
                                        soft_project_id: projectProperty.projectId,
                                        id: projectProperty.id,
                                    }
                                })
                            }}>发布分版本名</Button> */}
                        </div>
                        <div style={{paddingTop: 10}}>
                            <CheckboxGroup options={[{label: '发布视图', value: '1202,1204'},{label: '发言视图', value: '1201'},{label: '测评视图', value: '1203'}]} defaultValue={'1202,1204'} onChange={v => this.searchTypeChange(v)} />
                        </div>
                    </div>
                    <div style={{maxHeight: 200,borderBottom: '1px solid #f0f2f5',borderTop: '1px solid #f0f2f5',display: 'flex',overflow: 'auto'}}>
                        <div style={{flex: 3,display: 'flex',flexWrap: 'wrap'}}>
                            {
                                this.renderProperty()
                            }
                        </div>
                        <div style={{flex: 1,overflow: 'auto'}}>
                            <span>相关文档</span>
                            {
                                this.documentRender()
                            }
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <Table columns={this.tableColumns()} dataSource={versionList} />
                    </div>
                    <CustomerRemoteSelect 
                        showShare={showShare}
                        fileIdArr={[fileId]}
                        type={'soft'}
                        close={() => this.setState({ showShare: false })}
                    ></CustomerRemoteSelect>
                </div>
    }
}

export default softVersionList;