import React, { Component } from 'react';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import { Button, Input, Message, Table } from 'antd';
import common from '../../public/js/common.js';
import request from 'superagent';

class AddVtcConfig extends Component {
    constructor(props) {
        super(props);
        this.singleTempName = '';
    }

    newVtcCfg = () => {
        const { singleTempName } = this;
        const versionRem = this.refs.versionRem.state.value;
        if (!singleTempName || !versionRem) {
            Message.error('不能为空');
            return;
        }
        const { sn } = this.props;
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/vir/createInstance/' + singleTempName))
            .set("token", token)
            .send({
                versionRem,
                startSn: sn,
                endSn: sn,
            })
            .end((err, res) => {
                if (err) return;
                Message.success(res.body.msg);
                try {
                    this.props.fetch();
                } catch (e) {
                    
                }
            });
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
                    <a target="__blank" href={common.apiUrl('/vtc/nji/'+sn+'/' + record.contentId)}>{record.versionNo}</a>
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
                <RemoteSearchInput placeholder={'选择模板'} style={{width: '100%', marginTop: 12}} searchInputselected={v => this.singleTempName = v} cbData={() => {}} remoteUrl={common.baseUrl('/vir/tempNameList?keywords=')} />
                <Input ref={'versionRem'} style={{width: '100%', marginTop: 12}} placeholder={'更新摘要'} />
                <Button onClick={this.newVtcCfg} style={{marginTop: 10}}>提交</Button>
            </div>
        )
    }
}

export default AddVtcConfig;