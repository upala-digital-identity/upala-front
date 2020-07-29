import React from "react";
import { Check } from "react-feather";
import { membershipStatus } from "../../../config";
import "./GroupsList.scss";

// Shows groups list filtered by status
// Lets user to select active group to show in details screen
export default function GroupsList(props) {
  let loadedGroups = props.loadedGroups;
  let statusFilter = props.statusFilter;
  let setActiveGroupID = props.setActiveGroupID;

  let selectedGroups = [];
  for (let id in loadedGroups) {
    const isStatusFilterPresent =
      statusFilter.filter(
        (status) => loadedGroups[id].membership_status === status
      ).length > 0;
    if (isStatusFilterPresent) {
      selectedGroups.push(loadedGroups[id]);
    }
  }

  if (selectedGroups) {
    return (
      <div className="group-list">
        {/* <List
            itemLayout="horizontal"
            dataSource={selectedGroups}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src="https://i.imgur.com/SfYwuRJ.png" />}
                  title={<a onClick={() => setactiveGroupID(item.group_address)}>{ item.details.title } </a>}
                  description={ item.details.short_description }
                />
              </List.Item>
            )}
          /> */}
        <div className="group-list-container">
          {selectedGroups.length > 0 ? (
            selectedGroups.map((group, i) => (
              <div key={i} className="group-list-item">
                <div
                  className="group-list-item-body"
                  onClick={() => setActiveGroupID(group.group_address)}
                >
                  <img
                    src="https://i.imgur.com/SfYwuRJ.png"
                    alt="avatar"
                    className="group-list-item-avatar"
                  />
                  <div className="group-list-item-details">
                    <div className="group-list-item-details-title">
                      {group.details.title}
                    </div>
                    <div className="group-list-item-details-member">
                      {group.details.short_description}
                    </div>
                  </div>
                </div>
                <div className="group-list-item-action">
                  {group.membership_status === membershipStatus.JOINED ? (
                    <span className="group-list-item-action-check">
                      <Check height={16} width={16} />
                    </span>
                  ) : null}
                  {group.membership_status === membershipStatus.PENDING_JOIN ? (
                    <span className="group-list-item-action-pending">
                      Pending
                    </span>
                  ) : null}
                  {group.membership_status === membershipStatus.NO_MEMBERSHIP &&
                  group.details.title !== "BladerunnerDAO" ? (
                    <button
                      className="group-list-item-action-join"
                      onClick={group.join_handler}
                    >
                      Join
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-list-container">
              <div className="empty-list-icon-container">
                <img
                  src={require("../../../assets/empty.svg")}
                  alt="empty"
                  className="empty-list-icon"
                />
              </div>
              <div className="empty-list-text">No Groups</div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return "";
  }
}
