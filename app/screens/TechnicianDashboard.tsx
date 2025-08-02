import React, { useState, useEffect } from 'react';
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
  Alert,
  ListRenderItem,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

// --- TYPE DEFINITIONS ---
type TaskStatus = 'assigned' | 'in progress' | 'pending materials' | 'completed';
type TaskPriority = 'high' | 'medium' | 'low';

interface Task {
    id: string; title: string; client: string; location: string; description: string; assignedDate: string; priority: TaskPriority; status: TaskStatus;
    beforePhotoUri?: string | null;
    afterPhotoUri?: string | null;
    completionNotes?: string | null;
}
interface RequestedItem { name: string; specification: string; quantity: string; }
interface MaterialRequest {
    id:string; taskId: string; requestedDate: string; status: 'pending' | 'approved' | 'issued'; items: RequestedItem[];
}

// --- MOCK DATA ---
const initialTasks: Task[] = [
    { id: 'task-1', title: 'Fix air conditioning unit - Floor 3', client: 'ABC Corp', location: 'Building A, Room 301', description: 'AC unit not cooling properly, possible refrigerant leak.', assignedDate: '2025-08-02', priority: 'high', status: 'in progress', beforePhotoUri: 'https://images.unsplash.com/photo-1542280259-d62935a383e3?w=500' },
    { id: 'task-2', title: 'Replace electrical outlet', client: 'XYZ Ltd', location: 'Building B, Floor 1, Office 105', description: 'Outlet sparking, needs immediate replacement.', assignedDate: '2025-08-02', priority: 'high', status: 'pending materials' },
    { id: 'task-3', title: 'Install new light fixtures', client: 'CBP Inc.', location: 'Building C, Conference Room', description: 'Install 8 new LED light fixtures in conference room.', assignedDate: '2025-08-01', priority: 'medium', status: 'assigned' },
];
const initialMaterialRequests: MaterialRequest[] = [
    { id: 'mr-1', taskId: 'task-2', requestedDate: '2025-08-02', status: 'pending', items: [{ name: 'Electrical outlet (GFCI)', specification: 'Commercial Grade', quantity: '2' }, { name: 'Wire nuts', specification: 'Medium', quantity: '10' }] },
];

// --- PROPS & HELPER ---
interface SummaryCardProps { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; color: string; }
interface ModalProps<T> { visible: boolean; onClose: () => void; item: T | null; onSubmit: (data: any) => void; }
interface TaskExecutionProps {
    visible: boolean;
    onClose: () => void;
    task: Task | null;
    mode: 'start' | 'complete';
    onConfirmStart: (data: { taskId: string; beforePhotoUri: string }) => void;
    onConfirmComplete: (data: { taskId: string; afterPhotoUri: string; completionNotes: string }) => void;
}

// --- REUSABLE COMPONENTS ---
const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, color }) => ( <View style={styles.summaryCard}><Ionicons name={icon} size={24} color={color} /><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View> );

const RequestMaterialModal: React.FC<ModalProps<Task>> = ({ visible, onClose, item, onSubmit }) => {
    const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([{ name: '', specification: '', quantity: '' }]);
    const handleItemChange = (index: number, field: keyof RequestedItem, value: string) => {
        const newItems = [...requestedItems]; newItems[index][field] = value; setRequestedItems(newItems);
    };
    const addItemRow = () => { setRequestedItems([...requestedItems, { name: '', specification: '', quantity: '' }]); };
    const handleSubmit = () => {
        if (!item) return; const validItems = requestedItems.filter(i => i.name && i.quantity);
        if (validItems.length === 0) { Alert.alert("Invalid Request", "Please add at least one item."); return; }
        onSubmit({ taskId: item.id, items: validItems });
        setRequestedItems([{ name: '', specification: '', quantity: '' }]);
    };
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{flex: 1, backgroundColor: '#f8f9fa'}}>
                <View style={styles.modalHeaderView}><Text style={styles.modalTitle}>Request Materials</Text><TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#c0392b" /></TouchableOpacity></View>
                <Text style={styles.modalSubtitle}>For Task: {item?.title}</Text>
                <ScrollView contentContainerStyle={{padding: 16}}>
                    {requestedItems.map((reqItem, index) => (
                        <View key={index} style={styles.itemRequestRow}><Text style={styles.formLabel}>Item #{index + 1}</Text><TextInput style={styles.textInput} placeholder="Material Name" value={reqItem.name} onChangeText={val => handleItemChange(index, 'name', val)} /><TextInput style={styles.textInput} placeholder="Specification" value={reqItem.specification} onChangeText={val => handleItemChange(index, 'specification', val)} /><TextInput style={styles.textInput} placeholder="Quantity" value={reqItem.quantity} onChangeText={val => handleItemChange(index, 'quantity', val)} keyboardType="number-pad" /></View>
                    ))}
                    <TouchableOpacity style={styles.addItemButton} onPress={addItemRow}><Ionicons name="add-circle-outline" size={20} color="#2980b9" /><Text style={styles.addItemButtonText}>Add Another Item</Text></TouchableOpacity>
                </ScrollView>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}><Text style={styles.submitButtonText}>Submit Request</Text></TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
};

