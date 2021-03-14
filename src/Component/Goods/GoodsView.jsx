import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message, InputNumber, Popover } from 'antd';
import Goods from './Goods.jsx';
import * as QrCode from 'qrcode.react';
import common from '../../public/js/common.js';
const Option = Select.Option;

class GoodsView extends Goods {
    constructor(props) {
        super(props);
        this.actionWidth = 130;
    }

    //@override
    actionRender(text, row, index){
        const { manager, user } = row;
        const user_name = sessionStorage.getItem('user_name');
        return <p className={"_mark"}>
                    <Popover placement="bottomRight" content={<QrCode value={common.staticBaseUrl('/g/'+row['numbering'])} size={120} />} trigger="click">
                        <a href="javascript:void(0)">二维码</a>
                    </Popover>
                    <a className={"_mark_a"} style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                </p>;
    }
}

export default GoodsView;