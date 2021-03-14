import React, { Component } from 'react';
import common from '../public/js/common';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/bar';
import 'echarts/lib/chart/line';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/markPoint';
import 'echarts/lib/component/markLine';
import 'echarts/lib/component/dataZoom';
import { Radio, Spin, Input, Select } from 'antd';
moment.locale('zh-cn');
const { Option } = Select;

// class Achievement extends Component {
//     constructor(props){
//         super(props);
//     }

//     render(){
//         let b_height = window.innerHeight-93;
//         const token = sessionStorage.getItem('token');
//         let src = common.staticBaseUrl('/html/achievement.html?token='+token);
//         return <iframe src={src} style={{width:'100%',height:b_height+'px',border:'none'}}></iframe>
//     }
// }
class Achievement extends Component {
    constructor(props){
        super(props);
        this.currentData = [];
        this.totalData = [];
        this.oneYearCustomerData = [];
        this.twoYearCustomerData = [];
        this.closedData = [];
        this.jnArr = [];
        this.hzArr = [];
        this.selectedCompanyId;
        this.selectedUserId;
        this.state = {
            customerValue: 0,
            groupValue: 0,
            currentDeferDeliver: 0,
            currentDeferReturn: 0,
            loading: true,
            staffArr: [],
            customerArr: [],
        };
        this.isBarChecked = false;
        this.checkedBarSeriesName;
    }

    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart-ach'));
        this.chart2 = echarts.init(document.getElementById('chart-bar'));
        this.initFetch();

        this.chart.on('mouseover', params => {
            if (params.seriesType === 'bar') {
                this.isBarChecked = true;
                this.checkedBarSeriesName = params.seriesName;
                this.setOption(true);
            }
        });

