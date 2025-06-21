import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    initialDate: Date;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
    visible,
    onClose,
    onConfirm,
    initialDate,
}) => {
    const { dark } = useTheme();
    
    const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDayPress = (day: any) => {
        const [year, month, dayOfMonth] = day.dateString.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, dayOfMonth);
        onConfirm(selectedDate);
    };

    const currentDate = formatDateToString(initialDate);
    const markedDates = {
        [currentDate]: {
            selected: true,
            selectedColor: COLORS.primary,
        },
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.datePickerOverlay}>
                <TouchableOpacity
                    style={styles.datePickerOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.datePickerContainer, {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                }]}>
                    <View style={styles.datePickerHeader}>
                        <View style={styles.datePickerTitleContainer}>
                            <Ionicons name="calendar" size={20} color={COLORS.primary} />
                            <Text style={[styles.datePickerTitle, {
                                color: dark ? COLORS.white : COLORS.greyscale900,
                            }]}>
                                Select Date
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.datePickerButton, { color: COLORS.primary }]}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <Calendar
                        current={currentDate}
                        minDate={new Date().toISOString().split('T')[0]}
                        maxDate="2099-12-31"
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                            calendarBackground: dark ? COLORS.dark2 : COLORS.white,
                            textSectionTitleColor: dark ? COLORS.white : COLORS.greyscale900,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: COLORS.white,
                            todayTextColor: COLORS.primary,
                            dayTextColor: dark ? COLORS.white : COLORS.greyscale900,
                            arrowColor: COLORS.primary,
                            monthTextColor: dark ? COLORS.white : COLORS.greyscale900,
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    datePickerOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    datePickerContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayscale200,
    },
    datePickerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    datePickerTitle: {
        fontSize: 18,
        fontFamily: 'semiBold',
    },
    datePickerButton: {
        fontSize: 16,
        fontFamily: 'medium',
    },
});

export default CalendarModal; 