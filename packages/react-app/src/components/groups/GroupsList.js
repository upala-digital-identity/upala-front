import React from 'react';
import { List, Avatar } from 'antd';

// Shows groups list filtered by status
// Lets user to select active group to show in details screen
export default function GroupsList(props) {

  let loadedGroups = props.loadedGroups;
  let statusFilter = props.statusFilter;
  let setactiveGroupID = props.setactiveGroupID;

  let selectedGroups = [];
  for(let id in loadedGroups){
    if (loadedGroups[id].membership_status == statusFilter) {
      selectedGroups.push(loadedGroups[id]);
    }
  }

  if (selectedGroups) {
    return (
      <div>
          <List
            itemLayout="horizontal"
            dataSource={selectedGroups}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src="https://i.imgur.com/SfYwuRJ.png" />}
                  title={<a onClick={() => setactiveGroupID(item.group_address)}>{item.title} </a>}
                  description={ item.short_description }
                />
              </List.Item>
            )}
          />
        </div>
    );
    
  } else {
    return("");
  }
  
}
