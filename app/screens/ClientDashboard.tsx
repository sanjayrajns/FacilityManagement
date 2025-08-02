import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
// Make sure you have these icon libraries installed
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';

// --- TYPE DEFINITIONS ---
type ComplaintStatus = 'Pending' | 'In-Progress' | 'Completed';
type ComplaintPriority = 'High' | 'Medium' | 'Low';
type ComplaintCategory = 'Plumbing' | 'Electric' | 'Maintenance' | '';
type ActiveScreen = 'dashboard' | 'newComplaint';
type PickerType = 'category' | 'priority' | null;

interface Complaint {
  id: string;
  title: string;
  category: ComplaintCategory;
  date: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string;
}

// --- INITIAL MOCK DATA ---
const initialComplaints: Complaint[] = [
  {
    id: '1',
    title: 'Air conditioning not working',
    category: 'Maintenance',
    date: '2025-08-01',
    status: 'In-Progress',
    priority: 'High',
    assignedTo: 'John Smith (HVAC)',
  },
  {
    id: '2',
    title: 'Leaking faucet in bathroom',
    category: 'Plumbing',
    date: '2025-07-28',
    status: 'Completed',
    priority: 'Medium',
    assignedTo: 'Mike Johnson (Plumber)',
  },
  {
    id: '3',
    title: 'Broken light fixture',
    category: 'Electric',
    date: '2025-07-30',
    status: 'Pending',
    priority: 'Low',
  },
];

// --- HELPER FUNCTIONS (Used by Dashboard) ---
const getPriorityStyles = (priority: ComplaintPriority) => {
  switch (priority) {
    case 'High': return { tag: styles.priorityHigh, text: styles.priorityTextHigh };
    case 'Medium': return { tag: styles.priorityMedium, text: styles.priorityTextMedium };
    case 'Low': return { tag: styles.priorityLow, text: styles.priorityTextLow };
  }
};

const getStatusInfo = (status: ComplaintStatus) => {
  switch (status) {
    case 'Pending': return { icon: 'clock', color: '#f39c12' };
    case 'In-Progress': return { icon: 'loader', color: '#3498db' };
    case 'Completed': return { icon: 'check-circle', color: '#2ecc71' };
  }
};


