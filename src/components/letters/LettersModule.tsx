import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Eye, Download, Send, CheckCircle, 
  X, Briefcase, Calendar, MapPin, UserCheck, Edit3, Shield, Mail, ArrowRight, AlertCircle, Clock, Filter, Trash2
} from 'lucide-react';
import { User, Employee } from '../../types';
import { LetterData, TemplateType, LetterStatus } from './types';
import LetterPreviewRender from './LetterPreviewRender';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../lib/emailService';
import SignaturePad from './SignaturePad';
import { readDraft, useDraftAutosave } from '../../lib/useDraftAutosave';

interface LettersModuleProps {
  currentUser: User | null;
}

const letterTypeNames: Record<string, string> = {
  'ALOK_IND_OFFER': 'Offer Letter',
  'ALOK_IND_APPOINTMENT': 'Appointment Letter',
  'ALOK_MB_OFFER': 'Offer Letter',
  'ALOK_MB_APPOINTMENT': 'Appointment Letter',
  'TRAINEE_APPOINTMENT': 'Appointment Letter for Trainee',
  'offer_letter': 'Offer Letter',
  'appointment_letter': 'Appointment Letter',
  'trainee_letter': 'Appointment Letter for Trainee'
};

const companyNames: Record<string, string> = {
  'Alok Industries': 'Alok Industries',
  'Alok Masterbatches Pvt. Ltd.': 'Alok Masterbatches Pvt. Ltd.',
  'Alok Masterbatches': 'Alok Masterbatches Pvt. Ltd.',
  'alok_industries': 'Alok Industries',
  'alok_masterbatches': 'Alok Masterbatches Pvt. Ltd.'
};

