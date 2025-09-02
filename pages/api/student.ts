import type { NextApiRequest, NextApiResponse } from 'next'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import path from 'path'

type StudentResponse = {
  name: string;
  id: string;
  gender: string;
  category: string;
  contact: string;
  address: string;
  counsellorName: string;
  counsellorDesignation: string;
  counsellorContact: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { studentId } = req.query

  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json({ error: 'Student ID is required' })
  }

  try {
    const csvFilePath = path.join(process.cwd(), 'components', 'Y24-EntireData.csv')
    const fileContent = readFileSync(csvFilePath, 'utf-8')
    
    // Update the type definition to match exact CSV column names
    type CsvStudentRecord = {
      'Student Unique Enrolment ID': string;
      'Name of the student': string;
      'Gender': string;
      'DayScholar/Hostler': string;
      'Contact No': string;
      'Postel Address': string;
      'Name of the Mentor': string;
      'Designation': string;
      'Mentor Contact No': string;  // This matches the exact column name in CSV
    };

    const records: CsvStudentRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const student = records.find((record) => 
      record['Student Unique Enrolment ID'].trim() === studentId.trim()
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Add this before returning the response
    console.log('Counsellor Details:', {
      name: student['Name of the Mentor'],
      designation: student['Designation'],
      contact: student['Mentor Contact No']
    });

    // Update the mapping in the API response
    return res.status(200).json({
      id: student['Student Unique Enrolment ID'],
      name: student['Name of the student'],
      gender: student['Gender'],
      category: student['DayScholar/Hostler'],
      contact: student['Contact No'],
      address: student['Postel Address'],
      counsellorName: student['Name of the Mentor'],
      counsellorDesignation: student['Designation'],
      counsellorContact: student['Mentor Contact No']  // Use the correct column name
    })

  } catch (error) {
    console.error('Error processing student data:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}