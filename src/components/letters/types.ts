export type TemplateType = 
  | 'ALOK_IND_OFFER'
  | 'ALOK_IND_APPOINTMENT'
  | 'ALOK_MB_OFFER'
  | 'ALOK_MB_APPOINTMENT'
  | 'TRAINEE_APPOINTMENT';

export type LetterStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Rejected';

export interface LetterData {
  id: string;
  templateType: TemplateType;
  companyName: string; // 'Alok Industries' or 'Alok Masterbatches Pvt. Ltd.'
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  
  status: LetterStatus;
  createdBy: string;
  createdByEmail?: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  digitalSignature?: string; // Data URL for signature image
  pdfUrl?: string; // Final generated PDF
  
  // Fields for placeholders
  date: string;
  salutation: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  cityState: string;
  pinCode: string;
  designation: string;
  department: string;
  grade: string;
  location: string;
  reportingManager: string;
  reportingManagerDesignation: string;
  reportingManagerDepartment: string;
  dateOfJoining: string;
  ctc: string; // Number
  superannuationAge: string;
  
  // Specific to Trainee
  trainingStartDate?: string;
  trainingEndDate?: string;
}
