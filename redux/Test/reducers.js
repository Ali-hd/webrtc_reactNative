import actions from './actions'

const initialState = {
    loading: false
}


export default function testReducer(state = initialState, action){
    switch(action.type){
        case actions.SET_STATE:
            return { ...state, ...actions.payload }
        default:
            return state
    }
}