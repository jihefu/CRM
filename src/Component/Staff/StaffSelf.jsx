import React, { Component } from 'react';
import { Button,message,Form,Input,Table,Select,Tooltip,Checkbox,Popover } from 'antd';
import Staff from './Staff.jsx';
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

class StaffSelf extends Staff {
    constructor(props) {
        super(props);
    }

    //@override
    inputRender(){
        const { data,pagination } = this.state;
        return <div>
                    <Form style={{"display":"flex",padding: "24px 0 0 24px"}}>
                        <div style={{flex: 1,display:  'flex'}}>
                            <Popover placement={'bottomLeft'} content={this.filterContent()} trigger="hover">
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
                        {/* <Button type="primary" onClick={this.handleCreate} style={{"position":"relative","top":3,marginRight: 60}}>新增</Button> */}
                    </Form>
                    <div style={{position: 'relative',top: -15,left: 25}}>
                        {
                            this.tagsRender()
                        }
                    </div>
                </div>
    }

    //@override
    actionRender(text, row, index){
        const user_id = sessionStorage.getItem('user_id');
        if(row['user_id']==user_id){
            return <p className={"_mark"}>
                    <a href="javascript:void(0)">编辑</a>
                    <a className={"_mark_a"} style={{marginLeft: 10}} href="javascript:void(0)">标记</a>
                </p>;
        }else{
            return <p className={"_mark"}>
                    <a className={"_mark_a"} href="javascript:void(0)">标记</a>
                </p>;
        }
    }
}

export default StaffSelf;