import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";

const audioRecorderPlayer = new AudioRecorderPlayer();

const App = () => {
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState("");

  const startRecording = async () => {
    try {
      setRecording(true);
      const path = "recording.m4a"; // Recorded file path
      await audioRecorderPlayer.startRecorder(path);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setRecording(false);
      console.log("Recording stopped:", result);

      // Send audio file to backend
      const formData = new FormData();
      formData.append("audio", {
        uri: `file://${result}`,
        type: "audio/mpeg",
        name: "recording.mp4",
      });

      const response = await fetch("http://localhost:5019/upload", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      console.log('data.transcription: ', data.transcription);
      setTranscription(data.transcription);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />
      <Text style={styles.text}>
        {transcription ? `Transcription: ${transcription}` : ""}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default App;
