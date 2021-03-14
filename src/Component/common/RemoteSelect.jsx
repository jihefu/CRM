import React, { Component } from 'react';
import { Select, Spin } from 'antd';
import debounce from 'lodash/debounce';
import request from 'superagent';
const Option = Select.Option;

class RemoteSelect extends Component {
    constructor(props) {
        super(props);
        this.defaultValueKey = this.props.initialValue;
        this.defaultValueLabel = this.props.initialValue;
        this.lastFetchId = 0;
        this.fetchUser = debounce(this.fetchUser, 300);
    }
    state = {
        data: [],
        value: {
            key: this.props.initialValue,   //text
            label: this.props.initialValue  //value
        },
        fetching: false,
    }
    fetchUser = (value) => {
        this.lastFetchId += 1;
        const fetchId = this.lastFetchId;
        let token = sessionStorage.getItem('token');
        let label = this.state.value.label;
        this.setState({ data: [], fetching: true });
        request.get(this.props.remoteUrl+label)
            .set("token",token)
            .end((err,res) => {
                if (fetchId !== this.lastFetchId) { // for fetch callback order
                    return;
                }
                const data = res.body.data.map(result => ({
                    text: `${result.text}`,
                    value: `${result.value}`
                }));
                this.setState({ data, fetching: false });
            });
    }
    handleChange = (value) => {
        this.setState({
            value,
            data: [],
            fetching: false,
        });
    }
    handleSelect = (value) => {
        this.defaultValueKey = value.key;
        this.defaultValueLabel = value.label;
    }
    handleBlur = (value) => {
        let key = this.defaultValueKey;
        let label = this.defaultValueLabel;
        this.setState({
            value: {
                key: key,
                label: label
            }
        });
    }
    render() {
        const { fetching, data, value } = this.state;
        return (
          <Select
            mode="combobox"
            labelInValue
            value={value}
            placeholder=""
            notFoundContent={fetching ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={this.fetchUser}
            onChange={this.handleChange}
            onSelect={this.handleSelect}
            onBlur={this.handleBlur}
            style={{ width: '100%' }}
          >
            {data.map(d => <Option key={d.value}>{d.text}</Option>)}
          </Select>
        );
    }
}

export default RemoteSelect;