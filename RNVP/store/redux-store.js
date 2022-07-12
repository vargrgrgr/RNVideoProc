import { legacy_createStore, applyMiddleware, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { VideoPlayer, Trimmer } from '../RNVP_module';

const ADD_QUEUE_QUEUE = 'ADD_QUEUE_QUEUE';
const SET_CURRENT_STATE = 'SET_CURRENT_STATE';
const REMOVE_FROM_QUEUE = 'REMOVE_FROM_QUEUE';
const SET_VIDEO_LIST = 'SET_VIDEO_LIST';

const addToQueue = (data) => {
  return { type: ADD_QUEUE_QUEUE, data }
}

const setCurrent = (data) => {
  return { type: SET_CURRENT_STATE, data }
};

const removeFromQueue = (data) => {
  return { type: REMOVE_FROM_QUEUE, data }
};

const setVideoList = (data) => {
  return { type: SET_VIDEO_LIST, data }
};

const reducerInitialState = {
  queue: [],
  current: null,
  videoList: []
};

const options = {
  startTime: 0,
  endTime: 15,
  saveToCameraRoll: true, // default is false // iOS only
  saveWithCurrentDate: true, // default is false // iOS only
};

const appReducer = (state = reducerInitialState, action) => {
  switch (action.type) {
    case ADD_QUEUE_QUEUE: {
      return {
        ...state,
        queue: [...state.queue, action.data] // creating new reference
      };
    }

    case SET_CURRENT_STATE: {
      return {
        ...state,
        current: action.data
      };
    }

    case REMOVE_FROM_QUEUE: {
      return {
        ...state,
        current: null,
        queue: [...state.queue].filter(x => x.uuid !== action.data.uuid)
      };
    }

    case SET_VIDEO_LIST: {
      return {
        ...state,
        videoList: action.data
      };
    }

    default: {
      return state;
    }
  }
};

function compressVideo(path) {
  return async () => {
    console.log(`begin compressing ${path}`);
    const origin = await ProcessingManager.getVideoInfo(path);
    const result = await ProcessingManager.compress(path, {
      width: origin.size && origin.size.width / 3,
      height: origin.size && origin.size.height / 3,
      bitrateMultiplier: 7,
      minimumBitrate: 300000
    });
    const thumbnail =  await ProcessingManager.getPreviewForSecond(result.source);
    return { path: result.source, thumbnail };
  };
}



export const processNext = (unlock) => {
  return async (dispatch, getState) => {
    const state = getState();
    const queue = state.app.queue;
    const current = state.app.current;

    if (queue.length === 0 || (current && !unlock)) return;
    const next = (current && unlock) ? current : queue[0];
    dispatch(setCurrent(next));
    const file = await dispatch(compressVideo(next.local_path));
    await dispatch(uploadVideo(file, next));
    dispatch(removeFromQueue(next));
    dispatch(getVideosApi());
    dispatch(uploadNext());
  };
};


const reducer = combineReducers({ app: appReducer });
export const store = legacy_createStore(reducer, {}, applyMiddleware(thunkMiddleware));