import React, { Component } from 'react';
import { TreeSelect } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
const { TreeNode } = TreeSelect;

class MachinieTypeSelect extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        nodeArr: [],
    };

    componentDidMount() {
        this.fetch();
    }

    fetch() {
        request.get(common.baseUrl2('/open/action/solutionType'))
            .end((err,res) => {
                const { data } = res.body;
                this.setState({
                    nodeArr: data,
                });
            });
    }

    renderNode(nodeArr) {
        return nodeArr.map(items => {
            if (items.children.length === 0) {
                return <TreeNode value={items.id} title={items.name} key={items.id} />
            } else {
                return <TreeNode value={items.id} title={items.name} key={items.id}>
                    { this.renderNode(items.children) }
                </TreeNode>
            }
        });
    }

    render() {
        const { nodeArr } = this.state;
        return (
            <TreeSelect
                showSearch
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="Please select"
                treeDefaultExpandAll
                onSelect={this.props.machineTypeSelect}
                defaultValue={this.props.defaultValue}
            >
                { this.renderNode(nodeArr) }
            </TreeSelect>
        )
    }
}

export default MachinieTypeSelect;