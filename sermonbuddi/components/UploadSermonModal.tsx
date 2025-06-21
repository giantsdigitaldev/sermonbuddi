import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface UploadSermonModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (file: any, sermonDetails: SermonDetails) => void;
  onYouTubeLink: (youtubeUrl: string, sermonDetails: SermonDetails) => void;
  onRecordingComplete: (recording: Audio.Recording, sermonDetails: SermonDetails) => void;
}

interface SermonDetails {
  title: string;
  series: string;
  preacher: string;
  date: string;
}

type InputMethod = 'document' | 'youtube' | 'recording';

const UploadSermonModal: React.FC<UploadSermonModalProps> = ({
  visible,
  onClose,
  onUpload,
  onYouTubeLink,
  onRecordingComplete,
}) => {
  const { dark } = useTheme();
  
  // Form state
  const [selectedInputMethod, setSelectedInputMethod] = useState<InputMethod>('document');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [sermonDetails, setSermonDetails] = useState<SermonDetails>({
    title: '',
    series: '',
    preacher: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  
  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingPermission, setRecordingPermission] = useState<Audio.PermissionStatus | null>(null);
  
  // Modal state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  // Color palette for diverse icons
  const iconColors = [
    COLORS.primary,      // Blue
    COLORS.success,      // Green
    COLORS.warning,      // Orange
    COLORS.info,         // Cyan
    COLORS.secondary,    // Purple
    COLORS.tertiary,     // Pink
  ];

  // Animation functions
  const openModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
        delay: 50,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset form
      setSelectedInputMethod('document');
      setSelectedFile(null);
      setYoutubeUrl('');
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      setSermonDetails({
        title: '',
        series: '',
        preacher: '',
        date: new Date().toISOString().split('T')[0],
      });
    });
  };

  // Gesture handler for swipe to close
  const onGestureEvent = (event: any) => {
    const { translationY, state, velocityY } = event.nativeEvent;

    if (state === State.ACTIVE) {
      // Only allow downward dragging (translationY >= 0)
      if (translationY >= 0) {
        panY.setValue(translationY);
      } else {
        panY.setValue(0);
      }
    }

    if (state === State.END) {
      // Close if dragged down > 120px or with a flick
      if (translationY > 120 || velocityY > 800) {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(panY, {
            toValue: 800, // Animate off-screen
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
          panY.setValue(0);
        });
      } else {
        // Snap back to anchored position
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  // Handle modal visibility changes
  useEffect(() => {
    if (visible) {
      openModal();
    }
  }, [visible]);

  // Enhanced keyboard event listeners for iOS
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        setKeyboardVisible(true);
        // Only move modal up for keyboard on iOS
        if (Platform.OS === 'ios') {
          const moveUpAmount = Math.max(0, Math.min(keyboardHeight - 100, keyboardHeight * 0.2));
          Animated.timing(modalTranslateY, {
            toValue: -moveUpAmount,
            duration: event.duration || 250,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
        // Return modal to anchored position
        if (Platform.OS === 'ios') {
          Animated.timing(modalTranslateY, {
            toValue: 0,
            duration: event.duration || 250,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Request recording permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setRecordingPermission(status);
    })();
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const startRecording = async () => {
    try {
      if (recordingPermission !== Audio.PermissionStatus.GRANTED) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        setRecording(recording);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = () => {
    if (!sermonDetails.title.trim()) {
      Alert.alert('Error', 'Please enter a sermon title');
      return;
    }

    if (!sermonDetails.preacher.trim()) {
      Alert.alert('Error', 'Please enter the preacher name');
      return;
    }

    switch (selectedInputMethod) {
      case 'document':
        if (!selectedFile) {
          Alert.alert('Error', 'Please select a document first');
          return;
        }
        onUpload(selectedFile, sermonDetails);
        break;
      
      case 'youtube':
        if (!youtubeUrl.trim()) {
          Alert.alert('Error', 'Please enter a YouTube URL');
          return;
        }
        if (!validateYouTubeUrl(youtubeUrl)) {
          Alert.alert('Error', 'Please enter a valid YouTube URL');
          return;
        }
        onYouTubeLink(youtubeUrl, sermonDetails);
        break;
      
      case 'recording':
        if (!recording) {
          Alert.alert('Error', 'Please record a sermon first');
          return;
        }
        onRecordingComplete(recording, sermonDetails);
        break;
    }
    
    closeModal();
  };

  const isFormValid = () => {
    if (!sermonDetails.title.trim() || !sermonDetails.preacher.trim()) {
      return false;
    }

    switch (selectedInputMethod) {
      case 'document':
        return !!selectedFile;
      case 'youtube':
        return youtubeUrl.trim() && validateYouTubeUrl(youtubeUrl);
      case 'recording':
        return !!recording;
      default:
        return false;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={closeModal}
        />
        
        {/* Modal Content */}
        <PanGestureHandler 
          onGestureEvent={onGestureEvent}
          activeOffsetY={[-10, 10]} // Activate on vertical movement
          failOffsetX={[-15, 15]} // Fail if horizontal movement is too much
          shouldCancelWhenOutside={false}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                transform: [
                  {
                    translateY: Animated.add(
                      modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [600, 0],
                      }),
                      Animated.add(panY, modalTranslateY)
                    ),
                  },
                ],
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle}>
              <View style={[styles.dragIndicator, {
                backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
              }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerIcon, { backgroundColor: iconColors[0] + '20' }]}>
                  <Ionicons name="cloud-upload" size={24} color={iconColors[0]} />
                </View>
                <View>
                  <Text style={[styles.title, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Add New Sermon
                  </Text>
                  <Text style={[styles.subtitle, {
                    color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                  }]}>
                    Upload, link, or record your sermon
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons 
                  name="close-circle" 
                  size={28} 
                  color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.contentContainer,
                {
                  paddingBottom: keyboardVisible ? keyboardHeight + 100 : 100,
                }
              ]}
              nestedScrollEnabled={true}
            >
              {/* Input Method Selection */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="options" size={16} color={iconColors[0]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Input Method
                  </Text>
                </View>
                <View style={styles.methodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      selectedInputMethod === 'document' && { 
                        backgroundColor: COLORS.primary + '20',
                        borderColor: COLORS.primary 
                      }
                    ]}
                    onPress={() => setSelectedInputMethod('document')}
                  >
                    <Ionicons 
                      name="document" 
                      size={20} 
                      color={selectedInputMethod === 'document' ? COLORS.primary : COLORS.grayscale400} 
                    />
                    <Text style={[
                      styles.methodText,
                      { color: selectedInputMethod === 'document' ? COLORS.primary : COLORS.grayscale400 }
                    ]}>
                      Document
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      selectedInputMethod === 'youtube' && { 
                        backgroundColor: COLORS.error + '20',
                        borderColor: COLORS.error 
                      }
                    ]}
                    onPress={() => setSelectedInputMethod('youtube')}
                  >
                    <Ionicons 
                      name="logo-youtube" 
                      size={20} 
                      color={selectedInputMethod === 'youtube' ? COLORS.error : COLORS.grayscale400} 
                    />
                    <Text style={[
                      styles.methodText,
                      { color: selectedInputMethod === 'youtube' ? COLORS.error : COLORS.grayscale400 }
                    ]}>
                      YouTube
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      selectedInputMethod === 'recording' && { 
                        backgroundColor: COLORS.success + '20',
                        borderColor: COLORS.success 
                      }
                    ]}
                    onPress={() => setSelectedInputMethod('recording')}
                  >
                    <Ionicons 
                      name="mic" 
                      size={20} 
                      color={selectedInputMethod === 'recording' ? COLORS.success : COLORS.grayscale400} 
                    />
                    <Text style={[
                      styles.methodText,
                      { color: selectedInputMethod === 'recording' ? COLORS.success : COLORS.grayscale400 }
                    ]}>
                      Record
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Document Upload Section */}
              {selectedInputMethod === 'document' && (
                <View style={styles.inputSection}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="document" size={16} color={iconColors[1]} />
                    <Text style={[styles.label, {
                      color: dark ? COLORS.white : COLORS.greyscale900,
                    }]}>
                      Sermon Document *
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.uploadArea,
                      { 
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                        borderColor: selectedFile ? COLORS.primary : (dark ? COLORS.grayscale700 : COLORS.grayscale200),
                      },
                      selectedFile && { borderWidth: 2 }
                    ]}
                    onPress={handleFilePick}
                  >
                    <Ionicons 
                      name={selectedFile ? "document" : "cloud-upload-outline"} 
                      size={48} 
                      color={selectedFile ? COLORS.primary : COLORS.grayscale400} 
                    />
                    <Text style={[styles.uploadText, { color: dark ? COLORS.white : COLORS.black }]}>
                      {selectedFile ? selectedFile.name : 'Tap to select document'}
                    </Text>
                    <Text style={[styles.uploadSubtext, { color: COLORS.grayscale400 }]}>
                      PDF, DOC, DOCX, or TXT files
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* YouTube Link Section */}
              {selectedInputMethod === 'youtube' && (
                <View style={styles.inputSection}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="logo-youtube" size={16} color={COLORS.error} />
                    <Text style={[styles.label, {
                      color: dark ? COLORS.white : COLORS.greyscale900,
                    }]}>
                      YouTube Video URL *
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.input, {
                      color: dark ? COLORS.white : COLORS.greyscale900,
                      backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                      borderColor: youtubeUrl && validateYouTubeUrl(youtubeUrl) ? COLORS.error : (dark ? COLORS.grayscale700 : COLORS.grayscale200),
                    }]}
                    placeholder="https://www.youtube.com/watch?v=..."
                    placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                    value={youtubeUrl}
                    onChangeText={setYoutubeUrl}
                    autoFocus={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                  <Text style={[styles.hint, {
                    color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                  }]}>
                    Paste a YouTube video URL to transcribe the audio
                  </Text>
                </View>
              )}

              {/* Recording Section */}
              {selectedInputMethod === 'recording' && (
                <View style={styles.inputSection}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="mic" size={16} color={COLORS.success} />
                    <Text style={[styles.label, {
                      color: dark ? COLORS.white : COLORS.greyscale900,
                    }]}>
                      Live Recording *
                    </Text>
                  </View>
                  
                  {!recording ? (
                    <View style={[
                      styles.recordingArea,
                      { 
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                        borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                      }
                    ]}>
                      <TouchableOpacity
                        style={[styles.recordButton, { backgroundColor: COLORS.success }]}
                        onPress={startRecording}
                        disabled={recordingPermission !== Audio.PermissionStatus.GRANTED}
                      >
                        <Ionicons name="mic" size={32} color={COLORS.white} />
                      </TouchableOpacity>
                      <Text style={[styles.recordingText, { color: dark ? COLORS.white : COLORS.black }]}>
                        {recordingPermission === Audio.PermissionStatus.GRANTED 
                          ? 'Tap to start recording' 
                          : 'Microphone permission required'}
                      </Text>
                      <Text style={[styles.recordingSubtext, { color: COLORS.grayscale400 }]}>
                        Record your sermon live for transcription
                      </Text>
                    </View>
                  ) : (
                    <View style={[
                      styles.recordingArea,
                      { 
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                        borderColor: COLORS.success,
                        borderWidth: 2
                      }
                    ]}>
                      {isRecording ? (
                        <>
                          <View style={[styles.recordButton, { backgroundColor: COLORS.error }]}>
                            <Ionicons name="stop" size={32} color={COLORS.white} />
                          </View>
                          <Text style={[styles.recordingText, { color: dark ? COLORS.white : COLORS.black }]}>
                            Recording... {formatTime(recordingDuration)}
                          </Text>
                          <TouchableOpacity
                            style={styles.stopButton}
                            onPress={stopRecording}
                          >
                            <Text style={styles.stopButtonText}>Stop Recording</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
                          <Text style={[styles.recordingText, { color: dark ? COLORS.white : COLORS.black }]}>
                            Recording Complete ({formatTime(recordingDuration)})
                          </Text>
                          <TouchableOpacity
                            style={styles.recordAgainButton}
                            onPress={() => {
                              setRecording(null);
                              setRecordingDuration(0);
                            }}
                          >
                            <Text style={styles.recordAgainButtonText}>Record Again</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Sermon Title */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="document-text" size={16} color={iconColors[2]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Sermon Title *
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  placeholder="Enter sermon title..."
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={sermonDetails.title}
                  onChangeText={(text) => setSermonDetails(prev => ({ ...prev, title: text }))}
                  autoFocus={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Sermon Series */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="library" size={16} color={iconColors[3]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Series (Optional)
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  placeholder="Enter sermon series..."
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={sermonDetails.series}
                  onChangeText={(text) => setSermonDetails(prev => ({ ...prev, series: text }))}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Preacher */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="person" size={16} color={iconColors[4]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Preacher *
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  placeholder="Enter preacher name..."
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={sermonDetails.preacher}
                  onChangeText={(text) => setSermonDetails(prev => ({ ...prev, preacher: text }))}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Date */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar" size={16} color={iconColors[5]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Date
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={sermonDetails.date}
                  onChangeText={(text) => setSermonDetails(prev => ({ ...prev, date: text }))}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  { 
                    backgroundColor: isFormValid() 
                      ? COLORS.primary 
                      : COLORS.grayscale200 
                  }
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid()}
              >
                {loading ? (
                  <Text style={styles.uploadButtonText}>Processing...</Text>
                ) : (
                  <Text style={[
                    styles.uploadButtonText,
                    { 
                      color: isFormValid() 
                        ? COLORS.white 
                        : COLORS.greyscale500 
                    }
                  ]}>
                    {selectedInputMethod === 'document' && 'Upload Sermon'}
                    {selectedInputMethod === 'youtube' && 'Process YouTube Video'}
                    {selectedInputMethod === 'recording' && 'Process Recording'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginLeft: 8,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontFamily: 'regular',
    marginTop: 12,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 4,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  uploadButton: {
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
    marginTop: 0,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
  },
  methodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    padding: 4,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  methodText: {
    fontSize: 16,
    fontFamily: 'regular',
    marginLeft: 8,
  },
  recordingArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingText: {
    fontSize: 16,
    fontFamily: 'regular',
    marginTop: 12,
    textAlign: 'center',
  },
  recordingSubtext: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 4,
    textAlign: 'center',
  },
  stopButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
    color: COLORS.white,
  },
  recordAgainButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordAgainButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
    color: COLORS.white,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default UploadSermonModal; 