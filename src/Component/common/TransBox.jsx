import React, { Component } from 'react';
import { Transfer  } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';

class TransBox extends Component {
    state = {
        targetKeys: [],
        mockData: []
    }

    fetch(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const mockData = res.body.data.map(items => {
                    return {
                        key: items.user_id,
                        title: items.user_name,
                        disabled: items.user_id == sessionStorage.getItem('director')
                    }
                });
                this.setState({
                    mockData: mockData,
                    targetKeys: sessionStorage.getItem('group_person').split(',')
                });
            });
    }

    componentDidMount(){
        this.fetch();
    }
    componentWillReceiveProps(props){
        this.fetch();
    }

    handleChange = (nextTargetKeys, direction, moveKeys) => {
        this.setState({ targetKeys: nextTargetKeys });
        sessionStorage.setItem('targetKeys',nextTargetKeys.join());
    }

    handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] });
    }

    render() {
        const state = this.state;
        return (
            <Transfer
                dataSource={state.mockData}
                titles={['非成员列表', '成员列表']}
                targetKeys={state.targetKeys}
                selectedKeys={state.selectedKeys}
                onChange={this.handleChange}
                onSelectChange={this.handleSelectChange}
                render={item => item.title}
            />
        );
    }
}
export default TransBox;