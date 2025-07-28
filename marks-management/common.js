// Classes to fetch student lists for
let classes = ['1-A1', '1-A2', '1-A3', '2-A1', '2-A2', '2-A3', '3-A1', '3-A2', '3-A3', '3-A4', '4-A1', '4-A2', '4-A3', '4-A4', '5-A1', '5-A2', '5-A3', '5-A4', '6-A1', '6-A2', '6-A3', '6-A4', '7-A1', '7-A2', '7-A3', '7-A4', '8-A1', '8-A2', '8-A3', '9-A1', '9-A2', '9-A3', '10-A1', '10-A2', '10-A3', '11-SCI', '11-COM', '11-HUM', '12-SCI', '12-COM', '12-HUM'];

// Global variables to hold class and subject
let globalClassValue = null;
let globalSubjectValue = null;

// Global array of subjects
let subjects = [
  "English",
  "Hindi",
  "Science",
  "Maths",
  "EVS",
  "Social Science",
  "Sanskrit",
  "Computer",
  "Data Science",
  "GK",
  "Physics",
  "Chemistry",
  "Biology",
  "P.E.",
  "I.P.",
  "Psychology",
  "Applied Maths",
  "Fine Arts",
  "Geography",
  "Accountancy",
  "B.St.",
  "Economics",
  "History",
  "Pol. Sci."
];

let optionalSubjects = {
'11-HUM': ['Applied Maths', 'Maths', 'P.E.', 'I.P.', 'Economics', 'Fine Arts', 'Psychology'],
'11-COM': ['Applied Maths', 'Maths', 'P.E.', 'I.P.', 'Fine Arts', 'Psychology'],
'11-SCI': ['Biology', 'Maths', 'P.E.', 'I.P.', 'Geography', 'Economics', 'Fine Arts', 'Psychology'],
'12-HUM': ['Maths', 'P.E.', 'I.P.', 'Economics'],
'12-COM': ['Maths', 'P.E.', 'I.P.'],
'12-SCI': ['Biology', 'Maths', 'P.E.', 'I.P.', 'Geography', 'Economics']
};

// Class and exam-wise aggregate maximum marks, considering all subjects
const aggregateMarks = {
  1: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120},
  2: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120},
  3: {'PT-1': 140, 'PT-2': 140, 'PT-3': 140, 'PT-4': 140},
  4: {'PT-1': 140, 'PT-2': 140, 'PT-3': 140, 'PT-4': 140},
  5: {'PT-1': 140, 'PT-2': 140, 'PT-3': 140, 'PT-4': 140},
  6: {'PT-1': 160, 'PT-2': 160, 'PT-3': 160, 'PT-4': 160},
  7: {'PT-1': 160, 'PT-2': 160, 'PT-3': 160, 'PT-4': 160},
  8: {'PT-1': 160, 'PT-2': 160, 'PT-3': 160, 'PT-4': 160},
  9: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120},
  10: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120},
  11: {'PT-1': 100, 'PT-2': 100, 'PT-3': 100, 'PT-4': 100},
  12: {'PT-1': 100, 'PT-2': 100, 'PT-3': 100, 'PT-4': 100},
};

// Global class-wise list of subjects
const classwiseSubjects = {
  1: ['English', 'Hindi', 'Maths', 'EVS', 'Computer', 'GK'],
  2: ['English', 'Hindi', 'Maths', 'EVS', 'Computer', 'GK'],
  3: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  4: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  5: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  6: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK'],
  7: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK'],
  8: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Data Science', 'GK'],
   9: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Data Science'],
   10: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Data Science'],
  '12-SCI': ['English', 'Physics', 'Chemistry', 'Biology', 'Maths', 'P.E.', 'I.P.', 'Geography', 'Economics'],
  '12-COM': ['English', 'Accountancy', 'B.St.', 'Economics', 'Maths', 'P.E.', 'I.P.'],
  '12-HUM': ['English', 'History', 'Geography', 'Pol. Sci.', 'Maths', 'P.E.', 'I.P.', 'Economics']
}

let filteredClasses = [];
let filteredSubjects = [];

// Common pre-decided exams
const exams = [
             {'name': 'PT-1', 'mm': 20},
             {'name': 'PT-2', 'mm': 20},
             {'name': 'PT-3', 'mm': 20},
             {'name': 'PT-4', 'mm': 20}
        ];

// Color mapping for updated remarks
const colorMap = {
   'Outstanding performance': '#10b981', // Green
   'Good performance': '#60a5fa', // Light Blue
   'Very good performance': '#3b82f6', // Blue
   'Fair performance': '#f59e0b', // Amber
   'Needs hard work': '#ef4444', // Red
   'Absent': '#6d28d9' // Purple
};

// Function to get max marks considering both regular and custom exams
function getMaxMarks(examName) {
   // First check common exams
   const commonExam = exams.find(e => e.name === examName);
   if (commonExam) return commonExam.mm;

   // Then check custom exams
   const selectedClass =  globalClassValue || classSelect.value;
   const selectedSubject =  globalSubjectValue || subjectSelect.value;

   const customExam = customExams.find(e =>
      e.name === examName &&
      e.class === selectedClass &&
      e.subject === selectedSubject);

   return customExam ? customExam.mm : 10; // Default to 10 if not found
}

// Function to generate performance remark
function getPerformanceRemark(marks, examName, computedPercentage = null) {
   let percentage;

   // If marks are not available, return 'Absent'
   if (marks === null) return 'Absent';

   // If an already computed percentage value is given, generate a remark based on that
   if (computedPercentage) {
      percentage = computedPercentage;
   } else {
      const maxMarks = getMaxMarks(examName);
      percentage = (marks / maxMarks) * 100;
   }

   if (percentage < 50) return 'Needs hard work';
   if (percentage < 70) return 'Fair performance';
   if (percentage < 80) return 'Good performance';
   if (percentage < 90) return 'Very good performance';
   if (percentage <= 100) return 'Outstanding performance';
   return 'Absent';
}

// Function to get CSS class for remark
function getRemarkClass(remark) {
   if (remark === 'Absent') return 'remark-absent';
   if (remark === 'Needs hard work') return 'remark-poor';
   if (remark === 'Fair performance') return 'remark-average';
   if (remark === 'Good performance' || remark === 'Very good performance') return 'remark-good';
   if (remark === 'Outstanding performance') return 'remark-excellent';
   return '';
}

function getPassingMark(examName) {
   // Assuming passing mark is 33% of maximum marks
   return getMaxMarks(examName) * 0.33;
}

function getSubjectsForClass(classValue, useFilteredSubjects=false) {

  let classNumber = null;

  // Extract class number from 'classValue' like '6-A2' if 'classValue' does not begin with 11 or 12
  if(!classValue.startsWith('11') && !classValue.startsWith('12')) {
  classNumber = parseInt(classValue.split('-')[0]);
  } else {
  classNumber = classValue;
  }

  // Get the relevant subjects for that class
  let classSubjects = classwiseSubjects[classNumber];

  // If no subjects found, return an empty array
  if (!classSubjects) return [];

  // Filter the global 'subjects' or 'filteredSubjects' array to keep only those present in 'classSubjects'
  const arr = useFilteredSubjects ? filteredSubjects : subjects;

  return arr.filter(subject => classSubjects.includes(subject));
}

// Get aggregate max marks for a given class-exam combination (such as, PT-1 for class 6)
function getAggregateMarks(classValue, examName) {
  const classNumber = parseInt(classValue.split('-')[0]);
  const classData = aggregateMarks[classNumber];

  if (classData && classData[examName]) {
    return classData[examName];
  } else {
    return null;
  }
}
