"use client"
import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, GraduationCap, Calendar, Printer, Search, Award, MapPin, BookOpen } from "lucide-react"
import { getStudentAttendance } from "@/utils/csvParser"
import { parse } from "papaparse";

interface AttendanceRecord {
  studentId: string
  courseCode: string
  attendance: number
  name: string
}

// Add this interface
interface StudentData {
  name: string;
  id: string;
}

// In student-portal.tsx, add this interface after the existing ones
interface StudentDetails {
  name: string;
  id: string;
  gender: string;
  category: string;
  contact: string;
  address: string;
  counsellorName: string;
  counsellorDesignation: string;
  counsellorContact: string; // This will now correctly map to Mentor Contact No
}

// Add this function before the StudentPortal component
const getSemesterFromId = (id: string): number => {
  const prefix = id.substring(0, 2);
  switch (prefix) {
    case '24':
      return 3;
    case '23':
      return 5;
    case '22':
      return 7;
    default:
      return 1;
  }
}

// Modify the getVisibleSemesters function in student-portal.tsx
const getVisibleSemesters = (id: string): number => {
  // Instead of restricting by batch, show all available semesters for the student
  return 8; // Allow up to 8 semesters (including summer terms)
}

type CourseResult = {
  name: string;
  courseCode: string; // Add this
  grade: string;
  status: string;
};

type SemesterResult = {
  semester: string;
  courses: CourseResult[];
  cgpa: string;
};

// Add this helper function before the StudentPortal component
const sortSemesters = (results: SemesterResult[]): SemesterResult[] => {
  return results.sort((a, b) => {
    const aIsSummer = a.semester.toLowerCase().includes('summer');
    const bIsSummer = b.semester.toLowerCase().includes('summer');
    
    if (aIsSummer && !bIsSummer) return 1;  // Summer terms go last
    if (!aIsSummer && bIsSummer) return -1;
    
    // For non-summer terms, sort by semester number
    const aNum = parseInt(a.semester.split(' ')[1]);
    const bNum = parseInt(b.semester.split(' ')[1]);
    return aNum - bNum;
  });
}

