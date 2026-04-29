export interface PdfTemplateDef {
    id: string;
    title: string;
    type: "pdf" | "docx";
    description?: string;
    r2Key?: string;      // Used for PDF
    localFile?: string;  // Used for DOCX in public/templates/
    docRegulations?: string; // Used for DOCX injections
    validate: (student: any) => string[];
}

export const CourseTemplateRegistry: Record<string, PdfTemplateDef> = {
    "stcw basic safety training certificate": {
        id: "stcw-basic-safety",
        title: "STCW Basic Safety Training Certificate",
        type: "pdf",
        r2Key: "certificate-templates/STCW certificate template.pdf",
        validate: (student: any) => {
            const errors: string[] = [];
            if (!student.fullName) errors.push("Full Name is missing.");
            if (!student.dateOfBirth) errors.push("Date of Birth is missing.");
            if (!student.nationality) errors.push("Nationality is missing.");
            if (!student.passportNumber) errors.push("Passport Number is missing.");
            if (!student.certificateIssueDate) errors.push("Certificate Issue Date is missing.");
            return errors;
        }
    },
    "proficiency in medical care": {
        id: "medical-first-aid",
        title: "Proficiency in Medical First Aid – IMO Model 1.14",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "STCW 1978 / 2010 as amended. Code A VI-4 – 4.1 IMO Model course 1.14",
        validate: () => []
    },
    "efficient deck hand course": {
        id: "efficient-deck-hand",
        title: "Efficient Deck Hand – E.D.H.",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "Merchant Shipping Directorate of the Authority for Transport in Malta\nSubsidiary Legislation 234.17 Merchant Shipping (Training and Certification) Regulations 1 st July, 2013*\nLegal Notice 153 Of 2013.",
        validate: () => []
    },
    "proficiency in advanced fire fighting": {
        id: "advanced-fire-fighting",
        title: "Advanced Fire Fighting – IMO Model 2.03",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "STCW 1978 / 2010 as amended Code A VI/3 IMO Model course 2.03",
        validate: () => []
    },
    "leadership and teamwork helm": {
        id: "leadership-teamwork",
        title: "Leadership and Teamwork (Operational)",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "STCW 1978 / 2010 as amended. Code A-II/1, A-III/1",
        validate: () => []
    },
    "gmdss general operators certificate": {
        id: "gmdss-goc",
        title: "General Operator’s Certificate for the GMDSS Training",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "Maltese Radiocommunications Regulations (Subsidiary Legislation 399.35\nRadio Regulations 2012\nSection  A-IV/2 of the STCW code",
        validate: () => []
    },
    "radar arpa operational": {
        id: "radar-arpa",
        title: "RADAR Plotting and Navigation / Use of ARPA– IMO Model 1.07",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "RADAR Plotting and Navigation / Use of ARPA Operational Level – IMO Model 1.07",
        validate: () => []
    },
    "ecdis electronic chart display": {
        id: "ecdis",
        title: "Operational use of Electronic Chart Display System (ECDIS) – IMO Model 1.27",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "STCW 1995 / 2010 as amended Section A-II/1 Reg.II/1,II/2, II/3, IMO Model course 1.27",
        validate: () => []
    },
    "proficiency in survival craft and rescue boats": {
        id: "survival-craft",
        title: "Proficiency in Survival Craft and Rescue Boats other than Fast Rescue Boats",
        type: "docx",
        localFile: "5.Medical First Aid -Craig Dalgleish (7).docx",
        docRegulations: "STCW 1978 / 2010 as amended, in accordance with sec. A-VI/2.1",
        validate: () => []
    },
    "master of yacht": {
        id: "master-of-yacht-200gt",
        title: "Master of Yachts Limited 200 Ton Power Practical Course & Examination",
        type: "docx",
        localFile: "IYT 200GT Temporary LMPW Certificate (2).docx",
        docRegulations: "",
        validate: () => []
    }
};

/** Gets template definition by course title (fuzzy match) */
export function getTemplateForCourse(courseTitle: string): PdfTemplateDef | null {
    if (!courseTitle) return null;
    const key = courseTitle.trim().toLowerCase();
    
    // Direct match
    if (CourseTemplateRegistry[key]) return CourseTemplateRegistry[key];
    
    // Partial Match
    // Partial Match logic improved
    const normalizedKey = key.replace(/[^a-z0-9]/g, '');
    const match = Object.keys(CourseTemplateRegistry).find(regKey => {
        const cleanRegKey = regKey.replace(/[^a-z0-9]/g, '');
        return normalizedKey.includes(cleanRegKey) || cleanRegKey.includes(normalizedKey);
    });

    return match ? CourseTemplateRegistry[match] : null;
}
