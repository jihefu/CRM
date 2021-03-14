import React, { Component } from 'react';
import common from '../../public/js/common.js';
import request from 'superagent';
import { Timeline, Input, Button, message } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class RepairMsg extends Component {
    constructor(props) {
        super(props);
        this.repair_no = '';
    }

    state = {
        data: [],
    };

    componentDidMount() {
        this.repair_no = this.props.repair_no;
        this.fetch();
    }

    componentWillReceiveProps(props) {
        this.repair_no = props.repair_no;
        this.fetch();
    }

    fetch = () => {
        const { sn } = this.props;
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/repairs/getRepairMsg'))
            .set('token', token)
            .query({ sn, repair_no: this.repair_no })
            .end((err, res) => {
                this.setState({
                    data: res.body.data,
                });
            });
    }

    renderChat = state => {
        const { data } = this.state;
        const arr = data.filter(items => items.repair_state == state);
        return arr.map(items => (
            <div>
                【{moment(items.send_time).format('YYYY-MM-DD HH:mm:ss')}】{items.name}：{items.content}
            </div>
        ));
    }

    send = () => {
        const value = this.refs.content.state.value;
        if (!value) {
            return;
        }
        const { sn } = this.props;
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/repairs/addRepairMsg'))
            .set('token', token)
            .send({ sn, content: value })
            .end((err, res) => {
                message.success(res.body.msg);
                this.fetch();
                this.refs.content.state.value = '';
            });
    }

    render() {
        return (
            <div>
                <Timeline>
                    <Timeline.Item key={'已收件'}>
                        <h3>已收件</h3>
                        {this.renderChat('已收件')}
                    </Timeline.Item>
                    <Timeline.Item key={'已发件'}>
                        <h3>已发件</h3>
                        {this.renderChat('已发件')}
                    </Timeline.Item>
                    <Timeline.Item key={'待发件'}>
                        <h3>待发件</h3>
                        {this.renderChat('待发件')}
                    </Timeline.Item>
                    <Timeline.Item key={'维修检验中'}>
                        <h3>维修检验中</h3>
                        {this.renderChat('维修检验中')}
                    </Timeline.Item>
                    <Timeline.Item key={'维修中'}>
                        <h3>维修中</h3>
                        {this.renderChat('维修中')}
                    </Timeline.Item>
                    <Timeline.Item key={'送修检验中'}>
                        <h3>送修检验中</h3>
                        {this.renderChat('送修检验中')}
                    </Timeline.Item>
                    <Timeline.Item key={'已登记'}>
                        <h3>已登记</h3>
                    </Timeline.Item>
                </Timeline>
                {/* <div style={{textAlign: 'center'}}>
                    <Input.TextArea ref={'content'} rows={4} />
                    <Button onClick={this.send} type={'primary'} style={{marginTop: 18}}>提交</Button>
                </div> */}
            </div>
        )
    }
}

export default RepairMsg