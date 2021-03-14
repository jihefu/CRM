import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { notification,Tag } from 'antd';
import io from 'socket.io-client';
import moment from 'moment';
import common from '../public/js/common.js'
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class SocketIO extends Component {
    constructor(props, context) {
        super(props, context);
        this.uri = common.socketCallUrl();
        this.socket;
        this.login = this.login.bind(this);
    }

    login = () => {
        let token = sessionStorage.getItem('token');
        this.socket.emit('Login',{
            token: token
        },result => {
            // console.log(result);
        });
    }

    callIn = (params) => {
        const { info } = params;
        const getTags = (str) => {
            let tagsArr;
            try{
                tagsArr = typeof(str)=='object'?str:JSON.parse(str);
            }catch(e){
                tagsArr = [];
            }
            tagsArr = tagsArr == null?[]:tagsArr;
            let tags = tagsArr.map(items => 
                <Tag color={'#f60'}>{items}</Tag>
            )
            return tags;
        }
        let message = <span>来电显示：{params.name}   {params.phone}</span>
        let description = <div>
                            <p style={{marginTop: 10}}><span style={{color: '#f60'}}>联系人类型：</span>{params.type}</p>
                            <p><span style={{color: '#f60'}}>联系人公司：</span>{params.company}</p>
                                {
                                    info.map((items) => 
                                        <p><span style={{color: '#f60'}}>{items.hang_up_time}:</span>  {items.content} 
                                            <p style={{marginBottom: 0,marginTop: 2}}>
                                                {
                                                    getTags(items.tags)
                                                }
                                            </p>
                                            <p style={{marginBottom: 0,marginTop: 2}}>处理人：{items.staff}</p>
                                            <p style={{marginTop: 2}}>处理人电话: {items.staff_phone}</p>
                                        </p>
                                    )
                                }
                          </div>
        notification.info({
            message: message,
            description: description,
            duration: 5*60
        });
    }

    RepairChange = (params) => {
        let message;
        let description;
        const newDescription = () => {
            return <div>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>送修单位：</span>{params.cust_name}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>收件时间：</span>{params.receive_time}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>序列号：</span>{params.serial_no}</p>
                    </div>
        }
        const changeDescription = () => {
            return <div>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>送修单位：</span>{params.cust_name}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>序列号：</span>{params.serial_no}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>产品：</span>{params.goods}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>客户反映故障：</span>{params.problems}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>检验发现：</span>{params.conclusion}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>处理方法：</span>{params.treatement}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>维修操作：</span>{params.repair_conclusion}</p>
                        <p style={{marginTop: 10}}><span style={{color: '#f60'}}>状态：</span>{params.deliver_state}</p>
                    </div>
        }
        if(params.type=='new'){
            message = <span style={{color: '#f60'}}>新的维修单  {params.repair_contractno}</span>
            description = newDescription();
        }else{
            message = <span style={{color: '#f60'}}>{params.repair_contractno}</span>
            description = changeDescription();
        }
        
        notification.info({
            message: message,
            description: description,
            duration: null
        });
    }

    componentDidMount(){
        this.socket = io(this.uri);

        this.socket.on('connect',() => {
            this.login();
        });

        this.socket.on('CallIn',(params) => {
            this.callIn(params);
        });

        this.socket.on('RepairChange',(params) => {
            this.RepairChange(params);
        });
    }
 
    render() {
        return false;
    }
}

export default SocketIO;