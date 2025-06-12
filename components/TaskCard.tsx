import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

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
    borderRadius: 20,
    paddingHorizontal: SIZES.padding*2,
    paddingVertical: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    marginBottom: SIZES.base,
    width: SIZES.width - 35,
    height: 92,
    marginLeft: 1.5,
    marginRight: 1.5,
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