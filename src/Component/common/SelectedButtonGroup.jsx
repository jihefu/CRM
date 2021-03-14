import React, { Component } from 'react';
import { Button } from 'antd';

const ButtonGroup = Button.Group;

class SelectedButtonGroup extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { style, funArr } = this.props;
        return (
            <div style={style}>
                <ButtonGroup>
                    {
                        funArr.map(v => <Button onClick={v.onClick} key={v.text} value={v.text}>{v.text}</Button>)
                    }
                </ButtonGroup>
            </div>
        )
    }
}

export default SelectedButtonGroup;