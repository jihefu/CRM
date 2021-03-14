import React, { Component } from 'react';
import { Form, Select } from 'antd';
import { PublicRealtionShipEditCls } from '../PublicRelationShip/PublicRelationShipEdit.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class EndUserEditCls extends PublicRealtionShipEditCls {
    constructor(props) {
        super(props);
        this.deleteUrl = '/endUser/'+this.props.location.state.user_id;
        this.target_key_prefix = '/endUser/';
        this.state.labelProperty = {
            user_name: {label: '用户名', input_attr: {disabled: 'disabled'}},
            user_id: {label: '用户号', input_attr: {disabled: 'disabled'}},
            // certified: {label: '认证状态', temp: <Select onChange={this.certifiedChange}>
            //     <Select.Option key={0} value={0}>{'待认证'}</Select.Option>
            //     <Select.Option key={1} value={1}>{'已认证'}</Select.Option>
            //     <Select.Option key={2} value={2}>{'未通过'}</Select.Option>
            // </Select>},
            // certifiedPerson: {label: '认证人', input_attr: {disabled: 'disabled'}},
            // province: {label: '省份', rules: [{
            //     required: true, message: '不能为空',
            // }], temp: <Select>
            //     {
            //         this.provinceArr.map(items => 
            //             <Select.Option key={items} value={items}>{items}</Select.Option>
            //         )
            //     }
            // </Select>},
            // town: {label: '城镇', rules: [{
            //     required: true, message: '不能为空',
            // }]},
            industry: {label: '行业'},
            use_product: {label: '使用产品'},
            sn: {label: '设备序列号'},
            // email: {label: '邮箱'},
            // zip_code: {label: '邮政编码'},
            rem: {label: '备注'},
            insert_person: {label: '新增人', input_attr: {disabled: 'disabled'}},
            insert_time: {label: '新增时间', input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人', input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间', input_attr: {disabled: 'disabled'}},
		}
    }

    //@override
    transToView(labelProperty, key, data){
        labelProperty[key]['initialValue'] = data[key];
        if (key == 'insert_time' || key == 'update_time') {
            labelProperty[key]['initialValue'] = moment(data[key]).format('YYYY-MM-DD HH:mm:ss');
        } else if (key == 'user_name') {
            if (data['certified'] == 1) {
                labelProperty[key].input_attr = {disabled: 'disabled'};
            } else {
                delete labelProperty[key].input_attr;
            }
        }
    }

    //@override
    certifiedChange = v => {
        const { labelProperty } = this.state;
        const user_name = sessionStorage.getItem('user_name');
        this.props.form.setFieldsValue({
            certifiedPerson: user_name,
        });
        if (v === 1) {
            labelProperty.user_name.input_attr = {disabled: 'disabled'};
        } else {
            delete labelProperty.user_name.input_attr;
        }
        this.setState({
            labelProperty,
        });
    }
}

const EndUserEdit = Form.create()(EndUserEditCls);

export default EndUserEdit;