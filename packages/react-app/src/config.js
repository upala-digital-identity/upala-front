export const membership_status = 
    {
        "NO_MEMBERSHIP": "NO_MEMBERSHIP",
        "PENDING_JOIN": "PENDING_JOIN", 
        "PENDING_LEAVE": "PENDING_LEAVE", 
        "JOINED": "JOINED"
    }
export const upalaContractName = "Upala"
export const daiContractName = "FakeDai"

export const network = "localhost" // options: localhost, kovan
export const IS_SHIPPED = false;  // switches local provider to injected provider when true

const secrets = require("./secrets.js");
export const INFURA_ID = secrets.infura_project_id;
export const PORTIS_ID = secrets.portisID;
export const GROUP_DEFAULTS = {
    "group_address": null,  // The owner/manager of Upala group (address)
    "groupID": null,  // Upala group ID (uint160)
    "pool_address": null,  // Address of a pool attached to the group
    "details": null,  // raw details string
    "title": null,  // extracted from details
    "short_description": null,  // extracted from details
    "user_score": null,  // user score in the group
    "membership_status": membership_status.NO_MEMBERSHIP,  // JOINED if user_score > 0 
  }