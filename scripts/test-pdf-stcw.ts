import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("Loading local STCW template...");
    const templatePath = path.resolve(process.cwd(), "STCW certificate template.pdf");
    const byteArray = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(byteArray);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();

    // We assume the page is Landscape A4: ~ 841.89 x 595.28

    let pageCount = 1;
    for (const page of pages) {
        const { width, height } = page.getSize();

        // 1. Approval No (Inside orange badge on the left)
        const approvalText = "MI-283 12.05.22";
        const approvalWidth = helveticaBold.widthOfTextAtSize(approvalText, 11);
        page.drawText(approvalText, {
            x: 185 - (approvalWidth / 2),
            y: height - 320,
            size: 11,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        });

        // 2. Top Right Fields
        // Cert No
        page.drawText(`PSSR - X1234${pageCount}`, {
            x: width - 120,
            y: height - 98,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
        });

        // Date of Issue
        page.drawText("24.03.2026", {
            x: width - 120,
            y: height - 113,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
        });

        // Date of Expiry 
        if (pageCount <= 2) {
            page.drawText("24.03.2031", {
                x: width - 120,
                y: height - 128,
                size: 10,
                font: helvetica,
                color: rgb(0, 0, 0),
            });
        }

        // 3. Student Name (Big, Orange, Centered)
        const studentName = "JOHNATHAN DOE SMITH";
        const nameSize = 24;
        const nameWidth = helvetica.widthOfTextAtSize(studentName, nameSize);
        page.drawText(studentName, {
            x: (width / 2) - (nameWidth / 2) + 40,
            y: height - 305, // Move DOWN significantly to clear the top label
            size: nameSize,
            font: helvetica,
            color: rgb(0.95, 0.55, 0.1),
        });

        // 4. DOB and Passport
        const dobStr = "15.08.1995";
        let dobX = width / 2 - 40;
        let passX = width / 2 + 185;

        // Apply page-specific offsets due to wildly inconsistent under-the-hood PDF template layouts
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
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        });

        const passStr = "USA987654";
        page.drawText(passStr, {
            x: passX,
            y: height - 344,
            size: 12,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        });

        // 5. Gender Title removed completely (handled in static PDF template directly)

        pageCount++;
    }

    console.log("Saving customized STCW PDF...");
    const pdfBytes = await pdfDoc.save();
    const outPath = path.resolve(process.cwd(), "certificate-test-stcw-output.pdf");
    fs.writeFileSync(outPath, pdfBytes);

    console.log(`✅ Success! Saved to: \n${outPath}`);
}

main().catch(console.error);
