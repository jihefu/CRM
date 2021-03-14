import React, { Component } from 'react';
import { Input, Select, Button, message, Spin, } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
const Option = Select.Option;
const InputGroup = Input.Group;

class RepairStatistics extends Component {
    constructor(props) {
        super(props);
        this.user_id;
    }

    state = {
        loading: false,
        year: new Date().getFullYear() - 2,
        yearArr: [],
        companyArr: [],
        selectedCompany: null,
        repairResult: {
            total: 0,
            againRate: 0,
            oneYearRepair: {
                repairNum: 0,
                data: [],
                rate: 0,
            },
            twoYearRepair: {
                repairNum: 0,
                data: [],
                rate: 0,
            },
            threeYearRepair: {
                repairNum: 0,
                data: [],
                rate: 0,
            }
        },
    };

    componentDidMount() {
        const yearArr = [];
        const newYear = new Date().getFullYear();
        let count = 0;
        while (count < 5) {
            yearArr.push({
                value: newYear - count,
                label: newYear - count + '年',
            });
            count++;
        }
        this.setState({
            yearArr,
        });
    }

    yearChange = year => {
        this.setState({
            year,
        });
    }

    handleSearch = v => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/customers/remoteSearchCustomers'))
            .query({
                keywords: v,
            })
            .set("token",token)
            .end((err,res) => {
                this.setState({
                    companyArr: res.body.data,
                });
            });
    }

    handleChange = v => {
        const { companyArr } = this.state;
        this.setState({
            selectedCompany: v,
        });
        companyArr.forEach(items => {
            if (items.value === v) {
                this.user_id = items.data.user_id;
            }
        });
    }

    searchRepair = () => {
        const { year } = this.state;
        const { user_id } = this;
        this.setState({
            loading: true,
        });
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/repairs/getRepairRateByYear'))
            .query({
                year,
                user_id,
            })
            .set("token",token)
            .end((err,res) => {
                if (res.body.code === 200) {
                    this.setState({
                        loading: false,
                        repairResult: res.body.data,
                    });
                } else {
                    this.setState({
                        loading: false,
                    });
                    message.error(res.body.msg);
                }
            });
    }

    render() {
        const { loading, year, yearArr, companyArr, selectedCompany, repairResult } = this.state;
        const options =companyArr.map(d => <Option key={d.value}>{d.text}</Option>);
        return (
            <div style={{overflow: 'auto', height: window.innerHeight-93}}>
                <Spin spinning={loading} >
                    <h2 style={{padding: '22px 22px 12px'}}>{year}年产品质量一览</h2>
                    <InputGroup compact style={{display: 'flex',padding: 22,paddingBottom: 12}}>
                        <Select 
                            value={year} 
                            style={{width: 100}}
                            onChange={this.yearChange}
                        >
                            {
                                yearArr.map(items => <Option key={items.value} value={items.value}>{items.label}</Option>)
                            }
                        </Select>
                        <Select
                            showSearch
                            style={{width: 300}}
                            value={selectedCompany}
                            placeholder={'公司名称'}
                            showArrow={false}
                            filterOption={false}
                            onSearch={this.handleSearch}
                            onChange={this.handleChange}
                        >
                            {options}
                        </Select>
                        <Button type={'primary'} onClick={this.searchRepair}>搜索</Button>
                    </InputGroup>
                    <div style={{padding: '22px 22px 12px'}}>
                        <p>
                            <span>当年总产量：</span>
                            <span>{repairResult.total}</span>
                        </p>
                        <p>
                            <span>二次维修率：</span>
                            <span>{repairResult.againRate}</span>
                        </p>
                        <p>
                            <p>一年维修：</p>
                            <p style={{marginLeft: 32}}>
                                <p>
                                    <span>数量：</span>
                                    <span>{repairResult.oneYearRepair.repairNum}</span>
                                </p>
                                <p>
                                    <span>占比：</span>
                                    <span>{repairResult.oneYearRepair.rate}</span>
                                </p>
                                <p>
                                    <span>序列号：</span>
                                    <span style={{ wordWrap: 'break-word'}}>{repairResult.oneYearRepair.data.join()}</span>
                                </p>
                            </p>
                        </p>
                        <p>
                            <p>二年维修：</p>
                            <p style={{marginLeft: 32}}>
                                <p>
                                    <span>数量：</span>
                                    <span>{repairResult.twoYearRepair.repairNum}</span>
                                </p>
                                <p>
                                    <span>占比：</span>
                                    <span>{repairResult.twoYearRepair.rate}</span>
                                </p>
                                <p>
                                    <span>序列号：</span>
                                    <span style={{ wordWrap: 'break-word'}}>{repairResult.twoYearRepair.data.join()}</span>
                                </p>
                            </p>
                        </p>
                        <p>
                            <p>三年维修：</p>
                            <p style={{marginLeft: 32}}>
                                <p>
                                    <span>数量：</span>
                                    <span>{repairResult.threeYearRepair.repairNum}</span>
                                </p>
                                <p>
                                    <span>占比：</span>
                                    <span>{repairResult.threeYearRepair.rate}</span>
                                </p>
                                <p>
                                    <span>序列号：</span>
                                    <span style={{ wordWrap: 'break-word'}}>{repairResult.threeYearRepair.data.join()}</span>
                                </p>
                            </p>
                        </p>
                    </div>
                </Spin>
            </div>
        );
    }
}

export default RepairStatistics;