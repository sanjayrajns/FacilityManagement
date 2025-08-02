import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';

// --- INITIAL DATA (with `assigned` field for complaints) ---
const initialComplaints = [
  { id: "C-1", title: "Air conditioning not working - Floor 3", company: "ABC Corp", date: "2024-01-15", category: "HVAC", status: "Pending", priority: "High", assigned: "" },
  { id: "C-2", title: "Electrical outlet sparking", company: "XYZ Ltd", date: "2024-01-15", category: "Electrical", status: "Pending", priority: "Urgent", assigned: "" },
];

const initialWorkOrders = [
  { id: "WO-001", title: "Fix HVAC System - Office Floor 3", client: "TechCorp Inc.", priority: "high", status: "pending", assigned: "", created: "2024-01-15", due: "2024-01-16", description: "The main AC unit on the 3rd floor is not cooling.", imageUri: 'https://images.unsplash.com/photo-1599491689337-76949224888d?w=500' },
  { id: "WO-002", title: "Electrical Outlet Repair", client: "StartupHub", priority: "medium", status: "in progress", assigned: "Sarah Wilson (Electrical)", created: "2024-01-14", due: "2024-01-15", description: "Report of sparks from an outlet.", imageUri: null },
];

const technicians = ["John Smith (HVAC)", "Mike Johnson (Plumbing)", "Sarah Wilson (Electrical)", "Tom Brown (General)"];

// --- REUSABLE COMPONENTS ---

// ✨ NEW: Assign Technician Modal Component
const AssignTechnicianModal = ({ visible, onClose, item, technicians, onConfirm }) => {
    const [selectedTechnician, setSelectedTechnician] = useState('');

    // Pre-select technician if already assigned when modal opens
    React.useEffect(() => {
        if (item) {
            setSelectedTechnician(item.assigned || '');
        }
    }, [item]);

    const handleConfirm = () => {
        onConfirm(selectedTechnician);
        onClose();
    };

    if (!item) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.assignModalContainer}>
                    <Text style={styles.assignModalTitle}>Assign Technician</Text>
                    <Text style={styles.assignModalSubtitle}>{item.title}</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker selectedValue={selectedTechnician} onValueChange={(val) => setSelectedTechnician(val)}>
                            <Picker.Item label="Select a technician..." value="" />
                            {technicians.map((tech, index) => (
                                <Picker.Item label={tech} value={tech} key={index} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.modalButtonRow}>
                        <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm}>
                            <Text style={styles.modalConfirmButtonText}>Confirm Assignment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Create Work Order Modal (No major changes)
const CreateWorkOrderModal = ({ visible, onClose, onSubmit, technicians }) => {
    // ... same as before
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [priority, setPriority] = useState('medium');
    const [assignedTechnician, setAssignedTechnician] = useState('');
  
    const handleImagePick = async (useCamera = false) => {
        const permission = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Denied', 'We need permission to access your photos.');
          return;
        }
    
        const result = useCamera 
            ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.7 })
            : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    
        if (!result.canceled) {
          setImageUri(result.assets[0].uri);
        }
    };
    
    const handleSubmit = () => {
        if (!title || !description) {
            Alert.alert('Missing Information', 'Please fill out the title and description.');
            return;
        }
        const newWorkOrder = {
            id: `WO-${Date.now().toString().slice(-5)}`,
            title,
            description,
            imageUri,
            priority,
            assigned: assignedTechnician,
            status: assignedTechnician ? 'pending' : 'unassigned',
            client: 'Internal Request',
            created: new Date().toISOString().split('T')[0],
            due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
        onSubmit(newWorkOrder);
        // Reset form
        setTitle(''); setDescription(''); setImageUri(null); setPriority('medium'); setAssignedTechnician('');
      };
      
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Work Order</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}><Ionicons name="close-outline" size={32} color="#333" /></TouchableOpacity>
                    </View>
                    <View style={styles.formGroup}><Text style={styles.formLabel}>Title</Text><TextInput style={styles.textInput} placeholder="e.g., Fix Leaky Faucet" value={title} onChangeText={setTitle} /></View>
                    <View style={styles.formGroup}><Text style={styles.formLabel}>Asset Description</Text><TextInput style={[styles.textInput, {height: 100, textAlignVertical: 'top'}]} placeholder="e.g., In 2nd floor men's restroom" value={description} onChangeText={setDescription} multiline /></View>
                    {imageUri && (<View style={styles.imagePreviewContainer}><Image source={{ uri: imageUri }} style={styles.imagePreview} /><TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}><Ionicons name="close-circle" size={28} color="#e74c3c" /></TouchableOpacity></View>)}
                    <View style={styles.imageActionRow}>
                        <TouchableOpacity style={styles.imageActionButton} onPress={() => handleImagePick()}><Ionicons name="image-outline" size={20} color={styles.primaryColor.color} /><Text style={styles.imageActionButtonText}>From Gallery</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.imageActionButton} onPress={() => handleImagePick(true)}><Ionicons name="camera-outline" size={20} color={styles.primaryColor.color} /><Text style={styles.imageActionButtonText}>Use Camera</Text></TouchableOpacity>
                    </View>
                    <View style={styles.formGroup}><Text style={styles.formLabel}>Assign Technician</Text><View style={styles.pickerWrapper}><Picker selectedValue={assignedTechnician} onValueChange={(v) => setAssignedTechnician(v)}><Picker.Item label="Assign later" value="" />{technicians.map((t, i) => (<Picker.Item label={t} value={t} key={i} />))}</Picker></View></View>
                    <View style={styles.formGroup}><Text style={styles.formLabel}>Set Priority</Text><View style={styles.pickerWrapper}><Picker selectedValue={priority} onValueChange={(v) => setPriority(v)}><Picker.Item label="High" value="high" /><Picker.Item label="Medium" value="medium" /><Picker.Item label="Low" value="low" /></Picker></View></View>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}><Text style={styles.submitButtonText}>Submit Work Order</Text></TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
      );
};
// ... other components like SummaryCard, ProfileScreen etc. remain the same

