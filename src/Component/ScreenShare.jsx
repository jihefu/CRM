import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Icon, Button, message, Tree, Popconfirm } from 'antd';
import request from 'superagent';
import common from '../public/js/common.js';
const { TreeNode } = Tree;

class SaleChart extends Component {
    constructor(props) {
        super(props);
        this.timer;
        this.treeOnSelect = this.treeOnSelect.bind(this);
    }

    state = {
        hostArr: [],
        guestArr: []
    };

    componentDidMount() {
        this.fetch();
        this.timer = setInterval(() => {
            this.fetch();
        },5000);
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    fetch(cb) {
        let token = sessionStorage.getItem('token');
        // request.get('https://os.langjie.com/home/webrtcHostMapper')
        request.get(common.baseUrl('/webrtcHostMapper'))
            .set("token", token)
            .end((err, res) => {
                if(err) return;
                this.setState({
                    hostArr: res.body.data.hostArr,
                    guestArr: res.body.data.guestArr
                });
                if(cb) cb(res.body.data);
            });
    }

    // 树节点被选中
    treeOnSelect(val) {
        if(val.length==0||val[0]==0) return;
        val = val[0];
        const user_name = sessionStorage.getItem('user_name');
        this.fetch(result => {
            const { hostArr, guestArr } = result;
            if(hostArr.indexOf(user_name)==-1&&guestArr.indexOf(user_name)==-1){
                // window.open('http://192.168.50.230:8090/videoPage?userName='+user_name+'&type=guest&receiver='+val);
                window.open('https://os.langjie.com/videoPage?userName='+user_name+'&type=guest&receiver='+val);
            }else{
                message.error('登陆冲突');
            }
        });
    }

    // 渲染树
    renderTree() {
        const userName = sessionStorage.getItem('user_name');
        const { hostArr } = this.state;
        const resArr = hostArr.map((items,index) => {
            // if(userName==items){
            //     return <TreeNode title={items} key={items} disabled={true} />
            // }else{
                return <TreeNode title={items} key={items} />
            // }
        });
        if (resArr.length==0) return <TreeNode title={'空'} key={'空'} disabled={true} />
        return resArr;
    }

    renderCreateBtn() {
        const { hostArr, guestArr } = this.state;
        const userName = sessionStorage.getItem('user_name');
        if(hostArr.indexOf(userName)==-1&&guestArr.indexOf(userName)==-1){
            return <div>
                    <Popconfirm placement="bottomLeft" title={'选择类型'} onConfirm={() => {
                        // window.open('http://192.168.50.230:8090/videoPage?userName='+userName+'&type=host&isScreen=0');
                        window.open('https://os.langjie.com/videoPage?userName='+userName+'&type=host&isScreen=0');
                    }} onCancel={() => {
                        // window.open('https://192.168.50.230:8090/videoPage?userName='+userName+'&type=host&isScreen=1');
                        window.open('https://os.langjie.com/videoPage?userName='+userName+'&type=host&isScreen=1');
                    }} okText="我的摄像头" cancelText="我的屏幕">
                        <Button ghost type="primary">
                            <Icon type="user-add" />
                            <span>创建会议室</span>
                        </Button>
                    </Popconfirm>
                </div>   
        }else{
            return <div></div>;
        }
    }

    render() {
        return <div style={{margin: 15}}>
                    {this.renderCreateBtn()}
                    <Tree
                        style={{marginTop: 5}}
                        showLine
                        defaultExpandedKeys={['0']}
                        defaultSelectedKeys={['0']}
                        onSelect={this.treeOnSelect}
                    >
                        <TreeNode title={'会议室'} key={'0'}>
                            {this.renderTree()}
                        </TreeNode>
                    </Tree>
                </div>
        // const user_name = sessionStorage.getItem('user_name');
        // return <div style={{margin: 12}}>
        //     <Popconfirm placement="bottomLeft" title={'选择类型'} onConfirm={() => {
        //         window.open('https://os.langjie.com/videoPage?userName='+user_name+'&type=host&isScreen=0');
        //     }} onCancel={() => {
        //         window.open('https://os.langjie.com/videoPage?userName='+user_name+'&type=host&isScreen=1');
        //     }} okText="我的摄像头" cancelText="我的屏幕">
        //         <Button type={'primary'}>创建会议室</Button>
        //     </Popconfirm>
        //     <Button style={{marginLeft: 20}} onClick={() => {
        //         window.open('https://os.langjie.com/videoPage?userName='+user_name+'&type=guest');
        //     }}>加入会议室</Button>
        // </div>
    }
}

export default SaleChart;