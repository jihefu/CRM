import React from 'react';
import request from 'superagent';
import common from '../../public/js/common';
import debounce from 'lodash/debounce';
import { Select, Spin, Modal, message, Input, Radio } from 'antd';

const { Option } = Select;

class CustomerRemoteSelect extends React.Component {
    constructor(props) {
        super(props);
        this.lastFetchId = 0;
        this.fetchCustomer = debounce(this.fetchCustomer, 500);
    }

    state = {
        data: [],
        value: [],
        fetching: false,
        isPublic: 1,
    };

    componentWillReceiveProps(props) {

    }

    fetchCustomer = keywords => {
        this.lastFetchId += 1;
        const fetchId = this.lastFetchId;
        this.setState({ data: [], fetching: true });
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/customers/list'))
            .set("token", token)
            .query({
                page: 1,
                num: 5,
                keywords,
                order: 'user_id',
                filter: JSON.stringify({ "group": "", "level": "", "certified": "" })
            })
            .end((err, res) => {
                if (fetchId !== this.lastFetchId) {
                    return;
                }
                const data = res.body.data.data.map(items => ({
                    text: `${items.company}`,
                    value: items.user_id,
                }));
                this.setState({ data, fetching: false });
            });
    };

    handleChange = value => {
        this.setState({
            value,
            data: [],
            fetching: false,
        });
    };

    handleOk = () => {
        const { value, isPublic } = this.state;
        let userIdArr = value.map(items => items.key);
        const { fileIdArr, type } = this.props;
        const remark = this.refs.remark.state.value;
        if (isPublic) {
            userIdArr = [];
        }
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/cloudDisk/batchCreate'))
            .set("token", token)
            .send({
                userIdArr,
                fileIdArr,
                type,
                remark,
            })
            .end((err, res) => {
                message.success(res.body.msg);
                this.handleCancel();
            });
    }

    handleCancel = () => {
        this.setState({
            data: [],
            value: [],
            fetching: false,
        });
        this.refs.remark.state.value = '';
        this.props.close();
    }

    render() {
        const { fetching, data, value, isPublic } = this.state;
        const { showShare } = this.props;
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px',
        };
        return (
            <Modal
                title="分享"
                visible={showShare}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
            >
                <Radio.Group value={isPublic} onChange={e => this.setState({ isPublic: e.target.value })} >
                    <Radio value={1}>所有客户</Radio>
                    <Radio value={0} >指定客户
                        {isPublic == 0 ?
                            <Select
                                mode="multiple"
                                labelInValue
                                value={value}
                                placeholder="请选择客户"
                                notFoundContent={fetching ? <Spin size="small" /> : null}
                                filterOption={false}
                                onSearch={this.fetchCustomer}
                                onChange={this.handleChange}
                                style={{ width: 260, marginLeft: 6 }}
                            >
                                {data.map(d => (
                                    <Option key={d.value}>{d.text}</Option>
                                ))}
                            </Select> : null}
                    </Radio>
                </Radio.Group>
                <Input style={{width: 444, marginTop: 8}} ref={'remark'} placeholder={'附言'} />
            </Modal>
        );
    }
}

export default CustomerRemoteSelect;