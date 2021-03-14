import { Form } from 'antd';
import { PublicRealtionShipAddCls } from '../PublicRelationShip/PublicRelationShipAdd.jsx';

class BuyerAddCls extends PublicRealtionShipAddCls {
    constructor(props) {
        super(props);
        this.addPathname = '/buyer';
    }
}

const BuyerAdd = Form.create()(BuyerAddCls);

export default BuyerAdd;