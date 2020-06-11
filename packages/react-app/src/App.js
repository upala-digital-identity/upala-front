import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { membership_status, INFURA_ID, IS_SHIPPED, network, GROUP_ABI_FILE } from "./config";
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



class Group {
  constructor(contract) {
    // set defaults
    this.group_address = contract.address;  // The owner/manager of Upala group (address)
    this.contract = contract;
    this.groupID = null; // Upala group ID (uint160)
    this.pool_address = null; // Address of a pool attached to the group
    this.details = null; // raw details string
    this.user_score = null; // user score in the group
    this.membership_status = membership_status.NO_MEMBERSHIP; // JOINED if user_score > 0
    console.log("Group object created", this);
  }
  async loadFromContract(functionName, args) {
    let newValue;
    try {
      if (args && args.length > 0) {
        newValue = await this.contract[functionName](...args);
      }
      else {
        newValue = await this.contract[functionName]();
      }
    }
    catch (e) {
      console.log("debug contractName, functionName", functionName);
      console.log(e);
    }
    return newValue;
  }
  async loadDetails(){
      this.details = await this.loadFromContract("getGroupDetails");
      this.groupID = (await this.loadFromContract("getUpalaGroupID")).toNumber();
      this.pool_address = await this.loadFromContract("getGroupPoolAddress");
  }
  // let path = [userUpalaId, upalaGroupID];
  async loadUserScore(path, userAddress) {
      this.user_score = ethers.utils.formatEther(await this.loadFromContract("memberScore", [path, { from: userAddress }]));
      console.log("this.user_score", this.user_score);
  }
  async join(){
    console.log("Join ", this.groupID);
  }
}



var userGroups;
class UserGroups {
  constructor(signer, updater) {
    this.groups = {};
    this.signer = signer;
    this.updater = updater;
  }
  async addGroupAddress(address) {
    if (typeof this.groups[address] == "undefined") {
      try {
        let newContract = new ethers.Contract(address, require("./contracts/" + network + "/" + GROUP_ABI_FILE), this.signer);
        this.groups[address] = new Group(newContract);
        await this.groups[address].loadDetails()
        this.updateUI();
      }
      catch (e) {
        console.log("ERROR LOADING CONTRACTS!!", e);
      }
    }
  }
  async join(groupAddress){
    console.log("groupAddress", groupAddress, this.groups[groupAddress], this.groups)
    await this.groups[groupAddress].join();
    /// this.updateUI();
  }
  updateUI(){
    let newLoadedGroups = {};
    for (var address in this.groups) {
      console.log("newLoadedGroups", this.groups[address]);
      console.log("newLoadedGroups", this.groups[address].groupID);
      let newEntry = {
        "groupID": this.groups[address].groupID,
        "title": "Base group",
        "membership_status": membership_status.NO_MEMBERSHIP,
        "details": this.groups[address].details,
        "group_address": address,
        "user_score": null,
        "short_description": "Base group short description",
        "join": this.groups[address].join
      }
      newLoadedGroups[address] = newEntry;
    }
    this.updater(newLoadedGroups);
    console.log("newLoadedGroups", newLoadedGroups)
  }
}



function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState();
  const price = useExchangePrice(mainnetProvider);
  const gasPrice = useGasPrice("fast")
  const [userUpalaId, setUserUpalaId] = useState();
  const [loadedGroups, setLoadedGroups] = useState()

  const [poolAddress_hack, setPoolAddress_hack] = useState()

  
  useEffect(() => {
    async function initializeUserGroups() {
      if(typeof localProvider != "undefined")
      {
        console.log("initializeUserGroups");
        try{
          //we need to check to see if this provider has a signer or not
          let signer
          let accounts = await localProvider.listAccounts()
          if(accounts && accounts.length>0){
            signer = localProvider.getSigner()
          }else{
            signer = localProvider
          }
          userGroups = new UserGroups(signer, setLoadedGroups);
          let preloadedGroupAddress = require("./contracts/" + network + "/" + "ProtoGroup.address.js");
          userGroups.addGroupAddress(preloadedGroupAddress);

        }catch(e){
          console.log("ERROR LOADING CONTRACTS!!",e)
        }
      }
    }
    initializeUserGroups()
  },[localProvider])


  const hack_update_group_id = function () {
    console.log('df');
    // if(groups[0].loadUpalaGroupID){
    //   console.log(groups[0].groupID)
    //   groups[0].loadUpalaGroupID()
    // };
    
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
