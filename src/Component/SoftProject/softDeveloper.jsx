import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Tree,Popconfirm } from 'antd';
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
const { TreeNode } = Tree;

class softDeveloper extends Component {
    constructor(props){
        super(props);
        this.renderTree = this.renderTree.bind(this);
        this.treeOnSelect = this.treeOnSelect.bind(this);
        this.tableColumns = this.tableColumns.bind(this);
        this.changeStar = this.changeStar.bind(this);
    }

    state = {
        treeCollection: [],
        projectArr: [],
        selectV: [0]
    };

    componentDidMount() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/developList'))
            .set("token",token)
            .end((err,res) => {
                if (err) return;
                this.setState({
                    treeCollection: res.body.data
                },() => {
                    this.treeOnSelect(this.state.selectV);
                });
            });
    }

    // 渲染树
    renderTree() {
        const { treeCollection } = this.state;
        const resArr = treeCollection.map((items,index) => {
            return <TreeNode title={items.user_name} key={items.user_id} />;
        });
        return resArr;
    }

    // 树节点被选中
    treeOnSelect(val) {
        if(val.length==0) return;
        this.setState({
            selectV: val
        });
        let v = val[0];
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getListByDevelop'))
            .set("token",token)
            .query({
                develop: v
            })
            .end((err,res) => {
                if (err) return;
                this.setState({
                    projectArr: res.body.data
                });
            });
    }

    fileInfoTitle(row){
        const { projectTitle, packageSize, versionNo } = row;
        return <div>
            <div>
                <span>工程标题：</span>
                <span>{projectTitle}</span>
            </div>
            <div>
                <span>版本号：</span>
                <span>{versionNo}</span>
            </div>
            <div>
                <span>文件大小：</span>
                <span>{(packageSize/1024/1024).toFixed(2)}MB</span>
            </div>
        </div>;
    }

    tableColumns() {
        const w = $('.ant-layout-content').width();
        let maxWidth = 200;
        if(w>1300&&w<1600){
            maxWidth = 300;
        }else if(w>1600){
            maxWidth = 600;
        }
        const renderStar = (row) => {
            if(row['isStar']==1){
                return <Icon onClick={() => this.changeStar(row)} type="star" />
            }else{
                return <Icon onClick={() => this.changeStar(row)} type="star" style={{color: '#999'}} />
            }
        }
        const columns = [
            {
                title: '工程名', dataIndex: 'projectNameId', key: 'projectNameId', width: 150,render: (text, row, index) => {
                    return <div style={{cursor: 'pointer'}} onClick={() => {
                        hashHistory.push({
                            pathname: '/softVersionListDev',
                            state: row['projectId']
                        });
                    }}>{row['projectNameId']}</div>;
                }
            },
            {
                title: '工程标题', dataIndex: 'projectTitle', key: 'projectTitle', width: 250,render: (text, row, index) => {
                    return <div style={{cursor: 'pointer'}} onClick={() => {
                        hashHistory.push({
                            pathname: '/softVersionListDev',
                            state: row['projectId']
                        });
                    }}>{row['projectTitle']}</div>;
                }
            },
            {
                title: '开发团队', dataIndex: 'developTeamName', key: 'developTeamName', width: 150, render: (text, row, index) => {
                    return <p style={{width: 100,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                <Tooltip placement="top" title={row['developTeamName']}>
                                    {row['developTeamName']}
                                </Tooltip>
                            </p>
                }
            },
            {
                title: '最新版本', dataIndex: 'versionNo', key: 'versionNo', width: 100,
            },
            {
                title: '发布时间', dataIndex: 'createTime', key: 'createTime', width: 180, render: (text, row, index) => {
                    if(row['createTime']){
                        return <div>{moment(row['createTime']).format('YYYY-MM-DD HH:mm:ss')}</div>;
                    }else{
                        return <div></div>;
                    }
                }
            },
            {
                title: '更新摘要', dataIndex: 'updateSummary', key: 'updateSummary', render: (text, row, index) => {
                    const summary = row['updateSummary'];
                    return <p style={{maxWidth: maxWidth,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                                <Tooltip placement="top" title={summary}>
                                    {summary}
                                </Tooltip>
                            </p>
                }
            },
            {
                title: '操作',
                key: 'operation',
                width: 150,
                fixed: 'right',
                render: (text, row, index) => <div>
                                <a href="javascript:;">{renderStar(row)}</a>
                                <Popconfirm placement="bottomRight" title={this.fileInfoTitle(row)} onConfirm={() => {
                                    window.open(common.staticBaseUrl('/notiClient/'+row['package']));
                                }} okText="下载" cancelText="取消">
                                    <a href="javascript:void(0);" style={{marginLeft: 10}}>下载</a>
                                </Popconfirm>
                                <a href="javascript:;" onClick={() => {
                                    hashHistory.push({
                                        pathname: '/softVersionListDev',
                                        state: row['projectId']
                                    });
                                }} style={{marginLeft: 10}}>查看</a>
                            </div>
            }
        ];
        return columns;
    }

    changeStar(row) {
        let { isStar, projectId } = row;
        isStar = isStar==1 ? 0 : 1;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/softProject/isStar'))
            .set("token",token)
            .send({
                isStar,
                id: projectId
            })
            .end((err,res) => {
                if (err) return;
                message.success(res.body.msg);
                this.treeOnSelect(this.state.selectV);
            });
    }
    
    render() {
        const h = $('.ant-layout-content').height();
        const { projectArr } = this.state;
        return <div style={{height: h,display: 'flex'}}>
                    <div style={{width: 200,height: h,borderRight: '1px solid #f0f2f5'}}>
                        <Tree
                            showLine
                            defaultExpandedKeys={['0']}
                            defaultSelectedKeys={['0']}
                            onSelect={this.treeOnSelect}
                        >
                            <TreeNode title={'全部'} key={'0'}>
                                {this.renderTree()}
                            </TreeNode>
                        </Tree>
                    </div>
                    <div style={{flex: 1, overflow: 'auto'}}>
                        <Table columns={this.tableColumns()} scroll={{x: 1200, y: h-40}} dataSource={projectArr} pagination={false} />
                    </div>
                </div>
    }
}

export default softDeveloper;