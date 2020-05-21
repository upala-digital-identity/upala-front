import React from 'react';
import {membership_status} from "../config";

export default function Details(props) {

  const activeGroupID = props.activeGroupID;
  const loadedGroups=props.loadedGroups;
  const setLoadedGroups = props.setLoadedGroups;
  
  function joinGroup(groupID) {
    let newGroups = loadedGroups;
    if (typeof newGroups[groupID] !== 'undefined' 
          && 
        typeof newGroups[groupID].membership_status !== 'undefined') {
          setLoadedGroups((loadedGroups) => {
            let newGroups = Object.assign({}, loadedGroups);
            newGroups[groupID].membership_status = membership_status.PENDING_JOIN;
            return newGroups;})
          }
  }

  if (activeGroupID) {
    console.log("activeGroupID", activeGroupID);
    return (
      <div>
        <h2>{loadedGroups[activeGroupID].title}</h2>
        <b>groupID:</b> {loadedGroups[activeGroupID].groupID} <br />
        <b>membership_status:</b> {loadedGroups[activeGroupID].membership_status} <br />
        <b>details:</b> {loadedGroups[activeGroupID].details} <br />
        <b>manager_address:</b> {loadedGroups[activeGroupID].manager_address} <br />
        <a onClick={() => joinGroup(activeGroupID)}>Join</a>
      </div>
    );
      }
  else {
    return null
  }
  
    
}
