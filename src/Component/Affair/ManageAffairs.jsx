import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import AffairsList from './AffairsList.jsx';
import CustRelationsAffairs from './CustRelationsAffairs.jsx';


class ManageAffairs extends CustRelationsAffairs {
	constructor(props) {
        super(props);
    }

    componentDidMount(){
        const data = this.props.location.state;
        this.paramsData = data;
    }

    render(){
        return(
            <AffairsList paramsData={this.paramsData} department={"管理部"}></AffairsList>
        )
    }
}

export default ManageAffairs;