        this.chart.on('mouseout', params => {
            if (params.seriesType === 'bar') {
                this.isBarChecked = false;
                this.checkedBarSeriesName = undefined;
                this.setOption(true);
            }
        });
    }

    initFetch = async () => {
        await Promise.all([
            this.getTotalData(),
            this.getStaffData(),
            this.getAllCustomer(),
        ]);
        this.setState({
            loading: false,
        });
        this.setOption();
    }

    getTotalData = async () => {
        return await new Promise(resolve => {
            const endTime = moment().format('YYYY-MM-DD');
            const yyyy = new Date().getFullYear();
            const startTime = yyyy - 2 + '-01-01';
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/pricing/getAchievementInfo'))
                .set("token", token)
                .query({
                    startTime,
                    endTime,
                })
                .end((err, res) => {
                    this.totalData = res.body.data;
                    resolve();
                });
        });
        
    }

    getOneYearCustomerData = async () => {
        return await new Promise(resolve => {
            this.oneYearCustomerData = this.totalData.filter(items => items.grade == 1 && items.credit_qualified == 1 && items.hasDelivery == 1);
            resolve();
        //     const token = sessionStorage.getItem('token');
        //     request.get(common.baseUrl('/pricing/getNewCusAchievementInfo'))
        //         .set("token", token)
        //         .query({
        //             year: 1,
        //         })
        //         .end((err, res) => {
        //             this.oneYearCustomerData = res.body.data;
        //             resolve();
        //         });
        });
    }

    getTwoYearCustomerData = async () => {
        return await new Promise(resolve => {
            this.twoYearCustomerData = this.totalData.filter(items => items.grade == 2 && items.credit_qualified == 1 && items.hasDelivery == 1);
            resolve();
            // const token = sessionStorage.getItem('token');
            // request.get(common.baseUrl('/pricing/getNewCusAchievementInfo'))
            //     .set("token", token)
            //     .query({
            //         year: 2,
            //     })
            //     .end((err, res) => {
            //         this.twoYearCustomerData = res.body.data;
            //         resolve();
            //     });
        });
    }

    getStaffData = async () => {
        return await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl2('/admin/employees/getAllList'))
                .set("token",token)
                .set('accept', 'json')
                .end((err,res) => {
                    if(err) return;
                    const jnArr = [], hzArr = [];
                    const staffArr = [];
                    const data = JSON.parse(res.text);
                    data.data.forEach((items) => {
                        const { user_id, group, on_job } = items;
                        if (on_job == 1) {
                            staffArr.push(items);
                        }
                        if (group === '杭州组') {
                            hzArr.push(user_id);
                        } else {
                            jnArr.push(user_id);
                        }
                    });
                    this.setState({ staffArr });
                    this.jnArr = jnArr;
                    this.hzArr = hzArr;
                    resolve();
                });
        });
    }

    getAllCustomer = async () => {
        return await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/customers/getAllCustomers'))
                .set("token",token)
                .end((err,res) => {
                    if(err) return;
                    const customerArr = res.body;
                    this.setState({ customerArr });
                    resolve();
                });
        });
    }

    getDeferDeliver = async () => {
        const token = sessionStorage.getItem('token');
        const self = this;
        const { groupValue, customerValue, staffArr } = this.state;
        let sale_person;
        if (groupValue == 0) {
            sale_person = '业务部';
        } else if (groupValue == 1) {
            sale_person = '济南组';
        } else if (groupValue == 3) {
            sale_person = staffArr.filter(items => items.user_id == this.selectedUserId)[0].user_name;
        } else {
            sale_person = '杭州组';
        }
        this.setState({
            currentDeferDeliver: 0,
            currentDeferReturn: 0,
            loading: true,
        });

        const deferRes = await new Promise(async resolve => {
            const data = {
                sale_person,
                orderSignYear: new Date().getFullYear() - 1,
                orderDeliveryYear: new Date().getFullYear(),
            };
            if (customerValue == 3) {
                data.company = self.selectedCompanyId;
            } else if (customerValue == 1 || customerValue == 2) {
                data.year = customerValue;
            }
            request.get(common.baseUrl('/pricing/getDeferredAchievement'))
                    .set("token",token)
                    .query(data)
                    .end((err,res) => {
                        if(err) return;
                        resolve(res.body.data);
                    });
        });
        this.setState({
            currentDeferDeliver: deferRes.deliveryNum,
            currentDeferReturn: deferRes.closeNum,
            loading: false,
        });
    }

    filterNewCustomerContractByContract = async () => {
        const { closedData } = this;
        const contractNoArr = closedData.map(items => items.contract_no);
        const { customerValue }= this.state;
        return await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/pricing/filterNewCustomerContractByContract'))
                .set("token",token)
                .send({
                    contractNoArr,
                    year: customerValue,
                })
                .end((err,res) => {
                    if(err) return;
                    const filteredArr = res.body.data;
                    const resArr = closedData.filter(items => filteredArr.includes(items.contract_no));
                    resolve(resArr);
                });
        });
    }

    formatAmount = str => {
        str = String(str);
        const strArr = str.split('.');
        let amount = strArr[0];
        let count = 0;
        const formatStrArr = [];
        for (let i = amount.length - 1; i >= 0; i--) {
            formatStrArr.unshift(amount[i]);
            count++;
            if (count === 3) {
                count = 0;
                formatStrArr.unshift(',');
            }
        }
        if (formatStrArr.length !== 0 && formatStrArr[0] === ',') {
            formatStrArr.shift();
        }
        let resStr = '';
        formatStrArr.forEach(items => resStr += items);
        if (strArr.length === 2) {
            resStr += ('.' + strArr[1]);
        }
        return resStr;
    }

    _monthDiff = (currentTime, targetTime) => {
        let _currentTime;
        if (currentTime) {
            _currentTime = moment(currentTime).format('YYYY-MM') + '-01';
        } else {
            _currentTime = moment().format('YYYY-MM') + '-01';
        }
        const _targetTime = moment(targetTime).format('YYYY-MM') + '-01';
        return moment(_currentTime).diff(moment(_targetTime), 'months');
    }

    setOption = async notFetch => {
        const self = this;
        const { totalData, oneYearCustomerData, twoYearCustomerData, jnArr, hzArr } = this;
        const { customerValue, groupValue } = this.state; 
        let currentData = [];
        if (customerValue == 1) {
            currentData = oneYearCustomerData;
        } else if (customerValue == 2) {
            currentData = twoYearCustomerData;
        } else if (customerValue == 3) {
            currentData = totalData.filter(items => items.company == this.selectedCompanyId);
        } else {
            currentData = totalData;
        }

        if (groupValue == 1) {
            currentData = currentData.filter(items => {
                return jnArr.includes(items.sale_person);
            });
        } else if (groupValue == 2) {
            currentData = currentData.filter(items => {
                return hzArr.includes(items.sale_person);
            });
        } else if (groupValue == 3) {
            currentData = currentData.filter(items => items.sale_person == this.selectedUserId);
        }

        if (!notFetch) {
            this.getDeferDeliver();
        }

        setChart1();
        setChart2();

        function setChart1() {
            const currentY = new Date().getFullYear();
            const xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            const series = [
                { data: new Array(12), type: 'line', stack: currentY + '已发货', name: currentY + '已发货' },
                { data: new Array(12), type: 'line', stack: String(currentY), name: String(currentY) },
                { data: new Array(12), type: 'line', stack: String(currentY - 1), name: String(currentY - 1) },
                { data: new Array(12), type: 'line', stack: String(currentY - 2), name: String(currentY - 2) },
                { data: new Array(12), type: 'bar', name: String(currentY - 2) },
                { data: new Array(12), type: 'bar', name: String(currentY - 1) },
                { data: new Array(12), type: 'bar', name: String(currentY) },
                { data: new Array(12), type: 'bar', name: currentY + '已发货' },
            ];
            for (let i = 0; i < 12; i++) {
                series[0].data[i] = 0;
                series[1].data[i] = 0;
                series[2].data[i] = 0;
                series[3].data[i] = 0;
                series[4].data[i] = 0;
                series[5].data[i] = 0;
                series[6].data[i] = 0;
                series[7].data[i] = 0;
            }
            
            for (let i = 0; i < currentData.length; i++) {
                const { sign_time, achievement, hasDelivery } = currentData[i];
                const y = new Date(sign_time).getFullYear();
                const m = new Date(sign_time).getMonth();
                if (currentY - y === 0) {
                    series[1].data[m] += Number(achievement);
                    series[6].data[m] += Number(achievement);
                    if (hasDelivery) {
                        series[0].data[m] += Number(achievement);
                        series[7].data[m] += Number(achievement);
                    }
                } else if (currentY - y === 1) {
                    if (hasDelivery) {
                        series[2].data[m] += Number(achievement);
                        series[5].data[m] += Number(achievement);
                    }
                } else if (currentY - y === 2) {
                    if (hasDelivery) {
                        series[3].data[m] += Number(achievement);
                        series[4].data[m] += Number(achievement);
                    }
                }
            }
            for (let i = 0; i < series.length; i++) {
                if (i > 3) {
                    break;
                }
                for (let j = 0; j < series[i].data.length; j++) {
                    series[i].data[j] += series[i].data[j - 1] ? series[i].data[j - 1] : 0;
                }
            }

            self.chart.setOption({
                color: ['#A52ED5', '#0000FF', '#24FF24', '#FF8B3C'],
                tooltip: {
                    trigger: 'axis',
                    formatter: function(params) {
                        if (!self.isBarChecked) {
                            params = params.filter(items => items.componentSubType === 'line');
                        } else {
                            params = params.filter(items => items.componentSubType === 'bar');
                            params = params.filter(items => items.seriesName === self.checkedBarSeriesName);
                        }
                        let str = ``;
                        for (let i = 0; i < params.length; i++) {
                            const value = self.formatAmount(params[i].value);
                            str += `<div style="width: 10px; height: 10px; background: ${params[i].color}; border-radius: 50%; display: inline-block; margin-right: 4px;"></div>${params[i].seriesName}: ${value}</br>`;
                        }
                        return `${params[0].axisValue}</br>${str}`;
                    },
                },
                legend: {
                    data: [String(currentY - 2), String(currentY - 1), String(currentY), currentY + '已发货'],
                    x: 'center',
                    y: 'bottom',
                },
                xAxis: {
                    type: 'category',
                    data: xAxisData,
                },
                yAxis: {
                    type: 'value'
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 0,
                        end: 100
                    }
                ],
                series,
            });
        }
        
        function setChart2() {
            const xAxisData = [];
            const signTimeArr = currentData.map(items => Date.parse(items.sign_time));
            const minSignTime = Math.min.apply(null, signTimeArr);
            const maxSignTime = Math.max.apply(null, signTimeArr);
            const monthOffset = self._monthDiff(maxSignTime, minSignTime) + 1;

            for (let i = 0; i < monthOffset; i++) {
                xAxisData.unshift(moment(maxSignTime).subtract(i, 'months').format('YYYY-MM'));
            }

            const series = [
                {
                    name: '已发货',
                    stack: 'total', 
                    type: 'bar',
                    data: new Array(monthOffset),
                },
                {
                    name: '未发货',
                    stack: 'total', 
                    type: 'bar',
                    data: new Array(monthOffset),
                },
            ];

            for (let i = 0; i < monthOffset; i++) {
                series[0].data[i] = 0;
                series[1].data[i] = 0;
            }

            for (let i = 0; i < currentData.length; i++) {
                const { sign_time, achievement, hasDelivery } = currentData[i];
                const offset = self._monthDiff(maxSignTime, sign_time);
                if (hasDelivery == 1) {
                    series[0].data[monthOffset - 1 - offset] += Number(achievement);
                } else {
                    series[1].data[monthOffset - 1 - offset] += Number(achievement);
                }
            }

            self.chart2.setOption({
                color: ['#A52ED5', '#0000FF'],
                tooltip: {
                    trigger: 'axis',
                },
                legend: {
                    data: ['已发货', '未发货'],
                    x: 'center',
                    y: 'bottom',
                },
                xAxis: {
                    type: 'category',
                    data: xAxisData,
                },
                yAxis: {
                    type: 'value'
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 0,
                        end: 100
                    }
                ],
                series,
            });
        }
    }

    changeState = async (type, value) => {
        if (type === 'customer') {
            this.selectedCompanyId = null;
            const { oneYearCustomerData, twoYearCustomerData } = this;
            if ((value == 1 || value == 2) && (oneYearCustomerData.length === 0 || twoYearCustomerData.length === 0)) {
                this.setState({ loading: true });
                await Promise.all([
                    this.getOneYearCustomerData(),
                    this.getTwoYearCustomerData(),
                ]);
                this.setState({ loading: false });
            }
            this.setState({
                customerValue: value,
            }, () => {
                if (value === 3) {
                    return;
                }
                this.setOption();
            });
        } else {
            this.selectedUserId = null;
            this.setState({
                groupValue: value,
            }, () => {
                if (value === 3) {
                    return;
                }
                this.setOption();
            });
        }
    }

    filterTargetContract = () => {
        const { closedData } = this;
        const { customerArr } = this.state;
        const targetAbb = customerArr.filter(items => items.company == this.selectedCompanyId)[0].abb;
        const resArr = closedData.filter(items => items.cus_abb == targetAbb);
        return resArr;
    }

    salePersonChange = v => {
        this.selectedUserId = v;
        this.setOption();
    }

    customerChange = v => {
        this.selectedCompanyId = v;
        this.setOption();
    }

    render() {
        const { customerValue, groupValue, currentDeferReturn, currentDeferDeliver, loading, staffArr, customerArr } = this.state;
        return (
            <div>
                <Spin spinning={loading}>
                    <div style={{paddingLeft: 12, paddingTop: 12}}>
                        <div style={{marginTop: 8}}>
                            <Radio.Group onChange={e => this.changeState('customer', e.target.value)} value={customerValue}>
                                <Radio value={0}>全部客户</Radio>
                                <Radio value={1}>一年新</Radio>
                                <Radio value={2}>二年新</Radio>
                                <Radio value={3}>指定客户</Radio>
                            </Radio.Group>
                            { customerValue == 3 && <Select
                                showSearch
                                style={{ width: 200 }}
                                onChange={this.customerChange}
                                filterOption={(input, option) =>
                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                >
                                { customerArr.map(items => <Option key={items.user_id} value={items.company}>{items.company}</Option>) }
                            </Select> }
                        </div>
                        <div style={{marginTop: 8}}>
                            <Radio.Group onChange={e => this.changeState('group', e.target.value)} value={groupValue}>
                                <Radio value={0}>业务部</Radio>
                                <Radio value={1}>济南组</Radio>
                                <Radio value={2}>杭州组</Radio>
                                <Radio value={3}>指定业务员</Radio>
                            </Radio.Group>
                            { groupValue == 3 && <Select
                                showSearch
                                style={{ width: 200 }}
                                onChange={this.salePersonChange}
                                filterOption={(input, option) =>
                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                >
                                { staffArr.map(items => <Option key={items.user_id} value={items.user_id}>{items.user_name}</Option>) }
                            </Select> }
                        </div>
                        <div style={{marginTop: 8}}>
                            <span>递延发货：{currentDeferDeliver}</span>
                            <span style={{marginLeft: 24}}>递延退货：{currentDeferReturn}</span>
                        </div>
                    </div>
                </Spin>
                <div id='chart-ach' style={{ width: '100%', height: 500 }}></div>
                <div id='chart-bar' style={{ width: '100%', height: 500 }}></div>
            </div>
        )
    }
}

export default Achievement;