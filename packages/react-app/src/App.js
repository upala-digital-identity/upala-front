import React from "react";
import { HashRouter as Router, Route, Redirect } from "react-router-dom";
import { GetStarted, Dashboard, SearchBoard, GroupInfo } from "./pages";
import "./App.scss";
import "antd/dist/antd.css";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { StateContext } from "./hooks";

function App() {
  const { allGroups } = React.useContext(StateContext);

  return (
    <div className="App">
      <Router>
        <Route path="/" exact render={() => <GetStarted />} />
        <Route path="/dashboard" exact render={() => <Dashboard />} />
        <Route
          path="/groups/search"
          exact
          render={() => {
            return Object.keys(allGroups).length ? (
              <SearchBoard />
            ) : (
              <Redirect to="/dashboard" />
            );
          }}
        />
        <Route
          path="/groups/details/:id"
          exact
          render={() => {
            return Object.keys(allGroups).length ? (
              <GroupInfo />
            ) : (
              <Redirect to="/dashboard" />
            );
          }}
        />
      </Router>
    </div>
  );
}

export default App;
