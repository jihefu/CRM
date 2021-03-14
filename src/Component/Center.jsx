import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Layout, Menu, Breadcrumb, Icon, Button,message } from 'antd';
import request from 'superagent';
import $ from 'jquery';
import SocketIO from './SocketIO.jsx';
import '../public/css/App.css';
import logo from '../public/img/白底-改.png';
import common from '../public/js/common.js';
const { Header, Content, Sider } = Layout;


class Center extends Component {
	constructor(props) {
	    super(props);
	    this.handleMenuClick = this.handleMenuClick.bind(this);
        this.changeBread = this.changeBread.bind(this);
	    this.menuList = [];
	    this.siderList = [];
	}
	state = {
        menu: 0,
        sider: 0,
        bread: []
	};
	handleMenuClick(e) {
		let parentId = e.key;
		for (var i = 0; i < this.siderList.length; i++) {
			if(this.siderList[i].id-parentId<100&&this.siderList[i].id-parentId>0){
				hashHistory.push(this.siderList[i].link);
				break;
			}
		};
    };
    init(){
    	let siderList = this.siderList;
    	let href = window.location.href;
    	let route = href.split('#')[1].split('?')[0];
        if(route=='/') route = '/index';
        for (let i = 0; i < siderList.length; i++) {
            if(route==siderList[i].link){
                this.setState({
                    sider: siderList[i].id,
                    menu: siderList[i].id - siderList[i].id%100
                },() => {
                    this.setBread();
                });
                break;
            }else if(route!=siderList[i].link&&i==siderList.length-1){
                hashHistory.push('/');
            }
        };
    }
    setBread(){
        let { sider,menu } = this.state;
        let { menuList,siderList } = this;
        let bread = [];
        menuList.forEach((items,index) => {
            if(items.id==menu) bread.push({
                text: items.text,
                link: items.link
            });
        });
        siderList.forEach((items,index) => {
            if(items.id==sider) bread.push({
                text: items.text,
                link: items.link
            });
        });
        let res_arr = [],hashObj = {};
        bread.forEach((items,index) => {
            if(!hashObj[items.text]){
                hashObj[items.text] = 1;
                res_arr.push(items);
            }
        });
        this.setState({
            bread: res_arr
        });
    }

    componentDidUpdate(){
        let b_height = document.getElementsByClassName('ant-layout-content')[0].style['height'];
        document.getElementsByClassName('ant-layout-sider')[0].style['maxHeight'] = b_height+'px';

        if(/edge/ig.test(window.navigator.userAgent)){
            const h = window.innerHeight - 90;
            $('.sideMenuWrap').css({
                'min-height': h+'px',
                'max-height': h+'px'
            });
        }
    }

