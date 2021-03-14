import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Tooltip,Button,Form,Input,Select,Radio,Popover,Checkbox,Tag,Popconfirm,message,Rate } from 'antd';
import request from 'superagent';
import BaseTableList from '../common/BaseTableList.jsx';
import Base from '../../public/js/base.js';
import $ from 'jquery';
import common from '../../public/js/common.js';
import SelectedButtonGroup from '../common/SelectedButtonGroup.jsx';
const Option = Select.Option;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;

/********************************************* 高阶函数装饰 *****************************************/
const WarpSelectedBtnGroup = WrappedComponent => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.funArr = [
                {
                    text: '标记',
                    onClick: this.markAll,
                },
                {
                    text: '取消标记',
                    onClick: this.removeMarkAll,
                }
            ];
            this.state = {
                currentFunArr: this.funArr,
            };
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

class Customers extends BaseTableList {
	constructor(props) {
        super(props);
        this.fetchUrl = '/customers/list';
        this.addPathName = '/customerAdd';
        this.editPathName = '/customerEdit';
        this.placeholder = '客户号，全称子串，中文缩写，英文缩写，老板和认证联系人';
        this.filter = ['group','level','certified', 'hasRegPower'];
        this.markType = 'Customers';
        this.fixedKey = 'company';
        this.options = [
            {
                text: '最近新增',
                value: 'user_id'
            },
            {
                text: '最近更新',
                value: 'update_time'
            },
            {
                text: '累计销售额',
                value: 'total_sale'
            },
            {
                text: '近一年销售额',
                value: 'latest_year_sale'
            }
        ];
        this.res_data = {
            company: {
                label: '客户名',
                width: 250
            },
            user_id: {
                label: '客户号',
                width: 100
            },
            level: {
                label: '等级',
                width: 100
            },
            datefrom: {
                label: '合作时间',
                width: 150
            },
            // contactsArr: {
            //     label: '主要联系人',
            //     width: 300
            // },
            manager: {
                label: '业务员',
                width: 100
            },
            star: {
                label: '最新评级',
                width: 200
            },
            credit_line: {
                label: '最新授信额',
                width: 150
            },
            latest_year_sale: {
                label: '近一年销售额',
                width: 150
            },
            total_sale: {
                label: '累计合同额',
                width: 150
            },
            credit_qualified: {
                label: '信用状态',
                width: 100
            },
            info_score: {
                label: '信息完整度',
                width: 100
            }
        };
        this.canRowSelection = true;
        this.state.exportItem = ['客户'];
        this.state.photoOption = {
            canRenderPhoto: false,
            imgSrc: null,
            albumBorwerArr: [],
        };
        this.state.pagination.filter = {
            group: '',
            level: '',
            certified: '',
            hasRegPower: '',
        }
    }

    //@Override
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
                keywords = this.props.location.state.company?this.props.location.state.company:'';
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

