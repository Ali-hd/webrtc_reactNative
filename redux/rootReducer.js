import { combineReducers } from 'redux';

import test from './Test/reducers'

const rootReducer = combineReducers({
    test: test,
});

export default rootReducer;