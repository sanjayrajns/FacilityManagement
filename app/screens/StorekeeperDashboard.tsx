import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// --- TYPE DEFINITIONS ---
type StockLevel = 'good' | 'medium' | 'low';
type HistoryType = 'created' | 'issued' | 'restocked' | 'request_issued';

interface HistoryEntry {
    id: string; type: HistoryType; quantityChange: number; date: string; note: string;
}
interface InventoryItem {
    id: string; name: string; category: string; currentStock: number; minMaxStock: string; lastRestocked: string; stockLevel: StockLevel; history: HistoryEntry[];
}
interface RequestedItem { name: string; quantity: number; }
interface MaterialRequest {
    id: string; from: string; task: string; requestedItems: RequestedItem[]; date: string; priority: 'urgent' | 'high' | 'medium'; status: 'pending' | 'approved' | 'rejected' | 'issued';
}
interface RestockDetails { itemId: string; itemName: string; quantity: number; reason: string; }

// --- MOCK DATA ---
const technicians = ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'Tom Brown'];
const initialInventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Electrical Outlets (GFCI)', category: 'Electrical', currentStock: 75, minMaxStock: '10/100', lastRestocked: '2025-08-01', stockLevel: 'good', history: [{id: 'h-1', type: 'created', quantityChange: 75, date: '2025-08-01T10:00:00Z', note: 'Initial stock'}] },
    { id: 'inv-2', name: 'PVC Pipes (2 inch)', category: 'Plumbing', currentStock: 22, minMaxStock: '10/50', lastRestocked: '2025-07-28', stockLevel: 'medium', history: [{id: 'h-2', type: 'created', quantityChange: 22, date: '2025-07-28T11:30:00Z', note: 'Initial stock'}] },
    { id: 'inv-3', name: 'HVAC Filters', category: 'HVAC', currentStock: 1, minMaxStock: '12/40', lastRestocked: '2025-07-12', stockLevel: 'low', history: [{id: 'h-3', type: 'created', quantityChange: 1, date: '2025-07-12T09:15:00Z', note: 'Initial stock'}] },
    { id: 'inv-4', name: 'Refrigerant R-410A', category: 'HVAC', currentStock: 8, minMaxStock: '2/10', lastRestocked: '2025-07-15', stockLevel: 'good', history: [{id: 'h-4', type: 'created', quantityChange: 8, date: '2025-07-15T14:00:00Z', note: 'Initial stock'}]},
];
const initialMaterialRequests: MaterialRequest[] = [
    { id: 'req-1', from: 'Sarah Wilson', task: 'Task #12', requestedItems: [{ name: 'Electrical Outlets (GFCI)', quantity: 10 }], date: '2025-08-01', priority: 'urgent', status: 'pending' },
    { id: 'req-2', from: 'John Smith', task: 'Task #9', requestedItems: [{ name: 'HVAC Filters', quantity: 2 }, { name: 'Refrigerant R-410A', quantity: 1 }], date: '2025-07-31', priority: 'high', status: 'approved' },
];

// --- PROPS & HELPER ---
interface SummaryCardProps { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; color: string; }
interface ModalProps<T> { visible: boolean; onClose: () => void; item: T | null; onSubmit?: (data: any) => void; }
interface AddStockModalProps { visible: boolean; onClose: () => void; onSubmit: (newItem: InventoryItem) => void; }
interface IssueModalProps extends ModalProps<InventoryItem> { technicians: string[]; }

const calculateStockLevel = (current: number, minMax: string): StockLevel => {
    const parts = minMax.split('/'); if (parts.length < 2) return 'medium'; 
    const maxStock = parseInt(parts[1], 10); if (isNaN(maxStock) || maxStock === 0) return 'medium';
    const lowThreshold = maxStock * 0.02; const mediumThreshold = maxStock * 0.50;  
    if (current <= lowThreshold) return 'low';
    if (current <= mediumThreshold) return 'medium';
    return 'good';
};

