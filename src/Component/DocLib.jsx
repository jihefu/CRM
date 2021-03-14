import React, { Component } from 'react';
import RemoteSearchInput from './common/RemoteSearchInput';
import { Icon, Button, message, Tree, Spin, Empty, Tag, Input, Upload, Popconfirm, TreeSelect, Modal, Form, Select, Switch } from 'antd';
import request from 'superagent';
import moment from 'moment';
import $ from 'jquery';
import 'moment/locale/zh-cn';
import common from '../public/js/common.js';
import '../public/css/knowlib.css';
import * as lodash from 'lodash';
import CustomerRemoteSelect from './Customers/CustomerRemoteSelect';
moment.locale('zh-cn');
const { TreeNode } = Tree;

class DocLib extends Component {
    constructor(props) {
        super(props);
        this.treeSelect = this.treeSelect.bind(this);
        this.showModal = this.showModal.bind(this);
        this.treeId = 0;
        this.modalContent = '';
        this.recycleBinId;
        this.recycleMode = false;
        this.infoClicked = false;
    }

    state = {
        isAffair: false,
        selectedKeys: [],
        treeData: [],
        fileList: [],
        selectItem: {},
        selectItemList: [],
        showModal: false,
        loadingList: false,
        searchParams: {
            showSearch: false,
            keywords: '',
            showMark: 0,
            showSelf: 0,
            showAll: 0,
            showByCreate: 1,
        },
        docSrc: '',
        isFullScreen: false,
        showShare: false,
        fileId: 0,
    };

