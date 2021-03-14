import React from 'react';
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
import request from 'superagent';
import common from '../../public/js/common';
import { Select, Table, Divider, Button } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');
const { Option } = Select;

class YBScoreChart extends React.Component {
    constructor(props) {
        super(props);
        this.chart;
        this.data = [];
        this.filterData = [];
        this.xUnit = 'days';
        this.prevUnit = '';
        this.timer;
        this.canvasChartActive = false;
        this.filterName = '';
        this.typeArr = [
            { text: '签到', code: '1301' },
            { text: '到款', code: '1302' },
            { text: '确认收货', code: '1306' },
            { text: '上门服务反馈', code: '1307' },
            { text: '介绍分', code: '1308' },
            { text: '新会员入会奖励', code: '1315' },
            { text: '新会员商务认证', code: '1309' },
            { text: '线上消息', code: '1310' },
            { text: '云登录', code: '1312' },
            { text: '后台录入', code: '1314' },
            { text: '兑换', code: '0' },
            { text: '阅读', code: '1303' },
            { text: '竞猜', code: '1313' },
            { text: '问答', code: '1305' },
        ];
        const self = this;
        this.state = {
            selectList: [],
            totalScore: 0,
            option: {
                color: ['#B73633', '#fb9d5e', '#4093FE', 'rgb(66, 219, 65)', '#041529', '#C4CCD3'],
                tooltip: {
                    trigger: 'axis',
                    position: (pt, params) => {
                        self.selectXUnit(params[0].axisValue);
                    }
                },
                legend: {
                    data: this.typeArr.map(items => items.text),
                },
                xAxis: {
                    type: 'category',
                    data: [],
                },
                yAxis: {
                    scale: true,
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 82,
                        end: 100
                    }
                ],
                series: [],
            },
        };
        this.chartLine;
    }

    taskTimer = () => {
        let count = 0;
        let v;
        let hasRender = false;
        this.timer = setInterval(() => {
            if (v === this.prevUnit) {
                if (count < 10) {
                    count++;
                }
            } else {
                count = 0;
                v = this.prevUnit;
                hasRender = false;
            }
            if (count > 5 && this.canvasChartActive && !hasRender) {
                this.tableRenderHandle(v);
                hasRender = true;
            }
        }, 100);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    componentDidMount() {
        this.taskTimer();
        this.fetchData();
        this.chart = echarts.init(document.getElementById('main'));
        this.chartLine = echarts.init(document.getElementById('main_line'));
        this.setOption();
    }

    fetchData = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/member/getTotalYbTicket'))
            .set("token", token)
            .end((err, res) => {
                this.data = res.body.data;
                this.initData();
            });
    }

    _getXUnitFormat = xUnit => {
        let xUnitFormat;
        if (xUnit === 'days') {
            xUnitFormat = 'YYYY-MM-DD';
        } else if (xUnit === 'month') {
            xUnitFormat = 'YYYY-MM';
        } else if (xUnit === 'year') {
            xUnitFormat = 'YYYY';
        }
        return xUnitFormat;
    }

    initData = () => {
        const { option } = this.state;
        const { xUnit, filterName } = this;
        const xUnitFormat = this._getXUnitFormat(xUnit);
        const dateMapper = {};
        let filterData, totalScore = 0;
        if (filterName) {
            filterData = this.data.filter(items => items.name === filterName);
        } else {
            filterData = this.data;
        }
        filterData.forEach(items => totalScore += Number(items.score));
        this.filterData = filterData;
        const minDate = moment(filterData[0].create_time).format(xUnitFormat);
        const nowDate = moment().format(xUnitFormat);
        const xAxisDateArr = [minDate];
        let presentDate = minDate;
        while (presentDate !== nowDate) {
            presentDate = moment(presentDate).subtract(-1, xUnit).format(xUnitFormat);
            xAxisDateArr.push(presentDate);
        }
        option.xAxis.data = xAxisDateArr;
        xAxisDateArr.forEach((date, index) => {
            dateMapper[date] = index;
        });
        const valueArr = [];
        for (let i = 0; i < xAxisDateArr.length; i++) {
            valueArr[i] = 0;
        }
        const series = this.typeArr.map(items => ({
            name: items.text,
            code: items.code,
            stack: 'total', 
            type: 'bar',
            data: JSON.parse(JSON.stringify(valueArr)),
        }));
        for (let i = 0; i < filterData.length; i++) {
            let { score, event_code, create_time } = filterData[i];
            create_time = moment(create_time).format(xUnitFormat);
            for (let j = 0; j < series.length; j++) {
                if (series[j].code == event_code) {
                    if (dateMapper.hasOwnProperty(create_time)) {
                        const index = dateMapper[create_time];
                        series[j].data[index] += Number(score);
                    }
                    break;
                }
            }
        }
        /********************************************************************/
        // 20210120加的代码
        const nameType = ['会籍', '商务', '云服务', '线上互动', '后台录入', '兑换'];
        const existLen = series[0].data.length;
        const newSeries = nameType.map(name => ({ name, stack: 'total', type: 'bar', data: new Array(existLen).fill(0) }));
        for (let i = 0; i < series.length; i++) {
            const { code, data: oldData } = series[i];
            if (['1308', '1309', '1315'].includes(code)) {
                // 会籍
                cacl('会籍', newSeries, oldData);
            } else if (['1302', '1306', '1307', '1310'].includes(code)) {
                // 商务
                cacl('商务', newSeries, oldData);
            } else if (['1312'].includes(code)) {
                // 云服务
                cacl('云服务', newSeries, oldData);
            } else if (['1301', '1303', '1305', '1313'].includes(code)) {
                // 线上互动
                cacl('线上互动', newSeries, oldData);
            } else if (['1314'].includes(code)) {
                // 后台录入
                cacl('后台录入', newSeries, oldData);
            } else if (['0'].includes(code)) {
                // 兑换
                cacl('兑换', newSeries, oldData);
            }
        }
        option.series = newSeries;
        option.legend.data = nameType;
        /********************************************************************/
        this.setState({ option, totalScore }, () => this.setOption());
        this.initLineData();

        function cacl(targetName, newSeries, oldData) {
            for (let j = 0; j < newSeries.length; j++) {
                const { name, data } = newSeries[j];
                if (name === targetName) {
                    for (let k = 0; k < existLen; k++) {
                        data[k] += Number(oldData[k]);
                    }
                }
            }
        }
    }

    // 图表2
    initLineData = () => {
        const { xUnit } = this;
        const xUnitFormat = this._getXUnitFormat(xUnit);
        const filterData = this.filterData;
        if (filterData.length === 0) {
            return;
        }
        const minDate = moment(filterData[0].create_time).format(xUnitFormat);
        const nowDate = moment().format(xUnitFormat);
        const xAxisData = [minDate];
        let presentDate = minDate;
        while (presentDate !== nowDate) {
            presentDate = moment(presentDate).subtract(-1, xUnit).format(xUnitFormat);
            xAxisData.push(presentDate);
        }

        const dateMapper = {};
        const seriesData = [];
        xAxisData.forEach((date, index) => {
            dateMapper[date] = index;
            seriesData[index] = 0;
        });
        for (let i = 0; i < filterData.length; i++) {
            let { score, create_time } = filterData[i];
            create_time = moment(create_time).format(xUnitFormat);
            if (dateMapper.hasOwnProperty(create_time)) {
                const index = dateMapper[create_time];
                seriesData[index] += Number(score);
            }
        }
        for (let i = 0; i < seriesData.length; i++) {
            if (i !== 0) {
                seriesData[i] += seriesData[i-1];
            }
        }
        this.chartLine.setOption({
            tooltip: {
                trigger: 'axis',
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
            },
            yAxis: {
                scale: true,
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                }
            ],
            series: [{
                name: '累计元宝分',
                type: 'line',
                data: seriesData,
            }],
        });
    }

    setOption = () => {
        const { option } = this.state;
        this.chart.setOption(option);
    }

    xUnitChange = v => {
        this.xUnit = v;
        this.initData();
    }

    selectXUnit = v => {
        if (v === this.prevUnit) {
            return;
        }
        this.prevUnit = v;
    }

    tableRenderHandle = v => {
        const { xUnit, filterData } = this;
        const xUnitFormat = this._getXUnitFormat(xUnit);
        const selectList = [];
        filterData.map(items => {
            if (moment(items.create_time).format(xUnitFormat) === v) {
                selectList.push(items);
            }
        });
        this.setState({
            selectList,
        });
    }

    nameClick = text => {
        this.filterName = text;
        this.initData();
    }

    render() {
        const { selectList, totalScore } = this.state;
        const { filterName } = this;
        const self = this;
        let total = 0;
        selectList.forEach(items => total += Number(items.score));
        const columns = [
            {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
                render(text, record, index) {
                    return <span style={{cursor: 'pointer'}} onClick={() => self.nameClick(text)} title={record.company}>{text}</span>;
                }
            },
            {
                title: '分值',
                dataIndex: 'score',
                key: 'score',
            },
            {
                title: '渠道',
                dataIndex: 'rem',
                key: 'rem',
            },
        ];
        const t_h = window.innerHeight - 300;
        let line_h = window.innerHeight - 500 - 150;
        line_h = line_h < 300 ? 300 : line_h;
        return (
            <div style={{display: 'flex'}}>
                <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div>
                            <Select defaultValue={this.xUnit} style={{ width: 120, marginLeft: 24, marginTop: 6 }} onChange={this.xUnitChange}>
                                <Option value="days">日</Option>
                                <Option value="month">月</Option>
                                <Option value="year">年</Option>
                            </Select>
                            { filterName && <Button style={{marginLeft: 12}} onClick={() => this.nameClick('')}>重置</Button> }
                        </div>
                        <span style={{marginRight: 24, marginTop: 10, fontWeight: 'bold'}}>总计：{totalScore}</span>
                    </div>
                    <div onMouseEnter={() => this.canvasChartActive = true} onMouseLeave={() => this.canvasChartActive = false} id="main" style={{ width: '100%', height: 500 }}></div>
                    <div id="main_line" style={{ width: '100%', height: line_h }}></div>
                </div>
                <div style={{width: 400, height: t_h + 210, borderLeft: '1px solid #eee'}}>
                    <Divider>{this.prevUnit}元宝分明细</Divider>
                    <Table
                        footer={() => '总计：' + total}
                        dataSource={selectList}
                        scroll={{y: t_h}}
                        pagination={{pageSize: 30, size: 'small'}}
                        columns={columns} />
                </div>
            </div>
        );
    }
}

export default YBScoreChart;