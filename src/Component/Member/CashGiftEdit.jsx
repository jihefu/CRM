import React from 'react';
import { Form, InputNumber, message, Select, Radio, Input } from 'antd';
import request from 'superagent';
import common from '../../public/js/common';
import moment from 'moment';
import 'moment/locale/zh-cn';
import BaseEditList from '../common/BaseEditList.jsx';
moment.locale('zh-cn');
const { TextArea } = Input;

export class CashGiftEditTemp extends BaseEditList {
    constructor(props) {
        super(props);
        this.target_key_prefix = '/output/';
        this.deleteUrl = '/member/delCashGift';
        this.uploadUrl = '/notiClient/imgUpload';
        this.state.labelProperty = {
            goodsName: { label: '礼品名', rules: [{ required: true, message: '不能为空' }] },
            inventory: { label: '库存数量' },
            originalScore: { label: '原价' },
            needScore: { label: '优惠价' },
            isOpen: { label: '开放对象' },
            isVer: { label: '身份限制' },
            scoreLimit: { label: '财产限制' },
            levelLimit: { label: '等级限制' },
            description: { label: '描述' },
            album: { label: '照片' },
        }
    };

    //@override
    //模态确定
    handleModalDefine() {
        let token = sessionStorage.getItem('token');
        request.delete('/member/delGift/' + this.id)
            .set("token", token)
            .end((err, res) => {
                if (err) return;
                message.success('删除成功');
                this.handleBackClick();
            });
    }

    //@override
    //提交
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                this.transToModel(values);
                values.id = this.id;
                let token = sessionStorage.getItem('token');
                request.put(common.baseUrl('/member/updateGift'))
                    .set("token", token)
                    .send(values)
                    .end((err, res) => {
                        if (err) return;
                        if (res.body.code == 200) {
                            message.success('更新成功');
                            this.handleBackClick();
                        } else {
                            message.error(res.body.msg);
                        }
                    });
            }
        });
    }

    //@override
    //初始化
    componentDidMount() {
        let data = this.props.location.state;
        let fileList = [];
        const { labelProperty } = this.state;
        if (this.checkSafe() == 1) return;
        this.id = data['id'];
        for (let key in labelProperty) {
            this.transToView(labelProperty, key, data);
            if (key == 'isOpen') {
                labelProperty[key].temp = <Radio.Group style={{ marginTop: 4 }}>
                        <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={0}>不开放</Radio>
                        <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={1}>微信公众号</Radio>
                        <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={2}>竞猜小程序</Radio>
                    </Radio.Group>
            } else if (key === 'needScore' || key === 'originalScore') {
                labelProperty[key].temp = <InputNumber min={1} step={1000} />
            } else if (key === 'inventory') {
                labelProperty[key].temp = <InputNumber min={0} step={1} />
            } else if (key === 'isVer') {
                labelProperty[key].temp = <Radio.Group>
                    <Radio value={0}>不限</Radio>
                    <Radio value={1}>商务会员</Radio>
                </Radio.Group>
            } else if (key === 'levelLimit') {
                labelProperty[key].temp = <Radio.Group style={{ marginTop: 4 }}>
                    <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={0}>不限</Radio>
                    <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={300}>黄金会员及以上</Radio>
                    <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={400}>铂金会员及以上</Radio>
                    <Radio style={{ display: 'block', height: 30, lineHeight: '30px' }} value={500}>钻石会员及以上</Radio>
                </Radio.Group>
            } else if (key === 'scoreLimit') {
                labelProperty[key].temp = <InputNumber min={0} step={100} />
            } else if (key === 'album') {
                let _arr = [];
                try {
                    _arr = labelProperty[key].initialValue.split(',');
                } catch (e) {

                }
                _arr.forEach((items, index) => {
                    if (items) {
                        fileList.push({
                            uid: index,
                            name: items,
                            status: 'done',
                            key: items,
                            url: common.staticBaseUrl('/img/notiClient/' + items)
                        });
                    }
                });
            } else if (key === 'description') {
                labelProperty[key].temp = <TextArea rows={6}></TextArea>
            }
        }
        this.setState({
            labelProperty: labelProperty,
            fileList
        }, () => {
            this.uploadRenderStart = true;
        });
    }

    uploadProps(){
		let token = sessionStorage.getItem('token');
		let props = {
			action: common.baseUrl(this.uploadUrl),
			headers: {
				token: token
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList: [...this.state.fileList],
			multiple: false,
			onChange: (res) => {
				if (res.file.status === 'uploading') {
					this.setState({
						spinning: true,
					});
				}
				if(res.file.status=='done'){
					this.setState({
						spinning: false,
					});
					let file_name = res.file.response.data[0];
					file_name = this.file_name_prefix+file_name;
					let album_str = this.props.form.getFieldValue('album');
					if(!album_str){
						album_str = file_name;
					}else{
						album_str += ','+file_name;
					}
					this.props.form.setFieldsValue({
						album: album_str
					});
				}
			},
			onRemove: (result) => {
				let name;
				try{
					name = this.file_name_prefix+result.response.data[0];
				}catch(e){
					name = result.name;
				}
				let albumArr = this.props.form.getFieldValue('album').split(',');
				albumArr.forEach((items,index) => {
					if(items==name) albumArr.splice(index,1);
				});
				let str = '';
				albumArr.forEach((items,index) => {
					str += items+',';
				});
				str = str.slice(0,str.length-1);
				this.props.form.setFieldsValue({
					album: str
				});
			}
		};
		return props;
    }

    transToView(labelProperty, key, data) {
        labelProperty[key]['initialValue'] = data[key];
        // if (key === 'isOpen') {
        //     labelProperty[key]['initialValue'] = data[key] ? '是' : '否';
        // }
    }

    transToModel(values) {
        // values.isOpen = values.isOpen === '是' || values.isOpen === 1 ? 1 : 0;
        let albumArr;
        try {
            albumArr = values.album.split(',').filter(items => items);
        } catch (e) {
            albumArr = [];
        }
        if (albumArr.length === 0) {
            values.album = '';
        } else {
            values.album = albumArr[0];
        }
    }
}

const CashGiftEdit = Form.create()(CashGiftEditTemp);

export default CashGiftEdit;