import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  Share,
  Platform,
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://ckltcwampaagyzneaznt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbHRjd2FtcGFhZ3l6bmVhem50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MDI2NjgsImV4cCI6MjA0ODA3ODY2OH0.pUT2kngS0nkzFBjI-P6g8azU5E3tZzGDQGL68-AUWFc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- THEME VARIABLES ---
const COLORS = {
  bg: '#0f172a',
  card: '#1e293b',
  input: '#334155',
  text: '#f8fafc',
  subText: '#94a3b8',
  primary: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  holiday: '#8b5cf6',
  border: '#334155',
  leave: '#f59e0b',
  medical: '#0ea5e9',
};

// --- HELPER FUNCTIONS ---
const formatDate = (date) => date.toISOString().split('T')[0];

const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

// Natural Sort Algorithm for classes (e.g. 1-A, 2-A, 10-A)
const naturalSortClasses = (classes) => {
  return classes.sort((a, b) => {
    // Split into parts: digits and non-digits
    const ax = [], bx = [];
    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
    
    while(ax.length && bx.length) {
      const an = ax.shift();
      const bn = bx.shift();
      const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if(nn) return nn;
    }
    return ax.length - bx.length;
  });
};

// --- COMPONENTS ---

const Header = ({ title, subtitle, rightActions }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {rightActions}
    </View>
  </View>
);

const StudentRow = ({ student, status, reason, onToggle, onEditReason, isHoliday }) => {
  const isPresent = status === 'PRESENT';
  const isAbsent = status === 'ABSENT';
  const isLeave = status === 'LEAVE';
  const isMedical = status === 'MEDICAL LEAVE';
  const isHolidayStatus = status === 'HOLIDAY';

  // Base style
  let rowStyle = [styles.studentRow]; // Start as an array with base style
  let badgeStyle = styles.badgeSuccess; // Default Present
  let statusLabel = 'P';

  if (isAbsent) {
    // We push the absent style modification to the array
    rowStyle.push(styles.studentRowAbsent); 
    badgeStyle = styles.badgeDanger;
    statusLabel = 'A';
  } else if (isLeave) {
    // For dynamic colors, we push a new object
    rowStyle.push({ borderColor: COLORS.leave, backgroundColor: 'rgba(245, 158, 11, 0.1)' });
    badgeStyle = { backgroundColor: COLORS.leave };
    statusLabel = 'L';
  } else if (isMedical) {
    rowStyle.push({ borderColor: COLORS.medical, backgroundColor: 'rgba(14, 165, 233, 0.1)' });
    badgeStyle = { backgroundColor: COLORS.medical };
    statusLabel = 'ML';
  } else if (isHolidayStatus) {
    rowStyle.push(styles.studentRowHoliday);
    badgeStyle = styles.badgeHoliday;
  }

  return (
    <TouchableOpacity 
      style={rowStyle} // Pass the array here
      onPress={() => !isHoliday && onToggle(student.id)}
      activeOpacity={isHoliday ? 1 : 0.7}
    >
      <View style={styles.studentInfo}>
        <View style={styles.rollBadge}>
          <Text style={styles.rollText}>{student.roll_number}</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.studentName}>{student.name}</Text>
          {/* Show Reason if exists */}
          {(reason && !isPresent && !isHolidayStatus) && (
            <Text style={{color: COLORS.subText, fontSize: 12, marginTop: 2}}>Note: {reason}</Text>
          )}
        </View>
      </View>
      
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
        {/* Edit Reason Button (Only for L/ML/A) */}
        {(!isPresent && !isHolidayStatus) && (
          <TouchableOpacity onPress={() => onEditReason(student)} style={{padding: 5}}>
            <Ionicons name="create-outline" size={20} color={COLORS.subText} />
          </TouchableOpacity>
        )}

        <View style={[styles.statusBadge, badgeStyle]}>
          {isHolidayStatus ? (
            <Ionicons name="airplane" size={16} color="#fff" />
          ) : (
            <Text style={styles.statusText}>{statusLabel}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Class Selection Component for Admins
const ClassSelector = ({ classes, onSelectClass, onLogout }) => (
  <SafeAreaView style={styles.safeAreaContainer}>
     <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
     <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Select Class</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutTextBtn}>
           <Text style={{color: COLORS.danger, fontWeight: '600'}}>Logout</Text>
        </TouchableOpacity>
     </View>
     <FlatList 
        data={classes}
        keyExtractor={(item) => item}
        contentContainerStyle={{padding: 20}}
        renderItem={({item}) => (
           <TouchableOpacity style={styles.classCard} onPress={() => onSelectClass(item)}>
              <View style={styles.classIconBg}>
                <Ionicons name="people" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.classCardText}>{item}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.subText} />
           </TouchableOpacity>
        )}
     />
  </SafeAreaView>
);