const TaskExecutionScreen: React.FC<TaskExecutionProps> = ({ visible, onClose, task, mode, onConfirmStart, onConfirmComplete }) => {
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [completionNotes, setCompletionNotes] = useState('');

    useEffect(() => { setPhotoUri(null); setCompletionNotes(''); }, [visible]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera permissions are required.'); return; }
        let result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [16, 9] });
        if (!result.canceled) { setPhotoUri(result.assets[0].uri); }
    };
    
    const handleSubmit = () => {
        if (!task) return; if (!photoUri) { Alert.alert('Photo Required', 'Please add a photo to proceed.'); return; }
        if (mode === 'start') { onConfirmStart({ taskId: task.id, beforePhotoUri: photoUri }); } 
        else { onConfirmComplete({ taskId: task.id, afterPhotoUri: photoUri, completionNotes }); }
    };

    if (!task) return null;
    const isStartMode = mode === 'start';

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.modalHeaderView}><Text style={styles.modalTitle}>{isStartMode ? 'Start Task' : 'Complete Task'}</Text><TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#c0392b" /></TouchableOpacity></View>
                <ScrollView contentContainerStyle={{padding: 16}}>
                    <Text style={styles.taskExecutionTitle}>{task.title}</Text><Text style={styles.taskExecutionMeta}>{task.client} • {task.location}</Text>
                    <View style={styles.detailsBox}><Text style={styles.detailsBoxTitle}>Problem Description</Text><Text style={styles.detailsBoxContent}>{task.description}</Text></View>
                    {isStartMode ? ( <View style={styles.detailsBox}><Text style={styles.detailsBoxTitle}>'Before' Photo</Text><Text style={styles.detailsBoxContent}>Add a photo of the issue before starting work.</Text></View> ) 
                    : ( <View style={styles.detailsBox}><Text style={styles.detailsBoxTitle}>'After' Photo & Notes</Text><Text style={styles.detailsBoxContent}>Add a photo of the completed work and any relevant notes.</Text><TextInput style={styles.notesInput} placeholder="Add completion notes here..." multiline value={completionNotes} onChangeText={setCompletionNotes} /></View> )}
                    <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}><Ionicons name="camera-outline" size={24} color="#2980b9"/><Text style={styles.photoButtonText}>{photoUri ? 'Change Photo' : 'Add Photo'}</Text></TouchableOpacity>
                    {photoUri && <Image source={{uri: photoUri}} style={styles.imagePreview} />}
                </ScrollView>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}><Text style={styles.submitButtonText}>{isStartMode ? 'Confirm Start' : 'Finalize & Complete'}</Text></TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
};

