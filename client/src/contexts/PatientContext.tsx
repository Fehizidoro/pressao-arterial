import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

type Patient = {
  id: number;
  userId: number;
  name: string;
  birthDate: string | null;
  gender: "male" | "female" | "other" | null;
  notes: string | null;
  isDefault: number;
  createdAt: Date;
  updatedAt: Date;
};

interface PatientContextValue {
  selectedPatient: Patient | null;
  setSelectedPatient: (p: Patient | null) => void;
  patients: Patient[];
  isLoading: boolean;
  refetch: () => void;
}

const PatientContext = createContext<PatientContextValue>({
  selectedPatient: null,
  setSelectedPatient: () => {},
  patients: [],
  isLoading: false,
  refetch: () => {},
});

export function PatientProvider({ children }: { children: ReactNode }) {
  const [selectedPatient, setSelectedPatientState] = useState<Patient | null>(null);
  const { data: patients = [], isLoading, refetch } = trpc.patients.list.useQuery();

  // Auto-seleciona o paciente padrão ou o primeiro
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      const defaultPatient = patients.find((p) => p.isDefault === 1) ?? patients[0];
      setSelectedPatientState(defaultPatient);
    }
    // Atualiza referência se o paciente selecionado foi atualizado
    if (selectedPatient && patients.length > 0) {
      const updated = patients.find((p) => p.id === selectedPatient.id);
      if (updated && updated.name !== selectedPatient.name) {
        setSelectedPatientState(updated);
      }
    }
  }, [patients]);

  const setSelectedPatient = (p: Patient | null) => {
    setSelectedPatientState(p);
  };

  return (
    <PatientContext.Provider value={{ selectedPatient, setSelectedPatient, patients, isLoading, refetch }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  return useContext(PatientContext);
}
