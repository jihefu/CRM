import React from 'react';
import Member from './Member.jsx';

class MemberView extends Member {
    constructor(props) {
        super(props);
    }

    //@override
    actionRender(text, row, index){
        const user_id = sessionStorage.getItem('user_id');
        return <p className={"_mark"}>
                <a className={"_mark_a"} href="javascript:void(0)">标记</a>
            </p>;
    }
}

export default MemberView;