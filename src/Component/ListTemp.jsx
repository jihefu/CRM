import React, { Component } from 'react';
import { List, message, Avatar, Spin } from 'antd';
import StaticSelect from './common/StaticSelect.jsx';

class ListTemp extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <List
                itemLayout="horizontal"
                dataSource={this.props.list}
                renderItem={item => (
                    <List.Item actions={[<StaticSelect option={item.option} defaultValue={item.defaultValue} select={this.props.select} owner={item.key} />]}>
                        <List.Item.Meta
                            avatar={<Avatar src={item.avatar} />}
                            title={item.title}
                            description={item.description}
                        />
                    </List.Item>
                )}
            />
        );
    }
}

export default ListTemp;