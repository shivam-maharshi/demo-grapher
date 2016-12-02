CREATE INDEX "year_in" on "Student_residency"("Year");
CREATE INDEX "nation_code_in" on "Student_residency"("Nation_code");
CREATE INDEX "college_code_in" on "Student_residency"("College_code");
CREATE INDEX "gender_code_in" on "Student_residency"("Gender_code");
CREATE INDEX "ethnicity_code_in" on "Student_residency"("Ethnicity_code");
/* Composite indexes */
CREATE INDEX "college_gender_code_in" on "Student_residency"("College_code", "Gender_code");
CREATE INDEX "gender_ethnicity_code_in" on "Student_residency"("Gender_code", "Ethnicity_code");
CREATE INDEX "college_ethnicity_code_in" on "Student_residency"("College_code", "Ethnicity_code");
CREATE INDEX "college_gender_ethnicity_code_in" on "Student_residency"("College_code", "Gender_code", "Ethnicity_code");