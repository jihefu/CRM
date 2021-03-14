import React, { Component } from 'react';
import { Select } from 'antd';
const Option = Select.Option;

class StaticSelect extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }
    state = {
        defaultValue: this.props.defaultValue,
        option: this.props.option,
        owner: this.props.owner
    };
    componentWillReceiveProps(props){
        this.setState({
            defaultValue: props.defaultValue,
            option: props.option,
            owner: props.owner
        });
    }
    handleChange(value) {
        this.props.select(value,this.state.owner);
    }
    render() {
        let { defaultValue,option } = this.state;
        return (
            <div>
                <Select defaultValue={defaultValue} style={{ width: 120 }} onChange={this.handleChange}>
                    {
                        option.map((items,index) =>
                            <Option key={items.value} value={items.value}>{items.text}</Option>
                        )
                    }
                </Select>
            </div>
        );
    }
}

export default StaticSelect;