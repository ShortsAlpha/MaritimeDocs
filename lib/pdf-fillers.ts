import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

export const TemplateFillers: Record<string, (pdfDoc: PDFDocument, student: any, course: any) => Promise<void>> = {
    "stcw-basic-safety": async (pdfDoc, student, course) => {
        // Register fontkit
        pdfDoc.registerFontkit(fontkit);

        // Update PDF Metadata to override original PowerPoint export name
        pdfDoc.setTitle(`${student.fullName} - STCW Basic Safety Training`);
        pdfDoc.setAuthor("Xone Superyacht Academy");
        pdfDoc.setSubject("Certificate of Proficiency");

        // Load local fonts
        const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
        const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

        const regularBytes = fs.readFileSync(fontRegularPath);
        const boldBytes = fs.readFileSync(fontBoldPath);

        const fontRegular = await pdfDoc.embedFont(regularBytes);
        const fontBold = await pdfDoc.embedFont(boldBytes);

        const pages = pdfDoc.getPages();
        let pageCount = 1;

        // Define abbreviations for each page (1-indexed mapping implicitly based on loop iteration)
        const COURSE_PREFIXES = ["PST", "FF", "PSSR", "FA", "SA"];

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
            // Use the globally generated M-YY suffix and array prefix for this page
            const seqSuffix = student.studentNumber || `M26${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
            const prefix = COURSE_PREFIXES[pageCount - 1] || "STCW";
            const certNo = `${prefix}-${seqSuffix}`;

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

            // Exactly 5 Years expiry printed ONLY on page 1 and page 2
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
            const dobStr = student.dateOfBirth ? format(new Date(student.dateOfBirth), 'dd.MM.yyyy') : "N/A";
            const passStr = student.passportNumber || student.tcNo || "N/A";

            // Initial positions (Page 1)
            let dobX = width / 2 - 40;
            let dobY = height - 344;

            let passX = width / 2 + 185;
            let passY = height - 344;

            // =========================================================================
            // SAYFA SAYFA PIXEL AYARLAMA BÖLÜMÜ / PIXEL ADJUSTMENT PER PAGE
            // X ekseni (Sağ ve Sol): Sayıyı büyütürseniz (+) SAĞA kayar, küçültürseniz (-) SOLA kayar.
            // Y ekseni (Aşağı ve Yukarı): Sayıyı büyütürseniz (+) YUKARI kayar, küçültürseniz (-) AŞAĞI kayar.
            // =========================================================================
            if (pageCount === 1) {
                // 1. Sayfa ayarları (gerekirse buraya ekleyebilirsiniz)
                // dobX += 0;
                // dobY += 0;
            } else if (pageCount === 2) {
                dobX -= 10;
                dobY -= 2;
                passX -= 45;
                passY -= 2;
            } else if (pageCount === 3) {
                dobX -= 17;
                dobY -= 0;
                passX -= 50;
            } else if (pageCount === 4) {
                dobX -= 20;
                dobY += 4;
                passX -= 35;
                passY += 4;
            } else if (pageCount === 5) {
                dobX -= 8;
                passX -= 30;
            }
            // =========================================================================

            page.drawText(dobStr, {
                x: dobX,
                y: dobY,
                size: 12,
                font: fontRegular,
                color: textColor,
            });

            page.drawText(passStr, {
                x: passX,
                y: passY,
                size: 12,
                font: fontRegular,
                color: textColor,
            });

            pageCount++;
        }
    }
};