// =========================================================================
// ===                    CLIENT DASHBOARD COMPONENT                     ===
// =========================================================================
interface ClientDashboardProps {
  complaints: Complaint[];
  navigateTo: (screen: ActiveScreen) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ complaints, navigateTo }) => {
  const openCount = complaints.filter(c => c.status !== 'Completed').length;
  const highPriorityCount = complaints.filter(
    c => c.priority === 'High' && c.status !== 'Completed'
  ).length;
  const completedCount = complaints.filter(
    c => c.status === 'Completed'
  ).length;

  const handleActionPress = (action: string, id?: string) => {
    if (action === 'New Complaint') {
        navigateTo('newComplaint');
    } else {
        console.log(`${action} pressed for complaint ID: ${id}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>My Dashboard</Text><Text style={styles.headerSubtitle}>Welcome back!</Text></View>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}><View style={[styles.summaryIconWrapper, {backgroundColor: '#e9ecef'}]}><Icon name="tool" size={22} color="#495057" /></View><Text style={styles.summaryCardValue}>{openCount}</Text><Text style={styles.summaryCardLabel}>Open Issues</Text></View>
          <View style={styles.summaryCard}><View style={[styles.summaryIconWrapper, {backgroundColor: '#ffe8cc'}]}><Icon name="alert-triangle" size={22} color="#fd7e14" /></View><Text style={styles.summaryCardValue}>{highPriorityCount}</Text><Text style={styles.summaryCardLabel}>High Priority</Text></View>
          <View style={styles.summaryCard}><View style={[styles.summaryIconWrapper, {backgroundColor: '#d1e7dd'}]}><Icon name="check-square" size={22} color="#198754" /></View><Text style={styles.summaryCardValue}>{completedCount}</Text><Text style={styles.summaryCardLabel}>Completed</Text></View>
        </View>
        <View style={styles.listContainer}>
          <View style={styles.listHeaderContainer}>
            <Text style={styles.listHeader}>Recent Activity</Text>
            <TouchableOpacity onPress={() => handleActionPress('New Complaint')} style={styles.newComplaintButton}><Icon name="plus" size={16} color="#FFF" /><Text style={styles.newComplaintButtonText}>Add New</Text></TouchableOpacity>
          </View>
          {complaints.length > 0 ? complaints.map(complaint => {
              const priorityStyle = getPriorityStyles(complaint.priority);
              const statusInfo = getStatusInfo(complaint.status);
            return (
              <View key={complaint.id} style={styles.complaintCard}>
                  <View style={styles.complaintCardHeader}><View style={[styles.statusIconContainer, { backgroundColor: `${statusInfo.color}20` }]}><Icon name={statusInfo.icon} size={20} color={statusInfo.color} /></View><Text style={styles.complaintTitle} numberOfLines={1}>{complaint.title}</Text></View>
                  <View style={styles.complaintMetaContainer}><Text style={styles.complaintMeta}>Created: <Text style={styles.metaBold}>{complaint.date}</Text></Text><View style={[styles.priorityTag, priorityStyle.tag]}><Text style={[styles.priorityText, priorityStyle.text]}>{complaint.priority}</Text></View></View>
                  {complaint.assignedTo && <Text style={styles.complaintMeta}>Assigned to: <Text style={styles.metaBold}>{complaint.assignedTo}</Text></Text>}
                  <View style={styles.complaintActions}><TouchableOpacity style={styles.actionButton} onPress={() => handleActionPress('View Details', complaint.id)}><Icon name="eye" size={14} color="#3498db" /><Text style={[styles.actionButtonText, {color: '#3498db'}]}>View Details</Text></TouchableOpacity><TouchableOpacity style={styles.actionButton} onPress={() => handleActionPress('Message Manager', complaint.id)}><FontAwesome name="comment-dots" size={14} color="#27ae60" /><Text style={[styles.actionButtonText, {color: '#27ae60'}]}>Message Manager</Text></TouchableOpacity></View>
              </View>
            )
          }) : <Text style={styles.noComplaintsText}>No recent activity.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


// =========================================================================
// ===                     NEW COMPLAINT COMPONENT                       ===
// =========================================================================
interface NewComplaintProps {
  navigateTo: (screen: ActiveScreen) => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'date' | 'status'>) => void;
}

const NewComplaintScreen: React.FC<NewComplaintProps> = ({ navigateTo, addComplaint }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [pickerData, setPickerData] = useState<string[]>([]);

  const openPicker = (type: PickerType) => {
    setPickerType(type);
    if (type === 'category') {
        setPickerData(['Plumbing', 'Electric', 'Maintenance']);
    } else if (type === 'priority') {
        setPickerData(['Low', 'Medium', 'High']);
    }
    setPickerVisible(true);
  };

  const onValueSelect = (value: string) => {
    if (pickerType === 'category') {
        setCategory(value as ComplaintCategory);
    } else if (pickerType === 'priority') {
        setPriority(value as ComplaintPriority);
    }
    setPickerVisible(false);
  };
  
  const handleSubmit = () => {
    if (!title || !category) {
        alert('Please fill in the Title and Category.');
        return;
    }
    addComplaint({ title, category, priority, location, description });
    navigateTo('dashboard');
  };

  const handleCancel = () => navigateTo('dashboard');

  return (
    <SafeAreaView style={styles.newComplaintSafeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.newComplaintSafeArea.backgroundColor} />
      <View style={styles.newComplaintHeader}><TouchableOpacity onPress={handleCancel} style={styles.backButton}><Icon name="arrow-left" size={24} color="#212529" /></TouchableOpacity><Text style={styles.newComplaintHeaderTitle}>New Complaint</Text></View>
      <ScrollView contentContainerStyle={styles.newComplaintContainer}>
        <Text style={styles.sectionTitle}>Complaint Details</Text>
        <View style={styles.form}>
          <View style={styles.formGroup}><Text style={styles.label}>Title</Text><TextInput style={styles.input} placeholder="Brief description of the issue" value={title} onChangeText={setTitle} /></View>
          <View style={styles.formGroup}><Text style={styles.label}>Category</Text><TouchableOpacity style={styles.input} onPress={() => openPicker('category')}><Text style={category ? styles.inputText : styles.placeholderText}>{category || 'Select category'}</Text><Icon name="chevron-down" size={20} color="#6c757d" /></TouchableOpacity></View>
          <View style={styles.formGroup}><Text style={styles.label}>Priority</Text><TouchableOpacity style={styles.input} onPress={() => openPicker('priority')}><Text style={styles.inputText}>{priority}</Text><Icon name="chevron-down" size={20} color="#6c757d" /></TouchableOpacity></View>
          <View style={styles.formGroup}><Text style={styles.label}>Location</Text><TextInput style={styles.input} placeholder="Room/Area location" value={location} onChangeText={setLocation} /></View>
          <View style={styles.formGroup}><Text style={styles.label}>Description</Text><TextInput style={[styles.input, styles.textArea]} placeholder="Detailed description of the issue" value={description} onChangeText={setDescription} multiline /></View>
          <View style={styles.formGroup}><Text style={styles.label}>Photos</Text><View style={styles.photoContainer}><TouchableOpacity style={styles.photoButton}><Icon name="camera" size={20} color="#495057" /><Text style={styles.photoButtonText}>Take Photo</Text></TouchableOpacity><TouchableOpacity style={styles.photoButton}><Icon name="upload" size={20} color="#495057" /><Text style={styles.photoButtonText}>Upload File</Text></TouchableOpacity></View></View>
        </View>
      </ScrollView>

      <Modal transparent={true} visible={pickerVisible} onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
            <View style={styles.pickerContainer}>
                <FlatList data={pickerData} keyExtractor={item => item} renderItem={({ item }) => (
                    <TouchableOpacity style={styles.pickerItem} onPress={() => onValueSelect(item)}>
                        <Text style={styles.pickerItemText}>{item}</Text>
                    </TouchableOpacity>
                )} />
            </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.footer}><TouchableOpacity style={styles.cancelButton} onPress={handleCancel}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.submitButton} onPress={handleSubmit}><Text style={styles.submitButtonText}>Submit Complaint</Text></TouchableOpacity></View>
    </SafeAreaView>
  );
};


// =========================================================================
// ===                  MAIN APP CONTAINER / MANAGER                     ===
// =========================================================================
const ComplaintManager = () => {
    const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
    const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);

    const handleNavigation = (screen: ActiveScreen) => setActiveScreen(screen);

    const handleAddComplaint = (newComplaintData: Omit<Complaint, 'id' | 'date' | 'status'>) => {
        const newComplaint: Complaint = {
            id: Date.now().toString(), // Simple unique ID
            date: new Date().toISOString().split('T')[0], // Today's date
            status: 'Pending',
            ...newComplaintData
        };
        setComplaints([newComplaint, ...complaints]);
    };

    if (activeScreen === 'newComplaint') {
        return <NewComplaintScreen navigateTo={handleNavigation} addComplaint={handleAddComplaint} />;
    }
    
    return <ClientDashboard navigateTo={handleNavigation} complaints={complaints} />;
}

export default ComplaintManager;


// --- STYLESHEET (Combined & Organized) ---
const styles = StyleSheet.create({
  // --- Dashboard Styles ---
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#212529' },
  headerSubtitle: { fontSize: 16, color: '#6c757d', marginTop: 4 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  summaryCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 5, elevation: 2, shadowColor: '#adb5bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  summaryIconWrapper: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  summaryCardValue: { fontSize: 28, fontWeight: 'bold', color: '#212529' },
  summaryCardLabel: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  listContainer: { marginTop: 16 },
  listHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listHeader: { fontSize: 22, fontWeight: 'bold', color: '#343a40' },
  newComplaintButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d6efd', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  newComplaintButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  complaintCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#adb5bd', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  complaintCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  complaintTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#343a40' },
  complaintMetaContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  complaintMeta: { fontSize: 13, color: '#6c757d' },
  metaBold: { fontWeight: '600', color: '#495057' },
  complaintActions: { flexDirection: 'row', justifyContent: 'flex-start', borderTopWidth: 1, borderTopColor: '#e9ecef', marginTop: 16, paddingTop: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  actionButtonText: { marginLeft: 8, fontSize: 13, fontWeight: '600' },
  priorityTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  priorityText: { fontSize: 12, fontWeight: 'bold' },
  priorityHigh: { backgroundColor: '#fbe2e2' }, priorityTextHigh: { color: '#c0392b' },
  priorityMedium: { backgroundColor: '#fef5e2' }, priorityTextMedium: { color: '#f39c12' },
  priorityLow: { backgroundColor: '#e2f4ea' }, priorityTextLow: { color: '#27ae60' },
  noComplaintsText: { textAlign: 'center', color: '#6c757d', marginTop: 20 },

  // --- New Complaint Styles ---
  newComplaintSafeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  newComplaintHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  backButton: { padding: 4 },
  newComplaintHeaderTitle: { fontSize: 20, fontWeight: '600', color: '#212529', marginLeft: 16 },
  newComplaintContainer: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#343a40', marginBottom: 20 },
  form: { width: '100%' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#495057', marginBottom: 8 },
  input: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, paddingHorizontal: 16, minHeight: 48, fontSize: 16, color: '#212529' },
  inputText: { fontSize: 16, color: '#212529' },
  placeholderText: { fontSize: 16, color: '#6c757d' },
  textArea: { height: 120, textAlignVertical: 'top', alignItems: 'flex-start' },
  photoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  photoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, paddingVertical: 12, marginHorizontal: 5, backgroundColor: '#f8f9fa' },
  photoButtonText: { marginLeft: 8, fontSize: 15, fontWeight: '500', color: '#495057' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e9ecef' },
  cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, marginRight: 10, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6' },
  cancelButtonText: { color: '#212529', fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, marginLeft: 10, backgroundColor: '#198754' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // --- Picker/Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { backgroundColor: 'white', borderRadius: 8, width: '80%', maxHeight: '50%', paddingVertical: 10 },
  pickerItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  pickerItemText: { fontSize: 16, color: '#343a40' },
});