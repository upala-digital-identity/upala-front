import React, { useState, useEffect } from "react";
import { ArrowLeft } from "react-feather";
import "./SearchBoard.scss";
import { useHistory } from "react-router-dom";
import { StateContext } from "../../hooks";
import { membershipStatus } from "../../config";
import { GroupsList } from "../../components/groups";
export default function SearchBoard(props) {
  const history = useHistory();
  const { allGroups } = React.useContext(StateContext);
  const [filteredGroups, setFilteredGroups] = useState(allGroups);
  const [filteredText, setFilteredText] = useState("");

  useEffect(() => {
    if (Object.keys(allGroups).length > 0) {
      filterGroups("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGroups]);

  const filterGroups = (text) => {
    setFilteredText(text);
    let filteredGroupsCurrent = [];
    for (let id in allGroups) {
      if (
        allGroups[id].details.title
          .toLowerCase()
          .indexOf(text.toLowerCase()) !== -1
      ) {
        filteredGroupsCurrent.push(allGroups[id]);
      }
    }
    setFilteredGroups(filteredGroupsCurrent);
  };

  const setActiveGroupID = (groupId) => {
    history.push("/groups/details/" + groupId);
  };

  return (
    <div className="search-board">
      <div className="search-board-header">
        <span
          className="search-board-header-back"
          onClick={() => history.push("/dashboard")}
        >
          <ArrowLeft />
        </span>
        <span className="search-board-header-search">
          <input
            type="search"
            className="search-board-input"
            placeholder="Search"
            value={filteredText}
            onChange={(e) => filterGroups(e.target.value)}
          />
        </span>
        {/* <span className="search-board-header-qr">
          <img
            src={require("../../assets/qr.png")}
            alt="qr"
            className="search-board-qr"
          />
        </span> */}
      </div>
      <div className="search-board-group-list">
        <div className="search-board-groups-title">Suggestions</div>
        <GroupsList
          loadedGroups={filteredGroups}
          statusFilter={[membershipStatus.NO_MEMBERSHIP]}
          setActiveGroupID={setActiveGroupID}
        />
      </div>
    </div>
  );
}
