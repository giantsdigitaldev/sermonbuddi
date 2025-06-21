import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  notes?: string;
}

type SubtaskCardProps = {
  subtask: TaskSubtask;
  onToggle?: (id: string, completed: boolean) => void;
  onUpdate?: (id: string, updates: Partial<TaskSubtask>) => void;
  onDelete?: (id: string) => void;
};

const SubtaskCard: React.FC<SubtaskCardProps> = ({ 
  subtask, 
  onToggle, 
  onUpdate,
  onDelete 
}) => {
  const [completed, setCompleted] = useState(subtask.completed);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editDescription, setEditDescription] = useState(subtask.description || '');
  const [editNotes, setEditNotes] = useState(subtask.notes || '');
  const { dark } = useTheme();

  const handleShortPress = () => {
    const newStatus = !completed;
    setCompleted(newStatus);
    if (onToggle) onToggle(subtask.id, newStatus);
  };

  const handleLongPress = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Subtask title cannot be empty');
      return;
    }

    // Only include fields that exist in the database
    const updates: Partial<TaskSubtask> = {
      title: editTitle.trim(),
    };
    
    // Only add description and notes if they have values
    // (The database columns may not exist yet)
    if (editDescription.trim()) {
      updates.description = editDescription.trim();
    }
    if (editNotes.trim()) {
      updates.notes = editNotes.trim();
    }

    if (onUpdate) {
      onUpdate(subtask.id, updates);
    }
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(subtask.title);
    setEditDescription(subtask.description || '');
    setEditNotes(subtask.notes || '');
    setShowEditModal(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subtask',
      'Are you sure you want to delete this subtask?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(subtask.id);
            }
            setShowEditModal(false);
          }
        }
      ]
    );
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleShortPress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[styles.card, { 
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          shadowColor: dark ? 'rgba(231, 230, 230, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: dark ? 0.8 : 0.8,
          shadowRadius: 1,
          elevation: 1,
          borderColor: dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
          opacity: completed ? 0.6 : 1,
        }]}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.title, { 
            color: dark ? COLORS.white : COLORS.greyscale900,
            textDecorationLine: completed ? 'line-through' : 'none',
          }]}>{subtask.title}</Text>
          {(subtask.description || subtask.notes) && (
            <Text style={[styles.subtitle, { 
              color: dark ? COLORS.grayscale400 : COLORS.greyScale800,
            }]}>
              {subtask.description || subtask.notes}
            </Text>
          )}
          <Text style={[styles.dateTime, { 
            color: dark ? COLORS.grayscale400 : COLORS.greyScale800,
          }]}>
            Created {new Date(subtask.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleShortPress} 
          style={[styles.checkbox, completed && styles.checked]}
        >
          {completed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={[styles.modalContainer, { 
          backgroundColor: dark ? COLORS.dark1 : COLORS.white 
        }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={[styles.modalButton, { color: COLORS.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900 
            }]}>Edit Subtask</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={[styles.modalButton, { color: COLORS.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { 
                color: dark ? COLORS.white : COLORS.greyscale900 
              }]}>Title *</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100,
                  color: dark ? COLORS.white : COLORS.greyscale900,
                  borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                }]}
                value={editTitle}
                onChangeText={setEditTitle}
                                 placeholder="Enter subtask title"
                 placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                autoComplete="off"
                autoCorrect={false}
                selectTextOnFocus={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { 
                color: dark ? COLORS.white : COLORS.greyscale900 
              }]}>Description</Text>
              <TextInput
                style={[styles.textAreaInput, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100,
                  color: dark ? COLORS.white : COLORS.greyscale900,
                  borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                }]}
                value={editDescription}
                onChangeText={setEditDescription}
                                 placeholder="Enter description (optional)"
                 placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                multiline
                numberOfLines={3}
                autoComplete="off"
                autoCorrect={false}
                selectTextOnFocus={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { 
                color: dark ? COLORS.white : COLORS.greyscale900 
              }]}>Notes</Text>
              <TextInput
                style={[styles.textAreaInput, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100,
                  color: dark ? COLORS.white : COLORS.greyscale900,
                  borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                }]}
                value={editNotes}
                onChangeText={setEditNotes}
                                 placeholder="Enter notes (optional)"
                 placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                multiline
                numberOfLines={3}
                autoComplete="off"
                autoCorrect={false}
                selectTextOnFocus={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.deleteButton, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100,
                borderColor: COLORS.red,
              }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
              <Text style={[styles.deleteButtonText, { color: COLORS.red }]}>
                Delete Subtask
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: SIZES.padding * 1.5,
    paddingVertical: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    marginBottom: SIZES.base + 4,
    width: SIZES.width - 32,
    minHeight: 70,
    marginHorizontal: 8,
    marginVertical: 4,
    alignSelf: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.greyScale800,
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 12,
    color: COLORS.greyScale800,
    fontFamily: "regular",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
  },
  modalButton: {
    fontSize: 16,
    fontFamily: 'semiBold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
    backgroundColor: COLORS.grayscale100,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
    backgroundColor: COLORS.grayscale100,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginLeft: 8,
  },
});

export default SubtaskCard; 