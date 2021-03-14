import React, { Component } from 'react';
import { Link, hashHistory } from 'react-router';
import { Icon, Button, message,Calendar,Collapse,Tree } from 'antd';
import request from 'superagent';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import ModalTemp from './common/Modal.jsx';
import common from '../public/js/common.js';
// import Attendance from './Attendance.jsx';
import SignCalendar from './SignCalendar.jsx';
moment.locale('zh-cn');
const Panel = Collapse.Panel;
const TreeNode = Tree.TreeNode;

class AttendanceManage extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        list: [],
        user_id: '',
        info: {},
        yyyymm: moment().format('YYYY-MM')
    };

    fetch = () => {
        let { yyyymm,user_id } = this.state;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/getAllStaffAllMonthData'))
            .set("token", token)
            .query({
                yyyymm: yyyymm
            })
            .end((err, res) => {
                if (err) return;
                const list = res.body;
                const listArr = [];
                for(let key in list){
                    let params = list[key];
                    params.user_id = key;
                    listArr.push(params);
                }
                if(user_id){
                    listArr.forEach((items,index) => {
                        if(items.user_id==user_id){
                            this.setState({
                                list: listArr,
                                info: listArr[index],
                                user_id: listArr[index].user_id
                            });
                        }
                    });
                }else{
                    this.setState({
                        list: listArr,
                        info: listArr[0],
                        user_id: listArr[0].user_id
                    });
                }
            });
    }

    onSelect = (selectedKeys,e) => {
        let key = selectedKeys[0];
        const { list } = this.state;
        list.forEach((items,index) => {
            if(items.user_id==key){
                this.setState({
                    info: items,
                    user_id: key
                });
            }
        });
    }

    monthChange = (yyyymm) => {
        this.setState({
            yyyymm: yyyymm
        },() => {
            this.fetch();
        });
    }

    loop = () => {
        const { list } = this.state;
        return list.map((item) => {
            return <TreeNode key={item.user_id} title={item.user_name} />;
        });
    }

    componentDidMount(){
        this.fetch();
    }

    render(){
        const { info,user_id,yyyymm } = this.state;
        let b_height = window.innerHeight-100;
        const h = window.innerHeight - 140;
        return(
            <div style={{display: 'flex', height:  window.innerHeight - 90, overflow: 'hidden'}}>
                <div style={{width: 150,height: b_height,overflow: 'auto'}}>
                    <Tree defaultExpandAll={true} defaultSelectedKeys={['101']} onSelect={this.onSelect}>
                        <TreeNode title={"员工"} key="0">
                            {this.loop()}
                        </TreeNode>
                    </Tree>
                </div>
                <div style={{flex: 1}}>
                    <div style={{display: 'flex',textAlign: 'center',marginTop: 10}}>
                        <h2 style={{flex: 1}}>姓名：{info.user_name}</h2>
                        <h2 style={{flex: 1}}>工时：{info.onHours} h</h2>
                        <h2 style={{flex: 1}}>加班：{info.overWorkTime} h</h2>
                        <h2 style={{flex: 1}}>值日：{info.onDuty} 天</h2>
                        <h2 style={{flex: 1}}>规定工时：{info.total} h</h2>
                    </div>
                    <div style={{overflow: 'auto', height: h}}>
                        <SignCalendar yyyymm={yyyymm} monthChange={this.monthChange} user_id={user_id}></SignCalendar>
                    </div>
                </div>
            </div>
        )
    }
}

export default AttendanceManage;