import React, { Component } from 'react';
import { Input, message, Button,List,Icon, InputNumber, DatePicker, Upload, Select } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import '../../public/css/memberHover.css';
moment.locale('zh-cn');

const Option = Select.Option;

class TrainLog extends Component {
    constructor(props) {
        super(props);
        this.addRemItem = this.addRemItem.bind(this);
        this.subAddRemItem = this.subAddRemItem.bind(this);
        this.addType = this.addType.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.cancelText = this.cancelText.bind(this);
        this.subText = this.subText.bind(this);
        this.score = 50;
    }

    state = {
        list: [],
        score: 50,
        fileList: [],
        iconShow: true,
        typeShow: false,
        textShow: false,
        albumShow: false,
    };

    componentDidMount(){
        this.fetch();
    }

    fetch = () => {
		const token = sessionStorage.getItem('token');
		request.get(common.baseUrl('/member/getActivityRecord'))
            .set("token", token)
            .query({
				open_id: this.props.open_id,
            })
            .end((err, res) => {
				if (err) return;
				this.setState({
					list: res.body.data
				});
			});
		
    }
    
    addRemItem(e){
        this.setState({
            iconShow: true,
            albumShow: false,
        });
        // $('input[name=title]').val('');
        // $('input[name=content]').val('');
        this.setState({
            fileList: [],
        });
        this.album = null;
    }

