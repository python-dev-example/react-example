import React from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import PinnedMessage from '/src/containers/TabContent/elements/pinnedMessages/PinnedMessage';
import { isScrollBottom, messageTransformer } from '/src/helpers/utils';
import Nav from '/src/components/controls/Nav';
import TabLink from '/src/components/TabLink/TabLink';
import './PinnedMessages.scss';
import { chatScrollTop } from '../../../../helpers/utils';
import TabSpinner from '../../TabSpinner';
import { startLoadPinned } from '../../../../redux/modules/pinnedMessages';

const NO_PINNED_MESSAGE = 'There are no pinned messages in this room';
const THROTTLE_ON_SCROLL = 500;

export default class PinnedMessages extends React.PureComponent {
  static propTypes = {
    dispatchAction: PropTypes.func,
    pinnedMessages: PropTypes.object,
    currentUser: PropTypes.object,
    users: PropTypes.object,
    rooms: PropTypes.object,
    subscribed: PropTypes.bool,
    oauthStore: PropTypes.object,
    currentRoom: PropTypes.object,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate(prevProps) {
    const { router } = this.props;

    const newValue = router.chatRouter.getIn(['matches', 'params', 'value']);

    const oldValue = prevProps.router.chatRouter.getIn(['matches', 'params', 'value']);

    if (newValue !== oldValue && this.scroll) {
      chatScrollTop(this.scroll.id, { delay: 0, duration: 0 });
    }
  }

  onScroll = throttle(() => {
    const {
      pinnedMessages, router, currentRoom, dispatchAction
    } = this.props;
    const { isPinnedScrollBottom } = this.state;
    const tabValue = router.chatRouter.getIn(['matches', 'params', 'value']);


    if (!isPinnedScrollBottom && isScrollBottom(this.scroll)) {
      const lastMessage = pinnedMessages.getIn([`${currentRoom.get('id')}`,
        tabValue, 'data']).last();
      dispatchAction(startLoadPinned(`${currentRoom.get('id')}`, tabValue, lastMessage.get('id')));
      this.setState({ isPinnedScrollBottom: true });
    } else if (isPinnedScrollBottom && !isScrollBottom(this.scroll)) {
      this.setState({ isPinnedScrollBottom: false });
    }
  }, THROTTLE_ON_SCROLL);

  wrapPinnedMessages = (pinnedMessages) => {
    if (pinnedMessages) {
      const {
        rooms, dispatchAction, currentUser, users, subscribed, acl, oauthStore,
        foundMessageOpening, currentRoom
      } = this.props;
      return pinnedMessages.map(message => messageTransformer(users, message, currentUser, dispatchAction, PinnedMessage,
        subscribed, rooms, oauthStore, foundMessageOpening, acl, currentRoom)).toList();
    }
    return [];
  };

  render() {
    const {
      pinnedMessages, currentRoom, router
    } = this.props;

    const paramsValue = router.chatRouter.getIn(['matches', 'params', 'value']);

    const pinnedMessagesState = pinnedMessages.getIn([`${currentRoom.get('id')}`]);

    const loading = pinnedMessages.getIn([`${currentRoom.get('id')}`, `${paramsValue}`, 'loading']);

    const isMessagesLoaded = pinnedMessages.getIn([`${currentRoom.get('id')}`, `${paramsValue}`, 'loaded']);

    const messages = pinnedMessagesState && pinnedMessagesState.getIn([`${paramsValue}`, 'data']);

    const messagesList = this.wrapPinnedMessages(messages);

    const isMessagesExist = messagesList && messagesList.size > 0;

    return (
      <div className="pinned-messages">
        <Nav type="tabs" justified activeKey={paramsValue}>
          <TabLink eventKey="all" router={router} tab="pinned" value="all">ALL</TabLink>
          <TabLink eventKey="messages" router={router} tab="pinned" value="messages">MESSAGES</TabLink>
          <TabLink eventKey="files" router={router} tab="pinned" value="files">FILES</TabLink>
        </Nav>
        <div
          ref={(c) => { this.scroll = c; }}
          className={`scrollable-pinned-content ${isMessagesExist && 'border'}`}
          id="scrollable-pinned-content"
          onScroll={this.onScroll}
        >
          { loading && <TabSpinner /> }
          {
            isMessagesExist
              ? (
                <ul className="pinned-messages">
                  {messagesList}
                </ul>
              )
              : (
                <div className="no-messages">
                  {isMessagesLoaded && NO_PINNED_MESSAGE}
                </div>
              )
          }
        </div>
      </div>
    );
  }
}
