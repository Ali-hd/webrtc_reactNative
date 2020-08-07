import axios from 'axios'

export const login = async (params) => {
    console.log('api call')
    try{
        const data = await axios.post('APILINK', params, 'headers')
        return data
    }
    catch(error){
        return error
    }
}