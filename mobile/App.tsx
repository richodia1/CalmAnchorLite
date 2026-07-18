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
  TextInput,
  View,
} from 'react-native';
import {
  APPOINTMENT_DATE,
  API_BASE_URL,
  deleteAppointment,
  deletePatient,
  getAppointments,
  getHealth,
  getPatients,
  getSchedule,
  moveAppointmentSlot,
  saveAppointment,
  saveDoctor,
  savePatient,
  seedBaselineData,
} from './src/api';
import type {
  Appointment,
  ApiHealthResponse,
  DayScheduleResponse,
  Doctor,
  Patient,
  ScheduleSlot,
} from './src/api';

const PAGE_SIZE = 4;
const FALLBACK_DOCTOR_ID = 'doctor-001';

type ModuleKey = 'dashboard' | 'patients' | 'appointments' | 'doctor';

type PatientForm = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  historyNotes: string;
  careNotes: string;
};

type AppointmentCreateForm = {
  patientId: string;
  slotStart: string;
  reason: string;
  notes: string;
};

type AppointmentEditForm = {
  reason: string;
  notes: string;
};

type DoctorForm = {
  fullName: string;
  specialty: string;
  clinicName: string;
  workingDayStart: string;
  workingDayEnd: string;
  slotLengthMinutes: string;
};

const moduleTabs: { key: ModuleKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'doctor', label: 'Doctor' },
];

const emptyPatientForm: PatientForm = {
  fullName: '',
  dateOfBirth: '',
  phoneNumber: '',
  historyNotes: '',
  careNotes: '',
};

const defaultAppointmentForm: AppointmentCreateForm = {
  patientId: '',
  slotStart: '',
  reason: 'Consultation',
  notes: '',
};

const emptyAppointmentEditForm: AppointmentEditForm = {
  reason: '',
  notes: '',
};

