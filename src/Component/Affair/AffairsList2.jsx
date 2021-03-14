import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { List, message, Spin,Input,Form,Button,Divider, Icon,Popover,Radio,Select,Popconfirm } from 'antd';
import request from 'superagent';
import moment from 'moment';
import 'moment/locale/zh-cn';
import $ from 'jquery';
import InfiniteScroll from 'react-infinite-scroller';
import ModalTemp from './Modal.jsx';
import TransBox from './TransBox.jsx';
import '../../public/css/affairs.css';
import common from '../../public/js/common.js';
import Linq from 'linq';
moment.locale('zh-cn');
const { TextArea } = Input;
const RadioGroup = Radio.Group;
const Option = Select.Option;

class AffairsList extends Component {
    constructor(props) {
        super(props);
        this.handleSearch = this.handleSearch.bind(this);
        this.changeView = this.changeView.bind(this);
        this.radioChange = this.radioChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDoInCenter = this.handleDoInCenter.bind(this);
        this.refresh = this.refresh.bind(this);
        this.sub = this.sub.bind(this);
        this.url = common.baseUrl('/affairs/list');
        this.closeId;
        this.type;
        this.id;
        this.selectedId;
    }

    state = {
        data: [],
        loading: false,
        hasMore: true,
        page: 1,
        windowContent: '',
        visible: false,
        doInCenter: 1,
        type: 0,
        options: [],
        atSomeone: []
    }

    //获取数据
    fetch(cb){
        let { page,data } = this.state;
        const keywords = $('input[name=keywords]').val();
        let token = sessionStorage.getItem('token');
        request.get(this.url)
            .set("token", token)
            .query({
                page: page,
                num: 30,
                keywords: keywords,
                type: this.type,
                id: this.id
            })
            .end((err, res) => {
                if (err) return;
                if(res.body.data[0]==null){
                    message.warning('没有更多了');
                    this.setState({
                        hasMore: false,
                        loading: false,
                    });
                }else{
                    data = [...data,...res.body.data];
                    this.setState({
                        data
                    },() => {
                        const targetArr = Linq.from(data).where((x) => {
                            return Linq.from(x.BaseRoutineAffairs).any((y) => {
                                return y.id == this.id;
                            });
                        }).toArray();
                        if(targetArr[0]==null){
                            $('.l_list').eq(0).trigger('click');
                        }else{
                            $('#_'+targetArr[0].id).trigger('click');
                            this.id = null;
                        }

                    });
                    if(cb) cb();
                }
            });
    }

    //搜索
    handleSearch(){
        this.setState({
            page: 1,
            data: [],
            loading: true
        },() => {
            this.fetch(() => {
                this.setState({
                    loading: false
                });
            });
        });
    }

    //刷新
    refresh(){
        let selectedId = this.selectedId;
        this.setState({
            page: 1,
            data: [],
            loading: true
        },() => {
            this.fetch(() => {
                this.setState({
                    loading: false
                },() => {
                    $('#_'+selectedId).trigger('click');
                });
            });
        });
    }

    //初始化
    componentWillReceiveProps(props){
        this.setState({
            data: []
        });
        this.type = props.type;
        this.id = props.id;
        this.fetch();
    }

    //滚动加载
    handleInfiniteOnLoad = () => {
        let { data,page } = this.state;
        page++;
        this.setState({
            loading: true,
            page
        });
        this.fetch(() => {
            this.setState({
                loading: false
            });
        });
    }