// Dashboard Modal Component
const DashboardModal = ({ visible, onClose, assignedClass, students }) => {
  const [loading, setLoading] = useState(false);
  // Updated state to include Total Leave (tL) and Total Medical (tML)
  const [stats, setStats] = useState({ studentStats: [], totalP: 0, totalA: 0, totalH: 0, totalL: 0, totalML: 0 });
  const [monthOffset, setMonthOffset] = useState(0);

  const currentViewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  useEffect(() => {
    if (visible) fetchMonthStats();
  }, [visible, monthOffset]);

  const fetchMonthStats = async () => {
    setLoading(true);
    try {
      const year = currentViewDate.getFullYear();
      const month = currentViewDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class', assignedClass)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (error) throw error;

      const sMap = {};
      let tP = 0, tA = 0, tH = 0, tL = 0, tML = 0;

      // Initialize counters for all students
      students.forEach(s => {
        sMap[s.id] = { P: 0, A: 0, H: 0, L: 0, ML: 0, name: s.name, roll: s.roll_number };
      });

      data.forEach(record => {
        if (sMap[record.student_id]) {
          switch (record.status) {
            case 'PRESENT':
              sMap[record.student_id].P++;
              tP++;
              break;
            case 'ABSENT':
              sMap[record.student_id].A++;
              tA++;
              break;
            case 'HOLIDAY':
              sMap[record.student_id].H++;
              tH++;
              break;
            case 'LEAVE':
              sMap[record.student_id].L++;
              tL++;
              break;
            case 'MEDICAL LEAVE':
              sMap[record.student_id].ML++;
              tML++;
              break;
          }
        }
      });

      const sortedStats = Object.values(sMap).sort((a, b) => a.roll - b.roll);
      setStats({ studentStats: sortedStats, totalP: tP, totalA: tA, totalH: tH, totalL: tL, totalML: tML });

    } catch (err) {
      Alert.alert('Error', 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const monthLabel = currentViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Attendance Dashboard</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => setMonthOffset(p => p - 1)}>
             <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setMonthOffset(p => p + 1)}>
             <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            
            {/* Top Stats Grid - 2x2 Layout */}
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20}}>
              {/* Present */}
              <View style={[styles.statCard, { backgroundColor: 'rgba(16, 185, 129, 0.15)', width: '48%' }]}>
                <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.totalP}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              {/* Absent */}
              <View style={[styles.statCard, { backgroundColor: 'rgba(239, 68, 68, 0.15)', width: '48%' }]}>
                <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.totalA}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              {/* Leave */}
              <View style={[styles.statCard, { backgroundColor: 'rgba(245, 158, 11, 0.15)', width: '48%' }]}>
                <Text style={[styles.statValue, { color: COLORS.leave }]}>{stats.totalL}</Text>
                <Text style={styles.statLabel}>Leave (L)</Text>
              </View>
              {/* Medical */}
              <View style={[styles.statCard, { backgroundColor: 'rgba(14, 165, 233, 0.15)', width: '48%' }]}>
                <Text style={[styles.statValue, { color: COLORS.medical }]}>{stats.totalML}</Text>
                <Text style={styles.statLabel}>Medical (ML)</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Student Breakdown</Text>
            
            {stats.studentStats.map((item, idx) => (
              <View key={idx} style={styles.statRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.statRowName}>{item.roll}. {item.name}</Text>
                  {/* Progress Bar (Percentage of presence relative to total class days minus holidays) */}
                  <View style={styles.progressBarBg}>
                    <View style={{
                      width: `${(item.P / (item.P + item.A + item.L + item.ML + 0.001)) * 100}%`, 
                      height: '100%', 
                      backgroundColor: COLORS.success, 
                      borderRadius: 2
                    }} />
                  </View>
                </View>
                
                {/* Individual Breakdown */}
                <View style={styles.statRowNumbers}>
                  <Text style={{color: COLORS.success, fontWeight: 'bold'}}>{item.P}</Text>
                  <Text style={{color: COLORS.subText, fontSize: 10}}> P | </Text>
                  
                  <Text style={{color: COLORS.danger, fontWeight: 'bold'}}>{item.A}</Text>
                  <Text style={{color: COLORS.subText, fontSize: 10}}> A </Text>

                  {/* Only show L or ML if > 0 to keep UI clean */}
                  {item.L > 0 && (
                    <>
                      <Text style={{color: COLORS.subText, fontSize: 10}}>| </Text>
                      <Text style={{color: COLORS.leave, fontWeight: 'bold'}}>{item.L}</Text>
                      <Text style={{color: COLORS.subText, fontSize: 10}}> L</Text>
                    </>
                  )}
                  {item.ML > 0 && (
                    <>
                      <Text style={{color: COLORS.subText, fontSize: 10}}>| </Text>
                      <Text style={{color: COLORS.medical, fontWeight: 'bold'}}>{item.ML}</Text>
                      <Text style={{color: COLORS.subText, fontSize: 10}}> M</Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const ReasonModal = ({ visible, initialValue, onSave, onClose, title }) => {
  const [text, setText] = useState(initialValue);

  // Update internal text when initialValue changes (modal opens)
  useEffect(() => { setText(initialValue || ''); }, [initialValue, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20}}>
        <View style={{backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border}}>
          <Text style={{color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>{title}</Text>
          <TextInput
            style={[styles.input, {marginBottom: 20}]}
            placeholder="Enter reason (e.g. Fever, Wedding)"
            placeholderTextColor={COLORS.subText}
            value={text}
            onChangeText={setText}
            autoFocus
          />
          <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
            <TouchableOpacity onPress={onClose} style={{padding: 10}}>
              <Text style={{color: COLORS.subText}}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onSave(text)} 
              style={{backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8}}
            >
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function App() {
  // Auth State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  
  // New State: To handle teachers with multiple classes
  const [isMultiClassTeacher, setIsMultiClassTeacher] = useState(false);
  
  const [classList, setClassList] = useState([]);

  // App Data State
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [reasons, setReasons] = useState({}); // Stores student specific reasons
  const [holidayReason, setHolidayReason] = useState(''); // Stores holiday reason
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Login Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- EFFECT: Check Session on Mount ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkUserRole(session.user.id);
      else setAuthChecking(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setAssignedClass(null);
        setStudents([]);
        setIsAdmin(false);
        setIsMultiClassTeacher(false); // Reset multi class flag
        setClassList([]);
      }
    });
  }, []);

  // --- EFFECT: Fetch Data when Class or Date changes ---
  useEffect(() => {
    if (assignedClass && session) {
      fetchClassData();
    }
  }, [assignedClass, selectedDate]);

  // --- LOGIC: Auth & Role Check ---
  const handleLogin = async () => {
    let loginEmail = email.trim();
    if (loginEmail && !loginEmail.includes('@')) {
      loginEmail += '@jvp.com';
    }

    if (!loginEmail || !password) {
      Alert.alert('Missing fields', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      Alert.alert('Login failed', error.message);
      setLoading(false);
    } else {
      checkUserRole(data.user.id);
    }
  };

  const checkUserRole = async (userId) => {
    try {
      // 1. Check if Admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (adminData) {
        setIsAdmin(true);
        // Fetch all distinct classes
        const { data: classesData, error: classError } = await supabase
          .from('class_teachers')
          .select('class');
        
        if (classError) throw classError;

        // Extract distinct classes and sort
        const distinctClasses = [...new Set(classesData.map(c => c.class))];
        setClassList(naturalSortClasses(distinctClasses));
        
        setLoading(false);
        setAuthChecking(false);
        return;
      }

      // 2. Not Admin, Check Class Teacher (now handling multiple records)
      const { data: teacherData, error: teacherError } = await supabase
        .from('class_teachers')
        .select('class')
        .eq('teacher_id', userId);

      if (teacherError || !teacherData || teacherData.length === 0) {
        Alert.alert('Access Denied', 'You are not assigned as a Class Teacher or Admin.');
        await supabase.auth.signOut();
      } else if (teacherData.length === 1) {
        // Single class assigned
        setAssignedClass(teacherData[0].class);
      } else {
        // Multiple classes assigned
        setIsMultiClassTeacher(true);
        const myClasses = teacherData.map(c => c.class);
        setClassList(naturalSortClasses(myClasses));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify user role.');
      console.error(err);
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    setAssignedClass(null);
    setStudents([]);
    setIsAdmin(false);
    setIsMultiClassTeacher(false);
    setClassList([]);
    await supabase.auth.signOut();
  };

  // --- LOGIC: Data Fetching ---
  const fetchClassData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: studentsData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('class', assignedClass)
        .order('roll_number', { ascending: true });

      if (sError) throw sError;
      setStudents(studentsData);

      // 2. Fetch Existing Attendance
      const dateStr = formatDate(selectedDate);
      const { data: attData, error: aError } = await supabase
        .from('attendance')
        // UPDATED: Select 'extra' column
        .select('student_id, status, extra') 
        .eq('class', assignedClass)
        .eq('date', dateStr);

      if (aError) throw aError;

      const attMap = {};
      const reasonMap = {}; // Temp map for reasons
      let holidayFlag = false;
      let fetchedHolidayReason = '';

      const isRecordHoliday = attData.some(r => r.status === 'HOLIDAY');
      
      if (isRecordHoliday) {
        holidayFlag = true;
        // Try to find a holiday reason from the first record that has one
        const recWithReason = attData.find(r => r.extra && r.extra.reason);
        if (recWithReason) fetchedHolidayReason = recWithReason.extra.reason;
        
        studentsData.forEach(s => attMap[s.id] = 'HOLIDAY');
      } else {
        studentsData.forEach(s => attMap[s.id] = 'PRESENT');
        attData.forEach(r => {
          attMap[r.student_id] = r.status;
          // Extract reason if exists
          if (r.extra && r.extra.reason) {
            reasonMap[r.student_id] = r.extra.reason;
          }
        });
      }

      setAttendance(attMap);
      setReasons(reasonMap); // Set reasons state
      setIsHoliday(holidayFlag);
      
      // If it's a Sunday and no reason saved, default to "Sunday"
      if (selectedDate.getDay() === 0 && !fetchedHolidayReason) {
         setHolidayReason('Sunday');
      } else {
         setHolidayReason(fetchedHolidayReason);
      }

    } catch (err) {
      Alert.alert('Error', 'Failed to fetch class data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: Attendance Operations ---
  const toggleAttendance = (studentId) => {
    if (isHoliday) return;
    
    const STATUS_CYCLE = ['PRESENT', 'ABSENT', 'LEAVE', 'MEDICAL LEAVE'];
    
    setAttendance(prev => {
      const currentStatus = prev[studentId] || 'PRESENT';
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
      return { ...prev, [studentId]: STATUS_CYCLE[nextIndex] };
    });
  };

  const toggleHolidayMode = (value) => {
    setIsHoliday(value);
    setAttendance(prev => {
      const newAtt = { ...prev };
      Object.keys(newAtt).forEach(key => {
        newAtt[key] = value ? 'HOLIDAY' : 'PRESENT';
      });
      return newAtt;
    });
  };

  const handleEditReason = (student) => {
    setEditingStudent(student);
    setModalVisible(true);
  };

  const saveReason = (text) => {
    if (editingStudent) {
      setReasons(prev => ({ ...prev, [editingStudent.id]: text }));
    }
    setModalVisible(false);
    setEditingStudent(null);
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    try {
      const dateStr = formatDate(selectedDate);
      
      const updates = students.map(student => {
        const status = isHoliday ? 'HOLIDAY' : (attendance[student.id] || 'PRESENT');
        
        // Prepare Extra Data
        let extraData = null;
        if (isHoliday && holidayReason) {
            extraData = { reason: holidayReason };
        } else if (!isHoliday && (status === 'LEAVE' || status === 'MEDICAL LEAVE' || status === 'ABSENT')) {
            // We save reason for Absent too if they typed one, though mostly for L/ML
            if (reasons[student.id]) extraData = { reason: reasons[student.id] };
        }

        return {
          student_id: student.id,
          class: assignedClass,
          date: dateStr,
          status: status,
          extra: extraData, // New Column
          updated_at: new Date()
        };
      });

      const { error } = await supabase
        .from('attendance')
        .upsert(updates, { onConflict: 'student_id, date' });

      if (error) throw error;

      Alert.alert('Success', `Data for ${dateStr} saved successfully.`);
    } catch (err) {
      Alert.alert('Submission Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const shareAbsentees = async () => {
    if (isHoliday) {
      Alert.alert('Info', 'It is a holiday!');
      return;
    }

    // Filter for Absent, Leave, or Medical Leave
    const nonPresentStudents = students.filter(s => {
      const status = attendance[s.id];
      return status === 'ABSENT' || status === 'LEAVE' || status === 'MEDICAL LEAVE';
    });
    
    const dateStr = getDayName(selectedDate);
    
    if (nonPresentStudents.length === 0) {
      Alert.alert('Good News', 'Everyone is present!');
      return;
    }

    let message = `*Attendance Report - Class ${assignedClass}*\n📅 ${dateStr}\n\n`;
    
    nonPresentStudents.forEach((s, index) => {
      const status = attendance[s.id];
      let suffix = ''; // Default for ABSENT
      
      if (status === 'LEAVE') suffix = ' (L)';
      else if (status === 'MEDICAL LEAVE') suffix = ' (ML)';
      
      // Check if there is a reason note (optional, but helpful)
      const reasonNote = reasons[s.id] ? ` - ${reasons[s.id]}` : '';

      message += `${index + 1}. ${s.name} (${s.roll_number})${suffix}${reasonNote}\n`;
    });

    const totalA = nonPresentStudents.filter(s => attendance[s.id] === 'ABSENT').length;
    const totalL = nonPresentStudents.filter(s => attendance[s.id] === 'LEAVE').length;
    const totalML = nonPresentStudents.filter(s => attendance[s.id] === 'MEDICAL LEAVE').length;

    message += `\nSummary:`;
    if(totalA > 0) message += `\nAbsent: ${totalA}`;
    if(totalL > 0) message += `\nLeave: ${totalL}`;
    if(totalML > 0) message += `\nMedical: ${totalML}`;

    try {
      await Share.share({ message });
    } catch (error) {
      await Clipboard.setStringAsync(message);
      Alert.alert('Copied', 'List copied to clipboard.');
    }
  };

  // --- RENDER ---
  
  if (authChecking) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCard}>
          <Text style={styles.title}>JVP Attendance Tracker</Text>
          <Text style={styles.subtitle}>Sign in with your My JVP Credentials</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.subText}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.subText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // CLASS SELECTOR: Shown for Admins OR Teachers with multiple classes
  if ((isAdmin || isMultiClassTeacher) && !assignedClass) {
    return (
      <ClassSelector 
        classes={classList} 
        onSelectClass={setAssignedClass} 
        onLogout={handleLogout}
      />
    );
  }

  // MAIN DASHBOARD (Teacher or Admin with selected Class)
  const absenteesCount = Object.values(attendance).filter(s => s === 'ABSENT').length;

  return (
    // [FIX] Replaced outer View with SafeAreaView and corrected styles
    <SafeAreaView style={styles.screenWrapper}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent={true} />
      <View style={{flex: 1}}> 
        {/* Header Area */}
        <View style={styles.safeAreaTop}>
          <Header 
            title={`Class ${assignedClass}`} 
            subtitle={isAdmin ? "Admin View" : "Attendance Manager"}
            rightActions={
              <>
                 {/* Feature: Swap Class (Admin OR Multi-Class Teacher) */}
                 {(isAdmin || isMultiClassTeacher) && (
                    <TouchableOpacity style={styles.iconButton} onPress={() => setAssignedClass(null)}>
                      <Ionicons name="swap-horizontal" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                 )}
                 <TouchableOpacity style={styles.iconButton} onPress={() => setShowDashboard(true)}>
                  <Ionicons name="bar-chart-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </>
            }
          />

          {/* Date Controls */}
          <View style={styles.dateControl}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>{getDayName(selectedDate)}</Text>
              <Text style={styles.subDateText}>{formatDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateBtn}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Stats & Holiday Toggle */}
          <View style={styles.statsBar}>
            {isHoliday ? (
               <View style={styles.holidayBanner}>
                 <Ionicons name="cafe" size={18} color={COLORS.text} style={{marginRight:8}} />
                 <Text style={styles.holidayText}>Holiday Mode Active</Text>
               </View>
            ) : (
              <>
                <Text style={styles.statText}>
                  Total: <Text style={{fontWeight: 'bold'}}>{students.length}</Text>
                </Text>
                <Text style={styles.statText}>
                  Present: <Text style={{color: COLORS.success, fontWeight: 'bold'}}>{students.length - absenteesCount}</Text>
                </Text>
                <Text style={styles.statText}>
                  Absent: <Text style={{color: COLORS.danger, fontWeight: 'bold'}}>{absenteesCount}</Text>
                </Text>
              </>
            )}
            
            <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 10}}>
              <Text style={[styles.subDateText, {marginRight: 6}]}>Holiday?</Text>
              <Switch 
                value={isHoliday}
                onValueChange={toggleHolidayMode}
                trackColor={{ false: COLORS.input, true: COLORS.holiday }}
                thumbColor="#fff"
              />
            </View>
          </View>
          {/* Holiday Reason Input (Only visible if Holiday is true) */}
          {isHoliday && (
             <View style={{backgroundColor: COLORS.card, paddingHorizontal: 20, paddingBottom: 10}}>
                <TextInput 
                  style={[styles.input, {height: 40, marginBottom: 0}]}
                  placeholder="Reason for Holiday (e.g. Sunday, Festival)"
                  placeholderTextColor={COLORS.subText}
                  value={holidayReason}
                  onChangeText={setHolidayReason}
                />
             </View>
          )}
        </View>

        {/* Main List */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.listLoader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <StudentRow 
                  student={item} 
                  status={attendance[item.id]} 
                  reason={reasons[item.id]} // Pass reason
                  onToggle={toggleAttendance}
                  onEditReason={handleEditReason} // Pass handler
                  isHoliday={isHoliday}
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Footer Actions - [FIX] Improved padding for device bottom nav */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={shareAbsentees}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButtonPrimary, isHoliday && {backgroundColor: COLORS.holiday}]} 
            onPress={submitAttendance}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={isHoliday ? "calendar" : "cloud-upload-outline"} size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.actionBtnText}>{isHoliday ? "Mark Holiday" : "Save Attendance"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Dashboard Modal */}
        <DashboardModal 
          visible={showDashboard} 
          onClose={() => setShowDashboard(false)} 
          assignedClass={assignedClass}
          students={students}
        />

        {/* Reason Entry Modal */}
        <ReasonModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={saveReason}
          initialValue={editingStudent ? reasons[editingStudent.id] : ''}
          title={editingStudent ? `Note for ${editingStudent.name}` : 'Reason'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Safe Area Fixes
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bg,
    // [FIX] Padding for top status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  safeAreaTop: {
    backgroundColor: COLORS.card,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
  },
  
  // Login Styles
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subText,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.input,
    paddingHorizontal: 16,
    color: COLORS.text,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    backgroundColor: COLORS.input,
    borderRadius: 8,
  },

  // Date Controls
  dateControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: COLORS.bg,
  },
  dateBtn: {
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subDateText: {
    color: COLORS.subText,
    fontSize: 12,
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statText: {
    color: COLORS.subText,
    fontSize: 14
  },
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  holidayText: {
    color: COLORS.text,
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 15,
    paddingBottom: 20, // Extra padding inside list
  },
  listLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Student Row
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentRowAbsent: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  studentRowHoliday: {
    borderColor: COLORS.holiday,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    opacity: 0.8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rollBadge: {
    backgroundColor: COLORS.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    width: 40,
    alignItems: 'center',
  },
  rollText: {
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '700',
  },
  studentName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    maxWidth: '70%'
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeDanger: {
    backgroundColor: COLORS.danger,
  },
  badgeHoliday: {
    backgroundColor: COLORS.holiday,
  },
  statusText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },

  // Footer [FIXED PADDING]
  footer: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
    // [FIX] Increased bottom padding significantly for Android Nav bars / iOS Home Indicator
    paddingBottom: Platform.OS === 'ios' ? 20 : 40, 
  },
  actionButtonSecondary: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.card,
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: COLORS.text,
    fontSize: 12,
    opacity: 0.8,
  },
  sectionHeader: {
    color: COLORS.subText,
    fontSize: 14,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statRowName: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.input,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statRowNumbers: {
    flexDirection: 'row',
    marginLeft: 15,
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  
  // Class Selector Styles
  selectorHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutTextBtn: {
     padding: 8,
  },
  classCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: COLORS.card,
     padding: 16,
     borderRadius: 12,
     marginBottom: 12,
     borderWidth: 1,
     borderColor: COLORS.border,
  },
  classIconBg: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(99, 102, 241, 0.1)',
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 15,
  },
  classCardText: {
     flex: 1,
     fontSize: 18,
     fontWeight: '600',
     color: COLORS.text,
  },
});
