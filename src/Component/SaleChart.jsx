import React, { Component } from 'react';
import Achievement from './Achievement';
import request from 'superagent';
import common from '../public/js/common.js';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class SaleChart extends Achievement {
    constructor(props) {
        super(props);
    }

    getTotalData = async () => {
        return await new Promise(resolve => {
            const endTime = moment().format('YYYY-MM-DD');
            const yyyy = new Date().getFullYear();
            const startTime = yyyy - 2 + '-01-01';
            const token = sessionStorage.getItem('token');
            request.get(common.baseUrl2('/admin/contract/getInfoByDateAndCpy'))
                .set("token", token)
                .query({
                    startTime,
                    endTime,
                })
                .end((err, res) => {
                    const endRes = JSON.parse(res.text);
                    this.totalData = endRes.data;
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
            request.get(common.baseUrl('/pricing/getDeferredPayable'))
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

    setOption = async notFetch => {
        const self = this;
        const { totalData, oneYearCustomerData, twoYearCustomerData, jnArr, hzArr } = this;
        const { customerValue, groupValue, customerArr } = this.state; 
        let currentData = [];
        if (customerValue == 1) {
            currentData = oneYearCustomerData;
        } else if (customerValue == 2) {
            currentData = twoYearCustomerData;
        } else if (customerValue == 3) {
            const targetAbb = customerArr.filter(items => items.company == this.selectedCompanyId)[0].abb;
            currentData = totalData.filter(items => items.cus_abb == targetAbb);
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
                const { sign_time, payable, hasDelivery } = currentData[i];
                const y = new Date(sign_time).getFullYear();
                const m = new Date(sign_time).getMonth();
                if (currentY - y === 0) {
                    series[1].data[m] += Number(payable);
                    series[6].data[m] += Number(payable);
                    if (hasDelivery) {
                        series[0].data[m] += Number(payable);
                        series[7].data[m] += Number(payable);
                    }
                } else if (currentY - y === 1) {
                    if (hasDelivery) {
                        series[2].data[m] += Number(payable);
                        series[5].data[m] += Number(payable);
                    }
                } else if (currentY - y === 2) {
                    if (hasDelivery) {
                        series[3].data[m] += Number(payable);
                        series[4].data[m] += Number(payable);
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
                const { sign_time, payable, hasDelivery } = currentData[i];
                const offset = self._monthDiff(maxSignTime, sign_time);
                if (hasDelivery == 1) {
                    series[0].data[monthOffset - 1 - offset] += Number(payable);
                } else {
                    series[1].data[monthOffset - 1 - offset] += Number(payable);
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
}

export default SaleChart;