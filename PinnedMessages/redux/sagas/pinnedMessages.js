/* eslint-disable import/prefer-default-export */
import Api from '/src/helpers/ApiClient';
import { call, put } from 'redux-saga/effects';
import { loadPinned as pinnedLoad, loadPinnedFail, loadPinnedSuccess } from '../modules/pinnedMessages';
import { ALL_TAB, FILES_TAB, MESSAGES_TAB } from '../modules/utils/starredAndPinnedUtils';
import { getBugsnagClient } from '../../bugsnag';

const getUrlAll = roomId => `/histories/${roomId}/pinned/get`;

const getUrlFiles = roomId => `/histories/${roomId}/pinned/getFiles`;

const getUrlTextMessages = roomId => `/histories/${roomId}/pinned/getTextMessages`;

const MESSAGE_QUANTITY = 15;

const tabUrlMapper = {
  [ALL_TAB]: getUrlAll,
  [MESSAGES_TAB]: getUrlTextMessages,
  [FILES_TAB]: getUrlFiles
};

function apiLoadPinned(roomId, lastId, tab) {
  return Api.get(tabUrlMapper[tab](roomId), { params: { lastId, messageQuantity: MESSAGE_QUANTITY } });
}

export function* loadPinned(action) {
  const { roomId, tab, lastId } = action;

  try {
    yield put(pinnedLoad(roomId, tab));
    const response = yield call(apiLoadPinned, roomId, lastId, tab);

    yield put(loadPinnedSuccess(roomId, response, tab));
  } catch (e) {
    console.error(e);
    yield put(loadPinnedFail(roomId, tab, e));
    getBugsnagClient().notify(new Error(e.toString()));
  }
}
