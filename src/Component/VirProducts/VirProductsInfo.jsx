import React, { Component } from 'react';
import { Link } from 'react-router';
import common from '../../public/js/common.js';
import request from 'superagent';
import moment from 'moment';
import { Descriptions, Button, Modal, Input, Message, Drawer, Divider, message } from 'antd';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import AppList from './AppList.jsx';
import AddVtcConfig from './AddVtcConfig.jsx';
import AddIniConfig from './AddIniConfig.jsx';
import AddDealRecord from './AddDealRecord.jsx';
import RepairMsg from './RepairMsg';
moment.locale('zh-cn');

class VirProductsInfo extends Component {
    constructor(props) {
        super(props);
        this.scrappedRem = '';
    }

    state = {
        data: {
            productInfo: {},
            hardInfo: {},
            softInfo: [],
            regHistoryList: [],
            warrantyInfo: {},
            repairList: [],
            vtc: [],
            ini: [],
            tradingRecordList: [],
        },
        drawerTitle: '操作',
        visible: false,
        softInfoVisible: false,
        resourceVisible: false,
        resourceIniVisible: false,
        dealVisible: false,
        repairMsgVisible: false,
        repair_contractno: '',
    };

    componentDidMount() {
        this.fetch();
    }

    fetch = () => {
        const { sn } = this.props.location.state;
        const token = sessionStorage.getItem('token');
        request.get(common.apiUrl('/source/ctrl/' + sn))
            .set('token', token)
            .query({
                productInfo: 1,
                hardInfo: 1,
                softInfo: 1,
                regHistoryList: 1,
                warrantyInfo: 1,
                vtc: 1,
                ini: 1,
                repairList: 1,
                tradingRecordList: 1,
            })
            .end((err, res) => {
                this.setState({
                    data: res.body.data,
                });
            });
    }

    renderProductInfo(info) {
        return (
            <Descriptions column={3} size={'small'} style={{marginTop: 20}} title={<span style={{marginLeft: 12}}>出厂</span>} bordered>
                <Descriptions.Item label="序列号">{info.serialNo}</Descriptions.Item>
                <Descriptions.Item label="型号">{info.model}</Descriptions.Item>
                <Descriptions.Item label="批次">{info.batch}</Descriptions.Item>
                <Descriptions.Item label="组装日期">{info.inputDate}</Descriptions.Item>
                <Descriptions.Item label="组装人">{info.maker}</Descriptions.Item>
                <Descriptions.Item label="测试人">{info.tester}</Descriptions.Item>
                <Descriptions.Item label="是否测试">{info.isTest}</Descriptions.Item>
                <Descriptions.Item label="是否合格">{info.isPass}</Descriptions.Item>
                <Descriptions.Item label="测试日期">{info.testTime}</Descriptions.Item>
                <Descriptions.Item label="产品状态">{info.status}</Descriptions.Item>
                <Descriptions.Item label="存放地">{info.storage}</Descriptions.Item>
                <Descriptions.Item label="通道数">{info.chnlNum}</Descriptions.Item>
                <Descriptions.Item label="标比">{info.caliCoeff}</Descriptions.Item>
                <Descriptions.Item label="附注">{info.remark}</Descriptions.Item>
            </Descriptions>
        );
    }

