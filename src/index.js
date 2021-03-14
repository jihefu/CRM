import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory, Redirect, IndexRoute, Link } from 'react-router';
import Center from './Component/Center.jsx';
import Login from './Component/Login.jsx';
import Output from './Component/Output/Output.jsx';
import OutputView from './Component/Output/OutputView.jsx';
import OutputAdd from './Component/Output/OutputAdd.jsx';
import OutputEdit from './Component/Output/OutputEdit.jsx';
import AuthManage from './Component/AuthManage.jsx';
import Index from './Component/Index.jsx';
import MenuManage from './Component/MenuManage.jsx';
import SaleChart from './Component/SaleChart.jsx';
import ContractsView from './Component/ContractsView.jsx';
import CreditView from './Component/CreditView.jsx';
import CreditViewReadonly from './Component/CreditViewReadonly.jsx';
import CreditRecordReadonly from './Component/CreditRecordReadonly.jsx';
import NewCustomers from './Component/NewCustomers.jsx';
import TypeDCustomers from './Component/TypeDCustomers.jsx';
import Payments from './Component/Payments/Payments.jsx';
import PaymentsEdit from './Component/Payments/PaymentsEdit.jsx';
import PaymentsAdd from './Component/Payments/PaymentsAdd.jsx';
import PaymentsReadonly from './Component/Payments/PaymentsReadonly.jsx';
import CreditRecord from './Component/CreditRecord.jsx';
import Customers from './Component/Customers/Customers.jsx';
import CustomersView from './Component/Customers/CustomersView.jsx';
import CustomerAdd from './Component/Customers/CustomerAdd.jsx';
import CustomerEdit from './Component/Customers/CustomerEdit.jsx';
import Contacts from './Component/Contacts/Contacts.jsx';
import ContactsView from './Component/Contacts/ContactsView.jsx';
import ContactAdd from './Component/Contacts/ContactAdd.jsx';
import ContactEdit from './Component/Contacts/ContactEdit.jsx';
import Staff from './Component/Staff/Staff.jsx';
import StaffSelf from './Component/Staff/StaffSelf.jsx';
import StaffAdd from './Component/Staff/StaffAdd.jsx';
import StaffEdit from './Component/Staff/StaffEdit.jsx';
import Member from './Component/Member/Member.jsx';
import MemberEdit from './Component/Member/MemberEdit.jsx';
import MemberView from './Component/Member/MemberView.jsx';
import Contracts from './Component/Contracts/Contracts.jsx';
import ContractsViewOnly from './Component/Contracts/ContractsViewOnly.jsx';
import ContractsViewOnlyLess from './Component/Contracts/ContractsViewOnlyLess.jsx';
import NoAuth from './Component/NoAuth.jsx';
import ContractEdit from './Component/Contracts/ContractEdit.jsx';
import ContractAdd from './Component/Contracts/ContractAdd.jsx';
import ContractAddAgain from './Component/Contracts/ContractAddAgain.jsx';
import ProductOrder from './Component/Contracts/ProductOrder.jsx';
import Repairs from './Component/Repairs/Repairs.jsx';
import RepairsView from './Component/Repairs/RepairsView.jsx';
import RepairEdit from './Component/Repairs/RepairEdit.jsx';
import RepairAdd from './Component/Repairs/RepairAdd.jsx';
import RepairStatistics from './Component/Repairs/RepairStatistics.jsx';
import QualityChart from './Component/Repairs/QualityChart.jsx';
import Goods from './Component/Goods/Goods.jsx';
import GoodsView from './Component/Goods/GoodsView.jsx';
import GoodsAdd from './Component/Goods/GoodsAdd.jsx';
import GoodsEdit from './Component/Goods/GoodsEdit.jsx';
import UserBorrowSteps from './Component/Goods/UserBorrowSteps.jsx';
import ManageBorrowSteps from './Component/Goods/ManageBorrowSteps.jsx';
import ContactsOrder from './Component/ContactsOrder/ContactsOrder.jsx';
import ContactsOrderEdit from './Component/ContactsOrder/ContactsOrderEdit.jsx';
import AttendanceManage from './Component/AttendanceManage.jsx';
import UploadSalary from './Component/UploadSalary.jsx';
import UploadCustomersStar from './Component/UploadCustomersStar.jsx';
import OverWorkManagePro from './Component/Sign/OverWorkManagePro.jsx';
import OverWorkManage from './Component/Sign/OverWorkManage.jsx';
import MyOverWork from './Component/Sign/MyOverWork.jsx';
import MyOverWorkEdit from './Component/Sign/MyOverWorkEdit.jsx';
import AttendanceInput from './Component/Sign/Attendance.jsx';
import SelfInfo from './Component/SelfInfo.jsx';
import CustRelationsAffairs from './Component/Affair/CustRelationsAffairs.jsx';
import AffairsAdd from './Component/Affair/AffairsAdd.jsx';
import ProjectAffair from './Component/Affair/ProjectAffair.jsx';
import SpecialLine from './Component/Affair/SpecialLine.jsx';