    //@override
    inputRender(){
        const { selectedRowKeys, selectedRows, pagination } = this.state;
        return <div>
                    <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Popover content={this.filterContent()} trigger="hover">
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
                        { selectedRowKeys.length === 0 && <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 30}}>新增</Button> }
                        { <BtnGroup removeMarkAll={this.cancelMarkBatch} markAll={this.addMarkBatch} markType={this.markType} selectedRows={selectedRows} selectedRowKeys={selectedRowKeys} refresh={this.clearSelectedRowKeys} /> }
                        {/* <Popconfirm placement="bottomRight" title={this.exportItem()} onConfirm={this.subExportExcel} okText="Yes" cancelText="No">
                            <Button style={{"position":"relative","top":3,marginRight: 60}}>导出Excel</Button>
                        </Popconfirm> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    rowSelection = () => {
        const { selectedRowKeys } = this.state;
        return {
            selectedRowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
                this.setState({
                    selectedRowKeys,
                });
            },
            getCheckboxProps: record => ({
                name: record.key,
            }),
            onSelect: (record, selected, selectedRows, nativeEvent) => {
                let { selectedRows: globalSelectedRows } = this.state;
                if (selected) {
                    if (globalSelectedRows.length === 0) {
                        globalSelectedRows.push(record);
                    } else {
                        for (let i = 0; i < globalSelectedRows.length; i++) {
                            const items = globalSelectedRows[i];
                            if (items.user_id != record.user_id && i === globalSelectedRows.length - 1) {
                                globalSelectedRows.push(record);
                            }
                        }
                    }
                } else {
                    globalSelectedRows = globalSelectedRows.filter(items => items.user_id != record.user_id);
                }
                this.setState({
                    selectedRows: globalSelectedRows,
                });
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
                let { selectedRows: globalSelectedRows, selectedRowKeys } = this.state;
                const keyArr = changeRows.map(items => items.key);
                if (selected) {
                    selectedRowKeys = [...selectedRowKeys, ...keyArr];
                    globalSelectedRows = [...globalSelectedRows, ...changeRows];
                } else {
                    selectedRowKeys = selectedRowKeys.filter(key => keyArr.indexOf(key) === -1 );
                    globalSelectedRows = globalSelectedRows.filter(items => keyArr.indexOf(items.key) === -1 );
                }
                this.setState({
                    selectedRowKeys,
                    selectedRows: globalSelectedRows,
                });
            }
        }
    }

    fetch(){
        this.setState({ loading: true });
        let token = sessionStorage.getItem('token');
        let { current,pageSize,keywords,order,filter } = this.state.pagination;
        request.get(common.baseUrl(this.fetchUrl))
            .set("token",token)
            .query({
                page: current,
                num: pageSize,
                keywords: keywords,
                order: order,
                filter: JSON.stringify(filter)
            })
            .end((err,res) => {
                if (err) return;
                let data = res.body.data.data;
                data.forEach((items, index) => {
                    data[index].key = items.user_id;
                    if (res.body.data.id_arr.indexOf(Number(items.user_id)) !== -1) {
                        data[index].isStarMark = 1;
                    } else {
                        data[index].isStarMark = 0;
                    }
                });
                let total = res.body.data.total;
                const pagination = { ...this.state.pagination };
                pagination.total = total;
                let markLen = res.body.data.id_arr.length;
                this.setState({
                    pagination,
                    data,
                    loading: false,
                    markLen
                });
            });
    }

    getTitle(items){
        if(items.type=='member'){
            return '类型：会员\n职位：'+items.job;
        }else{
            return '类型：认证联系人';
        }
    }

    nameLocation(items){
        let pathname;
        if(items.type=='member'){
            this.props.siderList.forEach((items,index) => {
                if(items.link=='/member'){
                    pathname = items.link;
                }
            });
            if(!pathname) pathname = '/memberView';
        }else{
            this.props.siderList.forEach((items,index) => {
                if(items.link=='/contacts'){
                    pathname = items.link;
                }
            });
            if(!pathname) pathname = '/contactsView';
        }
        hashHistory.push({
            pathname: pathname,
            state: {
                phone: items.phone
            }
        });
    }

    //@override
    viewRender(key,res_data,text, row, index){
        let title,content;
        let textAlign = 'left';
        if(key=='credit_line'||key=='total_sale'||key=='latest_year_sale'){
            textAlign = 'right';
            title = row[key];
            content = row[key];
        }else if(key=='datefrom'){
            if(new Date(row[key]).getFullYear()>1990){
                content = new Date().getFullYear() - new Date(row[key]).getFullYear() + 1 + '年';
            }else{
                content = '';
            }
            title = row[key];
        }else if(key=='credit_qualified'){
            if(row[key]){
                title = '合格';
                content = '合格';
            }else{
                title = '不合格';
                content = '不合格';
            }
        }else if(key=='info_score'){
            title = row[key]+'%';
            content = row[key]+'%';
        }else if(key=='company'){
            title = row[key];
            if(row['certified']==1){
                content = <span onClick={() => this.jumpToVerUnit(row[key])} style={{cursor: 'pointer'}}><span style={{color: '#42db41',marginRight: 5}}>V</span>{row[key]}</span>
            }else if(row['certified']==2){
                content = <span onClick={() => this.jumpToVerUnit(row[key])} style={{cursor: 'pointer'}}><span style={{marginRight: 5}}>-</span>{row[key]}</span>
            }else{
                content = <span onClick={() => this.jumpToVerUnit(row[key])} style={{cursor: 'pointer'}}><span style={{color: '#ffee58',marginRight: 5}}>N</span>{row[key]}</span>
            }
        }else if(key=='contactsArr'){
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
        }else if(key=='star'){
            content = <Rate allowHalf disabled value={Number(row[key]/2)} />
            title = content;
        }else{
            title = row[key];
            content = row[key];
        }
        return <p style={{width: res_data[key]['width']-16,textAlign: textAlign,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={title}>
                            {content}
                        </Tooltip>
                    </p>
    }

    jumpToVerUnit = company => {
        hashHistory.push({
            pathname: '/verUnit',
            state: {
                company,
            }
        });
    }

    //@override
    //表格点击
    handleTableClick(record, index, e){
        const { data,pagination } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const user_id = record.user_id;
            let selectData;
            data.forEach((items,index) => {
                if(items.user_id==user_id){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }else if(e.target.innerHTML=='标记'){
            let targetDom = e.target;
            this.addMark(record.user_id,'Customers',() => {
                targetDom.innerHTML = '取消标记';
            });
        }else if(e.target.innerHTML=='取消标记'){
            let targetDom = e.target;
            this.cancelMark(record.user_id,'Customers',() => {
                targetDom.innerHTML = '标记';
            });
        }
    }

    //子类必须有该方法
    //实现父类的筛选内容
    filterContent(){
        const { pagination } = this.state;
        const group = ['杭州组', '济南组'];
        const level = ['A', 'B','C','D','F','P'];
        const certified = ['待认证','未通过','已认证'];
        const hasRegPower = ['开放', '不开放'];
        if(JSON.stringify(pagination.filter)=='{}') return <div></div>;
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"分组："}</span>
                        <CheckboxGroup options={group} value={pagination.filter.group.split(',')} onChange={(v) => this.filterType('group',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"分类："}</span>
                        <CheckboxGroup options={level} value={pagination.filter.level.split(',')} onChange={(v) => this.filterType('level',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"认证："}</span>
                        <CheckboxGroup options={certified} value={pagination.filter.certified.split(',')} onChange={(v) => this.filterType('certified',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"注册权限："}</span>
                        <CheckboxGroup options={hasRegPower} value={pagination.filter.hasRegPower.split(',')} onChange={(v) => this.filterType('hasRegPower',v)} />
                    </div>
                </div>
    }

    //@Override
    componentDidUpdate(){
        super.componentDidUpdate();
        common.textRight(['近一年销售额','累计合同额','最新授信额']);
    }

    // exportItem() {
    //     const paramsItem = {};
    //     const plainOptions = [];
    //     for(let key in this.res_data){
    //         if(key!='contactsArr') {
    //             paramsItem[key] = this.res_data[key].label;
    //             plainOptions.push(this.res_data[key].label);
    //         }
    //     }
    //     return <CheckboxGroup style={{width: 150}} options={plainOptions} value={this.state.exportItem} onChange={this.exportItemChange} />
    // }

    // exportItemChange(v) {
    //     this.setState({
    //         exportItem: v
    //     });
    // }

    // subExportExcel() {
    //     const { exportItem, pagination } = this.state;
    //     const { filter } = pagination;
    //     if(exportItem.indexOf('客户')==-1){
    //         message.error('客户不能为空');
    //         return;
    //     }
    //     const formData = {};
    //     exportItem.forEach((items,index) => {
    //         for(let key in this.res_data){
    //             if(this.res_data[key].label==items) formData[key] = items;
    //         }
    //     });
    //     let token = sessionStorage.getItem('token');
    //     request.post(common.baseUrl('/customers/exportXlsx'))
    //         .set("token",token)
    //         .send({
    //             formData,
    //             filter
    //         })
    //         .end((err,res) => {
    //             if (err) return;
    //             if(res.body.code==200){
    //                 message.success(res.body.msg);
    //                 window.open(common.staticBaseUrl(res.body.data));
    //             }else{
    //                 message.error(res.body.msg);
    //             }
    //         });
    // }
}

export default Customers;