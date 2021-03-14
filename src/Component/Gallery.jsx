import React, { Component } from 'react';
import RemoteSearchInput from './common/RemoteSearchInput';
import copy from 'copy-to-clipboard';
import { Icon, Button, message, Tree, Spin, Empty, Table, Tag, Input, Upload, Popconfirm, Divider, TreeSelect, Switch, Modal, Form, Select } from 'antd';
import request from 'superagent';
import moment from 'moment';
import $ from 'jquery';
import PhotoLooker from './common/PhotoLooker.jsx';
import 'moment/locale/zh-cn';
import common from '../public/js/common.js';
import '../public/css/knowlib.css';
import CustomerRemoteSelect from './Customers/CustomerRemoteSelect';
moment.locale('zh-cn');
const { TreeNode } = Tree;
const { TextArea } = Input;

class Gallery extends Component {
    constructor(props) {
        super(props);
        this.treeSelect = this.treeSelect.bind(this);
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.changeGalleryInfo = this.changeGalleryInfo.bind(this);
        this.saveAlbum = this.saveAlbum.bind(this);
        this.treeId = 0;
        this.modalContent = '';
        this.canRenderPhoto = false;
        this.recycleBinId;
        this.recycleMode = false;
    }

    state = {
        isAffair: false,
        selectedKeys: [],
        treeData: [],
        fileList: [],
        selectItem: {},
        readMode: true,
        loadingList: false,
        searchParams: {
            showSearch: false,
            keywords: '',
            showMark: 0,
            showSelf: 0,
            showAll: 0,
            showByCreate: 1,
        },
        showModal: false,
        picturesWall: {
            previewVisible: false,
            previewImage: '',
            fileList: [],
        },
        albumBorwerArr: [],
        imgSrc: '',
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

    // 获取图库列表
    fetchGalleryGroup(id) {
        const { searchParams, picturesWall } = this.state;
        picturesWall.fileList = [];
        this.setState({
            fileList: [],
            selectItem: {},
            loadingList: true,
            picturesWall,
        });
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getGalleryGroup'))
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

    // 获取指定item
    fetchOrderItem(id) {
        const { fileList, picturesWall } = this.state;
        picturesWall['fileList'] = [];
        let token = sessionStorage.getItem('token');
        request.get(common.baseUrl('/knowlib/getGalleryGroupItem'))
            .set("token",token)
            .query({ id })
            .end((err,res) => {
                if(err) return;
                res.body.data.GallerySubs.forEach((items, index) => {
                    const url = String(items.id).length < 10 ? common.staticBaseUrl('/img/gallery/list_' + items.album) : common.staticBaseUrl('/img/notiClient/small_' + items.album);
                    picturesWall['fileList'][index] = {
                        id: items.id,
                        uid: items.id,
                        name: items.album,
                        status: 'done',
                        url,
                        size: items.size,
                        description: items.description,
                        shootingTime: moment(items.shootingTime).format('YYYY-MM-DD HH:mm:ss'),
                    };
                });
                this.setState({
                    fileList,
                    selectItem: res.body.data,
                    picturesWall,
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

    // 点击树节点
    treeSelect(v) {
        const { readMode, treeData } = this.state;
        if (!readMode) return;
        if (v.length === 0) {
            this.treeId = 0;
            return;
        }
        this.treeId = v[0];
        this.fetchGalleryGroup(v[0]);
        this.setState({
            fileList: [],
            selectedKeys: v,
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
                    onSelect={this.treeSelect}
                    selectedKeys={selectedKeys}
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
                        markTitle = '取消收藏';
                        color = 'rgb(248, 205, 43)';
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
                                    <Icon style={{marginLeft: 4}} title={importantTitle} onClick={e => fileImportant(items.id, e)} type="pushpin" />
                                    <Icon style={{marginLeft: 4}} title={'删除'} onClick={() => delFile(items, items.id)} type="delete" />
                                    <Icon style={{marginLeft: 4}} onClick={that.showModal} type="info-circle" title={'编辑'} />
                                    { items.isRelease == 1 && <Icon style={{marginLeft: 4}} type="share-alt" title={'分享'} onClick={() => that.share(items.id)}/> }
                                </div>
                            </div>
                })
            }
        </div>

        function fileMark(id) {
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/galleryMark'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchGalleryGroup(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function fileImportant(id, e) {
            e.stopPropagation();
            let token = sessionStorage.getItem('token');
            request.put(common.baseUrl('/knowlib/gallerySetImportant'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchGalleryGroup(that.treeId);
                    } else {
                        message.error(res.body.msg);
                    }
                });
        }

        function delFile(items, id) {
            const { isImportant } = items;
            if (isImportant) return message.error('重要文件不允许删除');
            const { insertPerson } = items;
            if (user_id!=insertPerson) return;
            const r = window.confirm('确定删除该文件？');
            if (!r) return;
            let token = sessionStorage.getItem('token');
            request.delete(common.baseUrl('/knowlib/delGalleryGroup'))
                .set("token",token)
                .send({
                    id,
                })
                .end((err,res) => {
                    if(err) return;
                    if (res.body.code == 200) {
                        message.success(res.body.msg);
                        that.fetchGalleryGroup(that.treeId);
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
                that.fetchGalleryGroup(that.treeId);
                if (keywords) return;
                searchParams.showSearch = false;
                that.setState({
                    searchParams,
                });
            }
            return <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <Popconfirm placement="bottomLeft" title={<Input placeholder={'请输入图库名'} ref={'newFileName'} />} onConfirm={e => {
                            const v = that.refs.newFileName.state.value;
                            if (!v) return;
                            let token = sessionStorage.getItem('token');
                            request.post(common.baseUrl('/knowlib/createGalleryGroup'))
                                .set("token",token)
                                .send({
                                    name: v,
                                    treeId: [that.treeId],
                                })
                                .end((err,res) => {
                                    if(err) return;
                                    if (res.body.code === 200) {
                                        message.success(res.body.msg);
                                        that.fetchGalleryGroup(that.treeId);
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
                            that.fetchGalleryGroup(that.treeId);
                        }} /> }

                        { showMark!=0 && <Icon type="star" title={'只看收藏'} style={{color: '#1790ff',cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showMark = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchGalleryGroup(that.treeId);
                        }} /> }
                        { showSelf==0 && <Icon type="bars" onClick={() => {
                            searchParams.showSelf = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchGalleryGroup(that.treeId);
                        }} title={'只看本目录'} style={{cursor: 'pointer', marginLeft: 4}} /> }
                        { showSelf!=0 && <Icon type="bars" onClick={() => {
                            searchParams.showSelf = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchGalleryGroup(that.treeId);
                        }} title={'只看本目录'} style={{cursor: 'pointer', marginLeft: 4, color: '#1790ff'}} /> }
                        { showAll==0 && <Icon type="eye" title={'显示所有文件'} style={{cursor: 'pointer', marginLeft: 4}} onClick={() => {
                            searchParams.showAll = 1;
                            that.setState({
                                searchParams,
                            });
                            that.fetchGalleryGroup(that.treeId);
                        }} /> }
                        { showAll!=0 && <Icon type="eye" title={'显示所有文件'} style={{cursor: 'pointer', marginLeft: 4, color: '#1790ff'}} onClick={() => {
                            searchParams.showAll = 0;
                            that.setState({
                                searchParams,
                            });
                            that.fetchGalleryGroup(that.treeId);
                        }} /> }
                        {/* { !showSearch && <Icon type="search" title={'搜索'} onClick={() => {
                            searchParams.showSearch = true;
                            that.setState({
                                searchParams,
                            });
                        }} style={{cursor: 'pointer', marginLeft: 4}} /> }
                        { showSearch && <Input size={'small'} placeholder={'图库名'} defaultValue={keywords} style={{width: 150}} onPressEnter={e => dealerSearch(e)} onBlur={e => dealerSearch(e)} /> } */}
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

    // 点击指定图库
    fileSelect(items) {
        const { readMode, picturesWall } = this.state;
        const { fileList } = picturesWall;
        if (!readMode) return;
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
            $(this.refs['knfile_' + items.id]).find('.kn_bar_name').css('width', '146px');
            $(this.refs['knfile_' + items.id]).find('.kn_bar').show();
        }
        this.fetchOrderItem(items.id);

        if (this.recycleMode) return;
        this.renderActiveTreeItem(items.treeId);
    }

    // 编辑图库信息
    showModal() {
        const { selectItem, treeData } = this.state;
        // if (!selectItem['id']) return message.warn('请先选择文件');
        const user_id = sessionStorage.getItem('user_id');
        // const { insertPerson } = selectItem;
        // if (insertPerson!=user_id) return message.warn('暂无权限');
        this.setState({
            showModal: true,
        });
        const selectTreeData = getSelectTreeData(treeData);
        this.modalContent = <Form className={'kn_form'}>
            <Form.Item label="文件名" style={{display: 'flex', width: '100%'}}>
                <Input defaultValue={selectItem.name} onChange={e => {
                    const name = e.target.value;
                    selectItem.name = name;
                    this.setState({
                        selectItem,
                    });
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
            <Form.Item label="描述" style={{display: 'flex', width: '100%'}}>
                <TextArea rows={4} defaultValue={selectItem.description} onChange={e => {
                    const description = e.target.value;
                    selectItem.description = description;
                    this.setState({
                        selectItem,
                    });
                }} />
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

    // 隐藏模态
    hideModal() {
        this.modalContent = '';
        this.setState({
            showModal: false,
        });
    }

    // 提交图库信息
    changeGalleryInfo() {
        let { id, name, treeId, description, isRelease } = this.state.selectItem;
        if (!name) return message.error('文件名不能为空');
        // if (!treeId) return message.error('目录树不能为空');
        if (!treeId) {
            treeId = null;
        } else {
            treeId = typeof treeId == 'string' ? treeId.split(',') : treeId;
        }
        let token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/knowlib/changeGalleryInfo'))
            .set("token",token)
            .send({
                id,
                name,
                treeId,
                description,
                isRelease,
            })
            .end((err,res) => {
                if(err) return;
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    this.fetchGalleryGroup(this.treeId);
                    this.hideModal();
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    // 渲染内容
    renderContent() {
        const { loadingList, readMode, selectItem, picturesWall, isAffair } = this.state;
        const that = this;
        if (loadingList) return <Spin style={{display: 'flex', justifyContent: 'center'}} />
        if (!selectItem.id) return <Empty />;
        if (readMode) return renderReadMode();
        return renderEditMode();

        // 阅读模式
        function renderReadMode() {
            const w = $('.ant-layout-content').width()-920;
            return <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                        <div style={{width: '100%'}}>
                            <span style={{float: 'left', color: '#999', marginLeft: 6, marginTop: 7}}>更新人：{selectItem.updatePersonName}</span>
                            <span style={{float: 'left', color: '#999', marginLeft: 35, marginTop: 7}}>更新时间：{moment(selectItem.updateTime).format('YYYY-MM-DD HH:mm:ss')}</span>
                            <span title={selectItem.description} style={{width: w,float: 'left', color: '#999', marginLeft: 35, marginTop: 7,overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>描述：{selectItem.description}</span>
                            <span style={{fontSize: 23, cursor: 'pointer', textAlign: 'right', float: 'right', display: isAffair ? 'none' : 'block'}}>
                                { !that.recycleMode && <Icon type="edit" style={{marginLeft: 6}} title={'编辑'} onClick={() => {
                                    that.setState({
                                        readMode: false,
                                    });
                                    that.fetchOrderItem(selectItem.id);
                                }} /> }

                                { that.recycleMode && <Icon type="rollback" style={{marginLeft: 6}} title={'还原'} onClick={() => {
                                    const r = window.confirm('确定还原？');
                                    if (r) {
                                        let token = sessionStorage.getItem('token');
                                        request.put(common.baseUrl('/knowlib/recycleBinGalleryRollback'))
                                            .set("token",token)
                                            .send({
                                                id: selectItem.id,
                                            })
                                            .end((err,res) => {
                                                if(err) return;
                                                message.success(res.body.msg);
                                                that.fetchGalleryGroup(that.treeId);
                                            });
                                    }
                                }} />}
                            </span>
                        </div>
                        <div style={{flex: 1, overflow: 'auto'}}>{renderArr()}</div>
                    </div>;
            
            function renderArr() {
                if (picturesWall.fileList.length === 0) return <Empty />;
                return picturesWall.fileList.map(items => {
                    if (items.name.indexOf('.mp4') === -1) {
                        const src = String(items.id).length < 10 ? '/img/gallery/list_' : '/img/notiClient/small_';
                        return <div style={{width: 110, margin: 6, display: 'inline-block'}} key={items.name}>
                                <img title={items.name} onClick={() => openImgLooker(items.name, items.id)} className={'gallery_img'} style={{cursor: 'pointer', margin: 6, border: '1px solid #eee', borderRadius: 4, boxShadow: '5px 5px 5px #ccc', width: 100}} key={items.name} src={common.staticBaseUrl(src+items.name)} />
                                <p style={{textAlign: 'center', wordBreak: 'break-all', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}} title={'复制'} onClick={() => {
                                    copy('{"class":"picture","name":"'+items.name+'"}', {
                                    // copy('<gallery>'+items.name+'</gallery>', {
                                        debug: true,
                                    });
                                    message.success(items.name + '复制成功');
                                }}>{items.name}</p>
                                {/* <p style={{textAlign: 'center'}}>{items.shootingTime}</p> */}
                            </div>
                    } else {
                        const src = '/img/gallery/' + items.name;
                        return <div style={{width: 310, margin: 6, display: 'inline-block'}} key={items.name}>
                                <video style={{width: 300}} controls="controls" key={items.name} src={common.staticBaseUrl(src)}></video>
                                <p style={{textAlign: 'center', wordBreak: 'break-all', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}} title={'复制'} onClick={() => {
                                    copy('{"class":"video","name":"'+items.name+'"}', {
                                        debug: true,
                                    });
                                    message.success(items.name + '复制成功');
                                }}>{items.name}</p>
                            </div>
                    }
                });
            }

            function openImgLooker(imgName, id) {
                const { fileList } = picturesWall;
                const albumBorwerArr = fileList.map(items => items.name);
                that.canRenderPhoto = true;
                that.setState({
                    albumBorwerArr,
                    imgSrc: String(id).length < 10 ? common.staticBaseUrl('/img/gallery/'+imgName) : common.staticBaseUrl('/img/notiClient/'+imgName),
                }, () => that.canRenderPhoto = false);
            }
        }

        // 编辑模式
        function renderEditMode() {
            const { picturesWall } = that.state;
            const { previewVisible, previewImage, fileList } = picturesWall;
            const token = sessionStorage.getItem('token');
            const uploadButton = (
                <div>
                    <Icon type="plus" />
                    <div className="ant-upload-text">Upload</div>
                </div>
            );

            function handleCancel() {
                picturesWall.previewVisible = false;
                that.setState({ 
                    picturesWall,
                });
            }

            function handlePreview(file) {
                let url;
                try {
                    const fileNameArr = file.url.split('list_');
                    url = fileNameArr[0] + fileNameArr[1];
                } catch (e) {
                    
                }
                picturesWall.previewImage = url || file.thumbUrl;
                picturesWall.previewVisible = true;
                that.setState({
                    picturesWall,
                });
            }

            function handleChange(res) {
                picturesWall.fileList = res.fileList;
                that.setState({ picturesWall });
            }

            return <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                        <div style={{width: '100%'}}>
                            <span style={{fontSize: 23, cursor: 'pointer', textAlign: 'right', float: 'right'}}>
                            <Icon type="save" style={{marginLeft: 6}} title={'保存'} onClick={that.saveAlbum} />
                            <Icon type="read" style={{marginLeft: 6}} title={'返回阅读模式'} onClick={() => {
                                that.setState({
                                    readMode: true,
                                    picturesWall,
                                });
                                that.fetchOrderItem(selectItem.id);
                            }} />
                            </span>
                        </div>
                        <div style={{flex: 1, overflow: 'auto', padding: 6}}>
                            <div className="clearfix">
                                <Upload
                                    action={common.baseUrl('/knowlib/uploadAlbum')}
                                    listType="picture-card"
                                    accept={'image/*, video/mp4'}
                                    headers={{
                                        token: token,
                                    }}
                                    name={'files'}
                                    multiple={true}
                                    fileList={fileList}
                                    onPreview={handlePreview}
                                    onChange={handleChange}
                                >
                                    {uploadButton}
                                </Upload>
                                <Modal visible={previewVisible} footer={null} onCancel={handleCancel}>
                                    <img alt="example" style={{ width: '100%' }} src={previewImage} />
                                </Modal>
                            </div>
                        </div>
                    </div>;
        }
    }

    // 提交图片
    saveAlbum() {
        const { picturesWall, selectItem } = this.state;
        const { fileList } = picturesWall;
        const { id } = selectItem;
        const inAlbumArr = [], newAlbumArr = [];
        fileList.forEach(items => {
            if (items.status === 'done') {
                if (items.url) {
                    inAlbumArr.push(items.uid);
                } else {
                    newAlbumArr.push(items.name);
                }
            }
        });
        const token = sessionStorage.getItem('token');
        request.put(common.baseUrl('/knowlib/changeAlbum'))
            .set("token",token)
            .send({
                id,
                albumArr: inAlbumArr.join(),
                newAlbumArr: newAlbumArr.join(),
            })
            .end((err,res) => {
                if(err) return;
                if (res.body.code === 200) {
                    message.success(res.body.msg);
                    this.setState({
                        readMode: true,
                    });
                    this.fetchOrderItem(id);
                } else {
                    message.error(res.body.msg);
                }
            });
    }

    resortList(cb) {
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
        }, () => {
            if (cb) cb();
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
        const { albumBorwerArr, imgSrc, showShare, fileId } = this.state;
        const h = $('.sideMenuWrap').height();
        return <div style={{display: 'flex', height: '100%'}}>
            <div style={{width: 200, height: h, borderRight: '1px solid #eee', overflow: 'auto'}}>{this.renderTree()}</div>
            <div style={{width: 300, height: h, paddingTop: 8, borderRight: '1px solid #eee', overflow: 'auto'}}>{this.renderFileList()}</div>
            <div style={{flex: 1, height: h, overflow: 'auto'}}>{this.renderContent()}</div>
            <Modal
                title="图库信息"
                visible={this.state.showModal}
                onOk={this.changeGalleryInfo}
                onCancel={this.hideModal}
                okText="确认"
                cancelText="取消"
                >
                { this.modalContent }
            </Modal>
            <PhotoLooker albumBorwerArr={albumBorwerArr} imgSrc={imgSrc} canRenderPhoto={this.canRenderPhoto}></PhotoLooker>
            <CustomerRemoteSelect 
                showShare={showShare}
                fileIdArr={[fileId]}
                type={'gallery'}
                close={() => this.setState({ showShare: false })}
            ></CustomerRemoteSelect>
        </div>
    }
}

export default Gallery;