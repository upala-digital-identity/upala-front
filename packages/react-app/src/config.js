export const membershipStatus = {
  NO_MEMBERSHIP: "NO_MEMBERSHIP",
  PENDING_JOIN: "PENDING_JOIN",
  PENDING_LEAVE: "PENDING_LEAVE",
  JOINED: "JOINED",
};
export const upalaContractName = "Upala";
export const daiContractName = "FakeDai";
export const BASE_GROUP_CONTRACT_NAME = "ProtoGroup";

export const network = "localhost"; // options: localhost, kovan
export const IS_SHIPPED = false; // switches local provider to injected provider when true

const secrets = require("./secrets.js");
export const INFURA_ID = secrets.infura_project_id;
export const PORTIS_ID = secrets.portisID;
export const GROUP_DEFAULTS = {
  group_address: null, // The owner/manager of Upala group (address)
  groupID: null, // Upala group ID (uint160)
  pool_address: null, // Address of a pool attached to the group
  details: null, // raw details string
  title: null, // extracted from details
  short_description: null, // extracted from details
  user_score: null, // user score in the group
  membership_status: membershipStatus.NO_MEMBERSHIP, // JOINED if user_score > 0
};

const tempActiveGroupID1 = 111111;
const tempActiveGroupID2 = 222222;
const tempActiveGroupID3 = 333333;

const testData = {
  [tempActiveGroupID1]: {
    groupID: tempActiveGroupID1,
    title: "Group 1",
    membership_status: membershipStatus.NO_MEMBERSHIP,
    details: "Group 1 details",
    group_address: "0x0",
    user_score: null,
    short_description: "Not deployed",
  },
  [tempActiveGroupID2]: {
    groupID: tempActiveGroupID2,
    title: "Group 2",
    membership_status: membershipStatus.NO_MEMBERSHIP,
    details: "Group 2 details",
    group_address: "0x0",
    user_score: null,
    short_description: "Not deployed",
  },
  [tempActiveGroupID3]: {
    groupID: tempActiveGroupID3,
    title: "Group 3",
    membership_status: membershipStatus.NO_MEMBERSHIP,
    details: "Group 3 details",
    group_address: "0x0",
    user_score: null,
    short_description: "Not deployed",
  },
};
