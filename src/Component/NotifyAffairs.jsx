import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { message,Input,Button,notification,Radio,Card } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import Linq from 'linq';
import common from '../public/js/common.js';
import AffairPdf from './Affair/AffairPdf';
moment.locale('zh-cn');
const { TextArea } = Input;
const RadioGroup = Radio.Group;

class NotifyAffairs extends Component {
    constructor(props){
        super(props);
        this.action = this.action.bind(this);
        this.publishReply = this.publishReply.bind(this);
        this.first = true;
        this.originDataStore = [];
        this.newDataStore = [];
        this.locationHref = this.locationHref.bind(this);
        this.btnGroup = {
            isReplying: false,
        };
    }
    state = {
        dataStore: [],
        pdfAffairId: '',
    };

    fetch(){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/notiPost/fromCenterList'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const dataStore = res.body.data.map(items => 
                    items
                );
                this.setState({
                    dataStore
                });
                this.originDataStore = this.newDataStore;
                this.newDataStore = [];
                dataStore.forEach((items,index) => {
                    this.newDataStore.push(items.id);
                });
                let hasNewMsg = false;
                Linq.from(this.newDataStore).except(this.originDataStore).forEach((i) => {
                    hasNewMsg = true;
                });
                if(hasNewMsg) {
                    if(!this.first){
                        this.newMsgNotify();
                    }
                }
                this.first = false;
            });
    }

    componentDidMount(){
        this.fetch();
        clearInterval(window.MSGTIMER);
        window.MSGTIMER = setInterval(() => {
            this.fetch();
        // },1000*5);
        },1000*60*2);
    }

    renderMsgList(affairId) {
        this.setState({
            pdfAffairId: affairId,
        });
    }

    //跳转到指定页面处理
    locationHref(items){
        const mailClass = items.NotiPost.class;
        const id = items.id;    //回复id
        const mailId = items.noti_post_mailId;  //消息id
        const affairId = items.NotiPost.noti_client_affair_group_uuid;  //事务id
        const locationId = items.NotiPost.locationId;  //定位id
        let pathname = items.NotiPost.frontUrl;
        if (pathname === '/projectAffair') {
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/getTargetAffair/' + affairId))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    if (res.body.data.state === '进行中') {
                        hashHistory.push({
                            pathname: pathname,
                            state: {
                                id: id,
                                mailId: mailId,
                                affairId: affairId,
                                locationId: locationId,
                                fromBox: true
                            }
                        });
                    } else {
                        this.renderMsgList(affairId);
                    }
                });
        } else {
            const state = {
                id: id,
                mailId: mailId,
                affairId: affairId,
                locationId: locationId,
                fromBox: true
            };
            if (pathname == '/overWorkManage') {
                for (let i = 0; i < this.props.parentProps.siderList.length; i++) {
                    const items = this.props.parentProps.siderList[i];
                    if (items.link == '/overWorkManagePro') {
                        pathname = '/overWorkManagePro';
                    }
                }
            }
            if (pathname === '/goods') {
                for (let i = 0; i < this.props.parentProps.siderList.length; i++) {
                    const items = this.props.parentProps.siderList[i];
                    if(items.link === '/goodsView'){
                        pathname = items.link;
                    }
                }
                const no = splitNo(items.NotiPost.content);
                state.no = no;
            }
            hashHistory.push({
                pathname: pathname,
                state,
            });
        }
        if(mailClass=='forward'){
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/notiPost/fromCenterUpdateReply'))
                .set("token", token)
                .send({
                    id: id
                })
                .end((err, res) => {});
        }

        function splitNo(str) {
            const startIndex = str.indexOf('（');
            const endIndex = str.indexOf('）');
            let no = '';
            for (let i = startIndex + 1; i < endIndex; i++) {
                no += str[i];
            }
            return no;
        }
    }

    msgTemp(items){
        const w = ($('.NotifyAffairs').width())/2;
        const renderTemp = () => {
            const meetingTemp = () => {
                if (items.NotiPost.isMeetingMsg) {
                    return <p>会议开始时间：{ moment(items.NotiPost.meetingTime).format('MM-DD HH:mm:ss') }</p>
                }
            }

            if(/<\/p>/.test(items.NotiPost.content)){
                return <h4 className={'voteNotifyAffairsContent'} style={{
                    'wordBreak': 'break-all',
                    'overflow': 'hidden',
                    'display': '-webkit-box',
                    '-webkit-box-orient': 'vertical',
                    '-webkit-line-clamp': 5
                }}>
                    <div style={{marginLeft: 2,color: 'rgba(0, 0, 0, 0.65)',wordBreak: 'break-all',wordWrap: 'break-word'}}
                        dangerouslySetInnerHTML={{__html: items.NotiPost.content}}>
                    </div>
                </h4>
            }else{
                return <h4 className={'notifyAffairsContent'} style={{
                            'wordBreak': 'break-all',
                            'overflow': 'hidden',
                            'display': '-webkit-box',
                            '-webkit-box-orient': 'vertical',
                            '-webkit-line-clamp': 3
                        }}>
                            {meetingTemp()}
                            <span>{items.NotiPost.senderName}：</span>
                            <span style={{marginLeft: 2,color: 'rgba(0, 0, 0, 0.65)',wordBreak: 'break-all',wordWrap: 'break-word'}}>{items.NotiPost.content}</span>
                        </h4>
            }
        }
        return  <Card key={items.id} style={{width: w}} title={
                    <h4 title={"标题："+items.NotiPost.title+"\n时间："+moment(items.NotiPost.post_time).format('YYYY-MM-DD HH:mm:ss')} onClick={() => this.locationHref(items)} style={{display: 'flex',justifyContent: 'space-between',cursor: 'pointer'}}>
                        <span>{items.NotiPost.title}</span>
                        <span style={{marginLeft: 20}}>{moment(items.NotiPost.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </h4>
                }>
                    {renderTemp()}
                    {this.action(items)}
                </Card>
    }

    action(items){
        let _arr;
        try{
            _arr = items.NotiPost.votes.split(',');
        }catch(e){
            _arr = [];
        }
        const atMeTemp = (items) => {
            if(items.atMe==0) return;
            const checkHasDone = () => {
                let hasDone = false;
                if(items.atReply) hasDone = true;
                if(hasDone){
                    return  <div style={{marginBottom: 5}}>
                                {items.atReply}
                            </div>
                }else{
                    return <div style={{textAlign: 'right',marginTop: 5}} key={items.id}>
                                <TextArea rows={3}></TextArea>
                                <Button style={{fontSize: 12,marginTop: 5}} size={'small'} type={'primary'} 
                                    onClick={(e) => this.publishReply({
                                        id: items.id,
                                        noti_client_mailId: items.noti_post_mailId,
                                        atReply: $(e.target).parent().parent().find('textarea').val()
                                    })}
                                >{'回复'}</Button>
                            </div>
                }
            }
            return checkHasDone();
        }
        const radioTemp = (items) => {
            if(_arr.length==0) return;
            const checkHasDone = () => {
                let hasDone = false;
                if(items.vote) hasDone = true;
                if(hasDone){
                    return  <div style={{marginBottom: 5}}>
                                {items.vote}
                            </div>
                }else{
                    return <div style={{marginBottom: 5}}>
                                <RadioGroup defaultValue={_arr[0]}>
                                    {
                                        _arr.map(items => 
                                            <Radio key={items} value={items}>{items}</Radio>
                                        )
                                    }
                                </RadioGroup>
                                <Button type={'primary'} style={{marginLeft: 25,fontSize: 12}} size={'small'} onClick={(e) => {
                                    let index = $(e.target).parent().parent().find('.ant-radio-wrapper-checked').index();
                                    this.publishReply({
                                        id: items.id,
                                        noti_client_mailId: items.noti_post_mailId,
                                        vote: _arr[index]
                                    })
                                }}>提交</Button>
                            </div>
                }
            }
            return checkHasDone();
        }
        return  <div key={items.id} style={{marginTop: 15}}>
                    {radioTemp(items)}
                    {atMeTemp(items)}
                </div>
    }

    publishReply(params){
        if(!params.vote&&!params.atReply){
            message.warn('回复不能为空');
            return;
        }
        if (this.btnGroup.isReplying) return;
        this.btnGroup.isReplying = true;
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/notiPost/fromCenterUpdate'))
            .set("token", token)
            .send(params)
            .end((err, res) => {
                this.btnGroup.isReplying = false;
                if (err) return;
                if(res.body.code==-1){
                    message.error(res.body.msg);
                    return;
                }
                message.success(res.body.msg);
                this.fetch();
            });
    }

    componentDidUpdate(){
        let len = $('.card_wrap .ant-card').length;
        let w;
        if(len<2){
            w = $('.card_wrap').width()/len;
        }else{
            w = $('.card_wrap').width()/2;
        }
        $('.card_wrap .ant-card').css({
            width: w
        });
        $('.ant-card-head-title').css({
            'padding-top': '6px',
            'padding-bottom': '0px',
            'margin-top': '4px'
        });
    }

    newMsgNotify(){
        window.selfClientCount++;
        $('body').append('<audio src="'+common.staticBaseUrl("/audio/newMsg.wav")+'" autoplay></audio>');
        let w = document.body.clientWidth - 330;
        let h = document.body.clientHeight - 160;
        let str = '新消息提醒';
        let myWindow = window.open('','','width=300,height=150,left='+w+',top='+h+', toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, status=no');
		myWindow.document.write("<p>"+str+"</p>");
        myWindow.focus();
        setTimeout(() => {
            myWindow.close();
        },5000);
    }

    render(){
        const { dataStore, pdfAffairId } = this.state;
        return(
            <div>
                <div style={{display: 'flex',flexWrap: 'wrap'}} className={'card_wrap'}>
                    {
                        dataStore.map(items => 
                            this.msgTemp(items)
                        )
                    }
                </div>
                <AffairPdf affairId={pdfAffairId}></AffairPdf>
            </div>
        )
    }
}

export default NotifyAffairs;