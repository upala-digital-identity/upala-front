export const membershipStatus = 
    {
        "NO_MEMBERSHIP": "NO_MEMBERSHIP",
        "PENDING_JOIN": "PENDING_JOIN", 
        "PENDING_LEAVE": "PENDING_LEAVE", 
        "JOINED": "JOINED"
    };
export const upalaContractName = "Upala";
export const daiContractName = "FakeDai";
export const BASE_GROUP_CONTRACT_NAME = "ProtoGroup";

export const network = "localhost"; // options: localhost, kovan
export const IS_SHIPPED = false;  // switches local provider to injected provider when true

const secrets = require("./secrets.js");
export const INFURA_ID = secrets.infura_project_id;
export const PORTIS_ID = secrets.portisID;