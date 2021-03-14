import React, { Component } from 'react';
import { Button, message,Calendar,LocaleProvider } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import moment from 'moment';
moment.locale('zh-cn');

class AttendanceCalendar extends Component {
    constructor(props) {
        super(props);
        this.getData = this.getData.bind(this);
        this.getDiff = this.getDiff.bind(this);
        this.originalArr = [];
        this.needDelArr = [];
        this.needAddArr = [];
    }

    state = {
        selected: []
    }

    onSelect = (value) => {
        const { selected } = this.state;
        value = value.format('YYYY-MM-DD');
        if(selected.length==0){
            selected.push(value);
        }else{
            for (let i = 0; i < selected.length; i++) {
                const element = selected[i];
                if(element==value){
                    selected.splice(i,1);
                    // this.needDelArr.push(value);
                    break;
                }else if(i==selected.length-1&&element!=value){
                    selected.push(value);
                    // this.needAddArr.push(value);
                    break;
                }
            }
        }
        this.setState({
            selected
        });
    }

    getDiff = () => {
        this.needDelArr = [];
        this.needAddArr = [];
        const { selected } = this.state;
        const originalArr = this.originalArr;
        if(originalArr.length==0){
            this.needDelArr = [];
            this.needAddArr = selected;
        }else if(selected.length==0){
            this.needDelArr = originalArr;
            this.needAddArr = [];
        }else{
            for (let i = 0; i < originalArr.length; i++) {
                if(selected.indexOf(originalArr[i])==-1){
                    this.needDelArr.push(originalArr[i]);
                }
            }
            for (let i = 0; i < selected.length; i++) {
                if(originalArr.indexOf(selected[i])==-1){
                    this.needAddArr.push(selected[i]);
                }
            }
        }
        this.needDelArr = [...new Set(this.needDelArr)];
        this.needAddArr = [...new Set(this.needAddArr)];
    }

    subDate = () => {
        const { selected } = this.state;
        this.getDiff();
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/attendance/addDateList'))
            .set("token", token)
            .send({
                "form_data": JSON.stringify({
                    needAddArr: this.needAddArr,
                    needDelArr: this.needDelArr
                })
            })
            .end((err, res) => {
                if(err) return;
                this.originalArr = [];
                this.needAddArr =  [];
                this.needDelArr = [];
                this.getData();
                message.success(res.body.msg);
            });
    }

    transDateTitle = (value) => {
        let YYYY = value.split('-')[0];
        let MM = parseInt(value.split('-')[1]);
        let DD = parseInt(value.split('-')[2]);
        return YYYY+'年'+MM+'月'+DD+'日';
    }

    onPanelChange = () => {
        setTimeout(() => {
            this.init();
        },0);
    }

    init = () => {
        const { selected } = this.state;
        $('.ant-radio-group-small').css('display','none');
        $('.ant-fullcalendar-today').removeClass('ant-fullcalendar-today');
        $('.ant-fullcalendar-selected-day').removeClass('ant-fullcalendar-selected-day');
        selected.forEach((items,index) => {
            let in_date = this.transDateTitle(items);
            $('.ant-fullcalendar-tbody td[title="'+in_date+'"]').addClass('ant-fullcalendar-selected-day');
        });
    }

    getData = () => {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/dateList'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const selected = [];
                res.body.data.forEach((items,index) => {
                    selected.push(moment(items.date).format('YYYY-MM-DD'));
                    this.originalArr.push(moment(items.date).format('YYYY-MM-DD'));
                });
                this.setState({
                    selected
                });
            });
    }

    componentDidMount(){
        this.getData();
    }

    componentDidUpdate(){
        this.init();
    }

    render(){
        return(
            <div style={{ width: 400, border: '1px solid #d9d9d9', borderRadius: 4, textAlign: 'center' }}>
                <h2 style={{marginTop: 18}}>工作日管理</h2>
                <Calendar fullscreen={false} onSelect={this.onSelect} onPanelChange={this.onPanelChange} />
                <Button type={"primary"} onClick={this.subDate} style={{marginBottom: 10}}>提交</Button>
            </div>
        )
    }
}

export default AttendanceCalendar;