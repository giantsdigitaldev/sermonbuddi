import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Task = {
  id: string;
  name: string;
  time: string;
};

type TaskCardProps = {
  task: Task;
  isCompleted?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isCompleted = false, onToggle }) => {
  const [completed, setCompleted] = useState(isCompleted);
  const { dark } = useTheme();

  const handleToggle = () => {
    const newStatus = !completed;
    setCompleted(newStatus);
    if (onToggle) onToggle(task.id, newStatus);
  };

  return (
    <TouchableOpacity onPress={handleToggle} style={[styles.card, { 
      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
      // Match project details shadow styling
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { 
          color: dark ? COLORS.white : COLORS.greyscale900,
        }]}>{task.name}</Text>
        <Text style={[styles.dateTime, { 
          color: dark ? COLORS.white : COLORS.greyScale800,
        }]}>Today - {task.time}</Text>
      </View>
      <TouchableOpacity onPress={handleToggle} style={[styles.checkbox, completed && styles.checked]}>
        {completed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10, // Match project details border radius
    paddingHorizontal: SIZES.padding*2,
    paddingVertical: SIZES.padding,
    // Match project details shadow styling
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,

    // Subtle border for consistency
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: SIZES.base + 4,
    width: SIZES.width - 32, // Adjust for container padding
    height: 92,
    marginHorizontal: 0, // No additional margins since container has padding
    marginVertical: 4,
    alignSelf: 'center', // Center the card within its container
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    marginBottom: 6
  },
  dateTime: {
    fontSize: 14,
    color: COLORS.greyScale800,
    fontFamily: "regular",
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2.8,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});

export default TaskCard