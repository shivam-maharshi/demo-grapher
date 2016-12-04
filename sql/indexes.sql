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
CREATE INDEX "year_graduate_in" on "Student_residency"("Year", "Graduate");
CREATE INDEX "year_masters_in" on "Student_residency"("Year", "Masters");
CREATE INDEX "year_entering_masters_in" on "Student_residency"("Year", "Entering_masters");
CREATE INDEX "year_doctoral_in" on "Student_residency"("Year", "Doctoral");
CREATE INDEX "year_entering_doctoral_in" on "Student_residency"("Year", "Entering_doctoral");
CREATE INDEX "year_dvm_in" on "Student_residency"("Year", "DVM");
CREATE INDEX "year_entering_dvm_in" on "Student_residency"("Year", "Entering_DVM");
CREATE INDEX "year_undergraduate_in" on "Student_residency"("Year", "Undergraduate");
CREATE INDEX "year_entering_freshman_in" on "Student_residency"("Year", "Entering_freshman");

/*Indexes without years*/
CREATE INDEX "college_gender_code_in" on "Student_residency"("College_code", "Gender_code");
CREATE INDEX "gender_ethnicity_code_in" on "Student_residency"("Gender_code", "Ethnicity_code");
CREATE INDEX "college_ethnicity_code_in" on "Student_residency"("College_code", "Ethnicity_code");
CREATE INDEX "college_gender_ethnicity_code_in" on "Student_residency"("College_code", "Gender_code", "Ethnicity_code");