import React, { Component } from 'react';
import { Descriptions, Drawer, Button, Message } from 'antd';
import { Link } from 'react-router';
import common from '../../public/js/common.js';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import RepairMsg from '../VirProducts/RepairMsg';
import OtherProductsEdit from './OtherProductsEdit';
moment.locale('zh-cn');

class OtherProductsInfo extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        drawerTitle: '对话记录',
        visible: false,
        repairMsgVisible: false,
        selfInfoVisible: false,
        repair_contractno: '',
    };

    componentDidMount() {

    }

    drawerClose = () => {
        this.setState({
            visible: false,
            repairMsgVisible: false,
            selfInfoVisible: false,
        });
    }

    showSelfInfoAction = () => {
        this.setState({
            visible: true,
            drawerTitle: '编辑',
            selfInfoVisible: true,
        });
    }

    renderSelfInfo = () => {
        const info = this.props.location.state.row;
        return (
            <div style={{position: 'relative'}}>
                <Button onClick={this.showSelfInfoAction} type={'primary'} style={{position: 'absolute', right: 36, top: 0}}>操作</Button>
                <Descriptions column={3} size={'small'} style={{marginTop: 20}} title={<span style={{marginLeft: 12}}>基本信息</span>} bordered>
                    <Descriptions.Item label="序列号">{info.serialNo}</Descriptions.Item>
                    <Descriptions.Item label="型号">{info.model}</Descriptions.Item>
                    <Descriptions.Item label="规格">{info.standrd}</Descriptions.Item>
                    <Descriptions.Item label="厂家">{info.manufacturer}</Descriptions.Item>
                    <Descriptions.Item label="估值">{info.valuation}</Descriptions.Item>
                </Descriptions>
            </div>
        );
    }

    renderRepairList() {
        const arr = [];
        const list = this.props.location.state.row.repairList;
        list.forEach((items, index) => {
            arr.push(<Descriptions.Item key={'申请时间_' + index} label="申请时间">{moment(items.receive_time * 1000).format('YYYY-MM-DD')}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'申报人_' + index} label="申报人">{items.contact}</Descriptions.Item>);
            arr.push(
                <Descriptions.Item key={'描述_' + index} label="描述">
                    故障：{items.problems}；
                    结果：{items.treatement}；
                    单号：<Link to={'/repairs'} state={{repair_contractno: items.repair_contractno}}>
                            {items.repair_contractno}
                        </Link>
                </Descriptions.Item>);
            arr.push(<Descriptions.Item key={'_repair操作_'} label="操作"><a onClick={() => this.showRepairMsgAction(items.repair_contractno)} href="javascript:void(0);">详细</a></Descriptions.Item>);
        });
        return (
            <div>
                <Descriptions column={4} size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>维修记录</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    showRepairMsgAction = repair_contractno => {
        this.setState({
            visible: true,
            drawerTitle: '对话记录',
            repairMsgVisible: true,
            repair_contractno: repair_contractno,
        });
    }

    scrapped = () => {
        const token = sessionStorage.getItem('token');
		request.delete(common.baseUrl('/otherProducts/del/' + this.props.location.state.row.id))
			.set("token",token)
			.end((err,res) => {
				if(err) return;
                Message.success(res.body.msg);
                Base.RemoveStateSession();
				setTimeout(this.props.history.goBack, 1000);
			});
    }

    render() {
        const { repairMsgVisible, selfInfoVisible, visible, drawerTitle, repair_contractno } = this.state;
        const { model, standrd, manufacturer, valuation, id, album } = this.props.location.state.row;
        return (
            <div>
                <div className={'virProductsInfo'}>
                    {this.renderSelfInfo()}
                    {this.renderRepairList()}
                    <div style={{margin: '40px 0px', textAlign: 'center'}}>
                        <Button type='danger' onClick={this.scrapped}>报废</Button>
                    </div>
                </div>
                <Drawer
                    width={600}
                    title={drawerTitle}
                    placement="right"
                    closable={false}
                    onClose={this.drawerClose}
                    visible={visible}
                >
                    { repairMsgVisible && <RepairMsg sn={this.props.location.state.row.serialNo} repair_no={repair_contractno}></RepairMsg> }
                    { selfInfoVisible && <OtherProductsEdit history={this.props.history} model={model} standrd={standrd} manufacturer={manufacturer} valuation={valuation} album={album} id={id}></OtherProductsEdit> }
                </Drawer>
            </div>
        );
    }
}

export default OtherProductsInfo;