import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The matrix from the provided image
// 1 means required (green), 0 means not required (gray)
const matrix = {
  courses: [
    "STCW BST",
    "IYT MOY 200GT LIMITED",
    "IYT MOY 200GT UNLIMITED",
    "SPB and RIB",
    "VHF",
    "TM MOY 200GT LIMITED",
    "TM Accredited Engine Course"
  ],
  documents: [
    { name: "Passport", requirements: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Candidate Registration Form", requirements: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Training Agreement", requirements: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Waiver Form", requirements: [1, 1, 1, 0, 0, 1, 0] },
    { name: "Student Acknowledgement Form", requirements: [0, 1, 1, 0, 0, 0, 0] },
    { name: "Medical Certificate", requirements: [0, 1, 1, 0, 0, 1, 1] },
    { name: "STCW BST 5 modules", requirements: [0, 1, 1, 0, 0, 1, 1] },
    { name: "Seaservice Testimonial", requirements: [0, 1, 0, 0, 0, 1, 0] },
    { name: "VHF Certificate Copy", requirements: [0, 1, 1, 0, 0, 1, 1] },
    { name: "IYT Student Number", requirements: [0, 1, 1, 1, 1, 0, 0] },
    { name: "Skipper license(2 years old)", requirements: [0, 0, 0, 0, 0, 1, 0] },
    { name: "Color photograph of seafarer", requirements: [0, 0, 0, 0, 0, 0, 1] }, // Wait, checking image again. In IYT MOY UNLIMITED it seems green? Ah, let's carefully check row 12 and 13
    { name: "Signature of seafarer", requirements: [0, 0, 1, 0, 0, 1, 1] },
    { name: "Copy of Limited or OOW", requirements: [0, 0, 1, 0, 0, 0, 0] },
  ]
};

// Precise transcription from image for rows 12 and 13:
// Row 12 (Color photograph): TM Accredited Engine Course is GREEN. Wait, looking closely at image...
// For "Color photograph", column TM Accredited Engine Course is GREEN.
// Actually, I should transcribe row 12 again:
// [STCW: 0, IYT MOY LIM: 0, IYT MOY UNLIM: 0, SPB: 0, VHF: 0, TM MOY LIM: 0, TM ENGINE: 1] -> looking at the image, wait, IYT MOY UNLIMITED is GRAY for Color photo? No, look at image 2173_2 again.
// Let's re-verify from the prompt image:
// Row 12 (Color photograph): TM Accredited Engine Course is GREEN. The rest are gray? In the image, TM Accredited Engine is the LAST column.
// Row 12: TM Accredited Engine Course is GREEN.
// Row 13 (Signature): IYT MOY UNLIMITED (col 3) is GREEN, TM MOY LIMITED (col 6) is GREEN, TM Accredited Engine Course (col 7) is GREEN.
// Let's adjust exact matrix properly below.

async function main() {
  console.log("Synchronizing course documents matrix...");

  // Let's define the exact mappings based on visual inspection
  const exactMappings: { doc: string, courses: string[], docId?: string }[] = [
    {
      doc: "Passport",
      courses: ["STCW BST", "IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "SPB and RIB", "VHF", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "Candidate Registration Form",
      courses: ["STCW BST", "IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "SPB and RIB", "VHF", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "Training Agreement",
      courses: ["STCW BST", "IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "SPB and RIB", "VHF", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "Waiver Form",
      courses: ["STCW BST", "IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "TM MOY 200GT LIMITED"]
    },
    {
      doc: "Student Acknowledgement Form",
      courses: ["IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED"]
    },
    {
      doc: "Medical Certificate",
      courses: ["IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "STCW BST 5 modules", // might be named STCW Basic Safety in DB
      courses: ["IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "Seaservice Testimonial",
      courses: ["IYT MOY 200GT LIMITED", "TM MOY 200GT LIMITED"]
    },
    {
      doc: "VHF Certificate Copy", // might be named VHF Certificate
      courses: ["IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "IYT Student Number",
      courses: ["IYT MOY 200GT LIMITED", "IYT MOY 200GT UNLIMITED", "SPB and RIB", "VHF"]
    },
    {
      doc: "Skipper license(2 years old)",
      courses: ["TM MOY 200GT LIMITED"]
    },
    {
      doc: "Color photograph of seafarer",
      courses: ["TM Accredited Engine Course"]
    },
    {
      doc: "Signature of seafarer",
      courses: ["IYT MOY 200GT UNLIMITED", "TM MOY 200GT LIMITED", "TM Accredited Engine Course"]
    },
    {
      doc: "Copy of Limited or OOW",
      courses: ["IYT MOY 200GT UNLIMITED"]
    }
  ];

  // 1. Ensure all these document types exist in the DB
  for (const mapping of exactMappings) {
    let docType = await prisma.documentType.findFirst({
      where: { 
        // Try to match the name closely (some might be slightly different in DB)
        title: { startsWith: mapping.doc.split(' ')[0] } 
      }
    });

    // We do an exact or near match
    const existingTypes = await prisma.documentType.findMany();
    let exactMatch = existingTypes.find(t => 
      t.title.toLowerCase() === mapping.doc.toLowerCase() ||
      t.title.toLowerCase().includes(mapping.doc.toLowerCase().replace(' copy', '')) ||
      mapping.doc.toLowerCase().includes(t.title.toLowerCase())
    );

    if (!exactMatch) {
      console.log(`Document Type missing, creating: ${mapping.doc}`);
      exactMatch = await prisma.documentType.create({
        data: {
          title: mapping.doc,
          isRequired: false // We will rely on CourseDocument join table instead
        }
      });
    }

    mapping.docId = exactMatch.id;
  }

  // 2. Ensure courses exist
  const allCourseTitles = Array.from(new Set(exactMappings.flatMap(m => m.courses)));
  const courseMap = new Map();

  for (const title of allCourseTitles) {
    let course = await prisma.course.findFirst({
      where: { title: title }
    });

    if (!course) {
        // Try fuzzy match
        const courses = await prisma.course.findMany();
        course = courses.find(c => c.title.toLowerCase() === title.toLowerCase()) || null;
    }

    if (!course) {
      console.log(`Course missing, creating: ${title}`);
      course = await prisma.course.create({
        data: {
          title: title
        }
      });
    }
    courseMap.set(title, course.id);
  }

  // 3. Rebuild CourseDocument relationships
  console.log("Clearing old CourseDocument relationships...");
  // First, we only clear relations for the courses in our matrix so we don't destroy others if they exist
  for (const courseId of courseMap.values()) {
     await prisma.courseDocument.deleteMany({
         where: { courseId: courseId }
     });
  }

  console.log("Inserting new CourseDocument relationships...");
  for (const mapping of exactMappings) {
      for (const courseTitle of mapping.courses) {
          const courseId = courseMap.get(courseTitle);
          if (courseId && mapping.docId) {
              await prisma.courseDocument.create({
                  data: {
                      courseId: courseId,
                      documentTypeId: mapping.docId
                  }
              });
          }
      }
  }

  console.log("Successfully synchronized document requirements matrix!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
