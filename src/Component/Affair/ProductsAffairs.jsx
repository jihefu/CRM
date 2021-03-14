import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import CustRelationsAffairs from './CustRelationsAffairs.jsx';
import AffairsList from './AffairsList.jsx';


class ProductsAffairs extends CustRelationsAffairs {
	constructor(props) {
        super(props);
    }

    componentDidMount(){
        const data = this.props.location.state;
        this.paramsData = data;
    }

    render(){
        return(
            <AffairsList paramsData={this.paramsData} department={"生产部"}></AffairsList>
        )
    }
}

export default ProductsAffairs;