import React, { Component } from 'react';
import OverWorkManagePro from './OverWorkManagePro.jsx';

class OverWorkManage extends OverWorkManagePro {

    constructor(props){
        super(props);
        this.fetchUrl = '/attendance/directorGetOverWorkData';
        this.actionWidth = 170;
        this.res_data = {
            name: {
                label: '申请人',
                width: 150
            },
            check: {
                label: '状态',
                width: 150
            },
            actionWorkTime: {
                label: '认定工时',
                width: 100
            },
            on_time: {
                label: '加班开始时间',
                width: 200
            },
            off_time: {
                label: '加班结束时间',
                width: 200
            },
            album: {
                label: '现场照片',
                width: 200
            },
            director: {
                label: '指派人',
                width: 150
            },
            reason: {
                label: '指派原因',
                width: 200
            },
            content: {
                label: '加班内容及成果',
                width: 600
            },
            // rate: {
            //     label: '评分',
            //     width: 200,
            // },
            // rem: {
            //     label: '评分备注',
            //     width: 200,
            // },
            check_time: {
                label: '审核时间',
                width: 250
            }
        };
    }
    
    //@override
    actionRender(text, row, index){
        const { check,director } = row;
        const user_name = sessionStorage.getItem('user_name');
        if(check==2&&director==user_name){
            return  <p>
                        <span onClick={() => this.checkItem(row)} style={{color: "#1890ff",cursor: 'pointer'}}>{"通过"}</span>
                        <span onClick={() => this.notCheckItem(row)} style={{color: "#1890ff",cursor: 'pointer',marginLeft: 10}}>{"退回"}</span>
                        <span onClick={() => this.getLocation(row)} style={{color: "#1890ff",cursor: 'pointer',marginLeft: 10}}>{"查看位置"}</span>
                    </p>;
        }else{
            return  <p>
                        <span onClick={() => this.getLocation(row)} style={{color: "#1890ff",cursor: 'pointer'}}>{"查看位置"}</span>
                    </p>;
        }
    }
}

export default OverWorkManage;