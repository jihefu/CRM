import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import VirProducts from '../VirProducts/VirProducts';
import Base from '../../public/js/base.js';

class DynaProducts extends VirProducts {
    constructor(props) {
        super(props);
        this.addPathName = '/dynaProductsAdd';
        this.res_data = {
            serialNo: {
                label: '序列号',
                width: 150,
            },
            model: {
                label: '型号',
                width: 150
            },
            dealer: {
                label: '客户',
                width: 200,
            },
            status: {
                label: '产品状态',
                width: 100,
            },
            storage: {
                label: '库存地',
                width: 100,
            },
            salesman: {
                label: '业务员',
                width: 150
            },
            maker: {
                label: '组装人',
                width: 150
            },
            tester: {
                label: '测试人',
                width: 150,
            },
            inputDate: {
                label: '组装日期',
                width: 200,
            },
        };
        this.state.pagination.filter.model = '代龙';
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

    // @Override
    moreInfo = (sn, id) => {
        this.state.SELFURL = window.location.href.split('#')[1].split('?')[0];
        Base.SetStateSession(this.state);
        hashHistory.push({
            pathname: '/dynaProductsInfo',
            state: {
                sn,
                id,
            },
        });
    }
}

export default DynaProducts;