import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format, isValid } from 'date-fns';
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
        const COURSE_PREFIXES = ["PST", "FF", "FA", "PSSR", "SA"];

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

            if (student.certificateIssueDate && isValid(new Date(student.certificateIssueDate))) {
                page.drawText(format(new Date(student.certificateIssueDate), 'dd MMM yyyy'), {
                    x: width - 120,
                    y: height - 113,
                    size: 10,
                    font: fontRegular,
                    color: blackColor,
                });
            }

            // Exactly 5 Years expiry printed ONLY on page 1 and page 2
            if (pageCount <= 2 && student.certificateExpiryDate && isValid(new Date(student.certificateExpiryDate))) {
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
            let nameSize = 24;
            let nameWidth = fontBold.widthOfTextAtSize(studentName, nameSize);
            
            // Auto-scale font size down if the name is too long and might overlap the left orange seal
            const maxNameWidth = 340;
            while (nameWidth > maxNameWidth && nameSize > 10) {
                nameSize -= 0.5;
                nameWidth = fontBold.widthOfTextAtSize(studentName, nameSize);
            }

            page.drawText(studentName, {
                x: (width / 2) - (nameWidth / 2) + 40,
                y: height - 305,
                size: nameSize,
                font: fontBold,
                color: rgb(0.95, 0.55, 0.1),
            });

            // 4. DOB and Passport
            const dobDate = student.dateOfBirth ? new Date(student.dateOfBirth) : null;
            const dobStr = (dobDate && isValid(dobDate)) ? format(dobDate, 'dd.MM.yyyy') : "N/A";
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
    },
    
    "universal": async (pdfDoc, student, course) => {
        // Embed standard fonts to exactly match the prior mapping script
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
        const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        pdfDoc.setTitle(`${student.fullName} - ${course.title}`)
        pdfDoc.setAuthor("Xone Superyacht Academy")

        const pages = pdfDoc.getPages()
        if (pages.length === 0) return
        const page = pages[0]
        const { width, height } = page.getSize()

        const white = rgb(1, 1, 1)
        const black = rgb(0, 0, 0)
        
        // --- 1. Certificate Number ---
        // Wipe old - Lowered the box more to completely catch the bottom half of the old string.
        page.drawRectangle({ x: 340, y: height - 160, width: 205, height: 25, color: white })
        // Write new
        const certStr = `Certificate Number : ${course.certNo || "N/A"}`
        const certSize = 9
        const certWidth = helveticaBold.widthOfTextAtSize(certStr, certSize)
        page.drawText(certStr, {
            x: width - certWidth - 55, // right aligned roughly to match the old position
            y: height - 152, // Lowered exactly to match the old text's y-baseline
            size: certSize,
            font: helveticaBold,
            color: black
        })

        // --- 2. Big Course Title ---
        page.drawRectangle({
            x: 55, 
            y: height - 258, // Moved down 2 points to cover the stray dot
            width: width - 110, 
            height: 24, // Increased height to preserve top coverage
            color: white, 
        });

        const titleStr = (course.title || "UNKNOWN COURSE").toUpperCase()
        const titleSize = 14
        const titleWidth = helveticaBold.widthOfTextAtSize(titleStr, titleSize)
        page.drawText(titleStr, {
            x: (width - titleWidth) / 2, // centered
            y: height - 251,
            size: titleSize,
            font: helveticaBold,
            color: black
        })

        // --- 3. Student Info Block ---
        // Wipe John Doe, Date, ID
        page.drawRectangle({
            x: 182,
            y: height - 410,
            width: 260,
            height: 75,
            color: white, 
        });
        
        const dobDate = student.dateOfBirth ? new Date(student.dateOfBirth) : null;
        const dobStr = (dobDate && isValid(dobDate)) ? format(dobDate, 'dd.MM.yyyy') : "N/A"
        const idStr = student.passportNumber || student.tcNo || "N/A"
        
        page.drawText(`: ${student.fullName.toUpperCase()}`, { x: 185, y: height - 347, size: 10, font: helvetica, color: black })
        page.drawText(`: ${dobStr}`, { x: 185, y: height - 362, size: 10, font: helvetica, color: black })
        page.drawText(`: ${idStr}`, { x: 185, y: height - 377, size: 10, font: helvetica, color: black })

        // --- 4. Inline Paragraph Course Title ---
        // Wipe the entire paragraph area
        page.drawRectangle({
            x: 50, 
            y: height - 465, 
            width: width - 100, 
            height: 75, 
            color: white,
        });

        const paragraphParts = [
            { text: 'Has successfully completed training of ""', font: timesItalic },
            { text: titleStr, font: timesBoldItalic },
            { text: '"" at Xone Superyacht Academy, approved by the Merchant Shipping Directorate of the Authority for Transport in Malta as meeting the requirements laid down in', font: timesItalic }
        ];

        const pFontSize = 10;
        const pStartX = 55;
        const pMaxWidth = width - 110;
        let pCurrentX = pStartX;
        let pCurrentY = height - 405; 
        const pLineHeight = 14;

        for (const part of paragraphParts) {
            const spaceWidth = part.font.widthOfTextAtSize(' ', pFontSize);
            const words = part.text.split(' ');
            
            for (let i = 0; i < words.length; i++) {
                if (words[i] === '') continue;

                const word = words[i];
                const wordWidth = part.font.widthOfTextAtSize(word, pFontSize);
                const needsSpace = i < words.length - 1;
                const advanceWidth = wordWidth + (needsSpace ? spaceWidth : 0);
                
                if (pCurrentX + wordWidth > pStartX + pMaxWidth) {
                    pCurrentX = pStartX;
                    pCurrentY -= pLineHeight;
                }
                
                page.drawText(word, {
                    x: pCurrentX,
                    y: pCurrentY,
                    font: part.font,
                    size: pFontSize,
                    color: black,
                });
                
                pCurrentX += advanceWidth;
            }
        }

        // --- 4b. Wipe STCW 1978 Line ---
        page.drawRectangle({
            x: 100, 
            y: 315, 
            width: 400, 
            height: 40, 
            color: white,
        });

        // --- 5. Instructor Block (Left) ---
        page.drawRectangle({
            x: 45,
            y: 150,
            width: 260,
            height: 140, // Top equals 290
            color: white,
        });

        const leftLabelX = 55;
        const leftValueX = 120;
        const leftStartY = 275;
        const lSpacing = 14;
        
        page.drawText("Principal (or Authorised Representative)", { x: leftLabelX, y: leftStartY, size: 10, font: helvetica, color: black })
        page.drawText("Name", { x: leftLabelX, y: leftStartY - lSpacing, size: 10, font: helvetica, color: black })
        
        const instructorStr = course.instructorName || "INSTRUCTOR NAME"
        page.drawText(`: ${instructorStr.toUpperCase()}`, { x: leftValueX, y: leftStartY - lSpacing, size: 10, font: helvetica, color: black })
        
        const todayStr = format(new Date(), 'dd.MM.yyyy')
        page.drawText("Date", { x: leftLabelX, y: leftStartY - 2 * lSpacing, size: 10, font: helvetica, color: black })
        page.drawText(`: ${todayStr}`, { x: leftValueX, y: leftStartY - 2 * lSpacing, size: 10, font: helvetica, color: black })
        
        page.drawText("Signature", { x: leftLabelX, y: leftStartY - 3 * lSpacing, size: 10, font: helvetica, color: black })
        page.drawText(":", { x: leftValueX, y: leftStartY - 3 * lSpacing, size: 10, font: helvetica, color: black })

        // --- 6. Right Date ---
        page.drawRectangle({
            x: 378,
            y: 245,
            width: 52, 
            height: 10,
            color: white, 
        });

        page.drawText(todayStr, {
            x: 379,
            y: 246,
            size: 10,
            font: helvetica,
            color: black,
        });

        // --- 7. Bottom Address Wipe & Rewrite ---
        const footerL1 = "Xone Superyacht Academy Skyway Offices, Block C Number 2, 179 Marina Street, Pieta, Malta, PTA 9042";
        const footerL2 = "+9901 4901 malta@xoneyacht.com";
        const f1W = helvetica.widthOfTextAtSize(footerL1, 8);
        const f2W = helvetica.widthOfTextAtSize(footerL2, 8);
        const darkGray = rgb(0.2, 0.2, 0.2);
        
        // Wipe exactly the width of the text so it doesn't bleed into the blue frame
        page.drawRectangle({
            x: (width - f1W) / 2 - 10,
            y: 94,
            width: f1W + 20, 
            height: 30,
            color: white,
        });

        page.drawText(footerL1, { x: (width - f1W) / 2, y: 112, size: 8, font: helvetica, color: darkGray });
        page.drawText(footerL2, { x: (width - f2W) / 2, y: 100, size: 8, font: helvetica, color: darkGray });
    }
};