export default function StudentPortal() {
  const [universityId, setUniversityId] = useState("")
  const [displayedId, setDisplayedId] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  // Add this state
  const [studentName, setStudentName] = useState<string>("")
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  // Add this state
  const [visibleSemesters, setVisibleSemesters] = useState<number>(0);
  // Add these states after other useState declarations
  const [counsellerDetails] = useState({
    name: "Ashesh K",
    designation: "Associate Professor",
    contactNumber: "8500103040",
    cabinNumber: "C603"
  });
  // Add this state in the component
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  // Add these states after other useState declarations
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [semesterResults, setSemesterResults] = useState<SemesterResult[]>([]);
  // Add this state at the top with other states
  const [overallCGPA, setOverallCGPA] = useState<string>("N/A");
  // Add this state at the top with other states
  const [backlogs, setBacklogs] = useState<number>(0);

  // Add these states at the top of the StudentPortal component
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginId, setLoginId] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState("");

  // Define the LoginRecord interface for CSV parsing
  interface LoginRecord {
    ID: string;
    Password: string;
  }

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      alert("Please login first to view student details");
      setIsLoginModalOpen(true);
      return;
    }

    if (universityId.trim().length > 0) {
      try {
        setError(null);
        setCurrentSemester(getSemesterFromId(universityId));
        setVisibleSemesters(getVisibleSemesters(universityId));

        // Fetch CGPA
        const cgpaResponse = await fetch(`/api/cgpa?studentId=${universityId}`);
        if (cgpaResponse.ok) {
          const cgpaData = await cgpaResponse.json();
          setOverallCGPA(cgpaData.cgpa);
        } else {
          setOverallCGPA("N/A");
        }

        const response = await fetch(`/api/student?studentId=${universityId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError(`ID ${universityId} not found in records`);
            setIsSubmitted(false);
            setAttendanceData([]);
            setDisplayedId("");
            setStudentDetails(null);
            return;
          }
          throw new Error(`Failed to fetch data. Please try again.`);
        }

        const studentData = await response.json();
        setStudentDetails(studentData);
        setStudentName(studentData.name);
        setDisplayedId(studentData.id);

        // Fetch attendance data
        const attendanceResponse = await fetch(`/api/attendance?studentId=${universityId}`);
        if (!attendanceResponse.ok) {
          throw new Error(`Failed to fetch attendance data`);
        }
        const attendanceData = await attendanceResponse.json();

        if (attendanceData.length === 0) {
          setError("No attendance records found for this ID");
          setIsSubmitted(false);
          return;
        }

        setAttendanceData(attendanceData);
        setDisplayedId(universityId);
        setIsSubmitted(true);

        // Fetch semester results and calculate backlogs
        const resultsResponse = await fetch(`/api/results?studentId=${universityId}`);
        if (!resultsResponse.ok) {
          throw new Error(`Failed to fetch results data`);
        }
        const results = await resultsResponse.json();
        setSemesterResults(sortSemesters(results));

        // Calculate the number of backlogs
        const failedCoursesCount = results.reduce((count: number, semester: any) => {
          const failedCourses = semester.courses.filter((course: any) => course.status !== "P");
          return count + failedCourses.length;
        }, 0);
        setBacklogs(failedCoursesCount);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again.");
        setIsSubmitted(false);
        setOverallCGPA("N/A");
        setBacklogs(0);
      }
    } else {
      alert("Please enter a valid University ID.");
    }
  }

  const handleSendReport = () => {
    const formattedNumber = whatsappNumber.replace(/\D/g, ''); // Remove non-numeric characters

    if (!formattedNumber || formattedNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Create the WhatsApp message with student details
    const message = `*Student Academic Report*%0a%0a` +
      `*Student Name:* ${studentDetails?.name || "N/A"}%0a` +
      `*ID:* ${studentDetails?.id || "N/A"}%0a` +
      `*Semester:* ${currentSemester || "N/A"}%0a` +
      `*Overall CGPA:* ${overallCGPA || "N/A"}%0a` +
      `*Backlogs:* ${backlogs || "N/A"}%0a%0a` +
      `For more details, please contact the department.`;

    // Open WhatsApp chat in a new window
    window.open(
      `https://wa.me/${formattedNumber}?text=${message}`,
      '_blank'
    );

    setWhatsappNumber(""); // Clear the input field
  };


 const getAttendanceColor = (percentage: number) => {
  if (percentage >= 85) return "bg-green-100 text-green-800 border-green-200"
  if (percentage >= 75) return "bg-orange-100 text-orange-800 border-orange-200"
  return "bg-red-100 text-red-800 border-red-200"
}


  const getCGPAColor = (cgpa: string) => {
    const score = Number.parseFloat(cgpa)
    if (score >= 9.0) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 8.0) return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

// Add this component before the return statement
const WhatsAppModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h3 className="text-lg font-semibold mb-4">Send Report via WhatsApp</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="whatsapp-number" className="text-sm font-medium text-gray-700">
            Mobile Number
          </Label>
          <Input
            id="whatsapp-number"
            placeholder="Enter mobile number (e.g., 91XXXXXXXXXX)"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsWhatsAppModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendReport}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Update the LoginModal component