// --- MAIN COMPONENT ---
const TechnicianDashboard: React.FC = () => {
    type Tab = 'myTasks' | 'materialRequests';
    const [activeTab, setActiveTab] = useState<Tab>('myTasks');
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(initialMaterialRequests);
    const [isRequestModalVisible, setRequestModalVisible] = useState(false);
    const [isTaskModalVisible, setTaskModalVisible] = useState(false);
    const [taskModalMode, setTaskModalMode] = useState<'start' | 'complete'>('start');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // --- HANDLER FUNCTIONS ---
    const handleOpenTaskModal = (task: Task, mode: 'start' | 'complete') => { setSelectedTask(task); setTaskModalMode(mode); setTaskModalVisible(true); };
    const handleConfirmStartTask = ({ taskId, beforePhotoUri }: { taskId: string; beforePhotoUri: string }) => {
        setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: 'in progress', beforePhotoUri } : task ));
        setTaskModalVisible(false);
    };
    const handleConfirmCompleteTask = ({ taskId, afterPhotoUri, completionNotes }: { taskId: string; afterPhotoUri: string; completionNotes: string }) => {
        setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: 'completed', afterPhotoUri, completionNotes } : task ));
        setTaskModalVisible(false);
    };
    const handleOpenMaterialRequestModal = (task: Task) => { setSelectedTask(task); setRequestModalVisible(true); };
    const handleSubmitMaterialRequest = ({ taskId, items }: { taskId: string, items: RequestedItem[] }) => {
        const newRequest: MaterialRequest = { id: `mr-${Date.now()}`, taskId, requestedDate: new Date().toISOString().split('T')[0], status: 'pending', items, };
        setMaterialRequests(prev => [newRequest, ...prev]);
        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, status: 'pending materials' } : task));
        setRequestModalVisible(false);
        Alert.alert("Success", "Your material request has been submitted.");
    };

    // --- RENDER FUNCTIONS ---
    const renderTaskItem: ListRenderItem<Task> = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={{flexDirection: 'row'}}>
                    <View style={[styles.badge, styles[`${item.priority}Bg`]]}><Text style={[styles.badgeText, styles[`${item.priority}Text`]]}>{item.priority}</Text></View>
                    <View style={[styles.badge, styles[`${item.status.replace(' ','')}Bg`]]}><Text style={[styles.badgeText, styles[`${item.status.replace(' ','')}Text`]]}>{item.status}</Text></View>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.metaRow}><Ionicons name="business-outline" size={16} color="#7A869A" /><Text style={styles.metaText}>{item.client}</Text></View>
                <View style={styles.metaRow}><Ionicons name="location-outline" size={16} color="#7A869A" /><Text style={styles.metaText}>{item.location}</Text></View>
                <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Assigned: {item.assignedDate}</Text>
                <View style={styles.footerButtonRow}>
                    {/* ✨ UPDATED: Logic to show Start button on all active tasks */}
                    {item.status === 'assigned' && <>
                        <TouchableOpacity style={[styles.footerButton, styles.secondaryButton]} onPress={() => handleOpenMaterialRequestModal(item)}><Ionicons name="cube-outline" size={16} color="#172B4D" /><Text style={[styles.footerButtonText, {color: '#172B4D'}]}>Materials</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.footerButton, styles.primaryButton]} onPress={() => handleOpenTaskModal(item, 'start')}><Ionicons name="play-circle-outline" size={16} color="#fff" /><Text style={styles.footerButtonText}>Start</Text></TouchableOpacity>
                    </>}
                    {item.status === 'in progress' && <>
                        <TouchableOpacity style={[styles.footerButton, styles.secondaryButton]} onPress={() => handleOpenTaskModal(item, 'start')}><Ionicons name="refresh-outline" size={16} color="#172B4D" /><Text style={[styles.footerButtonText, {color: '#172B4D'}]}>Restart</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.footerButton, styles.primaryButton]} onPress={() => handleOpenTaskModal(item, 'complete')}><Ionicons name="checkmark-done-outline" size={16} color="#fff" /><Text style={styles.footerButtonText}>Complete</Text></TouchableOpacity>
                    </>}
                    {item.status === 'pending materials' && <>
                        <TouchableOpacity style={[styles.footerButton, styles.primaryButton]} onPress={() => handleOpenTaskModal(item, 'start')}><Ionicons name="play-circle-outline" size={16} color="#fff" /><Text style={styles.footerButtonText}>Start</Text></TouchableOpacity>
                    </>}
                </View>
            </View>
        </View>
    );

    const renderMaterialRequestItem: ListRenderItem<MaterialRequest> = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardTitle}>Material Request #{item.id.split('-')[1]}</Text><View style={[styles.badge, styles[`${item.status}Bg`]]}><Text style={[styles.badgeText, styles[`${item.status}Text`]]}>{item.status}</Text></View></View>
            <View style={styles.cardBody}><Text style={styles.cardMeta}>For Task #{item.taskId.split('-')[1]} • Requested on {item.requestedDate}</Text><View style={styles.itemsContainer}>{item.items.map((reqItem, index) => <View key={index} style={styles.requestItem}><Text style={styles.itemQuantity}>{reqItem.quantity}x</Text><Text style={styles.itemName}>{reqItem.name}</Text>{reqItem.specification && <Text style={styles.itemSpec}> ({reqItem.specification})</Text>}</View>)}</View></View>
            <View style={styles.cardFooter}><TouchableOpacity style={styles.messageButton}><Ionicons name="chatbubble-ellipses-outline" size={16} color="#2980b9" /><Text style={styles.messageButtonText}>Message Storekeeper</Text></TouchableOpacity></View>
        </View>
    );

    const ListHeaderComponent = (
        <><Text style={styles.header}>Technician Dashboard</Text><Text style={styles.subHeader}>Manage your tasks and requests</Text><View style={styles.summaryGrid}><SummaryCard icon="document-text-outline" label="Assigned Tasks" value={tasks.filter(t => t.status === 'assigned').length} color="#2980b9" /><SummaryCard icon="sync-circle-outline" label="In Progress" value={tasks.filter(t => t.status === 'in progress').length} color="#8e44ad" /><SummaryCard icon="checkmark-done-circle-outline" label="Completed" value={tasks.filter(t => t.status === 'completed').length} color="#27ae60" /><SummaryCard icon="cube-outline" label="Pending Materials" value={tasks.filter(t => t.status === 'pending materials').length} color="#f39c12" /></View><View style={styles.tabContainer}><TouchableOpacity style={[styles.tabButton, activeTab === 'myTasks' && styles.activeTab]} onPress={() => setActiveTab('myTasks')}><Text style={[styles.tabText, activeTab === 'myTasks' && styles.activeTabText]}>My Tasks</Text></TouchableOpacity><TouchableOpacity style={[styles.tabButton, activeTab === 'materialRequests' && styles.activeTab]} onPress={() => setActiveTab('materialRequests')}><Text style={[styles.tabText, activeTab === 'materialRequests' && styles.activeTabText]}>Material Requests</Text></TouchableOpacity></View></>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ListHeaderComponent={ListHeaderComponent}
                data={activeTab === 'myTasks' ? tasks : materialRequests}
                renderItem={activeTab === 'myTasks' ? renderTaskItem : renderMaterialRequestItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContainer}
            />
            <RequestMaterialModal visible={isRequestModalVisible} onClose={() => setRequestModalVisible(false)} item={selectedTask} onSubmit={handleSubmitMaterialRequest} />
            <TaskExecutionScreen 
                visible={isTaskModalVisible} onClose={() => setTaskModalVisible(false)} task={selectedTask} mode={taskModalMode}
                onConfirmStart={handleConfirmStartTask} onConfirmComplete={handleConfirmCompleteTask}
            />
            <View style={styles.bottomNav}><TouchableOpacity style={styles.navItem}><Ionicons name="chatbubbles-outline" size={24} color="#7f8c8d" /><Text style={styles.navText}>Messages</Text></TouchableOpacity><TouchableOpacity style={styles.navItem}><View style={styles.dashboardButton}><Ionicons name="grid-outline" size={24} color="#fff" /></View><Text style={[styles.navText, {color: '#172B4D'}]}>Dashboard</Text></TouchableOpacity><TouchableOpacity style={styles.navItem}><Ionicons name="person-outline" size={24} color="#7f8c8d" /><Text style={styles.navText}>Profile</Text></TouchableOpacity></View>
        </SafeAreaView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" }, scrollContainer: { paddingBottom: 100 },
    header: { fontSize: 28, fontWeight: "bold", color: '#172B4D', paddingHorizontal: 16, paddingTop: 16 }, subHeader: { fontSize: 16, color: "#7A869A", marginBottom: 24, paddingHorizontal: 16 },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16 }, summaryCard: { width: "48%", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#DFE1E6' },
    summaryValue: { fontSize: 28, fontWeight: "bold", marginTop: 8, color: "#172B4D" }, summaryLabel: { fontSize: 14, color: "#7A869A" },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F4F5F7', borderRadius: 10, padding: 4, margin: 16 },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    tabText: { fontSize: 16, fontWeight: '600', color: '#7A869A' }, activeTabText: { color: '#172B4D' },
    card: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#DFE1E6', shadowColor: '#95a5a6', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 0 }, 
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#172B4D', flex: 1, flexWrap: 'wrap', marginRight: 8, lineHeight: 24 },
    cardBody: { padding: 16 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    metaText: { fontSize: 14, color: '#7A869A', marginLeft: 8 },
    cardDescription: { fontSize: 14, color: '#42526E', marginTop: 8, lineHeight: 20 },
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 6, alignSelf: 'flex-start' }, badgeText: { fontWeight: 'bold', fontSize: 12, },
    highBg: { backgroundColor: 'rgba(230, 126, 34, 0.15)' }, highText: { color: '#d35400' },
    mediumBg: { backgroundColor: 'rgba(243, 156, 18, 0.15)' }, mediumText: { color: '#f39c12' },
    assignedBg: { backgroundColor: 'rgba(41, 128, 185, 0.15)' }, assignedText: { color: '#2980b9' },
    inprogressBg: { backgroundColor: 'rgba(142, 68, 173, 0.15)' }, inprogressText: { color: '#8e44ad' },
    pendingmaterialsBg: { backgroundColor: 'rgba(243, 156, 18, 0.15)' }, pendingmaterialsText: { color: '#f39c12' },
    completedBg: { backgroundColor: 'rgba(39, 174, 96, 0.15)' }, completedText: { color: '#27ae60' },
    pendingBg: { backgroundColor: 'rgba(41, 128, 185, 0.15)' }, pendingText: { color: '#2980b9' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F4F5F7', paddingHorizontal: 16, paddingVertical: 12 },
    dateText: { fontSize: 12, color: '#7A869A', fontStyle: 'italic' }, footerButtonRow: { flexDirection: 'row' },
    footerButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 }, 
    footerButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
    primaryButton: { backgroundColor: '#2980b9', elevation: 2 },
    secondaryButton: { backgroundColor: '#F4F5F7', borderWidth: 1, borderColor: '#DFE1E6' },
    itemsContainer: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F4F5F7', paddingTop: 12 }, 
    requestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    itemQuantity: { fontSize: 14, fontWeight: 'bold', color: '#172B4D', marginRight: 8 }, itemName: { fontSize: 14, color: '#42526E' }, itemSpec: { fontSize: 12, color: '#7A869A', fontStyle: 'italic' },
    messageButton: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#F4F5F7', borderRadius: 8 }, messageButtonText: { color: '#2980b9', fontWeight: '600', marginLeft: 8 },
    cardMeta: { fontSize: 14, color: '#7A869A', marginBottom: 8 },
    bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#DFE1E6", position: "absolute", bottom: 0, width: "100%" },
    navItem: { alignItems: "center", flex: 1 }, navText: { fontSize: 12, color: "#7A869A", marginTop: 4 },
    dashboardButton: { backgroundColor: '#172B4D', padding: 12, borderRadius: 30, marginTop: -25, borderWidth: 4, borderColor: '#f8f9fa' },
    modalHeaderView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#172B4D' }, modalSubtitle: { fontSize: 16, color: '#7A869A', paddingHorizontal: 16, marginBottom: 10 },
    itemRequestRow: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#DFE1E6' },
    formLabel: { fontSize: 14, fontWeight: '600', color: '#7A869A', marginBottom: 8 },
    textInput: { backgroundColor: '#F4F5F7', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DFE1E6', marginBottom: 8 },
    addItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B3BAC5' },
    addItemButtonText: { color: '#2980b9', fontWeight: '600', marginLeft: 8 },
    submitButton: { backgroundColor: '#2980b9', padding: 16, margin: 16, borderRadius: 8, alignItems: 'center', elevation: 2 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    taskExecutionTitle: { fontSize: 22, fontWeight: 'bold', color: '#172B4D', marginBottom: 4, paddingHorizontal: 16 },
    taskExecutionMeta: { fontSize: 16, color: '#7A869A', marginBottom: 20, paddingHorizontal: 16 },
    detailsBox: { backgroundColor: '#F4F5F7', borderRadius: 8, padding: 16, marginHorizontal: 16, marginBottom: 16 },
    detailsBoxTitle: { fontSize: 14, fontWeight: 'bold', color: '#7A869A', textTransform: 'uppercase', marginBottom: 8 },
    detailsBoxContent: { fontSize: 16, color: '#42526E', lineHeight: 22 },
    notesInput: { fontSize: 16, color: '#172B4D', backgroundColor: '#fff', borderColor: '#DFE1E6', borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12, height: 100, textAlignVertical: 'top', },
    photoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#B3BAC5', borderStyle: 'dashed', marginHorizontal: 16, },
    photoButtonText: { fontSize: 16, fontWeight: '600', color: '#2980b9', marginLeft: 10, },
    imagePreview: { width: '92%', height: 200, borderRadius: 8, margin: 16, alignSelf: 'center', },
});

export default TechnicianDashboard;