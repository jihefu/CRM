import React, { Component } from 'react';
import BaseTableList from '../common/BaseTableList.jsx';
import common from '../../public/js/common.js';
import { hashHistory } from 'react-router';
import { Tag, Tooltip, Select, Form, Button, Popover, Input, message, Checkbox, Modal, Divider } from 'antd';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
import request from 'superagent';
import * as bluebird from 'bluebird';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const Option = Select.Option;
const CheckboxGroup = Checkbox.Group;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '删除',
                    onClick: this.del,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
                memberList: [],
            };
        }

        del = async () => {
            const { selectedRowKeys, refresh } = this.props;
            const token = sessionStorage.getItem('token');
            const toast =  message.loading('提交中', 0);
            await bluebird.map(selectedRowKeys, async id => {
                await new Promise(resolve => {
                    request.delete(common.baseUrl('/member/delFreeExchangeRecord'))
                        .set("token", token)
                        .send({ id })
                        .end((err, res) => {
                            if (err) return;
                            if (res.body.code == -1) {
                                message.error(res.body.msg);
                            } else {
                                message.success(res.body.msg);
                            }
                            resolve();
                        });
                });
            }, { concurrency: 3 });
            toast();
            refresh();
            message.success('提交完成');
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            let showdel = true;
            for (let i = 0; i < selectedRows.length; i++) {
                const { isExchange } = selectedRows[i];
                if (isExchange == 1) {
                    showdel = false;
                }
            }

            if (!showdel) {
                currentFunArr = currentFunArr.filter(items => items.text !== '删除');
            }
            
            this.setState({ currentFunArr });
        }

        render() {
            const { currentFunArr } = this.state;
            const { selectedRowKeys } = this.props;
            if (selectedRowKeys.length === 0) {
                return <div></div>
            }
            return (
                <WrappedComponent style={{position: 'relative', top: 3, marginRight: 60}} funArr={currentFunArr} />
            )
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class FreeExchangeGift extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/member/listFreeExchange';
        this.options = [
            {
                text: '默认排序',
                value: 'id',
            },
        ];
        this.res_data = {
            memberName: {
                label: '会员',
                width: 100
            },
            goodsNameList: {
                label: '可兑换礼品',
                // width: 400
            },
            exchangeGoodsName: {
                label: '已兑换',
                width: 200
            },
            exchangeTime: {
                label: '兑换时间',
                width: 180
            },
            createTime: {
                label: '创建时间',
                width: 180
            },
        };
        this.state.pagination.filter = {
            isExchange: '',
        };
        this.filter = ['isExchange'];
        this.actionWidth = 100;
        this.canRowSelection = true;
        this.actioncolumns = false;
        this.state.memberList = [];
        this.state.giftList = [];
        this.state.checkedGiftList = [];
    }

    componentDidMount() {
        this.fetchTotalMemberList();
        this.fetchTotalGiftList();
        const { pagination } = this.state;
        try {
            pagination.order = this.options[0].value;
        } catch (e) {

        }
        this.setState({
            pagination
        }, () => {
            this.fetch();
        });
    }

    fetchTotalMemberList = async () => {
        await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/member/totalMemberList'))
                .set("token",token)
                .end((err,res) => {
                    if (err) return;
                    this.setState({ memberList: res.body.data });
                    resolve();
                });
        });
    }

    fetchTotalGiftList = async () => {
        await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/member/getGiftList'))
                .set("token",token)
                .query({
                    page: 1,
                    num: 9999,
                    filter: JSON.stringify({"isOpen":"微信公众号"}),
                    order: 'needScore',
                })
                .end((err,res) => {
                    if (err) return;
                    this.setState({ giftList: res.body.data.data });
                    resolve();
                });
        });
    }

    inputRender(){
        const { data,pagination, selectedRows, selectedRowKeys } = this.state;
        return <div>
                    <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
                                <Button style={{"marginRight": 15,"top": 4}}>{"筛选"}</Button>
                            </Popover>
                            <Form.Item>
                                <Input name="keywords" style={{width: 300}} placeholder={this.placeholder} defaultValue={pagination.keywords}/>
                            </Form.Item>
                            <Button type="primary" onClick={this.handleSearch} style={{"position":"relative","left":15,"top":3}}>搜索</Button>
                            <span style={{marginLeft: 50}}>
                                <Select defaultValue={pagination.order} onChange={this.orderChange} style={{"position":"relative","top":3,minWidth: 120}}>
                                    {
                                        this.options.map(items => 
                                            <Option key={items.value} value={items.value}>{items.text}</Option>
                                        )
                                    }
                                </Select>
                            </span>
                        </div>
                        { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> }
                        { <BtnGroup selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //@override
    viewRender(key, res_data, text, row, index) {
        let title, content;
        let textAlign = 'left';
        if (key === 'exchangeTime' || key === 'createTime') {
            if (row[key]) {
                title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            } else {
                title = '';
            }
            content = title;
        } else if (key === 'goodsNameList') {
            title = row[key].map(goodsName => <Tag>{goodsName}</Tag>);
            content = title;
        } else {
            title = row[key];
            content = row[key];
        }
        return <p style={{ width: res_data[key]['width'] - 32, textAlign: textAlign, margin: 0, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>
            <Tooltip placement="top" title={title}>
                {content}
            </Tooltip>
        </p>
    }

    filterContent() {
        const { pagination } = this.state;
        const isExchange = ['已兑换', '未兑换'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"兑换状态："}</span>
                        <CheckboxGroup options={isExchange} value={pagination.filter.isExchange.split(',')} onChange={(v) => this.filterType('isExchange',v)} />
                    </div>
                </div>
    }

    onCheckAllChange = e => {
        this.setState({
            checkAll: e.target.checked,
        });
    }

    onCheckChange = v => {
        this.setState({ checkedGiftList: v });
    }

    async handleCreate() {
        const { memberList, giftList, checkedGiftList } = this.state;
        const self = this;
        let unionid;
        await new Promise(resolve => {
            Modal.confirm({
                icon: <span></span>,
                title: '选择会员',
                content: <Select onChange={v => unionid = v} 
                            showSearch
                            style={{ width: '100%' }}
                            filterOption={(input, option) =>
                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {
                                memberList.map(items => <Option value={items.unionid} key={items.unionid}>{`${items.name} ${items.phone}`}</Option>)
                            }
                        </Select>,
                onOk() {
                    if (!unionid) {
                        message.error('请选择会员');
                        return;
                    }
                    resolve();
                },
                onCancel() { },
            });
        });
        const plainOptions = giftList.map(items => ({ label: items.goodsName, value: items.id }));
        Modal.confirm({
            icon: <span></span>,
            title: '选择礼品',
            content: <div>
                { true && <CheckboxGroup options={plainOptions} defaultValue={checkedGiftList} onChange={this.onCheckChange} /> }
            </div>,
            async onOk() {
                const { checkedGiftList } = self.state;
                await new Promise(resolve => {
                    const token = sessionStorage.getItem('token');
                    request.post(common.baseUrl('/member/saveFreeExchangeRecord'))
                        .set("token",token)
                        .send({
                            unionid,
                            goodsIds: checkedGiftList.join(),
                        })
                        .end((err,res) => {
                            if (err) return;
                            message.success(res.body.msg);
                            resolve();
                        });
                });
                self.handleSearch();
            },
            onCancel() { },
        });
    }
}

export default FreeExchangeGift;