export default function LettersModule({ currentUser }: LettersModuleProps) {
  const isAdmin = currentUser?.role === 'admin';
  const isHR = currentUser?.role === 'hr';

  const [letters, setLetters] = useState<LetterData[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CREATE' | 'MY_LETTERS' | 'PENDING' | 'ALL_LETTERS'>(isAdmin ? 'PENDING' : 'MY_LETTERS');
  const [activeView, setActiveView] = useState<'TAB_CONTENT' | 'CREATE_PREVIEW' | 'ADMIN_REVIEW' | 'VIEW_ONLY'>('TAB_CONTENT');
  const [selectedLetter, setSelectedLetter] = useState<LetterData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const previewRef = useRef<HTMLDivElement>(null);

  // FORM STATES — seeded from sessionStorage draft on mount (restores work-in-progress)
  const OFFER_DRAFT_KEY = 'draft_offer_letter_form';
  const [formData, setFormData] = useState<Partial<LetterData & { gender: string; maritalStatus: string; fullName: string; phone: string }>>(() => {
    const saved = readDraft<Partial<LetterData & { gender: string; maritalStatus: string; fullName: string; phone: string }>>(OFFER_DRAFT_KEY);
    return saved ?? {
      templateType: 'ALOK_IND_OFFER',
      companyName: 'Alok Industries',
      date: new Date().toISOString().split('T')[0],
      grade: '',
      superannuationAge: '58',
      gender: 'Male',
      maritalStatus: 'Single',
      fullName: '',
    };
  });

  // Autosave form draft — disabled while in preview (user isn't editing)
  const { clearDraft: clearOfferDraft } = useDraftAutosave(
    OFFER_DRAFT_KEY,
    formData,
    activeView === 'TAB_CONTENT'
  );

  useEffect(() => {
    if (isAdmin && activeTab === 'MY_LETTERS') {
      setActiveTab('PENDING');
    } else if (isHR && (activeTab === 'PENDING' || activeTab === 'ALL_LETTERS')) {
      setActiveTab('MY_LETTERS');
    }
  }, [currentUser?.role]);

  useEffect(() => {
    fetchLetters();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('public:generated_letters_module')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_letters' }, fetchLetters)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const fetchLetters = async () => {
    if (!currentUser) return;
    try {
      setFetchError(null);
      // Plain select — no FK join (created_by FK was removed from schema to support localStorage-based user IDs)
      const { data, error } = await supabase
        .from('generated_letters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mapped = (data || []).map((row: any) => {
        let statusDisplay: LetterStatus = 'Pending Approval';
        if (row.status === 'approved') statusDisplay = 'Approved';
        else if (row.status === 'sent') statusDisplay = 'Sent';
        else if (row.status === 'rejected') statusDisplay = 'Rejected';
                            
        return {
          ...row.letter_data,
          id: row.id || row.letter_data?.id || `let-${Math.random()}`,
          employeeName: row.employee_name || row.letter_data?.employeeName || 'Unknown',
          employeeEmail: row.employee_email || row.letter_data?.employeeEmail || '',
          designation: row.designation || row.letter_data?.designation || '',
          department: row.department || row.letter_data?.department || '',
          dateOfJoining: row.date_of_joining || row.letter_data?.dateOfJoining || '',
          templateType: (row.letter_type || row.letter_data?.templateType || 'OFFER_LETTER').toUpperCase(),
          companyName: row.company === 'alok_industries' ? 'Alok Industries' : 'Alok Masterbatches',
          status: statusDisplay,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          createdByName: row.letter_data?.createdByName || row.created_by || 'HR User',
          createdDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : (row.letter_data?.createdDate || new Date().toISOString().split('T')[0]),
          rejectionReason: row.rejection_reason || row.letter_data?.rejectionReason || '',
        } as LetterData & { createdByName: string };
      });
      
      setLetters(mapped);
    } catch (err: any) {
      console.error("Error fetching letters:", err);
      setFetchError(err?.message || 'Failed to load letters from database.');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateType || !formData.fullName) {
      alert('Please complete required fields');
      return;
    }
    
    let salutation = 'Mx.';
    if (formData.gender === 'Male') salutation = 'Mr.';
    else if (formData.gender === 'Female' && formData.maritalStatus === 'Single') salutation = 'Ms.';
    else if (formData.gender === 'Female' && formData.maritalStatus === 'Married') salutation = 'Mrs.';

    const names = (formData.fullName || '').trim().split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ');
    
    const newLetter: LetterData = {
      ...formData as LetterData,
      id: `LET-${Date.now()}`,
      employeeId: `MANUAL-${Date.now()}`,
      employeeName: formData.fullName || '',
      salutation,
      firstName,
      lastName,
      status: 'Draft',
      createdBy: currentUser?.id || 'System',
      createdDate: new Date().toISOString().split('T')[0],
    };
    
    setSelectedLetter(newLetter);
    setActiveView('CREATE_PREVIEW');
  };

  const handleSubmitForApproval = async () => {
    if (selectedLetter && currentUser) {
      try {
        const typeMapping: any = {
          'ALOK_IND_OFFER': 'offer_letter',
          'ALOK_IND_APPOINTMENT': 'appointment_letter',
          'ALOK_MB_OFFER': 'offer_letter',
          'ALOK_MB_APPOINTMENT': 'appointment_letter',
          'TRAINEE_APPOINTMENT': 'trainee_letter'
        };
        const companyMapping: any = {
          'Alok Industries': 'alok_industries',
          'Alok Masterbatches': 'alok_masterbatches'
        };
        const { data, error } = await supabase.from('generated_letters').insert({
          employee_name: selectedLetter.employeeName,
          employee_email: selectedLetter.employeeEmail,
          designation: selectedLetter.designation,
          department: selectedLetter.department,
          date_of_joining: selectedLetter.dateOfJoining,
          letter_type: typeMapping[selectedLetter.templateType] || 'offer_letter',
          company: companyMapping[selectedLetter.companyName] || 'alok_industries',
          status: 'pending',
          created_by: currentUser.id,
          created_by_email: currentUser.email,
          letter_data: selectedLetter
        }).select().single();

        if (error) throw error;
        
        // Send email 1 to Admin
        try {
          const displayType = letterTypeNames[selectedLetter.templateType] || 'Offer Letter';
          await sendEmail(
            'alokhr@gmail.com',
            `Review Required: ${displayType} Pending for Approval – ${selectedLetter.employeeName}`,
            `
            <p>Dear Admin,</p>
            <p>A new letter has been submitted for your review and approval.</p>
            
            <div style="background:#fff9e6; padding:20px; border-radius:12px; margin:20px 0; border:1px solid #ffeeba;">
              <p style="margin:0 0 10px 0;">👤 <b>Candidate:</b> ${selectedLetter.employeeName}</p>
              <p style="margin:0 0 10px 0;">📋 <b>Letter Type:</b> ${displayType}</p>
              <p style="margin:0 0 10px 0;">👩 <b>Submitted By:</b> ${currentUser.name}</p>
              <p style="margin:0;">📅 <b>Submission Date:</b> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Please login to the HR Portal to review the details and sign the document.</p>
            
            <p style="margin-top:30px; border-top:1px solid #eee; pt:20px; font-size:12px; color:#666;">
              This is an automated notification from the ALOK HR Management System.
            </p>
            `
          );
        } catch (emailErr: any) {
          console.warn('Notice: Email notification simulated or delayed:', emailErr.message || emailErr);
        }

        alert("Letter successfully submitted for Admin approval!");
        clearOfferDraft(); // Draft fulfilled — clear it from sessionStorage
        setActiveView('TAB_CONTENT');
        if (isAdmin) {
          setActiveTab('PENDING');
        } else {
          setActiveTab('MY_LETTERS');
        }
        fetchLetters();
      } catch (err: any) {
        let msg = err.message || "Failed to submit for approval";
        if (msg.includes('row-level security policy')) {
          msg = "Security Policy Error: Please ensure you have configured the Supabase RLS policies for 'generated_letters' to allow inserts.";
        }
        alert(msg);
      }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Reason for rejection is required');
      return;
    }
    if (selectedLetter && currentUser && isAdmin) {
      try {
        const { error } = await supabase.from('generated_letters')
          .update({ 
            status: 'rejected',
            rejection_reason: rejectionReason
          })
          .eq('id', selectedLetter.id);

        if (error) throw error;

        const { data: creatorData } = await supabase.from('hr_users').select('email, full_name').eq('id', selectedLetter.createdBy).single();
        
        try {
          const displayType = letterTypeNames[selectedLetter.templateType] || 'Offer Letter';
          await sendEmail(
            creatorData?.email || 'alokhr@gmail.com',
            `Attention Required: ${displayType} Rejected – ${selectedLetter.employeeName}`,
            `
            <p>Dear <b>${creatorData?.full_name || 'HR Executive'}</b>,</p>
            <p>The following letter has been reviewed and <b style="color:#dc3545;">rejected</b> by the Administrator.</p>
            
            <div style="background:#fff5f5; padding:20px; border-radius:12px; margin:20px 0; border:1px solid #feb2b2;">
              <p style="margin:0 0 10px 0;">👤 <b>Candidate:</b> ${selectedLetter.employeeName}</p>
              <p style="margin:0 0 10px 0;">📋 <b>Letter Type:</b> ${displayType}</p>
              <p style="margin:0;">💬 <b>Rejection Reason:</b> <span style="font-weight:bold; color:#c53030;">${rejectionReason}</span></p>
            </div>
            
            <p>Please login to the HR Portal, make the necessary corrections based on the feedback above, and resubmit for approval.</p>
            
            <p style="margin-top:30px; border-top:1px solid #eee; pt:20px; font-size:12px; color:#666;">
              Best Regards,<br/>
              Administrator Office<br/>
              ALOK Industries / Masterbatches
            </p>
            `
          );
        } catch (emailErr: any) {
          console.warn('Notice: Rejection email notification simulated or delayed:', emailErr.message || emailErr);
        }

        alert("Letter rejected.");
        setShowRejectInput(false);
        setRejectionReason('');
        setActiveView('TAB_CONTENT');
        setActiveTab('PENDING');
        fetchLetters();
      } catch (err: any) {
        alert(err.message || 'Failed to reject letter');
      }
    }
  };

  const handleClearTestData = async () => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete ALL letter history? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('generated_letters')
        .delete()
        .not('id', 'is', null);

      if (error) throw error;
      alert('All test data cleared successfully!');
      fetchLetters();
    } catch (err: any) {
      alert(err.message || 'Failed to clear test data');
    }
  };

  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = Array.from(element.querySelectorAll('img'));
    const promises = images.map(img => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise<void>(resolve => {
        const handleSuccess = () => resolve();
        const handleError = () => {
          console.error(`[PDF Gen Error] Failed to load image: ${img.src || img.getAttribute('src')}`);
          resolve();
        };

        if (typeof img.decode === 'function') {
          img.decode()
            .then(handleSuccess)
            .catch(err => {
              console.error(`[PDF Gen Error] Failed to decode image: ${img.src}`, err);
              img.onload = handleSuccess;
              img.onerror = handleError;
            });
        } else {
          img.onload = handleSuccess;
          img.onerror = handleError;
        }
      });
    });
    await Promise.all(promises);
  };

  const resolveRelativeUrls = (element: HTMLElement) => {
    const images = Array.from(element.querySelectorAll('img'));
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.startsWith('http:') && !src.startsWith('https:')) {
        try {
          img.src = new URL(src, window.location.href).href;
        } catch (e) {
          console.error('Failed to resolve absolute URL:', src, e);
        }
      }
    });
  };

  const generatePDFHelper = async (elementOrId: string | HTMLElement = 'letter-preview') => {
    let element: HTMLElement | null = null;
    if (typeof elementOrId === 'string') {
      const elements = document.querySelectorAll(`#${elementOrId}`);
      element = (elements[elements.length - 1] || document.getElementById(elementOrId)) as HTMLElement;
    } else {
      element = elementOrId;
    }
    if (!element) throw new Error('Element not found for PDF generation');

    resolveRelativeUrls(element);
    await waitForImages(element);

    const pages = element.querySelectorAll('.a4-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const pageCanvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794
        });
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.8);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
    } else {
      // Fallback: single image capture if no .a4-page components found
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
        logging: false
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = canvasWidth / pdfWidth;
      const totalPDFHeight = canvasHeight / ratio;
      const totalPages = Math.ceil(totalPDFHeight / pdfHeight);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          -(page * pdfHeight),
          pdfWidth,
          totalPDFHeight,
          undefined,
          'FAST'
        );
      }
    }

    return {
      pdf,
      base64: pdf.output('datauristring').split(',')[1] || pdf.output('datauristring').replace(/^data:.*?;base64,/, '')
    };
  };

  const generatePDFBlob = async (elementOrId: string | HTMLElement = 'letter-preview'): Promise<Blob> => {
    let element: HTMLElement | null = null;
    if (typeof elementOrId === 'string') {
      const elements = document.querySelectorAll(`#${elementOrId}`);
      element = (elements[elements.length - 1] || document.getElementById(elementOrId)) as HTMLElement;
    } else {
      element = elementOrId;
    }
    if (!element) throw new Error('Element not found for PDF generation');

    resolveRelativeUrls(element);
    await waitForImages(element);
    
    const pages = element.querySelectorAll('.a4-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const pageCanvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794
        });
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.8);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
    } else {
      // Fallback: single image capture if no .a4-page components found
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
        logging: false
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = canvasWidth / pdfWidth;
      const totalPDFHeight = canvasHeight / ratio;
      const totalPages = Math.ceil(totalPDFHeight / pdfHeight);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          -(page * pdfHeight),
          pdfWidth,
          totalPDFHeight,
          undefined,
          'FAST'
        );
      }
    }
    
    return pdf.output('blob');
  };

  const generatePDFBase64 = async (elementOrId: string | HTMLElement = 'letter-preview') => {
    const { base64 } = await generatePDFHelper(elementOrId);
    return base64;
  };

  const downloadLetterPDF = async (letterData: LetterData) => {
    setIsGenerating(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      const root = createRoot(container);
      
      const safeData = {
        ...letterData,
        designation: letterData.designation || 'N/A',
        department: letterData.department || 'N/A',
        addressLine1: letterData.addressLine1 || '',
        addressLine2: letterData.addressLine2 || '',
        cityState: letterData.cityState || '',
        pinCode: letterData.pinCode || '',
        ctc: letterData.ctc || '0',
        salutation: letterData.salutation || 'Mr.',
        firstName: letterData.firstName || letterData.employeeName?.split(' ')[0] || '',
        lastName: letterData.lastName || letterData.employeeName?.split(' ').slice(1).join(' ') || '',
        reportingManager: letterData.reportingManager || '',
        grade: letterData.grade || '',
        date: letterData.date || new Date().toISOString().split('T')[0],
        dateOfJoining: letterData.dateOfJoining || '',
        location: letterData.location || '',
        reportingManagerDesignation: letterData.reportingManagerDesignation || '',
        reportingManagerDepartment: letterData.reportingManagerDepartment || '',
        superannuationAge: letterData.superannuationAge || '58',
      };
      
      root.render(
        <div id="letter-preview" style={{ width: '794px', background: '#ffffff' }}>
          <LetterPreviewRender data={safeData} isPreview={false} />
        </div>
      );
      
      // Wait for React to render and images/fonts to load
      await new Promise(r => setTimeout(r, 1200));
      
      const pdfBlob = await generatePDFBlob(container.firstElementChild as HTMLElement);
      root.unmount();
      document.body.removeChild(container);
      
      const displayType = (letterTypeNames[letterData.templateType] || 'Letter').replace(/\s+/g, '_');
      const fileName = `${letterData.employeeName.replace(/\s+/g, '_')}_${displayType}_ALOK.pdf`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to generate PDF download.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteLetter = async (letterId: string, employeeName: string) => {
    console.log('Delete clicked for letter:', letterId);
    if (!window.confirm(`Are you sure you want to delete the letter for ${employeeName}? This action cannot be undone.`)) {
      return;
    }

    // Store current state for rollback if needed
    const previousLetters = [...letters];

    // Optimistic Update: Remove from local state immediately
    setLetters(prev => prev.filter(l => l.id !== letterId));

    try {
      const { error } = await supabase
        .from('generated_letters')
        .delete()
        .eq('id', letterId);

      if (error) throw error;

      alert("Letter deleted successfully");
      // fetchLetters is already triggered by realtime subscription, but we can call it just in case or if realtime is disabled
      // fetchLetters(); 
    } catch (err: any) {
      console.error("Delete failed:", err);
      // Rollback on failure
      setLetters(previousLetters);
      alert(err.message || "Failed to delete letter. Please try again.");
    }
  };

  const handleApprove = async () => {
    if (!selectedLetter || !currentUser || !isAdmin) return;
    if (!digitalSignature) {
      alert("Please provide a signature before approving.");
      return;
    }
    setIsGenerating(true);
    
    try {
      let signatureUrl = digitalSignature;

      // If it's a data URL, upload to Supabase Storage
      if (digitalSignature.startsWith('data:')) {
        try {
          const base64Data = digitalSignature.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/png' });
          
          const fileName = `signature_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
          const { error: uploadError } = await supabase.storage
            .from('letters')
            .upload(`signatures/${fileName}`, blob, {
              contentType: 'image/png',
              upsert: false
            });
            
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from('letters')
            .getPublicUrl(`signatures/${fileName}`);
            
          signatureUrl = urlData.publicUrl;
        } catch (err) {
          console.error('Failed to upload signature image:', err);
          alert('Failed to upload signature. Please try again.');
          setIsGenerating(false);
          return;
        }
      }

      const updatedLetterData = { ...selectedLetter, digitalSignature: signatureUrl };
      
      const { error } = await supabase.from('generated_letters')
        .update({ 
          status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          letter_data: updatedLetterData
        })
        .eq('id', selectedLetter.id);

      if (error) throw error;
      
      alert("Letter approved! Junior HR can now send it.");
      setShowSignaturePad(false);
      setDigitalSignature('');
      setActiveView('TAB_CONTENT');
      setActiveTab('PENDING');
      fetchLetters();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Failed to approve letter';
      if (msg.includes('row-level security policy')) {
        msg = "Security Policy Error: Please ensure you have configured the Supabase RLS policies for 'generated_letters' to allow updates.";
      }
      alert(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToCandidate = async (letterId: string) => {
    if (sendingId !== null) return;
    if (!currentUser || !isHR) return;
    
    const letterData = letters.find(l => l.id === letterId);
    if (!letterData) {
      alert("Letter not found!");
      return;
    }

    setSendingId(letterId);
    setIsGenerating(true);
    
    try {
      // 1. Generate PDF off-screen
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(
        <div id="letter-render-container" style={{ width: '210mm', background: '#ffffff' }}>
          <LetterPreviewRender data={letterData} isPreview={false} />
        </div>
      );
      
      await new Promise(r => setTimeout(r, 1200)); 
      
      const pdfBlob = await generatePDFBlob(container.firstElementChild as HTMLElement);
      
      root.unmount();
      document.body.removeChild(container);

      // 2. Upload to Supabase Storage
      const displayType = (letterTypeNames[letterData.templateType] || 'Letter').replace(/\s+/g, '_');
      const fileName = `${letterData.employeeName.replace(/\s+/g, '_')}_${displayType}_ALOK.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('letters')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('letters')
        .getPublicUrl(fileName);

      const pdfPublicUrl = urlData.publicUrl;

      // 3. Send Email via EmailJS
      const displayTypeLabel = letterTypeNames[letterData.templateType] || 'Offer Letter';
      const displayCompany = companyNames[letterData.companyName] || letterData.companyName;
      
      await sendEmail(
        letterData.employeeEmail,
        `${displayTypeLabel} – ${letterData.employeeName} | ${displayCompany}`,
        `
        <p>Dear <b>${letterData.employeeName}</b>,</p>
        <p>We are pleased to share your 
        <b>${displayTypeLabel}</b> from 
        <b>${displayCompany}</b>.</p>
        
        <div style="background:#f8f9fa; padding:20px; border-radius:12px; margin:20px 0; border:1px solid #e2e8f0;">
          <p style="margin:0 0 10px 0;">📋 <b>Letter Type:</b> ${displayTypeLabel}</p>
          <p style="margin:0 0 10px 0;">💼 <b>Designation:</b> ${letterData.designation}</p>
          <p style="margin:0 0 10px 0;">🏢 <b>Department:</b> ${letterData.department}</p>
          <p style="margin:0;">📅 <b>Date of Joining:</b> ${letterData.dateOfJoining}</p>
        </div>

         <div style="margin:30px 0; text-align:center;">
          <a href="${pdfPublicUrl}" 
             style="display:inline-block; background:#1a1a2e; color:white; padding:16px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
             ⬇️ Download Your ${displayTypeLabel} (PDF)
          </a>
        </div>

        <p>Kindly download the attached letter, sign it, and return the duplicate copy to the HR department at your earliest convenience.</p>
        <p>Welcome to the family!</p>
        
        <p style="margin-top:30px; border-top:1px solid #eee; pt:20px;">
          For any queries, please reach out:<br/>
          📧 <b>hralokmasterbatch@gmail.com</b><br/>
          📞 <b>+91-11-41612244 - 47</b>
        </p>
        <br/>
        <p>Best Regards,<br/>
        <b>Chandrika Gupta</b><br/>
        General Manager – HR<br/>
        ${displayCompany}</p>
        `
      );
      
      // 4. Update Status and PDF URL in DB
      const { error } = await supabase.from('generated_letters')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          pdf_url: pdfPublicUrl
        })
        .eq('id', letterData.id);

      if (error) throw error;

      // Add to employee triggers if not exists (non-critical, don't fail if RLS blocks it)
      try {
        await supabase.from('employee_triggers').insert({
          employee_name: letterData.employeeName,
          employee_email: letterData.employeeEmail,
          date_of_joining: letterData.dateOfJoining,
          employment_status: 'active'
        });
      } catch (triggerErr) {
        console.warn("Could not add employee trigger (likely RLS):", triggerErr);
      }
      
      alert(`Offer letter sent to ${letterData.employeeEmail} successfully`);
      fetchLetters();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to send letter');
    } finally {
      setIsGenerating(false);
      setSendingId(null);
    }
  };

  if (!currentUser || (!isAdmin && !isHR)) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-800">Access Denied</h3>
        <p className="text-xs text-rose-600 mt-1">You must have a valid Admin or HR role to access Offer Letter Generation.</p>
      </div>
    );
  }

  // DATA FILTERING FOR TABS
  const myLetters = letters.filter(l => l.createdByEmail === currentUser.email || l.createdBy === currentUser.id);
  const pendingApprovals = letters.filter(l => l.status === 'Pending Approval');
  
  const allFilteredLetters = letters.filter(l => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return l.status === 'Pending Approval';
    if (statusFilter === 'APPROVED') return l.status === 'Approved';
    if (statusFilter === 'REJECTED') return l.status === 'Rejected';
    if (statusFilter === 'SENT') return l.status === 'Sent';
    return true;
  });

  // Visible fetch-error banner (shown in-page so failures aren’t silently swallowed)
  const renderFetchError = () => fetchError ? (
    <div className="mb-4 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rose-800">Failed to load letters</p>
        <p className="text-xs text-rose-600 mt-0.5 break-words">{fetchError}</p>
      </div>
      <button
        onClick={fetchLetters}
        className="shrink-0 text-xs font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
      >
        Retry
      </button>
    </div>
  ) : null;

  const renderTabs = () => (
    <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
      <button
        onClick={() => { setActiveTab('CREATE'); setActiveView('TAB_CONTENT'); }}
        className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
          activeTab === 'CREATE'
            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
        }`}
      >
        <Plus className="w-4 h-4" />
        Create New Letter
      </button>

      {isHR && (
        <button
          onClick={() => { setActiveTab('MY_LETTERS'); setActiveView('TAB_CONTENT'); }}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'MY_LETTERS'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Letters
        </button>
      )}

      {isAdmin && (
        <>
          <button
            onClick={() => { setActiveTab('PENDING'); setActiveView('TAB_CONTENT'); }}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'PENDING'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span className="ml-1 bg-rose-100 text-rose-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('ALL_LETTERS'); setActiveView('TAB_CONTENT'); }}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL_LETTERS'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            All Letters
          </button>
          
          <button
            type="button"
            onClick={handleClearTestData}
            className="ml-auto py-2 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border border-transparent hover:border-rose-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Test Data
          </button>
        </>
      )}
    </div>
  );

  // VIEW 1: PREVIEWING A NEWLY CREATED LETTER BEFORE SUBMISSION (BOTH ROLES)
  if (activeView === 'CREATE_PREVIEW' && selectedLetter) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Preview Offer Letter: {selectedLetter.employeeName}</h2>
            <p className="text-[10px] text-slate-500">Please review the generated letter before submitting for Admin approval.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('TAB_CONTENT')}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              ← Back to Edit Form
            </button>
            <button
              onClick={handleSubmitForApproval}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              Submit for Approval
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-100 p-4 md:p-8 rounded-xl border border-slate-200 shadow-inner flex justify-center">
          <div ref={previewRef} id="letter-preview" className="bg-white shadow-xl">
            <LetterPreviewRender data={selectedLetter} isPreview={true} />
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: ADMIN REVIEWING A PENDING LETTER FROM PENDING TAB (ADMIN ONLY)
  if (activeView === 'ADMIN_REVIEW' && selectedLetter && isAdmin) {
    return (
      <div className="space-y-6">
        <div className="relative flex flex-col md:flex-row justify-between md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Review Pending Letter: {selectedLetter.employeeName}</h2>
            <p className="text-[10px] text-slate-500">Submitted by <span className="font-bold text-slate-700">{(selectedLetter as any).createdByName || 'Junior HR'}</span> on {selectedLetter.createdDate}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => { setActiveView('TAB_CONTENT'); setShowRejectInput(false); setShowSignaturePad(false); }}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              ← Back to List
            </button>

            {!showRejectInput && !showSignaturePad && (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50 rounded-lg text-xs font-bold hover:bg-rose-100 cursor-pointer"
                >
                  ❌ Reject
                </button>
                <button 
                  onClick={() => setShowSignaturePad(true)} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Shield className="w-4 h-4"/> 
                  ✅ Approve & Sign
                </button>
              </>
            )}

            {showSignaturePad && (
              <div className="flex flex-col gap-2 p-3 border border-emerald-200 bg-emerald-50/90 rounded-xl shadow-lg absolute right-4 top-16 z-20 w-96">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">Add Signature to Approve</span>
                  <button onClick={() => { setShowSignaturePad(false); setDigitalSignature(''); setSignatureMode('draw'); }} className="text-slate-500 hover:text-slate-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex bg-emerald-100/50 p-1 rounded-lg">
                  <button 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${signatureMode === 'draw' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                    onClick={() => {
                      if (signatureMode !== 'draw') {
                        setSignatureMode('draw');
                        setDigitalSignature('');
                      }
                    }}
                  >
                    ✏️ Draw Signature
                  </button>
                  <button 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${signatureMode === 'upload' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                    onClick={() => {
                      if (signatureMode !== 'upload') {
                        setSignatureMode('upload');
                        setDigitalSignature('');
                      }
                    }}
                  >
                    📎 Upload Image
                  </button>
                </div>

                {signatureMode === 'draw' ? (
                  <SignaturePad 
                    onSign={(sig) => setDigitalSignature(sig)} 
                    onClear={() => setDigitalSignature('')} 
                  />
                ) : (
                  <div className="flex flex-col gap-2 bg-white rounded-lg border border-slate-200 p-3 h-[180px] justify-center items-center relative">
                    {digitalSignature ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="bg-slate-50 border border-slate-100 rounded flex items-center justify-center p-2 w-full h-[100px]">
                          <img src={digitalSignature} alt="Signature Preview" className="max-h-[80px] max-w-full object-contain" />
                        </div>
                        <button 
                          onClick={() => setDigitalSignature('')} 
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-full text-center">
                        <input 
                          type="file" 
                          accept="image/png,image/jpeg,image/webp" 
                          id="signature-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              alert("Image must be smaller than 2MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setDigitalSignature(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <label 
                          htmlFor="signature-upload"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-2 transition-colors mb-3"
                        >
                          <Download className="w-3.5 h-3.5 rotate-180" />
                          Choose File
                        </label>
                        <div 
                          className="text-xs text-slate-500 font-medium p-2 border-2 border-dashed border-slate-200 rounded-lg outline-none focus:border-emerald-400 bg-slate-50"
                          tabIndex={0}
                          onPaste={(e) => {
                            const items = e.clipboardData.items;
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf('image/') !== -1) {
                                const file = items[i].getAsFile();
                                if (!file) continue;
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Image must be smaller than 2MB");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setDigitalSignature(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                                e.preventDefault();
                                break;
                              }
                            }
                          }}
                        >
                          ...or click here and paste an image (Ctrl+V)
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={handleApprove} 
                  disabled={!digitalSignature || isGenerating}
                  className="w-full mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex justify-center items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            )}

            {showRejectInput && (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Enter reason for rejection" 
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-60 focus:ring-2 focus:ring-rose-500 outline-none"
                  autoFocus
                />
                <button onClick={handleReject} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer">Submit</button>
                <button onClick={() => setShowRejectInput(false)} className="text-slate-500 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-100 p-4 md:p-8 rounded-xl border border-slate-200 shadow-inner flex justify-center">
          <div id="letter-preview" className="bg-white shadow-xl">
            <LetterPreviewRender data={selectedLetter} isPreview={true} />
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: READ-ONLY PREVIEW OF A LETTER (FROM HISTORY / ALL LETTERS)
  if (activeView === 'VIEW_ONLY' && selectedLetter) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">View Letter: {selectedLetter.employeeName}</h2>
            <p className="text-[10px] text-slate-500">Status: <span className="font-bold uppercase text-indigo-600">{selectedLetter.status}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('TAB_CONTENT')}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              ← Back to List
            </button>
            <button
              onClick={() => downloadLetterPDF(selectedLetter)}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : '⬇️ Download PDF'}
            </button>
          </div>
        </div>

        {selectedLetter.status === 'Rejected' && selectedLetter.rejectionReason && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex items-center gap-2 text-xs font-bold border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Rejection Reason: {selectedLetter.rejectionReason}</span>
          </div>
        )}

        <div className="overflow-x-auto bg-slate-100 p-4 md:p-8 rounded-xl border border-slate-200 shadow-inner flex justify-center">
          <div className="bg-white shadow-xl">
            <LetterPreviewRender data={selectedLetter} isPreview={true} />
          </div>
        </div>
      </div>
    );
  }

  // TAB CONTENT RENDERER
  return (
    <div className="space-y-6 text-left font-sans pb-10">
      <div>
        <p className="text-xs text-indigo-600 font-bold font-mono uppercase tracking-wider">Talent Acquisition</p>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Offer Letter Generation</h2>
      </div>

      {renderFetchError()}
      {renderTabs()}

      {/* TAB 1: CREATE NEW LETTER (BOTH ROLES) */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleCreateSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-8 text-left animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Template Type *</label>
              <select 
                required
                value={formData.templateType}
                onChange={e => {
                  const type = e.target.value as TemplateType;
                  const company = type.includes('ALOK_IND') ? 'Alok Industries' : 'Alok Masterbatches';
                  setFormData({...formData, templateType: type, companyName: company});
                }}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALOK_IND_OFFER">Alok Industries - Offer Letter</option>
                <option value="ALOK_IND_APPOINTMENT">Alok Industries - Appointment Letter</option>
                <option value="ALOK_MB_OFFER">Alok Masterbatches - Offer Letter</option>
                <option value="ALOK_MB_APPOINTMENT">Alok Masterbatches - Appointment Letter</option>
                <option value="TRAINEE_APPOINTMENT">Trainee Appointment Letter</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Section 1 — Candidate Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Full Name *</label>
                <input required type="text" placeholder="e.g. Rahul Sharma" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Gender *</label>
                <select required value={formData.gender || 'Male'} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Marital Status *</label>
                <select required value={formData.maritalStatus || 'Single'} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
                <input required type="email" placeholder="candidate@example.com" value={formData.employeeEmail || ''} onChange={e => setFormData({...formData, employeeEmail: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                <input type="tel" placeholder="+91 9876543210" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Section 2 — Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Designation *</label>
                <input required type="text" placeholder="e.g. Senior Manager" value={formData.designation || ''} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Grade *</label>
                <input required type="text" placeholder="e.g. M1, G2" value={formData.grade || ''} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Department *</label>
                <input required type="text" placeholder="e.g. Quality Assurance" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Date of Joining *</label>
                <input required type="date" value={formData.dateOfJoining || ''} onChange={e => setFormData({...formData, dateOfJoining: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Working Location *</label>
                <input required type="text" placeholder="e.g. Plant A - Gurgaon" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Reporting Manager</label>
                <input type="text" placeholder="e.g. Amit Verma" value={formData.reportingManager || ''} onChange={e => setFormData({...formData, reportingManager: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">CTC (Number)</label>
                <input type="number" placeholder="e.g. 1200000" value={formData.ctc || ''} onChange={e => setFormData({...formData, ctc: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              {formData.templateType === 'TRAINEE_APPOINTMENT' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Training Start Date</label>
                    <input type="date" value={formData.trainingStartDate || ''} onChange={e => setFormData({...formData, trainingStartDate: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Training End Date</label>
                    <input type="date" value={formData.trainingEndDate || ''} onChange={e => setFormData({...formData, trainingEndDate: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Employment Start Date</label>
                    <input type="date" value={formData.dateOfJoining || ''} onChange={e => setFormData({...formData, dateOfJoining: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Section 3 — Candidate Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Address Line 1</label>
                <input type="text" placeholder="House/Flat No., Building Name" value={formData.addressLine1 || ''} onChange={e => setFormData({...formData, addressLine1: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Address Line 2</label>
                <input type="text" placeholder="Street, Sector / Area" value={formData.addressLine2 || ''} onChange={e => setFormData({...formData, addressLine2: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">City / State</label>
                <input type="text" placeholder="e.g. New Delhi, Delhi" value={formData.cityState || ''} onChange={e => setFormData({...formData, cityState: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">PIN Code</label>
                <input type="text" placeholder="e.g. 110001" value={formData.pinCode || ''} onChange={e => setFormData({...formData, pinCode: e.target.value})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 flex items-center gap-2 cursor-pointer transition-all">
              Preview Letter <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MY LETTERS (JUNIOR HR ONLY) */}
      {activeTab === 'MY_LETTERS' && isHR && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Created Letters</h3>
            <span className="text-xs text-slate-500 font-medium">Showing your letters ({myLetters.length})</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Candidate Name</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Letter Type</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {myLetters.map((letter, idx) => (
                  <tr key={`${letter.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
                          {letter.employeeName[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-slate-900 font-bold">{letter.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{letter.employeeEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                      {letterTypeNames[letter.templateType] || (letter.templateType as string).replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{letter.createdDate}</td>
                    <td className="px-5 py-4 text-xs">
                      {letter.status === 'Pending Approval' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                          🟡 Pending — waiting for admin
                        </span>
                      )}
                      {letter.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          🟢 Approved — ready to send
                        </span>
                      )}
                      {letter.status === 'Sent' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          ✅ Sent — sent on {letter.createdDate}
                        </span>
                      )}
                      {letter.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                          🔴 Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        {letter.status === 'Approved' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSendToCandidate(letter.id)}
                              disabled={sendingId !== null}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
                            >
                              <Send className="h-3.5 w-3.5" />
                              {sendingId === letter.id ? 'Sending...' : '📧 Send to Candidate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLetter(letter.id, letter.employeeName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Letter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {letter.status === 'Sent' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadLetterPDF(letter)}
                              disabled={isGenerating}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                              ⬇️ Download PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLetter(letter.id, letter.employeeName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Letter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {letter.status === 'Rejected' && (
                          <div className="text-right flex items-center gap-3 justify-end">
                            <div className="text-right">
                              <span className="text-rose-600 font-bold text-xs inline-flex items-center gap-1">
                                ❌ Rejected
                              </span>
                              {letter.rejectionReason && (
                                <p className="text-[10px] text-rose-500 font-normal mt-0.5 max-w-[180px] ml-auto truncate" title={letter.rejectionReason}>
                                  Reason: {letter.rejectionReason}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteLetter(letter.id, letter.employeeName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Rejected Letter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {letter.status === 'Pending Approval' && (
                          <div className="flex items-center gap-3 justify-end">
                            <span className="text-slate-400 font-medium text-xs italic inline-block py-1">
                              ⏳ Awaiting Approval
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLetter(letter.id, letter.employeeName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Pending Letter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {myLetters.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                No letters yet. Create your first letter!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS (ADMIN ONLY) */}
      {activeTab === 'PENDING' && isAdmin && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pending Approvals</h3>
              {pendingApprovals.length > 0 && (
                <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                  🔴 {pendingApprovals.length} Action Needed
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Candidate</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Letter Type</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Submitted By</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {pendingApprovals.map((letter, idx) => (
                  <tr key={`${letter.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-700 shrink-0">
                          {letter.employeeName[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-slate-900 font-bold">{letter.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{letter.employeeEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                      {letterTypeNames[letter.templateType] || (letter.templateType as string).replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-semibold">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-700">
                        <UserCheck className="w-3 h-3 text-slate-500" />
                        {(letter as any).createdByName || 'Junior HR'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{letter.createdDate}</td>
                    <td className="px-5 py-4 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLetter(letter);
                            setActiveView('ADMIN_REVIEW');
                          }}
                          className="px-3.5 py-1.5 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" /> 
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(letter.id, letter.employeeName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Letter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingApprovals.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold">🎉 All caught up! No pending letters require your approval.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL LETTERS (ADMIN ONLY) */}
      {activeTab === 'ALL_LETTERS' && isAdmin && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">All Letters Directory</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses ({letters.length})</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SENT">Sent</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Candidate</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Created By</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {allFilteredLetters.map((letter, idx) => (
                  <tr key={`${letter.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                      <div>
                        <div className="text-slate-900 font-bold">{letter.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{letter.employeeEmail}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                      {letterTypeNames[letter.templateType] || (letter.templateType as string).replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">{(letter as any).createdByName || 'System'}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{letter.createdDate}</td>
                    <td className="px-5 py-4 text-xs">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-block ${
                        letter.status === 'Sent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        letter.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        letter.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        letter.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {letter.status === 'Pending Approval' ? '🟡 Pending' :
                         letter.status === 'Approved' ? '🟢 Approved' :
                         letter.status === 'Sent' ? '✅ Sent' :
                         letter.status === 'Rejected' ? '🔴 Rejected' : letter.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLetter(letter);
                            setActiveView('VIEW_ONLY');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        <button
                          onClick={() => downloadLetterPDF(letter)}
                          disabled={isGenerating}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Download className="h-3 w-3" />
                          ⬇️ Download PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(letter.id, letter.employeeName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Letter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allFilteredLetters.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold">No letters match the selected filter.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}