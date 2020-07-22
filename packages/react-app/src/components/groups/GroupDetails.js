import React from 'react';

// Shows group details screen
// Provides Join and Explode functionality
export default function GroupDetails(props) {

  const activeGroup = props.activeGroup;

  function joinGroup() {
    activeGroup.join_handler();
  }

  function explode() {
    activeGroup.explode_handler();
  }

  let displayLinks = "";
    displayLinks = (
      <div>
        <a onClick={() => joinGroup()}>Join</a> <br />
        <a onClick={() => explode()}>EXPLODE</a> <br />
      </div>
    )

  let displayScore = "";
  if (activeGroup.user_score) {
    displayScore = (
      <div>
        <b>Your score in Bladerunner:</b> 
        <h3>{activeGroup.user_score} DAI</h3>
      </div>
    )
  }
  return (
    <div>
      <h2>{activeGroup.details.title}</h2>
      { displayScore }
      <b>Group details:</b><br />
      <b>Upala ID:</b> {activeGroup.groupID} ({activeGroup.membership_status}) <br />
      <b>Managing contract:</b> {activeGroup.group_address} <br />
      <b>Pool:</b> {activeGroup.poolAddress} <br />
      <b>Balance:</b> {activeGroup.poolBalance} DAI <br />
      <br />
      <b>Description:</b><br />
      {activeGroup.details.description} <br />
      <br />
      <br />
      { displayLinks }
    </div>

  )
}
