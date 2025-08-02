import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView, // ✨ FIXED: Added missing ScrollView import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- TYPE DEFINITIONS ---
type AlertType = 'error' | 'info' | 'warning';
interface SystemAlert { id: string; message: string; type: AlertType; }
interface PerformanceMetric { id: string; label: string; value: string; }
interface ActivityEvent { id: string; icon: keyof typeof Ionicons.glyphMap; description: string; timestamp: string; color: string; }
interface RestockRequest { id: string; itemName: string; quantity: number; reason: string; status: 'pending' | 'approved' | 'rejected'; }

// --- MOCK DATA ---
const summaryData = [
    { id: '1', label: 'Total Users', value: '45', icon: 'people-outline', color: '#2980b9' },
    { id: '2', label: 'Active Complaints', value: '18', icon: 'chatbox-ellipses-outline', color: '#8e44ad' },
    { id: '3', label: 'Completion Rate', value: '87%', icon: 'checkmark-done-circle-outline', color: '#27ae60' },
    { id: '4', label: 'Avg Response Time', value: '2.3 hours', icon: 'timer-outline', color: '#f39c12' },
];
const systemAlerts: SystemAlert[] = [
    { id: '1', message: 'Low stock alert: PVC Pipes (2 inch) - Only 5 units remaining', type: 'error' },
    { id: '2', message: 'System maintenance scheduled for tonight at 2:00 AM', type: 'info' },
    { id: '3', message: '3 overdue tasks require immediate attention', type: 'error' },
];
const performanceMetrics: PerformanceMetric[] = [
    { id: '1', label: 'Task Completion Rate', value: '87%' },
    { id: '2', label: 'Average Response Time', value: '2.3 hours' },
    { id: '3', label: 'Total Messages', value: '234' },
];
const activityFeed: ActivityEvent[] = [
    { id: '1', icon: 'document-text-outline', description: 'New complaint submitted by ABC Corp', timestamp: '2 minutes ago', color: '#2980b9' },
    { id: '2', icon: 'person-add-outline', description: 'Task assigned to John Smith (HVAC)', timestamp: '15 minutes ago', color: '#8e44ad' },
    { id: '3', icon: 'build-outline', description: 'Electrical repair completed by Sarah Wilson', timestamp: '1 hour ago', color: '#27ae60' },
    { id: '4', icon: 'cube-outline', description: 'Material request approved by Storekeeper', timestamp: '3 hours ago', color: '#f39c12' },
];
const initialRestockRequests: RestockRequest[] = [
    { id: 'rr-1', itemName: 'PVC Pipes (2 inch)', quantity: 50, reason: 'Low Stock Alert', status: 'pending' },
    { id: 'rr-2', itemName: 'HVAC Filters', quantity: 25, reason: 'Scheduled Restock', status: 'pending' },
    { id: 'rr-3', itemName: 'Copper Wiring', quantity: 100, reason: 'Special Project', status: 'approved' },
];

