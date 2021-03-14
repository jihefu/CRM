import React, { Component } from 'react';
import { Tag, Icon, Select, Input } from 'antd';
const { Option } = Select;

class AffairSummaryEdit extends Component {
    constructor(props) {
        super(props);
        this.selectedIdData = this.props.selectedIdData;
    }

    state = {
        globalShowEdit: false,
        nameEdit: false,
        priorityEdit: false,
        secretEdit: false,
        resposibilityEdit: false,
    };

    componentWillMount() {
        const { selectedIdData } = this.props;
        let editable = false;
        let teamDirector;
        try {
            teamDirector = selectedIdData[0].team.split(',')[0];
        } catch (e) { }
        const user_id = sessionStorage.getItem('user_id');
        if (teamDirector == user_id || selectedIdData[0].insert_person == user_id) editable = true;
        this.setState({
            globalShowEdit: editable,
        });
    }

    teamSecret = secret => {
        if(secret==1){
            return '是';
        }else{
            return '否';
        }
    }

    render() {
        const { selectedIdData } = this;
        const { globalShowEdit, nameEdit, priorityEdit, secretEdit, resposibilityEdit } = this.state;
        return <div>
            <p>
                <span>事务名称：</span>
                { !nameEdit && <span>{selectedIdData[0].name}<Icon onClick={() => this.setState({nameEdit: !nameEdit})} style={{marginLeft: 6, cursor: 'pointer'}} type="form" /></span> }
                { nameEdit && <Input style={{width: 300}} defaultValue={selectedIdData[0].name} onBlur={() => this.setState({nameEdit: !nameEdit})} /> }
            </p>
            <p>
                <span>优先级：</span>
                { !priorityEdit && <span>{selectedIdData[0].priority}<Icon onClick={() => this.setState({priorityEdit: !priorityEdit})} style={{marginLeft: 6, cursor: 'pointer'}} type="form" /></span> }
                { priorityEdit && <Select defaultValue={selectedIdData[0].priority} style={{ width: 120 }} onSelect={() => this.setState({priorityEdit: !priorityEdit})}>
                    <Option value="紧急">紧急</Option>
                    <Option value="重要">重要</Option>
                    <Option value="普通">普通</Option>
                    <Option value="暂缓">暂缓</Option>
                </Select> }
            </p>
            <p>
                <span>状态：</span>
                <span>{selectedIdData[0].state}</span>
            </p>
            <p>
                <span>所属部门：</span>
                <span>{selectedIdData[0].RespoAffairs[0].department}</span>
            </p>
            <p>
                <span>是否保密：</span>
                { !secretEdit && <span>{this.teamSecret(selectedIdData[0].secret)} <Icon onClick={() => this.setState({secretEdit: !secretEdit})} style={{marginLeft: 6, cursor: 'pointer'}} type="form" /></span> }
                { secretEdit && <Select defaultValue={selectedIdData[0].secret} style={{ width: 120 }} onSelect={() => this.setState({secretEdit: !secretEdit})}>
                    <Option value={1}>是</Option>
                    <Option value={0}>否</Option>
                </Select> }
            </p>
            <p>
                <span>职责描述：</span>
                { !resposibilityEdit && <span>{selectedIdData[0].RespoAffairs[0].resposibility}<Icon onClick={() => this.setState({resposibilityEdit: !resposibilityEdit})} style={{marginLeft: 6, cursor: 'pointer'}} type="form" /></span> }
                { resposibilityEdit && <Input style={{width: 300}} defaultValue={selectedIdData[0].RespoAffairs[0].resposibility} onBlur={() => this.setState({resposibilityEdit: !resposibilityEdit})} /> }
            </p>
            <p>
                <span>关键词标签：</span>
                <span>
                    {/* {
                        tagArr.map(items => 
                            <Tag key={items}>{items}</Tag>
                        )
                    } */}
                </span>
            </p>
        </div>;
    }
}

export default AffairSummaryEdit;