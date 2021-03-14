import React, { Component } from 'react';
import { message, Rate, Button, Popconfirm, InputNumber, Input, Radio } from 'antd';
import request from 'superagent';
import common from '../../public/js/common.js';
import moment from 'moment';
import 'moment/locale/zh-cn';
import PhotoLooker from '../common/PhotoLooker.jsx';
moment.locale('zh-cn');
const { TextArea } = Input;

class MeetOrdersManageEdit extends Component {
    constructor(props) {
        super(props);
        this.renderInfo = this.renderInfo.bind(this);
        this.cancelPhotoLooker = this.cancelPhotoLooker.bind(this);
        this.infoArr = [
            {
                label: '销售类型',
                value: 'sale_tag',
            },
            {
                label: '解决方案',
                value: 'solution_tag',
            },
            {
                label: '现场开始时间',
                value: 'start_time',
            },
            {
                label: '现场结束时间',
                value: 'end_time',
            },
            {
                label: '序列号',
                value: 'sn',
            },
            {
                label: '合同号或物品号',
                value: 'contract_no',
            },
            {
                label: '是否合同劳务',
                value: 'is_contract_server',
            },
            {
                label: 'foo',
                value: 'foo',
            },
            {
                label: '现场工时',
                value: 'original_work_time',
            },
            {
                label: '指派人认定工时',
                value: 'director_work_time',
            },
            {
                label: '照片',
                value: 'album',
            },
            {
                label: 'foo',
                value: 'foo1',
            },
            {
                label: '客户需求',
                value: 'demand',
            },
            {
                label: '服务内容及成果',
                value: 'content',
            },
            {
                label: '财务认定工时',
                value: 'check_work_time',
            },
            {
                label: '财务审核备注',
                value: 'check_rem',
            },
            {
                label: '审核人',
                value: 'check_person_name',
            },
            {
                label: '审核时间',
                value: 'check_time',
            },
            {
                label: '服务质量',
                value: 'service_quality',
            },
            {
                label: '服务态度',
                value: 'service_attitude',
            },
            {
                label: '客户意见',
                value: 'service_opinion',
            },
        ];
    }

    state = {
        machineTypeMapper: {},
        score: 0,
        endScore: 0,
        check_rem: '',
        is_contract_server: 0,
        albumBorwerArr: [],
        imgSrc: '',
        canRenderPhoto: false,
    };

    componentWillMount() {
        // 获取解决方案列表
        request.get(common.apiAddr + '/vtc/cfgTemp/machineType')
            .end((err, res) => {
                if (err) return;
                const solutionTypeArr = res.body.data.flat(3);
                const machineTypeMapper = {};
                solutionTypeArr.map(items => machineTypeMapper[items.id] = items.name);
                this.setState({
                    machineTypeMapper,
                });
            });

        const { original_work_time, check_work_time, check_rem, is_contract_server } = this.props.data;
        this.setState({
            score: original_work_time,
            endScore: check_work_time,
            check_rem,
            is_contract_server,
        });
    }

    componentWillReceiveProps(props) {
        const { original_work_time, check_work_time, check_rem, is_contract_server } = this.props.data;
        this.setState({
            score: original_work_time,
            endScore: check_work_time,
            check_rem,
            is_contract_server,
        });
    }

    renderInfo() {
        const { infoArr } = this;
        const that = this;
        const { machineTypeMapper } = this.state;
        const data = this.props.data;
        return infoArr.map(items => {
            return <div key={items.value} style={{
                    display: 'flex',
                    width: '50%',
                    color: 'rgba(0,0,0,0.85)',
                    fontWeight: 'normal',
                    fontSize: 16,
                    lineHeight: 1.5,
                    whiteSpace: 'nowrap',
                    padding: 12,
                    visibility: items.label === 'foo' ? 'hidden' : 'visible',
            }}>
                <span>{items.label}：</span>
                <span style={{whiteSpace: 'pre-wrap'}}>{vFun(items)}</span>
            </div>
        });

        function vFun(items) {
            if (items.value == 'solution_tag') {
                return machineTypeMapper[data[items.value]];
            } else if (items.value == 'is_contract_server') {
                return data[items.value] == 1 ? '是' : '否';
            } else if (items.value == 'service_quality' || items.value == 'service_attitude') {
                return <Rate style={{marginTop: -5}} disabled value={data[items.value]} />
            } else if (items.value === 'album') {
                let albumArr;
                try{
                    albumArr = data[items.value].split(',').filter(items => items);
                }catch(e){  
                    albumArr = [];
                }
                return <div>
                            {
                                albumArr.map((items,index) => {
                                    if(items){
                                        let src = '/img/gallery/'+items;
                                        let small_src = '/img/gallery/list_'+items;
                                        return(
                                            <img onClick={() => {
                                                that.setState({
                                                    imgSrc: common.staticBaseUrl(src),
                                                    canRenderPhoto: true,
                                                    albumBorwerArr: albumArr,
                                                });
                                            }} key={index} style={{width: 35,height: 35,marginRight: 10, cursor: 'pointer'}} src={common.staticBaseUrl(small_src)} />
                                            // <a key={index} target={'_blank'} href={common.staticBaseUrl(src)}>
                                            //     <img style={{width: 35,height: 35,marginRight: 10}} src={common.staticBaseUrl(small_src)} />
                                            // </a>
                                        )
                                    }
                                })
                            }
                        </div>
            } else if (items.value === 'check_time') {
                if (!data[items.value]) {
                    return '';
                }
                return moment(data[items.value]).format('YYYY-MM-DD HH:mm:ss');
            }
            return data[items.value];
        }
        
    }

