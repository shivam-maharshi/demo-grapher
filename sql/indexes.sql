CREATE INDEX "year_in" on "Student_residency"("Year");
CREATE INDEX "nation_code_in" on "Student_residency"("Nation_code");
CREATE INDEX "college_code_in" on "Student_residency"("College_code");
CREATE INDEX "gender_code_in" on "Student_residency"("Gender_code");
CREATE INDEX "ethnicity_code_in" on "Student_residency"("Ethnicity_code");
/* Composite indexes */
CREATE INDEX "year_nation_code_in" on "Student_residency"("Year", "Nation_code");
CREATE INDEX "year_college_code_in" on "Student_residency"("Year", "College_code");
CREATE INDEX "year_gender_code_in" on "Student_residency"("Year", "Gender_code");
CREATE INDEX "year_ethnicity_code_in" on "Student_residency"("Year", "Ethnicity_code");
CREATE INDEX "year_college_gender_code_in" on "Student_residency"("Year", "College_code", "Gender_code");
CREATE INDEX "year_gender_ethnicity_code_in" on "Student_residency"("Year", "Gender_code", "Ethnicity_code");
CREATE INDEX "year_college_ethnicity_code_in" on "Student_residency"("Year", "College_code", "Ethnicity_code");
CREATE INDEX "year_college_gender_ethnicity_code_in" on "Student_residency"("Year", "College_code", "Gender_code", "Ethnicity_code");
/*Indexes without years*/
CREATE INDEX "college_gender_code_in" on "Student_residency"("College_code", "Gender_code");
CREATE INDEX "gender_ethnicity_code_in" on "Student_residency"("Gender_code", "Ethnicity_code");
CREATE INDEX "college_ethnicity_code_in" on "Student_residency"("College_code", "Ethnicity_code");
CREATE INDEX "college_gender_ethnicity_code_in" on "Student_residency"("College_code", "Gender_code", "Ethnicity_code");