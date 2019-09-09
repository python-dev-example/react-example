import { fromJS, OrderedSet } from 'immutable';
import {
  PIN_MESSAGE_SUCCESS,
  DELETE_MESSAGE,
  PIN_SELECTED_MESSAGES_SUCCESS, DELETE_SELECTED_MESSAGES,
} from './chat';
import { EDIT_MESSAGE } from './histories';
import {
  deleteMessage,
  deleteMessageList,
  editMessage,
  setNewPinnedMessage,
} from './utils/starredAndPinnedUtils';
import { LOGOUT_SUCCESS } from './auth';

const LOAD_PINNED = 'chat/pinnedMessages/LOAD_PINNED';
export const START_LOAD_PINNED = 'chat/pinnedMessages/START_LOAD_PINNED';
const LOAD_PINNED_SUCCESS = 'chat/pinnedMessages/LOAD_PINNED_SUCCESS';
const LOAD_PINNED_FAIL = 'chat/pinnedMessages/LOAD_PINNED_FAIL';
export const UNPIN_PINNED_MESSAGE = 'chat/pinnedMessages/UNPIN_PINNED_MESSAGE';
export const UNPIN_PINNED_MESSAGE_SUCCESS = 'chat/pinnedMessages/UNPIN_PINNED_MESSAGE_SUCCESS';
export const UNPIN_PINNED_MESSAGE_FAIL = 'chat/pinnedMessages/UNPIN_PINNED_MESSAGE_FAIL';


const initialState = fromJS({
});

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_PINNED:
      return state.setIn([`${action.roomId}`, action.tab, 'loading'], true);
    case LOAD_PINNED_SUCCESS: {
      if (!state.getIn([`${action.roomId}`, action.tab, 'data'])) {
        return state.setIn([`${action.roomId}`, action.tab, 'loading'], false)
          .setIn([`${action.roomId}`, action.tab, 'data'], fromJS(action.response))
          .setIn([`${action.roomId}`, action.tab, 'loaded'], true);
      }
      return state.setIn([`${action.roomId}`, action.tab, 'loading'], false)
        .updateIn([`${action.roomId}`, action.tab, 'data'],
          list => new OrderedSet(list.concat(fromJS(action.response))).toList());
    }
    case LOAD_PINNED_FAIL:
      return state.setIn([`${action.roomId}`, action.tab, 'loading'], false)
        .setIn([`${action.roomId}`, action.tab, 'error'], fromJS(action.error));

    case PIN_SELECTED_MESSAGES_SUCCESS: {
      let newState = state;
      action.result.forEach((m) => {
        newState = setNewPinnedMessage(newState, m, `${m.get('roomId')}`);
      });

      return newState;
    }
    case PIN_MESSAGE_SUCCESS:
      return setNewPinnedMessage(state, fromJS(action.result), action.key);
    case DELETE_MESSAGE:
      return deleteMessage(state, action);
    case DELETE_SELECTED_MESSAGES:
      return deleteMessageList(state, action.messages);
    case EDIT_MESSAGE:
      return editMessage(state, action);
    case LOGOUT_SUCCESS:
      return initialState;
    default:
      return state;
  }
}

export function loadPinned(roomId, tab) {
  return {
    type: LOAD_PINNED,
    roomId,
    tab
  };
}

export function loadPinnedSuccess(roomId, response, tab) {
  return {
    type: LOAD_PINNED_SUCCESS,
    roomId,
    response,
    tab
  };
}

export function loadPinnedFail(roomId, error, tab) {
  return {
    type: LOAD_PINNED_FAIL,
    roomId,
    error,
    tab
  };
}

export function unpinMessage(message) {
  return {
    immutable: true,
    types: [UNPIN_PINNED_MESSAGE, UNPIN_PINNED_MESSAGE_SUCCESS, UNPIN_PINNED_MESSAGE_FAIL],
    promise: client => client.get(`/rooms/message/unpin/${message.get('id')}`),
    roomId: `${message.get('roomId')}`
  };
}

export function startLoadPinned(roomId, tab, lastId) {
  return {
    type: START_LOAD_PINNED,
    roomId,
    tab,
    lastId
  };
}
