import type { NextApiRequest, NextApiResponse } from 'next'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import path from 'path'

type AttendanceRecord = {
  studentId: string
  courseCode: string
  attendance: number
  name: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttendanceRecord[]>
) {
  if (req.method !== 'GET') {
    return res.status(405).json([])
  }

  const { studentId } = req.query

  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json([])
  }

  try {
    const csvFilePath = path.join(process.cwd(), 'components', 'Y24-Attendance.csv')
    const fileContent = readFileSync(csvFilePath, 'utf-8')
    
    // Clean up the CSV content by removing extra commas
    const cleanContent = fileContent
      .split('\n')
      .map(line => line.split(',').slice(0, 3).join(','))
      .join('\n')

    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    const studentRecords = records
      .filter((record: any) => record.student_uni_id === studentId)
      .map((record: any) => ({
        studentId: record.student_uni_id,
        courseCode: record.coursecode,
        attendance: parseInt(record.attendance),
        name: getCourseNameFromCode(record.coursecode)
      }))

    return res.status(200).json(studentRecords)

  } catch (error) {
    console.error('Error processing attendance:', error)
    return res.status(500).json([])
  }
}

function getCourseNameFromCode(code: string): string {
  const courseMap: Record<string, string> = {
        '24AD2001': 'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING',
    '24AD2103': 'DATABASE MANAGEMENT SYSTEMS',
    '24CS2101': 'OPERATING SYSTEMS',
    '24MT2012': 'MATHEMATICAL OPTIMIZATION',
    '24SC2006': 'OBJECT ORIENTED PROGRAMMING',
    '24SDCS01': 'FRONT END DEVELOPMENT FRAMEWORKS',
    '24UC0022': 'SOCIAL IMMERSIVE LEARNING',
    'OEEE0013': 'RENEWABLE ENERGY RESOURCES',
    '24CS2202': 'COMPUTER NETWORKS',
    '24EC2106': 'PROCESSORS AND CONTROLLERS',
    '24MT2019': 'PROBABILITY AND STATISTICS',
    '23UC0008': 'INDIAN CONSTITUTION',
    '23LE1001': 'COMPUTATIONAL THINKING FOR STRUCTURED DESIGN',
    '23LE1003': 'LINEAR ALGEBRA AND CALCULUS FOR ENGINEERS',
    '24AD2001L': 'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING',
    '24AD2103L': 'DATABASE MANAGEMENT SYSTEMS',
    '24CS2202L': 'COMPUTER NETWORKS',
    '24LE1002': 'COMMUNICATION SKILLS FOR ENGINEERS',
    '24MT2019L': 'PROBABILITY AND STATISTICS',
    '24SC2006L': 'OBJECT ORIENTED PROGRAMMING',
    '24SDCS01L': 'FRONT END DEVELOPMENT FRAMEWORKS',
    '23UC0009': 'ECOLOGY AND ENVIRONMENT',
    '23FL3058': 'JAPANESE LANGUAGE',
    '24AD01HF': 'DATA ANALYTICS AND VISUALIZATION',
    '24CS2203': 'DESIGN AND ANALYSIS OF ALGORITHMS',
    'OEPY0001': 'ADVANCED ORGANIC CHEMISTRY',
    'OEAR0001': 'ARCHITECTURE JOURNALISM',
    '24MB4055': 'ORGANIZATION MANAGEMENT',
    'OECE0001': 'ENVIRONMENTAL POLLUTION CONTROL METHODS',
    'OECE0003': 'SOLID AND HAZARDOUS WASTE MANAGEMENT',
    '23FL3055': 'GERMAN LANGUAGE'
  }
  return courseMap[code] || code
}