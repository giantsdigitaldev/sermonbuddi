import { COLORS, icons } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { TeamMember, TeamService } from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';

const ProjectDetailsTeamMember = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load team members
    const loadTeamMembers = useCallback(async () => {
        if (!projectId) return;
        
        try {
            setLoading(true);
            const teamData = await TeamService.getProjectTeamMembers(projectId);
            setMembers(teamData);
            setFilteredMembers(teamData);
        } catch (error) {
            console.error('Error loading team members:', error);
            Alert.alert('Error', 'Failed to load team members');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadTeamMembers();
    }, [loadTeamMembers]);

    useFocusEffect(
        useCallback(() => {
            loadTeamMembers();
        }, [loadTeamMembers])
    );

    // Filter members based on search
    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredMembers(members);
        } else {
            const filtered = members.filter(member =>
                (member.user_name?.toLowerCase().includes(searchText.toLowerCase())) ||
                (member.user_email?.toLowerCase().includes(searchText.toLowerCase())) ||
                (member.invited_email?.toLowerCase().includes(searchText.toLowerCase()))
            );
            setFilteredMembers(filtered);
        }
    }, [searchText, members]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadTeamMembers();
    }, [loadTeamMembers]);

    // Handle member actions
    const handleMemberAction = (member: TeamMember) => {
        const options: any[] = [
            { text: 'Cancel', style: 'cancel' },
        ];

        // Add contact options
        if (member.user_email || member.invited_email) {
            options.push({
                text: 'Send Message',
                onPress: () => handleSendMessage(member)
            });
        }

        // Add role change options (only for non-owners)
        if (member.role !== 'owner') {
            options.push({
                text: 'Change Role',
                onPress: () => handleRoleChange(member)
            });
        }

        // Add remove option (only for non-owners)
        if (member.role !== 'owner') {
            options.push({
                text: 'Remove Member',
                style: 'destructive',
                onPress: () => handleRemoveMember(member)
            });
        }

        Alert.alert('Member Actions', 'Choose an action:', options);
    };

    const handleRoleChange = (member: TeamMember) => {
        const roleOptions = [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Admin', onPress: () => updateMemberRole(member, 'admin') },
            { text: 'Member', onPress: () => updateMemberRole(member, 'member') },
            { text: 'Viewer', onPress: () => updateMemberRole(member, 'viewer') },
        ];

        Alert.alert('Change Role', 'Select new role:', roleOptions);
    };

    const updateMemberRole = async (member: TeamMember, newRole: TeamMember['role']) => {
        try {
            const success = await TeamService.updateMemberRole(projectId, member.id, newRole);
            if (success) {
                Alert.alert('Success', 'Member role updated successfully');
                loadTeamMembers();
            } else {
                Alert.alert('Error', 'Failed to update member role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            Alert.alert('Error', 'Failed to update member role');
        }
    };

    const handleRemoveMember = (member: TeamMember) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${member.user_name || member.invited_email} from this project?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const success = await TeamService.removeTeamMember(projectId, member.id);
                            if (success) {
                                Alert.alert('Success', 'Member removed successfully');
                                loadTeamMembers();
                            } else {
                                Alert.alert('Error', 'Failed to remove member');
                            }
                        } catch (error) {
                            console.error('Error removing member:', error);
                            Alert.alert('Error', 'Failed to remove member');
                        }
                    }
                }
            ]
        );
    };

    const handleSendMessage = (member: TeamMember) => {
        const email = member.user_email || member.invited_email;
        Alert.alert('Send Message', `Contact ${member.user_name || 'member'} at ${email}`);
        // TODO: Implement actual messaging functionality
    };

    const renderMember = ({ item: member }: { item: TeamMember }) => {
        const isInvited = member.status === 'pending';
        const displayName = member.user_name || member.invited_email?.split('@')[0] || 'Unknown';
        const displayEmail = member.user_email || member.invited_email;

        return (
            <TouchableOpacity 
                style={[styles.memberContainer, {
                    backgroundColor: dark ? COLORS.dark3 : COLORS.white,
                    opacity: isInvited ? 0.7 : 1,
                }]}
                onPress={() => handleMemberAction(member)}
            >
                <View style={styles.memberLeft}>
                    {member.user_avatar ? (
                        <Image source={{ uri: member.user_avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <Ionicons name="person" size={24} color={COLORS.grayscale400} />
                        </View>
                    )}
                    <View style={styles.memberInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.name, {
                                color: dark ? COLORS.white : COLORS.greyscale900,
                            }]}>{displayName}</Text>
                            <View style={[styles.roleBadge, {
                                backgroundColor: getRoleColor(member.role)
                            }]}>
                                <Text style={styles.roleText}>{member.role}</Text>
                            </View>
                        </View>
                        <Text style={[styles.email, {
                            color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                        }]}>{displayEmail}</Text>
                        {isInvited && (
                            <Text style={[styles.statusText, { color: COLORS.warning }]}>
                                Invitation Pending
                            </Text>
                        )}
                        {member.joined_at && (
                            <Text style={[styles.joinedText, {
                                color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                            }]}>
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                </View>
                
                <View style={styles.memberActions}>
                    <View style={styles.permissionIndicators}>
                        {member.permissions.write && (
                            <Ionicons name="create-outline" size={16} color={COLORS.greeen} />
                        )}
                        {member.permissions.delete && (
                            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                        )}
                    </View>
                    {member.role !== 'owner' && (
                        <TouchableOpacity
                            onPress={() => handleMemberAction(member)}
                            style={styles.actionButton}
                        >
                            <Ionicons 
                                name="ellipsis-horizontal" 
                                size={20} 
                                color={dark ? COLORS.white : COLORS.greyscale900} 
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return COLORS.primary;
            case 'admin': return COLORS.orange;
            case 'member': return COLORS.green;
            case 'viewer': return COLORS.grayscale400;
            default: return COLORS.grayscale300;
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
                    }]}>Team Members ({filteredMembers.length})</Text>
                </View>
                <TouchableOpacity onPress={handleRefresh}>
                    <Ionicons 
                        name="refresh" 
                        size={24} 
                        color={dark ? COLORS.secondaryWhite : COLORS.black} 
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const renderStats = () => {
        const activeMembers = members.filter(m => m.status === 'active').length;
        const pendingInvites = members.filter(m => m.status === 'pending').length;
        const admins = members.filter(m => m.role === 'admin').length;

        return (
            <View style={[styles.statsContainer, {
                backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite
            }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: COLORS.primary }]}>{activeMembers}</Text>
                    <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>Active</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: COLORS.orange }]}>{pendingInvites}</Text>
                    <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>Pending</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: COLORS.green }]}>{admins}</Text>
                    <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale600 }]}>Admins</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
                <View style={[styles.container, { 
                    backgroundColor: colors.background,
                    justifyContent: 'center',
                    alignItems: 'center'
                }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.loadingText, { 
                        color: dark ? COLORS.white : COLORS.black,
                        marginTop: 16
                    }]}>
                        Loading team members...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                
                {/* Stats Section */}
                {renderStats()}
                
                {/* Search bar */}
                <View style={[styles.searchBarContainer, {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite
                }]}>
                    <Ionicons name="search" size={24} color={COLORS.gray} />
                    <TextInput
                        placeholder='Search team members...'
                        placeholderTextColor={COLORS.gray}
                        style={[styles.searchInput, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                    <FlatList
                        data={filteredMembers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMember}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={48} color={COLORS.grayscale400} />
                                <Text style={[styles.emptyText, {
                                    color: dark ? COLORS.grayscale400 : COLORS.grayscale600
                                }]}>
                                    {searchText ? 'No members found' : 'No team members yet'}
                                </Text>
                                {!searchText && (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate("projectdetailsaddteammenber", { projectId })}
                                        style={[styles.emptyActionButton, { backgroundColor: COLORS.primary }]}
                                    >
                                        <Text style={styles.emptyActionText}>Invite Members</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                </ScrollView>
            </View>
            
            {/* Add Member Button */}
            <View style={[styles.bottomContainer, { 
                borderTopColor: dark ? COLORS.dark2 : COLORS.grayscale100,
            }]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate("projectdetailsaddteammenber", { projectId })}
                    style={styles.addBtn}
                >
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={styles.addText}>Add Member</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Enhanced styles
const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 16
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
        marginRight: 16
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        flex: 1
    },
    statsContainer: {
        flexDirection: 'row', 
        justifyContent: 'space-around',
        backgroundColor: COLORS.secondaryWhite,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center'
    },
    statNumber: {
        fontSize: 24,
        fontFamily: 'bold'
    },
    statLabel: {
        fontSize: 14,
        fontFamily: 'medium',
        marginTop: 4
    },
    searchBarContainer: {
        width: '100%',
        backgroundColor: COLORS.secondaryWhite,
        padding: 16,
        borderRadius: 12,
        height: 52,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center"
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: "regular",
        marginHorizontal: 12
    },
    scrollContainer: {
        flex: 1
    },
    memberContainer: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    memberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    placeholderAvatar: {
        backgroundColor: COLORS.grayscale200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginRight: 8,
        flex: 1
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 10,
        fontFamily: "bold",
        color: COLORS.white,
        textTransform: 'uppercase',
    },
    email: {
        fontSize: 14,
        color: COLORS.grayscale700,
        fontFamily: "medium",
        marginBottom: 2
    },
    statusText: {
        fontSize: 12,
        fontFamily: "medium",
        marginBottom: 2,
    },
    joinedText: {
        fontSize: 11,
        fontFamily: "regular",
    },
    memberActions: {
        alignItems: 'center',
    },
    permissionIndicators: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    actionButton: {
        padding: 8,
    },
    bottomContainer: {
        height: 80,
        width: "100%",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        bottom: 0,
        borderTopColor: COLORS.grayscale100,
        borderTopWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    addBtn: {
        width: '100%',
        height: 52,
        borderRadius: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
    },
    addText: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.white,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: "medium",
        marginTop: 12,
        textAlign: 'center',
    },
    emptyActionButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    emptyActionText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'bold',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'medium',
    },
});

export default ProjectDetailsTeamMember;