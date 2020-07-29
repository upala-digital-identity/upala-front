import React, { createContext, useMemo } from "react";

export const ActionContext = createContext();
export const StateContext = createContext();

export const StateProvider = (props) => {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "LOAD_ALL_GROUPS":
          return {
            ...prevState,
            allGroups: action.allGroups,
          };
        case "LOAD_USER_UPALA_ID":
          return {
            ...prevState,
            userUpalaId: action.userUpalaId,
          };
        case "LOAD_USER_ADDRESS":
          return {
            ...prevState,
            userAddress: action.userAddress,
          };
        default:
      }
    },
    {
      allGroups: {},
      userUpalaId: null,
      userAddress: null,
    }
  );

  const actionContext = useMemo(
    () => ({
      loadAllGroups: async (allGroups) => {
        dispatch({
          type: "LOAD_ALL_GROUPS",
          allGroups,
        });
      },
      loadUserUpalaId: async (userUpalaId) => {
        dispatch({
          type: "LOAD_USER_UPALA_ID",
          userUpalaId,
        });
      },
      loadUserAddress: async (userAddress) => {
        dispatch({
          type: "LOAD_USER_ADDRESS",
          userAddress,
        });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <ActionContext.Provider value={actionContext}>
      <StateContext.Provider value={state}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
};
