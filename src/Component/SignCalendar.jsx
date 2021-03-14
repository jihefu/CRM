import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Progress,Calendar,Input,Select,Upload,Badge, Rate } from 'antd';
import request from 'superagent';
import moment from 'moment';
import ModalTemp from './common/Modal.jsx';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import common from '../public/js/common.js';
import { comment } from 'postcss';
moment.locale('zh-cn');
const Option = Select.Option;
const { TextArea } = Input;

class SignCalendar extends Component {
    constructor(props) {
        super(props);
        this.dateCellRender = this.dateCellRender.bind(this);
        this.lastSelect;
    }

    state = {
        dataStore: [],
        user_id: ''
    }

    /****************************** 日历 ************************************/

    onPanelChange = (result,type) => {
        if(type=='year') return;
        this.getAllMonthData(result.format('YYYY-MM'));
        try{
            this.props.monthChange(result.format('YYYY-MM'));
        }catch(e){

        }
    }
    transDateTitle = (value) => {
        let YYYY = value.split('-')[0];
        let MM = parseInt(value.split('-')[1]);
        let DD = parseInt(value.split('-')[2]);
        return YYYY+'年'+MM+'月'+DD+'日';
    }

    //获取指定月份的所有考勤相关数据
    getAllMonthData(date){
        let yyyymm = date?date:moment().format('YYYY-MM');
        let user_id = this.state.user_id;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/attendance/getAllMonthData'))
            .set("token", token)
            .query({
                yyyymm: yyyymm,
                admin_id: user_id
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    dataStore: res.body.data
                });
            });
    }

    dateCellRender(value){
        setTimeout(() => {
            $('.ant-radio-group').css('display','none');
        },0);
        const { dataStore } = this.state;
        let orderDay = moment(value).format('YYYY-MM-DD');
        let signTimeArr = [],overworkArr = [],onDutyArr = [];
        //正常签到
        const dealerSign = (signTime,_i,items) => {
            if(_i==0){
                //在岗时间
                let on_hours = items.on_hours;
                //签到时间
                if(signTime=='17:00:00'){
                    return <Badge key={signTime} status={'error'} text={'缺勤（'+on_hours+' h）'} />;
                }else if(Date.parse(moment().format('YYYY-MM-DD')+' '+signTime)>Date.parse(moment().format('YYYY-MM-DD')+' '+'09:00:00')){
                    return <Badge key={signTime} status={'warning'} text={'签到：'+signTime+'（ '+on_hours+' h）'} />;
                }else{
                    if(signTime!='Invalid date'){
                        return <Badge key={signTime} status={'success'} text={'签到：'+signTime+'（ '+on_hours+' h）'} />;
                    }else{
                        return <Badge key={signTime} status={'warning'} text={'未签到（'+on_hours+' h）'} />;
                    }
                }   
            }
        }
        //加班
        const dealerOverwork = (signTime,dataObj) => {
            //计算加班时间
            const caculOverWorkTime = (on_time,off_time) => {
                let num = 0;
                let workTime = 0;
                let startTimeStamp;
                let date = moment(on_time).format('YYYY-MM-DD');
                const nineNode = Date.parse(date+' 09:00:00');
                const seventeenNode = Date.parse(date+' 17:00:00');
                const eighteenNode = Date.parse(date+' 18:00:00');
                if(Date.parse(on_time)<=nineNode){  //九点前签到
                    startTimeStamp = nineNode;
                }else if(Date.parse(on_time)>nineNode&&Date.parse(on_time)<=seventeenNode){ //17点前签到
                    startTimeStamp = Date.parse(on_time);
                }else if(Date.parse(on_time)>seventeenNode&&Date.parse(on_time)<=eighteenNode){ //18点前签到
                    startTimeStamp = eighteenNode;
                }else{  //18点后签到
                    startTimeStamp = Date.parse(on_time);
                }
                workTime = (Date.parse(off_time) - Number(startTimeStamp))/(1000*60*60);
                workTime = workTime * dataObj.rate;
                num += workTime;
                return parseInt(num * 100) / 100;
                // return num.toFixed(1);
            }

            let status = 'processing';
            let endWork;
            if(dataObj.off_time){
                endWork = moment(dataObj.off_time).format('YYYY-MM-DD HH:mm:ss');
            }else{
                endWork = signTime;
            }
            if(dataObj.check) status = 'success';
            let t = caculOverWorkTime(signTime,endWork);
            return <div key={dataObj.id}>
                        <Badge key={'overwork_'+signTime} status={status} text={'加班：'+moment(signTime).format('HH:mm:ss')+'（'+t+' h）'} />
                    </div>  
        }
        //值日
        const onDutyFun = (orderDay) => {
            const { user_id } = this.state;
            dataStore[2].forEach((items,index) => {
                if(items.user_id==user_id&&items.date==orderDay){
                    onDutyArr.push(<Badge key={'duty_'+orderDay} status={'success'} text={'值日'} />);
                }
            });
        }
        if(!dataStore[0]) return;
        dataStore[0].forEach((items,index) => {
            dataStore[1].forEach((_it,ind) => {
                if(items.date==orderDay&&items.date==_it.date){
                    /**************************** 子类数据为空时，签到和加班不进入逻辑 ***************************/
                    //签到
                    signTimeArr = items.StaffSignLogs.map((_it,_i) => 
                        dealerSign(moment(_it.on_time).format('HH:mm:ss'),_i,items)
                    )
                    //加班
                    // overworkArr = items.StaffOverWorks.map(it => 
                    //     dealerOverwork(moment(it.on_time).format('HH:mm:ss'),it)
                    // )
                }
                if(items.date==orderDay){
                    //加班
                    overworkArr = items.StaffOverWorks.map(it => 
                        dealerOverwork(moment(it.on_time).format('YYYY-MM-DD HH:mm:ss'),it)
                    )
                    //值日
                    onDutyFun(orderDay);
                }
            });
        });
        signTimeArr = [...signTimeArr,...overworkArr,...onDutyArr];
        signTimeArr = [...new Set(signTimeArr)];
        return signTimeArr?
                (<div className="notes-month">
                    {signTimeArr}
                </div>):null;
    }

    onSelect = (value) => {
        const lastSelect = this.lastSelect;
        const activeDate = moment(value).format('YYYY-MM');
        if(lastSelect==activeDate) return;
        this.lastSelect = activeDate;
        this.getAllMonthData(activeDate);
        try{
            this.props.monthChange(activeDate);
        }catch(e){

        }
        setTimeout(() => {
            $('.ant-fullcalendar-today').removeClass('ant-fullcalendar-today');
        },0);
    }

    componentDidMount(){
        this.onSelect(moment());
    }
    componentWillReceiveProps(props){
        this.setState({
            user_id: props.user_id
        },() => {
            if(props.yyyymm){
                this.getAllMonthData(props.yyyymm);
            }else{
                this.getAllMonthData();
            }
        });
    }

    render(){
        return (
            <Calendar dateCellRender={this.dateCellRender} onPanelChange={this.onPanelChange} onSelect={this.onSelect} />
        )
    }
}

export default SignCalendar;