    componentDidMount() {
        this.fetchTreeData();
        this.fetchRecycleBinId();
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
    fetchDocList(id) {
        const { searchParams } = this.state;
        this.setState({
            fileList: [],
            selectItem: {},
            loadingList: true,
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/docList'))
            .set("token",token)
            .query({id, ...searchParams})
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

    // 点击树节点
    treeSelect(v) {
        const { treeData } = this.state;
        if (v.length === 0) {
            this.treeId = 0;
            return;
        }
        this.treeId = v[0];
        this.fetchDocList(v[0]);
        this.setState({
            fileList: [],
            selectedKeys: v,
            docSrc: '',
            isAffair: checkIsAffairNode(this.treeId, treeData),
        });
        if (this.treeId == this.recycleBinId) {
            this.recycleMode = true;
        } else {
            this.recycleMode = false;
        }

        // 判断是否是事务节点
        function checkIsAffairNode(id, arr) {
            let isAffair = false;
            for (let i = 0; i < arr.length; i++) {
                for (let j = 0; j < arr[i].subTreeArr.length; j++) {
                    if (arr[i].subTreeArr[j].id == id && arr[i].subTreeArr[j].affairId) {
                        isAffair = true;
                        break;
                    }
                }
            }
            return isAffair;
        }
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

    // 渲染文件列表
    renderFileList() {
        const { loadingList, fileList, searchParams, isAffair } = this.state;
        const that = this;
        const user_id = sessionStorage.getItem('user_id');
        if (loadingList) return <Spin style={{display: 'flex', justifyContent: 'center'}} />
        if (this.recycleMode || isAffair) return <div>
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
                                    <Icon style={{marginLeft: 4}} title={markTitle} type="star" onClick={e => fileMark(items.id, e)} />
                                    <Icon style={{marginLeft: 4}} title={importantTitle} onClick={e => fileImportant(items.id, e)} type="pushpin" />
                                    <Icon style={{marginLeft: 4}} title={'删除'} onClick={e => delFile(items, items.id, e)} type="delete" />
                                    <Icon style={{marginLeft: 4}} onClick={that.showModal} type="info-circle" title={'编辑'} />
                                    { items.isRelease == 1 && <Icon style={{marginLeft: 4}} type="share-alt" title={'分享'} onClick={() => that.share(items.id)}/> }
                                </div>
                            </div>
                })
            }
        </div>

        function fileMark(id, e) {
            e.stopPropagation();
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/docMark'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchDocList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function fileImportant(id, e) {
            e.stopPropagation();
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/docSetImportant'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchDocList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function delFile(items, id, e) {
            e.stopPropagation();
            const { isImportant } = items;
            if (isImportant) return message.error('重要文件不允许删除');
            const { insertPerson } = items;
            // if (user_id!=insertPerson) return;
            const r = window.confirm('确定删除该文件？');
            if (!r) return;
            let token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/knowlib/delDoc'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchDocList(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function newFile() {
            const { showMark, keywords, showSearch, showSelf, showAll, showByCreate } = searchParams;
            function dealerSearch(e) {
                const keywords = e.target.value;
                searchParams.keywords = keywords;
                that.setState({
                    searchParams,
                });
                that.fetchDocList(that.treeId);
                if (keywords) return;
                searchParams.showSearch = false;
                that.setState({
                    searchParams,
                });
            }
            const uploadProps = {
                name: 'files',
                action: common.baseUrl('/knowlib/addDoc'),
                headers: {
                    token: sessionStorage.getItem('token'),
                },
                data: {
                    treeId: JSON.stringify([that.treeId]),
                },
                showUploadList: false,
                onChange(info) {
                    if (info.file.status === 'done') {
                        message.success(info.file.response.msg);
                        that.fetchDocList(that.treeId);
                    } else if (info.file.status === 'error') {
                        message.error(info.file.response.msg);
                    }
                },
            };
            return <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <div style={{paddingLeft: 6, cursor: 'pointer'}}>
                        <Upload {...uploadProps}>
                            <Icon type="file-add" />
                            <span style={{marginLeft: 6}}>新增</span>
                        </Upload>
                    </div>
                    <div style={{paddingRight: 6}}>
                        { !showSearch && <Icon type="search" title={'搜索'} onClick={() => {
                            searchParams.showSearch = true;
                            that.setState({
                                searchParams,
                            });
                        }} style={{cursor: 'pointer', marginLeft: 4}} /> }
                        { showSearch && <Input size={'small'} placeholder={'文档名'} defaultValue={keywords} style={{width: 150}} onPressEnter={e => dealerSearch(e)} onBlur={e => dealerSearch(e)} /> }
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
                            that.fetchDocList(that.treeId);
                        }} /> }

                        { showMark!=0 && <Icon type="star" title={'只看收藏'} style={{color: '#1790ff',cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showMark = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchDocList(that.treeId);
                        }} /> }
                        { showSelf==0 && <Icon type="bars" onClick={() => {
                            searchParams.showSelf = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchDocList(that.treeId);
                        }} title={'只看本目录'} style={{cursor: 'pointer', marginLeft: 4}} /> }
                        { showSelf!=0 && <Icon type="bars" onClick={() => {
                            searchParams.showSelf = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchDocList(that.treeId);
                        }} title={'只看本目录'} style={{cursor: 'pointer', marginLeft: 4, color: '#1790ff'}} /> }
                        { showAll==0 && <Icon type="eye" title={'显示所有文件'} style={{cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showAll = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchDocList(that.treeId);
                        }} /> }
                        { showAll!=0 && <Icon type="eye" title={'显示所有文件'} style={{cursor: 'pointer', marginLeft: 4, color: '#1790ff'}} onClick={() => {
                            searchParams.showAll = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchDocList(that.treeId);
                        }} /> }
                    </div>
                </div>
        }
    }

    share = id => {
        this.setState({
            showShare: true,
            fileId: id,
        });
    }

    // 点击指定文档
    fileSelect(items) {
        this.infoClicked = false;
        const { fileList, isAffair } = this.state;
        const refList = this.refs;
        for (const key in refList) {
            if (/^knfile_*/.test(key)) {
                this.refs[key].style.background = '#fff';
            }
        }
        this.refs['knfile_' + items.id].style.background = 'rgb(230, 247, 255)';
        $('.kn_bar').hide();

        if (items.isdel == 1) {
            this.recycleMode = true;
        } else {
            this.recycleMode = false;
        }

        $('.kn_bar_name').css('width', '100%');

        if (!this.recycleMode) {
            $(this.refs['knfile_' + items.id]).find('.kn_bar').show();
            $(this.refs['knfile_' + items.id]).find('.kn_bar_name').css('width', '146px');
        }
        // 判断是否是事务
        if (isAffair) {
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/knowlib/fetchSourceByAffairId'))
                .set("token",token)
                .query({
                    id: items.id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        const selectItem = res.body.data.length !== 0 ? res.body.data[0] : {};
                        this.setState({
                            selectItem,
                            selectItemList: res.body.data,
                            docSrc: this.getFileSrc(selectItem, isAffair),
                        });
                    } else {
                        message.error(res.body.msg);
                    }
                });
        } else {
            // 获取历史列表
            let token = sessionStorage.getItem('token');
            request.get(common.baseUrl('/knowlib/getFileHistoryList'))
                .set("token",token)
                .query({
                    id: items.id,
                })
                .end((err,res) => {
                    if(err) return;
                    const list = [items];
                    res.body.data.forEach(items => list.push(items));
                    this.setState({
                        selectItem: items,
                        selectItemList: list,
                        docSrc: this.getFileSrc(items, isAffair),
                    });
                });
        }
        if (this.recycleMode || isAffair) return;
        this.renderActiveTreeItem(items.treeId);
    }

    // 隐藏模态
    hideModal = () => {
        this.modalContent = '';
        this.setState({
            showModal: false,
        });
    }

    // 编辑文档信息
    showModal(e) {
        this.infoClicked = true;
        e.stopPropagation();
        const { selectItem, treeData } = this.state;
        if (!selectItem['id']) return message.warn('请先选择文件');
        this.setState({
            showModal: true,
        });
        const selectTreeData = getSelectTreeData(treeData);
        this.modalContent = <Form className={'kn_form'}>
            <Form.Item label="文件名" style={{display: 'flex', width: '100%'}}>
                <Input defaultValue={selectItem.name} onChange={e => {
                    const name = e.target.value;
                    selectItem.name = name;
                }} />
            </Form.Item>
            <Form.Item label="目录" style={{display: 'flex', width: '100%'}}>
                <TreeSelect
                    defaultValue={typeof selectItem.treeId === 'object' ? selectItem.treeId: selectItem.treeId.split(',')}
                    showSearch
                    multiple
                    treeData={selectTreeData}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    placeholder="Please select"
                    treeDefaultExpandAll
                    onChange={v => {
                        selectItem.treeId = v;
                        this.setState({
                            selectItem,
                        });
                    }}
                />
            </Form.Item>
            <Form.Item label="对外发布" style={{display: 'flex', width: '100%'}}>
                <Switch defaultChecked={selectItem.isRelease==1 ? true : false} onChange={v => {
                    v = v ? 1 : 0;
                    selectItem.isRelease = v;
                    this.setState({
                        selectItem,
                    });
                }} />
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
    }

    // 提交文档基本信息
    updateDocInfo = () => {
        let { id, name, treeId, isRelease } = this.state.selectItem;
        if (!name) return message.error('文件名不能为空');
        if (!treeId) {
            treeId = null;
        } else {
            treeId = typeof treeId == 'string' ? treeId.split(',') : treeId;
        }
        // if (!treeId) return message.error('目录树不能为空');
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/knowlib/updateDocInfo'))
            .set("token",token)
            .send({
                id,
                name,
                treeId,
                isRelease,
            })
            .end((err,res) => {
                if(err) return;
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    this.fetchDocList(this.treeId);
                    this.hideModal();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 获取文件渲染地址
    getFileSrc = (selectItem, isAffair) => {
        const { name, originalName, suffixName } = selectItem;
        const suffixNameArr = [ '.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx' ];
        let src;
        if (isAffair) {
            src = common.staticBaseUrl('/notiClient/'+originalName+suffixName);
        } else {
            src = common.staticBaseUrl('/selfDoc/'+originalName+suffixName);
        }
        if (suffixNameArr.indexOf(suffixName) !== -1) src = 'https://view.officeapps.live.com/op/view.aspx?src='+src;
        return src;
    }

    renderSelectFileList = selectItemList => {
        const { isAffair, selectItem, isFullScreen } = this.state;
        const that = this;
        const display = isFullScreen ? 'none' : 'block';
        return (
            <div style={{width: '100%', overflowX: 'auto', borderBottom: '1px solid #eee', display}}>
                <div style={{width: selectItemList.length * 63, height: 50}}>
                    {
                        selectItemList.map(items => (
                            <div style={{float: 'left', marginRight: 6, marginLeft: 6, cursor: 'pointer', color: isSelected(items)}} title={items.name} onClick={() => { this.selectItemListClick(items)}}>
                                { renderOrderFileType(items) }
                                <div style={{fontSize: 12, maxWidth: 50, textAlign: 'left', WebkitLineClamp: 1, wordBreak: 'break-all', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical'}}>{ items.name }</div>
                            </div>
                        ))
                    }
                </div>
            </div>
        )

        function renderOrderFileType(items) {
            if ([ '.xlsx', '.xls'].indexOf(items.suffixName) !== -1) {
                return <Icon type="file-excel" style={{fontSize: 38}} />
            } else if ([ '.doc', '.docx'].indexOf(items.suffixName) !== -1) {
                return <Icon type="file-word" style={{fontSize: 38}} />
            } else if ([ '.ppt', '.pptx'].indexOf(items.suffixName) !== -1) {
                return <Icon type="file-ppt" style={{fontSize: 38}} />
            } else if ([ '.pdf'].indexOf(items.suffixName) !== -1) {
                return <Icon type="file-pdf" style={{fontSize: 38}} />
            } else if ([ '.tar', '.gz', '.zip', '.rar'].indexOf(items.suffixName) !== -1) {
                return <Icon type="file-zip" style={{fontSize: 38}} />
            } else {
                return <Icon type="file-text" style={{fontSize: 38}} />
            }
        }

        function isSelected(items) {
            if (selectItem.id == items.id) return '#1890ff';
        }
    }

    selectItemListClick = items => {
        const { isAffair } = this.state;
        this.setState({
            selectItem: items,
            docSrc: this.getFileSrc(items, isAffair)
        });
    }

    // 渲染文档内容
    renderContent = () => {
        const { selectItem, docSrc, selectItemList, isAffair, isFullScreen } = this.state;
        const { name, id, suffixName, originalName } = selectItem;
        const that = this;
        if (!id) return <Empty />;
        const uploadProps = {
            name: 'files',
            action: common.baseUrl('/knowlib/uploadTempDoc'),
            headers: {
                token: sessionStorage.getItem('token'),
            },
            data: {
                id,
            },
            showUploadList: false,
            onChange: info => {
                if (info.file.status === 'done') {
                    replaceOper(info);
                } else if (info.file.status === 'error') {
                    message.error(info.file.response.msg);
                }
            },
        };

        const pushUploadProps = lodash.cloneDeep(uploadProps);
        pushUploadProps.onChange = info => {
            if (info.file.status === 'done') {
                pushOper(info);
            } else if (info.file.status === 'error') {
                message.error(info.file.response.msg);
            }
        };

        // 上传成功后替换操作
        const replaceOper = info => {
            const originalname = info.file.response.data[0];
            const r = window.confirm('上传成功，确定替换？');
            if (!r) {
                return;
            }
            const token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/replaceFile'))
                .set("token",token)
                .send({
                    id,
                    originalname,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code === 200) {
                        message.success(res.body.msg);
                        selectItem.originalName = originalname.slice(0, originalname.lastIndexOf('.'));
                        selectItem.suffixName = originalname.slice(originalname.lastIndexOf('.'), originalname.length);
                        that.setState({
                            selectItem,
                        }, () => {
                            const newSrc = that.getFileSrc(selectItem);
                            $('.doc_iframe').attr('src', newSrc);
                        });
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        // 上传成功后push操作
        const pushOper = info => {
            const originalname = info.file.response.data[0];
            const r = window.confirm('上传成功，确定更新？');
            if (!r) {
                return;
            }
            const token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/pushFile'))
                .set("token",token)
                .send({
                    id,
                    originalname,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code === 200) {
                        message.success(res.body.msg);
                        selectItem.originalName = originalname.slice(0, originalname.lastIndexOf('.'));
                        selectItem.suffixName = originalname.slice(originalname.lastIndexOf('.'), originalname.length);
                        that.setState({
                            selectItem,
                        }, () => {
                            const newSrc = that.getFileSrc(selectItem);
                            $('.doc_iframe').attr('src', newSrc);
                        });
                        this.fileSelect(selectItem);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        return <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                    <div style={{width: '100%', height: 34}}>
                        <span style={{position: 'relative', left: 6, top: 7, color: '#999'}}>更新人：{selectItem.updatePersonName}</span>
                        <span style={{position: 'relative', left: 41, top: 7, color: '#999'}}>更新时间：{moment(selectItem.updateTime).format('YYYY-MM-DD HH:mm:ss')}</span>
                        { !isAffair && !that.recycleMode && <span style={{fontSize: 23, cursor: 'pointer', textAlign: 'right', float: 'right'}}>
                            { !selectItem.isHistory && <Upload {...uploadProps}>
                                <Icon type="cloud-upload" style={{marginLeft: 6, fontSize: 23}} title={'上传替换'} />
                            </Upload> }
                            { !selectItem.isHistory && <Upload {...pushUploadProps}>
                                <Icon type="retweet" style={{marginLeft: 6, fontSize: 23}} title={'上传更新'} />
                            </Upload> }
                            <Icon type="download" style={{marginLeft: 6}} title={'下载'} onClick={() => {
                                const filePath = '/selfDoc/'+originalName+suffixName;
                                window.location.href = common.staticBaseUrl('/downloadFile?filePath='+filePath);
                            }}/>
                        </span>}
                        { !isAffair && that.recycleMode && <span style={{fontSize: 23, cursor: 'pointer', textAlign: 'right', float: 'right'}}>
                            <Icon type="rollback" style={{marginLeft: 6}} title={'还原'} onClick={() => {
                                const r = window.confirm('确定还原？');
                                if (r) {
                                    let token = sessionStorage.getItem('token');
                                    request.put(common.baseUrl('/knowlib/recycleBinDocRollback'))
                                        .set("token",token)
                                        .send({
                                            id: selectItem.id,
                                        })
                                        .end((err,res) => {
                                            if(err) return;
                                            message.success(res.body.msg);
                                            that.fetchDocList(that.treeId);
                                        });
                                }
                            }} />
                        </span> }
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
                        </span>
                    </div>
                    { this.renderSelectFileList(selectItemList) }
                    <div style={{flex: 1, overflow: 'auto'}}>
                        { docSrc!='' && downloadTop(suffixName) }
                    </div>
                </div>;
        
        function downloadTop(suffixName) {
            if ( ['.gz', '.rar', '.zip', '.tdf' ].indexOf(suffixName) !== -1) {
                if (that.infoClicked) {
                    return <div></div>;
                }
                const r = window.confirm('是否下载？');
                if (r) {
                    return <iframe className={'doc_iframe'} style={{width: '100%', height: '99%'}} src={docSrc} frameBorder={0}></iframe>;
                }
                return <div></div>;
            }
            return <iframe className={'doc_iframe'} style={{width: '100%', height: '99%'}} src={docSrc} frameBorder={0}></iframe>;
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

    render() {
        const { isFullScreen, showShare, fileId } = this.state;
        const treeWidth = isFullScreen ? 0 : 200;
        const fileWidth = isFullScreen ? 0 : 300;
        const h = $('.sideMenuWrap').height();
        return <div style={{display: 'flex', height: '100%'}}>
            <div style={{width: treeWidth, height: h, borderRight: '1px solid #eee', overflow: 'auto'}}>{this.renderTree()}</div>
            <div style={{width: fileWidth, height: h, paddingTop: 8, borderRight: '1px solid #eee', overflow: 'auto'}}>{this.renderFileList()}</div>
            <div style={{flex: 1, height: h, overflow: 'auto'}}>{this.renderContent()}</div>
            <Modal
                title="文档信息"
                visible={this.state.showModal}
                onOk={this.updateDocInfo}
                onCancel={this.hideModal}
                okText="确认"
                cancelText="取消"
                >
                { this.modalContent }
            </Modal>
            <CustomerRemoteSelect 
                showShare={showShare}
                fileIdArr={[fileId]}
                type={'doc'}
                close={() => this.setState({ showShare: false })}
            ></CustomerRemoteSelect>
        </div>
    }
}

export default DocLib;