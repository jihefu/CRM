import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover,Tree,Popconfirm,Switch } from 'antd';
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

class softProjectCls extends Component {
    constructor(props){
        super(props);
        this.renderTree = this.renderTree.bind(this);
        this.treeOnSelect = this.treeOnSelect.bind(this);
        this.tableColumns = this.tableColumns.bind(this);
        this.changeStar = this.changeStar.bind(this);
        this.treeTypeChange = this.treeTypeChange.bind(this);
    }

    state = {
        showCls: true,
        fetchProjectUrl: '/softProject/getListByProjectTitle',
        treeCollection: {},
        devTreeCollection: [],
        projectArr: [],
        selectV: [0]
    };

    componentDidMount() {
        this.fetchClsList();
        this.fetchDevList();
    }

    fetchClsList() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/getClsList'))
            .set("token",token)
            .end((err,res) => {
                if (err) return;
                this.setState({
                    treeCollection: res.body.data
                },() => {
                    this.treeOnSelect([0]);
                });
            });
    }

    fetchDevList() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/softProject/developList'))
            .set("token",token)
            .end((err,res) => {
                if (err) return;
                this.setState({
                    devTreeCollection: res.body.data
                });
            });
    }

    treeTypeChange(v) {
        this.setState({
            showCls: !v,
            fetchProjectUrl: v ? '/softProject/getListByDevelop' : '/softProject/getListByProjectTitle',
            selectV: [0],
        });
    }

    // 渲染树
    renderTree() {
        const { treeCollection, showCls, devTreeCollection } = this.state;
        if (showCls) {
            const firstClsArr = [],secondClsArr = [];
            for(let key in treeCollection) {
                firstClsArr.push(key);
                treeCollection[key] = treeCollection[key].filter(items => items);
                secondClsArr.push(treeCollection[key]);
            }
            const resArr = firstClsArr.map((items,index) => {
                return <TreeNode title={items} key={'1-'+items}>
                            {
                                secondClsArr[index].map(it => <TreeNode title={it} key={'2-'+it} />)
                            }
                        </TreeNode>;
            });
            return resArr;
        }
        const resArr = devTreeCollection.map((items,index) => {
            return <TreeNode title={items.user_name} key={items.user_id} />;
        });
        return resArr;
    }

    // 树节点被选中
    treeOnSelect(val) {
        const { fetchProjectUrl, showCls } = this.state;
        if(val.length==0) return;
        this.setState({
            selectV: val
        });
        let v = val[0];
        let params = {};
        if (showCls) {
            params = {
                listLevel: 0,
                clsName: ''
            };
            if(v!=0){
                params.listLevel = v.split('-')[0];
                params.clsName = v.split('-')[1];
            }
        } else {
            params = {
                develop: v,
            };
        }
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl(this.state.fetchProjectUrl))
            .set("token",token)
            .query(params)
            .end((err,res) => {
                if (err) return;
                this.setState({
                    projectArr: res.body.data
                });
            });
    }

    fileInfoTitle(row){
        const { projectTitle, softPackageSize, softVersionNo } = row;
        return <div>
            <div>
                <span>工程标题：</span>
                <span>{projectTitle}</span>
            </div>
            <div>
                <span>版本号：</span>
                <span>{softVersionNo}</span>
            </div>
            <div>
                <span>文件大小：</span>
                <span>{(softPackageSize/1024/1024).toFixed(2)}MB</span>
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
                title: '工程名', dataIndex: 'projectId', key: 'projectId', width: 150,render: (text, row, index) => {
                    return <div style={{cursor: 'pointer'}} onClick={() => {
                        hashHistory.push({
                            pathname: '/softVersionList',
                            state: row['id']
                        });
                    }}>{row['projectId']}</div>;
                }
            },
            {
                title: '工程标题', dataIndex: 'projectTitle', key: 'projectTitle', width: 250,render: (text, row, index) => {
                    return <div style={{cursor: 'pointer'}} onClick={() => {
                        hashHistory.push({
                            pathname: '/softVersionList',
                            state: row['id']
                        });
                    }}>{row['projectTitle']}</div>;
                }
            },
            {
                title: '二级类', dataIndex: 'secondCls', key: 'secondCls', width: 100,
            },
            {
                title: '最新版本', dataIndex: 'softVersionNo', key: 'softVersionNo', width: 100,
            },
            {
                title: '发布时间', dataIndex: 'time', key: 'time', width: 180, render: (text, row, index) => {
                    if(row['time']){
                        return <div>{moment(row['time']).format('YYYY-MM-DD HH:mm:ss')}</div>;
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
                                    window.open(common.staticBaseUrl('/notiClient/'+row['softPackage']));
                                }} okText="下载" cancelText="取消">
                                    <a href="javascript:void(0);" style={{marginLeft: 10}}>下载</a>
                                </Popconfirm>
                                <a href="javascript:;" onClick={() => {
                                    hashHistory.push({
                                        pathname: '/softVersionList',
                                        state: row['id']
                                    });
                                }} style={{marginLeft: 10}}>查看</a>
                            </div>
            }
        ];
        return columns;
    }

    changeStar(row) {
        let { isStar, projectId, id } = row;
        isStar = isStar==1 ? 0 : 1;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/softProject/isStar'))
            .set("token",token)
            .send({
                isStar,
                id,
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
                        <div style={{padding: 5}}>
                            <Switch onChange={this.treeTypeChange} />
                            <span style={{position: 'relative', left: 6, top: 1}}>显示开发者列表</span>
                        </div>
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
                        <Button onClick={() => {
                            hashHistory.push({
                                pathname: '/softProjectCreate'
                            });
                        }} style={{margin: 6}}>创建新工程</Button>
                        <Table columns={this.tableColumns()} scroll={{x: 1200, y: h-90}} dataSource={projectArr} pagination={false} />
                    </div>
                </div>
    }
}

export default softProjectCls;