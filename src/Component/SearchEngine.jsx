import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Input, Select, Icon, Button, message, Spin, Pagination, Empty } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';
import $ from 'jquery';
const Search = Input.Search;
const Option = Select.Option;
const InputGroup = Input.Group;

class SearchEngine extends Component {
    constructor(props) {
        super(props);
        this.targetChange = this.targetChange.bind(this);
        this.search = this.search.bind(this);
        this.fetch = this.fetch.bind(this);
        this.contentTemp = this.contentTemp.bind(this);
        this.fetchAllStaff = this.fetchAllStaff.bind(this);
        this.searchTarget = [
            {
                label: '事务',
                value: 'affair',
                placeholder: '消息内容，回复，文件名'
            },
            {
                label: '合同',
                value: 'contracts',
                placeholder: '合同编号，客户，业务员'
            },
            {
                label: '定价单',
                value: 'pricingList',
                placeholder: '合同编号，客户'
            },
            {
                label: '维修',
                value: 'repairs',
                placeholder: '维修单号，客户中文简称'
            },
            {
                label: '客户',
                value: 'customers',
                placeholder: '公司名，中英文简称，客户号'
            },
            {
                label: '会员',
                value: 'member',
                placeholder: '姓名，手机号码，公司名'
            },
            {
                label: '联系人',
                value: 'contacts',
                placeholder: '姓名，手机号码，公司名'
            }
        ];
    }

    state = {
        loading: false,
        show: false,
        pagination: {
            page: 1,
            num: 15,
            keywords: '',
            total: 1
        },
        selectedItem: {
            label: '事务',
            value: 'affair',
            placeholder: '消息内容，回复，文件名'
        },
        resArr: [],
        staffData: [],
        affairSender: '',
        affairReceiver: ''
    };

    componentDidMount() {
        let search_pagination = sessionStorage.getItem('search_pagination');
        let search_selectedItem = sessionStorage.getItem('search_selectedItem');
        let search_resArr = sessionStorage.getItem('search_resArr');
        if(search_resArr){
            try{
                search_resArr = JSON.parse(search_resArr);
                search_selectedItem = JSON.parse(search_selectedItem);
                search_pagination = JSON.parse(search_pagination);
                this.setState({
                    pagination: search_pagination,
                    selectedItem: search_selectedItem,
                    resArr: search_resArr,
                    show: true
                });
            }catch(e){

            }
        }
        this.fetchAllStaff();
    }

