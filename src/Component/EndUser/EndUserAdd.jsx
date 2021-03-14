import React, { Component } from 'react';
import { Form, Select } from 'antd';
import { PublicRealtionShipAddCls } from '../PublicRelationShip/PublicRelationShipAdd.jsx';

class EndUserAddCls extends PublicRealtionShipAddCls {
    constructor(props) {
        super(props);
        this.addPathname = '/endUser';
        this.state.labelProperty = {
            user_name: {label: '用户名', rules: [{
                required: true, message: '不能为空',
            }]},
            province: {label: '省份', rules: [{
                required: true, message: '不能为空',
            }], temp: <Select>
                {
                    this.provinceArr.map(items => 
                        <Select.Option key={items} value={items}>{items}</Select.Option>
                    )
                }
            </Select>},
            town: {label: '城市', rules: [{
                required: true, message: '不能为空',
            }]},
		}
    }
}

const EndUserAdd = Form.create()(EndUserAddCls);

export default EndUserAdd;