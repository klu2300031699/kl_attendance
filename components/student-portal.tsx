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

export default function StudentPortal() {
  const [universityId, setUniversityId] = useState("")
  const [displayedId, setDisplayedId] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  // Add this state
  const [studentName, setStudentName] = useState<string>("")
  const [currentSemester, setCurrentSemester] = useState<number>(1);

  const handleSubmit = async () => {
    if (universityId.trim().length > 0) {
      try {
        setError(null) // Clear any previous errors
        
        // Set the semester based on ID
        setCurrentSemester(getSemesterFromId(universityId))
        
        // Read the student names CSV file
        const response = await fetch(`/api/student?studentId=${universityId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError(`ID ${universityId} not found in records`)
            setIsSubmitted(false)
            setAttendanceData([])
            setDisplayedId("")
            setStudentName("")
            return
          }
          throw new Error(`Failed to fetch data. Please try again.`)
        }

        const studentData = await response.json()
        
        // Set the student name if found
        if (studentData.name) {
          setStudentName(studentData.name)
        }

        // Fetch attendance data
        const attendanceResponse = await fetch(`/api/attendance?studentId=${universityId}`)
        if (!attendanceResponse.ok) {
          throw new Error(`Failed to fetch attendance data`)
        }
        const attendanceData = await attendanceResponse.json()
        
        if (attendanceData.length === 0) {
          setError('No attendance records found for this ID')
          setIsSubmitted(false)
          return
        }
        
        setAttendanceData(attendanceData)
        setDisplayedId(universityId)
        setIsSubmitted(true)

      } catch (error) {
        console.error("Error fetching data:", error)
        setError('Failed to fetch data. Please try again.')
        setIsSubmitted(false)
      }
    }
  }

  const semesterResults = [
    {
      semester: "Semester 1",
      courses: [
        { name: "Programming in C", grade: "A", status: "P" },
        { name: "Digital Logic Design", grade: "A+", status: "P" },
        { name: "Mathematics - I", grade: "B+", status: "P" },
        { name: "Physics", grade: "A", status: "P" },
        { name: "English Communication", grade: "A+", status: "P" },
        { name: "Environmental Science", grade: "A", status: "P" },
      ],
      cgpa: "8.5",
    },
    {
      semester: "Semester 2",
      courses: [
        { name: "Data Structures", grade: "A+", status: "P" },
        { name: "Computer Organization", grade: "A", status: "P" },
        { name: "Mathematics - II", grade: "A", status: "P" },
        { name: "Web Technologies", grade: "A+", status: "P" },
        { name: "Professional Ethics", grade: "A", status: "P" },
        { name: "Object Oriented Programming", grade: "B+", status: "P" },
      ],
      cgpa: "8.8",
    },
    {
      semester: "Semester 3",
      courses: [
        { name: "Database Management", grade: "A+", status: "P" },
        { name: "Operating Systems", grade: "A+", status: "P" },
        { name: "Computer Networks", grade: "F", status: "F" },
        { name: "Software Engineering", grade: "A+", status: "P" },
        { name: "Discrete Mathematics", grade: "A", status: "P" },
        { name: "Python Programming", grade: "A", status: "P" },
      ],
      cgpa: "9.1",
    },
    {
      semester: "Semester 4",
      courses: [
        { name: "Artificial Intelligence", grade: "A", status: "P" },
        { name: "Machine Learning", grade: "A+", status: "P" },
        { name: "Cloud Computing", grade: "A", status: "P" },
        { name: "Cyber Security", grade: "B+", status: "P" },
        { name: "Big Data Analytics", grade: "A+", status: "P" },
        { name: "Mobile App Development", grade: "A", status: "P" },
      ],
      cgpa: "8.9",
    },
    {
      semester: "Semester 5",
      courses: [
        { name: "Deep Learning", grade: "A+", status: "P" },
        { name: "Internet of Things", grade: "A+", status: "P" },
        { name: "Blockchain Technology", grade: "A", status: "P" },
        { name: "Natural Language Processing", grade: "A+", status: "P" },
        { name: "DevOps Engineering", grade: "A", status: "P" },
        { name: "Cloud Security", grade: "A", status: "P" },
      ],
      cgpa: "9.2",
    },
    {
      semester: "Semester 6",
      courses: [
        { name: "Database Management", grade: "A+", status: "P" },
        { name: "Operating Systems", grade: "A+", status: "P" },
        { name: "Computer Networks", grade: "F", status: "F" },
        { name: "Software Engineering", grade: "A+", status: "P" },
        { name: "Discrete Mathematics", grade: "A", status: "P" },
        { name: "Python Programming", grade: "A", status: "P" },
      ],
      cgpa: "9.1",
    },
  ]

  const address = `House No. 123, Sector 15
Rajiv Gandhi Nagar, Vijayawada
Andhra Pradesh - 520010
India`

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

  const overallCGPA = "8.9"

  return (
    <>
      {/* Print-only view */}
      <div className="hidden print:block">
        <div style={{ padding: '15px', fontSize: '9pt', maxHeight: '100vh' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '5px' }}>Koneru Lakshmaiah University</h1>
            <p style={{ fontSize: '9pt', marginBottom: '2px' }}>Department of CSE-4</p>
            <p style={{ fontSize: '9pt' }}>Student Academic Report - ID: {displayedId}</p>
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

          <div style={{ marginBottom: '15px' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '3px' }}>Academic Performance</h2>
            <p style={{ marginBottom: '8px', fontSize: '9pt' }}>Overall CGPA: {overallCGPA}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {semesterResults.map((semester, semIndex) => (
                <div key={semIndex} style={{ border: '1px solid #eee', padding: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>
                    <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>{semester.semester}</span>
                    <span style={{ fontSize: '8pt' }}>CGPA: {semester.cgpa}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', fontSize: '7.5pt' }}>
                    {semester.courses.map((course, courseIndex) => (
                      <div key={courseIndex} style={{ border: '1px solid #eee', padding: '2px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '1px' }}>
                          {course.name}
                        </div>
                        <div style={{ 
                          fontWeight: 'bold',
                          color: course.status === 'F' ? '#dc2626' : '#166534',
                          fontSize: '7.5pt'
                        }}>
                          {course.grade} [{course.status}]
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '8pt',
            marginTop: '5px',
            paddingTop: '5px',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ 
              display: 'inline-block',
              marginRight: '20px',
              maxWidth: '60%'
            }}>
              <p style={{ 
                fontWeight: 'bold', 
                marginBottom: '2px',
                fontSize: '8pt'
              }}>Student Address:</p>
              <p style={{ 
                lineHeight: '1.1',
                fontSize: '8pt',
                margin: 0
              }}>{address.split('\n').map((line, i) => (
                <span key={i} style={{ display: 'block' }}>{line}</span>
              ))}</p>
            </div>
            <div style={{ 
              textAlign: 'center',
              marginLeft: 'auto',
              width: '120px'
            }}>
              <p style={{ 
                marginBottom: '10px',
                fontSize: '8pt'
              }}>HOD Signature</p>
              <div style={{ 
                borderBottom: '1px solid #000',
                width: '100%'
              }}></div>
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
              <div className="w-16 h-16 relative flex items-center justify-center bg-red-900 rounded-[25%] overflow-hidden">
                <Image 
                  src="/logo.jpg" 
                  alt="KL University Logo"
                  width={64}
                  height={64}
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
                  disabled={!universityId} 
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
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                    <span className="text-sm font-semibold">Overall CGPA: {overallCGPA}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">CGPA Scale: 10.0 | [P] = Pass, [F] = Fail</p>
              </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {semesterResults.map((semester, semIndex) => (
                  <div key={semIndex} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">{semester.semester}</h3>
                      <Badge className={`${getCGPAColor(semester.cgpa)} font-semibold`}>CGPA: {semester.cgpa}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {semester.courses.map((course, courseIndex) => (
                        <div key={courseIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 mb-1 truncate" title={course.name}>{course.name}</p>
                            <p className="text-lg font-semibold text-gray-900 mb-2">{course.grade}</p>
                            <Badge
                              className={`text-xs font-bold ${
                                course.status === "P"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }`}
                            >
                              [{course.status}]
                            </Badge>
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
                  <span>Student Information</span>
                </CardTitle>
              </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
                    Permanent Address
                  </Label>
                  <div
                    className="min-h-[120px] border border-gray-300 rounded-md p-2 resize-none focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                    tabIndex={0}
                  >
                    {address}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
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

                  <div className="text-right">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">HOD Signature</Label>
                    <div className="w-40 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <span className="text-xs text-gray-500">Digitally Signed</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </main>
    </div>
    </>
  )
}