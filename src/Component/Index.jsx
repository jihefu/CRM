import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Collapse } from 'antd';
import request from 'superagent';
import moment from 'moment';
import ModalTemp from './common/Modal.jsx';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import common from '../public/js/common.js';
import Sign from './Sign.jsx';
import NotifyAffairs from './NotifyAffairs.jsx';
import MsgBox from './Affair/MsgBox.jsx';
moment.locale('zh-cn');
const Panel = Collapse.Panel;

class Index extends Component {
    constructor(props) {
        super(props);
        this.initTotalHeight = window.innerHeight;
        this.initSignHeight = 400;
        this.initMsgHeight = this.initTotalHeight - this.initSignHeight - 185;
        this.state = {
            msgHeight: this.initMsgHeight,
        };
    }

    componentWillMount() {
        if ($('#preloadHtml').length === 0) $('body').append('<iframe id="preloadHtml" src="'+common.staticBaseUrl('/html/preloading.html')+'" style="display: none;"></iframe>');
        $('html').css('overflow', 'hidden');
        this.collapseChange(this.getDefaultActiveKey());
    }

    componentWillUnmount() {
        $('html').css('overflow', 'initial');
    }

    collapseChange = v => {
        if (v.length === 1 && v[0] === '1') {
            this.setState({
                msgHeight: this.initMsgHeight + this.initSignHeight,
            });
        } else {
            this.setState({
                msgHeight: this.initMsgHeight,
            });
        }
        const defaultActiveKey = JSON.stringify(v);
        sessionStorage.setItem('indexDefaultActive', defaultActiveKey);
    }

    getDefaultActiveKey = () => {
        let defaultActiveKey = sessionStorage.getItem('indexDefaultActive');
        if (!defaultActiveKey) {
            defaultActiveKey = ['0', '1'];
        } else {
            defaultActiveKey = JSON.parse(defaultActiveKey);
        }
        return defaultActiveKey;
    }

    render() {
        const { msgHeight } = this.state;
        return <div className={"indexPage"} style={{display: 'flex', flexDirection: 'column'}}>
                    <Collapse defaultActiveKey={this.getDefaultActiveKey()} onChange={this.collapseChange}>
                        <Panel style={{ textAlign: 'center' }} showArrow={true} header={'考勤'}>
                            <Sign></Sign>
                        </Panel>
                        <Panel style={{ textAlign: 'center' }} showArrow={true} header={'消息'}>
                            <div style={{flex: 1,display: 'flex',overflow: 'auto', textAlign: 'left'}}>
                                <div style={{flex: 1,overflow: 'auto', height: msgHeight}} className={'NotifyAffairs'}>
                                    <NotifyAffairs parentProps={this.props} msgHeight={msgHeight}></NotifyAffairs>
                                </div>
                                <div style={{flex: 1,overflow: 'auto',borderLeft: '1px solid #eee', height: msgHeight}} className={'MsgBox'}>
                                    <MsgBox siderList={this.props.siderList} msgHeight={msgHeight}></MsgBox>
                                </div>
                            </div>
                        </Panel>
                    </Collapse>
                </div>;
    }
}

export default Index;