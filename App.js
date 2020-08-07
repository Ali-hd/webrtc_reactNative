import React from 'react';
import { Provider } from 'react-redux'
import { store } from './redux/store'
import Test from './components/Test'
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals
} from 'react-native-webrtc';

import io from 'socket.io-client'
import InCallManager from 'react-native-incall-manager';

const dimensions = Dimensions.get('window')

const pc_config = {
  "iceServers": [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      "url": "",
      "username": "",
      "credential": ""
    }
  ]
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      localStream: null,
      remoteStream: null,
      incommingCall: false,
      loading: false
    }

    this.sdp
    this.socket = null
    this.candidates = []
  }

  componentDidMount = () => {

    this.pc = new RTCPeerConnection(pc_config)

    console.log('ice connection state',this.pc.iceConnectionState)  

    this.socket = io.connect(
      'https://p2p-vidchat.herokuapp.com'
    )

    this.socket.on('connection-success', success => {
      console.log('success! id => ', success)
      // console.log('In Call Manager ', InCallManager);
    })

    this.socket.on('offerOrAnswer', (sdp) => {

      this.sdp = JSON.stringify(sdp)
      if(sdp.type === 'offer'){
        InCallManager.startRingtone('DEFAULT')
        this.setState({
          incommingCall:true
        })
      }
      // set sdp as remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    this.socket.on('candidate', (candidate) => {
      // console.log('From Peer... ', JSON.stringify(candidate))
      // this.candidates = [...this.candidates, candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    this.pc.onicecandidate = (e) => {
      // send the candidates to the remote peer
      // see addCandidate below to be triggered on the remote peer
      if (e.candidate) {
        // console.log(JSON.stringify(e.candidate))
        this.sendToPeer('candidate', e.candidate)
      }
    }

    // triggered when there is a change in connection state
    this.pc.oniceconnectionstatechange = (e) => {
      console.log(this.pc.iceConnectionState)
      
      switch(this.pc.iceConnectionState) {
        case "failed":
          this.setState({
            remoteStream: null,
          })
          break;
        case "checking":
          this.setState({
            loading: true
          })
          break;
        case "connected":
          this.setState({
            loading: false
          })
          break;
        default:
          break;
      }
    }

    this.pc.connectionState = (e) => {
      console.log('connection state :', e)
    }

    this.pc.onaddstream = (e) => {
      debugger
      // this.remoteVideoref.current.srcObject = e.streams[0]
      setTimeout(() => {
        this.setState({
          remoteStream: e.stream
        })
      }, 3000);
    }

    this.permissions()

    try {
      InCallManager.start({media: 'audio'});
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setSpeakerphoneOn(true);
      InCallManager.setKeepScreenOn(true)
    } catch (err) {
      console.log('InApp Caller Error!', err);
    }
  }

  permissions = () => {
    let isFront = true;
    mediaDevices.enumerateDevices().then(sourceInfos => {
      // console.log(sourceInfos);
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (sourceInfo.kind == "videoinput" && sourceInfo.facing == (isFront ? "front" : "environment")) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      const constraints = {
        audio: true,
        video: {
          mandatory: {
            minWidth: 500, // Provide your own width, height and frame rate here
            minHeight: 300,
            minFrameRate: 30
          },
          facingMode: (isFront ? "user" : "environment"),
          optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
        }
      }

      mediaDevices.getUserMedia(constraints)
        .then(this.success)
        .catch(this.failure);
    })
  }

  success = (stream) => {
    this.setState({
      localStream: stream
    })
    this.pc.addStream(stream)
  }

  failure = (e) => {
    console.log('getUserMedia Error: ', e)
  }


  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  }

  createOffer = () => {
    console.log('Offer')

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
    // initiates the creation of SDP
    this.pc.createOffer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))

        // set offer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
      })
  }

  createAnswer = () => {
    console.log('Answer')
    this.setState({
      incommingCall:false
    })
    InCallManager.stopRingtone();
    this.pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // set answer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
      })
  }

  disconnect = () => {
    this.pc.close()
    this.setState({
      remoteStream: null
    })
  }

  // setRemoteDescription = () => {
  //   // retrieve and parse the SDP copied from the remote peer
  //   const desc = JSON.parse(this.sdp)

  //   // set sdp as remote description
  //   this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  // }

  // addCandidate = () => {
  //   // retrieve and parse the Candidate copied from the remote peer
  //   // const candidate = JSON.parse(this.textref.value)
  //   // console.log('Adding candidate:', candidate)

  //   // add the candidate to the peer connection
  //   // this.pc.addIceCandidate(new RTCIceCandidate(candidate))

  //   this.candidates.forEach(candidate => {
  //     console.log(JSON.stringify(candidate))
  //     this.pc.addIceCandidate(new RTCIceCandidate(candidate))
  //   });
  // }


  render() {
    const { localStream, remoteStream } = this.state

    const remoteVideo = 
    remoteStream ?
      (
        <RTCView
          key={2}
          mirror={true}
          style={{ ...styles.rtcViewRemote }}
          zOrder={0}
          objectFit='cover'
          streamURL={remoteStream && remoteStream.toURL()}
        />
      ) 
      :
      (
        <View style={{ padding: 15, }}>
          <Text style={{ fontSize: 22, textAlign: 'center', color: 'white' }}>Waiting for Peer connection ...</Text>
        </View>
      )

    return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1, }}>
        {/* <StatusBar backgroundColor="blue" barStyle={'dark-content'} /> */}
        <View style={{ ...styles.buttonsContainer }}>
          <View style={{ flex: 1, }}>
            <TouchableOpacity 
              onPress={
                  this.state.remoteStream ? this.disconnect 
                : this.state.incommingCall ? this.createAnswer 
                : !this.state.incommingCall ? this.createOffer
                : null
              }>
              <View style={styles.button}>
                <Text style={{ ...styles.textContent, }}>
                  {this.state.remoteStream ? 'disconnect'
                   : this.state.incommingCall ? 'Answer' 
                   : !this.state.incommingCall ? 'Call' : null}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <Test/>
        <View style={{ ...styles.videosContainer, }}>
          <ScrollView style={{ ...styles.scrollView }}>
            <View style={{
              flex: 1,
              width: '100%',
              backgroundColor: 'black',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {remoteVideo}
            </View>
          </ScrollView>
          <View style={{
            position: 'absolute',
            zIndex: 5,
            elevation: 5,
            bottom: 20,
            right: 20,
            width: 100, height: 200,
            backgroundColor: 'black',
          }}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => localStream._tracks[1]._switchCamera()}>
                <View>
                  <RTCView
                    key={1}
                    zOrder={5}
                    objectFit='cover'
                    style={{ ...styles.rtcView }}
                    streamURL={localStream && localStream.toURL()}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {this.state.loading && 
        <View>
          <Text>Connecting...</Text>
        </View> }
      </SafeAreaView>
    </Provider>
    );
  }
};

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    margin: 5,
    paddingVertical: 10,
    backgroundColor: 'lightgrey',
    borderRadius: 5,
  },
  textContent: {
    fontFamily: 'Avenir',
    fontSize: 20,
    textAlign: 'center',
  },
  videosContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative'
  },
  rtcView: {
    width: 100, //dimensions.width,
    height: 200,//dimensions.height / 2,
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'teal',
    zIndex: 0,
    position: 'absolute'
  },
  rtcViewRemote: {
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: 'black'
  }
});

export default App;
