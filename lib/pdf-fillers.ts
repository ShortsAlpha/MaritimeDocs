import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

export const TemplateFillers: Record<string, (pdfDoc: PDFDocument, student: any, course: any) => Promise<void>> = {
    "stcw-basic-safety": async (pdfDoc, student, course) => {
        // Register fontkit
        pdfDoc.registerFontkit(fontkit);

        // Load local fonts
        const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
        const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
        
        const regularBytes = fs.readFileSync(fontRegularPath);
        const boldBytes = fs.readFileSync(fontBoldPath);
        
        const fontRegular = await pdfDoc.embedFont(regularBytes);
        const fontBold = await pdfDoc.embedFont(boldBytes);
        
        const pages = pdfDoc.getPages();
        let pageCount = 1;

        for (const page of pages) {
            const { width, height } = page.getSize();
            const textColor = rgb(0.3, 0.3, 0.3);
            const blackColor = rgb(0, 0, 0);

            // 1. Approval No (Inside orange badge on the left)
            const approvalText = "MI-283 12.05.22"; // Hardcoded for STCW
            const approvalWidth = fontBold.widthOfTextAtSize(approvalText, 11);
            page.drawText(approvalText, {
                x: 185 - (approvalWidth / 2),
                y: height - 320,
                size: 11,
                font: fontBold,
                color: rgb(1, 1, 1),
            });

            // 2. Top Right Fields
            const certNo = student.studentNumber || `STCW-${Math.floor(Math.random() * 100000)}`;
            page.drawText(certNo, {
                x: width - 120,
                y: height - 98,
                size: 10,
                font: fontRegular,
                color: blackColor,
            });

            if (student.certificateIssueDate) {
                page.drawText(format(new Date(student.certificateIssueDate), 'dd MMM yyyy'), {
                    x: width - 120,
                    y: height - 113,
                    size: 10,
                    font: fontRegular,
                    color: blackColor,
                });
            }

            if (pageCount <= 2 && student.certificateExpiryDate) {
                page.drawText(format(new Date(student.certificateExpiryDate), 'dd MMM yyyy'), {
                    x: width - 120,
                    y: height - 128,
                    size: 10,
                    font: fontRegular,
                    color: blackColor,
                });
            }

            // 3. Student Name (Big, Orange, Centered)
            const studentName = student.fullName.toUpperCase();
            const nameSize = 24;
            const nameWidth = fontBold.widthOfTextAtSize(studentName, nameSize);
            page.drawText(studentName, {
                x: (width / 2) - (nameWidth / 2) + 40,
                y: height - 305,
                size: nameSize,
                font: fontBold,
                color: rgb(0.95, 0.55, 0.1),
            });

            // 4. DOB and Passport
            const dobStr = student.dateOfBirth ? format(new Date(student.dateOfBirth), 'dd MMM yyyy') : "N/A";
            const passStr = student.passportNumber || student.tcNo || "N/A";

            let dobX = width / 2 - 40;
            let passX = width / 2 + 185;

            // Apply page-specific offsets
            if (pageCount === 2) {
                dobX -= 5;
                passX -= 20;
            } else if (pageCount === 3) {
                dobX += 10;
                passX -= 55;
            } else if (pageCount === 4) {
                dobX -= 15;
                passX -= 35;
            } else if (pageCount === 5) {
                dobX -= 0;
                passX -= 35;
            }

            page.drawText(dobStr, {
                x: dobX,
                y: height - 344,
                size: 12,
                font: fontRegular,
                color: textColor,
            });

            page.drawText(passStr, {
                x: passX,
                y: height - 344,
                size: 12,
                font: fontRegular,
                color: textColor,
            });

            pageCount++;
        }
    }
};
