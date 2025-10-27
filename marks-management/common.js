// Classes to fetch student lists for
let classes = ['1-A1', '1-A2', '1-A3', '2-A1', '2-A2', '2-A3', '3-A1', '3-A2', '3-A3', '3-A4', '4-A1', '4-A2', '4-A3', '4-A4', '5-A1', '5-A2', '5-A3', '5-A4', '6-A1', '6-A2', '6-A3', '6-A4', '7-A1', '7-A2', '7-A3', '7-A4', '8-A1', '8-A2', '8-A3', '9-A1', '9-A2', '9-A3', '10-A1', '10-A2', '11-SCI', '11-COM', '11-HUM', '12-SCI', '12-COM', '12-HUM'];

// Global variables to hold class and subject
let globalClassValue = null;
let globalSubjectValue = null;

// Global array of subjects
let subjects = [
  "All Subjects (Enthusiasm)",
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
  1: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120, 'Term-1': 350},
  2: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120, 'Term-1': 350},
  3: {'PT-1': 140, 'PT-2': 140, 'PT-3': 140, 'PT-4': 140, 'Term-1': 460},
  4: {'PT-1': 140, 'PT-2': 140, 'PT-3': 140, 'PT-4': 140, 'Term-1': 460},
  5: {'PT-1': 140, 'PT-2': 140, 'PT-3': 140, 'PT-4': 140, 'Term-1': 460},
  6: {'PT-1': 160, 'PT-2': 160, 'PT-3': 160, 'PT-4': 160, 'Term-1': 540},
  7: {'PT-1': 160, 'PT-2': 160, 'PT-3': 160, 'PT-4': 160, 'Term-1': 540},
  8: {'PT-1': 160, 'PT-2': 160, 'PT-3': 160, 'PT-4': 160, 'Term-1': 540},
  9: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120, 'Term-1': 480},
  10: {'PT-1': 120, 'PT-2': 120, 'PT-3': 120, 'PT-4': 120, 'Term-1': 480},
  11: {'PT-1': 100, 'PT-2': 100, 'PT-3': 100, 'PT-4': 100, 'Term-1': 400},
  12: {'PT-1': 100, 'PT-2': 100, 'PT-3': 100, 'PT-4': 100, 'Term-1': 360},
};

// Global class-wise list of subjects
const classwiseSubjects = {
  1: ['English', 'Hindi', 'Maths', 'EVS', 'Computer', 'GK'],
  2: ['English', 'Hindi', 'Maths', 'EVS', 'Computer', 'GK'],
  3: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  4: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  5: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK', 'All Subjects (Enthusiasm)'],
  6: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'All Subjects (Enthusiasm)'],
  7: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'All Subjects (Enthusiasm)'],
  8: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Data Science', 'GK', 'All Subjects (Enthusiasm)'],
   9: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Data Science', 'All Subjects (Enthusiasm)'],
   10: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Data Science', 'All Subjects (Enthusiasm)'],
  '11-SCI': ['English', 'Physics', 'Chemistry', 'Biology', 'Maths', 'P.E.', 'I.P.', 'Geography', 'Economics', 'Psychology', 'All Subjects (Enthusiasm)', 'Fine Arts'],
  '11-COM': ['English', 'Accountancy', 'B.St.', 'Economics', 'Maths', 'P.E.', 'I.P.', 'All Subjects (Enthusiasm)', 'Applied Maths', 'Psychology', 'Fine Arts'],
  '11-HUM': ['English', 'History', 'Geography', 'Pol. Sci.', 'Maths', 'P.E.', 'I.P.', 'Economics', 'All Subjects (Enthusiasm)', 'Applied Maths', 'Psychology', 'Fine Arts'],
  '12-SCI': ['English', 'Physics', 'Chemistry', 'Biology', 'Maths', 'P.E.', 'I.P.', 'Geography', 'Economics', 'All Subjects (Enthusiasm)'],
  '12-COM': ['English', 'Accountancy', 'B.St.', 'Economics', 'Maths', 'P.E.', 'I.P.', 'All Subjects (Enthusiasm)'],
  '12-HUM': ['English', 'History', 'Geography', 'Pol. Sci.', 'Maths', 'P.E.', 'I.P.', 'Economics', 'All Subjects (Enthusiasm)']
}

