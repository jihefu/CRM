import React from 'react';
import BaseTableList from './common/BaseTableList.jsx';
import common from '../public/js/common.js';
import { Form, Popover, Button, Input, Select, Tooltip, Checkbox, DatePicker } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';

moment.locale('zh-cn');
const { Option } = Select;
const CheckboxGroup = Checkbox.Group;
const { RangePicker } = DatePicker;

class VehicleRegist extends BaseTableList {
    constructor(props) {
        super(props);
        const dateFormat = 'YYYY-MM-DD';
        this.fetchUrl = '/vehicleRegist/getList';
        this.actioncolumns = false;
        this.options = [
            {
                text: '默认排序',
                value: 'id',
            },
        ];
        this.res_data = {
            car_no: {
                label: '车牌号',
                width: 100
            },
            user_name: {
                label: '使用人',
                width: 100
            },
            use_mile: {
                label: '本次行程',
                width: 100
            },
            take_time: {
                label: '拿车时间',
                width: 150
            },
            take_mile: {
                label: '拿车行程',
                width: 100
            },
            back_time: {
                label: '还车时间',
                width: 150
            },
            back_mile: {
                label: '还车行程',
                width: 100
            },
            reason: {
                label: '事因',
                width: 200
            },
            album: {
                label: '照片',
                width: 200
            },
        };
        this.state.pagination.filter = {
            carNo: '',
            take_time: [moment(moment().subtract(1, 'year'), dateFormat), moment(moment(), dateFormat)],
        }
        this.filter = ['carNo', 'take_time'];
        this.state.carNoArr = [];
        this.state.totalMile = 0;
        this.canRowSelection = true;
    }

    componentDidMount(){
        this.fetchCarNo();
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
                    markLen,
                    totalMile: res.body.data.totalMile,
                });
            });
    }

    fetchCarNo = () => {
        const token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/goods/list'))
            .set("token",token)
            .query({
                page: 1,
                num: 30,
                keywords: '',
                order: 'albumUpdateTime',
                filter: JSON.stringify({
                    "myGoods": "所有物品",
                    "goodsType": "车辆",
                    "location":"",
                    "management":"",
                    "isBorrow":"",
                    "borrowStatus":"",
                    "isdel":"在库",
                    "events":"借用"
                })
            })
            .end((err,res) => {
                if (err) return;
                const carNoArr = res.body.data.data.map(items => items.serialNo);
                this.setState({ carNoArr });
            });
    }

    //@override
    viewRender(key,res_data,text, row, index) {
        let title, content;
        let textAlign = 'left';
        if (key == 'take_time' || key == 'back_time') {
            if (row[key]) {
                title = moment(row[key]).format('YYYY-MM-DD HH:mm');
            } else {
                title = '';
            }
            content = title;
        } else if (key=='album') {
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
                                        let small_src = '/img/gallery/list_'+items;
                                        let normal_src = '/img/gallery/'+items;
                                        return(
                                            <a key={index} target={'_blank'} href={common.staticBaseUrl(normal_src)}>
                                                <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(small_src)} />
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
            </Form>
            <div style={{ position: 'relative', top: -15, left: 25 }}>
                {
                    this.tagsRender()
                }
            </div>
        </div>
    }

    rangePickerChange = v => {
        const { pagination } = this.state;
        pagination.filter.take_time = v;
        this.setState({
            pagination,
        }, this.fetch);
    }

    filterContent() {
        const { carNoArr, pagination } = this.state;
        const dateFormat = 'YYYY-MM-DD';
        return <div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"车牌号："}</span>
                        <CheckboxGroup options={carNoArr} value={pagination.filter.carNo.split(',')} onChange={(v) => this.filterType('carNo',v)} />
                    </div>
                    <div style={{padding: '5px 0px 5px 0px'}}>
                        <span style={{fontWeight: 'bolder'}}>{"时间："}</span>
                        <RangePicker
                            allowClear={false}
                            defaultValue={pagination.filter.take_time}
                            format={dateFormat}
                            onChange={this.rangePickerChange}
                            style={{width: 250}}
                        />
                    </div>
                </div>
    }

    componentDidUpdate(){
        const { totalMile, selectedRowKeys, selectedRows, pagination } = this.state;
        const { total } = pagination;
        let showSelected = 'block', showNum = 'none', totalNum = 0;
        if (!this.canRowSelection || selectedRowKeys.length === 0) {
            showSelected = 'none';
            showNum = 'block';
            totalNum = totalMile;
        } else {
            selectedRows.forEach(row => {
                totalNum += Number(row.use_mile);
            });
        }
        totalNum = parseFloat(totalNum).toFixed(2);
        let containerWidth = $('.ant-spin-container').width();
        let w = containerWidth - 500;
        let footTemp = '<div class="_foot" style="display: flex;text-align: center;width: '+w+'px;float: left;margin-top: 20px;">'+
                            '<div style="margin-left: 12px;display: '+showSelected+'">'+
                                '<span style="font-weight: bolder">已选：</span>'+
                                '<span>'+selectedRowKeys.length+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 12px;display: '+showNum+'">'+
                                '<span style="font-weight: bolder">总数量：</span>'+
                                '<span>'+total+'</span>'+
                            '</div>'+
                            '<div style="margin-left: 48px;">'+
                                '<span style="font-weight: bolder">总行程：</span>'+
                                '<span>'+totalNum+'</span>'+
                            '</div>'+
                        '</div>';
        setTimeout(() => {
            $('._foot,.ant-table-footer').remove();
            $('.ant-table-pagination').before(footTemp);
        },0);
    }
}

export default VehicleRegist;