/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, FileText, Download, Send, Check, AlertTriangle, RefreshCw, Eye, Edit3, Briefcase, Calendar, MapPin, UserCheck, DollarSign } from 'lucide-react';
import { Candidate, User } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import AlokLogo from './AlokLogo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { sendEmail } from '../lib/emailService';
import alokLogo from '../assets/alok-logo.png';

interface OfferLetterModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCand: Candidate) => void;
  currentUser: User | null;
}

export default function OfferLetterModal({
  candidate,
  isOpen,
  onClose,
  onSuccess,
  currentUser
}: OfferLetterModalProps) {
  // --- STATE FOR QUICK DETAILS FORM (STEP 1) ---
  const [candidateEmail, setCandidateEmail] = useState(candidate.email || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married'>('Single');
  const [designation, setDesignation] = useState(candidate.appliedRole || '');
  const [department, setDepartment] = useState('Engineering');
  const [dateOfJoining, setDateOfJoining] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // Default to 2 weeks from today
    return today.toISOString().split('T')[0];
  });
  const [ctc, setCtc] = useState(String(candidate.salaryOffered || '850000'));
  const [reportingManagerName, setReportingManagerName] = useState('');
  const [workLocation, setWorkLocation] = useState('Gurugram, Haryana');
  const [companyName, setCompanyName] = useState<'Alok Masterbatches' | 'Alok Industries'>('Alok Masterbatches');

  // HR Details (Auto-filled but editable)
  const [hrName, setHrName] = useState(currentUser?.name || 'Tarun Sharma');
  const [hrDesignation, setHrDesignation] = useState(
    currentUser?.role === 'HR_ADMIN' ? 'HR Director' : 'HR Manager'
  );
  const [hrEmail, setHrEmail] = useState(currentUser?.email || 'hr@alokmasterbatches.com');
  const [companyPhone, setCompanyPhone] = useState('+91 124 4000000');

  // --- AUTOMATIC SALUTATION LOGIC (STEP 2) ---
  const [salutation, setSalutation] = useState('Mr.');

  useEffect(() => {
    if (gender === 'Male') {
      setSalutation('Mr.');
    } else if (gender === 'Female') {
      setSalutation(maritalStatus === 'Married' ? 'Mrs.' : 'Ms.');
    } else {
      setSalutation('Mx.');
    }
  }, [gender, maritalStatus]);

  // --- INTERACTIVE INLINE TEXT/CONTENT STATES (STEP 3 & 4) ---
  const [activeStep, setActiveStep] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMockedSend, setIsMockedSend] = useState(false);

  // Offer Letter Custom Body Editable Texts
  const [offerLetterDate, setOfferLetterDate] = useState(() => {
    return new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  // Paragraph Text States (Editable in preview)
  const [letterIntro, setLetterIntro] = useState('');
  const [letterTermsHeader, setLetterTermsHeader] = useState('After careful consideration, we are delighted to offer you the following terms:');
  const [letterClauses, setLetterClauses] = useState([
    'This offer is subject to successful completion of background verification.',
    'You will be required to adhere to all company policies and procedures as outlined in the Employee Handbook.',
    'This offer is valid for 7 days from the date of this letter.'
  ]);
  const [letterClosing, setLetterClosing] = useState('We look forward to welcoming you to the ALOK family. Please sign and return a copy of this letter as confirmation of your acceptance.');

  // Reference for capturing DOM element for PDF
  const previewRef = useRef<HTMLDivElement>(null);

  // Initializing Letter Intro when designation, department etc changes
  const initLetterTexts = () => {
    setLetterIntro(
      `We are pleased to extend this offer of employment to you at ALOK Masterbatches Pvt. Ltd. for the position of ${designation} in our ${department} department.`
    );
  };

  useEffect(() => {
    initLetterTexts();
  }, [designation, department, activeStep]);

  // Auto-fit font size based on content height
useEffect(() => {
  if (!previewRef.current) return;
  const pageEl = previewRef.current.querySelector('.a4-page') as HTMLElement;
  if (!pageEl) return;
  const maxHeight = pageEl.clientHeight;
  const minFont = 10;
  const step = 0.5;
  let font = 12;
  const adjust = () => {
    pageEl.style.fontSize = `${font}pt`;
    pageEl.style.lineHeight = `${font * 1.5}pt`;
    const contentHeight = pageEl.scrollHeight;
    if (contentHeight > maxHeight && font > minFont) {
      font = Math.max(minFont, font - step);
      adjust();
    }
  };
  adjust();
}, [
  letterIntro,
  letterTermsHeader,
  letterClauses,
  letterClosing,
  designation,
  department,
  workLocation,
  dateOfJoining,
  ctc,
  reportingManagerName,
  companyName,
]);
  const handleRegenerate = () => {
    initLetterTexts();
  };

  // Helper to generate PDF from preview ref
  const generatePDFFromPreview = async (): Promise<Blob> => {
    if (!previewRef.current) throw new Error('Preview element not ready');
    const element = previewRef.current;
    
    // Wait for fonts and styles to settle
    await new Promise(r => setTimeout(r, 1000));

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

  // Helper to trigger Local PDF Download
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      const pdfBlob = await generatePDFFromPreview();
      const fileName = `${candidate.name.replace(/\s+/g, '_')}_Offer_Letter_ALOK.pdf`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Send Offer Letter (Step 5)
  const handleSendOfferLetter = async () => {
    if (!previewRef.current || isSending) return;
    setIsSending(true);
    setSendStatus('idle');
    setErrorMessage('');

    try {
      // 1. Capture PDF Blob
      const pdfBlob = await generatePDFFromPreview();

      // 2. Upload to Supabase Storage
      const fileName = `${candidate.name.replace(/\s+/g, '_')}_Offer_Letter_ALOK.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('letters')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false // Changed to false to avoid requiring UPDATE policy
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('letters')
        .getPublicUrl(fileName);

      const pdfPublicUrl = urlData.publicUrl;

      // 3. Send Email via EmailJS
      const companyFull = companyName === 'Alok Industries' ? 'ALOK Industries' : 'ALOK Masterbatches Pvt. Ltd.';
      await sendEmail(
        candidateEmail,
        `Offer Letter – ${candidate.name} | ${companyFull}`,
        `
        <p>Dear <b>${candidate.name}</b>,</p>
        <p>We are pleased to share your 
        <b>Offer Letter</b> from 
        <b>${companyFull}</b>.</p>
        
        <div style="background:#f8f9fa; padding:20px; border-radius:12px; margin:20px 0; border:1px solid #e2e8f0;">
          <p style="margin:0 0 10px 0;">📋 <b>Letter Type:</b> Offer Letter</p>
          <p style="margin:0 0 10px 0;">💼 <b>Designation:</b> ${designation}</p>
          <p style="margin:0 0 10px 0;">🏢 <b>Department:</b> ${department}</p>
          <p style="margin:0;">📅 <b>Date of Joining:</b> ${dateOfJoining}</p>
        </div>

        <div style="margin:30px 0; text-align:center;">
          <a href="${pdfPublicUrl}" 
             style="display:inline-block; background:#1a1a2e; color:white; padding:16px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
             ⬇️ Download Your Offer Letter (PDF)
          </a>
        </div>

        <p>Kindly download the attached letter, sign it, and return the duplicate copy to the HR department at your earliest convenience.</p>
        <p>Welcome to the ALOK family!</p>
        
        <p style="margin-top:30px; border-top:1px solid #eee; pt:20px;">
          For any queries, please reach out:<br/>
          📧 <b>hralokmasterbatch@gmail.com</b><br/>
          📞 <b>+91-11-41612244 - 47</b>
        </p>
        <br/>
        <p>Best Regards,<br/>
        <b>Chandrika Gupta</b><br/>
        General Manager – HR<br/>
        ${companyFull}</p>
        `
      );

      setSendStatus('success');
      setIsMockedSend(false);

      // 4. Update Candidate Record
      onSuccess({
        ...candidate,
        status: 'Offer Sent',
        email: candidateEmail,
        salaryOffered: Number(ctc),
        offer_letter_url: pdfPublicUrl,
        notes: `${candidate.notes || ''}\n\n[System Log - ${new Date().toLocaleString()}] Offer Letter Sent successfully via email link.`
      });

      const { error: triggerError } = await supabase.from('employee_triggers').insert({
        employee_name: candidate.name,
        employee_email: candidateEmail,
        date_of_joining: dateOfJoining,
        employment_status: 'active',
      });
      if (triggerError) {
        console.error('Failed to create feedback trigger record:', triggerError);
        // do not block the offer letter success flow on this — just log it
      }

    } catch (err: any) {
        console.error(err);
        console.log('Supabase error details:', err?.details || err?.message);
        setErrorMessage(err.message || 'Failed to deliver offer letter');
        setSendStatus('error');
      } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-none md:rounded-2xl shadow-2xl max-w-4xl w-full h-full md:h-auto max-h-screen md:max-h-[90vh] overflow-hidden flex flex-col border-none md:border md:border-slate-200"
      >
        {/* Header */}
        <div className="px-3 md:px-6 py-3 md:py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 md:p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Mail className="h-4.5 w-4.5 md:h-5 md:w-5" />
            </div>
            <div className="text-left min-w-0">
              <h3 className="text-xs md:text-sm font-bold text-slate-800 truncate">Generate & Send Offer Letter</h3>
              <p className="text-[10px] md:text-[11px] text-slate-400 truncate">Recipient: <span className="font-semibold text-slate-600">{candidate.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4.5 w-4.5 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Modal Sub Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-3 md:px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveStep('form')}
            className={`px-3 md:px-4 py-2.5 md:py-3 text-[11px] md:text-xs font-bold border-b-2 flex items-center gap-1 md:gap-1.5 cursor-pointer transition-colors shrink-0 ${
              activeStep === 'form'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            1. Form details
          </button>
          <button
            onClick={() => setActiveStep('preview')}
            className={`px-3 md:px-4 py-2.5 md:py-3 text-[11px] md:text-xs font-bold border-b-2 flex items-center gap-1 md:gap-1.5 cursor-pointer transition-colors shrink-0 ${
              activeStep === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            2. Live Preview & Edit
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {activeStep === 'form' ? (
            /* STEP 1: Form details input fields */
            <div className="space-y-4 md:space-y-6 text-left">
              <div className="bg-indigo-50/50 p-3 md:p-4 rounded-xl border border-indigo-100 flex items-start gap-2 md:gap-2.5">
                <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] md:text-xs font-bold text-indigo-900">Pre-fill System Records</h4>
                  <p className="text-[10px] md:text-[11px] text-indigo-700 leading-normal mt-0.5">
                    Candidate information is dynamically loaded from the applicant pipeline. Complete the missing corporate structural details below to compile the official letter template.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Full Name (Auto-filled, read-only placeholder info) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Candidate Full Name (Auto-filled)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={candidate.name}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>

                {/* Candidate Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Candidate Email ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                {/* Gender Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Marital Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>

                {/* Company Entity selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Company Entity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold"
                  >
                    <option value="Alok Masterbatches">Alok Masterbatches Pvt. Ltd.</option>
                    <option value="Alok Industries">Alok Industries</option>
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-medium"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR Operations">HR Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                {/* Date of Joining */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                {/* Annual CTC Offered */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Annual CTC Offered (₹ Per Annum)
                  </label>
                  <div className="relative rounded-lg">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={ctc}
                      onChange={(e) => setCtc(e.target.value)}
                      placeholder="e.g. 850000"
                      className="block w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold"
                    />
                  </div>
                </div>

                {/* Reporting Manager */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reporting Manager Name
                  </label>
                  <input
                    type="text"
                    value={reportingManagerName}
                    onChange={(e) => setReportingManagerName(e.target.value)}
                    placeholder="e.g. Manish Kapoor"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                {/* Work Location */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Gurugram, Haryana"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  />
                </div>
              </div>

              {/* HR / Corporate Senders Details Section */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  Corporate HR Authorization Details (Sender)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Authorizer Full Name
                    </label>
                    <input
                      type="text"
                      value={hrName}
                      onChange={(e) => setHrName(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={hrDesignation}
                      onChange={(e) => setHrDesignation(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      HR Department Email
                    </label>
                    <input
                      type="email"
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    initLetterTexts();
                    setActiveStep('preview');
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="h-4 w-4" />
                  Compile & View Preview
                </button>
              </div>
            </div>
          ) : (
            /* STEP 3 & 4: Live Preview & Real-Time Editing */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Direct Text Editor (Edit any preview paragraph) */}
              <div className="lg:col-span-4 space-y-4 text-left">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                    Interactive Editor
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal mb-3.5">
                    Edit the text blocks below to refine the custom layout. The document preview updates instantly.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Offer Date</label>
                      <input
                        type="text"
                        value={offerLetterDate}
                        onChange={(e) => setOfferLetterDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Salutation</label>
                      <input
                        type="text"
                        value={salutation}
                        onChange={(e) => setSalutation(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Introduction Paragraph</label>
                      <textarea
                        rows={4}
                        value={letterIntro}
                        onChange={(e) => setLetterIntro(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Terms Conditions Intro</label>
                      <input
                        type="text"
                        value={letterTermsHeader}
                        onChange={(e) => setLetterTermsHeader(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Closing Paragraph</label>
                      <textarea
                        rows={4}
                        value={letterClosing}
                        onChange={(e) => setLetterClosing(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="w-full py-1.5 border border-indigo-200 hover:border-indigo-400 text-indigo-600 bg-indigo-50/20 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Restore Default Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Actual Document Render Canvas */}
              <div className="lg:col-span-8 flex flex-col items-center">
                
                {/* Visual Canvas Wrapper (Styled Corporate Letterhead) */}
                <div className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                  <div 
                    ref={previewRef}
                    className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 overflow-x-auto"
                  >
                    {/* The A4 Page container */}
                    <div className="a4-page page letter-page bg-white text-slate-800 shadow-md mx-auto text-left relative" style={{
  width: '794px',
  minHeight: '1123px',
  padding: '60px 75px 100px 85px',
  boxSizing: 'border-box',
  fontFamily: '"Times New Roman", Times, serif',
  textAlign: 'justify',
  position: 'relative',
  fontSize: '12pt',
  lineHeight: `${12 * 1.5}pt`
}}>
                      {/* Page Border */}
                      <div className="page-border" style={{
                        position: 'absolute',
                        top: '15px',
                        bottom: '15px',
                        left: '15px',
                        right: '15px',
                        border: '1px solid #000000',
                        pointerEvents: 'none'
                      }} />

                      {/* Header Logo */}
                      <div style={{
                        position: 'absolute',
                        top: '30px',
                        right: '40px',
                        display: 'flex',
                        justifyContent: 'end'
                      }}>
                        <img src={alokLogo} alt="ALOK Logo" style={{ height: '45px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      </div>

                      {/* Content Area */}
                      <div className="space-y-4 text-xs font-sans">
                        <div className="flex justify-between font-semibold text-slate-600 text-[11px]">
                          <span>Ref: AM/HR/OFFER/{new Date().getFullYear()}/{candidate.id}</span>
                          <span>Date: {offerLetterDate}</span>
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">To,</p>
                          <p className="font-bold text-slate-900">{salutation} {candidate.name}</p>
                          <p className="text-slate-500">{candidateEmail}</p>
                          <p className="text-slate-500">Mobile: {candidate.phone || 'N/A'}</p>
                        </div>

                        <div className="pt-2">
                          <p className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wide text-xs">
                            Subject: Offer of Employment
                          </p>
                        </div>

                        {/* Letter content (editable) */}
                        <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                          {letterIntro}
                        </p>

                        <p className="text-slate-700 font-medium">
                          {letterTermsHeader}
                        </p>

                        {/* OFFER DETAILS BENTO BOX */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 my-4 grid grid-cols-2 gap-y-3 gap-x-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Designation / Role</p>
                              <p className="text-xs font-bold text-slate-800">{designation}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Work Location</p>
                              <p className="text-xs font-bold text-slate-800">{workLocation}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Date of Joining</p>
                              <p className="text-xs font-bold text-slate-800">{dateOfJoining}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-amber-500 shrink-0" />
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Reporting Manager</p>
                              <p className="text-xs font-bold text-slate-800">{reportingManagerName || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 col-span-2 border-t border-slate-200/60 pt-3 mt-1">
                            <DollarSign className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Compensational CTC</p>
                              <p className="text-sm font-extrabold text-emerald-700">
                                ₹ {Number(ctc).toLocaleString('en-IN')} Per Annum
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-700 leading-relaxed">
                          Your employment will initially be on a probationary period of 6 months, during which your performance will be assessed regularly.
                        </p>

                        <div className="space-y-1.5 pt-2">
                          <p className="font-bold text-slate-800 text-[11px]">Terms and Conditions of Employment:</p>
                          <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                            {letterClauses.map((clause, idx) => (
                              <li key={idx} className="leading-relaxed">{clause}</li>
                            ))}
                          </ol>
                        </div>

                        <p className="whitespace-pre-line text-slate-700 leading-relaxed pt-2">
                          {letterClosing}
                        </p>

                        {/* SIGNATURE SECTIONS */}
                        <div className="pt-10 flex justify-between items-end mt-12 text-[10px]">
                          <div className="space-y-4">
                            <div className="h-12 flex items-center justify-start italic font-serif text-slate-400">
                              [Digitally Approved]
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">Authorized Signatory</p>
                              <p className="text-slate-500">
                                { companyName === 'Alok Industries'
                                  ? 'ALOK Industries'
                                  : 'ALOK Masterbatches Pvt. Ltd.'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="text-right space-y-4">
                            <div className="h-12"></div>
                            <div>
                              <p className="font-bold text-slate-800">Candidate Signature</p>
                              <p className="text-slate-500">{candidate.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="letter-footer" style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '40px',
                        right: '40px',
                        textAlign: 'center',
                        fontSize: '8pt',
                        fontFamily: '"Times New Roman", Times, serif',
                        lineHeight: '1.4',
                        color: '#000000'
                      }}>
                        <div style={{
                          fontSize: '9pt',
                          fontWeight: 'bold',
                          letterSpacing: '0.02em'
                        }}>
                          { companyName === 'Alok Industries'
                            ? 'ALOK INDUSTRIES'
                            : 'ALOK MASTERBATCHES PVT. LTD.'
                          }
                        </div>
                        <div>Plot No 227, Okhla Industrial Estate Phase-III, New Delhi, Delhi,110020 , INDIA</div>
                        <div>Phones : +91-11-41612244 - 47, Fax No: +91-11-41610333-34</div>
                        <div>e-mail : sales@alokindustries.com, www.alokmasterbatches.com</div>
                        <div>ROC CIN No. U74899DL1995PTC065403</div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Bottom toolbar */}
                <div className="w-full flex flex-col sm:flex-row gap-3 items-center justify-between mt-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-left text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-700">A4 Document Ratio Rendered</p>
                    <p>Verify spelling & salary before signing digitally.</p>
                  </div>

                  <div className="flex gap-2">
                    {/* Download PDF button */}
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isGenerating}
                      className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          Download PDF
                        </>
                      )}
                    </button>

                    {/* Send Offer Letter Email button */}
                    <button
                      type="button"
                      onClick={handleSendOfferLetter}
                      disabled={isSending || sendStatus === 'success'}
                      className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer ${
                        sendStatus === 'success'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400'
                      }`}
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Sending Email...
                        </>
                      ) : sendStatus === 'success' ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Sent Successfully
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send Offer Letter
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Alerts */}
                <div className="w-full mt-4">
                  {sendStatus === 'success' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-left text-xs leading-normal space-y-1">
                      <p className="font-bold flex items-center gap-1 text-emerald-900">
                        <Check className="h-4 w-4 text-emerald-600" />
                        Offer letter dispatched successfully!
                      </p>
                      <p>
                        An email has been transmitted to <strong className="font-semibold">{candidateEmail}</strong> with the corporate welcome notice and the attached high-resolution PDF package.
                      </p>
                      {isMockedSend && (
                        <p className="text-[10px] text-emerald-600 italic bg-emerald-100/40 p-1.5 rounded mt-1.5 border border-emerald-200/50">
                          ⚠️ Sandbox Mode Active: Email dispatch was fully simulated. Candidate record is set to "Offer Sent" and log entries have been saved locally.
                        </p>
                      )}
                    </div>
                  )}

                  {sendStatus === 'error' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-left text-xs leading-normal">
                      <p className="font-bold flex items-center gap-1 text-rose-900">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        Email Transmission Failed
                      </p>
                      <p className="mt-1">{errorMessage}</p>
                      <button
                        onClick={handleSendOfferLetter}
                        className="mt-2 text-rose-600 hover:text-rose-800 font-extrabold underline block cursor-pointer"
                      >
                        Retry Transmission
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 md:px-6 py-3 md:py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0 sticky bottom-0 z-10">
          <div className="text-[10px] md:text-[11px] text-slate-400">
            {activeStep === 'form' ? (
              <span>Step 1: Configure</span>
            ) : (
              <span>Step 2: Review</span>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onClose}
              className="px-3 py-1.5 md:px-4 md:py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            {activeStep === 'preview' && (
              <button
                onClick={() => setActiveStep('form')}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all cursor-pointer"
              >
                Edit Form
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
