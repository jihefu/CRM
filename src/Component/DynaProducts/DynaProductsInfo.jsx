import React from 'react';
import VirProductsInfo from '../VirProducts/VirProductsInfo';
import { Descriptions, Button, Drawer } from 'antd';
import AddDealRecord from '../VirProducts/AddDealRecord.jsx';
import RepairMsg from '../VirProducts/RepairMsg';

class DynaProductsInfo extends VirProductsInfo {
    constructor(props) {
        super(props);
    }

    renderHardInfo(info) {
        return (
            <Descriptions size={'small'} style={{marginTop: 30}} title={<span style={{marginLeft: 12}}>硬件配置</span>} bordered>
                <Descriptions.Item label="型号编码">{info.modelCode}</Descriptions.Item>
                <Descriptions.Item label="固件版本">{info.fwVer}</Descriptions.Item>
                <Descriptions.Item label="规格">{info.authType}</Descriptions.Item>
                <Descriptions.Item label="用户软件许可">{info.oemUser}</Descriptions.Item>
                <Descriptions.Item label="最多使用次数">{info.max_count}</Descriptions.Item>
                <Descriptions.Item label="已使用次数">{info.user_count}</Descriptions.Item>
                <Descriptions.Item label="参数0">{info.GP0}</Descriptions.Item>
                <Descriptions.Item label="参数1">{info.GP1}</Descriptions.Item>
                <Descriptions.Item label="参数2">{info.GP2}</Descriptions.Item>
                <Descriptions.Item label="参数3">{info.GP3}</Descriptions.Item>
                <Descriptions.Item label="参数4">{info.GP4}</Descriptions.Item>
                <Descriptions.Item label="参数5">{info.GP5}</Descriptions.Item>
            </Descriptions>
        );
    }

    render() {
        const { data, visible, drawerTitle, dealVisible, repairMsgVisible, repair_contractno } = this.state;
        return (
            <div>
                {this.renderProductInfo(data.productInfo)}
                {this.renderHardInfo(data.hardInfo)}
                {this.renderTradingRecordList(data.tradingRecordList)}
                {this.renderRepairList(data.repairList)}
                <div style={{margin: '40px 0px', textAlign: 'center'}}>
                    { data.productInfo.status !== '报废' && <Button type='danger' onClick={this.scrapped}>报废</Button> }
                </div>
                <Drawer
                    width={600}
                    title={drawerTitle}
                    placement="right"
                    closable={false}
                    onClose={this.drawerClose}
                    visible={visible}
                >
                    { dealVisible && <AddDealRecord sn={this.props.location.state.sn} fetch={this.fetch} /> }
                    { repairMsgVisible && <RepairMsg sn={this.props.location.state.sn} repair_no={repair_contractno}></RepairMsg> }
                </Drawer>
            </div>
        );
    }
}

export default DynaProductsInfo;