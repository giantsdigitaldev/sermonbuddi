import Button from '@/components/Button';
import { COLORS, icons } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { ProjectService } from '@/utils/projectService';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddNewProject = () => {
  const { dark } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'completed' | 'archived',
    category_id: '1',
    end_date: '',
    owner: '',
    budget: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Project description is required');
      return;
    }

    try {
      setLoading(true);
      
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        metadata: {
          category_id: formData.category_id,
          end_date: formData.end_date || undefined,
          owner: formData.owner || undefined,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          priority: formData.priority,
          total_tasks: 0,
          completed_tasks: 0,
          progress: 0,
          days_left: formData.end_date ? ProjectService.calculateDaysLeft(formData.end_date) : 0,
          members: [],
          tools_needed: [],
          dependencies: [],
          risks: [],
          success_criteria: []
        }
      };

      const result = await ProjectService.createProject(projectData);
      
      if (result) {
        Alert.alert(
          'Success',
          'Project created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                // Navigate to the new project details
                navigation.navigate('projectdetails', { projectId: result.id });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={[styles.backIcon, {
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>
          Add New Project
        </Text>
        <View style={{ width: 24 }} />
      </View>
    );
  };

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    multiline: boolean = false,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>
          {label}
        </Text>
        <TextInput
          style={[styles.textInput, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            color: dark ? COLORS.white : COLORS.greyscale900,
            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
            height: multiline ? 100 : 50
          }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
          multiline={multiline}
          keyboardType={keyboardType}
        />
      </View>
    );
  };

  const renderPickerField = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onSelect: (value: string) => void
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>
          {label}
        </Text>
        <View style={styles.pickerContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.pickerOption, {
                backgroundColor: value === option.value ? COLORS.primary : 
                  (dark ? COLORS.dark2 : COLORS.white),
                borderColor: value === option.value ? COLORS.primary : 
                  (dark ? COLORS.grayscale700 : COLORS.grayscale200)
              }]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.pickerOptionText, {
                color: value === option.value ? COLORS.white : 
                  (dark ? COLORS.white : COLORS.greyscale900)
              }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        {renderHeader()}
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {renderFormField(
            'Project Name *',
            formData.name,
            (text) => handleInputChange('name', text),
            'Enter project name'
          )}

          {renderFormField(
            'Description *',
            formData.description,
            (text) => handleInputChange('description', text),
            'Enter project description',
            true
          )}

          {renderPickerField(
            'Status',
            formData.status,
            [
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
              { label: 'Archived', value: 'archived' }
            ],
            (value) => handleInputChange('status', value)
          )}

          {renderPickerField(
            'Priority',
            formData.priority,
            [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' }
            ],
            (value) => handleInputChange('priority', value)
          )}

          {renderPickerField(
            'Category',
            formData.category_id,
            [
              { label: 'All', value: '1' },
              { label: 'UI/UX', value: '2' },
              { label: 'Illustration', value: '3' },
              { label: 'Website', value: '4' },
              { label: 'SEO', value: '5' },
              { label: 'Mobile App', value: '6' }
            ],
            (value) => handleInputChange('category_id', value)
          )}

          {renderFormField(
            'End Date',
            formData.end_date,
            (text) => handleInputChange('end_date', text),
            'YYYY-MM-DD'
          )}

          {renderFormField(
            'Project Owner',
            formData.owner,
            (text) => handleInputChange('owner', text),
            'Enter project owner name'
          )}

          {renderFormField(
            'Budget',
            formData.budget,
            (text) => handleInputChange('budget', text),
            'Enter budget amount',
            false,
            'numeric'
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Creating...' : 'Create Project'}
              filled
              onPress={handleSubmit}
              disabled={loading}
              style={styles.createButton}
            />
            
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              style={[styles.cancelButton, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale200
              }]}
              textColor={dark ? COLORS.white : COLORS.greyscale900}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backIcon: {
    height: 24,
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 20,
    gap: 12,
  },
  createButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});

export default AddNewProject; 