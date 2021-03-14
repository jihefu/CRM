import React, { Component } from "react";
import { Cascader, Button, Input, Message } from 'antd';
import common from '../../public/js/common.js';
import request from 'superagent';
import Base from '../../public/js/base.js';

class SimuCtrlAdd extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        data: [],
        solutionModel: [],
    };

    componentDidMount() {
        this.fetch();
    }

    fetch = async () => {
        const solutionList = await fetchSolution();
        const data = [];
        solutionList.forEach(items => {
            data.push({
                label: items,
                value: items,
                children: [],
            });
        });
        const _p = [];
        solutionList.forEach((items, index) => {
            _p[index] = new Promise(async resolve => {
                const solution = items;
                let machineModelList = await fetchMachineModel(solution);
                machineModelList = machineModelList.map(items => {
                    return { label: items, value: items };
                });
                data.forEach(items => {
                    if (items.value === solution) {
                        items.children = machineModelList;
                    }
                });
                resolve();
            });
        });
        await Promise.all(_p);
        this.setState({
            data,
        });

        async function fetchSolution() {
            return await new Promise(resolve => {
                const token = sessionStorage.getItem('token');
                request.get(common.baseUrl('/simuCtrl/getSolutionList'))
                    .set("token",token)
                    .end((err,res) => {
                        resolve(res.body.data);
                    })
            });
        }

        async function fetchMachineModel(solution) {
            return await new Promise(resolve => {
                const token = sessionStorage.getItem('token');
                request.get(common.baseUrl('/simuCtrl/getModelListBySolution'))
                    .set("token",token)
                    .query({ solution })
                    .end((err,res) => {
                        resolve(res.body.data);
                    })
            });
        }
    }

    onChange = v => {
        this.setState({
            solutionModel: v,
        });
    }

    sub = async () => {
        const { solutionModel } = this.state;
        const serialNo = this.refs.serialNo.state.value;
        const versionRem = this.refs.versionRem.state.value;
        if (!serialNo) {
            Message.error('序列号不能为空');
            return;
        }
        if (/\D/ig.test(serialNo)) {
            Message.error('序列号为纯数字');
            return;
        }
        if (solutionModel.length !== 2) {
            Message.error('请选择解决方案和机型');
            return;
        }
        const result = await new Promise(resolve => {
            const token = sessionStorage.getItem('token');
            request.post(common.baseUrl('/simuCtrl/createSimuInstance'))
                .set("token",token)
                .send({
                    serialNo,
                    solution: solutionModel[0],
                    machineModel: solutionModel[1],
                    versionRem,
                })
                .end((err,res) => {
                    resolve(res.body);
                })
        });
        if (result.code === 200) {
            Message.success(result.msg);
            Base.RemoveStateSession();
            this.props.history.goBack();
        } else {
            Message.error(result.msg);
        }
    }

    render() {
        const { data } = this.state;
        return (
            <div>
                <div style={{textAlign: 'center', marginTop: 40}}>
                    <div>
                        <span>序列号：</span>
                        <Input ref={'serialNo'} style={{width: 200, display: 'inline-block'}} />
                    </div>
                    <div style={{marginTop: 20, position: 'relative', left: -31}}>
                        <span>解决方案和机型：</span>
                        <Cascader style={{textAlign: 'left'}} options={data} onChange={this.onChange} changeOnSelect />
                    </div>
                    <div style={{marginTop: 20, position: 'relative', left: 5}}>
                        <span>备注：</span>
                        <Input ref={'versionRem'} style={{width: 200, display: 'inline-block'}} />
                    </div>
                    <Button type={'primary'} style={{marginTop: 20}} onClick={this.sub}>提交</Button>
                </div>
            </div>
        )
    }
}

export default SimuCtrlAdd;