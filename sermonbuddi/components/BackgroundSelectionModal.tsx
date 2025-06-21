import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import React from 'react';
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const backgroundTemplates = [
    { id: '1', image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=2024&auto=format&fit=crop' },
    { id: '2', image: 'https://images.unsplash.com/photo-1554189097-949741249b24?q=80&w=2592&auto=format&fit=crop' },
    { id: '3', image: 'https://images.unsplash.com/photo-1557682224-5b8590b9ec98?q=80&w=2644&auto=format&fit=crop' },
    { id: '4', image: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop' },
    { id: '5', image: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?q=80&w=2532&auto=format&fit=crop' },
    { id: '6', image: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=2574&auto=format&fit=crop' },
];

interface BackgroundSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (image: string) => void;
}

const BackgroundSelectionModal: React.FC<BackgroundSelectionModalProps> = ({ visible, onClose, onSelect }) => {
    const { dark } = useTheme();

    const renderItem = ({ item }: { item: { id: string, image: string }}) => (
        <TouchableOpacity onPress={() => onSelect(item.image)} style={styles.templateItem}>
            <Image source={{ uri: item.image }} style={styles.templateImage} />
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.modalContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                    <Text style={[styles.modalTitle, { color: dark ? COLORS.white : COLORS.black }]}>Choose a Background</Text>
                    <FlatList
                        data={backgroundTemplates}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '60%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SIZES.padding,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: SIZES.padding,
    },
    listContainer: {
        paddingBottom: SIZES.padding,
    },
    templateItem: {
        flex: 1,
        margin: SIZES.base,
        height: 200,
        borderRadius: SIZES.radius,
        overflow: 'hidden',
    },
    templateImage: {
        width: '100%',
        height: '100%',
    },
});

export default BackgroundSelectionModal; 