import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'papaparse';
import { readFileSync } from 'fs';
import path from 'path';

interface LoginRecord {
  ID: string;
  Password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { loginId, loginPassword } = req.body;

  if (!loginId || !loginPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID and Password are required' 
    });
  }

  try {
    const csvFilePath = path.join(process.cwd(), 'components', 'login.csv');
    const fileContent = readFileSync(csvFilePath, 'utf-8');
    
    const parseResult = parse<LoginRecord>(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    const records = parseResult.data;
    const user = records.find(record => 
      record.ID === loginId && record.Password === loginPassword
    );

    if (user) {
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}