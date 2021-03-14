import React, { Component } from 'react';
import { Form, Select, DatePicker, InputNumber } from 'antd';
import moment from 'moment';
import { PublicRealtionShipEditCls } from '../PublicRelationShip/PublicRelationShipEdit.jsx';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class BuyerEditCls extends PublicRealtionShipEditCls {
    constructor(props) {
        super(props);
        this.deleteUrl = '/buyer/'+this.props.location.state.user_id;
        this.target_key_prefix = '/buyer/';
        this.state.labelProperty = {
            company: {label: '供应商名称', input_attr: {disabled: 'disabled'}},
            user_id: {label: '单位号', input_attr: {disabled: 'disabled'}},
            // legal_person: {label: '法定代表人', rules: [{
            //     required: true, message: '不能为空',
            // }]},
            // tax_id: {label: '税号'},
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
            products: {label: '采购商品'},
            start_buy_time: {label: '初次采购时间'},
            total_amount: {label: '累计采购额', temp: <InputNumber />},
            present_amount: {label: '当年采购额', temp: <InputNumber />},
            // reg_company: {label: '开票公司'},
            // reg_addr: {label: '开票地址'},
            // reg_tel: {label: '开票电话'},
            // bank_name: {label: '开户行'},
            // bank_account: {label: '银行账号'},
            // website: {label: '网站'},
            // email: {label: '邮箱'},
            // zip_code: {label: '邮政编码'},
            rem: {label: '备注'},
            insert_person: {label: '新增人', input_attr: {disabled: 'disabled'}},
            insert_time: {label: '新增时间', input_attr: {disabled: 'disabled'}},
            update_person: {label: '更新人', input_attr: {disabled: 'disabled'}},
            update_time: {label: '更新时间', input_attr: {disabled: 'disabled'}},
		}
    }

    transToView(labelProperty, key, data){
        labelProperty[key]['initialValue'] = data[key];
        if (key == 'insert_time' || key == 'update_time') {
            labelProperty[key]['initialValue'] = moment(data[key]).format('YYYY-MM-DD HH:mm:ss');
        } else if (key == 'total_amount' || key == 'present_amount') {
            labelProperty[key].temp = <InputNumber defaultValue={data[key]} />;
        } else if (key == 'start_buy_time') {
            labelProperty[key]['initialValue'] = data[key] ? moment(data[key]) : moment();
            labelProperty[key].temp = <DatePicker defaultValue={labelProperty[key]['initialValue']} />;
        }
    }
}

const BuyerEdit = Form.create()(BuyerEditCls);

export default BuyerEdit;