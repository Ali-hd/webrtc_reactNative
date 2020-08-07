import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, SafeAreaView, View, Text } from 'react-native'


class Test extends Component {

    componentDidMount(){
        console.log('props test',this.props)
        const { reduxTest } = this.props
        reduxTest({
            username: 'ali'
        })
        console.log(this.props.test)
    }


    render(){
        return(
            <SafeAreaView>
                <View>
                    <Text>Hello</Text>
                </View>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({

})

// // Map State To Props (Redux Store Passes State To Component)
const mapStateToProps = ({ test }) => ({ test });
 
//
const mapDispatchToProps = dispatch => ({
   reduxTest: (payload) => dispatch({
       type: 'test/LOGIN',
       payload
   }),
 })
 

export default connect(mapStateToProps, mapDispatchToProps)(Test);
