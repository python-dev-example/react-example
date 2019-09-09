import React from 'react';
import PropTypes from 'prop-types';
import Ionicon from 'react-ionicons';
import MaterialIcon from 'material-icons-react';
import { openPinConfirmation } from '/src/redux/modules/chat';
import { openFoundMessage } from '/src/redux/modules/searchMessage';
import { unpinMessage } from '/src/redux/modules/pinnedMessages';
import MessageInformation from '/src/components/MessageInformation/MessageInformation';
import { MIN_DISPLAY_WIDTH } from '/src/redux/modules/clientProperties';
import { getFileExtension } from '/src/helpers/media';
import SharedMessage from '/src/components/SharedMessage/SharedMessage';
import { AVATAR_SMALL_SIZE, bytesFormatFilter, getAvatarUrl } from '/src/helpers/utils';

import './PinnedMessage.scss';
import { push } from 'connected-react-router';
import Highlight from '../../../MessageWrapper/Highlight';
import { getSharedMessage } from '../../../../helpers/historyUtils';
import { transformToRoomNames } from '../../../ChatList/chatListUtils';

export default class PinnedMessage extends React.PureComponent {
  static propTypes={
    senderUser: PropTypes.object.isRequired,
    message: PropTypes.object,
    dispatchAction: PropTypes.func,
    user: PropTypes.object.isRequired,
    rooms: PropTypes.object,
    users: PropTypes.object,
    subscribed: PropTypes.bool,
    oauthStore: PropTypes.object,
    currentRoom: PropTypes.object.isRequired,
  };

  onJumpClick = e => {
    if (e) e.preventDefault();

    const {
      dispatchAction, message, rooms, currentRoom
    } = this.props;

    if (window.innerWidth < MIN_DISPLAY_WIDTH) {
      const to = `/chat/${currentRoom.get('id')}`;
      dispatchAction(push(to));
    }

    const room = rooms.getIn([message.get('roomId').toString()]);
    const messageId = message.get('id');

    dispatchAction(openFoundMessage(room, messageId));
  };

  deletePinnedMessage = e => {
    e.preventDefault();
    const { dispatchAction, message } = this.props;
    dispatchAction(openPinConfirmation(message, unpinMessage));
  };

  downloadFile(e) {
    e.preventDefault();
    const { message, oauthStore } = this.props;

    const accessToken = oauthStore ? oauthStore.get('access_token') : null;
    const accessTokenParam = `${accessToken ? `?access_token=${accessToken}` : ''}`;

    const fileUrl = `/api/histories/${message.get('roomId')}/file/${message.get('fileId')}${accessTokenParam}`;
    if (window.isElectron) {
      window.electronSaveFile(fileUrl, message.get('fileName'), message.get('fileSize'));
    } else {
      window.open(fileUrl);
    }
  }

  render() {
    const {
      message, senderUser, dispatchAction, user,
      subscribed, rooms, users, oauthStore, foundMessageOpening, currentRoom
    } = this.props;

    const fileType = message.get('messageType') === 'FILE' || message.get('messageType') === 'TEXTFILE';
    const fileName = message.get('fileName');
    const fileSize = message.get('fileSize');
    const fileSizeFormatted = bytesFormatFilter(fileSize, 2);
    const fileExt = getFileExtension(fileName);
    const sharedMessage = getSharedMessage(message);
    const isRightPanel = true;
    const position = 'rightSide';
    const roomNames = transformToRoomNames(rooms);

    return (
      <li className="pinned-message">
        <div className="pinned-message-item">
          <div className="pinned-message-body">
            <div className="pinned-message-profile">
              <div id="avatar-button" className="avatar">
                <img className="aim-avatar member-avatar" alt="" src={getAvatarUrl(senderUser, AVATAR_SMALL_SIZE)} />
              </div>
            </div>
            <div className="pinned-message-info">
              <MessageInformation
                currentUser={user}
                senderUser={senderUser}
                message={message}
                dispatchAction={dispatchAction}
                isRightPanel={isRightPanel}
              />
              <div className="pinned-message-text">
                {fileType ? (
                  <div className="pinned-file">
                    <div className="pinned-message-fileicon">
                      <span className="file-icon" data-type={fileExt} />
                    </div>
                    <div className="pinned-message-filename">
                      <div className="file-name">{fileName}</div>
                      <div className="file-size">{fileSizeFormatted}</div>
                    </div>
                  </div>
                ) : (
                  <span>
                    { message.get('message').split('/(\n)/')
                      .map((line) => (
                        <Highlight
                          key={line}
                          message={line}
                          users={users}
                          user={user}
                          position={position}
                          currentRoom={currentRoom}
                        />
                      ))}
                    <SharedMessage
                      roomNames={roomNames}
                      user={user}
                      users={users}
                      message={sharedMessage}
                      dispatch={dispatchAction}
                      subscribed={subscribed}
                      oauthStore={oauthStore}
                      noTextFilePreviewPinnedMessage
                      inRightPanel
                      currentRoom={currentRoom}
                    />
                  </span>
                )
                }
              </div>
            </div>
          </div>
          <div className="pinned-message-header">
            {subscribed && fileType
            && (
              <span className="actions">
                <MaterialIcon icon="file_download" color="#00b0ff" />
                <a href="" onClick={event => this.downloadFile(event)}>Download</a>
              </span>
            )
            }
            {subscribed && (
              <span className="actions">
                <a href="" onClick={this.deletePinnedMessage}>
                  <Ionicon icon="ion-pin" fontSize="14px" color="#00b0ff" />
                  Unpin
                </a>
              </span>
            )}
            <span className="actions">
              <a className={`${foundMessageOpening ? 'disabled' : ''}`} href="" onClick={this.onJumpClick}>
                <Ionicon icon="ion-android-open" fontSize="14px" color="#00b0ff" />

                Open
              </a>
            </span>
          </div>
        </div>
      </li>
    );
  }
}
