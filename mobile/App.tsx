import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const schedule = [
  { time: '09:00', patient: 'Maya Okafor', reason: 'Grounding plan review' },
  { time: '09:20', patient: 'Available', reason: 'Open appointment slot' },
  { time: '09:40', patient: 'Liam Carter', reason: 'Sleep disruption follow-up' },
  { time: '10:00', patient: 'Aisha Khan', reason: 'Care notes update' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CalmAnchor Lite</Text>
          <Text style={styles.title}>Day Schedule</Text>
          <Text style={styles.subtitle}>Dr. Eleanor Hayes · 09:00-17:00 · 20 minute slots</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>5</Text>
            <Text style={styles.summaryLabel}>Patients</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>24</Text>
            <Text style={styles.summaryLabel}>Slots</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>3</Text>
            <Text style={styles.summaryLabel}>Booked</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          {schedule.map((slot) => {
            const available = slot.patient === 'Available';

            return (
              <View key={slot.time} style={[styles.slot, available && styles.availableSlot]}>
                <Text style={styles.slotTime}>{slot.time}</Text>
                <View style={styles.slotText}>
                  <Text style={[styles.patientName, available && styles.availableText]}>{slot.patient}</Text>
                  <Text style={styles.reason}>{slot.reason}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Relationship</Text>
          <Text style={styles.body}>Doctor owns patients and appointments. Each appointment links one patient to one available 20-minute slot.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    padding: 20,
    gap: 18,
  },
  header: {
    gap: 6,
    paddingTop: 12,
  },
  eyebrow: {
    color: '#0A6C74',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#14213D',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#5C6575',
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E5EA',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  summaryValue: {
    color: '#14213D',
    fontSize: 28,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#6A7280',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#14213D',
    fontSize: 20,
    fontWeight: '800',
  },
  slot: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E1E8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  availableSlot: {
    backgroundColor: '#EFF8F6',
    borderColor: '#BFE4DE',
  },
  slotTime: {
    color: '#0A6C74',
    fontSize: 15,
    fontWeight: '800',
    width: 52,
  },
  slotText: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    color: '#1A2638',
    fontSize: 16,
    fontWeight: '800',
  },
  availableText: {
    color: '#0A6C74',
  },
  reason: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    color: '#4E5969',
    fontSize: 15,
    lineHeight: 23,
  },
});

