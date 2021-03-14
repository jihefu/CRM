import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Steps, Button, message,Input } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
const Step = Steps.Step;
const { TextArea } = Input;

const steps = [{
    title: '无借用',
    content: '加载中...'
}, {
    title: '借用申请中',
    content: <label style={{display: "flex"}}>
                <span style={{width: 80}}>借用目的：</span>
                <TextArea style={{flex: 9}} rows={6} name={"purpose"}></TextArea>
             </label>
}, {
    title: '借用已申请',
    content: ''
}, {
    title: '已借用',
    content: ''
}, {
    title: '归还申请中',
    content: ''
}];

class UserBorrowSteps extends Component {
    constructor(props) {
        super(props);
        this.handleBack = this.handleBack.bind(this);
        this.id = 0;
    }
    state = {
        current: 0
    };

    fetch(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/targetGood/'+this.id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                // state替换
                let stateData = Base.GetStateSession();
                let { data } = stateData;
                data.forEach((items,index) => {
                    if(items.id==res.body.data.id){
                        data[index] = res.body.data;
                        Base.SetStateSession(stateData);
                    }
                });

                let { borrowStatus } = res.body.data;
                let current;
                steps.forEach((items,index) => {
                    if(items.title==borrowStatus){
                        current = index;
                    }
                });
                if(current==0) current = 1;
                this.setState({
                    current
                });
            });
    }

    next() {
        const current = this.state.current + 1;
        let form_data,url;
        if(current==2){
            //提交借用申请
            let purpose = $('textarea[name=purpose]').val();
            if(!purpose){
                message.error('借用目的不能为空');
                return false;
            }
            form_data = {
                id: this.id,
                purpose: purpose
            };
            url = '/goods/applyBorrow';
        }else if(current==4){
            //归还
            form_data = {
                id: this.id,
            };
            url = '/goods/applyBack';
        }
        this.handleSub(form_data,url,() => {
            this.setState({ current });
            this.fetch();
        });
    }

    handleSub(form_data,url,cb){
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl(url))
            .set("token", token)
            .send(form_data)
            .end((err, res) => {
                if(res.body.code==200){
                    message.success(res.body.msg);
                    cb();
                }else{
                    message.error(res.body.msg);
                }
            });
    }

    handleBack(){
        this.props.history.goBack();
    }

    componentDidMount() {
        let { id } = this.props.location.state;
        this.id = id;
        this.fetch();
    }

    render() {
        const { current } = this.state;
        return (
            <div style={{padding: 45}}>
                <Steps current={current}>
                    {steps.map(item => <Step key={item.title} title={item.title} />)}
                </Steps>
                <div className="steps-content" style={{marginTop: 30}}>{steps[this.state.current].content}</div>
                <div className="steps-action" style={{marginTop: 30}}>
                    {
                        this.state.current === 0
                        &&
                        <div style={{textAlign: "center"}}>
                            <Button onClick={this.handleBack}>返回</Button>
                        </div>
                    }
                    {
                        this.state.current === 1
                        &&
                        <div style={{textAlign: "center"}}>
                            <Button type="primary" style={{marginRight: 20}} onClick={() => this.next()}>提交</Button>
                            <Button onClick={this.handleBack}>返回</Button>
                        </div>
                    }
                    {
                        this.state.current === 2
                        &&
                        <div style={{textAlign: "center"}}>
                            <Button onClick={this.handleBack}>返回</Button>
                        </div>
                    }
                    {
                        this.state.current === 3
                        &&
                        <div style={{textAlign: "center"}}>
                            <Button type="primary" style={{marginRight: 20}} onClick={() => this.next()}>归还</Button>
                            <Button onClick={this.handleBack}>返回</Button>
                        </div>
                    }
                    {
                        this.state.current === 4
                        &&
                        <div style={{textAlign: "center"}}>
                            <Button onClick={this.handleBack}>返回</Button>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default UserBorrowSteps;