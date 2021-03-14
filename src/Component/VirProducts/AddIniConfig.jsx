import React, { Component } from 'react';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import { Button, Input, Message, Table } from 'antd';
import common from '../../public/js/common.js';
import request from 'superagent';

class AddIniConfig extends Component {
    constructor(props) {
        super(props);
    }

    renderTable = () => {
        const { list, sn } = this.props;
        list.forEach((items, index) => {
            if (!items.uploadFrom) {
                list[index].uploadFrom = '软件';
            }
        });
        const columns = [
            {
                title: '上传人',
                dataIndex: 'name',
                key: 'name',
            },
            {
                title: '上传时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
            },
            {
                title: '上传客户端',
                dataIndex: 'uploadFrom',
                key: 'uploadFrom',
            },
            {
                title: '版本号',
                dataIndex: 'versionNo',
                key: 'versionNo',
                render: (text, record) => (
                    <a target="__blank" href={common.apiUrl('/maxtest/ini/'+sn+'/' + record.contentId)}>{record.versionNo}</a>
                ),
            },
            {
                title: '更新摘要',
                dataIndex: 'versionRem',
                key: 'versionRem',
            },
        ];
        return (
            <Table pagination={false} dataSource={list} columns={columns} />
        )
    }

    render() {
        return (
            <div style={{textAlign: 'center'}}>
                { this.renderTable() }
            </div>
        )
    }
}

export default AddIniConfig;