import React, { Component } from 'react';
import { Form,Upload, Input, Tooltip, Icon, message, Select, Row, Col, Checkbox, Button, AutoComplete,DatePicker,Message, InputNumber } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import RemoteSelectRandom from '../common/RemoteSelectRandom.jsx';
import RemoteSelect from '../common/RemoteSelect.jsx';
import RemoteSearchInput from '../common/RemoteSearchInput.jsx';
const FormItem = Form.Item;
moment.locale('zh-cn');
const Option = Select.Option;
const OptGroup = Select.OptGroup;
const  { TextArea } = Input;

class AffairsAddTemp extends Component {
	constructor(props) {
        super(props);
        this.changeAffairType = this.changeAffairType.bind(this);
        this.teamChange = this.teamChange.bind(this);
        this.fetchAffair = this.fetchAffair.bind(this);
        this.searchInputselected = this.searchInputselected.bind(this);
        this.cbData = this.cbData.bind(this);
        this.staffData;
        this.affairData = [[], [], []];
        this.company = '';
        this.customerId = null;
        this.staffArr = [
            [],     //研发部
            [],     //客户关系部
            [],     //生产部
            []      //管理部
        ];
	};
	state = {
        data: [],
        affairType: '例行事务'
    };
    fetch(cb){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/staff/all'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.staffData = res.body.data;
                res.body.data.forEach((items) => {
                    const { branch,user_id,user_name } = items;
                    const info = {
                        user_id: user_id,
                        user_name: user_name
                    };
                    if(branch=='研发部'){
                        this.staffArr[0].push(info);
                    }else if(branch=='客户关系部'){
                        this.staffArr[1].push(info);
                    }else if(branch=='生产部'){
                        this.staffArr[2].push(info);
                    }else{
                        this.staffArr[3].push(info);
                    }
                });
                cb();
            });
    }
    fetchAffair(cb){
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/affair/listForSelect'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                res.body.data.forEach((items, index) => {
                    this.affairData[items.type].push(items);
                });
                // this.affairData = res.body.data;
                cb();
            });
    }
	handleSubmit = (e) => {
        e.preventDefault();
        const { affairType } = this.state;
        let postUrl;
        if(affairType=='例行事务'||affairType=='客服专线'){
            postUrl = '/respoAffair/add';
        }else if(affairType=='立项事务'){
            postUrl = '/projectAffair/add';
        }else if(affairType=='临时小事务'){
            postUrl = '/smallAffair/add';
        }
	    this.props.form.validateFieldsAndScroll((err, values) => {
            if(!err){
                delete values['affairType'];
                if(values['team'].length<1){
                    message.warn('工作团队至少为一人');
                    return;
                }
                values['team'] = values['team'].join();
                values['readAuth'] = 1;
                values['priority'] = '普通';
                values['state'] = values['state'] ? values['state'] : '进行中';
                if(values.smallDeadline){
                    values['deadline'] = values.smallDeadline;
                    delete values.smallDeadline;
                }
                if(values.smallRelatedAffairs){
                    values['relatedAffairs'] = values.smallRelatedAffairs;
                    delete values.smallRelatedAffairs;
                }
                if(affairType=='立项事务'){
                    let progress = [];
                    for(let key in values){
                        if(key.indexOf('member_')!=-1){
                            progress.push({
                                member: key.split('member_')[1],
                                division: values[key]
                            });
                        }
                    }
                    values.progress = progress;
                }
                if(values.deadline&&moment(values.deadline)<moment()){
                    if(moment(values.deadline).format('YYYY-MM-DD')!=moment().format('YYYY-MM-DD')){
                        message.warn('最后期限不能小于今天');
                        return;
                    }
                }
                if(values.relatedAffairs) values.relatedAffairs = values.relatedAffairs.join();

                if(affairType=='客服专线'){
                    delete values.company;
                    values.outerContact = values.outerContact.join();
                    values.customerId = this.customerId;
                    values.department = '客户关系部';
                    values.name = this.affairName;
                }
                let token = sessionStorage.getItem('token');
                request.post(common.baseUrl(postUrl))
                    .set("token", token)
                    .send(values)
                    .end((err, res) => {
                        if (err) return;
                        if(res.body.code==-1){
                            message.error(res.body.msg);
                            return;
                        }
                        message.success(res.body.msg);
                        this.props.form.resetFields();
                        this.fetchAffair(() => {
                            this.initData();
                        });
                    });
	        }
	    });
    }

    //改变事务类型
    changeAffairType(v){
        this.setState({
            affairType: v 
        },() => {
            this.initData();
        });
        this.props.form.resetFields();
    }

    cbData(v){
        this.customerId = v.user_id;
    }

    //团队成员变化
    teamChange(v){
        const { affairType,data } = this.state;
        if (v.length === 0) {
            return;
        }
        const firstUserId = v[0];
        let department = '会员';
        this.staffData.forEach(items => {
            if (items.user_id == firstUserId) {
                department = items.branch;
            }
        });
        if (department === '客户关系部') {
            department = '客户关系部';
        } else if (department === '生产部') {
            department = '生产部';
        } else if (department === '研发部') {
            department = '研发部';
        } else if (department === '管理部') {
            department = '管理部';
        }
        this.props.form.setFieldsValue({
            department,
        });
        if(affairType!='立项事务') return;
        for(let key in data){
            if(key.indexOf('member_')!=-1){
                delete data[key];
            }
        }
        v.forEach((items,index) => {
            let key = 'member_'+items;
            let obj = {};
            let labelName;
            this.staffData.forEach((it,ind) => {
                if(it.user_id==items) labelName = it.user_name+'分工';
            });
            data[key] = {
                label: labelName,
                rules: [{
                    required: true, message: '不能为空',
                }]
            };
        });
        this.setState({
            data
        });
    }

    //用于客服专线
    searchInputselected(value){
        this.props.form.setFieldsValue({
            outerContact: [],
            company: value
        });
        this.company = value;
        const { data } = this.state;
        delete data.outerContact;
        let token = sessionStorage.getItem('token');
        const _p = [];
        _p[0] = new Promise((resolve,reject) => {
            request.get(common.baseUrl('/member/getRegMemberByCompany'))
                .set("token", token)
                .query({
                    company: this.company
                })
                .end((err, res) => {
                    if (err) return;
                    resolve(res.body.data);
                });
        });
        _p[1] = new Promise((resolve,reject) => {
            request.get(common.baseUrl('/customer/'+this.company))
                .set("token", token)
                .end((err, res) => {
                    if (err) return;
                    this.affairName = res.body.data.cn_abb+'专线';
                    resolve(res.body.data);
                });
        });
        Promise.all(_p).then(result => {
            const children = result[0].map(items => 
                <Option key={items.value} value={items.value}>{items.text}</Option>
            );
            data.outerContact = {
                label: '外部联系人',
                rules: [{
                    required: true, message: '不能为空',
                }],
                temp: <Select
                        mode="multiple"
                        placeholder="至少选择一名外部联系人"
                        onChange={(v) => {
                            this.props.form.setFieldsValue({
                                outerContact: v
                            });
                        }}
                    >
                        {children}
                    </Select>,
                propType: '客服专线'
            };
            this.setState({
                data
            });
        });
    }

    initData = () => {
        const { affairType } = this.state;
        let data = {
            affairType: {
                label: '事务类型',
                temp: <Select onChange={this.changeAffairType}>
                        <Select.Option key={"例行事务"} value={'例行事务'}>{"例行事务"}</Select.Option>
                        <Select.Option key={"立项事务"} value={"立项事务"}>{"立项事务"}</Select.Option>
                        <Select.Option key={"客服专线"} value={"客服专线"}>{"客服专线"}</Select.Option>
                        {/* <Select.Option key={"临时小事务"} value={"临时小事务"}>{"临时小事务"}</Select.Option> */}
                      </Select>,
                initialValue: this.state.affairType
            },
            name: {
                label: '标题',
                rules: [{
                    required: true, message: '不能为空',
                }]
            },
            team: {
                label: '工作团队',
                temp: <Select
                            mode="multiple"
                            placeholder="请至少选择一人"
                            defaultValue={['1']}
                            onChange={this.teamChange}
                            style={{ width: '100%' }}
                        >
                            <Select.OptGroup label="研发部">
                                {
                                    this.staffArr[0].map(items => 
                                        <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                    )
                                }
                            </Select.OptGroup>
                            <Select.OptGroup label="客户关系部">
                                {
                                    this.staffArr[1].map(items => 
                                        <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                    )
                                }
                            </Select.OptGroup>
                            <Select.OptGroup label="生产部">
                                {
                                    this.staffArr[2].map(items => 
                                        <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                    )
                                }
                            </Select.OptGroup>
                            <Select.OptGroup label="管理部">
                                {
                                    this.staffArr[3].map(items => 
                                        <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                                    )
                                }
                            </Select.OptGroup>
                        </Select>,
                rules: [{
                    required: true, message: '不能为空',
                }]
            },
            department: {
                label: '一级菜单',
                rules: [{
                    required: true, message: '不能为空',
                }],
                temp: <Select>
                        <Select.Option key={"客户关系部"} value={'客户关系部'}>{"客户关系"}</Select.Option>
                        <Select.Option key={"会员"} value={"会员"}>{"会员"}</Select.Option>
                        <Select.Option key={"生产部"} value={"生产部"}>{"生产"}</Select.Option>
                        <Select.Option key={"研发部"} value={"研发部"}>{"研发"}</Select.Option>
                        <Select.Option key={"管理部"} value={"管理部"}>{"管理"}</Select.Option>
                      </Select>,
                initialValue: '会员',
                propType: '例行事务',
            },
            //客服专线
            company: {
                label: '公司',
                rules: [{
                    required: true, message: '不能为空',
                }],
                temp: <RemoteSearchInput style={{width: '100%'}} searchInputselected={this.searchInputselected} cbData={this.cbData} remoteUrl={common.baseUrl('/customers/remoteSearchCustomers?keywords='+this.company)} />,
                propType: '客服专线'
            },
            //立项事务
            state: {
                label: '状态',
                temp: <Select>
                        <Select.Option key={"草拟"} value={'草拟'}>{"草拟"}</Select.Option>
                        <Select.Option key={"进行中"} value={"进行中"}>{"进行中"}</Select.Option>
                      </Select>,
                initialValue: "进行中",
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '立项事务'
            },
            background: {
                label: '项目背景',
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '立项事务'
            },
            target: {
                label: '总体目标描述',
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '立项事务'
            },
            deadline: {
                label: '最后期限',
                temp: <DatePicker />,
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '立项事务'
            },
            reward: {
                label: '赏金',
                temp: <InputNumber min={0} max={1000000} step={100} defaultValue={0} />,
                initialValue: 100,
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '立项事务'
            },
            relatedAffairs: {
                label: '被关联事务',
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '立项事务',
                temp: <Select
                        showSearch
                        mode="multiple"
                        placeholder="至少选择一个事务"
                        >
                            {
                                this.affairData.map((items,index) => 
                                    index===0&&<OptGroup key={index} label="例行事务">
                                        { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                                    </OptGroup>||
                                    index===1&&<OptGroup key={index} label="立项事务">
                                        { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                                    </OptGroup>||
                                    index===2&&<OptGroup key={index} label="小事务">
                                        { items.map(it => <Select.Option key={it.uuid} value={it.uuid}>{it.name}</Select.Option> )}
                                    </OptGroup>
                                )
                            }
                        </Select>,
                // temp: <Select
                //         showSearch
                //         mode="multiple"
                //         placeholder="至少选择一个事务"
                //       >
                //         {
                //             this.affairData.map(items => 
                //                 <Option key={items.uuid} value={items.uuid}>{items.name}</Option>
                //             )
                //         }
                //     </Select>,
            },
            //临时小事务
            cause: {
                label: '事由',
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '临时小事务'
            },
            smallDeadline: {
                label: '最后期限',
                temp: <DatePicker />,
                rules: [{
                    required: true, message: '不能为空',
                }],
                propType: '临时小事务'
            },
            smallRelatedAffairs: {
                label: '被关联事务',
                rules: [{
                    required: true, message: '不能为空',
                }],
                temp: <Select
                        showSearch
                        mode="multiple"
                        placeholder="至少选择一个事务"
                      >
                        {
                            this.affairData.map(items => 
                                <Option key={items.uuid} value={items.uuid}>{items.name}</Option>
                            )
                        }
                    </Select>,
                propType: '临时小事务'
            }
        };
        for(let key in data){
            if(data[key]['propType']&&data[key]['propType']!=affairType){
                delete data[key];
            }
        }
        if(affairType=='客服专线') delete data['name'];
        this.setState({
            data: data
        });
    }

	componentDidMount(){
        this.fetch(() => {
            this.fetchAffair(() => {
                this.initData();
            });
        });
    }
	render() {
		let record = this.state.data;
		const { getFieldDecorator } = this.props.form;
		const formItemLayout = {
			labelCol: {
				xs: { span: 6 },
			},
			wrapperCol: {
				xs: { span: 12 },
			},
	    };
	    const formBtnLayout = {
			wrapperCol: {
		        xs: {
		            span: 24,
		            offset: 0,
		        },
		        sm: {
		            span: 16,
		            offset: 8,
		        },
		    },
	    };
	    const formItem = [];
		const default_rules = [];
	    for(let i in record){
	    	let default_temp;
	    	try{
	    		if(record[i].input_attr['disabled']=='disabled'){
		    		default_temp = <Input disabled={true} />;
		    	}else{
		    		default_temp = <Input />;
		    	}
	    	}catch(e){
	    		default_temp = <Input />;
	    	}
	    	let rules = record[i].rules?record[i].rules:default_rules;
            let temp = record[i].temp?record[i].temp:default_temp;
            formItem.push(<FormItem
                key={i}
                {...formItemLayout}
                label={record[i].label}
            >
                {getFieldDecorator(i, {
                    initialValue: record[i].initialValue,
                    rules
                })(
                    temp
                )}
            </FormItem>);
	    }
		return (
			<Form onSubmit={this.handleSubmit} style={{padding: 24}}>
				{formItem}
		        <FormItem style={{textAlign: 'center'}}>
		            <Button type="primary" htmlType="submit">提交</Button>
		        </FormItem>
		    </Form>
		)
	}
}

const AffairsAdd = Form.create()(AffairsAddTemp);

export default AffairsAdd;