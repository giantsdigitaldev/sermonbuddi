import Button from '@/components/Button';
import Toast from '@/components/Toast';
import UserAvatar from '@/components/UserAvatar';
import { COLORS, icons, SIZES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { ProjectService } from '@/utils/projectService';
import { SearchUser, TeamService } from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from "react-native-calendars";
import RBSheet from "react-native-raw-bottom-sheet";
import { SafeAreaView } from 'react-native-safe-area-context';

const AddNewProject = () => {
  const { dark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    // Basic Project Info
    name: '',
    description: '',
    category: 'web development',
    priority: 'medium' as 'low' | 'medium' | 'high',
    edc_date: '', // Estimated Date of Completion
    fud_date: '', // Follow Up Date
    status: 'active' as 'active' | 'completed' | 'archived' | 'on_hold',
    budget: '',
    
    // Team & Resources
    project_owner: '',
    project_lead: '',
    team_members: [] as string[],
    tools_needed: '',
    dependencies: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  
  // Team search and selection states
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<SearchUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState<SearchUser[]>([]);
  
  // Calendar states
  const [activeCalendar, setActiveCalendar] = useState<'edc' | 'fud' | null>(null);
  const [selectedEdcDate, setSelectedEdcDate] = useState('');
  const [selectedFudDate, setSelectedFudDate] = useState('');
  
  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  
  // Bottom sheet refs
  const refEdcCalendarRBSheet = React.useRef<any>(null);
  const refFudCalendarRBSheet = React.useRef<any>(null);
  const refTeamSearchRBSheet = React.useRef<any>(null);
  
  // Search timeout ref
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as 'success' | 'error' | 'warning' | 'info'
  });

  // Categories options
  const categories = [
    'web development',
    'mobile development',
    'data science',
    'e-commerce',
    'marketing',
    'design',
    'consulting',
    'other'
  ];

  // Priority options
  const priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ];

  // Status options
  const statuses = [
    { label: 'Active', value: 'active' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' }
  ];

  // Load team members when component mounts
  useEffect(() => {
    loadTeamMembers();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setSelectedEdcDate(today);
    setSelectedFudDate(today);
  }, []);

  // Format date for display in input field
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const loadTeamMembers = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingTeamMembers(true);
      const searchResult = await TeamService.searchUsers('');
      
      // Handle the SearchResult return type
      const members = searchResult.users || [];
      
      // Add current user as default option
      const allMembers = [
        {
          id: user.id,
          first_name: user.user_metadata?.first_name || 'You',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          full_name: `${user.user_metadata?.first_name || 'You'} ${user.user_metadata?.last_name || ''}`.trim()
        },
        ...members.map(member => ({
          id: member.id,
          first_name: member.full_name?.split(' ')[0] || '',
          last_name: member.full_name?.split(' ').slice(1).join(' ') || '',
          email: member.email || '',
          full_name: member.full_name || member.username || member.email || ''
        }))
      ];
      setTeamMembers(allMembers);
      
      // Set current user as default owner and lead
      if (!formData.project_owner && allMembers.length > 0) {
        setFormData(prev => ({
          ...prev,
          project_owner: allMembers[0].full_name || allMembers[0].email,
          project_lead: allMembers[0].full_name || allMembers[0].email
        }));
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      // Fallback to current user only
      const currentUser = {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'You',
        last_name: user.user_metadata?.last_name || '',
        email: user.email || '',
        full_name: `${user.user_metadata?.first_name || 'You'} ${user.user_metadata?.last_name || ''}`.trim()
      };
      setTeamMembers([currentUser]);
      setFormData(prev => ({
        ...prev,
        project_owner: currentUser.full_name || currentUser.email,
        project_lead: currentUser.full_name || currentUser.email
      }));
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Project name is required');
    }
    
    if (!formData.description.trim()) {
      errors.push('Project description is required');
    }
    
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      errors.push('Budget must be a valid number');
    }
    
    if (formData.edc_date && new Date(formData.edc_date) < new Date()) {
      errors.push('Estimated completion date cannot be in the past');
    }

    if (!formData.project_owner.trim()) {
      errors.push('Project owner is required');
    }

    if (!formData.project_lead.trim()) {
      errors.push('Project lead is required');
    }
    
    return errors;
  };

  // Handle user search with debouncing
  const handleUserSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 Searching users with query:', query);
    setSearchLoading(true);
    
    try {
      const searchResult = await TeamService.searchUsers(query, 20);
      // Extract users array from the search result
      const users = Array.isArray(searchResult) ? searchResult : searchResult.users || [];
      setSearchResults(users);
      console.log('✅ User search results:', users.length);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle search change with debouncing
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce the search to prevent excessive API calls
    searchTimeoutRef.current = setTimeout(() => {
      handleUserSearch(text);
    }, 300);
  }, [handleUserSearch]);

  // Handle user selection toggle
  const handleUserToggle = (user: SearchUser) => {
    const isSelected = tempSelectedUsers.some(u => u.id === user.id);
    
    if (isSelected) {
      setTempSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setTempSelectedUsers(prev => [...prev, user]);
    }
    
    console.log('👤 User toggled:', user.full_name, isSelected ? 'removed' : 'added');
  };

  // Handle confirming user selection
  const handleConfirmUserSelection = () => {
    const newUsers = tempSelectedUsers.filter(user => 
      !selectedTeamMembers.some(selected => selected.id === user.id)
    );
    
    setSelectedTeamMembers(prev => [...prev, ...newUsers]);
    setTempSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    refTeamSearchRBSheet.current?.close();
    
    console.log('✅ Users selected for project:', newUsers.map(u => u.full_name));
  };

  // Handle opening team search
  const handleOpenTeamSearch = () => {
    setTempSelectedUsers([]);
    refTeamSearchRBSheet.current?.open();
  };

  // Remove selected team member
  const removeTeamMember = (userId: string) => {
    setSelectedTeamMembers(prev => prev.filter(member => member.id !== userId));
  };

  useEffect(() => {
    return () => {
      // Clear any pending search timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      console.log('🚀 Creating project with data:', formData);
      
      // Create project with selected team members
      const projectData = {
        user_id: user?.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        team_members: selectedTeamMembers.map(member => member.id),
        metadata: {
          category: formData.category,
          priority: formData.priority,
          edc_date: formData.edc_date || undefined,
          fud_date: formData.fud_date || undefined,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          project_owner: formData.project_owner || undefined,
          project_lead: formData.project_lead || undefined,
          tools_needed: formData.tools_needed ? formData.tools_needed.split(',').map(tool => tool.trim()).filter(tool => tool.length > 0) : [],
          dependencies: formData.dependencies ? formData.dependencies.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0) : [],
          total_tasks: 0,
          completed_tasks: 0,
          progress: 0,
          days_left: formData.edc_date ? ProjectService.calculateDaysLeft(formData.edc_date) : 0,
          team_members: selectedTeamMembers.map(member => ({
            id: member.id,
            full_name: member.full_name,
            username: member.username,
            avatar: member.avatar_url || `user${Math.floor(Math.random() * 11) + 1}.jpeg`
          })),
          risks: [],
          success_criteria: []
        }
      };
      
      const result = await ProjectService.createProject(projectData);
      
      if (result) {
        showToast('Project created successfully!', 'success');
        
        // Navigate to the project dashboard after a brief delay
        setTimeout(() => {
          router.push(`/dashboard/${result.id}`);
        }, 1500);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error: any) {
      console.error('❌ Error creating project:', error);
      showToast(error.message || 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle calendar date selection
  const handleDateSelect = (type: 'edc' | 'fud', dateString: string) => {
    if (type === 'edc') {
      setSelectedEdcDate(dateString);
      setFormData(prev => ({ ...prev, edc_date: dateString }));
      refEdcCalendarRBSheet.current?.close();
    } else {
      setSelectedFudDate(dateString);
      setFormData(prev => ({ ...prev, fud_date: dateString }));
      refFudCalendarRBSheet.current?.close();
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: dark ? COLORS.white : COLORS.black
              }]} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Create New Project</Text>
        </View>
      </View>
    )
  };

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    multiline: boolean = false,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    required: boolean = false
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: dark ? COLORS.white : COLORS.black }]}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textArea,
            {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              color: dark ? COLORS.white : COLORS.black,
              borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          keyboardType={keyboardType}
        />
      </View>
    );
  };

  const renderDropdownField = (
    label: string,
    value: string,
    options: { label: string; value: string }[] | string[],
    onSelect: (value: string) => void,
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void,
    required: boolean = false
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: dark ? COLORS.white : COLORS.black }]}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
            }
          ]}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={[styles.dropdownText, { color: dark ? COLORS.white : COLORS.black }]}>
            {typeof options[0] === 'string' 
              ? value || 'Select...'
              : (options as { label: string; value: string }[]).find(opt => opt.value === value)?.label || 'Select...'
            }
          </Text>
          <Image
            source={icons.arrowDown}
            style={[styles.dropdownIcon, { tintColor: dark ? COLORS.white : COLORS.black }]}
          />
        </TouchableOpacity>
        
        {showDropdown && (
          <View style={[
            styles.dropdownMenu,
            { backgroundColor: dark ? COLORS.dark2 : COLORS.white }
          ]}>
            {(typeof options[0] === 'string' ? options as string[] : (options as { label: string; value: string }[])).map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownOption}
                onPress={() => {
                  const selectedValue = typeof option === 'string' ? option : option.value;
                  onSelect(selectedValue);
                  setShowDropdown(false);
                }}
              >
                <Text style={[styles.dropdownOptionText, { color: dark ? COLORS.white : COLORS.black }]}>
                  {typeof option === 'string' ? option : option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDatePickerField = (
    label: string,
    value: string,
    onPress: () => void,
    required: boolean = false
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: dark ? COLORS.white : COLORS.black }]}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[
            styles.dateButton,
            {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
            }
          ]}
          onPress={onPress}
        >
          <Image
            source={icons.calendar5}
            style={[styles.calendarIcon, { tintColor: COLORS.primary }]}
          />
          <Text style={[styles.dateText, { color: dark ? COLORS.white : COLORS.black }]}>
            {value ? formatDateForDisplay(value) : 'Select date'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCalendarBottomSheet = (
    ref: React.RefObject<any>,
    title: string,
    selectedDate: string,
    onDateSelect: (dateString: string) => void
  ) => {
    return (
      <RBSheet
        ref={ref}
        closeOnPressMask={true}
        height={420}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
          },
          container: {
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            height: 420,
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            alignItems: "center",
          }
        }}
      >
        <Text style={[styles.bottomSheetTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>{title}</Text>
        <View style={[styles.separateLine, {
          backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
          marginVertical: 12
        }]} />
        <View style={{ width: SIZES.width - 32 }}>
          <Calendar
            current={selectedDate || new Date().toISOString().split('T')[0]}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate={"2099-12-31"}
            onDayPress={(day: any) => onDateSelect(day.dateString)}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            theme={{
              backgroundColor: dark ? COLORS.dark2 : "#F8FAFC",
              calendarBackground: dark ? COLORS.dark2 : "#F8FAFC",
              textSectionTitleColor: dark ? COLORS.white : "#000",
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: "#fff",
              todayTextColor: COLORS.primary,
              dayTextColor: dark ? COLORS.grayscale200 : "#222",
              arrowColor: COLORS.primary,
              monthTextColor: dark ? COLORS.white : "#000",
            }}
          />
        </View>
      </RBSheet>
    );
  };

  const renderTeamMembersSection = () => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Team Members
          <Text style={styles.optionalText}> (Optional)</Text>
        </Text>
        
        {/* Selected Team Members Display */}
        {selectedTeamMembers.length > 0 && (
          <View style={styles.selectedMembersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedTeamMembers.map((member, index) => (
                <View key={member.id} style={styles.selectedMemberItem}>
                  <UserAvatar
                    size={40}
                    userId={member.id}
                    style={styles.selectedMemberAvatar}
                  />
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() => removeTeamMember(member.id)}
                  >
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                  <Text style={styles.selectedMemberName} numberOfLines={1}>
                    {member.full_name?.split(' ')[0] || member.username}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Add Team Member Button */}
        <TouchableOpacity
          style={styles.addTeamMemberButton}
          onPress={handleOpenTeamSearch}
        >
          <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addTeamMemberText}>
            {selectedTeamMembers.length > 0 ? 'Add More Members' : 'Add Team Members'}
          </Text>
        </TouchableOpacity>
        
        {selectedTeamMembers.length > 0 && (
          <Text style={styles.teamMemberCount}>
            {selectedTeamMembers.length} member{selectedTeamMembers.length > 1 ? 's' : ''} selected
          </Text>
        )}
      </View>
    );
  };

  const renderTeamSearchModal = () => {
    return (
      <RBSheet
        ref={refTeamSearchRBSheet}
        closeOnPressMask={true}
        height={500}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
          },
          container: {
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            height: 500,
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            alignItems: "center",
          }
        }}
      >
        <Text style={[styles.bottomSheetTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>Add Team Members</Text>
        <View style={[styles.separateLine, {
          backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
          marginVertical: 12
        }]} />
        
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, {
              color: dark ? COLORS.white : COLORS.greyscale900,
              backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
            }]}
            placeholder="Search users..."
            placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus={false}
            blurOnSubmit={false}
            returnKeyType="search"
            keyboardType="default"
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            selectTextOnFocus={false}
            clearButtonMode="while-editing"
          />
        </View>

        {searchLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              style={{ width: '100%', paddingHorizontal: 20, maxHeight: 300 }}
              renderItem={({ item }) => {
                const isSelected = tempSelectedUsers.some(u => u.id === item.id);
                const isAlreadySelected = selectedTeamMembers.some(u => u.id === item.id);
                
                return (
                  <TouchableOpacity
                    style={[styles.userSearchItem, {
                      opacity: isAlreadySelected ? 0.5 : 1,
                      backgroundColor: isSelected ? COLORS.primary + '20' : 'transparent'
                    }]}
                    onPress={() => !isAlreadySelected && handleUserToggle(item)}
                    disabled={isAlreadySelected}
                  >
                    <UserAvatar
                      size={40}
                      userId={item.id}
                      style={styles.searchUserAvatar}
                    />
                    <View style={styles.searchUserInfo}>
                      <Text style={[styles.searchUserName, {
                        color: dark ? COLORS.white : COLORS.greyscale900
                      }]}>{item.full_name}</Text>
                      <Text style={[styles.searchUserHandle, {
                        color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                      }]}>@{item.username || 'unknown'}</Text>
                    </View>
                    {isAlreadySelected ? (
                      <Text style={styles.alreadySelectedText}>Selected</Text>
                    ) : (
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "person-add"}
                        size={20}
                        color={isSelected ? COLORS.primary : COLORS.grayscale400}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            
            {tempSelectedUsers.length > 0 && (
              <View style={styles.selectionFooter}>
                <Text style={[styles.selectionCount, {
                  color: dark ? COLORS.white : COLORS.greyscale900
                }]}>
                  {tempSelectedUsers.length} member{tempSelectedUsers.length > 1 ? 's' : ''} selected
                </Text>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmUserSelection}
                >
                  <Text style={styles.confirmButtonText}>
                    Add Selected
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </RBSheet>
    );
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
      {renderHeader()}
      
      <ScrollView 
        style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Project Information */}
        <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          PROJECT INFORMATION
        </Text>

        {renderFormField(
          'Project Name',
          formData.name,
          (text) => handleInputChange('name', text),
          'Enter project name',
          false,
          'default',
          true
        )}

        {renderFormField(
          'Project Description',
          formData.description,
          (text) => handleInputChange('description', text),
          'Describe your project',
          true,
          'default',
          true
        )}

        {renderDropdownField(
          'Category',
          formData.category,
          categories,
          (value) => handleInputChange('category', value),
          showCategoryDropdown,
          setShowCategoryDropdown,
          true
        )}

        {renderDropdownField(
          'Priority',
          formData.priority,
          priorities,
          (value) => handleInputChange('priority', value),
          showPriorityDropdown,
          setShowPriorityDropdown,
          true
        )}

        {renderDatePickerField(
          'EDC (Estimated Date of Completion)',
          formData.edc_date,
          () => refEdcCalendarRBSheet.current?.open(),
          true
        )}

        {renderDatePickerField(
          'FUD (Follow Up Date)',
          formData.fud_date,
          () => refFudCalendarRBSheet.current?.open()
        )}

        {renderDropdownField(
          'Status',
          formData.status,
          statuses,
          (value) => handleInputChange('status', value),
          showStatusDropdown,
          setShowStatusDropdown,
          true
        )}

        {renderFormField(
          'Budget',
          formData.budget,
          (text) => handleInputChange('budget', text),
          'Enter budget amount',
          false,
          'numeric'
        )}

        {/* Team & Resources Section */}
        <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.black, marginTop: 32 }]}>
          TEAM & RESOURCES
        </Text>

        {renderTeamMembersSection()}

        {renderDropdownField(
          'Project Owner',
          formData.project_owner,
          teamMembers.map(member => ({ label: member.full_name || member.email, value: member.full_name || member.email })),
          (value) => handleInputChange('project_owner', value),
          showOwnerDropdown,
          setShowOwnerDropdown,
          true
        )}

        {renderDropdownField(
          'Project Lead',
          formData.project_lead,
          teamMembers.map(member => ({ label: member.full_name || member.email, value: member.full_name || member.email })),
          (value) => handleInputChange('project_lead', value),
          showLeadDropdown,
          setShowLeadDropdown,
          true
        )}

        {renderFormField(
          'Tools Needed',
          formData.tools_needed,
          (text) => handleInputChange('tools_needed', text),
          'List tools and technologies needed',
          true
        )}

        {renderFormField(
          'Dependencies',
          formData.dependencies,
          (text) => handleInputChange('dependencies', text),
          'List project dependencies',
          true
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Creating..." : "Create Project"}
            onPress={handleSubmit}
            style={styles.createButton}
            disabled={loading}
          />
        </View>
      </ScrollView>

      {/* Calendar Bottom Sheets */}
      {renderCalendarBottomSheet(
        refEdcCalendarRBSheet,
        'Estimated Completion Date',
        selectedEdcDate,
        (dateString) => handleDateSelect('edc', dateString)
      )}

      {renderCalendarBottomSheet(
        refFudCalendarRBSheet,
        'Follow Up Date',
        selectedFudDate,
        (dateString) => handleDateSelect('fud', dateString)
      )}

      {/* Team Search Modal */}
      {renderTeamSearchModal()}

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
    marginRight: 16
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black,
    marginBottom: 16,
    marginTop: 8
  },
  fieldContainer: {
    marginBottom: 20
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.black,
    marginBottom: 8
  },
  requiredStar: {
    color: COLORS.red,
    fontSize: 14
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "regular",
    backgroundColor: COLORS.white,
    color: COLORS.black
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black,
    flex: 1
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.black
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale100
  },
  dropdownOptionText: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white
  },
  calendarIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
    marginRight: 12
  },
  dateText: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black,
    flex: 1
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 32
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginTop: 12
  },
  separateLine: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.grayscale200
  },
  optionalText: {
    color: COLORS.grayscale400,
    fontSize: 14
  },
  selectedMembersContainer: {
    marginBottom: 20
  },
  selectedMemberItem: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative'
  },
  selectedMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  removeMemberButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedMemberName: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 50
  },
  addTeamMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10'
  },
  addTeamMemberText: {
    fontSize: 16,
    fontFamily: "medium",
    color: COLORS.primary,
    marginLeft: 8
  },
  teamMemberCount: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    marginTop: 8,
    textAlign: 'center'
  },
  searchContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  searchInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "regular"
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  searchUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  searchUserInfo: {
    flex: 1
  },
  searchUserName: {
    fontSize: 16,
    fontFamily: "semibold",
    color: COLORS.black,
    marginBottom: 2
  },
  searchUserHandle: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700
  },
  alreadySelectedText: {
    fontSize: 12,
    fontFamily: "medium",
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  selectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
    backgroundColor: COLORS.white,
    width: '100%'
  },
  selectionCount: {
    fontSize: 16,
    fontFamily: "medium",
    color: COLORS.black
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "semibold",
    color: COLORS.white
  }
});

export default AddNewProject; 