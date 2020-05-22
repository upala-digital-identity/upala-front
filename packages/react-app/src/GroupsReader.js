import React from 'react'
import { ethers } from "ethers";
import {membership_status} from "./config";

import { useContractLoader, useContractReader, useEventListener, useBlockNumber, useBalance } from "./hooks"

const groupContractName = "ProtoGroup";
const upalaContractName = "Upala";

export default function GroupsReader(props) {

  const loadedGroups=props.loadedGroups;
  const setLoadedGroups=props.setLoadedGroups;

  const readContracts = useContractLoader(props.localProvider);

  const details = useContractReader(readContracts,groupContractName,"getGroupDetails",1777);
  const upalaGroupIDraw = useContractReader(readContracts,groupContractName,"getUpalaGroupID",1777);

  let upalaGroupID;
  if (upalaGroupIDraw) {
    upalaGroupID = upalaGroupIDraw.toNumber();
    console.log("upalaGroupID", upalaGroupID);
  }
  
  let manager_address = readContracts?readContracts[groupContractName].address:""

  // const groupIDTemp = 3;
  // add group once
  if (upalaGroupID && details && manager_address && !loadedGroups[upalaGroupID]) {
    console.log("Loading ProtoGroup");
    let newEntry ={
      "groupID": upalaGroupID,
      "title": groupContractName,
      "membership_status": membership_status.NO_MEMBERSHIP,
      "details": details,
      "manager_address": manager_address
    }

    setLoadedGroups((loadedGroups) => {
      let newGroups = Object.assign({}, loadedGroups);
      newGroups[upalaGroupID] = newEntry;
      return newGroups;})
  }

  
  let displayDetails, displayContractAddress, displayUpalaGroupID;

  if(readContracts && readContracts[groupContractName]){
    displayDetails = (details);
    displayContractAddress = readContracts[groupContractName].address;
  }

  return ("");
  //   <div>
  //     {displayDetails} <br />
  //     {displayContractAddress} <br />
  //     {displayUpalaGroupID}
  //   </div>
    
  // );
}
