import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { DocumentProcessingService, ProcessedDocument } from '@/utils/documentProcessingService';
import { OCRService } from '@/utils/ocrService';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface SermonDetails {
  title: string;
  series: string;
  preacher: string;
  date: string;
  type: 'sermon' | 'study' | 'notes' | 'general';
}

interface EnhancedUploadSermonModalProps {
  visible: boolean;
  onClose: () => void;
  onDocumentProcessed: (document: ProcessedDocument) => void;
  onYouTubeLink: (youtubeUrl: string, sermonDetails: SermonDetails) => void;
  onRecordingComplete: (recording: Audio.Recording, sermonDetails: SermonDetails) => void;
}

type InputMethod = 'document' | 'youtube' | 'recording';

interface ProcessingStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

const EnhancedUploadSermonModal: React.FC<EnhancedUploadSermonModalProps> = ({
  visible,
  onClose,
  onDocumentProcessed,
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
    type: 'sermon',
  });
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingPermission, setRecordingPermission] = useState<Audio.PermissionStatus | null>(null);
  
  // Modal animation state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Initialize processing steps
  const initializeProcessingSteps = () => {
    const steps: ProcessingStep[] = [
      {
        id: 'upload',
        title: 'Uploading file to storage',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'extract',
        title: 'Extracting text content',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'ocr',
        title: 'Processing with OCR (if needed)',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'markdown',
        title: 'Converting to markdown',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'save',
        title: 'Saving to database',
        status: 'pending',
        progress: 0,
      },
    ];
    setProcessingSteps(steps);
    setCurrentStep(0);
    setOverallProgress(0);
  };

  const updateProcessingStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setProcessingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
    
    // Update overall progress
    setProcessingSteps(prev => {
      const completedSteps = prev.filter(s => s.status === 'completed').length;
      const totalSteps = prev.length;
      const progress = (completedSteps / totalSteps) * 100;
      setOverallProgress(progress);
      return prev;
    });
  };

  // Modal animations
  useEffect(() => {
    if (visible) {
      initializeProcessingSteps();
      openModal();
    } else {
      closeModal();
    }
  }, [visible]);

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
      resetForm();
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setYoutubeUrl('');
    setSermonDetails({
      title: '',
      series: '',
      preacher: '',
      date: new Date().toISOString().split('T')[0],
      type: 'sermon',
    });
    setIsProcessing(false);
    setProcessingSteps([]);
    setCurrentStep(0);
    setOverallProgress(0);
  };

  // Document processing
  const handleFilePick = async () => {
    try {
      const supportedTypes = OCRService.getSupportedFileTypes();
      
      const result = await DocumentPicker.getDocumentAsync({
        type: supportedTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile(file);
        
        // Auto-populate title if empty
        if (!sermonDetails.title) {
          const titleFromFilename = file.name.replace(/\.[^/.]+$/, '');
          setSermonDetails(prev => ({
            ...prev,
            title: titleFromFilename,
          }));
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processDocument = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    try {
      setIsProcessing(true);
      initializeProcessingSteps();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Step 1: Upload
      updateProcessingStep('upload', { status: 'processing', message: 'Uploading file...' });
      
      // Step 2: Process with DocumentProcessingService
      const processedDocument = await DocumentProcessingService.processDocument(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType || 'application/octet-stream',
        user.id,
        {
          title: sermonDetails.title,
          author: sermonDetails.preacher,
          type: sermonDetails.type,
          enableOCR: true,
          ocrLanguage: 'eng',
        }
      );

      // Update all steps as completed
      processingSteps.forEach(step => {
        updateProcessingStep(step.id, { status: 'completed', progress: 100 });
      });

      setOverallProgress(100);

      // Show success and close modal
      Alert.alert(
        'Success!', 
        'Document processed successfully. The content has been extracted and converted to markdown.',
        [
          {
            text: 'View Results',
            onPress: () => {
              closeModal();
              onDocumentProcessed(processedDocument);
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Document processing failed:', error);
      
      // Update current step with error
      if (processingSteps[currentStep]) {
        updateProcessingStep(processingSteps[currentStep].id, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Processing failed'
        });
      }

      Alert.alert(
        'Processing Failed',
        error instanceof Error ? error.message : 'Failed to process document. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Form validation
  const isFormValid = () => {
    if (!sermonDetails.title.trim() || !sermonDetails.preacher.trim()) {
      return false;
    }

    switch (selectedInputMethod) {
      case 'document':
        return !!selectedFile;
      case 'youtube':
        return youtubeUrl.trim() && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(youtubeUrl);
      case 'recording':
        return !!recording;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    switch (selectedInputMethod) {
      case 'document':
        processDocument();
        break;
      case 'youtube':
        onYouTubeLink(youtubeUrl, sermonDetails);
        closeModal();
        break;
      case 'recording':
        if (recording) {
          onRecordingComplete(recording, sermonDetails);
          closeModal();
        }
        break;
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
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={!isProcessing ? closeModal : undefined}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              transform: [
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>
                {isProcessing ? 'Processing Document...' : 'Upload Content'}
              </Text>
              {!isProcessing && (
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={dark ? COLORS.white : COLORS.black} />
                </TouchableOpacity>
              )}
            </View>

            {/* Processing Progress */}
            {isProcessing && (
              <View style={styles.progressContainer}>
                <View style={styles.overallProgress}>
                  <Text style={[styles.progressText, { color: dark ? COLORS.white : COLORS.black }]}>
                    Overall Progress: {Math.round(overallProgress)}%
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: COLORS.grayscale200 }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${overallProgress}%`,
                          backgroundColor: COLORS.primary 
                        }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.stepsList}>
                  {processingSteps.map((step, index) => (
                    <View key={step.id} style={styles.stepItem}>
                      <View style={[
                        styles.stepIcon,
                        {
                          backgroundColor: 
                            step.status === 'completed' ? COLORS.success :
                            step.status === 'processing' ? COLORS.primary :
                            step.status === 'error' ? COLORS.error :
                            COLORS.grayscale400
                        }
                      ]}>
                        {step.status === 'completed' && (
                          <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        )}
                        {step.status === 'processing' && (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        )}
                        {step.status === 'error' && (
                          <Ionicons name="close" size={16} color={COLORS.white} />
                        )}
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                          {step.title}
                        </Text>
                        {step.message && (
                          <Text style={[styles.stepMessage, { color: COLORS.grayscale400 }]}>
                            {step.message}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Content Form (only show when not processing) */}
            {!isProcessing && (
              <>
                {/* Input Method Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                    Select Input Method
                  </Text>
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
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                      Select Document
                    </Text>
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
                        Supports: Images (JPG, PNG), PDFs, Word docs, Text files
                      </Text>
                      {selectedFile && (
                        <Text style={[styles.uploadSubtext, { color: COLORS.success }]}>
                          ✓ OCR and text extraction will be applied automatically
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sermon Details Form */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                    Content Details
                  </Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>
                      Title *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                          color: dark ? COLORS.white : COLORS.black,
                          borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                        }
                      ]}
                      value={sermonDetails.title}
                      onChangeText={(text) => setSermonDetails(prev => ({ ...prev, title: text }))}
                      placeholder="Enter title"
                      placeholderTextColor={COLORS.grayscale400}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>
                      Author/Preacher *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                          color: dark ? COLORS.white : COLORS.black,
                          borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                        }
                      ]}
                      value={sermonDetails.preacher}
                      onChangeText={(text) => setSermonDetails(prev => ({ ...prev, preacher: text }))}
                      placeholder="Enter author/preacher name"
                      placeholderTextColor={COLORS.grayscale400}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>
                      Type
                    </Text>
                    <View style={styles.typeSelector}>
                      {(['sermon', 'study', 'notes', 'general'] as const).map(type => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typeOption,
                            { 
                              backgroundColor: sermonDetails.type === type ? COLORS.primary + '20' : (dark ? COLORS.dark3 : COLORS.grayscale100),
                              borderColor: sermonDetails.type === type ? COLORS.primary : (dark ? COLORS.grayscale700 : COLORS.grayscale200),
                            }
                          ]}
                          onPress={() => setSermonDetails(prev => ({ ...prev, type }))}
                        >
                          <Text style={[
                            styles.typeText,
                            { color: sermonDetails.type === type ? COLORS.primary : (dark ? COLORS.white : COLORS.black) }
                          ]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: isFormValid() ? COLORS.primary : COLORS.grayscale400,
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={!isFormValid()}
                >
                  <Text style={styles.submitButtonText}>
                    {selectedInputMethod === 'document' ? 'Process Document' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  progressContainer: {
    padding: 20,
  },
  overallProgress: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'medium',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  stepMessage: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'bold',
    marginBottom: 15,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  methodOption: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 12,
    fontFamily: 'medium',
  },
  uploadArea: {
    padding: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: 'medium',
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontFamily: 'medium',
    marginBottom: 8,
  },
  input: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'regular',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  submitButton: {
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
});

export default EnhancedUploadSermonModal; 