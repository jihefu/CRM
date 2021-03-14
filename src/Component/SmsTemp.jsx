import React, { Component } from 'react';
import { Select, Input, Button, message, Switch, Radio, Icon, Upload, Collapse, Table } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
const { Option } = Select;
const { Panel } = Collapse;

class SmsTemp extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        logArr: [],
        smsReceiverArr: [],
        smsTextArr: [],
        selectedReceiverId: '',
        selectedSmsId: '',
        phoneArr: [],
        btnDisabled: false,
    };
      
    //在初始化渲染执行之后调用，只执行一次
    componentDidMount = async () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/smsTemp/getReceiver'))
            .set("token",token)
            .end((err,res) => {
                try {
                    this.setState({
                        smsReceiverArr: res.body.data,
                        selectedReceiverId: res.body.data[0].id,
                    });
                } catch (e) {
                    
                }
            });
        request.get(common.baseUrl('/smsTemp/getTemp'))
            .set("token",token)
            .end((err,res) => {
                try {
                    this.setState({
                        smsTextArr: res.body.data,
                        selectedSmsId: res.body.data[0].smsId,
                    });
                } catch (e) {
                    
                }
            });
        request.get(common.baseUrl('/smsTemp/getLog'))
            .set("token",token)
            .end((err,res) => {
                this.setState({
                    logArr: res.body.data,
                });
                console.log(res.body.data);
            });
    }

    renderText = () => {
        const { smsTextArr, selectedSmsId } = this.state;
        let selectedText = '短信内容区';
        smsTextArr.forEach((items, index) => {
            if (items.smsId == selectedSmsId) {
                selectedText = items.smsText;
            }
        });
        selectedText = selectedText.replace(/%s/ig, '&');
        const arr = [];
        for (let i = 0; i < selectedText.length; i++) {
            if (selectedText[i] === '&') {
                arr.push(<span key={i} className={'editBlock'}>
                    <Input key={'input_' + i} ref={'input_' + i} style={{width: 200}} />
                    <span className={'autoBindName'} style={{display: 'none'}}>xxx先生/女士</span>
                    <Icon type="swap" style={{cursor: 'pointer'}} onClick={e => {
                        const ele = $(e.target).parents('.editBlock');
                        if (ele.find('input').css('display') === 'none') {
                            ele.find('input').css('display', 'inline');
                            ele.find('.autoBindName').css('display', 'none');
                            this.refs['input_' + i].state.value = '';
                        } else {
                            ele.find('input').css('display', 'none');
                            ele.find('.autoBindName').css('display', 'inline');
                            this.refs['input_' + i].state.value = 'autoBind';
                        }
                    }} />
                </span>);
            } else {
                arr.push(selectedText[i]);
            }
        }
        return arr;
    }

    send = () => {
        const { selectedSmsId, selectedReceiverId, phoneArr } = this.state;
        const vArr = [];
        for (const key in this.refs) {
            if (key.indexOf('input_') !== -1) {
                vArr.push(this.refs[key].state.value ? this.refs[key].state.value : '');
            }
        }
        if (vArr.indexOf('') !== -1) return message.error('不能为空');
        const r = window.confirm('确定群发？');
        if (!r) return;
        this.setState({
            btnDisabled: true,
        });
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/smsTemp/sendSms'))
            .set("token", token)
            .send({
                selectedSmsId,
                selectedReceiverId,
                phoneArr: JSON.stringify(phoneArr),
                varParams: JSON.stringify(vArr),
            })
            .end((err, res) => {
                if (err) return;
                if (res.body.code == 200) {
                    message.success('发送成功');
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    dataSource = () => {
        const { logArr } = this.state;
        const dataSource = logArr.map(items => (
            {
                key: items.id,
                personName: items.personName,
                time: moment(items.time).format('YYYY-MM-DD HH:mm:ss'),
                smsReceiverText: items.smsReceiverText,
                smsName: items.smsName,
                smsParams: JSON.stringify(items.content.smsParams),
                smsTotalReceiverArr: items.content.smsTotalReceiverArr,
            }
        ));
        return dataSource;
    }

    columns = () => {
        return [
            {
                title: '时间',
                dataIndex: 'time',
                key: 'time',
            },
            {
                title: '操作者',
                dataIndex: 'personName',
                key: 'personName',
            },
            {
                title: '短信模板',
                dataIndex: 'smsName',
                key: 'smsName',
            },
            {
                title: '群发对象',
                dataIndex: 'smsReceiverText',
                key: 'smsReceiverText',
            },
            {
                title: '短信参数',
                dataIndex: 'smsParams',
                key: 'smsParams',
            },
            // {
            //     title: '接收者',
            //     dataIndex: 'smsTotalReceiverArr',
            //     key: 'smsTotalReceiverArr',
            // },
        ];
    }

    expandedRowRender = data => {
        const columns = [
            { title: '姓名', dataIndex: 'name', key: 'name' },
            { title: '手机', dataIndex: 'phone', key: 'phone' },
            { title: '性别', dataIndex: 'gender', key: 'gender'},
        ];
        return (
            <Table
                title={() => <div>数量：{data.smsTotalReceiverArr.length}</div>}
                columns={columns}
                dataSource={data.smsTotalReceiverArr}
                pagination={false}
            />
        );
    }

	render() {
        const { smsReceiverArr, smsTextArr, selectedReceiverId, selectedSmsId, btnDisabled, logArr } = this.state;
        const that = this;
        const props = {
            name: 'file',
            action: common.baseUrl('/knowlib/parseExcel'),
            headers: {
                token: sessionStorage.getItem('token'),
            },
            accept: '.xlsx',
            showUploadList: false,
            onChange(info) {
                if (info.file.status === 'done') {
                    if (info.file.response.code != 200) {
                        message.error(info.file.response.msg);
                    } else {
                        message.success(info.file.response.msg);
                        const result = info.file.response.data;
                        const phoneArr = [];
                        result.forEach(items => {
                            const obj = {};
                            obj.phone= items[0];
                            if (items.length > 1) obj.name= items[1];
                            if (items.length > 2) obj.gender= items[2];
                            phoneArr.push(obj);
                        });
                        that.setState({
                            phoneArr,
                        });
                    }
                } else if (info.file.status === 'error') {
                    message.error(info.file.response.msg);
                }
            },
        };
        return (
            <Collapse defaultActiveKey={['1']}>
                <Panel header="操作面板" key="1">
                    <div style={{display: 'flex'}}>
                        <div style={{width: 650}}>
                            <div style={{width: '100%', height: 60, display: 'flex'}}>
                                <div style={{marginLeft: 25, paddingTop: 12}}>
                                    <span>群发对象：</span>
                                    <Select style={{width: 220}} value={selectedReceiverId} onChange={v => this.setState({selectedReceiverId: v})}>
                                        {
                                            smsReceiverArr.map(items => <Option key={items.id} value={items.id}>{items.smsReceiverText}</Option>)
                                        }
                                    </Select>
                                </div>
                                <div style={{marginLeft: 25, paddingTop: 12}}>
                                    <span>短信模板：</span>
                                    <Select style={{width: 220}} value={selectedSmsId} onChange={v => this.setState({selectedSmsId: v})}>
                                        {
                                            smsTextArr.map(items => <Option key={items.smsId} value={items.smsId}>{items.smsName}</Option>)
                                        }
                                    </Select>
                                </div>
                            </div>
                            <div style={{marginLeft: 25, maxWidth: 610}}>
                                { selectedReceiverId === 4 && <span><Upload {...props} >
                                    <Button style={{marginBottom: 25}}>
                                        <Icon type="upload" /> 上传excel名单
                                    </Button>
                                </Upload><div style={{fontSize: 12, marginBottom: 25}}>说明：xlsx类型，第一列为手机号码（必须），第二列为姓名（可选），第三列为性别（可选）。使用第三列时，第二列不能为空</div></span> }
                                { selectedReceiverId === 5 && <Select mode="tags" onChange={v => {
                                    const arr = [];
                                    v.forEach((items, index) => {arr.push({phone: items})});
                                    this.setState({phoneArr: arr});
                                }} placeholder={'请输入手机号...'} style={{marginBottom: 25, width: '100%'}} ></Select> }
                            </div>
                            <div style={{marginLeft: 25, maxWidth: 610, minHeight: 300, border: '1px solid #eee', borderRadius: 4, padding: 10, lineHeight: '28px'}}>
                                { this.renderText() }
                            </div>
                            <div style={{textAlign: 'center', paddingTop: 20}}>
                                <Button type={'primary'} disabled={btnDisabled} onClick={() => { this.send() }}>群发</Button>
                            </div>
                        </div>
                    </div>
                </Panel>
                <Panel header="群发日志" key="2">
                    <Table expandedRowRender={this.expandedRowRender} dataSource={this.dataSource()} columns={this.columns()} />
                </Panel>
            </Collapse>
        );
    }
}

export default SmsTemp;