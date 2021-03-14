import React, { Component } from 'react';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common.js';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class AffairPdf extends Component {
    constructor(props) {
        super(props);
        this.affairId;
    }

    state = {
        pdfTemp: '',
        visible: false
    }

    componentWillReceiveProps(props) {
        const { affairId } = props;
        if (affairId) {
            if(this.affairId!=affairId){
                this.fetchMsg(affairId);
                this.affairId = affairId;
            }else{
                this.setState({
                    visible: true
                });
            }
        }
    }

    fetchMsg(affairId) {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/notiClient/list'))
            .set("token", token)
            .query({
                noti_client_affair_group_uuid: affairId,
                page: 1,
                num: 9999999
            })
            .end((err, res) => {
                if (err) return;
                this.mailTemp(res.body.data);
            });
    }

    mailTemp(selectedMailList) {
        if (selectedMailList.length == 0) return;
        selectedMailList = selectedMailList.reverse();
        //消息对齐方向
        const checkDirection = (items) => {
            const user_id = sessionStorage.getItem('user_id');
            const sender = items.sender;
            if (user_id != sender) {
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-rightTop',
                    flexDirection: 'row'
                };
            } else {
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-leftTop',
                    flexDirection: 'row-reverse'
                }
            }
        }

        //渲染内容
        const renderContent = (items) => {
            const locationHref = (items) => {
                let data = {
                    frontUrl: items.frontUrl,
                    affairId: items.noti_client_affair_group_uuid
                };
                this.subHandleTableClick(data);
            }

            const trans = (content) => {
                content = content.replace(/\n/g, '</br>');
                content = content.replace(/\s/g, '&nbsp;');
                return content;
            }

            // if (items.class != 'respoAffair') {
            //     return <div title={'点击跳转到指定事务'} style={{ cursor: 'pointer' }} onClick={() => locationHref(items)} dangerouslySetInnerHTML={{ __html: trans('【' + items.title + '】' + items.content) }}></div>;
            // } else {
                return <div dangerouslySetInnerHTML={{ __html: trans(items.content) }}></div>
            // }
        }

        //附件
        const annex = (items) => {
            // if (items.class != 'respoAffair') return;
            let albumArr = [], albumNameArr = [], fileArr = [], fileNameArr = [];
            if (items.album) {
                albumArr = items.album.split(',');
                albumNameArr = items.albumName.split(',');
            }
            if (items.file) {
                fileArr = items.file.split(',');
                fileNameArr = items.fileName.split(',');
            }
            return <div>
                <div style={{ padding: 2 }}>
                    {
                        albumArr.map((items, index) =>
                            <a key={items} title={albumNameArr[index]} target={'_blank'} href={common.staticBaseUrl('/img/notiClient/' + items)}>
                                <img style={{ marginLeft: 13 }} src={common.staticBaseUrl('/img/notiClient/small_' + items)} />
                            </a>
                        )
                    }
                </div>
                <div style={{ padding: 2 }}>
                    {
                        fileArr.map((items, index) =>
                            <p key={items} style={{ marginBottom: 0 }}>
                                <a style={{ marginLeft: 13 }} title={fileNameArr[index]} target={'_blank'} href={common.staticBaseUrl('/notiClient/' + items)}>
                                    {Number(index + 1) + '. ' + fileNameArr[index]}
                                </a>
                            </p>
                        )
                    }
                </div>
            </div>;
        }

        //回复模板
        const actionshow = (it) => {
            // if (it.class != 'respoAffair') return;
            const user_id = sessionStorage.getItem('user_id');

            //自己发的模板
            const tempSelfPublish = (it) => {
                const trans = (content) => {
                    try {
                        content = content.replace(/\n/g, '</br>');
                        content = content.replace(/\s/g, '&nbsp;');
                    } catch (e) {

                    }
                    return content;
                }
                let _contentArr;
                try {
                    _contentArr = it.votes.split(',');
                } catch (e) {
                    _contentArr = [];
                }
                _contentArr.forEach((_it, _ind) => {
                    _contentArr[_ind] = {};
                    _contentArr[_ind][_it] = [];
                });
                _contentArr.push({
                    '未处理': []
                });
                it.NotiClientSubs.map((_items, _index) => {
                    _contentArr.forEach((_it, _ind) => {
                        for (let _key in _it) {
                            if (_items.vote == _key) {
                                _contentArr[_ind][_key].push(_items.receiverName);
                                // _contentArr[_ind][_key].push(_items.receiver);
                                break;
                            } else if (!_items.vote && _ind == _contentArr.length - 1 && _items.replied == 0) {
                                // _contentArr[_contentArr.length-1]['未处理'].push(_items.receiver);
                                // _contentArr[_contentArr.length-1]['未投票'].push(_items.receiverName);
                            }
                        }
                    });
                    if (_items.replied == 0) {
                        _contentArr[_contentArr.length - 1]['未处理'].push(_items.receiverName);
                        // _contentArr[_contentArr.length-1]['未处理'].push(_items.receiver);
                    }
                });
                const inRender = (items) => {
                    for (let key in items) {
                        return <div key={key}>
                            <span>{key}（{items[key].length}）：</span>
                            <span>{items[key].join()}</span>
                        </div>
                    }
                }
                const orderReply = () => {
                    let resArr = [];
                    it.NotiClientSubs.map((_items, _index) => {
                        if (_items.atMe) {
                            resArr.push(_items);
                        }
                    });
                    const s = (a, b) => {
                        return Date.parse(a.replyTime) - Date.parse(b.replyTime);
                    }
                    resArr = resArr.sort(s);
                    return resArr.map(items =>
                        <p key={items.id} style={{ marginBottom: 0 }}>
                            <span>{items.receiverName}：</span>
                            {/* <span>{items.receiver}：</span> */}
                            {/* <span>{items.atReply}</span> */}
                            <span dangerouslySetInnerHTML={{ __html: trans(items.atReply) }}></span>
                        </p>
                    );
                }
                /*************清除已阅********************/
                let key1, key2, v1, v2;
                _contentArr.forEach((items, index) => {
                    for (let key in items) {
                        if (index == 0) {
                            key1 = key;
                        } else if (index == 1) {
                            key2 = key;
                            v2 = items[key];
                        }
                    }
                });
                if (_contentArr.length == 2 && key1 == '已阅' && key2 == '未处理' && v2.length == 0) {
                    _contentArr = [];
                }
                /****************************************/

                _contentArr.forEach((items, index) => {
                    for (let key in items) {
                        if (key == '未处理' && items[key].length == 0) {
                            _contentArr.splice(index, 1);
                        }
                    }
                });

                /*****************返回结果***********************/
                const orderReplyArr = orderReply();
                if (orderReplyArr.length != 0 || _contentArr.length != 0) {
                    return <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                        {
                            orderReply()
                        }
                        {
                            _contentArr.map(items =>
                                inRender(items)
                            )
                        }
                    </div>
                }
            }

            //别人发的模板
            const tempOtherPublish = (it) => {
                const user_id = sessionStorage.getItem('user_id');
                let mark = false;
                //防止回复模板刷多次
                const hasDoneArr = [];
                return it.NotiClientSubs.map((_items, _index) => {
                    if (user_id == _items.receiver) {
                        mark = true;
                        // if (_items.replied == 1) {
                        if (hasDoneArr.indexOf(_items.receiver) == -1) {
                            hasDoneArr.push(_items.receiver);
                            //回复完毕之后，看到的内容跟发送人一致
                            return tempSelfPublish(it);
                        }
                        // }
                    } else if (user_id != _items.receiver && _index == it.NotiClientSubs.length - 1) {
                        //路人看到的回执信息跟发件人一样
                        if (!mark) return tempSelfPublish(it);
                    }
                });
            }

            if (it.sender == user_id) { //自己发的
                return tempSelfPublish(it);
            } else {
                return tempOtherPublish(it);
            }
        }
        let temp = <div className={"chats"}>
            {
                selectedMailList.map(items =>
                    <div data-uuid={items.mailId} key={items.mailId} className={"chat"} style={{ display: 'flex', flexDirection: checkDirection(items)['flexDirection'], margin: 10 }}>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0 }}>{items.senderName}</p>
                            {/* <p style={{margin: 0}}>{items.sender}</p> */}
                        </div>
                        <div className={checkDirection(items)['popoverPlace']} style={{ position: 'relative', maxWidth: 600, zIndex: 1 }}>
                            <div className={"ant-popover-content"}>
                                <div className={"ant-popover-arrow"}></div>
                                <div className={"ant-popover-inner"}>
                                    <div>
                                        <div className={"ant-popover-title"}>
                                            <span>{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                        </div>
                                        <div className={"ant-popover-inner-content"}
                                            onMouseEnter={(e) => {
                                                if ($(e.target).find('.addReply').css('display') == 'none' && $(e.target).find('.msgExport').css('display') == 'none') {
                                                    $(e.target).find('.actionBar').fadeIn();
                                                } else if ($(e.target).parents('.ant-popover-inner-content').find('.addReply').css('display') == 'none' && $(e.target).parents('.ant-popover-inner-content').find('.msgExport').css('display') == 'none') {
                                                    $(e.target).parents('.ant-popover-inner-content').find('.actionBar').fadeIn();
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if ($(e.target).find('.addReply').css('display') == 'none' && $(e.target).find('.msgExport').css('display') == 'none') {
                                                    $(e.target).find('.actionBar').fadeOut();
                                                } else if ($(e.target).parents('.ant-popover-inner-content').find('.addReply').css('display') == 'none' && $(e.target).parents('.ant-popover-inner-content').find('.msgExport').css('display') == 'none') {
                                                    $(e.target).parents('.ant-popover-inner-content').find('.actionBar').fadeOut();
                                                }
                                            }}
                                        >
                                            <div>
                                                <p style={{ marginBottom: 0, wordBreak: 'break-all', wordWrap: 'break-word' }}>{renderContent(items)}</p>
                                                {/* <p style={{marginBottom: 0,wordBreak: 'break-all',wordWrap: 'break-word'}}>{items.content}</p> */}
                                            </div>
                                        </div>
                                        {annex(items)}
                                        {/* <div style={{padding: '12px 16px',borderTop: '1px solid #eee'}}> */}
                                        {actionshow(items)}
                                        {/* </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>;
        this.setState({
            pdfTemp: temp,
            visible: true
        },() => {
            $('.lookingTemp .pdfTemp').scrollTop($('.lookingTemp .chats').height());
        });
    }

    render() {
        const { pdfTemp,visible } = this.state;
        const w = window.innerWidth-400;
        const h = window.innerHeight-200;
        if (!pdfTemp) return <p></p>;
        let display;
        if(visible){
            display = 'block';
        }else{
            display = 'none';
        }
        return  <div style={{
                    position: 'absolute',
                    width: window.innerWidth,
                    height: window.innerHeight,
                    top: 0,
                    left: 0,
                    display: display
                }} className={'lookingTemp'}>
                    <div style={{
                        position: 'absolute',
                        width: window.innerWidth,
                        height: window.innerHeight,
                        background: '#333',
                        top: 0,
                        left: 0,
                        zIndex: 5,
                        opacity: 0.8,
                    }} onClick={() => this.setState({visible: false})}></div>
                    <div style={{
                        width: w,
                        height: h,
                        position: 'absolute',
                        top: (window.innerHeight - h)/2,
                        left: (window.innerWidth - w)/2,
                        background: '#fff',
                        zIndex: 6,
                        padding: 16,
                        borderRadius: 6
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'auto'
                        }} className={'pdfTemp'}>{pdfTemp}</div>
                    </div>
                </div>
    }
}

export default AffairPdf;