import React from 'react';
import { List, Avatar } from 'antd';

export default function Groups(props) {

  let loadedGroups = props.loadedGroups;
  let groupsList = props.groupsList;
  //const hasItems = groupsList.length > 0;

  let selectedGroups = [];
  
  for(let id in groupsList){
    if (typeof loadedGroups[groupsList[id]] !== 'undefined' 
        && 
        typeof loadedGroups[groupsList[id]].title !== 'undefined') 
        {           
        selectedGroups.push(loadedGroups[groupsList[id]]);
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
                  avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                  title={<a onClick={() => props.setactiveGroupID(item.groupID)}>{item.title} </a>}
                  description="Ant Design, a design language for background applications, is refined by Ant UED Team"
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
