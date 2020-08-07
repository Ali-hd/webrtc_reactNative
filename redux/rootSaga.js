import { all } from 'redux-saga/effects';

import test from './Test/sagas'

export function* rootSaga(){
    yield all([
        test()
    ])
}