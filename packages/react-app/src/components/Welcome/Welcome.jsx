import React from 'react'

export default function Welcome(props) {

  const userUpalaId = props.userUpalaId;
  const registerHandler = props.registerHandler;

  function register() {
    registerHandler();
  }

  let displayUserID = "Not registered";
  if (typeof userUpalaId != "undefined" && typeof userUpalaId.user_ID != "undefined") {
    displayUserID = userUpalaId.user_ID;
    console.log("displayUserID", displayUserID)
  }

  return (
    <div>
      <br />
      <br />
      <br />
      <br />
      <h1>🔵</h1> 
      Your Upala Id is: <h1>{displayUserID}</h1>
      <a onClick={ () => register() }>Register new Upala Id</a> <br />

    </div>
  );

}
