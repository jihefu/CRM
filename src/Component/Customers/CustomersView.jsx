import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import { Button,message,Form,Input,Table,Tooltip,Select,Popover,Tag,Popconfirm } from 'antd';
import Customers from './Customers.jsx';
const Option = Select.Option;

class CustomersView extends Customers {
    constructor(props){
        super(props);
        this.actionWidth = 100;
    }

    //@override
	actionRender(text, row, index){
        return <p className={"_mark"}>
                    <a className={"_mark_a"} href="javascript:void(0)">标记</a>
                </p>;
    }

    //@override
    inputRender(){
        const { data,pagination } = this.state;
        return <div>
                    <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Popover content={this.filterContent()} trigger="hover">
                                <Button style={{"marginRight": 15,"top": 4}}>{"筛选"}</Button>
                            </Popover>
                            <Form.Item>
                                <Input name="keywords" style={{width: 300}} placeholder={this.placeholder} defaultValue={pagination.keywords}/>
                            </Form.Item>
                            <Button type="primary" onClick={this.handleSearch} style={{"position":"relative","left":15,"top":3}}>搜索</Button>
                            <span style={{marginLeft: 50}}>
                                <Select defaultValue={pagination.order} onChange={this.orderChange} style={{"position":"relative","top":3,minWidth: 120}}>
                                    {
                                        this.options.map(items => 
                                            <Option key={items.value} value={items.value}>{items.text}</Option>
                                        )
                                    }
                                </Select>
                            </span>
                        </div>
                        <Popconfirm placement="bottomRight" title={this.exportItem()} onConfirm={this.subExportExcel} okText="Yes" cancelText="No">
                            <Button style={{"position":"relative","top":3,marginRight: 30}}>导出Excel</Button>
                        </Popconfirm>
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }
}

export default CustomersView;