    renderHardInfo(info) {
        return (
            <Descriptions size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>硬件配置</span>} bordered>
                <Descriptions.Item label="型号编码">{info.modelCode}</Descriptions.Item>
                <Descriptions.Item label="固件版本">{info.fwVer}</Descriptions.Item>
                <Descriptions.Item label="规格">{info.authType}</Descriptions.Item>
                <Descriptions.Item label="用户软件许可">{info.oemUser}</Descriptions.Item>
                <Descriptions.Item label="名义试用起始">{info.VBGN}</Descriptions.Item>
                <Descriptions.Item label="名义试用终止">{info.VEND}</Descriptions.Item>
                <Descriptions.Item label="机器码">{info.machineNo}</Descriptions.Item>
                <Descriptions.Item label="注册码">{info.latestRegNo}</Descriptions.Item>
                <Descriptions.Item label="注册状态">{info.validTime}</Descriptions.Item>
                <Descriptions.Item label="AD采集模式">{info.ad2Mode}</Descriptions.Item>
                <Descriptions.Item label="PM脉冲模式">{info.pulseMode}</Descriptions.Item>
                <Descriptions.Item label="DA伺服颤振频率">{info.vibFreq}</Descriptions.Item>
                <Descriptions.Item label="DA伺服颤振幅值">{info.vibAmp}</Descriptions.Item>
                <Descriptions.Item label="SPWM交流幅值">{info.SPWM_AC_AMP}</Descriptions.Item>
                <Descriptions.Item label="DIO模式">{info.SSI_MODE}</Descriptions.Item>
                <Descriptions.Item label="已用小时数">{info.HOURS}</Descriptions.Item>
                <Descriptions.Item label="最近操作者">{info.EMP_NO}</Descriptions.Item>
            </Descriptions>
        );
    }

    renderSoftInfo(info) {
        const arr = [];
        info.forEach(items => {
            const validDate = items.appValidTime == 0 ? '永久注册' : items.appValidTime;
            arr.push(<Descriptions.Item key={items.regAppName} label="软件名">
                <a href={'javascript:void(0);'} onClick={this.buildSofyBySn}>
                    {items.regAppName}
                </a>
            </Descriptions.Item>);
            // arr.push(<Descriptions.Item key={items.appVersion} label="版本号">{items.appVersion}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={items.regAppName + '_' + items.appValidTime + '_1'} label="有效期">{validDate}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={items.regAppName + '_' + items.appRegCode + '_2'} label="注册码">{items.appRegCode}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={items.regAppName + '_' + items.appRegAuth + '_3'} label="授权码">{items.appRegAuth}</Descriptions.Item>);
        });
        return (
            <div>
                {/* <Button onClick={this.showSoftInfoAction} type={'primary'} style={{position: 'absolute', right: 60}}>操作</Button> */}
                <Descriptions column={5} size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>软件配置</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    renderWarrantyInfo(info) {
        return (
            <Descriptions column={4} size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>保修单</span>} bordered>
                <Descriptions.Item label="安装人">{info.bind_unionid}</Descriptions.Item>
                <Descriptions.Item label="安装日期">{info.insert_date}</Descriptions.Item>
                <Descriptions.Item label="有效截至日期">{info.valid_date}</Descriptions.Item>
                <Descriptions.Item label="安装地点">{info.addr}</Descriptions.Item>
            </Descriptions>
        );
    }

    renderRegHistoryList(list) {
        const getEndDate = validDate => {
			if (validDate == 0) {
				return '已永久注册。';
			}
			return '有效期至' + validDate + '。';
		}
        const arr = [];
        list.forEach((items, index) => {
            arr.push(<Descriptions.Item key={'注册人_' + index } label="注册人">{items.name}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'公司_' + index } label="公司">{items.company}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'描述_' + index } label="描述">注册产品{items.product}，{getEndDate(items.validDate)}注册码：{items.regCode}，授权码：{items.authOperKey}</Descriptions.Item>);
        });
        return (
            <div style={{maxHeight: 289, overflow: 'auto'}}>
                <Descriptions size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>注册历史</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    renderRepairList(list) {
        const arr = [];
        list.forEach((items, index) => {
            arr.push(<Descriptions.Item key={'申请时间_' + index} label="申请时间">{items.receive_time}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'申报人_' + index} label="申报人">{items.contact}</Descriptions.Item>);
            arr.push(
                <Descriptions.Item key={'描述_' + index} label="描述">
                    故障：{items.problems}；
                    结果：{items.treatement}；
                    单号：<Link to={'/repairs'} state={{repair_contractno: items.repair_contractno}}>
                            {items.repair_contractno}
                        </Link>
                    {/* <a style={{marginLeft: 12}} href={'javascript:void(0);'} onClick={() => this.showRepairMsgAction(items.repair_contractno)}>更多</a> */}
                </Descriptions.Item>);
            arr.push(<Descriptions.Item key={'_repair操作_'} label="操作"><a onClick={() => this.showRepairMsgAction(items.repair_contractno)} href="javascript:void(0);">详细</a></Descriptions.Item>);
        });
        return (
            <div>
                {/* <Button onClick={this.showRepairMsgAction} type={'primary'} style={{position: 'absolute', right: 60}}>操作</Button> */}
                <Descriptions column={4} size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>维修记录</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    renderVtcList(list) {
        const arr = [];
        list.forEach((items, index) => {
            arr.push(<Descriptions.Item key={'创建时间_' + index} label="创建时间">{items.createdAt}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'更新人_' + index} label="更新人">{items.name}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'更新摘要_' + index} label="更新摘要">{items.versionRem}</Descriptions.Item>);
        });
        return (
            <div size={'small'} style={{maxHeight: 289, overflow: 'auto'}}>
                <Descriptions style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>vtc配置</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    renderIniList(list) {
        const arr = [];
        list.forEach((items, index) => {
            arr.push(<Descriptions.Item key={'创建时间_' + index} label="创建时间">{items.createdAt}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'更新人_' + index} label="更新人">{items.name}</Descriptions.Item>);
            arr.push(<Descriptions.Item  key={'更新摘要_' + index}label="更新摘要">{items.versionRem}</Descriptions.Item>);
        });
        return (
            <div style={{maxHeight: 289, overflow: 'auto'}}>
                <Descriptions size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>ini配置</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    renderTradingRecordList(list) {
        const arr = [];
        list.forEach((items, index) => {
            arr.push(<Descriptions.Item key={'受让方_' + index} label="受让方">{items.transferee}（{items.transferee_person}）</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'出让方_' + index} label="出让方">{items.transferor}（{items.transferor_person}）</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'出让方式_' + index} label="出让方式">{items.type}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={'交易时间_' + index} label="交易时间">{moment(items.create_time).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>);
            if (items.no_type === '控制器' && items.type === '销售' || items.type === '退货') {
                arr.push(<Descriptions.Item key={'凭据_' + index} label="凭据"><Link to={'/contracts'} state={{ contract_no: items.credentials }}>{items.credentials}</Link></Descriptions.Item>);
            } else {
                arr.push(<Descriptions.Item key={'凭据_' + index} label="凭据">{items.credentials}</Descriptions.Item>);
            }
        });
        return (
            <div style={{maxHeight: 289, overflow: 'auto', position: 'relative'}}>
                <Button onClick={this.showDealInfoAction} type={'primary'} style={{position: 'absolute', right: 36, top: 28}}>操作</Button>
                <Descriptions column={5} size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>交易记录</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
    }

    renderSourceList(data) {
        const self = this;
        const arr = [];
        createDom(data.vtc, 'vtc');
        createDom(data.ini, 'ini');
        return (
            <div style={{maxHeight: 289, overflow: 'auto', position: 'relative'}}>
                <Descriptions column={4} size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>个例资源</span>} bordered>
                    { arr }
                </Descriptions>
            </div>
        );
        
        function createDom(list, type) {
            const items = list[0];
            const name = items ? items.name : '';
            const createdAt = items ? items.createdAt : '';
            arr.push(<Descriptions.Item key={type + '_资源类型_'} label="资源类型">{type}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={type + '_上传人_'} label="上传人">{name}</Descriptions.Item>);
            arr.push(<Descriptions.Item key={type + '_上传时间_'} label="上传时间">{createdAt}</Descriptions.Item>);
            if (type === 'vtc') {
                arr.push(<Descriptions.Item key={type + '_操作_'} label="操作"><a onClick={self.showVtcInfoAction} href="javascript:void(0);">详细</a></Descriptions.Item>);
            } else {
                arr.push(<Descriptions.Item key={type + '_操作_'} label="操作"><a onClick={self.showIniInfoAction} href="javascript:void(0);">详细</a></Descriptions.Item>);
            }
        }
    }

    buildSofyBySn = () => {
        const { sn } = this.props.location.state;
        const hide = message.loading('正在打包中，请耐心等待...', 0);
        const token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/burnDisk/buildSoft/' + sn))
			.set("token",token)
			.end((err,res) => {
                hide();
				if (res.body.code !== 200) {
                    message.error(res.body.msg);
                } else {
                    window.open(common.staticBaseUrl(`/open/burnDisk/download/${res.body.data}`));
                }
			});
    }

    scrapped = () => {
		const self = this;
        Modal.confirm({
            title: '',
            content: (
                <div>
                    <Input placeholder={'报废说明'} defaultValue={self.scrappedRem} onChange={e => self.scrappedRem = e.target.value} />
                </div>
            ),
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
                self.subScrapped();
            }
        });
    }
    
    subScrapped = () => {
        const scrappedRem = this.scrappedRem;
        const token = sessionStorage.getItem('token');
		request.put(common.baseUrl('/virProducts/scrapped/' + this.props.location.state.id))
			.set("token",token)
			.send({
				scrappedRem,
			})
			.end((err,res) => {
				if(err) return;
                Message.success(res.body.msg);
                Base.RemoveStateSession();
				setTimeout(this.props.history.goBack, 2000);
			});
    }

    drawerClose = () => {
        this.setState({
            visible: false,
            softInfoVisible: false,
            resourceVisible: false,
            resourceIniVisible: false,
            dealVisible: false,
            repairMsgVisible: false,
        });
    }

    showSoftInfoAction = () => {
        this.setState({
            visible: true,
            drawerTitle: '软件配置',
            softInfoVisible: true,
        });
    }

    showVtcInfoAction = () => {
        this.setState({
            visible: true,
            drawerTitle: '个例资源（vtc）',
            resourceVisible: true,
        });
    }

    showIniInfoAction = () => {
        this.setState({
            visible: true,
            drawerTitle: '个例资源（ini）',
            resourceIniVisible: true,
        });
    }

    showDealInfoAction = () => {
        this.setState({
            visible: true,
            drawerTitle: '交易记录',
            dealVisible: true,
        });
    }

    showRepairMsgAction = repair_contractno => {
        this.setState({
            visible: true,
            drawerTitle: '对话记录',
            repairMsgVisible: true,
            repair_contractno: repair_contractno,
        });
    }

    render() {
        const { data, visible, drawerTitle, softInfoVisible, resourceVisible, resourceIniVisible, dealVisible, repairMsgVisible, repair_contractno } = this.state;
        return (
            <div>
                <div className={'virProductsInfo'}>
                    <div className={'virProductsInfo-table'}>
                        {this.renderProductInfo(data.productInfo)}
                    </div>
                    <div className={'virProductsInfo-table'}>
                        {this.renderHardInfo(data.hardInfo)}
                    </div>
                    {/* <div className={'virProductsInfo-table'}> */}
                        {this.renderSoftInfo(data.softInfo)}
                    {/* </div> */}
                    {this.renderTradingRecordList(data.tradingRecordList)}
                    {this.renderWarrantyInfo(data.warrantyInfo)}
                    {this.renderRepairList(data.repairList)}
                    {this.renderSourceList(data)}
                    <div style={{margin: '40px 0px', textAlign: 'center'}}>
                        { data.productInfo.status !== '报废' && <Button type='danger' onClick={this.scrapped}>报废</Button> }
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
                    { softInfoVisible && <AppList id={this.props.location.state.id} fetch={this.fetch}></AppList> }
                    { resourceVisible && <AddVtcConfig list={data.vtc} sn={this.props.location.state.sn} fetch={this.fetch} /> }
                    { resourceIniVisible && <AddIniConfig list={data.ini} sn={this.props.location.state.sn} fetch={this.fetch} /> }
                    { dealVisible && <AddDealRecord sn={this.props.location.state.sn} fetch={this.fetch} /> }
                    { repairMsgVisible && <RepairMsg sn={this.props.location.state.sn} repair_no={repair_contractno}></RepairMsg> }
                </Drawer>
            </div>
        );
    }
}

export default VirProductsInfo;