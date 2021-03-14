import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { message } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import common from '../../public/js/common.js';
import '../../public/css/msgBox.css';
import Linq from 'linq';
import InfiniteScroll from 'react-infinite-scroller';
import AffairPdf from './AffairPdf';
moment.locale('zh-cn');

class MsgBox extends Component {
    constructor(props){
        super(props);
        this.scrollHeight = 0;
        this.locationHref = this.locationHref.bind(this);
    }

    state = {
        data: [],
        page: 1,
        num: 30,
        hasMore: true,
        pdfAffairId: '',
        // loading: false
    };

    fetch = () => {
        let { data,page,num,hasMore,loading } = this.state;
        // if(loading||!hasMore) return;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/msgBox/list'))
            .set("token", token)
            .query({
                page: page,
                num: num
            })
            .end((err, res) => {
                if (err) return;
                if(res.body.data.length==0){
                    this.setState({
                        hasMore: false
                    });
                }else{
                    res.body.data = res.body.data.reverse();
                    data = [...res.body.data,...data];
                    // data = [...data,...res.body.data];
                    page++;
                    this.setState({
                        data,
                        page
                    },() => {
                        this.autoScrollToTarget();
                        $('.msg_item').off();
                        $('.msg_item').mouseover((e) => {
                            let selectObj = $(e.target);
                            if(selectObj.attr('class')!='msg_item'){
                                selectObj = selectObj.parent();
                            }
                            $(selectObj).css({
                                'text-decoration': 'underline'
                            });
                        });
                        $('.msg_item').mouseout((e) => {
                            let selectObj = $(e.target);
                            if(selectObj.attr('class')!='msg_item'){
                                selectObj = selectObj.parent();
                            }
                            $(selectObj).css({
                                'text-decoration': 'none'
                            });
                        });
                    });
                }
            });
    }

    autoScrollToTarget(){
        try{
            let scrollHeight = document.getElementsByClassName('msgBoxList')[0].scrollHeight - this.scrollHeight;
            document.getElementsByClassName('msgBoxList')[0].scrollTop = scrollHeight;
            this.scrollHeight = document.getElementsByClassName('msgBoxList')[0].scrollHeight;
        }catch(e){

        }
    }

    componentDidMount(){
        setTimeout(() => {
            this.fetch();
        },500);
    }

    renderMsgList(affairId) {
        this.setState({
            pdfAffairId: affairId,
        });
    }

    locationHref(items){
        const mailId = items.mailId;
        const affairId = items.affairId;
        let pathname = items.frontUrl;
        const locationId = items.locationId;
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
                mailId: mailId,
                affairId: affairId,
                locationId: locationId,
                fromBox: true
            };
            if (pathname === '/overWorkManage') {
                this.props.siderList.forEach(items => {
                    if(items.link === '/overWorkManagePro'){
                        pathname = items.link;
                    }
                });
            }
            if (pathname === '/goods') {
                this.props.siderList.forEach(items => {
                    if(items.link === '/goodsView'){
                        pathname = items.link;
                    }
                });
                const no = splitNo(items.content);
                state.no = no;
            }
            hashHistory.push({
                pathname: pathname,
                state,
            });
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
        const publishMsg = () => {
            return  <p style={{
                        'cursor': 'pointer',
                        'wordBreak': 'break-all',
                        'overflow': 'hidden',
                        'display': '-webkit-box',
                        '-webkit-box-orient': 'vertical'
                    }} className={'msg_item'} data-id={items.id} key={items.id} title={'点击跳转至指定事务'} onClick={() => this.locationHref(items)}>
                        <span>
                            【{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                        <span style={{marginLeft: 10}}>
                            {items.title}】
                        </span>
                        <span style={{marginLeft: 6}}>{items.senderName}：</span>
                        <span style={{marginLeft: 6}}>{items.content}</span>
                    </p>
        }

        const replyMsg = () => {
            return  <p style={{cursor: 'pointer'}} className={'msg_item'} data-id={items.id} key={items.id} title={'点击跳转至指定事务'} onClick={() => this.locationHref(items)}>
                        <span>
                            【{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                        <span style={{marginLeft: 10}}>
                            {items.title}】
                        </span>
                        <span style={{marginLeft: 6}}>{items.senderName}：</span>
                        <span style={{marginLeft: 6}}>{items.content}</span>
                        <span>（源消息：{items.originMsg}）</span>
                    </p>
        }

        if(items.originMsg){
            return replyMsg();
        }else{
            return publishMsg();
        }
    }

    scrollAnimate(){
        let in_height = $('.msgBoxList p').length * $('.msgBoxList p').height();
        let scrollHeight = document.getElementsByClassName('msgBoxList')[0].scrollHeight;
        scrollHeight = scrollHeight - in_height;
        const scrollMove = () => {
            $('.msgBoxList').scrollTop(0);
            return;
        }

        scrollMove();
    }

    componentDidUpdate(){
        setTimeout(() => {
            $('.msgBoxList').height($('.MsgBox').height()-10);
        },50);
    }

    render(){
        const { data,hasMore,page,num, pdfAffairId } = this.state;
        const height = $('.MsgBox').height()-5;
        return (
            <div style={{marginLeft: 6,marginRight: 6,height: height,overflow: 'auto'}} className={'msgBoxList'}>
                <InfiniteScroll
                    initialLoad={false}
                    pageStart={page}
                    loadMore={this.fetch}
                    hasMore={hasMore}
                    useWindow={false}
                    threshold={1}
                    isReverse={true}
                >
                    {
                        data.map(items => 
                            this.msgTemp(items)
                        )
                    }
                </InfiniteScroll>
                <AffairPdf affairId={pdfAffairId}></AffairPdf>
            </div>
        )
    }
}

export default MsgBox;