import ProductsAffairs from './Component/Affair/ProductsAffairs.jsx';
import ResearchAffairs from './Component/Affair/ResearchAffairs.jsx';
import ManageAffairs from './Component/Affair/ManageAffairs.jsx';
import MemberAffairs from './Component/Affair/MemberAffairs.jsx';

import PricingList from './Component/Pricing/PricingList.jsx';
import PricingEdit from './Component/Pricing/PricingEdit.jsx';
import PricingReadOnly from './Component/Pricing/PricingReadOnly.jsx';

import ProductsCost from './Component/ProductsCost/ProductsCost.jsx';
import ProductsCostAdd from './Component/ProductsCost/ProductsCostAdd.jsx';
import ProductsCostEdit from './Component/ProductsCost/ProductsCostEdit.jsx';

import WalletList from './Component/Wallet/WalletList.jsx';
import WalletBank from './Component/Wallet/WalletBank.jsx';
import Achievement from './Component/Achievement.jsx';
import OnlineAssessment from './Component/OnlineAssessment.jsx';

import softwareDynamics from './Component/SoftProject/softwareDynamics.jsx';
import softProjectCls from './Component/SoftProject/softProjectCls.jsx';
import softDeveloper from './Component/SoftProject/softDeveloper.jsx';
import softProjectCreate from './Component/SoftProject/softProjectCreate.jsx';
import softVersionList from './Component/SoftProject/softVersionList.jsx';
import softEvaluationAdd from './Component/SoftProject/softEvaluationAdd.jsx';
import softVersionCreate from './Component/SoftProject/softVersionCreate.jsx';
import softProjectPropsChange from './Component/SoftProject/softProjectPropsChange.jsx';
import SoftChildVersionCreate from './Component/SoftProject/SoftChildVersionCreate.jsx';

import SearchEngine from './Component/SearchEngine.jsx';
import ScreenShare from './Component/ScreenShare.jsx';

import Knowledge from './Component/Knowledge.jsx';
import Gallery from './Component/Gallery.jsx';
import DocLib from './Component/DocLib.jsx';
import KnTreeManage from './Component/Tree/KnTreeManage.jsx';

import PublicRelationShip from './Component/PublicRelationShip/PublicRelationShip.jsx';
import PublicRelationShipAdd from './Component/PublicRelationShip/PublicRelationShipAdd.jsx';
import PublicRelationShipEdit from './Component/PublicRelationShip/PublicRelationShipEdit.jsx';

import Buyer from './Component/Buyer/Buyer.jsx';
import BuyerAdd from './Component/Buyer/BuyerAdd.jsx';
import BuyerEdit from './Component/Buyer/BuyerEdit.jsx';

import EndUser from './Component/EndUser/EndUser.jsx';
import EndUserAdd from './Component/EndUser/EndUserAdd.jsx';
import EndUserEdit from './Component/EndUser/EndUserEdit.jsx';

import VerUnit from './Component/VerUnit/VerUnit.jsx';
import VerUnitEdit from './Component/VerUnit/VerUnitEdit.jsx';

import SmsTemp from './Component/SmsTemp.jsx';
import WxAppletManage from './Component/WxAppletManage.jsx';

import VirCfg from './Component/VirProducts/VirCfg.jsx';
import VirTemp from './Component/VirProducts/VirTemp.jsx';
import VirTempEdit from './Component/VirProducts/VirTempEdit.jsx';

import VirProducts from './Component/VirProducts/VirProducts.jsx';
import VirProductsEdit from './Component/VirProducts/VirProductsEdit.jsx';
import VirProductsInfo from './Component/VirProducts/VirProductsInfo.jsx';
import DynaProducts from './Component/DynaProducts/DynaProducts.jsx';
import DynaProductsInfo from './Component/DynaProducts/DynaProductsInfo.jsx';
import SnApply from './Component/SnApply.jsx';