// --- REUSABLE COMPONENTS ---

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, color }) => ( <View style={styles.summaryCard}><Ionicons name={icon} size={24} color={color} /><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View> );
const ProgressBar: React.FC<{ current: number; max: number; level: StockLevel }> = ({ current, max, level }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    const color = level === 'good' ? '#27ae60' : level === 'medium' ? '#f39c12' : '#c0392b';
    return ( <View style={styles.progressBarContainer}><View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} /></View> );
};
const HistoryModal: React.FC<ModalProps<InventoryItem>> = ({ visible, onClose, item }) => {
    if (!item) return null;
    const renderHistoryItem: ListRenderItem<HistoryEntry> = ({ item: historyEntry }) => {
        const isCredit = historyEntry.type === 'created' || historyEntry.type === 'restocked';
        const historyStyle = {
            icon: isCredit ? 'arrow-up-circle' : 'arrow-down-circle',
            color: isCredit ? '#27ae60' : '#c0392b',
            quantityPrefix: isCredit ? '+' : ''
        };
        return (
            <View style={styles.historyItem}>
                <Ionicons name={historyStyle.icon} size={32} color={historyStyle.color} />
                <View style={styles.historyDetails}><Text style={styles.historyNote}>{historyEntry.note}</Text><Text style={styles.historyDate}>{new Date(historyEntry.date).toLocaleString()}</Text></View>
                <Text style={[styles.historyQuantity, { color: historyStyle.color }]}>{historyStyle.quantityPrefix}{historyEntry.quantityChange}</Text>
            </View>
        );
    };
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{flex: 1, backgroundColor: '#f8f9fa'}}>
                <View style={styles.modalHeaderView}><Text style={styles.modalTitle}>Transaction History</Text><TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#c0392b" /></TouchableOpacity></View>
                <Text style={styles.modalSubtitle}>{item.name}</Text>
                <FlatList data={[...item.history].reverse()} renderItem={renderHistoryItem} keyExtractor={entry => entry.id} contentContainerStyle={{paddingHorizontal: 16}}/>
            </SafeAreaView>
        </Modal>
    );
};
const AddStockModal: React.FC<AddStockModalProps> = ({ visible, onClose, onSubmit }) => {
    const [name, setName] = useState(''); const [category, setCategory] = useState('General'); const [currentStock, setCurrentStock] = useState(''); const [minMaxStock, setMinMaxStock] = useState('');
    const handleSubmit = () => { if (!name || !currentStock || !minMaxStock) { Alert.alert('Missing Info'); return; } const stock = parseInt(currentStock, 10) || 0; const newItem: InventoryItem = { id: `inv-${Date.now()}`, name, category, currentStock: stock, minMaxStock, lastRestocked: new Date().toISOString().split('T')[0], stockLevel: calculateStockLevel(stock, minMaxStock), history: [{ id: `h-${Date.now()}`, type: 'created', quantityChange: stock, date: new Date().toISOString(), note: 'Initial stock added' }] }; onSubmit(newItem); setName(''); setCategory('General'); setCurrentStock(''); setMinMaxStock(''); };
    return ( <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.formModalContainer}><Text style={styles.modalTitle}>Add New Stock</Text><View style={styles.inputGroup}><Ionicons name="cube-outline" style={styles.inputIcon} /><TextInput style={styles.textInput} placeholder="Item Name" value={name} onChangeText={setName} /></View><View style={styles.inputGroup}><Ionicons name="pricetag-outline" style={styles.inputIcon} /><View style={styles.pickerWrapper}><Picker selectedValue={category} onValueChange={(val) => setCategory(val)}><Picker.Item label="General" value="General" /><Picker.Item label="Electrical" value="Electrical" /><Picker.Item label="Plumbing" value="Plumbing" /><Picker.Item label="HVAC" value="HVAC" /></Picker></View></View><View style={styles.inputGroup}><Ionicons name="server-outline" style={styles.inputIcon} /><TextInput style={styles.textInput} placeholder="Initial Quantity" value={currentStock} onChangeText={setCurrentStock} keyboardType="number-pad" /></View><View style={styles.inputGroup}><Ionicons name="options-outline" style={styles.inputIcon} /><TextInput style={styles.textInput} placeholder="Min/Max Stock (e.g., 20/200)" value={minMaxStock} onChangeText={setMinMaxStock} /></View><View style={styles.modalButtonRow}><TouchableOpacity style={styles.modalCancelButton} onPress={onClose}><Text style={styles.modalButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.modalConfirmButton} onPress={handleSubmit}><Text style={styles.modalButtonText}>Add to Inventory</Text></TouchableOpacity></View></View></View></Modal> );
};
const IssueStockModal: React.FC<IssueModalProps> = ({ visible, onClose, item, onSubmit, technicians }) => {
    const [quantity, setQuantity] = useState(''); const [selectedTechnician, setSelectedTechnician] = useState('');
    useEffect(() => { if(technicians.length > 0) { setSelectedTechnician(technicians[0]); } }, []);
    const handleSubmit = () => { const qtyToIssue = parseInt(quantity, 10); if (!item || !qtyToIssue || qtyToIssue <= 0) { Alert.alert("Invalid Quantity"); return; } if (!selectedTechnician) { Alert.alert("Select Technician"); return; } onSubmit({ itemId: item.id, quantityToIssue: qtyToIssue, technician: selectedTechnician }); setQuantity(''); };
    if (!item) return null;
    return ( <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.formModalContainer}><Text style={styles.modalTitle}>Issue Stock</Text><Text style={styles.modalSubtitle}>{item.name}</Text><Text style={styles.modalInfo}>Current Stock: {item.currentStock}</Text><Text style={styles.formLabel}>Quantity to Issue</Text><TextInput style={styles.textInput} placeholder="e.g., 5" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" /><Text style={styles.formLabel}>Issue to Technician</Text><View style={styles.pickerWrapper}><Picker selectedValue={selectedTechnician} onValueChange={(val) => setSelectedTechnician(val)}>{technicians.map((tech, index) => ( <Picker.Item label={tech} value={tech} key={index} /> ))}</Picker></View><View style={styles.modalButtonRow}><TouchableOpacity style={styles.modalCancelButton} onPress={onClose}><Text style={styles.modalButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.modalConfirmButton} onPress={handleSubmit}><Text style={styles.modalButtonText}>Confirm & Issue</Text></TouchableOpacity></View></View></View></Modal> );
};
const RestockModal: React.FC<ModalProps<InventoryItem>> = ({ visible, onClose, item, onSubmit }) => {
    const [quantity, setQuantity] = useState(''); const [reason, setReason] = useState('Scheduled Restock');
    const handleSubmit = () => { if (!item || !quantity || !reason) { return; } const restockDetails: RestockDetails = { itemId: item.id, itemName: item.name, quantity: parseInt(quantity,10) || 0, reason, }; onSubmit(restockDetails); setQuantity(''); setReason('Scheduled Restock'); };
    if (!item) return null;
    return ( <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.formModalContainer}><Text style={styles.modalTitle}>Restock Item</Text><Text style={styles.modalSubtitle}>{item.name}</Text><Text style={styles.formLabel}>Quantity to Add</Text><TextInput style={styles.textInput} placeholder="e.g., 50" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" /><Text style={styles.formLabel}>Reason</Text><View style={styles.pickerWrapper}><Picker selectedValue={reason} onValueChange={(val) => setReason(val)}><Picker.Item label="Scheduled Restock" value="Scheduled Restock" /><Picker.Item label="Low Stock" value="Low Stock" /></Picker></View><View style={styles.modalButtonRow}><TouchableOpacity style={styles.modalCancelButton} onPress={onClose}><Text style={styles.modalButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.modalConfirmButton} onPress={handleSubmit}><Text style={styles.modalButtonText}>Confirm Restock</Text></TouchableOpacity></View></View></View></Modal> );
};

