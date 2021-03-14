import React, { Component } from 'react';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
import { Button, Message, Select } from 'antd';
import common from '../../public/js/common.js';
import request from 'superagent';
const { Option } = Select;

class AddDealRecord extends Component {
    constructor(props) {
        super(props);
        this.userId;
        this.type;
    }

    sub = () => {
        const { userId, type } = this;
        if (!userId || !type) {
            Message.error('不能为空');
            return;
        }
        const { sn } = this.props;
        let url;
        if (type === '转手') {
            url = '/virProducts/addResaleRecord';
        } else {
            url = '/virProducts/addJudgeRecord';
        }
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl(url))
            .set("token", token)
            .send({
                sn,
                user_id: userId,
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
    
    render() {
        return (
            <div style={{textAlign: 'center'}}>
                <div style={{display: 'flex'}}>
                    <div style={{display: 'flex', alignItems: 'center', width: 70}}>受让方：</div>
                    <div style={{flex: 1}}>
                        <RemoteSearchInput placeholder={'公司名或姓名'} style={{width: '100%', marginTop: 12}} searchInputselected={v => this.userId = v} cbData={() => {}} remoteUrl={common.baseUrl('/virProducts/remoteSearchUserId?keywords=')} />
                    </div>
                </div>
                <div style={{display: 'flex', marginTop: 20}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>交易类型：</div>
                    <Select style={{ width: 200 }} onChange={v => this.type = v}>
                        <Option value="转手">转手</Option>
                        <Option value="判定">判定</Option>
                    </Select>
                </div>
                <Button style={{marginTop: 20}} type={'primary'} onClick={this.sub}>提交</Button>
            </div>
        )
    }
}

export default AddDealRecord;