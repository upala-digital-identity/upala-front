import React from 'react'
import { ethers } from "ethers";
import {membership_status} from "./config";

import { useContractLoader, useContractReader, useEventListener, useBlockNumber, useBalance } from "./hooks"

const groupContractName = "ProtoGroup";
const upalaContractName = "Upala";

export default function GroupsReader(props) {

  const loadedGroups=props.loadedGroups;
  const setLoadedGroups=props.setLoadedGroups;
  const userUpalaId = props.userUpalaId;
  
  const readContracts = useContractLoader(props.localProvider);

  const details = useContractReader(readContracts,groupContractName,"getGroupDetails",1777);
  const upalaGroupIDraw = useContractReader(readContracts,groupContractName,"getUpalaGroupID",1777);

  let upalaGroupID;
  if (upalaGroupIDraw) {
    upalaGroupID = upalaGroupIDraw.toNumber();
    console.log("upalaGroupID, userUpalaId", upalaGroupID, userUpalaId);
  }
  
  let group_address = readContracts?readContracts[groupContractName].address:""

  // First load group
  if (upalaGroupID && details && group_address && !loadedGroups[upalaGroupID]) {
    console.log("Loading ProtoGroup");
    let newEntry ={
      "groupID": upalaGroupID,
      "title": groupContractName,
      "membership_status": membership_status.NO_MEMBERSHIP,
      "details": details,
      "group_address": group_address,
      "user_score": null,
      "pool_address": null,
      "short_description": "Deployed to Kovan"
    }

    setLoadedGroups((loadedGroups) => {
      let newGroups = Object.assign({}, loadedGroups);
      newGroups[upalaGroupID] = newEntry;
      return newGroups;})
  }

  if (loadedGroups[upalaGroupID] && !loadedGroups[upalaGroupID].pool_address) {
    readContracts[loadedGroups[upalaGroupID].title].getGroupPoolAddress().then((pool_address) => {
      // console.log("getGroupPoolAddress", pool_address);
      setLoadedGroups((loadedGroups) => {
        let newGroups = Object.assign({}, loadedGroups);
        newGroups[upalaGroupID].pool_address = pool_address;
        console.log("Write pool address", newGroups);
        return newGroups;
      });
      props.setPoolAddress_hack(pool_address);
    });
  }
  


  // Update user_score
  if (loadedGroups[upalaGroupID] && userUpalaId) {
    console.log("loadedGroups[upalaGroupID] && userUpalaId  ", loadedGroups[upalaGroupID].user_score);

    if (loadedGroups[upalaGroupID].user_score == null) {
    
      let path = [userUpalaId, upalaGroupID];
    
      readContracts[upalaContractName].memberScore(path, { from: props.address }).then((result) => {
        let newUserScore = ethers.utils.formatEther(result);
        console.log("memberScore  ", newUserScore);
        
        // if (loadedGroups[upalaGroupID].user_score > 0 && loadedGroups[upalaGroupID].user_score != membership_status.JOINED) {
        //   updateNeeded = true;
        // }

        // if (loadedGroups[upalaGroupID].user_score != newUserScore) {
        //   updateNeeded = true;
        // }
        let newMembershipStatus;
        if (newUserScore > 0) {
          newMembershipStatus = membership_status.JOINED;
        } else {
          newMembershipStatus = membership_status.NO_MEMBERSHIP;
        }
        
        setLoadedGroups((loadedGroups) => {
          let newGroups = Object.assign({}, loadedGroups);
          newGroups[upalaGroupID].membership_status = newMembershipStatus;
          newGroups[upalaGroupID].user_score = newUserScore;
          newGroups[upalaGroupID].path = path;
          console.log("user_score newGroups", newGroups);
          return newGroups;
        })

      });
    }
  }
  

  let displayDetails, displayContractAddress, displayUpalaGroupID;

  if(readContracts && readContracts[groupContractName]){
    displayDetails = (details);
    displayContractAddress = readContracts[groupContractName].address;
  }

  return ("");
}