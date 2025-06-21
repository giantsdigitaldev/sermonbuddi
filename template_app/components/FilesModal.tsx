import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { FileService, ProjectFile } from '@/utils/fileService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Keyboard,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface FilesModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const FilesModal: React.FC<FilesModalProps> = ({
  visible,
  onClose,
  projectId,
  projectName
}) => {
  const { dark } = useTheme();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter files based on search query
  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load files when modal becomes visible
  useEffect(() => {
    if (visible) {
      showModal();
      loadFiles();
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
        
        // Animate modal up with keyboard on iOS - only enough to keep search field visible
        if (Platform.OS === 'ios') {
          // Calculate how much to move up - just enough to keep search field visible
          const moveUpAmount = Math.min(keyboardHeight - 150, keyboardHeight * 0.3); // Max 30% of keyboard height
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
        
        // Animate modal back to original position on iOS
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
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Create file input for web
  useEffect(() => {
    if (Platform.OS === 'web' && !fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      input.addEventListener('change', handleWebFileSelect);
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    return () => {
      if (Platform.OS === 'web' && fileInputRef.current) {
        fileInputRef.current.removeEventListener('change', handleWebFileSelect);
        document.body.removeChild(fileInputRef.current);
        fileInputRef.current = null;
      }
    };
  }, []);

  const showModal = () => {
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

  const hideModal = () => {
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
    });
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const projectFiles = await FileService.getProjectFiles(projectId);
      setFiles(projectFiles);
    } catch (error) {
      console.error('❌ Error loading files:', error);
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleWebFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const selectedFiles = target.files;
    
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log('📁 Uploading file:', file.name);
        
        await FileService.uploadFile(
          projectId,
          file, // Pass File object directly for web
          file.name,
          file.type,
          file.size
        );
      }
      
      // Reload files after upload
      await loadFiles();
      Alert.alert('Success', `${selectedFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      Alert.alert('Error', 'Failed to upload files');
    } finally {
      setUploading(false);
      // Reset the input
      if (target) target.value = '';
    }
  };

  const handleFilePicker = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, trigger the hidden file input
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        return;
      }

      // For mobile, use expo-image-picker
      const ImagePicker = await import('expo-image-picker');
      
      const result = await ImagePicker.default.launchImageLibraryAsync({
        mediaTypes: ImagePicker.default.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        
        for (const asset of result.assets) {
          if (asset.uri) {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            
            // Create a File object from the blob for mobile
            const fileName = asset.fileName! || `file_${Date.now()}`;
            const fileType = asset.type! || 'application/octet-stream';
            const file = new File([blob], fileName, {
              type: fileType,
            });
            
            await FileService.uploadFile(
              projectId,
              file,
              fileName,
              fileType,
              asset.fileSize || 0
            );
          }
        }
        
        await loadFiles();
        Alert.alert('Success', `${result.assets.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick files');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileService.deleteFile(fileId);
              await loadFiles();
              Alert.alert('Success', 'File deleted successfully!');
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const handleFileDownload = async (file: ProjectFile) => {
    try {
      const downloadUrl = await FileService.getFileDownloadUrl(file.id);
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For mobile, open in browser or download
        await Linking.openURL(downloadUrl);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  // Gesture handler for swipe to close ONLY
  const onGestureEvent = (event: any) => {
    const { translationY, state, velocityY } = event.nativeEvent;

    if (state === State.ACTIVE) {
      // Only allow downward dragging (translationY >= 0)
      if (translationY >= 0) {
        panY.setValue(translationY);
      } else {
        // Prevent upward movement
        panY.setValue(0);
      }
    }

    if (state === State.END) {
      // Close if dragged down > 150px or with a flick
      if (translationY > 150 || velocityY > 500) {
        // Animate modal and overlay out in parallel
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
          // Reset pan value for next time modal opens
          panY.setValue(0);
        });
      } else {
        // Snap back to original position
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const renderFileItem = ({ item }: { item: ProjectFile }) => (
    <View style={[styles.fileItem, { 
      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
      borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
    }]}>
      <View style={styles.fileItemLeft}>
        <View style={[styles.fileIconContainer, {
          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
        }]}>
          <Ionicons 
            name={FileService.getFileIcon(item.file_type) as any} 
            size={24} 
            color={COLORS.primary} 
          />
          {/* Supabase storage indicator */}
          <View style={[styles.storageIndicator, {
            backgroundColor: COLORS.success,
          }]}>
            <Text style={styles.storageIndicatorText}>S</Text>
          </View>
        </View>
        <View style={styles.fileItemInfo}>
          <Text style={[styles.fileName, { 
            color: dark ? COLORS.white : COLORS.greyscale900 
          }]} numberOfLines={1}>
            {item.file_name}
          </Text>
          <View style={styles.fileMetadata}>
            <Text style={[styles.fileSize, { 
              color: dark ? COLORS.grayscale400 : COLORS.grayscale700 
            }]}>
              {FileService.formatFileSize(item.file_size)}
            </Text>
            <Text style={[styles.fileDot, { 
              color: dark ? COLORS.grayscale400 : COLORS.grayscale700 
            }]}>•</Text>
            <Text style={[styles.storageProvider, { 
              color: COLORS.success 
            }]}>
              Secure
            </Text>
            <Text style={[styles.fileDot, { 
              color: dark ? COLORS.grayscale400 : COLORS.grayscale700 
            }]}>•</Text>
            <Text style={[styles.fileDate, { 
              color: dark ? COLORS.grayscale400 : COLORS.grayscale700 
            }]}>
              {new Date(item.uploaded_at).toLocaleDateString()}
            </Text>
          </View>
          {item.description && (
            <Text style={[styles.fileDescription, { 
              color: dark ? COLORS.grayscale400 : COLORS.grayscale700 
            }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.fileItemActions}>
        <TouchableOpacity
          style={styles.fileActionButton}
          onPress={() => handleFileDownload(item)}
        >
          <Ionicons name="download" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fileActionButton}
          onPress={() => handleFileDelete(item.id, item.file_name)}
        >
          <Ionicons name="trash" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
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
            onPress={onClose}
          />
        </Animated.View>

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
                backgroundColor: dark ? COLORS.dark1 : COLORS.white,
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.dragHandle, {
                backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
              }]} />
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.modalTitle, { 
                    color: dark ? COLORS.white : COLORS.greyscale900 
                  }]}>
                    Project Files
                  </Text>
                  <Text style={[styles.modalSubtitle, { 
                    color: dark ? COLORS.grayscale400 : COLORS.grayscale700 
                  }]}>
                    {projectName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color={dark ? COLORS.white : COLORS.greyscale900} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchInput, {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
              }]}>
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                />
                <TextInput
                  style={[styles.searchText, { 
                    color: dark ? COLORS.white : COLORS.greyscale900 
                  }]}
                  placeholder="Search files..."
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Upload Button */}
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={[styles.uploadButton, {
                  backgroundColor: uploading ? COLORS.grayscale400 : COLORS.primary,
                }]}
                onPress={handleFilePicker}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
                    <Text style={styles.uploadButtonText}>Upload Files</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Files List */}
            <View style={styles.filesContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={[styles.loadingText, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Loading files...
                  </Text>
                </View>
              ) : filteredFiles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons 
                    name="folder-open" 
                    size={48} 
                    color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                  />
                  <Text style={[styles.emptyTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    No files found
                  </Text>
                  <Text style={[styles.emptySubtitle, {
                    color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                  }]}>
                    {searchQuery ? 'Try adjusting your search' : 'Upload your first file to get started'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredFiles}
                  renderItem={renderFileItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={[
                    styles.filesList,
                    {
                      paddingBottom: keyboardVisible ? keyboardHeight + 20 : 20,
                    }
                  ]}
                />
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'regular',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
  },
  uploadContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
  filesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  filesList: {
    paddingBottom: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  fileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  storageIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageIndicatorText: {
    color: COLORS.white,
    fontSize: 8,
    fontFamily: 'bold',
  },
  fileItemInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginBottom: 4,
  },
  fileMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  fileDot: {
    fontSize: 12,
    fontFamily: 'regular',
    marginHorizontal: 4,
  },
  storageProvider: {
    fontSize: 12,
    fontFamily: 'medium',
  },
  fileDate: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  fileDescription: {
    fontSize: 12,
    fontFamily: 'regular',
    fontStyle: 'italic',
  },
  fileItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FilesModal; 