    subAddRemItem(){
        const content = $('input[name=content]').val();
        const title = $('input[name=title]').val();
        const join_time = this.join_time;
        const award_time = this.award_time;
        const album = this.album;
        if (!title || !content || !join_time || !award_time || !album) {
            message.error('不能为空');
            return;
        }
		const token = sessionStorage.getItem('token');
		request.post(common.baseUrl('/member/addActivityRecord'))
            .set("token", token)
            .send({
				open_id: this.props.open_id,
                content: {
                    memberActivityType: '培训',
                    memberActivityTitle: title,
                    memberActivityDate: award_time,
                    memberActivityContent: content,
                    memberTrainScore: this.score,
                    memberTrainAlbum: album,
                },
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    list: [],
                });
                this.fetch();
				this.addRemItem();
			});
    }

    checkVisible(iconShow){
		if(iconShow) return 'block';
		return 'none';
    }
    
    scoreChange = v => {
        this.score = v;
        this.setState({
            score: v,
        });
    }

    joinTimeChange = v => {
        this.join_time = v.format('YYYY-MM-DD');
    }

    dateChange = v => {
        this.date = v.format('YYYY-MM-DD');
    }

    awardTimeChange = v => {
        this.award_time = v.format('YYYY-MM-DD');
    }

    onMouseEnter = e => {
        $(e.target).find('span').show();
    }

    onMouseLeave = e => {
        $(e.target).find('span').hide();
    }

    delTrainLog = id => {
        const { open_id } = this.props;
        const token = sessionStorage.getItem('token');
		request.delete(common.baseUrl('/member/delActivityRecord/' + id))
            .set("token", token)
            .send({
				open_id,
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    list: [],
                });
                this.fetch();
			});
    }

    uplaodProps = fileList => {
        const that = this;
        const props = {
            action: common.baseUrl('/member/uploadCerImg'),
			headers: {
				token: sessionStorage.getItem('token'),
			},
			accept: 'image/*',
			listType: 'picture',
            name: 'file',
            multiple: false,
            fileList,
			onChange: (res) => {
                const { file, fileList } = res;
                const lastFile = fileList[fileList.length - 1];
                if (!lastFile) return;
                that.setState({
                    fileList: [ lastFile ],
                });
				if(file.status=='done'){
                    const file_name = res.file.response.data[0];
                    that.album = file_name;
                    message.success('上传成功');
				}
			},
			onRemove: result => {
                that.setState({
                    fileList: [],
                });
                that.album = null;
            },
        };
        return props;
    }

    renderList(list) {
        const _arr = [];
        list.forEach(items => {
            if (items.content.memberActivityType === '培训') {
                _arr.push(
                    <List.Item key={items.id} className="recordListItem" style={{display: 'block'}} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
                        {/* 【{items.content.memberActivityTitle}】 */}
                        {moment(items.content.memberActivityDate).format('YYYY-MM-DD')}：
                        {items.content.memberActivityTitle}
                        （{items.content.memberTrainScore}分）
                        <a target={'__blank'} href={common.staticBaseUrl('/img/memberCertImg/' + items.content.memberTrainAlbum)}>查看证书</a>
                        <span title="删除" onClick={() => this.delTrainLog(items.id)} style={{display: 'none', cursor: 'pointer'}}>×</span>
                    </List.Item>
                );
            } else {
                _arr.push(
                    <List.Item key={items.id} className="recordListItem" style={{display: 'block'}} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
                        {/* 【{items.content.memberActivityTitle}】 */}
                        {moment(items.content.memberActivityDate).format('YYYY-MM-DD')}：
                        {items.content.memberActivityTitle}
                        {/* <span title="删除" onClick={() => this.delTrainLog(items.id)} style={{display: 'none', cursor: 'pointer'}}>×</span> */}
                    </List.Item>
                );
            }
        });
        return _arr;
    }

    addType() {
        this.addRemItem();
        this.setState({
            iconShow: false,
            typeShow: false,
            albumShow: true,
        });
        // this.setState({
        //     typeShow: true,
        // });
    }

    handleChange(v) {
        if (v == '培训') {
            this.addRemItem();
            this.setState({
                iconShow: false,
                typeShow: false,
                albumShow: true,
            });
        } else if (v == '其它') {
            this.setState({
                typeShow: false,
                textShow: true,
                iconShow: false,
            });
        }
    }

    subText() {
        const content = $('input[name=content2]').val();
        const title = $('input[name=title2]').val();
        const date = this.date;
        if (!title || !content || !date) {
            message.error('不能为空');
            return;
        }
		const token = sessionStorage.getItem('token');
		request.post(common.baseUrl('/member/addActivityRecord'))
            .set("token", token)
            .send({
                open_id: this.props.open_id,
                content: {
                    memberActivityType: '其它',
                    memberActivityTitle: title,
                    memberActivityDate: date,
                    memberActivityContent: content,
                },
            })
            .end((err, res) => {
                if (err) return;
                this.setState({
                    list: [],
                });
                this.fetch();
				this.cancelText();
			});
    }

    cancelText() {
        this.setState({
            iconShow: true,
            textShow: false,
        });
        this.setState({
            fileList: [],
        });
    }

    render(){
        const { list, iconShow, fileList, typeShow, textShow, albumShow } = this.state;
        const w = $('.ant-form-item-label').width() - 70;
        return <div style={{display: 'flex',paddingLeft: w,marginBottom: 20}}>
                    <label style={{width: 80, minWidth: 80,paddingTop: 12,color: 'rgba(0, 0, 0, 0.85)'}}>活动记录：</label>
                    <List style={{flex: 1}}>
                        {this.renderList(list)}
                        <List.Item key={'_add'}>
                            <span className={'addAct'} style={{'cursor': 'pointer'}}>
                                <span onClick={this.addType} style={{display: this.checkVisible(iconShow)}}>
                                    <Icon type="edit" style={{marginTop: 4}} />
                                    <span style={{marginLeft: 5}}>新增培训认证</span>
                                </span>
                                {/* <span style={{display: this.checkVisible(typeShow)}}>
                                    <Select defaultValue="选择类型" style={{ width: 120 }} onChange={this.handleChange}>
                                        <Option value="选择类型">选择类型</Option>
                                        <Option value="培训">培训</Option>
                                    </Select>
                                </span> */}
                                <span style={{display: this.checkVisible(textShow)}}>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>标题：</p>
                                        <Input name={'title2'} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>内容：</p>
                                        <Input name={'content2'} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>日期：</p>
                                        <DatePicker onChange={this.dateChange} />
                                    </div>
                                    <div style={{marginTop: 20}}>
                                        <Button style={{marginLeft: 20}} onClick={this.subText} type={'primary'}>提交</Button>
                                        <Button style={{marginLeft: 20}} onClick={this.cancelText}>取消</Button>
                                    </div>
                                </span>
                                <span style={{display: this.checkVisible(albumShow)}}>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>标题：</p>
                                        <Input name={'title'} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>内容：</p>
                                        <Input name={'content'} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>分值：</p>
                                        <InputNumber style={{width: '100%'}} min={1} max={200} value={this.state.score} onChange={this.scoreChange} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>参加培训日期：</p>
                                        <DatePicker onChange={this.joinTimeChange} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>颁发证书日期：</p>
                                        <DatePicker onChange={this.awardTimeChange} />
                                    </div>
                                    <div style={{display: 'flex', marginBottom: 10}}>
                                        <p style={{minWidth: 60, textAlign: 'left'}}>证书照片：</p>
                                        <Upload {...this.uplaodProps(fileList)}>
                                            <Button>
                                                <Icon type="upload" /> 上传
                                            </Button>
                                        </Upload>
                                    </div>
                                    <div style={{marginTop: 20}}>
                                        <Button style={{marginLeft: 20}} onClick={this.subAddRemItem} type={'primary'}>提交培训记录</Button>
                                        <Button style={{marginLeft: 20}} onClick={this.addRemItem}>取消</Button>
                                    </div>
                                </span>
                            </span>
                        </List.Item>
                    </List>
                </div>
    }
}

export default TrainLog;