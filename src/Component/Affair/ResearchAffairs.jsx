import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import AffairsList from './AffairsList.jsx';
import CustRelationsAffairs from './CustRelationsAffairs.jsx';


class ResearchAffairs extends CustRelationsAffairs {
	constructor(props) {
        super(props);
        this.paramsData;
    }

    componentDidMount(){
        const data = this.props.location.state;
        this.paramsData = data;
    }

    render(){
        return(
            <AffairsList paramsData={this.paramsData} department={"研发部"}></AffairsList>
        )
    }
}

export default ResearchAffairs;