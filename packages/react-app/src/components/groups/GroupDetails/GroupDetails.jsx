import React, { useState } from "react";
import "./GroupDetails.scss";
import { Check } from "react-feather";
import { membershipStatus } from "../../../config";
import { useHistory } from "react-router-dom";
import { ActionContext } from "../../../hooks";
import Loader from "react-loader-spinner";

// Shows group details screen
// Provides Join and Explode functionality
export default function GroupDetails(props) {
  const history = useHistory();
  const { loadAllGroups, loadUserUpalaId } = React.useContext(ActionContext);
  const [loading, setLoading] = useState(false);

  const activeGroup = props.activeGroup;

  function joinGroup() {
    activeGroup.join_handler();
  }

  function explode() {
    setLoading(true);
    activeGroup.explode_handler(() => {
      setTimeout(() => {
        loadUserUpalaId(null);
        loadAllGroups({});
        setLoading(false);
        history.push("/dashboard");
      }, 1000);
    });
  }

  // let displayLinks = "";
  // displayLinks = (
  //   <div>
  //     <a onClick={() => joinGroup()}>Join</a> <br />
  //     <a onClick={() => explode()}>EXPLODE</a> <br />
  //   </div>
  // );

  // let displayScore = "";
  // if (activeGroup.user_score) {
  //   displayScore = (
  //     <div>
  //       <b>user_score:</b>
  //       <h3>{activeGroup.user_score} DAI</h3>
  //     </div>
  //   );
  // }
  return (
    <div className="group-details">
      {/* <h2>{activeGroup.details.title}</h2>
      {displayScore}
      <b>Group ID:</b> {activeGroup.groupID} ({activeGroup.membership_status}){" "}
      <br />
      <b>Address:</b> {activeGroup.group_address} <br />
      <br />
      <br />
      {activeGroup.details.description} <br />
      <br />
      <br />
      {displayLinks} */}
      <div className="group-details-header">
        <img
          src="https://i.imgur.com/SfYwuRJ.png"
          alt="avatar"
          className="group-details-avatar"
        />
        <div className="group-details-title">{activeGroup.details.title}</div>
        {activeGroup.membership_status === membershipStatus.JOINED && (
          <div className="group-details-id">
            <b>Your Score in Bladerunner:</b> {activeGroup.user_score} DAI
          </div>
        )}
        <div className="group-details-id">
          <b>Group ID:</b> {activeGroup.groupID}
        </div>
        <div className="group-details-address">
          <b>Managing Contract:</b> {activeGroup.group_address}
        </div>
        <div className="group-details-address">
          <b>Pool:</b> <br />
          {activeGroup.poolAddress}
        </div>
        <div className="group-details-address">
          <b>Balance:</b> {activeGroup.poolBalance} DAI
        </div>

        <div className="group-details-description">
          {activeGroup.details.description}
        </div>
        <div className="group-details-action">
          {activeGroup.membership_status !== membershipStatus.NO_MEMBERSHIP ? (
            <span className="group-details-action-container">
              <span>{activeGroup.membership_status.toLowerCase()}</span>
              {activeGroup.membership_status === membershipStatus.JOINED && (
                <span className="group-details-action-check">
                  <Check height={16} width={16} />
                </span>
              )}
            </span>
          ) : activeGroup.details.title !== "BladerunnerDAO" ? (
            <button className="group-details-action-join" onClick={joinGroup}>
              Join
            </button>
          ) : null}
          {activeGroup.membership_status !== membershipStatus.NO_MEMBERSHIP ? (
            <button className="group-details-action-explode" onClick={explode}>
              {loading ? (
                <Loader
                  type="Oval"
                  color="#FFF"
                  height={18}
                  width={18}
                  style={{ display: "flex" }}
                />
              ) : (
                "Explode"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