    checkActionPower() {
        let { score, endScore, check_rem, is_contract_server } = this.state;
        const data = this.props.data;
        let hasCheckPower = false;
        let isDirector = false;
        const state = data.state;
        const user_id = sessionStorage.getItem('user_id');
        if (user_id == data.director) isDirector = true;
        if (common.powerCheckMeetOrder.indexOf(user_id) !== -1) hasCheckPower = true;
        if (state == 6 && isDirector) {
            return <div>
                <Popconfirm placement="bottom" title={<div>
                    <span>审核人认定工时：</span>
                    <InputNumber min={0} max={24} onChange={v => this.setState({ score: v})} value={score} />
                </div>} onConfirm={() => this.agree()} okText="Yes" cancelText="No">
                    <Button>通过</Button>
                </Popconfirm>
                <Button style={{marginLeft: 16}} onClick={() => this.disAgree()}>退回</Button>
            </div>
        } else if (state == 12 && hasCheckPower) {
            return <Popconfirm placement="top" title={<div>
                <div>
                    <span>是否合同劳务：</span>
                    <Radio.Group value={is_contract_server} onChange={e => this.changeIsContractService(e.target.value)}>
                        <Radio value={0}>否</Radio>
                        <Radio value={1}>是</Radio>
                    </Radio.Group>
                </div>
                <div style={{display: 'flex', marginTop: 12}}>
                    <span>财务认定工时：</span>
                    <InputNumber min={0} max={24} onChange={v => this.setState({ endScore: v})} value={endScore} />
                </div>
                <div style={{display: 'flex', marginTop: 12}}>
                    <span>财务审核备注：</span>
                    <Input style={{flex: 1}} onChange={e => this.setState({ check_rem: e.target.value})} value={check_rem} />
                </div>
            </div>} onConfirm={() => this.changeWorkTime()} okText="Yes" cancelText="No">
                <Button>修改工时</Button>
            </Popconfirm>
        }
    }

    agree() {
        const { id } = this.props.data;
        const token = sessionStorage.getItem('token');
        const { score } = this.state;
        request.put(common.baseUrl('/businessTrip/meetOrder/agree/' + id))
            .set("token", token)
            .send({
                director_work_time: score,
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                this.props.refresh();
            });
    }

    disAgree() {
        const r = window.confirm('确定退回？');
        if (!r) return;
        const { id } = this.props.data;
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/businessTrip/meetOrder/disAgree/' + id))
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                this.props.refresh();
            });
    }

    changeIsContractService(isContractService) {
        const { director_work_time } = this.props.data;
        let check_work_time = director_work_time;
        if (isContractService) check_work_time  = (Number(check_work_time) * 2).toFixed(2);
        this.setState({
            is_contract_server: isContractService,
            endScore: check_work_time,
        });

    }

    changeWorkTime() {
        const { id } = this.props.data;
        const token = sessionStorage.getItem('token');
        const { endScore, check_rem, is_contract_server } = this.state;
        request.put(common.baseUrl('/businessTrip/meetOrder/changeWorkTime/' + id))
            .set("token", token)
            .send({
                check_work_time: endScore,
                check_rem,
                is_contract_server,
            })
            .end((err, res) => {
                if (err) return;
                message.success(res.body.msg);
                this.props.refresh();
            }); 
    }

    cancelPhotoLooker() {
        this.setState({
            canRenderPhoto: false,
        });
    }

    render() {
        const { contentHeight } = this.props;
        const { albumBorwerArr, imgSrc, canRenderPhoto } = this.state;
        return (
            <div style={{height: contentHeight, overflow: 'auto'}}>
                <div style={{display: 'flex'}}>
                    <div style={{flex: 1}}></div>
                    <div style={{display: 'flex', flexWrap: 'wrap', flex: 6}}>
                        { this.renderInfo() }
                        <div style={{marginTop: 20, width: '100%', textAlign: 'center'}}>
                            { this.checkActionPower() }
                        </div>
                    </div>
                    <div style={{flex: 1}}></div>
                </div>
                <PhotoLooker cancelPhotoLooker={this.cancelPhotoLooker} albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={canRenderPhoto}></PhotoLooker>
            </div>
        )
    }
}

export default MeetOrdersManageEdit;