// --- MAIN COMPONENT ---
const AdminDashboard: React.FC = () => {
    type Tab = 'overview' | 'users' | 'activity' | 'approvals';
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [restockRequests, setRestockRequests] = useState<RestockRequest[]>(initialRestockRequests);

    const handleRequestStatusChange = (requestId: string, newStatus: RestockRequest['status']) => {
        setRestockRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <View>
                        <Text style={styles.sectionTitle}>System Alerts</Text>
                        {systemAlerts.map(alert => {
                            const alertStyle = styles[`${alert.type}Alert`];
                            return (
                                <View key={alert.id} style={[styles.alertBox, alertStyle]}>
                                    <Ionicons name={alert.type === 'info' ? 'information-circle-outline' : 'warning-outline'} size={20} color={alertStyle.color} />
                                    <Text style={[styles.alertText, {color: alertStyle.color}]}>{alert.message}</Text>
                                </View>
                            );
                        })}
                        <Text style={styles.sectionTitle}>System Performance</Text>
                        <View style={styles.performanceCard}>
                            {performanceMetrics.map(metric => (
                                <View key={metric.id} style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>{metric.label}</Text>
                                    <Text style={styles.metricValue}>{metric.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 'activity':
                return (
                    <View>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        {activityFeed.map(event => (
                            <View key={event.id} style={styles.activityItem}>
                                <View style={[styles.activityIconContainer, {backgroundColor: event.color + '20'}]}>
                                    <Ionicons name={event.icon} size={22} color={event.color} />
                                </View>
                                <View style={styles.activityTextContainer}>
                                    <Text style={styles.activityDescription}>{event.description}</Text>
                                    <Text style={styles.activityTimestamp}>{event.timestamp}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                );
            case 'approvals':
                return (
                    <View>
                        <Text style={styles.sectionTitle}>Storekeeper Requests</Text>
                        {restockRequests.map(req => (
                            <View key={req.id} style={styles.requestCard}>
                                <View>
                                    <Text style={styles.requestItemName}>{req.quantity}x {req.itemName}</Text>
                                    <Text style={styles.requestReason}>{req.reason}</Text>
                                </View>
                                {req.status === 'pending' ? (
                                    <View style={styles.footerButtonRow}>
                                        <TouchableOpacity style={[styles.footerButton, styles.rejectButton]} onPress={() => handleRequestStatusChange(req.id, 'rejected')}><Text style={styles.footerButtonText}>Reject</Text></TouchableOpacity>
                                        <TouchableOpacity style={[styles.footerButton, styles.approveButton]} onPress={() => handleRequestStatusChange(req.id, 'approved')}><Text style={styles.footerButtonText}>Approve</Text></TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={[styles.requestStatus, {color: req.status === 'approved' ? '#27ae60' : '#c0392b'}]}>{req.status}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                );
            case 'users':
                return <View><Text style={styles.sectionTitle}>User Management</Text><Text style={{textAlign: 'center', padding: 20, color: '#7A869A'}}>User list and management UI would appear here.</Text></View>;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Admin Dashboard</Text>
                <Text style={styles.subHeader}>Complete system oversight and management</Text>
                <View style={styles.summaryGrid}>
                    {summaryData.map(item => (
                        <View key={item.id} style={styles.summaryCard}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                            <Text style={styles.summaryValue}>{item.value}</Text>
                            <Text style={styles.summaryLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.tabContainer}>
                    {(['overview', 'users', 'activity', 'approvals'] as Tab[]).map(tab => (
                        <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderContent()}

            </ScrollView>
        </SafeAreaView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    scrollContainer: { padding: 16, paddingBottom: 100 },
    header: { fontSize: 28, fontWeight: "bold", color: '#172B4D' },
    subHeader: { fontSize: 16, color: "#7A869A", marginBottom: 24 },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    summaryCard: { width: "48%", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#DFE1E6' },
    summaryValue: { fontSize: 28, fontWeight: "bold", marginTop: 8, color: "#172B4D" },
    summaryLabel: { fontSize: 14, color: "#7A869A" },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: '#172B4D', marginTop: 24, marginBottom: 12 },
    alertBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 10, marginBottom: 8 },
    errorAlert: { backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#c0392b' },
    infoAlert: { backgroundColor: 'rgba(41, 128, 185, 0.1)', color: '#2980b9' },
    alertText: { marginLeft: 12, fontSize: 14, flex: 1 },
    performanceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#DFE1E6' },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F4F5F7' },
    metricLabel: { fontSize: 16, color: '#42526E' },
    metricValue: { fontSize: 16, fontWeight: 'bold', color: '#172B4D' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F4F5F7', borderRadius: 10, padding: 4, marginVertical: 16 },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    tabText: { fontSize: 16, fontWeight: '600', color: '#7A869A' },
    activeTabText: { color: '#172B4D' },
    activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#DFE1E6' },
    activityIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    activityTextContainer: { flex: 1 },
    activityDescription: { fontSize: 15, color: '#172B4D' },
    activityTimestamp: { fontSize: 12, color: '#7A869A', marginTop: 2 },
    requestCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DFE1E6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    requestItemName: { fontSize: 16, fontWeight: 'bold', color: '#172B4D' },
    requestReason: { fontSize: 14, color: '#7A869A' },
    requestStatus: { fontSize: 14, fontWeight: 'bold' },
    footerButtonRow: { flexDirection: 'row' },
    footerButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, },
    footerButtonText: { color: '#fff', fontWeight: 'bold' },
    approveButton: { backgroundColor: '#27ae60', marginLeft: 8 },
    rejectButton: { backgroundColor: '#c0392b' },
});

export default AdminDashboard;