import type { NextApiRequest, NextApiResponse } from 'next'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import path from 'path'

type StudentResponse = {
  name: string;
  id: string;
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
    const csvFilePath = path.join(process.cwd(), 'components', 'Y24-Students name.csv')
    const fileContent = readFileSync(csvFilePath, 'utf-8')
    
    type StudentRecord = {
      Name: string;
      'University ID': string;
      [key: string]: string;
    };

    const records: StudentRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const student = records.find((record) => record['University ID'] === studentId)

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    return res.status(200).json({
      name: student.Name,
      id: student['University ID']
    })

  } catch (error) {
    console.error('Error processing student data:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}