    //组的动作
    dealerActions = (item) => {
        //判断是否自己是群主
        const checkGroupOwner = (item) => {
            const user_id = sessionStorage.getItem('user_id');
            if(item.insert_person==user_id){
                return true;
            }else{
                return false;
            }
        }
        if(item.id==this.selectedId){
            if(checkGroupOwner(item)){
                sessionStorage.setItem('group_person',item.group_person);
                sessionStorage.setItem('insert_person',item.insert_person);
                let temp = <TransBox></TransBox>;
                return  [
                    <Popconfirm placement="right" title={temp} onConfirm={() => {
                        const targetKey = sessionStorage.getItem('targetKeys');
                        if(!targetKey){
                            message.warn('成员未发生改变');
                            return;
                        }
                        sessionStorage.removeItem('targetKeys');
                        const token = sessionStorage.getItem('token');
                        request.put(common.baseUrl('/affairs/changeGroupPerson'))
                            .set("token", token)
                            .send({
                                id: this.selectedId,
                                group_person: targetKey
                            })
                            .end((err, res) => {
                                if (err) return;
                                message.success(res.body.msg);
                                this.refresh();
                            });
                    }} okText="Yes" cancelText="No">
                        <Icon type={'user'} style={{ marginRight: 8 }} />
                        {'成员管理'}
                    </Popconfirm>,
                    <Popconfirm placement="bottomLeft" title={'确定删除该事务？'} onConfirm={() => {
                        const token = sessionStorage.getItem('token');
                        request.put(common.baseUrl('/affairs/updateAffairs'))
                            .set("token", token)
                            .send({
                                id: item.id,
                                isdel: 1
                            })
                            .end((err, res) => {
                                if (err) return;
                                this.handleSearch();
                            });
                    }} okText="是" cancelText="否">
                        <Icon type={'delete'} style={{ marginRight: 8 }} />
                        {'删除'}
                    </Popconfirm>
                ];
            }
        }
    }

    //发布动态
    add = () => {
        let pathname;
        if(this.type=='custRelations'){
            pathname = '/custRelationsAffairsAdd';
        }else if(this.type=='products'){
            pathname = '/productsAffairsAdd';
        }else if(this.type=='research'){
            pathname = '/researchAffairsAdd';
        }else{
            pathname = '/manageAffairsAdd';
        }
        hashHistory.push({
            pathname: pathname,
            state: {
                type: this.type
            }
        });
    }

    handleDoInCenter(e){
        this.setState({
            doInCenter: e.target.value
        });
    }

    renderWindow(item){
        this.selectedId = item.id;
        $('.l_list').css('background','#fff');
        $('#_'+this.selectedId).css('background','#e6f7ff');
        const checkDirection = (items) => {
            const user_id = sessionStorage.getItem('user_id');
            const sender = items.sender;
            if(user_id!=sender){
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-rightTop',
                    flexDirection: 'row'
                };
            }else{
                return {
                    popoverPlace: 'ant-popover ant-popover-placement-leftTop',
                    flexDirection: 'row-reverse'
                }
            }
        }

        const privCommon = (it) => {
            if(it.readOnly){
                return 0;
            }else if(it.options){
                return 1;
            }else{
                return 2;
            }
        }

        const tempOtherPublish = (it) => {
            const user_id = sessionStorage.getItem('user_id');
            return it.ChildRoutineAffairs.map((_items,_index) => {
                if(user_id==_items.receiver){
                    if(_items.hasDone){
                        if(tempType==0){
                            return '已读';
                        }else if(tempType==1){
                            return  <div>
                                        <span>{'我的投票：'}</span>
                                        <span>{_items.cbContent}</span>
                                    </div>
                        }else if(tempType==2){
                            return  <div>
                                        <span>{_items.receiverName}：</span>
                                        <span>{_items.cbContent}</span>
                                    </div>
                        }
                    }else{
                        if(tempType==0){
                            return <a href={'javascript:void(0)'} onClick={() => this.publishReply({
                                routine_affair_id: it.routine_affair_id,
                                id: _items.id,
                                cbContent: '已读'
                            },(res,id) => {
                                this.refresh();
                            })}>{'一键已读'}</a>;
                        }else if(tempType==1){
                            const _arr = it.options.split(',');
                            return  <div>
                                        <RadioGroup defaultValue={_arr[0]}>
                                            {
                                                _arr.map(items => 
                                                    <Radio value={items}>{items}</Radio>
                                                )
                                            }
                                        </RadioGroup>
                                        <Button type={'primary'} style={{marginLeft: 25,fontSize: 12}} size={'small'} onClick={(e) => {
                                            let index = $(e.target).parent().parent().find('.ant-radio-wrapper-checked').index();
                                            this.publishReply({
                                                routine_affair_id: it.routine_affair_id,
                                                id: _items.id,
                                                cbContent: _arr[index]
                                            },() => this.refresh());
                                        }}>提交</Button>
                                    </div>
                        }else if(tempType==2){
                            return  <div style={{textAlign: 'right'}}>
                                        <TextArea rows={3}></TextArea>
                                        <Button style={{fontSize: 12,marginTop: 5}} size={'small'} type={'primary'} onClick={(e) => this.publishReply({
                                            routine_affair_id: it.routine_affair_id,
                                            id: _items.id,
                                            cbContent: $(e.target).parent().parent().find('textarea').val()
                                        },() => this.refresh())}>{'回复'}</Button>
                                    </div>
                        }
                    }
                }
            });
        }

