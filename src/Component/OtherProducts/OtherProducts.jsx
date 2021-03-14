import React, { Component } from 'react';
import BaseTableList from '../common/BaseTableList.jsx';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import { hashHistory } from 'react-router';
import { Tooltip, Form, Popover, Button, Input, Select } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
moment.locale('zh-cn');
const { Option } = Select;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [];
            this.state = {
                currentFunArr: this.funArr,
            };
        }

        render() {
            return <div></div>
        }
    }
}
const BtnGroup = WarpSelectedBtnGroup(SelectedButtonGroup);

class OtherProducts extends BaseTableList {
    constructor(props) {
        super(props);
        this.fetchUrl = '/otherProducts/getList';
        this.addPathName = '/otherProductsAdd';
        this.placeholder = '序列号';
        this.actionWidth = 100;
        this.options = [
            {
                text: '最近新增',
                value: 'id'
            }
        ];
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 100
            },
            album: {
                label: '照片',
                width: 150
            },
            model: {
                label: '型号',
                width: 100
            },
            standrd: {
                label: '规格',
                width: 100
            },
            manufacturer: {
                label: '厂家',
                width: 100
            },
            valuation: {
                label: '估值',
                width: 100
            },
            insert_person: {
                label: '创建人',
                width: 100
            },
            insert_time: {
                label: '创建时间',
                width: 200
            },
        };
        this.canRowSelection = true;
    }

    componentDidMount(){
        if(Base.GetStateSession()&&Base.GetStateSession().SELFURL == window.location.href.split('#')[1].split('?')[0]){
            this.setState(Base.GetStateSession(),() => {
                this.initMark();
            });
            Base.RemoveStateSession();
        }else{
            const { pagination } = this.state;
            try{
                pagination.order = this.options[0].value;
            }catch(e){

            }
            let keywords;
            try{
                keywords = this.props.location.state.serialNo?this.props.location.state.serialNo:'';
                pagination.keywords = keywords;
            }catch(e){

            }
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
        }
    }

    inputRender(){
        const { pagination, selectedRows, selectedRowKeys } = this.state;
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
                        {<BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} />}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='insert_time'){
            row[key] = moment(row[key]).format('YYYY-MM-DD HH:mm:ss');
            title = row[key];
            content = row[key];
        } else if(key=='album'){
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
                                        let smallSrc = src.split('/otherProducts/')[0]+'otherProducts/small_'+src.split('/otherProducts/')[1];
                                        return(
                                            <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                                <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(smallSrc)} />
                                            </a>
                                        )
                                    }
                                })
                            }
                        </p>
                    </div>
            content = title;
        } else {
            title = row[key];
            content = row[key];
        }
        return <p style={{width: res_data[key]['width']-32,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    //@override
    actionRender(text, row, index){
        return <a onClick={() => this.moreInfo(row)} href="javascript:void(0)">查看</a>;
    }

    moreInfo = row => {
        this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
        Base.SetStateSession(this.state);
        hashHistory.push({
            pathname: '/otherProductsInfo',
            state: {
                row,
            },
        });
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        return <div></div>;
    }
}

export default OtherProducts;