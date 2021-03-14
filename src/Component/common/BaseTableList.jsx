import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message,Form,Input,Table,Tooltip,Select,Popover,Tag } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import Base from '../../public/js/base.js';
import '../../public/css/table.css';
import ModalTemp from './Modal.jsx';
import PhotoLooker from './PhotoLooker.jsx';
moment.locale('zh-cn');
const Option = Select.Option;

/**
 *  Abstract Class
 */
class BaseTableList extends Component {
    constructor(props) {
        super(props);
        this.handleTableChange = this.handleTableChange.bind(this);
        this.handleTableClick = this.handleTableClick.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.orderChange = this.orderChange.bind(this);
        this.handleCreate = this.handleCreate.bind(this);
        this.handleModalDefine = this.handleModalDefine.bind(this);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.closeTag = this.closeTag.bind(this);
        this.tableRender = this.tableRender.bind(this);
        this.cancelPhotoLooker = this.cancelPhotoLooker.bind(this);
        this.filter = [];
        this.actionWidth = 150;
        this.tableWidth = 172;
        this.actioncolumns = true;
        this.markType = 'ContractsHead';
        this.canRowSelection = false;
    }

    state = {
        data: [],       //fetch的数据源
        pagination: {   //搜索参数
            current: 1,
            pageSize: 30,
            keywords: '',
            order: '',
            filter: {},
            total: 0,
            showSizeChanger: true,
            pageSizeOptions: ['30','50','100','500'],
            onShowSizeChange: (current, pageSize) => {
                const { pagination } = this.state;
                pagination.pageSize = pageSize;
                this.setState({
                    pagination
                });
            }
        },
        markLen: 0,
        loading: false,

        visible: false,
        modalText: '确定删除？',
        photoOption: {
            canRenderPhoto: false,
            imgSrc: null,
            albumBorwerArr: [],
        },
        selectedRowKeys: [],
        selectedRows: [],
    }

    //获取数据
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
                    data[index].key = items.id;
                    if (res.body.data.id_arr.indexOf(Number(items.id)) !== -1) {
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

    //搜索
    handleSearch(){
        let keywords = $('input[name=keywords]').val();
        let pagination = this.state.pagination;
        pagination.keywords = keywords;
        pagination.current = 1;
        this.setState({
            pagination,
            selectedRowKeys: [],
            selectedRows: [],
        },() => {
            this.fetch();
        });
    }

    //点击排序
    orderChange(v){
        let pagination = this.state.pagination;
        pagination.order = v;
        this.setState({
            pagination
        },() => this.fetch());
    }

    //新增
    handleCreate(){
        Base.SetStateSession(this.state);
        hashHistory.push({
            pathname: this.addPathName
        });
    }

    //分页
    handleTableChange(pagination){
        const pager = { ...this.state.pagination };
        pager.current = pagination.current;
        this.setState({
            pagination: pager
        },() => {
            this.fetch();
        });
    }

    //表格点击
    handleTableClick(record, index, e){
        const { data } = this.state;
        if(e.target.innerHTML=='编辑'){
            this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
            Base.SetStateSession(this.state);
            const id = record.id;
            let selectData;
            data.forEach((items,index) => {
                if(items.id==id){
                    selectData = items;
                }
            });
            hashHistory.push({
                pathname: this.editPathName,
                state: selectData
            });
        }else if(e.target.innerHTML=='标记'){
            let targetDom = e.target;
            this.addMark(record.id,this.markType,() => {
                targetDom.innerHTML = '取消标记';
            });
        }else if(e.target.innerHTML=='取消标记'){
            let targetDom = e.target;
            this.cancelMark(record.id,this.markType,() => {
                targetDom.innerHTML = '标记';
            });
        }
    }

    handleModalDefine(){

    }

    handleModalCancel(){
        
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
            this.setState({
                pagination
            },() => {
                this.fetch();
            });
        }
    }

