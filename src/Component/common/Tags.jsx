import React, { Component } from 'react';
import { Tag, Input, Tooltip, Icon } from 'antd';

class Tags extends Component {
    constructor(props) {
        super(props);
    }

    state = {
	    tags: this.props.tagList,
	    inputVisible: false,
	    inputValue: '',
	};

	//删除标签
	handleClose = (removedTag) => {
	    const tags = this.state.tags.filter(tag => tag !== removedTag);
	    this.props.remove(tags);
	    this.setState({ tags });
	}

	showInput = () => {
		this.setState({ inputVisible: true }, () => this.input.focus());
	}

	handleInputChange = (e) => {
		this.setState({ inputValue: e.target.value });
	}
	//新增标签
	handleInputConfirm = () => {
		const state = this.state;
		const inputValue = state.inputValue;
		let tags = state.tags;
		if (inputValue && tags.indexOf(inputValue) === -1) {
		  	tags = [...tags, inputValue];
		}
		this.props.add(tags);
		this.setState({
			tags,
			inputVisible: false,
			inputValue: '',
		});
	}
	componentWillReceiveProps(props){
        this.setState({
            tags: props.tagList
        });
    }

  saveInputRef = input => this.input = input

  render() {
    const { tags, inputVisible, inputValue } = this.state;
    return (
      <div>
        {tags.map((tag, index) => {
          const isLongTag = tag.length > 20;
          const tagElem = (
            <Tag key={tag} closable={true} afterClose={() => this.handleClose(tag)}>
              {isLongTag ? `${tag.slice(0, 20)}...` : tag}
            </Tag>
          );
          return isLongTag ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip> : tagElem;
        })}
        {inputVisible && (
          <Input
            ref={this.saveInputRef}
            type="text"
            size="small"
            style={{ width: 78 }}
            value={inputValue}
            onChange={this.handleInputChange}
            onBlur={this.handleInputConfirm}
            onPressEnter={this.handleInputConfirm}
          />
        )}
        {!inputVisible && (
          <Tag
            onClick={this.showInput}
            style={{ background: '#fff', borderStyle: 'dashed' }}
          >
            <Icon type="plus" />新增
          </Tag>
        )}
      </div>
    );
  }
}

export default Tags;