import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { ProcessedDocument } from '@/utils/documentProcessingService';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import EnhancedUploadSermonModal from './EnhancedUploadSermonModal';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { dark } = useTheme();
    const [uploadModalVisible, setUploadModalVisible] = useState(false);

    const handleUploadDocument = async (file: any, sermonDetails: any) => {
        try {
            console.log("Processing uploaded document:", file.name);
            // The actual processing will be handled by the UploadSermonModal
            // which will call DocumentProcessingService
        } catch (error) {
            console.error("Error processing document:", error);
        }
    };
    const handleYTLink = (data: any) => console.log("YT link", data);
    const handleRecording = (data: any) => console.log("Recording", data);

    const icons: Record<string, (props: {color: string, size: number}) => React.ReactNode> = {
        'home': (props) => <Ionicons name="home-outline" {...props} />,
        'sermons': (props) => <Ionicons name="book-outline" {...props} />,
        'notifications': (props) => <Ionicons name="notifications-outline" {...props} />,
        'schedule': (props) => <Ionicons name="calendar-outline" {...props} />,
    };

    const focusedIcons: Record<string, (props: {color: string, size: number}) => React.ReactNode> = {
        'home': (props) => <Ionicons name="home" {...props} />,
        'sermons': (props) => <Ionicons name="book" {...props} />,
        'notifications': (props) => <Ionicons name="notifications" {...props} />,
        'schedule': (props) => <Ionicons name="calendar" {...props} />,
    }

    const onAddPress = () => {
        setUploadModalVisible(true);
    };

  return (
    <>
    <View style={styles.tabBarContainer}>
        <BlurView
            intensity={Platform.OS === 'ios' ? 80 : 100}
            tint={dark ? 'dark' : 'light'}
            style={styles.blurView}
        >
            <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                if (route.name === 'add') {
                    return <View key={route.key} style={styles.tabItem} />; // Render a placeholder
                }

                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };
                
                const IconComponent = isFocused ? focusedIcons[route.name] : icons[route.name];
                
                if (!IconComponent) {
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <Ionicons 
                                name="help-circle-outline" 
                                size={24} 
                                color={isFocused ? COLORS.primary : (dark ? COLORS.grayscale200 : COLORS.grayscale700)} 
                            />
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tabItem}
                    >
                        <IconComponent size={24} color={isFocused ? COLORS.primary : (dark ? COLORS.grayscale200 : COLORS.grayscale700)} />
                    </TouchableOpacity>
                );
            })}
             </View>
        </BlurView>
        
    </View>
    <TouchableOpacity
        onPress={onAddPress}
        style={styles.addButton}
    >
       <Ionicons name="add" size={32} color={COLORS.white} />
    </TouchableOpacity>
    <EnhancedUploadSermonModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onDocumentProcessed={(document: ProcessedDocument) => {
            console.log('Document processed:', document);
            // Navigate to AI assistant with the processed document
            // You can implement navigation logic here
        }}
        onYouTubeLink={handleYTLink}
        onRecordingComplete={handleRecording}
    />
    </>
  );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        height: 70,
    },
    blurView: {
       flex: 1,
       borderRadius: SIZES.radius * 2,
       overflow: 'hidden',
    },
    tabBar: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        position: 'absolute',
        bottom: 45,
        left: '50%',
        transform: [{ translateX: -30 }],
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 1,
    }
});

export default CustomTabBar; 