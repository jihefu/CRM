import React, { Component } from 'react';
import { Select, Spin } from 'antd';
import request from 'superagent';
const Option = Select.Option;

class RemoteSearchInput extends React.Component {
    state = {
        data: [],
        value: this.props.value,
    }

    fetch(value,cb){
        const token = sessionStorage.getItem('token');
        request.get(this.props.remoteUrl+value)
            .set("token",token)
            .end((err,res) => {
                cb(res.body.data);
            });
    }


    handleSearch = (value) => {
        this.fetch(value, data => this.setState({ data }));
    }

    handleChange = (value) => {
        this.setState({ value });
        let obj;
        this.state.data.forEach((items,index) => {
            if(items.value==value){
                obj = items.data;
            }
        });
        try{
            this.props.searchInputselected(value);
        }catch(e){

        }
        try{
            this.props.cbData(obj);
        }catch(e){

        }
    }

    render() {
        const placeholder = this.props.placeholder ? this.props.placeholder : '';
        const style = this.props.style ? this.props.style : {width: '100%'};
        const options = this.state.data.map(d => <Option key={d.value}>{d.text}</Option>);
        return (
            <Select
                showSearch
                value={this.state.value}
                showArrow={false}
                filterOption={false}
                onSearch={this.handleSearch}
                onChange={this.handleChange}
                notFoundContent={null}
                style={style}
                placeholder={placeholder}
                className={'remoteSearchInput'}
            >
                {options}
            </Select>
        );
    }
}

export default RemoteSearchInput;