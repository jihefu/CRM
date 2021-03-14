import React, { Component } from 'react';
import { Drawer, List } from 'antd';
import OnlineAssessment from '../OnlineAssessment.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class ContactOrdersAssessment extends OnlineAssessment {
    constructor(props) {
        super(props);
        this.fetchUrl = '/businessTrip/contactsOrderAssessment';
        this.fixedKey = '';
        this.res_data = {
            user_name: {
                label: '姓名',
                width: 150
            },
            callNum: {
                label: '电话联系单',
                width: 100
            },
            meetNum: {
                label: '见面联系单',
                width: 100
            },
            workTime: {
                label: '上门服务工时',
                width: 100
            },
            otherNum: {
                label: '候补联系单',
                width: 100
            },
            onlineNum: {
                label: '线上客服',
                width: 100
            },
        };
        this.state.infoBlock = false;
        this.state.type = 'all';
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        if (key == 'workTime') {
            title = row[key].toFixed(2);
            content = title;
        } else if (key == 'user_name') {
            title = row[key];
            content = <span style={{cursor: 'pointer'}} onClick={() => this.showRecord(row.user_id, 'all')}>{row[key]}</span>;
        } else if (key == 'callNum') {
            title = row[key];
            content = <span style={{cursor: 'pointer'}} onClick={() => this.showRecord(row.user_id, 'call')}>{row[key]}</span>;
        } else if (key == 'meetNum') {
            title = row[key];
            content = <span style={{cursor: 'pointer'}} onClick={() => this.showRecord(row.user_id, 'meet')}>{row[key]}</span>;
        } else if (key == 'otherNum') {
            title = row[key];
            content = <span style={{cursor: 'pointer'}} onClick={() => this.showRecord(row.user_id, 'other')}>{row[key]}</span>;
        } else if (key == 'onlineNum') {
            title = row[key];
            content = <span style={{cursor: 'pointer'}} onClick={() => this.showRecord(row.user_id, 'online')}>{row[key]}</span>;
        } else {
            title = row[key];
            content = title;
        }
        return <p style={{width: res_data[key]['width'],margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                    {content}
                </p>
    }

    showRecord(user_id, type) {
        this.setState({
            infoBlock: true,
            type,
            selectedUserId: user_id,
        });
    }

    renderRecord() {
        const { selectedUserId, type, data } = this.state;
        let dataSource = [];
        data.forEach(items => {
            if (items.user_id == selectedUserId) {
                if (type === 'all') {
                    dataSource = items.list;
                } else {
                    dataSource = items.list.filter(items => items.type === type);
                }
            }
        });
        return (
            <List
                itemLayout="horizontal"
                dataSource={dataSource}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            title={moment(item.time).format('YYYY-MM-DD HH:mm:ss')}
                            description={'【' + item.company +'】' + ( item.content ? item.content : '' ) }
                        />
                    </List.Item>
                )}
            />
        )
    }

    //@Override
    render(){
        let { data,pagination, infoBlock } = this.state;
        let res_data = this.res_data;
        let b_height = window.innerHeight-308;
        const columns = [];
        let tableWidth = this.tableWidth;
        for(let key in res_data){
            tableWidth += res_data[key]['width'];
            let o = {
                title: res_data[key].label,
                dataIndex: key,
                key: key,
                width: res_data[key]['width'],
                render: (text, row, index) => {
                    return this.viewRender(key, res_data, text, row, index);
                },
                sorter: (a, b) => a[key] - b[key],
            };
            columns.push(o);
            if (key == this.fixedKey) o.fixed = 'left';
        }
        if(!pagination.order) return <p></p>;
        return (
            <div>
                {this.inputRender()}
                {
                    this.tableRender({
                        columns: columns,
                        data: data,
                        tableWidth: tableWidth,
                        b_height: b_height
                    })
                }
                <Drawer
                    title={'联系记录'}
                    placement={'right'}
                    width={400}
                    visible={infoBlock}
                    closable={true}
                    onClose={() => this.setState({infoBlock: false})}
                >
                    { this.renderRecord() }
                </Drawer>
            </div>
        )
    }
}

export default ContactOrdersAssessment;