import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Popover, Icon, Button,message,Form,Input,Table,Select,Tooltip,Checkbox } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import BaseTableList from '../common/BaseTableList.jsx';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const CheckboxGroup = Checkbox.Group;
const { Option } = Select;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '删除',
                    onClick: this.deleteAll,
                },
                {
                    text: '标记',
                    onClick: this.markAll,
                },
                {
                    text: '取消标记',
                    onClick: this.removeMarkAll,
                },
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        deleteAll = () => {
            const { selectedRowKeys } = this.props;
            const r = window.confirm('是否批量删除' + selectedRowKeys.length + '条记录？');
            if (!r) {
                return;
            }
            const token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/staff/delBatch'))
                .set("token", token)
                .send({
                    idArr: selectedRowKeys,
                })
                .end((err, res) => {
                    if (err) return;
                    message.success(res.body.msg);
                    this.props.refresh();
                });
        }

        markAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.markAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        removeMarkAll = () => {
            const { selectedRowKeys, markType } = this.props;
            this.props.removeMarkAll(selectedRowKeys, markType, () => {
                this.props.refresh();
            });
        }

        componentWillReceiveProps(props) {
            const { selectedRows } = props;
            let currentFunArr = this.funArr;
            const markSet = new Set();
            for (let i = 0; i < selectedRows.length; i++) {
                const { isStarMark } = selectedRows[i];
                markSet.add(isStarMark);
            }
            if (markSet.size === 2) {
                currentFunArr = currentFunArr.filter(items => items.text != '取消标记' && items.text != '标记' );
            } else if (markSet.size === 1) {
                if (markSet.has(1)) {
                    currentFunArr = currentFunArr.filter(items => items.text != '标记' );
                } else {
                    currentFunArr = currentFunArr.filter(items => items.text != '取消标记' );
                }
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

class Staff extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/staff/list';
        this.addPathName = '/staffAdd';
        this.editPathName = '/staffEdit';
        this.placeholder = '姓名，工号，手机';
        this.filter = ['on_job'];
        this.markType = 'Staff';
        this.fixedKey = 'user_name';
        this.options = [
            {
                text: '入职时间',
                value: 'id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            }
        ];
        this.res_data = {
            user_name: {
                label: '姓名',
                width: 100
            },
            user_id: {
                label: '工号',
                width: 100
            },
            album: {
                label: '头像',
                width: 100
            },
            leader: {
                label: '上级',
                width: 100
            },
            in_job_time: {
                label: '入职时间',
                width: 150
            },
            laborContractFirstSigningTime: {
                label: '劳动合同首签时间',
                width: 150
            },
            sex: {
                label: '性别',
                width: 100
            },
            branch: {
                label: '部门',
                width: 150
            },
            position: {
                label: '职位',
                width: 150
            },
            work_phone: {
                label: '工作电话',
                width: 150
            },
            qq: {
                label: 'qq',
                width: 150
            },
            phone: {
                label: '手机号码',
                width: 300
            }
        };
        this.state.pagination.filter = {
            on_job: '在职'
        }
        this.canRowSelection = true;
    }

    inputRender() {
        const { pagination, selectedRowKeys, selectedRows } = this.state;
        return <div>
            <Form style={{ "display": "flex", padding: "24px 0 0 24px" }}>
                <div style={{ flex: 1, display: 'flex' }}>
                    <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
                        <Button style={{ "marginRight": 15, "top": 4 }}>{"筛选"}</Button>
                    </Popover>
                    <Form.Item>
                        <Input name="keywords" style={{ width: 300 }} placeholder={this.placeholder} defaultValue={pagination.keywords} />
                    </Form.Item>
                    <Button type="primary" onClick={this.handleSearch} style={{ "position": "relative", "left": 15, "top": 3 }}>搜索</Button>
                    <span style={{ marginLeft: 50 }}>
                        <Select defaultValue={pagination.order} onChange={this.orderChange} style={{ "position": "relative", "top": 3, minWidth: 120 }}>
                            {
                                this.options.map(items =>
                                    <Option key={items.value} value={items.value}>{items.text}</Option>
                                )
                            }
                        </Select>
                    </span>
                </div>
                { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{ "position": "relative", "top": 3, marginRight: 60 }}>新增</Button> }
                { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='in_job_time'){
            title = moment(row[key]).format('YYYY-MM-DD');
            content = title;
        }else if(key=='album'){
            let albumArr;
            try{
                albumArr = row[key].split(',');
            }catch(e){  
                albumArr = [];
            }
            title = <div>
                        <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/'+items;
                                        return(
                                            <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                                <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(src)} />
                                            </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            content = title;
        }else{
            title = row[key];
            content = row[key];
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const on_job = ['在职', '离职'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"在职状态："}</span>
                        <CheckboxGroup options={on_job} value={pagination.filter.on_job.split(',')} onChange={(v) => this.filterType('on_job',v)} />
                    </div>
                </div>
    }

    componentDidUpdate() {
        const { pagination, selectedRowKeys } = this.state;
        const total = pagination.total;
        let showSelected = 'block', showNum = 'none', totalNum = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalNum = total;
        } else {
            totalNum = selectedRowKeys.length;
        }
        let footTemp = '';
        const containerWidth = $('.ant-spin-container').width();
        const w = containerWidth - 500;
        footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;margin-right: 36px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+ showNum +'">'+
                                '<span style="font-weight: bolder">总人数：</span>'+
                                '<span>'+totalNum+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
        
    }
}

export default Staff;