-- Table: public."Department"

-- DROP TABLE public."Department";

CREATE TABLE public."Department"
(
    "College_code" character varying(2) COLLATE pg_catalog."default",
    "College" character varying(35) COLLATE pg_catalog."default",
    "Department_code" character varying(4) COLLATE pg_catalog."default" NOT NULL,
    "Department" character varying(50) COLLATE pg_catalog."default",
    CONSTRAINT "Department_pkey" PRIMARY KEY ("Department_code")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Department"
    OWNER to postgres;

INSERT INTO public."Department" SELECT DISTINCT ON("Department_code") "College_code", "College", "Department_code", "Department" FROM "Student_residency";