let filteredClasses = [];
let filteredSubjects = [];

// Common pre-decided exams
const exams = [
             {'name': 'PT-1', 'mm': 20},
             {'name': 'PT-2', 'mm': 20},
             {'name': 'Term-1 (Objective)', 'mm': 0},
             {'name': 'Term-1 (Theory)', 'mm': 0},
             {'name': 'Term-1 (SEA)', 'mm': 0},
             {'name': 'Term-1 (PP)', 'mm': 0},
             {'name': 'Term-1 (Practical)', 'mm': 0},
             {'name': 'Term-1 (Internal)', 'mm': 0},
             {'name': 'PT-3', 'mm': 20},
             {'name': 'PT-4', 'mm': 20},
             {'name': 'Pre-Term Test 1', 'mm': 15},
             {'name': 'Pre-Term Test 2', 'mm': 15},
             {'name': 'Enthusiasm (July)', 'mm': 300},
             {'name': 'Enthusiasm (August)', 'mm': 300}
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
function getMaxMarks(examName, className=null, subjectName=null) {
   // Check if it is a term exam, which requires special component handling
   if(examName && (examName.includes('Term-1') || examName.includes('Term-1')) && exams.find(e => e.name === examName)) {
      if(className && subjectName) {
        return getMMForTerm(examName, className, subjectName);
      } else if(globalClassValue && globalSubjectValue) {
        return getMMForTerm(examName, globalClassValue, globalSubjectValue);
      } else {
        return 0;
      }
   }
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

   return customExam ? customExam.mm : 0; // Default to 0 if not found
}

// Function to generate performance remark
function getPerformanceRemark(marks, examName, computedPercentage = null, className, subjectName) {
   let percentage;

   // If marks are not available, return 'Absent'
   if (marks === null) return 'Absent';

   // If an already computed percentage value is given, generate a remark based on that
   if (computedPercentage) {
      percentage = computedPercentage;
   } else {
      const maxMarks = getMaxMarks(examName, className, subjectName);
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

function getPassingMark(examName, className, subjectName) {
   // Assuming passing mark is 36% of maximum marks
   return getMaxMarks(examName, className, subjectName) * 0.36;
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

// Function to log user activity on server
function logActivity(visitor, action, extra = null) {
    // Run insert in the background, without blocking main code
    (async () => {
        try {
            const data = {
                visitor,
                action,
                extra: extra ? extra : null
            };
            await insertData("activity_logs", data);
        } catch (error) {
            console.error("Error logging activity:", error.message);
        }
    })();
}



// Configuration structure SPECIFICALLY for handling Term-1 Exam components
const examMarksConfig = [
  {
    classes: [1, 2],
    subjects: ["English", "Hindi", "EVS", "Maths"],
    exams: {
      "Term-1 (Objective)": 20,
      "Term-1 (Theory)": 50,
      "Term-1 (SEA)": 5,
      "Term-1 (PP)": 5
    }
  },
  {
    classes: [1, 2],
    subjects: ["GK", "Computer"],
    exams: {
      "Term-1 (Theory)": 30
    }
  },
  {
    classes: [3, 4, 5],
    subjects: ["English", "Hindi", "Science", "Maths", "Social Science"],
    exams: {
      "Term-1 (Objective)": 20,
      "Term-1 (Theory)": 50,
      "Term-1 (SEA)": 5,
      "Term-1 (PP)": 5
    }
  },
  {
    classes: [3, 4, 5],
    subjects: ["GK", "Computer"],
    exams: {
      "Term-1 (Theory)": 30
    }
  },
  {
    classes: [6, 7, 8],
    subjects: ["English", "Hindi", "Science", "Maths", "Social Science"],
    exams: {
      "Term-1 (Objective)": 20,
      "Term-1 (Theory)": 60
    }
  },
  {
    classes: [6, 7, 8],
    subjects: ["GK", "Computer", "Data Science"],
    exams: {
      "Term-1 (Theory)": 30
    }
  },
  {
    classes: [6, 7, 8],
    subjects: ["Sanskrit"],
    exams: {
      "Term-1 (Theory)": 80
    }
  },
  {
    classes: [9, 10],
    subjects: ["English", "Hindi", "Science", "Maths", "Social Science"],
    exams: {
      "Term-1 (Theory)": 80
    }
  },
  {
    classes: [9, 10],
    subjects: ["Data Science"],
    exams: {
      "Term-1 (Theory)": 50,
      "Term-1 (Practical)": 30
    }
  },
  // Class 11 Starts
  {
    classes: [11],
    subjects: ["I.P.", "P.E.", "Psychology", "Physics", "Chemistry", "Biology", "Geography"],
    exams: {
      "Term-1 (Theory)": 70,
      "Term-1 (Internal)": 10
    }
  },
  {
    classes: [11],
    subjects: ["English", "Maths", "Accountancy", "B.St.", "Economics", "History", "Pol. Sci."],
    exams: {
      "Term-1 (Theory)": 80
    }
  },
  // Class 12 Starts
  {
    classes: [12],
    subjects: ["I.P.", "P.E.", "Psychology", "Physics", "Chemistry", "Biology", "Geography"],
    exams: {
      "Term-1 (Theory)": 70
    }
  },
  {
    classes: [12],
    subjects: ["English", "Maths", "Accountancy", "B.St.", "Economics", "History", "Pol. Sci."],
    exams: {
      "Term-1 (Theory)": 80
    }
  }
];


/* Function designed to return max marks for Term Exam Components */
function getMMForTerm(examName, className, subject) {
  // Extract the integer part from the class
  let classNumber = parseInt(className);

  // Find the matching configuration
  for (const config of examMarksConfig) {
    // Check if class matches
    if (!config.classes.includes(classNumber)) {
      continue;
    }
    
    // Check if subject matches
    if (!config.subjects.includes(subject)) {
      continue;
    }
    
    // Check if exam exists and return marks
    if (config.exams.hasOwnProperty(examName)) {
      return config.exams[examName];
    }
  }
  
  // Return 0 if no matching configuration found
  return 0;
}

function getTermExamComponents(examName, classNumber, subject) {
  // Ensure classNumber is an integer
  classNumber = parseInt(classNumber);
  
  // Find the matching configuration
  const config = examMarksConfig.find(cfg => 
    cfg.classes.includes(classNumber) && cfg.subjects.includes(subject)
  );
  
  // If no configuration found, return empty object
  if (!config) {
    return {};
  }
  
  // Extract exam components that match the exam name (ignoring bracket parts)
  const result = {};
  let total = 0;
  
  for (const [examKey, marks] of Object.entries(config.exams)) {
    // Check if the exam key starts with the given exam name
    if (examKey.startsWith(examName)) {
      // Extract the component name from brackets (e.g., "Term-1 (Objective)" -> "Objective")
      const match = examKey.match(/\(([^)]+)\)/);
      if (match) {
        const component = match[1];
        result[component] = marks;
        total += marks;
      }
    }
  }
  
  // Add total if we found any components
  if (Object.keys(result).length > 0) {
    result.Total = total;
  }
  
  return result;
}

function getUniqueTermExamNames(examName) {
  if(!examName) return;

  let filterWord;

  if(examName.startsWith('Term-1')) {
    filterWord = 'Term-1';
  } else if(examName.startsWith('Term-2')) {
    filterWord = 'Term-2';
  }

  if(!filterWord) return;

  const examNames = new Set(); // to automatically handle uniqueness
  
  examMarksConfig.forEach(entry => {
    Object.keys(entry.exams).forEach(exam => examNames.add(exam));
  });

  const completeArr = Array.from(examNames); // convert Set back to array

  return completeArr.filter(name => name.startsWith(filterWord));
}



