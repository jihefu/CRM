import React, { Component } from 'react';
import { Form, Select, Tooltip } from 'antd';
import { Link, hashHistory } from 'react-router';
import PublicRelationShip from '../PublicRelationShip/PublicRelationShip.jsx';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class EndUser extends PublicRelationShip {
    constructor(props) {
        super(props);
        this.fetchUrl = '/endUser';
        this.editPathName = '/endUserEdit';
        this.addPathName = '/endUserAdd';
        this.placeholder = '用户名';
        this.res_data = {
            user_name: {
                label: '用户名',
                width: 200
            },
            user_id: {
                label: '用户号',
                width: 100
            },
            // main_contacts: {
            //     label: '主要联系人',
            //     width: 300
            // },
            industry: {
                label: '行业',
                width: 200
            },
            use_product: {
                label: '使用产品',
                width: 200
            },
            sn: {
                label: '设备序列号',
                width: 200
            },
            insert_person: {
                label: '录入人',
                width: 200
            },
            insert_time: {
                label: '录入时间',
                width: 200
            },
            update_person: {
                label: '更新人',
                width: 200
            },
            update_time: {
                label: '更新时间',
                width: 200
            },
        };
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='insert_time' || key=='update_time'){
            title = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            content = title;
        } else if (key=='user_name'){
            title = row[key];
            if(row['certified']==1){
                content = <span onClick={() => this.jumpToVerUnit(row[key])} style={{cursor: 'pointer'}}><span style={{color: '#42db41',marginRight: 5}}>V</span>{row[key]}</span>
            }else if(row['certified']==2){
                content = <span onClick={() => this.jumpToVerUnit(row[key])} style={{cursor: 'pointer'}}><span style={{marginRight: 5}}>-</span>{row[key]}</span>
            }else{
                content = <span onClick={() => this.jumpToVerUnit(row[key])} style={{cursor: 'pointer'}}><span style={{color: '#ffee58',marginRight: 5}}>N</span>{row[key]}</span>
            }
        } else if (key=='main_contacts') {
            const nameArr = [];
            row[key].forEach((items,index) => {
                if(items.name){
                    nameArr.push(<span onClick={() => this.nameLocation(items)} title={this.getTitle(items)} style={{marginRight: 8,textDecoration: 'underline',cursor: 'pointer'}}>{items.name}</span>);
                }else{
                    nameArr.push(<span style={{marginRight: 8}}>{items}</span>);
                }
            });
            content = nameArr;
            title = content;
        } else {
            title = row[key];
            content = title;
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }
}

export default EndUser;