// --- MAIN COMPONENT ---
const StorekeeperDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
    const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(initialMaterialRequests);
    const [isRestockModalVisible, setRestockModalVisible] = useState(false);
    const [isAddStockModalVisible, setAddStockModalVisible] = useState(false);
    const [isIssueModalVisible, setIssueModalVisible] = useState(false); 
    const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

    // --- HANDLER FUNCTIONS ---
    const handleMarkAsIssued = (request: MaterialRequest) => {
        let tempInventory = [...inventory]; let stockSufficient = true;
        for (const requestedItem of request.requestedItems) { const stockItem = tempInventory.find(inv => inv.name === requestedItem.name); if (!stockItem || stockItem.currentStock < requestedItem.quantity) { stockSufficient = false; Alert.alert("Stock Error", `Not enough stock for "${requestedItem.name}".`); break; } }
        if (stockSufficient) {
            request.requestedItems.forEach(requestedItem => {
                tempInventory = tempInventory.map(inv => {
                    if (inv.name === requestedItem.name) {
                        const newStock = inv.currentStock - requestedItem.quantity; const newHistoryEntry: HistoryEntry = { id: `h-${Date.now()}`, type: 'request_issued', quantityChange: -requestedItem.quantity, date: new Date().toISOString(), note: `For Request #${request.id.split('-')[1]}` };
                        return { ...inv, currentStock: newStock, stockLevel: calculateStockLevel(newStock, inv.minMaxStock), history: [...inv.history, newHistoryEntry] };
                    } return inv;
                });
            });
            setInventory(tempInventory); setMaterialRequests(prev => prev.map(req => req.id === request.id ? { ...req, status: 'issued' } : req)); Alert.alert("Success", "Items issued.");
        }
    };
    const handleRequestStatusChange = (requestId: string, newStatus: MaterialRequest['status']) => { setMaterialRequests(prevRequests => prevRequests.map(req => req.id === requestId ? { ...req, status: newStatus } : req)); };
    const handleIssueStock = ({ itemId, quantityToIssue, technician }: { itemId: string; quantityToIssue: number; technician: string }) => {
        let success = false;
        const newInventory = inventory.map(item => {
            if (item.id === itemId) {
                if (item.currentStock >= quantityToIssue) {
                    const newStock = item.currentStock - quantityToIssue; const newHistoryEntry: HistoryEntry = { id: `h-${Date.now()}`, type: 'issued', quantityChange: -quantityToIssue, date: new Date().toISOString(), note: `Issued to ${technician}` }; success = true;
                    return { ...item, currentStock: newStock, stockLevel: calculateStockLevel(newStock, item.minMaxStock), history: [...item.history, newHistoryEntry] };
                } else { Alert.alert("Stock Error", "Not enough items in stock."); }
            } return item;
        });
        if (success) { setInventory(newInventory); Alert.alert("Success", `${quantityToIssue} items issued to ${technician}.`); setIssueModalVisible(false); }
    };
    const handleConfirmRestock = (restockDetails: RestockDetails) => {
        const newInventory = inventory.map(item => {
            if (item.id === restockDetails.itemId) {
                const newStock = item.currentStock + restockDetails.quantity; const newHistoryEntry: HistoryEntry = { id: `h-${Date.now()}`, type: 'restocked', quantityChange: restockDetails.quantity, date: new Date().toISOString(), note: restockDetails.reason };
                return { ...item, currentStock: newStock, stockLevel: calculateStockLevel(newStock, item.minMaxStock), history: [...item.history, newHistoryEntry], lastRestocked: new Date().toISOString().split('T')[0] };
            } return item;
        });
        setInventory(newInventory); Alert.alert("Success", `${restockDetails.quantity} units of ${restockDetails.itemName} have been restocked.`); setRestockModalVisible(false);
    };
    const handleOpenIssueModal = (item: InventoryItem) => { setSelectedInventoryItem(item); setIssueModalVisible(true); };
    const handleOpenRestockModal = (item: InventoryItem) => { setSelectedInventoryItem(item); setRestockModalVisible(true); };
    const handleOpenHistoryModal = (item: InventoryItem) => { setSelectedInventoryItem(item); setHistoryModalVisible(true); };
    const handleAddNewStock = (newItem: InventoryItem) => { setInventory(prev => [newItem, ...prev]); setAddStockModalVisible(false); };
    
    // --- RENDER FUNCTIONS ---
    const renderInventoryItem: ListRenderItem<InventoryItem> = ({ item }) => {
        const maxStock = parseInt(item.minMaxStock.split('/')[1], 10) || 1;
        return ( <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{item.name}</Text><View style={[styles.badge, styles[`${item.stockLevel}Bg`]]}><Text style={[styles.badgeText, styles[`${item.stockLevel}Text`]]}>{item.stockLevel}</Text></View></View><Text style={styles.cardSubtitle}>{item.category}</Text><View style={styles.stockDetailsContainer}><Text style={styles.stockValue}>{item.currentStock}</Text><Text style={styles.stockUnit}>in stock</Text></View><ProgressBar current={item.currentStock} max={maxStock} level={item.stockLevel} /><View style={styles.stockInfoGrid}><View style={styles.infoBlock}><Ionicons name="options-outline" style={styles.infoIcon} /><Text style={styles.infoLabel}>Min/Max: {item.minMaxStock}</Text></View><View style={styles.infoBlock}><Ionicons name="calendar-outline" style={styles.infoIcon} /><Text style={styles.infoLabel}>Last Restock: {item.lastRestocked}</Text></View></View><View style={styles.cardButtonRow}><TouchableOpacity style={styles.textButton} onPress={() => handleOpenHistoryModal(item)}><Text style={styles.textButtonText}>View History</Text></TouchableOpacity><View style={{flexDirection: 'row'}}>
            {/* ✨ UPDATED: Buttons now have icons */}
            <TouchableOpacity style={[styles.actionButton, styles.issueButton]} onPress={() => handleOpenIssueModal(item)}>
                <Ionicons name="arrow-down-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.restockButton]} onPress={() => handleOpenRestockModal(item)}>
                <Ionicons name="arrow-up-outline" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Restock</Text>
            </TouchableOpacity>
        </View></View></View> );
    };
    const renderMaterialRequestItem: ListRenderItem<MaterialRequest> = ({ item }) => {
        return ( <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Request #{item.id.split('-')[1]}</Text><View style={{flexDirection: 'row'}}><View style={[styles.badge, styles[`${item.priority}Bg`]]}><Text style={[styles.badgeText, styles[`${item.priority}Text`]]}>{item.priority}</Text></View><View style={[styles.badge, styles[`${item.status}Bg`]]}><Text style={[styles.badgeText, styles[`${item.status}Text`]]}>{item.status}</Text></View></View></View><Text style={styles.cardSubtitle}>From {item.from} • Task #{item.task}</Text><Text style={styles.listHeader}>Requested Items:</Text>{item.requestedItems.map((ri, index) => <Text key={index} style={styles.listItem}>• {ri.quantity} x {ri.name}</Text>)}<View style={styles.cardFooter}><Text style={styles.dateText}>Requested: {item.date}</Text>
            {item.status === 'pending' ? (<View style={styles.footerButtonRow}><TouchableOpacity style={styles.approveButton} onPress={() => handleRequestStatusChange(item.id, 'approved')}><Text style={styles.approveButtonText}>Approve</Text></TouchableOpacity><TouchableOpacity style={styles.rejectButton} onPress={() => handleRequestStatusChange(item.id, 'rejected')}><Text style={styles.rejectButtonText}>Reject</Text></TouchableOpacity></View>) 
            : item.status === 'approved' ? (<View style={styles.footerButtonRow}><TouchableOpacity style={styles.issuedButton} onPress={() => handleMarkAsIssued(item)}><Text style={styles.issuedButtonText}>Mark as Issued</Text></TouchableOpacity></View>) : null}
        </View></View> );
    };
    const ListHeaderComponent = (
        <><Text style={styles.header}>Storekeeper Dashboard</Text><Text style={styles.subHeader}>Manage inventory</Text><View style={styles.summaryGrid}><SummaryCard icon="cube-outline" label="Total Items" value={inventory.length} color="#2980b9" /><SummaryCard icon="warning-outline" label="Low Stock" value={inventory.filter(i => i.stockLevel === 'low').length} color="#d35400" /><SummaryCard icon="document-text-outline" label="Pending Requests" value={materialRequests.filter(r => r.status === 'pending').length} color="#8e44ad" /><SummaryCard icon="checkmark-done-outline" label="Issued Requests" value={materialRequests.filter(r => r.status === 'issued').length} color="#27ae60" /></View><View style={styles.tabContainer}><TouchableOpacity style={[styles.tabButton, activeTab === 'inventory' && styles.activeTab]} onPress={() => setActiveTab('inventory')}><Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventory</Text></TouchableOpacity><TouchableOpacity style={[styles.tabButton, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}><Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Material Requests</Text></TouchableOpacity></View>{activeTab === 'inventory' && <TextInput style={styles.searchInput} placeholder="Search Inventory..." />}</>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList ListHeaderComponent={ListHeaderComponent} data={activeTab === 'inventory' ? inventory : materialRequests} renderItem={activeTab === 'inventory' ? renderInventoryItem : renderMaterialRequestItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.scrollContainer} />
            <RestockModal visible={isRestockModalVisible} onClose={() => setRestockModalVisible(false)} item={selectedInventoryItem} onSubmit={handleConfirmRestock} />
            <AddStockModal visible={isAddStockModalVisible} onClose={() => setAddStockModalVisible(false)} onSubmit={handleAddNewStock} />
            <IssueStockModal visible={isIssueModalVisible} onClose={() => setIssueModalVisible(false)} item={selectedInventoryItem} onSubmit={handleIssueStock} technicians={technicians} />
            <HistoryModal visible={isHistoryModalVisible} onClose={() => setHistoryModalVisible(false)} item={selectedInventoryItem} />
            <TouchableOpacity style={styles.fab} onPress={() => setAddStockModalVisible(true)}><Ionicons name="add-outline" size={30} color="#fff" /></TouchableOpacity>
            <View style={styles.bottomNav}><TouchableOpacity style={styles.navItem}><Ionicons name="grid-outline" size={24} color="#2980b9" /><Text style={[styles.navText, { color: '#2980b9' }]}>Dashboard</Text></TouchableOpacity><TouchableOpacity style={styles.navItem}><Ionicons name="chatbubbles-outline" size={24} color="#7f8c8d" /><Text style={styles.navText}>Messages</Text></TouchableOpacity><TouchableOpacity style={styles.navItem}><Ionicons name="person-outline" size={24} color="#7f8c8d" /><Text style={styles.navText}>Profile</Text></TouchableOpacity></View>
        </SafeAreaView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" }, scrollContainer: { paddingBottom: 100 },
    header: { fontSize: 28, fontWeight: "bold", color: '#172B4D', paddingHorizontal: 16, paddingTop: 16 }, subHeader: { fontSize: 16, color: "#7A869A", marginBottom: 20, paddingHorizontal: 16 },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16 }, summaryCard: { width: "48%", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#DFE1E6' },
    summaryValue: { fontSize: 28, fontWeight: "bold", marginTop: 8, color: "#172B4D" }, summaryLabel: { fontSize: 14, color: "#7A869A" },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F4F5F7', borderRadius: 10, padding: 4, marginHorizontal: 16 },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    tabText: { fontSize: 16, fontWeight: '600', color: '#7A869A' }, activeTabText: { color: '#172B4D' },
    searchInput: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DFE1E6', marginHorizontal: 16, marginVertical: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#DFE1E6', padding: 16, shadowColor: '#95a5a6', shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3},
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }, cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#172B4D', flex: 1, flexWrap: 'wrap' },
    cardSubtitle: { fontSize: 14, color: '#7A869A', marginBottom: 12 }, 
    badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginLeft: 6, alignSelf: 'flex-start' }, badgeText: { fontWeight: 'bold', fontSize: 12, },
    goodBg: { backgroundColor: 'rgba(39, 174, 96, 0.15)' }, goodText: { color: '#27ae60' },
    mediumBg: { backgroundColor: 'rgba(243, 156, 18, 0.15)' }, mediumText: { color: '#f39c12' },
    lowBg: { backgroundColor: 'rgba(192, 57, 43, 0.15)' }, lowText: { color: '#c0392b' },
    urgentBg: { backgroundColor: 'rgba(192, 57, 43, 0.15)' }, urgentText: { color: '#c0392b' },
    highBg: { backgroundColor: 'rgba(230, 126, 34, 0.15)' }, highText: { color: '#d35400' },
    pendingBg: { backgroundColor: 'rgba(41, 128, 185, 0.15)' }, pendingText: { color: '#2980b9' },
    approvedBg: { backgroundColor: 'rgba(39, 174, 96, 0.15)' }, approvedText: { color: '#27ae60' },
    rejectedBg: { backgroundColor: 'rgba(192, 57, 43, 0.15)' }, rejectedText: { color: '#c0392b' },
    issuedBg: { backgroundColor: 'rgba(127, 140, 141, 0.15)' }, issuedText: { color: '#7f8c8d' },
    stockDetailsContainer: { alignItems: 'flex-start', marginBottom: 8, }, stockValue: { fontSize: 32, fontWeight: 'bold', color: '#172B4D'}, stockUnit: { fontSize: 14, color: '#7A869A', marginTop: -4, },
    progressBarContainer: { height: 6, backgroundColor: '#F4F5F7', borderRadius: 3, overflow: 'hidden', marginBottom: 12, }, progressBar: { height: '100%', borderRadius: 3, },
    stockInfoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, }, infoBlock: { flexDirection: 'row', alignItems: 'center', }, infoIcon: { fontSize: 14, color: '#7A869A', marginRight: 5, }, infoLabel: { fontSize: 12, color: '#7A869A', },
    cardButtonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F4F5F7', paddingTop: 12, },
    textButton: {}, textButtonText: { color: '#2980b9', fontWeight: '600' }, 
    // ✨ UPDATED: Added flexDirection to actionButton
    actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }, 
    actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
    issueButton: { backgroundColor: '#d35400', marginRight: 8 }, restockButton: { backgroundColor: '#27ae60' },
    footerButtonRow: { flexDirection: 'row' },
    approveButton: { backgroundColor: '#27ae60', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, marginRight: 8 }, approveButtonText: { color: '#fff', fontWeight: 'bold' },
    rejectButton: { backgroundColor: '#c0392b', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, }, rejectButtonText: { color: '#fff', fontWeight: 'bold' },
    issuedButton: { backgroundColor: '#7f8c8d', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, }, issuedButtonText: { color: '#fff', fontWeight: 'bold' },
    bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#DFE1E6", position: "absolute", bottom: 0, width: "100%" },
    navItem: { alignItems: "center", flex: 1 }, navText: { fontSize: 12, color: "#7A869A", marginTop: 4 },
    fab: { position: "absolute", bottom: 80, right: 20, backgroundColor: "#2980b9", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    formModalContainer: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 24, },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#172B4D', marginBottom: 4, }, modalSubtitle: { fontSize: 16, color: '#7A869A', textAlign: 'center', marginBottom: 24 },
    modalInfo: { fontSize: 14, color: '#172B4D', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
    formLabel: { fontSize: 14, fontWeight: '600', color: '#7A869A', marginBottom: 8, marginTop: 10, },
    inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F5F7', borderRadius: 8, borderWidth: 1, borderColor: '#DFE1E6', marginBottom: 12, },
    inputIcon: { paddingHorizontal: 12, color: '#7A869A' }, textInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#172B4D', }, pickerWrapper: { flex: 1, },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, },
    modalCancelButton: { paddingVertical: 14, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center', backgroundColor: '#F4F5F7' },
    modalConfirmButton: { paddingVertical: 14, borderRadius: 10, flex: 1, alignItems: 'center', backgroundColor: '#2980b9', elevation: 2 },
    modalButtonText: { fontWeight: 'bold', fontSize: 16, color: '#fff' }, modalCancelButtonText: { color: '#7A869A', fontWeight: 'bold', fontSize: 16 },
    modalHeaderView: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F4F5F7' },
    historyDetails: { flex: 1, marginLeft: 16 }, historyNote: { fontSize: 16, fontWeight: '600', color: '#172B4D'},
    historyDate: { fontSize: 12, color: '#7A869A', marginTop: 2 }, historyQuantity: { fontSize: 18, fontWeight: 'bold' }
});

export default StorekeeperDashboard;