const LoginModal = () => {
  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-red-900 mb-4 text-center">Login</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="login-id" className="text-sm font-medium text-gray-700">
              Username (ID)
            </Label>
            <Input
              id="login-id"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="mt-1 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
              placeholder="Enter your ID"
            />
          </div>
          <div>
            <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="mt-1 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              onClick={() => {
                setIsLoginModalOpen(false);
                setLoginId("");
                setLoginPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              className="px-4 py-2 bg-red-900 text-white rounded hover:bg-red-800 transition"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginId,
          loginPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsLoggedIn(true);
        setIsLoginModalOpen(false);
        setLoggedInUser(loginId); // Store the logged-in username
        setLoginId("");
        setLoginPassword("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  // Update the handleLogout function
const handleLogout = () => {
  setIsLoggedIn(false);
  setLoggedInUser("");
  setIsDropdownOpen(false);
};

  return (
    <>

      {/* Print-only view */}
      <div className="hidden print:block">
        <div style={{ padding: '15px', fontSize: '9pt', maxHeight: '100vh' }}>
          <div style={{ marginBottom: '15px' }}>
  {/* Header with Logo and Institution Details */}
  <div style={{ 
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px'
  }}>
    <div style={{ 
      width: '80px',
      height: '80px',
      flexShrink: 0
    }}>
      <Image 
        src="/logo.jpg" 
        alt="KL University Logo"
        width={80}
        height={80}
        style={{ objectFit: 'contain' }}
      />
    </div>

    <div style={{
      flex: 1,
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '14pt', 
        fontWeight: 'bold', 
        marginBottom: '5px' 
      }}>
        Koneru Lakshmaiah Education Foundation
      </h1>
      <p style={{ 
        fontSize: '9pt', 
        marginBottom: '2px' 
      }}>
        Department of CSE-4
      </p>
      <p style={{ fontSize: '9pt' }}>
        Student Academic Report - ID: {displayedId}
      </p>
    </div>
  </div>

  {/* HOD Details and Student Address row */}
  <div style={{ 
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    marginTop: '10px'
  }}>
    {/* CSE-4 HOD Details on left */}
    <div style={{ 
      width: '250px',
      fontSize: '8pt',
      border: '1px solid #000',
      padding: '8px',
      borderRadius: '4px'
    }}>
      <p style={{ 
        fontWeight: 'bold', 
        marginBottom: '4px',
        borderBottom: '1px solid #000',
        paddingBottom: '4px'
      }}>From:</p>
      <div style={{ lineHeight: '1.4' }}>
        <p>Name: Dr.T Pavan Kumar</p>
        <p>Designation : HOD-CSE4</p>
      </div>
    </div>

    {/* Empty space in middle */}
    <div style={{ flex: 1, minWidth: '40px' }}></div>

    {/* Student Address on right */}
    <div style={{ 
      width: '250px',
      fontSize: '8pt',
      border: '1px solid #000',
      padding: '8px',
      borderRadius: '4px'
    }}>
      <p style={{ 
        fontWeight: 'bold', 
        marginBottom: '4px',
        borderBottom: '1px solid #000',
        paddingBottom: '4px'
      }}>To Address:</p>
      <div style={{ 
        whiteSpace: 'pre-wrap',
        lineHeight: '1.5',
        fontWeight: '500',
        fontSize: '8.5pt',
        wordBreak: 'break-word'
      }}>
        {studentDetails?.address || 'Address not available'}
      </div>
    </div>
  </div>
</div>

          <div style={{ marginBottom: '15px' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '5px' }}>
              Attendance Report - Semester {currentSemester}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid black' }}>
                  <th style={{ textAlign: 'left', padding: '2px' }}>Course Code</th>
                  <th style={{ textAlign: 'left', padding: '2px' }}>Course Name</th>
                  <th style={{ textAlign: 'right', padding: '2px' }}>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((course, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '4px' }}>{course.courseCode}</td>
                    <td style={{ padding: '4px' }}>{course.name}</td>
                    <td style={{ padding: '4px', textAlign: 'right' }}>{course.attendance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px solid #000' }}>
  <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '3px' }}>Academic Performance</h2>
  {/* Remove the p tag and use div instead */}
  <div style={{ marginBottom: '8px', fontSize: '9pt', display: 'flex', gap: '2rem' }}>
    <span>Overall CGPA: {overallCGPA}</span>
    <span>Backlogs: {backlogs}</span>
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
    {semesterResults.slice(0, visibleSemesters).map((semester, semIndex) => (
      <div key={semIndex} style={{ border: '2px solid #000', padding: '8px', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', borderBottom: '1.5px solid #000', paddingBottom: '4px' }}>
          <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>{semester.semester}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '8pt' }}>
          {semester.courses.map((course, courseIndex) => (
            <div key={courseIndex} style={{ border: '1px solid #666', padding: '3px', textAlign: 'center', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '7.5pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '1px' }}>
                {course.courseCode}
              </div>
              <div style={{ fontWeight: 'bold', color: course.status === 'F' ? '#dc2626' : '#166534', fontSize: '7.5pt' }}>
                {course.grade} [{course.status}]
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>

          <div style={{ marginBottom: '15px', marginTop: '20px' }}>
            <h2 style={{ 
              fontSize: '11pt', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              borderBottom: '1px solid #000',
              paddingBottom: '5px'
            }}>
             Counsellor Details
            </h2>
            
            {/* Update the Student & Counseller Details section */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  fontSize: '8pt',
  marginTop: '10px'
}}>
  {/* Counseller Details only */}
  <div style={{ 
    textAlign: 'left',
    width: '100%'  // Changed from 45% to 100%
  }}>
    
    <div style={{ 
      lineHeight: '1.4',
      fontSize: '8pt'
    }}>
      <p>Name: {studentDetails?.counsellorName}</p>
      <p>Designation: {studentDetails?.counsellorDesignation}</p>
      <p>Contact Number: {studentDetails?.counsellorContact}</p>
    </div>
  </div>
</div>
          </div>

          {/* Add this section at the end of the print-only view */}
<div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #000' }}>
  <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '10px' }}>Message</h2>
  <div style={{ fontSize: '9pt', lineHeight: '1.5', marginBottom: '10px' }}>
    <p><strong>Subject:</strong> Attendance and Academic Performance Update</p>
    <p>Dear Parents,</p>
    <p>
      We are sharing the current semester attendance (as of 31-08-2025) and the semester-wise academic performance 
      (CGPA and backlog details) of your ward.
    </p>
    <p>
      As per University norms, 85% attendance is mandatory. Attendance between 75%–84% requires valid proof for condonation. 
      If your ward has less than 85% attendance, kindly meet the Head of the Department along with your ward immediately.
    </p>
  </div>
  <div style={{ fontSize: '9pt', lineHeight: '1.5' }}>
    <p><strong>Subject:</strong> హాజరు మరియు Academic Performance సమాచారం</p>
    <p>గౌరవనీయులైన తల్లిదండ్రులకు,</p>
    <p>
      మీ కుమారుడు/కుమార్తె యొక్క ప్రస్తుతం కొనసాగుతున్న సెమిస్టర్ హాజరు (తేదీ 31-08-2025 వరకు ) మరియు సెమిస్టర్ వారీగా Academic Performance 
      (CGPA మరియు బ్యాక్‌లాగ్ వివరాలు) ను మీతో పంచుకుంటున్నాము.
    </p>
    <p>
      విశ్వవిద్యాలయ నిబంధనల ప్రకారం:
      <br />• 85% హాజరు తప్పనిసరి.
      <br />• 75%–84% మధ్య హాజరు ఉన్నవారు, అనారోగ్యం లేదా అత్యవసర కారణాలకు సంబంధించిన సరైన రుజువులు సమర్పించాలి.
    </p>
    <p>
      అందువల్ల, మీ కుమారుడు/కుమార్తె 85% కంటే తక్కువ హాజరు కలిగి ఉంటే, దయచేసి మీ కుమారుడు/కుమార్తెతో కలిసి విభాగాధిపతిని వెంటనే కలవండి.
    </p>
  </div>
</div>
        </div>
      </div>

      {/* Original view for screen */}
      <div className="min-h-screen bg-gray-50 print:hidden">
      <header className="bg-red-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 relative flex items-center justify-center bg-red-900 rounded-[25%] overflow-hidden">
                <Image 
                  src="/logo.jpg" 
                  alt="KL University Logo"
                  width={80}    // Increased from 64
                  height={80}   // Increased from 64
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">KL CSE-4</h2>
                <p className="text-red-100 text-sm">Student Portal</p>
              </div>
            </div>
            <div className="flex-1 flex justify-center text-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Koneru Lakshmaiah Education Foundation</h1>
                <p className="text-red-100 text-sm">Department of CSE-4</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                            <div className="text-right">
  <p className="text-white font-semibold">{studentName || 'Student Name'}</p>
  <p className="text-red-100 text-sm">ID: {displayedId}</p>
</div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {/* Add Login Button */}
              {isLoggedIn ? (
  <div className="relative">
    <Button
      variant="outline"
      className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition flex items-center space-x-2"
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    >
      <span>{loggedInUser}</span>
      <svg
        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </Button>
    
    {isDropdownOpen && (
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        <div className="py-1" role="menu" aria-orientation="vertical">
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleLogout}
            role="menuitem"
          >
            <div className="flex items-center space-x-2">
              <svg 
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>
    )}
  </div>
) : (
  <Button
    variant="outline"
    className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition"
    onClick={() => setIsLoginModalOpen(true)}
  >
    Login
  </Button>
)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center space-x-3 text-gray-800">
                <Search className="w-5 h-5 text-red-700" />
                <span>Student Academic Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="university-id" className="text-sm font-medium text-gray-700 mb-2 block">
                    University ID
                  </Label>
                  <Input
                    id="university-id"
                    placeholder="Enter University ID (e.g., 2025001234)"
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit();
                      }
                    }}
                    className="h-12 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  {error && (
                      <p className="mt-2 text-sm text-red-600">
                       {error}
                        </p>
                  )}
                </div>
                <Button 
                  onClick={handleSubmit}
                  className="h-12 px-8 bg-red-900 hover:bg-red-800 text-white"
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>

          {isSubmitted && (
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3 text-gray-800">
                    <Calendar className="w-5 h-5 text-red-700" />
                    <span>AY: 2025-26 {currentSemester % 2 === 1 ? 'ODD' : 'EVEN'} Semester Attendance</span>
                  </CardTitle>
                  <Badge variant="outline" className="border-red-200 text-red-800">
                    Semester {currentSemester}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mt-2">Minimum 85% attendance required for exam eligibility</p>
              </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attendanceData.map((course, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-900">{course.courseCode}</p>
                          <p className="text-sm text-gray-600">{course.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-1">
                            <Badge className={`${getAttendanceColor(course.attendance)} font-semibold`}>
                              {course.attendance}%
                            </Badge>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                course.attendance >= 85
                                  ? "bg-green-500"
                                  : course.attendance >= 75
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${course.attendance}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {isSubmitted && (
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3 text-gray-800">
                    <Award className="w-5 h-5 text-red-700" />
                    <span>Academic Performance</span>
                  </CardTitle>
                  <div>
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                      <span className="text-sm font-semibold">Overall CGPA: {overallCGPA}</span>
                    </div>
                  </div>
                  <div>
                    <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg border border-red-200 mt-2">
                      <span className="text-sm font-semibold">Backlogs: {backlogs}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">CGPA Scale: 10.0 | [P] = Pass, [F] = Fail</p>
              </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {semesterResults
                  .slice(0, visibleSemesters) // Only show the required number of semesters
                  .map((semester, semIndex) => (
                    <div key={semIndex} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">{semester.semester}</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {semester.courses.map((course, courseIndex) => (
                          <div key={courseIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="text-center">
                              {/* Display course code */}
                              <p className="text-sm font-medium text-gray-700 mb-1">{course.courseCode}</p>
                              {/* Display grade and status with colors */}
                              <p
                                className={`text-xs font-bold ${
                                  course.status === "P" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {course.grade} [{course.status}]
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          )}

          {isSubmitted && (
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center space-x-3 text-gray-800">
                  <MapPin className="w-5 h-5 text-red-700" />
                  <span>Student & Counsellor Information</span>
                </CardTitle>
              </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Student Details Section */}
                <div>
                  <CardTitle className="flex items-center space-x-3 text-gray-800 mb-4">
                    <User className="w-5 h-5 text-red-700" />
                    <span>Student Details</span>
                  </CardTitle>
                  <div className="flex items-center space-x-6 mb-6">
                    <div>
                      <Label className="text-xs text-gray-500">ID</Label>
                      <p className="text-sm font-medium">{studentDetails?.id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Name</Label>
                      <p className="text-sm font-medium">{studentDetails?.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Gender</Label>
                      <p className="text-sm font-medium">{studentDetails?.gender}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Category</Label>
                      <p className="text-sm font-medium">{studentDetails?.category}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Contact</Label>
                      <p className="text-sm font-medium">{studentDetails?.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="border-t pt-6">
                  <CardTitle className="flex items-center space-x-3 text-gray-800 mb-4">
                    <MapPin className="w-5 h-5 text-red-700" />
                    <span>Student Address</span>
                  </CardTitle>
                  <div>
                    <p className="text-sm font-medium mt-1 whitespace-pre-line">
                      {studentDetails?.address}
                    </p>
                  </div>
                </div>

                {/* Counseller Details Section */}
                <div className="border-t pt-6">
                  <CardTitle className="flex items-center space-x-3 text-gray-800 mb-4">
                    <GraduationCap className="w-5 h-5 text-red-700" />
                    <span>Counsellor Details</span>
                  </CardTitle>
                  <div className="flex items-center space-x-6">
                    <div>
                      <Label className="text-xs text-gray-500">Name</Label>
                      <p className="text-sm font-medium">{studentDetails?.counsellorName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Designation</Label>
                      <p className="text-sm font-medium">{studentDetails?.counsellorDesignation}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Contact Number</Label>
                      <p className="text-sm font-medium">{studentDetails?.counsellorContact || 'Not Available'}</p>
                    </div>
                  </div>
                </div>

                {/* Print Button and HOD Signature Section */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
  <div className="flex items-center space-x-4">
    <Button
      variant="outline"
      className="flex items-center space-x-2 border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
      onClick={() => {
        window.print();
      }}
    >
      <Printer className="w-4 h-4" />
      <span>Print Report</span>
    </Button>

    <Button
      variant="outline"
      className="flex items-center space-x-2 border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
      onClick={() => setIsWhatsAppModalOpen(true)} // Opens the modal
    >
      <svg 
        className="w-4 h-4"
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span>Send Report</span>
    </Button>
  </div>

  <div className="text-right">
    <Label className="text-sm font-medium text-gray-700 mb-2 block">HOD Signature</Label>
    <div className="w-40 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden">
      <Image 
        src="/Signature.jpg"
        alt="HOD Signature"
        layout="fill"
        objectFit="contain"
      />
    </div>
  </div>
</div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </main>
      {isWhatsAppModalOpen && <WhatsAppModal />}
      <LoginModal />
    </div>
    </>
  )
}