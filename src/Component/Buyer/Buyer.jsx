import PublicRelationShip from '../PublicRelationShip/PublicRelationShip.jsx';

class Buyer extends PublicRelationShip {
    constructor(props) {
        super(props);
        this.fetchUrl = '/buyer';
        this.editPathName = '/buyerEdit';
        this.addPathName = '/buyerAdd';
        this.placeholder = '供应商名称';
        this.res_data = {
            company: {
                label: '供应商名',
                width: 200
            },
            user_id: {
                label: '单位号',
                width: 100
            },
            // main_contacts: {
            //     label: '主要联系人',
            //     width: 300
            // },
            // tax_id: {
            //     label: '机构代码',
            //     width: 200
            // },
            products: {
                label: '采购商品',
                width: 200
            },
            start_buy_time: {
                label: '初次采购时间',
                width: 150
            },
            total_amount: {
                label: '累计采购额',
                width: 100
            },
            present_amount: {
                label: '当年采购额',
                width: 100
            },
            // province: {
            //     label: '省份',
            //     width: 200
            // },
            // town: {
            //     label: '城镇',
            //     width: 200
            // },
            // reg_company: {label: '开票公司', width: 200},
            // reg_addr: {label: '开票地址', width: 200},
            // reg_tel: {label: '开票电话', width: 200},
            // bank_name: {label: '开户行', width: 200},
            // bank_account: {label: '银行账号', width: 200},
            // website: {label: '网站', width: 200},
            // email: {label: '邮箱', width: 200},
            // zip_code: {label: '邮政编码', width: 200},
            insert_person: {
                label: '录入人',
                width: 200
            },
            insert_time: {
                label: '录入时间',
                width: 200
            },
            update_person: {
                label: '更新人',
                width: 200
            },
            update_time: {
                label: '更新时间',
                width: 200
            },
        };
    }
}

export default Buyer;