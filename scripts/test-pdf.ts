import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const bucketName = "student-management-system"; // Use your actual bucket name

async function main() {
    console.log("Connecting to R2 to find template...");
    
    // 1. Setup S3 Client
    const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
    });

    // 2. Find the template
    const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "certificate-templates/",
    });

    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
        console.error("No files found in certificate-templates/ folder.");
        return;
    }

    const fileItem = response.Contents.find(item => item.Key && item.Key.endsWith('.pdf'));
    
    if (!fileItem) {
        console.error("No PDF files found in certificate-templates/ folder.");
        return;
    }

    console.log(`Found template: ${fileItem.Key}`);

    // 3. Download the PDF
    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileItem.Key,
    });

    const getResponse = await s3Client.send(getCommand);
    const byteArray = await getResponse.Body?.transformToByteArray();

    if (!byteArray) {
        console.error("Failed to download or read the PDF.");
        return;
    }

    // 4. Load the PDF into pdf-lib
    console.log("Loading PDF into memory...");
    const pdfDoc = await PDFDocument.load(byteArray);
    
    // Embed font for measuring text width
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    
    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`PDF Dimensions: ${width}x${height}`);

    // 5. Apply the "Whiteout Overlay" and draw new text
    console.log("Applying whiteout overlay...");
    
    // --- COURSE SUBTITLE (Dynamic Centered) ---
    // Whiteout the wide left-to-right area between title and student details
    firstPage.drawRectangle({
        x: 55, 
        y: height - 258, // Moved down 2 points to cover the stray dot
        width: width - 110, 
        height: 24, // Increased height to preserve top coverage
        color: rgb(1, 1, 1), 
    });

    const courseName = "MASTER OF YACHTS 200 GT LIMITED";
    const courseFontSize = 14; 
    const courseTextWidth = helveticaBold.widthOfTextAtSize(courseName, courseFontSize);
    const courseX = (width - courseTextWidth) / 2;
    const courseY = height - 251; // Moved down 1 point for visual centering

    firstPage.drawText(courseName, {
        x: courseX,
        y: courseY,
        size: courseFontSize,
        font: helveticaBold, // Make it bold to look prominent
        color: rgb(0, 0, 0),
    });

    // Draw white rectangle to hide "KEREM ERTORER", Date of birth, and National ID
    firstPage.drawRectangle({
        x: 182,
        y: height - 410, // Moved up slightly more
        width: 260,
        height: 75, // Increased height to cover the artifact lines above
        color: rgb(1, 1, 1), 
    });

    // Draw the new name
    firstPage.drawText(": JOHN DOE (AUTO-GENERATED)", {
        x: 185,
        y: height - 347, 
        size: 10,
        color: rgb(0, 0, 0),
    });
    
    // Draw the new DOB
    firstPage.drawText(": 01.01.2000", {
        x: 185,
        y: height - 362, 
        size: 10,
        color: rgb(0, 0, 0),
    });

    // Draw the new ID
    firstPage.drawText(": U99999999", {
        x: 185,
        y: height - 377, 
        size: 10,
        color: rgb(0, 0, 0),
    });

    // --- MAIN PARAGRAPH REPLACEMENT ---
    // Whiteout the entire paragraph
    firstPage.drawRectangle({
        x: 50, // Sweet spot between 43 (clips border) and 55 (leaves text)
        y: height - 465, 
        width: width - 100, // Symmetric padding of 50
        height: 75, 
        color: rgb(1, 1, 1),
    });

    const paragraphParts = [
        { text: 'Has successfully completed training of ""', font: timesItalic },
        { text: courseName, font: timesBoldItalic },
        { text: '"" at Xone Maritime Academy, approved by the Merchant Shipping Directorate of the Authority for Transport in Malta as meeting the requirements laid down in', font: timesItalic }
    ];

    const pFontSize = 10;
    const pStartX = 55; // Draw text further inward to avoid crowding the blue lines
    const pMaxWidth = width - 110; // Narrower max-width to protect the right side
    let pCurrentX = pStartX;
    let pCurrentY = height - 405; 
    const pLineHeight = 14;

    for (const part of paragraphParts) {
        const spaceWidth = part.font.widthOfTextAtSize(' ', pFontSize);
        const words = part.text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            if (words[i] === '') continue; // skip double spaces

            const word = words[i];
            const wordWidth = part.font.widthOfTextAtSize(word, pFontSize);
            const needsSpace = i < words.length - 1; // true if not last word in this part
            const advanceWidth = wordWidth + (needsSpace ? spaceWidth : 0);
            
            // If word exceeds max width, wrap to new line
            if (pCurrentX + wordWidth > pStartX + pMaxWidth) {
                pCurrentX = pStartX;
                pCurrentY -= pLineHeight;
            }
            
            firstPage.drawText(word, {
                x: pCurrentX,
                y: pCurrentY,
                font: part.font,
                size: pFontSize,
                color: rgb(0, 0, 0),
            });
            
            pCurrentX += advanceWidth;
        }
    }

    // --- LEFT SIGNATURE BLOCK REPLACEMENT ---
    // Whiteout the entire left block including the signature graphic
    firstPage.drawRectangle({
        x: 45,
        y: 150,
        width: 260,
        height: 140, // Top equals 290, safely covering "Principal" and the full signature
        color: rgb(1, 1, 1),
    });

    const leftLabelX = 55;
    const leftValueX = 120; // Aligns the colons perfectly
    const leftStartY = 275;
    const lSpacing = 14;
    
    firstPage.drawText("Principal (or Authorised Representative)", {
        x: leftLabelX, y: leftStartY, size: 10, color: rgb(0, 0, 0),
    });
    
    firstPage.drawText("Name", {
        x: leftLabelX, y: leftStartY - lSpacing, size: 10, color: rgb(0, 0, 0),
    });
    firstPage.drawText(": INSTRUCTOR NAME", { // This will be dynamic in the real app
        x: leftValueX, y: leftStartY - lSpacing, size: 10, color: rgb(0, 0, 0),
    });
    
    firstPage.drawText("Date", {
        x: leftLabelX, y: leftStartY - 2 * lSpacing, size: 10, color: rgb(0, 0, 0),
    });
    firstPage.drawText(": 19.03.2026", { // Dynamic date
        x: leftValueX, y: leftStartY - 2 * lSpacing, size: 10, color: rgb(0, 0, 0),
    });
    
    firstPage.drawText("Signature", {
        x: leftLabelX, y: leftStartY - 3 * lSpacing, size: 10, color: rgb(0, 0, 0),
    });
    firstPage.drawText(":", {
        x: leftValueX, y: leftStartY - 3 * lSpacing, size: 10, color: rgb(0, 0, 0),
    });

    // --- RIGHT SIGNATURE DATE ---
    firstPage.drawRectangle({
        x: 378, // Sola kaymıştı, biraz sağa alındı
        y: 245, // Çok yukarıdaydı, sol tarafla aynı hizaya (245) çekildi
        width: 52, 
        height: 10,
        color: rgb(1, 1, 1), 
    });

    firstPage.drawText("19.03.2026", {
        x: 379, // Sağa alındı
        y: 246, // Aşağı indirildi
        size: 10,
        color: rgb(0, 0, 0),
    });

    // 6. Save the result
    console.log("Saving customized PDF...");
    const pdfBytes = await pdfDoc.save();
    
    const outputPath = path.resolve(process.cwd(), "certificate-test-output.pdf");
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`\n✅ Success! Saved generated certificate to:\n${outputPath}`);
}

main().catch(console.error);