import BusinessTrip from './Component/BusinessTrip/BusinessTrip.jsx';
import MyBusinessTrip from './Component/BusinessTrip/MyBusinessTrip.jsx';
import MyBusinessTripEdit from './Component/BusinessTrip/MyBusinessTripEdit.jsx';
import MyBusinessTripAdd from './Component/BusinessTrip/MyBusinessTripAdd.jsx';
import MeetOrdersManage from './Component/BusinessTrip/MeetOrdersManage.jsx';
import MeetOrdersImage from './Component/BusinessTrip/MeetOrdersImage.jsx';
import ContactOrdersAssessment from './Component/BusinessTrip/ContactOrdersAssessment.jsx';

import CloudVtc from './Component/CloudVtc.jsx';
import VirtualProducts from './Component/VirtualProducts.jsx';
import SourceMap from './Component/SourceMap.jsx';

import ProductWorkHours from './Component/ProductWorkHours.jsx';
import OtherProducts from './Component/OtherProducts/OtherProducts.jsx';
import OtherProductsInfo from './Component/OtherProducts/OtherProductsInfo.jsx';
import OtherProductsAdd from './Component/OtherProducts/OtherProductsAdd.jsx';
import VirProductsAdd from './Component/VirProducts/VirProductsAdd.jsx';
import DynaProductsAdd from './Component/DynaProducts/DynaProductsAdd.jsx';
import SimuCtrl from './Component/SimuCtrl/SimuCtrl.jsx';
import SimuCtrlAdd from './Component/SimuCtrl/SimuCtrlAdd.jsx';
import YBScore from './Component/Member/YBScore.jsx';
import YBScoreAdd from './Component/Member/YBScoreAdd.jsx';
import YBScoreEdit from './Component/Member/YBScoreEdit.jsx';
import YBScoreChart from './Component/Member/YBScoreChart.jsx';

import VehicleRegist from './Component/VehicleRegist.jsx';

import CloudDisk from './Component/CloudDisk/CloudDisk.jsx';
import BurnDisk from './Component/CloudDisk/BurnDisk.jsx';
import BurnDiskAdd from './Component/CloudDisk/BurnDiskAdd.jsx';
import BurnDiskEdit from './Component/CloudDisk/BurnDiskEdit.jsx';

import CashGift from './Component/Member/CashGift.jsx';
import CashGiftAdd from './Component/Member/CashGiftAdd.jsx';
import CashGiftEdit from './Component/Member/CashGiftEdit.jsx';

import FreeExchangeGift from './Component/Member/FreeExchangeGift.jsx';

import Seckill from './Component/Member/Seckill.jsx';
import SeckillEdit from './Component/Member/SeckillEdit.jsx';
import SeckillAdd from './Component/Member/SeckillAdd.jsx';

