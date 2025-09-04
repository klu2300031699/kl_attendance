import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import path from "path";

type CGPAResponse = {
  cgpa: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CGPAResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ cgpa: "0" });
  }

  const { studentId } = req.query;

  if (!studentId || typeof studentId !== "string") {
    return res.status(400).json({ cgpa: "0" });
  }

  try {
    const csvFilePath = path.join(process.cwd(), "components", "CSE-CGPA.csv");
    const fileContent = readFileSync(csvFilePath, "utf-8");

    interface StudentRecord {
      "Student ID": string;
      CGPA: string;
      [key: string]: string;
    }

    const records: StudentRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Find the student record by matching the Student ID column
    const studentRecord = records.find(
      (record) => record["Student ID"].toString() === studentId
    );

    if (!studentRecord) {
      console.log(`No CGPA found for student ID: ${studentId}`);
      return res.status(404).json({ cgpa: "N/A" });
    }

    console.log(`Found CGPA for student ${studentId}: ${studentRecord.CGPA}`);
    return res.status(200).json({ cgpa: studentRecord.CGPA });
  } catch (error) {
    console.error("Error fetching CGPA:", error);
    return res.status(500).json({ cgpa: "Error" });
  }
}