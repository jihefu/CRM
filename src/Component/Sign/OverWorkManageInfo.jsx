import React, { Component } from 'react';
import { message, Rate, Button, Popconfirm, InputNumber, Input } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import 'moment/locale/zh-cn';
import PhotoLooker from '../common/PhotoLooker.jsx';
moment.locale('zh-cn');
const { TextArea } = Input;

class OverWorkManageInfo extends Component {
    constructor(props) {
        super(props);
        this.cancelPhotoLooker = this.cancelPhotoLooker.bind(this);
        this.infoArr = [
            {
                label: '加班开始时间',
                value: 'on_time',
            },
            {
                label: '加班结束时间',
                value: 'off_time',
            },
            {
                label: '指派人',
                value: 'director',
            },
            {
                label: '指派原因',
                value: 'reason',
            },
            {
                label: '现场照片',
                value: 'album',
            },
            {
                label: '加班内容及成果',
                value: 'content',
            },
            {
                label: '认定工时',
                value: 'actionWorkTime',
            },
            {
                label: '指派人审核时间',
                value: 'check_time',
            },
            // {
            //     label: '评分',
            //     value: 'rate',
            // },
            // {
            //     label: '评分备注',
            //     value: 'rem',
            // },
        ];
    }

    state = {
        rate: 0,
        rem: '',
        albumBorwerArr: [],
        imgSrc: '',
        canRenderPhoto: false,
    };

    componentWillMount() {
        const { rate, rem } = this.props.data;
        this.setState({
            rate,
            rem,
        });
    }

    componentWillReceiveProps(props) {
        const { rate, rem } = this.props.data;
        this.setState({
            rate,
            rem,
        });
    }

    // 11111111111
    renderInfo() {
        const { infoArr } = this;
        const that = this;
        const data = this.props.data;
        return infoArr.map(items => {
            return <div key={items.value} style={{
                    display: 'flex',
                    width: '50%',
                    color: 'rgba(0,0,0,0.85)',
                    fontWeight: 'normal',
                    fontSize: 16,
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                    padding: 12,
                    visibility: items.value === 'foo' ? 'hidden' : 'visible',
            }}>
                <span>{items.label}：</span>
                <span style={{whiteSpace: 'pre-wrap'}}>{vFun(items)}</span>
            </div>
        });

        function vFun(items) {
            if (items.value == 'on_time' || items.value == 'off_time' || items.value == 'check_time') {
                return moment(data[items.value]).format('YYYY-MM-DD HH:mm:ss');
            }else if (items.value == 'rate') {
                return <Rate style={{marginTop: -5}} allowHalf disabled value={data[items.value] * 5} />
            } else if (items.value === 'album') {
                let albumArr;
                try{
                    albumArr = data[items.value].split(',').filter(items => items);
                }catch(e){  
                    albumArr = [];
                }
                return <div>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/overwork/'+items;
                                        let small_src = '/img/overwork/'+items;
                                        return(
                                            <img onClick={() => {
                                                that.setState({
                                                    imgSrc: common.staticBaseUrl(src),
                                                    canRenderPhoto: true,
                                                    albumBorwerArr: albumArr,
                                                });
                                            }} key={index} style={{width: 35,height: 35,marginRight: 10, cursor: 'pointer'}} src={common.staticBaseUrl(small_src)} />
                                            // <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                            //     <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(small_src)} />
                                            // </a>
                                        )
                                    }
                                })
                            }
                        </div>
            }
            return data[items.value];
        }
        
    }

    checkActionPower() {
        let { rate, rem } = this.state;
        const data = this.props.data;
        let hasCheckPower = false;
        const user_id = sessionStorage.getItem('user_id');
        if (common.powerCheckMeetOrder.indexOf(user_id) !== -1) hasCheckPower = true;
        if (hasCheckPower) {
            return <Popconfirm placement="top" title={<div>
                <div>
                    <span>评分：</span>
                    <Rate style={{marginTop: -5}} onChange={v => this.setState({ rate: v/5 })} allowHalf value={rate * 5} />
                </div>
                <div style={{display: 'flex', marginTop: 12}}>
                    <span>评分备注：</span>
                    <Input style={{flex: 1}} onChange={e => this.setState({ rem: e.target.value})} value={rem} />
                </div>
            </div>} onConfirm={() => this.changeWorkTime()} okText="Yes" cancelText="No">
                <Button>修改工时</Button>
            </Popconfirm>
        }
    }

    changeWorkTime() {
        const { rate, rem } = this.state;
        const { id } = this.props.data;
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/attendance/rateOverWork'))
            .set("token",token)
            .send({
                id,
                rate,
                rem,
            })
            .end((err,res) => {
                if (err) return;
                message.success(res.body.msg);
                this.props.refresh();
            });
    }

    cancelPhotoLooker() {
        this.setState({
            canRenderPhoto: false,
        });
    }

    // 11111111111
    render() {
        const { albumBorwerArr, imgSrc, canRenderPhoto } = this.state;
        return (
            <div>
                <div style={{display: 'flex'}}>
                    <div style={{flex: 1}}></div>
                    <div style={{display: 'flex', flexWrap: 'wrap', flex: 6}}>
                        { this.renderInfo() }
                        <div style={{marginTop: 20, width: '100%', textAlign: 'center'}}>
                            {/* { this.checkActionPower() } */}
                        </div>
                    </div>
                    <div style={{flex: 1}}></div>
                </div>
                <PhotoLooker cancelPhotoLooker={this.cancelPhotoLooker} albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={canRenderPhoto}></PhotoLooker>
            </div>
        )
    }
}

export default OverWorkManageInfo;