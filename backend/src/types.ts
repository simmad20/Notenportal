export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  country: 'AT' | 'DE' | 'CH';
  language: 'de' | 'en';
  theme: 'light' | 'dark';
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grades: Record<string, string | number | null>;
  absences: {
    total: number;
    unexcused: number;
    behavior: string;
  };
}

export interface GradeTable {
  id: string;
  userId: string;
  name: string;
  className: string;
  schoolYear: string;
  country: 'AT' | 'DE' | 'CH';
  headTeacher: string;
  subjects: Subject[];
  students: Student[];
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  country: 'AT' | 'DE' | 'CH';
  subjects: Subject[];
  sampleStudents: Student[];
  isBlank: boolean;
}

export interface AuthRequest extends Request {
  userId?: string;
}
