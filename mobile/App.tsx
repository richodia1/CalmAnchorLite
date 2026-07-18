import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  APPOINTMENT_DATE,
  API_BASE_URL,
  getHealth,
  getPatients,
  getSchedule,
  moveAppointmentSlot,
  seedBaselineData,
} from './src/api';
import type {
  Appointment,
  ApiHealthResponse,
  DayScheduleResponse,
  Patient,
  ScheduleSlot,
} from './src/api';

export default function App() {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedule, setSchedule] = useState<DayScheduleResponse | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bookedAppointmentSlots = useMemo(
    () => schedule?.slots.filter((slot) => !slot.available && slot.appointment) ?? [],
    [schedule],
  );

  const bookedSlots = useMemo(
    () => bookedAppointmentSlots.length,
    [bookedAppointmentSlots],
  );

  const availableSlots = useMemo(
    () =>
      schedule?.slots.filter(
        (slot) => slot.available || slot.appointment?.id === selectedAppointment?.id,
      ) ?? [],
    [schedule, selectedAppointment],
  );

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedAppointment?.patientId) ?? null,
    [patients, selectedAppointment],
  );

  const selectedCurrentSlot = useMemo(
    () => schedule?.slots.find((slot) => slot.appointment?.id === selectedAppointment?.id) ?? null,
    [schedule, selectedAppointment],
  );

  const loadClinicData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    try {
      const [nextHealth, nextPatients, nextSchedule] = await Promise.all([
        getHealth(),
        getPatients(),
        getSchedule(APPOINTMENT_DATE),
      ]);

      setHealth(nextHealth);
      setPatients(nextPatients);
      setSchedule(nextSchedule);
      setSelectedAppointment((currentAppointment) => {
        const firstBookedAppointment =
          nextSchedule.slots.find((slot) => slot.appointment)?.appointment ?? null;

        if (!currentAppointment) {
          return firstBookedAppointment;
        }

        return (
          nextSchedule.slots.find((slot) => slot.appointment?.id === currentAppointment.id)
            ?.appointment ?? firstBookedAppointment
        );
      });
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadClinicData();
  }, [loadClinicData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setNotice(null);
    void loadClinicData(false);
  }, [loadClinicData]);

  const handleSeedReset = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      await seedBaselineData();
      setSelectedAppointment(null);
      setNotice('Baseline data restored');
      await loadClinicData(false);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [loadClinicData]);

  const handleMoveAppointment = useCallback(
    async (slot: ScheduleSlot) => {
      if (!selectedAppointment || slot.appointment?.id === selectedAppointment.id) {
        return;
      }

      setSaving(true);
      setNotice(null);
      setError(null);

      try {
        const movedAppointment = await moveAppointmentSlot(selectedAppointment.id, {
          appointmentDate: APPOINTMENT_DATE,
          slotStart: slot.start,
          slotEnd: slot.end,
        });

        setSelectedAppointment(movedAppointment);
        setNotice(`Moved ${selectedPatient?.fullName ?? 'appointment'} to ${slot.start}`);
        await loadClinicData(false);
      } catch (requestError) {
        setError(toErrorMessage(requestError));
      } finally {
        setSaving(false);
      }
    },
    [loadClinicData, selectedAppointment, selectedPatient],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.clinicHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>CA</Text>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.eyebrow}>CalmAnchor Lite</Text>
              <Text style={styles.clinicName}>
                {schedule?.doctor.clinicName ?? 'CalmAnchor Clinic'}
              </Text>
            </View>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{health?.dataMode ?? 'seed'}</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Doctor Appointments</Text>
            <Text style={styles.subtitle}>
              {schedule?.doctor.fullName ?? 'Doctor'} / {schedule?.doctor.workingDayStart ?? '09:00'}-
              {schedule?.doctor.workingDayEnd ?? '17:00'} /{' '}
              {schedule?.doctor.slotLengthMinutes ?? 20} minute slots
            </Text>
            <Text style={styles.apiLabel}>{API_BASE_URL}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{health?.patientCount ?? patients.length}</Text>
            <Text style={styles.summaryLabel}>Patients</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {health?.scheduleSlotCount ?? schedule?.slots.length ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>Slots</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{health?.appointmentCount ?? bookedSlots}</Text>
            <Text style={styles.summaryLabel}>Booked</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{health?.status ?? '--'}</Text>
            <Text style={styles.summaryLabel}>API</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton label="Refresh" onPress={handleRefresh} disabled={loading || saving} />
          <ActionButton
            label="Reset Seed"
            onPress={handleSeedReset}
            disabled={loading || saving}
            tone="secondary"
          />
        </View>

        {loading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color="#0A6C74" />
            <Text style={styles.stateText}>Loading clinic data</Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.feedbackPanel, styles.errorPanel]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {notice ? (
          <View style={[styles.feedbackPanel, styles.noticePanel]}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {selectedAppointment ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Change Appointment</Text>
              <Text style={styles.sectionMeta}>{selectedCurrentSlot?.start ?? selectedAppointment.slotStart}</Text>
            </View>

            <View style={styles.selectedAppointmentPanel}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(selectedPatient?.fullName ?? selectedAppointment.patientId)}
                </Text>
              </View>
              <View style={styles.selectedAppointmentText}>
                <Text style={styles.patientName}>
                  {selectedPatient?.fullName ?? selectedAppointment.patientId}
                </Text>
                <Text style={styles.reason}>{selectedAppointment.reason ?? 'Appointment'}</Text>
                <Text style={styles.selectedSlotText}>
                  {selectedAppointment.slotStart}-{selectedAppointment.slotEnd}
                </Text>
              </View>
              {saving ? <ActivityIndicator color="#0A6C74" /> : null}
            </View>

            <View style={styles.movePanel}>
              {availableSlots.map((slot) => {
                const currentSlot = slot.appointment?.id === selectedAppointment.id;

                return (
                  <Pressable
                    key={slot.start}
                    onPress={() => handleMoveAppointment(slot)}
                    disabled={saving || currentSlot}
                    style={({ pressed }) => [
                      styles.moveSlot,
                      currentSlot && styles.currentMoveSlot,
                      pressed && !currentSlot && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.moveSlotTime, currentSlot && styles.currentMoveSlotText]}>
                      {slot.start}
                    </Text>
                    <Text style={[styles.moveSlotLabel, currentSlot && styles.currentMoveSlotText]}>
                      {currentSlot ? 'Current' : 'Move'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appointments</Text>
            <Text style={styles.sectionMeta}>{formatDate(schedule?.appointmentDate ?? APPOINTMENT_DATE)}</Text>
          </View>

          {bookedAppointmentSlots.map((slot) => (
            <AppointmentRow
              key={slot.start}
              slot={slot}
              selected={slot.appointment?.id === selectedAppointment?.id}
              onSelect={() => setSelectedAppointment(slot.appointment)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Patients</Text>
            <Text style={styles.sectionMeta}>{patients.length} total</Text>
          </View>

          {patients.map((patient) => (
            <View key={patient.id} style={styles.patientRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(patient.fullName)}</Text>
              </View>
              <View style={styles.patientText}>
                <Text style={styles.patientName}>{patient.fullName}</Text>
                <Text style={styles.reason}>{patient.historyNotes}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary';
};

function ActionButton({ label, onPress, disabled = false, tone = 'primary' }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        tone === 'secondary' && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.actionButtonText, tone === 'secondary' && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ScheduleSlotRowProps = {
  slot: ScheduleSlot;
  selected: boolean;
  onSelect: () => void;
};

function AppointmentRow({ slot, selected, onSelect }: ScheduleSlotRowProps) {
  if (!slot.appointment) {
    return null;
  }

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.slot,
        selected && styles.selectedSlot,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.slotTime}>{slot.start}</Text>
      <View style={styles.slotText}>
        <Text style={styles.patientName}>{slot.patient?.fullName ?? slot.appointment.patientId}</Text>
        <Text style={styles.reason}>{slot.appointment.reason ?? 'Appointment'}</Text>
      </View>
      <View style={[styles.changePill, selected && styles.selectedChangePill]}>
        <Text style={[styles.changeText, selected && styles.selectedChangeText]}>
          {selected ? 'Selected' : 'Change'}
        </Text>
      </View>
    </Pressable>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to reach the API';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7FA',
  },
  container: {
    gap: 16,
    padding: 18,
    paddingBottom: 36,
  },
  clinicHeader: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE7EF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 16,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#0A6C74',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  brandText: {
    flex: 1,
  },
  clinicName: {
    color: '#14213D',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  modeBadge: {
    backgroundColor: '#E8F4F2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBadgeText: {
    color: '#0A6C74',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: '#0A6C74',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#14213D',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: '#5C6575',
    fontSize: 15,
    lineHeight: 22,
  },
  apiLabel: {
    color: '#7B8492',
    fontSize: 12,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryItem: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E5EA',
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 78,
    minWidth: 132,
    padding: 12,
  },
  summaryValue: {
    color: '#14213D',
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#6A7280',
    fontSize: 13,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#0A6C74',
    borderRadius: 8,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D5DEE8',
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.56,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#14213D',
  },
  pressed: {
    opacity: 0.72,
  },
  statePanel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E5EA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    padding: 14,
  },
  stateText: {
    color: '#4E5969',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackPanel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  errorPanel: {
    backgroundColor: '#FFF4F2',
    borderColor: '#F1B8AD',
  },
  noticePanel: {
    backgroundColor: '#F0F8F4',
    borderColor: '#A8D9BF',
  },
  errorText: {
    color: '#9B2C1F',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  noticeText: {
    color: '#1F6B3A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#14213D',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionMeta: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
  },
  slot: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E1E8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 74,
    padding: 14,
  },
  availableSlot: {
    backgroundColor: '#F1F8F6',
    borderColor: '#BFE4DE',
  },
  selectedSlot: {
    backgroundColor: '#F7FBFC',
    borderColor: '#0A6C74',
    borderWidth: 2,
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
  statusPill: {
    alignItems: 'center',
    borderRadius: 999,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  openPill: {
    backgroundColor: '#DFF3ED',
  },
  bookedPill: {
    backgroundColor: '#F7E8E1',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  openText: {
    color: '#0A6C74',
  },
  bookedText: {
    color: '#9B4B2F',
  },
  selectedAppointmentPanel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D5E6EA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    padding: 14,
  },
  selectedAppointmentText: {
    flex: 1,
    gap: 2,
  },
  selectedSlotText: {
    color: '#0A6C74',
    fontSize: 13,
    fontWeight: '800',
  },
  movePanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moveSlot: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D5DEE8',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 54,
    minWidth: 72,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  currentMoveSlot: {
    backgroundColor: '#16213A',
    borderColor: '#16213A',
  },
  moveSlotTime: {
    color: '#14213D',
    fontSize: 15,
    fontWeight: '800',
  },
  moveSlotLabel: {
    color: '#6A7280',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  currentMoveSlotText: {
    color: '#FFFFFF',
  },
  changePill: {
    alignItems: 'center',
    backgroundColor: '#0A6C74',
    borderRadius: 8,
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedChangePill: {
    backgroundColor: '#DFF3ED',
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  selectedChangeText: {
    color: '#0A6C74',
  },
  patientRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E5EA',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 68,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#E9EEF7',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: '#14213D',
    fontSize: 14,
    fontWeight: '800',
  },
  patientText: {
    flex: 1,
    gap: 2,
  },
});
