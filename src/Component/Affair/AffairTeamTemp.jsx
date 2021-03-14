import React, { Component } from 'react';
import { Tag, Icon, Select } from 'antd';

class AffairTeamTemp extends Component {
    constructor(props) {
        super(props);
        this.staffArr = this.props.staffArr;
        this.state = {
            team: this.props.team,
            visible: false,
        };
    }

    teamMemberRemove = user_id => {
        let { team } = this.state;
        team = team.filter(items => items.user_id != user_id);
        this.setState({
            team,
        }, () => {
            this.props.memberChange(this.state.team);
        });
    }

    teamToTap = user_id => {
        let { team } = this.state;
        let targetItem;
        team.forEach((items, index) => {
            if (items.user_id == user_id) {
                targetItem = items;
            }
        });
        team = team.filter(items => items.user_id != user_id);
        team.unshift(targetItem);
        this.setState({
            team
        }, () => {
            this.props.memberChange(this.state.team)
        });
    }

    add = () => {
        const { visible } = this.state;
        this.setState({
            visible: !visible,
        });
    }

    selectChange = v => {
        v.forEach((items, index) => {
            this.staffArr.forEach((it, ind) => {
                it.forEach((_it, _ind) => {
                    if (items == _it.user_id) {
                        v[index] = _it;
                    }
                });
            });
        });
        v.forEach((items, index) => {
            if (typeof items === 'string') {
                v[index] = {};
                v[index].user_name = items;
                v[index].user_id = items;
            }
        });
        this.setState({
            team: v,
        }, () => {
            this.props.memberChange(this.state.team)
        });
    }

    render() {
        const { team, visible } = this.state;
        return <div>
                    { team.map(items => <Tag key={items.user_id} closable onClose={() => this.teamMemberRemove(items.user_id)}>
                        {items.user_name}
                        <Icon style={{marginLeft: 4, color: '#999'}} type="vertical-align-top" 
                            onClick={() => {this.teamToTap(items.user_id)}}/>
                    </Tag>) }
                    { !visible && <Tag onClick={() => this.add()} style={{ background: '#fff', borderStyle: 'dashed', display: 'block', width: 80, marginTop: 10}}>
                        <Icon type="plus" /> 新增
                    </Tag> }
                    { visible && <Select
                        key={1}
                        mode="multiple"
                        style={{ width: 380, display: 'block', marginTop: 10 }}
                        placeholder="请输入..."
                        defaultValue={team.map(items => items.user_id)}
                        onChange={v => this.selectChange(v)}
                        onBlur={() => this.add()}
                    >
                        <Select.OptGroup label="研发部">
                            {
                                this.staffArr[0].map(items => 
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                        <Select.OptGroup label="客户关系部">
                            {
                                this.staffArr[1].map(items => 
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                        <Select.OptGroup label="生产部">
                            {
                                this.staffArr[2].map(items => 
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                        <Select.OptGroup label="管理部">
                            {
                                this.staffArr[3].map(items => 
                                    <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                )
                            }
                        </Select.OptGroup>
                    </Select> }
                </div>
    }
}

export default AffairTeamTemp;