        const tempSelfPublish = (it) => {
            const user_id = sessionStorage.getItem('user_id');
            let tempType = privCommon(it);
            let _contentArr;
            try{
                _contentArr = it.options.split(',');
                _contentArr.forEach((_it,_ind) => {
                    _contentArr[_ind] = {};
                    _contentArr[_ind][_it] = [];
                });
                _contentArr.push({
                    '未投票': []
                });
                it.ChildRoutineAffairs.map((_items,_index) => {
                    _contentArr.forEach((_it,_ind) => {
                        for(let _key in _it){
                            if(_items.cbContent==_key){
                                _contentArr[_ind][_key].push(_items.receiverName);
                                break;
                            }else if(!_items.cbContent&&_ind==_contentArr.length-1){
                                _contentArr[_contentArr.length-1]['未投票'].push(_items.receiverName);
                            }
                        }
                    });
                });
            }catch(e){}
            const inRender = (items) => {
                for(let key in items){
                    return  <div>
                                <span>{key}（{items[key].length}）：</span>
                                <span>{items[key].join()}</span>
                            </div>
                }
            }
            if(tempType==0||tempType==2){
                return it.ChildRoutineAffairs.map((_items,_index) => {
                    return  <div>
                                <span>{_items.receiverName}：</span>
                                <span>{_items.cbContent}</span>
                            </div>
                });
            }else{
                return _contentArr.map(items => 
                    inRender(items)
                )
            }
        }

        //撤回消息
        const recallMsg = (it) => {
            const { id } = it;
            const token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/affairs/update'))
                .set("token", token)
                .send({
                    id: id,
                    isdel: 1
                })
                .end((err, res) => {
                    if (err) return;
                    this.refresh();
                });
        }

        //回复模板
        const actionshow = (it) => {
            const user_id = sessionStorage.getItem('user_id');
            if(it.sender==user_id){ //自己发的
                return  <div>
                            {tempSelfPublish(it)}
                            <Popconfirm placement="top" title={'确定撤销该信息？'} onConfirm={() => recallMsg(it)} okText="是" cancelText="否">
                                <a href="javascript:void(0)">撤回</a>
                            </Popconfirm>
                        </div>
            }else{
                return tempOtherPublish(it);
            }
        }
        
