import React, { Component } from 'react';
import { Modal, Button } from 'antd';
import $ from 'jquery';

class ModalTemp extends Component {
    constructor(props) {
        super(props);
    }
    state = {
        ModalText: '',
        title: '提醒'
    }
    handleCancel = () => {
        //父级
        this.props.handleModalCancel();
    }
    handleOk = () => {
        let res_obj = {};
        for (let i = 0; i < $('textarea,input,select').length; i++) {
            res_obj[$('textarea,input,select').eq(i).attr('name')] = $('textarea,input,select').eq(i).val();
        };
        //父级
        this.props.handleModalCancel();
        this.props.handleModalDefine(res_obj);
    }
    componentWillReceiveProps(props){
        this.setState({
            ModalText: ''
        },() => {
            this.setState({
                ModalText: props.ModalText,
                title: props.title
            });
        });
    }
    render() {
        return (
            <div>
                <Modal title={this.state.title?this.state.title:'提醒'}
                  visible={this.props.visible}
                  onOk={this.handleOk}
                  onCancel={this.handleCancel}
                  okText={this.okText?this.okText:"确认"}
                  cancelText={this.cancelText?this.cancelText:"取消"}
                >
                  <div>{this.state.ModalText}</div>
                </Modal>
              </div>
        );
    }
}

export default ModalTemp;