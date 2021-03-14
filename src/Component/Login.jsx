import React, { Component } from 'react';
import { hashHistory } from 'react-router'
import { Form, Icon, Input, Button, message, Spin } from 'antd';
import $ from 'jquery';
import '../public/css/App.css';
import '../public/css/Login.css';
import request from 'superagent';
import common from '../public/js/common';
const FormItem = Form.Item;

class NormalLoginForm extends Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.paramsMaper = {};
        this.clickCount = 0;
    }
  	state = {
        showLoginCode: true,
        showAccountLogin: false,
  	};
	  //在初始化渲染执行之前调用，只执行一次
    componentWillMount() {
        // $('body').append('<iframe src="'+common.staticBaseUrl('/html/preloading.html')+'" style="display: none;"></iframe>');
    }
    //在初始化渲染执行之后调用，只执行一次
    componentDidMount(){
        let showLoginCode = true;
        const paramsArr = window.location.href.split('?')[1].split('&');
        const paramsMaper = {};
        paramsArr.forEach(items => {
            const kv = items.split('=');
            paramsMaper[kv[0]] = kv[1];
        });
        this.paramsMaper = paramsMaper;
        if (paramsMaper['code']) {
            showLoginCode = false;
            this.checkGuest();
        }
        this.setState({
            showLoginCode,
        });
    }
    componentWillReceiveProps(){
    	
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if(!err){
                request.post(common.baseUrl('/login'))
                    .send({"userName": values.userName,"passWord": values.password})
                    .end((err,res) => {
                        if(err){
                            message.error(res.body.msg);
                        }else{
                            sessionStorage.setItem('token',res.body.data[0].token);
                            sessionStorage.setItem('user_id',res.body.data[0].user_id);
                            sessionStorage.setItem('user_name',res.body.data[0].user_name);
                            sessionStorage.setItem('unionid',res.body.data[0].unionid);
                            message.success(res.body.msg);
                            hashHistory.push('/');
                        }
                    });
            }
        });
    }

    checkGuest = () => {
        const { code } = this.paramsMaper;
        request.post(common.baseUrl('/wxLoginCheck'))
            .send({code})
            .end((err,res) => {
                if(res.body.code != 200){
                    message.error(res.body.msg);
                    if (res.body.code == -100) {
                        setTimeout(() => {
                            window.location.href = common.baseUrl('');
                        }, 1000);
                    }
                }else{
                    message.success(res.body.msg);
                    sessionStorage.setItem('token',res.body.data[0].token);
                    sessionStorage.setItem('user_id',res.body.data[0].user_id);
                    sessionStorage.setItem('user_name',res.body.data[0].user_name);
                    sessionStorage.setItem('unionid',res.body.data[0].unionid);
                    // message.success(res.body.msg);
                    // $('body').append('<iframe src="'+common.staticBaseUrl('/html/preloading.html')+'" style="display: none;"></iframe>');
                    const src = ('https://mp.langjie.com/static/wxAppletManage/index.html?token=' + res.body.data[0].token);
                    $('body').append('<iframe src="'+src+'" style="display: none;"></iframe>');
                    hashHistory.push('/');
                }
            });
    }

    showAccountLogin = () => {
        this.clickCount++;
        if (this.clickCount === 10) {
            this.setState({
                showAccountLogin: true,
            });
        }
    }

	render() {
        const { getFieldDecorator } = this.props.form;
        const { showLoginCode, showAccountLogin } = this.state;
        return (
          <div className={"wrap"}>
            <div onClick={this.showAccountLogin} style={{width: 6, height: 6}}></div>
            { (common.debug || showAccountLogin) && <Form onSubmit={this.handleSubmit} className="login-form">
              <p className={"company"} style={{color: '#999'}}>杭州朗杰测控技术开发有限公司</p>
              <FormItem>
                  {getFieldDecorator('userName', {
                    rules: [{ required: true, message: '请输入用户名!' }],
                  })(
                    <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="用户名" />
                  )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('password', {
                    rules: [{ required: true, message: '请输入密码!' }],
                  })(
                    <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="密码" />
                  )}
              </FormItem>
              <FormItem>
                <Button type="primary" htmlType="submit" className="login-form-button">
                  登陆
                </Button>
              </FormItem>
            </Form> }
            { showLoginCode && <iframe style={{width: '100%', height: 420, border: 'none', marginTop: 112}} src="https://open.weixin.qq.com/connect/qrconnect?appid=wx19792965396beb35&redirect_uri=https://os.langjie.com/home&response_type=code&scope=snsapi_login#wechat_redirect" frameBorder="0"></iframe> }
            { !showLoginCode && <div style={{textAlign: 'center', marginTop: 30}}><Spin /><p>登陆中...</p></div> }
          </div>
        );
    }
}

const Login = Form.create()(NormalLoginForm);

export default Login;