    fetchAllStaff() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                res.body.data.unshift({
                    user_id: 0,
                    user_name: '全部'
                });
                this.setState({
                    staffData: res.body.data
                });
            });
    }

    targetChange(v){
        let selectedItem;
        this.searchTarget.forEach((items,index) => {
            if(items.value==v) selectedItem = items;
        });
        this.setState({
            selectedItem,
            resArr: []
        },() => {
            this.fetch();
        });
    }

    search(v){
        const { selectedItem, affairSender, affairReceiver } = this.state;
        if(selectedItem.value=='affair') {
            if(!affairSender&&!affairReceiver&&!v.trim()){
                message.error('关键字不能为空');
                return;
            }
        }else{
            if(!v.trim()){
                message.error('关键字不能为空');
                return;
            }
        }
        this.setState({
            pagination: {
                page: 1,
                num: 15,
                keywords: v.trim(),
                total: 1
            },
            show: true
        },() => this.fetch());
    }

    fetch(){
        const { selectedItem, pagination, affairSender, affairReceiver } = this.state;
        const { page, num, keywords } = pagination;
        if(selectedItem.value=='affair') {
            if(!affairSender&&!affairReceiver&&!keywords.trim()) return;
        }else{
            if(!keywords.trim()) return;
        }
        this.setState({
            loading: true,
            show: false,
            resArr: []
        });
        const target = selectedItem.value;
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/menu/searchEngine'))
            .set("token", token)
            .query({
                target,
                keywords,
                page,
                num,
                affairSender,
                affairReceiver
            })
            .end((err, res) => {
                if(err) return;
                if(res.body.code==-1){
                    message.error(res.body.msg);
                    this.setState({
                        show: true,
                        loading: false
                    });
                }else{
                    const { pagination } = this.state;
                    pagination.total = res.body.count;
                    this.setState({
                        resArr: res.body.rows,
                        loading: false,
                        show: true,
                        pagination
                    });
                    sessionStorage.setItem('search_resArr',JSON.stringify(res.body.rows));
                    sessionStorage.setItem('search_pagination',JSON.stringify(pagination));
                    sessionStorage.setItem('search_selectedItem',JSON.stringify(selectedItem));
                }
            });
    }

    contentTemp() {
        const { resArr, show, pagination, selectedItem } = this.state;
        const { keywords } = pagination;
        if(!show) return '';
        if(resArr.length==0) return <Empty style={{marginTop: 40}} description={'没有更多了'} />;
        const { value } = selectedItem;
        if(value=='affair'){
            return affairTemp(resArr);
        }else if(value=='contracts'){
            return contractTemp(resArr);
        }else if(value=='pricingList'){
            return pricingListTemp(resArr);
        }else if(value=='repairs'){
            return repairTemp(resArr);
        }else if(value=='customers'){
            return customerTemp(resArr);
        }else if(value=='member'){
            return memberTemp(resArr);
        }else if(value=='contacts'){
            return contactsTemp(resArr);
        }

        // 公共方法
        function commonTemp(tArr) {
            const cArr = [];
            tArr.forEach((it,ind) => {
                try{
                    if(new RegExp(keywords, "ig").test(it)){
                        const re = new RegExp(keywords, "ig");
                        it = it.replace(re,'<span style="color: #f00">'+keywords+'</span>');
                    }
                    cArr.push(<p style={{marginBottom: 1,wordBreak: 'break-word'}} dangerouslySetInnerHTML={{__html: it}} key={it+'-'+ind}></p>);
                }catch(e){

                }
            });
            return cArr;
        }

        // 事务模板
        function affairTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.content, items.file];
                items.NotiClientSubs.forEach((it,ind) => {
                    tArr.push(it.atReply);
                });
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        mailId: items.mailId,
                                        affairId: items.noti_client_affair_group_uuid,
                                        locationId: items.locationId,
                                        fromBox: true
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {items.title}
                            </a>
                            {cArr}
                        </div>
            });
        }

        // 合同模板
        function contractTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.contract_no, items.company, items.sale_person_name];
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        contract_no: items.contract_no
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {'合同管理'}
                            </a>
                            {cArr}
                        </div>
            });
        }

        // 定价单模板
        function pricingListTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.contract_no, items.company];
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        contract_no: items.contract_no
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {'定价单管理'}
                            </a>
                            {cArr}
                        </div>
            });
        }

        // 维修模板
        function repairTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.repair_contractno, items.cust_name];
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        repair_contractno: items.repair_contractno
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {'维修管理'}
                            </a>
                            {cArr}
                        </div>
            });
        }

        // 客户模板
        function customerTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.company, items.level, items.manager];
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        company: items.company
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {'客户管理'}
                            </a>
                            {cArr}
                        </div>
            });
        }

        // 会员模板
        function memberTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.name, items.phone, items.company];
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        phone: items.phone
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {'会员管理'}
                            </a>
                            {cArr}
                        </div>
            });
        }

        // 联系人模板
        function contactsTemp(resArr) {
            return resArr.map((items,index) => {
                const tArr = [items.name, items.phone1, items.company];
                const cArr = commonTemp(tArr);
                return <div key={index} style={{marginTop: 30}}>
                            <a href={"javascript:;"} onClick={() => {
                                hashHistory.push({
                                    pathname: items.frontUrl,
                                    state: {
                                        phone: items.phone1
                                    }
                                });
                            }} style={{margin: 0, cursor: 'pointer', textDecoration: 'underline',fontSize: 16}}>
                                {'联系人管理'}
                            </a>
                            {cArr}
                        </div>
            });
        }
    }

    render() {
        const { selectedItem, loading, pagination, show, resArr, staffData } = this.state;
        let defaultSearchKeywords = sessionStorage.getItem('search_pagination');
        if(defaultSearchKeywords){
            defaultSearchKeywords = JSON.parse(defaultSearchKeywords).keywords;
        }
        const h = window.innerHeight - 250;
        return <Spin spinning={loading}>
                <InputGroup compact style={{display: 'flex',padding: 22,paddingBottom: 12}}>
                    <Select 
                        size="large" 
                        value={selectedItem.value} 
                        style={{width: 100}}
                        onChange={this.targetChange}
                    >
                        {
                            this.searchTarget.map(items => <Option key={items.value} value={items.value}>{items.label}</Option>)
                        }
                    </Select>
                    <Select 
                        size="large" 
                        style={{width: 100,display: selectedItem.value=='affair' ? 'block' : 'none'}}
                        placeholder="发布人"
                        onChange={(v) => {
                            this.setState({
                                affairSender: v
                            });
                        }}
                    >
                        {
                            staffData.map(items => <Option key={items.user_id} value={items.user_id}>{items.user_name}</Option>)
                        }
                    </Select>
                    <Select 
                        size="large" 
                        style={{width: 100,display: selectedItem.value=='affair' ? 'block' : 'none'}}
                        placeholder="回复人"
                        onChange={(v) => {
                            this.setState({
                                affairReceiver: v
                            });
                        }}
                    >
                        {
                            staffData.map(items => <Option key={items.user_id} value={items.user_id}>{items.user_name}</Option>)
                        }
                    </Select>
                    <Search
                        style={{flex: 1}}
                        placeholder={selectedItem.placeholder}
                        enterButton="Search"
                        size="large"
                        defaultValue={defaultSearchKeywords}
                        onSearch={this.search}
                    />
                </InputGroup>
                <div id={'searchResult'} style={{padding: '0px 22px', overflow: 'auto', height: h}}>
                    {this.contentTemp()}
                </div>
                <Pagination style={{paddingLeft: 22,marginTop: 22,display: show&&resArr.length!=0 ? 'block' : 'none'}} onChange={(v) => {
                    pagination.page = v;
                    this.setState({
                        pagination
                    },() => this.fetch());
                }} current={pagination.page} defaultPageSize={pagination.num} total={pagination.total} />
        </Spin>
    }
}

export default SearchEngine;