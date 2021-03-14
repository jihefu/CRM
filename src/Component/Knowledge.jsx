import React, { Component } from 'react';
import RemoteSearchInput from './common/RemoteSearchInput';
import { Icon, Button, message, Tree, Spin, Empty, Table, Tag, Input, Upload, Popconfirm, Divider, TreeSelect, Switch, Modal, Form, Select, Radio } from 'antd';
import request from 'superagent';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import common from '../public/js/common.js';
import '../public/css/knowlib.css';
moment.locale('zh-cn');
const { TreeNode } = Tree;
const { TextArea } = Input;
const { Option } = Select;
const RadioGroup = Radio.Group;

class Knowledge extends Component {
    constructor(props) {
        super(props);
        this.treeSelect = this.treeSelect.bind(this);
        this.saveFile = this.saveFile.bind(this);
        this.showModal = this.showModal.bind(this);
        this.subFileHeadInfo = this.subFileHeadInfo.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.fetchStaff = this.fetchStaff.bind(this);
        this.treeId = 0;
        this.selectFileInfo = {};
        this.modalContent = '';
        this.staffData = [];
        this.staffArr = [[], [], [], []];
        this.recycleBinId;
        this.recycleMode = false;
    }

    state = {
        selectedKeys: [],
        treeData: [],
        fileList: [],
        fileContent: {},
        readContent: [],
        versionLog: [],
        loadingList: false,
        loadingFile: false,
        readMode: true,
        isFullScreen: false,
        isdirty: false,
        showFileRemoteSearch: false,
        showModal: false,
        searchParams: {
            showSearch: false,
            keywords: '',
            showAll: 0,
            showMark: 0,
            showSelf: 0,
            showByCreate: 1,
        },
    };

    componentDidMount() {
        this.fetchTreeData();
        this.fetchStaff();
        this.fetchRecycleBinId();
    }

    componentDidUpdate() {
        $('.knLibNodeName').eq(0).hide();
    }

