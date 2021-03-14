import React from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Table,Tooltip,Checkbox,Popover,Popconfirm } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class softwareDynamics extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/softProject/getListByUpdateTime';
        this.options = [
            {
                text: '更新时间',
                value: 'updateTime'
            }
        ];
        this.res_data = {
            projectId: {
                label: '工程名',
                width: 150
            },
            projectTitle: {
                label: '工程标题',
                width: 200
            },
            softVersionNo: {
                label: '版本号',
                width: 100
            },
            // softChildVersionName: {
            //     label: '分版本名',
            //     width: 100
            // },
            person: {
                label: '更新人',
                width: 100
            },
            type: {
                label: '更新类别',
                width: 100
            },
            time: {
                label: '更新时间',
                width: 200
            },
            updateSummary: {
                label: '更新摘要'
            },
            action: {
                label: '操作',
                width: 70
            }
        };
        this.state.pagination.filter = {};
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='time'){
            title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            content = title;
        }else{
            title = row[key];
            content = row[key];
        }
        const w = $('.ant-layout-content').width();
        let maxWidth = 200;
        if(w>1300&&w<1600){
            maxWidth = 300;
        }else if(w>1600){
            maxWidth = 600;
        }
        return <p style={{width: res_data[key]['width']-32,maxWidth: maxWidth,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    inputRender(){
        return <div></div>
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        return <div></div>
    }

    //@override
    tableRender(params) {
        const { columns, data, b_height } = params;
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: 1200, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    onChange={this.handleTableChange} />
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

    childFileInfoTitle(row){
        const { projectTitle, softPackageSize, softVersionNo, softChildVersionName } = row;
        return <div>
            <div>
                <span>工程标题：</span>
                <span>{projectTitle}</span>
            </div>
            <div>
                <span>版本号：</span>
                <span>{softVersionNo}</span>
            </div>
            {/* <div>
                <span>分版本名：</span>
                <span>{softChildVersionName}</span>
            </div> */}
            <div>
                <span>文件大小：</span>
                <span>{(softPackageSize/1024/1024).toFixed(2)}MB</span>
            </div>
        </div>;
    }

    //@Override
    render(){
        let { data } = this.state;
        let res_data = this.res_data;
        let b_height = window.innerHeight-200;
        const columns = [];
        let tableWidth = this.tableWidth;
        for(let key in res_data){
            if(key=='action'){
                let o = {
                    title: res_data[key].label,
                    dataIndex: key,
                    key: key,
                    fixed: 'right',
                    width: res_data[key]['width'],
                    render: (text, row, index) => {
                        if (row['type'] == '发布') {
                            return <Popconfirm placement="bottomRight" title={this.fileInfoTitle(row)} onConfirm={() => {
                                window.open(common.staticBaseUrl('/notiClient/'+row['softPackage']));
                            }} okText="下载" cancelText="取消">
                                <a href="javascript:void(0);">下载</a>
                            </Popconfirm>
                        } 
                        // else if (row['type'] == '分版本') {
                        //     return (
                        //         <Popconfirm placement="bottomRight" title={this.childFileInfoTitle(row)} onConfirm={() => {
                        //             window.open(common.staticBaseUrl('/notiClient/'+row['softPackage']));
                        //         }} okText="下载" cancelText="取消">
                        //             <a href="javascript:void(0);">下载</a>
                        //         </Popconfirm>
                        //     );
                        // }
                    }
                };
                columns.push(o);
            }else{
                tableWidth += res_data[key]['width'];
                let o = {
                    title: res_data[key].label,
                    dataIndex: key,
                    key: key,
                    width: res_data[key]['width'],
                    render: (text, row, index) => {
                        return this.viewRender(key, res_data, text, row, index);
                    }
                };
                columns.push(o);
            }
        }
        return (
            <div>
                {this.inputRender()}
                {
                    this.tableRender({
                        columns: columns,
                        data: data,
                        tableWidth: tableWidth,
                        b_height: b_height
                    })
                }
            </div>
        )
    }
}

export default softwareDynamics;