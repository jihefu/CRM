import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Progress,Calendar,Input,Select,Upload,Badge,Collapse } from 'antd';
import request from 'superagent';
import moment from 'moment';
import ModalTemp from './common/Modal.jsx';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import common from '../public/js/common.js';
import { comment } from 'postcss';
import SignCalendar from './SignCalendar.jsx';
moment.locale('zh-cn');
const Option = Select.Option;
const { TextArea } = Input;
const Panel = Collapse.Panel;

class Sign extends Component {
    constructor(props) {
        super(props);
    }

    render(){
        const user_id = sessionStorage.getItem('user_id');
        const h = window.innerHeight - 171;
        return (
            <Collapse defaultActiveKey={['0']}>
                <Panel style={{textAlign: 'center'}} showArrow={false} header={'考勤月历'}>
                    <div style={{height: h, overflow: 'auto'}}>
                        <SignCalendar user_id={user_id}></SignCalendar>
                    </div>
                </Panel>
            </Collapse>
        )
    }
}

export default Sign;