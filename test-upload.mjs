import fs from 'fs';
import path from 'path';

async function testUpload() {
    const formData = new FormData();
    const blob = new Blob(["test file content"], { type: 'text/plain' });
    formData.append("file", blob, "test.txt");
    formData.append("subFolder", "students/test/exam-notes");

    try {
        const response = await fetch('http://127.0.0.1:3000/api/upload', {
            method: 'POST',
            body: formData,
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testUpload();
