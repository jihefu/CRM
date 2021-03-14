import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Icon, Button,message,Form,Input,Radio,Select,Tree,Checkbox,Empty,Tag, Modal, InputNumber, Table, Popconfirm } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import Base from '../../public/js/base.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import PhotoLooker from '../common/PhotoLooker.jsx';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const RadioGroup = Radio.Group;

class MeetOrdersImage extends Component {
    constructor(props) {
        super(props);
        this.canRenderPhoto = false;
    }

    state = {
        timeList: [],
        imageArr: [],
        selectedKeys: ['全部'],
    };

    componentDidMount() {
        this.fetchTimeList();
        this.fetchImage();
    }

    fetchTimeList = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/business/getTotalMeetMsgTime'))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                const children = [];
                for (const key in res.body.data) {
                    const obj = {
                        title: key,
                        key,
                        children: res.body.data[key].map(items => {
                            return {
                                title: items,
                                key: items,
                            };
                        }),
                    };
                    children.push(obj);
                }
                this.setState({
                    timeList: [{
                        title: '全部',
                        key: '全部',
                        children,
                    }],
                });
            });
    }

    fetchImage = () => {
        const { selectedKeys } = this.state;
        let contact_time;
        if (selectedKeys.length !== 0 && selectedKeys[0] !== '全部') {
            contact_time = selectedKeys[0];
        }
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/business/getImageListByContactTime'))
            .set("token", token)
            .query({ contact_time })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    imageArr: res.body.data,
                });
            });
    }

    treeClick = selectedKeys => {
        this.setState({
            selectedKeys,
        }, () => {
            this.fetchImage();
        });
    }

    renderImage = () => {
        const that = this;
        const { imageArr } = this.state;
        if (imageArr.length === 0) return <Empty />;
        return imageArr.map(items => {
            const src = '/img/gallery/list_';
            return <div style={{width: 120, margin: 6, display: 'inline-block'}} key={items}>
                    <img 
                        title={items}
                        className={'gallery_img'}
                        style={{cursor: 'pointer', margin: 6, border: '1px solid #eee', borderRadius: 4, boxShadow: '5px 5px 5px #ccc', width: 100}}
                        key={items}
                        src={common.staticBaseUrl(src+items)}
                        onClick={() => openImgLooker(items)}
                    />
                </div>
        });

        function openImgLooker(imgName) {
            that.canRenderPhoto = true;
            that.setState({
                imgSrc: common.staticBaseUrl('/img/gallery/'+imgName),
            }, () => that.canRenderPhoto = false);
        }
    }

    render() {
        const { timeList, selectedKeys, imageArr, imgSrc } = this.state;
        if (timeList.length === 0) {
            return <div></div>
        }
        const h = $('.sideMenuWrap').height();
        return (
            <div style={{display: 'flex', height: '100%'}}>
                <div style={{width: 200, height: h, overflow: 'auto', borderRight: '1px solid #eee'}}>
                    <Tree
                        showLine={true}
                        treeData={timeList}
                        defaultExpandedKeys={['全部']}
                        selectedKeys={selectedKeys}
                        onSelect={this.treeClick}
                    />
                </div>
                <div style={{flex: 1, height: h, overflow: 'auto'}}>
                    <div style={{width: '100%', heigth: 30}}>
                        <span style={{color: '#999', marginLeft: 6, marginTop: 7}}>总数量：{imageArr.length}</span>
                    </div>
                    { this.renderImage() }
                </div>
                <PhotoLooker albumBorwerArr={imageArr} imgSrc={imgSrc} canRenderPhoto={this.canRenderPhoto}></PhotoLooker>
            </div>
        )
    }
}

export default MeetOrdersImage;