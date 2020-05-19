import React, { useState } from 'react'
import 'antd/dist/antd.css';
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
//import { useQuery } from "@apollo/react-hooks";
import "./App.css";

import { Layout } from 'antd';

import { Row, Col, List, Avatar } from 'antd';

import { useExchangePrice, useGasPrice } from "./hooks"
import { Logo, Account, Provider, Faucet, Ramp } from "./components"
import Groups from "./components/Groups.js"
import Welcome from './Welcome.js'

const { Header, Footer, Sider, Content } = Layout;

const mainnetProvider = new ethers.providers.InfuraProvider("mainnet","2717afb6bf164045b5d5468031b93f87")
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState(0);
  const price = useExchangePrice(mainnetProvider)
  const gasPrice = useGasPrice("fast")

  const [pendingGroups, setPendingGroups] = useState([]);

  // let pendingGroups = []
  let groupSuggestions = [];
  let joinedGroups = [];


  // test-data
  const tempActiveGroupID1 = 12345;
  const tempActiveGroupID2 = 435465;
  const tempActiveGroupID3 = 234634;
  const loadedGroups = {
    [tempActiveGroupID1]: 
      { 
        "groupID": tempActiveGroupID1,
        "title": 'Group 1',
      },
    [tempActiveGroupID2]:
      {
        "groupID": tempActiveGroupID2,
        "title": 'Group 2',
      },
    [tempActiveGroupID3]:
      {
        "groupID": tempActiveGroupID3,
        "title": 'Group 3',
      },
  }
  for(let key in loadedGroups){
    groupSuggestions.push(key);
  } 
  //end-test-data

  
  

  function joinGroup(groupID) {
    setPendingGroups(pendingGroups => [...pendingGroups, groupID]);
    console.log(pendingGroups);
  }

  return (
    <div className="App">
      
      <Logo />
      {/* <div style={{position:'fixed',textAlign:'right',right:0,top:0,padding:10}}>
        <Account
          address={address}
          setAddress={setAddress}
          localProvider={localProvider}
          injectedProvider={injectedProvider}
          setInjectedProvider={setInjectedProvider}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      </div> */}


      Suggestions:
      <Groups
        loadedGroups={loadedGroups}
        groupsList={groupSuggestions}
        setactiveGroupID={setactiveGroupID}
      />


      Pending:
      <Groups
        loadedGroups={loadedGroups}
        groupsList={pendingGroups}
        setactiveGroupID={setactiveGroupID}
      />

      <div>
        Active group: {activeGroupID}
        Pending: {pendingGroups}
        <a onClick={() => joinGroup(activeGroupID)}>Join</a>
      </div>

      
      {/* <div style={{padding:40,textAlign: "left"}}>
        <Welcome
          address={address}
          injectedProvider={injectedProvider}
          localProvider={localProvider}
          price={price}
          gasPrice={gasPrice}
        />
      </div> */}
    


        
      {/* <div style={{position:'fixed',textAlign:'right',right:0,bottom:20,padding:10}}>
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
      </div> */}
     
    </div>
  );
}

export default App;