    //添加标记
    addMark(id,type,cb){
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/mark/add'))
            .set("token",token)
            .send({
                tableId: id,
                type: type
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    cb();
                }else{
                    message.error(res.body.msg);
                }
            })
    }

    //批量添加标记
    addMarkBatch(idArr,type,cb){
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/mark/addBatch'))
            .set("token",token)
            .send({
                tableIdArr: idArr,
                type,
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    if (cb) cb();
                }else{
                    message.error(res.body.msg);
                }
            })
    }

    //取消标记
    cancelMark(id,type,cb){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/mark/del'))
            .set("token",token)
            .send({
                tableId: id,
                type: type
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    cb();
                }else{
                    message.error(res.body.msg);
                }
            })
    }

    //取消取消标记
    cancelMarkBatch(idArr,type,cb){
        let token = sessionStorage.getItem('token');
        request.delete(common.baseUrl('/mark/delBatch'))
            .set("token",token)
            .send({
                tableIdArr: idArr,
                type,
            })
            .end((err,res) => {
                if(err) return;
                if(res.body.code==200){
                    message.success(res.body.msg);
                    if (cb) cb();
                }else{
                    message.error(res.body.msg);
                }
            })
    }

    initMark(){
        const { pagination,markLen } = this.state;
        const { current,pageSize } = pagination;
        let baseCount = (current - 1) * pageSize;
        $('.ant-table-fixed-right ._mark').each((index,items) => {
            if(Number(baseCount+index)<markLen){
                $('.ant-table-fixed-right ._mark').eq(index).find('._mark_a').html('取消标记');
            }else{
                $('.ant-table-fixed-right ._mark').eq(index).find('._mark_a').html('标记');
            }
        });
    }

    componentDidUpdate(){
        this.initMark();
        const { pagination, selectedRowKeys } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none';
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
        }
        const w = 300;
        const footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder;">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
    }

    viewRender(key,res_data,text, row, index){
        if(key=='album'){
            let albumArr;
            try{
                albumArr = row[key].split(',');
            }catch(e){  
                albumArr = [];
            }
            return(
                <div>
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
            )
        }else{
            return <p style={{width: res_data[key]['width']-32,margin: 0,"overflow": "hidden","textOverflow":"ellipsis","whiteSpace": "nowrap"}}>
                        <Tooltip placement="top" title={row[key]}>
                            {row[key]}
                        </Tooltip>
                    </p>
        }
    }

    inputRender(){
        const { data,pagination } = this.state;
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
                        <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button>
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    actionRender(text, row, index) {
        return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <a className={"_mark_a"} style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                </p>;
    }

    filterType = (type,v) => {
        const { pagination } = this.state;
        let { filter } = pagination;
        pagination.current = 1;
        this.filter.forEach((items,index) => {
            if(type==items){
                try{
                    filter[items] = v.join();
                }catch(e){
                    filter[items] = v;
                }
            }
        });
        this.setState({
            pagination,
            selectedRowKeys: [],
            selectedRows: [],
        },() => this.fetch());
    }

    tagsRender(){
        const { pagination } = this.state;
        let allTagArr = [];
        try{
            this.filter.forEach((items,index) => {
                allTagArr = [...allTagArr,...pagination.filter[items].split(',')];
            });
        }catch(e){

        }
        const endArr = allTagArr.filter(items => items);
        return endArr.map(items => <Tag key={items} data-text={items} closable onClose={this.closeTag}>{items}</Tag>)
    }

    closeTag(e){
        e.preventDefault();
        // const v = $(e.target).prev().text();
        const v = $(e.target).parent().parent().attr('data-text');
        const { pagination } = this.state;
        this.filter.forEach((items,index) => {
            const _arr = pagination.filter[items].split(',');
            _arr.forEach((it,ind) => {
                if(it==v){
                    _arr.splice(ind,1);
                }
            });
            pagination.filter[items] = _arr.join();
        });
        this.setState({
            pagination,
            selectedRowKeys: [],
            selectedRows: [],
        },() => this.fetch());
    }

    expandedRowRender(){
        
    }

    tableRender(params){
        const {columns,data,tableWidth,b_height} = params;
        if (this.canRowSelection) {
            return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    rowSelection={this.rowSelection()}
                    onChange={this.handleTableChange} />
        }
        return <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={this.state.pagination}
                    loading={this.state.loading}
                    scroll={{ x: tableWidth, y: b_height }} 
                    onRowClick={this.handleTableClick}
                    onChange={this.handleTableChange} />
    }

    cancelPhotoLooker() {
        const { photoOption } = this.state;
        photoOption.canRenderPhoto = false;
        this.setState({
            photoOption,
        });
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
                            if (items.id != record.id && i === globalSelectedRows.length - 1) {
                                globalSelectedRows.push(record);
                            }
                        }
                    }
                } else {
                    globalSelectedRows = globalSelectedRows.filter(items => items.id != record.id);
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

    clearSelectedRowKeys = () => {
        this.setState({
            selectedRowKeys: [],
            selectedRows: [],
        });
        this.handleSearch();
    }

    render(){
        let { data,pagination, photoOption } = this.state;
        const { albumBorwerArr, imgSrc, canRenderPhoto } = photoOption;
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
                }
            };
            columns.push(o);
            if (key == this.fixedKey) o.fixed = 'left';
        }
        if(this.actioncolumns){
            columns.push({
                title: '操作',
                key: 'operation',
                fixed: 'right',
                width: this.actionWidth,
                render: (text, row, index) => {
                    return this.actionRender(text, row, index);
                },
            });
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
                <ModalTemp 
                    handleModalCancel={this.handleModalCancel}
                    handleModalDefine={this.handleModalDefine}
                    ModalText={this.state.modalText} 
                    visible={this.state.visible} />
                <PhotoLooker cancelPhotoLooker={this.cancelPhotoLooker} albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={canRenderPhoto}></PhotoLooker>
            </div>
        )
    }
    
}

export default BaseTableList;