ReactDOM.render((
	<Router history={hashHistory}>
		<Route path="/login" component={Login} />
		<Route path="/" component={Center} >
			<IndexRoute component={Index} />
			<Route path="/searchEngine" component={SearchEngine} />
			<Route path="/index" component={Index} />
			<Route path="/projectAffair" component={ProjectAffair} />
			<Route path="/myOverWork" component={MyOverWork} />
			<Route path="/myOverWorkEdit" component={MyOverWorkEdit} />

			<Route path="/output" component={Output} />
			<Route path="/outputView" component={OutputView} />
			<Route path="/outputEdit" component={OutputEdit} />
			<Route path="/outputAdd" component={OutputAdd} />

			<Route path="/authManage" component={AuthManage} />
			<Route path="/menuManage" component={MenuManage} />

			<Route path="/saleChart" component={SaleChart} />
			<Route path="/contractsView" component={ContractsView} />
			<Route path="/creditView" component={CreditView} />
			<Route path="/creditViewReadonly" component={CreditViewReadonly} />
			<Route path="/newCustomers" component={NewCustomers} />
			<Route path="/typeDCustomers" component={TypeDCustomers} />
			<Route path="/payments" component={Payments} />
			<Route path="/paymentsEdit" component={PaymentsEdit} />
			<Route path="/paymentsAdd" component={PaymentsAdd} />
			<Route path="/paymentsReadonly" component={PaymentsReadonly} />
			<Route path="/creditRecord" component={CreditRecord} />
			<Route path="/creditRecordReadonly" component={CreditRecordReadonly} />

			<Route path="/specialLine" component={SpecialLine} />

			<Route path="/customers" component={Customers} />
			<Route path="/customersView" component={CustomersView} />
			<Route path="/customerAdd" component={CustomerAdd} />
			<Route path="/customerEdit" component={CustomerEdit} />

			<Route path="/contacts" component={Contacts} />
			<Route path="/contactsView" component={ContactsView} />
			<Route path="/contactEdit" component={ContactEdit} />
			<Route path="/contactAdd" component={ContactAdd} />

			<Route path="/staff" component={Staff} />
			<Route path="/staffSelf" component={StaffSelf} />
			<Route path="/staffEdit" component={StaffEdit} />
			<Route path="/staffAdd" component={StaffAdd} />
			
			<Route path="/member" component={Member} />
			<Route path="/memberCheck" component={MemberEdit} />
			<Route path="/memberView" component={MemberView} />

			<Route path="/contracts" component={Contracts} />
			<Route path="/contractsViewOnly" component={ContractsViewOnly} />
			<Route path="/contractsViewOnlyLess" component={ContractsViewOnlyLess} />
			<Route path="/contractEdit" component={ContractEdit} />
			<Route path="/contractAdd" component={ContractAdd} />
			<Route path="/contractAddAgain" component={ContractAddAgain} />
			<Route path="/productOrder" component={ProductOrder} />

			<Route path="/repairs" component={Repairs} />
			<Route path="/repairsView" component={RepairsView} />
			<Route path="/repairEdit" component={RepairEdit} />
			<Route path="/repairAdd" component={RepairAdd} />
			<Route path="/repairStatistics" component={RepairStatistics} />
			<Route path="/qualityChart" component={QualityChart} />

			<Route path="/goods" component={Goods} />
			<Route path="/goodsView" component={GoodsView} />
			<Route path="/goodsAdd" component={GoodsAdd} />
			<Route path="/goodsEdit" component={GoodsEdit} />
			<Route path="/userBorrowSteps" component={UserBorrowSteps} />
			<Route path="/manageBorrowSteps" component={ManageBorrowSteps} />

			<Route path="/contactsOrder" component={ContactsOrder} />
			<Route path="/contactsOrderEdit" component={ContactsOrderEdit} />

			<Route path="/attendance" component={AttendanceManage} />
			<Route path="/uplaodSalary" component={UploadSalary} />
			<Route path="/uploadCustomersStar" component={UploadCustomersStar} />

			<Route path="/overWorkManage" component={OverWorkManage} />
			<Route path="/overWorkManagePro" component={OverWorkManagePro} />
			<Route path="/attendanceInput" component={AttendanceInput} />
			<Route path="/selfInfo" component={SelfInfo} />

			<Route path="/CustRelationsAffairs" component={CustRelationsAffairs} />
			<Route path="/createAffair" component={AffairsAdd} />
			<Route path="/productsAffairs" component={ProductsAffairs} />
			<Route path="/researchAffairs" component={ResearchAffairs} />
			<Route path="/manageAffairs" component={ManageAffairs} />
			<Route path="/memberAffairs" component={MemberAffairs} />

			<Route path="/pricingList" component={PricingList} />
			<Route path="/pricingEdit" component={PricingEdit} />
			<Route path="/pricingReadOnly" component={PricingReadOnly} />

			<Route path="/productsCost" component={ProductsCost} />
			<Route path="/productsCostEdit" component={ProductsCostEdit} />
			<Route path="/productsCostAdd" component={ProductsCostAdd} />

			<Route path="/wallet" component={WalletList} />
			<Route path="/walletBank" component={WalletBank} />
			<Route path="/achievement" component={Achievement} />

			<Route path="/onlineAssessment" component={OnlineAssessment} />

			<Route path="/softwareDynamics" component={softwareDynamics} />
			<Route path="/softProjectCls" component={softProjectCls} />
			<Route path="/developerProject" component={softDeveloper} />
			<Route path="/softProjectCreate" component={softProjectCreate} />
			<Route path="/softVersionList" component={softVersionList} />
			<Route path="/softEvaluationAdd" component={softEvaluationAdd} />
			<Route path="/softVersionCreate" component={softVersionCreate} />
			<Route path="/softVersionListDev" component={softVersionList} />
			<Route path="/softEvaluationAddDev" component={softEvaluationAdd} />
			<Route path="/softVersionCreateDev" component={softVersionCreate} />
			<Route path="/softProjectPropsChange" component={softProjectPropsChange} />
			<Route path="/softProjectPropsChangeDev" component={softProjectPropsChange} />
			<Route path="/softChildVersionCreate" component={SoftChildVersionCreate} />

			<Route path="/screenShare" component={ScreenShare} />

			<Route path="/knowledge" component={Knowledge} />
			<Route path="/gallery" component={Gallery} />
			<Route path="/docLib" component={DocLib} />
			<Route path="/treeManage" component={KnTreeManage} />

			<Route path="/publicRelationShip" component={PublicRelationShip} />
			<Route path="/publicRelationShipEdit" component={PublicRelationShipEdit} />
			<Route path="/publicRelationShipAdd" component={PublicRelationShipAdd} />

			<Route path="/buyer" component={Buyer} />
			<Route path="/buyerEdit" component={BuyerEdit} />
			<Route path="/buyerAdd" component={BuyerAdd} />

			<Route path="/endUser" component={EndUser} />
			<Route path="/endUserEdit" component={EndUserEdit} />
			<Route path="/endUserAdd" component={EndUserAdd} />

			<Route path="/verUnit" component={VerUnit} />
			<Route path="/verUnitEdit" component={VerUnitEdit} />

			<Route path="/smsTemp" component={SmsTemp} />

			<Route path="/wxAppletManage" component={WxAppletManage} />

			<Route path="/virCfg" component={VirCfg} />
			<Route path="/virTemp" component={VirTemp} />
			<Route path="/virTempEdit" component={VirTempEdit} />

			<Route path="/virProducts" component={VirProducts} />
			<Route path="/virProductsEdit" component={VirProductsEdit} />
			<Route path="/virProductsInfo" component={VirProductsInfo} />
			<Route path="/dynaProducts" component={DynaProducts} />
			<Route path="/dynaProductsInfo" component={DynaProductsInfo} />

			<Route path="/snApply" component={SnApply} />

			<Route path="/businessTrip" component={BusinessTrip} />
			<Route path="/myBusinessTrip" component={MyBusinessTrip} />
			<Route path="/myBusinessTripEdit" component={MyBusinessTripEdit} />
			<Route path="/myBusinessTripAdd" component={MyBusinessTripAdd} />
			<Route path="/meetOrdersManage" component={MeetOrdersManage} />
			<Route path="/meetOrdersImage" component={MeetOrdersImage} />
			<Route path="/contactOrdersAssessment" component={ContactOrdersAssessment} />

			<Route path="/cloudVtc" component={CloudVtc} />
			<Route path="/virtualProducts" component={VirtualProducts} />
			<Route path="/sourceMap" component={SourceMap} />

			<Route path="/productWorkHours" component={ProductWorkHours} />
			<Route path="/otherProducts" component={OtherProducts} />
			<Route path="/otherProductsInfo" component={OtherProductsInfo} />
			<Route path="/otherProductsAdd" component={OtherProductsAdd} />
			<Route path="/virProductsAdd" component={VirProductsAdd} />
			<Route path="/dynaProductsAdd" component={DynaProductsAdd} />

			<Route path="/simuCtrl" component={SimuCtrl} />
			<Route path="/simuCtrlAdd" component={SimuCtrlAdd} />

			<Route path="/ybScore" component={YBScore} />
			<Route path="/ybScoreAdd" component={YBScoreAdd} />
			<Route path="/ybScoreEdit" component={YBScoreEdit} />
			<Route path="/ybScoreChart" component={YBScoreChart} />

			<Route path="/vehicleRegist" component={VehicleRegist} />
			<Route path="/cloudDisk" component={CloudDisk} />
			<Route path="/burnDisk" component={BurnDisk} />
			<Route path="/burnDiskAdd" component={BurnDiskAdd} />
			<Route path="/burnDiskEdit" component={BurnDiskEdit} />
			<Route path="/cashGift" component={CashGift} />
			<Route path="/cashGiftAdd" component={CashGiftAdd} />
			<Route path="/cashGiftEdit" component={CashGiftEdit} />
			<Route path="/freeExchangeGift" component={FreeExchangeGift} />

			<Route path="/seckill" component={Seckill} />
			<Route path="/seckillEdit" component={SeckillEdit} />
			<Route path="/seckillAdd" component={SeckillAdd} />

			<Route path="/noAuth" component={NoAuth} />
			<Redirect from='/*' to='/index' />
		</Route>
	</Router>
), document.getElementById('root'));
