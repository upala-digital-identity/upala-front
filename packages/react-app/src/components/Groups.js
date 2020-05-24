import React from 'react';
import { List, Avatar } from 'antd';

export default function Groups(props) {

  let loadedGroups = props.loadedGroups;
  let statusFilter = props.statusFilter;

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
                  title={<a onClick={() => props.setactiveGroupID(item.groupID)}>{item.title} </a>}
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
