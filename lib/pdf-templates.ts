export interface PdfTemplateDef {
    id: string;
    title: string;
    description?: string;
    r2Key: string; 
    validate: (student: any) => string[];
}

export const CourseTemplateRegistry: Record<string, PdfTemplateDef> = {
    "stcw basic safety training certificate": {
        id: "stcw-basic-safety",
        title: "STCW Basic Safety Training Certificate",
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
    }
    // ... add more courses here
};

/** Gets template definition by course title (fuzzy match) */
export function getTemplateForCourse(courseTitle: string): PdfTemplateDef | null {
    if (!courseTitle) return null;
    const key = courseTitle.trim().toLowerCase();
    
    // Direct match
    if (CourseTemplateRegistry[key]) return CourseTemplateRegistry[key];
    
    // Partial Match
    const match = Object.keys(CourseTemplateRegistry).find(regKey => 
        key.includes(regKey) || regKey.includes(key)
    );

    return match ? CourseTemplateRegistry[match] : null;
}
