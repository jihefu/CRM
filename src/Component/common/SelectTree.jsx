import React, { Component } from 'react';
import { Tree } from 'antd';
const TreeNode = Tree.TreeNode;

class SelectTree extends Component {
    constructor(props) {
        super(props);
    }
    state = {
        sortMenuArr: [],
        checkedArr: []
    };
    onSelect = (selectedKeys, info) => {

    }
    onCheck = (checkedKeys) => {
        this.props.check(checkedKeys);
        this.setState({
            checkedArr: checkedKeys
        });
    }
    componentWillReceiveProps(props){
        this.setState({
            sortMenuArr: props.sortMenuArr,
            checkedArr: props.checkedArr
        });
    }
    render() {
        let { totalTitle } = this.props;
        let { checkedArr,sortMenuArr } = this.state;
        return (
            <Tree
                checkable={true}
                defaultExpandedKeys={['0']}
                onSelect={this.onSelect}
                onCheck={this.onCheck}
                checkedKeys={checkedArr}
            >
                <TreeNode defaultExpandAll={true} title={totalTitle} key="0">
                    {
                        sortMenuArr.map((items) => {
                            return (
                                <TreeNode title={items.title} key={items.key}>
                                    {
                                        items.children.map(it => {
                                            return <TreeNode title={it.title} key={it.key} />
                                        })
                                    }
                                </TreeNode>
                            )
                        })
                    }
                </TreeNode>
            </Tree>
        );
    }
}

export default SelectTree;