const emptyDoctorForm: DoctorForm = {
  fullName: '',
  specialty: '',
  clinicName: '',
  workingDayStart: '09:00',
  workingDayEnd: '17:00',
  slotLengthMinutes: '20',
};

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard');
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedule, setSchedule] = useState<DayScheduleResponse | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<PatientForm>(emptyPatientForm);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPage, setPatientPage] = useState(0);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentPage, setAppointmentPage] = useState(0);
  const [appointmentForm, setAppointmentForm] =
    useState<AppointmentCreateForm>(defaultAppointmentForm);
  const [appointmentEditForm, setAppointmentEditForm] =
    useState<AppointmentEditForm>(emptyAppointmentEditForm);
  const [doctorForm, setDoctorForm] = useState<DoctorForm>(emptyDoctorForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const doctor = schedule?.doctor ?? null;
  const doctorId = doctor?.id ?? FALLBACK_DOCTOR_ID;

  const bookedAppointmentSlots = useMemo(
    () => schedule?.slots.filter((slot) => !slot.available && slot.appointment) ?? [],
    [schedule],
  );

  const bookedSlots = bookedAppointmentSlots.length;

  const availableSlots = useMemo(
    () =>
      schedule?.slots.filter(
        (slot) => slot.available || slot.appointment?.id === selectedAppointment?.id,
      ) ?? [],
    [schedule, selectedAppointment],
  );

  const openSlots = useMemo(() => schedule?.slots.filter((slot) => slot.available) ?? [], [schedule]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedAppointment?.patientId) ?? null,
    [patients, selectedAppointment],
  );

  const selectedCurrentSlot = useMemo(
    () => schedule?.slots.find((slot) => slot.appointment?.id === selectedAppointment?.id) ?? null,
    [schedule, selectedAppointment],
  );

  const selectedCreateSlot = useMemo(
    () => openSlots.find((slot) => slot.start === appointmentForm.slotStart) ?? openSlots[0] ?? null,
    [appointmentForm.slotStart, openSlots],
  );

  const filteredPatients = useMemo(() => {
    const query = normalizeSearch(patientSearch);
    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      normalizeSearch(
        [
          patient.fullName,
          patient.phoneNumber,
          patient.dateOfBirth,
          patient.historyNotes,
          patient.careNotes,
        ].join(' '),
      ).includes(query),
    );
  }, [patientSearch, patients]);

  const filteredAppointmentSlots = useMemo(() => {
    const query = normalizeSearch(appointmentSearch);
    if (!query) {
      return bookedAppointmentSlots;
    }

    return bookedAppointmentSlots.filter((slot) =>
      normalizeSearch(
        [
          slot.start,
          slot.end,
          slot.patient?.fullName,
          slot.appointment?.reason,
          slot.appointment?.notes,
          slot.appointment?.status,
        ].join(' '),
      ).includes(query),
    );
  }, [appointmentSearch, bookedAppointmentSlots]);

  const patientPageItems = useMemo(
    () => getPageItems(filteredPatients, patientPage),
    [filteredPatients, patientPage],
  );

  const appointmentPageItems = useMemo(
    () => getPageItems(filteredAppointmentSlots, appointmentPage),
    [appointmentPage, filteredAppointmentSlots],
  );

  useEffect(() => {
    setPatientPage(0);
  }, [patientSearch]);

  useEffect(() => {
    setAppointmentPage(0);
  }, [appointmentSearch]);

  useEffect(() => {
    if (patients.length > 0 && !appointmentForm.patientId) {
      setAppointmentForm((currentForm) => ({
        ...currentForm,
        patientId: patients[0].id,
      }));
    }
  }, [appointmentForm.patientId, patients]);

  useEffect(() => {
    if (openSlots.length > 0 && !appointmentForm.slotStart) {
      setAppointmentForm((currentForm) => ({
        ...currentForm,
        slotStart: openSlots[0].start,
      }));
    }
  }, [appointmentForm.slotStart, openSlots]);

  useEffect(() => {
    setAppointmentEditForm({
      reason: selectedAppointment?.reason ?? '',
      notes: selectedAppointment?.notes ?? '',
    });
  }, [selectedAppointment]);

  const applyLoadedData = useCallback(
    (
      nextHealth: ApiHealthResponse,
      nextPatients: Patient[],
      nextAppointments: Appointment[],
      nextSchedule: DayScheduleResponse,
    ) => {
      setHealth(nextHealth);
      setPatients(nextPatients);
      setAppointments(nextAppointments);
      setSchedule(nextSchedule);
      setDoctorForm(toDoctorForm(nextSchedule.doctor));
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
    },
    [],
  );

  const loadClinicData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      try {
        const [nextHealth, nextPatients, nextAppointments, nextSchedule] = await Promise.all([
          getHealth(),
          getPatients(),
          getAppointments(),
          getSchedule(APPOINTMENT_DATE),
        ]);

        applyLoadedData(nextHealth, nextPatients, nextAppointments, nextSchedule);
      } catch (requestError) {
        setError(toErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyLoadedData],
  );

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
      const nextHealth = await seedBaselineData();
      const [nextPatients, nextAppointments, nextSchedule] = await Promise.all([
        getPatients(),
        getAppointments(),
        getSchedule(APPOINTMENT_DATE),
      ]);

      setPatientForm(emptyPatientForm);
      setEditingPatientId(null);
      setAppointmentForm(defaultAppointmentForm);
      setNotice('Baseline data restored');
      applyLoadedData(nextHealth, nextPatients, nextAppointments, nextSchedule);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [applyLoadedData]);

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

  const handleEditPatient = useCallback((patient: Patient) => {
    setEditingPatientId(patient.id);
    setPatientForm({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth ?? '',
      phoneNumber: patient.phoneNumber ?? '',
      historyNotes: patient.historyNotes ?? '',
      careNotes: patient.careNotes ?? '',
    });
  }, []);

  const handleClearPatientForm = useCallback(() => {
    setEditingPatientId(null);
    setPatientForm(emptyPatientForm);
  }, []);

  const handleSavePatient = useCallback(async () => {
    const fullName = patientForm.fullName.trim();
    if (!fullName) {
      setError('Patient full name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const savedPatient = await savePatient({
        id: editingPatientId ?? '',
        doctorId,
        fullName,
        dateOfBirth: patientForm.dateOfBirth.trim(),
        phoneNumber: patientForm.phoneNumber.trim(),
        historyNotes: patientForm.historyNotes.trim(),
        careNotes: patientForm.careNotes.trim(),
      });

      setNotice(editingPatientId ? 'Patient updated' : 'Patient created');
      setEditingPatientId(savedPatient.id);
      await loadClinicData(false);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [doctorId, editingPatientId, loadClinicData, patientForm]);

  const handleDeletePatient = useCallback(
    async (patientId: string) => {
      setSaving(true);
      setError(null);
      setNotice(null);

      try {
        await deletePatient(patientId);
        if (editingPatientId === patientId) {
          handleClearPatientForm();
        }
        if (selectedAppointment?.patientId === patientId) {
          setSelectedAppointment(null);
        }
        setNotice('Patient deleted');
        await loadClinicData(false);
      } catch (requestError) {
        setError(toErrorMessage(requestError));
      } finally {
        setSaving(false);
      }
    },
    [editingPatientId, handleClearPatientForm, loadClinicData, selectedAppointment],
  );

  const handleCreateAppointment = useCallback(async () => {
    if (!appointmentForm.patientId) {
      setError('Choose a patient before creating an appointment');
      return;
    }
    if (!selectedCreateSlot) {
      setError('Choose an open appointment slot');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const createdAppointment = await saveAppointment({
        id: '',
        doctorId,
        patientId: appointmentForm.patientId,
        appointmentDate: APPOINTMENT_DATE,
        slotStart: selectedCreateSlot.start,
        slotEnd: selectedCreateSlot.end,
        status: 'BOOKED',
        reason: appointmentForm.reason.trim() || 'Consultation',
        notes: appointmentForm.notes.trim(),
      });

      setSelectedAppointment(createdAppointment);
      setNotice(`Appointment created at ${createdAppointment.slotStart}`);
      setAppointmentForm({
        ...defaultAppointmentForm,
        patientId: appointmentForm.patientId,
      });
      await loadClinicData(false);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [appointmentForm, doctorId, loadClinicData, selectedCreateSlot]);

  const handleUpdateSelectedAppointment = useCallback(async () => {
    if (!selectedAppointment) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updatedAppointment = await saveAppointment({
        ...selectedAppointment,
        reason: appointmentEditForm.reason.trim(),
        notes: appointmentEditForm.notes.trim(),
      });

      setSelectedAppointment(updatedAppointment);
      setNotice('Appointment updated');
      await loadClinicData(false);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [appointmentEditForm, loadClinicData, selectedAppointment]);

  const handleDeleteSelectedAppointment = useCallback(async () => {
    if (!selectedAppointment) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await deleteAppointment(selectedAppointment.id);
      setNotice('Appointment deleted');
      setSelectedAppointment(null);
      await loadClinicData(false);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [loadClinicData, selectedAppointment]);

  const handleSaveDoctor = useCallback(async () => {
    if (!doctor) {
      setError('Doctor profile is not loaded yet');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const slotLengthMinutes = Number.parseInt(doctorForm.slotLengthMinutes, 10);
      await saveDoctor({
        ...doctor,
        fullName: doctorForm.fullName.trim(),
        specialty: doctorForm.specialty.trim(),
        clinicName: doctorForm.clinicName.trim(),
        workingDayStart: doctorForm.workingDayStart.trim(),
        workingDayEnd: doctorForm.workingDayEnd.trim(),
        slotLengthMinutes: Number.isNaN(slotLengthMinutes) ? doctor.slotLengthMinutes : slotLengthMinutes,
      });

      setNotice('Doctor profile updated');
      await loadClinicData(false);
    } catch (requestError) {
      setError(toErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [doctor, doctorForm, loadClinicData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <ClinicHeader doctor={doctor} health={health} />

        <View style={styles.summaryRow}>
          <SummaryTile label="Patients" value={health?.patientCount ?? patients.length} />
          <SummaryTile label="Slots" value={health?.scheduleSlotCount ?? schedule?.slots.length ?? 0} />
          <SummaryTile label="Booked" value={health?.appointmentCount ?? bookedSlots} />
          <SummaryTile label="API" value={health?.status ?? '--'} />
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

        <ModuleTabs activeModule={activeModule} onSelect={setActiveModule} />

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

        {activeModule === 'dashboard' ? (
          <DashboardModule
            appointments={appointments}
            appointmentSlots={bookedAppointmentSlots}
            availableSlots={availableSlots}
            selectedAppointment={selectedAppointment}
            selectedCurrentSlot={selectedCurrentSlot}
            selectedPatient={selectedPatient}
            saving={saving}
            onMoveAppointment={handleMoveAppointment}
            onSelectAppointment={setSelectedAppointment}
          />
        ) : null}

        {activeModule === 'patients' ? (
          <PatientsModule
            editingPatientId={editingPatientId}
            filteredPatients={filteredPatients}
            page={patientPage}
            patientForm={patientForm}
            pageItems={patientPageItems}
            patientSearch={patientSearch}
            saving={saving}
            onChangeForm={setPatientForm}
            onClearForm={handleClearPatientForm}
            onDeletePatient={handleDeletePatient}
            onEditPatient={handleEditPatient}
            onNextPage={() => setPatientPage((page) => nextPage(page, filteredPatients.length))}
            onPreviousPage={() => setPatientPage((page) => Math.max(0, page - 1))}
            onSavePatient={handleSavePatient}
            onSearch={setPatientSearch}
          />
        ) : null}

        {activeModule === 'appointments' ? (
          <AppointmentsModule
            appointmentEditForm={appointmentEditForm}
            appointmentForm={appointmentForm}
            appointmentPageItems={appointmentPageItems}
            appointmentSearch={appointmentSearch}
            availableSlots={openSlots}
            filteredAppointmentSlots={filteredAppointmentSlots}
            page={appointmentPage}
            patients={patients}
            saving={saving}
            selectedAppointment={selectedAppointment}
            selectedPatient={selectedPatient}
            onChangeCreateForm={setAppointmentForm}
            onChangeEditForm={setAppointmentEditForm}
            onCreateAppointment={handleCreateAppointment}
            onDeleteSelectedAppointment={handleDeleteSelectedAppointment}
            onNextPage={() => setAppointmentPage((page) => nextPage(page, filteredAppointmentSlots.length))}
            onPreviousPage={() => setAppointmentPage((page) => Math.max(0, page - 1))}
            onSearch={setAppointmentSearch}
            onSelectAppointment={setSelectedAppointment}
            onUpdateSelectedAppointment={handleUpdateSelectedAppointment}
          />
        ) : null}

        {activeModule === 'doctor' ? (
          <DoctorModule
            doctorForm={doctorForm}
            saving={saving}
            onChangeForm={setDoctorForm}
            onSaveDoctor={handleSaveDoctor}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type ClinicHeaderProps = {
  doctor: Doctor | null;
  health: ApiHealthResponse | null;
};

function ClinicHeader({ doctor, health }: ClinicHeaderProps) {
  return (
    <View style={styles.clinicHeader}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>CA</Text>
        </View>
        <View style={styles.brandText}>
          <Text style={styles.eyebrow}>CalmAnchor Lite</Text>
          <Text style={styles.clinicName}>{doctor?.clinicName ?? 'CalmAnchor Clinic'}</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>{health?.dataMode ?? 'seed'}</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Clinic Workspace</Text>
        <Text style={styles.subtitle}>
          {doctor?.fullName ?? 'Doctor'} / {doctor?.workingDayStart ?? '09:00'}-
          {doctor?.workingDayEnd ?? '17:00'} / {doctor?.slotLengthMinutes ?? 20} minute slots
        </Text>
        <Text style={styles.apiLabel}>{API_BASE_URL}</Text>
      </View>
    </View>
  );
}

type SummaryTileProps = {
  label: string;
  value: string | number;
};

function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type ModuleTabsProps = {
  activeModule: ModuleKey;
  onSelect: (module: ModuleKey) => void;
};

function ModuleTabs({ activeModule, onSelect }: ModuleTabsProps) {
  return (
    <View style={styles.tabPanel}>
      {moduleTabs.map((tab) => {
        const active = tab.key === activeModule;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={({ pressed }) => [
              styles.tabButton,
              active && styles.activeTabButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type DashboardModuleProps = {
  appointments: Appointment[];
  appointmentSlots: ScheduleSlot[];
  availableSlots: ScheduleSlot[];
  selectedAppointment: Appointment | null;
  selectedCurrentSlot: ScheduleSlot | null;
  selectedPatient: Patient | null;
  saving: boolean;
  onMoveAppointment: (slot: ScheduleSlot) => void;
  onSelectAppointment: (appointment: Appointment | null) => void;
};

function DashboardModule({
  appointments,
  appointmentSlots,
  availableSlots,
  selectedAppointment,
  selectedCurrentSlot,
  selectedPatient,
  saving,
  onMoveAppointment,
  onSelectAppointment,
}: DashboardModuleProps) {
  return (
    <>
      {selectedAppointment ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Change Appointment</Text>
            <Text style={styles.sectionMeta}>
              {selectedCurrentSlot?.start ?? selectedAppointment.slotStart}
            </Text>
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
                  onPress={() => onMoveAppointment(slot)}
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
          <Text style={styles.sectionTitle}>Today Appointments</Text>
          <Text style={styles.sectionMeta}>{appointments.length} booked</Text>
        </View>

        {appointmentSlots.slice(0, PAGE_SIZE).map((slot) => (
          <AppointmentRow
            key={slot.start}
            slot={slot}
            selected={slot.appointment?.id === selectedAppointment?.id}
            onSelect={() => onSelectAppointment(slot.appointment)}
          />
        ))}
      </View>
    </>
  );
}

type PatientsModuleProps = {
  editingPatientId: string | null;
  filteredPatients: Patient[];
  page: number;
  patientForm: PatientForm;
  pageItems: Patient[];
  patientSearch: string;
  saving: boolean;
  onChangeForm: (form: PatientForm) => void;
  onClearForm: () => void;
  onDeletePatient: (patientId: string) => void;
  onEditPatient: (patient: Patient) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSavePatient: () => void;
  onSearch: (value: string) => void;
};

function PatientsModule({
  editingPatientId,
  filteredPatients,
  page,
  patientForm,
  pageItems,
  patientSearch,
  saving,
  onChangeForm,
  onClearForm,
  onDeletePatient,
  onEditPatient,
  onNextPage,
  onPreviousPage,
  onSavePatient,
  onSearch,
}: PatientsModuleProps) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Management</Text>
          <Text style={styles.sectionMeta}>{filteredPatients.length} results</Text>
        </View>

        <TextInput
          value={patientSearch}
          onChangeText={onSearch}
          placeholder="Search name, phone, notes"
          placeholderTextColor="#8A94A6"
          style={styles.input}
        />

        {pageItems.map((patient) => (
          <PatientRow
            key={patient.id}
            patient={patient}
            selected={patient.id === editingPatientId}
            saving={saving}
            onDelete={() => onDeletePatient(patient.id)}
            onEdit={() => onEditPatient(patient)}
          />
        ))}

        <PaginationControls
          page={page}
          total={filteredPatients.length}
          onNext={onNextPage}
          onPrevious={onPreviousPage}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{editingPatientId ? 'Edit Patient' : 'Create Patient'}</Text>
          <Text style={styles.sectionMeta}>{editingPatientId ?? 'New record'}</Text>
        </View>

        <Field
          label="Full name"
          value={patientForm.fullName}
          onChangeText={(fullName) => onChangeForm({ ...patientForm, fullName })}
        />
        <Field
          label="Date of birth"
          value={patientForm.dateOfBirth}
          onChangeText={(dateOfBirth) => onChangeForm({ ...patientForm, dateOfBirth })}
          placeholder="1991-03-14"
        />
        <Field
          label="Phone"
          value={patientForm.phoneNumber}
          onChangeText={(phoneNumber) => onChangeForm({ ...patientForm, phoneNumber })}
          placeholder="+44 7700 900000"
        />
        <Field
          label="History notes"
          value={patientForm.historyNotes}
          onChangeText={(historyNotes) => onChangeForm({ ...patientForm, historyNotes })}
          multiline
        />
        <Field
          label="Care notes"
          value={patientForm.careNotes}
          onChangeText={(careNotes) => onChangeForm({ ...patientForm, careNotes })}
          multiline
        />

        <View style={styles.actionRow}>
          <ActionButton
            label={editingPatientId ? 'Update Patient' : 'Create Patient'}
            onPress={onSavePatient}
            disabled={saving}
          />
          <ActionButton label="Clear" onPress={onClearForm} disabled={saving} tone="secondary" />
        </View>
      </View>
    </>
  );
}

type PatientRowProps = {
  patient: Patient;
  selected: boolean;
  saving: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

function PatientRow({ patient, selected, saving, onDelete, onEdit }: PatientRowProps) {
  return (
    <View style={[styles.patientRow, selected && styles.selectedRow]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(patient.fullName)}</Text>
      </View>
      <View style={styles.patientText}>
        <Text style={styles.patientName}>{patient.fullName}</Text>
        <Text style={styles.reason}>{patient.historyNotes || patient.phoneNumber || patient.id}</Text>
      </View>
      <View style={styles.rowActions}>
        <SmallButton label="Edit" onPress={onEdit} disabled={saving} />
        <SmallButton label="Delete" onPress={onDelete} disabled={saving} tone="danger" />
      </View>
    </View>
  );
}

type AppointmentsModuleProps = {
  appointmentEditForm: AppointmentEditForm;
  appointmentForm: AppointmentCreateForm;
  appointmentPageItems: ScheduleSlot[];
  appointmentSearch: string;
  availableSlots: ScheduleSlot[];
  filteredAppointmentSlots: ScheduleSlot[];
  page: number;
  patients: Patient[];
  saving: boolean;
  selectedAppointment: Appointment | null;
  selectedPatient: Patient | null;
  onChangeCreateForm: (form: AppointmentCreateForm) => void;
  onChangeEditForm: (form: AppointmentEditForm) => void;
  onCreateAppointment: () => void;
  onDeleteSelectedAppointment: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSearch: (value: string) => void;
  onSelectAppointment: (appointment: Appointment | null) => void;
  onUpdateSelectedAppointment: () => void;
};

function AppointmentsModule({
  appointmentEditForm,
  appointmentForm,
  appointmentPageItems,
  appointmentSearch,
  availableSlots,
  filteredAppointmentSlots,
  page,
  patients,
  saving,
  selectedAppointment,
  selectedPatient,
  onChangeCreateForm,
  onChangeEditForm,
  onCreateAppointment,
  onDeleteSelectedAppointment,
  onNextPage,
  onPreviousPage,
  onSearch,
  onSelectAppointment,
  onUpdateSelectedAppointment,
}: AppointmentsModuleProps) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Create Appointment</Text>
          <Text style={styles.sectionMeta}>{availableSlots.length} open slots</Text>
        </View>

        <Text style={styles.fieldLabel}>Patient</Text>
        <View style={styles.optionGrid}>
          {patients.map((patient) => {
            const selected = appointmentForm.patientId === patient.id;
            return (
              <Pressable
                key={patient.id}
                onPress={() => onChangeCreateForm({ ...appointmentForm, patientId: patient.id })}
                style={({ pressed }) => [
                  styles.optionChip,
                  selected && styles.selectedOptionChip,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                  {patient.fullName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Open slot</Text>
        <View style={styles.movePanel}>
          {availableSlots.map((slot) => {
            const selected = appointmentForm.slotStart === slot.start;
            return (
              <Pressable
                key={slot.start}
                onPress={() => onChangeCreateForm({ ...appointmentForm, slotStart: slot.start })}
                style={({ pressed }) => [
                  styles.moveSlot,
                  selected && styles.currentMoveSlot,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.moveSlotTime, selected && styles.currentMoveSlotText]}>
                  {slot.start}
                </Text>
                <Text style={[styles.moveSlotLabel, selected && styles.currentMoveSlotText]}>
                  {selected ? 'Selected' : 'Open'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Reason"
          value={appointmentForm.reason}
          onChangeText={(reason) => onChangeCreateForm({ ...appointmentForm, reason })}
        />
        <Field
          label="Notes"
          value={appointmentForm.notes}
          onChangeText={(notes) => onChangeCreateForm({ ...appointmentForm, notes })}
          multiline
        />

        <ActionButton label="Create Appointment" onPress={onCreateAppointment} disabled={saving} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appointment Records</Text>
          <Text style={styles.sectionMeta}>{filteredAppointmentSlots.length} results</Text>
        </View>

        <TextInput
          value={appointmentSearch}
          onChangeText={onSearch}
          placeholder="Search patient, time, reason"
          placeholderTextColor="#8A94A6"
          style={styles.input}
        />

        {appointmentPageItems.map((slot) => (
          <AppointmentRow
            key={slot.start}
            slot={slot}
            selected={slot.appointment?.id === selectedAppointment?.id}
            onSelect={() => onSelectAppointment(slot.appointment)}
          />
        ))}

        <PaginationControls
          page={page}
          total={filteredAppointmentSlots.length}
          onNext={onNextPage}
          onPrevious={onPreviousPage}
        />
      </View>

      {selectedAppointment ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Edit Appointment</Text>
            <Text style={styles.sectionMeta}>{selectedAppointment.slotStart}</Text>
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
              <Text style={styles.reason}>
                {selectedAppointment.slotStart}-{selectedAppointment.slotEnd}
              </Text>
            </View>
          </View>

          <Field
            label="Reason"
            value={appointmentEditForm.reason}
            onChangeText={(reason) => onChangeEditForm({ ...appointmentEditForm, reason })}
          />
          <Field
            label="Notes"
            value={appointmentEditForm.notes}
            onChangeText={(notes) => onChangeEditForm({ ...appointmentEditForm, notes })}
            multiline
          />

          <View style={styles.actionRow}>
            <ActionButton
              label="Update Appointment"
              onPress={onUpdateSelectedAppointment}
              disabled={saving}
            />
            <ActionButton
              label="Delete"
              onPress={onDeleteSelectedAppointment}
              disabled={saving}
              tone="danger"
            />
          </View>
        </View>
      ) : null}
    </>
  );
}

type DoctorModuleProps = {
  doctorForm: DoctorForm;
  saving: boolean;
  onChangeForm: (form: DoctorForm) => void;
  onSaveDoctor: () => void;
};

function DoctorModule({ doctorForm, saving, onChangeForm, onSaveDoctor }: DoctorModuleProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Doctor Profile</Text>
        <Text style={styles.sectionMeta}>Clinic settings</Text>
      </View>

      <Field
        label="Full name"
        value={doctorForm.fullName}
        onChangeText={(fullName) => onChangeForm({ ...doctorForm, fullName })}
      />
      <Field
        label="Specialty"
        value={doctorForm.specialty}
        onChangeText={(specialty) => onChangeForm({ ...doctorForm, specialty })}
      />
      <Field
        label="Clinic name"
        value={doctorForm.clinicName}
        onChangeText={(clinicName) => onChangeForm({ ...doctorForm, clinicName })}
      />
      <View style={styles.fieldGrid}>
        <Field
          label="Day start"
          value={doctorForm.workingDayStart}
          onChangeText={(workingDayStart) => onChangeForm({ ...doctorForm, workingDayStart })}
          placeholder="09:00"
          compact
        />
        <Field
          label="Day end"
          value={doctorForm.workingDayEnd}
          onChangeText={(workingDayEnd) => onChangeForm({ ...doctorForm, workingDayEnd })}
          placeholder="17:00"
          compact
        />
      </View>
      <Field
        label="Slot length minutes"
        value={doctorForm.slotLengthMinutes}
        onChangeText={(slotLengthMinutes) => onChangeForm({ ...doctorForm, slotLengthMinutes })}
        placeholder="20"
      />

      <ActionButton label="Save Doctor Profile" onPress={onSaveDoctor} disabled={saving} />
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  compact?: boolean;
};

function Field({ label, value, onChangeText, placeholder, multiline = false, compact = false }: FieldProps) {
  return (
    <View style={[styles.fieldGroup, compact && styles.compactField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#8A94A6"
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
};

function ActionButton({ label, onPress, disabled = false, tone = 'primary' }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        tone === 'secondary' && styles.secondaryButton,
        tone === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          tone === 'secondary' && styles.secondaryButtonText,
          tone === 'danger' && styles.dangerButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SmallButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger';
};

function SmallButton({ label, onPress, disabled = false, tone = 'primary' }: SmallButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.smallButton,
        tone === 'danger' && styles.smallDangerButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.smallButtonText, tone === 'danger' && styles.smallDangerButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

type PaginationControlsProps = {
  page: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
};

function PaginationControls({ page, total, onNext, onPrevious }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <View style={styles.paginationRow}>
      <SmallButton label="Prev" onPress={onPrevious} disabled={page === 0} />
      <Text style={styles.paginationText}>
        {pageStart}-{pageEnd} of {total} / Page {page + 1} of {totalPages}
      </Text>
      <SmallButton label="Next" onPress={onNext} disabled={page + 1 >= totalPages} />
    </View>
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

function toDoctorForm(doctor: Doctor): DoctorForm {
  return {
    fullName: doctor.fullName,
    specialty: doctor.specialty ?? '',
    clinicName: doctor.clinicName ?? '',
    workingDayStart: doctor.workingDayStart,
    workingDayEnd: doctor.workingDayEnd,
    slotLengthMinutes: String(doctor.slotLengthMinutes),
  };
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
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getPageItems<T>(items: T[], page: number) {
  return items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
}

function nextPage(page: number, total: number) {
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  return Math.min(maxPage, page + 1);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
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
    flexBasis: '47%',
    flexGrow: 1,
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
  tabPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE7EF',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexGrow: 1,
    minHeight: 42,
    minWidth: 124,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  activeTabButton: {
    backgroundColor: '#0A6C74',
  },
  tabText: {
    color: '#4E5969',
    fontSize: 13,
    fontWeight: '800',
  },
  activeTabText: {
    color: '#FFFFFF',
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
  dangerButton: {
    backgroundColor: '#B83A2F',
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
  dangerButtonText: {
    color: '#FFFFFF',
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#E8F4F2',
    borderRadius: 8,
    minHeight: 34,
    justifyContent: 'center',
    minWidth: 60,
    paddingHorizontal: 10,
  },
  smallDangerButton: {
    backgroundColor: '#FDEDEA',
  },
  smallButtonText: {
    color: '#0A6C74',
    fontSize: 12,
    fontWeight: '900',
  },
  smallDangerButtonText: {
    color: '#B83A2F',
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
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E1E8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#14213D',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  fieldGroup: {
    gap: 6,
  },
  compactField: {
    flex: 1,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    color: '#4E5969',
    fontSize: 13,
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
    minHeight: 74,
    padding: 14,
  },
  selectedSlot: {
    backgroundColor: '#F7FBFC',
    borderColor: '#0A6C74',
    borderWidth: 2,
  },
  selectedRow: {
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
  reason: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
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
  rowActions: {
    gap: 6,
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  paginationText: {
    color: '#667085',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D5DEE8',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  selectedOptionChip: {
    backgroundColor: '#0A6C74',
    borderColor: '#0A6C74',
  },
  optionText: {
    color: '#14213D',
    fontSize: 13,
    fontWeight: '800',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
});
