import $ from 'jquery';
const common = {};
common.debug = true;
common.baseUrl = (url) => 'http://192.168.50.230:8090/home'+url;
common.baseUrl2 = (url) => 'http://192.168.50.230:8090'+url;
common.staticBaseUrl = (url) => 'http://192.168.50.230:8090'+url;
common.socketCallUrl = () => 'http://192.168.50.230:8899/call';
common.cloudVtcUrl = url => 'http://192.168.50.230:7002'+url;
common.apiUrl = url => 'http://192.168.50.230:8001'+url;

common.apiAddr = 'https://api.langjie.com';

common.powerCheckMeetOrder = [ '101', '1702', '1603', '2004', '2005' ];

common.getRequest = (name) => {
    let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
	let r = window.location.search.substr(1).match(reg);
    if(window.top!=window.self){
    	return r[1];
    }
    if (r != null) {
		
    }
    return null;
}

common.removeAffairOrder = () => {
	return ['101','1702'];
}

common.hasAppUserArr = ["1003","1103","1301","1302","1305","1502","1804"];

common.myAffairsSortMap = () => {
	return {
		'紧急': 30,
		'重要': 20,
		'普通': 10,
		'暂缓': 0,
		'hasOuterContact': 4,
		'responsible': 9999,
		'attention': 4,
		'join': 1111,
		'overTime': 4,
		'nearTime': 2,
		'atMe': 2,
		'vote': 1
	};
	// return {
	// 	'紧急': 30,
	// 	'重要': 20,
	// 	'普通': 10,
	// 	'暂缓': 0,
	// 	'hasOuterContact': 4,
	// 	'responsible': 8,
	// 	'attention': 4,
	// 	'join': 2,
	// 	'overTime': 4,
	// 	'nearTime': 2,
	// 	'atMe': 2,
	// 	'vote': 1
	// };
}

/**
 * 	数组去重
 */
common.arrayUnique = (arr) => {
	Array.prototype.unique = () => {
		var res = [];
		var json = {};
		for(var i = 0; i < this.length; i++){
		    if(!json[this[i]]){
		   		res.push(this[i]);
		   		json[this[i]] = 1;
		  	}
		}
		return res;
	}
	return arr.unique();
}

/**
 *  表格th右对齐
 */
common.textRight = (arr) => {
	$('.ant-table-fixed thead th').each(i => {
		const ele = $('.ant-table-fixed thead th').eq(i);
		const t = ele.find('div').text();
		let right = '10px';
		if(navigator.userAgent.indexOf('Edge')!=-1){
			right = '15px';
		}
		if(arr.indexOf(t)!=-1) ele.css({
			'text-align': 'right',
			// 'position': 'relative',
			// 'right': right
		});
	});
}

/**
 * 分解掩码
 */
common.getCodeArr = num => {
	if (num > 15 || num < 0 || num == 0) return [ 0 ];
	const standArr = [ 1, 2, 4, 8 ];
	const str = parseInt(num).toString(2);
	const resArr = [];
	let newStrArr = [];
	for (let i = 0; i < str.length; i++) {
		newStrArr.unshift(str[i]);
	}
	for (let i = 0; i < newStrArr.length; i++) {
		if (newStrArr[i] == 1) resArr.push(standArr[i]);
	}
	return resArr;
	// const arr = [];
	// let standArr = [ 0, 1, 2, 4, 8 ];
	// if (dealer(num, standArr)) return arr;

	// function dealer(num, standArr) {
	// 	if (standArr.indexOf(num) !== -1) {
	// 		arr.push(num);
	// 		return true;
	// 	}
	// 	for (let i = 0; i < standArr.length; i++) {
	// 		if (num > standArr[i] && (i === standArr.length - 1 || num < standArr[i + 1])) {
	// 			arr.push(standArr[i]);
	// 			num = num - standArr[i];
	// 			standArr = standArr.slice(0, i);
	// 			break;
	// 		}
	// 	}
	// 	return dealer(num, standArr);
	// }
}

/**
 * 表格固定高度适应
 */
common.resizeTableHeight = () => {
	setTimeout(() => {
		dealer();
	}, 100);

	setTimeout(() => {
		dealer();
	}, 500);

	function dealer() {
		const trCollection = $('.ant-table-scroll tbody tr');
		for (let i = 0; i < trCollection.length; i++) {
			if (trCollection.eq(i).hasClass('ant-table-expanded-row-level-1')) {
				const dataRowKey = trCollection.eq(i).attr('data-row-key');
				const height = trCollection.eq(i).height();
				$('.ant-table-fixed-right .ant-table-body-outer .ant-table-fixed .ant-table-expanded-row-level-1[data-row-key="'+dataRowKey+'"]').height(height);
			}
		}
	}
}

function checkCodeIn(num, orderNum) {
    const bitNum = Math.log2(orderNum);
    const str = parseInt(num).toString(2);
	return Boolean(Number(str[str.length - 1]));
}

console.log(checkCodeIn(4, 2));

common.solutionOtherId = common.debug ? 15 : 23;
common.gcId = common.debug ? 36 : 44;

common.getLevel = () => {
	const user_id = sessionStorage.getItem('user_id');
	if (user_id == 1302) {
		return 4;
	}
	return 6;
}

export default common;