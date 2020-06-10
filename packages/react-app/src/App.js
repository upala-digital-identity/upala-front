import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { membership_status, INFURA_ID, IS_SHIPPED, GROUP_DEFAULTS } from "./config";
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
//import { useQuery } from "@apollo/react-hooks";
import "./App.css";
import { useExchangePrice, useGasPrice, useContractLoader, useContractReader } from "./hooks"
import { Logo, Account, Provider, Faucet, Ramp } from "./components"
import GroupsList from "./components/groups/GroupsList.js"
import GroupDetails from "./components/groups/GroupDetails.js"
import GroupsReader from "./components/groups/GroupsReader.js"
import Welcome from './Welcome.js'
import { async } from 'bnc-notify/dist/notify.umd';


// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",INFURA_ID)
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

// test-data
const groupContractName = "ProtoGroup";
const upalaContractName = "Upala";

const tempActiveGroupID1 = 111111;
const tempActiveGroupID2 = 222222;
const tempActiveGroupID3 = 333333;
const testData = {
  [tempActiveGroupID1]: 
    { 
      "groupID": tempActiveGroupID1,
      "title": 'Group 1',
      "membership_status": membership_status.NO_MEMBERSHIP,
      "details": "Group 1 details",
      "group_address": "0x0",
      "user_score": null,
      "short_description": "Not deployed"
    },
  [tempActiveGroupID2]:
    {
      "groupID": tempActiveGroupID2,
      "title": 'Group 2',
      "membership_status": membership_status.NO_MEMBERSHIP,
      "details": "Group 2 details",
      "group_address": "0x0",
      "user_score": null,
      "short_description": "Not deployed"
    },
  [tempActiveGroupID3]:
    {
      "groupID": tempActiveGroupID3,
      "title": 'Group 3',
      "membership_status": membership_status.NO_MEMBERSHIP,
      "details": "Group 3 details",
      "group_address": "0x0",
      "user_score": null,
      "short_description": "Not deployed"
    },
}
var groups = [];

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState();
  const price = useExchangePrice(mainnetProvider);
  const gasPrice = useGasPrice("fast")
  const [userUpalaId, setUserUpalaId] = useState();
  const [loadedGroups, setLoadedGroups] = useState(testData)

  const [poolAddress_hack, setPoolAddress_hack] = useState()

  //const readContracts = useContractLoader(IS_SHIPPED ? injectedProvider : localProvider);



  
  function Group(contract) {
    this.contract = contract;
    this.group_address = contract.address;  // The owner/manager of Upala group (address)
    this.groupID = null;  // Upala group ID (uint160)
    this.pool_address = null;  // Address of a pool attached to the group
    this.details = null;  // raw details string
    this.user_score = null;  // user score in the group
    this.membership_status = membership_status.NO_MEMBERSHIP;  // JOINED if user_score > 0

    console.log("Group object created", this);

    this.loadFromContract = async function (functionName, args) {
      let newValue;
      try {
        if( args && args.length > 0){
          newValue = await this.contract[functionName](...args)
        } else {
          newValue = await this.contract[functionName]()
        }
      } catch(e) {
        console.log("debug contractName, functionName", functionName);
        console.log(e)
      }
      return newValue;
    }

    this.loadDetails = async function() {
      this.details = await this.loadFromContract("getGroupDetails");
    }
    this.loadUpalaGroupID = async function() {
      console.log(this.groupID)
      this.groupID = await this.loadFromContract("getUpalaGroupID");
      
    }

    this.loadDetails();
    // this.loadUpalaGroupID();
  }
  
  

  const readContracts = useContractLoader(localProvider);

  if (readContracts && readContracts[groupContractName]) {
    let isInitialized = false;
    for (let g of groups) {
      if (g.contract == readContracts[groupContractName]) {
        isInitialized = true;
        console.log("isInitialized");
      }
    }
    if (!isInitialized) {
      let testGroup = new Group(readContracts[groupContractName]);
      groups.push(testGroup);
    }
    
    // console.log("findd", groups.indexOf(testGroup));
    console.log("testGroup.details", groups[0].groupID, groups.length);
  }

  const hack_update_group_id = function () {
    if(groups[0].loadUpalaGroupID){
      console.log(groups[0].groupID)
      groups[0].loadUpalaGroupID()
    };
    
  }

  



  return (
    <div className="App">
      <header>
        <Logo />
        <div style={{position:'fixed',textAlign:'right',right:0,top:0,padding:10}}>
          <Account
            poolAddress_hack={poolAddress_hack}
            address={address}
            setAddress={setAddress}
            localProvider={IS_SHIPPED ? injectedProvider : localProvider}
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
          <GroupsList
            loadedGroups={loadedGroups}
            setactiveGroupID={setactiveGroupID}
            statusFilter={membership_status.NO_MEMBERSHIP}
          />

          <h3>Pending:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membership_status.PENDING_JOIN}
            setactiveGroupID={setactiveGroupID}
          />

          <h3>Joined:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membership_status.JOINED}
            setactiveGroupID={setactiveGroupID}
          />

        </div>
        <div>
          <GroupDetails
            activeGroupID={activeGroupID}
            loadedGroups={loadedGroups}
            setLoadedGroups={setLoadedGroups}
            userUpalaId={userUpalaId}
            updateGroupID={hack_update_group_id}

            address={address}
            injectedProvider={injectedProvider}
            localProvider={IS_SHIPPED ? injectedProvider : localProvider}
            gasPrice={gasPrice}
          />
        </div>

        <div>
            {/* <GroupsReader
              localProvider={IS_SHIPPED ? injectedProvider : localProvider}
              address={address}
              userUpalaId={userUpalaId}
              loadedGroups={loadedGroups}
              setLoadedGroups={setLoadedGroups}
              setPoolAddress_hack={setPoolAddress_hack}
            /> */}
          
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
      
      { !IS_SHIPPED ? (
      <div style={{position:'fixed',textAlign:'left',left:0,bottom:20,padding:10}}>
        <Faucet
          localProvider={localProvider}
          dollarMultiplier={price}
        />

      </div>
      ) : ""
      }
    </div>
  );
}

export default App;
