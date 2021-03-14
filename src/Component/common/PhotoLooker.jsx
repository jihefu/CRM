import React, { Component } from 'react';
import request from 'superagent';
import { Icon, message } from 'antd';
import $ from 'jquery';
import common from '../../public/js/common.js';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class PhotoLooker extends Component {
    constructor(props) {
        super(props);
        this.prevImg = this.prevImg.bind(this);
        this.nextImg = this.nextImg.bind(this);
        this.changeSize = this.changeSize.bind(this);
        this.cancelShow = this.cancelShow.bind(this);
        this.affairId;
    }

    state = {
        pdfTemp: '',
        visible: false,
        imgSrc: '',
        albumBorwerArr: [],
        imageRange: 100,
        initDeg: 0,
    }

    componentWillReceiveProps(props) {
        const { imgSrc,canRenderPhoto,albumBorwerArr } = props;
        if (imgSrc&&canRenderPhoto) {
            this.setState({
                pdfTemp: <img className='sizeImage' style={{height: '100%'}} src={imgSrc} />,
                // pdfTemp: <img style={{maxWidth: '100%'}} src={imgSrc} />,
                visible: canRenderPhoto,
                albumBorwerArr,
                imgSrc
            });
        }
    }

    prevImg() {
        let { imgSrc, albumBorwerArr } = this.state;
        const arr = imgSrc.split('/');
        const item = arr.pop();
        let index = albumBorwerArr.indexOf(item);
        if(index == 0){
            message.warning('当前已是第一张');
        }else{
            index--;
            imgSrc = arr.join('/')+'/'+albumBorwerArr[index];
            this.setState({
                imgSrc,
                pdfTemp: <img className='sizeImage' style={{height: '100%'}} src={imgSrc} />,
                initDeg: 0,
            });
            this.totatingReset();
        }
    }

    nextImg() {
        let { imgSrc, albumBorwerArr } = this.state;
        const arr = imgSrc.split('/');
        const item = arr.pop();
        let index = albumBorwerArr.indexOf(item);
        if(index == albumBorwerArr.length-1){
            message.warning('当前已是最后一张');
        }else{
            index++;
            imgSrc = arr.join('/')+'/'+albumBorwerArr[index];
            this.setState({
                imgSrc,
                pdfTemp: <img className='sizeImage' style={{height: '100%'}} src={imgSrc} />,
                initDeg: 0,
            });
            this.totatingReset();
        }
    }

    changeSize(type) {
        let { imageRange } = this.state;
        if(type) {
            imageRange -= 25;
        }else{
            imageRange += 25;
        }
        if(imageRange===0) return;
        $('.sizeImage').height(imageRange+'%');
        this.setState({
            imageRange
        });
    }

    reset() {
        $('.sizeImage').height('100%');
        this.setState({
            imageRange: 100,
            initDeg: 0,
        });
        this.totatingReset();
    }

    rotating = () => {
        let { initDeg } = this.state;
        initDeg++;
        $('.sizeImage').css({
            transform: 'rotate('+(90 * initDeg)+'deg)',
        });
        this.setState({
            initDeg,
        });
    }

    totatingReset = () => {
        $('.sizeImage').css({
            transform: 'rotate(0deg)',
        });
    }

    downloadImg() {
        const { imgSrc } = this.state;
        const filePath = '/img/' + imgSrc.split('/img/')[1];
        window.location.href = common.staticBaseUrl('/downloadImg?filePath='+filePath);
    }

    openInBrowser() {
        const { imgSrc } = this.state;
        const filePath = '/img/' + imgSrc.split('/img/')[1];
        window.open(common.staticBaseUrl(filePath));
    }

    cancelShow() {
        this.setState({visible: false});
        try {
            this.props.cancelPhotoLooker();
        } catch (e) {
            console.log(e);
        }
    }

    render() {
        const { pdfTemp,visible,albumBorwerArr,imageRange } = this.state;
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
                        zIndex: 99,
                        opacity: 0.8,
                    }} onClick={this.cancelShow}></div>
                    <div style={{
                        width: w,
                        height: h,
                        position: 'absolute',
                        top: (window.innerHeight - h)/2,
                        left: (window.innerWidth - w)/2,
                        background: '#fff',
                        zIndex: 100,
                        padding: 16,
                        borderRadius: 6
                    }}>
                        <Icon onClick={this.prevImg} style={{width: 85, height: '98%', display: 'flex', alignItems: 'center', position: 'absolute',zIndex: 11,fontSize: 100,cursor: 'pointer'}} type="left" />
                        <Icon onClick={this.nextImg} style={{width: 85, height: '98%', display: 'flex', alignItems: 'center', position: 'absolute',zIndex: 11,fontSize: 100,cursor: 'pointer',right: 10}} type="right" />
                        <div style={{width: '95%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute',zIndex: 11,bottom: 5, fontSize: 18}}>
                            <div style={{cursor: 'pointer'}} onClick={() => this.changeSize(0)}>
                                <Icon type="zoom-in" />
                                <span>放大</span>
                            </div>
                            <div style={{marginLeft: 40, marginRight: 40}}>{imageRange}%</div>
                            <div style={{cursor: 'pointer'}} onClick={() => this.changeSize(1)}>
                                <Icon type="zoom-out" />
                                <span>缩小</span>
                            </div>
                            <div style={{cursor: 'pointer',marginLeft: 40}} onClick={() => this.reset()}>
                                <Icon type="redo" />
                                <span>重置</span>
                            </div>
                            <div style={{cursor: 'pointer',marginLeft: 40}} onClick={() => this.downloadImg()}>
                                <Icon type="download" />
                                <span>下载</span>
                            </div>
                            <div style={{cursor: 'pointer',marginLeft: 40}} onClick={() => this.openInBrowser()}>
                                <Icon type="global" />
                                <span>在浏览器中打开</span>
                            </div>
                            <div style={{cursor: 'pointer',marginLeft: 40}} onClick={() => this.rotating()}>
                                <Icon type="retweet" />
                                <span>旋转</span>
                            </div>
                        </div>
                        <div style={{
                            width: '90%',
                            height: '93%',
                            overflow: 'auto',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: 'auto'
                        }} className={'pdfTemp'}>{pdfTemp}</div>
                    </div>
                </div>
    }
}

export default PhotoLooker;