    // 获取所有员工
    fetchStaff(){
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
            });
    }

    // 获取节点树数据源
    fetchTreeData() {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getKnowledgeTree'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.setState({
                    treeData: res.body.data
                });
            });
    }

    // 获取文件列表
    fetchFileList(id) {
        const { searchParams } = this.state;
        this.selectFileInfo = {};
        this.setState({
            loadingList: true,
            fileList: [],
            fileContent: {},
            readContent: [],
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getFileList'))
            .set("token",token)
            .query({...searchParams, id})
            .end((err,res) => {
                if(err) return;
                this.setState({
                    fileList: res.body.data,
                    loadingList: false,
                }, () => {
                    this.resortList();
                });
            });
    }

    // 获取文件内容
    fetchFileContent(id) {
        this.setState({
            fileContent: {},
            loadingFile: true,
            readContent: [],
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getFileContent'))
            .set("token",token)
            .query({
                id,
            })
            .end((err,res) => {
                if(err) return;
                this.setState({
                    fileContent: res.body.data[0],
                    readContent: res.body.data,
                    loadingFile: false,
                });
                this.fetchVersionLog(id);
            });
    }

    // 获取版本记录
    fetchVersionLog = (fileHeadId) => {
        this.setState({
            versionLog: [],
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getShootingList'))
            .set("token",token)
            .query({
                fileHeadId,
            })
            .end((err,res) => {
                if(err) return;
                this.setState({
                    versionLog: res.body.data,
                });
            });
    }

    // 获取指定版本内容
    fetchOldVersionContent = _id => {
        this.setState({
            fileContent: {},
            loadingFile: true,
            readContent: [],
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getShootingItem'))
            .set("token",token)
            .query({
                _id,
            })
            .end((err,res) => {
                if(err) return;
                this.setState({
                    fileContent: res.body.data[0],
                    readContent: res.body.data,
                    loadingFile: false,
                });
            });
    }

    // 获取回收站id
    fetchRecycleBinId = () => {
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/recycleBinId'))
            .set("token",token)
            .end((err,res) => {
                if(err) return;
                this.recycleBinId = res.body.data;
            });
    }
    
    // 点击树节点
    treeSelect(v) {
        const { readMode } = this.state;
        if (!readMode) return;
        if (v.length === 0) {
            this.treeId = 0;
            return;
        }
        this.treeId = v[0];
        this.fetchFileList(v[0]);
        this.setState({
            fileContent: {},
            readContent: [],
            versionLog: [],
            selectedKeys: v,
        });
        if (this.treeId == this.recycleBinId) {
            this.recycleMode = true;
        } else {
            this.recycleMode = false;
        }
    }

    // 渲染节点树
    renderTree() {
        let { treeData, readMode, selectedKeys } = this.state;
        treeData = [{
            name: '全部',
            id: 0,
            subTreeArr: treeData,
            key: 0,
        }];
        const resArr = [];
        function getTreeNode(arr) {
            return arr.map(items => {
                if (items.subTreeArr && items.subTreeArr.length !== 0) {
                    return <TreeNode title={items.name} key={items.id} disabled={items.disabled}>
                                {getTreeNode(items.subTreeArr)}
                            </TreeNode>
                }
                return <TreeNode title={items.name} key={items.id} disabled={items.disabled} />
            });
        }
        return <Tree
                    showLine
                    defaultExpandAll
                    selectedKeys={selectedKeys}
                    onSelect={this.treeSelect}
                >
                    {getTreeNode(treeData)}
                </Tree>;
    }

    // 点击文件，对应的tree激活点亮
    renderActiveTreeItem = treeId => {
        if (!treeId) {
            this.setState({
                selectedKeys: ['0'],
            });
            this.treeId = 0;
        } else {
            if (treeId.indexOf(',') !== -1) treeId = treeId.slice(0, treeId.indexOf(','));
            this.setState({
                selectedKeys: [treeId],
            });
            this.treeId = treeId;
        }
    }

    // 点击文件
    fileSelect(items) {
        const { readMode } = this.state;
        if (!readMode) return;
        const refList = this.refs;
        for (const key in refList) {
            if (/^knfile_*/.test(key)) {
                this.refs[key].style.background = '#fff';
            }
        }
        this.refs['knfile_' + items.id].style.background = 'rgb(230, 247, 255)';
        $('.kn_bar').hide();
        $('.kn_bar_name').css('width', '100%');

        if (items.isdel == 1) {
            this.recycleMode = true;
        } else {
            this.recycleMode = false;
        }

        if (!this.recycleMode) {
            $(this.refs['knfile_' + items.id]).find('.kn_bar_name').css('width', '147px');
            $(this.refs['knfile_' + items.id]).find('.kn_bar').show();
        }
        this.fetchFileContent(items.id);
        this.selectFileInfo = items;

        if (this.recycleMode) return;
        this.renderActiveTreeItem(items.treeId);
    }

    // 渲染文件列表
    renderFileList() {
        const { loadingList, fileList, searchParams } = this.state;
        const that = this;
        const user_id = sessionStorage.getItem('user_id');
        if (loadingList) return <Spin style={{display: 'flex', justifyContent: 'center'}} />
        if (this.recycleMode) return <div>
                                        {
                                            fileList.map(items => {
                                                return <div ref={'knfile_' + items.id} onClick={() => this.fileSelect(items)} className={'knowFileList'} key={items.id} style={{display: 'flex', cursor: 'pointer', padding: 6, paddingLeft: 18, borderRadius: 2}}>
                                                            <Icon type="file" style={{marginTop: 4}} />
                                                            <div className={'kn_bar_name'} style={{marginLeft: 6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}} title={items.name}>{items.name}</div>
                                                        </div>
                                            })
                                        }
                                    </div>;
        if (fileList.length === 0) return <div>{newFile()}<Empty /></div>;
        return <div>
            {newFile()}
            {
                fileList.map(items => {
                    let color = 'rgba(0, 0, 0, 0.65)', nameColor = 'rgba(0, 0, 0, 0.65)';
                    let bookMarkArr;
                    let markTitle = '收藏', importantTitle = '设为重要';
                    try {
                        bookMarkArr = items.bookMark.split(',');
                    } catch (error) {
                        bookMarkArr = [];
                    }
                    if (bookMarkArr.indexOf(user_id) !== -1) {
                        color = 'rgb(248, 205, 43)';
                        markTitle = '取消收藏';
                    }
                    if (items.isImportant) {
                        nameColor = '#C62828';
                        importantTitle = '取消重要';
                    }
                    return <div ref={'knfile_' + items.id} onClick={() => this.fileSelect(items)} className={'knowFileList'} key={items.id} style={{display: 'flex', cursor: 'pointer', padding: 6, paddingLeft: 18, borderRadius: 2}}>
                                <Icon type="star" style={{color, marginTop: 4}} />
                                <div className={'kn_bar_name'} style={{color: nameColor,marginLeft: 6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}} title={items.name}>{items.name}</div>
                                <div className={'kn_bar'} style={{flex: 1, display: 'none'}}>
                                    <Icon style={{marginLeft: 4}} title={markTitle} type="star" onClick={() => fileMark(items.id)} />
                                    <Icon style={{marginLeft: 4}} title={importantTitle} onClick={() => fileImportant(items.id)} type="pushpin" />
                                    <Icon style={{marginLeft: 4}} title={'复制'} onClick={() => copyFile(items.id)} type="copy" />
                                    <Icon style={{marginLeft: 4}} title={'删除'} onClick={() => delFile(items, items.id)} type="delete" />
                                    <Icon style={{marginLeft: 4}} onClick={that.showModal} type="info-circle" title={'编辑'} />
                                </div>
                            </div>
                })
            }
        </div>

        function fileMark(id) {
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/fileMark'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchFileList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function fileImportant(id) {
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/fileImportant'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchFileList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function copyFile(id) {
            let token = sessionStorage.getItem('token');
            request.post(common.baseUrl('/knowlib/copyFile'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchFileList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function delFile(items, id) {
            const { isImportant } = items;
            if (isImportant) return message.error('重要文件不允许删除');
            const r = window.confirm('确定删除该文件？');
            if (!r) return;
            let token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/knowlib/delFile'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchFileList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function newFile() {
            const { showAll, showMark, keywords, showSearch, showSelf, showByCreate } = searchParams;
            function dealerSearch(e) {
                const keywords = e.target.value;
                searchParams.keywords = keywords;
                that.setState({
                    searchParams,
                });
                that.fetchFileList(that.treeId);
                if (keywords) return;
                searchParams.showSearch = false;
                that.setState({
                    searchParams,
                });
            }
            const titleType = () => {
                let treeId = that.treeId;
                if (!that.treeId || that.treeId == 0) treeId = null;
                const props = {
                    name: 'file',
                    action: common.baseUrl('/knowlib/parseExcel'),
                    headers: {
                        token: sessionStorage.getItem('token'),
                    },
                    accept: '.xlsx',
                    showUploadList: false,
                    onChange(info) {
                        if (info.file.status === 'done') {
                            if (info.file.response.code != 200) {
                                message.error(info.file.response.msg);
                            } else {
                                message.success(info.file.response.msg);
                                that.excelData = info.file.response.data;
                                that.excelName = info.file.name.slice(0, info.file.name.lastIndexOf('.'));
                            }
                        } else if (info.file.status === 'error') {
                            message.error(info.file.response.msg);
                        }
                    },
                };
                return <div style={{width: 260}}>
                            <RadioGroup defaultValue={1} style={{marginBottom: 6}} onChange={v => {
                                v = v.target.value;
                                if (v === 1) {
                                    $('#kn_create_file').show();
                                    $('#kn_create_excel').hide();
                                } else {
                                    $('#kn_create_file').hide();
                                    $('#kn_create_excel').show();
                                }
                            }} >
                                <Radio value={1}>属性表</Radio>
                                <Radio value={2}>对比表</Radio>
                            </RadioGroup>
                            {/* <Switch style={{marginBottom: 6}} checkedChildren="文本" unCheckedChildren="excel" defaultChecked onChange={v => {
                                if (!v) {
                                    $('#kn_create_file').hide();
                                    $('#kn_create_excel').show();
                                } else {
                                    $('#kn_create_file').show();
                                    $('#kn_create_excel').hide();
                                }
                            }} /> */}
                            <Input id={'kn_create_file'} placeholder={'请输入文件名'} ref={'newFileName'} />
                            <div id={'kn_create_excel'} style={{display: 'none'}}>
                                <Upload {...props} >
                                    <Button>
                                        <Icon type="upload" />上传Excel
                                    </Button>
                                </Upload>
                            </div>
                        </div>;
            }
            return <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <Popconfirm placement="bottomLeft" title={titleType()} icon={<span></span>} onConfirm={e => {
                            let v, content, isTable = 0;
                            if ($('#kn_create_file').css('display') == 'none') {
                                v = that.excelName;
                                content = that.excelData;
                                isTable = 1;
                            } else {
                                v = that.refs.newFileName.state.value;
                                if (!v) return;
                            }
                            let treeId = [that.treeId];
                            if (!that.treeId || that.treeId == 0) treeId = null;
                            let token = sessionStorage.getItem('token');
                            request.post(common.baseUrl('/knowlib/createDoc'))
                                .set("token",token)
                                .send({
                                    name: v,
                                    treeId,
                                    content,
                                    isTable,
                                })
                                .end((err,res) => {
                                    if(err) return;
                                    if (res.body.code === 200) {
                                        message.success(res.body.msg);
                                        that.fetchFileList(that.treeId);
                                    } else {
                                        message.error(res.body.msg);
                                    }
                                });
                        }} okText="Yes" cancelText="No">
                                    <div style={{paddingLeft: 6, cursor: 'pointer'}}>
                                        <Icon type="file-add" />
                                        <span style={{marginLeft: 6}}>新增</span>
                                    </div>
                                </Popconfirm>
                    <div style={{paddingRight: 6}}>
                        { showByCreate == 1 && <Icon type="sort-ascending" title={'首字母排序'} style={{cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showByCreate = 0;
                            that.setState({
                                searchParams,
                            }, () => {
                                that.resortList();
                            });
                        }} /> }
                        { showByCreate == 0 && <Icon type="sort-ascending" title={'默认排序'} style={{color: '#1790ff',cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showByCreate = 1;
                            that.setState({
                                searchParams,
                            }, () => {
                                that.resortList();
                            });
                        }} /> }
                        { showMark==0 && <Icon type="star" title={'只看收藏'} style={{cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showMark = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchFileList(that.treeId);
                        }} /> }
                        { showMark!=0 && <Icon type="star" title={'只看收藏'} style={{color: '#1790ff',cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showMark = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchFileList(that.treeId);
                        }} /> }
                        { showSelf==0 && <Icon type="bars" onClick={() => {
                            searchParams.showSelf = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchFileList(that.treeId);
                        }} title={'只看本目录'} style={{cursor: 'pointer', marginLeft: 4}} /> }
                        { showSelf!=0 && <Icon type="bars" onClick={() => {
                            searchParams.showSelf = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchFileList(that.treeId);
                        }} title={'只看本目录'} style={{cursor: 'pointer', marginLeft: 4, color: '#1790ff'}} /> }
                        {/* { !showSearch && <Icon type="search" title={'搜索'} onClick={() => {
                            searchParams.showSearch = true;
                            that.setState({
                                searchParams,
                            });
                        }} style={{cursor: 'pointer', marginLeft: 4}} /> }
                        { showSearch && <Input size={'small'} placeholder={'文件名'} defaultValue={keywords} style={{width: 150}} onPressEnter={e => dealerSearch(e)} onBlur={e => dealerSearch(e)} /> } */}
                        { showAll==0 && <Icon type="eye" title={'显示所有文件'} style={{cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showAll = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchFileList(that.treeId);
                        }} /> }
                        { showAll!=0 && <Icon type="eye" title={'显示所有文件'} style={{cursor: 'pointer', marginLeft: 4, color: '#1790ff'}} onClick={() => {
                            searchParams.showAll = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchFileList(that.treeId);
                        }} /> }
                    </div>
                </div>
        }
    }

    resortList() {
        const { fileList, searchParams } = this.state;
        const { showByCreate } = searchParams;
        let sortedArr = [];
        if (showByCreate == 1) {
            const s = (a, b) => {
                return Date.parse(b.updateTime) - Date.parse(a.updateTime);
            }
            sortedArr = mySort(fileList.sort(s), true);
        } else {
            const s = (a, b) => {
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            }
            sortedArr = mySort(fileList.sort(s));
        }
        this.setState({
            fileList: sortedArr,
        });

        function mySort(arr, ignoreChar) {
            const markArr = [], importantArr = [], charArr = [], normalArr = [], charAndZhArr = [];
            const user_id = sessionStorage.getItem('user_id');
            arr.forEach((items, index) => {
                let bookMarkArr;
                try {
                    bookMarkArr = items.bookMark.split(',');
                } catch (e) {
                    bookMarkArr = [];
                }
                if (bookMarkArr.indexOf(user_id) !== -1) {
                    markArr.push(items);
                } else if (items.isImportant == 1) {
                    importantArr.push(items);
                } else if (/\w/.test(items.name[0])) {
                    charAndZhArr.push(items);
                    charArr.push(items);
                } else {
                    charAndZhArr.push(items);
                    normalArr.push(items);
                }
            });
            if (ignoreChar) return [ ...markArr, ...importantArr, ...charAndZhArr ];
            return [ ...markArr, ...importantArr, ...charArr, ...normalArr ];
        }
    }

    // 渲染文件内容
    renderContent() {
        const { loadingFile, fileContent, readContent, readMode, isFullScreen, showFileRemoteSearch, treeData } = this.state;
        const that = this;
        const userId = sessionStorage.getItem('user_id');
        if (loadingFile) return <Spin style={{display: 'flex', justifyContent: 'center'}} />
        if (readContent.length === 0) return <Empty />;
        if (readMode) return renderReadMode();
        return renderEditMode(fileContent);

        // 阅读模式
        function renderReadMode() {
            const resArr = [];
            const renderArr = [];
            recursiveRead(-1, fileContent.id);
            return <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                <div style={{width: '100%'}}>
                    <span style={{position: 'relative', left: 6, top: 7, color: '#999'}}>作者：{fileContent.authorName}</span>
                    <span style={{position: 'relative', left: 41, top: 7, color: '#999'}}>更新时间：{moment(fileContent.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                    <span style={{fontSize: 23, cursor: 'pointer', textAlign: 'right', float: 'right'}}>
                        { !isFullScreen && <Icon onClick={() => {
                            that.setState({
                                isFullScreen: !isFullScreen
                            });
                        }} type="fullscreen" title={'全屏'} /> }
                        { isFullScreen && <Icon onClick={() => {
                            that.setState({
                                isFullScreen: !isFullScreen
                            });
                        }} type="fullscreen-exit" title={'退出全屏'} /> }
                        { !that.recycleMode && <Icon type="edit" style={{marginLeft: 6}} title={'编辑'} onClick={() => {
                            that.setState({
                                readMode: false,
                            });
                            that.fetchFileContent(fileContent.id);
                        }} />}
                        { that.recycleMode && <Icon type="rollback" style={{marginLeft: 6}} title={'还原'} onClick={() => {
                            const r = window.confirm('确定还原？');
                            if (r) {
                                let token = sessionStorage.getItem('token');
                                request.put(common.baseUrl('/knowlib/recycleBinRollback'))
                                    .set("token",token)
                                    .send({
                                        id: fileContent.id,
                                    })
                                    .end((err,res) => {
                                        if(err) return;
                                        message.success(res.body.msg);
                                        that.fetchFileList(that.treeId);
                                    });
                            }
                        }} />}
                    </span>
                </div>
                <div style={{flex: 1, overflow: 'auto'}}>{renderArr}</div>
            </div>;

            // 递归渲染
            function recursiveRead(num, id) {
                const _content = readContent.filter(items => items.id == id)[0];
                if (!_content) return;
                const { name, isMerage, link, content, isTable } = _content;
                let linkArr;
                try {
                    linkArr = typeof link == 'string' ? link.split(',') : link;
                } catch (e) {
                    linkArr = [];
                }
                const indentText = num * 32 + 6 > 0 ? num * 32 + 6 : 6;
                renderArr.push(<div key={name}>
                    <h3 style={{background: '#e6f7ff', padding: 6, paddingLeft: indentText}} className={'knLibNodeName'}>{name}</h3>
                    <div style={{padding: 6, paddingLeft: indentText}}>{itemsInfo(name, content, isTable)}</div>
                </div>);
                if (isMerage == 0) {
                    linkArr.forEach((items, index) => {
                        let n = num;
                        n++;
                        recursiveRead(n, items);
                    });
                } else {
                    try {
                        renderArr.push(<div key={'table_'+name} style={{paddingLeft: indentText}}>{renderTable(linkArr)}</div>);
                    } catch (e) {
                        // 文件已被删除
                    }
                }

                function itemsInfo(name, content, isTable) {
                    const inArr = [];
                    let w = 28;
                    if (isTable == 1) {
                        inArr.push(<p key={'excelTable_'+name} style={{display: 'flex'}}>
                                    {renderExcelTable(name, content)}
                                </p>);
                    } else {
                        for (const key in content) {
                            w = key.length * 14 > w ? key.length * 14 : w;
                        }
                        for (const key in content) {
                            if (key) {
                                inArr.push(<p key={name + '_' +key} style={{display: 'flex'}}>
                                    <p style={{textAlign: 'right', width: w, marginBottom: 0}}>{key}</p>
                                    <p style={{marginBottom: 0}}>：</p>
                                    {renderReadList(name, key, content[key])}
                                </p>);
                            }
                        }
                    }
                    return inArr;
                }
    
                function renderReadList(name, key, v, done) {
                    if (v instanceof Array) return <p key={name+'_'+key} style={{flex: 1, marginBottom: 0}}>{v.map((items,index) => <p key={name+'_'+key+'_'+index} style={{display: 'flex', marginBottom: 0}} dangerouslySetInnerHTML={{__html: '<span style="font-weight: bolder;margin-right: 4px;">·</span>' + that.hideLongText(that.transText(that.transImg(items)), done)}}></p>)}</p>;
                    return <p key={name+'_'+key} style={{flex: 1, marginBottom: 0}} dangerouslySetInnerHTML={{__html: that.hideLongText(that.transText(that.transImg(v)), done)}}></p>;
                }
    
                function renderTable(tableArr) {
                    const inContentArr = [];
                    const resArr = [];
                    tableArr.forEach((items, index) => {
                        inContentArr.push(readContent.filter(it => it.id == items));
                    });
                    const keyMapper = {};
                    const len = inContentArr.length;
                    inContentArr.forEach((items, index) => {
                        items.forEach((it, ind) => {
                            for (const key in it.content) {
                                if (!keyMapper[key]) keyMapper[key] = 1;
                            }
                        });
                    });
                    for (const key in keyMapper) resArr.push([key]);
                    resArr.forEach((items, index) => {
                        let count = 0;
                        while (count < len) {
                            const v = inContentArr[count][0].content[items[0]] ? inContentArr[count][0].content[items[0]] : '--';
                            items.push(v);
                            count++;
                        }
                    });
                    resArr.unshift(['']);
                    inContentArr.forEach((items, index) => resArr[0].push(items[0].name));
                    return <table className={'kn_table'} key={resArr[0][1]}>
                        {
                            resArr.map((items, index) => {
                                return <tr key={'tr_'+index}>
                                    {
                                        index === 0 && items.map((it,ind) => <td key={'td_'+index+'_'+ind} style={{width: 100/items.length+'%', padding: 6}}>{renderReadList(resArr[0][ind], items[0], it, 1)}</td>)
                                    }
                                    {
                                        index !== 0 && items.map((it,ind) => <td key={'td_'+index+'_'+ind} style={{padding: 6}}>{renderReadList(resArr[0][ind], items[0], it, 1)}</td>)
                                    }
                                </tr>
                            })
                        }
                    </table>
                }

                function renderExcelTable(name, content) {
                    return <table className={'kn_table'} key={'excelTable_'+name}>
                        {
                            content.map((items, index) => {
                                return <tr key={'exceltr_'+index}>
                                    {
                                        index === 0 && items.map((it,ind) => <td title={it} key={'exceltd_'+index+'_'+ind} style={{padding: 10}} dangerouslySetInnerHTML={{__html: that.hideLongText(that.transImg(it), 1)}}></td>)
                                    }
                                    {
                                        index !== 0 && items.map((it,ind) => <td title={it} key={'td_'+index+'_'+ind} style={{padding: 10}} dangerouslySetInnerHTML={{__html: that.hideLongText(that.transImg(it), 1)}}></td>)
                                    }
                                </tr>
                            })
                        }
                    </table>
                }
            }
        }

        // 编辑模式
        function renderEditMode(fileContent) {
            const resArr = [];
            return <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                <div style={{width: '100%'}}>
                    <span style={{textAlign: 'right', float: 'right', fontSize: 23, cursor: 'pointer'}}>
                        { !isFullScreen && <Icon onClick={() => {
                            that.setState({
                                isFullScreen: !isFullScreen
                            });
                        }} type="fullscreen" style={{marginLeft: 6}} title={'全屏'} /> }
                        { isFullScreen && <Icon onClick={() => {
                            that.setState({
                                isFullScreen: !isFullScreen
                            });
                        }} type="fullscreen-exit" style={{marginLeft: 6}} title={'退出全屏'} /> }
                        <Icon type="save" style={{marginLeft: 6}} title={'保存'} onClick={that.saveFile} />
                        <Icon type="read" style={{marginLeft: 6}} title={'返回阅读模式'} onClick={() => {
                            that.setState({
                                readMode: true,
                                showFileRemoteSearch: false,
                            });
                            that.fetchFileContent(fileContent.id);
                        }} />
                    </span>
                </div>
                <div style={{flex: 1, overflow: 'auto'}}>{dealerRender(fileContent)}</div>
            </div>

            function dealerRender(fileContent) {
                const { content, link, name, id, isTable } = fileContent;
                const props = {
                    name: 'file',
                    action: common.baseUrl('/knowlib/parseExcel'),
                    headers: {
                        token: sessionStorage.getItem('token'),
                    },
                    accept: '.xlsx',
                    showUploadList: false,
                    onChange(info) {
                        if (info.file.status === 'done') {
                            if (info.file.response.code != 200) {
                                message.error(info.file.response.msg);
                            } else {
                                message.success(info.file.response.msg);
                                fileContent.content = info.file.response.data;
                                that.setState({
                                    fileContent,
                                });
                            }
                        } else if (info.file.status === 'error') {
                            message.error(info.file.response.msg);
                        }
                    },
                };
                if (isTable == 0) {
                    renderSelfType();
                    renderLinkType();
                    return <div style={{marginTop: 30}}>{resArr}</div>;
                } else {
                    return <div>
                                <Upload style={{marginLeft: 8}} {...props}>
                                    <Button>
                                        <Icon type="upload" /> 上传excel
                                    </Button>
                                </Upload>
                                <table className={'kn_table'} style={{minWidth: 300}} key={'excelTable_'+name}>
                                    {
                                        content.map((items, index) => {
                                            return <tr key={'exceltr_'+index}>
                                                {
                                                    index === 0 && items.map((it,ind) => <td key={'exceltd_'+index+'_'+ind} style={{padding: 6}}>{it}</td>)
                                                }
                                                {
                                                    index !== 0 && items.map((it,ind) => <td key={'td_'+index+'_'+ind} style={{padding: 6}}>{it}</td>)
                                                }
                                            </tr>
                                        })
                                    }
                                </table>
                            </div>;
                }

                // 渲染自身键值对类型
                function renderSelfType() {

                    // 删除条目
                    function deleteItem(key) {
                        delete content[key];
                        that.setState({
                            fileContent
                        });
                    }

                    // 上移
                    function prevItem(key) {
                        let index = 0;
                        let orderIndex;
                        const resArr = [];
                        for (const k in content) {
                            resArr.push(k);
                            if (key === k) orderIndex = index;
                            index++;
                        }
                        if (orderIndex === 0) return;
                        const newContent = {};
                        let otherKey;
                        otherKey = resArr[orderIndex-1];
                        resArr[orderIndex-1] = resArr[orderIndex];
                        resArr[orderIndex] = otherKey;
                        resArr.forEach((items, index) => {
                            newContent[items] = content[items];
                        });
                        fileContent.content = newContent;
                        that.setState({
                            fileContent,
                        });
                    }

                    // 下移
                    function nextItem(key) {
                        let index = 0;
                        let orderIndex;
                        const resArr = [];
                        for (const k in content) {
                            resArr.push(k);
                            if (key === k) orderIndex = index;
                            index++;
                        }
                        if (orderIndex === resArr.length - 1) return;
                        const newContent = {};
                        let otherKey;
                        otherKey = resArr[orderIndex+1];
                        resArr[orderIndex+1] = resArr[orderIndex];
                        resArr[orderIndex] = otherKey;
                        resArr.forEach((items, index) => {
                            newContent[items] = content[items];
                        });
                        fileContent.content = newContent;
                        that.setState({
                            fileContent,
                        });
                    }

                    // 转换类型
                    function changeType(key) {
                        const items = content[key];
                        if (typeof items === 'object') {
                            content[key] = '';
                        } else {
                            content[key] = [['',''],['','']];
                        }
                        that.setState({
                            fileContent
                        });
                    }

                    // 字符串模式
                    function stringMode(key) {
                        if (typeof content[key] === 'object') {
                            content[key] = content[key].join('\n');
                        }
                        that.setState({
                            fileContent
                        });
                    }

                    // 数组模式
                    function arrayMode(key) {
                        if (typeof content[key] === 'string') {
                            content[key] = content[key].split('\n');
                        }
                        that.setState({
                            fileContent
                        });
                    }

                    function renderMenuBar(key) {
                        const items = content[key];
                        if (items instanceof Array) {
                            return(
                                <span style={{cursor: 'pointer', marginLeft: 3}}>
                                    <Icon style={{borderRadius: 2}} onClick={(e) => stringMode(key, e)} title={'单行文本'} type="small-dash" />
                                    <Icon style={{marginLeft: 1, borderRadius: 2, background: '#bae7ff'}} onClick={() => arrayMode(key)} title={'多行文本'} type="ordered-list" />
                                </span>
                            );
                        }
                        return(
                            <span style={{cursor: 'pointer', marginLeft: 3}}>
                                <Icon style={{borderRadius: 2, background: '#bae7ff'}} onClick={(e) => stringMode(key, e)} title={'单行文本'} type="small-dash" />
                                <Icon style={{marginLeft: 1, borderRadius: 2}} onClick={() => arrayMode(key)} title={'多行文本'} type="ordered-list" />
                            </span>
                        );
                    }

                    const inArr = [];
                    for (const key in content) {
                        inArr.push(<div onClick={(e) => {
                            $('.know_edit_item,.know_edit_item input,.know_edit_item textarea').css('background', '#fff');
                            $('.kn_edit_item').hide();
                            if ($(e.target).hasClass('know_edit_item')) {
                                $(e.target).css('background', 'rgb(230, 247, 255)');
                                $(e.target).find('.kn_edit_item').show();
                            } else {
                                $(e.target).parents('.know_edit_item').css('background', 'rgb(230, 247, 255)');
                                $(e.target).parents('.know_edit_item').find('.kn_edit_item').show();
                            }
                        }} className={'know_edit_item'} style={{display: 'flex'}} key={key}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <Input style={{width: 150}} defaultValue={key} onBlur={e => {
                                    const newKey = e.target.value;
                                    if (newKey === key) return;
                                    const newContent = {};
                                    for (const _k in content) {
                                        if (_k === key) {
                                            newContent[newKey] = content[_k];
                                        } else {
                                            newContent[_k] = content[_k];
                                        }
                                    }
                                    fileContent.content = newContent;
                                    that.setState({
                                        fileContent,
                                    });
                                }} />
                                <div className={'kn_edit_item'} style={{fontSize: 17, padding: 6, display: 'none'}}>
                                    <Icon style={{cursor: 'pointer'}} title={'上移'} onClick={() => prevItem(key)} type="arrow-up" />
                                    <Icon style={{cursor: 'pointer', marginLeft: 3}} onClick={() => nextItem(key)} title={'下移'} type="arrow-down" />
                                    <Icon style={{cursor: 'pointer', marginLeft: 3}} onClick={() => deleteItem(key)} title={'删除'} type="delete" />
                                    { renderMenuBar(key) }
                                    {/* <Icon style={{cursor: 'pointer', marginLeft: 3}} onClick={() => changeType(key)} title={'转换类型'} type="swap" /> */}
                                </div>
                            </div>
                            <span>：</span>
                            {
                                content[key] instanceof Array && <TextArea style={{flex: 1}} onChange={e => {
                                    let _arr = e.target.value.split('\n');
                                    _arr = _arr.filter(items => items);
                                    content[key] = _arr;
                                }} autosize={{minRows: 2}} defaultValue={content[key].join('\n')} ></TextArea>
                            }
                            {
                                (!(content[key] instanceof Array)) && <TextArea style={{flex: 1}} onChange={e => {
                                    content[key] = e.target.value;
                                }} autosize={{minRows: 1}} defaultValue={content[key]}></TextArea>
                            }
                        </div>
                        );
                    }
                    resArr.push(<div key={id}>{inArr}</div>);
                }

                // 渲染link类型
                function renderLinkType() {
                    const linkTag = (readContent, items) => {
                        const arr = readContent.filter(it => it.id == items);
                        if (arr.length !== 0 ) {
                            return arr[0].name;
                        } else {
                            return '';
                        }
                    }
                    resArr.push(<div key={'linkblock_'+id} style={{padding: 18, cursor: 'pointer', display: 'inline'}} title={'新增条目'} onClick={() => {
                                        const { content } = fileContent;
                                        content[''] = '';
                                        that.setState({
                                            fileContent
                                        });
                                    }}>
                                    <span>新增条目</span>
                                    <Icon type="plus" />
                                </div>);
                    resArr.push(<div className={'know_edit_item'} key={'引用'}>
                        <h3 style={{display: 'inline', fontWeight: 'bolder'}}>{'引用：'}</h3>
                        {
                            link.map(items => <Tag key={items} data-text={items} closable onClose={e => {
                                e.preventDefault();
                                const v = $(e.target).parent().parent().attr('data-text');
                                fileContent.link = link.filter(items => items !== v);
                                that.setState({
                                    fileContent,
                                });
                            }}>{ linkTag(readContent, items)}</Tag>)
                        }
                        { showFileRemoteSearch && <RemoteSearchInput style={{width: '100%', maxWidth: 300, margin: 10}} placeholder={'请输入文件名'} searchInputselected={() => {}} cbData={v => {
                            if (fileContent.link.indexOf(v.id) === -1 && v.id != fileContent.id) {
                                fileContent.link.push(v.id);
                                readContent.push({
                                    id: v.id,
                                    name: v.name,
                                });
                                that.setState({
                                    fileContent,
                                    readContent,
                                    showFileRemoteSearch: false,
                                });
                            } else {
                                that.setState({
                                    showFileRemoteSearch: false,
                                });
                            }
                        }} remoteUrl={common.baseUrl('/knowlib/searchFile?keywords=')} />}
                        { !showFileRemoteSearch && <Tag title={'新增'} onClick={() => {
                            that.setState({
                                showFileRemoteSearch: true,
                            });
                        }}>{'+'}</Tag>}
                    </div>);

                    let { isMerage } = fileContent;
                    const merageValue = isMerage == 1 ? true : false;
                    resArr.push(<div className={'know_edit_item'} key={'合并'}>
                                    <h3 style={{display: 'inline', fontWeight: 'bolder'}}>{'合并：'}</h3>
                                    <Switch checked={merageValue} onChange={() => {
                                        fileContent.isMerage = fileContent.isMerage == 1 ? 0 : 1;
                                        that.setState({
                                            fileContent,
                                        });
                                    }} />
                                </div>);
                }
            }
        }
    }

    // 保存文件
    saveFile() {
        const { fileContent } = this.state;
        let { link, content, id, fileId, isMerage } = fileContent;
        let len = 0;
        for (const key in content) len++;
        if (len === 0) content = {'': ''};
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/knowlib/subEdit'))
            .set("token",token)
            .send({
                id,
                content,
                link,
                fileId,
                isMerage,
            })
            .end((err,res) => {
                if(err) return;
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    this.setState({
                        readMode: true,
                    });
                    this.fetchFileContent(id);
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 转换
    transText(text) {
        text = text.toString();
        text = text.replace(/\n/g,'</br>');
        // text = text.replace(/\s/g,'&nbsp;');
        const arr = text.split('</br>');
        let str = '';
        arr.map(items => str += '<p style="margin-bottom: 0px">'+items+'</p>');
        return str;
    }

    mediaTrans(text) {
        try {
            if (/{"class":(\s*)"picture"/.test(text)) {
                try {
                    const obj = JSON.parse(text);
                    const imgName = obj.name;
                    text = '<span style="cursor: pointer;color: #1890ff">'+
                            '<a target="_blank" style="display: none;" href="'+common.staticBaseUrl('/img/gallery/'+imgName)+'"><img style="cursor: pointer;margin: 8px;" src="'+common.staticBaseUrl('/img/gallery/list_'+imgName)+'" /></a>'+
                            '<span onclick="$(this).prev().show();$(this).hide();">'+imgName+'</span>'+
                            '</span>';
                } catch (e) {
                    
                }
            } else if (/{"class":(\s*)"video"/.test(text)) {
                try {
                    const obj = JSON.parse(text);
                    const videoName = obj.name;
                    text = '<span style="cursor: pointer;color: #1890ff">'+
                            '<video style="width: 300px; margin: 8px; display: none;" controls="controls" src="'+common.staticBaseUrl('/img/gallery/'+videoName)+'" ></video>'+
                            '<span onclick="$(this).prev().show();$(this).hide();">'+videoName+'</span>'+
                            '</span>';
                } catch (e) {
                    
                }
            } else if (/{"class":(\s*)"html"/.test(text)) {
                const obj = JSON.parse(text);
                const htmlName = obj.name;
                const href = obj.href;
                text = '<span style="cursor: pointer;color: #1890ff">'+
                            '<a target="_blank" href="'+href+'">'+htmlName+'</a>'+
                        '</span>';
            }
        } catch (e) {
            
        }
        return text;
    }

    // 转换图片资源
    transImg(text) {
        const self = this;
        try {
            if (/"class":(\s*)"json"/.test(text)) {
                text = jsonParse(text);
                text = jsonFormat(text);
            } else {
                text = this.mediaTrans(text);
            }
        } catch (e) {
            
        }

        function jsonParse(str) {
            str = str.replace(/\s/ig, '');
            const stack = [], indexArr = [];
            for (let i = 0; i < str.length; i++) {
                const it = str[i];
                if (it === '{' && str.substring(i, i+7) === '{"class') {
                    stack.push(i);
                } else if (it === '}' && stack.length !== 0) {
                    indexArr.push({
                        leftStart: stack.pop(),
                        rightStart: i+1,
                    });
                }
            }
            let offset = 0;
            getStr();
            return str;
            function getStr() {
                const arr = str.split('');
                if (indexArr.length !== 0) {
                    const item = indexArr.shift();
                    let { leftStart, rightStart } = item;
                    leftStart += offset;
                    rightStart += offset;
                    const transStr = self.mediaTrans(str.substring(leftStart, rightStart));
                    offset += transStr.length - (rightStart - leftStart);
                    arr.splice(leftStart, rightStart - leftStart, transStr);
                    str = arr.join('');
                    return getStr();
                }
            }
        }

        function jsonFormat(str) {
            const arr = str.split('');
            const len = arr.length;
            let offset = 0;
            let indent = 0;
            for (let i = 0; i < len; i++) {
                if (str[i] === '{' || str[i] === '[') {
                    indent+=4;
                } else if (str[i] === '}' || str[i] === ']') {
                    indent-=4;
                }
                if (str[i] === '{' || str[i] === '[' || str[i] === ',') {
                    let appendStr = '';
                    for (let j = 0; j < indent; j++) {
                        appendStr += '&nbsp;'
                    }
                    arr.splice(offset+i+1, 0, '</br>'+appendStr);
                    offset += 1;
                } else if (str[i] === '}' || str[i] === ']') {
                    let appendStr = '';
                    for (let j = 0; j < indent; j++) {
                        appendStr += '&nbsp;'
                    }
                    arr.splice(offset+i, 0, '</br>'+appendStr);
                    offset += 1;
                }
            }
            return arr.join('');
        }

        return text;
    }

    // 隐藏长文本
    hideLongText(text, done) {
        if (!done) return text;
        try {
            let len = 0;
            for (let i = 0; i < text.length; i++) {
                if (/[\u4e00-\u9fa5]+/.test(text[i])) {
                    len = len + 2;
                } else {
                    len++;
                }
            }
            if (len > 80 && !/target="_blank"/.test(text)) {
                const hideText = text.substr(0, 37)+'...';
                const clickStr = 'if($(this).text()==\'展开\'){$(this).text(\'收起\');$(this).parent().find(\'.knLongText\').text($(this).parent().attr(\'data-act-text\'));}else{$(this).text(\'展开\');$(this).parent().find(\'.knLongText\').text($(this).parent().attr(\'data-hide-text\'));}';
                text = '<div style="min-width: 150px;" data-act-text="'+text+'" data-hide-text="'+hideText+'"><span style="word-break: break-all;" class="knLongText">'+hideText+'</span><span style="color: #1790ff;cursor: pointer;" onclick="'+clickStr+'">展开</span></div>';
            }
        } catch (e) {
            
        }
        return text;
    }

    // 编辑文件头信息
    showModal() {
        const selectFileInfo = this.selectFileInfo;
        const that = this;
        const { treeData } = this.state;
        if (!selectFileInfo['id']) return message.warn('请先选择文件');
        const user_id = sessionStorage.getItem('user_id');
        this.setState({
            showModal: true,
        });
        const selectTreeData = getSelectTreeData(treeData);
        this.modalContent = <Form className={'kn_form'}>
            <Form.Item label="文件名" style={{display: 'flex', width: '100%'}}>
                <Input defaultValue={selectFileInfo.name} onChange={e => {
                    const name = e.target.value;
                    selectFileInfo.name = name;
                }} />
            </Form.Item>
            <Form.Item label="目录" style={{display: 'flex', width: '100%'}}>
                <TreeSelect
                    defaultValue={typeof selectFileInfo.treeId === 'object' ? selectFileInfo.treeId: selectFileInfo.treeId.split(',')}
                    showSearch
                    multiple
                    treeData={selectTreeData}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    placeholder="Please select"
                    treeDefaultExpandAll
                    onChange={v => selectFileInfo.treeId = v}
                />
            </Form.Item>
            <Form.Item label="读写权限" style={{display: 'flex', width: '100%'}}>
                <RadioGroup defaultValue={selectFileInfo.powerPerson ? 2 : 1} style={{marginBottom: 6}} onChange={v => {
                    v = v.target.value;
                    if (v==1) {
                        $('.kn_power_person').hide();
                    } else {
                        $('.kn_power_person').show();
                    }
                }} >
                    <Radio value={1}>全体</Radio>
                    <Radio value={2}>指定</Radio>
                </RadioGroup>
            </Form.Item>
            { showPowerPerson(selectFileInfo.powerPerson) }
            <Form.Item label="对外发布" style={{display: 'flex', width: '100%'}}>
                <Switch defaultChecked={this.selectFileInfo.isRelease==1 ? true : false} onChange={v => this.selectFileInfo.isRelease = v ? 1 : 0} />
            </Form.Item>
            <Form.Item label="隐藏" style={{display: 'flex', width: '100%'}}>
                <Switch defaultChecked={this.selectFileInfo.isHide==1 ? true : false} onChange={v => this.selectFileInfo.isHide = v ? 1 : 0} />
            </Form.Item>
        </Form>;

        function getSelectTreeData(treeData) {
            return treeData.map(items => {
                if (items.subTreeArr && items.subTreeArr.length !== 0) {
                    return {
                        title: items.name,
                        value: items.id,
                        key: items.id,
                        children: getSelectTreeData(items.subTreeArr),
                    };
                } else {
                    return {
                        title: items.name,
                        value: items.id,
                        key: items.id,
                    };
                }
            });
        }

        function showPowerPerson(powerPerson) {
            const display = powerPerson ? 'block' : 'none';
            let defaultValue;
            try {
                defaultValue = powerPerson.split(',');
            } catch (e) {
                defaultValue = [];
            }
            return <Select
                mode="multiple"
                className={'kn_power_person'}
                defaultValue={defaultValue}
                onChange={v => {
                    if (v.length===0) 
                        v = null;
                    else 
                        v = v.join();
                    selectFileInfo.powerPerson = v;
                }}
                style={{ width: '100%', display: display, position: 'relative', top: '-25px' }} >
                <Select.OptGroup label="研发部">
                    {
                        that.staffArr[0].map(items => 
                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                        )
                    }
                </Select.OptGroup>
                <Select.OptGroup label="客户关系部">
                    {
                        that.staffArr[1].map(items => 
                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                        )
                    }
                </Select.OptGroup>
                <Select.OptGroup label="生产部">
                    {
                        that.staffArr[2].map(items => 
                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                        )
                    }
                </Select.OptGroup>
                <Select.OptGroup label="管理部">
                    {
                        that.staffArr[3].map(items => 
                            <Select.Option key={items.user_id} value={items.user_id}>{items.user_name}</Select.Option>
                        )
                    }
                </Select.OptGroup>
            </Select>
        }
    }

    hideModal() {
        this.modalContent = '';
        this.setState({
            showModal: false,
        });
    }

    // 提交文件头信息
    subFileHeadInfo() {
        let { id, name, treeId, isHide, isRelease, powerPerson } = this.selectFileInfo;
        if (!name) return message.error('文件名不能为空');
        if (!treeId) treeId = null;
        // if (!treeId) return message.error('目录树不能为空');
        if ($('.kn_power_person').css('display') == 'none') powerPerson = null;
        // 字符串转数组
        if (typeof treeId === 'string') {
            treeId = treeId.split(',');
            treeId.forEach((items, index) => treeId[index] = Number(items));
        }
        console.log(treeId);
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/knowlib/editFileHead'))
            .set("token",token)
            .send({
                id,
                name,
                treeId,
                isHide,
                isRelease,
                powerPerson,
            })
            .end((err,res) => {
                if(err) return;
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    this.fetchFileContent(id);
                    this.hideModal();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 渲染版本历史
    renderVersionLog = () => {
        const { versionLog } = this.state;
        if (versionLog.length === 0) return <Empty style={{marginTop: 6}} description={'暂无版本历史'} />;
        return versionLog.map(items => {
            return <div className={'kn_v_log'} key={items._id} style={{padding: 6, cursor: 'pointer',overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} onClick={e => {
                $('.kn_v_log').css('background', '#fff');
                if ($(e.target).hasClass('kn_v_log')) {
                    $(e.target).css('background', '#e6f7ff');
                } else {
                    $(e.target).parents('.kn_v_log').css('background', '#e6f7ff');
                }
                this.fetchOldVersionContent(items._id);
            }}>
                <span>{moment(items.shootingTime).format('YYYY-MM-DD HH:mm:ss')}：</span>
                <span style={{marginLeft: 6}}>{items.shootingPerson}</span>
                <span>{items.rem}</span>
            </div>;
        });
    }

    render() {
        const { isFullScreen, readMode } = this.state;
        const treeWidth = isFullScreen ? 0 : 200;
        const fileWidth = isFullScreen ? 0 : 300;
        const contentHeight = readMode ? '80%' : '99.5%';
        const versionLogHeight = readMode ? '19.5%' : '0px';
        const h = $('.sideMenuWrap').height();
        return <div style={{display: 'flex', height: '100%'}}>
            <div style={{width: treeWidth, height: h, borderRight: '1px solid #eee', overflow: 'auto'}}>{this.renderTree()}</div>
            <div style={{width: fileWidth, height: h, paddingTop: 8, borderRight: '1px solid #eee', overflow: 'auto'}}>{this.renderFileList()}</div>
            <div style={{flex: 1, height: h, overflow: 'auto'}}>
                <div style={{height: contentHeight, overflow: 'auto'}}>{this.renderContent()}</div>
                <div style={{height: versionLogHeight, borderTop: '1px solid #eee', overflow: 'auto'}}>{this.renderVersionLog()}</div>
            </div>
            <Modal
                title="文件信息"
                visible={this.state.showModal}
                onOk={this.subFileHeadInfo}
                onCancel={this.hideModal}
                okText="确认"
                cancelText="取消"
                >
                { this.modalContent }
            </Modal>
        </div>
    }
}

export default Knowledge;