        const renderChat = () => {
            return item.BaseRoutineAffairs.map((items,index) => {
                return <div className={"chats"} style={{display: 'flex',flexDirection: checkDirection(items)['flexDirection'],margin: 10}}>
                            <div style={{textAlign: 'left'}}>
                                <p style={{margin: 0}}>{items.senderName}</p>
                            </div>
                            <div className={checkDirection(items)['popoverPlace']} style={{position: 'relative',maxWidth: 400,zIndex: 1}}>
                                <div className={"ant-popover-content"}>
                                    <div className={"ant-popover-arrow"}></div>
                                    <div className={"ant-popover-inner"}>
                                        <div>
                                            <div style={{display: 'flex',justifyContent: 'space-between'}} className={"ant-popover-title"}>
                                                <span style={{marginRight: 30}}>{items.title}</span>
                                                <span>{moment(items.post_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                            </div>
                                            <div className={"ant-popover-inner-content"}>
                                                <div>
                                                    <p>{items.content}</p>
                                                </div>
                                            </div>
                                            <div style={{padding: '12px 16px',borderTop: '1px solid #eee'}}>
                                                {actionshow(items)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
            });
        }
        let in_height = $('.leftBar').height()-70;
        this.setState({
            windowContent: <div id={'contain'} style={{height: '100%'}}>
                                <div style={{height: 50,textAlign: 'right',marginTop: 13,borderBottom: '1px solid #eee'}}>
                                    {
                                        this.actionBtns(item)
                                    }
                                </div>
                                <div className={"chat"} style={{height: in_height,overflow: 'auto'}}>
                                    {renderChat()}
                                    <div className={"action"} style={{display: 'none',marginLeft: 8,marginRight: 8}}>
                                        <label style={{display:'flex',marginTop: 15}}>
                                            <span style={{width:45}}>标题：</span>
                                            <Input name={"title"} style={{flex:1}} />
                                        </label>
                                        <label style={{display:'flex',marginTop: 15}}>
                                            <span style={{width:45}}>正文：</span>
                                            <TextArea rows={'6'} name={"content"} style={{flex:1}} />
                                        </label>
                                        <label style={{display:'flex',marginTop: 15}}>
                                            <span style={{width:100,textAlign: 'left'}}>允许别处处理：</span>
                                            <RadioGroup defaultValue={this.state.doInCenter} onChange={this.handleDoInCenter}>
                                                <Radio className={'doInCenter'} value={1}>允许</Radio>
                                                <Radio className={'doInCenter'} value={0}>不允许</Radio>
                                            </RadioGroup>
                                        </label>
                                        <label style={{display:'flex',marginTop: 15}}>
                                            <span style={{width:45,textAlign: 'left'}}>类型：</span>
                                            <RadioGroup defaultValue={this.state.type} onChange={this.radioChange}>
                                                <Radio value={0}>只读</Radio>
                                                <Radio value={1}>投票</Radio>
                                                <Radio value={2}>指定人员回复</Radio>
                                            </RadioGroup>
                                        </label>
                                        {
                                            this.typeOfType()
                                        }
                                    </div>
                                </div>
                            </div>
        },() => {
            let scrollTop = sessionStorage.getItem('scrollTop_'+item.id);
            scrollTop = scrollTop?scrollTop:140000;
            $('.chat').scrollTop(scrollTop);
        });
    }

    publishReply(params,cb){
        if(params.cbContent==''){
            message.error('内容不能为空');
            return;
        }
        //保留滚动条位置信息
        sessionStorage.setItem('scrollTop_'+params.routine_affair_id,$('.chat').scrollTop());
        delete params.routine_affair_id;

        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/affairs/publishReply'))
            .set("token", token)
            .send(params)
            .end((err, res) => {
                if (err) return;
                cb(res,params.id);
            });
    }

    changeView(){
        this.setState({
            visible: !this.state.visible
        },() => {
            $('#_'+this.selectedId).trigger('click');
        });
        if(!this.state.visible){
            $('.chats').hide();
            $('.action').show();
        }else{
            $('.chats').show();
            $('.action').hide();
        }
    }

    radioChange(e){
        this.setState({
            type: e.target.value
        },() => {
            $('#_'+this.selectedId).trigger('click');
        });
    }

    getGroupMember(){
        const { data } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        let groupArr;
        let group_person_name;
        data.forEach((items,index) => {
            if(items.id==this.selectedId){
                groupArr = items.group_person.split(',');
                group_person_name = items.group_person_name;
            }
        });
        const resArr = [];
        groupArr.forEach((items,index) => {
            if(items!=user_id){
                const value = group_person_name[index];
                resArr.push(<Option key={items} value={items}>{value}</Option>);
            }
        });
        return resArr;
    }

    handleChange(v){
        const { type } = this.state;
        if(type==1){
            this.setState({
                options: v
            });
        }else if(type==2){
            this.setState({
                atSomeone: v
            });
        }
    }

    typeOfType(){
        const { type } = this.state;
        if(type==1){
            return <label style={{display:'flex',marginTop: 15}}>
                        <span style={{width:100,textAlign: 'left'}}>请输入选项：</span>
                        <Select
                            key={1}
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="请输入..."
                            onChange={this.handleChange}
                        >
                            <Option value={'同意'}>{'同意'}</Option>
                            <Option value={'不同意'}>{'不同意'}</Option>
                        </Select>
                    </label>
        }else if(type==2){
            return <label style={{display:'flex',marginTop: 15}}>
                        <span style={{width:120,textAlign: 'left'}}>指定人员回复：</span>
                        <Select
                            key={2}
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="请输入..."
                            onChange={this.handleChange}
                        >
                            {
                                this.getGroupMember()
                            }
                        </Select>
                    </label>
        }
    }

    sub(){
        let { doInCenter,type,options,atSomeone,data } = this.state;
        const user_id = sessionStorage.getItem('user_id');
        let readOnly;
        let subscriber;
        const title = $('input[name=title]').val();
        const content = $('textarea[name=content]').val();
        if(!content){
            message.error('内容不能为空');
            return;
        }
        data.forEach((items,index) => {
            if(items.id==this.selectedId) {
                let in_arr = [];
                items.group_person.split(',').forEach((it,ind) => {
                    if(it!=user_id) in_arr.push(it);
                });
                subscriber = in_arr.join();
            }
        });
        if(type==0){
            readOnly = 1;
            atSomeone = 0;
            options = null;
        }else if(type==1){
            readOnly = 0;
            atSomeone = 0;
            if(options[0]==null){
                message.error('选项不能为空');
                return;
            }
            options = options.join();
        }else if(type==2){
            readOnly = 0;
            options = null;
            if(atSomeone[0]==null){
                message.error('指定回复人员不能为空');
                return;
            }
            subscriber = atSomeone.join();
            atSomeone = 1;
        }
        let form_data = {
            title: title,
            content: content,
            doInCenter: doInCenter,
            readOnly: readOnly,
            options: options,
            atSomeone: atSomeone,
            subscriber: subscriber,
            routine_affair_id: this.selectedId
        };
        let token = sessionStorage.getItem('token');
        request.post(common.baseUrl('/affairs/add'))
            .set("token", token)
            .send({
                form_data: JSON.stringify(form_data)
            })
            .end((err, res) => {
                if (err) return;
                if(res.body.code==200){
                    message.success('发送成功');
                    this.setState({
                        visible: !this.state.visible
                    });
                    $('.chats').show();
                    $('.action').hide();
                    this.refresh();
                }
            });
    }

    actionBtns(item){
        const user_id = sessionStorage.getItem('user_id');
        const groupArr = item.group_person.split(',');
        if(groupArr.indexOf(user_id)==-1) return;
        const { data,visible } = this.state;
        if(!visible){
            return  <div>
                        <Button style={{marginRight: 50}} type={'primary'} onClick={this.changeView}>发布消息</Button>
                    </div>
        }else{
            return <div>
                        <Button style={{marginRight: 30}} type={'primary'} onClick={this.sub}>提交</Button>
                        <Button style={{marginRight: 50}} onClick={this.changeView}>取消</Button>
                    </div>
        }
    }

    render() {
        let b_height = window.innerHeight-190;
        const { page,data,windowContent } = this.state;
        return (
            <div className={"custRelationsAffairs"}>
                <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                    <div style={{flex: 1,display:  'flex'}}>
                        <Form.Item>
                            <Input name="keywords" style={{width:300}} placeholder="标题，发布人" />
                        </Form.Item>
                        <Button type="primary" onClick={this.handleSearch} style={{"position":"relative","left":15,"top":3}}>搜索</Button>
                    </div>
                    <Button type="primary" onClick={this.add} style={{"position":"relative","top":3,marginRight: 60}}>新建事务</Button>
                </Form>
                <div className="demo-infinite-container" style={{paddingRight: 10,height: b_height,display: 'flex'}}>
                    <div className={'leftBar'} style={{overflowY: 'auto',width: 250}}>
                        <InfiniteScroll
                            style={{width: 250}}
                            initialLoad={false}
                            pageStart={page}
                            loadMore={this.handleInfiniteOnLoad}
                            hasMore={!this.state.loading && this.state.hasMore}
                            useWindow={false}
                        >
                            <div style={{borderTop: "1px solid #e8e8e8",width: 250}}>
                                <List
                                    dataSource={this.state.data}
                                    itemLayout={"vertical"}
                                    renderItem={item => (
                                        <List.Item key={item.id}
                                            className={'l_list'}
                                            id={'_'+item.id}
                                            style={{paddingLeft: 10,cursor: 'pointer',width: 250,position: 'relative'}}
                                            onClick={() => this.renderWindow(item)}
                                            actions={this.dealerActions(item)}
                                        >
                                            <List.Item.Meta
                                                title={<div>
                                                        <div style={{overflow: 'hidden',whiteSpace: 'nowrap',textOverflow: 'ellipsis'}}>
                                                            {item.title}
                                                        </div>
                                                    </div>}
                                            />
                                        </List.Item>
                                    )}
                                >
                                    {this.state.loading && this.state.hasMore && (
                                        <div className="demo-loading-container" style={{textAlign: 'center'}}>
                                            <Spin />
                                        </div>
                                    )}
                                </List>
                            </div>
                        </InfiniteScroll>
                    </div>
                    <div style={{flex: 3,border: '1px solid #eee'}}>
                        {windowContent}
                    </div>
                </div>
            </div>
        );
    }
}

export default AffairsList;