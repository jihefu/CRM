import React, { Component } from 'react';
import { Select, Spin } from 'antd';
import debounce from 'lodash/debounce';
import request from 'superagent';
const Option = Select.Option;

class RemoteSelectRandom extends Component {
    constructor(props) {
        super(props);
        this.data = [];
        this.lastFetchId = 0;
        this.fetchUser = debounce(this.fetchUser, 300);
    }
    state = {
        data: [],
        value: {
            key: this.props.defaultValue,   //text
            label: this.props.defaultValue  //value
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
                this.data = JSON.stringify(res.body.data);
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
        clearTimeout(this.t);
        this.t = setTimeout(() => {
            try{
                let obj = {};
                const dataObj = JSON.parse(this.data);
                dataObj.forEach((items,index) => {
                    if(items.value==value.label){
                        obj = items.data;
                    }
                });
                this.props.onChange(value.key,obj);
            }catch(e){
    
            }
        },500);
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
            style={{ width: '100%' }}
          >
            {data.map(d => <Option key={d.value}>{d.text}</Option>)}
          </Select>
        );
    }
}

export default RemoteSelectRandom;