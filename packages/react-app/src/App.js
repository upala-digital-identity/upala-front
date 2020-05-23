import React, { useState } from 'react'
import 'antd/dist/antd.css';
import {membership_status} from "./config";
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
//import { useQuery } from "@apollo/react-hooks";
import "./App.css";

import { Layout } from 'antd';

import { Row, Col, List, Avatar } from 'antd';

import { useExchangePrice, useGasPrice } from "./hooks"
import { Logo, Account, Provider, Faucet, Ramp } from "./components"
import Groups from "./components/Groups.js"
import Details from "./components/Details.js"
import GroupsReader from "./GroupsReader.js"
import Welcome from './Welcome.js'

const { Header, Footer, Sider, Content } = Layout;

const IS_SHIPPED = true;

const secrets = require("./secrets.js");
const INFURA_ID = secrets.infura_project_id;

// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",INFURA_ID)
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState();
  const price = useExchangePrice(mainnetProvider);
  const gasPrice = useGasPrice("fast")
  const [userUpalaId, setUserUpalaId] = useState();


  // test-data
  const tempActiveGroupID1 = 111111;
  const tempActiveGroupID2 = 222222;
  const tempActiveGroupID3 = 333333;

  // one "real" group is added to this list after reading smart-contracts
  const [loadedGroups, setLoadedGroups] = useState({
    [tempActiveGroupID1]: 
      { 
        "groupID": tempActiveGroupID1,
        "title": 'Group 1',
        "membership_status": membership_status.NO_MEMBERSHIP,
        "details": "Group 1 details",
        "manager_address": "0x0"
      },
    [tempActiveGroupID2]:
      {
        "groupID": tempActiveGroupID2,
        "title": 'Group 2',
        "membership_status": membership_status.NO_MEMBERSHIP,
        "details": "Group 2 details",
        "manager_address": "0x0"
      },
    [tempActiveGroupID3]:
      {
        "groupID": tempActiveGroupID3,
        "title": 'Group 3',
        "membership_status": membership_status.NO_MEMBERSHIP,
        "details": "Group 3 details",
        "manager_address": "0x0"
      },
  })



  return (
    <div className="App">
      <header>
        <Logo />
        <div style={{position:'fixed',textAlign:'right',right:0,top:0,padding:10}}>
          <Account
            address={address}
            setAddress={setAddress}
            localProvider={localProvider}
            injectedProvider={injectedProvider}
            setInjectedProvider={setInjectedProvider}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </div>
      </header>

      <div>
        <div className="menu">
          <h2>Membership</h2>
          <h3>Suggestions:</h3>
          <Groups
            loadedGroups={loadedGroups}
            setactiveGroupID={setactiveGroupID}
            statusFilter={membership_status.NO_MEMBERSHIP}
          />

          <h3>Pending:</h3>
          <Groups
            loadedGroups={loadedGroups}
            statusFilter={membership_status.PENDING_JOIN}
            setactiveGroupID={setactiveGroupID}
          />

          <h3>Joined:</h3>
          <Groups
            loadedGroups={loadedGroups}
            statusFilter={membership_status.JOINED}
            setactiveGroupID={setactiveGroupID}
          />

        </div>
        <div>
          <Details
            activeGroupID={activeGroupID}
            loadedGroups={loadedGroups}
            setLoadedGroups={setLoadedGroups}
            userUpalaId={userUpalaId}

            address={address}
            injectedProvider={injectedProvider}
            localProvider={IS_SHIPPED ? injectedProvider : localProvider}
            gasPrice={gasPrice}
          />
        </div>

        <div>
            <GroupsReader
              localProvider={IS_SHIPPED ? injectedProvider : localProvider}
              address={address}
              userUpalaId={userUpalaId}
              loadedGroups={loadedGroups}
              setLoadedGroups={setLoadedGroups}
            />
          
          <div>
            <Welcome
              address={address}
              injectedProvider={injectedProvider}
              localProvider={IS_SHIPPED ? injectedProvider : localProvider}
              price={price}
              gasPrice={gasPrice}
              userUpalaId={userUpalaId}
              setUserUpalaId={setUserUpalaId}
            />
          </div>
        </div>
      </div>
      
      
      
        
      <div style={{position:'fixed',textAlign:'right',right:0,bottom:20,padding:10}}>
        <Row align="middle" gutter={4}>
          <Col span={10}>
            <Provider name={"mainnet"} provider={mainnetProvider} />
          </Col>
          <Col span={6}>
            <Provider name={"local"} provider={localProvider} />
          </Col>
          <Col span={8}>
            <Provider name={"injected"} provider={injectedProvider} />
          </Col>
        </Row>
      </div>

      <div style={{position:'fixed',textAlign:'left',left:0,bottom:20,padding:10}}>
        <Row align="middle" gutter={4}>
          <Col span={9}>
            <Ramp
              price={price}
              address={address}
            />
          </Col>
          <Col span={15}>
            <Faucet
              localProvider={localProvider}
              dollarMultiplier={price}
            />
          </Col>
        </Row>
      </div>
     
    </div>
  );
}

export default App;
