import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { LetterData } from './types';
import alokLogo from '../../assets/alok-logo.png';

function numberToWords(num: number): string {
  if (isNaN(num) || !isFinite(num)) return '';
  if (num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const format = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + format(n % 100) : '');
      if (n < 100000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
      if (n < 10000000) return format(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? format(n % 100000) : '');
      return format(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? format(n % 10000000) : '');
  };
  
  return format(num).trim();
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('default', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

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

const Footer = ({ companyName }: { companyName: string }) => {
  const isAlokInd = companyName.includes('Industries') || companyName.toLowerCase().includes('alok_industries');
  const entityName = isAlokInd ? 'ALOK INDUSTRIES' : 'ALOK MASTERBATCHES PVT. LTD';
  
  return (
    <div className="letter-footer" style={{
      position: 'absolute',
      bottom: '20px',
      left: '40px',
      right: '40px',
      textAlign: 'center',
      fontSize: '8pt',
      fontFamily: '"Times New Roman", Times, serif',
      lineHeight: '1.4',
      color: '#000000',
      backgroundColor: '#ffffff',
      paddingTop: '6px',
      zIndex: 2
    }}>
      <div style={{ fontSize: '9pt', fontWeight: 'bold', letterSpacing: '0.02em' }}>{entityName}</div>
      <div>Plot No 227, Okhla Industrial Estate Phase-III, New Delhi, Delhi,110020 , INDIA</div>
      <div>Phones : +91-11-41612244 - 47, Fax No: +91-11-41610333-34</div>
      <div>e-mail : sales@alokindustries.com, www.alokmasterbatches.com</div>
    </div>
  );
};

const A4Page = ({ children, companyName, hideFooter = false }: { children: React.ReactNode, companyName: string, hideFooter?: boolean, key?: React.Key }) => {
  const displayCompany = companyNames[companyName] || companyName;
  return (
    <div className="page letter-page a4-page relative bg-white mx-auto text-black shadow-lg mb-6 text-left" style={{ 
      width: '794px',
      height: '1123px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '125px 75px 110px 85px',
      boxSizing: 'border-box',
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '11pt',
      lineHeight: '1.4',
      textAlign: 'justify',
      position: 'relative'
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

      <div className="page-content" style={{ flex: 1, overflow: 'visible' }}>
        {children}
      </div>
      {!hideFooter && <Footer companyName={displayCompany} />}
    </div>
  );
};

const SectionTitle = ({ num, title }: { num: string, title: string }) => (
  <div className="flex font-bold uppercase mb-2 mt-4 text-left">
    <span style={{ width: '25px', flexShrink: 0 }}>{num}.</span>
    <span>{title}</span>
  </div>
);

const Clause = ({ num, children }: { num?: string, children: React.ReactNode }) => (
  <div className="flex mb-2">
    {num && <span style={{ width: '25px', flexShrink: 0 }}>{num}</span>}
    <div className="flex-1">{children}</div>
  </div>
);

const OfferLetterTemplate = ({ data }: { data: LetterData }) => {
  const displayType = letterTypeNames[data.templateType] || 'Offer Letter';
  const displayCompany = companyNames[data.companyName] || data.companyName;

  // Auto-fit: shrink font-size (and, in lockstep, line-height) until content
  // guaranteed fits on one A4 page.
  // 850px = the safe content area inside A4Page, with a buffer kept clear
  // above the footer band (1123px page height − 125px top padding − 110px
  // bottom padding − ~30px safety margin so text never collides with the
  // absolutely-positioned footer).
  //
  // IMPORTANT: all vertical spacing below (margins/padding) is written in
  // `em` via inline style, NOT Tailwind's mb-*/py-* utilities. Tailwind's
  // spacing scale is in `rem` (relative to the root <html> font-size), so it
  // does NOT shrink when we reduce this component's font-size — only the
  // text itself would get smaller while all the whitespace between
  // paragraphs stayed fixed. That mismatch is why long letters could still
  // overflow into the footer even after hitting the old minimum font size.
  // Using `em` means every margin scales proportionally with fontSize.
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(11);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const maxHeight = 850;
    const minSize = 8;

    const fit = () => {
      let size = 11;
      el.style.fontSize = `${size}pt`;
      while (el.scrollHeight > maxHeight && size > minSize) {
        size -= 0.25;
        el.style.fontSize = `${size}pt`;
      }
      setFontSize(size);
    };

    // Run once immediately, then again after the signature image (if any)
    // has finished loading/decoding — an <img> can still cause a reflow
    // right after paint on slower connections, and we want the final
    // measurement to reflect the fully-loaded layout, not a stale one.
    fit();
    const images = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
    Promise.all(
      images.map(img =>
        img.decode ? img.decode().catch(() => {}) : Promise.resolve()
      )
    ).then(() => requestAnimationFrame(fit));
  }, [data]);

  return (
    <A4Page companyName={data.companyName}>
      <div ref={contentRef} style={{ fontSize: `${fontSize}pt`, lineHeight: 1.35 }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.9em' }}>Date: {formatDate(data.date)}</p>

        <div style={{ fontWeight: 'bold', marginBottom: '1em' }}>
          <p>{data.firstName} {data.lastName}</p>
          {data.addressLine1 && <p>{data.addressLine1}</p>}
          {data.addressLine2 && <p>{data.addressLine2}</p>}
          {(data.cityState || data.pinCode) && (
            <p>{data.cityState}{data.pinCode ? ` – ${data.pinCode}` : ''}</p>
          )}
        </div>

        <div className="text-center" style={{ fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: '2px', marginBottom: '1em' }}>
          {displayType}
        </div>

        <p style={{ marginBottom: '0.8em' }}>Dear {data.firstName},</p>

        <p style={{ marginBottom: '1em' }}>
          We are pleased to offer you a position of <strong>{data.designation}</strong>, in <strong>{data.grade}</strong> at <strong>{displayCompany}</strong> on the following terms and conditions.
        </p>

        <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed', marginBottom: '1em' }}>
          <tbody>
            <tr>
              <td className="align-top w-[180px]" style={{ padding: '0.5em 1em 0.5em 0' }}>Commencement of<br/>employment:</td>
              <td className="text-justify" style={{ padding: '0.5em 0' }}>As mutually agreed, you are required to join the Company no later than <strong>{formatDate(data.dateOfJoining)}</strong>. In the event you are unable to join on the Date of Commencement, the Company will have the option to rescind this offer.</td>
            </tr>
            <tr>
              <td className="align-top" style={{ padding: '0.5em 1em 0.5em 0' }}>Monthly Salary:</td>
              <td className="text-justify" style={{ padding: '0.5em 0' }}>Emoluments and compensation package and terms and conditions of your appointment will be in line with the discussions held with you. Detailed appointment letter containing break up of compensation package and terms & conditions of your appointment will be given at the time of joining.</td>
            </tr>
            <tr>
              <td className="align-top" style={{ padding: '0.5em 1em 0.5em 0' }}>Working Location:</td>
              <td className="text-justify" style={{ padding: '0.5em 0' }}>Your primary place of work will be <strong>{data.location}</strong>. At the sole discretion of the Company, you may be transferred /deputed from one place to another place anywhere in India or abroad and/or to any offices of the Company's affiliates, associates, group companies and/or entities in which the Company may be having any interest whether existing or which may be set up in the future.</td>
            </tr>
            <tr>
              <td className="align-top" style={{ padding: '0.5em 1em 0.5em 0' }}>Probation Period:</td>
              <td className="text-justify" style={{ padding: '0.5em 0' }}>
                <p style={{ marginBottom: '0.5em' }}>You shall be on 6 months probationary period which shall commence from the day you join your services with the company. This may be extended based on your performance.</p>
                <p>On completion of probation period, either initial or extended, as the case maybe, and upon finding your services satisfactory, the company may in its sole discretion confirm your employment with the company by issuing a confirmation letter to this effect. You will be deemed to be on probation till you receive the letter of confirmation from the management.</p>
              </td>
            </tr>
            <tr>
              <td className="align-top" style={{ padding: '0.5em 1em 0.5em 0' }}>Background verification:</td>
              <td className="text-justify" style={{ padding: '0.5em 0' }}>As a condition of your employment with the company, you agree to a background verification check and said employment is subject to you clearing the background verification process subject to the requirements of the company.</td>
            </tr>
          </tbody>
        </table>

        <p className="text-justify" style={{ marginBottom: '0.8em' }}>Your employment with the Company will require you to be bound by all rules, regulations, policies and guidelines issued by the Company from time to time, in relation to, but not limited to personal and professional conduct, non-disclosure of confidential information and discipline.</p>

        <p className="text-justify" style={{ marginBottom: '1em' }}>We welcome you to the Company and take this opportunity to wish you a long and successful career with us.</p>

        <p className="text-justify" style={{ marginBottom: '1.2em' }}>Please sign and submit the duplicate copy of this Offer Letter as your acceptance of the offer. By signing this Offer Letter, you also consent to the collection, use, transfer, disclosure, storage, and retention of your Personal Data.</p>

        <p style={{ marginBottom: '1.2em' }}>Thank you,</p>

        <div className="flex justify-between items-end" style={{ marginTop: '0.6em' }}>
          <div>
            <p style={{ marginBottom: '0.6em' }}>Yours sincerely,</p>
            {data.digitalSignature ? (
              <img src={data.digitalSignature} alt="Signature" className="object-contain mix-blend-multiply" style={{ height: '3.5em', width: 'auto', marginBottom: '0.2em' }} />
            ) : (
              <div style={{ height: '3.5em', width: '8em', marginBottom: '0.2em' }}></div>
            )}
            <p style={{ fontWeight: 'bold' }}>Chandrika Gupta</p>
            <p style={{ fontWeight: 'bold' }}>General Manager-HR</p>
          </div>
          <div>
            <p style={{ marginBottom: '2.2em' }}>Accepted By:</p>
            <div className="bg-black" style={{ height: '1px', width: '10em' }}></div>
          </div>
        </div>
      </div>
    </A4Page>
  );
};

const AppointmentLetterTemplate = ({ data }: { data: LetterData }) => {
  const displayType = letterTypeNames[data.templateType] || 'Appointment Letter';
  const displayCompany = companyNames[data.companyName] || data.companyName;
  const isTrainee = data.templateType === 'TRAINEE_APPOINTMENT';

  // ---------------------------------------------------------------------
  // Dynamic pagination
  // ---------------------------------------------------------------------
  // The Offer Letter is a single page, so it only ever needed a font
  // auto-fit. The Appointment Letter is several pages of legal clauses
  // whose exact length depends on the data (names, dates, CTC, trainee vs.
  // regular, etc). The previous version hard-coded which clauses landed on
  // which page, so for real content it regularly ran past the safe content
  // area (843px) and printed straight over the footer — visible in the
  // reported PDFs as clauses cut off mid-sentence with the footer overlaid
  // on top of them, on almost every page.
  //
  // Instead, every logical chunk of the letter is built as a "block"
  // below, measured off-screen (at the same width/font/line-height as the
  // real page content area), then greedily packed onto pages so no single
  // page ever exceeds a safe height. This guarantees the footer never
  // overlaps real content, regardless of how long any given letter's data
  // makes the text.
  const blocks = useMemo(() => {
    const list: { id: string; el: React.ReactNode }[] = [];

    list.push({
      id: 'header',
      el: (
        <>
          <p className="font-bold mb-4">Date: {formatDate(data.date)}</p>

          <div className="font-bold mb-6">
            <p>{data.firstName} {data.lastName}</p>
            {data.addressLine1 && <p>{data.addressLine1}</p>}
            {data.addressLine2 && <p>{data.addressLine2}</p>}
            {(data.cityState || data.pinCode) && (
              <p>{data.cityState}{data.pinCode ? ` – ${data.pinCode}` : ''}</p>
            )}
          </div>

          <div className="text-center font-bold underline mb-6" style={{ textUnderlineOffset: '2px' }}>
            SUB: {displayType.toUpperCase()}
          </div>

          <p className="mb-4">Dear {data.firstName},</p>

          <p className="mb-4">
            We have the pleasure to appoint you, subject to the terms and conditions contained herein, as <strong>{data.designation}</strong> in the <strong>{data.department}</strong> Department at <strong>{displayCompany}</strong> to perform the functions and duties assigned to you as per the general terms, conditions and guidelines applicable to the employees as framed and modified from time to time by the Company.
          </p>
          <p className="mb-4">
            We take this opportunity to congratulate you on your selection and look forward to a long and mutually beneficial association. We trust our relationship will be guided by a quest for excellence in all facets, as well as based on a foundation of mutual respect and sincerity in all dealings.
          </p>
          <p className="mb-4">
            You will be governed by the policies and rules and regulations of the company as applicable, enforced, amended or altered from time to time during employment. Your appointment and employment are also subject to the following special terms and conditions as under.
          </p>
        </>
      )
    });

    list.push({
      id: 'sec1-1.1',
      el: (
        <>
          <SectionTitle num="1" title="POSITION AND LOCATION:" />
          <Clause num="1.1">
            <p className="mb-2">You shall be employed in the position of <strong>{data.designation}</strong> in the <strong>{data.department}</strong> Department at <strong>{data.grade}</strong>.</p>
            <p>Your primary place of work will be <strong>{data.location}</strong>. However, at the sole discretion of the management, you are liable to be transferred/ deputed from one department to another, one section to another and anywhere in India and/or to any of the offices of the management or its affiliates, associates, and /or entities in which the management may have any interest whether existing or which may be set up in future. You will also work, if required, for the management's affiliates/ associates. The 'Salary and Emoluments' mentioned herein cover your services for the management as well as for any of its affiliates and associates.</p>
          </Clause>
        </>
      )
    });

    list.push({
      id: '1.2',
      el: (
        <Clause num="1.2">
          You will be reporting to <strong>{data.reportingManager}</strong>, <strong>{data.reportingManagerDesignation}</strong>. Your reporting is subject to change at the sole discretion of the management.
        </Clause>
      )
    });

    list.push({
      id: '1.3',
      el: (
        <Clause num="1.3">
          The nature of the management's projects/assignments requires that you are flexible in your approach to work in order to service the best of its interests. Accordingly, you agree that the management may, at any time vary your position, scope of duties, and responsibilities, or require you to undertake different duties or change your reporting line in order to take account of the changing needs of the management and your role within it. In any such circumstances, the management will discuss with you any proposed changes and may offer you a new position or altered duties that it considers to be appropriate to your skills and experience at the time of the change.
        </Clause>
      )
    });

    list.push({
      id: 'sec2',
      el: (
        <>
          <SectionTitle num="2" title={isTrainee ? "TRAINING PERIOD AND COMMENCEMENT:" : "COMMENCEMENT OF EMPLOYMENT AND PROBATION PERIOD:"} />
          {isTrainee ? (
            <Clause num="2.1">
              Your training period with the Company will be from <strong>{formatDate(data.trainingStartDate || data.dateOfJoining)}</strong> to <strong>{formatDate(data.trainingEndDate || '')}</strong>.
            </Clause>
          ) : (
            <Clause num="2.1">
              Your period of employment with the Company has begun from <strong>{formatDate(data.dateOfJoining)}</strong> and will be confirmed only pursuant to the expiry of the probation period.
            </Clause>
          )}
        </>
      )
    });

    list.push({
      id: '2.2',
      el: isTrainee ? (
        <Clause num="2.2">
          Following successful completion of your training, your regular employment will commence from <strong>{formatDate(data.dateOfJoining)}</strong>.
        </Clause>
      ) : (
        <Clause num="2.2">
          <p className="mb-2">You will be initially on probation for a period of <strong>6 month(s)</strong> which shall commence from the day you join your services with the management. The same may however be extended further for a period of <strong>3 month(s)</strong>, if so deemed necessary by the management.</p>
          <p>On completion of probation period, either initial or extended, as the case may be, and upon finding your services satisfactory, the management may in its sole discretion confirm your employment with the management, by issuing a letter to the said effect. You will be deemed to be on probation till you receive the letter of confirmation from the Company.</p>
        </Clause>
      )
    });

    list.push({
      id: 'sec3-3.1',
      el: (
        <>
          <SectionTitle num="3" title="GENERAL EMPLOYMENT OBLIGATIONS:" />
          <Clause num="3.1">You shall carry out your duties loyally, diligently and in accordance with the service rules, code of conduct, policies and procedures of the management in force from time to time. You shall always give the management the full benefit of your knowledge, expertise and skills, promote and protect its interests and not knowingly or deliberately do anything that is to its detriment.</Clause>
        </>
      )
    });
    list.push({ id: '3.2', el: <Clause num="3.2">You shall always be governed by the Service Rules/ Employee's Manual/ Policy/Rules and Regulations, of the management and or amended by the management from time to time, which you are required to strictly follow during your employment with the management. If the terms and conditions contained in this appointment Letter conflict with those with Employee Policy/ Rules and regulations as the case may be, of the Company, this appointment Letter shall have precedence as long as the terms and conditions in this appointment Letter are more favorable to you than those in the Employee Policy. You shall also abide by and carry out operational instructions /procedures as contained in the management guidelines and other administrative instructions or as may be issued by the management from time to time.</Clause> });
    list.push({ id: '3.3', el: <Clause num="3.3">You shall attend the office punctually and regularly and you shall devote your entire working time, attention and abilities exclusively to the performance of your duties and shall faithfully serve the management and use your best endeavor to promote the interest and business of the management and further the quality operations of the Company.</Clause> });
    list.push({ id: '3.4', el: <Clause num="3.4">You shall not, without the prior written consent of the Management, be engaged, concerned or interested, either directly or indirectly, in any other trade, business or occupation or employment whatsoever either for remuneration or on an honorary basis during the course of your employment with the Company, provided that this restriction shall not preclude you from purchasing and holding for investment purpose any stocks, debentures or other securities of any public or private company.</Clause> });
    list.push({ id: '3.5', el: <Clause num="3.5">You are required to deal with the Company's funds, materials, and documents with utmost honesty and professional ethics. Should you be found guilty of any act of moral turpitude, dishonesty, theft of information, or misappropriation of Company assets, irrespective of their value, your employment shall be terminated with immediate effect, and appropriate legal or disciplinary action will be initiated against you.</Clause> });
    list.push({ id: '3.6', el: <Clause num="3.6">You will be responsible for the successful and timely completion of any job / work assigned to you. You would adhere to the norms of office discipline. You would also be responsible for ensuring proper and effective adherence to the norms of office discipline including working hours, systems and procedures by the staff / employees associated with you.</Clause> });
    list.push({ id: '3.7', el: <Clause num="3.7">You will not enter into any commitments or dealing on behalf of the Company for which you have no express authority nor alter or be a party to any alteration of any principle or policy of the Company or exceed the authority or discretion vested in you without the previous sanction of the Company or those in authority over you.</Clause> });

    list.push({
      id: 'sec4-4.1',
      el: (
        <>
          <SectionTitle num="4" title="SALARY AND EXPENSES:" />
          <Clause num="4.1">Your annual CTC shall be <strong>Rs. {data.ctc}/- ({numberToWords(Number(data.ctc))} Rupees Only)</strong>, inclusive of statutory contributions and subject to deductions such as withholding taxes. The detailed breakup of your CTC and other applicable benefits is provided in Annexure A.</Clause>
        </>
      )
    });
    list.push({ id: '4.2', el: <Clause num="4.2">You shall be paid or reimbursed for all reasonable out-of-pocket expenses incurred by you in the course of your employment, in connection with the performance of your duties, in accordance with the Company's policy.</Clause> });
    list.push({ id: '4.3', el: <Clause num="4.3"><strong>Your remuneration package is confidential and should not be shared with anyone except HR Process Owner. Any violation of this policy will result in serious action and may lead to termination of your employment.</strong></Clause> });

    list.push({
      id: 'sec5',
      el: (
        <>
          <SectionTitle num="5" title="LEAVE:" />
          <div className="ml-[25px]">
            You shall be entitled to <strong>15</strong> Earned leaves, and <strong>12</strong> Casual leaves annually.
          </div>
        </>
      )
    });

    list.push({
      id: 'sec6',
      el: (
        <>
          <SectionTitle num="6" title="RETIREMENT:" />
          <div className="ml-[25px]">
            You shall retire on attaining the age of <strong>{data.superannuationAge || 58}</strong> years unless specifically required by the management in writing to continue in service thereafter. Your employment shall stand terminated on the date of your retirement.
          </div>
        </>
      )
    });

    list.push({
      id: 'sec7-7.1',
      el: (
        <>
          <SectionTitle num="7" title="EMPLOYMENT TERMS:" />
          <Clause num="7.1">
            <strong>PROBATION</strong><br/>
            Your employment will commence with a probation period of six (6) months, during which your performance, conduct, and overall suitability for the role will be assessed by your Reporting Manager, Immediate Seniors, and other members of the Management.
          </Clause>
        </>
      )
    });
    list.push({ id: '7.2', el: (
      <Clause num="7.2">
        <strong>EXTENSION OF PROBATION:</strong><br/>
        The Management reserves the right to extend the probation period by an additional three (3) or six (6) months, based on your performance evaluation, at its sole discretion.
      </Clause>
    )});
    list.push({ id: '7.3', el: (
      <Clause num="7.3">
        <strong>TERMINATION/RESIGNATION DURING PROBATION:</strong><br/>
        During the probation period, either party may terminate the employment by providing seven (7) days' written notice. The Company may, at its discretion, provide seven (7) days' salary in lieu of notice. However, in the case of resignation by the employee, serving the mandatory notice period of seven (7) days is compulsory, and payment in lieu of notice shall not be permissible.
      </Clause>
    )});
    list.push({ id: '7.4', el: (
      <Clause num="7.4">
        <strong>FULL & FINAL SETTLEMENT:</strong><br/>
        Your full and final settlement will be subject to:
        <ol className="list-[lower-alpha] ml-6 mt-1 space-y-1">
          <li>Proper handover of ongoing assignments and responsibilities, and</li>
          <li>Return of all company assets and materials, including but not limited to laptop, mobile phone, ID card, access cards, documents, and confidential data, in good and acceptable condition, to the person designated by the Management.</li>
          <li>Failure to comply may result in the withholding of dues and/or legal recovery of the assets or their monetary equivalent.</li>
        </ol>
      </Clause>
    )});
    list.push({ id: '7.5', el: (
      <Clause num="7.5">
        <strong>ASSET UNDERTAKING:</strong><br/>
        At the time of joining, you will be required to sign an undertaking acknowledging receipt of company property and committing to return the same upon cessation of employment, whether during or after the probation period. Unauthorized retention, damage, or misuse of company assets or confidential information will result in disciplinary action and may lead to legal proceedings for recovery.
      </Clause>
    )});
    list.push({ id: '7.6', el: (
      <Clause num="7.6">
        <strong>POST-CONFIRMATION TERMINATION/RESIGNATION:</strong><br/>
        Upon confirmation of your employment, either party may terminate the employment by providing one (1) month's written notice, or payment of salary in lieu thereof, equivalent to one (1) month's gross salary.
      </Clause>
    )});

    list.push({
      id: 'sec8-8.1',
      el: (
        <>
          <SectionTitle num="8" title="CONFIDENTIALITY:" />
          <Clause num="8.1">During the course of employment and after cessation of employment you shall maintain the secrecy of the confidential information and shall not disclose or divulge the confidential information to any person or persons.</Clause>
        </>
      )
    });
    list.push({ id: '8.2', el: <Clause num="8.2">Intellectual property rights such as copyright, trademark, patent etc. with respect to any invention, design, including solutions you may develop while in the employment of the management shall remain the exclusive ownership of the company and you shall have no right title or interest therein.</Clause> });
    list.push({ id: '8.3', el: <Clause num="8.3">Any information or data made available to you by the company and any information, design, effected in the course of your employment will belong to the company and you would keep them in strict confidence and will not use them to the detriment of the interest of the company.</Clause> });
    list.push({ id: '8.4', el: <Clause num="8.4">You will treat all client information including information connected with business, financial, customer list, marketing data and other related information strictly confidential.</Clause> });
    list.push({ id: '8.5', el: <Clause num="8.5">During the period of employment and thereafter you are forbidden by word of mouth or otherwise divulge to any person information detriment to the interest of the company, nor take away with you at the time of termination any accounts, information, records, statistics, blue print, security arrangement, administrative and /or organization matters, whether confidential secrets or otherwise, or any other documents related to the business of the company without obtaining the company's written sanction.</Clause> });
    list.push({ id: '8.6', el: <Clause num="8.6">You are aware that your obligation related to confidentiality survives the tenure of your employment. You will be liable to pay damages and be subjected to injunctive or other reliefs for any breach of this obligation.</Clause> });

    list.push({
      id: 'sec9-9.1',
      el: (
        <>
          <SectionTitle num="9" title="NON-COMPETE" />
          <Clause num="9.1">You shall not directly or indirectly compete with the business of the Company and its successors, associates, associated company(s), affiliates and assigns during the period of your employment with the Company and for a period of Three (3) years following the end of your employment including termination of your employment and notwithstanding the cause or reason for termination.</Clause>
        </>
      )
    });
    list.push({ id: '9.2', el: <Clause num="9.2">The term "non-compete" as used herein shall mean that you shall not own, manage, operate, consult or be employed in a business substantially similar to or competitive with the present business of the Company or such other business activities in which the Company may substantially remain engaged during the term of employment.</Clause> });
    list.push({ id: '9.3', el: <Clause num="9.3">You acknowledge and agree that the Company shall or may in reliance of this understanding provide you access to its trade secrets, customers, other confidential data and good will. However, you shall retain said information as confidential and not use said information for your own behalf or disclose same to any third party, whatsoever.</Clause> });

    list.push({
      id: 'sec10-10.1',
      el: (
        <>
          <SectionTitle num="10" title="NON-SOLICITATION" />
          <Clause num="10.1">You undertake and agree that during the Term, and for a period of 01 (one) year thereafter, you will not, except with the prior written consent of the Company, directly or indirectly; attempt in any manner to solicit business from (a) any current or potential customer/ client of the Company or any of the Group Companies, or (b) any firm, association or corporation or other entity, which you contacted or otherwise dealt with on behalf of the Company.</Clause>
        </>
      )
    });
    list.push({ id: '10.2', el: <Clause num="10.2">You acknowledge that you will not attempt to persuade any person, firm or entity, which is a current or potential customer/client of the Company to cease doing business or to reduce the amount of business which any such client/investor has customarily done or might propose doing with the Company or any of the Group Companies.</Clause> });
    list.push({ id: '10.3', el: <Clause num="10.3">You acknowledge that you will not employ, solicit, incite, canvass or attempt to employ or assist anyone else to employ any person who is in the employment of the Company or any of the Group Companies (including any person who was an employee at any time during the preceding six calendar months). Further, you shall not solicit, incite or in any other way encourage other employees of the Company or any of the Group Companies to terminate their respective contracts of employment with the Company.</Clause> });

    list.push({
      id: 'sec11',
      el: (
        <>
          <SectionTitle num="11" title="RESTRICTED CONVENANTS:" />
          <div className="ml-[25px]">
            You will not take up employment in any form or manner including consultancy with the company's competitor for a period of 2 years immediately from the date of cessation of the employment of the company for whatever reason.
          </div>
        </>
      )
    });

    list.push({
      id: 'sec12',
      el: (
        <>
          <SectionTitle num="12" title="CONFLICT OF INTEREST:" />
          <div className="ml-[25px]">
            The Company follows a conflict of interest policy (the "Conflict Policy") in respect of its employees. The Conflict Policy is intended to avoid conflict of interest between the personal interest of an employee and that of the management or its affiliates in its dealings with third parties. You will be bound by the Conflict Policy of the management during your employment and honor the same at all times.
          </div>
        </>
      )
    });

    list.push({
      id: 'sec13',
      el: (
        <>
          <SectionTitle num="13" title="CONTINUING OBLIGATIONS:" />
          <div className="ml-[25px]">
            The termination of your employment will not affect the rights and remedies of either party against the other in respect of any previous breach of its provisions nor will it affect the continuing obligations of either party under any provision of your employment terms which may be applicable after your employment has been terminated.
          </div>
        </>
      )
    });

    list.push({
      id: 'sec14',
      el: (
        <>
          <SectionTitle num="14" title="NOTICES:" />
          <div className="ml-[25px]">
            All notices and other communications relating to your employment will take effect if posted, upon delivery, when a complete and legible copy of the communication has been received. The communication may also be sent by way of e-mail. The name, title, address, telephone number and the email ID of the designated recipient shall be as per the Company records. If posted by employee to the Management, the same should be addressed to the Head - HR of the Company.
          </div>
        </>
      )
    });

    list.push({
      id: 'sec15-15.1',
      el: (
        <>
          <SectionTitle num="15" title="CONTINUATION OF EMPLOYMENT:" />
          <Clause num="15.1">It is understood that this employment is being offered to you on the basis of the particulars submitted by you with the management at the time of recruitment process. However, if at any time it should emerge that the particulars furnished by you are false/incorrect or if any material or relevant information has been suppressed or concealed, this appointment will be considered ineffective and irregular and would be liable to be terminated by the management forthwith, without notice. This will be without prejudice to the right of the management to take disciplinary action against you for the same.</Clause>
        </>
      )
    });
    list.push({ id: '15.2', el: <Clause num="15.2">Your appointment and its continuation is subject to your being medically fit and the Management reserves its right to ask you to undergo medical examination, as per the policy of the management.</Clause> });

    list.push({
      id: 'sec16-16.1',
      el: (
        <>
          <SectionTitle num="16" title="DISPUTE RESOLUTION" />
          <Clause num="16.1">Any dispute, controversy or claim arising out of or in relation to this employment agreement or the breach, termination or invalidity thereof, if the same cannot be settled amicably among the concerned parties hereto, shall be settled by final and binding arbitration in accordance with the Arbitration and Conciliation Act, 1996, by Sole Arbitrator appointed by the Director of the Company. The venue of arbitration proceedings shall be at New Delhi. The language of Arbitration shall be in English.</Clause>
        </>
      )
    });
    list.push({ id: '16.2', el: <Clause num="16.2">Pending the resolution of a dispute by arbitration, the Parties shall, except in the event of termination, continue to perform all their obligations under this employment agreement without prejudice to a final adjudication in accordance with the arbitral award.</Clause> });

    list.push({
      id: 'sec17-17.1',
      el: (
        <>
          <SectionTitle num="17" title="MISCELLANEOUS:" />
          <Clause num="17.1">The terms of this Appointment Letter constitute the entire agreement between you and the management and no variation or addition to this Appointment Letter and no waiver of any provision in it will be effective unless made in writing and signed by both parties.</Clause>
        </>
      )
    });
    list.push({ id: '17.2', el: <Clause num="17.2">You shall be governed by the policy framed, any instructions or circulars issued by the Company from time to time.</Clause> });
    list.push({ id: '17.3', el: <Clause num="17.3">Your employment on the above terms and conditions is subject to receiving a satisfactory reference check in connection with your past record. If a negative reference check is received at any point of time, during your probation period, the company reserves the right to terminate your employment forthwith.</Clause> });

    list.push({
      id: 'closing',
      el: (
        <>
          <p className="mt-4 mb-4">This letter is being sent to you in duplicate. If you accept the terms above mentioned, please sign the declaration in the duplicate and send us the duplicate for our records. The original is for retention by you.</p>

          <p className="mb-6">We welcome you as a member of our organization and look forward to years of useful contribution.</p>

          <p className="mb-4">Yours Sincerely,</p>
          <p className="font-bold mb-4">For {displayCompany}</p>
          {data.digitalSignature ? (
            <img src={data.digitalSignature} alt="Signature" className="h-16 object-contain mix-blend-multiply" />
          ) : (
            <div className="h-16 w-32"></div>
          )}
          <p className="font-bold">Chandrika Gupta</p>
          <p className="font-bold">General Manager-HR</p>

          <div className="border-t border-black pt-4 mt-6">
            <p className="font-bold underline mb-4" style={{ textUnderlineOffset: '2px' }}>Declaration:</p>
            <p className="mb-8">I hereby accept employment on the terms above mentioned which has been read and understood by me. The original of this is in my possession.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-6">Signature <span className="ml-4">:</span> ______________________</p>
                <p>Name in full <span className="ml-2">:</span> ______________________</p>
              </div>
            </div>
          </div>
        </>
      )
    });

    return list;
  }, [data, displayType, displayCompany, isTrainee]);

  // ---------------------------------------------------------------------
  // Pagination (rewritten for correctness)
  // ---------------------------------------------------------------------
  // Earlier versions measured a separate, hidden copy of the blocks to
  // decide where to break pages. Even after matching that hidden copy's
  // classes/context to the real page, this remained one extra layer of
  // indirection that could drift from what's actually rendered.
  //
  // This version measures the REAL blocks directly: every block's height
  // depends only on its own content and the fixed page width — never on
  // which page it ends up on — so we can render all blocks once (in any
  // rough grouping), measure their true rendered heights via refs, then
  // immediately compute the correct page groups and re-render. Because
  // useLayoutEffect runs before the browser paints, this correction
  // happens before the user ever sees the rough first pass. Since a
  // block's height can't change between passes, this converges in a
  // single measure-and-fix cycle — no hidden clones, no context to drift.
  const [pageGroups, setPageGroups] = useState<number[][]>(() => [blocks.map((_, i) => i)]);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const paginatedRef = useRef(false);

  // Remeasure whenever the letter's content changes.
  useEffect(() => {
    setPageGroups([blocks.map((_, i) => i)]);
    paginatedRef.current = false;
  }, [blocks]);

  useLayoutEffect(() => {
    if (paginatedRef.current) return;

    const SAFE_PAGE_HEIGHT = 870; // buffer kept clear above the footer band

    const heights = blocks.map((_, i) => blockRefs.current[i]?.getBoundingClientRect().height ?? 0);

    const groups: number[][] = [];
    let current: number[] = [];
    let currentHeight = 0;

    heights.forEach((h, i) => {
      if (current.length > 0 && currentHeight + h > SAFE_PAGE_HEIGHT) {
        groups.push(current);
        current = [];
        currentHeight = 0;
      }
      current.push(i);
      currentHeight += h;
    });
    if (current.length > 0) groups.push(current);

    paginatedRef.current = true;
    setPageGroups(groups.length > 0 ? groups : [blocks.map((_, i) => i)]);
  }, [pageGroups, blocks]);

  return (
    <>
      {pageGroups.map((indices, pageIdx) => (
        <A4Page key={pageIdx} companyName={data.companyName}>
          {indices.map(i => (
            <div key={blocks[i].id} ref={el => { blockRefs.current[i] = el; }}>
              {blocks[i].el}
            </div>
          ))}
        </A4Page>
      ))}
    </>
  );
};

export default function LetterPreviewRender({ data, isPreview = false }: { data: LetterData, isPreview?: boolean }) {
  const renderTemplate = () => {
    if (data.templateType.includes('OFFER')) {
      return (
        <div id="letter-pdf-content" className={isPreview ? 'flex justify-center my-4' : ''}>
          <OfferLetterTemplate data={data} />
        </div>
      );
    }
    
    if (data.templateType.includes('APPOINTMENT')) {
      return (
        <div id="letter-pdf-content" className={isPreview ? 'flex flex-col items-center my-4 space-y-4 bg-gray-100 p-8 rounded-lg' : ''}>
          <AppointmentLetterTemplate data={data} />
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded my-4">
        <strong>Template not found for:</strong> {data.templateType}
      </div>
    );
  };

  return renderTemplate();
}