export default function ManagerDashboard() {
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [complaints, setComplaints] = useState(initialComplaints);
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  
  // ✨ NEW state for assignment modal
  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedItemForAssignment, setSelectedItemForAssignment] = useState(null);

  const [profile, setProfile] = useState({ name: 'Alex Manager', email: 'alex.m@example.com', role: 'Operations Manager' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // ✨ NEW handler functions for assignment
  const handleOpenAssignModal = (item) => {
    setSelectedItemForAssignment(item);
    setAssignModalVisible(true);
  };

  const handleConfirmAssignment = (technician) => {
    if (!selectedItemForAssignment) return;

    const { id } = selectedItemForAssignment;

    // Update Work Orders state
    if (id.startsWith('WO')) {
        setWorkOrders(prev => prev.map(wo => 
            wo.id === id ? { ...wo, assigned: technician, status: technician ? 'pending' : 'unassigned' } : wo
        ));
    } 
    // Update Complaints state
    else if (id.startsWith('C-')) {
        setComplaints(prev => prev.map(c => 
            c.id === id ? { ...c, assigned: technician, status: technician ? 'Assigned' : 'Pending' } : c
        ));
    }
    
    setAssignModalVisible(false);
    setSelectedItemForAssignment(null);
  };
  
  const handleCreateWorkOrder = (newOrder) => {
    setWorkOrders(prev => [newOrder, ...prev]);
    const newComplaint = {
      id: `C-${newOrder.id}`,
      title: newOrder.title,
      company: newOrder.client,
      date: newOrder.created,
      category: newOrder.assigned.split('(')[1]?.replace(')','') || 'General',
      status: 'Pending',
      priority: newOrder.priority.charAt(0).toUpperCase() + newOrder.priority.slice(1),
      assigned: newOrder.assigned
    };
    setComplaints(prev => [newComplaint, ...prev]);
    setCreateModalVisible(false);
    Alert.alert("Success", "Work Order and Complaint have been created.");
  };

  // --- SCREEN COMPONENTS ---
  // ✨ UPDATED DashboardScreen and WorkOrdersScreen renderItems

  const DashboardScreen = () => (
    <ScrollView contentContainerStyle={styles.screenScroll}>
        <Text style={styles.header}>Dashboard</Text>
        {/* Summary Cards... */}
        <View style={styles.summaryGrid}>
            <SummaryCard icon="build-outline" label="Pending Tasks" value={workOrders.filter(w => w.status === 'pending').length} color="#f39c12" />
            <SummaryCard icon="sync-circle-outline" label="In Progress" value={workOrders.filter(w => w.status === 'in progress').length} color={styles.primaryColor.color} />
            <SummaryCard icon="checkmark-done-outline" label="Completed Today" value="15" color="#27ae60" />
            <SummaryCard icon="alert-circle-outline" label="Urgent Issues" value={workOrders.filter(w => w.priority === 'high').length} color="#e74c3c" />
        </View>
        <Text style={styles.sectionHeader}>Recent Complaints</Text>
        <FlatList data={complaints} keyExtractor={item => item.id} scrollEnabled={false} renderItem={({item}) => (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.meta}>{item.company} • {item.date}</Text>
                    <Text style={styles.meta}>Status: <Text style={{fontWeight: 'bold'}}>{item.status}</Text></Text>
                    <Text style={styles.meta}>Assigned to: <Text style={{fontWeight: 'bold'}}>{item.assigned || "Unassigned"}</Text></Text>
                    <View style={styles.cardButtonRow}>
                        <TouchableOpacity style={styles.detailsButton}><Text style={styles.detailsButtonText}>View Details</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.assignButton} onPress={() => handleOpenAssignModal(item)}>
                            <Ionicons name="person-add-outline" size={16} color="#fff" />
                            <Text style={styles.assignButtonText}>Assign Technician</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )}/>
    </ScrollView>
  );

  const WorkOrdersScreen = () => (
    <View style={{flex: 1}}>
        <Text style={styles.header}>Work Orders</Text>
        <FlatList data={workOrders} keyExtractor={item => item.id} contentContainerStyle={styles.screenScroll} renderItem={({item}) => (
            <View style={styles.card}>
                {item.imageUri && <Image source={{uri: item.imageUri}} style={styles.cardImage} />}
                <View style={styles.cardContent}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, styles[item.priority]]}><Text style={styles.badgeText}>{item.priority}</Text></View>
                        <View style={[styles.badge, styles[item.status.replace(" ", "")]]}><Text style={styles.badgeText}>{item.status}</Text></View>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.meta}>Assigned to: <Text style={{fontWeight:'bold'}}>{item.assigned || "Unassigned"}</Text></Text>
                    <View style={styles.cardButtonRow}>
                        <TouchableOpacity style={styles.detailsButton}><Text style={styles.detailsButtonText}>View Details</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.assignButton} onPress={() => handleOpenAssignModal(item)}>
                            <Ionicons name="person-add-outline" size={16} color="#fff" />
                            <Text style={styles.assignButtonText}>Assign Technician</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )} />
    </View>
  );
  
  // Messages and Profile screens remain the same...
  const MessagesScreen = () => {
    const mockMessages = [
      {id: 1, name: 'John Smith (HVAC)', text: 'On my way to the site now.', time: '10:45 AM', avatar: 'https://i.pravatar.cc/150?u=john'},
      {id: 2, name: 'Sarah Wilson (Elec)', text: 'Do you have the schematics for the main panel?', time: '9:30 AM', avatar: 'https://i.pravatar.cc/150?u=sarah'},
      {id: 3, name: 'Client: TechCorp Inc.', text: 'Thank you for the update!', time: 'Yesterday', avatar: 'https://i.pravatar.cc/150?u=techcorp'},
    ];
    return(
        <View style={{flex: 1}}>
            <Text style={styles.header}>Messages</Text>
            <FlatList data={mockMessages} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.screenScroll} renderItem={({item}) => (
                <TouchableOpacity style={styles.messageItem}>
                    <Image source={{uri: item.avatar}} style={styles.avatar} />
                    <View style={styles.messageContent}><Text style={styles.messageSender}>{item.name}</Text><Text style={styles.messageText}>{item.text}</Text></View>
                    <Text style={styles.messageTime}>{item.time}</Text>
                </TouchableOpacity>
            )}/>
            <Text style={styles.disclaimer}>*This is a UI mockup. A real chat feature requires a backend.</Text>
        </View>
    );
  };
  
  const ProfileScreen = () => (
    <ScrollView style={styles.screenScroll}>
        <Text style={styles.header}>My Profile</Text>
        <View style={styles.profileCard}>
            <Image source={{uri: 'https://i.pravatar.cc/150?u=manager'}} style={styles.profileAvatar} />
            {isEditingProfile ? 
                <TextInput style={[styles.profileName, styles.profileInput]} value={profile.name} onChangeText={(text) => setProfile({...profile, name: text})} /> 
                : <Text style={styles.profileName}>{profile.name}</Text>
            }
            <Text style={styles.profileRole}>{profile.role}</Text>
            <View style={styles.profileInfoRow}>
                <Ionicons name="mail-outline" size={20} color="#888" />
                {isEditingProfile ? 
                    <TextInput style={[styles.profileInfo, styles.profileInput]} value={profile.email} onChangeText={(text) => setProfile({...profile, email: text})} keyboardType="email-address"/>
                    : <Text style={styles.profileInfo}>{profile.email}</Text>
                }
            </View>
            <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditingProfile(!isEditingProfile)}>
                <Text style={styles.editProfileButtonText}>{isEditingProfile ? 'Save Changes' : 'Edit Profile'}</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );

  const renderScreen = () => {
    switch(activeScreen){
      case 'dashboard': return <DashboardScreen />;
      case 'workorders': return <WorkOrdersScreen />;
      case 'messages': return <MessagesScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <DashboardScreen />;
    }
  }
  const SummaryCard = ({ icon, label, value, color }) => (
    <View style={styles.summaryCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
);

  return (
    <SafeAreaView style={styles.container}>
        {renderScreen()}
        <CreateWorkOrderModal visible={isCreateModalVisible} onClose={() => setCreateModalVisible(false)} onSubmit={handleCreateWorkOrder} technicians={technicians} />
        {/* ✨ ADDED Assign Technician Modal to the main view */}
        <AssignTechnicianModal 
            visible={isAssignModalVisible}
            onClose={() => setAssignModalVisible(false)}
            item={selectedItemForAssignment}
            technicians={technicians}
            onConfirm={handleConfirmAssignment}
        />
        <View style={styles.bottomNav}>
            {['dashboard', 'workorders', 'messages', 'profile'].map(screen => {
                const icons = {dashboard: 'grid-outline', workorders: 'build-outline', messages: 'chatbubbles-outline', profile: 'person-outline'};
                return (
                    <TouchableOpacity key={screen} onPress={() => setActiveScreen(screen)} style={styles.navItem}>
                        <Ionicons name={icons[screen]} size={24} color={activeScreen === screen ? styles.primaryColor.color : "#777"} />
                        <Text style={[styles.navText, activeScreen === screen && styles.activeNavText]}>{screen.charAt(0).toUpperCase() + screen.slice(1)}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
        <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add-outline" size={30} color="#fff" />
        </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- STYLES (with new styles for buttons and assignment modal) ---
const styles = StyleSheet.create({
    primaryColor: { color: '#3498db'},
    container: { flex: 1, backgroundColor: "#f4f7f9" },
    screenScroll: { paddingHorizontal: 16, paddingBottom: 100 },
    header: { fontSize: 28, fontWeight: "bold", marginVertical: 10, marginBottom: 20 },
    sectionHeader: { fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10},
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    summaryCard: { width: "48%", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    summaryValue: { fontSize: 24, fontWeight: "bold", marginTop: 8, color: "#000" },
    summaryLabel: { fontSize: 14, color: "#555" },
    card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, overflow: 'hidden' },
    cardImage: { width: '100%', height: 150 },
    cardContent: { padding: 16 },
    cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6, color: "#333" },
    meta: { fontSize: 13, color: "#666", marginBottom: 4, lineHeight: 18 },
    // ✨ New Button Row Style
    cardButtonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
    detailsButton: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    detailsButtonText: { color: '#333', fontWeight: '600' },
    assignButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498db', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8 },
    assignButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
    badgeRow: { flexDirection: 'row', marginBottom: 8 },
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
    badgeText: { fontWeight: 'bold', fontSize: 12, color: '#fff' },
    high: { backgroundColor: "#e74c3c" },
    medium: { backgroundColor: "#f39c12" },
    low: { backgroundColor: "#2ecc71" },
    pending: { backgroundColor: "#f39c12" },
    unassigned: {backgroundColor: "#95a5a6"},
    Assigned: {backgroundColor: "#3498db"},
    inprogress: { backgroundColor: "#8e44ad" },
    
    // ✨ New Assign Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    assignModalContainer: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
    assignModalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    assignModalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 16 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    modalCancelButton: { padding: 12, borderRadius: 8, flex: 1, marginRight: 10, alignItems: 'center', backgroundColor: '#f0f0f0' },
    modalCancelButtonText: { fontWeight: 'bold', color: '#333' },
    modalConfirmButton: { padding: 12, borderRadius: 8, flex: 1, alignItems: 'center', backgroundColor: '#3498db' },
    modalConfirmButtonText: { fontWeight: 'bold', color: '#fff' },
    
    // Create Modal Styles
    modalContainer: { flex: 1, backgroundColor: '#f4f7f9', paddingTop: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
    modalTitle: { fontSize: 26, fontWeight: 'bold' },
    closeButton: { padding: 5 },
    formGroup: { marginBottom: 16, paddingHorizontal: 16 },
    formLabel: { fontSize: 14, fontWeight: '500', color: '#555', marginBottom: 8 },
    textInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    pickerWrapper: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
    imageActionRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
    imageActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6fc', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
    imageActionButtonText: { color: '#3498db', fontWeight: '600', marginLeft: 8 },
    imagePreviewContainer: { marginHorizontal: 16, alignItems: 'center', position: 'relative' },
    imagePreview: { width: '100%', height: 200, borderRadius: 8 },
    removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 14 },
    submitButton: { backgroundColor: '#3498db', paddingVertical: 16, borderRadius: 8, alignItems: 'center', margin: 16 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // Profile Screen
    profileCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 2 },
    profileAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, borderWidth: 3, borderColor: '#3498db'},
    profileName: { fontSize: 22, fontWeight: 'bold' },
    profileRole: { fontSize: 16, color: '#777', marginBottom: 20 },
    profileInfoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    profileInfo: { fontSize: 16, color: '#333', marginLeft: 10 },
    profileInput: { borderBottomWidth: 1, borderColor: '#ccc', padding: 4, textAlign: 'center'},
    editProfileButton: { marginTop: 24, backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    editProfileButtonText: { color: '#fff', fontWeight: 'bold' },

    // Messages Screen
    messageItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    messageContent: { flex: 1 },
    messageSender: { fontWeight: 'bold', fontSize: 16 },
    messageText: { color: '#666' },
    messageTime: { fontSize: 12, color: '#999' },
    disclaimer: { textAlign: 'center', color: '#999', padding: 16 },

    // Bottom Nav & FAB
    bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0e0e0", position: "absolute", bottom: 0, width: "100%" },
    navItem: { alignItems: "center", flex: 1 },
    navText: { fontSize: 12, color: "#777", marginTop: 4 },
    activeNavText: { color: "#3498db", fontWeight: "600" },
    fab: { position: "absolute", bottom: 80, right: 20, backgroundColor: "#3498db", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
});