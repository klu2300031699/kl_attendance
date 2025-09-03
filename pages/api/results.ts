import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import path from "path";

type CourseResult = {
  name: string;
  courseCode: string; // Add courseCode here
  grade: string;
  status: string;
};

type SemesterResult = {
  semester: string;
  courses: CourseResult[];
  cgpa: string; // placeholder for now
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SemesterResult[]>
) {
  if (req.method !== "GET") {
    return res.status(405).json([]);
  }

  const { studentId } = req.query;

  if (!studentId || typeof studentId !== "string") {
    return res.status(400).json([]);
  }

  try {
    // 📌 Read the Results CSV
    const csvFilePath = path.join(process.cwd(), "components", "Y4-Result.csv");
    const fileContent = readFileSync(csvFilePath, "utf-8");

    // 📌 Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // 📌 Group results by semester
    const semesterResults: SemesterResult[] = [];

    records
      .filter((record: any) => record.ID === studentId) // filter by student
      .forEach((record: any) => {
        const semesterKey = `Semester ${record.SEMESTER}`;

        let semesterObj = semesterResults.find(
          (s) => s.semester === semesterKey
        );

        if (!semesterObj) {
          semesterObj = {
            semester: semesterKey,
            courses: [],
            cgpa: "N/A", // placeholder
          };
          semesterResults.push(semesterObj);
        }

        // Add courseCode to the pushed object
        semesterObj.courses.push({
          name: record.CD, // Course Description
          courseCode: record.CC, // Add this
          grade: record.GRADE,
          status: record.STATUS,
        });
      });

    // 📌 Sort semesters in order (Semester 1 → Semester N)
    semesterResults.sort((a, b) => {
      const numA = parseInt(a.semester.split(" ")[1]);
      const numB = parseInt(b.semester.split(" ")[1]);
      return numA - numB;
    });

    return res.status(200).json(semesterResults);
  } catch (error) {
    console.error("Error processing results:", error);
    return res.status(500).json([]);
  }
}
