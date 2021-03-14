import React, { Component } from 'react';
import { Input, message, Button,List,Icon } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import { hashHistory } from 'react-router';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

class RemList extends Component {
    constructor(props) {
        super(props);
        this.addRemItem = this.addRemItem.bind(this);
        this.subAddRemItem = this.subAddRemItem.bind(this);
        this.type;
        this.typeKey;
    }

    state = {
        remList: [],
        iconShow: true
    };

    componentDidMount(){
        this.type = this.props.type;
        this.typeKey = this.props.typeKey;
        this.fetch();
    }

    fetch = () => {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/rem/list'))
            .set("token", token)
            .query({
				type: this.type,
				typeKey: this.typeKey
            })
            .end((err, res) => {
				if (err) return;
				this.setState({
					remList: res.body.data
				});
			});
		
	}

    addRemItem(e){
		this.setState({
			iconShow: !this.state.iconShow
		});
	}

	subAddRemItem(){
		const content = $('input[name=newRem]').val();
		if(content==''){
			message.warn('不能为空');
			return;
		}
		const token = sessionStorage.getItem('token');
		request.post(common.baseUrl('/rem/add'))
            .set("token", token)
            .send({
				type: this.type,
				typeKey: this.typeKey,
				content: content
            })
            .end((err, res) => {
				if (err) return;
				const remList = [...this.state.remList,res.body.data];
				this.setState({
					remList
				},() => {
					this.addRemItem();
				});
			});
	}

    checkVisible(iconShow){
		if(iconShow){
			return 'flex';
		}else{
			return 'none';
		}
	}

    render(){
        const { remList,iconShow } = this.state;
        const w = $('.ant-form-item-label').width() - 40;
        return <div style={{display: 'flex',paddingLeft: w,marginBottom: 20}}>
                    <label style={{width: 50,paddingTop: 12,color: 'rgba(0, 0, 0, 0.85)'}}>附注：</label>
                    <List style={{flex: 1}}>
                        {
                            remList.map(items => 
                                <List.Item key={items.id} style={{display: 'block'}}>
                                    <span>{items.typeId}.</span>
                                    <span style={{marginLeft: 5}}>{moment(items.insert_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                    <span style={{marginLeft: 5}}>{items.insert_person}：</span>
                                    <span style={{marginLeft: 5}}>{items.content}</span>
                                </List.Item>
                            )
                        }
                        <List.Item key={'_add'}>
                            <span className={'addAct'} style={{'cursor': 'pointer'}}>
                                <span onClick={this.addRemItem} style={{display: this.checkVisible(iconShow)}}>
                                    <Icon type="edit" style={{marginTop: 4}} />
                                    <span style={{marginLeft: 5}}>新增</span>
                                </span>
                                <span style={{display: this.checkVisible(!iconShow)}}>
                                    <Input name={'newRem'} style={{width: 500}} />
                                    <Button style={{marginLeft: 20}} onClick={this.subAddRemItem} type={'primary'}>提交附注</Button>
                                    <Button style={{marginLeft: 20}} onClick={this.addRemItem}>取消</Button>
                                </span>
                            </span>
                        </List.Item>
                    </List>
                </div>
    }
}

export default RemList;