import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Steps, Button, message,Input,InputNumber  } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
const Step = Steps.Step;
const { TextArea } = Input;

const steps = [{
    title: '无借用',
    content: ''
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

class ManageBorrowSteps extends Component {
    constructor(props) {
        super(props);
        this.handleBack = this.handleBack.bind(this);
        this.id = 0;
    }
    state = {
        current: 0
    };

    fetch(){
        let id = this.id;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/targetGood/'+this.id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;

                let stateData = Base.GetStateSession();
                let { data } = stateData;
                data.forEach((items,index) => {
                    if(items.id==res.body.data.id){
                        data[index] = res.body.data;
                        Base.SetStateSession(stateData);
                    }
                });

                let { borrowStatus } = res.body.data;
                let { current } = this.state;
                let borrowRecordInfo = res.body.data.goodsBorrowRecords[res.body.data.goodsBorrowRecords.length-1];
                try{
                    this.recordId = borrowRecordInfo.id;
                }catch(e){}
                steps.forEach((items,index) => {
                    if(items.title==borrowStatus){
                        current = index;
                        if(items.title=='借用已申请'){
                            steps[index]['content'] = <div style={{textAlign: "center"}}>
                                                            <label style={{display: "flex"}}>
                                                                <span style={{width: 120}}>申请人：</span>
                                                                <Input disabled={true} value={borrowRecordInfo.borrower}/>
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>借用目的：</span>
                                                                <TextArea rows={3} disabled={true} value={borrowRecordInfo.purpose}></TextArea>
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>借用期限：</span>
                                                                <InputNumber name={"borrowingPeriod"} style={{marginRight: 10}} defaultValue={borrowRecordInfo.borrowingPeriod?borrowRecordInfo.borrowingPeriod:365}/>天
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>备注：</span>
                                                                <TextArea name={"rem"} rows={3} defaultValue={borrowRecordInfo.rem}></TextArea>
                                                            </label>
                                                      </div>
                        }else if(items.title=='归还申请中'){
                            steps[index]['content'] = <div style={{textAlign: "center"}}>
                                                            <label style={{display: "flex"}}>
                                                                <span style={{width: 120}}>申请人：</span>
                                                                <Input disabled={true} value={borrowRecordInfo.borrower}/>
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>借用目的：</span>
                                                                <TextArea rows={3} disabled={true} value={borrowRecordInfo.purpose}></TextArea>
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>借用起始时间：</span>
                                                                <InputNumber name={"borrowStartTime"} disabled={true} style={{marginRight: 10,width: '100%'}} defaultValue={borrowRecordInfo.borrowStartTime}/>
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>借用期限：</span>
                                                                <InputNumber name={"borrowingPeriod"} disabled={true} style={{marginRight: 10,width: '100%'}} defaultValue={borrowRecordInfo.borrowingPeriod}/>天
                                                            </label>
                                                            <label style={{display: "flex",marginTop: 20}}>
                                                                <span style={{width: 120}}>备注：</span>
                                                                <TextArea name={"rem"} rows={3} defaultValue={borrowRecordInfo.rem}></TextArea>
                                                            </label>
                                                      </div>
                        }
                        this.setState({
                            current
                        });
                    }
                });
            });
    }
    
    // 同意
    aggre(){
        let borrowingPeriod = $('input[name=borrowingPeriod]').val();
        let rem = $('textarea[name=rem]').val();
        let url = '/goods/agreeBorrow';
        let form_data = {
            borroweringPeriod: borrowingPeriod,
            rem: rem,
            id: this.id,
            recordId: this.recordId
        };
        this.handleSub(form_data,url,() => {
            this.fetch();
        });
    }

    // 不同意
    unAggre(){
        let rem = $('textarea[name=rem]').val();
        let url = '/goods/notAggreBorrow';
        let form_data = {
            rem: rem,
            id: this.id,
            recordId: this.recordId
        };
        this.handleSub(form_data,url,() => {
            this.fetch();
        });
    }

    //确认归还
    confirmBack(){
        let rem = $('textarea[name=rem]').val();
        let url = '/goods/aggreBack';
        let form_data = {
            rem: rem,
            id: this.id,
            recordId: this.recordId
        };
        this.handleSub(form_data,url,() => {
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
                            <Button type="primary" style={{marginRight: 20}} onClick={() => this.aggre()}>同意</Button>
                            <Button type="danger" style={{marginRight: 20}} onClick={() => this.unAggre()}>不同意</Button>
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
                            <Button type="primary" style={{marginRight: 20}} onClick={() => this.confirmBack()}>确认归还</Button>
                            <Button onClick={this.handleBack}>返回</Button>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default ManageBorrowSteps;