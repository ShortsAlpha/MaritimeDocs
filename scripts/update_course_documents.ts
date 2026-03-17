import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const masterCourseList = [
    "STCW BASIC SAFETY TRAINING CERTIFICATE",
    "SUPERYACHT DECK CREW",
    "SMALL POWERBOAT & RIB MASTER MCA RECOGNISED",
    "PROFESSIONAL SUPERYACHT HOSPITALITY",
    "MARINE COMMUNICATIONS (VHF-SRC)",
    "ACCREDITED ENGINE-RATING COURSE (AEC)",
    "PROFESSIONAL SUPERYACHT CHEF",
    "MASTER OF YACHTS 200 GT COASTAL / MATE",
    "MASTER OF YACHTS 200 GT LIMITED",
    "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)",
    "MASTER OF YACHTS 200 GT UNLIMITED",
    "OOW ON YACHTS LESS THAN 3000GT",
    "MASTER OF YACHTS 500 GT / CHIEF MATE 3000 GT",
    "PROFICIENCY IN ADVANCED FIRE FIGHTING",
    "MEDICAL FIRST AID",
    "PROFICIENCY IN MEDICAL CARE",
    "PROFICIENCY IN SURVIVAL CRAFT AND RESCUE BOATS",
    "LEADERSHIP AND TEAMWORK (HELM Operational Level)",
    "LEADERSHIP AND MANAGERIAL SKILLS (MANAGEMENT LEVEL)",
    "ECDIS - ELECTRONIC CHART DISPLAY AND INFORMATION SYSTEM",
    "RADAR / ARPA (OPERATIONAL LEVEL)",
    "RADAR / ARPA (MANAGEMENT LEVEL)",
    "GMDSS GENERAL OPERATORS CERTIFICATE (GOC) CoC",
    "EFFICIENT DECK HAND COURSE",
    "IYT INSTRUCTOR TRAINING PROGRAMME",
    "PERSONAL WATERCRAFT OPERATOR ( PWC )",
    "INTERNATIONAL BAREBOAT SKIPPER POWER / SAIL",
    "INTERNATIONAL BAREBOAT SKIPPER SAIL / CATAMARAN",
    "INTERNATIONAL CERTIFICATE OF COMPETENCY COURSE",
    "INTERNATIONAL FLOTILLA SKIPPER",
    "INTERNATIONAL FLOTILLA SKIPPER SAIL / CATAMARAN",
    "YACHT MASTER COASTAL POWER / SAIL",
    "YACHT MASTER COASTAL SAIL / CATAMARAN",
    "YACHT MASTER OCEAN",
    "YACHT MASTER OFFSHORE POWER / SAIL",
    "YACHT MASTER OFFSHORE SAIL / CATAMARAN",
    "PROFICIENCY IN MARITIME SECURITY AWARENESS"
];

const exactMappings: { doc: string, courses: string[], docId?: string }[] = [
    {
      doc: "Passport",
      courses: [
          "STCW BASIC SAFETY TRAINING CERTIFICATE", 
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "SMALL POWERBOAT & RIB MASTER MCA RECOGNISED", 
          "MARINE COMMUNICATIONS (VHF-SRC)", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "Candidate Registration Form",
      courses: [
          "STCW BASIC SAFETY TRAINING CERTIFICATE", 
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "SMALL POWERBOAT & RIB MASTER MCA RECOGNISED", 
          "MARINE COMMUNICATIONS (VHF-SRC)", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "Training Agreement",
      courses: [
          "STCW BASIC SAFETY TRAINING CERTIFICATE", 
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "SMALL POWERBOAT & RIB MASTER MCA RECOGNISED", 
          "MARINE COMMUNICATIONS (VHF-SRC)", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "Waiver Form",
      courses: [
          "STCW BASIC SAFETY TRAINING CERTIFICATE", 
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)"
      ]
    },
    {
      doc: "Student Acknowledgement Form",
      courses: [
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED"
      ]
    },
    {
      doc: "Medical Certificate",
      courses: [
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "STCW BST 5 modules", // Might create STCW Basic Safety in DB
      courses: [
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "Seaservice Testimonial",
      courses: [
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)"
      ]
    },
    {
      doc: "VHF Certificate Copy",
      courses: [
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "IYT Student Number",
      courses: [
          "MASTER OF YACHTS 200 GT LIMITED", 
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "SMALL POWERBOAT & RIB MASTER MCA RECOGNISED", 
          "MARINE COMMUNICATIONS (VHF-SRC)"
      ]
    },
    {
      doc: "Skipper license(2 years old)",
      courses: [
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)"
      ]
    },
    {
      doc: "Color photograph of seafarer",
      courses: [
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "Signature of seafarer",
      courses: [
          "MASTER OF YACHTS 200 GT UNLIMITED", 
          "MASTER ON YACHTS LESS THAN 200 GT (MALTA FLAG STATE)", 
          "ACCREDITED ENGINE-RATING COURSE (AEC)"
      ]
    },
    {
      doc: "Copy of Limited or OOW",
      courses: [
          "MASTER OF YACHTS 200 GT UNLIMITED"
      ]
    }
];

async function main() {
  console.log("Wiping old courses and syncing new course names & document matrix...");

  // WIPE OLD COURSES
  // Due to relations (CourseEvent, CourseDocument, Implicit Students), we can just delete all courses
  // Prisma will cascade delete CourseEvent and CourseDocument if schema configured correctly.
  // We'll delete Many-To-Many explicitly if needed, but implicit relations are deleted automatically.
  console.log("Deleting all existing course records...");
  await prisma.courseDocument.deleteMany({});
  await prisma.courseEvent.deleteMany({});
  
  // Actually, we just wipe the Course model completely. The Student relationships handles itself.
  await prisma.course.deleteMany({});
  console.log("All courses deleted.");

  // SEED NEW COURSES
  console.log("Seeding master course list...");
  const courseMap = new Map();
  for (const title of masterCourseList) {
      const course = await prisma.course.create({
          data: {
              title: title
          }
      });
      courseMap.set(title, course.id);
  }
  console.log(`Created ${masterCourseList.length} defined courses.`);

  // RESOLVE AND SEED DOCUMENT TYPES
  for (const mapping of exactMappings) {
    let exactMatch = await prisma.documentType.findFirst({
        where: { title: { equals: mapping.doc } }
    });

    if (!exactMatch) {
       // fallback search
       const existingTypes = await prisma.documentType.findMany();
       exactMatch = existingTypes.find(t => 
           t.title.toLowerCase() === mapping.doc.toLowerCase() ||
           t.title.toLowerCase().includes(mapping.doc.toLowerCase().replace(' copy', '')) ||
           mapping.doc.toLowerCase().includes(t.title.toLowerCase())
       ) || null;
    }

    if (!exactMatch) {
      console.log(`Document Type missing, creating: ${mapping.doc}`);
      exactMatch = await prisma.documentType.create({
        data: {
          title: mapping.doc,
          isRequired: false
        }
      });
    }
    mapping.docId = exactMatch.id;
  }

  // REBUILD RELATIONS
  console.log("Inserting CourseDocument mapping logic...");
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

  console.log("Successfully rebuilt all courses and synchronized documents!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
