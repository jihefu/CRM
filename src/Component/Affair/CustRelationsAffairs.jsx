import React, { Component } from 'react';
import { Link,hashHistory } from 'react-router';
import AffairsList from './AffairsList.jsx';


class CustRelationsAffairs extends Component {
	constructor(props) {
        super(props);
        this.id;
    }

    componentDidMount(){
        const data = this.props.location.state;
        this.paramsData = data;
    }

    render(){
        return(
            <AffairsList paramsData={this.paramsData} department={"客户关系部"}></AffairsList>
        )
    }
}

export default CustRelationsAffairs;