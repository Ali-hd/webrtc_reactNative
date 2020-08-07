import { all, takeEvery, put, call  } from 'redux-saga/effects'
import actions from './actions'
import { login } from '../api'

export function* LOGIN({ payload }){
    console.log('tesst SAGA')
    console.log('payload SAGA', payload)
    yield put({
        type: 'test/SET_STATE',
        payload: {
            loading: true
        }
    })

    const data = yield call(login, payload)

    if(data.success){
        //success code

    }else{
        //error code
    }

    console.log('api data', data)

    yield put({
        type: 'test/SET_STATE',
        payload: {
            loading: false
        }
    })
}



// when you go to test/actionname " " run some function
export default function* rootSaga(){
    yield all([
        takeEvery(actions.LOGIN, LOGIN),
    ])
}