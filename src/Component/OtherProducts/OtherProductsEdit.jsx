import React, { Component } from 'react';
import { Form, Input, InputNumber, Button, Select, Message, Icon, Upload } from 'antd';
import Base from '../../public/js/base.js';
import common from '../../public/js/common.js';
import request from 'superagent';
const FormItem = Form.Item;
const { Option } = Select;

class OtherProductsEditTemp extends Component {

    state = {
        fileList: [],
    };

    componentDidMount() {

    }

    handleSubmit = e => {
        const { id } = this.props;
        const { fileList } = this;
        e.preventDefault();
	    this.props.form.validateFieldsAndScroll((err, values) => {
            const albumArr = fileList.map(items => items.name);
            values.album = albumArr.join();
	        if(!err) {
                const token = sessionStorage.getItem('token');
                request.post(common.baseUrl('/otherProducts/edit/' + id))
                    .set("token", token)
                    .send(values)
                    .end((err,res) => {
                        if(err) return;
                        Message.success(res.body.msg);
                        if (res.body.code === 200) {
                            Base.RemoveStateSession();
                            this.props.history.goBack();
                        }
                    });
            }
        });
    }

    uploadProps = () => {
		const self = this;
        const token = sessionStorage.getItem('token');

        let fileList;
        try {
            fileList = this.props.album.split(',').filter(items => items);
            fileList = fileList.map(items => {
                return {
                    uid: items,
                    name: items,
                    status: 'done',
                    url: common.staticBaseUrl('/img'+items),
                };
            });
        } catch (e) {
            fileList = [];
        }
        this.fileList = fileList;

		const props = {
			action: common.baseUrl('/otherProducts/uploadAlbum'),
			headers: {
				token,
			},
			accept: 'image/*',
			listType: 'picture',
			name: 'file',
			defaultFileList: fileList,
			multiple: false,
			onChange: (res) => {
				if (res.file.status=='done') {
					let file_name = res.file.response.data[0];
                    file_name = '/otherProducts/' + file_name;
                    this.fileList = [...self.fileList, {
                        uid: file_name,
                        name: file_name,
                        status: 'done',
                        url: common.staticBaseUrl('/img'+file_name),
                    }]
				}
			},
			onRemove: (result) => {
				let name;
				try {
					name = '/otherProducts/' + result.response.data[0];
				} catch(e) {
					name = result.name;
				}
				const fileList = self.fileList.filter(items => items.name != name);
				self.fileList = fileList;
			}
		};
		return props;
    }

    render() {
        const { model, standrd, manufacturer, valuation } = this.props;
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = { labelCol: { xs: { span: 6 } }, wrapperCol: { xs: { span: 12 } }};
        return (
            <Form onSubmit={this.handleSubmit} style={{padding: 24}}>
                <FormItem label={'照片'} {...formItemLayout}>
                    <Upload {...this.uploadProps()}>
                        <Button>
                            <Icon type="upload" />上传照片
                        </Button>
                    </Upload>
                </FormItem>
                <FormItem
                    key={'model'}
                    {...formItemLayout}
                    label={'型号'}
                >
                    {getFieldDecorator('model', {
                        initialValue: model,
                    })(
                        <Select>
                            <Option key={'AD800'} value={'AD800'}>AD800</Option>
                            <Option key={'比例阀'} value={'比例阀'}>比例阀</Option>
                            <Option key={'手控器'} value={'手控器'}>手控器</Option>
                            <Option key={'电控箱'} value={'电控箱'}>电控箱</Option>
                            <Option key={'传感器'} value={'传感器'}>传感器</Option>
                            <Option key={'电机'} value={'电机'}>电机</Option>
                        </Select>
                    )}
                </FormItem>
                <FormItem
                    key={'standrd'}
                    {...formItemLayout}
                    label={'规格'}
                >
                    {getFieldDecorator('standrd', {
                        initialValue: standrd,
                    })(
                        <Input />
                    )}
                </FormItem>
                <FormItem
                    key={'manufacturer'}
                    {...formItemLayout}
                    label={'厂家'}
                >
                    {getFieldDecorator('manufacturer', {
                        initialValue: manufacturer,
                    })(
                        <Input />
                    )}
                </FormItem>
                <FormItem
                    key={'valuation'}
                    {...formItemLayout}
                    label={'估值'}
                >
                    {getFieldDecorator('valuation', {
                        initialValue: valuation,
                    })(
                        <InputNumber />
                    )}
                </FormItem>
                <FormItem style={{textAlign: 'center'}}>
                    <Button id={"submit"} type="primary" htmlType="submit">提交</Button>
                </FormItem>
            </Form>
        )
    }
}

const OtherProductsEdit = Form.create()(OtherProductsEditTemp);

export default OtherProductsEdit;