    //在初始化渲染执行之后调用，只执行一次
    componentDidMount(){
        this.checkUserAgent();
    	let b_height = window.innerHeight-90;
        document.getElementsByClassName('ant-layout-content')[0].style['min-height'] = b_height+'px';

    	let s = (a,b) => {
            if(a.id == b.id){
                return a._id - b._id;
            }else{
                return a.id - b.id;
            }
        }

    	let token = sessionStorage.getItem('token');
    	request.get(common.baseUrl('/menu/list'))
            .set("token",token)
            .end((err,res) => {
            	if(err){
            		message.error(res.body.msg);
                    hashHistory.push('/login');
                    this.checkUserAgent();
            		return;
            	}
            	const data = res.body.data;
                let menuList = [],siderList = [];
            	data.forEach((items,index) => {
            		if(items.menuId%100==0){
            			menuList.push({
            				id: items.menuId,
            				text: items.title
            			});
            		}else{
                        items.url.forEach((it,ind) => {
                            let str = it.split('/')[1];
                            let component = str.substring(0,1).toUpperCase()+str.substring(1);
                            siderList.push({
                                id: items.menuId,
                                _id: ind,
                                text: items.title,
                                link: it,
                                value: component
                            });
                        });
                    }
            	});
                this.menuList = menuList.sort(s);
                this.menuList.push({
                    id: 0,
            		text: sessionStorage.getItem('user_name'),
                });
                this.siderList = siderList.sort(s);
                hashHistory.push('/');
                this.init();
            });
    }
    checkUserAgent(){
        const deviceAgent = navigator.userAgent;
        if(deviceAgent.match(/(iphone|ipod|ipad|android)/ig)){
            if(!sessionStorage.getItem('pc')){
                window.location.href = common.baseUrl2('/m/home');
                return;
            }
        }
    }
    componentWillReceiveProps(){
        this.init();
    }
    changeBread(value){
        
    }
    fullScreen(){
        $('.ant-layout-sider,.fullScreen,.ant-layout-header').hide();
    }
    gotoIndex() {
        hashHistory.push('/index');
    }
	render() {
		const { menu,sider,bread } = this.state;
        const { menuList,siderList } = this;
		const _arr = [];
		siderList.forEach((items,index) => {
            if(items.id-menu<100&&items.id-menu>0) _arr.push(items);
		});
        let list_arr = [],hashObj = {};
        _arr.forEach((items,index) => {
            if(!hashObj[items.text]){
                hashObj[items.text] = 1;
                list_arr.push(items);
            }
        });
        const remoteLogo = common.staticBaseUrl('/img/gallery/运营系统logo.png');
		return (
		  <Layout>
		    <Header className="header">
                <img style={{cursor: 'pointer'}} className={'logo'} onClick={() => {this.gotoIndex()}} src={remoteLogo} />
		      {/* <img style={{cursor: 'pointer', opacity: 0.65}} className={'logo'} onClick={() => {this.gotoIndex()}} src={logo} /> */}
		      <Menu
		        theme="dark"
		        mode="horizontal"
		        defaultSelectedKeys={['0']}
		        selectedKeys={[menu.toString()]}
		        style={{ lineHeight: '64px' }}
		        onClick={this.handleMenuClick}
		      >
		      	{
		      		menuList.map((items,index) => (
                        (index !== menuList.length - 1 && <Menu.Item key={items['id']} type="menu">
                            {items['text']}
                        </Menu.Item>) || (index === menuList.length - 1 && <Menu.Item style={{float: 'right', paddingRight: 0}} key={items['id']} type="menu">
                            {items['text']}
                        </Menu.Item>)
                    ))
			      		
			      	
		      	}
		      </Menu>
		    </Header>
		    <Layout>
		      <Sider className={'sideMenuWrap'} width={200} style={{background: '#fff',overflowY: 'auto',overflowX: 'hidden', height: window.innerHeight-90 }}>
		        <Menu
		          mode="inline"
		          defaultSelectedKeys={['0']}
		          selectedKeys={[sider.toString()]}
		          style={{ height: '100%', borderRight: 0 }}
		        >
		            {
		            	list_arr.map((it,ind) => 
		        			<Menu.Item key={it['id']} type="sider">
		        				<Link to={it['link']}>{it['text']}</Link>
		        			</Menu.Item>
		        		)
		            }
		        </Menu>
		      </Sider>
              <Layout style={{ padding: '0 24px 24px' }}>
              {/* <Layout style={{ padding: '0 0 0 24px' }}> */}
		        <Content style={{ background: '#fff', margin: 0, minHeight: 450 }}>
                    {
                        this.props.children && React.cloneElement(this.props.children,{
                            changeBread: this.changeBread,
                            siderList: this.siderList
                        })
                    }
		        </Content>
		      </Layout>
		    </Layout>
            {/* <Button className={'fullScreen'} onClick={() => this.fullScreen()} style={{position: 'absolute',right: 20,background: '#001529',top: 14,border: '#001529',color: '#a1a3a4'}}>全屏</Button> */}
            <SocketIO></SocketIO>
		  </Layout>
		);
	}
}


export default Center;
